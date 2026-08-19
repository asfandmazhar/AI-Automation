"use client"

import { useState } from "react"
import {
  ChevronDown,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Wand2,
  TrendingUp,
  TrendingDown,
  Minus,
  Shield,
  Lightbulb,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Severity = "critical" | "warning" | "passed"

type AuditItem = {
  title: string
  detail: string
  fix?: string
}

type AuditGroup = {
  severity: Severity
  items: AuditItem[]
}

export type AuditReportProps = {
  score: number
  groups: AuditGroup[]
  onFix?: (item: AuditItem) => void
}

const severityConfig: Record<
  Severity,
  {
    label: string
    border: string
    bg: string
    badgeBg: string
    text: string
    iconBg: string
    icon: typeof AlertCircle
  }
> = {
  critical: {
    label: "Critical",
    border: "border-l-red-500",
    bg: "bg-red-500/[0.03]",
    badgeBg: "bg-red-500/10",
    text: "text-red-500",
    iconBg: "bg-red-500/10",
    icon: AlertCircle,
  },
  warning: {
    label: "Warning",
    border: "border-l-amber-500",
    bg: "bg-amber-500/[0.03]",
    badgeBg: "bg-amber-500/10",
    text: "text-amber-500",
    iconBg: "bg-amber-500/10",
    icon: AlertTriangle,
  },
  passed: {
    label: "Passed",
    border: "border-l-emerald-500",
    bg: "bg-emerald-500/[0.03]",
    badgeBg: "bg-emerald-500/10",
    text: "text-emerald-500",
    iconBg: "bg-emerald-500/10",
    icon: CheckCircle2,
  },
}

function getScoreInfo(score: number) {
  if (score >= 80)
    return {
      color: "stroke-emerald-500",
      glow: "shadow-emerald-500/20",
      bg: "from-emerald-500/10 to-emerald-500/5",
      text: "text-emerald-500",
      label: "Good",
      TrendIcon: TrendingUp,
    }
  if (score >= 50)
    return {
      color: "stroke-amber-500",
      glow: "shadow-amber-500/20",
      bg: "from-amber-500/10 to-amber-500/5",
      text: "text-amber-500",
      label: "Needs Work",
      TrendIcon: Minus,
    }
  return {
    color: "stroke-red-500",
    glow: "shadow-red-500/20",
    bg: "from-red-500/10 to-red-500/5",
    text: "text-red-500",
    label: "Poor",
    TrendIcon: TrendingDown,
  }
}

function ScoreRing({ score }: { score: number }) {
  const r = 58
  const circumference = 2 * Math.PI * r
  const offset = circumference - (score / 100) * circumference
  const info = getScoreInfo(score)

  return (
    <div className={cn("flex items-center gap-6 rounded-2xl border border-[color:var(--border)] bg-gradient-to-br p-5 shadow-lg sm:gap-8 sm:p-6", info.bg, info.glow)}>
      <div className="relative shrink-0">
        <svg
          width="140"
          height="140"
          viewBox="0 0 140 140"
          className="drop-shadow-sm"
        >
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            className="stroke-[color:var(--border)]"
            strokeWidth="10"
          />
          <circle
            cx="70"
            cy="70"
            r={r}
            fill="none"
            className={info.color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform="rotate(-90 70 70)"
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
          <text
            x="70"
            y="65"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[color:var(--foreground)]"
            style={{ fontSize: "32px", fontWeight: 800 }}
          >
            {score}
          </text>
          <text
            x="70"
            y="88"
            textAnchor="middle"
            dominantBaseline="central"
            className="fill-[color:var(--muted-foreground)]"
            style={{ fontSize: "11px", fontWeight: 500 }}
          >
            / 100
          </text>
        </svg>
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <info.TrendIcon className={cn("h-4 w-4", info.text)} />
          <span
            className={cn("text-sm font-bold uppercase tracking-wider", info.text)}
          >
            {info.label}
          </span>
        </div>
        <h3 className="text-lg font-bold text-[color:var(--foreground)] sm:text-xl">
          Overall Score
        </h3>
        <p className="text-xs leading-relaxed text-[color:var(--muted-foreground)] sm:text-sm">
          {score >= 80
            ? "Great job! Your content is well optimized."
            : score >= 50
              ? "Some improvements needed for better performance."
              : "Significant issues found. Address critical items first."}
        </p>
      </div>
    </div>
  )
}

function SummaryBar({ groups }: { groups: AuditGroup[] }) {
  const critical = groups.find((g) => g.severity === "critical")?.items.length ?? 0
  const warning = groups.find((g) => g.severity === "warning")?.items.length ?? 0
  const passed = groups.find((g) => g.severity === "passed")?.items.length ?? 0
  const total = critical + warning + passed

  if (total === 0) return null

  return (
    <div className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3">
      <Shield className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
      <div className="flex flex-1 items-center gap-2 overflow-hidden rounded-full bg-[color:var(--muted)] p-0.5">
        {critical > 0 && (
          <div
            className="h-2 rounded-full bg-red-500 transition-all duration-500"
            style={{ width: `${(critical / total) * 100}%` }}
          />
        )}
        {warning > 0 && (
          <div
            className="h-2 rounded-full bg-amber-500 transition-all duration-500"
            style={{ width: `${(warning / total) * 100}%` }}
          />
        )}
        {passed > 0 && (
          <div
            className="h-2 rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${(passed / total) * 100}%` }}
          />
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[10px] font-semibold uppercase tracking-wider">
        {critical > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
            {critical}
          </span>
        )}
        {warning > 0 && (
          <span className="flex items-center gap-1 text-amber-500">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
            {warning}
          </span>
        )}
        {passed > 0 && (
          <span className="flex items-center gap-1 text-emerald-500">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            {passed}
          </span>
        )}
      </div>
    </div>
  )
}

export function AuditReport({ score, groups, onFix }: AuditReportProps) {
  const [openGroups, setOpenGroups] = useState<Record<number, boolean>>(() => {
    const initial: Record<number, boolean> = {}
    groups.forEach((g, i) => {
      if (g.severity !== "passed") initial[i] = true
    })
    return initial
  })
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({})

  function toggleGroup(idx: number) {
    setOpenGroups((prev) => ({ ...prev, [idx]: !prev[idx] }))
  }

  function toggleItem(key: string) {
    setOpenItems((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  if (groups.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed border-[color:var(--border)] bg-[color:var(--card)] text-center">
        <p className="text-sm font-medium text-[color:var(--foreground)]">
          No audit results yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Run the tool to generate an audit report.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <ScoreRing score={score} />
      <SummaryBar groups={groups} />

      {groups.map((group, gi) => {
        const cfg = severityConfig[group.severity]
        const Icon = cfg.icon
        const isOpen = openGroups[gi] ?? false

        return (
          <div
            key={gi}
            className={cn(
              "overflow-hidden rounded-2xl border border-[color:var(--border)] border-l-[3px]",
              cfg.border,
              cfg.bg
            )}
          >
            <button
              type="button"
              onClick={() => toggleGroup(gi)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-[color:var(--muted)]/50"
            >
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                  cfg.iconBg
                )}
              >
                <Icon className={cn("h-4 w-4", cfg.text)} />
              </span>
              <span
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider",
                  cfg.badgeBg,
                  cfg.text
                )}
              >
                {cfg.label}
              </span>
              <span className="text-sm font-semibold text-[color:var(--foreground)]">
                {group.items.length}{" "}
                {group.items.length === 1 ? "issue" : "issues"}
              </span>
              <ChevronDown
                className={cn(
                  "ml-auto h-4 w-4 text-[color:var(--muted-foreground)] transition-transform duration-200",
                  isOpen && "rotate-180"
                )}
              />
            </button>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300 ease-in-out",
                isOpen
                  ? "max-h-[2000px] opacity-100"
                  : "max-h-0 opacity-0"
              )}
            >
              <div className="space-y-0.5 px-2 pb-2">
                {group.items.map((item, ii) => {
                  const itemKey = `${gi}-${ii}`
                  const itemOpen = openItems[itemKey] ?? false

                  return (
                    <div
                      key={ii}
                      className="overflow-hidden rounded-xl bg-[color:var(--card)] transition-shadow hover:shadow-sm"
                    >
                      <button
                        type="button"
                        onClick={() => toggleItem(itemKey)}
                        className="flex w-full items-center gap-3 px-3.5 py-3 text-left transition-colors hover:bg-[color:var(--muted)]/50"
                      >
                        <span
                          className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                            cfg.iconBg
                          )}
                        >
                          <span
                            className={cn("h-1.5 w-1.5 rounded-full", {
                              "bg-red-500": group.severity === "critical",
                              "bg-amber-500": group.severity === "warning",
                              "bg-emerald-500": group.severity === "passed",
                            })}
                          />
                        </span>
                        <span className="flex-1 text-[13px] font-medium text-[color:var(--foreground)]">
                          {item.title}
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-3.5 w-3.5 shrink-0 text-[color:var(--muted-foreground)] transition-transform duration-200",
                            itemOpen && "rotate-180"
                          )}
                        />
                      </button>

                      <div
                        className={cn(
                          "overflow-hidden transition-all duration-200 ease-in-out",
                          itemOpen
                            ? "max-h-[500px] opacity-100"
                            : "max-h-0 opacity-0"
                        )}
                      >
                        <div className="space-y-2.5 px-3.5 pb-3.5 pl-12">
                          <p className="text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
                            {item.detail}
                          </p>
                          {item.fix && (
                            <div className="flex gap-2.5 rounded-xl border border-[color:var(--primary)]/15 bg-[color:var(--primary)]/[0.04] px-3.5 py-2.5">
                              <Lightbulb className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" />
                              <div>
                                <p className="text-[11px] font-bold uppercase tracking-wider text-[color:var(--primary)]">
                                  Suggested fix
                                </p>
                                <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
                                  {item.fix}
                                </p>
                              </div>
                            </div>
                          )}
                          {onFix && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-1.5 text-[color:var(--primary)] hover:bg-[color:var(--primary)]/10 hover:text-[color:var(--primary)]"
                              onClick={() => onFix(item)}
                            >
                              <Wand2 className="h-3.5 w-3.5" />
                              Fix with AI
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
