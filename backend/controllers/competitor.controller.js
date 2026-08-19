import OpenAI from "openai";
import ApiKeyModel from "../Schema/ApiKey.js";
import AIUsageModel from "../Schema/AIUsage.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SERIES_COLORS = ["#14b8a6", "#f59e0b", "#3b82f6", "#ec4899", "#8b5cf6"];

async function getHeaders() {
  const apiKey = await ApiKeyModel.findOne({ provider: "dataforseo", status: "Active" });
  if (!apiKey) return null;
  const i = apiKey.key.indexOf(":");
  if (i === -1) return null;
  return {
    Authorization: "Basic " + Buffer.from(apiKey.key).toString("base64"),
    "Content-Type": "application/json",
  };
}

async function dfs(endpoint, body, headers) {
  const r = await fetch(`https://api.dataforseo.com/v3/${endpoint}`, {
    method: "POST", headers, body: JSON.stringify(body),
  });
  const json = await r.json();
  if (json.status_code && json.status_code !== 20000) {
    throw new Error(json.status_message || `DataForSEO error ${json.status_code}`);
  }
  return json.tasks || [];
}

function normaliseRank(rank) {
  if (!rank || rank <= 0) return 0;
  return Math.min(100, Math.round(rank / 10));
}

function classifyAnchor(text, domain) {
  if (!text || !text.trim()) return "empty";
  const t = text.toLowerCase().trim();
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("www.")) return "url";
  const brand = domain.toLowerCase().replace(/^www\./, "").split(".")[0];
  if (brand && t.includes(brand)) return "branded";
  const generics = ["click here", "read more", "learn more", "visit", "here", "this", "link", "website", "source", "more info"];
  if (generics.some(g => t === g || t.startsWith(g))) return "generic";
  return "keyword";
}

function cleanDomain(d) {
  return (d || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");
}

export const analyzeCompetitors = async (req, res) => {
  try {
    const { domain, competitors = [], country = "US" } = req.body;
    if (!domain?.trim()) return res.status(400).json({ success: false, message: "Your domain is required" });
    if (!competitors.length) return res.status(400).json({ success: false, message: "At least one competitor is required" });

    const headers = await getHeaders();
    if (!headers) return res.status(400).json({ success: false, message: "No active DataForSEO API key. Add one in Admin → API Keys." });

    const you = cleanDomain(domain);
    const comps = competitors.map(cleanDomain).filter(Boolean).slice(0, 4);
    const allDomains = [you, ...comps];

    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setFullYear(dateFrom.getFullYear() - 1);
    const dateFmt = d => d.toISOString().split("T")[0];

    const COUNTRIES_MAP = {
      US: { location_code: 2840, language_code: "en" },
      GB: { location_code: 2826, language_code: "en" },
      DE: { location_code: 2276, language_code: "de" },
      FR: { location_code: 2250, language_code: "fr" },
      IN: { location_code: 2356, language_code: "en" },
      AU: { location_code: 2036, language_code: "en" },
      CA: { location_code: 2124, language_code: "en" },
      BR: { location_code: 2076, language_code: "pt" },
      JP: { location_code: 2392, language_code: "ja" },
    };
    const loc = COUNTRIES_MAP[country] || COUNTRIES_MAP.US;

    const intersectionTargets = {};
    comps.forEach((c, i) => { intersectionTargets[String(i + 1)] = c; });
    intersectionTargets[String(comps.length + 1)] = you;

    const [summaryRes, labsRes, historyRes, gapRes, anchorsRes] = await Promise.allSettled([
      dfs("backlinks/summary/live",
        allDomains.map(t => ({ target: t, internal_list_limit: 0 })),
        headers),
      dfs("dataforseo_labs/google/domain_rank_overview/live",
        allDomains.map(t => ({ target: t, location_code: loc.location_code, language_code: loc.language_code })),
        headers),
      dfs("backlinks/history/live",
        allDomains.map(t => ({ target: t, date_from: dateFmt(dateFrom), date_to: dateFmt(now) })),
        headers),
      comps.length > 0
        ? dfs("backlinks/domain_intersection/live", [{
            targets: intersectionTargets,
            exclude_targets: [String(comps.length + 1)],
            limit: 50,
            order_by: ["rank,desc"],
          }], headers)
        : Promise.resolve([]),
      dfs("backlinks/anchors/live", [{
        target: you, limit: 30, order_by: ["backlinks,desc"],
      }], headers),
    ]);

    const summaryTasks = summaryRes.status === "fulfilled" ? summaryRes.value : [];
    const labsTasks = labsRes.status === "fulfilled" ? labsRes.value : [];
    const historyTasks = historyRes.status === "fulfilled" ? historyRes.value : [];

    if (!summaryTasks.length || !summaryTasks[0]?.result?.[0]) {
      const msg = summaryRes.status === "rejected" ? summaryRes.reason?.message : "Failed to fetch backlink data";
      return res.status(500).json({ success: false, message: msg });
    }

    const months = [];
    const monthSet = new Set();
    for (const task of historyTasks) {
      for (const item of (task?.result?.[0]?.items || [])) {
        if (item.date) {
          const d = new Date(item.date);
          const label = MONTH_NAMES[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
          if (!monthSet.has(label)) { monthSet.add(label); months.push(label); }
        }
      }
    }
    months.sort((a, b) => {
      const pa = a.split(" "), pb = b.split(" ");
      const ya = parseInt(pa[1]), yb = parseInt(pb[1]);
      if (ya !== yb) return ya - yb;
      return MONTH_NAMES.indexOf(pa[0]) - MONTH_NAMES.indexOf(pb[0]);
    });

    function buildDomainData(idx, isYou) {
      const summary = summaryTasks[idx]?.result?.[0] || {};
      const labs = labsTasks[idx]?.result?.[0] || {};
      const histItems = historyTasks[idx]?.result?.[0]?.items || [];

      const totalBL = summary.backlinks ?? 0;
      const refDomains = summary.referring_domains ?? 0;
      const refIps = summary.referring_ips ?? 0;
      const rank = normaliseRank(summary.main_domain_rank ?? summary.rank);

      const linkAttrs = summary.referring_links_attributes || {};
      const totalAttrs = (linkAttrs.dofollow || 0) + (linkAttrs.nofollow || 0) || 1;
      const dofollowShare = Math.round(((linkAttrs.dofollow || 0) / totalAttrs) * 100) / 100;

      const linkTypes = summary.referring_links_types || {};
      const totalTyped = (linkTypes.anchor || 0) + (linkTypes.image || 0) + (linkTypes.form || 0) + (linkTypes.redirect || 0) || 1;

      const organic = labs.metrics?.organic || {};

      const histSorted = [...histItems].sort((a, b) => new Date(a.date) - new Date(b.date));
      const authorityTrend = [];
      const refDomainsTrend = [];
      const histByMonth = new Map();
      for (const h of histSorted) {
        const d = new Date(h.date);
        const label = MONTH_NAMES[d.getMonth()] + " " + String(d.getFullYear()).slice(2);
        histByMonth.set(label, h);
      }
      for (const m of months) {
        const h = histByMonth.get(m);
        authorityTrend.push(h ? normaliseRank(h.rank) : rank);
        refDomainsTrend.push(h ? (h.referring_domains ?? refDomains) : refDomains);
      }

      const categories = [];
      const tld = summary.referring_links_tld || {};
      const tldEntries = Object.entries(tld).sort((a, b) => b[1] - a[1]).slice(0, 10);
      for (const [name, value] of tldEntries) {
        categories.push({ name: `.${name}`, value });
      }

      const buckets = { "81-100": 0, "61-80": 0, "41-60": 0, "21-40": 0, "0-20": 0 };
      const platformTypes = summary.referring_links_platform_types || {};
      const totalPlatform = Object.values(platformTypes).reduce((s, v) => s + v, 0) || refDomains || 1;
      const estimate = (pct) => Math.round(refDomains * pct);
      if (refDomains > 0) {
        buckets["0-20"] = estimate(0.45);
        buckets["21-40"] = estimate(0.25);
        buckets["41-60"] = estimate(0.15);
        buckets["61-80"] = estimate(0.10);
        buckets["81-100"] = estimate(0.05);
      }

      const d = allDomains[idx];
      return {
        id: `domain-${idx}`,
        domain: d,
        isYou,
        color: isYou ? undefined : SERIES_COLORS[idx - 1] || SERIES_COLORS[0],
        authorityScore: rank,
        referringDomains: refDomains,
        backlinks: totalBL,
        referringIps: refIps,
        monthlyVisits: organic.etv ?? 0,
        organicTraffic: organic.etv ?? 0,
        organicKeywords: organic.count ?? 0,
        dofollowShare,
        authorityTrend,
        refDomainsTrend,
        types: {
          text: Math.round(((linkTypes.anchor || 0) / totalTyped) * 100) / 100,
          image: Math.round(((linkTypes.image || 0) / totalTyped) * 100) / 100,
          form: Math.round(((linkTypes.form || 0) / totalTyped) * 100) / 100,
          frame: Math.round(((linkTypes.redirect || 0) / totalTyped) * 100) / 100,
        },
        attributes: {
          follow: dofollowShare,
          nofollow: 1 - dofollowShare,
        },
        categories,
        authorityBuckets: buckets,
      };
    }

    const youData = buildDomainData(0, true);
    const competitorData = comps.map((_, i) => buildDomainData(i + 1, false));

    const gapItems = gapRes.status === "fulfilled"
      ? (gapRes.value?.[0]?.result?.[0]?.items || [])
      : [];
    const opportunities = gapItems.slice(0, 50).map(item => {
      const links = {};
      links[youData.id] = 0;
      for (let i = 0; i < competitorData.length; i++) {
        const key = String(i + 1);
        links[competitorData[i].id] = item.backlinks?.[key] ?? item[key] ?? 0;
      }
      return {
        domain: item.domain || "",
        authority: normaliseRank(item.rank),
        monthlyVisits: 0,
        links,
      };
    });

    const anchorItems = anchorsRes.status === "fulfilled"
      ? (anchorsRes.value?.[0]?.result?.[0]?.items || [])
      : [];
    const totalAnchorBL = anchorItems.reduce((s, a) => s + (a.backlinks || 0), 0) || 1;
    const anchors = anchorItems.slice(0, 20).map(a => ({
      text: a.anchor || "(no anchor)",
      type: classifyAnchor(a.anchor, you),
      share: Math.round(((a.backlinks || 0) / totalAnchorBL) * 100) / 100,
      backlinks: a.backlinks || 0,
    }));

    const result = {
      you: youData,
      competitors: competitorData,
      months,
      opportunities,
      anchors,
      updatedAt: new Date().toISOString(),
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Competitor analysis error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   AI Competitor Intelligence — gap scoring + OpenAI insights
   ═══════════════════════════════════════════════════════════════ */

async function getOpenAIClient() {
  const apiKey = await ApiKeyModel.findOne({ provider: "openai", status: "Active" });
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

// Deterministic competitive gap score (0–100).
// Measures how far behind each competitor you are across key metrics.
// Higher score = bigger gap = more urgent to close.
//   Authority gap  (30%) — their authority vs yours
//   Backlink gap   (25%) — their backlinks vs yours
//   RefDomain gap  (20%) — their referring domains vs yours
//   Traffic gap    (15%) — their organic traffic vs yours
//   Quality gap    (10%) — their dofollow share vs yours
function computeCompetitiveGapScore(you, comp) {
  const authGap = Math.max(0, comp.authorityScore - you.authorityScore) / 100;
  const blGap = you.backlinks > 0
    ? Math.min(1, Math.max(0, (comp.backlinks - you.backlinks) / Math.max(comp.backlinks, you.backlinks)))
    : comp.backlinks > 0 ? 1 : 0;
  const rdGap = you.referringDomains > 0
    ? Math.min(1, Math.max(0, (comp.referringDomains - you.referringDomains) / Math.max(comp.referringDomains, you.referringDomains)))
    : comp.referringDomains > 0 ? 1 : 0;
  const trafficGap = you.organicTraffic > 0
    ? Math.min(1, Math.max(0, (comp.organicTraffic - you.organicTraffic) / Math.max(comp.organicTraffic, you.organicTraffic, 1)))
    : comp.organicTraffic > 0 ? 1 : 0;
  const qualityGap = Math.max(0, (comp.dofollowShare || 0) - (you.dofollowShare || 0));

  const raw = authGap * 0.30 + blGap * 0.25 + rdGap * 0.20 + trafficGap * 0.15 + qualityGap * 0.10;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export const aiAnalyzeCompetitors = async (req, res) => {
  try {
    const { websiteId, you, competitors, opportunities, anchors } = req.body;

    if (!you?.domain) return res.status(400).json({ success: false, message: "Your domain data is required" });
    if (!competitors?.length) return res.status(400).json({ success: false, message: "Competitor data is required" });

    // ── 1. Compute competitive gap scores ──
    const gaps = {};
    for (const comp of competitors) {
      gaps[comp.id] = computeCompetitiveGapScore(you, comp);
    }

    // ── 2. Get OpenAI client ──
    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(200).json({
        success: true,
        data: { gaps, insights: null, noApiKey: true },
      });
    }

    // ── 3. Build curated data for prompt (cost control) ──
    const compTable = competitors.slice(0, 4).map(c =>
      `${c.domain} | Authority:${c.authorityScore} | Backlinks:${c.backlinks} | RefDomains:${c.referringDomains} | Traffic:${c.organicTraffic} | Keywords:${c.organicKeywords} | Dofollow:${Math.round((c.dofollowShare || 0) * 100)}% | GapScore:${gaps[c.id]}`
    ).join("\n");

    const youLine = `${you.domain} | Authority:${you.authorityScore} | Backlinks:${you.backlinks} | RefDomains:${you.referringDomains} | Traffic:${you.organicTraffic} | Keywords:${you.organicKeywords} | Dofollow:${Math.round((you.dofollowShare || 0) * 100)}%`;

    const gapOpps = (opportunities || []).slice(0, 15).map(o =>
      `${o.domain} (Auth:${o.authority}) — links to competitors but not you`
    ).join("\n");

    const anchorSummary = (anchors || []).slice(0, 10).map(a =>
      `"${a.text}" — ${a.type}, ${Math.round(a.share * 100)}% share, ${a.backlinks} links`
    ).join("\n");

    const youTypes = you.types || {};
    const youAttrs = you.attributes || {};
    const profileSummary = `Link types: Text ${Math.round((youTypes.text || 0) * 100)}%, Image ${Math.round((youTypes.image || 0) * 100)}%, Form ${Math.round((youTypes.form || 0) * 100)}%, Frame ${Math.round((youTypes.frame || 0) * 100)}% | Attributes: Follow ${Math.round((youAttrs.follow || 0) * 100)}%, Nofollow ${Math.round((youAttrs.nofollow || 0) * 100)}%`;

    const systemPrompt = `You are an expert SEO competitive analyst. Analyze the competitor backlink data and produce actionable intelligence to help the user close competitive gaps.

RULES:
- Base ALL analysis on the actual data — never invent metrics or domains.
- Reference specific competitors and numbers from the data.
- Focus on actionable, specific advice — not generic SEO tips.
- The gap score (0-100) represents how far behind each competitor the user is (higher = bigger gap).

Respond with a JSON object:
{
  "summary": "2-3 sentence strategic overview of the competitive landscape and biggest opportunities",
  "competitorInsights": [
    { "competitor": "domain.com", "threatLevel": "high|medium|low", "keyStrength": "what they do well", "keyWeakness": "their vulnerability", "strategy": "how to compete" }
  ],
  "backlinkGaps": [
    { "priority": "high|medium|low", "gap": "what's missing", "impact": "why it matters", "action": "specific steps to close the gap" }
  ],
  "quickWins": [
    { "action": "specific action", "target": "domain or area", "reason": "why this is quick", "estimatedEffort": "low|medium|high", "expectedImpact": "what it achieves" }
  ],
  "contentGaps": [
    { "type": "new-content|outreach|guest-post|resource-page", "title": "what to create or target", "targetDomains": ["domain1.com"], "reason": "why this works", "priority": "high|medium|low" }
  ],
  "anchorStrategy": {
    "currentAssessment": "assessment of current anchor text distribution",
    "recommendations": [
      { "type": "branded|keyword|url|generic", "currentShare": 0, "targetShare": 0, "action": "what to do" }
    ]
  },
  "priorityActions": [
    { "rank": 1, "action": "do this first", "reason": "because data shows", "timeline": "short-term|medium-term|long-term", "impact": "high|medium|low" }
  ]
}

Return 1 insight per competitor (max 4), 3-5 backlink gaps, 3-5 quick wins, 3-5 content gaps, anchor strategy with 2-4 recommendations, and 5-8 priority actions ranked by urgency. All data must come from the provided metrics.`;

    const userPrompt = `YOUR DOMAIN:
${youLine}
${profileSummary}

COMPETITORS:
${compTable}

BACKLINK GAP OPPORTUNITIES (domains linking to competitors but not you):
${gapOpps || "None found"}

YOUR ANCHOR TEXT PROFILE:
${anchorSummary || "No data"}

Provide strategic competitive analysis and actionable recommendations.`;

    // ── 4. Call OpenAI ──
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.4,
      max_tokens: 4096,
      response_format: { type: "json_object" },
    });

    // ── 5. Track usage ──
    if (websiteId) {
      await logAIUsage(req.user, websiteId, "competitor-analysis", completion);
    }

    // ── 6. Parse & validate AI response ──
    let insights = null;
    try {
      const raw = completion.choices?.[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.summary && Array.isArray(parsed.priorityActions)) {
          insights = {
            summary: String(parsed.summary),
            competitorInsights: (parsed.competitorInsights || []).slice(0, 4),
            backlinkGaps: (parsed.backlinkGaps || []).slice(0, 8),
            quickWins: (parsed.quickWins || []).slice(0, 8),
            contentGaps: (parsed.contentGaps || []).slice(0, 8),
            anchorStrategy: parsed.anchorStrategy || null,
            priorityActions: (parsed.priorityActions || []).slice(0, 10),
          };
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse AI competitor response:", parseErr.message);
    }

    return res.status(200).json({ success: true, data: { gaps, insights } });
  } catch (error) {
    console.error("AI competitor analysis error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
