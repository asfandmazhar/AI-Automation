"use client"

import { useState } from "react"
import {
  BarChart3, PieChart, Globe2, LayoutGrid, Table2,
  AlignLeft, HelpCircle, Link2, Video, Image as ImageIcon, Star,
  Megaphone, ShoppingBag, Info, MapPin, MessagesSquare, Newspaper,
} from "lucide-react"
import {
  compact, full, money, INTENT_META, KD_COLORS,
  type Seasonality, type IntentSlice, type Intent,
  type CountryVolume, type SerpFeature, type SerpFeatureKey, type CountryCode,
} from "@/lib/keyword-research"
import { cn } from "@/lib/utils"
import { SectionCard, useIsDark, intentColor, KdPill } from "./primitives"

/* small ghost toggle button used in card headers */
function GhostToggle({ active, onClick, children }: { active?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-[11px] font-medium transition-colors cursor-pointer",
        active
          ? "border-[color:var(--primary)] bg-[color:var(--primary)]/8 text-[color:var(--primary)]"
          : "border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
      )}
    >
      {children}
    </button>
  )
}

/* ── VolumeTrendSeasonality (column chart) ── */
export function VolumeTrend({ seasonality }: { seasonality: Seasonality }) {
  const [asTable, setAsTable] = useState(false)
  const [hover, setHover] = useState<number | null>(null)
  const months = seasonality.monthly
  const max = Math.max(...months.map((m) => m.volume)) || 1
  const mean = months.reduce((s, m) => s + m.volume, 0) / months.length
  const peakI = months.findIndex((m) => m.month === seasonality.peakMonth)

  return (
    <SectionCard
      title="Search Volume Trend"
      subtitle={`${seasonality.note} · ${seasonality.yoyChange > 0 ? "+" : ""}${seasonality.yoyChange}% over 12 months`}
      icon={<BarChart3 className="h-4 w-4" />}
      actions={
        <GhostToggle active={asTable} onClick={() => setAsTable((p) => !p)}>
          <Table2 className="h-3 w-3" /> Table
        </GhostToggle>
      }
    >
      {asTable ? (
        <div className="max-h-56 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-[color:var(--card)]">
              <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                <th className="py-1.5 font-medium">Month</th>
                <th className="py-1.5 text-right font-medium">Volume</th>
                <th className="py-1.5 text-right font-medium">MoM</th>
              </tr>
            </thead>
            <tbody>
              {months.map((m, i) => {
                const prev = i > 0 ? months[i - 1].volume : m.volume
                const mom = prev ? Math.round(((m.volume - prev) / prev) * 100) : 0
                return (
                  <tr key={i} className="border-b border-[color:var(--border)] last:border-0">
                    <td className="py-1.5 text-[color:var(--foreground)]">{m.month} {m.year}</td>
                    <td className="py-1.5 text-right tabular-nums text-[color:var(--foreground)]">{full(m.volume)}</td>
                    <td className={cn("py-1.5 text-right tabular-nums", mom > 0 ? "text-[color:var(--success)]" : mom < 0 ? "text-[color:var(--error)]" : "text-[color:var(--muted-foreground)]")}>
                      {mom > 0 ? "+" : ""}{mom}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          {/* gridlines */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-[160px]">
            {[0, 0.25, 0.5, 0.75, 1].map((g) => (
              <div key={g} className="absolute inset-x-0 border-t border-[color:var(--border)]" style={{ top: `${g * 100}%` }} />
            ))}
            {/* mean line */}
            <div className="absolute inset-x-0 border-t border-dashed border-[color:var(--primary)]/40" style={{ top: `${(1 - mean / max) * 100}%` }} />
          </div>

          <div className="relative flex h-[160px] items-end gap-1">
            {months.map((m, i) => {
              const h = (m.volume / max) * 100
              const active = hover === i
              return (
                <div
                  key={i}
                  className="group relative flex h-full flex-1 items-end justify-center"
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                >
                  {i === peakI && (
                    <span className="absolute left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-[color:var(--primary)]" style={{ bottom: `calc(${h}% + 3px)` }} />
                  )}
                  <div
                    className="w-full max-w-[22px] rounded-t-[4px] transition-[filter,opacity] duration-150"
                    style={{
                      height: `${Math.max(2, h)}%`,
                      backgroundColor: "var(--primary)",
                      opacity: hover === null || active ? 1 : 0.45,
                    }}
                  />
                  {active && (
                    <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] px-2 py-1 text-center shadow-lg">
                      <div className="text-[11px] font-semibold tabular-nums text-[color:var(--foreground)]">{full(m.volume)}</div>
                      <div className="text-[10px] text-[color:var(--muted-foreground)]">{m.month} {m.year}</div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          <div className="mt-1.5 flex gap-1">
            {months.map((m, i) => (
              <div key={i} className="flex-1 text-center text-[9px] text-[color:var(--muted-foreground)]">{m.month[0]}</div>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  )
}

/* ── SearchIntentDistribution (segmented bar) ── */
export function IntentDistribution({
  distribution,
  primary,
  activeIntent,
  onFilter,
}: {
  distribution: IntentSlice[]
  primary: Intent
  activeIntent?: Intent | null
  onFilter?: (intent: Intent) => void
}) {
  const isDark = useIsDark()
  const [hover, setHover] = useState<Intent | null>(null)
  const sorted = [...distribution].sort((a, b) => b.share - a.share)

  return (
    <SectionCard
      title="Search Intent"
      subtitle={onFilter ? "Click a segment to filter keyword ideas" : "How the SERP splits across intents"}
      icon={<PieChart className="h-4 w-4" />}
    >
      <div className="flex h-8 w-full overflow-hidden rounded-lg">
        {sorted.map((s, i) => {
          const color = intentColor(s.intent, isDark)
          const dim = hover !== null && hover !== s.intent
          const wide = s.share >= 0.12
          return (
            <button
              type="button"
              key={s.intent}
              onMouseEnter={() => setHover(s.intent)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onFilter?.(s.intent)}
              className={cn("relative flex items-center justify-center transition-opacity", onFilter && "cursor-pointer")}
              style={{
                width: `${s.share * 100}%`,
                backgroundColor: color,
                marginLeft: i === 0 ? 0 : 2,
                opacity: dim ? 0.4 : 1,
                outline: activeIntent === s.intent ? "2px solid var(--foreground)" : "none",
                outlineOffset: -2,
              }}
              aria-label={`${INTENT_META[s.intent].label} ${Math.round(s.share * 100)} percent${onFilter ? " — filter ideas" : ""}`}
              title={`${INTENT_META[s.intent].label} — ${Math.round(s.share * 100)}%`}
            >
              {/* dark ink reads on every fixed intent hue (AA); white failed on the light hues */}
              {wide && <span className="text-[11px] font-semibold" style={{ color: "#0a0a0a" }}>{Math.round(s.share * 100)}%</span>}
            </button>
          )
        })}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
        {sorted.map((s) => {
          const color = intentColor(s.intent, isDark)
          return (
            <button
              type="button"
              key={s.intent}
              onClick={() => onFilter?.(s.intent)}
              onMouseEnter={() => setHover(s.intent)}
              onMouseLeave={() => setHover(null)}
              className={cn(
                "flex items-center justify-between gap-2 rounded-lg px-1.5 py-1 text-left transition-colors",
                onFilter && "cursor-pointer hover:bg-[color:var(--muted)]",
                activeIntent === s.intent && "bg-[color:var(--muted)]"
              )}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
                <span className="truncate text-xs text-[color:var(--foreground)]">
                  {INTENT_META[s.intent].label}
                  {s.intent === primary && <span className="ml-1 text-[10px] text-[color:var(--muted-foreground)]">· primary</span>}
                </span>
              </span>
              <span className="shrink-0 text-xs font-semibold tabular-nums text-[color:var(--foreground)]">{Math.round(s.share * 100)}%</span>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

/* ── GlobalVolumeByCountry (h-bar) ── */
export function GlobalVolume({
  rows,
  selectedCode,
  currency,
  onSelect,
}: {
  rows: CountryVolume[]
  selectedCode: CountryCode
  currency: string
  onSelect?: (code: CountryCode) => void
}) {
  const max = Math.max(...rows.map((r) => r.volume)) || 1
  return (
    <SectionCard title="Global Volume" subtitle="Where the demand lives" icon={<Globe2 className="h-4 w-4" />}>
      <div className="space-y-2.5">
        {rows.map((r) => {
          const isSel = r.country.code === selectedCode
          return (
            <button
              type="button"
              key={r.country.code}
              onClick={() => onSelect?.(r.country.code)}
              className={cn(
                "group grid w-full grid-cols-[auto_1fr_auto] items-center gap-3 rounded-lg px-1.5 py-1 text-left transition-colors",
                onSelect && "cursor-pointer hover:bg-[color:var(--muted)]",
                isSel && "bg-[color:var(--primary)]/8 dark:bg-[color:var(--primary)]/20"
              )}
              title={`${r.country.name}: ${full(r.volume)} · ${Math.round(r.share * 100)}% · KD ${r.difficulty} · CPC ${money(r.cpc, currency)}`}
            >
              <span className="flex w-24 items-center gap-1.5">
                <span className="text-sm leading-none">{r.country.flag}</span>
                <span className="truncate text-xs text-[color:var(--foreground)]">{r.country.code}</span>
                {isSel && <span className="rounded bg-[color:var(--primary)]/12 px-1 text-[9px] font-semibold text-[color:var(--primary)]">You</span>}
              </span>
              <span className="flex items-center gap-2">
                <span className="h-2 flex-1 overflow-hidden rounded-full bg-[color:var(--muted)]">
                  <span className="block h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(r.volume / max) * 100}%`, backgroundColor: "var(--primary)" }} />
                </span>
                <span className="w-12 shrink-0 text-right text-xs font-semibold tabular-nums text-[color:var(--foreground)]">{compact(r.volume)}</span>
              </span>
              <span className="flex w-16 items-center justify-end gap-1">
                <KdPill score={r.difficulty} band={bandFor(r.difficulty)} showScore compact size="xs" />
              </span>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}
function bandFor(score: number) {
  if (score < 15) return "very-easy" as const
  if (score < 30) return "easy" as const
  if (score < 50) return "possible" as const
  if (score < 70) return "difficult" as const
  if (score < 85) return "hard" as const
  return "very-hard" as const
}

/* ── SerpFeaturesPresent (chip row) ── */
const FEATURE_ICON: Record<SerpFeatureKey, React.ComponentType<{ className?: string }>> = {
  featured_snippet: AlignLeft,
  people_also_ask: HelpCircle,
  sitelinks: Link2,
  video: Video,
  image_pack: ImageIcon,
  reviews: Star,
  top_ads: Megaphone,
  bottom_ads: Megaphone,
  shopping: ShoppingBag,
  knowledge_panel: Info,
  local_pack: MapPin,
  faq: MessagesSquare,
  top_stories: Newspaper,
}

export function SerpFeatures({ features }: { features: SerpFeature[] }) {
  const present = features.filter((f) => f.present)
  return (
    <SectionCard
      title="SERP Features"
      subtitle={`${present.length} of ${features.length} features present on the results page`}
      icon={<LayoutGrid className="h-4 w-4" />}
    >
      <div className="flex flex-wrap gap-2">
        {features.map((f) => {
          const Icon = FEATURE_ICON[f.key]
          return (
            <span
              key={f.key}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs transition-colors",
                f.present
                  ? f.ownedByTop
                    ? "border-[color:var(--primary)]/40 bg-[color:var(--primary)]/8 text-[color:var(--foreground)]"
                    : "border-[color:var(--border)] bg-[color:var(--background)] text-[color:var(--foreground)]"
                  : "border-dashed border-[color:var(--muted-foreground)]/30 bg-[color:var(--muted)]/40 text-[color:var(--muted-foreground)] line-through"
              )}
              title={f.present ? (f.ownedByTop ? `${f.label} — held by a top-3 result` : `${f.label} — present`) : `${f.label} — not present`}
            >
              <Icon className={cn("h-3.5 w-3.5", f.present ? (f.ownedByTop ? "text-[color:var(--primary)]" : "text-[color:var(--muted-foreground)]") : "opacity-50")} />
              {f.label}
            </span>
          )
        })}
      </div>
    </SectionCard>
  )
}
