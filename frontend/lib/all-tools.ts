import type { ModuleKey, SeoTool } from "./tool-types";
import { seoTools } from "./seo-tools";
import { technicalSeoTools } from "./technical-seo-tools";
import { offPageSeoTools } from "./off-page-seo-tools";
import { localSeoTools } from "./local-seo-tools";

export const allTools: Record<ModuleKey, SeoTool[]> = {
  "on-page-seo": seoTools as unknown as SeoTool[],
  "technical-seo": technicalSeoTools as unknown as SeoTool[],
  "off-page-seo": offPageSeoTools as unknown as SeoTool[],
  "local-seo": localSeoTools as unknown as SeoTool[],
};

export function getModuleTools(moduleKey: ModuleKey): SeoTool[] {
  return allTools[moduleKey];
}

export function getTool(
  moduleKey: ModuleKey,
  slug: string
): SeoTool | undefined {
  return getModuleTools(moduleKey).find((tool) => tool.slug === slug);
}
