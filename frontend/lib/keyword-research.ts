/* ── contract types ── */
export type CountryCode =
  | "US" | "GB" | "DE" | "FR" | "ES" | "IT"
  | "CA" | "AU" | "IN" | "BR" | "NL" | "JP"

export type Intent = "informational" | "commercial" | "transactional" | "navigational"

export type DifficultyBand =
  | "very-easy" | "easy" | "possible" | "difficult" | "hard" | "very-hard"

export type MatchType = "broad" | "phrase" | "exact" | "related" | "questions"

export type TrendDir = "up" | "down" | "flat"

export type SerpFeatureKey =
  | "featured_snippet" | "people_also_ask" | "sitelinks" | "video"
  | "image_pack" | "reviews" | "top_ads" | "bottom_ads" | "shopping"
  | "knowledge_panel" | "local_pack" | "faq" | "top_stories"

export interface Country {
  code: CountryCode
  name: string
  flag: string
  database: string // 'google:en-GB' — DataForSEO location:language handle
}

export interface MonthlyVolume {
  month: string // 'Jan'
  year: number
  volume: number
}

export interface Delta {
  value: number // signed %
  period: string // 'vs last month'
}

export interface Cpc {
  value: number
  currency: string
  low: number
  high: number
}

export interface DifficultyMeta {
  score: number // 0..100
  band: DifficultyBand
  label: string // 'Difficult' — display word, ALWAYS paired with color
  gloss: string // plain-English one-liner
}

export interface IntentSlice {
  intent: Intent
  share: number // 0..1, slices sum to 1
}

export interface KeywordOverview {
  volume: number
  volumeDelta: Delta
  volumeTrend: number[] // 12 monthly values
  globalVolume: number
  difficulty: DifficultyMeta
  intent: { primary: Intent; distribution: IntentSlice[] }
  cpc: Cpc
  competitiveDensity: number // 0..1
  adResults: number
  plaResults: number
  serpResults: number
  trend: TrendDir
  trendPct: number // signed % over the window
}

export interface DifficultyFactors {
  score: number
  band: DifficultyBand
  label: string
  avgReferringDomains: number
  avgPageAuthority: number
  avgDomainAuthority: number
  strongDomainsShare: number // 0..1
  backlinksNeededEstimate: number
}

export interface Seasonality {
  monthly: MonthlyVolume[] // exactly 12, oldest→newest
  peakMonth: string
  lowMonth: string
  yoyChange: number // signed %
  note: string
}

export interface CountryVolume {
  country: Country
  volume: number
  share: number // 0..1
  difficulty: number // 0..100
  cpc: number
}

export interface SerpFeature {
  key: SerpFeatureKey
  label: string
  present: boolean
  ownedByTop?: boolean
}

export interface SerpResultRow {
  position: number
  url: string
  domain: string
  title: string
  favicon: string // domain — rendered as a letter tile (no network)
  pageAuthority: number
  domainAuthority: number
  referringDomains: number
  backlinks: number
  trafficShare: number // 0..1
  estTraffic: number
  urlKeywords: number
  features: SerpFeatureKey[]
}

export interface KeywordIdea {
  id: string
  keyword: string
  matchType: MatchType
  volume: number
  difficulty: number
  difficultyBand: DifficultyBand
  intent: Intent
  cpc: number
  competitiveDensity: number
  results: number
  trend: number[] // 12-pt sparkline
  trendDir: TrendDir
  serpFeatures: SerpFeatureKey[]
  clusterId: string
  branded: boolean
  wordCount: number
}

export interface Cluster {
  id: string
  topic: string
  keywordCount: number
  totalVolume: number
  avgDifficulty: number
  intent: Intent
}

export interface MatchTypeTotals {
  count: number
  totalVolume: number
}

export interface KeywordResearchResult {
  seed: string
  resolvedKeyword: string
  country: Country
  currency: string
  updatedAt: string // ISO
  overview: KeywordOverview
  difficultyFactors: DifficultyFactors
  seasonality: Seasonality
  byCountry: CountryVolume[]
  serpFeatures: SerpFeature[]
  serpAnalysis: SerpResultRow[]
  ideas: Record<MatchType, KeywordIdea[]>
  ideaTotals: Record<MatchType, MatchTypeTotals>
  quickWins: KeywordIdea[]
  clusters: Cluster[]
  brandedSplit: { branded: number; nonBranded: number }
  meta: {
    latencyMs: number
    source: "mock" | "dataforseo"
    ideasCount: number
    questionsCount: number
    totalVolume: number
  }
}

/* ── AI analysis types ── */

export interface AIKeywordPriority {
  keyword: string
  priority: "high" | "medium" | "low"
  reason: string
  recommendedAction: string
}

export interface AIQuickWin {
  keyword: string
  reason: string
  estimatedEffort: "low" | "medium" | "high"
  recommendedAction: string
}

export interface AIContentOpportunity {
  type: "new-page" | "optimize-existing"
  title: string
  targetKeywords: string[]
  reason: string
  contentType: string
}

export interface AIKeywordCluster {
  theme: string
  keywords: string[]
  strategy: string
  contentType: string
}

export interface AIRecommendation {
  priority: "high" | "medium" | "low"
  action: string
  reason: string
  impact: string
}

export interface KeywordAIAnalysis {
  scores: Record<string, number>
  insights: {
    summary: string
    priorityKeywords: AIKeywordPriority[]
    quickWins: AIQuickWin[]
    contentOpportunities: AIContentOpportunity[]
    keywordClusters: AIKeywordCluster[]
    recommendations: AIRecommendation[]
  } | null
  noApiKey?: boolean
}

/* ── reference data ── */
export const COUNTRIES: Country[] = [
  { code: "US", name: "United States", flag: "🇺🇸", database: "google:en-US" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧", database: "google:en-GB" },
  { code: "CA", name: "Canada", flag: "🇨🇦", database: "google:en-CA" },
  { code: "AU", name: "Australia", flag: "🇦🇺", database: "google:en-AU" },
  { code: "IN", name: "India", flag: "🇮🇳", database: "google:en-IN" },
  { code: "DE", name: "Germany", flag: "🇩🇪", database: "google:de-DE" },
  { code: "FR", name: "France", flag: "🇫🇷", database: "google:fr-FR" },
  { code: "ES", name: "Spain", flag: "🇪🇸", database: "google:es-ES" },
  { code: "IT", name: "Italy", flag: "🇮🇹", database: "google:it-IT" },
  { code: "BR", name: "Brazil", flag: "🇧🇷", database: "google:pt-BR" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱", database: "google:nl-NL" },
  { code: "JP", name: "Japan", flag: "🇯🇵", database: "google:ja-JP" },
]

export const COUNTRY_BY_CODE: Record<CountryCode, Country> = COUNTRIES.reduce(
  (acc, c) => ((acc[c.code] = c), acc),
  {} as Record<CountryCode, Country>
)

/* fixed status palette (Keyword Difficulty) — never themed */
export const KD_COLORS = {
  "very-easy": "#0ca30c",
  easy: "#0ca30c",
  possible: "#fab219",
  difficult: "#ec835a",
  hard: "#d03b3b",
  "very-hard": "#d03b3b",
} as const

export const BAND_LABEL: Record<DifficultyBand, string> = {
  "very-easy": "Very Easy",
  easy: "Easy",
  possible: "Possible",
  difficult: "Difficult",
  hard: "Hard",
  "very-hard": "Very Hard",
}

/* fixed categorical intent palette — never themed. [light, dark] */
export const INTENT_META: Record<
  Intent,
  { label: string; abbr: string; light: string; dark: string; desc: string }
> = {
  informational: { label: "Informational", abbr: "I", light: "#2a78d6", dark: "#3987e5", desc: "The user wants to learn" },
  commercial: { label: "Commercial", abbr: "C", light: "#eb6834", dark: "#d95926", desc: "The user is comparing options" },
  transactional: { label: "Transactional", abbr: "T", light: "#1baf7a", dark: "#199e70", desc: "The user wants to buy or act" },
  navigational: { label: "Navigational", abbr: "N", light: "#eda100", dark: "#c98500", desc: "The user wants a specific site" },
}

export const SERP_FEATURE_LABEL: Record<SerpFeatureKey, string> = {
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
}

/* ── formatting utils (format at render, keep raw in the model) ── */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return "—"
  const abs = Math.abs(n)
  if (abs >= 1_000_000) return (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M"
  if (abs >= 1_000) return (n / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K"
  return n.toLocaleString("en-US")
}
export function full(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—"
}
export function money(n: number, currency = "USD"): string {
  const sym = currency === "USD" ? "$" : currency === "GBP" ? "£" : currency === "EUR" ? "€" : "$"
  return `${sym}${n.toFixed(2)}`
}
export function bandOf(score: number): DifficultyBand {
  if (score < 15) return "very-easy"
  if (score < 30) return "easy"
  if (score < 50) return "possible"
  if (score < 70) return "difficult"
  if (score < 85) return "hard"
  return "very-hard"
}

