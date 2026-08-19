"use client"

import { use } from "react"
import { ToolWorkspace } from "@/components/ai/tool-workspace"

export default function OnSeoToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <ToolWorkspace moduleKey="on-page-seo" slug={slug} />
}
