"use client"

import { useMemo } from "react"
import { FolderTree, BarChart3, Target, ExternalLink } from "lucide-react"
import {
  compact,
  AUTHORITY_BUCKETS,
  authorityColor,
  type CRDomain,
  type BacklinkGapRow,
} from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { SectionCard, DomainTile } from "@/components/ai/keyword-research/primitives"

/* small numeric cell with a proportional bar underneath */
function BarCell({ value, max, color, muted }: { value: number; max: number; color: string; muted?: boolean }) {
  return (
    <div className="flex flex-col items-end gap-1">
      <span className={cn("text-xs font-medium tabular-nums", muted ? "text-[color:var(--muted-foreground)]" : "text-[color:var(--foreground)]")}>
        {value > 0 ? compact(value) : "—"}
      </span>
      <span className="h-1 w-full max-w-[64px] overflow-hidden rounded-full bg-[color:var(--muted)]">
        <span className="block h-full rounded-full" style={{ width: `${max > 0 ? (value / max) * 100 : 0}%`, backgroundColor: color, opacity: muted ? 0.5 : 1 }} />
      </span>
    </div>
  )
}

/* ── Top Categories of Referring Domains ── */
export function TopCategoriesCard({ domains }: { domains: CRDomain[] }) {
  const { names, lookup } = useMemo(() => {
    const order: string[] = []
    const seen = new Set<string>()
    const lk = new Map<string, Map<string, number>>()
    for (const d of domains) {
      const m = new Map<string, number>()
      for (const c of d.categories) {
        m.set(c.name, c.value)
        if (!seen.has(c.name)) {
          seen.add(c.name)
          order.push(c.name)
        }
      }
      lk.set(d.id, m)
    }
    return { names: order, lookup: lk }
  }, [domains])

  return (
    <SectionCard
      title="Top Categories of Referring Domains"
      subtitle="What kind of sites link to each domain"
      icon={<FolderTree className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">Category</th>
              {domains.map((d) => (
                <th key={d.id} className="px-3 py-2.5 text-right font-medium">
                  <span className={cn("inline-flex items-center gap-1", d.isYou && "text-[color:var(--primary)]")}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.isYou ? "var(--primary)" : d.color }} />
                    {d.domain.replace(/\.(com|net|org)$/, "")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {names.map((name) => {
              const rowMax = Math.max(1, ...domains.map((d) => lookup.get(d.id)?.get(name) ?? 0))
              return (
                <tr key={name} className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--muted)]/40">
                  <td className="px-4 py-2.5 text-[13px] text-[color:var(--foreground)]">{name}</td>
                  {domains.map((d) => (
                    <td key={d.id} className="px-3 py-2.5">
                      <BarCell
                        value={lookup.get(d.id)?.get(name) ?? 0}
                        max={rowMax}
                        color={d.isYou ? "var(--primary)" : d.color ?? "var(--muted-foreground)"}
                        muted={!d.isYou}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

/* ── Referring Domains by Authority Score ── */
export function AuthorityDistributionCard({ domains }: { domains: CRDomain[] }) {
  return (
    <SectionCard
      title="Referring Domains by Authority Score"
      subtitle="Quality distribution of each backlink profile"
      icon={<BarChart3 className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">AS Range</th>
              {domains.map((d) => (
                <th key={d.id} className="px-3 py-2.5 text-right font-medium">
                  <span className={cn("inline-flex items-center gap-1", d.isYou && "text-[color:var(--primary)]")}>
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.isYou ? "var(--primary)" : d.color }} />
                    {d.domain.replace(/\.(com|net|org)$/, "")}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {AUTHORITY_BUCKETS.map((bucket) => {
              const rowMax = Math.max(1, ...domains.map((d) => d.authorityBuckets[bucket]))
              const lo = Number(bucket.split("-")[0])
              return (
                <tr key={bucket} className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--muted)]/40">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center gap-2 text-[13px] text-[color:var(--foreground)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: authorityColor(lo) }} />
                      {bucket}
                    </span>
                  </td>
                  {domains.map((d) => (
                    <td key={d.id} className="px-3 py-2.5">
                      <BarCell
                        value={d.authorityBuckets[bucket]}
                        max={rowMax}
                        color={d.isYou ? "var(--primary)" : d.color ?? "var(--muted-foreground)"}
                        muted={!d.isYou}
                      />
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

/* ── Top Link Building Opportunities (Backlink Gap) ── */
export function BacklinkGapCard({
  domains,
  opportunities,
  compactMode = false,
}: {
  domains: CRDomain[]
  opportunities: BacklinkGapRow[]
  /** show only the top few (Overview preview) */
  compactMode?: boolean
}) {
  const you = domains.find((d) => d.isYou) ?? domains[0]
  const competitors = domains.filter((d) => !d.isYou)

  const rows = useMemo(() => {
    // score = total competitor links − your links (bigger gap first)
    const scored = opportunities.map((o) => {
      const compTotal = competitors.reduce((s, c) => s + (o.links[c.id] ?? 0), 0)
      const yourTotal = o.links[you.id] ?? 0
      return { o, gap: compTotal - yourTotal, yourTotal }
    })
    scored.sort((a, b) => b.gap - a.gap)
    return compactMode ? scored.slice(0, 5) : scored
  }, [opportunities, competitors, you.id, compactMode])

  return (
    <SectionCard
      title="Top Link Building Opportunities"
      subtitle="Authoritative sites linking to competitors — but not to you"
      icon={<Target className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">Referring Domain</th>
              <th className="px-3 py-2.5 text-right font-medium">AS</th>
              <th className="px-3 py-2.5 text-right font-medium">Monthly Visits</th>
              <th className="px-3 py-2.5 text-center font-medium">You</th>
              {competitors.map((c) => (
                <th key={c.id} className="px-3 py-2.5 text-center font-medium">
                  {c.domain.replace(/\.(com|net|org)$/, "")}
                </th>
              ))}
              <th className="px-3 py-2.5 text-right font-medium">Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ o, yourTotal }) => (
              <tr key={o.domain} className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--muted)]/40">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <DomainTile domain={o.domain} size={22} />
                    <a href={`https://${o.domain}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-[color:var(--foreground)] hover:text-[color:var(--primary)]">
                      {o.domain}
                      <ExternalLink className="h-3 w-3 text-[color:var(--muted-foreground)]" />
                    </a>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1.5 tabular-nums text-[color:var(--foreground)]">
                    {o.authority}
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: authorityColor(o.authority) }} />
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--muted-foreground)]">{compact(o.monthlyVisits)}</td>
                <td className="px-3 py-2.5 text-center">
                  {yourTotal > 0 ? (
                    <span className="tabular-nums font-semibold text-[color:var(--primary)]">{yourTotal}</span>
                  ) : (
                    <span className="inline-block rounded-full bg-[color:var(--error)]/12 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--error)]">Gap</span>
                  )}
                </td>
                {competitors.map((c) => {
                  const v = o.links[c.id] ?? 0
                  return (
                    <td key={c.id} className="px-3 py-2.5 text-center tabular-nums text-[color:var(--foreground)]">
                      {v > 0 ? v : <span className="text-[color:var(--muted-foreground)]">—</span>}
                    </td>
                  )
                })}
                <td className="px-3 py-2.5 text-right">
                  <button
                    type="button"
                    className="rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--primary)]/40 hover:bg-[color:var(--muted)] cursor-pointer"
                  >
                    Prospect
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {compactMode && (
        <div className="border-t border-[color:var(--border)] px-4 py-2.5 text-center text-xs text-[color:var(--muted-foreground)]">
          Showing top 5 — open the <span className="font-medium text-[color:var(--foreground)]">Backlink Gap</span> tab for the full list
        </div>
      )}
    </SectionCard>
  )
}
