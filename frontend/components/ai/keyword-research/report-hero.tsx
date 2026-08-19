"use client"

import { type ReactNode } from "react"
import {
  compact,
  full,
  money,
  KD_COLORS,
  type KeywordResearchResult,
  type KeywordOverview,
  type DifficultyFactors,
  type DifficultyBand,
  type CountryVolume,
  type Country,
} from "@/lib/keyword-research"
import { cn } from "@/lib/utils"
import {
  CountUp,
  useCountUp,
  IntentChip,
  TrendPill,
  Sparkline,
  MiniMeter,
  densityLabel,
  CopyButton,
} from "./primitives"

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
  } catch {
    return ""
  }
}

/* ── KeywordHeader ── */
export function KeywordHeader({ result }: { result: KeywordResearchResult }) {
  const o = result.overview
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3.5 shadow-sm md:flex-row md:items-center md:justify-between md:px-5">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="truncate text-xl font-bold capitalize text-[color:var(--foreground)] md:text-2xl">
          {result.resolvedKeyword}
        </h2>
        <CopyButton text={result.resolvedKeyword} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <IntentChip intent={o.intent.primary} />
        <TrendPill dir={o.trend} pct={o.trendPct} goodUp />
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-0.5 text-xs font-medium text-[color:var(--foreground)]">
          <span className="text-sm leading-none">{result.country.flag}</span>
          {result.country.name}
        </span>
        <span className="text-xs text-[color:var(--muted-foreground)]">Updated {fmtDate(result.updatedAt)}</span>
      </div>
    </div>
  )
}

/* ─────────────────────────────────────────────────────────────
   Overview KPI cards — Semrush-style full-width row (per reference).
   Static design build: presentational only, fixed sample data.
   ───────────────────────────────────────────────────────────── */

/* card shell — clean, spacious, theme-aware */
function KpiCard({
  label,
  children,
  className,
}: {
  label?: string
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm md:p-5",
        className
      )}
    >
      {label && (
        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">{label}</span>
      )}
      {children}
    </div>
  )
}

/* compact keyword-difficulty ring (lives inside the Volume card) */
function polar(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}
function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const s = polar(cx, cy, r, startDeg)
  const e = polar(cx, cy, r, endDeg)
  const large = (endDeg - startDeg) % 360 > 180 ? 1 : 0
  return `M ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)}`
}

function KdRing({ score, band, size = 82 }: { score: number; band: DifficultyBand; size?: number }) {
  const color = KD_COLORS[band]
  const animated = useCountUp(score, 1000)
  const frac = Math.min(1, Math.max(0, animated / 100))
  const START = 135
  const SWEEP = 270
  const cx = 100
  const cy = 100
  const r = 78
  return (
    <svg viewBox="0 0 200 200" style={{ width: size, height: size }} className="shrink-0" role="img" aria-label={`Keyword difficulty ${score} out of 100`}>
      <path d={arcPath(cx, cy, r, START, START + SWEEP)} fill="none" stroke={`${color}24`} strokeWidth={18} strokeLinecap="round" />
      <path d={arcPath(cx, cy, r, START, START + SWEEP * frac)} fill="none" stroke={color} strokeWidth={18} strokeLinecap="round" />
      <text x={cx} y={cy + 15} textAnchor="middle" className="tabular-nums" style={{ fill: "var(--foreground)", fontSize: 46, fontWeight: 700 }}>
        {Math.round(animated)}
      </text>
    </svg>
  )
}

/* tiny labelled factor used in the difficulty mini-grid */
function FactorMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-[10px] uppercase tracking-wide text-[color:var(--muted-foreground)]">{label}</div>
      <div className="text-sm font-semibold tabular-nums text-[color:var(--foreground)]">{value}</div>
    </div>
  )
}

/* per-country volume breakdown with proportional bars (Global Volume card) */
function CountryBars({ rows }: { rows: CountryVolume[] }) {
  const top = rows.slice(0, 6)
  const rest = rows.slice(6)
  const otherVol = rest.reduce((s, r) => s + r.volume, 0)
  const max = Math.max(1, top[0]?.volume ?? 1, otherVol)
  return (
    <div className="mt-3 space-y-2">
      {top.map((r) => (
        <div key={r.country.code} className="flex items-center gap-2.5">
          <span className="flex w-14 shrink-0 items-center gap-1 text-xs font-medium text-[color:var(--foreground)]">
            <span className="text-sm leading-none">{r.country.flag}</span>
            {r.country.code}
          </span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--muted)]">
            <div
              className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-700 ease-out"
              style={{ width: `${Math.round((r.volume / max) * 100)}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-[color:var(--muted-foreground)]">
            {compact(r.volume)}
          </span>
        </div>
      ))}
      {otherVol > 0 && (
        <div className="flex items-center gap-2.5">
          <span className="w-14 shrink-0 text-xs font-medium text-[color:var(--muted-foreground)]">Other</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--muted)]">
            <div
              className="h-full rounded-full bg-[color:var(--primary)]/40 transition-[width] duration-700 ease-out"
              style={{ width: `${Math.round((otherVol / max) * 100)}%` }}
            />
          </div>
          <span className="w-14 shrink-0 text-right text-xs font-semibold tabular-nums text-[color:var(--muted-foreground)]">
            {compact(otherVol)}
          </span>
        </div>
      )}
    </div>
  )
}

/* small trend bar chart (Search Intent card) */
function TrendBars({ data }: { data: number[] }) {
  const max = Math.max(1, ...data)
  return (
    <div className="flex h-16 items-end gap-[3px]">
      {data.map((v, i) => (
        <div
          key={i}
          className="flex-1 rounded-t-sm bg-[color:var(--primary)]/60 transition-[height] duration-700 ease-out"
          style={{ height: `${Math.max(8, Math.round((v / max) * 100))}%` }}
        />
      ))}
    </div>
  )
}

/* labelled sub-metric used inside the grouped economics card */
function SubMetric({
  label,
  value,
  sub,
}: {
  label: string
  value: ReactNode
  sub?: ReactNode
}) {
  return (
    <div>
      <span className="text-sm font-medium text-[color:var(--muted-foreground)]">{label}</span>
      <div className="mt-0.5 text-2xl font-bold text-[color:var(--foreground)] md:text-[26px]">{value}</div>
      {sub && <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">{sub}</div>}
    </div>
  )
}

export function OverviewKpiTiles({
  overview,
  factors,
  byCountry,
  country,
  currency,
}: {
  overview: KeywordOverview
  factors: DifficultyFactors
  byCountry: CountryVolume[]
  country: Country
  currency: string
}) {
  const o = overview
  const kd = o.difficulty
  const kdColor = KD_COLORS[kd.band]
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {/* Card 1 — Volume + Keyword Difficulty */}
      <KpiCard label="Volume">
        <div className="mt-1 flex items-center gap-2 text-3xl font-bold text-[color:var(--foreground)] md:text-4xl">
          <CountUp value={o.volume} />
          <span className="text-2xl leading-none">{country.flag}</span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          <TrendPill
            dir={o.volumeDelta.value > 0 ? "up" : o.volumeDelta.value < 0 ? "down" : "flat"}
            pct={o.volumeDelta.value}
            goodUp
            size="xs"
          />
          <span className="text-[11px] text-[color:var(--muted-foreground)]">{o.volumeDelta.period}</span>
        </div>

        <div className="my-3 border-t border-[color:var(--border)]" />

        <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Keyword Difficulty</span>
        <div className="mt-1 flex items-center gap-3">
          <KdRing score={kd.score} band={kd.band} />
          <div className="min-w-0">
            <div className="text-2xl font-bold tabular-nums" style={{ color: kdColor }}>{kd.score}%</div>
            <span
              className="mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold"
              style={{ backgroundColor: `${kdColor}18`, color: kdColor }}
            >
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: kdColor }} />
              {kd.label}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-[color:var(--muted-foreground)]">{kd.gloss}</p>

        <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-2.5 border-t border-[color:var(--border)] pt-3">
          <FactorMini label="Ref. domains" value={full(factors.avgReferringDomains)} />
          <FactorMini label="Page / domain" value={`${factors.avgPageAuthority} / ${factors.avgDomainAuthority}`} />
          <FactorMini label="Strong AS > 60" value={`${Math.round(factors.strongDomainsShare * 100)}%`} />
          <FactorMini label="Backlinks est." value={compact(factors.backlinksNeededEstimate)} />
        </div>
      </KpiCard>

      {/* Card 2 — Global Volume + country bars */}
      <KpiCard label="Global Volume">
        <div className="mt-1 text-3xl font-bold text-[color:var(--foreground)] md:text-4xl">
          <CountUp value={o.globalVolume} />
        </div>
        <CountryBars rows={byCountry} />
      </KpiCard>

      {/* Card 3 — Search Intent + Trend */}
      <KpiCard label="Search Intent">
        <div className="mt-2">
          <IntentChip intent={o.intent.primary} />
        </div>
        <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
          Dominant intent across the SERP for this keyword.
        </p>
        <div className="mt-auto pt-4">
          <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Trend</span>
          <div className="mt-2">
            <TrendBars data={o.volumeTrend} />
          </div>
        </div>
      </KpiCard>

      {/* Card 4 — CPC · Competitive Density · SERP Results */}
      <KpiCard className="gap-3">
        <SubMetric
          label="Cost per Click (CPC)"
          value={<CountUp value={o.cpc.value} format={(n) => money(n, currency)} />}
          sub={<>Range {money(o.cpc.low, currency)}–{money(o.cpc.high, currency)}</>}
        />
        <div className="border-t border-[color:var(--border)]" />
        <div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-medium text-[color:var(--muted-foreground)]">Competitive Density</span>
            <span className="text-xs font-medium text-[color:var(--muted-foreground)]">{densityLabel(o.competitiveDensity)}</span>
          </div>
          <div className="mt-0.5 text-2xl font-bold text-[color:var(--foreground)] md:text-[26px]">
            {o.competitiveDensity.toFixed(2)}
          </div>
          <MiniMeter value={o.competitiveDensity} className="mt-2" />
        </div>
        <div className="border-t border-[color:var(--border)]" />
        <SubMetric
          label="SERP Results"
          value={<CountUp value={o.serpResults} />}
          sub={<>{o.adResults} ads · {o.plaResults} shopping</>}
        />
      </KpiCard>
    </div>
  )
}
