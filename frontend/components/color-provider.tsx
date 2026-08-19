"use client"

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"
import axios from "axios"

interface Colors {
  primary: string
  secondary: string
  success: string
  error: string
  warning: string
}

interface ColorContextValue {
  colors: Colors
  refresh: () => Promise<void>
}

const ColorContext = createContext<ColorContextValue>({
  colors: { primary: "", secondary: "", success: "", error: "", warning: "" },
  refresh: async () => {},
})

function applyColors(colors: Colors) {
  const root = document.documentElement
  const keys: (keyof Colors)[] = ["primary", "secondary", "success", "error", "warning"]
  keys.forEach((key) => {
    if (colors[key]) {
      root.style.setProperty(`--${key}`, colors[key])
    } else {
      root.style.removeProperty(`--${key}`)
    }
  })
}

export function ColorProvider({ children }: { children: ReactNode }) {
  const [colors, setColors] = useState<Colors>({ primary: "", secondary: "", success: "", error: "", warning: "" })

  const refresh = useCallback(async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/appearance`)
      if (res.data.success) {
        const c = res.data.appearance
        setColors(c)
        applyColors(c)
      }
    } catch {}
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return (
    <ColorContext value={{ colors, refresh }}>
      {children}
    </ColorContext>
  )
}

export function useColors() {
  return useContext(ColorContext)
}
