"use client"

import { useState, useEffect, useMemo } from "react"
import type {
  KeywordResearchResult, KeywordIdea, KeywordAIAnalysis, Intent, Cluster, CountryCode,
} from "@/lib/keyword-research"
import { Reveal } from "./primitives"
import { KeywordHeader, OverviewKpiTiles } from "./report-hero"
import { VolumeTrend, IntentDistribution, GlobalVolume, SerpFeatures } from "./report-charts"
import { SerpAnalysisTable, KeywordIdeasTable, TopicClusters, SelectionActionBar } from "./report-tables"
import { AIKeywordIntelligence } from "./ai-intelligence"

export function KeywordReport({
  result,
  onSendToContent,
  onRescope,
  aiAnalysis,
  aiLoading,
  onAnalyzeAI,
}: {
  result: KeywordResearchResult
  onSendToContent: (ideas: KeywordIdea[]) => void
  onRescope?: (code: CountryCode) => void
  aiAnalysis?: KeywordAIAnalysis | null
  aiLoading?: boolean
  onAnalyzeAI?: () => void
}) {
  const [selected, setSelected] = useState<Map<string, KeywordIdea>>(new Map())
  const [intentFilter, setIntentFilter] = useState<Intent | null>(null)
  const [clusterFilter, setClusterFilter] = useState<Cluster | null>(null)

  // reset cross-widget state whenever a fresh report loads
  useEffect(() => {
    setSelected(new Map())
    setIntentFilter(null)
    setClusterFilter(null)
  }, [result])

  const selectedIds = useMemo(() => new Set(selected.keys()), [selected])

  function toggle(idea: KeywordIdea) {
    setSelected((prev) => {
      const next = new Map(prev)
      if (next.has(idea.id)) next.delete(idea.id)
      else next.set(idea.id, idea)
      return next
    })
  }
  function toggleMany(ideas: KeywordIdea[], select: boolean) {
    setSelected((prev) => {
      const next = new Map(prev)
      for (const k of ideas) {
        if (select) next.set(k.id, k)
        else next.delete(k.id)
      }
      return next
    })
  }

  const o = result.overview

  return (
    <div className={selected.size > 0 ? "space-y-4 pb-28" : "space-y-4"}>
      <Reveal>
        <KeywordHeader result={result} />
      </Reveal>

      {/* overview: KPIs + difficulty — Semrush-style full-width row */}
      <Reveal delay={40}>
        <OverviewKpiTiles
          overview={o}
          factors={result.difficultyFactors}
          byCountry={result.byCountry}
          country={result.country}
          currency={result.currency}
        />
      </Reveal>

      {/* AI Keyword Intelligence */}
      {onAnalyzeAI && (
        <Reveal delay={60}>
          <AIKeywordIntelligence
            result={result}
            analysis={aiAnalysis ?? null}
            loading={aiLoading ?? false}
            onAnalyze={onAnalyzeAI}
          />
        </Reveal>
      )}

      {/* trend + intent */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2" delay={40}>
          <VolumeTrend seasonality={result.seasonality} />
        </Reveal>
        <Reveal className="lg:col-span-1" delay={80}>
          <IntentDistribution
            distribution={o.intent.distribution}
            primary={o.intent.primary}
            activeIntent={intentFilter}
            onFilter={(i) => setIntentFilter((prev) => (prev === i ? null : i))}
          />
        </Reveal>
      </div>

      {/* global volume + serp features */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Reveal delay={40}>
          <GlobalVolume rows={result.byCountry} selectedCode={result.country.code} currency={result.currency} onSelect={onRescope} />
        </Reveal>
        <Reveal delay={80}>
          <SerpFeatures features={result.serpFeatures} />
        </Reveal>
      </div>

      <Reveal>
        <SerpAnalysisTable rows={result.serpAnalysis} currency={result.currency} />
      </Reveal>

      <Reveal>
        <KeywordIdeasTable
          result={result}
          selected={selectedIds}
          onToggle={toggle}
          onToggleMany={toggleMany}
          intentFilter={intentFilter}
          onClearIntent={() => setIntentFilter(null)}
          clusterFilter={clusterFilter}
          onClearCluster={() => setClusterFilter(null)}
          currency={result.currency}
        />
      </Reveal>

      <Reveal>
        <TopicClusters
          clusters={result.clusters}
          activeId={clusterFilter?.id ?? null}
          onSelect={(c) => setClusterFilter((prev) => (prev?.id === c.id ? null : c))}
        />
      </Reveal>

      <SelectionActionBar
        ideas={[...selected.values()]}
        onClear={() => setSelected(new Map())}
        onSendToContent={onSendToContent}
        currency={result.currency}
      />
    </div>
  )
}

/* ── loading skeleton (shape-matched, zero layout shift) ── */
function Block({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-[color:var(--muted)] ${className ?? ""}`} />
}
export function ReportSkeleton() {
  return (
    <div className="space-y-4">
      <Block className="h-16" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Block className="h-72 lg:col-span-1" />
        <Block className="h-72 lg:col-span-2" />
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Block className="h-64 lg:col-span-2" />
        <Block className="h-64 lg:col-span-1" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Block className="h-56" />
        <Block className="h-56" />
      </div>
      <Block className="h-80" />
      <Block className="h-96" />
    </div>
  )
}
