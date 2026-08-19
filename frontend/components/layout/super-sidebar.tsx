"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Globe,
  Settings,
  LogOut,
  X,
  ShieldCheck,
  Key,
  ScrollText,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { clearAuth } from "@/lib/auth"

const navItems = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Manage Users", href: "/admin/users", icon: Users },
  { label: "Manage Websites", href: "/admin/websites", icon: Globe },
  { label: "Manage APIs", href: "/admin/add-api-keys", icon: Key },
  { label: "Logs", href: "/admin/logs", icon: ScrollText },
]

interface SuperSidebarProps {
  className?: string
  isOpen?: boolean
  onClose?: () => void
}

export default function SuperSidebar({ className, isOpen = false, onClose }: SuperSidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <aside
      className={cn(
        "flex flex-col h-screen w-64 bg-[color:var(--card)] border-r border-[color:var(--border)] px-4 py-6",
        className
      )}
    >
      <div className="flex items-center justify-between px-4 pb-8">
        <Link href="/admin" className="flex items-center gap-3" onClick={onClose}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)]">
            <ShieldCheck className="h-5 w-5 text-[color:var(--primary-foreground)]" />
          </div>
          <span className="text-xl font-bold text-[color:var(--foreground)]">Admin</span>
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

      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
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

      <div className="mt-auto space-y-1">
        <Link
          href="/admin/settings"
          onClick={onClose}
          className={cn(
            "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors duration-200",
            pathname === "/admin/settings"
              ? "bg-[color:var(--primary)] text-[color:var(--primary-foreground)] shadow-sm"
              : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          )}
        >
          <Settings className={cn(
            "h-5 w-5 shrink-0",
            pathname === "/admin/settings"
              ? "text-[color:var(--primary-foreground)]"
              : "text-[color:var(--muted-foreground)]"
          )} />
          Settings
        </Link>
        <button
          type="button"
          onClick={() => clearAuth()}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer"
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
