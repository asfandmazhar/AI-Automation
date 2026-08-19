"use client"

import { useState, useEffect } from "react"
import { Users, Globe } from "lucide-react"
import { Card } from "@/components/ui/card"
import axios from "axios"
import Cookies from "js-cookie"

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } }
}

export default function AdminDashboardPage() {
  const [totalUsers, setTotalUsers] = useState<number | null>(null)
  const [totalWebsites, setTotalWebsites] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersRes, websitesRes] = await Promise.all([
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/total-users`, authHeaders()),
          axios.get(`${process.env.NEXT_PUBLIC_API_URL}/websites/total`, authHeaders()),
        ])
        if (usersRes.data.success) setTotalUsers(usersRes.data.count)
        if (websitesRes.data.success) setTotalWebsites(websitesRes.data.count)
      } catch {}
      setLoading(false)
    }
    fetchStats()
  }, [])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--foreground)]">Super Admin Dashboard</h1>
        <p className="mt-1 text-sm text-[color:var(--muted-foreground)]">Overview of your platform</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)]">
            <Users className="h-6 w-6 text-[color:var(--primary-foreground)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-[color:var(--muted-foreground)]">Total Users</p>
            {loading ? (
              <div className="mt-1 h-7 w-16 animate-pulse rounded bg-[color:var(--muted)]" />
            ) : (
              <p className="text-2xl font-bold text-[color:var(--foreground)]">
                {totalUsers?.toLocaleString() ?? "0"}
              </p>
            )}
          </div>
        </Card>

        <Card className="flex items-center gap-4 p-5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[color:var(--primary)]">
            <Globe className="h-6 w-6 text-[color:var(--primary-foreground)]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm text-[color:var(--muted-foreground)]">Total Websites</p>
            {loading ? (
              <div className="mt-1 h-7 w-16 animate-pulse rounded bg-[color:var(--muted)]" />
            ) : (
              <p className="text-2xl font-bold text-[color:var(--foreground)]">
                {totalWebsites?.toLocaleString() ?? "0"}
              </p>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
