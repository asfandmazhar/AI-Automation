"use client"

import { useState } from "react"
import {
  Sparkles, Target, Zap, FileText, Layers, ArrowRight,
  ChevronDown, ChevronUp, Loader2, AlertTriangle,
} from "lucide-react"
import type {
  KeywordAIAnalysis, KeywordResearchResult,
  AIKeywordPriority, AIQuickWin, AIContentOpportunity,
  AIKeywordCluster, AIRecommendation,
} from "@/lib/keyword-research"
import { compact } from "@/lib/keyword-research"
import { cn } from "@/lib/utils"
import { SectionCard } from "./primitives"

/* ── priority / effort colour helpers ── */

const PRIORITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "#ef444420", text: "#ef4444", label: "High" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Medium" },
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low" },
}

const EFFORT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low effort" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Med effort" },
  high:   { bg: "#ef444420", text: "#ef4444", label: "High effort" },
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  "pillar-page": "Pillar Page",
  "blog-post": "Blog Post",
  "landing-page": "Landing Page",
  faq: "FAQ Page",
  comparison: "Comparison",
  guide: "Guide",
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

function OpportunityBar({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"
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
  { key: "priority",  icon: Target,   label: "Priority Keywords" },
  { key: "quickwins", icon: Zap,      label: "Quick Wins" },
  { key: "content",   icon: FileText,  label: "Content" },
  { key: "clusters",  icon: Layers,   label: "Clusters" },
  { key: "actions",   icon: ArrowRight, label: "Recommendations" },
] as const

type TabKey = (typeof TABS)[number]["key"]

/* ── tab panels ── */

function PriorityPanel({ items, scores }: { items: AIKeywordPriority[]; scores: Record<string, number> }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.keyword}</span>
              <Badge {...s} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
              <ArrowRight className="h-3 w-3" />
              {item.recommendedAction}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function QuickWinsPanel({ items }: { items: AIQuickWin[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const e = EFFORT_STYLE[item.estimatedEffort] || EFFORT_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.keyword}</span>
              <Badge {...e} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
              <ArrowRight className="h-3 w-3" />
              {item.recommendedAction}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ContentPanel({ items }: { items: AIContentOpportunity[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.title}</span>
            <div className="flex shrink-0 gap-1.5">
              <span
                className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                style={{
                  backgroundColor: item.type === "new-page" ? "#3b82f620" : "#8b5cf620",
                  color: item.type === "new-page" ? "#3b82f6" : "#8b5cf6",
                }}
              >
                {item.type === "new-page" ? "New page" : "Optimize"}
              </span>
              {item.contentType && (
                <span className="rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--muted-foreground)]">
                  {CONTENT_TYPE_LABEL[item.contentType] || item.contentType}
                </span>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
          {item.targetKeywords?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.targetKeywords.map((kw, j) => (
                <span key={j} className="rounded-md bg-[color:var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)]">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ClustersPanel({ items }: { items: AIKeywordCluster[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.theme}</span>
            {item.contentType && (
              <span className="rounded-full bg-[color:var(--muted)] px-2 py-0.5 text-[11px] font-medium text-[color:var(--muted-foreground)]">
                {CONTENT_TYPE_LABEL[item.contentType] || item.contentType}
              </span>
            )}
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.strategy}</p>
          {item.keywords?.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {item.keywords.map((kw, j) => (
                <span key={j} className="rounded-md bg-[color:var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--primary)]">
                  {kw}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function RecommendationsPanel({ items }: { items: AIRecommendation[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start gap-3">
              <span
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-xs font-bold"
                style={{ backgroundColor: s.bg, color: s.text }}
              >
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">{item.action}</p>
                <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
                {item.impact && (
                  <p className="mt-1.5 text-xs font-medium text-[color:var(--primary)]">
                    Impact: {item.impact}
                  </p>
                )}
              </div>
              <Badge {...s} />
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

/* ── opportunity score overview cards ── */

function ScoreOverview({ scores, result }: { scores: Record<string, number>; result: KeywordResearchResult }) {
  const allIdeas = [
    ...result.ideas.broad,
    ...result.ideas.phrase,
    ...result.ideas.exact,
    ...result.ideas.related,
    ...result.ideas.questions,
  ]

  const scored = allIdeas
    .map(i => ({ ...i, score: scores[i.id] ?? 0 }))
    .sort((a, b) => b.score - a.score)

  const highOpp = scored.filter(i => i.score >= 70).length
  const medOpp = scored.filter(i => i.score >= 40 && i.score < 70).length
  const lowOpp = scored.filter(i => i.score < 40).length
  const avgScore = scored.length > 0 ? Math.round(scored.reduce((s, i) => s + i.score, 0) / scored.length) : 0

  const top5 = scored.slice(0, 5)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniStat label="Avg Score" value={String(avgScore)} color="#3b82f6" />
        <MiniStat label="High Opp" value={String(highOpp)} color="#22c55e" />
        <MiniStat label="Medium Opp" value={String(medOpp)} color="#f59e0b" />
        <MiniStat label="Low Opp" value={String(lowOpp)} color="#ef4444" />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Top 5 opportunities
        </p>
        {top5.map((idea) => (
          <div key={idea.id} className="flex items-center gap-3 rounded-lg bg-[color:var(--background)] px-3 py-2">
            <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--foreground)]">{idea.keyword}</span>
            <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">Vol {compact(idea.volume)}</span>
            <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">KD {idea.difficulty}</span>
            <div className="w-20 shrink-0">
              <OpportunityBar score={idea.score} />
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

export function AIKeywordIntelligence({
  result,
  analysis,
  loading,
  onAnalyze,
}: {
  result: KeywordResearchResult
  analysis: KeywordAIAnalysis | null
  loading: boolean
  onAnalyze: () => void
}) {
  const [tab, setTab] = useState<TabKey>("priority")

  const insights = analysis?.insights
  const scores = analysis?.scores

  return (
    <SectionCard
      title="AI Keyword Intelligence"
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
                Get AI-powered keyword intelligence
              </p>
              <p className="mt-1 max-w-md text-xs text-[color:var(--muted-foreground)]">
                Analyze your keyword data to discover high-value opportunities, quick wins,
                content strategies, and actionable recommendations.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyze}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--secondary)]"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Keywords
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Scoring keywords and generating AI insights...
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
                  No active OpenAI API key found. Opportunity scores are shown, but AI insights require an OpenAI key
                  in Admin &rarr; API Keys.
                </p>
              </div>
            )}

            {/* Opportunity score overview */}
            {scores && <ScoreOverview scores={scores} result={result} />}

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
                  {tab === "priority" && <PriorityPanel items={insights.priorityKeywords} scores={scores || {}} />}
                  {tab === "quickwins" && <QuickWinsPanel items={insights.quickWins} />}
                  {tab === "content" && <ContentPanel items={insights.contentOpportunities} />}
                  {tab === "clusters" && <ClustersPanel items={insights.keywordClusters} />}
                  {tab === "actions" && <RecommendationsPanel items={insights.recommendations} />}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
