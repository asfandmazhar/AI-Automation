"use client"

import { useState } from "react"
import { Radar as RadarIcon, ScatterChart } from "lucide-react"
import { compact, type CRDomain } from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { SectionCard } from "@/components/ai/keyword-research/primitives"

function polar(cx: number, cy: number, r: number, angleDeg: number): [number, number] {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)]
}

/* ── Competitive Radar — relative fingerprint across 5 dimensions ── */
const DIMS: { key: keyof CRDomain; label: string }[] = [
  { key: "authorityScore", label: "Authority" },
  { key: "referringDomains", label: "Ref. Domains" },
  { key: "backlinks", label: "Backlinks" },
  { key: "organicTraffic", label: "Traffic" },
  { key: "organicKeywords", label: "Keywords" },
]

export function CompetitiveRadar({ domains }: { domains: CRDomain[] }) {
  const [active, setActive] = useState<string | null>(null)
  const cx = 150
  const cy = 120
  const R = 84
  const N = DIMS.length

  const maxes = DIMS.map((d) => Math.max(1, ...domains.map((x) => x[d.key] as number)))

  return (
    <SectionCard
      title="Competitive Radar"
      subtitle="Each axis normalised to the strongest domain in view"
      icon={<RadarIcon className="h-4 w-4" />}
    >
      <svg viewBox="0 0 300 250" className="w-full" role="img" aria-label="Competitive radar comparison">
        {/* rings */}
        {[0.25, 0.5, 0.75, 1].map((g) => {
          const pts = DIMS.map((_, i) => polar(cx, cy, R * g, i * (360 / N)).join(",")).join(" ")
          return <polygon key={g} points={pts} fill="none" stroke="var(--border)" strokeWidth={1} />
        })}
        {/* axes + labels */}
        {DIMS.map((d, i) => {
          const [x, y] = polar(cx, cy, R, i * (360 / N))
          const [lx, ly] = polar(cx, cy, R + 20, i * (360 / N))
          const anchor = lx > cx + 5 ? "start" : lx < cx - 5 ? "end" : "middle"
          return (
            <g key={d.key as string}>
              <line x1={cx} y1={cy} x2={x} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text
                x={lx}
                y={ly}
                textAnchor={anchor}
                dominantBaseline="middle"
                style={{ fontSize: 10, fill: "var(--muted-foreground)" }}
              >
                {d.label}
              </text>
            </g>
          )
        })}
        {/* domain polygons */}
        {domains.map((dm) => {
          const dim = active !== null && active !== dm.id
          // "you" carries the theme primary (var(--primary)) so it matches the line charts in every theme
          const color = dm.color ?? "var(--muted-foreground)"
          const pts = DIMS.map((d, i) => {
            const frac = (dm[d.key] as number) / maxes[i]
            return polar(cx, cy, R * Math.max(0.02, frac), i * (360 / N)).join(",")
          }).join(" ")
          return (
            <polygon
              key={dm.id}
              points={pts}
              fill={color}
              fillOpacity={dim ? 0.03 : 0.14}
              stroke={color}
              strokeWidth={dm.isYou ? 2.5 : 1.75}
              strokeOpacity={dim ? 0.25 : 1}
              style={{ transition: "fill-opacity .2s, stroke-opacity .2s" }}
            />
          )
        })}
      </svg>
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {domains.map((d) => (
          <button
            key={d.id}
            type="button"
            onMouseEnter={() => setActive(d.id)}
            onMouseLeave={() => setActive(null)}
            className="inline-flex items-center gap-1.5 text-xs cursor-pointer"
          >
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: d.color ?? "var(--muted-foreground)" }} />
            <span className={cn("text-[color:var(--foreground)]", d.isYou && "font-semibold")}>{d.domain}</span>
          </button>
        ))}
      </div>
    </SectionCard>
  )
}

/* ── Positioning Quadrant — Authority (x) vs Traffic (y, log), size = ref. domains ── */
export function PositioningQuadrant({ domains }: { domains: CRDomain[] }) {
  const W = 460
  const H = 300
  const padL = 44
  const padR = 20
  const padT = 20
  const padB = 34
  const plotW = W - padL - padR
  const plotH = H - padT - padB

  // x: authority 0–100 (linear)
  const xAt = (score: number) => padL + (score / 100) * plotW
  // y: organic traffic (log10) inverted
  const logVals = domains.map((d) => Math.log10(Math.max(10, d.organicTraffic)))
  const yMin = Math.floor(Math.min(...logVals) - 0.3)
  const yMax = Math.ceil(Math.max(...logVals) + 0.3)
  const yAt = (traffic: number) => {
    const l = Math.log10(Math.max(10, traffic))
    return padT + (1 - (l - yMin) / (yMax - yMin)) * plotH
  }
  // bubble radius by referring domains
  const rdMax = Math.max(1, ...domains.map((d) => d.referringDomains))
  const rAt = (rd: number) => 8 + Math.sqrt(rd / rdMax) * 16

  const midX = xAt(50)

  return (
    <SectionCard
      title="Market Positioning"
      subtitle="Authority vs organic traffic — bubble size = referring domains"
      icon={<ScatterChart className="h-4 w-4" />}
    >
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Competitive positioning map">
        {/* quadrant guides */}
        <line x1={midX} y1={padT} x2={midX} y2={padT + plotH} stroke="var(--border)" strokeDasharray="4 4" strokeWidth={1} />
        {/* plot frame */}
        <line x1={padL} y1={padT + plotH} x2={padL + plotW} y2={padT + plotH} stroke="var(--border)" strokeWidth={1} />
        <line x1={padL} y1={padT} x2={padL} y2={padT + plotH} stroke="var(--border)" strokeWidth={1} />

        {/* corner labels */}
        <text x={padL + plotW - 4} y={padT + 12} textAnchor="end" style={{ fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 600, opacity: 0.7 }}>LEADERS</text>
        <text x={padL + 4} y={padT + 12} textAnchor="start" style={{ fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 600, opacity: 0.7 }}>ESTABLISHED</text>
        <text x={padL + plotW - 4} y={padT + plotH - 6} textAnchor="end" style={{ fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 600, opacity: 0.7 }}>CHALLENGERS</text>
        <text x={padL + 4} y={padT + plotH - 6} textAnchor="start" style={{ fontSize: 9, fill: "var(--muted-foreground)", fontWeight: 600, opacity: 0.7 }}>NICHE</text>

        {/* y ticks */}
        {Array.from({ length: yMax - yMin + 1 }, (_, i) => yMin + i).map((l) => {
          const y = padT + (1 - (l - yMin) / (yMax - yMin)) * plotH
          return (
            <g key={l}>
              <line x1={padL - 4} y1={y} x2={padL} y2={y} stroke="var(--border)" strokeWidth={1} />
              <text x={padL - 7} y={y} textAnchor="end" dominantBaseline="middle" style={{ fontSize: 9, fill: "var(--muted-foreground)" }}>
                {compact(Math.pow(10, l))}
              </text>
            </g>
          )
        })}
        {/* x ticks */}
        {[0, 25, 50, 75, 100].map((s) => (
          <text key={s} x={xAt(s)} y={padT + plotH + 14} textAnchor="middle" style={{ fontSize: 9, fill: "var(--muted-foreground)" }}>
            {s}
          </text>
        ))}
        <text x={padL + plotW / 2} y={H - 4} textAnchor="middle" style={{ fontSize: 9, fill: "var(--muted-foreground)" }}>
          Authority Score →
        </text>

        {/* bubbles */}
        {domains.map((d) => {
          const x = xAt(d.authorityScore)
          const y = yAt(d.organicTraffic)
          const r = rAt(d.referringDomains)
          const color = d.color ?? "var(--muted-foreground)"
          return (
            <g key={d.id}>
              <circle cx={x} cy={y} r={r} fill={color} fillOpacity={0.18} stroke={color} strokeWidth={d.isYou ? 2.5 : 1.5} />
              <circle cx={x} cy={y} r={2.5} fill={color} />
              <text x={x} y={y - r - 4} textAnchor="middle" style={{ fontSize: 9.5, fontWeight: d.isYou ? 700 : 500, fill: "var(--foreground)" }}>
                {d.domain.replace(/\.(com|net|org)$/, "")}
              </text>
            </g>
          )
        })}
      </svg>
    </SectionCard>
  )
}
