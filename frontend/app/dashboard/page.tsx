"use client"

import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import axios from "axios"
import {
  Globe,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Tag,
  Activity,
  Link2,
  BarChart3,
  Search,
} from "lucide-react"
import DashboardShell from "@/components/layout/dashboard-shell"

const API = process.env.NEXT_PUBLIC_API_URL

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

interface WebsiteDetails {
  _id: string
  name: string
  url: string
  status: string
  customFields?: { label: string; value: string }[]
  googleSearchConsole?: {
    connected?: boolean
    selectedProperty?: string
  }
  googleAnalytics?: {
    connected?: boolean
    selectedProperty?: string
  }
}

function DashboardContent() {
  const [websiteId, setWebsiteId] = useState<string | null>(null)
  const [websiteName, setWebsiteName] = useState<string>("")
  const [details, setDetails] = useState<WebsiteDetails | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const readCookie = () => {
      const stored = Cookies.get("selected_website")
      if (stored) {
        try {
          const parsed = JSON.parse(stored)
          setWebsiteId(parsed._id)
          setWebsiteName(parsed.name || "")
        } catch {}
      }
    }
    readCookie()
    window.addEventListener("website-changed", readCookie)
    return () => window.removeEventListener("website-changed", readCookie)
  }, [])

  useEffect(() => {
    if (!websiteId) return
    setLoading(true)
    axios
      .get(`${API}/websites/details`, { params: { websiteId }, ...authHeaders() })
      .then((res) => {
        if (res.data.success) setDetails(res.data.website)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [websiteId])

  const gsc = details?.googleSearchConsole
  const ga = details?.googleAnalytics
  const statusColor =
    details?.status === "Active"
      ? "bg-green-500/15 text-green-600 dark:text-green-400"
      : details?.status === "Inactive"
        ? "bg-red-500/15 text-red-600 dark:text-red-400"
        : "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"

  return (
    <>
      <h1 className="text-2xl font-bold text-[color:var(--foreground)]">
        {websiteName || "Dashboard"}
      </h1>
      <p className="mt-1 text-[color:var(--muted-foreground)]">
        {websiteId
          ? "Overview for the selected website."
          : "Welcome to your dashboard. Select a website to get started."}
      </p>

      {loading && (
        <div className="mt-6 flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[color:var(--muted-foreground)] border-t-transparent" />
          Loading website details...
        </div>
      )}

      {!loading && details && (
        <div className="mt-6 space-y-4">
          {/* Website Info Card — full width */}
          <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7E3BED]/10 dark:bg-[#C6FF34]/10">
                  <Globe className="h-5 w-5 text-[#7E3BED] dark:text-[#C6FF34]" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-[color:var(--foreground)]">
                    {details.name}
                  </h2>
                  {details.url && (
                    <a
                      href={details.url.startsWith("http") ? details.url : `https://${details.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-sm text-[#7E3BED] hover:underline dark:text-[#C6FF34]"
                    >
                      {details.url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
              <span
                className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-medium ${statusColor}`}
              >
                {details.status}
              </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                  <Activity className="h-3.5 w-3.5" />
                  Status
                </div>
                <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                  {details.status}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                  <Link2 className="h-3.5 w-3.5" />
                  URL
                </div>
                <p className="mt-1 truncate text-sm font-medium text-[color:var(--foreground)]">
                  {details.url
                    ? details.url.replace(/^https?:\/\//, "").replace(/\/$/, "")
                    : "—"}
                </p>
              </div>
              <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                <div className="flex items-center gap-2 text-xs text-[color:var(--muted-foreground)]">
                  <Tag className="h-3.5 w-3.5" />
                  Custom Fields
                </div>
                <p className="mt-1 text-sm font-medium text-[color:var(--foreground)]">
                  {details.customFields?.length || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Bottom row — 3 equal cards */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Google Search Console */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                  Google Search Console
                </h3>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  {gsc?.connected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
                  )}
                  <span className="text-sm text-[color:var(--foreground)]">
                    {gsc?.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                {gsc?.connected && gsc.selectedProperty && (
                  <div className="flex items-center justify-between rounded-lg bg-[color:var(--background)] px-3 py-2">
                    <span className="text-xs text-[color:var(--muted-foreground)]">Property</span>
                    <span className="text-xs font-medium text-[color:var(--foreground)]">
                      {gsc.selectedProperty
                        .replace(/^sc-domain:|https?:\/\//g, "")
                        .replace(/\/$/, "")}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Google Analytics */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                <h3 className="text-sm font-semibold text-[color:var(--foreground)]">
                  Google Analytics
                </h3>
              </div>
              <div className="mt-3 space-y-2.5">
                <div className="flex items-center gap-2">
                  {ga?.connected ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
                  )}
                  <span className="text-sm text-[color:var(--foreground)]">
                    {ga?.connected ? "Connected" : "Not Connected"}
                  </span>
                </div>
                {ga?.connected && ga.selectedProperty && (
                  <div className="flex items-center justify-between rounded-lg bg-[color:var(--background)] px-3 py-2">
                    <span className="text-xs text-[color:var(--muted-foreground)]">Property</span>
                    <span className="text-xs font-medium text-[color:var(--foreground)]">
                      {ga.selectedProperty}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Custom Fields */}
            <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
              <h3 className="text-sm font-semibold text-[color:var(--foreground)]">Custom Fields</h3>
              {details.customFields && details.customFields.length > 0 ? (
                <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">
                  {details.customFields.map((field, i) => {
                    const isUrl = /^https?:\/\//i.test(field.value)
                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-lg bg-[color:var(--background)] px-3 py-2"
                      >
                        <span className="text-xs text-[color:var(--muted-foreground)]">{field.label}</span>
                        {isUrl ? (
                          <a
                            href={field.value}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-xs font-medium text-[#7E3BED] hover:underline dark:text-[#C6FF34]"
                          >
                            {field.value.replace(/^https?:\/\//i, "").replace(/\/$/, "")}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="text-xs font-medium text-[color:var(--foreground)]">
                            {field.value}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-3 text-xs text-[color:var(--muted-foreground)]">No custom fields added.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!loading && !websiteId && (
        <div className="mt-10 flex flex-col items-center justify-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--muted)]/50">
            <Globe className="h-7 w-7 text-[color:var(--muted-foreground)]" />
          </div>
          <p className="mt-4 text-sm text-[color:var(--muted-foreground)]">
            Select a website from the sidebar to view its details.
          </p>
        </div>
      )}
    </>
  )
}

export default function DashboardPage() {
  return (
    <DashboardShell>
      <DashboardContent />
    </DashboardShell>
  )
}
