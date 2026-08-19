"use client"

/* Shared primitives + hooks for the premium Keyword Research dashboard.
   Every widget composes from these so the whole report reads as one system. */

import {
  useState,
  useEffect,
  useRef,
  useId,
  useSyncExternalStore,
  type ReactNode,
} from "react"
import { ArrowUp, ArrowDown, Minus } from "lucide-react"
import {
  INTENT_META,
  KD_COLORS,
  BAND_LABEL,
  compact,
  type Intent,
  type DifficultyBand,
  type TrendDir,
} from "@/lib/keyword-research"
import { cn } from "@/lib/utils"

/* fixed direction colors (paired with an arrow + sign — never color alone) */
export const UP_GOOD = "#0ca30c"
export const DOWN_BAD = "#d03b3b"

/* ── theme ── single shared observer for every consumer (no per-instance
   MutationObserver pile-up), read synchronously so there is no light→dark flash */
const darkListeners = new Set<() => void>()
let darkObserver: MutationObserver | null = null
function darkSubscribe(cb: () => void): () => void {
  darkListeners.add(cb)
  if (!darkObserver) {
    darkObserver = new MutationObserver(() => darkListeners.forEach((l) => l()))
    darkObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
  }
  return () => {
    darkListeners.delete(cb)
    if (darkListeners.size === 0) {
      darkObserver?.disconnect()
      darkObserver = null
    }
  }
}
const darkSnapshot = () => document.documentElement.classList.contains("dark")
const darkServerSnapshot = () => false
export function useIsDark(): boolean {
  return useSyncExternalStore(darkSubscribe, darkSnapshot, darkServerSnapshot)
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const read = () => setReduced(mq.matches)
    read()
    mq.addEventListener("change", read)
    return () => mq.removeEventListener("change", read)
  }, [])
  return reduced
}

/* ── count-up ── */
export function useCountUp(target: number, duration = 850): number {
  const reduced = useReducedMotion()
  const [value, setValue] = useState(reduced ? target : 0)
  const valueRef = useRef(value)
  valueRef.current = value
  useEffect(() => {
    if (reduced) {
      setValue(target)
      return
    }
    const from = valueRef.current // animate from whatever is currently on screen
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      const v = from + (target - from) * eased
      setValue(v)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    // Safety: guarantee the final value even if rAF is throttled/paused
    // (backgrounded tab, non-composited frame) so numbers never stick at 0.
    const safety = window.setTimeout(() => setValue(target), duration + 250)
    return () => {
      cancelAnimationFrame(raf)
      window.clearTimeout(safety)
    }
  }, [target, duration, reduced])
  return value
}

/* count-up rendered as a compact string */
export function CountUp({
  value,
  format = compact,
  className,
}: {
  value: number
  format?: (n: number) => string
  className?: string
}) {
  const v = useCountUp(value)
  return <span className={cn("tabular-nums", className)}>{format(Math.round(v))}</span>
}

/* ── reveal on scroll ── */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode
  delay?: number
  className?: string
}) {
  const reduced = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [shown, setShown] = useState(false)
  useEffect(() => {
    if (reduced) {
      setShown(true)
      return
    }
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            setShown(true)
            obs.disconnect()
          }
        })
      },
      { threshold: 0.08 }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [reduced])
  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-500 ease-out",
        shown ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0",
        className
      )}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  )
}

/* ── section card ── */
export function SectionCard({
  title,
  subtitle,
  icon,
  actions,
  children,
  className,
  bodyClassName,
}: {
  title?: string
  subtitle?: string
  icon?: ReactNode
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}) {
  return (
    <section
      className={cn(
        "rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-sm",
        className
      )}
    >
      {(title || actions) && (
        <div className="flex items-center justify-between gap-3 border-b border-[color:var(--border)] px-4 py-3 md:px-5">
          <div className="flex min-w-0 items-center gap-2.5">
            {icon && (
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[color:var(--muted)] text-[color:var(--primary)]">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <h3 className="truncate text-sm font-semibold text-[color:var(--foreground)]">{title}</h3>}
              {subtitle && <p className="truncate text-xs text-[color:var(--muted-foreground)]">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </div>
      )}
      <div className={cn("p-4 md:p-5", bodyClassName)}>{children}</div>
    </section>
  )
}

/* ── intent chip ── */
export function intentColor(intent: Intent, isDark: boolean): string {
  return isDark ? INTENT_META[intent].dark : INTENT_META[intent].light
}

export function IntentChip({
  intent,
  size = "sm",
  showLabel = true,
}: {
  intent: Intent
  size?: "xs" | "sm"
  showLabel?: boolean
}) {
  const isDark = useIsDark()
  const color = intentColor(intent, isDark)
  const meta = INTENT_META[intent]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14`, color: "var(--foreground)" }}
      title={`${meta.label} — ${meta.desc}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {showLabel ? meta.label : meta.abbr}
    </span>
  )
}

/* ── KD pill ── */
export function KdPill({
  score,
  band,
  showScore = true,
  compact: compactMode = false,
  size = "sm",
}: {
  score: number
  band: DifficultyBand
  showScore?: boolean
  /** dense variant: dot + number only; the band word stays in the tooltip */
  compact?: boolean
  size?: "xs" | "sm"
}) {
  const color = KD_COLORS[band]
  const word = BAND_LABEL[band]
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-semibold",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
      style={{ borderColor: `${color}55`, backgroundColor: `${color}14`, color: "var(--foreground)" }}
      title={`Keyword Difficulty ${score}/100 — ${word}`}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {showScore && <span className="tabular-nums text-[color:var(--foreground)]">{score}</span>}
      {!compactMode && <span className="text-[color:var(--foreground)]">{word}</span>}
    </span>
  )
}

/* ── trend / delta pill (arrow + sign, never color alone) ── */
export function TrendPill({
  dir,
  pct,
  goodUp = true,
  size = "sm",
}: {
  dir: TrendDir
  pct: number
  goodUp?: boolean
  size?: "xs" | "sm"
}) {
  const positive = dir === "up"
  const negative = dir === "down"
  const isGood = (positive && goodUp) || (negative && !goodUp)
  const color = dir === "flat" ? "var(--muted-foreground)" : isGood ? UP_GOOD : DOWN_BAD
  const Icon = positive ? ArrowUp : negative ? ArrowDown : Minus
  const sign = pct > 0 ? "+" : ""
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full font-semibold tabular-nums",
        size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2 py-0.5 text-xs"
      )}
      style={{ backgroundColor: `${color === "var(--muted-foreground)" ? "var(--muted)" : color + "18"}`, color }}
    >
      <Icon className={size === "xs" ? "h-2.5 w-2.5" : "h-3 w-3"} />
      {sign}
      {Math.abs(pct)}%
    </span>
  )
}

/* ── mini severity meter (0..1) — good → warning → danger, lighter track ── */
export function MiniMeter({
  value,
  className,
}: {
  value: number
  className?: string
}) {
  const pct = Math.round(Math.min(1, Math.max(0, value)) * 100)
  const color = value < 0.34 ? KD_COLORS["easy"] : value < 0.67 ? KD_COLORS["possible"] : KD_COLORS["hard"]
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full", className)} style={{ backgroundColor: `${color}22` }}>
      <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${pct}%`, backgroundColor: color }} />
    </div>
  )
}

export function densityLabel(v: number): string {
  return v < 0.34 ? "Low" : v < 0.67 ? "Medium" : "High"
}

/* ── sparkline (single series, brand hue, area wash + end dot) ── */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  color = "var(--primary)",
  className,
  strokeWidth = 1.75,
}: {
  data: number[]
  width?: number
  height?: number
  color?: string
  className?: string
  strokeWidth?: number
}) {
  const rawId = useId()
  if (!data || data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 3
  const w = width
  const h = height
  const stepX = (w - pad * 2) / (data.length - 1)
  const pts = data.map((d, i) => {
    const x = pad + i * stepX
    const y = pad + (1 - (d - min) / range) * (h - pad * 2)
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ")
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${h - pad} L${pts[0][0].toFixed(1)},${h - pad} Z`
  const last = pts[pts.length - 1]
  const uid = `sk-${rawId.replace(/[:]/g, "")}`
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className={className} aria-hidden="true">
      <defs>
        <linearGradient id={uid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.18" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#${uid})`} />
      <path d={line} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />
    </svg>
  )
}

/* letter tile used in place of remote favicons (no network) */
export function DomainTile({ domain, size = 20 }: { domain: string; size?: number }) {
  const letter = domain.replace(/^www\./, "").charAt(0).toUpperCase()
  const hue = [...domain].reduce((a, c) => a + c.charCodeAt(0), 0) % 360
  return (
    <span
      className="flex shrink-0 items-center justify-center rounded-md font-semibold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.5,
        background: `linear-gradient(135deg, hsl(${hue} 62% 52%), hsl(${(hue + 40) % 360} 62% 44%))`,
      }}
      aria-hidden="true"
    >
      {letter}
    </span>
  )
}

/* copy button used across tables — static design build, copy is disabled */
export function CopyButton({ text, className }: { text: string; className?: string }) {
  return (
    <button
      type="button"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "rounded-md px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]",
        className
      )}
      title={`Copy: ${text}`}
    >
      Copy
    </button>
  )
}
