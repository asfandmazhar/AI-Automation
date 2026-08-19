"use client"

import { useState } from "react"
import type { ReactNode } from "react"
import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftOpen,
  PanelLeftClose,
  Clock,
  MessageSquare,
  Trash2,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
  FlaskConical,
  Upload,
  X,
} from "lucide-react"
import DashboardShell from "@/components/layout/dashboard-shell"
import { ChatPromptBar } from "@/components/ai/chat-prompt-bar"
import { Button } from "@/components/ui/button"
import { getTool } from "@/lib/all-tools"
import { sampleResult } from "@/lib/ai/client"
import type { ModuleKey, SeoTool, ToolField, ToolPattern } from "@/lib/tool-types"
import { cn } from "@/lib/utils"
import { VariantList } from "@/components/ai/outputs/variant-list"
import type { VariantListProps } from "@/components/ai/outputs/variant-list"
import { AuditReport } from "@/components/ai/outputs/audit-report"
import type { AuditReportProps } from "@/components/ai/outputs/audit-report"
import { ResearchTable } from "@/components/ai/outputs/research-table"
import type { ResearchTableProps } from "@/components/ai/outputs/research-table"
import { OutreachBoard } from "@/components/ai/outputs/outreach-board"
import type { OutreachBoardProps } from "@/components/ai/outputs/outreach-board"
import { CodeBlock } from "@/components/ai/outputs/code-block"
import type { CodeBlockProps } from "@/components/ai/outputs/code-block"
import { WriterOutput } from "@/components/ai/outputs/writer-output"
import type { WriterOutputProps } from "@/components/ai/outputs/writer-output"

// ─────────────────────────────────────────────────────────────────────────
// STATIC DESIGN BUILD — no dynamic behaviour.
// The output area always shows fixed sample content for the tool's pattern so
// the design renders in full. Run / suggestions / the prompt bar are inert.
// ─────────────────────────────────────────────────────────────────────────

export type ToolResultMap = {
  generator: VariantListProps
  analyzer: AuditReportProps
  research: ResearchTableProps
  outreach: OutreachBoardProps
  code: CodeBlockProps
  writer: WriterOutputProps
}

export type ToolResults = {
  [P in ToolPattern]?: ToolResultMap[P]
}

const mockHistory = [
  { id: "1", title: "Optimize landing page content", time: "2 min ago" },
  { id: "2", title: "Best practices research", time: "1 hour ago" },
  { id: "3", title: "Fix issues from last audit", time: "3 hours ago" },
  { id: "4", title: "Strategy for product pages", time: "Yesterday" },
  { id: "5", title: "Full site SEO review", time: "2 days ago" },
]

const patternRunLabel: Record<ToolPattern, string> = {
  analyzer: "Run Analysis",
  generator: "Generate",
  research: "Research",
  outreach: "Draft Outreach",
  code: "Generate Code",
  writer: "Write Content",
}

const patternSuggestions: Record<ToolPattern, string[]> = {
  analyzer: [
    "Analyze my top issues and rank by impact",
    "What should I fix first for quick wins?",
    "Give me a full audit with fix suggestions",
  ],
  generator: [
    "Generate 6 variants I can A/B test",
    "Show me the best-performing formats",
    "Create options optimized for click-through",
  ],
  research: [
    "Find high-volume, low-difficulty opportunities",
    "Show me competitor gaps I can target",
    "Rank ideas by traffic potential",
  ],
  outreach: [
    "Draft a personalized outreach email",
    "Find qualified prospects for my niche",
    "Write a follow-up sequence",
  ],
  code: [
    "Generate the code snippet I need",
    "Show me a valid, tested example",
    "Explain what each line does",
  ],
  writer: [
    "Draft a comprehensive article for me",
    "Create an SEO-optimized outline first",
    "Write content that ranks on page one",
  ],
}

const fieldBoxClasses =
  "w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3.5 py-2.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30 focus:border-[color:var(--primary)] focus:shadow-[0_0_0_4px] focus:shadow-[color:var(--primary)]/10 disabled:cursor-not-allowed disabled:opacity-50 hover:border-[color:var(--primary)]/40"

export type ToolWorkspaceProps = {
  moduleKey: ModuleKey
  slug: string
  results?: ToolResults
  renderOutput?: (tool: SeoTool) => ReactNode
}

function renderPatternOutput(pattern: ToolPattern, data: ToolResults): ReactNode {
  switch (pattern) {
    case "generator": {
      const props = data.generator
      return props ? <VariantList {...props} /> : null
    }
    case "analyzer": {
      const props = data.analyzer
      return props ? <AuditReport {...props} /> : null
    }
    case "research": {
      const props = data.research
      return props ? <ResearchTable {...props} /> : null
    }
    case "outreach": {
      const props = data.outreach
      return props ? <OutreachBoard {...props} /> : null
    }
    case "code": {
      const props = data.code
      return props ? <CodeBlock {...props} /> : null
    }
    case "writer": {
      const props = data.writer
      return props ? <WriterOutput {...props} /> : null
    }
    default:
      return null
  }
}

function MockBadge() {
  return (
    <span className="mb-3 inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2.5 py-0.5 text-xs font-medium text-amber-500">
      <FlaskConical className="h-3 w-3" />
      Mock mode
    </span>
  )
}

export function ToolWorkspace({
  moduleKey,
  slug,
  results: externalResults,
  renderOutput,
}: ToolWorkspaceProps) {
  const tool = getTool(moduleKey, slug)

  const [prompt, setPrompt] = useState(tool?.starterPrompt ?? "")
  const [historyOpen, setHistoryOpen] = useState(false)
  const [configOpen, setConfigOpen] = useState(false)
  const [fieldValues, setFieldValues] = useState<Record<string, string>>(() => {
    const defaults: Record<string, string> = {}
    for (const field of tool?.fields ?? []) {
      if (field.defaultValue != null) defaults[field.name] = field.defaultValue
    }
    return defaults
  })

  if (!tool) notFound()

  const toolPattern = tool.pattern
  // Static sample output for this tool's pattern — authored once, never runs.
  const activeResults = (externalResults ?? {
    [toolPattern]: sampleResult(moduleKey, slug).output,
  }) as ToolResults
  const suggestions = patternSuggestions[toolPattern] ?? patternSuggestions.analyzer
  const runLabel = patternRunLabel[toolPattern] ?? "Run"

  function setFieldValue(name: string, value: string) {
    setFieldValues((prev) => ({ ...prev, [name]: value }))
  }

  function renderField(field: ToolField) {
    const id = `tool-field-${field.name}`
    const value = fieldValues[field.name] ?? ""

    const labelEl = (
      <label
        htmlFor={id}
        className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]"
      >
        {field.label}
        {field.required && (
          <span className="text-[color:var(--primary)]">*</span>
        )}
      </label>
    )

    if (field.type === "textarea") {
      return (
        <div key={field.name} className="flex flex-col gap-2">
          {labelEl}
          <textarea
            id={id}
            rows={3}
            value={value}
            onChange={(e) => setFieldValue(field.name, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className={cn(fieldBoxClasses, "resize-none leading-relaxed")}
          />
        </div>
      )
    }

    if (field.type === "select") {
      return (
        <div key={field.name} className="flex flex-col gap-2">
          {labelEl}
          <div className="relative">
            <select
              id={id}
              value={value}
              onChange={(e) => setFieldValue(field.name, e.target.value)}
              required={field.required}
              className={cn(
                fieldBoxClasses,
                "h-10 cursor-pointer appearance-none pr-9"
              )}
            >
              <option value="">{field.placeholder ?? "Select an option"}</option>
              {(field.options ?? []).map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
          </div>
        </div>
      )
    }

    if (field.type === "file") {
      // Static design build — the dropzone is presentational only.
      return (
        <div key={field.name} className="flex flex-col gap-2">
          {labelEl}
          <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[color:var(--border)] bg-[color:var(--background)] px-4 py-5 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[color:var(--muted)]">
              <Upload className="h-5 w-5 text-[color:var(--muted-foreground)]" />
            </div>
            <p className="mt-2 text-xs font-medium text-[color:var(--foreground)]">
              Drop images here or click to browse
            </p>
            <p className="mt-0.5 text-[10px] text-[color:var(--muted-foreground)]">
              PNG, JPG, WebP, GIF
            </p>
          </div>
        </div>
      )
    }

    return (
      <div key={field.name} className="flex flex-col gap-2">
        {labelEl}
        <input
          id={id}
          type={field.type}
          placeholder={field.placeholder}
          required={field.required}
          value={value}
          onChange={(e) => setFieldValue(field.name, e.target.value)}
          className={cn(fieldBoxClasses, "h-10")}
        />
      </div>
    )
  }

  const inputPanelContent = (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {tool.fields.length > 0 ? (
          <>
            <div className="space-y-4">{tool.fields.map(renderField)}</div>
            {/* Divider with suggestions below fields */}
            <div className="space-y-2.5 border-t border-[color:var(--border)] pt-4">
              <p className="flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                <Sparkles className="h-3 w-3" />
                Quick Prompts
              </p>
              <div className="space-y-1.5">
                {suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="group flex w-full items-start gap-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-2.5 text-left text-xs text-[color:var(--foreground)]"
                  >
                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-[color:var(--muted-foreground)]" />
                    <span className="line-clamp-2 leading-relaxed">
                      {suggestion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Hero empty state */}
            <div className="relative overflow-hidden rounded-2xl border border-[color:var(--primary)]/15 bg-gradient-to-br from-[color:var(--primary)]/8 via-transparent to-[color:var(--primary)]/3 p-5 text-center">
              <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-[color:var(--primary)]/10 blur-2xl" />
              <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-[color:var(--primary)]/10 blur-2xl" />
              <div className="relative flex flex-col items-center gap-3">
                <div className="rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--primary)]/80 p-3 shadow-lg shadow-[color:var(--primary)]/25">
                  <Sparkles className="h-5 w-5 text-[color:var(--primary-foreground)]" />
                </div>
                <div>
                  <p className="text-sm font-bold text-[color:var(--foreground)]">
                    AI-Powered Assistant
                  </p>
                  <p className="mt-1.5 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
                    Ask a question or pick a suggested prompt to get started.
                  </p>
                </div>
              </div>
            </div>

            {/* Suggested prompts */}
            <div className="space-y-2.5">
              <p className="flex items-center gap-1.5 px-0.5 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                <Sparkles className="h-3 w-3" />
                Try Asking
              </p>
              <div className="space-y-1.5">
                {suggestions.map((suggestion, i) => (
                  <div
                    key={i}
                    className="group flex w-full items-start gap-2.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-2.5 text-left text-xs text-[color:var(--foreground)]"
                  >
                    <MessageSquare className="mt-0.5 h-3 w-3 shrink-0 text-[color:var(--muted-foreground)]" />
                    <span className="line-clamp-2 leading-relaxed">
                      {suggestion}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sticky Run button footer (inert in the static build) */}
      <div className="space-y-2.5 border-t border-[color:var(--border)] bg-[color:var(--card)] px-4 py-4">
        <Button
          type="button"
          className="w-full bg-gradient-to-r from-[color:var(--primary)] to-[color:var(--primary)]/85 shadow-lg shadow-[color:var(--primary)]/20"
          size="lg"
        >
          <Sparkles className="h-4 w-4" />
          {runLabel}
        </Button>
        <div className="flex items-center justify-center gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-600">
            <FlaskConical className="h-2.5 w-2.5" />
            Demo
          </span>
          <span className="text-[10px] text-[color:var(--muted-foreground)]">
            Returns sample data
          </span>
        </div>
      </div>
    </div>
  )

  return (
    <DashboardShell>
      <div className="-m-4 flex h-[calc(100vh-5rem)] flex-col overflow-hidden md:-m-6">
        {/* Top bar */}
        <div className="flex items-center justify-between border-b border-[color:var(--border)] bg-[color:var(--card)] px-3 py-2.5 sm:px-4 sm:py-3 md:px-6">
          <Link
            href={`/ai-system/${moduleKey}`}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm text-[color:var(--muted-foreground)] transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 rounded-lg bg-[color:var(--muted)] px-2 py-1 sm:px-3 sm:py-1.5">
              <tool.icon className="h-4 w-4 text-[color:var(--primary)]" />
              <span className="max-w-[120px] truncate text-xs font-medium text-[color:var(--foreground)] sm:max-w-none">
                {tool.title}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                if (!configOpen) setHistoryOpen(false)
                setConfigOpen((prev) => !prev)
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                configOpen
                  ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                  : "text-[color:var(--muted-foreground)]"
              )}
            >
              {configOpen ? (
                <PanelLeftClose className="h-5 w-5" />
              ) : (
                <PanelLeftOpen className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">Configure</span>
              {tool.fields.length > 0 && (
                <span className="rounded-full bg-[color:var(--primary)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--primary)]">
                  {tool.fields.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                if (!historyOpen) setConfigOpen(false)
                setHistoryOpen((prev) => !prev)
              }}
              className={cn(
                "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm transition-colors duration-200 hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]",
                historyOpen
                  ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                  : "text-[color:var(--muted-foreground)]"
              )}
            >
              {historyOpen ? (
                <PanelRightClose className="h-5 w-5" />
              ) : (
                <PanelRightOpen className="h-5 w-5" />
              )}
              <span className="hidden sm:inline">History</span>
            </button>
          </div>
        </div>

        <div className="relative flex flex-1 overflow-hidden">
          {(configOpen || historyOpen) && (
            <div
              className="absolute inset-0 z-20 bg-black/30 backdrop-blur-[2px]"
              onClick={() => { setConfigOpen(false); setHistoryOpen(false) }}
            />
          )}

          <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
            {/* Output panel */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--background)]">
              <div className="flex-1 overflow-y-auto px-3 sm:px-4 md:px-6">
                <div className="mx-auto flex min-h-full max-w-2xl flex-col">
                  <div>
                    {renderOutput ? (
                      renderOutput(tool)
                    ) : (
                      <>
                        <MockBadge />
                        {renderPatternOutput(tool.pattern, activeResults)}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Fixed bottom prompt bar (inert in the static build) */}
              <div className="bg-[color:var(--background)] px-3 py-3 sm:px-4 md:px-6 md:py-4">
                <ChatPromptBar
                  value={prompt}
                  onChange={setPrompt}
                  onSend={(value) => { if (value) setPrompt("") }}
                />
              </div>
            </div>
          </div>

          {/* Configure overlay panel */}
          {configOpen && (
            <div className="absolute inset-y-0 left-0 z-30 flex w-full flex-col border-r border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl shadow-black/10 sm:w-80 lg:w-[340px]">
              <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3.5">
                <span className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                    <SlidersHorizontal className="h-3.5 w-3.5 text-[color:var(--primary)]" />
                  </span>
                  <span className="text-sm font-semibold text-[color:var(--foreground)]">
                    Configure
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setConfigOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {inputPanelContent}
            </div>
          )}

          {/* History overlay panel */}
          {historyOpen && (
            <div className="absolute inset-y-0 right-0 z-30 flex w-full flex-col border-l border-[color:var(--border)] bg-[color:var(--card)] shadow-2xl shadow-black/10 sm:w-72">
              <div className="flex items-center justify-between border-b border-[color:var(--border)] px-4 py-3">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-[color:var(--muted-foreground)]" />
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    Chat History
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHistoryOpen(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-2">
                {mockHistory.map((item) => (
                  <div
                    key={item.id}
                    className="group flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors duration-200 hover:bg-[color:var(--muted)]"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-[color:var(--foreground)]">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-xs text-[color:var(--muted-foreground)]">
                        {item.time}
                      </p>
                    </div>
                    <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[color:var(--muted-foreground)] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
