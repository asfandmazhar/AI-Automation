"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import Cookies from "js-cookie"
import {
  Layers,
  PieChart,
  Sparkles,
  LogOut,
  X,
  ChevronDown,
  Globe,
  Check,
  Settings,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { clearAuth } from "@/lib/auth"

interface Website {
  _id: string
  name: string
  url?: string
  googleSearchConsole?: {
    connected?: boolean
    selectedProperty?: string
  }
  googleAnalytics?: {
    connected?: boolean
    selectedProperty?: string
  }
}

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: PieChart },
]

const aiSystemChildren = [
  { label: "Overview", href: "/ai-system/overview" },
  { label: "On Page SEO", href: "/ai-system/on-page-seo" },
  { label: "Off Page SEO", href: "/ai-system/off-page-seo" },
]

interface SidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

export default function Sidebar({ className, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname()
  const isAiSystemActive = pathname.startsWith("/ai-system")
  const [aiSystemOpen, setAiSystemOpen] = useState(isAiSystemActive)
  const [websiteDropdownOpen, setWebsiteDropdownOpen] = useState(false)
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)
  const [hasAccess, setHasAccess] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = Cookies.get("access_token")
        if (!token) return
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.user) {
          const services = data.user.services?.filter((s: any) => s && s._id) || []
          const valid = data.user.websites?.filter((w: Website | null) => w && w._id) || []
          setHasAccess(services.length > 0 || valid.length > 0)
          setWebsites(valid)
          const stored = Cookies.get("selected_website")
          if (stored) {
            try {
              const parsed = JSON.parse(stored)
              const found = valid.find((w: Website) => w._id === parsed._id)
              if (found) {
                setSelectedWebsite(found)
                Cookies.set("selected_website", JSON.stringify(found))
                return
              }
            } catch {}
          }
          if (valid.length > 0) {
            setSelectedWebsite(valid[0])
            Cookies.set("selected_website", JSON.stringify(valid[0]))
          }
        }
      } catch {}
    }
    fetchProfile()
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("[data-website-dropdown]")) {
        setWebsiteDropdownOpen(false)
      }
    }
    if (websiteDropdownOpen) document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [websiteDropdownOpen])

  const handleSelectWebsite = (site: Website) => {
    setSelectedWebsite(site)
    Cookies.set("selected_website", JSON.stringify(site))
    setWebsiteDropdownOpen(false)
    window.dispatchEvent(new Event("website-changed"))
  }

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen w-64 bg-[color:var(--card)] border-r border-[color:var(--border)] px-4 py-6",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 pb-8">
        <Link href="/dashboard" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)]">
            <Layers className="h-5 w-5 text-[color:var(--primary-foreground)]" />
          </div>
          <span className="text-xl font-bold text-[color:var(--foreground)]">Dabang</span>
        </Link>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] md:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {hasAccess && websites.length > 0 && (
        <div data-website-dropdown className="relative px-2 pb-5">
          <button
            type="button"
            onClick={() => setWebsiteDropdownOpen(!websiteDropdownOpen)}
            className={cn(
              "flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm transition-all duration-200",
              websiteDropdownOpen
                ? "border-[color:var(--primary)] shadow-sm"
                : "border-[color:var(--border)] hover:bg-[color:var(--muted)]"
            )}
          >
            <div className="relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-[color:var(--primary)] bg-opacity-10">
              <Globe className="h-3.5 w-3.5 text-[color:var(--primary)]" />
              {selectedWebsite?.googleSearchConsole?.connected && (
                <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-green-500 ring-2 ring-[color:var(--card)]" />
              )}
            </div>
            <span className="flex-1 truncate text-left font-medium text-[color:var(--foreground)]">
              {selectedWebsite?.name || "Select Website"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 shrink-0 text-[color:var(--muted-foreground)] transition-transform duration-200",
                websiteDropdownOpen && "rotate-180"
              )}
            />
          </button>

          {websiteDropdownOpen && (
            <div className="absolute left-2 right-2 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] py-1 shadow-lg">
              {websites.map((site) => {
                const isActive = selectedWebsite?._id === site._id
                return (
                  <button
                    key={site._id}
                    type="button"
                    onClick={() => handleSelectWebsite(site)}
                    className={cn(
                      "flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors duration-150",
                      isActive
                        ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)]"
                        : "text-[color:var(--foreground)] hover:bg-[color:var(--muted)]"
                    )}
                  >
                    <div className="relative shrink-0">
                      <Globe className="h-3.5 w-3.5" />
                      {site.googleSearchConsole?.connected && (
                        <span className={cn(
                          "absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full",
                          isActive ? "bg-white" : "bg-green-500"
                        )} />
                      )}
                    </div>
                    <span className="flex-1 truncate text-left">{site.name}</span>
                    {isActive && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {hasAccess && (
        <nav className="flex flex-col gap-1">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
              pathname === "/dashboard"
                ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            )}
          >
            <PieChart className={cn(
              "h-5 w-5 shrink-0",
              pathname === "/dashboard"
                ? "text-[color:var(--primary-foreground)]"
                : "text-[color:var(--muted-foreground)]"
            )} />
            Dashboard
          </Link>

          {/* AI System with dropdown */}
          <div>
            <button
              type="button"
              onClick={() => setAiSystemOpen((prev) => !prev)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                isAiSystemActive
                  ? "bg-[color:var(--muted)] shadow-sm"
                  : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              )}
            >
              <Sparkles className={cn(
                "h-5 w-5 shrink-0",
                isAiSystemActive
                  ? "text-[color:var(--muted-foreground)]"
                  : "text-[color:var(--muted-foreground)]"
              )} />
              <span className="flex-1 text-left">AI System</span>
              <ChevronDown className={cn(
                "h-4 w-4 shrink-0 transition-transform duration-200",
                aiSystemOpen && "rotate-180"
              )} />
            </button>

            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-200",
                aiSystemOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="relative ml-8 mt-1 flex flex-col">
                  {aiSystemChildren.map((child, index) => {
                    const childActive = pathname === child.href
                    const isLast = index === aiSystemChildren.length - 1
                    return (
                      <div key={child.href} className="relative flex items-center" style={{ minHeight: '40px' }}>
                        {/* Vertical trunk line */}
                        <span
                          className={cn(
                            "absolute left-0 w-px bg-[color:var(--border)]",
                            isLast ? "top-0 h-1/2" : "inset-y-0"
                          )}
                        />
                        {/* Curved branch connector */}
                        <svg
                          className="absolute left-0 h-5 w-5"
                          style={{ top: 'calc(50% - 10px)' }}
                          viewBox="0 0 20 20"
                          fill="none"
                        >
                          <path
                            d="M 0.75 0 C 0.75 12 19.25 8 19.25 20"
                            stroke="var(--border)"
                            strokeWidth="1.5"
                            strokeLinecap="round"
                          />
                        </svg>
                        <Link
                          href={child.href}
                          onClick={onClose}
                          className={cn(
                            "ml-6 block w-full rounded-lg px-3 py-2 text-sm transition-colors duration-200",
                            childActive
                              ? "bg-[color:var(--primary)] font-medium text-[color:var(--primary-foreground)] shadow-sm"
                              : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                          )}
                        >
                          {child.label}
                        </Link>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Remaining nav items */}
          {navItems.slice(1).map((item) => {
            const active = pathname === item.href

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
                  active
                    ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
                    : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                )}
              >
                <item.icon className={cn(
                  "h-5 w-5 shrink-0",
                  active
                    ? "text-[color:var(--primary-foreground)]"
                    : "text-[color:var(--muted-foreground)]"
                )} />
                {item.label}
              </Link>
            )
          })}
        </nav>
      )}

      <div className="mt-auto flex flex-col gap-1">
        <Link
          href="/dashboard/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
            pathname === "/dashboard/settings"
              ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
              : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          )}
        >
          <Settings className={cn(
            "h-5 w-5 shrink-0",
            pathname === "/dashboard/settings"
              ? "text-[color:var(--primary-foreground)]"
              : "text-[color:var(--muted-foreground)]"
          )} />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => clearAuth()}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign Out
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/* Desktop: static sidebar */}
      <div className="hidden md:block md:sticky md:top-0 md:h-screen md:shrink-0">
        {sidebarContent}
      </div>

      {/* Mobile: off-canvas drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden transition-opacity duration-300",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          className={cn(
            "absolute inset-y-0 left-0 transition-transform duration-300 ease-in-out",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {sidebarContent}
        </div>
      </div>
    </>
  )
}
