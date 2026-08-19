"use client"

import { useState, useEffect } from "react"
import { Trash2, X, Key, Eye, EyeOff, TrendingUp, Zap, DollarSign, Activity, AlertCircle, Save, Cpu, CreditCard, BarChart3, Layers, RefreshCw, CheckCircle2, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import axios from "axios"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

function Sparkline({ data, color, width = 180, height = 48 }: { data: number[]; color: string; width?: number; height?: number }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((v - min) / range) * (height - 8) - 4
    return `${x},${y}`
  }).join(" ")

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.2" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#grad-${color})`}
      />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={width} cy={parseFloat(points.split(" ").pop()?.split(",")[1] || "0")} r="3.5" fill={color} stroke="white" strokeWidth="2" />
    </svg>
  )
}

type Provider = "openai" | "dataforseo"

function validateKey(provider: Provider, key: string): string | null {
  if (!key.trim()) return "API key is required"
  if (provider === "openai") {
    if (!key.startsWith("sk-")) return "OpenAI key must start with sk-"
    if (key.length < 20) return "Invalid OpenAI key"
    return null
  }
  if (provider === "dataforseo") {
    if (!key.includes(":")) return "DataForSEO key must be in login:password format"
    const [login, password] = key.split(":")
    if (!login || !password) return "Both login and password are required (login:password)"
    return null
  }
  return null
}

function maskKey(provider: Provider, key: string): string {
  if (provider === "openai") return `${key.slice(0, 7)}****${key.slice(-4)}`
  const [login] = key.split(":")
  return `${login}:****`
}

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

interface OpenAIUsage {
  keyMasked: string
  accountName: string | null
  plan: string | null
  hardLimit: number | null
  softLimit: number | null
  hasPaymentMethod: boolean | null
  totalUsage: number
  totalTokens: number
  totalRequests: number
  totalModels: number
  modelBreakdown: Record<string, { tokens: number; cost: number; requests: number }>
  dailySpend: { date: string; cost: number }[]
  localUsage?: {
    source: string
    actions: Record<string, { count: number; tokens: number }>
    allTime: { totalTokens: number; promptTokens: number; completionTokens: number; requests: number; firstUsed: string } | null
  } | null
}

interface DataForSEOUsage {
  keyMasked: string
  login: string
  balance: number | null
  totalSpent: number | null
  rateLimit: number | null
  rateLimitUsed: number | null
  totalRequests: number
  totalCost: number
  endpointBreakdown: Record<string, { requests: number; cost: number }>
  dailySpend: { date: string; cost: number; requests: number }[]
}

interface UsageRow {
  _id: string
  name: string
  email?: string
  url?: string
  totalTokens: number
  promptTokens: number
  completionTokens: number
  requests: number
  generates: number
  refines: number
  analyzes: number
  humanizes: number
  metas: number
  keywordAnalyzes: number
  competitorAnalyzes: number
  backlinkAnalyzes: number
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return String(n)
}

function AIUsageBreakdown() {
  const [period, setPeriod] = useState<"today" | "week" | "month">("month")
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState<"users" | "websites">("users")
  const [data, setData] = useState<{
    totals: { totalTokens: number; promptTokens: number; completionTokens: number; requests: number }
    byUser: UsageRow[]
    byWebsite: UsageRow[]
  } | null>(null)

  async function fetchStats() {
    setLoading(true)
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/ai-usage-stats?period=${period}`, authHeaders())
      if (res.data.success) setData(res.data.data)
      else setData(null)
    } catch {
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchStats() }, [period])

  const rows = view === "users" ? (data?.byUser || []) : (data?.byWebsite || [])
  const maxTokens = Math.max(...rows.map(r => r.totalTokens), 1)

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-3 border-b border-[color:var(--border)] pb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[color:var(--primary)]" />
          <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Usage by {view === "users" ? "Users" : "Websites"}</h3>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[color:var(--border)] p-0.5">
            {(["users", "websites"] as const).map(v => (
              <button key={v} type="button" onClick={() => setView(v)}
                className={cn("rounded-md px-3 py-1 text-xs font-medium transition-colors cursor-pointer",
                  view === v ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]" : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]")}>
                {v === "users" ? "Users" : "Websites"}
              </button>
            ))}
          </div>
          <div className="flex rounded-lg border border-[color:var(--border)] p-0.5">
            {(["today", "week", "month"] as const).map(p => (
              <button key={p} type="button" onClick={() => setPeriod(p)}
                className={cn("rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer",
                  period === p ? "bg-[color:var(--foreground)] text-[color:var(--background)]" : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]")}>
                {p === "today" ? "Today" : p === "week" ? "7 Days" : "Month"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3 pt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 animate-pulse">
              <div className="h-4 w-32 rounded bg-[color:var(--muted)]" />
              <div className="h-4 flex-1 rounded bg-[color:var(--muted)]" />
              <div className="h-4 w-16 rounded bg-[color:var(--muted)]" />
            </div>
          ))}
        </div>
      ) : rows.length === 0 ? (
        <p className="py-8 text-center text-sm text-[color:var(--muted-foreground)]">No usage data for this period</p>
      ) : (
        <div className="overflow-x-auto pt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)]">
                <th className="pb-2 text-left text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  {view === "users" ? "User" : "Website"}
                </th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Total Tokens</th>
                <th className="hidden pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] md:table-cell">Prompt</th>
                <th className="hidden pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] md:table-cell">Completion</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Requests</th>
                <th className="hidden pb-2 text-center text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] lg:table-cell">Actions</th>
                <th className="pb-2 text-right text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Usage</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row._id} className="border-b border-[color:var(--border)]/50 last:border-0">
                  <td className="py-2.5 pr-3">
                    <p className="font-medium text-[color:var(--foreground)]">{row.name}</p>
                    <p className="text-xs text-[color:var(--muted-foreground)]">{row.email || row.url || ""}</p>
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs font-semibold text-[color:var(--foreground)]">{formatTokens(row.totalTokens)}</td>
                  <td className="hidden py-2.5 text-right font-mono text-xs text-[color:var(--muted-foreground)] md:table-cell">{formatTokens(row.promptTokens)}</td>
                  <td className="hidden py-2.5 text-right font-mono text-xs text-[color:var(--muted-foreground)] md:table-cell">{formatTokens(row.completionTokens)}</td>
                  <td className="py-2.5 text-right font-mono text-xs text-[color:var(--foreground)]">{row.requests}</td>
                  <td className="hidden py-2.5 lg:table-cell">
                    <div className="flex flex-wrap items-center justify-center gap-1">
                      {row.generates > 0 && <span className="rounded bg-[color:var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--primary)]" title="Content generated">{row.generates} gen</span>}
                      {row.refines > 0 && <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[10px] font-medium text-blue-500" title="Content refined">{row.refines} ref</span>}
                      {row.humanizes > 0 && <span className="rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-500" title="Content humanized">{row.humanizes} hum</span>}
                      {row.analyzes > 0 && <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-500" title="Content analyzed">{row.analyzes} ana</span>}
                      {row.metas > 0 && <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium text-violet-500" title="Meta data generated">{row.metas} meta</span>}
                      {row.keywordAnalyzes > 0 && <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-500" title="Keyword analysis">{row.keywordAnalyzes} kw</span>}
                      {row.competitorAnalyzes > 0 && <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-medium text-rose-500" title="Competitor analysis">{row.competitorAnalyzes} comp</span>}
                      {row.backlinkAnalyzes > 0 && <span className="rounded bg-teal-500/10 px-1.5 py-0.5 text-[10px] font-medium text-teal-500" title="Backlink analysis">{row.backlinkAnalyzes} bl</span>}
                    </div>
                  </td>
                  <td className="w-32 py-2.5 pl-3">
                    <div className="h-2 w-full rounded-full bg-[color:var(--muted)]">
                      <div className="h-full rounded-full bg-[color:var(--primary)] transition-all" style={{ width: `${Math.max((row.totalTokens / maxTokens) * 100, 3)}%` }} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            {data?.totals && (
              <tfoot>
                <tr className="border-t-2 border-[color:var(--border)]">
                  <td className="py-2.5 text-xs font-semibold text-[color:var(--foreground)]">Total</td>
                  <td className="py-2.5 text-right font-mono text-xs font-bold text-[color:var(--foreground)]">{formatTokens(data.totals.totalTokens)}</td>
                  <td className="hidden py-2.5 text-right font-mono text-xs font-semibold text-[color:var(--muted-foreground)] md:table-cell">{formatTokens(data.totals.promptTokens)}</td>
                  <td className="hidden py-2.5 text-right font-mono text-xs font-semibold text-[color:var(--muted-foreground)] md:table-cell">{formatTokens(data.totals.completionTokens)}</td>
                  <td className="py-2.5 text-right font-mono text-xs font-bold text-[color:var(--foreground)]">{data.totals.requests}</td>
                  <td className="hidden lg:table-cell" />
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </Card>
  )
}

export default function AddApiPage() {
  const [showAddModal, setShowAddModal] = useState(false)
  const [addProvider, setAddProvider] = useState<Provider>("openai")
  const [addApiKey, setAddApiKey] = useState("")
  const [showAddKey, setShowAddKey] = useState(false)
  const [addError, setAddError] = useState("")
  const [saving, setSaving] = useState(false)
  const [savedKeys, setSavedKeys] = useState<{ _id: string; provider: string; key: string; status: string }[]>([])
  const [keysLoading, setKeysLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<"openai" | "dataforseo">("openai")

  const [openaiData, setOpenaiData] = useState<OpenAIUsage | null>(null)
  const [openaiLoading, setOpenaiLoading] = useState(true)

  const [dfsData, setDfsData] = useState<DataForSEOUsage | null>(null)
  const [dfsLoading, setDfsLoading] = useState(true)
  const [dfsError, setDfsError] = useState<string | null>(null)

  async function fetchOpenAIUsage() {
    setOpenaiLoading(true)
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/openai-usage`, authHeaders())
      if (res.data.success) {
        setOpenaiData(res.data.data)
      } else {
        setOpenaiData(null)
      }
    } catch {
      setOpenaiData(null)
    } finally {
      setOpenaiLoading(false)
    }
  }

  async function fetchDFSUsage() {
    setDfsLoading(true)
    setDfsError(null)
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/dataforseo-usage`, authHeaders())
      if (res.data.success) {
        setDfsData(res.data.data)
      } else {
        setDfsData(null)
        setDfsError(res.data.message || null)
      }
    } catch {
      setDfsData(null)
    } finally {
      setDfsLoading(false)
    }
  }

  useEffect(() => {
    fetchOpenAIUsage()
    fetchDFSUsage()
  }, [])

  async function fetchSavedKeys() {
    setKeysLoading(true)
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/get-all`, authHeaders())
      if (res.data.success) setSavedKeys(res.data.apiKeys)
    } catch {
      setSavedKeys([])
    } finally {
      setKeysLoading(false)
    }
  }

  async function handleDeleteKey(id: string) {
    setDeleting(id)
    try {
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/delete?_id=${id}`, authHeaders())
      if (res.data.success) {
        toast.success("API key removed!")
        setSavedKeys((prev) => prev.filter((k) => k._id !== id))
        fetchOpenAIUsage()
        fetchDFSUsage()
      } else {
        toast.error(res.data.message || "Failed to remove")
      }
    } catch {
      toast.error("Failed to connect to server")
    } finally {
      setDeleting(null)
    }
  }

  async function handleUpdateKey() {
    const validationError = validateKey(addProvider, addApiKey)
    if (validationError) {
      setAddError(validationError)
      return
    }
    const existing = savedKeys.find((k) => k.provider === addProvider)
    if (!existing) return handleAddApiSave()

    setSaving(true)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/update`, {
        _id: existing._id,
        key: addApiKey.trim(),
      }, authHeaders())
      if (res.data.success) {
        toast.success("API key updated!")
        setAddApiKey("")
        fetchSavedKeys()
        if (addProvider === "openai") fetchOpenAIUsage()
        if (addProvider === "dataforseo") fetchDFSUsage()
      } else {
        toast.error(res.data.message || "Failed to update")
      }
    } catch {
      toast.error("Failed to connect to server")
    } finally {
      setSaving(false)
    }
  }

  function openManageApi() {
    setAddProvider("openai")
    setAddApiKey("")
    setShowAddKey(false)
    setAddError("")
    setShowAddModal(true)
    fetchSavedKeys()
  }

  async function handleAddApiSave() {
    const validationError = validateKey(addProvider, addApiKey)
    if (validationError) {
      setAddError(validationError)
      return
    }

    setSaving(true)
    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/apikeys/create`, {
        provider: addProvider,
        key: addApiKey.trim(),
      }, authHeaders())

      if (res.data.success) {
        toast.success(res.data.message || "API key saved successfully!")
        setAddApiKey("")
        fetchSavedKeys()
        if (addProvider === "openai") fetchOpenAIUsage()
        if (addProvider === "dataforseo") fetchDFSUsage()
      } else {
        toast.error(res.data.message || "Failed to save API key")
      }
    } catch {
      toast.error("Failed to connect to server")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Manage APIs</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Configure AI API keys for your websites</p>
        </div>
        <Button onClick={openManageApi} className="shrink-0 cursor-pointer">
          <Key className="h-4 w-4" />
          Manage API's
        </Button>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-1 rounded-xl bg-[color:var(--muted)] p-1 w-fit">
        <button
          type="button"
          onClick={() => setActiveTab("openai")}
          className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
            activeTab === "openai"
              ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
              : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          )}
        >
          <Cpu className="h-4 w-4" />
          OpenAI
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("dataforseo")}
          className={cn("flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 cursor-pointer",
            activeTab === "dataforseo"
              ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
              : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          )}
        >
          <Globe className="h-4 w-4" />
          DataForSEO
        </button>
      </div>

      {/* OpenAI Tab */}
      {activeTab === "openai" && (
        <>
          {openaiLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 w-24 rounded bg-[color:var(--muted)]" />
                  <div className="mt-3 h-8 w-32 rounded bg-[color:var(--muted)]" />
                  <div className="mt-4 h-12 w-full rounded bg-[color:var(--muted)]" />
                </Card>
              ))}
            </div>
          ) : openaiData ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Cpu className="h-5 w-5 text-[color:var(--primary)]" />
                  <h2 className="text-lg font-semibold text-[color:var(--foreground)]">OpenAI Usage</h2>
                  <code className="rounded-md bg-[color:var(--muted)] px-2 py-0.5 text-xs font-mono text-[color:var(--muted-foreground)]">{openaiData.keyMasked}</code>
                </div>
                <button type="button" onClick={fetchOpenAIUsage}
                  className="rounded-lg p-2 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer" title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Total Tokens</p>
                    <Zap className="h-4 w-4 text-[color:var(--warning)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{openaiData.totalTokens.toLocaleString()}</p>
                  {openaiData.dailySpend.length > 1 && (
                    <div className="mt-3"><Sparkline data={openaiData.dailySpend.map(d => d.cost * 1000)} color="#f97316" /></div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Total Requests</p>
                    <Activity className="h-4 w-4 text-[color:var(--primary)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{openaiData.totalRequests.toLocaleString()}</p>
                  {openaiData.dailySpend.length > 1 && (
                    <div className="mt-3"><Sparkline data={openaiData.dailySpend.map(d => d.cost * 500)} color="#6366f1" /></div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Monthly Spend</p>
                    <TrendingUp className="h-4 w-4 text-[color:var(--success)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">${openaiData.totalUsage.toFixed(2)}</p>
                  {openaiData.dailySpend.length > 1 && (
                    <div className="mt-3"><Sparkline data={openaiData.dailySpend.map(d => d.cost)} color="#22c55e" /></div>
                  )}
                </Card>
                <Card className="p-4">
                  {openaiData.hardLimit !== null ? (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[color:var(--muted-foreground)]">Credit Limit</p>
                        <DollarSign className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                      </div>
                      <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">${openaiData.hardLimit.toFixed(2)}</p>
                      <div className="mt-3 flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2">
                        <span className="text-xs text-[color:var(--muted-foreground)]">${openaiData.totalUsage.toFixed(2)} / ${openaiData.hardLimit.toFixed(2)}</span>
                        <div className="ml-3 h-1.5 flex-1 rounded-full bg-[color:var(--border)]">
                          <div className="h-1.5 rounded-full bg-[color:var(--success)]" style={{ width: `${Math.min((openaiData.totalUsage / openaiData.hardLimit) * 100, 100)}%` }} />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-[color:var(--muted-foreground)]">Token Split</p>
                        <Layers className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                      </div>
                      {(() => {
                        const prompt = openaiData.localUsage?.allTime?.promptTokens || 0
                        const completion = openaiData.localUsage?.allTime?.completionTokens || 0
                        const total = prompt + completion || 1
                        const promptPct = Math.round((prompt / total) * 100)
                        const compPct = 100 - promptPct
                        return (
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[color:var(--muted-foreground)]">Prompt</span>
                              <span className="text-sm font-semibold text-[color:var(--foreground)]">{formatTokens(prompt)}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[color:var(--border)]">
                              <div className="h-1.5 rounded-full bg-blue-500 transition-all" style={{ width: `${promptPct}%` }} />
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-[color:var(--muted-foreground)]">Completion</span>
                              <span className="text-sm font-semibold text-[color:var(--foreground)]">{formatTokens(completion)}</span>
                            </div>
                            <div className="h-1.5 w-full rounded-full bg-[color:var(--border)]">
                              <div className="h-1.5 rounded-full bg-[color:var(--primary)] transition-all" style={{ width: `${compPct}%` }} />
                            </div>
                          </div>
                        )
                      })()}
                    </>
                  )}
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <CreditCard className="h-4 w-4 text-[color:var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                      {openaiData.localUsage ? "Usage Summary" : "Account Details"}
                    </h3>
                  </div>
                  {openaiData.localUsage ? (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Key Type</span>
                        <span className="rounded-md bg-[color:var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--primary)]">Project Key</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Available Models</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.totalModels}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Content Generated</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.generate?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Refined</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.refine?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Humanized</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.humanize?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Analyzed</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.analyze?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Meta Generated</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.meta?.count || 0}</span>
                      </div>
                      <div className="my-1 border-t border-[color:var(--border)]" />
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Keyword Analysis</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.["keyword-analysis"]?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Competitor Analysis</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.["competitor-analysis"]?.count || 0}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Backlink Analysis</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.actions?.["backlink-analysis"]?.count || 0}</span>
                      </div>
                      {openaiData.localUsage.allTime && (
                        <>
                          <div className="my-1 border-t border-[color:var(--border)]" />
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[color:var(--muted-foreground)]">All-Time Tokens</span>
                            <span className="font-medium text-[color:var(--foreground)]">{formatTokens(openaiData.localUsage.allTime.totalTokens)}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[color:var(--muted-foreground)]">All-Time Requests</span>
                            <span className="font-medium text-[color:var(--foreground)]">{openaiData.localUsage.allTime.requests}</span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-[color:var(--muted-foreground)]">Active Since</span>
                            <span className="font-medium text-[color:var(--foreground)]">{new Date(openaiData.localUsage.allTime.firstUsed).toLocaleDateString()}</span>
                          </div>
                        </>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-3 pt-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Account</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.accountName || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Plan</span>
                        <span className="font-medium text-[color:var(--foreground)] capitalize">{openaiData.plan || "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Payment Method</span>
                        <span className={cn("inline-flex items-center gap-1 text-xs font-medium",
                          openaiData.hasPaymentMethod ? "text-[color:var(--success)]" : "text-[color:var(--muted-foreground)]")}>
                          {openaiData.hasPaymentMethod !== null ? (
                            openaiData.hasPaymentMethod ? <><CheckCircle2 className="h-3.5 w-3.5" /> Added</> : "Not added"
                          ) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Available Models</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.totalModels}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Hard Limit</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.hardLimit !== null ? `$${openaiData.hardLimit.toFixed(2)}` : "—"}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-[color:var(--muted-foreground)]">Soft Limit</span>
                        <span className="font-medium text-[color:var(--foreground)]">{openaiData.softLimit !== null ? `$${openaiData.softLimit.toFixed(2)}` : "—"}</span>
                      </div>
                    </div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <BarChart3 className="h-4 w-4 text-[color:var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Usage by Model</h3>
                  </div>
                  <div className="space-y-3 pt-3 max-h-64 overflow-y-auto">
                    {Object.keys(openaiData.modelBreakdown).length > 0 ? (
                      Object.entries(openaiData.modelBreakdown)
                        .sort(([, a], [, b]) => b.tokens - a.tokens)
                        .map(([model, data]) => (
                          <div key={model}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-[color:var(--foreground)] truncate max-w-[60%]">{model}</span>
                              <span className="text-xs text-[color:var(--muted-foreground)]">${(data.cost / 100).toFixed(4)}</span>
                            </div>
                            <div className="mt-1 flex items-center gap-3 text-xs text-[color:var(--muted-foreground)]">
                              <span>{data.tokens.toLocaleString()} tokens</span>
                              <span>{data.requests.toLocaleString()} requests</span>
                            </div>
                            <div className="mt-1.5">
                              <div className="h-1.5 w-full rounded-full bg-[color:var(--border)]">
                                <div className="h-1.5 rounded-full bg-[color:var(--primary)] transition-all duration-500"
                                  style={{ width: `${Math.min((data.tokens / openaiData.totalTokens) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-[color:var(--muted-foreground)] py-4 text-center">No usage data this month</p>
                    )}
                  </div>
                </Card>
              </div>

              {openaiData.dailySpend.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <Layers className="h-4 w-4 text-[color:var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Daily Spend This Month</h3>
                  </div>
                  <div className="overflow-x-auto pt-3">
                    <div className="flex items-end gap-1 min-w-[400px]" style={{ height: 120 }}>
                      {openaiData.dailySpend.map((day) => {
                        const maxCost = Math.max(...openaiData.dailySpend.map(d => d.cost), 0.01)
                        const barHeight = Math.max((day.cost / maxCost) * 100, 2)
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                            <span className="text-[10px] text-[color:var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                              ${day.cost.toFixed(2)}
                            </span>
                            <div className="w-full rounded-t bg-[color:var(--primary)] transition-all duration-300 hover:opacity-80 cursor-pointer"
                              style={{ height: `${barHeight}%` }} title={`${day.date}: $${day.cost.toFixed(4)}`} />
                            <span className="text-[8px] text-[color:var(--muted-foreground)] rotate-45 origin-left">{day.date.slice(8)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )}

              <AIUsageBreakdown />
            </>
          ) : (
            <Card className="p-6 text-center">
              <Cpu className="h-8 w-8 mx-auto text-[color:var(--muted-foreground)]" />
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">No OpenAI API key added yet. Click "Manage API's" to get started.</p>
            </Card>
          )}
        </>
      )}

      {/* DataForSEO Tab */}
      {activeTab === "dataforseo" && (
        <>
          {dfsLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="p-4 animate-pulse">
                  <div className="h-4 w-24 rounded bg-[color:var(--muted)]" />
                  <div className="mt-3 h-8 w-32 rounded bg-[color:var(--muted)]" />
                  <div className="mt-4 h-12 w-full rounded bg-[color:var(--muted)]" />
                </Card>
              ))}
            </div>
          ) : dfsData ? (
            <>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-[color:var(--primary)]" />
                  <h2 className="text-lg font-semibold text-[color:var(--foreground)]">DataForSEO Usage</h2>
                  <code className="rounded-md bg-[color:var(--muted)] px-2 py-0.5 text-xs font-mono text-[color:var(--muted-foreground)]">{dfsData.keyMasked}</code>
                </div>
                <button type="button" onClick={fetchDFSUsage}
                  className="rounded-lg p-2 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer" title="Refresh">
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Balance</p>
                    <DollarSign className="h-4 w-4 text-[color:var(--success)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">
                    {dfsData.balance !== null ? `$${dfsData.balance.toFixed(2)}` : "N/A"}
                  </p>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Total Requests</p>
                    <Activity className="h-4 w-4 text-[color:var(--primary)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">{dfsData.totalRequests.toLocaleString()}</p>
                  {dfsData.dailySpend.length > 1 && (
                    <div className="mt-3"><Sparkline data={dfsData.dailySpend.map(d => d.requests)} color="#6366f1" /></div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Total Cost</p>
                    <TrendingUp className="h-4 w-4 text-[color:var(--warning)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">${dfsData.totalCost.toFixed(4)}</p>
                  {dfsData.dailySpend.length > 1 && (
                    <div className="mt-3"><Sparkline data={dfsData.dailySpend.map(d => d.cost)} color="#f97316" /></div>
                  )}
                </Card>
                <Card className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-[color:var(--muted-foreground)]">Total Spent</p>
                    <Zap className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                  </div>
                  <p className="mt-1 text-2xl font-bold text-[color:var(--foreground)]">
                    {dfsData.totalSpent !== null ? `$${dfsData.totalSpent.toFixed(2)}` : "N/A"}
                  </p>
                  {dfsData.balance !== null && dfsData.totalSpent !== null && (
                    <div className="mt-3 flex items-center justify-between rounded-lg bg-[color:var(--muted)] px-3 py-2">
                      <span className="text-xs text-[color:var(--muted-foreground)]">${dfsData.totalSpent.toFixed(2)} spent</span>
                      <div className="ml-3 h-1.5 flex-1 rounded-full bg-[color:var(--border)]">
                        <div className="h-1.5 rounded-full bg-[color:var(--warning)]" style={{ width: `${Math.min((dfsData.totalSpent / (dfsData.balance + dfsData.totalSpent)) * 100, 100)}%` }} />
                      </div>
                    </div>
                  )}
                </Card>
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Card className="p-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <CreditCard className="h-4 w-4 text-[color:var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Account Details</h3>
                  </div>
                  <div className="space-y-3 pt-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--muted-foreground)]">Login</span>
                      <span className="font-medium text-[color:var(--foreground)]">{dfsData.login}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--muted-foreground)]">Balance</span>
                      <span className="font-medium text-[color:var(--success)]">{dfsData.balance !== null ? `$${dfsData.balance.toFixed(2)}` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--muted-foreground)]">Total Spent</span>
                      <span className="font-medium text-[color:var(--foreground)]">{dfsData.totalSpent !== null ? `$${dfsData.totalSpent.toFixed(2)}` : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--muted-foreground)]">Rate Limit</span>
                      <span className="font-medium text-[color:var(--foreground)]">{dfsData.rateLimit ?? "—"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-[color:var(--muted-foreground)]">Rate Limit Used</span>
                      <span className="font-medium text-[color:var(--foreground)]">{dfsData.rateLimitUsed ?? "—"}</span>
                    </div>
                  </div>
                </Card>
                <Card className="p-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <BarChart3 className="h-4 w-4 text-[color:var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Usage by Endpoint</h3>
                  </div>
                  <div className="space-y-3 pt-3 max-h-64 overflow-y-auto">
                    {Object.keys(dfsData.endpointBreakdown).length > 0 ? (
                      Object.entries(dfsData.endpointBreakdown)
                        .sort(([, a], [, b]) => b.requests - a.requests)
                        .map(([endpoint, data]) => (
                          <div key={endpoint}>
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium text-[color:var(--foreground)] truncate max-w-[60%]">{endpoint}</span>
                              <span className="text-xs text-[color:var(--muted-foreground)]">${data.cost.toFixed(4)}</span>
                            </div>
                            <div className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                              {data.requests.toLocaleString()} requests
                            </div>
                            <div className="mt-1.5">
                              <div className="h-1.5 w-full rounded-full bg-[color:var(--border)]">
                                <div className="h-1.5 rounded-full bg-[color:var(--primary)] transition-all duration-500"
                                  style={{ width: `${Math.min((data.requests / dfsData.totalRequests) * 100, 100)}%` }} />
                              </div>
                            </div>
                          </div>
                        ))
                    ) : (
                      <p className="text-sm text-[color:var(--muted-foreground)] py-4 text-center">No usage data available</p>
                    )}
                  </div>
                </Card>
              </div>

              {dfsData.dailySpend.length > 0 && (
                <Card className="p-4">
                  <div className="flex items-center gap-2 border-b border-[color:var(--border)] pb-3">
                    <Layers className="h-4 w-4 text-[color:var(--primary)]" />
                    <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Daily Usage</h3>
                  </div>
                  <div className="overflow-x-auto pt-3">
                    <div className="flex items-end gap-1 min-w-[400px]" style={{ height: 120 }}>
                      {dfsData.dailySpend.map((day) => {
                        const maxReqs = Math.max(...dfsData.dailySpend.map(d => d.requests), 1)
                        const barHeight = Math.max((day.requests / maxReqs) * 100, 2)
                        return (
                          <div key={day.date} className="flex-1 flex flex-col items-center gap-1 group">
                            <span className="text-[10px] text-[color:var(--muted-foreground)] opacity-0 group-hover:opacity-100 transition-opacity">
                              {day.requests}
                            </span>
                            <div className="w-full rounded-t bg-[color:var(--primary)] transition-all duration-300 hover:opacity-80 cursor-pointer"
                              style={{ height: `${barHeight}%` }} title={`${day.date}: ${day.requests} reqs, $${day.cost.toFixed(4)}`} />
                            <span className="text-[8px] text-[color:var(--muted-foreground)] rotate-45 origin-left">{day.date.slice(8)}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              )}

              <AIUsageBreakdown />
            </>
          ) : (
            <Card className="p-6 text-center">
              <Globe className="h-8 w-8 mx-auto text-[color:var(--muted-foreground)]" />
              <p className="mt-2 text-sm text-[color:var(--muted-foreground)]">
                {dfsError || "No DataForSEO API key added yet. Click \"Manage API's\" to get started."}
              </p>
            </Card>
          )}
        </>
      )}

      {/* Manage API Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} aria-hidden="true" />
          <Card className="relative z-10 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[color:var(--border)] pb-4">
              <div className="flex items-center gap-2">
                <Key className="h-5 w-5 text-[color:var(--primary)]" />
                <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Manage API's</h2>
              </div>
              <button type="button" onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]" aria-label="Close">
                <X className="h-5 w-5 cursor-pointer" />
              </button>
            </div>
            <div className="space-y-4 pt-4">

              {/* Saved Keys Section */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[color:var(--foreground)]">Saved API Keys</span>
                {keysLoading ? (
                  <div className="space-y-2">
                    {[1, 2].map((i) => (
                      <div key={i} className="animate-pulse rounded-xl bg-[color:var(--muted)] p-3">
                        <div className="h-4 w-24 rounded bg-[color:var(--border)]" />
                        <div className="mt-2 h-3 w-40 rounded bg-[color:var(--border)]" />
                      </div>
                    ))}
                  </div>
                ) : savedKeys.length > 0 ? (
                  <div className="space-y-2">
                    {savedKeys.map((k) => (
                      <div key={k._id} className="flex items-center justify-between rounded-xl bg-[color:var(--muted)] px-4 py-3">
                        <div>
                          <span className="text-sm font-medium text-[color:var(--foreground)] capitalize">{k.provider === "dataforseo" ? "DataForSEO" : "OpenAI"}</span>
                          <p className="text-xs font-mono text-[color:var(--muted-foreground)] mt-0.5">
                            {k.key.slice(0, 7)}****{k.key.slice(-4)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full",
                            k.status === "Active" ? "bg-[color:var(--success)]/15 text-[color:var(--success)]" : "bg-[color:var(--muted-foreground)]/15 text-[color:var(--muted-foreground)]"
                          )}>{k.status}</span>
                          <button
                            type="button"
                            onClick={() => handleDeleteKey(k._id)}
                            disabled={deleting === k._id}
                            className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-red-500/10 hover:text-red-500 cursor-pointer disabled:opacity-50"
                            title="Remove"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[color:var(--muted-foreground)] py-2">No API keys saved yet</p>
                )}
              </div>

              <div className="border-t border-[color:var(--border)]" />

              {/* Add / Update Key Form */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  {savedKeys.find((k) => k.provider === addProvider) ? "Update" : "Add"} API Key
                </span>
                <select
                  id="add-provider"
                  value={addProvider}
                  onChange={(e) => {
                    setAddProvider(e.target.value as Provider)
                    setAddApiKey("")
                    setAddError("")
                    setShowAddKey(false)
                  }}
                  className="h-10 w-full cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
                >
                  <option value="openai">OpenAI</option>
                  <option value="dataforseo">DataForSEO</option>
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="add-api-key" className="text-sm font-medium text-[color:var(--foreground)]">
                  API Key
                </label>
                <div className="relative">
                  <input
                    id="add-api-key"
                    type={showAddKey ? "text" : "password"}
                    placeholder={
                      addProvider === "openai"
                        ? "sk-proj-..."
                        : "login@example.com:password"
                    }
                    value={addApiKey}
                    onChange={(e) => { setAddApiKey(e.target.value); setAddError("") }}
                    className="flex h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 pr-10 py-2 text-sm font-mono text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] placeholder:font-sans transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]"
                  />
                  <button type="button" onClick={() => setShowAddKey(!showAddKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)] cursor-pointer">
                    {showAddKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {addError && (
                  <div className="flex items-center gap-1.5 text-xs text-[color:var(--error)]">
                    <AlertCircle className="h-3.5 w-3.5" />
                    {addError}
                  </div>
                )}
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  {addProvider === "openai"
                    ? "Enter your OpenAI API key starting with sk-"
                    : "Enter your DataForSEO credentials as login:password"}
                </p>
              </div>

              {addApiKey.trim() && !validateKey(addProvider, addApiKey) && (
                <div className="rounded-xl bg-[color:var(--muted)] px-4 py-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[color:var(--muted-foreground)]">Provider</span>
                    <span className="font-medium text-[color:var(--foreground)]">{addProvider === "dataforseo" ? "DataForSEO" : "OpenAI"}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between text-sm">
                    <span className="text-[color:var(--muted-foreground)]">Key Preview</span>
                    <code className="text-xs font-mono text-[color:var(--muted-foreground)]">
                      {maskKey(addProvider, addApiKey)}
                    </code>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowAddModal(false)}>Cancel</Button>
                <Button className="cursor-pointer" onClick={savedKeys.find((k) => k.provider === addProvider) ? handleUpdateKey : handleAddApiSave} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : savedKeys.find((k) => k.provider === addProvider) ? "Update API Key" : "Save API Key"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
