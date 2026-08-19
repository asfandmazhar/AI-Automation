import { getTool } from "@/lib/all-tools"
import type { ModuleKey } from "@/lib/tool-types"
import type {
  RunToolResponse,
  GeneratorResult,
  AnalyzerResult,
  ResearchResult,
  OutreachResult,
  CodeResult,
  WriterResult,
} from "./types"

// ─────────────────────────────────────────────────────────────────────────
// STATIC DESIGN BUILD — no dynamic behaviour.
// The generators below are kept only to author representative sample content
// so the output screens still render their full design. Nothing here runs in
// response to a user action; sampleResult() is a pure, synchronous function
// that returns fixed content at render time.
// ─────────────────────────────────────────────────────────────────────────

function pick(inputs: Record<string, string>, ...keys: string[]): string {
  for (const k of keys) {
    if (inputs[k]?.trim()) return inputs[k].trim()
  }
  return ""
}

function mockGenerator(
  slug: string,
  inputs: Record<string, string>
): GeneratorResult {
  if (slug === "title-tags") {
    return mockTitleTags(inputs)
  }
  if (slug === "meta-descriptions") {
    return mockMetaDescriptions(inputs)
  }
  if (slug === "url-structure") {
    return mockUrlStructure(inputs)
  }
  const kw = pick(inputs, "keyword", "topic", "query") || "best SEO practices"
  const brand = pick(inputs, "brand", "site", "company") || "Your Brand"
  return {
    variants: [
      {
        text: `${kw} — The Complete Guide for 2025`,
        note: "Uses current year for freshness signal",
      },
      {
        text: `How to Master ${kw}: Expert Tips & Strategies`,
        note: "Question format — tends to earn higher CTR",
      },
      {
        text: `${kw}: What Top-Ranking Sites Do Differently`,
        note: "Competitive angle — drives curiosity clicks",
      },
      {
        text: `10 Proven ${kw} Techniques That Actually Work`,
        note: "Numbered listicle with credibility qualifier",
      },
      {
        text: `${brand}'s Ultimate ${kw} Playbook`,
        note: "Brand-led variant for branded search queries",
      },
      {
        text: `${kw} Checklist: Everything You Need to Know`,
        note: "Utility-focused — performs well in featured snippets",
      },
    ],
    charLimit: 60,
  }
}

function mockTitleTags(inputs: Record<string, string>): GeneratorResult {
  const kw = pick(inputs, "keyword", "topic") || "best SEO practices"
  const brand = pick(inputs, "brand")
  const tone = pick(inputs, "tone")
  const parsedCount = Number.parseInt(pick(inputs, "variants"), 10)

  const templates: { text: string; note: string; category: string }[] = [
    { text: `${kw}: The Complete Guide for 2025`, note: "Keyword-first + current year for a freshness signal", category: "Professional" },
    { text: `How to Master ${kw} (Step-by-Step)`, note: "How-to format signals clear, actionable value", category: "How-to" },
    { text: `${kw} — What Top Results Get Right`, note: "Competitive curiosity angle without overpromising", category: "Compelling/Clickworthy" },
    { text: `10 Proven ${kw} Tips That Work`, note: "Power word + number improves scannability", category: "Listicle" },
    { text: `What Is ${kw}? A Practical Overview`, note: "Question format matches informational search intent", category: "Question-based" },
    { text: `${kw} Checklist: Everything to Know`, note: "Utility framing performs well in featured snippets", category: "Professional" },
    { text: `Why Does ${kw} Matter? Here's the Answer`, note: "Question hook mirrors how searchers phrase queries", category: "Question-based" },
    { text: `${kw} Explained: Tips & Best Practices`, note: "Clear scope-setting for informational intent", category: "Professional" },
    { text: `7 ${kw} Mistakes to Avoid`, note: "Number + negative framing increases click-through", category: "Listicle" },
    { text: `${kw}: A Beginner's Guide That Works`, note: "Audience qualifier broadens appeal, honestly", category: "Compelling/Clickworthy" },
  ]

  const ordered = tone
    ? [
        ...templates.filter((t) => t.category === tone),
        ...templates.filter((t) => t.category !== tone),
      ]
    : templates

  const count =
    Number.isFinite(parsedCount) && parsedCount > 0
      ? Math.min(parsedCount, templates.length)
      : 8

  const variants = ordered.slice(0, count).map(({ text, note }) => {
    const withBrand = brand ? `${text} | ${brand}` : text
    return { text: withBrand.length <= 60 ? withBrand : text, note }
  })

  return { variants, charLimit: 60 }
}

function mockUrlStructure(inputs: Record<string, string>): GeneratorResult {
  const pages = pick(inputs, "pages")
  const domain = pick(inputs, "domain")
  const section = pick(inputs, "section")

  const stopWords = new Set([
    "a", "an", "the", "is", "are", "was", "were", "be", "been",
    "to", "of", "in", "for", "on", "with", "at", "by", "from",
    "and", "or", "but", "not", "so", "yet", "both", "either",
    "how", "what", "why", "when", "where", "which", "who",
    "your", "you", "my", "our", "their", "its", "this", "that",
  ])

  const lines = pages
    ? pages.split("\n").map((l) => l.trim()).filter(Boolean)
    : ["How to Train for a Marathon", "Best Running Shoes 2025", "Marathon Nutrition Guide"]

  const prefix = domain
    ? `${domain.replace(/\/$/, "")}${section ? section.replace(/\/$/, "") : ""}/`
    : section
      ? `${section.replace(/\/$/, "")}/`
      : "/"

  const variants = lines.map((line) => {
    const words = line
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .split(/\s+/)
      .filter(Boolean)

    const meaningful = words.filter((w) => !stopWords.has(w))
    const slug = (meaningful.length > 0 ? meaningful : words).slice(0, 5).join("-")

    const removed = words.filter((w) => stopWords.has(w) && !meaningful.includes(w))
    const changes: string[] = []
    if (removed.length > 0) changes.push(`removed stop words: "${removed.join(", ")}"`)
    if (words.length > 5 && meaningful.length > 5) changes.push("trimmed to 5 words for brevity")
    if (/[^a-z0-9\s-]/.test(line.toLowerCase())) changes.push("stripped special characters")
    if (line !== line.toLowerCase()) changes.push("lowercased")
    if (changes.length === 0) changes.push("already clean — no changes needed")

    return {
      text: `${prefix}${slug}`,
      note: changes.join("; "),
    }
  })

  return { variants, showSerpPreview: false }
}

function mockMetaDescriptions(inputs: Record<string, string>): GeneratorResult {
  const kw = pick(inputs, "keyword", "topic") || "budget laptops"
  const usp = pick(inputs, "usp")
  const parsedCount = Number.parseInt(pick(inputs, "variants"), 10)

  const templates: { text: string; note: string }[] = [
    {
      text: `Discover the best ${kw} strategies trusted by 10,000+ marketers worldwide. Get actionable tips you can implement today.${usp ? ` ${usp}.` : ""} Learn how.`,
      note: "Social proof — references user count to build trust",
    },
    {
      text: `What makes a great ${kw} approach? We analysed 500+ top-ranking pages and break down exactly what works. See the full breakdown.`,
      note: "Curiosity gap — teases unanswered question with data hook",
    },
    {
      text: `Boost your results with proven ${kw} techniques used by industry leaders. Step-by-step guidance for measurable improvements.${usp ? ` ${usp}.` : ""} Start today.`,
      note: "Benefit-led — leads with the outcome the reader wants",
    },
    {
      text: `Is your ${kw} strategy costing you traffic? Here are 7 expert-backed fixes that top-ranking sites already use. Find out why.`,
      note: "Urgency + specificity — number creates concrete expectation",
    },
    {
      text: `Looking for better ${kw} results? Our comprehensive guide covers everything from fundamentals to advanced tactics. Explore now.`,
      note: "Question hook — mirrors how searchers think",
    },
    {
      text: `Companies using these ${kw} methods saw 3x more organic traffic in just 90 days — without paid ads.${usp ? ` ${usp}.` : ""} See the full list.`,
      note: "Specificity — concrete number and timeframe builds credibility",
    },
    {
      text: `Learn the ${kw} fundamentals that 93% of page-one sites get right — and most of your competitors still miss. Read the guide.`,
      note: "Social proof + curiosity gap — stat plus knowledge gap",
    },
    {
      text: `Your complete ${kw} resource: expert-vetted tips, real-world examples, and a free checklist to track your progress. Get started.`,
      note: "Benefit-led — stacks multiple value propositions",
    },
  ]

  const count =
    Number.isFinite(parsedCount) && parsedCount > 0
      ? Math.min(parsedCount, templates.length)
      : 6

  const variants = templates.slice(0, count).map(({ text, note }) => {
    const trimmed = text.length > 160 ? text.slice(0, 157) + "..." : text
    return { text: trimmed, note }
  })

  return { variants, charLimit: 160 }
}

function mockUxSignals(inputs: Record<string, string>): AnalyzerResult {
  const goal = pick(inputs, "goal") || "Read article"
  const layout = pick(inputs, "layout") || "hero banner, content section, sidebar, footer"

  const goalSpecific: Record<string, { title: string; detail: string; fix: string }> = {
    "Read article": {
      title: "No estimated reading time visible",
      detail: "Articles that display reading time in the hero area see 15–20% higher scroll-through rates. The described layout has no reading time indicator, which removes a key engagement signal for informational intent.",
      fix: `Add a "5 min read" badge next to the article date in the hero section. Calculate from word count ÷ 238 (average reading speed). Display it within the first viewport alongside the H1.`,
    },
    "Buy product": {
      title: "CTA button not differentiated from surrounding elements",
      detail: "Product pages require a visually dominant 'Add to Cart' or 'Buy Now' button within the first viewport. Based on the described layout, the primary CTA may not have sufficient visual weight to stand out from other interface elements.",
      fix: "Make the primary CTA 20–30% larger than secondary buttons, use a high-contrast fill colour (not outlined), and ensure at least 24px whitespace on all sides. Place it within the first 600px of vertical space.",
    },
    "Sign up": {
      title: "Sign-up form requires too many fields upfront",
      detail: "Multi-field sign-up forms reduce conversion rates by 4–6% per additional field beyond email. The page layout suggests a form that may ask for too much information before demonstrating value.",
      fix: "Reduce the above-the-fold form to a single email field with a 'Get Started' button. Move additional fields (name, company, role) to a second step after the user has committed.",
    },
    "Contact": {
      title: "Contact information not visible in first viewport",
      detail: "Pages with a 'Contact' goal need phone number, email, or chat widget visible without scrolling. Users arriving with contact intent have high urgency and will bounce if they must hunt for information.",
      fix: "Add a sticky header bar or top-right element showing the phone number and a 'Chat now' button. Ensure this is visible within the first 400px of vertical space on both desktop and mobile.",
    },
    "Navigate": {
      title: "Navigation categories lack visual hierarchy",
      detail: "Hub/navigation pages need clear visual grouping to help users find the right path quickly. Flat lists of links without categorisation increase cognitive load and time-to-click.",
      fix: "Group navigation links into 4–6 visually distinct cards with icons, category labels, and 1-line descriptions. Use a 2-column grid on desktop, single column on mobile.",
    },
  }

  const specific = goalSpecific[goal] || goalSpecific["Read article"]

  return {
    score: 61,
    groups: [
      {
        severity: "critical",
        items: [
          {
            title: "LCP element loads too late — above-the-fold content delayed",
            detail: "The largest contentful paint element (likely the hero banner image or headline) should render within 2.5 seconds. Based on the described layout, the hero section may contain an unoptimised background image or render-blocking resource that delays LCP.",
            fix: `Preload the hero image with <link rel="preload" as="image" href="hero.webp">. Inline critical CSS for the first viewport. If the hero uses a background-image, switch to an <img> tag with fetchpriority="high" for better browser prioritisation.`,
          },
          specific,
        ],
      },
      {
        severity: "warning",
        items: [
          {
            title: "Content formatting lacks scannable structure",
            detail: "Walls of text without visual breaks increase bounce rate by 25–40%. The described layout should use formatting aids (subheadings every 200–300 words, bullet lists, pull quotes, embedded media) to sustain attention and improve dwell time.",
            fix: "Add an H2 or visual break every 250 words maximum. Insert at least one non-text element (image, video, comparison table, or callout box) per scroll-depth section. Use 1.6–1.8 line-height for body text.",
          },
          {
            title: "No breadcrumb navigation present",
            detail: "Breadcrumbs improve both UX (orientation) and SEO (internal link structure, rich results in SERP). The described layout does not mention breadcrumbs, which means users may struggle to understand where they are in the site hierarchy.",
            fix: "Add a breadcrumb trail directly below the header/nav bar: Home > Category > Current Page. Use BreadcrumbList structured data (JSON-LD) to enable rich breadcrumb display in search results.",
          },
          {
            title: "No visible trust signals above the fold",
            detail: "Pages without visible trust indicators (security badges, review stars, testimonial snippets, or 'as seen in' logos) within the first viewport see 15–25% lower engagement from new visitors who haven't built brand familiarity.",
            fix: "Add a single-line trust bar below the hero: show star rating (if applicable), customer count ('Trusted by 10,000+ users'), and a security/guarantee badge. Keep it under 40px height to avoid pushing content down.",
          },
        ],
      },
      {
        severity: "passed",
        items: [
          {
            title: "Page served over HTTPS",
            detail: "The page uses a secure connection, which is a baseline ranking signal and eliminates browser security warnings that destroy trust.",
          },
          {
            title: "No intrusive interstitials detected",
            detail: "The described layout does not mention popups or interstitials that would trigger Google's intrusive interstitial penalty for mobile users.",
          },
        ],
      },
    ],
  }
}

function mockAnalyzer(
  slug: string,
  inputs: Record<string, string>
): AnalyzerResult {
  if (slug === "content-optimization") {
    return mockContentOptimization(inputs)
  }
  if (slug === "ux-signals") {
    return mockUxSignals(inputs)
  }
  const url = pick(inputs, "url", "website", "page") || "example.com"
  return {
    score: 72,
    groups: [
      {
        severity: "critical",
        items: [
          {
            title: "Missing meta description",
            detail: `No meta description found on ${url}. Search engines will auto-generate one from page content, which may not represent the page well.`,
            fix: "Add a unique meta description between 150-160 characters that includes your primary keyword and a clear call to action.",
          },
          {
            title: "H1 tag not found or duplicated",
            detail:
              "The page either has no H1 heading or contains multiple H1 tags, which confuses search engines about the page's primary topic.",
            fix: "Ensure exactly one H1 tag exists per page, containing the primary keyword naturally.",
          },
        ],
      },
      {
        severity: "warning",
        items: [
          {
            title: "Images missing alt attributes",
            detail:
              "3 images on the page lack alt text. This reduces accessibility and misses opportunities for image search visibility.",
            fix: "Add descriptive alt attributes to all images. Include relevant keywords naturally but avoid keyword stuffing.",
          },
          {
            title: "Low word count detected",
            detail:
              "Page content is approximately 320 words. Competing pages for this topic average 1,200+ words.",
            fix: "Expand content to at least 800 words. Add relevant subtopics, examples, and supporting data.",
          },
          {
            title: "No internal links to related pages",
            detail:
              "This page has no outgoing internal links, making it an orphan page that search engines may deprioritize.",
            fix: "Add 3-5 contextual internal links to semantically related pages on your site.",
          },
        ],
      },
      {
        severity: "passed",
        items: [
          {
            title: "Title tag present and within length",
            detail:
              "Title tag is 52 characters — within the recommended 50-60 character range for optimal SERP display.",
          },
          {
            title: "HTTPS enabled",
            detail:
              "The page is served over HTTPS with a valid SSL certificate. No mixed-content warnings detected.",
          },
        ],
      },
    ],
  }
}

function mockContentOptimization(inputs: Record<string, string>): AnalyzerResult {
  const kw = pick(inputs, "keyword", "topic") || "content marketing"
  const audience = pick(inputs, "audience") || "digital marketers"
  return {
    score: 58,
    groups: [
      {
        severity: "warning",
        items: [
          {
            title: `Keyword "${kw}" missing from H1`,
            detail: `The H1 heading does not contain the target keyword "${kw}". The H1 currently reads "A Guide to Better Marketing" — the primary keyword should appear naturally in the page's main heading for strongest on-page signal.`,
            fix: `Rewrite the H1 to: "The Complete ${kw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Guide for ${audience.split(",")[0].trim()}" — this places the keyword at the front while keeping it readable.`,
          },
          {
            title: "Keyword not in first 100 words",
            detail: `The target keyword "${kw}" first appears at word 147. Google weighs early keyword placement heavily — the first 100 words should introduce the topic and include the primary keyword naturally.`,
            fix: `Add this opening sentence before the current first paragraph: "If you're serious about ${kw}, the strategies in this guide will show you exactly what's working in 2025 and how to apply it step by step."`,
          },
          {
            title: "Keyword density below target",
            detail: `Current keyword density is 0.4% (3 mentions across 780 words). The recommended range is 1-2% — roughly 8-16 mentions for this word count. The keyword is underrepresented.`,
            fix: `Add the keyword naturally in these locations: one H2 subheading ("How to Build a ${kw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Plan"), the meta description, one image alt tag, and 3-4 more times in body paragraphs — especially in the conclusion.`,
          },
        ],
      },
      {
        severity: "critical",
        items: [
          {
            title: "Paragraphs exceed recommended length",
            detail: "3 paragraphs contain 7+ sentences each (sections 'Introduction', 'Strategy Overview', and 'Measuring Results'). Walls of text increase bounce rate — the average reader scans rather than reads linearly.",
            fix: `Split the 'Introduction' paragraph after the third sentence ending "…in this guide." Start a new paragraph with "The landscape has shifted…". Apply the same 3-4 sentence max to the other flagged sections.`,
          },
          {
            title: "High passive voice ratio (28%)",
            detail: "22 out of 78 sentences use passive voice. This exceeds the 15% threshold and makes the writing feel distant and less actionable, which hurts engagement metrics.",
            fix: `Rewrite the passive sentence "The strategy was implemented by the team" → "The team implemented the strategy." Apply this active-voice pattern to the 14 passive sentences in sections 'Getting Started' and 'Advanced Tactics'.`,
          },
        ],
      },
      {
        severity: "warning",
        items: [
          {
            title: "No first-person experience signals",
            detail: `The content reads as third-person advice without personal experience markers. Google's E-E-A-T framework (the first E = Experience) rewards content that demonstrates the author has actually done what they're writing about.`,
            fix: `Add 2-3 first-person anecdotes. Example: insert after the strategy section — "When I applied this approach to a ${audience} campaign in Q3 2024, organic traffic increased 34% in 8 weeks — here's exactly what I did differently."`,
          },
          {
            title: "No author bio or credentials",
            detail: "The page has no visible author attribution, bio, or credentials. For YMYL-adjacent content, Google's quality raters specifically look for expertise signals tied to a named author.",
            fix: `Add an author box below the title with: author name, role (e.g. "Senior ${kw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Strategist"), a 1-2 sentence bio mentioning years of experience, and a link to the author's LinkedIn profile.`,
          },
          {
            title: "Claims lack source citations",
            detail: `4 statistical claims in the content ("73% of marketers…", "ROI increases by 4x…") have no linked sources. Unsourced claims reduce trust and E-A-T quality signals.`,
            fix: `Link each stat to its primary source. For "73% of marketers" cite the HubSpot State of Marketing Report. For "ROI increases by 4x" cite the Content Marketing Institute's annual benchmark study. Use descriptive anchor text, not "click here".`,
          },
        ],
      },
      {
        severity: "warning",
        items: [
          {
            title: "Missing subtopic: measurement & KPIs",
            detail: `Top-ranking pages for "${kw}" all include a dedicated section on measurement, KPIs, and analytics setup. This content has no equivalent section, leaving a topical gap that signals incomplete coverage to Google.`,
            fix: `Add a new H2 section: "How to Measure Your ${kw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Success" covering: key metrics to track (traffic, engagement, conversions), recommended analytics tools, and a sample reporting template.`,
          },
          {
            title: "Missing subtopic: common mistakes",
            detail: `7 of the top 10 ranking pages include a "mistakes to avoid" or "pitfalls" section. This content skips that angle entirely, missing both a ranking opportunity and a chance to capture "what not to do" search queries.`,
            fix: `Add an H2 section: "5 ${kw.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} Mistakes That Kill Your Results" with specific examples, each in its own H3 with a 2-3 sentence explanation and fix.`,
          },
          {
            title: "Word count below competitor average",
            detail: "This article is 780 words. The average word count for the top 5 ranking pages for this keyword is 2,100 words. Google tends to rank more comprehensive content higher for informational queries.",
            fix: "Expand to at least 1,800 words by adding the missing subtopics above, plus a 'Getting Started Checklist' section and a 'Frequently Asked Questions' section targeting 4-5 related questions from People Also Ask.",
          },
        ],
      },
      {
        severity: "critical",
        items: [
          {
            title: "Outdated statistics referenced",
            detail: `The article cites "2021 data from…" and "according to a 2020 study…" — these are 4-5 years old. Google's Helpful Content system deprioritizes stale data in fast-moving fields.`,
            fix: `Replace the 2021 HubSpot stat with the 2024 edition (shows 82% adoption, up from 73%). Replace the 2020 CMI figure with the 2025 benchmark (ROI now 5.2x, up from 4x). Add "(Updated July 2025)" in the article's header area.`,
          },
          {
            title: 'No "last updated" date visible',
            detail: "The article shows a publish date of March 2023 but no last-updated date. Users and search engines both use freshness signals — an old date with no update marker suggests the content may be abandoned.",
            fix: `Add a visible "Last updated: July 2025" line directly below the title. Also add the dateModified property to the article's structured data: "dateModified": "2025-07-19".`,
          },
        ],
      },
    ],
  }
}

function mockImageOptimization(inputs: Record<string, string>): ResearchResult {
  const images = pick(inputs, "images")
  const kw = pick(inputs, "keyword") || "web optimization"
  const role = pick(inputs, "role") || "Mixed"

  const lines = images
    ? images.split("\n").map((l) => l.trim()).filter(Boolean)
    : [
        "Runner crossing finish line at sunset",
        "Pair of red running shoes on track",
        "Marathon hydration station",
      ]

  const toKebab = (s: string): string =>
    s.toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .join("-")

  const kwSlug = toKebab(kw)

  const rows = lines.map((desc, i) => {
    const descKebab = toKebab(desc)
    const fileName = `${kwSlug}-${descKebab}`

    const altText = desc.length > 100
      ? `${desc.slice(0, 100).trimEnd()}... – ${kw}`
      : `${desc} – ${kw}`

    const isHero = role === "Hero" || (role === "Mixed" && i === 0)
    const isThumbnail = role === "Thumbnail"
    const isProduct = role === "Product"

    const format = isProduct
      ? "WebP with PNG fallback — transparency may be needed for product cutouts"
      : isThumbnail
        ? "WebP at 60–70% quality — small display size tolerates higher compression"
        : "WebP primary, AVIF where browser support allows — 25–35% smaller than JPEG"

    const loading = isHero
      ? "eager"
      : "lazy"

    const compression = isHero
      ? "80–85% quality, prioritise visual clarity — this is the first image users see"
      : isThumbnail
        ? "60–70% quality, resize to exact display dimensions to avoid excess bytes"
        : isProduct
          ? "85–90% quality, preserve detail — buyers inspect product images closely"
          : "75–80% quality, serve responsive srcset at 1x/2x to match device DPR"

    return {
      image: desc,
      suggested_file_name: `${fileName}.webp`,
      alt_text: altText,
      format,
      loading,
      compression_tip: compression,
    }
  })

  return {
    columns: [
      { key: "image", label: "Image" },
      { key: "suggested_file_name", label: "Suggested File Name" },
      { key: "alt_text", label: "Alt Text" },
      { key: "format", label: "Format" },
      { key: "loading", label: "Loading" },
      { key: "compression_tip", label: "Compression Tip" },
    ],
    rows,
  }
}

function mockInternalLinking(inputs: Record<string, string>): ResearchResult {
  const pagesRaw = pick(inputs, "pages")
  const priorityRaw = pick(inputs, "priority")
  const siteType = pick(inputs, "siteType") || "Blog"

  const defaultPages = [
    "/blog/marathon-training-guide",
    "/blog/best-running-shoes",
    "/blog/race-day-nutrition",
    "/blog/beginner-5k-plan",
    "/products/running-shoes",
    "/blog/injury-prevention",
  ]

  const pages = pagesRaw
    ? pagesRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : defaultPages

  const priorityPages = priorityRaw
    ? priorityRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : pages.slice(0, 2)

  const prioritySet = new Set(priorityPages)

  const placements = [
    "within intro paragraph",
    "in the conclusion / next-steps section",
    "related-posts block at end of article",
    "contextual mention in body paragraph",
    "sidebar or in-content callout box",
    "comparison table or product mention",
  ]

  const reasons: Record<string, string[]> = {
    priority: [
      "passes link equity to priority page — high commercial value",
      "strengthens topical authority for money page",
      "directs user journey from awareness to conversion",
    ],
    cluster: [
      "builds topical cluster — reinforces semantic relationship",
      "creates hub-and-spoke link between related content",
      "signals topical depth to search engines within this cluster",
    ],
    journey: [
      "natural user journey — readers of this topic often want this next",
      "reduces bounce by offering a logical next step",
      "cross-links complementary content for longer session duration",
    ],
  }

  const anchorStyles = [
    (to: string) => `guide to ${to.split("/").pop()?.replace(/-/g, " ") || "this topic"}`,
    (to: string) => `learn more about ${to.split("/").pop()?.replace(/-/g, " ") || "this"}`,
    (to: string) => `our ${to.split("/").pop()?.replace(/-/g, " ") || "resource"} breakdown`,
    (to: string) => `${to.split("/").pop()?.replace(/-/g, " ") || "related page"} tips`,
    (to: string) => `see ${to.includes("product") ? "our top picks" : "the full guide"}`,
    (to: string) => `compare ${to.split("/").pop()?.replace(/-/g, " ") || "options"}`,
  ]

  const rows: Record<string, string | number>[] = []
  let placementIdx = 0
  let anchorIdx = 0

  for (const to of priorityPages) {
    const sources = pages.filter((p) => p !== to)
    const fromPages = sources.slice(0, Math.min(3, sources.length))
    for (const from of fromPages) {
      rows.push({
        from_page: from,
        to_page: to,
        anchor_text: anchorStyles[anchorIdx % anchorStyles.length](to),
        placement: placements[placementIdx % placements.length],
        reason: reasons.priority[rows.length % reasons.priority.length],
      })
      placementIdx++
      anchorIdx++
    }
  }

  const nonPriority = pages.filter((p) => !prioritySet.has(p))
  for (let i = 0; i < nonPriority.length && rows.length < 12; i++) {
    const from = nonPriority[i]
    const to = nonPriority[(i + 1) % nonPriority.length] || pages[0]
    if (from === to) continue

    const reasonType = siteType === "E-commerce" ? "journey" : "cluster"
    rows.push({
      from_page: from,
      to_page: to,
      anchor_text: anchorStyles[anchorIdx % anchorStyles.length](to),
      placement: placements[placementIdx % placements.length],
      reason: reasons[reasonType][rows.length % reasons[reasonType].length],
    })
    placementIdx++
    anchorIdx++
  }

  return {
    columns: [
      { key: "from_page", label: "From Page" },
      { key: "to_page", label: "To Page" },
      { key: "anchor_text", label: "Anchor Text" },
      { key: "placement", label: "Placement" },
      { key: "reason", label: "Reason" },
    ],
    rows,
  }
}

function mockExternalLinking(inputs: Record<string, string>): ResearchResult {
  const topic = pick(inputs, "topic") || "email marketing"
  const claimsRaw = pick(inputs, "claims")
  const industry = pick(inputs, "industry") || "general"

  const claims = claimsRaw
    ? claimsRaw.split("\n").map((l) => l.trim()).filter(Boolean)
    : []

  const baseRows: Record<string, string>[] = [
    {
      source_type: "Industry leader",
      suggested_source: "HubSpot",
      what_to_link: `${topic} benchmarks, statistics, and annual state-of-the-industry report`,
      anchor_text: `HubSpot's latest ${topic} research`,
      caution: "Verify the exact report URL — HubSpot updates annually and old editions redirect",
    },
    {
      source_type: "Research",
      suggested_source: "Statista",
      what_to_link: `Market size, adoption rates, and trend data for ${topic}`,
      anchor_text: `according to Statista's ${topic} data`,
      caution: "Some Statista pages are paywalled — link to the free preview chart when possible",
    },
    {
      source_type: "Gov",
      suggested_source: "FTC (Federal Trade Commission)",
      what_to_link: `Compliance guidelines and regulations relevant to ${topic}`,
      anchor_text: "FTC guidelines on commercial communications",
      caution: "Government URLs are stable but page structure changes — verify the anchor lands correctly",
    },
    {
      source_type: "Edu",
      suggested_source: "Harvard Business Review",
      what_to_link: `Research-backed strategy and case studies related to ${topic}`,
      anchor_text: `Harvard Business Review on ${topic} strategy`,
      caution: "HBR limits free article access — consider linking to the abstract or a non-paywalled summary",
    },
    {
      source_type: "Tool",
      suggested_source: "Google Search Central",
      what_to_link: "Official documentation on search best practices, structured data, and indexing",
      anchor_text: "Google's official search documentation",
      caution: "Google reorganises developer docs frequently — verify link paths haven't changed",
    },
    {
      source_type: "Industry leader",
      suggested_source: "Content Marketing Institute",
      what_to_link: `Annual benchmarks, trends reports, and expert analysis for ${topic}`,
      anchor_text: `Content Marketing Institute's ${topic} benchmarks`,
      caution: "CMI publishes new reports each year — link to the most current edition",
    },
    {
      source_type: "Research",
      suggested_source: "McKinsey & Company",
      what_to_link: `Industry analysis, digital transformation insights related to ${topic}`,
      anchor_text: `McKinsey's analysis of ${topic} trends`,
      caution: "McKinsey articles are free but some require email registration — verify access",
    },
    {
      source_type: "Tool",
      suggested_source: "Moz",
      what_to_link: "SEO metrics methodology, domain authority explanation, and learning resources",
      anchor_text: "Moz's guide to domain authority",
      caution: "Moz frequently updates their learning center — confirm the URL resolves to current content",
    },
  ]

  const claimRows: Record<string, string>[] = claims.map((claim) => ({
    source_type: "Research",
    suggested_source: "Original study author / publisher",
    what_to_link: `Primary source for the claim: "${claim}"`,
    anchor_text: `according to ${claim.match(/\d+%/) ? "the study" : "published research"}`,
    caution: "Find the original study — do not cite a secondary blog post that mentions this stat. Verify the number matches the source exactly.",
  }))

  return {
    columns: [
      { key: "source_type", label: "Source Type" },
      { key: "suggested_source", label: "Suggested Source" },
      { key: "what_to_link", label: "What to Link" },
      { key: "anchor_text", label: "Anchor Text" },
      { key: "caution", label: "Caution" },
    ],
    rows: [...claimRows, ...baseRows],
  }
}

function mockResearch(
  slug: string,
  inputs: Record<string, string>
): ResearchResult {
  if (slug === "image-optimization") {
    return mockImageOptimization(inputs)
  }
  if (slug === "internal-linking") {
    return mockInternalLinking(inputs)
  }
  if (slug === "external-linking") {
    return mockExternalLinking(inputs)
  }
  const kw = pick(inputs, "keyword", "query", "topic") || "seo tools"
  const intentFilter = pick(inputs, "intent") || "All"

  const allRows: Record<string, string | number>[] = [
    // Primary keywords (high-volume head terms)
    { keyword: kw, intent: "Informational", difficulty: "High", monthly_interest: 14800, content_idea: `The definitive guide to ${kw} — everything you need to know in 2025`, placement_tip: "Title / H1" },
    { keyword: `best ${kw}`, intent: "Commercial", difficulty: "High", monthly_interest: 9900, content_idea: `Top 10 best ${kw} compared: features, pricing, and expert verdict`, placement_tip: "Title / H1" },
    { keyword: `${kw} software`, intent: "Transactional", difficulty: "High", monthly_interest: 7400, content_idea: `${kw} software buyer's guide — pick the right tool for your stack`, placement_tip: "URL slug" },
    { keyword: `${kw} for small business`, intent: "Commercial", difficulty: "Medium", monthly_interest: 5200, content_idea: `How small businesses can leverage ${kw} without a big budget`, placement_tip: "H2 subheading" },
    { keyword: `${kw} strategy`, intent: "Informational", difficulty: "Medium", monthly_interest: 4100, content_idea: `Build a winning ${kw} strategy from scratch — step-by-step framework`, placement_tip: "Title / H1" },
    // Secondary keywords (medium-volume modifiers)
    { keyword: `${kw} free`, intent: "Transactional", difficulty: "Medium", monthly_interest: 6200, content_idea: `7 genuinely free ${kw} that rival paid alternatives`, placement_tip: "Meta description" },
    { keyword: `${kw} pricing`, intent: "Commercial", difficulty: "Low", monthly_interest: 2800, content_idea: `${kw} pricing breakdown — what you'll actually pay in 2025`, placement_tip: "H2 subheading" },
    { keyword: `${kw} comparison`, intent: "Commercial", difficulty: "Medium", monthly_interest: 3100, content_idea: `Side-by-side ${kw} comparison chart with real user ratings`, placement_tip: "Title / H1" },
    { keyword: `${kw} for beginners`, intent: "Informational", difficulty: "Low", monthly_interest: 3600, content_idea: `Beginner's roadmap: start using ${kw} in under 30 minutes`, placement_tip: "First 100 words" },
    { keyword: `${kw} 2025`, intent: "Informational", difficulty: "Medium", monthly_interest: 4800, content_idea: `What's changed in ${kw} for 2025 — trends and predictions`, placement_tip: "URL slug" },
    // LSI / semantically related
    { keyword: `search engine optimization tools`, intent: "Informational", difficulty: "High", monthly_interest: 3400, content_idea: `Complete list of search engine optimization tools every marketer needs`, placement_tip: "Image alt text" },
    { keyword: `keyword research platforms`, intent: "Commercial", difficulty: "Medium", monthly_interest: 1900, content_idea: `Best keyword research platforms ranked by data accuracy`, placement_tip: "Internal anchor text" },
    { keyword: `site audit checker`, intent: "Transactional", difficulty: "Medium", monthly_interest: 2200, content_idea: `Run a free site audit in 60 seconds with these checkers`, placement_tip: "H2 subheading" },
    { keyword: `rank tracking software`, intent: "Commercial", difficulty: "Medium", monthly_interest: 2600, content_idea: `Rank tracking software shootout — accuracy, speed, and price compared`, placement_tip: "Meta description" },
    // Long-tail keywords
    { keyword: `best ${kw} for ecommerce sites`, intent: "Commercial", difficulty: "Low", monthly_interest: 1100, content_idea: `Ecommerce SEO stack: the ${kw} that actually move the needle`, placement_tip: "First 100 words" },
    { keyword: `affordable ${kw} with API access`, intent: "Transactional", difficulty: "Low", monthly_interest: 480, content_idea: `Developer-friendly ${kw} with affordable API plans`, placement_tip: "URL slug" },
    { keyword: `${kw} for local business SEO`, intent: "Commercial", difficulty: "Low", monthly_interest: 720, content_idea: `Local SEO toolkit: ${kw} that boost your Google Business profile`, placement_tip: "H2 subheading" },
    { keyword: `${kw} with content optimization`, intent: "Informational", difficulty: "Low", monthly_interest: 560, content_idea: `${kw} that include built-in content optimization workflows`, placement_tip: "Internal anchor text" },
    // Question-based keywords
    { keyword: `what are the best ${kw}`, intent: "Informational", difficulty: "Medium", monthly_interest: 3800, content_idea: `Expert roundup: what are the best ${kw} according to 50 SEOs`, placement_tip: "Title / H1" },
    { keyword: `how to choose ${kw}`, intent: "Informational", difficulty: "Low", monthly_interest: 1400, content_idea: `How to choose ${kw}: a decision framework based on your goals`, placement_tip: "First 100 words" },
    { keyword: `why do you need ${kw}`, intent: "Informational", difficulty: "Low", monthly_interest: 980, content_idea: `Why ${kw} matter — the ROI case with real numbers`, placement_tip: "Meta description" },
    { keyword: `how much do ${kw} cost`, intent: "Commercial", difficulty: "Low", monthly_interest: 1600, content_idea: `The true cost of ${kw}: hidden fees, tiers, and what's worth paying for`, placement_tip: "H2 subheading" },
    { keyword: `which ${kw} is best for WordPress`, intent: "Navigational", difficulty: "Low", monthly_interest: 890, content_idea: `WordPress SEO plugin showdown — which ${kw} integrates best`, placement_tip: "Title / H1" },
  ]

  const rows = intentFilter === "All"
    ? allRows
    : allRows.filter((r) => r.intent === intentFilter)

  return {
    columns: [
      { key: "keyword", label: "Keyword" },
      { key: "intent", label: "Intent" },
      { key: "difficulty", label: "Difficulty (est.)" },
      { key: "monthly_interest", label: "Monthly Interest (est.)", numeric: true },
      { key: "content_idea", label: "Content Idea" },
      { key: "placement_tip", label: "Placement Tip" },
    ],
    rows,
  }
}

function mockOutreach(
  slug: string,
  inputs: Record<string, string>
): OutreachResult {
  const topic = pick(inputs, "topic", "keyword", "niche") || "SEO"
  return {
    templates: [
      {
        label: "Guest Post Pitch",
        subject: `Guest contribution: ${topic} insights for your readers`,
        body: `Hi {{name}},\n\nI've been following {{site}} and really enjoyed your recent piece on ${topic} trends. I'd love to contribute a guest article covering actionable strategies your audience would find valuable.\n\nI have a few topic ideas ready — would you be open to a quick look?\n\nBest,\n{{sender}}`,
      },
      {
        label: "Broken Link Outreach",
        subject: "Quick heads-up: broken link on your site",
        body: `Hi {{name}},\n\nWhile researching ${topic}, I noticed a broken link on {{page_url}} — it points to a resource that's been taken down.\n\nI recently published a comprehensive guide on the same subject that could be a solid replacement. Happy to share the link if you're interested.\n\nCheers,\n{{sender}}`,
      },
      {
        label: "Resource Page Request",
        subject: `Useful ${topic} resource for your page`,
        body: `Hi {{name}},\n\nI came across your ${topic} resource page on {{site}} and found it really helpful. I noticed a few areas where an additional perspective could round things out.\n\nWe recently published an in-depth guide covering exactly that gap. Would you consider adding it to your list?\n\nThanks,\n{{sender}}`,
      },
    ],
    prospects: [
      { name: "SearchEngine Journal", url: "https://searchenginejournal.com", status: "replied" },
      { name: "Moz Blog", url: "https://moz.com/blog", status: "sent" },
      { name: "Ahrefs Blog", url: "https://ahrefs.com/blog", status: "sent" },
      { name: "Backlinko", url: "https://backlinko.com", status: "draft" },
      { name: "Content Marketing Institute", url: "https://contentmarketinginstitute.com", status: "draft" },
    ],
  }
}

function mockCode(
  slug: string,
  inputs: Record<string, string>
): CodeResult {
  const url = pick(inputs, "url", "website", "domain") || "https://example.com"

  if (slug.includes("structured-data") || slug.includes("schema")) {
    return {
      language: "json-ld",
      code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Example Inc.",
  "url": "${url}",
  "logo": "${url}/logo.png",
  "sameAs": [
    "https://twitter.com/example",
    "https://linkedin.com/company/example"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-800-555-0100",
    "contactType": "customer service"
  }
}
</script>`,
      notes: [
        "Organization schema helps Google's Knowledge Panel display your brand correctly",
        "Update sameAs with your actual social profile URLs",
        "Add contactPoint only if you have a public support line",
      ],
    }
  }

  if (slug.includes("robots") || slug.includes("crawl")) {
    return {
      language: "txt",
      code: `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /tmp/
Disallow: /*?ref=
Disallow: /*?utm_

# Sitemaps
Sitemap: ${url}/sitemap.xml
Sitemap: ${url}/sitemap-images.xml

# Crawl-delay (optional, Bing/Yandex only)
User-agent: bingbot
Crawl-delay: 5`,
      notes: [
        "Blocking /api/ prevents search engines from indexing raw API responses",
        "The utm_ and ref= rules keep tracking-parameter duplicates out of the index",
        "Google ignores Crawl-delay — use Search Console's crawl rate setting instead",
      ],
    }
  }

  return {
    language: "html",
    code: `<!-- Canonical tag -->
<link rel="canonical" href="${url}/page" />

<!-- Open Graph -->
<meta property="og:title" content="Page Title | Example" />
<meta property="og:description" content="A concise, keyword-rich description under 160 characters." />
<meta property="og:image" content="${url}/og-image.jpg" />
<meta property="og:url" content="${url}/page" />
<meta property="og:type" content="website" />

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="Page Title | Example" />
<meta name="twitter:description" content="A concise, keyword-rich description under 160 characters." />
<meta name="twitter:image" content="${url}/og-image.jpg" />`,
    notes: [
      "Canonical tag prevents duplicate-content penalties from URL parameters",
      "og:image should be at least 1200x630px for best display on social platforms",
      "Always test with Facebook's Sharing Debugger and Twitter Card Validator",
    ],
  }
}

function mockHeadingTags(inputs: Record<string, string>): WriterResult {
  const topic = pick(inputs, "topic") || "intermittent fasting"
  const kw = pick(inputs, "keyword") || topic
  const secondary = pick(inputs, "secondaryKeywords")
  const contentType = pick(inputs, "contentType") || "Blog post"

  const secondaryList = secondary
    ? secondary.split(",").map((s) => s.trim()).filter(Boolean)
    : []

  const kwTitle = kw.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
  const topicTitle = topic.split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")

  let markdown = ""

  if (contentType === "Product page") {
    markdown = `# ${kwTitle}: Features, Pricing & Reviews

> Introduce the product, name the primary keyword, and state the core value proposition in one sentence.

## What Is ${kwTitle}?

> Brief overview paragraph — explain what the product does and who it's for.${secondaryList[0] ? `\n\n### ${secondaryList[0].charAt(0).toUpperCase() + secondaryList[0].slice(1)}\n\n> Detail how this specific aspect of the product works.` : ""}

## Key Features & Benefits

> Bullet-style breakdown of the top 5–7 features, each with a one-line benefit statement.

### Top Feature Highlight

> Deep-dive into the most differentiated feature with use-case example.

## How ${kwTitle} Works

> Step-by-step walkthrough or visual explainer of the product workflow.

## Pricing & Plans

> Comparison table or breakdown of available tiers.${secondaryList[1] ? `\n\n### ${secondaryList[1].charAt(0).toUpperCase() + secondaryList[1].slice(1)}\n\n> Address this angle in the context of pricing or value.` : ""}

## ${kwTitle} vs. Alternatives

> Honest comparison with 2–3 competitors — focus on differentiators, not bashing.

## Customer Reviews & Results

> Social proof section — real quotes, case study snippets, or aggregate ratings.

## Frequently Asked Questions

> 4–6 question-format H3s targeting People Also Ask queries.

### Is ${kwTitle} Worth It?

> Direct answer + supporting evidence.

### Who Should Use ${kwTitle}?

> Audience segmentation — who benefits most and who might not need it.`
  } else if (contentType === "Landing page") {
    markdown = `# ${kwTitle} — ${topicTitle}

> Hero section: state the primary keyword, the core promise, and a clear CTA in the first viewport.

## Why ${kwTitle} Matters

> Problem statement — describe the pain point your audience faces.${secondaryList[0] ? `\n\n### ${secondaryList[0].charAt(0).toUpperCase() + secondaryList[0].slice(1)}\n\n> Connect this secondary angle to the main problem.` : ""}

## How It Works

> 3-step visual process or brief explainer — keep it scannable.

## Key Benefits

> Benefit-led section with 3–5 items, each tied to a real outcome.${secondaryList[1] ? `\n\n### ${secondaryList[1].charAt(0).toUpperCase() + secondaryList[1].slice(1)}\n\n> Expand on this benefit with data or a mini case study.` : ""}

## Social Proof & Results

> Testimonials, logos, metrics, or case study highlights.

## Frequently Asked Questions

> 3–5 question headings targeting PAA and reducing objections.

### What Results Can I Expect?

> Set realistic expectations with timeframes and data points.

## Get Started With ${kwTitle}

> Final CTA section — restate the offer and make the next step obvious.`
  } else {
    markdown = `# The Complete Guide to ${kwTitle}

> Open with a hook that names the primary keyword in the first sentence. State what the reader will learn and why it matters now.

## What Is ${kwTitle}?

> Define the topic clearly for beginners. Include the primary keyword naturally and set the scope of the article.${secondaryList[0] ? `\n\n### ${secondaryList[0].charAt(0).toUpperCase() + secondaryList[0].slice(1)}\n\n> Explain this subtopic as it relates to the main concept.` : ""}

## Why ${kwTitle} Matters in 2025

> Make the case for relevance — cite trends, data, or industry shifts. Connect to reader goals.

## How to Get Started With ${kwTitle}

> Step-by-step actionable section. Number the steps for scannability.

### Step 1: Research & Planning

> Detail the first action the reader should take, with specific tools or methods.

### Step 2: Implementation

> Walk through execution with examples or templates.

### Step 3: Measuring Results

> Define success metrics and how to track them.${secondaryList[1] ? `\n\n## ${secondaryList[1].charAt(0).toUpperCase() + secondaryList[1].slice(1)}\n\n> Dedicate a full section to this secondary keyword — cover it thoroughly enough to rank independently.` : ""}

## Common ${kwTitle} Mistakes to Avoid

> List 3–5 pitfalls with brief explanations of why they hurt and how to fix them.

### Mistake 1: Skipping the Fundamentals

> Explain the specific mistake and provide the correct approach.

## ${kwTitle} Best Practices & Tips

> Actionable checklist or numbered tips — aim for 5–7 items.${secondaryList[2] ? `\n\n### ${secondaryList[2].charAt(0).toUpperCase() + secondaryList[2].slice(1)}\n\n> Work this secondary keyword into a best-practice tip naturally.` : ""}

## Frequently Asked Questions About ${kwTitle}

> Target 4–5 PAA questions as H3 subheadings. Answer concisely (40–60 words) for featured snippet eligibility.

### What Is the Best Way to Start ${kwTitle}?

> Direct answer in the first sentence, then elaborate with 2–3 supporting details.

### How Long Does ${kwTitle} Take to Show Results?

> Give a realistic timeframe with caveats based on the reader's situation.

## Conclusion

> Summarise key takeaways, restate the primary keyword, and end with a clear next-step CTA.`
  }

  return {
    markdown,
    checklist: [
      { label: "Single H1", done: true },
      { label: "Primary keyword in H1", done: true },
      { label: "No skipped heading levels", done: true },
      { label: "Secondary keywords distributed in H2/H3", done: secondaryList.length > 0 },
      { label: "Question headings for PAA/featured snippets included", done: true },
    ],
  }
}

function mockWriter(
  slug: string,
  inputs: Record<string, string>
): WriterResult {
  if (slug === "heading-tags") {
    return mockHeadingTags(inputs)
  }
  const topic = pick(inputs, "topic", "keyword", "subject") || "on-page SEO"
  const audience = pick(inputs, "audience", "target") || "digital marketers"
  return {
    markdown: `# The Complete Guide to ${topic}

## Why ${topic} Matters in 2025

Search engines continue to evolve, but **${topic}** remains one of the most impactful levers for organic growth. Whether you're optimizing an existing site or building from scratch, getting the fundamentals right will compound over time.

For ${audience}, understanding these principles isn't optional — it's the difference between ranking on page one and being invisible.

## Key Strategies

### 1. Start With Intent

Before optimizing any page, understand **what the searcher actually wants**. Map each target keyword to a search intent category:

- **Informational** — the user wants to learn ("what is ${topic}")
- **Navigational** — the user wants a specific site ("${topic} tool login")
- **Transactional** — the user wants to buy or act ("best ${topic} service")

### 2. Optimize Your On-Page Elements

Every page should have a clear hierarchy:

- **Title tag** — 50-60 characters, primary keyword near the front
- **Meta description** — 150-160 characters, include a call to action
- **H1** — one per page, matches the title's topic
- **H2-H3** — break content into scannable sections

### 3. Create Content That Earns Links

Thin content doesn't rank. Aim for **comprehensive coverage** that answers follow-up questions before they're asked. Include original data, expert quotes, and actionable checklists.

### 4. Technical Foundations

Don't ignore the basics:

- Fast page load (under 2.5s LCP)
- Mobile-first responsive design
- Clean URL structure
- Proper canonical tags

## Measuring Success

Track these metrics monthly:

- Organic sessions and click-through rate
- Keyword position changes for target terms
- Referring domains acquired
- Core Web Vitals scores

## Next Steps

Start with a **content audit** of your top 20 pages. Identify which ones are closest to page-one rankings and prioritize those for optimization — the fastest wins come from pages already within striking distance.`,
    checklist: [
      { label: "Primary keyword in title tag", done: true },
      { label: "Meta description under 160 characters", done: true },
      { label: "Exactly one H1 tag on the page", done: true },
      { label: "At least 3 internal links included", done: false },
      { label: "Images have descriptive alt text", done: false },
    ],
  }
}

type MockFn = (slug: string, inputs: Record<string, string>) => GeneratorResult | AnalyzerResult | ResearchResult | OutreachResult | CodeResult | WriterResult

const mockGenerators: Record<string, MockFn> = {
  generator: mockGenerator,
  analyzer: mockAnalyzer,
  research: mockResearch,
  outreach: mockOutreach,
  code: mockCode,
  writer: mockWriter,
}

/**
 * Static sample content for a tool. Pure and synchronous — returns fixed
 * demo output so the output screens render their full design. It does NOT
 * process user input and is not triggered by any user action.
 */
export function sampleResult(moduleKey: ModuleKey, slug: string): RunToolResponse {
  const tool = getTool(moduleKey, slug)
  const pattern = tool?.pattern ?? "analyzer"
  const generate = mockGenerators[pattern] ?? mockAnalyzer
  const output = generate(slug, {})
  return { pattern, output }
}
