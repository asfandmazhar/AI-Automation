import type { LucideIcon } from "lucide-react";
import {
  Store,
  MapPinCheck,
  BookMarked,
  Star,
  Search,
  FileText,
  Link2,
  Braces,
  MapPin,
  Megaphone,
} from "lucide-react";

export type LocalSeoTool = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  starterPrompt: string;
};

export const localSeoTools: LocalSeoTool[] = [
  {
    slug: "google-business-profile",
    title: "Google Business Profile (GBP) Optimization",
    description:
      "Optimize your Google Business Profile to improve local search visibility and attract nearby customers.",
    icon: Store,
    starterPrompt:
      "Help me optimize my Google Business Profile for [business name] in [city].",
  },
  {
    slug: "nap-consistency",
    title: "NAP Consistency",
    description:
      "Ensure your Name, Address, and Phone number are consistent across all online listings.",
    icon: MapPinCheck,
    starterPrompt:
      "Audit the NAP consistency for [business name] across major online directories.",
  },
  {
    slug: "local-citations",
    title: "Local Citations",
    description:
      "Build and manage local citations on directories and platforms to boost local search rankings.",
    icon: BookMarked,
    starterPrompt:
      "Suggest the best local citation sources for a [business type] in [city/region].",
  },
  {
    slug: "online-reviews",
    title: "Online Reviews & Ratings",
    description:
      "Manage and improve your online reviews to build trust and enhance local SEO performance.",
    icon: Star,
    starterPrompt:
      "Create a strategy to get more positive reviews for [business name] on Google and Yelp.",
  },
  {
    slug: "local-keyword-optimization",
    title: "Local Keyword Optimization",
    description:
      "Research and target location-specific keywords to rank higher in local search results.",
    icon: Search,
    starterPrompt:
      "Find the best local keywords for a [business type] targeting customers in [city/area].",
  },
  {
    slug: "local-landing-pages",
    title: "Local Landing Pages",
    description:
      "Create optimized landing pages for each location to capture local search traffic effectively.",
    icon: FileText,
    starterPrompt:
      "Help me plan a local landing page for my [business type] in [city] with SEO best practices.",
  },
  {
    slug: "local-link-building",
    title: "Local Link Building",
    description:
      "Earn backlinks from local websites, organizations, and media to strengthen local authority.",
    icon: Link2,
    starterPrompt:
      "Suggest local link building opportunities for [business name] in [city/region].",
  },
  {
    slug: "local-schema-markup",
    title: "Local Schema Markup",
    description:
      "Implement local business schema markup to help search engines display rich local results.",
    icon: Braces,
    starterPrompt:
      "Generate LocalBusiness schema markup for [business name] at [address] with [phone/hours].",
  },
  {
    slug: "google-maps-optimization",
    title: "Google Maps Optimization",
    description:
      "Optimize your presence on Google Maps to appear in the local pack and map results.",
    icon: MapPin,
    starterPrompt:
      "How can I improve my Google Maps ranking for [business name] in [city]?",
  },
  {
    slug: "local-content-marketing",
    title: "Local Content Marketing",
    description:
      "Create locally relevant content that resonates with your community and drives local traffic.",
    icon: Megaphone,
    starterPrompt:
      "Suggest local content marketing ideas for a [business type] in [city] to attract nearby customers.",
  },
];

export function getLocalSeoToolBySlug(
  slug: string
): LocalSeoTool | undefined {
  return localSeoTools.find((tool) => tool.slug === slug);
}
