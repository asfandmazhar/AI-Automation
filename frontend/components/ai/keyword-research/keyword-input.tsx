"use client"

import { useState, useRef, useEffect } from "react"
import { Search, X, ChevronDown, Check, Clock } from "lucide-react"
import { COUNTRIES, COUNTRY_BY_CODE, type CountryCode } from "@/lib/keyword-research"
import { cn } from "@/lib/utils"

const EXAMPLES = ["seo strategy", "keyword research", "coloring book", "content marketing"]

export function KeywordInput({
  value,
  onChange,
  country,
  onCountryChange,
  onSubmit,
  loading = false,
  hasResults = false,
  updatedLabel,
}: {
  value: string
  onChange: (v: string) => void
  country: CountryCode
  onCountryChange: (c: CountryCode) => void
  onSubmit: (seed: string) => void
  loading?: boolean
  hasResults?: boolean
  updatedLabel?: string
}) {
  const [editing, setEditing] = useState(!value)
  const [menuOpen, setMenuOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const c = COUNTRY_BY_CODE[country]

  useEffect(() => {
    if (editing) inputRef.current?.focus()
  }, [editing])

  function submit(seed: string) {
    const s = seed.trim()
    if (!s || loading) return
    setEditing(false)
    onSubmit(s)
  }

  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-2.5 shadow-sm transition focus-within:border-[color:var(--primary)]/50 focus-within:shadow-[0_0_0_4px] focus-within:shadow-[color:var(--primary)]/10 sm:p-3">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        {/* keyword field / pill */}
        <div className="flex min-h-[2.75rem] flex-1 flex-wrap items-center gap-2 rounded-xl bg-[color:var(--background)] px-3 py-1.5">
          {!editing && value ? (
            <span className="inline-flex max-w-full items-center gap-1.5 rounded-lg border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/12 px-2.5 py-1 text-sm font-medium text-[color:var(--foreground)]">
              <span className="truncate">{value}</span>
              <button
                type="button"
                onClick={() => { onChange(""); setEditing(true) }}
                className="shrink-0 text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] cursor-pointer"
                aria-label="Clear keyword"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ) : (
            <input
              ref={inputRef}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); submit(value) }
              }}
              onBlur={() => { if (value.trim()) setEditing(false) }}
              placeholder="Enter a keyword…"
              className="min-w-0 flex-1 bg-transparent text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/70 focus:outline-none"
            />
          )}
        </div>

        {/* country selector */}
        <div className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((p) => !p)}
            className="flex h-11 items-center gap-2 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3 text-sm font-medium text-[color:var(--foreground)] transition-colors hover:border-[color:var(--primary)]/40 cursor-pointer"
          >
            <span className="text-base leading-none">{c.flag}</span>
            <span className="hidden sm:inline">{c.name}</span>
            <span className="font-mono text-xs text-[color:var(--muted-foreground)] sm:hidden">{c.code}</span>
            <ChevronDown className={cn("h-4 w-4 text-[color:var(--muted-foreground)] transition-transform", menuOpen && "rotate-180")} />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full z-50 mt-2 max-h-72 w-60 overflow-y-auto rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-1.5 shadow-xl">
                {COUNTRIES.map((opt) => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => { onCountryChange(opt.code); setMenuOpen(false) }}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-sm transition-colors cursor-pointer hover:bg-[color:var(--muted)]",
                      opt.code === country && "bg-[color:var(--primary)]/8"
                    )}
                  >
                    <span className="text-base leading-none">{opt.flag}</span>
                    <span className="min-w-0 flex-1 truncate text-[color:var(--foreground)]">{opt.name}</span>
                    <span className="font-mono text-[10px] text-[color:var(--muted-foreground)]">{opt.database}</span>
                    {opt.code === country && <Check className="h-3.5 w-3.5 shrink-0 text-[color:var(--primary)]" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* submit */}
        <button
          type="button"
          onClick={() => submit(value)}
          disabled={loading || !value.trim()}
          className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--secondary)] px-5 text-sm font-semibold text-[color:var(--primary-foreground)] shadow-md shadow-[color:var(--primary)]/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Analyzing…
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Find Keywords
            </>
          )}
        </button>
      </div>

      {/* examples / freshness */}
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 px-1">
        <span className="text-xs text-[color:var(--muted-foreground)]">
          {hasResults ? "Try another:" : "For example:"}
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex}
            type="button"
            onClick={() => { onChange(ex); submit(ex) }}
            disabled={loading}
            className="rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-2 py-0.5 text-xs text-[color:var(--muted-foreground)] transition-colors hover:border-[color:var(--primary)]/40 hover:text-[color:var(--foreground)] disabled:opacity-50 cursor-pointer"
          >
            {ex}
          </button>
        ))}
        {hasResults && updatedLabel && (
          <span className="ml-auto inline-flex items-center gap-1 rounded-lg bg-[color:var(--muted)] px-2 py-0.5 font-mono text-[10px] text-[color:var(--muted-foreground)]">
            <Clock className="h-3 w-3" />
            {c.database} · {updatedLabel}
          </span>
        )}
      </div>
    </div>
  )
}
