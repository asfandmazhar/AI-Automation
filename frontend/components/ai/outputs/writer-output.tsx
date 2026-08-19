"use client"

import { useMemo } from "react"
import { CheckCircle2, Circle } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type ChecklistItem = { label: string; done: boolean }

export type WriterOutputProps = {
  markdown: string
  checklist?: ChecklistItem[]
}

type Heading = { level: number; text: string; id: string }

function parseMarkdown(md: string): { html: string; headings: Heading[] } {
  const headings: Heading[] = []
  let headingCounter = 0

  const html = md
    .split("\n")
    .map((line) => {
      const h = line.match(/^(#{1,6})\s+(.+)$/)
      if (h) {
        const level = h[1].length
        const text = h[2]
        const id = `heading-${headingCounter++}`
        headings.push({ level, text, id })
        return `<h${level} id="${id}" class="scroll-mt-4">${escapeHtml(text)}</h${level}>`
      }

      if (line.match(/^\s*[-*]\s+/)) {
        const text = line.replace(/^\s*[-*]\s+/, "")
        return `<li>${inlineFormat(text)}</li>`
      }

      if (line.match(/^\s*\d+\.\s+/)) {
        const text = line.replace(/^\s*\d+\.\s+/, "")
        return `<li>${inlineFormat(text)}</li>`
      }

      if (line.trim() === "") return "<br />"

      return `<p>${inlineFormat(line)}</p>`
    })
    .join("\n")
    .replace(/(<li>.*<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`)

  return { html, headings }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function inlineFormat(text: string): string {
  return escapeHtml(text)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/__(.+?)__/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>")
    .replace(/`(.+?)`/g, '<code class="rounded bg-[color:var(--muted)] px-1 py-0.5 text-xs font-mono">$1</code>')
}

export function WriterOutput({ markdown, checklist }: WriterOutputProps) {
  const { html } = useMemo(() => parseMarkdown(markdown), [markdown])



  if (!markdown) {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center border-dashed text-center">
        <p className="text-sm font-medium text-[color:var(--foreground)]">
          No content generated yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Run the tool to generate written content.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">

      <Card className="min-w-0 p-6">
        <div
          className="prose-sm max-w-none [&_h1]:mb-3 [&_h1]:mt-6 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[color:var(--foreground)] [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-[color:var(--foreground)] [&_h3]:mb-2 [&_h3]:mt-4 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-[color:var(--foreground)] [&_h4]:mb-1 [&_h4]:mt-3 [&_h4]:text-sm [&_h4]:font-semibold [&_h4]:text-[color:var(--foreground)] [&_h5]:mb-1 [&_h5]:mt-2 [&_h5]:text-sm [&_h5]:font-medium [&_h5]:text-[color:var(--foreground)] [&_h6]:mb-1 [&_h6]:mt-2 [&_h6]:text-xs [&_h6]:font-medium [&_h6]:text-[color:var(--foreground)] [&_p]:mb-3 [&_p]:text-sm [&_p]:leading-relaxed [&_p]:text-[color:var(--foreground)] [&_strong]:font-semibold [&_em]:italic [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_li]:mb-1 [&_li]:text-sm [&_li]:text-[color:var(--foreground)] [&_br]:hidden"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </Card>

      {checklist && checklist.length > 0 && (
        <Card className="p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            SEO Checklist
          </p>
          <ul className="space-y-2">
            {checklist.map((item, i) => (
              <li key={i} className="flex items-center gap-2">
                {item.done ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-green-500" />
                ) : (
                  <Circle className="h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    item.done
                      ? "text-[color:var(--muted-foreground)] line-through"
                      : "text-[color:var(--foreground)]"
                  )}
                >
                  {item.label}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
