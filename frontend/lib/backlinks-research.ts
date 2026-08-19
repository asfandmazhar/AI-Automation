import type { AnchorRow, AuthorityBucketKey } from "./competitor-research"

export type LinkType = "text" | "image" | "redirect" | "form"

export type ReferringDomain = {
  domain: string
  authority: number
  backlinks: number
  type: LinkType
  dofollow: boolean
  firstSeen: string
}

export type TopBacklink = {
  sourceDomain: string
  sourceUrl: string
  authority: number
  anchor: string
  targetPath: string
  type: LinkType
  dofollow: boolean
  firstSeen: string
}

export type FlowPoint = { month: string; gained: number; lost: number }

export type BacklinksExtra = {
  referringSubnets: number
  referringPages: number
  brokenBacklinks: number
  brokenPages: number
  internalLinksCount: number
  externalLinksCount: number
  crawledPages: number
  tld: Record<string, number>
  platformTypes: Record<string, number>
  semanticLocations: Record<string, number>
  countries: Record<string, number>
}

export type BacklinksProfile = {
  domain: string
  authorityScore: number
  totalBacklinks: number
  referringDomains: number
  referringIps: number
  dofollowShare: number
  newLast30: number
  lostLast30: number
  toxicShare: number
  updatedAt: string
  flow: FlowPoint[]
  types: { text: number; image: number; redirect: number; form: number }
  attributes: { follow: number; nofollow: number }
  anchors: AnchorRow[]
  authorityBuckets: Record<AuthorityBucketKey, number>
  referring: ReferringDomain[]
  topBacklinks: TopBacklink[]
  extra?: BacklinksExtra
}

/* ── AI Backlink Intelligence types ── */

export interface AIBacklinkStrength {
  strength: string
  evidence: string
  impact: string
}

export interface AIBacklinkWeakness {
  weakness: string
  evidence: string
  severity: "high" | "medium" | "low"
  action: string
}

export interface AILostLinkPriority {
  priority: "high" | "medium" | "low"
  observation: string
  reason: string
  action: string
}

export interface AIAnchorInsight {
  observation: string
  assessment: "healthy" | "review" | "concern"
  currentState: string
  recommendation: string
}

export interface AILinkBuildingRecommendation {
  strategy: string
  targetType: "content-marketing" | "outreach" | "digital-pr" | "resource-pages" | "broken-link" | "guest-posting" | "directories"
  reason: string
  priority: "high" | "medium" | "low"
  estimatedEffort: "low" | "medium" | "high"
}

export interface AIBacklinkPriorityAction {
  rank: number
  action: string
  reason: string
  timeline: "immediate" | "short-term" | "medium-term" | "long-term"
  impact: "high" | "medium" | "low"
}

export interface BacklinkAIAnalysis {
  healthScore: number
  referringScores: Record<string, number>
  insights: {
    summary: string
    backlinkStrengths: AIBacklinkStrength[]
    backlinkWeaknesses: AIBacklinkWeakness[]
    lostLinkPriorities: AILostLinkPriority[]
    anchorInsights: AIAnchorInsight[]
    linkBuildingRecommendations: AILinkBuildingRecommendation[]
    priorities: AIBacklinkPriorityAction[]
  } | null
  noApiKey?: boolean
}

