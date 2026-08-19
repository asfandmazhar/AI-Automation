"use client"

import { useState } from "react"
import {
  Sparkles, Shield, Zap, FileText, Anchor, ListOrdered,
  ArrowRight, Loader2, AlertTriangle, Link2,
} from "lucide-react"
import type {
  CompetitorDataset, CompetitorAIAnalysis,
  AICompetitorInsight, AIBacklinkGap, AICompetitorQuickWin,
  AIContentGap, AIAnchorStrategy, AIPriorityAction,
} from "@/lib/competitor-research"
import { compact } from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/ai/keyword-research/primitives"

/* ── priority / effort / threat colour helpers ── */

const PRIORITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "#ef444420", text: "#ef4444", label: "High" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Medium" },
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low" },
}

const THREAT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "#ef444420", text: "#ef4444", label: "High threat" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Med threat" },
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low threat" },
}

const EFFORT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low effort" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Med effort" },
  high:   { bg: "#ef444420", text: "#ef4444", label: "High effort" },
}

const TIMELINE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  "short-term":  { bg: "#22c55e20", text: "#22c55e", label: "Short-term" },
  "medium-term": { bg: "#f59e0b20", text: "#f59e0b", label: "Medium-term" },
  "long-term":   { bg: "#3b82f620", text: "#3b82f6", label: "Long-term" },
}

const CONTENT_GAP_TYPE_LABEL: Record<string, string> = {
  "new-content":   "New Content",
  outreach:        "Outreach",
  "guest-post":    "Guest Post",
  "resource-page": "Resource Page",
}

function Badge({ bg, text, label }: { bg: string; text: string; label: string }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  )
}

function GapBar({ score }: { score: number }) {
  const color = score >= 70 ? "#ef4444" : score >= 40 ? "#f59e0b" : "#22c55e"
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 rounded-full bg-[color:var(--muted)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

/* ── tabs ── */

const TABS = [
  { key: "competitors", icon: Shield,      label: "Competitor Insights" },
  { key: "gaps",        icon: Link2,       label: "Backlink Gaps" },
  { key: "quickwins",   icon: Zap,         label: "Quick Wins" },
  { key: "content",     icon: FileText,    label: "Content Gaps" },
  { key: "anchors",     icon: Anchor,      label: "Anchor Strategy" },
  { key: "actions",     icon: ListOrdered, label: "Priority Actions" },
] as const

type TabKey = (typeof TABS)[number]["key"]

/* ── tab panels ── */

function CompetitorInsightsPanel({ items, gaps }: { items: AICompetitorInsight[]; gaps: Record<string, number> }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const t = THREAT_STYLE[item.threatLevel] || THREAT_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.competitor}</span>
              <Badge {...t} />
            </div>
            <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              <div className="rounded-lg bg-[#22c55e08] px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#22c55e]">Strength</p>
                <p className="mt-0.5 text-xs text-[color:var(--foreground)]">{item.keyStrength}</p>
              </div>
              <div className="rounded-lg bg-[#ef444408] px-2.5 py-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#ef4444]">Weakness</p>
                <p className="mt-0.5 text-xs text-[color:var(--foreground)]">{item.keyWeakness}</p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
              <ArrowRight className="h-3 w-3" />
              {item.strategy}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function BacklinkGapsPanel({ items }: { items: AIBacklinkGap[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.gap}</span>
              <Badge {...s} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.impact}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
              <ArrowRight className="h-3 w-3" />
              {item.action}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuickWinsPanel({ items }: { items: AICompetitorQuickWin[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const e = EFFORT_STYLE[item.estimatedEffort] || EFFORT_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.action}</span>
                {item.target && (
                  <span className="ml-1.5 text-xs text-[color:var(--muted-foreground)]">({item.target})</span>
                )}
              </div>
              <Badge {...e} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
            {item.expectedImpact && (
              <p className="mt-1.5 text-xs font-medium text-[color:var(--primary)]">
                Impact: {item.expectedImpact}
              </p>
            )}
          </div>
        )
      })}
    </div>
  )
}

function ContentGapsPanel({ items }: { items: AIContentGap[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.title}</span>
              <div className="flex shrink-0 gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: item.type === "guest-post" ? "#8b5cf620" : item.type === "outreach" ? "#3b82f620" : "#14b8a620",
                    color: item.type === "guest-post" ? "#8b5cf6" : item.type === "outreach" ? "#3b82f6" : "#14b8a6",
                  }}
                >
                  {CONTENT_GAP_TYPE_LABEL[item.type] || item.type}
                </span>
                <Badge {...s} />
              </div>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
            {item.targetDomains?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.targetDomains.map((d, j) => (
                  <span key={j} className="rounded-md bg-[color:var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)]">
                    {d}
                  </span>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function AnchorStrategyPanel({ strategy }: { strategy: AIAnchorStrategy | null }) {
  if (!strategy) return <EmptyTab />
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Current Assessment
        </p>
        <p className="mt-1 text-sm leading-relaxed text-[color:var(--foreground)]">{strategy.currentAssessment}</p>
      </div>
      {strategy.recommendations?.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Anchor Distribution Targets
          </p>
          {strategy.recommendations.map((rec, i) => (
            <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold capitalize text-[color:var(--foreground)]">{rec.type}</span>
                <div className="flex items-center gap-2 text-xs tabular-nums">
                  <span className="text-[color:var(--muted-foreground)]">{Math.round((rec.currentShare || 0) * 100)}%</span>
                  <ArrowRight className="h-3 w-3 text-[color:var(--primary)]" />
                  <span className="font-semibold text-[color:var(--primary)]">{Math.round((rec.targetShare || 0) * 100)}%</span>
                </div>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{rec.action}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function PriorityActionsPanel({ items }: { items: AIPriorityAction[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = PRIORITY_STYLE[item.impact] || PRIORITY_STYLE.medium
        const tl = TIMELINE_STYLE[item.timeline] || TIMELINE_STYLE["medium-term"]
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{ backgroundColor: s.bg, color: s.text }}
              >
                {item.rank || i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{item.action}</p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
              </div>
              <div className="flex shrink-0 flex-col gap-1">
                <Badge {...s} />
                <Badge {...tl} />
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function EmptyTab() {
  return (
    <p className="py-8 text-center text-sm text-[color:var(--muted-foreground)]">
      No data for this section.
    </p>
  )
}

/* ── gap score overview cards ── */

function GapOverview({ data, gaps }: { data: CompetitorDataset; gaps: Record<string, number> }) {
  const competitors = data.competitors
    .map(c => ({ ...c, gapScore: gaps[c.id] ?? 0 }))
    .sort((a, b) => b.gapScore - a.gapScore)

  const avgGap = competitors.length > 0
    ? Math.round(competitors.reduce((s, c) => s + c.gapScore, 0) / competitors.length)
    : 0

  const biggestThreat = competitors[0]
  const authDiff = biggestThreat ? biggestThreat.authorityScore - data.you.authorityScore : 0
  const blRatio = data.you.backlinks > 0 && biggestThreat
    ? (biggestThreat.backlinks / data.you.backlinks).toFixed(1)
    : "N/A"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Avg Gap" value={String(avgGap)} color={avgGap >= 50 ? "#ef4444" : avgGap >= 25 ? "#f59e0b" : "#22c55e"} />
        <MiniStat label="Your Authority" value={String(data.you.authorityScore)} color="#3b82f6" />
        <MiniStat label="Authority Diff" value={authDiff > 0 ? `+${authDiff}` : String(authDiff)} color={authDiff > 0 ? "#ef4444" : "#22c55e"} />
        <MiniStat label="BL Ratio" value={`${blRatio}x`} color="#8b5cf6" />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Competitive gap by domain
        </p>
        {competitors.map((comp) => (
          <div key={comp.id} className="flex items-center gap-3 rounded-lg bg-[color:var(--background)] px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--foreground)]">{comp.domain}</span>
            <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">Auth {comp.authorityScore}</span>
            <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">BL {compact(comp.backlinks)}</span>
            <div className="w-20 shrink-0">
              <GapBar score={comp.gapScore} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-center">
      <p className="text-lg font-bold tabular-nums" style={{ color }}>{value}</p>
      <p className="text-[10px] font-medium text-[color:var(--muted-foreground)]">{label}</p>
    </div>
  )
}

/* ── main component ── */

export function AICompetitorIntelligence({
  data,
  analysis,
  loading,
  onAnalyze,
}: {
  data: CompetitorDataset
  analysis: CompetitorAIAnalysis | null
  loading: boolean
  onAnalyze: () => void
}) {
  const [tab, setTab] = useState<TabKey>("competitors")

  const insights = analysis?.insights
  const gaps = analysis?.gaps

  return (
    <SectionCard
      title="AI Competitor Intelligence"
      icon={<Sparkles className="h-4 w-4 text-[color:var(--primary)]" />}
      actions={
        analysis && !loading ? (
          <button
            type="button"
            onClick={onAnalyze}
            className="rounded-lg px-2.5 py-1 text-xs font-medium text-[color:var(--primary)] transition-colors hover:bg-[color:var(--primary)]/10 cursor-pointer"
          >
            Re-analyze
          </button>
        ) : null
      }
    >
      <div className="p-4 md:p-5">
        {/* CTA state — not yet analyzed */}
        {!analysis && !loading && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)]/20 to-[color:var(--primary)]/5">
              <Sparkles className="h-7 w-7 text-[color:var(--primary)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Get AI-powered competitive intelligence
              </p>
              <p className="mt-1 max-w-md text-xs text-[color:var(--muted-foreground)]">
                Analyze your competitors to discover backlink gaps, content opportunities,
                anchor text strategies, and prioritized actions to close competitive gaps.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyze}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--secondary)]"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Competitors
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Scoring competitive gaps and generating AI insights...
            </p>
          </div>
        )}

        {/* Results */}
        {analysis && !loading && (
          <div className="space-y-4">
            {/* No API key warning */}
            {analysis.noApiKey && (
              <div className="flex items-start gap-2 rounded-xl border border-[#f59e0b44] bg-[#f59e0b10] p-3">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#f59e0b]" />
                <p className="text-xs text-[color:var(--foreground)]">
                  No active OpenAI API key found. Gap scores are shown, but AI insights require an OpenAI key
                  in Admin &rarr; API Keys.
                </p>
              </div>
            )}

            {/* Gap score overview */}
            {gaps && <GapOverview data={data} gaps={gaps} />}

            {/* AI Summary */}
            {insights && (
              <>
                <div className="rounded-xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/5 p-4">
                  <div className="mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--primary)]">
                      AI Analysis
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed text-[color:var(--foreground)]">
                    {insights.summary}
                  </p>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 overflow-x-auto rounded-xl bg-[color:var(--muted)] p-1">
                  {TABS.map(({ key, icon: Icon, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={cn(
                        "flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                        tab === key
                          ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
                          : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">{label}</span>
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="min-h-[200px]">
                  {tab === "competitors" && <CompetitorInsightsPanel items={insights.competitorInsights} gaps={gaps || {}} />}
                  {tab === "gaps" && <BacklinkGapsPanel items={insights.backlinkGaps} />}
                  {tab === "quickwins" && <QuickWinsPanel items={insights.quickWins} />}
                  {tab === "content" && <ContentGapsPanel items={insights.contentGaps} />}
                  {tab === "anchors" && <AnchorStrategyPanel strategy={insights.anchorStrategy} />}
                  {tab === "actions" && <PriorityActionsPanel items={insights.priorityActions} />}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
