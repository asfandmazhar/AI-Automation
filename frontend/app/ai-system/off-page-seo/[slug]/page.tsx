"use client"

import { use } from "react"
import { ToolWorkspace } from "@/components/ai/tool-workspace"

export default function OffPageSeoToolPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  return <ToolWorkspace moduleKey="off-page-seo" slug={slug} />
}
