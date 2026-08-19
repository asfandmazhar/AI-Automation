"use client"

import { useState } from "react"
import {
  Sparkles, Shield, AlertTriangle as AlertTri, Link2, Anchor, Wrench,
  ListOrdered, ArrowRight, Loader2, AlertTriangle, TrendingDown,
  CheckCircle2, XCircle,
} from "lucide-react"
import type {
  BacklinksProfile, BacklinkAIAnalysis,
  AIBacklinkStrength, AIBacklinkWeakness, AILostLinkPriority,
  AIAnchorInsight, AILinkBuildingRecommendation, AIBacklinkPriorityAction,
} from "@/lib/backlinks-research"
import { compact } from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/ai/keyword-research/primitives"

/* ── colour helpers ── */

const PRIORITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "#ef444420", text: "#ef4444", label: "High" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Medium" },
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low" },
}

const SEVERITY_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  high:   { bg: "#ef444420", text: "#ef4444", label: "High severity" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Med severity" },
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low severity" },
}

const EFFORT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  low:    { bg: "#22c55e20", text: "#22c55e", label: "Low effort" },
  medium: { bg: "#f59e0b20", text: "#f59e0b", label: "Med effort" },
  high:   { bg: "#ef444420", text: "#ef4444", label: "High effort" },
}

const TIMELINE_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  immediate:     { bg: "#ef444420", text: "#ef4444", label: "Immediate" },
  "short-term":  { bg: "#f59e0b20", text: "#f59e0b", label: "Short-term" },
  "medium-term": { bg: "#3b82f620", text: "#3b82f6", label: "Medium-term" },
  "long-term":   { bg: "#8b5cf620", text: "#8b5cf6", label: "Long-term" },
}

const ASSESSMENT_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  healthy: { bg: "#22c55e20", text: "#22c55e", label: "Healthy" },
  review:  { bg: "#f59e0b20", text: "#f59e0b", label: "Review" },
  concern: { bg: "#ef444420", text: "#ef4444", label: "Concern" },
}

const TARGET_TYPE_LABEL: Record<string, string> = {
  "content-marketing": "Content Marketing",
  outreach:            "Outreach",
  "digital-pr":        "Digital PR",
  "resource-pages":    "Resource Pages",
  "broken-link":       "Broken Link",
  "guest-posting":     "Guest Posting",
  directories:         "Directories",
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

function HealthBar({ score }: { score: number }) {
  const color = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"
  return (
    <div className="flex items-center gap-2">
      <div className="h-2 flex-1 rounded-full bg-[color:var(--muted)]">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-sm font-bold tabular-nums" style={{ color }}>{score}</span>
    </div>
  )
}

/* ── tabs ── */

const TABS = [
  { key: "strengths",  icon: CheckCircle2, label: "Strengths" },
  { key: "weaknesses", icon: XCircle,      label: "Weaknesses" },
  { key: "lost",       icon: TrendingDown, label: "Lost Links" },
  { key: "anchors",    icon: Anchor,       label: "Anchors" },
  { key: "strategies", icon: Wrench,       label: "Strategies" },
  { key: "actions",    icon: ListOrdered,  label: "Priorities" },
] as const

type TabKey = (typeof TABS)[number]["key"]

/* ── tab panels ── */

function StrengthsPanel({ items }: { items: AIBacklinkStrength[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#22c55e]" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">{item.strength}</p>
              <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.evidence}</p>
              <p className="mt-1.5 text-xs font-medium text-[color:var(--primary)]">Impact: {item.impact}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeaknessesPanel({ items }: { items: AIBacklinkWeakness[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = SEVERITY_STYLE[item.severity] || SEVERITY_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.weakness}</span>
              <Badge {...s} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.evidence}</p>
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

function LostLinksPanel({ items }: { items: AILostLinkPriority[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const s = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.observation}</span>
              <Badge {...s} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
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

function AnchorsPanel({ items }: { items: AIAnchorInsight[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const a = ASSESSMENT_STYLE[item.assessment] || ASSESSMENT_STYLE.review
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.observation}</span>
              <Badge {...a} />
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.currentState}</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium text-[color:var(--primary)]">
              <ArrowRight className="h-3 w-3" />
              {item.recommendation}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function StrategiesPanel({ items }: { items: AILinkBuildingRecommendation[] }) {
  if (!items.length) return <EmptyTab />
  return (
    <div className="space-y-2">
      {items.map((item, i) => {
        const p = PRIORITY_STYLE[item.priority] || PRIORITY_STYLE.medium
        const e = EFFORT_STYLE[item.estimatedEffort] || EFFORT_STYLE.medium
        return (
          <div key={i} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <span className="text-sm font-semibold text-[color:var(--foreground)]">{item.strategy}</span>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <span
                  className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: "#3b82f620",
                    color: "#3b82f6",
                  }}
                >
                  {TARGET_TYPE_LABEL[item.targetType] || item.targetType}
                </span>
                <Badge {...p} />
              </div>
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{item.reason}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <Badge {...e} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

function PrioritiesPanel({ items }: { items: AIBacklinkPriorityAction[] }) {
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

/* ── health score overview ── */

function HealthOverview({ profile, analysis }: { profile: BacklinksProfile; analysis: BacklinkAIAnalysis }) {
  const score = analysis.healthScore
  const scores = analysis.referringScores || {}

  const topReferring = [...(profile.referring || [])]
    .map(r => ({ ...r, score: scores[r.domain] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)

  const healthLabel = score >= 80 ? "Excellent" : score >= 60 ? "Strong" : score >= 40 ? "Fair" : score >= 20 ? "Weak" : "Poor"
  const healthColor = score >= 70 ? "#22c55e" : score >= 40 ? "#f59e0b" : "#ef4444"

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-center">
          <p className="text-lg font-bold tabular-nums" style={{ color: healthColor }}>{score}</p>
          <p className="text-[10px] font-medium text-[color:var(--muted-foreground)]">Health Score</p>
        </div>
        <MiniStat label="Authority" value={String(profile.authorityScore)} color="#3b82f6" />
        <MiniStat label="Dofollow" value={`${Math.round(profile.dofollowShare * 100)}%`} color="#8b5cf6" />
        <MiniStat
          label="Net Growth"
          value={`${(profile.newLast30 - profile.lostLast30) >= 0 ? "+" : ""}${profile.newLast30 - profile.lostLast30}`}
          color={(profile.newLast30 - profile.lostLast30) >= 0 ? "#22c55e" : "#ef4444"}
        />
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
          Top referring domains by value
        </p>
        {topReferring.map((r) => {
          const rdColor = r.score >= 70 ? "#22c55e" : r.score >= 40 ? "#f59e0b" : "#ef4444"
          return (
            <div key={r.domain} className="flex items-center gap-3 rounded-lg bg-[color:var(--background)] px-3 py-2">
              <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--foreground)]">{r.domain}</span>
              <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">Auth {r.authority}</span>
              <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">BL {compact(r.backlinks)}</span>
              <div className="flex w-20 shrink-0 items-center gap-2">
                <div className="h-1.5 flex-1 rounded-full bg-[color:var(--muted)]">
                  <div className="h-full rounded-full transition-all" style={{ width: `${r.score}%`, backgroundColor: rdColor }} />
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: rdColor }}>{r.score}</span>
              </div>
            </div>
          )
        })}
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

export function AIBacklinkIntelligence({
  profile,
  analysis,
  loading,
  onAnalyze,
}: {
  profile: BacklinksProfile
  analysis: BacklinkAIAnalysis | null
  loading: boolean
  onAnalyze: () => void
}) {
  const [tab, setTab] = useState<TabKey>("strengths")

  const insights = analysis?.insights

  return (
    <SectionCard
      title="AI Backlink Intelligence"
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
        {/* CTA state */}
        {!analysis && !loading && (
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)]/20 to-[color:var(--primary)]/5">
              <Sparkles className="h-7 w-7 text-[color:var(--primary)]" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Get AI-powered backlink intelligence
              </p>
              <p className="mt-1 max-w-md text-xs text-[color:var(--muted-foreground)]">
                Analyze your backlink profile to discover strengths, weaknesses, lost link priorities,
                anchor text insights, and actionable link-building strategies.
              </p>
            </div>
            <button
              type="button"
              onClick={onAnalyze}
              className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[color:var(--primary)] px-5 py-2.5 text-sm font-semibold text-[color:var(--primary-foreground)] transition-colors hover:bg-[color:var(--secondary)]"
            >
              <Sparkles className="h-4 w-4" />
              Analyze Backlinks
            </button>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
            <p className="text-sm text-[color:var(--muted-foreground)]">
              Scoring backlink profile and generating AI insights...
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
                  No active OpenAI API key found. Health scores are shown, but AI insights require an OpenAI key
                  in Admin &rarr; API Keys.
                </p>
              </div>
            )}

            {/* Health score overview */}
            <HealthOverview profile={profile} analysis={analysis} />

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
                  {tab === "strengths" && <StrengthsPanel items={insights.backlinkStrengths} />}
                  {tab === "weaknesses" && <WeaknessesPanel items={insights.backlinkWeaknesses} />}
                  {tab === "lost" && <LostLinksPanel items={insights.lostLinkPriorities} />}
                  {tab === "anchors" && <AnchorsPanel items={insights.anchorInsights} />}
                  {tab === "strategies" && <StrategiesPanel items={insights.linkBuildingRecommendations} />}
                  {tab === "actions" && <PrioritiesPanel items={insights.priorities} />}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </SectionCard>
  )
}
