"use client"

import { useState, useMemo } from "react"
import {
  Trophy, ListChecks, Boxes, ArrowUpDown, X, Search, Zap,
  Download, PenLine, ExternalLink, Star,
} from "lucide-react"
import {
  compact, full, money, bandOf, INTENT_META,
  type KeywordResearchResult, type KeywordIdea, type MatchType,
  type Intent, type SerpResultRow, type Cluster, type CountryCode,
} from "@/lib/keyword-research"
import { cn } from "@/lib/utils"
import {
  SectionCard, IntentChip, KdPill, Sparkline, DomainTile, CopyButton, useIsDark, intentColor,
} from "./primitives"

/* ── SerpAnalysisTable ── */
export function SerpAnalysisTable({ rows, currency }: { rows: SerpResultRow[]; currency: string }) {
  return (
    <SectionCard
      title="SERP Analysis"
      subtitle="The pages currently ranking in the top 10 — the competition to beat"
      icon={<Trophy className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--border)] text-left text-[11px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
              <th className="px-3 py-2.5 font-medium">#</th>
              <th className="px-3 py-2.5 font-medium">Result</th>
              <th className="px-3 py-2.5 text-right font-medium">Page AS</th>
              <th className="px-3 py-2.5 text-right font-medium">Domain AS</th>
              <th className="px-3 py-2.5 text-right font-medium">Ref. Domains</th>
              <th className="px-3 py-2.5 text-right font-medium">Backlinks</th>
              <th className="px-3 py-2.5 text-right font-medium">Traffic</th>
              <th className="px-3 py-2.5 text-right font-medium">Keywords</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.position} className="border-b border-[color:var(--border)] last:border-0 transition-colors hover:bg-[color:var(--muted)]">
                <td className="px-3 py-2.5 tabular-nums text-[color:var(--muted-foreground)]">{r.position}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <DomainTile domain={r.domain} size={26} />
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-medium text-[color:var(--foreground)]" title={r.title}>{r.title}</p>
                      <a href={r.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="inline-flex items-center gap-1 text-[11px] text-[color:var(--muted-foreground)] hover:text-[color:var(--primary)]">
                        {r.domain}
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right"><AuthorityCell value={r.pageAuthority} /></td>
                <td className="px-3 py-2.5 text-right"><AuthorityCell value={r.domainAuthority} /></td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--foreground)]">{full(r.referringDomains)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--foreground)]">{compact(r.backlinks)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center justify-end gap-2">
                    <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-[color:var(--muted)] sm:block">
                      <span className="block h-full rounded-full bg-[color:var(--primary)]" style={{ width: `${Math.min(100, (r.trafficShare / 0.28) * 100)}%` }} />
                    </span>
                    <span className="tabular-nums text-[color:var(--foreground)]">{Math.round(r.trafficShare * 100)}%</span>
                  </div>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--muted-foreground)]">{compact(r.urlKeywords)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}
function AuthorityCell({ value }: { value: number }) {
  const color = value >= 70 ? "var(--error)" : value >= 45 ? "var(--warning)" : "var(--success)"
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="tabular-nums text-[color:var(--foreground)]">{value}</span>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
    </span>
  )
}

/* ── KeywordIdeasTable ── */
type SortKey = "keyword" | "volume" | "difficulty" | "cpc"
const TAB_LABEL: Record<MatchType, string> = {
  broad: "Broad match", phrase: "Phrase match", exact: "Exact", related: "Related", questions: "Questions",
}
const TABS: MatchType[] = ["broad", "phrase", "exact", "related", "questions"]

/* module-scoped so its identity is stable (no remount on every keystroke) */
function SortableTh({
  k, label, right, sortKey, onSort,
}: {
  k: SortKey; label: string; right?: boolean; sortKey: SortKey; onSort: (k: SortKey) => void
}) {
  return (
    <th className={cn("px-3 py-2.5", right && "text-right")}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition-colors hover:text-[color:var(--foreground)]",
          sortKey === k ? "text-[color:var(--primary)]" : "text-[color:var(--muted-foreground)]"
        )}
      >
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  )
}

export function KeywordIdeasTable({
  result,
  selected,
  onToggle,
  onToggleMany,
  intentFilter,
  onClearIntent,
  clusterFilter,
  onClearCluster,
  currency,
}: {
  result: KeywordResearchResult
  selected: Set<string>
  onToggle: (idea: KeywordIdea) => void
  onToggleMany: (ideas: KeywordIdea[], select: boolean) => void
  intentFilter: Intent | null
  onClearIntent: () => void
  clusterFilter: Cluster | null
  onClearCluster: () => void
  currency: string
}) {
  const isDark = useIsDark()
  const [tab, setTab] = useState<MatchType>("broad")
  const [query, setQuery] = useState("")
  const [maxKd, setMaxKd] = useState<number>(100)
  const [minVol, setMinVol] = useState<number>(0)
  const [nonBranded, setNonBranded] = useState(false)
  const [quickOnly, setQuickOnly] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>("volume")
  const [asc, setAsc] = useState(false)

  const quickIds = useMemo(() => new Set(result.quickWins.map((k) => k.id)), [result.quickWins])

  const rows = useMemo(() => {
    let list = result.ideas[tab]
    if (query.trim()) list = list.filter((k) => k.keyword.toLowerCase().includes(query.trim().toLowerCase()))
    if (intentFilter) list = list.filter((k) => k.intent === intentFilter)
    if (clusterFilter) list = list.filter((k) => k.clusterId === clusterFilter.id)
    if (maxKd < 100) list = list.filter((k) => k.difficulty <= maxKd)
    if (minVol > 0) list = list.filter((k) => k.volume >= minVol)
    if (nonBranded) list = list.filter((k) => !k.branded)
    if (quickOnly) list = list.filter((k) => quickIds.has(k.id))
    const sorted = [...list].sort((a, b) => {
      const dir = asc ? 1 : -1
      if (sortKey === "keyword") return a.keyword.localeCompare(b.keyword) * dir
      return (a[sortKey] - b[sortKey]) * dir
    })
    return sorted
  }, [result.ideas, tab, query, intentFilter, clusterFilter, maxKd, minVol, nonBranded, quickOnly, quickIds, sortKey, asc])

  const allSelected = rows.length > 0 && rows.every((k) => selected.has(k.id))
  function toggleSort(k: SortKey) {
    if (sortKey === k) setAsc((p) => !p)
    else { setSortKey(k); setAsc(k === "keyword") }
  }
  const Th = ({ k, label, right }: { k: SortKey; label: string; right?: boolean }) => (
    <th className={cn("px-3 py-2.5", right && "text-right")}>
      <button type="button" onClick={() => toggleSort(k)} className={cn("inline-flex items-center gap-1 text-[11px] font-medium uppercase tracking-wide transition-colors hover:text-[color:var(--foreground)]", sortKey === k ? "text-[color:var(--primary)]" : "text-[color:var(--muted-foreground)]")}>
        {label}
        <ArrowUpDown className="h-3 w-3" />
      </button>
    </th>
  )

  return (
    <SectionCard
      title="Keyword Ideas"
      subtitle={`${result.meta.ideasCount} ideas · ${compact(result.meta.totalVolume)} total volume`}
      icon={<ListChecks className="h-4 w-4" />}
      bodyClassName="p-0"
    >
      {/* tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[color:var(--border)] px-3 pt-3">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-lg border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              tab === t
                ? "border-[color:var(--primary)] text-[color:var(--foreground)]"
                : "border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
            )}
          >
            {TAB_LABEL[t]}
            <span className="rounded-full bg-[color:var(--muted)] px-1.5 py-0.5 text-[10px] tabular-nums text-[color:var(--muted-foreground)]">
              {result.ideaTotals[t].count}
            </span>
          </button>
        ))}
      </div>

      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5">
        <div className="relative flex-1 min-w-[160px]">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter ideas…"
            className="h-8 w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] pl-8 pr-2 text-xs text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/70 focus:border-[color:var(--primary)] focus:outline-none"
          />
        </div>
        <select value={maxKd} onChange={(e) => setMaxKd(Number(e.target.value))} className="h-8 cursor-pointer rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-2 text-xs text-[color:var(--foreground)] focus:outline-none">
          <option value={100}>KD: Any</option>
          <option value={30}>KD ≤ 30 (Easy)</option>
          <option value={50}>KD ≤ 50</option>
          <option value={70}>KD ≤ 70</option>
        </select>
        <select value={minVol} onChange={(e) => setMinVol(Number(e.target.value))} className="h-8 cursor-pointer rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-2 text-xs text-[color:var(--foreground)] focus:outline-none">
          <option value={0}>Vol: Any</option>
          <option value={100}>≥ 100</option>
          <option value={500}>≥ 500</option>
          <option value={1000}>≥ 1K</option>
        </select>
        <FilterToggle active={quickOnly} onClick={() => setQuickOnly((p) => !p)} icon={<Zap className="h-3 w-3" />}>Quick wins</FilterToggle>
        <FilterToggle active={nonBranded} onClick={() => setNonBranded((p) => !p)}>Non-branded</FilterToggle>
      </div>

      {/* active cross-filters */}
      {(intentFilter || clusterFilter) && (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5">
          <span className="text-[11px] text-[color:var(--muted-foreground)]">Filtered by:</span>
          {intentFilter && (
            <button type="button" onClick={onClearIntent} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--foreground)] hover:bg-[color:var(--muted)] cursor-pointer">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: intentColor(intentFilter, isDark) }} />
              {INTENT_META[intentFilter].label}
              <X className="h-3 w-3" />
            </button>
          )}
          {clusterFilter && (
            <button type="button" onClick={onClearCluster} className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2 py-0.5 text-[11px] text-[color:var(--foreground)] hover:bg-[color:var(--muted)] cursor-pointer">
              {clusterFilter.topic}
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      )}

      {/* table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-y border-[color:var(--border)] bg-[color:var(--muted)]/40 text-left">
              <th className="px-3 py-2.5">
                <input type="checkbox" checked={allSelected} onChange={() => onToggleMany(rows, !allSelected)} className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--primary)]" aria-label="Select all" />
              </th>
              <Th k="keyword" label="Keyword" />
              <th className="px-3 py-2.5 text-[11px] font-medium uppercase tracking-wide text-[color:var(--muted-foreground)]">Intent</th>
              <Th k="volume" label="Volume" right />
              <Th k="difficulty" label="KD" right />
              <Th k="cpc" label="CPC" right />
              <th className="px-3 py-2.5 text-right text-[11px] font-medium uppercase tracking-wide text-[color:var(--muted-foreground)]">Trend</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-10 text-center text-sm text-[color:var(--muted-foreground)]">No keyword ideas match these filters.</td></tr>
            ) : rows.map((k) => {
              const sel = selected.has(k.id)
              return (
                <tr key={k.id} className={cn("group border-b border-[color:var(--border)] last:border-0 transition-colors", sel ? "bg-[color:var(--primary)]/5" : "hover:bg-[color:var(--muted)]")}>
                  <td className="px-3 py-2.5">
                    <input type="checkbox" checked={sel} onChange={() => onToggle(k)} className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--primary)]" aria-label={`Select ${k.keyword}`} />
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-1.5">
                      {quickIds.has(k.id) && <Star className="h-3 w-3 shrink-0 text-[color:var(--primary)]" fill="currentColor" />}
                      <span className="text-[13px] text-[color:var(--foreground)]">{k.keyword}</span>
                      <span className="opacity-0 transition-opacity group-hover:opacity-100"><CopyButton text={k.keyword} /></span>
                    </div>
                  </td>
                  <td className="px-3 py-2.5"><IntentChip intent={k.intent} size="xs" showLabel={false} /></td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--foreground)]">{full(k.volume)}</td>
                  <td className="px-3 py-2.5 text-right"><KdPill score={k.difficulty} band={k.difficultyBand} showScore size="xs" /></td>
                  <td className="px-3 py-2.5 text-right tabular-nums text-[color:var(--muted-foreground)]">{money(k.cpc, currency)}</td>
                  <td className="px-3 py-2.5"><div className="flex justify-end"><Sparkline data={k.trend} width={64} height={22} /></div></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  )
}

function FilterToggle({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-lg border px-2.5 text-xs font-medium transition-colors cursor-pointer",
        active ? "border-[color:var(--primary)] bg-[color:var(--primary)]/8 text-[color:var(--primary)]" : "border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
      )}
    >
      {icon}
      {children}
    </button>
  )
}

/* ── TopicClusters ── */
export function TopicClusters({
  clusters,
  activeId,
  onSelect,
}: {
  clusters: Cluster[]
  activeId: string | null
  onSelect: (c: Cluster) => void
}) {
  const max = Math.max(...clusters.map((c) => c.totalVolume)) || 1
  return (
    <SectionCard
      title="Topic Clusters"
      subtitle="Group ideas into content topics — click to filter the ideas table"
      icon={<Boxes className="h-4 w-4" />}
    >
      <div className="space-y-2">
        {clusters.map((c) => {
          const active = activeId === c.id
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c)}
              className={cn(
                "grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors cursor-pointer",
                active ? "border-[color:var(--primary)] bg-[color:var(--primary)]/5" : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
              )}
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-[color:var(--foreground)]">{c.topic}</span>
                  <span className="shrink-0 text-[11px] text-[color:var(--muted-foreground)]">{c.keywordCount} keywords</span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[color:var(--muted)]">
                  <div className="h-full rounded-full bg-[color:var(--primary)] transition-[width] duration-700 ease-out" style={{ width: `${(c.totalVolume / max) * 100}%` }} />
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-right text-sm font-semibold tabular-nums text-[color:var(--foreground)]">{compact(c.totalVolume)}</span>
                <KdPill score={c.avgDifficulty} band={bandOf(c.avgDifficulty)} showScore={false} size="xs" />
                <IntentChip intent={c.intent} size="xs" showLabel={false} />
              </div>
            </button>
          )
        })}
      </div>
    </SectionCard>
  )
}

/* ── SelectionActionBar ── */
export function SelectionActionBar({
  ideas,
  onClear,
  onSendToContent,
  currency,
}: {
  ideas: KeywordIdea[]
  onClear: () => void
  onSendToContent: (ideas: KeywordIdea[]) => void
  currency: string
}) {
  if (ideas.length === 0) return null
  const totalVol = ideas.reduce((s, k) => s + k.volume, 0)
  const avgKd = Math.round(ideas.reduce((s, k) => s + k.difficulty, 0) / ideas.length)

  function exportCsv() {
    const headers = ["Keyword", "Volume", "Difficulty", "KD Band", "Intent", "CPC", "Competition", "Match Type", "Trend", "Word Count"]
    const rows = ideas.map((k) => [
      `"${k.keyword.replace(/"/g, '""')}"`,
      k.volume,
      k.difficulty,
      k.difficultyBand,
      k.intent,
      k.cpc?.toFixed(2) ?? "0.00",
      k.competitiveDensity?.toFixed(2) ?? "0.00",
      k.matchType,
      k.trendDir,
      k.wordCount,
    ])
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `keywords-export-${ideas.length}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-4">
      <div className="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-2xl shadow-black/10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <button type="button" onClick={onClear} className="flex h-8 w-8 items-center justify-center rounded-lg text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer" aria-label="Clear selection">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-4 text-sm">
            <span className="font-semibold text-[color:var(--foreground)]">{ideas.length} selected</span>
            <span className="hidden text-[color:var(--muted-foreground)] sm:inline">·</span>
            <span className="text-[color:var(--muted-foreground)]"><span className="font-semibold text-[color:var(--foreground)] tabular-nums">{compact(totalVol)}</span> volume</span>
            <span className="hidden items-center gap-1.5 text-[color:var(--muted-foreground)] sm:inline-flex">avg <KdPill score={avgKd} band={bandOf(avgKd)} showScore size="xs" /></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={exportCsv} className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-[color:var(--border)] px-3 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] cursor-pointer">
            <Download className="h-3.5 w-3.5" /> Export CSV
          </button>
          <button type="button" onClick={() => onSendToContent(ideas)} className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-[color:var(--primary)] px-3.5 text-xs font-semibold text-[color:var(--primary-foreground)] transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer">
            <PenLine className="h-3.5 w-3.5" /> Send to Content Creation
          </button>
        </div>
      </div>
    </div>
  )
}
