"use client"

/* Competitor Research — trend charts + backlink-profile bars.
   All static: fixed sample data, no backend. */

import { useState } from "react"
import { LineChart as LineIcon, Link2, ShieldCheck } from "lucide-react"
import { compact, pct, type CRDomain } from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { SectionCard, DomainTile } from "@/components/ai/keyword-research/primitives"

/* nice round upper bound so the top gridline is a clean number */
function niceMax(v: number): number {
  if (v <= 0) return 1
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const n = v / pow
  const step = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10
  return step * pow
}

export type Series = { id: string; label: string; color: string; values: number[] }

/* ── reusable multi-series line chart (SVG + HTML overlay, no libraries) ── */
export function LineChart({
  series,
  months,
  height = 190,
  format = compact,
  yMax,
}: {
  series: Series[]
  months: string[]
  height?: number
  format?: (n: number) => string
  yMax?: number
}) {
  const [hover, setHover] = useState<number | null>(null)
  const n = months.length
  const rawMax = Math.max(1, ...series.flatMap((s) => s.values))
  const max = yMax ?? niceMax(rawMax)
  const xAt = (i: number) => (n === 1 ? 0 : (i / (n - 1)) * 100)
  const yAt = (v: number) => (1 - v / max) * 100

  const grid = [0, 0.25, 0.5, 0.75, 1]

  return (
    <div>
      <div className="relative w-full" style={{ height }}>
        {/* y-axis tick labels */}
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex w-9 flex-col justify-between">
          {[...grid].reverse().map((g) => (
            <span key={g} className="-translate-y-1/2 text-[9px] tabular-nums text-[color:var(--muted-foreground)]">
              {format(Math.round(max * g))}
            </span>
          ))}
        </div>

        <div className="absolute inset-y-0 left-9 right-0">
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {/* horizontal gridlines */}
            {grid.map((g) => (
              <line
                key={g}
                x1="0"
                x2="100"
                y1={g * 100}
                y2={g * 100}
                stroke="var(--border)"
                strokeWidth={1}
                vectorEffect="non-scaling-stroke"
              />
            ))}
            {/* area + line per series */}
            {series.map((s) => {
              const pts = s.values.map((v, i) => `${xAt(i)},${yAt(v)}`)
              const line = "M" + pts.join(" L")
              const area = `M${xAt(0)},100 L${pts.join(" L")} L${xAt(n - 1)},100 Z`
              const fill = s.color === "var(--primary)" ? "var(--primary)" : s.color
              return (
                <g key={s.id}>
                  <path d={area} fill={fill} opacity={0.08} />
                  <path
                    d={line}
                    fill="none"
                    stroke={fill}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    vectorEffect="non-scaling-stroke"
                  />
                </g>
              )
            })}
            {/* hover guide */}
            {hover != null && (
              <line
                x1={xAt(hover)}
                x2={xAt(hover)}
                y1="0"
                y2="100"
                stroke="var(--foreground)"
                strokeWidth={1}
                strokeDasharray="3 3"
                opacity={0.35}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* end-point dots (HTML so they never distort under non-uniform scale) */}
          {series.map((s) => {
            const v = s.values[n - 1]
            return (
              <span
                key={s.id}
                className="absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[color:var(--card)]"
                style={{ left: "100%", top: `${yAt(v)}%`, backgroundColor: s.color }}
              />
            )
          })}

          {/* hover dots + tooltip */}
          {hover != null && (
            <>
              {series.map((s) => (
                <span
                  key={s.id}
                  className="absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[color:var(--card)]"
                  style={{ left: `${xAt(hover)}%`, top: `${yAt(s.values[hover])}%`, backgroundColor: s.color }}
                />
              ))}
              <div
                className="pointer-events-none absolute z-20 -translate-y-2 whitespace-nowrap rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-2.5 py-1.5 shadow-lg"
                style={{
                  left: `${xAt(hover)}%`,
                  top: 0,
                  transform: `translateX(${hover > n / 2 ? "-100%" : "0"}) translateY(-2px)`,
                }}
              >
                <div className="mb-1 text-[10px] font-medium text-[color:var(--muted-foreground)]">{months[hover]}</div>
                {series.map((s) => (
                  <div key={s.id} className="flex items-center gap-1.5 text-[11px]">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-[color:var(--muted-foreground)]">{s.label}</span>
                    <span className="ml-auto pl-2 font-semibold tabular-nums text-[color:var(--foreground)]">
                      {format(s.values[hover])}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* invisible hit columns */}
          <div className="absolute inset-0 flex">
            {months.map((m, i) => (
              <button
                key={i}
                type="button"
                aria-label={`${m}`}
                className="h-full flex-1 cursor-default"
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* x-axis labels */}
      <div className="mt-1.5 flex pl-9">
        {months.map((m, i) => (
          <span key={i} className="flex-1 text-center text-[9px] text-[color:var(--muted-foreground)]">
            {i % 2 === 0 ? m.split(" ")[0] : ""}
          </span>
        ))}
      </div>
    </div>
  )
}

/* shared legend row */
function Legend({ domains }: { domains: CRDomain[] }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {domains.map((d) => (
        <span key={d.id} className="inline-flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color }} />
          <span className={cn("text-[color:var(--foreground)]", d.isYou && "font-semibold")}>{d.domain}</span>
        </span>
      ))}
    </div>
  )
}

/* ── Authority Score trend (0–100) ── */
export function AuthorityTrendCard({ domains, months }: { domains: CRDomain[]; months: string[] }) {
  const series: Series[] = domains.map((d) => ({ id: d.id, label: d.domain, color: d.color ?? "var(--primary)", values: d.authorityTrend }))
  return (
    <SectionCard title="Authority Score" subtitle="Last 12 months" icon={<LineIcon className="h-4 w-4" />} actions={<Legend domains={domains} />}>
      <LineChart series={series} months={months} yMax={100} format={(n) => `${n}`} />
    </SectionCard>
  )
}

/* ── Referring Domains trend ── */
export function RefDomainsTrendCard({ domains, months }: { domains: CRDomain[]; months: string[] }) {
  const series: Series[] = domains.map((d) => ({ id: d.id, label: d.domain, color: d.color ?? "var(--primary)", values: d.refDomainsTrend }))
  return (
    <SectionCard title="Referring Domains" subtitle="Last 12 months" icon={<LineIcon className="h-4 w-4" />} actions={<Legend domains={domains} />}>
      <LineChart series={series} months={months} />
    </SectionCard>
  )
}

/* ── stacked proportion bar (used by Backlink Types & Link Attributes) ── */
function ProportionBar({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  return (
    <div className="flex h-3.5 w-full overflow-hidden rounded-full bg-[color:var(--muted)]">
      {segments.map((s, i) => (
        <span
          key={i}
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${s.value * 100}%`, backgroundColor: s.color, marginLeft: i === 0 ? 0 : 1 }}
          title={`${s.label} — ${pct(s.value)}`}
        />
      ))}
    </div>
  )
}

const TYPE_COLORS = { text: "#4f46e5", image: "#6366f1", form: "#a5b4fc", frame: "#c7d2fe" }
const ATTR_COLORS = { follow: "#3b82f6", nofollow: "#c4b5fd" }

export function BacklinkTypesCard({ domains }: { domains: CRDomain[] }) {
  return (
    <SectionCard title="Backlink Types" subtitle="Composition of each backlink profile" icon={<Link2 className="h-4 w-4" />}>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {(["text", "image", "form", "frame"] as const).map((k) => (
          <span key={k} className="inline-flex items-center gap-1.5 text-xs capitalize text-[color:var(--muted-foreground)]">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: TYPE_COLORS[k] }} />
            {k}
          </span>
        ))}
      </div>
      <div className="space-y-3.5">
        {domains.map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <span className="flex w-28 shrink-0 items-center gap-1.5 sm:w-40">
              <DomainTile domain={d.domain} size={18} />
              <span className={cn("truncate text-xs text-[color:var(--foreground)]", d.isYou && "font-semibold")}>{d.domain}</span>
            </span>
            <div className="min-w-0 flex-1">
              <ProportionBar
                segments={[
                  { label: "Text", value: d.types.text, color: TYPE_COLORS.text },
                  { label: "Image", value: d.types.image, color: TYPE_COLORS.image },
                  { label: "Form", value: d.types.form, color: TYPE_COLORS.form },
                  { label: "Frame", value: d.types.frame, color: TYPE_COLORS.frame },
                ]}
              />
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}

export function LinkAttributesCard({ domains }: { domains: CRDomain[] }) {
  return (
    <SectionCard title="Link Attributes" subtitle="Follow vs Nofollow + Sponsored + UGC" icon={<ShieldCheck className="h-4 w-4" />}>
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ATTR_COLORS.follow }} /> Follow
        </span>
        <span className="inline-flex items-center gap-1.5 text-xs text-[color:var(--muted-foreground)]">
          <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ATTR_COLORS.nofollow }} /> Nofollow + Sponsored + UGC
        </span>
      </div>
      <div className="space-y-3.5">
        {domains.map((d) => (
          <div key={d.id} className="flex items-center gap-3">
            <span className="flex w-28 shrink-0 items-center gap-1.5 sm:w-40">
              <DomainTile domain={d.domain} size={18} />
              <span className={cn("truncate text-xs text-[color:var(--foreground)]", d.isYou && "font-semibold")}>{d.domain}</span>
            </span>
            <div className="min-w-0 flex-1">
              <ProportionBar
                segments={[
                  { label: "Follow", value: d.attributes.follow, color: ATTR_COLORS.follow },
                  { label: "Nofollow", value: d.attributes.nofollow, color: ATTR_COLORS.nofollow },
                ]}
              />
            </div>
            <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums text-[color:var(--foreground)]">
              {pct(d.attributes.follow)}
            </span>
          </div>
        ))}
      </div>
    </SectionCard>
  )
}
