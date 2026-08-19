"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import Cookies from "js-cookie"
import axios from "axios"
import {
  MousePointerClick,
  Eye,
  Percent,
  ArrowUpDown,
  Loader2,
  SearchX,
  Unplug,
  ChevronDown,
  Globe,
  Monitor,
  Smartphone,
  Tablet,
  Search,
  FileText,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  LayoutGrid,
  BarChart3,
  Image,
  Video,
  Newspaper,
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Link2,
  Filter,
  Network,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import DashboardShell from "@/components/layout/dashboard-shell"

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

// ─── Types ──────────────────────────────────────────

interface DailyRow { date: string; clicks: number; impressions: number; ctr: number; position: number }
interface QueryRow { query: string; clicks: number; impressions: number; ctr: number; position: number }
interface PageRow  { page: string;  clicks: number; impressions: number; ctr: number; position: number }
interface CountryRow { country: string; clicks: number; impressions: number; ctr: number; position: number }
interface DeviceRow  { device: string;  clicks: number; impressions: number; ctr: number; position: number }
interface AppearanceRow { appearance: string; clicks: number; impressions: number; ctr: number; position: number }
interface OverviewMetrics { clicks: number; impressions: number; ctr: number; position: number }
interface SearchTypeRow { type: string; clicks: number; impressions: number; ctr: number; position: number }

interface UrlInspection {
  inspectionUrl: string
  indexStatus: string; verdict: string; robotsTxtState: string; indexingState: string
  lastCrawlTime: string | null; pageFetchState: string; crawledAs: string
  canonicalUrl: string; userCanonical: string; referringUrls: string[]
  mobileUsability: string; mobileIssues: { message: string; severity: string }[]
  richResults: string; richResultItems: { type: string; items: { name: string; issues: string[] }[] }[]
}

interface SitemapEntry {
  path: string; lastSubmitted: string | null; lastDownloaded: string | null
  isPending: boolean; isSitemapsIndex: boolean; warnings: number; errors: number
  contents: { type: string; submitted: number; indexed: number }[]
}

interface AnalyticsData {
  overview: OverviewMetrics
  previousPeriod: OverviewMetrics | null
  dailyData: DailyRow[]
  topQueries: QueryRow[]
  topPages: PageRow[]
  countries: CountryRow[]
  devices: DeviceRow[]
  searchAppearance: AppearanceRow[]
  searchTypes: SearchTypeRow[]
  activeSearchType: string
  dateRange: { startDate: string; endDate: string }
  previousDateRange: { startDate: string; endDate: string }
}

interface GaDailyRow { date: string; activeUsers: number; sessions: number; pageViews: number; engagementRate: number; avgSessionDuration: number }
interface GaChannelRow { channel: string; users: number; sessions: number; engagementRate: number }
interface GaPageRow { pagePath: string; pageViews: number; users: number; avgDuration: number }
interface GaDeviceRow { device: string; users: number; sessions: number; engagementRate: number }
interface GaCountryRow { country: string; users: number; sessions: number; engagementRate: number }
interface GaBrowserRow { browser: string; users: number; sessions: number }
interface GaOverview { activeUsers: number; sessions: number; pageViews: number; engagementRate: number; avgSessionDuration: number; eventCount: number; bounceRate: number; newUsers: number }

interface GaAnalyticsData {
  overview: GaOverview
  previousPeriod: GaOverview | null
  dailyData: GaDailyRow[]
  channels: GaChannelRow[]
  topPages: GaPageRow[]
  devices: GaDeviceRow[]
  countries: GaCountryRow[]
  browsers: GaBrowserRow[]
  dateRange: { startDate: string; endDate: string }
}

interface SelectedWebsite {
  _id: string
  name: string
  url?: string
  googleSearchConsole?: { connected?: boolean; selectedProperty?: string }
  googleAnalytics?: { connected?: boolean; selectedProperty?: string }
}

// ─── Helpers ────────────────────────────────────────

const RANGES = [
  { label: "Last 7 days",   days: 7 },
  { label: "Last 14 days",  days: 14 },
  { label: "Last 28 days",  days: 28 },
  { label: "Last 3 months", days: 90 },
  { label: "Last 6 months", days: 180 },
  { label: "Last 12 months", days: 365 },
  { label: "Last 16 months", days: 480 },
  { label: "Custom", days: 0 },
] as const

function fmt(n: number) { return (n ?? 0).toLocaleString("en-US") }
function fmtCtr(n: number) { return ((n ?? 0) * 100).toFixed(1) + "%" }
function fmtPos(n: number) { return (n ?? 0).toFixed(1) }
function dateLabel(iso: string) {
  const d = new Date(iso + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}
function dateInputVal(d: Date) { return d.toISOString().split("T")[0] }

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

const DEVICE_ICONS: Record<string, typeof Monitor> = { DESKTOP: Monitor, MOBILE: Smartphone, TABLET: Tablet }
const DEVICE_LABELS: Record<string, string> = { DESKTOP: "Desktop", MOBILE: "Mobile", TABLET: "Tablet" }
const DEVICE_COLORS: Record<string, string> = {
  DESKTOP: "var(--primary)",
  MOBILE: "#f59e0b",
  TABLET: "#8b5cf6",
}

const COUNTRIES: Record<string, string> = {
  usa: "United States", gbr: "United Kingdom", ind: "India", can: "Canada", aus: "Australia",
  deu: "Germany", fra: "France", bra: "Brazil", jpn: "Japan", ita: "Italy", esp: "Spain",
  mex: "Mexico", nld: "Netherlands", kor: "South Korea", tur: "Turkey", idn: "Indonesia",
  pol: "Poland", arg: "Argentina", tha: "Thailand", sau: "Saudi Arabia", zaf: "South Africa",
  egy: "Egypt", phl: "Philippines", pak: "Pakistan", bgd: "Bangladesh", nga: "Nigeria",
  rus: "Russia", ukr: "Ukraine", col: "Colombia", mys: "Malaysia", sgp: "Singapore",
  are: "UAE", che: "Switzerland", swe: "Sweden", nor: "Norway", dnk: "Denmark",
  fin: "Finland", aut: "Austria", bel: "Belgium", prt: "Portugal", irl: "Ireland",
  nzl: "New Zealand", cze: "Czechia", rou: "Romania", hun: "Hungary", grc: "Greece",
  chl: "Chile", per: "Peru", vnm: "Vietnam", hkg: "Hong Kong", twn: "Taiwan",
  isr: "Israel", ken: "Kenya", lka: "Sri Lanka", mmr: "Myanmar", npl: "Nepal",
}

const APPEARANCE_LABELS: Record<string, string> = {
  AMP_BLUE_LINK: "AMP", INSTANT_APP: "Instant App", RICHCARD: "Rich Card",
  RICH_RESULT: "Rich Result", WEB_LIGHT: "Web Light", WEB_STORY: "Web Story",
  VIDEO: "Video", PAGE_EXPERIENCE: "Page Experience", MERCHANT_LISTINGS: "Merchant Listing",
  PRODUCT_SNIPPETS: "Product Snippet", REVIEW_SNIPPET: "Review Snippet",
  FAQ_RICH_RESULT: "FAQ Rich Result", HOW_TO_RICH_RESULT: "How-to Rich Result",
  BREADCRUMB: "Breadcrumb", SITELINKS_SEARCHBOX: "Sitelinks Searchbox",
  EVENT_RICH_RESULT: "Event Rich Result", PRACTICE_PROBLEMS: "Practice Problems",
  MATH_SOLVERS: "Math Solvers", TRANSLATED_RESULT: "Translated Result",
  EDUCATION_Q_AND_A: "Education Q&A", SPECIAL_ANNOUNCEMENT: "Special Announcement",
}

function countryName(code: string) {
  return COUNTRIES[code.toLowerCase()] || code.toUpperCase()
}

function appearanceName(key: string) {
  return APPEARANCE_LABELS[key] || key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Change Badge ───────────────────────────────────

function ChangeBadge({ current, previous, invert = false }: { current: number; previous: number; invert?: boolean }) {
  const pct = pctChange(current, previous)
  if (pct === 0) return <span className="flex items-center gap-0.5 text-[10px] text-[color:var(--muted-foreground)]"><Minus className="h-3 w-3" /> 0%</span>
  const isPositive = invert ? pct < 0 : pct > 0
  return (
    <span className={cn("flex items-center gap-0.5 text-[10px] font-semibold", isPositive ? "text-emerald-500" : "text-[color:var(--error)]")}>
      {pct > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {pct > 0 ? "+" : ""}{pct.toFixed(1)}%
    </span>
  )
}

// ─── SVG Area Chart ─────────────────────────────────

function PerformanceChart({ data, metric }: { data: DailyRow[]; metric: "clicks" | "impressions" | "ctr" | "position" }) {
  if (data.length < 2) return null

  const values = data.map((d) => metric === "ctr" ? d.ctr * 100 : d[metric])
  const max = Math.max(...values, 1)
  const min = metric === "position" ? Math.min(...values) : 0
  const range = Math.max(max - min, 1)
  const W = 900, H = 260, PAD_L = 55, PAD_R = 10, PAD_T = 20, PAD_B = 30
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B

  const points = values.map((v, i) => ({
    x: PAD_L + (i / (values.length - 1)) * plotW,
    y: metric === "position"
      ? PAD_T + ((v - min) / range) * plotH
      : PAD_T + plotH - ((v - min) / range) * plotH,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD_T + plotH} L${points[0].x},${PAD_T + plotH}Z`

  const COLORS: Record<string, string> = { clicks: "var(--primary)", impressions: "#f59e0b", ctr: "#10b981", position: "#8b5cf6" }
  const color = COLORS[metric]

  const gridLines = 4
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = min + (range / gridLines) * (metric === "position" ? i : gridLines - i)
    return metric === "ctr" ? val.toFixed(1) + "%" : metric === "position" ? val.toFixed(1) : Math.round(val).toLocaleString()
  })

  const labelCount = Math.min(data.length, 7)
  const labelStep = Math.max(1, Math.floor((data.length - 1) / (labelCount - 1)))
  const xLabels: { x: number; label: string }[] = []
  for (let i = 0; i < data.length; i += labelStep) xLabels.push({ x: points[i].x, label: dateLabel(data[i].date) })
  if (xLabels.length && xLabels[xLabels.length - 1].x !== points[points.length - 1].x)
    xLabels.push({ x: points[points.length - 1].x, label: dateLabel(data[data.length - 1].date) })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {gridValues.map((val, i) => {
        const y = PAD_T + (i / gridLines) * plotH
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="10">{val}</text>
          </g>
        )
      })}
      <path d={areaPath} fill={`url(#fill-${metric})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        if (i === 0 || i === points.length - 1) return null
        const prev = values[i - 1], curr = values[i], next = values[i + 1]
        if ((metric === "position" ? curr < prev && curr < next : curr > prev && curr > next))
          return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="var(--card)" strokeWidth="2" />
        return null
      })}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={H - 4} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">{l.label}</text>
      ))}
    </svg>
  )
}

// ─── GA SVG Area Chart ─────────────────────────────

function GaChart({ data, metric }: { data: GaDailyRow[]; metric: "activeUsers" | "sessions" | "pageViews" }) {
  if (data.length < 2) return null

  const values = data.map((d) => d[metric])
  const max = Math.max(...values, 1)
  const min = 0
  const range = Math.max(max - min, 1)
  const W = 900, H = 260, PAD_L = 55, PAD_R = 10, PAD_T = 20, PAD_B = 30
  const plotW = W - PAD_L - PAD_R, plotH = H - PAD_T - PAD_B

  const points = values.map((v, i) => ({
    x: PAD_L + (i / (values.length - 1)) * plotW,
    y: PAD_T + plotH - ((v - min) / range) * plotH,
  }))

  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
  const areaPath = `${linePath} L${points[points.length - 1].x},${PAD_T + plotH} L${points[0].x},${PAD_T + plotH}Z`

  const COLORS: Record<string, string> = { activeUsers: "var(--primary)", sessions: "#f59e0b", pageViews: "#10b981" }
  const color = COLORS[metric]

  const gridLines = 4
  const gridValues = Array.from({ length: gridLines + 1 }, (_, i) => {
    const val = min + (range / gridLines) * (gridLines - i)
    return Math.round(val).toLocaleString()
  })

  const labelCount = Math.min(data.length, 7)
  const labelStep = Math.max(1, Math.floor((data.length - 1) / (labelCount - 1)))
  const xLabels: { x: number; label: string }[] = []
  for (let i = 0; i < data.length; i += labelStep) xLabels.push({ x: points[i].x, label: dateLabel(data[i].date) })
  if (xLabels.length && xLabels[xLabels.length - 1].x !== points[points.length - 1].x)
    xLabels.push({ x: points[points.length - 1].x, label: dateLabel(data[data.length - 1].date) })

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-full" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id={`ga-fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0.01" />
        </linearGradient>
      </defs>
      {gridValues.map((val, i) => {
        const y = PAD_T + (i / gridLines) * plotH
        return (
          <g key={i}>
            <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD_L - 8} y={y + 4} textAnchor="end" fill="var(--muted-foreground)" fontSize="10">{val}</text>
          </g>
        )
      })}
      <path d={areaPath} fill={`url(#ga-fill-${metric})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => {
        if (i === 0 || i === points.length - 1) return null
        const prev = values[i - 1], curr = values[i], next = values[i + 1]
        if (curr > prev && curr > next)
          return <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={color} stroke="var(--card)" strokeWidth="2" />
        return null
      })}
      {xLabels.map((l, i) => (
        <text key={i} x={l.x} y={H - 4} textAnchor="middle" fill="var(--muted-foreground)" fontSize="10">{l.label}</text>
      ))}
    </svg>
  )
}

// ─── Device Donut Chart ─────────────────────────────

function DeviceDonut({ devices }: { devices: DeviceRow[] }) {
  if (!devices.length) return null
  const total = devices.reduce((s, d) => s + d.clicks, 0) || 1
  const R = 70, STROKE = 18, CX = 90, CY = 90
  const circ = 2 * Math.PI * R
  let offset = 0

  return (
    <div className="flex items-center justify-center gap-6">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} opacity="0.3" />
        {devices.map((d, i) => {
          const pct = d.clicks / total
          const dash = circ * pct
          const gap = circ - dash
          const color = DEVICE_COLORS[d.device] || "var(--muted-foreground)"
          const el = (
            <circle
              key={i}
              cx={CX} cy={CY} r={R}
              fill="none" stroke={color} strokeWidth={STROKE}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-offset}
              strokeLinecap="round"
              transform={`rotate(-90 ${CX} ${CY})`}
            />
          )
          offset += dash
          return el
        })}
        <text x={CX} y={CY - 6} textAnchor="middle" fill="var(--foreground)" fontSize="22" fontWeight="bold">{fmt(total)}</text>
        <text x={CX} y={CY + 12} textAnchor="middle" fill="var(--muted-foreground)" fontSize="11">clicks</text>
      </svg>
      <div className="space-y-3">
        {devices.map((d, i) => {
          const Icon = DEVICE_ICONS[d.device] || Monitor
          const pct = ((d.clicks / total) * 100).toFixed(1)
          return (
            <div key={i} className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: DEVICE_COLORS[d.device] || "var(--muted-foreground)" }} />
              <Icon className="h-4 w-4 text-[color:var(--muted-foreground)]" />
              <span className="text-sm text-[color:var(--foreground)] font-medium w-16">{DEVICE_LABELS[d.device] || d.device}</span>
              <span className="text-sm text-[color:var(--muted-foreground)]">{fmt(d.clicks)}</span>
              <span className="text-xs text-[color:var(--muted-foreground)]">({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Horizontal Bar Chart ───────────────────────────

function HBarChart({ items, color }: { items: { label: string; value: number }[]; color: string }) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <div className="space-y-2.5 px-5 pb-5">
      {items.map((item, i) => (
        <div key={i} className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[color:var(--foreground)] truncate max-w-[70%]">{item.label}</span>
            <span className="text-xs font-semibold text-[color:var(--foreground)]">{fmt(item.value)}</span>
          </div>
          <div className="h-2 rounded-full bg-[color:var(--muted)] overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${(item.value / max) * 100}%`, backgroundColor: color }} />
          </div>
        </div>
      ))}
    </div>
  )
}

// ─── Table Header ───────────────────────────────────

function TableHead({ cols }: { cols: { label: string; align?: "right" }[] }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[color:var(--border)] bg-[color:var(--muted)]/50">
      {cols.map((c, i) => (
        <span
          key={i}
          className={cn(
            "text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]",
            i === 0 ? "flex-1 min-w-0" : "w-20 shrink-0",
            c.align === "right" && "text-right"
          )}
        >
          {c.label}
        </span>
      ))}
    </div>
  )
}

// ─── Main Content ───────────────────────────────────

function OverviewContent() {
  const [website, setWebsite] = useState<SelectedWebsite | null>(null)
  const [activeTab, setActiveTab] = useState<"gsc" | "ga">("gsc")
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [gaData, setGaData] = useState<GaAnalyticsData | null>(null)
  const [loading, setLoading] = useState(false)
  const [gaLoading, setGaLoading] = useState(false)
  const [error, setError] = useState("")
  const [gaError, setGaError] = useState("")
  const [rangeIdx, setRangeIdx] = useState(2)
  const [rangeOpen, setRangeOpen] = useState(false)
  const [chartMetric, setChartMetric] = useState<"clicks" | "impressions" | "ctr" | "position">("clicks")
  const [gaChartMetric, setGaChartMetric] = useState<"activeUsers" | "sessions" | "pageViews">("activeUsers")
  const [customStart, setCustomStart] = useState("")
  const [customEnd, setCustomEnd] = useState("")
  const [showCustom, setShowCustom] = useState(false)
  const [searchType, setSearchType] = useState("all")
  const [queryFilter, setQueryFilter] = useState("")
  const [pageFilter, setPageFilter] = useState("")
  const [sitemaps, setSitemaps] = useState<SitemapEntry[]>([])
  const [sitemapsLoading, setSitemapsLoading] = useState(false)
  const [inspection, setInspection] = useState<UrlInspection | null>(null)
  const [inspectionLoading, setInspectionLoading] = useState(false)
  const [inspectionUrl, setInspectionUrl] = useState("")
  const [inspectionError, setInspectionError] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)

  const readWebsite = useCallback(() => {
    const raw = Cookies.get("selected_website")
    if (raw) { try { setWebsite(JSON.parse(raw)) } catch {} }
  }, [])

  useEffect(() => {
    readWebsite()
    window.addEventListener("website-changed", readWebsite)
    return () => window.removeEventListener("website-changed", readWebsite)
  }, [readWebsite])

  const fetchAnalytics = useCallback(async () => {
    if (!website?._id) return
    if (!website.googleSearchConsole?.connected || !website.googleSearchConsole?.selectedProperty) {
      setData(null); setError(""); return
    }
    setLoading(true); setError("")
    try {
      let start: string, end: string
      if (showCustom && customStart && customEnd) {
        start = customStart; end = customEnd
      } else {
        const days = RANGES[rangeIdx].days || 28
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
        start = dateInputVal(startDate); end = dateInputVal(endDate)
      }
      const params: Record<string, string> = { websiteId: website._id, startDate: start, endDate: end }
      if (searchType !== "all") params.searchType = searchType
      const res = await axios.get(`${API}/websites/gsc/analytics`, { params, ...authHeaders() })
      if (res.data.success) setData(res.data)
      else setError(res.data.message || "Failed to load analytics")
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to load analytics")
    } finally { setLoading(false) }
  }, [website?._id, website?.googleSearchConsole?.connected, website?.googleSearchConsole?.selectedProperty, rangeIdx, showCustom, customStart, customEnd, searchType])

  useEffect(() => { fetchAnalytics() }, [fetchAnalytics])

  const fetchGaAnalytics = useCallback(async () => {
    if (!website?._id) return
    if (!website.googleAnalytics?.connected || !website.googleAnalytics?.selectedProperty) {
      setGaData(null); setGaError(""); return
    }
    setGaLoading(true); setGaError("")
    try {
      let start: string, end: string
      if (showCustom && customStart && customEnd) {
        start = customStart; end = customEnd
      } else {
        const days = RANGES[rangeIdx].days || 28
        const endDate = new Date()
        const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
        start = dateInputVal(startDate); end = dateInputVal(endDate)
      }
      const res = await axios.get(`${API}/websites/ga/analytics`, {
        params: { websiteId: website._id, startDate: start, endDate: end },
        ...authHeaders(),
      })
      if (res.data.success) setGaData(res.data)
      else setGaError(res.data.message || "Failed to load analytics")
    } catch (err: any) {
      setGaError(err?.response?.data?.message || "Failed to load analytics")
    } finally { setGaLoading(false) }
  }, [website?._id, website?.googleAnalytics?.connected, website?.googleAnalytics?.selectedProperty, rangeIdx, showCustom, customStart, customEnd])

  useEffect(() => { fetchGaAnalytics() }, [fetchGaAnalytics])

  const fetchSitemaps = useCallback(async () => {
    if (!website?._id || !website.googleSearchConsole?.connected || !website.googleSearchConsole?.selectedProperty) return
    setSitemapsLoading(true)
    try {
      const res = await axios.get(`${API}/websites/gsc/sitemaps`, { params: { websiteId: website._id }, ...authHeaders() })
      if (res.data.success) setSitemaps(res.data.sitemaps || [])
    } catch {} finally { setSitemapsLoading(false) }
  }, [website?._id, website?.googleSearchConsole?.connected, website?.googleSearchConsole?.selectedProperty])

  useEffect(() => { fetchSitemaps() }, [fetchSitemaps])

  const fetchUrlInspection = async () => {
    if (!website?._id || !inspectionUrl.trim()) return
    setInspectionLoading(true); setInspectionError(""); setInspection(null)
    try {
      const res = await axios.get(`${API}/websites/gsc/url-inspection`, {
        params: { websiteId: website._id, inspectionUrl: inspectionUrl.trim() },
        ...authHeaders(),
      })
      if (res.data.success) setInspection(res.data.inspection)
      else setInspectionError(res.data.message || "Inspection failed")
    } catch (err: any) {
      setInspectionError(err?.response?.data?.message || "Inspection failed")
    } finally { setInspectionLoading(false) }
  }

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setRangeOpen(false)
    }
    if (rangeOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [rangeOpen])

  // ─── Empty states ───

  if (!website) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--muted)] mb-5">
          <SearchX className="h-8 w-8 text-[color:var(--muted-foreground)]" />
        </div>
        <h2 className="text-xl font-bold text-[color:var(--foreground)]">No website selected</h2>
        <p className="mt-2 text-sm text-[color:var(--muted-foreground)] max-w-xs">Select a website from the sidebar to view Search Console data.</p>
      </div>
    )
  }

  const gscReady = !!(website.googleSearchConsole?.connected && website.googleSearchConsole?.selectedProperty)
  const gaReady = !!(website.googleAnalytics?.connected && website.googleAnalytics?.selectedProperty)

  const ov = data?.overview
  const prev = data?.previousPeriod
  const daily = data?.dailyData || []
  const allQueries = data?.topQueries || []
  const allPages = data?.topPages || []
  const countries = data?.countries || []
  const devices = data?.devices || []
  const appearances = data?.searchAppearance || []
  const searchTypesData = data?.searchTypes || []
  const queries = queryFilter ? allQueries.filter((q) => q.query.toLowerCase().includes(queryFilter.toLowerCase())) : allQueries
  const pages = pageFilter ? allPages.filter((p) => p.page.toLowerCase().includes(pageFilter.toLowerCase())) : allPages
  const maxQueryClicks = Math.max(...queries.map((q) => q.clicks), 1)
  const maxPageClicks = Math.max(...pages.map((p) => p.clicks), 1)
  const maxCountryClicks = Math.max(...countries.map((c) => c.clicks), 1)

  const gaOv = gaData?.overview
  const gaPrev = gaData?.previousPeriod
  const gaDaily = gaData?.dailyData || []
  const gaChannels = gaData?.channels || []
  const gaPages = gaData?.topPages || []
  const gaDevices = gaData?.devices || []
  const gaCountries = gaData?.countries || []
  const gaBrowsers = gaData?.browsers || []
  const maxChannelSessions = Math.max(...gaChannels.map((c) => c.sessions), 1)
  const maxGaPageViews = Math.max(...gaPages.map((p) => p.pageViews), 1)

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">{website.name}</h1>
          <p className="mt-0.5 text-sm text-[color:var(--muted-foreground)]">
            {activeTab === "gsc" && gscReady && website.googleSearchConsole?.selectedProperty
              ? `Search Console · ${website.googleSearchConsole.selectedProperty.replace(/^sc-domain:|https?:\/\//g, "").replace(/\/$/, "")}`
              : activeTab === "ga" && gaReady && website.googleAnalytics?.selectedProperty
                ? `Analytics · Property ${website.googleAnalytics.selectedProperty}`
                : website.url?.replace(/^https?:\/\//, "").replace(/\/$/, "") || ""}
          </p>
        </div>
        <div ref={dropdownRef} className="relative">
          <Button variant="outline" onClick={() => setRangeOpen(!rangeOpen)} className="gap-2 cursor-pointer">
            <Calendar className="h-4 w-4" />
            {showCustom && customStart && customEnd ? `${dateLabel(customStart)} – ${dateLabel(customEnd)}` : RANGES[rangeIdx].label}
            <ChevronDown className={cn("h-4 w-4 transition-transform", rangeOpen && "rotate-180")} />
          </Button>
          {rangeOpen && (
            <div className="absolute right-0 top-full z-50 mt-1.5 w-72 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg overflow-hidden">
              <div className="py-1">
                {RANGES.map((r, i) => (
                  <button
                    key={r.label}
                    type="button"
                    onClick={() => {
                      if (r.days === 0) {
                        setShowCustom(true)
                        const now = new Date()
                        if (!customEnd) setCustomEnd(dateInputVal(now))
                        if (!customStart) setCustomStart(dateInputVal(new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000)))
                      } else {
                        setShowCustom(false); setRangeIdx(i); setRangeOpen(false)
                      }
                    }}
                    className={cn(
                      "w-full px-4 py-2 text-left text-sm transition-colors cursor-pointer",
                      (!showCustom && i === rangeIdx) || (showCustom && r.days === 0)
                        ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                        : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                    )}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
              {showCustom && (
                <div className="border-t border-[color:var(--border)] p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1 block">From</label>
                      <input
                        type="date"
                        value={customStart}
                        onChange={(e) => setCustomStart(e.target.value)}
                        max={customEnd || dateInputVal(new Date())}
                        className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:border-[color:var(--primary)] focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1 block">To</label>
                      <input
                        type="date"
                        value={customEnd}
                        onChange={(e) => setCustomEnd(e.target.value)}
                        min={customStart}
                        max={dateInputVal(new Date())}
                        className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] px-3 py-2 text-sm text-[color:var(--foreground)] focus:border-[color:var(--primary)] focus:outline-none"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={() => { if (customStart && customEnd) setRangeOpen(false) }}
                    className="w-full cursor-pointer"
                    size="sm"
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ─── Tab Switcher ─── */}
      <div className="flex rounded-xl border border-[color:var(--border)] overflow-hidden w-fit">
        {([
          { key: "gsc" as const, label: "Search Console", ready: gscReady },
          { key: "ga" as const, label: "Analytics", ready: gaReady },
        ]).map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              "px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer flex items-center gap-2",
              activeTab === tab.key
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
            )}
          >
            {tab.label}
            {tab.ready && (
              <span className={cn(
                "h-1.5 w-1.5 rounded-full",
                activeTab === tab.key ? "bg-[color:var(--primary-foreground)]" : "bg-emerald-500"
              )} />
            )}
          </button>
        ))}
      </div>

      {/* ─── GSC Tab ─── */}
      {activeTab === "gsc" && !gscReady && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--error)]/10 mb-5">
            <Unplug className="h-8 w-8 text-[color:var(--error)]" />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--foreground)]">Search Console not connected</h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)] max-w-sm">
            {website.googleSearchConsole?.connected ? "No Search Console property selected." : "Google Search Console is not connected."}{" "}Contact your admin to set it up.
          </p>
        </div>
      )}

      {activeTab === "gsc" && gscReady && loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading Search Console data...</p>
        </div>
      ) : activeTab === "gsc" && gscReady && error ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-[color:var(--error)]">{error}</p>
          <Button variant="ghost" onClick={fetchAnalytics} className="mt-3 cursor-pointer">Try again</Button>
        </Card>
      ) : activeTab === "gsc" && gscReady && ov ? (
        <>
          {/* ─── Search Type Filter ─── */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] mr-1">
              <Filter className="inline h-3.5 w-3.5 mr-1" />Search Type
            </span>
            {([
              { key: "all", label: "All", icon: Globe },
              { key: "web", label: "Web", icon: Globe },
              { key: "image", label: "Image", icon: Image },
              { key: "video", label: "Video", icon: Video },
              { key: "news", label: "News", icon: Newspaper },
              { key: "discover", label: "Discover", icon: Compass },
            ] as const).map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => setSearchType(t.key)}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                  searchType === t.key
                    ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                    : "border border-[color:var(--border)] text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
                )}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </button>
            ))}
          </div>

          {/* ─── Search Type Breakdown (only when "All" is selected) ─── */}
          {searchType === "all" && searchTypesData.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                  <LayoutGrid className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Performance by Search Type</h2>
              </div>
              <TableHead cols={[{ label: "Type" }, { label: "Clicks", align: "right" }, { label: "Impr.", align: "right" }, { label: "CTR", align: "right" }, { label: "Pos.", align: "right" }]} />
              <div className="divide-y divide-[color:var(--border)]">
                {searchTypesData.map((t, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setSearchType(t.type)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--muted)]/50 cursor-pointer text-left"
                  >
                    <span className="flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)] capitalize">{t.type === "googleNews" ? "Google News" : t.type}</span>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(t.clicks)}</span>
                    <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(t.impressions)}</span>
                    <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtCtr(t.ctr)}</span>
                    <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtPos(t.position)}</span>
                  </button>
                ))}
              </div>
            </Card>
          )}

          {/* ─── Stat Cards with comparison ─── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([
              { label: "Total Clicks", value: fmt(ov.clicks), raw: ov.clicks, prevRaw: prev?.clicks, icon: MousePointerClick, bg: "bg-[color:var(--primary)]", fg: "text-[color:var(--primary-foreground)]", invert: false },
              { label: "Total Impressions", value: fmt(ov.impressions), raw: ov.impressions, prevRaw: prev?.impressions, icon: Eye, bg: "bg-[color:var(--warning)]/15", fg: "text-[color:var(--warning)]", invert: false },
              { label: "Average CTR", value: fmtCtr(ov.ctr), raw: ov.ctr, prevRaw: prev?.ctr, icon: Percent, bg: "bg-emerald-500/15", fg: "text-emerald-500", invert: false },
              { label: "Avg Position", value: fmtPos(ov.position), raw: ov.position, prevRaw: prev?.position, icon: ArrowUpDown, bg: "bg-violet-500/15", fg: "text-violet-500", invert: true },
            ] as const).map((s, i) => (
              <Card key={i} className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("h-6 w-6", s.fg)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[color:var(--muted-foreground)]">{s.label}</p>
                  <p className="text-2xl font-bold text-[color:var(--foreground)]">{s.value}</p>
                  {prev && s.prevRaw !== undefined && (
                    <ChangeBadge current={s.raw} previous={s.prevRaw} invert={s.invert} />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* ─── Performance Chart ─── */}
          {daily.length > 1 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex flex-col gap-3 px-5 pt-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                    <BarChart3 className="h-4 w-4 text-[color:var(--primary)]" />
                  </div>
                  <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Performance Over Time</h2>
                </div>
                <div className="flex rounded-xl border border-[color:var(--border)] overflow-hidden">
                  {(["clicks", "impressions", "ctr", "position"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setChartMetric(m)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer capitalize",
                        chartMetric === m
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
                      )}
                    >
                      {m === "ctr" ? "CTR" : m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-2 pb-3 h-64">
                <PerformanceChart data={daily} metric={chartMetric} />
              </div>
            </Card>
          )}

          {/* ─── Queries: Table + Bar Chart ─── */}
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            <Card className="p-0 overflow-hidden xl:col-span-2">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                  <Search className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Top Queries</h2>
                <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{queries.length}{queryFilter ? ` / ${allQueries.length}` : ""} queries</span>
              </div>
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                  <input
                    type="text"
                    value={queryFilter}
                    onChange={(e) => setQueryFilter(e.target.value)}
                    placeholder="Filter queries..."
                    className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] pl-9 pr-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--primary)] focus:outline-none"
                  />
                </div>
              </div>
              <TableHead cols={[{ label: "Query" }, { label: "Clicks", align: "right" }, { label: "Impr.", align: "right" }, { label: "CTR", align: "right" }, { label: "Pos.", align: "right" }]} />
              {queries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No query data available</p>
              ) : (
                <div className="divide-y divide-[color:var(--border)] max-h-[460px] overflow-y-auto">
                  {queries.map((q, i) => (
                    <div key={i} className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--muted)]/50">
                      <div className="absolute inset-y-0 left-0 bg-[color:var(--primary)]/5 transition-all" style={{ width: `${(q.clicks / maxQueryClicks) * 100}%` }} />
                      <span className="relative flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]">{q.query}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(q.clicks)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(q.impressions)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtCtr(q.ctr)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtPos(q.position)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                  <BarChart3 className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Query Clicks</h2>
              </div>
              {queries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No data</p>
              ) : (
                <HBarChart items={queries.slice(0, 10).map((q) => ({ label: q.query, value: q.clicks }))} color="var(--primary)" />
              )}
            </Card>
          </div>

          {/* ─── Top Pages ─── */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--warning)]/10">
                <FileText className="h-4 w-4 text-[color:var(--warning)]" />
              </div>
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Top Pages</h2>
              <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{pages.length}{pageFilter ? ` / ${allPages.length}` : ""} pages</span>
            </div>
            <div className="px-4 pb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                <input
                  type="text"
                  value={pageFilter}
                  onChange={(e) => setPageFilter(e.target.value)}
                  placeholder="Filter pages..."
                  className="w-full rounded-lg border border-[color:var(--border)] bg-[color:var(--background)] pl-9 pr-3 py-2 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--primary)] focus:outline-none"
                />
              </div>
            </div>
            <TableHead cols={[{ label: "Page" }, { label: "Clicks", align: "right" }, { label: "Impr.", align: "right" }, { label: "CTR", align: "right" }, { label: "Pos.", align: "right" }]} />
            {pages.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No page data available</p>
            ) : (
              <div className="divide-y divide-[color:var(--border)] max-h-[460px] overflow-y-auto">
                {pages.map((p, i) => {
                  let display = p.page
                  try { display = new URL(p.page).pathname } catch {}
                  return (
                    <div key={i} className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--muted)]/50">
                      <div className="absolute inset-y-0 left-0 bg-[color:var(--warning)]/5 transition-all" style={{ width: `${(p.clicks / maxPageClicks) * 100}%` }} />
                      <span className="relative flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]" title={p.page}>{display}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(p.clicks)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(p.impressions)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtCtr(p.ctr)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtPos(p.position)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {/* ─── Devices (Donut) + Countries (Table) ─── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Monitor className="h-4 w-4 text-violet-500" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Device Breakdown</h2>
              </div>
              {devices.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No device data</p>
              ) : (
                <div className="px-5 pb-5 pt-2">
                  <DeviceDonut devices={devices} />
                  <div className="mt-5 space-y-2 border-t border-[color:var(--border)] pt-4">
                    {devices.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
                        <span>{DEVICE_LABELS[d.device] || d.device}</span>
                        <div className="flex gap-4">
                          <span>{fmt(d.impressions)} imp</span>
                          <span>{fmtCtr(d.ctr)} CTR</span>
                          <span>Pos {fmtPos(d.position)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Top Countries</h2>
                <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{countries.length} countries</span>
              </div>
              <TableHead cols={[{ label: "Country" }, { label: "Clicks", align: "right" }, { label: "Impr.", align: "right" }, { label: "CTR", align: "right" }, { label: "Pos.", align: "right" }]} />
              {countries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No country data</p>
              ) : (
                <div className="divide-y divide-[color:var(--border)] max-h-80 overflow-y-auto">
                  {countries.map((c, i) => (
                    <div key={i} className="group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--muted)]/50">
                      <div className="absolute inset-y-0 left-0 bg-emerald-500/5 transition-all" style={{ width: `${(c.clicks / maxCountryClicks) * 100}%` }} />
                      <span className="relative flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]">{countryName(c.country)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(c.clicks)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(c.impressions)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtCtr(c.ctr)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtPos(c.position)}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* ─── Search Appearance + Country Bar Chart ─── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                  <LayoutGrid className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Search Appearance</h2>
              </div>
              {appearances.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No search appearance data</p>
              ) : (
                <>
                  <TableHead cols={[{ label: "Type" }, { label: "Clicks", align: "right" }, { label: "Impr.", align: "right" }, { label: "CTR", align: "right" }]} />
                  <div className="divide-y divide-[color:var(--border)]">
                    {appearances.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--muted)]/50">
                        <span className="flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]">{appearanceName(a.appearance)}</span>
                        <span className="w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(a.clicks)}</span>
                        <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(a.impressions)}</span>
                        <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtCtr(a.ctr)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <Globe className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Clicks by Country</h2>
              </div>
              {countries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No data</p>
              ) : (
                <HBarChart items={countries.slice(0, 10).map((c) => ({ label: countryName(c.country), value: c.clicks }))} color="#10b981" />
              )}
            </Card>
          </div>

          {/* ─── Daily Breakdown ─── */}
          {daily.length > 0 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                  <Calendar className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Daily Breakdown</h2>
                <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{daily.length} days</span>
              </div>
              <TableHead cols={[{ label: "Date" }, { label: "Clicks", align: "right" }, { label: "Impr.", align: "right" }, { label: "CTR", align: "right" }, { label: "Pos.", align: "right" }]} />
              <div className="divide-y divide-[color:var(--border)] max-h-96 overflow-y-auto">
                {daily.map((d, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--muted)]/50">
                    <span className="flex-1 min-w-0 text-sm text-[color:var(--foreground)]">{dateLabel(d.date)}</span>
                    <span className="w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(d.clicks)}</span>
                    <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(d.impressions)}</span>
                    <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtCtr(d.ctr)}</span>
                    <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmtPos(d.position)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ─── URL Inspection ─── */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                <Link2 className="h-4 w-4 text-blue-500" />
              </div>
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">URL Inspection</h2>
            </div>
            <div className="px-5 pb-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                  <input
                    type="url"
                    value={inspectionUrl}
                    onChange={(e) => setInspectionUrl(e.target.value)}
                    placeholder="Enter URL to inspect (e.g. https://example.com/page)"
                    onKeyDown={(e) => { if (e.key === "Enter") fetchUrlInspection() }}
                    className="w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] pl-9 pr-3 py-2.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:border-[color:var(--primary)] focus:outline-none"
                  />
                </div>
                <Button onClick={fetchUrlInspection} disabled={inspectionLoading || !inspectionUrl.trim()} className="cursor-pointer shrink-0">
                  {inspectionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Inspect"}
                </Button>
              </div>
              {inspectionError && <p className="mt-2 text-xs text-[color:var(--error)]">{inspectionError}</p>}
            </div>
            {inspection && (
              <div className="border-t border-[color:var(--border)] px-5 py-4 space-y-4">
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  <div className="rounded-xl border border-[color:var(--border)] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">Index Status</p>
                    <div className="flex items-center gap-1.5">
                      {inspection.verdict === "PASS" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : inspection.verdict === "FAIL" ? <XCircle className="h-4 w-4 text-[color:var(--error)]" /> : <AlertTriangle className="h-4 w-4 text-[color:var(--warning)]" />}
                      <span className="text-sm font-semibold text-[color:var(--foreground)]">{inspection.indexStatus}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">Last Crawl</p>
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                      <span className="text-sm font-semibold text-[color:var(--foreground)]">{inspection.lastCrawlTime ? new Date(inspection.lastCrawlTime).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "N/A"}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">Mobile Usability</p>
                    <div className="flex items-center gap-1.5">
                      {inspection.mobileUsability === "PASS" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <AlertTriangle className="h-4 w-4 text-[color:var(--warning)]" />}
                      <span className="text-sm font-semibold text-[color:var(--foreground)]">{inspection.mobileUsability === "PASS" ? "Usable" : inspection.mobileUsability}</span>
                    </div>
                  </div>
                  <div className="rounded-xl border border-[color:var(--border)] p-3">
                    <p className="text-[11px] uppercase tracking-wider text-[color:var(--muted-foreground)] mb-1">Rich Results</p>
                    <div className="flex items-center gap-1.5">
                      {inspection.richResults === "PASS" ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : inspection.richResults === "FAIL" ? <XCircle className="h-4 w-4 text-[color:var(--error)]" /> : <Minus className="h-4 w-4 text-[color:var(--muted-foreground)]" />}
                      <span className="text-sm font-semibold text-[color:var(--foreground)]">{inspection.richResults === "PASS" ? "Eligible" : inspection.richResults === "FAIL" ? "Ineligible" : "N/A"}</span>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[color:var(--muted-foreground)]">Crawl Status</span>
                      <span className="font-medium text-[color:var(--foreground)]">{inspection.pageFetchState}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[color:var(--muted-foreground)]">Crawled As</span>
                      <span className="font-medium text-[color:var(--foreground)]">{inspection.crawledAs}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[color:var(--muted-foreground)]">Robots.txt</span>
                      <span className="font-medium text-[color:var(--foreground)]">{inspection.robotsTxtState}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-[color:var(--muted-foreground)]">Indexing</span>
                      <span className="font-medium text-[color:var(--foreground)]">{inspection.indexingState}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-start justify-between text-xs gap-2">
                      <span className="text-[color:var(--muted-foreground)] shrink-0">Google Canonical</span>
                      <span className="font-medium text-[color:var(--foreground)] truncate text-right" title={inspection.canonicalUrl}>{inspection.canonicalUrl || "N/A"}</span>
                    </div>
                    <div className="flex items-start justify-between text-xs gap-2">
                      <span className="text-[color:var(--muted-foreground)] shrink-0">User Canonical</span>
                      <span className="font-medium text-[color:var(--foreground)] truncate text-right" title={inspection.userCanonical}>{inspection.userCanonical || "N/A"}</span>
                    </div>
                    {inspection.mobileIssues.length > 0 && (
                      <div className="text-xs">
                        <span className="text-[color:var(--muted-foreground)]">Mobile Issues:</span>
                        {inspection.mobileIssues.map((issue, i) => (
                          <span key={i} className="ml-1 text-[color:var(--error)]">{issue.message}</span>
                        ))}
                      </div>
                    )}
                    {inspection.richResultItems.length > 0 && (
                      <div className="text-xs">
                        <span className="text-[color:var(--muted-foreground)]">Rich Result Types: </span>
                        <span className="font-medium text-[color:var(--foreground)]">{inspection.richResultItems.map((r) => r.type).join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* ─── Sitemaps ─── */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-500/10">
                <Network className="h-4 w-4 text-teal-500" />
              </div>
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Sitemaps</h2>
              <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{sitemaps.length} submitted</span>
            </div>
            {sitemapsLoading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-[color:var(--muted-foreground)]" /></div>
            ) : sitemaps.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No sitemaps found</p>
            ) : (
              <>
                <TableHead cols={[{ label: "Sitemap" }, { label: "URLs", align: "right" }, { label: "Status", align: "right" }, { label: "Last Downloaded", align: "right" }]} />
                <div className="divide-y divide-[color:var(--border)]">
                  {sitemaps.map((s, i) => {
                    const totalSubmitted = s.contents.reduce((sum, c) => sum + c.submitted, 0)
                    const totalIndexed = s.contents.reduce((sum, c) => sum + c.indexed, 0)
                    return (
                      <div key={i} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--muted)]/50">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-[color:var(--foreground)] truncate" title={s.path}>{s.path.replace(/^https?:\/\/[^/]+/, "")}</p>
                          {s.contents.length > 0 && (
                            <p className="text-[11px] text-[color:var(--muted-foreground)] mt-0.5">
                              {s.contents.map((c) => c.type).join(", ")}{s.isSitemapsIndex ? " (Index)" : ""}
                            </p>
                          )}
                        </div>
                        <div className="w-20 shrink-0 text-right">
                          <span className="text-sm font-semibold text-[color:var(--foreground)]">{fmt(totalSubmitted)}</span>
                          {totalIndexed > 0 && <p className="text-[11px] text-[color:var(--muted-foreground)]">{fmt(totalIndexed)} indexed</p>}
                        </div>
                        <div className="w-20 shrink-0 text-right">
                          {s.errors > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--error)]"><XCircle className="h-3 w-3" />{s.errors} errors</span>
                          ) : s.warnings > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-[color:var(--warning)]"><AlertTriangle className="h-3 w-3" />{s.warnings} warn</span>
                          ) : s.isPending ? (
                            <span className="text-xs text-[color:var(--muted-foreground)]">Pending</span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-500"><CheckCircle2 className="h-3 w-3" />OK</span>
                          )}
                        </div>
                        <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">
                          {s.lastDownloaded ? new Date(s.lastDownloaded).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—"}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </Card>
        </>
      ) : null}

      {/* ─── GA Tab ─── */}
      {activeTab === "ga" && !gaReady && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--error)]/10 mb-5">
            <Unplug className="h-8 w-8 text-[color:var(--error)]" />
          </div>
          <h2 className="text-xl font-bold text-[color:var(--foreground)]">Google Analytics not connected</h2>
          <p className="mt-2 text-sm text-[color:var(--muted-foreground)] max-w-sm">
            {website.googleAnalytics?.connected ? "No GA4 property selected." : "Google Analytics is not connected."}{" "}Contact your admin to set it up.
          </p>
        </div>
      )}

      {activeTab === "ga" && gaReady && gaLoading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--primary)]" />
          <p className="text-sm text-[color:var(--muted-foreground)]">Loading Analytics data...</p>
        </div>
      ) : activeTab === "ga" && gaReady && gaError ? (
        <Card className="flex flex-col items-center py-16 text-center">
          <p className="text-sm text-[color:var(--error)]">{gaError}</p>
          <Button variant="ghost" onClick={fetchGaAnalytics} className="mt-3 cursor-pointer">Try again</Button>
        </Card>
      ) : activeTab === "ga" && gaReady && gaOv ? (
        <>
          {/* ─── GA Stat Cards ─── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([
              { label: "Active Users", value: fmt(gaOv.activeUsers), raw: gaOv.activeUsers, prevRaw: gaPrev?.activeUsers, icon: Eye, bg: "bg-[color:var(--primary)]", fg: "text-[color:var(--primary-foreground)]", invert: false },
              { label: "Sessions", value: fmt(gaOv.sessions), raw: gaOv.sessions, prevRaw: gaPrev?.sessions, icon: MousePointerClick, bg: "bg-[color:var(--warning)]/15", fg: "text-[color:var(--warning)]", invert: false },
              { label: "Page Views", value: fmt(gaOv.pageViews), raw: gaOv.pageViews, prevRaw: gaPrev?.pageViews, icon: FileText, bg: "bg-emerald-500/15", fg: "text-emerald-500", invert: false },
              { label: "Engagement Rate", value: (gaOv.engagementRate * 100).toFixed(1) + "%", raw: gaOv.engagementRate, prevRaw: gaPrev?.engagementRate, icon: Percent, bg: "bg-violet-500/15", fg: "text-violet-500", invert: false },
            ] as const).map((s, i) => (
              <Card key={i} className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("h-6 w-6", s.fg)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[color:var(--muted-foreground)]">{s.label}</p>
                  <p className="text-2xl font-bold text-[color:var(--foreground)]">{s.value}</p>
                  {gaPrev && s.prevRaw !== undefined && (
                    <ChangeBadge current={s.raw} previous={s.prevRaw} invert={s.invert} />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* ─── GA Second Row Stats ─── */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {([
              { label: "Avg Session", value: Math.round(gaOv.avgSessionDuration) + "s", raw: gaOv.avgSessionDuration, prevRaw: gaPrev?.avgSessionDuration, icon: Calendar, bg: "bg-blue-500/15", fg: "text-blue-500", invert: false },
              { label: "New Users", value: fmt(gaOv.newUsers), raw: gaOv.newUsers, prevRaw: gaPrev?.newUsers, icon: TrendingUp, bg: "bg-teal-500/15", fg: "text-teal-500", invert: false },
              { label: "Total Events", value: fmt(gaOv.eventCount), raw: gaOv.eventCount, prevRaw: gaPrev?.eventCount, icon: BarChart3, bg: "bg-orange-500/15", fg: "text-orange-500", invert: false },
              { label: "Bounce Rate", value: (gaOv.bounceRate * 100).toFixed(1) + "%", raw: gaOv.bounceRate, prevRaw: gaPrev?.bounceRate, icon: ArrowUpDown, bg: "bg-rose-500/15", fg: "text-rose-500", invert: true },
            ] as const).map((s, i) => (
              <Card key={i} className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("h-6 w-6", s.fg)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[color:var(--muted-foreground)]">{s.label}</p>
                  <p className="text-2xl font-bold text-[color:var(--foreground)]">{s.value}</p>
                  {gaPrev && s.prevRaw !== undefined && (
                    <ChangeBadge current={s.raw} previous={s.prevRaw} invert={s.invert} />
                  )}
                </div>
              </Card>
            ))}
          </div>

          {/* ─── GA Performance Chart ─── */}
          {gaDaily.length > 1 && (
            <Card className="p-0 overflow-hidden">
              <div className="flex flex-col gap-3 px-5 pt-5 pb-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                    <BarChart3 className="h-4 w-4 text-[color:var(--primary)]" />
                  </div>
                  <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Performance Over Time</h2>
                </div>
                <div className="flex rounded-xl border border-[color:var(--border)] overflow-hidden">
                  {(["activeUsers", "sessions", "pageViews"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGaChartMetric(m)}
                      className={cn(
                        "px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer",
                        gaChartMetric === m
                          ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                          : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
                      )}
                    >
                      {m === "activeUsers" ? "Users" : m === "pageViews" ? "Page Views" : "Sessions"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="px-2 pb-3 h-64">
                <GaChart data={gaDaily} metric={gaChartMetric} />
              </div>
            </Card>
          )}

          {/* ─── Traffic Sources + Devices ─── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Traffic Sources */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                  <Globe className="h-4 w-4 text-[color:var(--primary)]" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Traffic Sources</h2>
              </div>
              <TableHead cols={[{ label: "Channel" }, { label: "Users", align: "right" }, { label: "Sessions", align: "right" }, { label: "Engage %", align: "right" }]} />
              {gaChannels.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No traffic data</p>
              ) : (
                <div className="divide-y divide-[color:var(--border)] max-h-80 overflow-y-auto">
                  {gaChannels.map((c, i) => (
                    <div key={i} className="group relative flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--muted)]/50">
                      <div className="absolute inset-y-0 left-0 bg-[color:var(--primary)]/5 transition-all" style={{ width: `${(c.sessions / maxChannelSessions) * 100}%` }} />
                      <span className="relative flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]">{c.channel}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(c.users)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(c.sessions)}</span>
                      <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{(c.engagementRate * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Devices Donut */}
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                  <Monitor className="h-4 w-4 text-violet-500" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Device Breakdown</h2>
              </div>
              {gaDevices.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No device data</p>
              ) : (
                <div className="px-5 pb-5 pt-2">
                  <DeviceDonut devices={gaDevices.map((d) => ({ device: d.device.toUpperCase(), clicks: d.sessions, impressions: d.users, ctr: d.engagementRate, position: 0 }))} />
                  <div className="mt-5 space-y-2 border-t border-[color:var(--border)] pt-4">
                    {gaDevices.map((d, i) => (
                      <div key={i} className="flex items-center justify-between text-xs text-[color:var(--muted-foreground)]">
                        <span className="capitalize">{d.device}</span>
                        <div className="flex gap-4">
                          <span>{fmt(d.users)} users</span>
                          <span>{fmt(d.sessions)} sessions</span>
                          <span>{(d.engagementRate * 100).toFixed(1)}% engaged</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          </div>

          {/* ─── Top Pages ─── */}
          <Card className="p-0 overflow-hidden">
            <div className="flex items-center gap-2 px-5 pt-5 pb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--warning)]/10">
                <FileText className="h-4 w-4 text-[color:var(--warning)]" />
              </div>
              <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Top Pages</h2>
              <span className="ml-auto text-xs text-[color:var(--muted-foreground)]">{gaPages.length} pages</span>
            </div>
            <TableHead cols={[{ label: "Page" }, { label: "Views", align: "right" }, { label: "Users", align: "right" }, { label: "Avg Time", align: "right" }]} />
            {gaPages.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No page data</p>
            ) : (
              <div className="divide-y divide-[color:var(--border)] max-h-[460px] overflow-y-auto">
                {gaPages.map((p, i) => (
                  <div key={i} className="group relative flex items-center gap-3 px-4 py-3 transition-colors hover:bg-[color:var(--muted)]/50">
                    <div className="absolute inset-y-0 left-0 bg-[color:var(--warning)]/5 transition-all" style={{ width: `${(p.pageViews / maxGaPageViews) * 100}%` }} />
                    <span className="relative flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]" title={p.pagePath}>{p.pagePath}</span>
                    <span className="relative w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(p.pageViews)}</span>
                    <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(p.users)}</span>
                    <span className="relative w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{Math.round(p.avgDuration)}s</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ─── Countries + Browsers ─── */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
                  <MapPin className="h-4 w-4 text-emerald-500" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Top Countries</h2>
              </div>
              <TableHead cols={[{ label: "Country" }, { label: "Users", align: "right" }, { label: "Sessions", align: "right" }, { label: "Engage %", align: "right" }]} />
              {gaCountries.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No country data</p>
              ) : (
                <div className="divide-y divide-[color:var(--border)] max-h-80 overflow-y-auto">
                  {gaCountries.map((c, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[color:var(--muted)]/50">
                      <span className="flex-1 min-w-0 truncate text-sm text-[color:var(--foreground)]">{c.country}</span>
                      <span className="w-20 shrink-0 text-right text-sm font-semibold text-[color:var(--foreground)]">{fmt(c.users)}</span>
                      <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{fmt(c.sessions)}</span>
                      <span className="w-20 shrink-0 text-right text-sm text-[color:var(--muted-foreground)]">{(c.engagementRate * 100).toFixed(1)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-0 overflow-hidden">
              <div className="flex items-center gap-2 px-5 pt-5 pb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <Globe className="h-4 w-4 text-blue-500" />
                </div>
                <h2 className="text-sm font-semibold text-[color:var(--foreground)]">Top Browsers</h2>
              </div>
              {gaBrowsers.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-[color:var(--muted-foreground)]">No browser data</p>
              ) : (
                <HBarChart items={gaBrowsers.map((b) => ({ label: b.browser, value: b.sessions }))} color="var(--primary)" />
              )}
            </Card>
          </div>
        </>
      ) : null}
    </div>
  )
}

export default function OverviewPage() {
  return (
    <DashboardShell>
      <OverviewContent />
    </DashboardShell>
  )
}
