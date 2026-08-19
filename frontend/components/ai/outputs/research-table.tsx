"use client"

import { useState, useMemo, useCallback } from "react"
import { ArrowUpDown, Download, FileText } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type Column = { key: string; label: string; numeric?: boolean }

export type ResearchTableProps = {
  columns: Column[]
  rows: Record<string, string | number>[]
  onBulkAction?: (selectedRows: Record<string, string | number>[]) => void
}

export function ResearchTable({ columns, rows, onBulkAction }: ResearchTableProps) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortAsc, setSortAsc] = useState(true)
  const [selected, setSelected] = useState<Set<number>>(() => new Set())

  const sortedRows = useMemo(() => {
    if (!sortKey) return rows
    const col = columns.find((c) => c.key === sortKey)
    return [...rows].sort((a, b) => {
      const av = a[sortKey] ?? ""
      const bv = b[sortKey] ?? ""
      if (col?.numeric) {
        const diff = Number(av) - Number(bv)
        return sortAsc ? diff : -diff
      }
      const diff = String(av).localeCompare(String(bv))
      return sortAsc ? diff : -diff
    })
  }, [rows, columns, sortKey, sortAsc])

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortAsc((prev) => !prev)
    } else {
      setSortKey(key)
      setSortAsc(true)
    }
  }

  const allSelected = selected.size === rows.length && rows.length > 0

  function toggleAll() {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(rows.map((_, i) => i)))
    }
  }

  function toggleRow(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  const exportCsv = useCallback(() => {}, [])

  if (rows.length === 0) {
    return (
      <Card className="flex min-h-40 flex-col items-center justify-center border-dashed text-center">
        <p className="text-sm font-medium text-[color:var(--foreground)]">
          No research data yet
        </p>
        <p className="mt-1 text-xs text-[color:var(--muted-foreground)]">
          Run the tool to generate research results.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={exportCsv}>
          <Download className="h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--border)] bg-[color:var(--muted)]">
                <th className="sticky left-0 z-10 bg-[color:var(--muted)] px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--primary)]"
                    aria-label="Select all rows"
                  />
                </th>
                {columns.map((col) => (
                  <th key={col.key} className="whitespace-nowrap px-3 py-2.5 text-left">
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)]"
                    >
                      {col.label}
                      <ArrowUpDown
                        className={cn(
                          "h-3 w-3",
                          sortKey === col.key
                            ? "text-[color:var(--primary)]"
                            : "text-[color:var(--muted-foreground)]"
                        )}
                      />
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row, ri) => {
                const originalIdx = rows.indexOf(row)
                const isSelected = selected.has(originalIdx)
                return (
                  <tr
                    key={ri}
                    className={cn(
                      "border-b border-[color:var(--border)] last:border-b-0 transition-colors",
                      isSelected
                        ? "bg-[color:var(--primary)]/5"
                        : "hover:bg-[color:var(--muted)]"
                    )}
                  >
                    <td className="sticky left-0 z-10 bg-[color:var(--card)] px-3 py-2">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(originalIdx)}
                        className="h-4 w-4 rounded border-[color:var(--border)] accent-[color:var(--primary)]"
                        aria-label={`Select row ${ri + 1}`}
                      />
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-3 py-2 text-[color:var(--foreground)]",
                          col.numeric ? "whitespace-nowrap text-right tabular-nums" : "min-w-[180px]"
                        )}
                      >
                        {row[col.key] ?? "—"}
                      </td>
                    ))}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {selected.size > 0 && onBulkAction && (
        <div className="flex items-center justify-between rounded-xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/5 px-4 py-3">
          <span className="text-sm font-medium text-[color:var(--foreground)]">
            {selected.size} {selected.size === 1 ? "keyword" : "keywords"} selected
          </span>
          <Button
            size="sm"
            onClick={() => {
              const selectedRows = rows.filter((_, i) => selected.has(i))
              onBulkAction(selectedRows)
            }}
          >
            <FileText className="h-3.5 w-3.5" />
            Create content brief from selected
          </Button>
        </div>
      )}
    </div>
  )
}
