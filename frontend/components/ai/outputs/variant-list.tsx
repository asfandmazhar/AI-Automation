"use client"

import { useState } from "react"
import { Copy, Eye, EyeOff } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Variant = { text: string; note?: string }

export type VariantListProps = {
  variants: Variant[]
  charLimit?: number
  showSerpPreview?: boolean
}

export function VariantList({ variants, charLimit, showSerpPreview = true }: VariantListProps) {
  const [serpIdx, setSerpIdx] = useState<number | null>(null)

  function handleCopy() {}

  if (variants.length === 0) {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center border-dashed text-center">
        <p className="text-sm font-medium text-[color:var(--foreground)]">
          No variants generated yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Run the tool to generate title and meta variants.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {variants.map((v, i) => {
        const len = v.text.length
        const over = charLimit != null && len > charLimit

        return (
          <Card key={i} className="p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[color:var(--muted)] text-xs font-semibold text-[color:var(--muted-foreground)]">
                {i + 1}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-sm leading-relaxed text-[color:var(--foreground)]">
                  {v.text}
                </p>
                {v.note && (
                  <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                    {v.note}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-2">
                {charLimit != null && (
                  <span
                    className={cn(
                      "text-xs font-medium tabular-nums",
                      over
                        ? "text-red-500"
                        : "text-green-500"
                    )}
                  >
                    {len}/{charLimit}
                  </span>
                )}

                {showSerpPreview && (
                  <button
                    type="button"
                    onClick={() => setSerpIdx(serpIdx === i ? null : i)}
                    className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                    aria-label={serpIdx === i ? "Hide SERP preview" : "Show SERP preview"}
                  >
                    {serpIdx === i ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  aria-label="Copy"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>

            {showSerpPreview && serpIdx === i && (
              <div className="mt-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  SERP Preview
                </p>
                <p className="mt-1 truncate text-base text-blue-600">
                  {v.text}
                </p>
                <p className="mt-0.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
                  {v.note ?? "Page description will appear here. This is a preview of how the result may look in Google search results."}
                </p>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
