"use client"

import { useTheme } from "@/components/theme-provider"
import { Sun, Moon } from "lucide-react"

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme()

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center rounded-lg p-2 text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer"
      aria-label="Toggle theme"
    >
      <Sun className="hidden h-5 w-5 dark:block" />
      <Moon className="block h-5 w-5 dark:hidden" />
    </button>
  )
}
