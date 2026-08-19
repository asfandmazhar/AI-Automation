"use client"

import { Copy, CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export type CodeBlockProps = {
  code: string
  language: string
  notes?: string[]
}

export function CodeBlock({ code, language, notes }: CodeBlockProps) {
  function handleCopy() {}

  const lines = code.split("\n")

  if (!code) {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center border-dashed text-center">
        <p className="text-sm font-medium text-[color:var(--foreground)]">
          No code output yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Run the tool to generate code snippets.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <Card className="overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-2">
          <span className="text-xs font-medium uppercase tracking-wider text-[color:var(--muted-foreground)]">
            {language}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
            aria-label="Copy code"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>

        <div className="overflow-x-auto bg-[color:var(--muted)]">
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, i) => (
                <tr key={i} className="hover:bg-[color:var(--border)]/30">
                  <td className="select-none border-r border-[color:var(--border)] px-3 py-0 text-right align-top font-mono text-xs leading-6 text-[color:var(--muted-foreground)]">
                    {i + 1}
                  </td>
                  <td className="px-4 py-0 align-top">
                    <pre className="font-mono text-sm leading-6 text-[color:var(--foreground)]">
                      <code>{line || " "}</code>
                    </pre>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {notes && notes.length > 0 && (
        <Card className="p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
            Notes
          </p>
          <ul className="space-y-1.5">
            {notes.map((note, i) => (
              <li key={i} className="flex items-start gap-2">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-green-500" />
                <span className="text-sm text-[color:var(--foreground)]">
                  {note}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}
