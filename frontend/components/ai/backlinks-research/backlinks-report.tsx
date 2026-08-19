"use client"

import { useState, type ReactNode } from "react"
import { Search, Download, ArrowUpRight, ArrowDownRight, ShieldCheck, Link2, Globe2, Loader2 } from "lucide-react"
import type { BacklinksProfile, BacklinkAIAnalysis } from "@/lib/backlinks-research"
import { compact, full, authorityColor, authorityBand } from "@/lib/competitor-research"
import { cn } from "@/lib/utils"
import { Reveal, CountUp } from "@/components/ai/keyword-research/primitives"
import {
  ProfileSplitCard,
  BacklinkFlowCard,
  AnchorDistributionCard,
  AuthorityBucketsCard,
  ToxicityCard,
  ReferringDomainsCard,
  TopBacklinksCard,
} from "./backlinks-widgets"
import { AIBacklinkIntelligence } from "./ai-backlink-intelligence"
import axios from "axios"
import Cookies from "js-cookie"
import toast from "react-hot-toast"

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

function KpiCard({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm", className)}>
      <span className="text-sm font-medium text-[color:var(--muted-foreground)]">{label}</span>
      {children}
    </div>
  )
}

export function BacklinksReport() {
  const [domain, setDomain] = useState("")
  const [loading, setLoading] = useState(false)
  const [profile, setProfile] = useState<BacklinksProfile | null>(null)
  const [aiAnalysis, setAiAnalysis] = useState<BacklinkAIAnalysis | null>(null)
  const [aiLoading, setAiLoading] = useState(false)

  async function handleAudit() {
    if (!domain.trim()) { toast.error("Enter a domain to audit"); return }
    setLoading(true)
    setAiAnalysis(null)
    try {
      const res = await axios.post(`${API}/backlinks/analyze`, { domain: domain.trim() }, authHeaders())
      if (res.data.success) {
        setProfile(res.data.data)
      } else {
        toast.error(res.data.message || "Backlinks analysis failed")
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Backlinks analysis failed")
    } finally {
      setLoading(false)
    }
  }

  async function handleAnalyzeAI() {
    if (!profile) return
    setAiLoading(true)
    try {
      const res = await axios.post(`${API}/backlinks/ai-analyze`, {
        profile,
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

  const asColor = profile ? authorityColor(profile.authorityScore) : undefined

  return (
    <div className="space-y-4">
      {/* search bar */}
      <div className="flex flex-col gap-2.5 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-2.5 shadow-sm transition focus-within:border-[color:var(--primary)]/50 sm:flex-row sm:items-center sm:p-3">
        <div className="flex min-h-[2.75rem] flex-1 items-center gap-2 rounded-xl bg-[color:var(--background)] px-3">
          <Search className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAudit()}
            placeholder="Enter a domain to audit its backlinks…"
            className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/70 focus:outline-none"
          />
        </div>
        <button
          type="button"
          onClick={handleAudit}
          disabled={loading}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md shadow-[color:var(--primary)]/20 transition-all hover:brightness-110 active:scale-[0.98] cursor-pointer disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          {loading ? "Analyzing…" : "Audit backlinks"}
        </button>
      </div>

      {loading && !profile && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
            <p className="text-sm text-[color:var(--muted-foreground)]">Analyzing backlink profile…</p>
          </div>
        </div>
      )}

      {profile && (<>

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-[color:var(--foreground)]">
            Backlink Profile: <span className="text-[color:var(--primary)]">{profile.domain}</span>
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      </div>

      {/* KPI row */}
      <Reveal>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {/* Authority Score */}
          <KpiCard label="Authority Score">
            <div className="mt-1 flex items-end gap-2">
              <span className="text-4xl font-bold tabular-nums" style={{ color: asColor }}>
                <CountUp value={profile.authorityScore} format={(n) => `${n}`} />
              </span>
              <span className="mb-1 text-xs font-medium" style={{ color: asColor }}>{authorityBand(profile.authorityScore)}</span>
            </div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-[color:var(--muted)]">
              <div className="h-full rounded-full" style={{ width: `${profile.authorityScore}%`, backgroundColor: asColor }} />
            </div>
            <span className="mt-1 text-[11px] text-[color:var(--muted-foreground)]">out of 100</span>
          </KpiCard>

          {/* Total Backlinks */}
          <KpiCard label="Total Backlinks">
            <div className="mt-1 flex items-center gap-2 text-4xl font-bold text-[color:var(--foreground)]">
              <Link2 className="h-6 w-6 text-[color:var(--primary)]" />
              <CountUp value={profile.totalBacklinks} format={compact} />
            </div>
            <span className="mt-auto pt-3 text-[11px] text-[color:var(--muted-foreground)]">{full(profile.totalBacklinks)} links tracked</span>
          </KpiCard>

          {/* Referring Domains */}
          <KpiCard label="Referring Domains">
            <div className="mt-1 flex items-center gap-2 text-4xl font-bold text-[color:var(--foreground)]">
              <Globe2 className="h-6 w-6 text-[color:var(--primary)]" />
              <CountUp value={profile.referringDomains} format={compact} />
            </div>
            <span className="mt-auto pt-3 text-[11px] text-[color:var(--muted-foreground)]">{compact(profile.referringIps)} referring IPs</span>
          </KpiCard>

          {/* Net 30 days */}
          <KpiCard label="Last 30 days">
            <div className="mt-1 flex items-center gap-4">
              <span className="flex items-center gap-1 text-2xl font-bold tabular-nums" style={{ color: "#0ca30c" }}>
                <ArrowUpRight className="h-5 w-5" />+{profile.newLast30}
              </span>
              <span className="flex items-center gap-1 text-2xl font-bold tabular-nums" style={{ color: "#d03b3b" }}>
                <ArrowDownRight className="h-5 w-5" />−{profile.lostLast30}
              </span>
            </div>
            <span className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-[color:var(--muted-foreground)]">
              <ShieldCheck className="h-3.5 w-3.5" /> Net +{profile.newLast30 - profile.lostLast30} · {Math.round(profile.dofollowShare * 100)}% dofollow
            </span>
          </KpiCard>
        </div>
      </Reveal>

      {/* AI Backlink Intelligence */}
      <Reveal delay={40}>
        <AIBacklinkIntelligence
          profile={profile}
          analysis={aiAnalysis}
          loading={aiLoading}
          onAnalyze={handleAnalyzeAI}
        />
      </Reveal>

      {/* flow + toxicity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Reveal className="lg:col-span-2" delay={60}>
          <BacklinkFlowCard profile={profile} />
        </Reveal>
        <Reveal delay={100}>
          <ToxicityCard profile={profile} />
        </Reveal>
      </div>

      {/* split + anchors */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Reveal delay={40}>
          <ProfileSplitCard profile={profile} />
        </Reveal>
        <Reveal delay={80}>
          <AnchorDistributionCard profile={profile} />
        </Reveal>
      </div>

      <Reveal delay={40}>
        <AuthorityBucketsCard profile={profile} />
      </Reveal>

      <Reveal>
        <ReferringDomainsCard profile={profile} />
      </Reveal>

      <Reveal>
        <TopBacklinksCard profile={profile} />
      </Reveal>

      </>)}
    </div>
  )
}
