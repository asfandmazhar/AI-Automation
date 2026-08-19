"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import Cookies from "js-cookie"

interface Website {
  _id: string
  name: string
}

interface WebsiteContextType {
  websites: Website[]
  selectedWebsite: Website | null
  setSelectedWebsite: (w: Website | null) => void
  loading: boolean
}

const WebsiteContext = createContext<WebsiteContextType>({
  websites: [],
  selectedWebsite: null,
  setSelectedWebsite: () => {},
  loading: true,
})

export function useWebsite() {
  return useContext(WebsiteContext)
}

export function WebsiteProvider({ children }: { children: ReactNode }) {
  const [websites, setWebsites] = useState<Website[]>([])
  const [selectedWebsite, setSelectedWebsite] = useState<Website | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = Cookies.get("access_token")
        if (!token) return
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const data = await res.json()
        if (data.success && data.user?.websites) {
          const valid = data.user.websites.filter((w: Website | null) => w && w._id)
          setWebsites(valid)
          if (valid.length > 0) {
            setSelectedWebsite(valid[0])
          }
        }
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()
  }, [])

  return (
    <WebsiteContext.Provider value={{ websites, selectedWebsite, setSelectedWebsite, loading }}>
      {children}
    </WebsiteContext.Provider>
  )
}
