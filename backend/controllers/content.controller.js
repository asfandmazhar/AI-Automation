import OpenAI from "openai";
import ContentCreationModel from "../Schema/ContentCreation.js";
import AIUsageModel from "../Schema/AIUsage.js";
import ApiKeyModel from "../Schema/ApiKey.js";
import UserModel from "../Schema/User.js";
import WebsiteModel from "../Schema/Website.js";
import { createLog } from "../helper/log.helper.js";

// ─── Shared helpers ────────────────────────────────────

async function getOpenAIClient() {
  const apiKey = await ApiKeyModel.findOne({
    provider: "openai",
    status: "Active",
  });
  if (!apiKey) return null;
  return new OpenAI({ apiKey: apiKey.key });
}

async function logAIUsage(userId, websiteId, action, completion) {
  try {
    const usage = completion?.usage || {};
    await AIUsageModel.create({
      user: userId,
      website: websiteId,
      action,
      model: completion?.model || "gpt-4o-mini",
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0,
    });
  } catch (err) {
    console.error("Failed to log AI usage:", err.message);
  }
}

async function verifyWebsiteAccess(req) {
  const websiteId = req.body.websiteId || req.query.websiteId;
  if (!websiteId) return { error: "Website ID is required!" };

  const user = await UserModel.findById(req.user).populate("role", "name");
  const isAdminUser = user?.role?.name?.toLowerCase() === "admin";
  if (!isAdminUser) {
    const hasAccess = user?.websites?.some((id) => id.toString() === websiteId);
    if (!hasAccess) return { error: "Access denied!", status: 403 };
  }

  const website = await WebsiteModel.findById(websiteId);
  if (!website) return { error: "Website not found!" };

  return { website, user };
}

async function callOpenAI(openai, messages, options = {}) {
  return openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    temperature: options.temperature ?? 0.7,
    frequency_penalty: options.frequency_penalty ?? 0,
    presence_penalty: options.presence_penalty ?? 0,
    max_tokens: options.max_tokens ?? 4096,
    ...(options.top_p != null ? { top_p: options.top_p } : {}),
  });
}

function getTargetWordCount(input) {
  if (input.length === "Custom" && input.customLength)
    return input.customLength;
  const ranges = {
    "Short (300-500)": 500,
    "Medium (800-1200)": 1200,
    "Long (1500-2500)": 2500,
    "In-depth (3000+)": 3500,
  };
  return ranges[input.length] || 1200;
}

function getKeywords(input) {
  const kws = Array.isArray(input.keywords)
    ? input.keywords.filter(Boolean)
    : [];
  if (kws.length === 0 && input.topic) kws.push(input.topic);
  return kws;
}

// ─── Output validation ────────────────────────────────
// Detects actual problems: empty output, model meta text,
// duplicated paragraphs, malformed markdown, garbage output.

function validateOutput(text) {
  if (!text || text.trim().length < 50) {
    return { valid: false, reason: "Output is empty or too short" };
  }

  // Detect model/API meta text that leaked into output
  if (/^(As an AI|I'm an AI|I cannot|I don't have|Sure[,!] here)/im.test(text)) {
    return { valid: false, reason: "Output contains model meta text" };
  }

  // Detect duplicated paragraphs
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 30);
  const seen = new Set();
  for (const p of paragraphs) {
    const normalized = p.trim().toLowerCase().replace(/\s+/g, " ");
    if (seen.has(normalized)) {
      return { valid: false, reason: "Output contains duplicated paragraphs" };
    }
    seen.add(normalized);
  }

  // Detect repeated sentences (3+ identical sentences)
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];
  const sentenceCounts = {};
  for (const s of sentences) {
    const key = s.trim().toLowerCase().replace(/\s+/g, " ");
    if (key.length > 20) {
      sentenceCounts[key] = (sentenceCounts[key] || 0) + 1;
      if (sentenceCounts[key] >= 3) {
        return { valid: false, reason: "Output contains repeated sentences" };
      }
    }
  }

  return { valid: true };
}

// ─── Generation prompts ───────────────────────────────

function buildSystemPrompt(input, websiteUrl) {
  const kws = getKeywords(input);
  const primary = kws[0] || input.topic || "";
  const secondary = kws.slice(1);
  const target = getTargetWordCount(input);

  let keywordSection = "";
  if (primary) {
    keywordSection = `
KEYWORDS:
- Primary keyword: "${primary}"
- Use it naturally in the introduction, in relevant headings where it fits, and throughout the body.
- It should appear where a reader would expect to see it — not forced into every section.`;
    if (secondary.length > 0) {
      keywordSection += `
- Secondary keywords: ${secondary.map(k => `"${k}"`).join(", ")}
- Use each secondary keyword a few times where relevant. Include at least one in a heading if it fits naturally.`;
    }
  }

  let referenceSection = "";
  if (input.url || input.pastedContent) {
    referenceSection = `
REFERENCE MODE:
- Reference material was provided. Analyze it for gaps, then write something better — deeper, more specific, better structured.
- Do not copy or closely paraphrase the reference.`;
  }

  return `You are a knowledgeable writer. Write well-structured, informative content that is genuinely useful to the reader.

FORMAT:
- Markdown only. Use ## for H2 and ### for H3. No H1.
- The first ## heading is the article title.
- Keep paragraphs focused — 2-4 sentences each.

${keywordSection}

STRUCTURE:
- Write approximately ${target} words.
- Use bullet lists and numbered lists where they help organize information — not as filler.
- Mention opportunities for internal links naturally (e.g., "see our guide on...", "we cover this in detail in...").
${target >= 800 ? "- Include an FAQ section (## FAQ) with 3-5 questions as ### headings." : ""}

CONTENT:
- Answer the reader's search intent with specific information, real examples, and actionable guidance.
- Explain WHY things matter, not just WHAT they are.
- Use realistic scenarios and concrete details instead of vague claims.
- Each section should add distinct value. Do not repeat the same point in different words.
- Never invent personal experiences. Do not write "I remember...", "In my experience...", or "I once...". If an example is needed, use a realistic hypothetical scenario.

TONE: ${input.tone || "Professional"} — professional but natural. Write the way a knowledgeable person explains things clearly.
${websiteUrl ? `WEBSITE: ${websiteUrl}` : ""}
${referenceSection}`;
}

function buildUserPrompt(input) {
  const kws = getKeywords(input);
  const primary = kws[0] || input.topic || "";
  const secondary = kws.slice(1);
  const target = getTargetWordCount(input);
  const kwList = secondary.length > 0
    ? `\nSecondary keywords: ${secondary.map(k => `"${k}"`).join(", ")}`
    : "";

  const hasReference = !!(input.url || input.pastedContent);

  let referenceBlock = "";
  if (hasReference) {
    if (input.url && input.pastedContent) {
      referenceBlock = `\nReference URL: ${input.url}\n\nExisting content to improve:\n${input.pastedContent}\n`;
    } else if (input.url) {
      referenceBlock = `\nReference URL: ${input.url}\n`;
    } else {
      referenceBlock = `\nExisting content to improve:\n${input.pastedContent}\n`;
    }
    referenceBlock += `
Use this reference to understand the topic, then write original content that covers everything it covers plus additional depth, better examples, and stronger structure. Do not copy or closely paraphrase.`;
  }

  return `Write an informative, well-structured article about "${input.topic}".

Primary keyword: "${primary}"${kwList}
Target length: approximately ${target} words
${referenceBlock}`;
}

// ─── SEO checklist ─────────────────────────────────────

function evaluateChecklist(markdown, input) {
  const kws = getKeywords(input);
  const primary = (kws[0] || "").toLowerCase();
  const secondary = kws.slice(1).map(k => k.toLowerCase());
  const text = markdown.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const target = getTargetWordCount(input);

  // Primary keyword in intro (first 150 words — generous window)
  const introWords = words.slice(0, 150).join(" ");
  const kwInIntro = primary ? introWords.includes(primary) : true;

  // Primary keyword in headings
  const h2Matches = markdown.match(/^##\s+.+$/gm) || [];
  const kwInHeadings = primary
    ? h2Matches.some(h => h.toLowerCase().includes(primary))
    : true;

  // Title length
  const titleMatch = markdown.match(/^##\s+(.+)$/m);
  const titleLen = titleMatch ? titleMatch[1].trim().length : 0;
  const titleLengthOk = titleLen >= 20 && titleLen <= 80;

  // Paragraph length
  const paragraphs = markdown
    .split(/\n\n+/)
    .filter(p => !p.startsWith("#") && p.trim().length > 0);
  const shortParagraphs = paragraphs.every(p => p.split(/\s+/).length <= 300);

  // Internal link mentions
  const hasInternalLinks =
    /\b(see our|check out our|read our|learn more about|our guide|related article|related post)\b/i.test(markdown);

  // Lists
  const hasBulletList = /^[\s]*[-*]\s+.+$/m.test(markdown);
  const hasNumberedList = /^[\s]*\d+\.\s+.+$/m.test(markdown);
  const hasLists = hasBulletList || hasNumberedList;

  // Readability
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 5);
  const avgSentenceLen = sentences.length > 0
    ? sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length
    : 0;
  const readabilityOk = avgSentenceLen <= 22;

  // Keyword presence (not strict density — just reasonable usage)
  const escPrimary = primary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const kwCount = primary ? (text.match(new RegExp(escPrimary, "gi")) || []).length : 0;
  const kwPresent = kwCount >= 3;

  // Content length
  const lengthOk = wordCount >= Math.round(target * 0.85);

  const checklist = [
    { label: "Primary keyword in introduction", done: kwInIntro },
    { label: "Primary keyword in at least one heading", done: kwInHeadings },
    { label: "Title length appropriate", done: titleLengthOk },
    { label: "Short, focused paragraphs", done: shortParagraphs },
    { label: "Internal linking opportunities mentioned", done: hasInternalLinks },
    { label: "Uses lists where appropriate", done: hasLists },
    { label: "Readable sentence length", done: readabilityOk },
    { label: "Primary keyword used naturally throughout", done: kwPresent },
    { label: "Content length meets target", done: lengthOk },
  ];

  for (const sk of secondary) {
    const escSk = sk.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const skCount = (text.match(new RegExp(escSk, "gi")) || []).length;
    checklist.push({
      label: `Secondary keyword "${sk}" used (${skCount}x)`,
      done: skCount >= 2,
    });
  }

  return checklist;
}

// ─── Writing quality analysis ──────────────────────────
// Replaces fake AI-detection scoring with genuine writing quality evaluation.
// Maintains the same response shape for frontend compatibility.

function buildAnalysisPrompt(content) {
  return `Evaluate the writing quality of this article. Return ONLY a JSON object — no other text.

Score each dimension 0-100:

- "humanScore": Overall writing quality. High = specific, well-explained, varied, useful. Low = generic, repetitive, vague, filler-heavy.
- "aiScore": How generic/templated the writing feels. High = generic, repetitive, predictable structure. Low = specific, original, well-reasoned.
- "sentenceStructure": Sentence variety. High = good mix of short/long sentences, varied openings. Low = uniform length, repetitive patterns.
- "readability": How easy and clear the writing is. High = clear explanations, good flow, logical transitions. Low = awkward phrasing, unclear points.

Count passages (roughly paragraph-sized chunks):
- "humanWritten": passages that are specific, well-explained, and provide genuine value
- "mixed": passages that are adequate but could be more specific or useful
- "aiGenerated": passages that are generic, vague, or contain filler without substance

{
  "humanScore": <0-100>,
  "aiScore": <0-100>,
  "sentenceStructure": <0-100>,
  "readability": <0-100>,
  "humanWritten": <number>,
  "mixed": <number>,
  "aiGenerated": <number>
}

Content:

${content}`;
}

// ─── Improve content (replaces old "humanize") ─────────
// Instead of trying to trick AI detectors, this rewrites to improve
// writing quality: more specific, better structured, less generic.

function buildImprovePrompt(keywords) {
  const primary = keywords[0] || "";
  const kwNote = primary
    ? `Keep the keyword "${primary}" where it appears naturally in headings and body text.`
    : "";

  return `You are an experienced editor. Your job is to improve an article's writing quality.

Read the article carefully, then rewrite it to be:
- More specific: replace vague claims with concrete details, numbers, or realistic scenarios
- More useful: every paragraph should tell the reader something they can act on or learn from
- Better structured: vary paragraph lengths, use different approaches in different sections
- Clearer: simplify complex sentences, remove unnecessary words, improve transitions

Rules:
- Keep all factual information, headings, links, and markdown formatting
- ${kwNote}
- Do NOT add personal experiences or first-person stories. Do not write "I remember", "I once", "In my experience", etc.
- Do NOT add filler phrases: "trust me", "honestly", "you know", "here's the thing", "believe me"
- Do NOT add forced casual language: "gonna", "wanna", "kinda", "gotta"
- Do NOT change the overall topic or structure unless a section genuinely adds no value
- Each section should feel distinct — use different techniques (examples, comparisons, direct explanation, scenarios) across sections
- Write professionally but naturally. The goal is clear, useful writing — not a specific style or personality.`;
}

// ─── Generate content ───────────────────────────────────

export const generateContent = async (req, res) => {
  try {
    const access = await verifyWebsiteAccess(req);
    if (access.error)
      return res
        .status(access.status || 400)
        .json({ success: false, message: access.error });

    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(400).json({
        success: false,
        message: "OpenAI API key not configured. Please ask the admin to add an OpenAI API key from Admin Panel -> API Keys.",
      });
    }

    const { websiteId, topic, keywords, tone, length, customLength, url, pastedContent } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: "Please provide a topic or title for the content.",
      });
    }

    const kwArray = Array.isArray(keywords)
      ? keywords.filter(k => typeof k === "string" && k.trim()).map(k => k.trim())
      : [];

    const mode = url || pastedContent ? "advanced" : "standard";
    const input = { topic, keywords: kwArray, tone, length, customLength, url, pastedContent };

    const record = await ContentCreationModel.create({
      user: req.user,
      website: websiteId,
      title: topic || url || "Untitled",
      mode,
      input,
      status: "generating",
    });

    const systemPrompt = buildSystemPrompt(input, access.website.url);
    const userPrompt = buildUserPrompt(input);

    const completion = await callOpenAI(openai, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ], {
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
      max_tokens: 8192,
    });

    await logAIUsage(req.user, websiteId, "generate", completion);

    const markdown = completion.choices[0]?.message?.content || "";
    const validation = validateOutput(markdown);

    if (!validation.valid) {
      record.status = "failed";
      await record.save();
      return res.status(500).json({
        success: false,
        message: `Content generation failed: ${validation.reason}`,
      });
    }

    const checklist = evaluateChecklist(markdown, input);

    record.content = { markdown, checklist };
    record.status = "completed";
    await record.save();

    await createLog(req, {
      user: req.user,
      action: "Generate content",
      category: "content",
      details: `Generated content: "${record.title}"`,
    });

    return res.status(200).json({
      success: true,
      message: "Content generated successfully!",
      content: record,
    });
  } catch (error) {
    console.error("generateContent error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Refine content ─────────────────────────────────────

export const refineContent = async (req, res) => {
  try {
    const access = await verifyWebsiteAccess(req);
    if (access.error)
      return res
        .status(access.status || 400)
        .json({ success: false, message: access.error });

    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(400).json({
        success: false,
        message: "OpenAI API key not configured. Please ask the admin to add an OpenAI API key from Admin Panel -> API Keys.",
      });
    }

    const { contentId, prompt } = req.body;

    if (!contentId || !prompt) {
      return res.status(400).json({
        success: false,
        message: "Content ID and refinement prompt are required.",
      });
    }

    const record = await ContentCreationModel.findOne({
      _id: contentId,
      user: req.user,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found!" });
    }

    const currentMarkdown = record.content.markdown;
    const kws = getKeywords(record.input);

    const completion = await callOpenAI(openai, [
      {
        role: "system",
        content: `You are an editor. Apply the user's requested change to the article below.

Rules:
- Only modify what the user asks you to change. Do not rewrite sections that are not mentioned.
- Preserve all factual information, keyword usage, markdown formatting, and links.
- If the change only affects one section, return the full article but only modify that section.
- Do not add personal experiences, filler phrases, or forced casual language.
- Do not change the meaning of content unless the user specifically asks for it.
- Return the full updated article in markdown.${kws[0] ? `\n- Primary keyword: "${kws[0]}" — keep it where it currently appears.` : ""}`,
      },
      {
        role: "user",
        content: `Here is the current article:\n\n${currentMarkdown}\n\n---\n\nRequested change: ${prompt}`,
      },
    ], {
      temperature: 0.5,
      max_tokens: 8192,
    });

    const newMarkdown = completion.choices[0]?.message?.content || currentMarkdown;

    await logAIUsage(req.user, req.body.websiteId, "refine", completion);

    record.refinements.push({ prompt, markdown: newMarkdown });
    record.content.markdown = newMarkdown;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Content refined successfully!",
      content: record,
    });
  } catch (error) {
    console.error("refineContent error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Analyze content (writing quality) ─────────────────

export const analyzeContent = async (req, res) => {
  try {
    const access = await verifyWebsiteAccess(req);
    if (access.error)
      return res
        .status(access.status || 400)
        .json({ success: false, message: access.error });

    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(400).json({
        success: false,
        message: "OpenAI API key not configured. Please ask the admin to add an OpenAI API key from Admin Panel -> API Keys.",
      });
    }

    const { contentId } = req.body;

    if (!contentId) {
      return res
        .status(400)
        .json({ success: false, message: "Content ID is required." });
    }

    const record = await ContentCreationModel.findOne({
      _id: contentId,
      user: req.user,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found!" });
    }

    const completion = await callOpenAI(openai, [
      {
        role: "system",
        content: "You are a writing quality analyst. Evaluate content for specificity, usefulness, readability, and structure. Return only the requested JSON.",
      },
      { role: "user", content: buildAnalysisPrompt(record.content.markdown) },
    ], {
      temperature: 0.3,
      max_tokens: 512,
    });

    await logAIUsage(req.user, req.body.websiteId, "analyze", completion);

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch {
      analysis = {
        humanScore: 0,
        aiScore: 0,
        sentenceStructure: 0,
        readability: 0,
        humanWritten: 0,
        mixed: 0,
        aiGenerated: 0,
      };
    }

    record.humanize.analysis = analysis;
    await record.save();

    return res.status(200).json({
      success: true,
      analysis,
    });
  } catch (error) {
    console.error("analyzeContent error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Humanize content (improve writing quality) ────────

export const humanizeContent = async (req, res) => {
  try {
    const access = await verifyWebsiteAccess(req);
    if (access.error)
      return res
        .status(access.status || 400)
        .json({ success: false, message: access.error });

    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(400).json({
        success: false,
        message: "OpenAI API key not configured. Please ask the admin to add an OpenAI API key from Admin Panel -> API Keys.",
      });
    }

    const { contentId } = req.body;

    if (!contentId) {
      return res
        .status(400)
        .json({ success: false, message: "Content ID is required." });
    }

    const record = await ContentCreationModel.findOne({
      _id: contentId,
      user: req.user,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found!" });
    }

    const kws = getKeywords(record.input);

    const completion = await callOpenAI(openai, [
      { role: "system", content: buildImprovePrompt(kws) },
      {
        role: "user",
        content: `Improve this article's writing quality. Make it more specific, useful, and well-structured:\n\n${record.content.markdown}`,
      },
    ], {
      temperature: 0.7,
      frequency_penalty: 0.15,
      presence_penalty: 0.1,
      max_tokens: 8192,
    });

    await logAIUsage(req.user, req.body.websiteId, "humanize", completion);

    const improved = completion.choices[0]?.message?.content || record.content.markdown;
    const validation = validateOutput(improved);
    const humanizedContent = validation.valid ? improved : record.content.markdown;

    // Run quality analysis on the improved content
    let analysis = record.humanize.analysis;
    try {
      const analysisCompletion = await callOpenAI(openai, [
        {
          role: "system",
          content: "You are a writing quality analyst. Evaluate content for specificity, usefulness, readability, and structure. Return only the requested JSON.",
        },
        { role: "user", content: buildAnalysisPrompt(humanizedContent) },
      ], {
        temperature: 0.3,
        max_tokens: 512,
      });

      await logAIUsage(req.user, req.body.websiteId, "analyze", analysisCompletion);
      const raw = analysisCompletion.choices[0]?.message?.content || "{}";
      const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.error("Analysis after humanize failed:", err.message);
    }

    record.humanize.isHumanized = true;
    record.humanize.humanizedContent = humanizedContent;
    record.humanize.analysis = analysis;
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Content improved successfully!",
      humanizedContent,
      analysis,
    });
  } catch (error) {
    console.error("humanizeContent error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Generate Meta Data ────────────────────────────────

export const generateMetaData = async (req, res) => {
  try {
    const access = await verifyWebsiteAccess(req);
    if (access.error)
      return res
        .status(access.status || 400)
        .json({ success: false, message: access.error });

    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(400).json({
        success: false,
        message: "OpenAI API key not configured. Please ask the admin to add an OpenAI API key from Admin Panel -> API Keys.",
      });
    }

    const { contentId } = req.body;

    if (!contentId) {
      return res
        .status(400)
        .json({ success: false, message: "Content ID is required." });
    }

    const record = await ContentCreationModel.findOne({
      _id: contentId,
      user: req.user,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found!" });
    }

    const kws = getKeywords(record.input);
    const primary = kws[0] || record.title;
    const secondary = kws.slice(1);
    const websiteUrl = access.website.url || "";

    const completion = await callOpenAI(openai, [
      {
        role: "system",
        content: "You are an SEO meta data specialist. Generate meta data for a web page. Return ONLY a JSON object — no other text.",
      },
      {
        role: "user",
        content: `Generate SEO meta data for this article.

Title: "${record.title}"
Primary keyword: "${primary}"
${secondary.length > 0 ? `Secondary keywords: ${secondary.map(k => `"${k}"`).join(", ")}` : ""}
Website: ${websiteUrl}

Article content (first 500 words):
${record.content.markdown.split(/\s+/).slice(0, 500).join(" ")}

Return a JSON object with these fields:
{
  "title": "<meta title, 50-60 characters, include primary keyword near the start>",
  "description": "<meta description, 150-160 characters, include primary keyword, end with call-to-action>",
  "slug": "<url-slug, lowercase, hyphens, 3-6 words, include primary keyword>",
  "canonical": "<full URL: ${websiteUrl}/<slug>>",
  "ogTitle": "<Open Graph title, 60-90 chars>",
  "ogDescription": "<Open Graph description, 100-200 chars>",
  "twitterTitle": "<Twitter card title, 50-70 chars>",
  "twitterDescription": "<Twitter card description, 100-200 chars>",
  "schema": "<JSON-LD Article schema as a JSON string>"
}

Rules:
- Meta title: 50-60 characters, primary keyword near the start
- Meta description: 150-160 characters, include primary keyword
- Slug: lowercase, hyphen-separated, 3-6 words
- Schema: valid JSON-LD Article schema
- All fields must be filled

Return ONLY the JSON object.`,
      },
    ], {
      temperature: 0.4,
      max_tokens: 2048,
    });

    await logAIUsage(req.user, req.body.websiteId, "meta", completion);

    const raw = completion.choices[0]?.message?.content || "{}";
    const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
    let meta;
    try {
      meta = JSON.parse(cleaned);
    } catch {
      return res.status(500).json({
        success: false,
        message: "Failed to parse meta data from AI response.",
      });
    }

    record.meta = {
      title: meta.title || "",
      description: meta.description || "",
      slug: meta.slug || "",
      canonical: meta.canonical || "",
      ogTitle: meta.ogTitle || "",
      ogDescription: meta.ogDescription || "",
      twitterTitle: meta.twitterTitle || "",
      twitterDescription: meta.twitterDescription || "",
      schema: typeof meta.schema === "string"
        ? meta.schema
        : JSON.stringify(meta.schema || {}),
    };
    await record.save();

    await createLog(req, {
      user: req.user,
      action: "Generate meta data",
      category: "content",
      details: `Generated meta data for: "${record.title}"`,
    });

    return res.status(200).json({
      success: true,
      message: "Meta data generated successfully!",
      meta: record.meta,
    });
  } catch (error) {
    console.error("generateMetaData error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get history ────────────────────────────────────────

export const getContentHistory = async (req, res) => {
  try {
    const access = await verifyWebsiteAccess(req);
    if (access.error)
      return res
        .status(access.status || 400)
        .json({ success: false, message: access.error });

    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [contents, total] = await Promise.all([
      ContentCreationModel.find({
        user: req.user,
        website: req.query.websiteId,
      })
        .select("title mode input.keywords input.tone status createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      ContentCreationModel.countDocuments({
        user: req.user,
        website: req.query.websiteId,
      }),
    ]);

    return res.status(200).json({
      success: true,
      contents,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Get single content ─────────────────────────────────

export const getContentById = async (req, res) => {
  try {
    const { contentId } = req.query;

    if (!contentId) {
      return res
        .status(400)
        .json({ success: false, message: "Content ID is required." });
    }

    const record = await ContentCreationModel.findOne({
      _id: contentId,
      user: req.user,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found!" });
    }

    return res.status(200).json({
      success: true,
      content: record,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Delete content ─────────────────────────────────────

export const deleteContent = async (req, res) => {
  try {
    const { contentId } = req.query;

    if (!contentId) {
      return res
        .status(400)
        .json({ success: false, message: "Content ID is required." });
    }

    const record = await ContentCreationModel.findOneAndDelete({
      _id: contentId,
      user: req.user,
    });

    if (!record) {
      return res
        .status(404)
        .json({ success: false, message: "Content not found!" });
    }

    await createLog(req, {
      user: req.user,
      action: "Delete content",
      category: "content",
      details: `Deleted content: "${record.title}"`,
    });

    return res.status(200).json({
      success: true,
      message: "Content deleted successfully!",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
