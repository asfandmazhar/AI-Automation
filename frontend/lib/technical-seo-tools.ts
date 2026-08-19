import type { LucideIcon } from "lucide-react";
import {
  Bot,
  Network,
  Gauge,
  Smartphone,
  ShieldCheck,
  Braces,
  Copy,
  FileDiff,
  ArrowRightLeft,
  Globe,
  Code,
  FileSearch,
} from "lucide-react";

export type TechnicalSeoTool = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  starterPrompt: string;
};

export const technicalSeoTools: TechnicalSeoTool[] = [
  {
    slug: "crawling-indexing",
    title: "Crawling & Indexing",
    description:
      "Optimize how search engines crawl and index your website for maximum visibility.",
    icon: Bot,
    starterPrompt:
      "Analyze the crawling and indexing status of my website [URL] and suggest improvements.",
  },
  {
    slug: "site-architecture",
    title: "Site Architecture",
    description:
      "Design and optimize your site structure for better crawlability and user experience.",
    icon: Network,
    starterPrompt:
      "Review the site architecture of [URL] and recommend structural improvements for SEO.",
  },
  {
    slug: "page-speed",
    title: "Page Speed & Core Web Vitals",
    description:
      "Improve page load times and Core Web Vitals scores for better rankings and UX.",
    icon: Gauge,
    starterPrompt:
      "Analyze the page speed and Core Web Vitals of [URL] and suggest optimizations.",
  },
  {
    slug: "mobile-friendliness",
    title: "Mobile-Friendliness",
    description:
      "Ensure your website delivers a seamless experience across all mobile devices.",
    icon: Smartphone,
    starterPrompt:
      "Evaluate the mobile-friendliness of [URL] and identify issues to fix.",
  },
  {
    slug: "https-security",
    title: "HTTPS & Website Security",
    description:
      "Secure your website with HTTPS and address security issues that impact SEO.",
    icon: ShieldCheck,
    starterPrompt:
      "Check the HTTPS implementation and security configuration of [URL] for SEO impact.",
  },
  {
    slug: "structured-data",
    title: "Structured Data (Schema Markup)",
    description:
      "Implement schema markup to help search engines understand your content and earn rich results.",
    icon: Braces,
    starterPrompt:
      "Suggest the best structured data markup for a [page type] page about [topic].",
  },
  {
    slug: "canonicalization",
    title: "Canonicalization",
    description:
      "Manage canonical tags to prevent duplicate content issues and consolidate link equity.",
    icon: Copy,
    starterPrompt:
      "Review the canonical tag setup on [URL] and identify any canonicalization issues.",
  },
  {
    slug: "duplicate-content",
    title: "Duplicate Content Management",
    description:
      "Detect and resolve duplicate content problems that dilute your search rankings.",
    icon: FileDiff,
    starterPrompt:
      "Identify duplicate content issues on my website [URL] and recommend solutions.",
  },
  {
    slug: "redirects-errors",
    title: "Redirects & Error Handling",
    description:
      "Set up proper redirects and fix error pages to preserve link equity and user experience.",
    icon: ArrowRightLeft,
    starterPrompt:
      "Audit the redirects and error pages on [URL] and suggest fixes for broken links.",
  },
  {
    slug: "hreflang-international",
    title: "Hreflang & International SEO",
    description:
      "Configure hreflang tags and international targeting to reach global audiences effectively.",
    icon: Globe,
    starterPrompt:
      "Help me set up hreflang tags for my multilingual website targeting [languages/regions].",
  },
  {
    slug: "javascript-seo",
    title: "JavaScript SEO",
    description:
      "Optimize JavaScript-rendered content so search engines can properly crawl and index it.",
    icon: Code,
    starterPrompt:
      "Analyze how search engines render the JavaScript content on [URL] and suggest fixes.",
  },
  {
    slug: "log-file-analysis",
    title: "Log File Analysis",
    description:
      "Analyze server log files to understand how search engine bots interact with your site.",
    icon: FileSearch,
    starterPrompt:
      "Guide me through analyzing server log files to find crawl budget issues for [URL].",
  },
];

export function getTechnicalSeoToolBySlug(
  slug: string
): TechnicalSeoTool | undefined {
  return technicalSeoTools.find((tool) => tool.slug === slug);
}
