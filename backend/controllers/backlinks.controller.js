import OpenAI from "openai";
import ApiKeyModel from "../Schema/ApiKey.js";
import AIUsageModel from "../Schema/AIUsage.js";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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

function linkTypeMap(dfsType) {
  const m = { anchor: "text", image: "image", redirect: "redirect", form: "form", meta: "redirect", canonical: "redirect", alternate: "redirect" };
  return m[dfsType] || "text";
}

function classifyAnchor(text, domain) {
  if (!text || !text.trim()) return "empty";
  const t = text.toLowerCase().trim();
  if (t.startsWith("http://") || t.startsWith("https://") || t.startsWith("www.")) return "url";
  const domParts = domain.toLowerCase().replace(/^www\./, "").split(".");
  const brand = domParts[0];
  if (brand && t.includes(brand)) return "branded";
  const generics = ["click here", "read more", "learn more", "visit", "here", "this", "link", "website", "source", "more info", "check it out"];
  if (generics.some(g => t === g || t.startsWith(g))) return "generic";
  return "keyword";
}

export const analyzeBacklinks = async (req, res) => {
  try {
    const { domain } = req.body;
    if (!domain?.trim()) return res.status(400).json({ success: false, message: "Domain is required" });

    const headers = await getHeaders();
    if (!headers) return res.status(400).json({ success: false, message: "No active DataForSEO API key. Add one in Admin → API Keys." });

    const target = domain.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/+$/, "");

    const now = new Date();
    const dateFrom = new Date(now);
    dateFrom.setFullYear(dateFrom.getFullYear() - 1);
    const dateFmt = d => d.toISOString().split("T")[0];

    const [summaryRes, backlinksRes, refDomainsRes, anchorsRes, historyRes] = await Promise.allSettled([
      dfs("backlinks/summary/live", [{ target, internal_list_limit: 0 }], headers),
      dfs("backlinks/backlinks/live", [{
        target, limit: 50, order_by: ["rank,desc"], backlinks_status_type: "live",
      }], headers),
      dfs("backlinks/referring_domains/live", [{
        target, limit: 50, order_by: ["rank,desc"], backlinks_status_type: "live",
      }], headers),
      dfs("backlinks/anchors/live", [{
        target, limit: 50, order_by: ["backlinks,desc"],
      }], headers),
      dfs("backlinks/history/live", [{
        target, date_from: dateFmt(dateFrom), date_to: dateFmt(now),
      }], headers),
    ]);

    if (summaryRes.status === "rejected") {
      return res.status(500).json({ success: false, message: summaryRes.reason?.message || "Failed to fetch backlink data" });
    }

    const summary = summaryRes.value?.[0]?.result?.[0];
    if (!summary) {
      const taskMsg = summaryRes.value?.[0]?.status_message;
      return res.status(500).json({ success: false, message: taskMsg || "No backlink data found for this domain" });
    }

    const totalBL = summary.backlinks ?? 0;
    const refDomains = summary.referring_domains ?? 0;
    const refIps = summary.referring_ips ?? 0;
    const rank = normaliseRank(summary.main_domain_rank ?? summary.rank);

    const linkTypes = summary.referring_links_types || {};
    const totalTyped = (linkTypes.anchor || 0) + (linkTypes.image || 0) + (linkTypes.redirect || 0) + (linkTypes.form || 0) || 1;
    const types = {
      text: Math.round(((linkTypes.anchor || 0) / totalTyped) * 100) / 100,
      image: Math.round(((linkTypes.image || 0) / totalTyped) * 100) / 100,
      redirect: Math.round(((linkTypes.redirect || 0) / totalTyped) * 100) / 100,
      form: Math.round(((linkTypes.form || 0) / totalTyped) * 100) / 100,
    };

    const linkAttrs = summary.referring_links_attributes || {};
    const totalAttrs = (linkAttrs.dofollow || 0) + (linkAttrs.nofollow || 0) || 1;
    const dofollowShare = Math.round(((linkAttrs.dofollow || 0) / totalAttrs) * 100) / 100;
    const attributes = {
      follow: dofollowShare,
      nofollow: Math.round(((linkAttrs.nofollow || 0) / totalAttrs) * 100) / 100,
    };

    const historyItems = historyRes.status === "fulfilled"
      ? (historyRes.value?.[0]?.result?.[0]?.items || [])
      : [];

    let newLast30 = 0, lostLast30 = 0;
    const flow = [];
    const sorted = [...historyItems].sort((a, b) => new Date(a.date) - new Date(b.date));
    for (let i = 0; i < sorted.length; i++) {
      const h = sorted[i];
      const d = new Date(h.date);
      const gained = h.new_referring_domains ?? 0;
      const lost = h.lost_referring_domains ?? 0;
      flow.push({
        month: MONTH_NAMES[d.getMonth()] + " " + String(d.getFullYear()).slice(2),
        gained,
        lost,
      });
    }
    if (sorted.length > 0) {
      const last = sorted[sorted.length - 1];
      newLast30 = last.new_referring_domains ?? 0;
      lostLast30 = last.lost_referring_domains ?? 0;
    }

    const anchorItems = anchorsRes.status === "fulfilled"
      ? (anchorsRes.value?.[0]?.result?.[0]?.items || [])
      : [];
    const totalAnchorBL = anchorItems.reduce((s, a) => s + (a.backlinks || 0), 0) || 1;
    const anchors = anchorItems.slice(0, 20).map(a => ({
      text: a.anchor || "(no anchor)",
      type: classifyAnchor(a.anchor, target),
      share: Math.round(((a.backlinks || 0) / totalAnchorBL) * 100) / 100,
      backlinks: a.backlinks || 0,
    }));

    const refDomainItems = refDomainsRes.status === "fulfilled"
      ? (refDomainsRes.value?.[0]?.result?.[0]?.items || [])
      : [];
    const buckets = { "81-100": 0, "61-80": 0, "41-60": 0, "21-40": 0, "0-20": 0 };
    const referring = refDomainItems.slice(0, 50).map(rd => {
      const auth = normaliseRank(rd.rank);
      if (auth >= 81) buckets["81-100"]++;
      else if (auth >= 61) buckets["61-80"]++;
      else if (auth >= 41) buckets["41-60"]++;
      else if (auth >= 21) buckets["21-40"]++;
      else buckets["0-20"]++;
      return {
        domain: rd.domain || "",
        authority: auth,
        backlinks: rd.backlinks || 0,
        type: linkTypeMap(rd.type || "anchor"),
        dofollow: rd.dofollow !== undefined ? rd.dofollow > 0 : true,
        firstSeen: rd.first_seen ? rd.first_seen.split(" ")[0] : "",
      };
    });

    const backlinkItems = backlinksRes.status === "fulfilled"
      ? (backlinksRes.value?.[0]?.result?.[0]?.items || [])
      : [];
    const topBacklinks = backlinkItems.slice(0, 50).map(bl => ({
      sourceDomain: bl.domain_from || "",
      sourceUrl: bl.url_from || "",
      authority: normaliseRank(bl.domain_from_rank ?? bl.page_from_rank),
      anchor: bl.anchor || "",
      targetPath: (bl.url_to || "").replace(/^https?:\/\/[^/]+/, "") || "/",
      type: linkTypeMap(bl.type || "anchor"),
      dofollow: bl.dofollow ?? true,
      firstSeen: bl.first_seen ? bl.first_seen.split(" ")[0] : "",
    }));

    const spamScore = summary.backlinks_spam_score ?? 0;
    const toxicShare = Math.min(1, Math.round(spamScore * 100) / 100);

    const tld = summary.referring_links_tld || {};
    const platformTypes = summary.referring_links_platform_types || {};
    const semanticLocations = summary.referring_links_semantic_locations || {};
    const countries = summary.referring_links_countries || {};

    const result = {
      domain: target,
      authorityScore: rank,
      totalBacklinks: totalBL,
      referringDomains: refDomains,
      referringIps: refIps,
      dofollowShare,
      newLast30,
      lostLast30,
      toxicShare,
      updatedAt: new Date().toISOString(),
      flow,
      types,
      attributes,
      anchors,
      authorityBuckets: buckets,
      referring,
      topBacklinks,
      extra: {
        referringSubnets: summary.referring_subnets ?? 0,
        referringPages: summary.referring_pages ?? 0,
        brokenBacklinks: summary.broken_backlinks ?? 0,
        brokenPages: summary.broken_pages ?? 0,
        internalLinksCount: summary.internal_links_count ?? 0,
        externalLinksCount: summary.external_links_count ?? 0,
        crawledPages: summary.crawled_pages ?? 0,
        tld,
        platformTypes,
        semanticLocations,
        countries,
      },
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Backlinks analysis error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   AI Backlink Intelligence — profile scoring + OpenAI insights
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

// Deterministic backlink profile health score (0–100).
// Formula:
//   Authority   (25%) — normalised authority score
//   Quality     (20%) — dofollow ratio (higher = better)
//   Diversity   (15%) — referring domains vs total backlinks ratio
//   Growth      (15%) — net new > lost in recent period
//   Toxicity    (15%) — inverse of spam score (lower toxic = healthier)
//   Stability   (10%) — lost links as fraction of total (lower = more stable)
function computeProfileHealthScore(profile) {
  const authority = Math.min(100, profile.authorityScore) / 100;

  const quality = Math.min(1, profile.dofollowShare || 0);

  const blCount = Math.max(1, profile.totalBacklinks);
  const rdCount = Math.max(1, profile.referringDomains);
  const diversity = Math.min(1, rdCount / Math.max(rdCount, blCount / 10));

  const netNew = (profile.newLast30 || 0) - (profile.lostLast30 || 0);
  const growthBase = Math.max(1, profile.newLast30 || 1);
  const growth = Math.min(1, Math.max(0, (netNew + growthBase) / (growthBase * 2)));

  const toxicity = 1 - Math.min(1, profile.toxicShare || 0);

  const lostRatio = profile.totalBacklinks > 0
    ? Math.min(1, (profile.lostLast30 || 0) / Math.max(1, profile.referringDomains))
    : 0;
  const stability = 1 - lostRatio;

  const raw = authority * 0.25 + quality * 0.20 + diversity * 0.15
    + growth * 0.15 + toxicity * 0.15 + stability * 0.10;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

// Score individual referring domains as link opportunities (0–100).
// Higher = more valuable referring domain.
//   Authority   (40%) — domain authority score
//   Volume      (25%) — number of backlinks from this domain
//   Dofollow    (20%) — dofollow links pass more value
//   Longevity   (15%) — older links = more established relationship
function computeReferringDomainScore(rd, maxBacklinks) {
  const auth = Math.min(100, rd.authority || 0) / 100;
  const vol = maxBacklinks > 0
    ? Math.min(1, Math.log10(Math.max(1, rd.backlinks)) / Math.log10(Math.max(10, maxBacklinks)))
    : 0;
  const dofollow = rd.dofollow ? 1 : 0.3;
  const firstDate = rd.firstSeen ? new Date(rd.firstSeen) : new Date();
  const ageMonths = Math.max(0, (Date.now() - firstDate.getTime()) / (30.44 * 24 * 60 * 60 * 1000));
  const longevity = Math.min(1, ageMonths / 24);

  const raw = auth * 0.40 + vol * 0.25 + dofollow * 0.20 + longevity * 0.15;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export const aiAnalyzeBacklinks = async (req, res) => {
  try {
    const { websiteId, profile } = req.body;

    if (!profile?.domain) return res.status(400).json({ success: false, message: "Backlink profile data is required" });

    // ── 1. Compute deterministic scores ──
    const healthScore = computeProfileHealthScore(profile);

    const maxRdBacklinks = Math.max(1, ...((profile.referring || []).map(r => r.backlinks || 0)));
    const referringScores = {};
    for (const rd of (profile.referring || [])) {
      referringScores[rd.domain] = computeReferringDomainScore(rd, maxRdBacklinks);
    }

    // ── 2. Get OpenAI client ──
    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(200).json({
        success: true,
        data: { healthScore, referringScores, insights: null, noApiKey: true },
      });
    }

    // ── 3. Build curated data for prompt (cost control) ──
    const summaryLine = `Domain: ${profile.domain} | Authority: ${profile.authorityScore}/100 | Backlinks: ${profile.totalBacklinks} | Referring Domains: ${profile.referringDomains} | Referring IPs: ${profile.referringIps} | Dofollow: ${Math.round((profile.dofollowShare || 0) * 100)}% | New(30d): +${profile.newLast30 || 0} | Lost(30d): -${profile.lostLast30 || 0} | Toxic: ${Math.round((profile.toxicShare || 0) * 100)}% | Health Score: ${healthScore}/100`;

    const topReferring = (profile.referring || [])
      .map(r => ({ ...r, score: referringScores[r.domain] || 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);
    const referringTable = topReferring
      .map(r => `${r.domain} | Auth:${r.authority} | BL:${r.backlinks} | ${r.dofollow ? "Dofollow" : "Nofollow"} | Since:${r.firstSeen || "N/A"} | Score:${r.score}`)
      .join("\n");

    const anchors = (profile.anchors || []).slice(0, 15);
    const anchorTable = anchors
      .map(a => `"${a.text}" | Type:${a.type} | Share:${Math.round(a.share * 100)}% | Links:${a.backlinks}`)
      .join("\n");

    const anchorByType = {};
    for (const a of (profile.anchors || [])) {
      anchorByType[a.type] = (anchorByType[a.type] || 0) + a.share;
    }
    const anchorDistLine = Object.entries(anchorByType)
      .map(([t, s]) => `${t}: ${Math.round(s * 100)}%`)
      .join(", ");

    const types = profile.types || {};
    const attrs = profile.attributes || {};
    const profileLine = `Link Types: Text ${Math.round((types.text || 0) * 100)}%, Image ${Math.round((types.image || 0) * 100)}%, Redirect ${Math.round((types.redirect || 0) * 100)}%, Form ${Math.round((types.form || 0) * 100)}% | Follow ${Math.round((attrs.follow || 0) * 100)}%, Nofollow ${Math.round((attrs.nofollow || 0) * 100)}%`;

    const extra = profile.extra || {};
    const extraLine = `Broken Backlinks: ${extra.brokenBacklinks || 0} | Broken Pages: ${extra.brokenPages || 0} | Referring Subnets: ${extra.referringSubnets || 0} | Referring Pages: ${extra.referringPages || 0}`;

    const buckets = profile.authorityBuckets || {};
    const bucketsLine = Object.entries(buckets)
      .map(([range, count]) => `${range}: ${count}`)
      .join(", ");

    const flowData = (profile.flow || []).slice(-6);
    const flowLine = flowData.length > 0
      ? flowData.map(f => `${f.month}: +${f.gained}/-${f.lost}`).join(", ")
      : "No trend data";

    const tld = extra.tld || {};
    const topTlds = Object.entries(tld).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const tldLine = topTlds.length > 0
      ? topTlds.map(([ext, count]) => `.${ext}: ${count}`).join(", ")
      : "No TLD data";

    const countries = extra.countries || {};
    const topCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const countriesLine = topCountries.length > 0
      ? topCountries.map(([code, count]) => `${code}: ${count}`).join(", ")
      : "No country data";

    const systemPrompt = `You are an expert SEO backlink analyst. Analyze the backlink profile data and produce actionable intelligence for link building.

RULES:
- Base ALL analysis on the actual data — never invent domains, backlinks, authority scores, URLs, or acquisition outcomes.
- Reference specific domains and metrics from the data when making recommendations.
- Focus on actionable, specific advice — not generic SEO tips.
- Use cautious language for risk assessments: "may deserve review" not "will cause a penalty."
- The health score (0-100) is calculated deterministically from the data. Explain what it means but do not change the number.
- Do not guarantee that any backlink can be acquired. Use "potential opportunity" language.

Respond with a JSON object:
{
  "summary": "2-3 sentence strategic overview of the backlink profile — strengths, weaknesses, and biggest opportunity",
  "backlinkStrengths": [
    { "strength": "what the profile does well", "evidence": "cite specific metrics", "impact": "why it matters" }
  ],
  "backlinkWeaknesses": [
    { "weakness": "what needs improvement", "evidence": "cite specific metrics", "severity": "high|medium|low", "action": "what to do" }
  ],
  "lostLinkPriorities": [
    { "priority": "high|medium|low", "observation": "what was lost or at risk", "reason": "why it matters", "action": "investigation steps" }
  ],
  "anchorInsights": [
    { "observation": "pattern found", "assessment": "healthy|review|concern", "currentState": "what the data shows", "recommendation": "what to do" }
  ],
  "linkBuildingRecommendations": [
    { "strategy": "specific approach", "targetType": "content-marketing|outreach|digital-pr|resource-pages|broken-link|guest-posting|directories", "reason": "why this works for this profile", "priority": "high|medium|low", "estimatedEffort": "low|medium|high" }
  ],
  "priorities": [
    { "rank": 1, "action": "do this first", "reason": "because data shows", "timeline": "immediate|short-term|medium-term|long-term", "impact": "high|medium|low" }
  ]
}

Return 3-5 strengths, 3-5 weaknesses, 2-4 lost link priorities, 3-5 anchor insights, 4-6 link building recommendations, and 5-8 priorities ranked by urgency. All data must come from the provided metrics.`;

    const userPrompt = `BACKLINK PROFILE SUMMARY:
${summaryLine}

LINK PROFILE:
${profileLine}

AUTHORITY DISTRIBUTION (referring domains):
${bucketsLine}

TOP REFERRING DOMAINS (by value score):
${referringTable || "No referring domain data"}

ANCHOR TEXT DISTRIBUTION:
Overall by type: ${anchorDistLine || "No data"}
Top anchors:
${anchorTable || "No anchor data"}

LINK HEALTH:
${extraLine}

RECENT TREND (new/lost per month):
${flowLine}

TOP TLDs:
${tldLine}

TOP COUNTRIES:
${countriesLine}

Provide strategic backlink analysis and actionable link-building recommendations.`;

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
      await logAIUsage(req.user, websiteId, "backlink-analysis", completion);
    }

    // ── 6. Parse & validate AI response ──
    let insights = null;
    try {
      const raw = completion.choices?.[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.summary && Array.isArray(parsed.priorities)) {
          insights = {
            summary: String(parsed.summary),
            backlinkStrengths: (parsed.backlinkStrengths || []).slice(0, 8),
            backlinkWeaknesses: (parsed.backlinkWeaknesses || []).slice(0, 8),
            lostLinkPriorities: (parsed.lostLinkPriorities || []).slice(0, 6),
            anchorInsights: (parsed.anchorInsights || []).slice(0, 8),
            linkBuildingRecommendations: (parsed.linkBuildingRecommendations || []).slice(0, 8),
            priorities: (parsed.priorities || []).slice(0, 10),
          };
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse AI backlink response:", parseErr.message);
    }

    return res.status(200).json({
      success: true,
      data: { healthScore, referringScores, insights },
    });
  } catch (error) {
    console.error("AI backlink analysis error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
