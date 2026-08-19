export type CategoryCount = { name: string; value: number }

export type AuthorityBucketKey =
  | "81-100"
  | "61-80"
  | "41-60"
  | "21-40"
  | "0-20"

export const AUTHORITY_BUCKETS: AuthorityBucketKey[] = [
  "81-100",
  "61-80",
  "41-60",
  "21-40",
  "0-20",
]

export type CRDomain = {
  id: string
  domain: string
  isYou?: boolean
  /** chart series colour — falls back to the theme primary for "you" */
  color?: string

  /* headline metrics */
  authorityScore: number // 0–100
  referringDomains: number
  backlinks: number
  referringIps: number
  monthlyVisits: number
  organicTraffic: number
  organicKeywords: number
  dofollowShare: number // 0–1

  /* 12-month history (oldest → newest) */
  authorityTrend: number[]
  refDomainsTrend: number[]

  /* backlink profile splits (each set sums to ~1) */
  types: { text: number; image: number; form: number; frame: number }
  attributes: { follow: number; nofollow: number }

  /* referring-domain make-up */
  categories: CategoryCount[]
  authorityBuckets: Record<AuthorityBucketKey, number>
}

export type BacklinkGapRow = {
  domain: string
  authority: number
  monthlyVisits: number
  /** how many links this source gives each domain, keyed by domain id */
  links: Record<string, number>
}

export type AnchorRow = {
  text: string
  type: "branded" | "keyword" | "url" | "generic" | "empty"
  share: number // 0–1
  backlinks: number
}

export type CompetitorDataset = {
  you: CRDomain
  competitors: CRDomain[]
  months: string[]
  opportunities: BacklinkGapRow[]
  anchors: AnchorRow[]
  updatedAt: string
}

/* ── AI Competitor Intelligence types ── */

export interface AICompetitorInsight {
  competitor: string
  threatLevel: "high" | "medium" | "low"
  keyStrength: string
  keyWeakness: string
  strategy: string
}

export interface AIBacklinkGap {
  priority: "high" | "medium" | "low"
  gap: string
  impact: string
  action: string
}

export interface AICompetitorQuickWin {
  action: string
  target: string
  reason: string
  estimatedEffort: "low" | "medium" | "high"
  expectedImpact: string
}

export interface AIContentGap {
  type: "new-content" | "outreach" | "guest-post" | "resource-page"
  title: string
  targetDomains: string[]
  reason: string
  priority: "high" | "medium" | "low"
}

export interface AIAnchorRecommendation {
  type: "branded" | "keyword" | "url" | "generic"
  currentShare: number
  targetShare: number
  action: string
}

export interface AIAnchorStrategy {
  currentAssessment: string
  recommendations: AIAnchorRecommendation[]
}

export interface AIPriorityAction {
  rank: number
  action: string
  reason: string
  timeline: "short-term" | "medium-term" | "long-term"
  impact: "high" | "medium" | "low"
}

export interface CompetitorAIAnalysis {
  gaps: Record<string, number>
  insights: {
    summary: string
    competitorInsights: AICompetitorInsight[]
    backlinkGaps: AIBacklinkGap[]
    quickWins: AICompetitorQuickWin[]
    contentGaps: AIContentGap[]
    anchorStrategy: AIAnchorStrategy | null
    priorityActions: AIPriorityAction[]
  } | null
  noApiKey?: boolean
}

/* ── categorical series palette — fixed hues that read on light & dark ── */
export const SERIES_COLORS = [
  "#14b8a6", // teal
  "#f59e0b", // amber
  "#3b82f6", // blue
  "#ec4899", // pink
  "#8b5cf6", // violet
] as const

/* the "you" series uses the live brand token so it always pops */
export const YOU_COLOR = "var(--primary)"

/* ── formatting (format at render, keep raw in the model) ── */
export function compact(n: number): string {
  if (!Number.isFinite(n)) return "—"
  const abs = Math.abs(n)
  if (abs >= 1_000_000)
    return (n / 1_000_000).toFixed(abs >= 10_000_000 ? 0 : 1).replace(/\.0$/, "") + "M"
  if (abs >= 1_000)
    return (n / 1_000).toFixed(abs >= 10_000 ? 0 : 1).replace(/\.0$/, "") + "K"
  return n.toLocaleString("en-US")
}
export function full(n: number): string {
  return Number.isFinite(n) ? Math.round(n).toLocaleString("en-US") : "—"
}
export function pct(n: number): string {
  return `${Math.round(n * 100)}%`
}

/* Authority Score band → fixed status colour (never themed) */
export function authorityColor(score: number): string {
  if (score >= 80) return "#0ca30c"
  if (score >= 60) return "#5bb318"
  if (score >= 40) return "#fab219"
  if (score >= 20) return "#ec835a"
  return "#d03b3b"
}
export function authorityBand(score: number): string {
  if (score >= 80) return "Excellent"
  if (score >= 60) return "Strong"
  if (score >= 40) return "Fair"
  if (score >= 20) return "Weak"
  return "Poor"
}

/* map an anchor type to a fixed hue (never themed) */
export const ANCHOR_COLORS: Record<AnchorRow["type"], string> = {
  branded: "#7E3BED",
  keyword: "#14b8a6",
  url: "#3b82f6",
  generic: "#f59e0b",
  empty: "#a3a3a3",
}
export const ANCHOR_LABELS: Record<AnchorRow["type"], string> = {
  branded: "Branded",
  keyword: "Keyword",
  url: "Naked URL",
  generic: "Generic",
  empty: "Empty / image",
}
