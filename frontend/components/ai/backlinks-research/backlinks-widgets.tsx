"use client"

import { useState, type ReactNode } from "react"
import {
  Activity, PieChart, Tag, BarChart3, Globe2, ListChecks,
  ExternalLink, ArrowUpRight, ShieldAlert,
} from "lucide-react"
import {
  compact,
  full,
  authorityColor,
  ANCHOR_COLORS,
  ANCHOR_LABELS,
  AUTHORITY_BUCKETS,
} from "@/lib/competitor-research"
import type { BacklinksProfile } from "@/lib/backlinks-research"
import { cn } from "@/lib/utils"
import { SectionCard, DomainTile } from "@/components/ai/keyword-research/primitives"

/* ── SVG donut ── */
function Donut({
  segments,
  size = 132,
  thickness = 16,
  center,
}: {
  segments: { label: string; value: number; color: string }[]
  size?: number
  thickness?: number
  center?: ReactNode
}) {
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  // cumulative offset for each segment, computed immutably
  const offsets = segments.map((_, i) => segments.slice(0, i).reduce((a, s) => a + s.value * c, 0))
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--muted)" strokeWidth={thickness} />
        {segments.map((s, i) => {
          const dash = s.value * c
          return (
            <circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={s.color}
              strokeWidth={thickness}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offsets[i]}
              strokeLinecap="butt"
            />
          )
        })}
      </svg>
      {center && <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{center}</div>}
    </div>
  )
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-xs">
      <span className="flex items-center gap-1.5 text-[color:var(--muted-foreground)]">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-[color:var(--foreground)]">{value}</span>
    </div>
  )
}

/* ── Backlink profile split: types + attributes donuts ── */
const TYPE_COLORS: Record<string, string> = { text: "#4f46e5", image: "#6366f1", redirect: "#a5b4fc", form: "#c7d2fe" }

export function ProfileSplitCard({ profile }: { profile: BacklinksProfile }) {
  const types = [
    { label: "Text", value: profile.types.text, color: TYPE_COLORS.text },
    { label: "Image", value: profile.types.image, color: TYPE_COLORS.image },
    { label: "Redirect", value: profile.types.redirect, color: TYPE_COLORS.redirect },
    { label: "Form", value: profile.types.form, color: TYPE_COLORS.form },
  ]
  const attrs = [
    { label: "Follow", value: profile.attributes.follow, color: "#3b82f6" },
    { label: "Nofollow + UGC", value: profile.attributes.nofollow, color: "#c4b5fd" },
  ]
  return (
    <SectionCard title="Backlink Types & Attributes" subtitle="How your links break down" icon={<PieChart className="h-4 w-4" />}>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="flex items-center gap-4">
          <Donut
            segments={types}
            center={
              <>
                <span className="text-lg font-bold text-[color:var(--foreground)]">{Math.round(profile.types.text * 100)}%</span>
                <span className="text-[10px] text-[color:var(--muted-foreground)]">Text</span>
              </>
            }
          />
          <div className="min-w-0 flex-1 space-y-2">
            {types.map((t) => (
              <LegendItem key={t.label} color={t.color} label={t.label} value={`${Math.round(t.value * 100)}%`} />
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Donut
            segments={attrs}
            center={
              <>
                <span className="text-lg font-bold text-[color:var(--foreground)]">{Math.round(profile.attributes.follow * 100)}%</span>
                <span className="text-[10px] text-[color:var(--muted-foreground)]">Follow</span>
              </>
            }
          />
          <div className="min-w-0 flex-1 space-y-2">
            {attrs.map((t) => (
              <LegendItem key={t.label} color={t.color} label={t.label} value={`${Math.round(t.value * 100)}%`} />
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

/* ── New vs Lost backlinks over time (diverging columns) ── */
const GAIN = "#0ca30c"
const LOSS = "#d03b3b"

export function BacklinkFlowCard({ profile }: { profile: BacklinksProfile }) {
  const [hover, setHover] = useState<number | null>(null)
  const flow = profile.flow
  const scale = Math.max(1, ...flow.map((f) => Math.max(f.gained, f.lost)))
  const zone = 74 // px each side of the midline

  return (
    <SectionCard
      title="New & Lost Backlinks"
      subtitle="Monthly gained vs lost — net growth stays positive"
      icon={<Activity className="h-4 w-4" />}
      actions={
        <div className="flex items-center gap-3 text-[11px]">
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: GAIN }} /> New</span>
          <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: LOSS }} /> Lost</span>
        </div>
      }
    >
      <div className="relative flex items-stretch" style={{ height: zone * 2 + 20 }}>
        {flow.map((f, i) => {
          const active = hover === i
          return (
            <div
              key={i}
              className="group relative flex flex-1 flex-col items-center"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            >
              {/* gained (up) */}
              <div className="flex w-full flex-1 items-end justify-center">
                <div
                  className="w-2/3 max-w-[16px] rounded-t-[3px] transition-opacity"
                  style={{ height: `${(f.gained / scale) * zone}px`, backgroundColor: GAIN, opacity: hover === null || active ? 1 : 0.4 }}
                />
              </div>
              {/* midline */}
              <div className="my-0 h-px w-full bg-[color:var(--border)]" />
              {/* lost (down) */}
              <div className="flex w-full flex-1 items-start justify-center">
                <div
                  className="w-2/3 max-w-[16px] rounded-b-[3px] transition-opacity"
                  style={{ height: `${(f.lost / scale) * zone}px`, backgroundColor: LOSS, opacity: hover === null || active ? 1 : 0.4 }}
                />
              </div>
              <span className="mt-1 text-[9px] text-[color:var(--muted-foreground)]">{f.month}</span>

              {active && (
                <div className="pointer-events-none absolute -top-1 left-1/2 z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 shadow-lg">
                  <div className="text-[10px] font-medium text-[color:var(--muted-foreground)]">{f.month}</div>
                  <div className="text-[11px] font-semibold" style={{ color: GAIN }}>+{f.gained} new</div>
                  <div className="text-[11px] font-semibold" style={{ color: LOSS }}>−{f.lost} lost</div>
                  <div className="text-[11px] font-semibold text-[color:var(--foreground)]">net +{f.gained - f.lost}</div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

/* ── Anchor text distribution ── */
export function AnchorDistributionCard({ profile }: { profile: BacklinksProfile }) {
  const sorted = [...profile.anchors].sort((a, b) => b.share - a.share)
  return (
    <SectionCard title="Anchor Text Distribution" subtitle="A natural profile leans branded, not exact-match" icon={<Tag className="h-4 w-4" />}>
      <div className="mb-4 flex h-3.5 w-full overflow-hidden rounded-full">
        {sorted.map((a, i) => (
          <span
            key={i}
            className="h-full"
            style={{ width: `${a.share * 100}%`, backgroundColor: ANCHOR_COLORS[a.type], marginLeft: i === 0 ? 0 : 1 }}
            title={`${a.text} — ${Math.round(a.share * 100)}%`}
          />
        ))}
      </div>
      <div className="space-y-1.5">
        {sorted.map((a) => (
          <div key={a.text} className="flex items-center gap-3 rounded-lg px-1.5 py-1 hover:bg-[color:var(--muted)]/50">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ANCHOR_COLORS[a.type] }} />
            <span className="min-w-0 flex-1 truncate text-[13px] text-[color:var(--foreground)]">{a.text}</span>
            <span className="shrink-0 rounded-md bg-[color:var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)]">
              {ANCHOR_LABELS[a.type]}
            </span>
            <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-[color:var(--foreground)]">
              {Math.round(a.share * 100)}%
            </span>
            <span className="hidden w-14 shrink-0 text-right text-[11px] tabular-nums text-[color:var(--muted-foreground)] sm:block">
              {compact(a.backlinks)}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

/* ── Referring domains by authority (single-domain bars) ── */
export function AuthorityBucketsCard({ profile }: { profile: BacklinksProfile }) {
  const max = Math.max(1, ...AUTHORITY_BUCKETS.map((b) => profile.authorityBuckets[b]))
  return (
    <SectionCard title="Referring Domains by Authority" subtitle="Quality spread of the domains linking to you" icon={<BarChart3 className="h-4 w-4" />}>
      <div className="space-y-2.5">
        {AUTHORITY_BUCKETS.map((b) => {
          const v = profile.authorityBuckets[b]
          const lo = Number(b.split("-")[0])
          return (
            <div key={b} className="flex items-center gap-3">
              <span className="flex w-16 shrink-0 items-center gap-1.5 text-xs text-[color:var(--foreground)]">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: authorityColor(lo) }} />
                {b}
              </span>
              <span className="h-2.5 flex-1 overflow-hidden rounded-full bg-[color:var(--muted)]">
                <span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(v / max) * 100}%`, backgroundColor: authorityColor(lo) }} />
              </span>
              <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-[color:var(--foreground)]">{compact(v)}</span>
            </div>
          )
        })}
      </div>
    </SectionCard>
  )
}

/* ── Toxicity gauge (semicircle) ── */
export function ToxicityCard({ profile }: { profile: BacklinksProfile }) {
  const toxic = profile.toxicShare
  const healthy = 1 - toxic
  const angle = toxic * 180
  const color = toxic < 0.1 ? GAIN : toxic < 0.25 ? "#fab219" : LOSS
  const cx = 100
  const cy = 100
  const rr = 78
  const polar = (a: number) => {
    const rad = ((a - 180) * Math.PI) / 180
    return `${cx + rr * Math.cos(rad)} ${cy + rr * Math.sin(rad)}`
  }
  return (
    <SectionCard title="Backlink Health" subtitle="Estimated toxic / spammy share" icon={<ShieldAlert className="h-4 w-4" />}>
      <div className="flex flex-col items-center">
        <svg viewBox="0 0 200 116" className="w-full max-w-[240px]">
          <path d={`M ${polar(0)} A ${rr} ${rr} 0 0 1 ${polar(180)}`} fill="none" stroke="var(--muted)" strokeWidth={16} strokeLinecap="round" />
          <path d={`M ${polar(0)} A ${rr} ${rr} 0 0 1 ${polar(angle)}`} fill="none" stroke={color} strokeWidth={16} strokeLinecap="round" />
          <text x={cx} y={cy - 8} textAnchor="middle" style={{ fontSize: 30, fontWeight: 700, fill: "var(--foreground)" }}>{Math.round(toxic * 100)}%</text>
          <text x={cx} y={cy + 12} textAnchor="middle" style={{ fontSize: 11, fill: "var(--muted-foreground)" }}>toxic</text>
        </svg>
        <p className="mt-2 text-center text-xs text-[color:var(--muted-foreground)]">
          <span className="font-semibold" style={{ color: GAIN }}>{Math.round(healthy * 100)}% healthy</span> — no urgent disavow needed.
        </p>
      </div>
    </SectionCard>
  )
}

/* ── Referring domains table ── */
function DofollowTag({ on }: { on: boolean }) {
  return (
    <span
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-medium",
        on ? "bg-[color:var(--success)]/12 text-[color:var(--success)]" : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]"
      )}
    >
      {on ? "Follow" : "Nofollow"}
    </span>
  )
}

export function ReferringDomainsCard({ profile }: { profile: BacklinksProfile }) {
  return (
    <SectionCard
      title="Top Referring Domains"
      subtitle={`${full(profile.referringDomains)} domains link to you`}
      icon={<Globe2 className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">Domain</th>
              <th className="px-3 py-2.5 text-right font-medium">AS</th>
              <th className="px-3 py-2.5 text-right font-medium">Backlinks</th>
              <th className="px-3 py-2.5 text-center font-medium">Type</th>
              <th className="px-3 py-2.5 text-center font-medium">Attribute</th>
              <th className="px-3 py-2.5 text-right font-medium">First Seen</th>
            </tr>
          </thead>
          <tbody>
            {profile.referring.map((r) => (
              <tr key={r.domain} className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--muted)]/40">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <DomainTile domain={r.domain} size={22} />
                    <span className="text-[13px] font-medium text-[color:var(--foreground)]">{r.domain}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1.5 tabular-nums text-[color:var(--foreground)]">
                    {r.authority}
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: authorityColor(r.authority) }} />
                  </span>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--foreground)]">{full(r.backlinks)}</td>
                <td className="px-3 py-2.5 text-center">
                  <span className="rounded-md bg-[color:var(--muted)] px-1.5 py-0.5 text-[10px] font-medium capitalize text-[color:var(--muted-foreground)]">{r.type}</span>
                </td>
                <td className="px-3 py-2.5 text-center"><DofollowTag on={r.dofollow} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--muted-foreground)]">{r.firstSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

/* ── Top backlinks table ── */
export function TopBacklinksCard({ profile }: { profile: BacklinksProfile }) {
  return (
    <SectionCard
      title="Top Backlinks"
      subtitle="Your strongest individual links, by source authority"
      icon={<ListChecks className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-4 py-2.5 font-medium">Source Page</th>
              <th className="px-3 py-2.5 text-right font-medium">AS</th>
              <th className="px-3 py-2.5 font-medium">Anchor &amp; Target</th>
              <th className="px-3 py-2.5 text-center font-medium">Attribute</th>
              <th className="px-3 py-2.5 text-right font-medium">First Seen</th>
            </tr>
          </thead>
          <tbody>
            {profile.topBacklinks.map((b, i) => (
              <tr key={i} className="border-b border-[color:var(--border)] last:border-0 hover:bg-[color:var(--muted)]/40">
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <DomainTile domain={b.sourceDomain} size={22} />
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-[color:var(--foreground)]">{b.sourceDomain}</p>
                      <a href={`https://${b.sourceUrl}`} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-[240px] items-center gap-1 truncate text-[11px] text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)]">
                        <span className="truncate">/{b.sourceUrl.split("/").slice(1).join("/")}</span>
                        <ExternalLink className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right">
                  <span className="inline-flex items-center gap-1.5 tabular-nums text-[color:var(--foreground)]">
                    {b.authority}
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: authorityColor(b.authority) }} />
                  </span>
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-1.5 text-[13px]">
                    <span className="rounded bg-[color:var(--primary)]/8 px-1.5 py-0.5 text-[color:var(--foreground)]">“{b.anchor}”</span>
                    <ArrowUpRight className="h-3 w-3 text-[color:var(--muted-foreground)]" />
                    <span className="font-mono text-[11px] text-[color:var(--muted-foreground)]">{b.targetPath}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-center"><DofollowTag on={b.dofollow} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--muted-foreground)]">{b.firstSeen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
