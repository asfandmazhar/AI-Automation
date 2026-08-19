"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Swords, Link2, ArrowLeft, ArrowRight, Sparkles } from "lucide-react"
import DashboardShell from "@/components/layout/dashboard-shell"
import { CompetitorReport } from "@/components/ai/competitor-research/competitor-report"
import { BacklinksReport } from "@/components/ai/backlinks-research/backlinks-report"
import { cn } from "@/lib/utils"

/* ─────────────────────────────────────────────────────────────
   OFF-PAGE SEO — two modules:
     1) Competitor Research → head-to-head backlink benchmarking
     2) Backlinks Research  → single-domain backlink profile audit
   ───────────────────────────────────────────────────────────── */

type View = "home" | "competitor-research" | "backlinks-research"

const MODULES: {
  view: Exclude<View, "home">
  icon: typeof Swords
  title: string
  tagline: string
  blurb: string
}[] = [
  {
    view: "competitor-research",
    icon: Swords,
    title: "Competitor Research",
    tagline: "Know exactly who you're up against",
    blurb:
      "Benchmark your domain against rivals — authority, referring domains, backlinks, traffic and the exact link gaps you can close.",
  },
  {
    view: "backlinks-research",
    icon: Link2,
    title: "Backlinks Research",
    tagline: "Audit your entire link profile",
    blurb:
      "A full backlink audit — new vs lost links, anchor-text health, referring-domain quality, toxicity and your strongest links.",
  },
]

function ModuleHeader({
  icon: Icon,
  title,
  subtitle,
  onBack,
}: {
  icon: typeof Swords
  title: string
  subtitle: string
  onBack: () => void
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer"
        aria-label="Back to modules"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--primary)]/15 to-[color:var(--primary)]/5">
        <Icon className="h-5 w-5 text-[color:var(--primary)]" />
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-[color:var(--foreground)]">{title}</h2>
        <p className="truncate text-xs text-[color:var(--muted-foreground)]">{subtitle}</p>
      </div>
    </div>
  )
}

/* ── Landing ── */
function Home({ onPick }: { onPick: (v: Exclude<View, "home">) => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-10">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--primary)]/80 shadow-lg shadow-[color:var(--primary)]/25">
          <Sparkles className="h-6 w-6 text-[color:var(--primary-foreground)]" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[color:var(--foreground)]">Off-Page SEO</h1>
        <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">
          Two things, done well — size up your competitors, then master your backlinks.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <button
            key={m.view}
            type="button"
            onClick={() => onPick(m.view)}
            className="group flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--primary)]/40 hover:shadow-lg hover:shadow-[color:var(--primary)]/5 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--primary)]/15 to-[color:var(--primary)]/5 transition-all group-hover:from-[color:var(--primary)]/25 group-hover:to-[color:var(--primary)]/10">
              <m.icon className="h-5 w-5 text-[color:var(--primary)]" />
            </div>
            <p className="mt-4 text-base font-semibold text-[color:var(--foreground)]">{m.title}</p>
            <p className="mt-0.5 text-xs font-medium text-[color:var(--primary)]">{m.tagline}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">{m.blurb}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

/* ── Page ── */
export default function OffPageSeoPage() {
  const [view, setView] = useState<View>("home")
  const scrollRef = useRef<HTMLDivElement>(null)

  const goHome = useCallback(() => setView("home"), [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 })
  }, [view])

  return (
    <DashboardShell>
      <div ref={scrollRef} className={cn("min-h-full w-full px-1 py-2")}>
        {view === "home" && <Home onPick={setView} />}

        {view === "competitor-research" && (
          <div className="space-y-4">
            <ModuleHeader
              icon={Swords}
              title="Competitor Research"
              subtitle="Head-to-head backlink & authority benchmarking"
              onBack={goHome}
            />
            <CompetitorReport />
          </div>
        )}

        {view === "backlinks-research" && (
          <div className="space-y-4">
            <ModuleHeader
              icon={Link2}
              title="Backlinks Research"
              subtitle="A full audit of your backlink profile"
              onBack={goHome}
            />
            <BacklinksReport />
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
