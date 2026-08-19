import type { ModuleKey, ToolPattern } from "@/lib/tool-types"

export type GeneratorResult = {
  variants: { text: string; note?: string }[]
  charLimit?: number
  showSerpPreview?: boolean
}

export type AnalyzerResult = {
  score: number
  groups: {
    severity: "critical" | "warning" | "passed"
    items: { title: string; detail: string; fix?: string }[]
  }[]
}

export type ResearchResult = {
  columns: { key: string; label: string; numeric?: boolean }[]
  rows: Record<string, string | number>[]
}

export type OutreachResult = {
  templates: { label: string; subject?: string; body: string }[]
  prospects: {
    name: string
    url: string
    status: "draft" | "sent" | "replied"
  }[]
}

export type CodeResult = {
  code: string
  language: string
  notes?: string[]
}

export type WriterResult = {
  markdown: string
  checklist?: { label: string; done: boolean }[]
}

export type PatternResultMap = {
  generator: GeneratorResult
  analyzer: AnalyzerResult
  research: ResearchResult
  outreach: OutreachResult
  code: CodeResult
  writer: WriterResult
}

export type RunToolInput = {
  moduleKey: ModuleKey
  slug: string
  inputs: Record<string, string>
  followUp?: string
}

export type RunToolResponse = {
  pattern: ToolPattern
  output: PatternResultMap[ToolPattern]
  chatReply?: string
}
