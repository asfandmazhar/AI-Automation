import type { LucideIcon } from "lucide-react";
import {
  Search,
  FileText,
  Type,
  Tag,
  Heading,
  Link2,
  Image,
  ArrowRightLeft,
  ExternalLink,
  Activity,
} from "lucide-react";

export type SeoTool = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  starterPrompt: string;
};

export const seoTools: SeoTool[] = [
  {
    slug: "keyword-research",
    title: "Keyword Research & Optimization",
    description:
      "Discover high-impact keywords and optimize your content strategy for better search visibility.",
    icon: Search,
    starterPrompt:
      "Find the best keywords for my website about [topic] and suggest how to optimize for them.",
  },
  {
    slug: "content-optimization",
    title: "Content Optimization",
    description:
      "Analyze and improve your content to rank higher and engage readers more effectively.",
    icon: FileText,
    starterPrompt:
      "Analyze this content and suggest improvements for SEO and readability.",
  },
  {
    slug: "title-tags",
    title: "Title Tags",
    description:
      "Craft compelling, keyword-rich title tags that boost click-through rates in search results.",
    icon: Type,
    starterPrompt:
      "Generate optimized title tags for a page about [topic] targeting the keyword [keyword].",
  },
  {
    slug: "meta-descriptions",
    title: "Meta Descriptions",
    description:
      "Write persuasive meta descriptions that accurately summarize your pages and drive clicks.",
    icon: Tag,
    starterPrompt:
      "Write a compelling meta description for a page about [topic] under 160 characters.",
  },
  {
    slug: "heading-tags",
    title: "Heading Tags (H1–H6)",
    description:
      "Structure your content with properly optimized heading tags for clarity and SEO.",
    icon: Heading,
    starterPrompt:
      "Suggest an optimized heading structure (H1–H6) for an article about [topic].",
  },
  {
    slug: "url-structure",
    title: "URL Structure",
    description:
      "Design clean, descriptive URLs that are easy for users and search engines to understand.",
    icon: Link2,
    starterPrompt:
      "Suggest SEO-friendly URL structures for these pages: [list your pages].",
  },
  {
    slug: "image-optimization",
    title: "Image Optimization",
    description:
      "Optimize image alt text, file names, and sizing for faster loads and better rankings.",
    icon: Image,
    starterPrompt:
      "Generate descriptive alt text and optimized file names for my images about [topic].",
  },
  {
    slug: "internal-linking",
    title: "Internal Linking",
    description:
      "Build a strong internal link structure to spread authority and improve site navigation.",
    icon: ArrowRightLeft,
    starterPrompt:
      "Suggest an internal linking strategy for my site with these main pages: [list pages].",
  },
  {
    slug: "external-linking",
    title: "External / Outbound Linking",
    description:
      "Identify authoritative external sources to link to for credibility and topical relevance.",
    icon: ExternalLink,
    starterPrompt:
      "Suggest high-authority external sources to link to in my article about [topic].",
  },
  {
    slug: "ux-signals",
    title: "User Experience (UX) Signals",
    description:
      "Improve Core Web Vitals and UX factors that influence search rankings and user retention.",
    icon: Activity,
    starterPrompt:
      "Audit this page for UX issues that could hurt my SEO and suggest improvements.",
  },
];

export function getSeoToolBySlug(slug: string): SeoTool | undefined {
  return seoTools.find((tool) => tool.slug === slug);
}
