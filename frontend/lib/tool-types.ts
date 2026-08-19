import type { LucideIcon } from "lucide-react";

export type ToolPattern =
  | "generator"
  | "analyzer"
  | "research"
  | "outreach"
  | "code"
  | "writer";

export type ToolField = {
  name: string;
  label: string;
  type: "text" | "textarea" | "url" | "select" | "number" | "file";
  placeholder?: string;
  options?: string[];
  required?: boolean;
  defaultValue?: string;
  accept?: string;
  multiple?: boolean;
};

export type SeoTool = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  starterPrompt: string;
  pattern: ToolPattern;
  fields: ToolField[];
  outputHint: string;
};

export type ModuleKey =
  | "on-page-seo"
  | "technical-seo"
  | "off-page-seo"
  | "local-seo";
