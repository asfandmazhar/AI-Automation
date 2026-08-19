"use client"

import { Trophy, Crown } from "lucide-react"
import {
  compact,
  full,
  authorityColor,
  authorityBand,
  type CRDomain,
} from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { SectionCard, DomainTile, CountUp } from "@/components/ai/keyword-research/primitives"

/* ── metric accessors shared by the KPI row ── */
type MetricKey = "authorityScore" | "referringDomains" | "backlinks" | "organicTraffic"
const KPI_METRICS: { key: MetricKey; label: string; fmt: (n: number) => string; authority?: boolean }[] = [
  { key: "authorityScore", label: "Authority Score", fmt: (n) => `${n}`, authority: true },
  { key: "referringDomains", label: "Referring Domains", fmt: compact },
  { key: "backlinks", label: "Total Backlinks", fmt: compact },
  { key: "organicTraffic", label: "Organic Traffic", fmt: compact },
]

function rankOf(you: number, values: number[]): number {
  return 1 + values.filter((v) => v > you).length
}

/* one head-to-head KPI card: your value + rank + a mini comparison */
function MetricCard({
  metric,
  domains,
}: {
  metric: (typeof KPI_METRICS)[number]
  domains: CRDomain[]
}) {
  const you = domains.find((d) => d.isYou) ?? domains[0]
  const values = domains.map((d) => d[metric.key])
  const youVal = you[metric.key]
  const max = Math.max(1, ...values)
  const rank = rankOf(youVal, values)
  const isLeader = rank === 1
  const leader = domains.reduce((a, b) => (b[metric.key] > a[metric.key] ? b : a))
  const gapPct = leader[metric.key] > 0 ? Math.round((youVal / leader[metric.key]) * 100) : 100
  const bigColor = metric.authority ? authorityColor(youVal as number) : "var(--foreground)"

  return (
    <div className="flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">{metric.label}</span>
        <span
          className={cn(
            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
            isLeader
              ? "bg-[color:var(--primary)]/12 text-[color:var(--primary)]"
              : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]"
          )}
        >
          {isLeader && <Crown className="h-3 w-3" />}
          {isLeader ? "Leader" : `#${rank} of ${domains.length}`}
        </span>
      </div>

      <div className="mt-1 flex items-end gap-2">
        <span className="text-3xl font-bold tabular-nums md:text-4xl" style={{ color: bigColor }}>
          <CountUp value={youVal} format={metric.fmt} />
        </span>
        {metric.authority && (
          <span className="mb-1 text-xs font-medium" style={{ color: bigColor }}>
            {authorityBand(youVal as number)}
          </span>
        )}
      </div>

      {!isLeader && (
        <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">
          {gapPct}% of leader{" "}
          <span className="font-medium text-[color:var(--foreground)]">{leader.domain}</span>
        </p>
      )}
      {isLeader && (
        <p className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">Ahead of every tracked competitor</p>
      )}

      {/* mini comparison bars */}
      <div className="mt-3 space-y-1.5 border-t border-[color:var(--border)] pt-3">
        {domains.map((d) => (
          <div key={d.id} className="flex items-center gap-2">
            <span className={cn("w-16 shrink-0 truncate text-[10px] sm:w-20", d.isYou ? "font-semibold text-[color:var(--foreground)]" : "text-[color:var(--muted-foreground)]")}>
              {d.isYou ? "You" : d.domain.replace(/\.(com|net|org)$/, "")}
            </span>
            <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color:var(--muted)]">
              <span
                className="block h-full rounded-full transition-[width] duration-700 ease-out"
                style={{ width: `${(d[metric.key] / max) * 100}%`, backgroundColor: d.isYou ? "var(--primary)" : (d.color ?? "var(--muted-foreground)"), opacity: d.isYou ? 1 : 0.55 }}
              />
            </span>
            <span className="w-10 shrink-0 text-right text-[10px] font-medium tabular-nums text-[color:var(--muted-foreground)]">
              {metric.fmt(d[metric.key])}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function KpiOverview({ domains }: { domains: CRDomain[] }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {KPI_METRICS.map((m) => (
        <MetricCard key={m.key} metric={m} domains={domains} />
      ))}
    </div>
  )
}

/* ── head-to-head comparison table (reference image, top block) ── */
type Col = { key: keyof CRDomain; label: string; fmt: (n: number) => string; authority?: boolean }
const COLS: Col[] = [
  { key: "authorityScore", label: "Authority Score", fmt: (n) => `${n}`, authority: true },
  { key: "referringDomains", label: "Referring Domains", fmt: compact },
  { key: "backlinks", label: "Backlinks", fmt: compact },
  { key: "referringIps", label: "Referring IPs", fmt: compact },
  { key: "monthlyVisits", label: "Monthly Visits", fmt: compact },
  { key: "organicTraffic", label: "Organic Traffic", fmt: compact },
  { key: "organicKeywords", label: "Organic Keywords", fmt: compact },
]

function AuthorityPill({ score }: { score: number }) {
  const color = authorityColor(score)
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums"
      style={{ backgroundColor: `${color}1f`, color }}
      title={`Authority Score ${score}/100 — ${authorityBand(score)}`}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {score}
    </span>
  )
}

export function ComparisonTable({ domains }: { domains: CRDomain[] }) {
  // per-column winner (max value)
  const winners = new Map<string, string>()
  for (const c of COLS) {
    let best = domains[0]
    for (const d of domains) if ((d[c.key] as number) > (best[c.key] as number)) best = d
    winners.set(c.key as string, best.id)
  }

  return (
    <SectionCard
      title="Head-to-head comparison"
      subtitle={`${domains.length} domains · winner highlighted per metric`}
      icon={<Trophy className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[820px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">Domain</th>
              {COLS.map((c) => (
                <th key={c.key as string} className="px-3 py-2.5 text-right font-medium">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {domains.map((d) => (
              <tr
                key={d.id}
                className={cn(
                  "border-b border-[color:var(--border)] last:border-0 transition-colors hover:bg-[color:var(--muted)]/50",
                  d.isYou && "bg-[color:var(--primary)]/5"
                )}
              >
                <td className={cn("px-4 py-3", d.isYou && "border-l-2 border-[color:var(--primary)]")}>
                  <div className="flex items-center gap-2.5">
                    <DomainTile domain={d.domain} size={26} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-[13px] font-medium text-[color:var(--foreground)]">{d.domain}</span>
                        {d.isYou && (
                          <span className="shrink-0 rounded bg-[color:var(--primary)]/15 px-1.5 py-0.5 text-[9px] font-bold uppercase text-[color:var(--primary)]">You</span>
                        )}
                      </div>
                      <span className="text-[10px] text-[color:var(--muted-foreground)]">{compact(d.monthlyVisits)} visits/mo</span>
                    </div>
                  </div>
                </td>
                {COLS.map((c) => {
                  const isWin = winners.get(c.key as string) === d.id && domains.length > 1
                  const val = d[c.key] as number
                  return (
                    <td key={c.key as string} className="px-3 py-3 text-right">
                      <span className={cn("inline-flex items-center justify-end gap-1.5", isWin && "font-semibold")}>
                        {c.authority ? (
                          <AuthorityPill score={val} />
                        ) : (
                          <span className="tabular-nums text-[color:var(--foreground)]" title={full(val)}>
                            {c.fmt(val)}
                          </span>
                        )}
                        {isWin && !c.authority && <Trophy className="h-3 w-3 text-[color:var(--primary)]" />}
                      </span>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
