"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Search,
  Bell,
  ChevronDown,
  Menu,
  User,
  Settings,
  LogOut,
  MessageSquare,
  AlertCircle,
  CheckCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { getTokenUser, clearAuth } from "@/lib/auth"

interface NavbarProps {
  className?: string
  onMenuClick?: () => void
}

const notifications = [
  {
    id: 1,
    icon: CheckCircle,
    iconColor: "text-[color:var(--success)]",
    title: "Order completed",
    description: "Order #1234 has been delivered",
    time: "2 min ago",
  },
  {
    id: 2,
    icon: MessageSquare,
    iconColor: "text-[color:var(--primary)]",
    title: "New message",
    description: "You have a new message from Sarah",
    time: "15 min ago",
  },
  {
    id: 3,
    icon: AlertCircle,
    iconColor: "text-[color:var(--warning)]",
    title: "Server warning",
    description: "CPU usage exceeded 90%",
    time: "1 hour ago",
  },
]

const profileMenu = [
  { label: "My Profile", href: "/dashboard/settings", icon: User },
]

function useClickOutside(ref: React.RefObject<HTMLElement | null>, handler: () => void) {
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) handler()
    }
    document.addEventListener("mousedown", onMouseDown)
    return () => document.removeEventListener("mousedown", onMouseDown)
  }, [ref, handler])
}

export default function Navbar({ className, onMenuClick }: NavbarProps) {
  const [notifOpen, setNotifOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState({ id: "", role: "", fullname: "", email: "", profilePicture: "" })

  useEffect(() => {
    setUser(getTokenUser())
  }, [])

  const notifRef = useRef<HTMLDivElement>(null)
  const profileRef = useRef<HTMLDivElement>(null)

  useClickOutside(notifRef, () => setNotifOpen(false))
  useClickOutside(profileRef, () => setProfileOpen(false))

  return (
    <header
      className={cn(
        "flex items-center justify-between h-16 md:h-20 px-4 md:px-6 bg-[color:var(--card)] border-b border-[color:var(--border)]",
        className
      )}
    >
      <div className="flex items-center gap-3 w-[400px]">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-[color:var(--foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] md:hidden"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="relative hidden sm:block w-full max-w-2xl">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--primary)]" />
          <input
            type="text"
            placeholder="Search here..."
            className="h-10 w-full rounded-xl border-none bg-[color:var(--muted)] pl-10 pr-4 py-2.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] outline-none transition-colors duration-200 focus:ring-2 focus:ring-[color:var(--primary)]"
          />
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-4">
        <ThemeToggle />

        {/* Notification dropdown */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setNotifOpen((v) => !v)
              setProfileOpen(false)
            }}
            className="relative rounded-xl bg-[color:var(--muted)] p-2.5 transition-colors duration-200 hover:bg-[color:var(--border)] cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="h-5 w-5 text-[color:var(--foreground)]" />
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[color:var(--error)]" />
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg z-50">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[color:var(--border)]">
                <p className="text-sm font-semibold text-[color:var(--foreground)]">Notifications</p>
                <span className="rounded-full bg-[color:var(--primary)] px-2 py-0.5 text-xs text-[color:var(--primary-foreground)]">
                  {notifications.length}
                </span>
              </div>

              <div className="max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <button
                    key={n.id}
                    type="button"
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors duration-200 hover:bg-[color:var(--muted)]"
                    onClick={() => setNotifOpen(false)}
                  >
                    <n.icon className={cn("mt-0.5 h-5 w-5 shrink-0", n.iconColor)} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[color:var(--foreground)]">{n.title}</p>
                      <p className="truncate text-xs text-[color:var(--muted-foreground)]">{n.description}</p>
                    </div>
                    <span className="shrink-0 text-xs text-[color:var(--muted-foreground)]">{n.time}</span>
                  </button>
                ))}
              </div>

              <div className="border-t border-[color:var(--border)] px-4 py-2.5">
                <button
                  type="button"
                  className="w-full text-center text-sm font-medium text-[color:var(--primary)] hover:text-[color:var(--secondary)] transition-colors duration-200"
                  onClick={() => setNotifOpen(false)}
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Profile dropdown */}
        <div ref={profileRef} className="relative">
          <button
            type="button"
            onClick={() => {
              setProfileOpen((v) => !v)
              setNotifOpen(false)
            }}
            className="flex items-center gap-3 rounded-xl p-1.5 transition-colors duration-200 hover:bg-[color:var(--muted)] cursor-pointer"
          >
            {user.profilePicture ? (
              <Image
                src={user.profilePicture}
                alt="User avatar"
                width={40}
                height={40}
                className="rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)]">
                <User className="h-5 w-5 text-[color:var(--primary-foreground)]" />
              </div>
            )}
            <div className="hidden sm:block text-left">
              <p className="text-sm font-semibold capitalize text-[color:var(--foreground)]">{user.fullname || "User"}</p>
              <p className="text-xs text-[color:var(--muted-foreground)]">{user.role || "User"}</p>
            </div>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-[color:var(--muted-foreground)] transition-transform duration-200",
                profileOpen && "rotate-180"
              )}
            />
          </button>

          {profileOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] shadow-lg z-50">
              <div className="px-4 py-3 border-b border-[color:var(--border)]">
                <p className="text-sm font-semibold capitalize text-[color:var(--foreground)]">{user.fullname || "User"}</p>
                <p className="text-xs text-[color:var(--muted-foreground)]">{user.email || ""}</p>
              </div>

              <div className="py-1">
                {profileMenu.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)]"
                  >
                    <item.icon className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                    {item.label}
                  </Link>
                ))}
              </div>

              <div className="border-t border-[color:var(--border)] py-1">
                <button
                  type="button"
                  onClick={() => clearAuth()}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[color:var(--error)] transition-colors duration-200 hover:bg-[color:var(--muted)]"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
