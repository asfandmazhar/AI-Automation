"use client"

import { Toaster as HotToaster } from "react-hot-toast"
import { useTheme } from "@/components/theme-provider"

export function Toaster() {
  const { resolvedTheme } = useTheme()

  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        style: {
          background: resolvedTheme === "dark" ? "#1e1e2e" : "#ffffff",
          color: resolvedTheme === "dark" ? "#e4e4e7" : "#18181b",
          border: `1px solid ${resolvedTheme === "dark" ? "#2e2e3e" : "#e4e4e7"}`,
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: resolvedTheme === "dark" ? "#1e1e2e" : "#ffffff",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: resolvedTheme === "dark" ? "#1e1e2e" : "#ffffff",
          },
        },
      }}
    />
  )
}
