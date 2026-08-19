"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Cookies from "js-cookie"
import { ShieldAlert } from "lucide-react"
import Sidebar from "@/components/layout/sidebar"
import Navbar from "@/components/layout/navbar"

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const pathname = usePathname()

  const isSettingsPage = pathname === "/dashboard/settings"

  useEffect(() => {
    const checkAccess = async () => {
      try {
        const token = Cookies.get("access_token")
        if (!token) return
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.user) {
          const services = data.user.services?.filter((s: any) => s && s._id) || []
          const websites = data.user.websites?.filter((w: any) => w && w._id) || []
          setHasAccess(services.length > 0 || websites.length > 0)
        }
      } catch {}
    }
    checkAccess()
  }, [])

  const showBlocked = hasAccess === false && !isSettingsPage

  return (
    <div className="flex h-screen bg-[color:var(--background)]">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {showBlocked ? (
            <div className="flex flex-1 flex-col items-center justify-center py-32">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[color:var(--muted)]">
                <ShieldAlert className="h-8 w-8 text-[color:var(--muted-foreground)]" />
              </div>
              <h1 className="mt-6 text-2xl font-bold text-[color:var(--foreground)]">
                Access Required
              </h1>
              <p className="mt-2 max-w-sm text-center text-[color:var(--muted-foreground)]">
                You don't have any services or websites assigned yet. Please contact your admin to get access.
              </p>
            </div>
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}
