"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"

type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  setTheme: () => {},
  resolvedTheme: "light",
})

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light")
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored || "system"
    setThemeState(initial)
    const resolved = initial === "system" ? getSystemTheme() : initial
    setResolvedTheme(resolved)
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const resolved = theme === "system" ? getSystemTheme() : theme
    setResolvedTheme(resolved)
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(resolved)
    document.documentElement.style.colorScheme = resolved
    localStorage.setItem("theme", theme)
  }, [theme, mounted])

  useEffect(() => {
    if (!mounted || theme !== "system") return
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => {
      const next = e.matches ? "dark" : "light"
      setResolvedTheme(next)
      document.documentElement.classList.remove("light", "dark")
      document.documentElement.classList.add(next)
      document.documentElement.style.colorScheme = next
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [theme, mounted])

  function setTheme(next: Theme) {
    setThemeState(next)
  }

  return (
    <ThemeContext value={{ theme, setTheme, resolvedTheme }}>
      {children}
    </ThemeContext>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
