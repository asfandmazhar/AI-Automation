"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  User,
  Key,
  Globe,
  Settings,
  Shield,
  Clock,
  Loader2,
  Activity,
  Users,
  Paintbrush,
  Bell,
  UserCog,
  Monitor,
  MapPin,
  Crown,
} from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import axios from "axios"
import toast from "react-hot-toast"
import Cookies from "js-cookie"

interface LogUser {
  _id: string
  fullname: string
  email: string
  profilePicture?: string
  status?: string
  role?: { _id: string; name: string } | null
}

interface LogEntry {
  _id: string
  user: LogUser | null
  action: string
  category: string
  details: string
  ip: string
  userAgent: string
  status: "success" | "failed"
  createdAt: string
}

interface ActiveUser {
  _id: string
  name: string
  email: string
  profilePicture: string
  count: number
  lastAction: string
}

interface LogStats {
  total: number
  todayCount: number
  failedCount: number
  byCategory: { _id: string; count: number }[]
  activeUsers?: ActiveUser[]
}

const CATEGORIES = [
  "auth",
  "user-management",
  "profile",
  "role",
  "service",
  "website",
  "api-key",
  "appearance",
  "notification",
  "security",
] as const

const categoryConfig: Record<string, { icon: typeof User; label: string }> = {
  auth: { icon: Shield, label: "Auth" },
  "user-management": { icon: Users, label: "User Mgmt" },
  profile: { icon: UserCog, label: "Profile" },
  role: { icon: Shield, label: "Role" },
  service: { icon: Settings, label: "Service" },
  website: { icon: Globe, label: "Website" },
  "api-key": { icon: Key, label: "API Key" },
  appearance: { icon: Paintbrush, label: "Appearance" },
  notification: { icon: Bell, label: "Notification" },
  security: { icon: Shield, label: "Security" },
}

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
}

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })
}

function timeAgo(iso: string) {
  const seconds = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(iso)
}

function parseUserAgent(ua: string) {
  if (!ua) return { browser: "Unknown", os: "Unknown" }
  let browser = "Unknown"
  if (ua.includes("Edg/")) browser = "Edge"
  else if (ua.includes("Chrome/")) browser = "Chrome"
  else if (ua.includes("Firefox/")) browser = "Firefox"
  else if (ua.includes("Safari/") && !ua.includes("Chrome")) browser = "Safari"
  else if (ua.includes("Postman")) browser = "Postman"
  else if (ua.includes("axios")) browser = "API Client"

  let os = "Unknown"
  if (ua.includes("Windows")) os = "Windows"
  else if (ua.includes("Mac OS")) os = "macOS"
  else if (ua.includes("Linux")) os = "Linux"
  else if (ua.includes("Android")) os = "Android"
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS"

  return { browser, os }
}

function UserAvatar({ user, size = "sm" }: { user: LogUser | null; size?: "sm" | "md" }) {
  const dim = size === "sm" ? "h-8 w-8" : "h-10 w-10"
  const textSize = size === "sm" ? "text-xs" : "text-sm"

  if (!user) {
    return (
      <div className={cn(dim, "flex shrink-0 items-center justify-center rounded-full bg-[color:var(--muted)]")}>
        <Settings className={cn(size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4", "text-[color:var(--muted-foreground)]")} />
      </div>
    )
  }

  if (user.profilePicture) {
    return (
      <img
        src={user.profilePicture}
        alt={user.fullname}
        className={cn(dim, "shrink-0 rounded-full object-cover")}
      />
    )
  }

  const initials = user.fullname
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  return (
    <div className={cn(dim, "flex shrink-0 items-center justify-center rounded-full bg-[#7E3BED]/10 dark:bg-[#C6FF34]/10")}>
      <span className={cn(textSize, "font-semibold text-[#7E3BED] dark:text-[#C6FF34]")}>{initials}</span>
    </div>
  )
}

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<LogStats | null>(null)
  const [search, setSearch] = useState("")
  const [filterStatus, setFilterStatus] = useState<"all" | "success" | "failed">("all")
  const [filterCategory, setFilterCategory] = useState<"all" | string>("all")
  const [filterPeriod, setFilterPeriod] = useState<"all" | "today" | "week" | "month">("all")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [expandedLog, setExpandedLog] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)
  const [searchTimeout, setSearchTimeout] = useState<ReturnType<typeof setTimeout> | null>(null)

  const fetchLogs = useCallback(async (p: number, query: string, category: string, status: string, period: string) => {
    setLoading(true)
    try {
      const params: Record<string, string | number> = { page: p }
      if (query.trim()) params.query = query.trim()
      if (category !== "all") params.category = category
      if (status !== "all") params.status = status
      if (period !== "all") params.period = period

      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/logs/get-all`, {
        params,
        ...authHeaders(),
      })
      if (res.data.success) {
        setLogs(res.data.logs)
        setTotalPages(res.data.pages || 1)
        setTotal(res.data.total || 0)
      }
    } catch {
      toast.error("Failed to fetch logs")
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchStats = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/logs/stats`, authHeaders())
      if (res.data.success) {
        setStats(res.data.stats)
      }
    } catch {}
  }, [])

  useEffect(() => {
    fetchLogs(page, search, filterCategory, filterStatus, filterPeriod)
  }, [page, filterCategory, filterStatus, filterPeriod, fetchLogs])

  useEffect(() => {
    fetchStats()
  }, [fetchStats])

  function handleSearchChange(value: string) {
    setSearch(value)
    if (searchTimeout) clearTimeout(searchTimeout)
    setSearchTimeout(
      setTimeout(() => {
        setPage(1)
        fetchLogs(1, value, filterCategory, filterStatus, filterPeriod)
      }, 400)
    )
  }

  async function handleClearLogs() {
    setClearing(true)
    try {
      const res = await axios.delete(`${process.env.NEXT_PUBLIC_API_URL}/logs/clear`, authHeaders())
      if (res.data.success) {
        setLogs([])
        setTotal(0)
        setTotalPages(1)
        setPage(1)
        setStats({ total: 0, todayCount: 0, failedCount: 0, byCategory: [], activeUsers: [] })
        toast.success("All logs cleared!")
      } else {
        toast.error(res.data.message || "Failed to clear logs")
      }
    } catch {
      toast.error("Failed to clear logs")
    } finally {
      setClearing(false)
      setConfirmClear(false)
    }
  }

  const startIdx = total > 0 ? (page - 1) * 20 + 1 : 0
  const endIdx = Math.min(page * 20, total)

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Activity Logs</h1>
          <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Monitor all platform activity and events</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setConfirmClear(true)}
            className="shrink-0 cursor-pointer"
            disabled={clearing || total === 0}
          >
            <Trash2 className="h-4 w-4" />
            Clear Logs
          </Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7E3BED]/10 dark:bg-[#C6FF34]/10">
            <Activity className="h-5 w-5 text-[#7E3BED] dark:text-[#C6FF34]" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">{stats?.total ?? "—"}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Total Logs</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10">
            <Clock className="h-5 w-5 text-blue-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">{stats?.todayCount ?? "—"}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Today</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
            <AlertCircle className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">{stats?.failedCount ?? "—"}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Failed</p>
          </div>
        </Card>
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10">
            <CheckCircle className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-2xl font-bold text-[color:var(--foreground)]">{stats ? stats.total - stats.failedCount : "—"}</p>
            <p className="text-xs text-[color:var(--muted-foreground)]">Success</p>
          </div>
        </Card>
      </div>

      {/* Most Active Users */}
      {stats?.activeUsers && stats.activeUsers.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Crown className="h-4 w-4 text-[color:var(--muted-foreground)]" />
            <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Most Active Users</h3>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {stats.activeUsers.map((u, i) => (
              <div
                key={u._id}
                className="flex items-center gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3"
              >
                <div className="relative">
                  {u.profilePicture ? (
                    <img src={u.profilePicture} alt={u.name} className="h-9 w-9 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#7E3BED]/10 dark:bg-[#C6FF34]/10">
                      <span className="text-xs font-semibold text-[#7E3BED] dark:text-[#C6FF34]">
                        {u.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
                      </span>
                    </div>
                  )}
                  {i === 0 && (
                    <div className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-yellow-500 text-[8px] font-bold text-black">
                      1
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize text-[color:var(--foreground)]">{u.name}</p>
                  <p className="text-xs text-[color:var(--muted-foreground)]">{u.count} actions</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Filters & Table */}
      <Card className="p-0">
        <div className="flex flex-col gap-3 border-b border-[color:var(--border)] p-4 sm:flex-row sm:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
            <input
              type="text"
              placeholder="Search logs..."
              value={search}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="h-10 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] pl-10 pr-4 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={filterPeriod}
              onChange={(e) => {
                setFilterPeriod(e.target.value as typeof filterPeriod)
                setPage(1)
              }}
              className="h-10 cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last 7 Days</option>
              <option value="month">This Month</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value as typeof filterStatus)
                setPage(1)
              }}
              className="h-10 cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={filterCategory}
              onChange={(e) => {
                setFilterCategory(e.target.value)
                setPage(1)
              }}
              className="h-10 cursor-pointer rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] px-3 text-sm text-[color:var(--foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {categoryConfig[cat]?.label || cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Log Entries */}
        <div className="divide-y divide-[color:var(--border)]">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex animate-pulse items-center gap-3 px-4 py-3">
                <div className="h-8 w-8 shrink-0 rounded-full bg-[color:var(--muted)]" />
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="h-4 w-48 rounded bg-[color:var(--muted)]" />
                  <div className="h-3 w-72 rounded bg-[color:var(--muted)]" />
                </div>
                <div className="hidden sm:block space-y-1">
                  <div className="h-3 w-20 rounded bg-[color:var(--muted)]" />
                  <div className="h-3 w-16 rounded bg-[color:var(--muted)]" />
                </div>
              </div>
            ))
          ) : logs.length > 0 ? (
            logs.map((log) => {
              const catConfig = categoryConfig[log.category] || { icon: Settings, label: log.category }
              const CategoryIcon = catConfig.icon
              const isExpanded = expandedLog === log._id
              const isFailed = log.status === "failed"
              const parsed = parseUserAgent(log.userAgent)

              return (
                <div
                  key={log._id}
                  className="cursor-pointer transition-colors duration-200 hover:bg-[color:var(--muted)]/50"
                  onClick={() => setExpandedLog(isExpanded ? null : log._id)}
                >
                  <div className="flex items-center gap-3 px-4 py-3">
                    <UserAvatar user={log.user} />

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-2">
                        <p className="text-sm font-medium text-[color:var(--foreground)]">{log.action}</p>
                        <div className="flex items-center gap-1.5">
                          <span
                            className={cn(
                              "inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium",
                              isFailed
                                ? "bg-red-500/10 text-red-500"
                                : "bg-green-500/10 text-green-500"
                            )}
                          >
                            {log.status}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--muted)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--muted-foreground)]">
                            <CategoryIcon className="h-2.5 w-2.5" />
                            {catConfig.label}
                          </span>
                        </div>
                      </div>
                      <div className="mt-0.5 flex items-center gap-2">
                        <span className="text-xs font-medium capitalize text-[color:var(--muted-foreground)]">
                          {log.user?.fullname || "System"}
                        </span>
                        {log.user?.role && typeof log.user.role === "object" && log.user.role.name && (
                          <span className="rounded bg-[#7E3BED]/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-[#7E3BED] dark:bg-[#C6FF34]/10 dark:text-[#C6FF34]">
                            {log.user.role.name}
                          </span>
                        )}
                        <span className="text-[10px] text-[color:var(--muted-foreground)]">
                          {log.details ? `— ${log.details.length > 60 ? log.details.slice(0, 60) + "..." : log.details}` : ""}
                        </span>
                      </div>
                    </div>

                    <div className="hidden shrink-0 text-right sm:block">
                      <p className="text-xs font-medium text-[color:var(--foreground)]">
                        {timeAgo(log.createdAt)}
                      </p>
                      <p className="mt-0.5 text-[10px] text-[color:var(--muted-foreground)]">
                        {formatTime(log.createdAt)}
                      </p>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-dashed border-[color:var(--border)] bg-[color:var(--muted)]/30 px-4 py-4">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {/* User Info */}
                        <div className="flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                          <UserAvatar user={log.user} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold capitalize text-[color:var(--foreground)]">
                              {log.user?.fullname || "System"}
                            </p>
                            {log.user?.email && (
                              <p className="text-xs text-[color:var(--muted-foreground)]">{log.user.email}</p>
                            )}
                            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                              {log.user?.role && typeof log.user.role === "object" && log.user.role.name && (
                                <span className="rounded bg-[#7E3BED]/10 px-1.5 py-0.5 text-[10px] font-medium capitalize text-[#7E3BED] dark:bg-[#C6FF34]/10 dark:text-[#C6FF34]">
                                  {log.user.role.name}
                                </span>
                              )}
                              {log.user?.status && (
                                <span className={cn(
                                  "rounded px-1.5 py-0.5 text-[10px] font-medium",
                                  log.user.status === "Active"
                                    ? "bg-green-500/10 text-green-500"
                                    : "bg-red-500/10 text-red-500"
                                )}>
                                  {log.user.status}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Date & Time */}
                        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                          <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                            <Clock className="h-3.5 w-3.5" />
                            Date & Time
                          </div>
                          <p className="mt-1.5 text-sm font-medium text-[color:var(--foreground)]">
                            {formatDate(log.createdAt)}
                          </p>
                          <p className="text-xs text-[color:var(--muted-foreground)]">
                            {formatTime(log.createdAt)} ({timeAgo(log.createdAt)})
                          </p>
                        </div>

                        {/* IP & Device */}
                        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
                          <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                            <MapPin className="h-3.5 w-3.5" />
                            IP & Device
                          </div>
                          <p className="mt-1.5 font-mono text-sm font-medium text-[color:var(--foreground)]">
                            {log.ip || "—"}
                          </p>
                          <div className="mt-1 flex items-center gap-1.5">
                            <Monitor className="h-3 w-3 text-[color:var(--muted-foreground)]" />
                            <span className="text-xs text-[color:var(--muted-foreground)]">
                              {parsed.browser} on {parsed.os}
                            </span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 sm:col-span-2 lg:col-span-3">
                          <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                            <Activity className="h-3.5 w-3.5" />
                            Details
                          </div>
                          <p className="mt-1.5 text-sm text-[color:var(--foreground)]">
                            {log.details || "No additional details"}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-md bg-[color:var(--muted)] px-2 py-0.5 text-[10px] text-[color:var(--muted-foreground)]">
                              <CategoryIcon className="h-3 w-3" />
                              {catConfig.label}
                            </span>
                            <span
                              className={cn(
                                "rounded-md px-2 py-0.5 text-[10px] font-medium",
                                isFailed ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                              )}
                            >
                              {log.status}
                            </span>
                          </div>
                        </div>

                        {/* User Agent */}
                        {log.userAgent && (
                          <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3 sm:col-span-2 lg:col-span-3">
                            <p className="text-xs text-[color:var(--muted-foreground)]">User Agent</p>
                            <p className="mt-1 break-all font-mono text-[10px] text-[color:var(--muted-foreground)]">
                              {log.userAgent}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })
          ) : (
            <div className="px-6 py-12 text-center text-sm text-[color:var(--muted-foreground)]">
              No logs found
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-[color:var(--border)] px-4 py-3">
            <p className="text-xs text-[color:var(--muted-foreground)]">
              Showing {startIdx}–{endIdx} of {total} logs
            </p>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let p: number
                if (totalPages <= 5) {
                  p = i + 1
                } else if (page <= 3) {
                  p = i + 1
                } else if (page >= totalPages - 2) {
                  p = totalPages - 4 + i
                } else {
                  p = page - 2 + i
                }
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPage(p)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors duration-200 cursor-pointer",
                      page === p
                        ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                        : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)]"
                    )}
                  >
                    {p}
                  </button>
                )
              })}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {/* Confirm Clear Dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { if (!clearing) setConfirmClear(false) }}
            aria-hidden="true"
          />
          <Card className="relative z-10 w-full max-w-sm mx-4">
            <div className="flex items-center gap-3 border-b border-[color:var(--border)] pb-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="text-lg font-semibold text-[color:var(--foreground)]">Clear All Logs</h2>
            </div>
            <p className="pt-4 text-sm text-[color:var(--muted-foreground)]">
              Are you sure you want to delete all activity logs? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3 pt-6">
              <Button
                variant="ghost"
                className="cursor-pointer"
                disabled={clearing}
                onClick={() => setConfirmClear(false)}
              >
                Cancel
              </Button>
              <Button
                className="cursor-pointer bg-red-500 text-white hover:bg-red-600"
                disabled={clearing}
                onClick={handleClearLogs}
              >
                {clearing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Clear All"}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
