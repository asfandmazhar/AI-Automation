import type { LucideIcon } from "lucide-react";
import {
  Link2,
  ShieldCheck,
  Share2,
  AtSign,
  Users,
  FileEdit,
  MessagesSquare,
  Bookmark,
  Podcast,
  Star,
} from "lucide-react";

export type OffPageSeoTool = {
  slug: string;
  title: string;
  description: string;
  icon: LucideIcon;
  starterPrompt: string;
};

export const offPageSeoTools: OffPageSeoTool[] = [
  {
    slug: "link-building",
    title: "Link Building (Backlinks)",
    description:
      "Build high-quality backlinks to boost your domain authority and search rankings.",
    icon: Link2,
    starterPrompt:
      "Suggest a link building strategy to get quality backlinks for my website about [topic].",
  },
  {
    slug: "backlink-quality",
    title: "Backlink Quality Factors",
    description:
      "Analyze and evaluate the quality of your backlink profile for maximum SEO impact.",
    icon: ShieldCheck,
    starterPrompt:
      "Analyze the quality factors of backlinks pointing to [URL] and suggest improvements.",
  },
  {
    slug: "social-media-signals",
    title: "Social Media Signals",
    description:
      "Leverage social media engagement to strengthen your off-page SEO presence.",
    icon: Share2,
    starterPrompt:
      "Create a social media strategy to boost SEO signals for my brand [brand name].",
  },
  {
    slug: "brand-mentions",
    title: "Brand Mentions",
    description:
      "Track and optimize unlinked brand mentions to build authority and earn backlinks.",
    icon: AtSign,
    starterPrompt:
      "Find opportunities to convert unlinked brand mentions into backlinks for [brand name].",
  },
  {
    slug: "influencer-outreach",
    title: "Influencer Outreach",
    description:
      "Connect with industry influencers to amplify your content and earn authoritative links.",
    icon: Users,
    starterPrompt:
      "Draft an influencer outreach plan for promoting my content about [topic].",
  },
  {
    slug: "content-marketing",
    title: "Content Marketing (Off-Site)",
    description:
      "Create and distribute valuable content on external platforms to drive traffic and links.",
    icon: FileEdit,
    starterPrompt:
      "Suggest off-site content marketing ideas to build backlinks for a site about [topic].",
  },
  {
    slug: "forum-community",
    title: "Forum & Community Participation",
    description:
      "Engage in relevant forums and communities to build authority and drive referral traffic.",
    icon: MessagesSquare,
    starterPrompt:
      "Identify the best forums and communities to participate in for the [niche] industry.",
  },
  {
    slug: "directory-submissions",
    title: "Directory & Bookmarking Submissions",
    description:
      "Submit your site to high-authority directories and bookmarking sites for visibility.",
    icon: Bookmark,
    starterPrompt:
      "List the top directories and bookmarking sites to submit my website about [topic].",
  },
  {
    slug: "guest-podcasting",
    title: "Guest Podcasting & Webinars",
    description:
      "Appear on podcasts and webinars to build brand awareness and earn quality backlinks.",
    icon: Podcast,
    starterPrompt:
      "Find relevant podcasts and webinar opportunities in the [niche] space for guest appearances.",
  },
  {
    slug: "reputation-management",
    title: "Online Reputation Management (ORM)",
    description:
      "Monitor and manage your online reputation to protect and enhance your brand's SEO.",
    icon: Star,
    starterPrompt:
      "Create an online reputation management plan for [brand name] to improve search presence.",
  },
];

export function getOffPageSeoToolBySlug(
  slug: string
): OffPageSeoTool | undefined {
  return offPageSeoTools.find((tool) => tool.slug === slug);
}
