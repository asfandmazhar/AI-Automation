"use client"

import { useState } from "react"
import { LayoutGrid, Link2, Target, Download, Search, Plus, X, Loader2 } from "lucide-react"
import type { CompetitorDataset, CompetitorAIAnalysis } from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { Reveal } from "@/components/ai/keyword-research/primitives"
import { KpiOverview, ComparisonTable } from "./comparison"
import { AuthorityTrendCard, RefDomainsTrendCard, BacklinkTypesCard, LinkAttributesCard } from "./charts"
import { CompetitiveRadar, PositioningQuadrant } from "./advanced"
import { TopCategoriesCard, AuthorityDistributionCard, BacklinkGapCard } from "./tables"
import { AICompetitorIntelligence } from "./ai-competitor-intelligence"
import axios from "axios"
import Cookies from "js-cookie"
import toast from "react-hot-toast"

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

type Tab = "overview" | "profile" | "gap"
const TABS: { key: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { key: "overview", label: "Overview", icon: LayoutGrid },
  { key: "profile", label: "Backlink Profile", icon: Link2 },
  { key: "gap", label: "Backlink Gap", icon: Target },
]

const MAX_COMPETITORS = 4

export function CompetitorReport() {
  const [youDomain, setYouDomain] = useState("")
  const [compDomains, setCompDomains] = useState([""])
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<CompetitorDataset | null>(null)
  const [tab, setTab] = useState<Tab>("overview")
  const [aiAnalysis, setAiAnalysis] = useState<CompetitorAIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  const addComp = () => {
    if (compDomains.length < MAX_COMPETITORS) setCompDomains(prev => [...prev, ""])
  }
  const removeComp = (idx: number) => {
    setCompDomains(prev => prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx))
  }
  const updateComp = (idx: number, val: string) => {
    setCompDomains(prev => prev.map((c, i) => i === idx ? val : c))
  }

  async function handleAnalyze() {
    if (!youDomain.trim()) { toast.error("Enter your domain"); return }
    const validComps = compDomains.filter(c => c.trim())
    if (!validComps.length) { toast.error("Add at least one competitor domain"); return }

    setLoading(true)
    setAiAnalysis(null)
    try {
      const res = await axios.post(`${API}/competitor/analyze`, {
        domain: youDomain.trim(),
        competitors: validComps.map(c => c.trim()),
      }, authHeaders())
      if (res.data.success) {
        setData(res.data.data)
      } else {
        toast.error(res.data.message || "Competitor analysis failed")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Competitor analysis failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyzeAI() {
    if (!data) return
    setAiLoading(true)
    try {
      const res = await axios.post(`${API}/competitor/ai-analyze`, {
        you: data.you,
        competitors: data.competitors,
        opportunities: data.opportunities,
        anchors: data.anchors,
      }, authHeaders())
      if (res.data.success) {
        setAiAnalysis(res.data.data)
      } else {
        toast.error(res.data.message || "AI analysis failed")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "AI analysis failed")
    } finally {
      setAiLoading(false)
    }
  }

  const domains = data ? [data.you, ...data.competitors] : []

  const fieldBox =
    "flex h-11 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3 transition-colors focus-within:border-[color:var(--primary)]/60 focus-within:ring-2 focus-within:ring-[color:var(--primary)]/15"

  return (
    <div className="space-y-4">
      {/* Input form */}
      <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 shadow-sm">
        <div className="grid grid-cols-1 items-end gap-3 md:grid-cols-[1fr_auto_1fr]">
          {/* Your website */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full bg-[color:var(--primary)]" />
              Your website
            </span>
            <div className={fieldBox}>
              <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
              <input
                value={youDomain}
                onChange={e => setYouDomain(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                placeholder="yourdomain.com"
                className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none"
              />
            </div>
          </label>

          {/* VS divider */}
          <div className="hidden pb-1.5 md:flex md:items-center md:justify-center">
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-[color:var(--border)] bg-[color:var(--muted)] text-[10px] font-bold uppercase text-[color:var(--muted-foreground)]">
              vs
            </span>
          </div>

          {/* First competitor */}
          <label className="flex flex-col gap-1.5">
            <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: "#14b8a6" }} />
              Competitor
            </span>
            <div className={fieldBox}>
              <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
              <input
                value={compDomains[0] || ""}
                onChange={e => updateComp(0, e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                placeholder="competitor.com"
                className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none"
              />
            </div>
          </label>
        </div>

        {/* Extra competitor fields */}
        {compDomains.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {compDomains.slice(1).map((c, idx) => (
              <div key={idx} className="flex h-9 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: ["#f59e0b", "#3b82f6", "#ec4899"][idx] || "#8b5cf6" }} />
                <input
                  value={c}
                  onChange={e => updateComp(idx + 1, e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAnalyze()}
                  placeholder={`competitor${idx + 2}.com`}
                  className="w-40 bg-transparent text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none"
                />
                <button type="button" onClick={() => removeComp(idx + 1)} className="text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--error)] cursor-pointer">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-2">
          {compDomains.length < MAX_COMPETITORS && (
            <button
              type="button"
              onClick={addComp}
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-[color:var(--primary)]/40 px-2.5 py-1.5 text-xs font-medium text-[color:var(--primary)] transition-colors hover:bg-[color:var(--primary)]/8 cursor-pointer"
            >
              <Plus className="h-3 w-3" /> Add competitor
            </button>
          )}
          {compDomains.length >= MAX_COMPETITORS && (
            <span className="inline-flex items-center gap-1 rounded-full border border-[color:var(--border)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)]/50">
              Max {MAX_COMPETITORS}
            </span>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={loading}
            className="ml-auto flex h-9 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md shadow-[color:var(--primary)]/20 transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
            {loading ? "Analyzing…" : "Analyze"}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && !data && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
            <p className="text-sm text-[color:var(--muted-foreground)]">Analyzing competitors…</p>
          </div>
        </div>
      )}

      {/* Report */}
      {data && domains.length > 0 && (
        <>
          {/* report header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-[color:var(--foreground)]">
              Backlinks: <span className="text-[color:var(--primary)]">{data.you.domain}</span>
            </h2>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" /> Export PDF
            </button>
          </div>

          {/* tabs */}
          <div className="flex gap-1 overflow-x-auto border-b border-[color:var(--border)]">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setTab(t.key)}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors cursor-pointer",
                  tab === t.key
                    ? "border-[color:var(--primary)] text-[color:var(--foreground)]"
                    : "border-transparent text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
                )}
              >
                <t.icon className="h-4 w-4" />
                {t.label}
              </button>
            ))}
          </div>

          {/* OVERVIEW */}
          {tab === "overview" && (
            <div className="space-y-4">
              <Reveal>
                <KpiOverview domains={domains} />
              </Reveal>
              <Reveal delay={40}>
                <AICompetitorIntelligence
                  data={data}
                  analysis={aiAnalysis}
                  loading={aiLoading}
                  onAnalyze={handleAnalyzeAI}
                />
              </Reveal>
              <Reveal delay={60}>
                <ComparisonTable domains={domains} />
              </Reveal>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Reveal delay={40}>
                  <AuthorityTrendCard domains={domains} months={data.months} />
                </Reveal>
                <Reveal delay={80}>
                  <RefDomainsTrendCard domains={domains} months={data.months} />
                </Reveal>
              </div>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Reveal delay={40}>
                  <CompetitiveRadar domains={domains} />
                </Reveal>
                <Reveal delay={80}>
                  <PositioningQuadrant domains={domains} />
                </Reveal>
              </div>
              <Reveal>
                <BacklinkGapCard domains={domains} opportunities={data.opportunities} compactMode />
              </Reveal>
            </div>
          )}

          {/* BACKLINK PROFILE */}
          {tab === "profile" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Reveal>
                  <BacklinkTypesCard domains={domains} />
                </Reveal>
                <Reveal delay={40}>
                  <LinkAttributesCard domains={domains} />
                </Reveal>
              </div>
              <Reveal delay={40}>
                <TopCategoriesCard domains={domains} />
              </Reveal>
              <Reveal delay={80}>
                <AuthorityDistributionCard domains={domains} />
              </Reveal>
            </div>
          )}

          {/* BACKLINK GAP */}
          {tab === "gap" && (
            <Reveal>
              <BacklinkGapCard domains={domains} opportunities={data.opportunities} />
            </Reveal>
          )}
        </>
      )}
    </div>
  )
}
