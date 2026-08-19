"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"

type Template = { label: string; subject?: string; body: string }
type ProspectStatus = "draft" | "sent" | "replied"
type Prospect = { name: string; url: string; status: ProspectStatus }

export type OutreachBoardProps = {
  templates: Template[]
  prospects: Prospect[]
  onStatusChange?: (idx: number, status: ProspectStatus) => void
}

const statusConfig: Record<ProspectStatus, { label: string; bg: string; text: string }> = {
  draft: { label: "Draft", bg: "bg-gray-500/10", text: "text-gray-500" },
  sent: { label: "Sent", bg: "bg-blue-500/10", text: "text-blue-500" },
  replied: { label: "Replied", bg: "bg-green-500/10", text: "text-green-500" },
}

const statuses: ProspectStatus[] = ["draft", "sent", "replied"]

export function OutreachBoard({
  templates,
  prospects,
  onStatusChange,
}: OutreachBoardProps) {
  const [tab, setTab] = useState<"templates" | "prospects">("templates")
  const [openDropdown, setOpenDropdown] = useState<number | null>(null)

  function handleCopy() {}

  const noData = templates.length === 0 && prospects.length === 0

  if (noData) {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center border-dashed text-center">
        <p className="text-sm font-medium text-[color:var(--foreground)]">
          No outreach data yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Run the tool to generate templates and prospect lists.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-xl bg-[color:var(--muted)] p-1">
        <button
          type="button"
          onClick={() => setTab("templates")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "templates"
              ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
              : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          )}
        >
          Templates ({templates.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("prospects")}
          className={cn(
            "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            tab === "prospects"
              ? "bg-[color:var(--card)] text-[color:var(--foreground)] shadow-sm"
              : "text-[color:var(--muted-foreground)] hover:text-[color:var(--foreground)]"
          )}
        >
          Prospects ({prospects.length})
        </button>
      </div>

      {tab === "templates" && (
        <div className="space-y-3">
          {templates.map((t, i) => (
            <Card key={i} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">
                    {t.label}
                  </p>
                  {t.subject && (
                    <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
                      Subject: {t.subject}
                    </p>
                  )}
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[color:var(--foreground)]">
                    {t.body}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="shrink-0 rounded-lg p-1.5 text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                  aria-label="Copy template"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {tab === "prospects" && (
        <Card className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--border)] bg-[color:var(--muted)]">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Name
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    URL
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {prospects.map((p, i) => {
                  const cfg = statusConfig[p.status]
                  return (
                    <tr
                      key={i}
                      className="border-b border-[color:var(--border)] last:border-b-0 transition-colors hover:bg-[color:var(--muted)]"
                    >
                      <td className="px-4 py-2.5 font-medium text-[color:var(--foreground)]">
                        {p.name}
                      </td>
                      <td className="px-4 py-2.5">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[color:var(--primary)] hover:underline"
                        >
                          <span className="max-w-[200px] truncate">{p.url}</span>
                          <ExternalLink className="h-3 w-3 shrink-0" />
                        </a>
                      </td>
                      <td className="px-4 py-2.5">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setOpenDropdown(openDropdown === i ? null : i)}
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
                              cfg.bg,
                              cfg.text
                            )}
                          >
                            {cfg.label}
                          </button>

                          {openDropdown === i && (
                            <div className="absolute left-0 top-full z-20 mt-1 w-28 rounded-lg border border-[color:var(--border)] bg-[color:var(--card)] py-1 shadow-lg">
                              {statuses.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    onStatusChange?.(i, s)
                                    setOpenDropdown(null)
                                  }}
                                  className={cn(
                                    "flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs transition-colors hover:bg-[color:var(--muted)]",
                                    p.status === s
                                      ? "font-semibold text-[color:var(--foreground)]"
                                      : "text-[color:var(--muted-foreground)]"
                                  )}
                                >
                                  {statusConfig[s].label}
                                  {p.status === s && <Check className="ml-auto h-3 w-3" />}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
