import OpenAI from "openai";
import ApiKeyModel from "../Schema/ApiKey.js";
import AIUsageModel from "../Schema/AIUsage.js";

const COUNTRIES = {
  US: { code: "US", name: "United States", flag: "\u{1F1FA}\u{1F1F8}", database: "google:en-US", location_code: 2840, language_code: "en", currency: "USD" },
  GB: { code: "GB", name: "United Kingdom", flag: "\u{1F1EC}\u{1F1E7}", database: "google:en-GB", location_code: 2826, language_code: "en", currency: "GBP" },
  DE: { code: "DE", name: "Germany", flag: "\u{1F1E9}\u{1F1EA}", database: "google:de-DE", location_code: 2276, language_code: "de", currency: "EUR" },
  FR: { code: "FR", name: "France", flag: "\u{1F1EB}\u{1F1F7}", database: "google:fr-FR", location_code: 2250, language_code: "fr", currency: "EUR" },
  ES: { code: "ES", name: "Spain", flag: "\u{1F1EA}\u{1F1F8}", database: "google:es-ES", location_code: 2724, language_code: "es", currency: "EUR" },
  IT: { code: "IT", name: "Italy", flag: "\u{1F1EE}\u{1F1F9}", database: "google:it-IT", location_code: 2380, language_code: "it", currency: "EUR" },
  CA: { code: "CA", name: "Canada", flag: "\u{1F1E8}\u{1F1E6}", database: "google:en-CA", location_code: 2124, language_code: "en", currency: "CAD" },
  AU: { code: "AU", name: "Australia", flag: "\u{1F1E6}\u{1F1FA}", database: "google:en-AU", location_code: 2036, language_code: "en", currency: "AUD" },
  IN: { code: "IN", name: "India", flag: "\u{1F1EE}\u{1F1F3}", database: "google:en-IN", location_code: 2356, language_code: "en", currency: "INR" },
  BR: { code: "BR", name: "Brazil", flag: "\u{1F1E7}\u{1F1F7}", database: "google:pt-BR", location_code: 2076, language_code: "pt", currency: "BRL" },
  NL: { code: "NL", name: "Netherlands", flag: "\u{1F1F3}\u{1F1F1}", database: "google:nl-NL", location_code: 2528, language_code: "nl", currency: "EUR" },
  JP: { code: "JP", name: "Japan", flag: "\u{1F1EF}\u{1F1F5}", database: "google:ja-JP", location_code: 2392, language_code: "ja", currency: "JPY" },
};

const GLOBAL_COUNTRIES = ["US", "GB", "DE", "IN", "AU"];

const POSITION_CTR = [0.315, 0.154, 0.112, 0.082, 0.074, 0.052, 0.041, 0.032, 0.026, 0.021];

const DFS_TO_FEATURE = {
  featured_snippet: "featured_snippet",
  people_also_ask: "people_also_ask",
  sitelinks: "sitelinks",
  video: "video",
  images: "image_pack",
  carousel: "image_pack",
  reviews: "reviews",
  paid: "top_ads",
  shopping: "shopping",
  commercial_units: "shopping",
  knowledge_graph: "knowledge_panel",
  knowledge_panel: "knowledge_panel",
  local_pack: "local_pack",
  map: "local_pack",
  faq: "faq",
  top_stories: "top_stories",
  twitter: "top_stories",
};

const FEATURE_LABELS = {
  featured_snippet: "Featured Snippet",
  people_also_ask: "People Also Ask",
  sitelinks: "Sitelinks",
  video: "Video",
  image_pack: "Image Pack",
  reviews: "Reviews",
  top_ads: "Top Ads",
  bottom_ads: "Bottom Ads",
  shopping: "Shopping",
  knowledge_panel: "Knowledge Panel",
  local_pack: "Local Pack",
  faq: "FAQ",
  top_stories: "Top Stories",
};

const QUESTION_WORDS = new Set([
  "what", "how", "why", "which", "when", "where", "who",
  "can", "do", "does", "is", "are", "will", "should", "would", "could",
]);

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function diffBand(score) {
  if (score <= 14) return "very-easy";
  if (score <= 29) return "easy";
  if (score <= 49) return "possible";
  if (score <= 69) return "difficult";
  if (score <= 84) return "hard";
  return "very-hard";
}

function bandLabel(band) {
  return band.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ");
}

function bandGloss(band) {
  const m = {
    "very-easy": "Low competition — a new site with quality content can rank quickly.",
    easy: "Moderate effort needed — some backlinks and strong content required.",
    possible: "Competitive — solid authority and quality backlinks needed.",
    difficult: "Highly competitive — significant authority and backlinks required.",
    hard: "Very competitive — only high-authority sites rank well.",
    "very-hard": "Extremely competitive — dominated by major brands.",
  };
  return m[band] || "";
}

function trendFromMonthly(monthly) {
  if (!monthly || monthly.length < 6) return { dir: "flat", pct: 0 };
  const recent = monthly.slice(-3).reduce((s, m) => s + (m.search_volume ?? m.volume ?? 0), 0) / 3;
  const older = monthly.slice(-6, -3).reduce((s, m) => s + (m.search_volume ?? m.volume ?? 0), 0) / 3;
  if (older === 0) return { dir: "flat", pct: 0 };
  const pct = Math.round(((recent - older) / older) * 100);
  if (pct > 5) return { dir: "up", pct };
  if (pct < -5) return { dir: "down", pct };
  return { dir: "flat", pct };
}

function monthlyToTrend(monthly) {
  const arr = (monthly || []).slice(-12).map(m => m.search_volume ?? 0);
  while (arr.length < 12) arr.unshift(0);
  return arr;
}

function normaliseRank(rank) {
  if (!rank || rank <= 0) return 0;
  return Math.min(100, Math.round(rank / 10));
}

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
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await r.json();
  if (json.status_code && json.status_code !== 20000) {
    throw new Error(json.status_message || `DataForSEO error ${json.status_code}`);
  }
  return json.tasks || [];
}

function mapFeatureList(serpItemTypes) {
  const present = new Set();
  for (const t of serpItemTypes || []) {
    const k = DFS_TO_FEATURE[t];
    if (k) present.add(k);
  }
  return Object.keys(FEATURE_LABELS).map(key => ({
    key,
    label: FEATURE_LABELS[key],
    present: present.has(key),
    ownedByTop: present.has(key),
  }));
}

function featureKeysFromTypes(types) {
  const keys = [];
  const seen = new Set();
  for (const t of types || []) {
    const k = DFS_TO_FEATURE[t];
    if (k && !seen.has(k)) { seen.add(k); keys.push(k); }
  }
  return keys;
}

function makeIdea(kwData, matchType, idx) {
  const info = kwData.keyword_info || {};
  const props = kwData.keyword_properties || {};
  const intent = kwData.search_intent_info || {};
  const serp = kwData.serp_info || {};
  const kw = kwData.keyword || "";
  const d = props.keyword_difficulty ?? 0;

  return {
    id: `${matchType}-${idx}`,
    keyword: kw,
    matchType,
    volume: info.search_volume ?? 0,
    difficulty: d,
    difficultyBand: diffBand(d),
    intent: intent.main_intent || "informational",
    cpc: info.cpc ?? 0,
    competitiveDensity: info.competition ?? 0,
    results: serp.se_results_count ?? 0,
    trend: monthlyToTrend(info.monthly_searches),
    trendDir: trendFromMonthly(info.monthly_searches).dir,
    serpFeatures: featureKeysFromTypes(serp.serp_item_types),
    clusterId: "",
    branded: false,
    wordCount: kw.split(/\s+/).filter(Boolean).length,
  };
}

function buildClusters(ideas) {
  const map = new Map();
  for (const idea of ideas) {
    const words = idea.keyword.toLowerCase().split(/\s+/).filter(w => w.length > 2);
    const key = words.slice(0, 2).join(" ") || idea.keyword.toLowerCase();
    if (!map.has(key)) map.set(key, { ids: [], vol: 0, diff: 0, intents: {} });
    const c = map.get(key);
    c.ids.push(idea.id);
    c.vol += idea.volume;
    c.diff += idea.difficulty;
    c.intents[idea.intent] = (c.intents[idea.intent] || 0) + 1;
  }

  const clusters = [];
  let ci = 0;
  for (const [topic, c] of map) {
    if (c.ids.length < 2) continue;
    const id = `cluster-${ci++}`;
    const topIntent = Object.entries(c.intents).sort((a, b) => b[1] - a[1])[0]?.[0] || "informational";
    clusters.push({
      id,
      topic: topic.replace(/\b\w/g, ch => ch.toUpperCase()),
      keywordCount: c.ids.length,
      totalVolume: c.vol,
      avgDifficulty: Math.round(c.diff / c.ids.length),
      intent: topIntent,
    });
    for (const iid of c.ids) {
      const idea = ideas.find(x => x.id === iid);
      if (idea) idea.clusterId = id;
    }
  }
  clusters.sort((a, b) => b.totalVolume - a.totalVolume);
  return clusters.slice(0, 20);
}

function intentDistribution(mainIntent, foreignShare) {
  const share = 1 - (foreignShare || 0);
  const intents = ["informational", "commercial", "transactional", "navigational"];
  const dist = intents.map(i => ({ intent: i, share: i === mainIntent ? share : 0 }));
  const others = dist.filter(d => d.intent !== mainIntent);
  const remainder = foreignShare || 0;
  if (others.length > 0) {
    const each = remainder / others.length;
    others.forEach(d => { d.share = Math.round(each * 100) / 100; });
  }
  return dist;
}

export const researchKeyword = async (req, res) => {
  const t0 = Date.now();

  try {
    const { seed, country = "US" } = req.body;
    if (!seed?.trim()) return res.status(400).json({ success: false, message: "Keyword is required" });

    const cc = COUNTRIES[country];
    if (!cc) return res.status(400).json({ success: false, message: "Invalid country code" });

    const headers = await getHeaders();
    if (!headers) return res.status(400).json({ success: false, message: "No active DataForSEO API key. Add one in Admin → API Keys." });

    const keyword = seed.trim().toLowerCase();
    const { location_code, language_code } = cc;

    const overviewCodes = [country, ...GLOBAL_COUNTRIES.filter(c => c !== country)].slice(0, 5);
    const overviewBody = overviewCodes.map(c => ({
      keywords: [keyword],
      location_code: COUNTRIES[c].location_code,
      language_code: COUNTRIES[c].language_code,
    }));

    const [ovRes, sugRes, relRes, serpRes] = await Promise.allSettled([
      dfs("dataforseo_labs/google/keyword_overview/live", overviewBody, headers),
      dfs("dataforseo_labs/google/keyword_suggestions/live", [{
        keyword, location_code, language_code, limit: 200, include_serp_info: true,
      }], headers),
      dfs("dataforseo_labs/google/related_keywords/live", [{
        keyword, location_code, language_code, limit: 100, include_serp_info: true,
      }], headers),
      dfs("serp/google/organic/live/advanced", [{
        keyword, location_code, language_code, depth: 10,
      }], headers),
    ]);

    if (ovRes.status === "rejected") {
      console.error("Keyword overview failed:", ovRes.reason?.message);
      return res.status(500).json({ success: false, message: ovRes.reason?.message || "DataForSEO API call failed" });
    }
    const ovTasks = ovRes.value || [];
    const primary = ovTasks[0]?.result?.[0]?.items?.[0];
    if (!primary) {
      const taskErr = ovTasks[0]?.status_message;
      console.error("No keyword data. Task response:", JSON.stringify(ovTasks[0] || {}));
      return res.status(500).json({ success: false, message: taskErr || "No data returned for this keyword. Check if the keyword is valid." });
    }

    const kwInfo = primary.keyword_info || {};
    const kwProps = primary.keyword_properties || {};
    const siInfo = primary.search_intent_info || {};
    const spInfo = primary.serp_info || {};
    const avgBL = primary.avg_backlinks_info || {};
    const monthly = kwInfo.monthly_searches || [];

    const volume = kwInfo.search_volume ?? 0;
    const diff = kwProps.keyword_difficulty ?? 0;
    const band = diffBand(diff);
    const { dir: tDir, pct: tPct } = trendFromMonthly(monthly);

    const prevMonth = monthly.length >= 2 ? monthly[monthly.length - 2] : null;
    const currMonth = monthly.length >= 1 ? monthly[monthly.length - 1] : null;
    let volDeltaVal = 0;
    if (prevMonth && currMonth && (prevMonth.search_volume ?? 0) > 0) {
      volDeltaVal = Math.round(((currMonth.search_volume - prevMonth.search_volume) / prevMonth.search_volume) * 100);
    }

    const byCountry = [];
    let globalVol = 0;
    for (let i = 0; i < overviewCodes.length; i++) {
      const task = ovTasks[i];
      const r = task?.result?.[0]?.items?.[0];
      if (!r) continue;
      const cInfo = r.keyword_info || {};
      const cProps = r.keyword_properties || {};
      const vol = cInfo.search_volume ?? 0;
      globalVol += vol;
      const cCode = overviewCodes[i];
      byCountry.push({
        country: { code: COUNTRIES[cCode].code, name: COUNTRIES[cCode].name, flag: COUNTRIES[cCode].flag, database: COUNTRIES[cCode].database },
        volume: vol,
        share: 0,
        difficulty: cProps.keyword_difficulty ?? 0,
        cpc: cInfo.cpc ?? 0,
      });
    }
    if (globalVol > 0) byCountry.forEach(c => { c.share = Math.round((c.volume / globalVol) * 100) / 100; });
    byCountry.sort((a, b) => b.volume - a.volume);

    const trendArr = monthlyToTrend(monthly);

    const seasonalMonthly = monthly.slice(-12).map(m => ({
      month: MONTH_NAMES[(m.month ?? 1) - 1] || "Jan",
      year: m.year ?? 2024,
      volume: m.search_volume ?? 0,
    }));
    while (seasonalMonthly.length < 12) seasonalMonthly.unshift({ month: "Jan", year: 2024, volume: 0 });

    let peakMonth = "Jan", lowMonth = "Jan", peakVol = -1, lowVol = Infinity;
    for (const m of seasonalMonthly) {
      if (m.volume > peakVol) { peakVol = m.volume; peakMonth = m.month; }
      if (m.volume < lowVol) { lowVol = m.volume; lowMonth = m.month; }
    }
    const firstHalf = seasonalMonthly.slice(0, 6).reduce((s, m) => s + m.volume, 0) / 6;
    const secondHalf = seasonalMonthly.slice(6).reduce((s, m) => s + m.volume, 0) / 6;
    const yoy = firstHalf > 0 ? Math.round(((secondHalf - firstHalf) / firstHalf) * 100) : 0;

    const serpTasks = serpRes.status === "fulfilled" ? serpRes.value : [];
    const serpItems = serpTasks[0]?.result?.[0]?.items || [];

    const organics = serpItems.filter(i => i.type === "organic").slice(0, 10);
    const nonOrganicDomains = new Map();
    for (const item of serpItems) {
      if (item.type !== "organic" && item.domain) {
        const fk = DFS_TO_FEATURE[item.type];
        if (fk) {
          if (!nonOrganicDomains.has(item.domain)) nonOrganicDomains.set(item.domain, []);
          nonOrganicDomains.get(item.domain).push(fk);
        }
      }
    }

    const serpAnalysis = organics.map((item, idx) => {
      const bl = item.backlinks_info || {};
      const features = nonOrganicDomains.get(item.domain) || [];
      const pos = item.rank_group ?? (idx + 1);
      const ctr = POSITION_CTR[Math.min(pos - 1, 9)] ?? 0.01;
      return {
        position: pos,
        url: item.url || "",
        domain: item.domain || "",
        title: item.title || "",
        favicon: item.domain || "",
        pageAuthority: normaliseRank(bl.rank),
        domainAuthority: normaliseRank(bl.main_domain_rank),
        referringDomains: bl.referring_domains ?? 0,
        backlinks: bl.backlinks ?? 0,
        trafficShare: Math.round(ctr * 1000) / 1000,
        estTraffic: Math.round(volume * ctr),
        urlKeywords: 0,
        features,
      };
    });

    let totalRD = 0, totalPA = 0, totalDA = 0, strongCount = 0;
    for (const s of serpAnalysis) {
      totalRD += s.referringDomains;
      totalPA += s.pageAuthority;
      totalDA += s.domainAuthority;
      if (s.domainAuthority >= 60) strongCount++;
    }
    const n = serpAnalysis.length || 1;

    const sugTasks = sugRes.status === "fulfilled" ? sugRes.value : [];
    const sugItems = sugTasks[0]?.result?.[0]?.items || [];

    const relTasks = relRes.status === "fulfilled" ? relRes.value : [];
    const relItems = relTasks[0]?.result?.[0]?.items || [];

    const broad = [];
    const phrase = [];
    const questions = [];
    let bIdx = 0, pIdx = 0, qIdx = 0;

    for (const item of sugItems) {
      const kd = item.keyword_data || item;
      const kw = (kd.keyword || "").toLowerCase();
      if (!kw) continue;
      const firstWord = kw.split(/\s+/)[0];
      if (QUESTION_WORDS.has(firstWord)) {
        questions.push(makeIdea(kd, "questions", qIdx++));
      } else if (kw.includes(keyword) && kw !== keyword) {
        phrase.push(makeIdea(kd, "phrase", pIdx++));
      } else {
        broad.push(makeIdea(kd, "broad", bIdx++));
      }
    }

    const related = [];
    let rIdx = 0;
    for (const item of relItems) {
      const kd = item.keyword_data || item;
      if (!kd.keyword) continue;
      related.push(makeIdea(kd, "related", rIdx++));
    }

    const exactIdea = makeIdea({
      keyword,
      keyword_info: kwInfo,
      keyword_properties: kwProps,
      search_intent_info: siInfo,
      serp_info: spInfo,
    }, "exact", 0);
    const exact = [exactIdea];

    const allIdeas = [...broad, ...phrase, ...exact, ...related, ...questions];
    const clusters = buildClusters(allIdeas);

    const quickWins = allIdeas
      .filter(i => i.difficulty <= 30 && i.volume >= 100)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 20);

    const brandedCount = allIdeas.filter(i => i.branded).length;
    const totalIdeas = allIdeas.length || 1;

    const computeTotals = (arr) => ({
      count: arr.length,
      totalVolume: arr.reduce((s, i) => s + i.volume, 0),
    });

    const mainIntent = siInfo.main_intent || "informational";

    const result = {
      seed: keyword,
      resolvedKeyword: keyword,
      country: { code: cc.code, name: cc.name, flag: cc.flag, database: cc.database },
      currency: cc.currency,
      updatedAt: new Date().toISOString(),
      overview: {
        volume,
        volumeDelta: { value: volDeltaVal, period: "vs last month" },
        volumeTrend: trendArr,
        globalVolume: globalVol || volume,
        difficulty: { score: diff, band, label: bandLabel(band), gloss: bandGloss(band) },
        intent: { primary: mainIntent, distribution: intentDistribution(mainIntent, siInfo.foreign_intent_share) },
        cpc: {
          value: kwInfo.cpc ?? 0,
          currency: cc.currency,
          low: kwInfo.low_top_of_page_bid ?? 0,
          high: kwInfo.high_top_of_page_bid ?? 0,
        },
        competitiveDensity: kwInfo.competition ?? 0,
        adResults: 0,
        plaResults: 0,
        serpResults: spInfo.se_results_count ?? 0,
        trend: tDir,
        trendPct: tPct,
      },
      difficultyFactors: {
        score: diff,
        band,
        label: bandLabel(band),
        avgReferringDomains: Math.round(avgBL.referring_main_domains ?? (totalRD / n)),
        avgPageAuthority: normaliseRank(avgBL.rank) || Math.round(totalPA / n),
        avgDomainAuthority: normaliseRank(avgBL.main_domain_rank) || Math.round(totalDA / n),
        strongDomainsShare: serpAnalysis.length > 0 ? Math.round((strongCount / serpAnalysis.length) * 100) / 100 : 0,
        backlinksNeededEstimate: Math.round(avgBL.backlinks ?? (totalRD / n) * 2),
      },
      seasonality: {
        monthly: seasonalMonthly,
        peakMonth,
        lowMonth,
        yoyChange: yoy,
        note: peakVol > 0 ? `Peaks in ${peakMonth}` : "Stable year-round",
      },
      byCountry,
      serpFeatures: mapFeatureList(spInfo.serp_item_types),
      serpAnalysis,
      ideas: { broad, phrase, exact, related, questions },
      ideaTotals: {
        broad: computeTotals(broad),
        phrase: computeTotals(phrase),
        exact: computeTotals(exact),
        related: computeTotals(related),
        questions: computeTotals(questions),
      },
      quickWins,
      clusters,
      brandedSplit: {
        branded: Math.round((brandedCount / totalIdeas) * 100) / 100,
        nonBranded: Math.round(((totalIdeas - brandedCount) / totalIdeas) * 100) / 100,
      },
      meta: {
        latencyMs: Date.now() - t0,
        source: "dataforseo",
        ideasCount: allIdeas.length,
        questionsCount: questions.length,
        totalVolume: allIdeas.reduce((s, i) => s + i.volume, 0),
      },
    };

    return res.status(200).json({ success: true, data: result });
  } catch (error) {
    console.error("Keyword research error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

/* ═══════════════════════════════════════════════════════════════
   AI Keyword Analysis — opportunity scoring + OpenAI insights
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

// Deterministic opportunity score (0–100).
// Formula:
//   Demand (25%)  — log-normalised search volume vs dataset max
//   Ease   (30%)  — inverted difficulty (lower KD = more opportunity)
//   Value  (15%)  — CPC relative to dataset max
//   Intent (15%)  — transactional > commercial > informational > navigational
//   Gap    (15%)  — inverted competitive density
//   Trend  bonus  — +5 for rising, −3 for declining
function computeOpportunityScore(idea, maxVolume, maxCpc) {
  const demand = maxVolume > 1
    ? Math.log10(Math.max(1, idea.volume)) / Math.log10(maxVolume)
    : 0;

  const ease = (100 - Math.min(100, idea.difficulty)) / 100;

  const value = maxCpc > 0 ? Math.min(1, idea.cpc / maxCpc) : 0;

  const intentW = { transactional: 1, commercial: 0.75, informational: 0.35, navigational: 0.15 };
  const intentBoost = intentW[idea.intent] || 0.35;

  const gap = 1 - Math.min(1, idea.competitiveDensity || 0);

  const trendBonus = idea.trendDir === "up" ? 0.05 : idea.trendDir === "down" ? -0.03 : 0;

  const raw = demand * 0.25 + ease * 0.30 + value * 0.15 + intentBoost * 0.15 + gap * 0.15 + trendBonus;
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export const analyzeKeywords = async (req, res) => {
  try {
    const { websiteId, seed, overview, ideas, serpAnalysis, clusters } = req.body;

    if (!seed?.trim()) return res.status(400).json({ success: false, message: "Keyword is required" });
    if (!ideas?.length) return res.status(400).json({ success: false, message: "No keyword data to analyze" });

    // ── 1. Score every idea ──
    const maxVolume = Math.max(...ideas.map(i => i.volume || 0), 1);
    const maxCpc = Math.max(...ideas.map(i => i.cpc || 0), 0.01);

    const scores = {};
    for (const idea of ideas) {
      scores[idea.id] = computeOpportunityScore(idea, maxVolume, maxCpc);
    }

    // ── 2. Curate top keywords for AI context (cost control) ──
    const scored = ideas
      .map(i => ({ ...i, opportunityScore: scores[i.id] }))
      .sort((a, b) => b.opportunityScore - a.opportunityScore);

    const topKws = scored.slice(0, 30);
    const qwKws = scored.filter(i => i.difficulty <= 30 && i.volume >= 100).slice(0, 10);

    // ── 3. Get OpenAI client ──
    const openai = await getOpenAIClient();
    if (!openai) {
      return res.status(200).json({
        success: true,
        data: { scores, insights: null, noApiKey: true },
      });
    }

    // ── 4. Build prompt ──
    const kwTable = topKws
      .map(k => `${k.keyword} | Vol:${k.volume} | KD:${k.difficulty} | CPC:$${(k.cpc ?? 0).toFixed(2)} | ${k.intent} | Score:${k.opportunityScore}`)
      .join("\n");

    const qwList = qwKws.length
      ? qwKws.map(k => `${k.keyword} (Vol:${k.volume}, KD:${k.difficulty})`).join(", ")
      : "None";

    const clusterText = (clusters || []).slice(0, 10)
      .map(c => `"${c.topic}" — ${c.keywordCount} kws, vol ${c.totalVolume}, avgKD ${c.avgDifficulty}`)
      .join("\n");

    const serpText = (serpAnalysis || []).slice(0, 5)
      .map(s => `#${s.position} ${s.domain} (DA:${s.domainAuthority}, RD:${s.referringDomains})`)
      .join("\n");

    const systemPrompt = `You are an expert SEO strategist. Analyze the keyword research data and produce actionable intelligence.

RULES:
- Base ALL analysis on the actual data — never invent volumes, difficulty, CPC, rankings, or URLs.
- Reference specific keywords from the data when making recommendations.
- Focus on actionable, specific advice — not generic SEO tips.

Respond with a JSON object:
{
  "summary": "2-3 sentence strategic overview of the keyword landscape",
  "priorityKeywords": [
    { "keyword": "from data", "priority": "high|medium|low", "reason": "cite metrics", "recommendedAction": "specific action" }
  ],
  "quickWins": [
    { "keyword": "from data", "reason": "why quick win", "estimatedEffort": "low|medium|high", "recommendedAction": "action" }
  ],
  "contentOpportunities": [
    { "type": "new-page|optimize-existing", "title": "page title", "targetKeywords": ["kw1","kw2"], "reason": "why", "contentType": "pillar-page|blog-post|landing-page|faq|comparison|guide" }
  ],
  "keywordClusters": [
    { "theme": "topic", "keywords": ["kw1","kw2"], "strategy": "approach", "contentType": "format" }
  ],
  "recommendations": [
    { "priority": "high|medium|low", "action": "do this", "reason": "because", "impact": "expected result" }
  ]
}

Return 5-8 priority keywords, 3-5 quick wins, 3-5 content opportunities, 3-5 clusters, 5-8 recommendations. All keywords must come from the data.`;

    const userPrompt = `Seed keyword: "${seed}"

OVERVIEW:
Volume: ${overview?.volume ?? "N/A"} | KD: ${overview?.difficulty?.score ?? "N/A"}/100 (${overview?.difficulty?.band ?? ""}) | CPC: $${(overview?.cpc?.value ?? 0).toFixed(2)} | Intent: ${overview?.intent?.primary ?? "N/A"} | Competitive Density: ${((overview?.competitiveDensity ?? 0) * 100).toFixed(0)}% | Trend: ${overview?.trend ?? "flat"} (${overview?.trendPct ?? 0}%)

TOP OPPORTUNITIES (by score):
${kwTable}

QUICK WINS (KD≤30, Vol≥100):
${qwList}

CLUSTERS:
${clusterText || "None"}

SERP (top domains):
${serpText || "No data"}

Provide strategic SEO analysis.`;

    // ── 5. Call OpenAI ──
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

    // ── 6. Track usage ──
    if (websiteId) {
      await logAIUsage(req.user, websiteId, "keyword-analysis", completion);
    }

    // ── 7. Parse & validate AI response ──
    let insights = null;
    try {
      const raw = completion.choices?.[0]?.message?.content;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.summary && Array.isArray(parsed.priorityKeywords)) {
          insights = {
            summary: String(parsed.summary),
            priorityKeywords: (parsed.priorityKeywords || []).slice(0, 10),
            quickWins: (parsed.quickWins || []).slice(0, 8),
            contentOpportunities: (parsed.contentOpportunities || []).slice(0, 8),
            keywordClusters: (parsed.keywordClusters || []).slice(0, 8),
            recommendations: (parsed.recommendations || []).slice(0, 10),
          };
        }
      }
    } catch (parseErr) {
      console.error("Failed to parse AI keyword response:", parseErr.message);
    }

    return res.status(200).json({ success: true, data: { scores, insights } });
  } catch (error) {
    console.error("AI keyword analysis error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
