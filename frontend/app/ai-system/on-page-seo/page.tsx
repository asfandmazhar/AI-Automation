"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
import {
  Search,
  PenLine,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Copy,
  Download,
  Sparkles,
  ChevronDown,
  Plus,
  History,
  Globe,
  FileText,
  Telescope,
  Loader2,
  Check,
  HelpCircle,
  Trash2,
  X,
  Tags,
  BarChart3,
  Link2,
  Type,
  Hash,
  BookOpen,
  Target,
} from "lucide-react";
import DashboardShell from "@/components/layout/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  type CountryCode,
  type KeywordIdea,
  type KeywordResearchResult,
  type KeywordAIAnalysis,
} from "@/lib/keyword-research";
import axios from "axios";
import { WriterOutput } from "@/components/ai/outputs/writer-output";
import { KeywordInput } from "@/components/ai/keyword-research/keyword-input";
import { KeywordReport } from "@/components/ai/keyword-research/keyword-report";
import { cn } from "@/lib/utils";

const API = process.env.NEXT_PUBLIC_API_URL;

function authHeaders() {
  return { headers: { Authorization: `Bearer ${Cookies.get("access_token")}` } };
}

function getWebsiteId(): string {
  try {
    const raw = Cookies.get("selected_website");
    if (raw) return JSON.parse(raw)._id;
  } catch {}
  return "";
}

interface MetaData {
  title: string;
  description: string;
  slug: string;
  canonical: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  schema: string;
}

interface ContentRecord {
  _id: string;
  title: string;
  mode: string;
  input: {
    topic: string;
    keywords: string[];
    tone: string;
    length: string;
    customLength: number | null;
    url: string;
    pastedContent: string;
  };
  content: {
    markdown: string;
    checklist: { label: string; done: boolean }[];
  };
  humanize: {
    isHumanized: boolean;
    humanizedContent: string;
    analysis: {
      humanScore: number;
      aiScore: number;
      sentenceStructure: number;
      readability: number;
      humanWritten: number;
      mixed: number;
      aiGenerated: number;
    };
  };
  meta?: MetaData;
  status: string;
  createdAt: string;
}

function computeContentStats(markdown: string, keywords: string[]) {
  const text = markdown.replace(/^#+\s.*$/gm, "").replace(/[#*_`~\[\]()>!|-]/g, "");
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 5);
  const avgSentenceLen = sentences.length > 0 ? Math.round(sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / sentences.length) : 0;
  const readingTime = Math.max(1, Math.round(wordCount / 238));
  const h2Count = (markdown.match(/^##\s+/gm) || []).length;
  const h3Count = (markdown.match(/^###\s+/gm) || []).length;
  const paragraphs = markdown.split(/\n\n+/).filter((p) => !p.startsWith("#") && p.trim().length > 0);
  const linkCount = (markdown.match(/\[.*?\]\(.*?\)/g) || []).length;
  const imageCount = (markdown.match(/!\[.*?\]\(.*?\)/g) || []).length;

  const densities: { keyword: string; count: number; density: number }[] = [];
  const lower = text.toLowerCase();
  for (const kw of keywords) {
    if (!kw) continue;
    const escaped = kw.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const count = (lower.match(new RegExp(escaped, "gi")) || []).length;
    const density = wordCount > 0 ? Math.round((count / wordCount) * 1000) / 10 : 0;
    densities.push({ keyword: kw, count, density });
  }

  let grade = "A+";
  let score = 100;
  if (avgSentenceLen > 25) { score -= 15; }
  else if (avgSentenceLen > 20) { score -= 5; }
  if (h2Count < 2) score -= 10;
  if (paragraphs.some((p) => p.split(/\s+/).length > 200)) score -= 10;
  if (densities.length > 0 && densities[0]) {
    if (densities[0].density < 0.8 || densities[0].density > 2.5) score -= 15;
  }
  if (linkCount === 0) score -= 5;
  if (score >= 90) grade = "A+";
  else if (score >= 80) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 60) grade = "C";
  else grade = "D";

  return { wordCount, sentences: sentences.length, avgSentenceLen, readingTime, h2Count, h3Count, paragraphs: paragraphs.length, linkCount, imageCount, densities, score, grade };
}

/* ─────────────────────────────────────────────────────────────
   ON-PAGE SEO — two modules:
     1) Keyword Research   → research dashboard (DataForSEO API)
     2) Content Creation   → human-style SEO content writing
   ───────────────────────────────────────────────────────────── */

type View = "home" | "keyword-research" | "content-creation";

const MODULES: {
  view: Exclude<View, "home">;
  icon: typeof Search;
  title: string;
  tagline: string;
  blurb: string;
}[] = [
  {
    view: "keyword-research",
    icon: Search,
    title: "Keyword Research",
    tagline: "Find the right keywords",
    blurb:
      "Enter a topic and get a full research report — difficulty, volume, intent, SERP analysis and hundreds of keyword ideas.",
  },
  {
    view: "content-creation",
    icon: PenLine,
    title: "Content Creation",
    tagline: "Write human, rank higher",
    blurb:
      "Give a topic and a target keyword and get a full, natural-sounding article structured and optimised for search.",
  },
];

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase());
}

/* small dropdown field */
function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <label className="flex flex-1 flex-col gap-1.5">
      <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full cursor-pointer appearance-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3.5 pr-9 text-sm text-[color:var(--foreground)] transition-colors focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
        >
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
      </div>
    </label>
  );
}

function ModuleHeader({
  icon: Icon,
  title,
  subtitle,
  onBack,
}: {
  icon: typeof Search;
  title: string;
  subtitle: string;
  onBack: () => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={onBack}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer"
        aria-label="Back to modules"
      >
        <ArrowLeft className="h-4 w-4" />
      </button>
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--primary)]/15 to-[color:var(--primary)]/5">
        <Icon className="h-5 w-5 text-[color:var(--primary)]" />
      </div>
      <div className="min-w-0">
        <h2 className="truncate text-lg font-bold text-[color:var(--foreground)]">
          {title}
        </h2>
        <p className="truncate text-xs text-[color:var(--muted-foreground)]">
          {subtitle}
        </p>
      </div>
    </div>
  );
}

/* ── Module 1: Keyword Research ── */
function KeywordResearch({
  onBack,
  onSendToContent,
}: {
  onBack: () => void;
  onSendToContent: (ideas: KeywordIdea[], seed?: string) => void;
}) {
  const [text, setText] = useState("");
  const [country, setCountry] = useState<CountryCode>("US");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<KeywordResearchResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<KeywordAIAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const updatedLabel = result
    ? "Updated " + new Date(result.updatedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
    : undefined;

  async function handleSubmit(seed: string) {
    if (!seed.trim()) return;
    setLoading(true);
    setAiAnalysis(null);
    try {
      const res = await axios.post(`${API}/keywords/research`, { seed, country }, authHeaders());
      if (res.data.success) {
        setResult(res.data.data);
      } else {
        toast.error(res.data.message || "Keyword research failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Keyword research failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleAnalyzeAI() {
    if (!result) return;
    setAiLoading(true);
    try {
      const allIdeas = [
        ...result.ideas.broad,
        ...result.ideas.phrase,
        ...result.ideas.exact,
        ...result.ideas.related,
        ...result.ideas.questions,
      ].map(({ id, keyword, volume, difficulty, cpc, intent, competitiveDensity, matchType, wordCount, trendDir }) => ({
        id, keyword, volume, difficulty, cpc, intent, competitiveDensity, matchType, wordCount, trendDir,
      }));

      const res = await axios.post(
        `${API}/keywords/ai-analyze`,
        {
          websiteId: getWebsiteId(),
          seed: result.seed,
          overview: result.overview,
          ideas: allIdeas,
          serpAnalysis: result.serpAnalysis.map(({ position, domain, domainAuthority, referringDomains }) => ({
            position, domain, domainAuthority, referringDomains,
          })),
          clusters: result.clusters,
        },
        authHeaders(),
      );

      if (res.data.success) {
        setAiAnalysis(res.data.data);
      } else {
        toast.error(res.data.message || "AI analysis failed");
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || "AI analysis failed");
    } finally {
      setAiLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <ModuleHeader
        icon={Search}
        title="Keyword Research"
        subtitle="A full research report for any keyword"
        onBack={onBack}
      />

      <div className="sticky top-0 z-20 -mx-1 bg-[color:var(--background)]/90 px-1 pb-3 pt-1 backdrop-blur">
        <KeywordInput
          value={text}
          onChange={setText}
          country={country}
          onCountryChange={setCountry}
          onSubmit={handleSubmit}
          loading={loading}
          hasResults={!!result}
          updatedLabel={updatedLabel}
        />
      </div>

      {result && (
        <KeywordReport
          result={result}
          onSendToContent={(ideas) => onSendToContent(ideas, result.seed)}
          onRescope={setCountry}
          aiAnalysis={aiAnalysis}
          aiLoading={aiLoading}
          onAnalyzeAI={handleAnalyzeAI}
        />
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Content Creation — static design build (front-end only).
   Flow: input (standard + advanced) → content (draft + refine +
   humanize) → Deep Analysis → Fix all issues → View result.
   Nothing calls a backend; all content is fixed sample data.
   ───────────────────────────────────────────────────────────── */

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? "s" : ""} ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/* pink status bar with a red end marker (Deep Analysis cards) */
function ScoreBar({ pct }: { pct: number }) {
  const w = Math.min(99, Math.max(6, pct));
  return (
    <div className="relative mt-3 h-2 w-full rounded-full bg-[color:var(--muted)]">
      <div
        className="h-full rounded-full bg-[color:var(--primary)]"
        style={{ width: `${w}%` }}
      />
      <span
        className="absolute top-1/2 h-3 w-[3px] -translate-y-1/2 rounded-full bg-[color:var(--primary)]"
        style={{ left: `calc(${w}% - 1px)` }}
      />
    </div>
  );
}

function ReadabilityWave() {
  return (
    <svg viewBox="0 0 220 40" className="h-10 w-40 shrink-0" aria-hidden>
      <path
        d="M2 20 q 12 -16 24 0 t 24 0 t 24 0"
        fill="none"
        stroke="#f0a020"
        strokeWidth={4}
        strokeLinecap="round"
      />
      <path
        d="M98 20 q 12 -16 24 0 t 24 0 t 24 0"
        fill="none"
        stroke="#d4d4d8"
        strokeWidth={4}
        strokeLinecap="round"
      />
    </svg>
  );
}

function AnalysisCard({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4 shadow-sm md:p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[color:var(--foreground)]">
          {title}
        </span>
        <HelpCircle className="h-4 w-4 text-[color:var(--muted-foreground)]/50" />
      </div>
      {children}
    </div>
  );
}

function BreakdownRow({
  dot,
  label,
  value,
}: {
  dot: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-[color:var(--foreground)]">
        <span
          className="h-2 w-2 rounded-full"
          style={{ backgroundColor: dot }}
        />
        {label}
      </span>
      <span className="font-semibold tabular-nums text-[color:var(--foreground)]">
        {value}
      </span>
    </div>
  );
}

/* Deep Analysis report */
function DeepAnalysis({
  analysis,
  onFix,
  fixing,
}: {
  analysis: ContentRecord["humanize"]["analysis"];
  onFix: () => void;
  fixing: boolean;
}) {
  const structureLabel =
    analysis.sentenceStructure < 30
      ? "Critical"
      : analysis.sentenceStructure < 60
        ? "Needs work"
        : "Good";

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
        <AnalysisCard title="Human score" className="md:row-span-2">
          <div className="mt-2 flex items-end gap-0.5">
            <span className="text-5xl font-bold leading-none text-[color:var(--foreground)]">
              {analysis.humanScore}
            </span>
            <span className="mb-1 text-lg text-[color:var(--muted-foreground)]">
              %
            </span>
          </div>
          <ScoreBar pct={analysis.humanScore} />
          <div className="mt-auto space-y-3 border-t border-[color:var(--border)] pt-4 text-sm">
            <BreakdownRow dot="#22c55e" label="Human written" value={String(analysis.humanWritten)} />
            <BreakdownRow dot="#f59e0b" label="Mixed" value={String(analysis.mixed)} />
            <BreakdownRow dot="#ef4444" label="AI Generated phrasing" value={String(analysis.aiGenerated)} />
          </div>
        </AnalysisCard>

        <AnalysisCard title="AI score">
          <div className="mt-2 flex items-center gap-3">
            <div className="flex items-end gap-0.5">
              <span className="text-4xl font-bold leading-none text-[color:var(--foreground)]">
                {analysis.aiScore}
              </span>
              <span className="mb-0.5 text-base text-[color:var(--muted-foreground)]">
                %
              </span>
            </div>
            <div className="relative h-2 flex-1 rounded-full bg-[color:var(--muted)]">
              <div className="h-full rounded-full bg-[color:var(--primary)]" style={{ width: `${Math.min(analysis.aiScore, 100)}%` }} />
            </div>
          </div>
        </AnalysisCard>

        <AnalysisCard title="Sentence structure">
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-end gap-0.5">
              <span className="text-4xl font-bold leading-none text-[color:var(--foreground)]">
                {analysis.sentenceStructure}
              </span>
              <span className="mb-0.5 text-base text-[color:var(--muted-foreground)]">
                %
              </span>
            </div>
            <span className="rounded-md bg-[#9333ea]/12 px-2 py-0.5 text-xs font-medium text-[#9333ea]">
              {structureLabel}
            </span>
          </div>
        </AnalysisCard>

        <AnalysisCard title="Readability" className="md:col-span-2">
          <div className="mt-2 flex items-center justify-between gap-4">
            <div className="flex items-end gap-0.5">
              <span className="text-4xl font-bold leading-none text-[color:var(--foreground)]">
                {analysis.readability}
              </span>
              <span className="mb-0.5 text-base text-[color:var(--muted-foreground)]">
                %
              </span>
            </div>
            <ReadabilityWave />
          </div>
        </AnalysisCard>
      </div>

      {analysis.aiScore > 50 && (
        <div className="flex gap-2">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--primary)]" />
          <p className="text-sm leading-relaxed text-[color:var(--muted-foreground)]">
            <span className="font-semibold text-[color:var(--foreground)]">
              Your text shows AI-like patterns,
            </span>{" "}
            repetitive phrasing, and uneven rhythm. Humanizing will rewrite
            flagged passages to sound natural and pass AI detection.
          </p>
        </div>
      )}

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onFix}
          disabled={fixing}
          className="inline-flex items-center gap-2 rounded-full bg-[color:var(--foreground)] px-5 py-2.5 text-sm font-semibold text-[color:var(--background)] transition hover:opacity-90 cursor-pointer disabled:opacity-50"
        >
          {fixing && <Loader2 className="h-4 w-4 animate-spin" />}
          {fixing ? "Humanizing…" : "Fix all issues"}
        </button>
      </div>
    </div>
  );
}

/* blurred placeholder used by the generating / ready states */
function BlurredBox() {
  return (
    <div className="rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5">
      <div className="space-y-2.5 select-none blur-[3px]">
        <div className="h-3 w-[92%] rounded bg-[color:var(--muted)]" />
        <div className="h-3 w-[85%] rounded bg-[color:var(--muted)]" />
        <div className="h-3 w-[60%] rounded bg-[color:var(--muted)]" />
        <div className="h-3 w-[78%] rounded bg-[color:var(--muted)]" />
        <div className="h-3 w-[40%] rounded bg-[color:var(--muted)]" />
      </div>
    </div>
  );
}

/* Humanize sub-flow: analysis → humanizing → result */
function HumanizeFlow({
  contentId,
  onBack,
  onHumanized,
}: {
  contentId: string;
  onBack: () => void;
  onHumanized: (humanizedContent: string, analysis: ContentRecord["humanize"]["analysis"]) => void;
}) {
  const [stage, setStage] = useState<"loading" | "analysis" | "humanizing" | "result">("loading");
  const [analysis, setAnalysis] = useState<ContentRecord["humanize"]["analysis"]>({
    humanScore: 0, aiScore: 0, sentenceStructure: 0, readability: 0, humanWritten: 0, mixed: 0, aiGenerated: 0,
  });
  const [beforeAnalysis, setBeforeAnalysis] = useState<ContentRecord["humanize"]["analysis"] | null>(null);
  const [humanizedContent, setHumanizedContent] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const websiteId = getWebsiteId();
    if (!websiteId || !contentId) return;
    (async () => {
      try {
        const res = await fetch(`${API}/content/analyze`, {
          method: "POST",
          ...authHeaders(),
          headers: { ...authHeaders().headers, "Content-Type": "application/json" },
          body: JSON.stringify({ contentId, websiteId }),
        });
        const data = await res.json();
        if (data.success && data.analysis) {
          setAnalysis(data.analysis);
          setBeforeAnalysis(data.analysis);
          setStage("analysis");
        } else {
          toast.error(data.message || "Analysis failed");
          onBack();
        }
      } catch {
        toast.error("Failed to analyze content");
        onBack();
      }
    })();
  }, [contentId]);

  async function handleFix() {
    setStage("humanizing");
    const websiteId = getWebsiteId();
    try {
      const res = await fetch(`${API}/content/humanize`, {
        method: "POST",
        ...authHeaders(),
        headers: { ...authHeaders().headers, "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, websiteId }),
      });
      const data = await res.json();
      if (data.success) {
        setHumanizedContent(data.humanizedContent);
        if (data.analysis) setAnalysis(data.analysis);
        onHumanized(data.humanizedContent, data.analysis || analysis);
        setStage("result");
      } else {
        toast.error(data.message || "Humanization failed");
        setStage("analysis");
      }
    } catch {
      toast.error("Failed to humanize content");
      setStage("analysis");
    }
  }

  function copy() {
    navigator.clipboard?.writeText(humanizedContent);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  const metrics = beforeAnalysis
    ? [
        { label: "Human score", before: `${beforeAnalysis.humanScore}%`, after: `${analysis.humanScore}%` },
        { label: "AI score", before: `${beforeAnalysis.aiScore}%`, after: `${analysis.aiScore}%` },
        { label: "Sentence structure", before: `${beforeAnalysis.sentenceStructure}%`, after: `${analysis.sentenceStructure}%` },
        { label: "Readability", before: `${beforeAnalysis.readability}%`, after: `${analysis.readability}%` },
      ]
    : [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-sm text-[color:var(--muted-foreground)] transition-colors hover:text-[color:var(--foreground)] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" /> Back to content
        </button>
        <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <Telescope className="h-4 w-4" /> Deep Analysis report
        </div>
      </div>

      {stage === "loading" && (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-[color:var(--muted-foreground)]">
          <Loader2 className="h-4 w-4 animate-spin" /> Analyzing your content…
        </div>
      )}

      {stage === "analysis" && (
        <DeepAnalysis analysis={analysis} onFix={handleFix} fixing={false} />
      )}

      {stage === "humanizing" && (
        <div className="space-y-3">
          <DeepAnalysis analysis={analysis} onFix={() => {}} fixing={true} />
          <div className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
            <Loader2 className="h-4 w-4 animate-spin" /> Humanizing your content…
          </div>
          <BlurredBox />
        </div>
      )}

      {stage === "result" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[color:var(--primary)]" />
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Your content is now {analysis.humanScore}% human
              </p>
            </div>
            <p className="mt-1 text-xs leading-relaxed text-[color:var(--muted-foreground)]">
              Rewrote AI-generated passages, evened out the rhythm, and lifted
              readability — the tone now reads naturally and should pass AI
              detection.
            </p>
            {metrics.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {metrics.map((m) => (
                  <div key={m.label} className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-2.5">
                    <p className="truncate text-[10px] uppercase tracking-wide text-[color:var(--muted-foreground)]">
                      {m.label}
                    </p>
                    <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[color:var(--foreground)]">
                      <span className="text-[color:var(--muted-foreground)] line-through">{m.before}</span>
                      <ArrowRight className="h-3 w-3 text-[color:var(--primary)]" />
                      <span>{m.after}</span>
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-[color:var(--foreground)]">Humanized result</p>
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] cursor-pointer"
            >
              {copied ? (
                <><Check className="h-3.5 w-3.5 text-green-500" /> Copied</>
              ) : (
                <><Copy className="h-3.5 w-3.5" /> Copy</>
              )}
            </button>
          </div>
          <div className="whitespace-pre-wrap rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-sm leading-relaxed text-[color:var(--foreground)]">
            {humanizedContent}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Module 2: Content Creation ── */
function ContentCreation({
  onBack,
  initialTopic = "",
  initialKeywords = [],
}: {
  onBack: () => void;
  initialTopic?: string;
  initialKeywords?: string[];
}) {
  const [stage, setStage] = useState<"input" | "generating" | "content" | "humanize">("input");
  const [topic, setTopic] = useState(initialTopic);
  const [keywords, setKeywords] = useState<string[]>(initialKeywords.length > 0 ? initialKeywords : []);
  const [kwInput, setKwInput] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium (800-1200)");
  const [customLength, setCustomLength] = useState("");
  const [url, setUrl] = useState("");
  const [pasted, setPasted] = useState("");
  const [refine, setRefine] = useState("");
  const [refining, setRefining] = useState(false);
  const [histOpen, setHistOpen] = useState(false);
  const [history, setHistory] = useState<{ _id: string; title: string; createdAt: string }[]>([]);
  const [copied, setCopied] = useState(false);
  const [record, setRecord] = useState<ContentRecord | null>(null);
  const [metaLoading, setMetaLoading] = useState(false);
  const [showMeta, setShowMeta] = useState(false);
  const [metaCopied, setMetaCopied] = useState("");

  const loadHistory = useCallback(async () => {
    const websiteId = getWebsiteId();
    if (!websiteId) return;
    try {
      const res = await fetch(`${API}/content/history?websiteId=${websiteId}&limit=20`, authHeaders());
      const data = await res.json();
      if (data.success) setHistory(data.contents || []);
    } catch {}
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  useEffect(() => {
    const handler = () => loadHistory();
    window.addEventListener("website-changed", handler);
    return () => window.removeEventListener("website-changed", handler);
  }, [loadHistory]);

  async function handleGenerate() {
    const websiteId = getWebsiteId();
    if (!websiteId) { toast.error("Please select a website first"); return; }
    if (!topic.trim()) { toast.error("Please enter a topic or title"); return; }

    setStage("generating");
    try {
      const res = await fetch(`${API}/content/generate`, {
        method: "POST",
        ...authHeaders(),
        headers: { ...authHeaders().headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          websiteId,
          topic: topic.trim(),
          keywords: keywords.map((k) => k.trim()).filter(Boolean),
          tone,
          length,
          customLength: length === "Custom" ? parseInt(customLength) || null : null,
          url: url.trim(),
          pastedContent: pasted.trim(),
        }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setRecord(data.content);
        setStage("content");
        loadHistory();
        toast.success("Content generated!");
      } else {
        toast.error(data.message || "Generation failed");
        setStage("input");
      }
    } catch {
      toast.error("Failed to generate content");
      setStage("input");
    }
  }

  async function handleRefine() {
    if (!refine.trim() || !record) return;
    const websiteId = getWebsiteId();
    if (!websiteId) return;
    setRefining(true);
    try {
      const res = await fetch(`${API}/content/refine`, {
        method: "POST",
        ...authHeaders(),
        headers: { ...authHeaders().headers, "Content-Type": "application/json" },
        body: JSON.stringify({ websiteId, contentId: record._id, prompt: refine.trim() }),
      });
      const data = await res.json();
      if (data.success && data.content) {
        setRecord(data.content);
        setRefine("");
        toast.success("Content refined!");
      } else {
        toast.error(data.message || "Refinement failed");
      }
    } catch {
      toast.error("Failed to refine content");
    } finally {
      setRefining(false);
    }
  }

  async function handleLoadHistory(id: string) {
    try {
      const res = await fetch(`${API}/content/get?contentId=${id}`, authHeaders());
      const data = await res.json();
      if (data.success && data.content) {
        setRecord(data.content);
        setTopic(data.content.input?.topic || "");
        setKeywords(data.content.input?.keywords || []);
        setStage("content");
        setShowMeta(!!data.content.meta?.title);
        setHistOpen(false);
      } else {
        toast.error(data.message || "Failed to load content");
      }
    } catch {
      toast.error("Failed to load content");
    }
  }

  async function handleDeleteHistory(id: string) {
    try {
      const res = await fetch(`${API}/content/delete?contentId=${id}`, { method: "DELETE", ...authHeaders() });
      const data = await res.json();
      if (data.success) {
        setHistory((prev) => prev.filter((x) => x._id !== id));
        if (record?._id === id) { setRecord(null); setStage("input"); }
      }
    } catch {}
  }

  function handleNew() {
    setStage("input");
    setRecord(null);
    setTopic("");
    setKeywords([]);
    setKwInput("");
    setUrl("");
    setPasted("");
    setRefine("");
    setShowMeta(false);
    setHistOpen(false);
  }

  function copy() {
    if (!record) return;
    const text = record.humanize?.isHumanized
      ? record.humanize.humanizedContent
      : record.content.markdown;
    navigator.clipboard?.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  function handleDownload() {
    if (!record) return;
    const text = record.humanize?.isHumanized
      ? record.humanize.humanizedContent
      : record.content.markdown;
    const blob = new Blob([text], { type: "text/markdown" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${record.title.replace(/[^a-z0-9]/gi, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const inputClasses =
    "h-11 w-full rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3.5 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 transition-colors focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30";

  return (
    <div className="space-y-5">
      {/* top bar: back + title + New / History */}
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0 flex-1">
          <ModuleHeader
            icon={PenLine}
            title="Content Creation"
            subtitle="Generate natural, SEO-ready content"
            onBack={onBack}
          />
        </div>
        <div className="relative flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={handleNew}
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer sm:px-2.5"
          >
            <Plus className="h-3.5 w-3.5" />{" "}
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            type="button"
            onClick={() => setHistOpen((o) => !o)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors cursor-pointer sm:px-2.5",
              histOpen
                ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]"
                : "text-[color:var(--muted-foreground)] hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]",
            )}
          >
            <History className="h-3.5 w-3.5" />{" "}
            <span className="hidden sm:inline">History</span>
          </button>
          {histOpen && (
            <>
              <div
                className="fixed inset-0 z-30"
                onClick={() => setHistOpen(false)}
              />
              <div className="absolute right-0 top-full z-40 mt-2 w-72 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-2 shadow-xl">
                <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                  Recent drafts
                </p>
                {history.length === 0 ? (
                  <p className="px-2 py-6 text-center text-xs text-[color:var(--muted-foreground)]">
                    No history yet
                  </p>
                ) : (
                  history.map((h) => (
                    <div
                      key={h._id}
                      className="group flex items-start gap-1.5 rounded-lg px-2 py-2 transition-colors hover:bg-[color:var(--muted)]"
                    >
                      <button
                        type="button"
                        onClick={() => handleLoadHistory(h._id)}
                        className="flex min-w-0 flex-1 items-start gap-2.5 text-left cursor-pointer"
                      >
                        <FileText className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--muted-foreground)]" />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm text-[color:var(--foreground)]">
                            {h.title}
                          </span>
                          <span className="block text-xs text-[color:var(--muted-foreground)]">
                            {timeAgo(h.createdAt)}
                          </span>
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(h._id)}
                        className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[color:var(--muted-foreground)] opacity-0 transition hover:bg-red-500/10 hover:text-red-500 group-hover:opacity-100 cursor-pointer"
                        aria-label={`Delete ${h.title}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* STAGE: input — standard + advanced side by side */}
      {stage === "input" && (
        <>
          {(initialTopic || initialKeywords.length > 0) && (
            <div className="flex items-center gap-2 rounded-xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 px-3 py-2 text-xs text-[color:var(--foreground)]">
              <Sparkles className="h-3.5 w-3.5 text-[color:var(--primary)]" />
              Prefilled from your selected keywords — edit anything, then
              generate.
            </div>
          )}

          <Card className="flex flex-col gap-5">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[color:var(--primary)]/10">
                <PenLine className="h-4 w-4 text-[color:var(--primary)]" />
              </span>
              <div>
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  Content Creation
                </p>
                <p className="text-xs text-[color:var(--muted-foreground)]">
                  Generate natural, SEO-ready content
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              {/* Left column — core fields */}
              <div className="flex flex-col gap-4">
                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Topic or title
                  </span>
                  <input
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g. 10 Best Running Shoes for Beginners"
                    className={inputClasses}
                  />
                </label>

                <div className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Target keywords
                  </span>
                  <div className={cn("flex min-h-[44px] flex-wrap items-center gap-1.5 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-2.5 py-1.5 transition-colors focus-within:border-[color:var(--primary)] focus-within:ring-2 focus-within:ring-[color:var(--primary)]/30", keywords.length > 0 && "pb-2")}>
                    {keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1 rounded-lg bg-[color:var(--primary)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--primary)]"
                      >
                        {kw}
                        <button
                          type="button"
                          onClick={() => setKeywords((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full transition-colors hover:bg-[color:var(--primary)]/20 cursor-pointer"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    ))}
                    <input
                      value={kwInput}
                      onChange={(e) => setKwInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.key === "Enter" || e.key === ",") && kwInput.trim()) {
                          e.preventDefault();
                          const val = kwInput.trim().replace(/,+$/, "");
                          if (val && !keywords.includes(val)) setKeywords((prev) => [...prev, val]);
                          setKwInput("");
                        }
                        if (e.key === "Backspace" && !kwInput && keywords.length > 0) {
                          setKeywords((prev) => prev.slice(0, -1));
                        }
                      }}
                      placeholder={keywords.length === 0 ? "Type keyword and press Enter" : "Add more..."}
                      className="min-w-[120px] flex-1 bg-transparent py-1 text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 focus:outline-none"
                    />
                  </div>
                  <p className="text-[10px] text-[color:var(--muted-foreground)]">
                    Press Enter or comma to add. First keyword is primary.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Select
                    label="Tone"
                    value={tone}
                    onChange={setTone}
                    options={[
                      "Professional",
                      "Casual",
                      "Friendly",
                      "Authoritative",
                      "Conversational",
                    ]}
                  />
                  <Select
                    label="Length"
                    value={length}
                    onChange={setLength}
                    options={[
                      "Short (300-500)",
                      "Medium (800-1200)",
                      "Long (1500-2500)",
                      "In-depth (3000+)",
                      "Custom",
                    ]}
                  />
                </div>

                {length === "Custom" && (
                  <label className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                      Custom length (words)
                    </span>
                    <input
                      type="number"
                      min={100}
                      value={customLength}
                      onChange={(e) => setCustomLength(e.target.value)}
                      placeholder="e.g. 2000"
                      className={inputClasses}
                    />
                  </label>
                )}
              </div>

              {/* Right column — reference content (optional) */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 rounded-xl bg-[color:var(--muted)]/50 px-3 py-2">
                  <Telescope className="h-3.5 w-3.5 shrink-0 text-[color:var(--muted-foreground)]" />
                  <p className="text-[11px] text-[color:var(--muted-foreground)]">
                    <span className="font-medium text-[color:var(--foreground)]">Optional:</span>{" "}
                    Add a reference URL or paste existing content to improve. We&apos;ll research it and write something better.
                  </p>
                </div>

                <label className="flex flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Reference URL
                  </span>
                  <div className="relative">
                    <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--muted-foreground)]" />
                    <input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://competitor.com/blog-post"
                      className={cn(inputClasses, "pl-9")}
                    />
                  </div>
                  <p className="text-[10px] text-[color:var(--muted-foreground)]">
                    Competitor or your own page — we&apos;ll analyse it and write better content.
                  </p>
                </label>

                <label className="flex flex-1 flex-col gap-1.5">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">
                    Existing content to improve
                  </span>
                  <textarea
                    value={pasted}
                    onChange={(e) => setPasted(e.target.value)}
                    rows={5}
                    placeholder="Paste your existing blog post or article here to get an improved version..."
                    className="w-full flex-1 resize-none rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] px-3.5 py-2.5 text-sm leading-relaxed text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)]/60 transition-colors focus:border-[color:var(--primary)] focus:outline-none focus:ring-2 focus:ring-[color:var(--primary)]/30"
                  />
                </label>
              </div>
            </div>

            <Button
              type="button"
              onClick={() => handleGenerate()}
              className="w-full"
              size="lg"
            >
              <Sparkles className="h-4 w-4" />
              Write content
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Card>
        </>
      )}

      {/* STAGE: generating */}
      {stage === "generating" && (
        <div className="space-y-4 py-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[color:var(--primary)]/10">
              <Loader2 className="h-6 w-6 animate-spin text-[color:var(--primary)]" />
            </div>
            <p className="text-sm font-medium text-[color:var(--foreground)]">
              Writing your content…
            </p>
            <p className="text-xs text-[color:var(--muted-foreground)]">
              This may take 15–30 seconds depending on the length.
            </p>
          </div>
          <BlurredBox />
          <BlurredBox />
        </div>
      )}

      {/* STAGE: content — draft + refine + humanize */}
      {stage === "content" && record && (() => {
        const rec = record;
        const currentMd = rec.humanize?.isHumanized ? rec.humanize.humanizedContent : rec.content.markdown;
        const kws = rec.input?.keywords || keywords;
        const stats = computeContentStats(currentMd, kws);

        async function handleGenerateMeta() {
          const websiteId = getWebsiteId();
          if (!websiteId) return;
          setMetaLoading(true);
          try {
            const res = await fetch(`${API}/content/meta`, {
              method: "POST",
              ...authHeaders(),
              headers: { ...authHeaders().headers, "Content-Type": "application/json" },
              body: JSON.stringify({ contentId: rec._id, websiteId }),
            });
            const data = await res.json();
            if (data.success && data.meta) {
              setRecord((prev) => prev ? { ...prev, meta: data.meta } : prev);
              setShowMeta(true);
              toast.success("Meta data generated!");
            } else {
              toast.error(data.message || "Failed to generate meta data");
            }
          } catch {
            toast.error("Failed to generate meta data");
          } finally {
            setMetaLoading(false);
          }
        }

        function copyMeta(field: string, value: string) {
          navigator.clipboard?.writeText(value);
          setMetaCopied(field);
          window.setTimeout(() => setMetaCopied(""), 1500);
        }

        return (
        <div className="space-y-4">
          {/* Header with keywords + actions */}
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-1.5 text-sm text-[color:var(--muted-foreground)]">
              <span>Draft ready</span>
              {kws.length > 0 && (
                <>
                  <span className="mx-1">-</span>
                  {kws.map((kw, i) => (
                    <span key={i} className="inline-flex items-center gap-1 rounded-md bg-[color:var(--primary)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--primary)]">
                      <Target className="h-3 w-3" />
                      {kw}
                    </span>
                  ))}
                </>
              )}
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={copy}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition-colors hover:bg-[color:var(--muted)] cursor-pointer"
              >
                {copied ? (
                  <><Check className="h-3.5 w-3.5 text-green-500" /><span className="hidden md:flex">Copied</span></>
                ) : (
                  <><Copy className="h-3.5 w-3.5" /><span className="hidden md:flex">Copy</span></>
                )}
              </button>
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex cursor-pointer whitespace-nowrap items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-3 py-1.5 text-xs font-medium text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)]"
              >
                <Download className="h-3.5 w-3.5" />
                <span className="hidden md:flex">Download .md</span>
              </button>
            </div>
          </div>

          {/* Content stats bar */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            {([
              { label: "Words", value: String(stats.wordCount), icon: Hash, bg: "bg-[color:var(--primary)]", fg: "text-[color:var(--primary-foreground)]" },
              { label: "Read time", value: `${stats.readingTime} min`, icon: BookOpen, bg: "bg-blue-500/15", fg: "text-blue-500" },
              { label: "Headings", value: String(stats.h2Count + stats.h3Count), icon: Type, bg: "bg-amber-500/15", fg: "text-amber-500" },
              { label: "Avg sentence", value: String(stats.avgSentenceLen), icon: BarChart3, bg: "bg-green-500/15", fg: "text-green-500" },
              { label: "Links", value: String(stats.linkCount), icon: Link2, bg: "bg-violet-500/15", fg: "text-violet-500" },
              { label: "SEO score", value: stats.grade, icon: Target, bg: stats.score >= 80 ? "bg-green-500/15" : stats.score >= 60 ? "bg-amber-500/15" : "bg-red-500/15", fg: stats.score >= 80 ? "text-green-500" : stats.score >= 60 ? "text-amber-500" : "text-red-500" },
            ] as const).map((s, i) => (
              <Card key={i} className="flex items-center gap-4 p-5">
                <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("h-6 w-6", s.fg)} />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-[color:var(--muted-foreground)]">{s.label}</p>
                  <p className="text-2xl font-bold text-[color:var(--foreground)]">{s.value}</p>
                </div>
              </Card>
            ))}
          </div>

          {/* Keyword density breakdown */}
          {stats.densities.length > 0 && (
            <div className="rounded-xl border border-[color:var(--border)] bg-[color:var(--card)] p-3">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">Keyword density</p>
              <div className="space-y-2">
                {stats.densities.map((d, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className={cn("shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase", i === 0 ? "bg-[color:var(--primary)]/10 text-[color:var(--primary)]" : "bg-[color:var(--muted)] text-[color:var(--muted-foreground)]")}>
                      {i === 0 ? "Primary" : "Secondary"}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-[color:var(--foreground)]">{d.keyword}</span>
                    <div className="flex items-center gap-2">
                      <div className="hidden h-1.5 w-24 rounded-full bg-[color:var(--muted)] sm:block">
                        <div className={cn("h-full rounded-full", d.density >= 0.8 && d.density <= 2.5 ? "bg-green-500" : d.density > 0 ? "bg-amber-500" : "bg-red-500")} style={{ width: `${Math.min(d.density * 40, 100)}%` }} />
                      </div>
                      <span className="w-16 text-right text-xs font-medium tabular-nums text-[color:var(--foreground)]">{d.density}% ({d.count}x)</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <WriterOutput
            markdown={currentMd}
            checklist={rec.content.checklist}
          />

          {/* Generate Meta Data / Meta display */}
          {!showMeta && !rec.meta?.title && (
            <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-[color:var(--foreground)]">
                <Tags className="h-4 w-4 text-[color:var(--primary)]" />
                Generate SEO meta data — title, description, URL slug, Open Graph & Twitter cards.
              </div>
              <Button
                type="button"
                onClick={handleGenerateMeta}
                disabled={metaLoading}
                className="shrink-0 cursor-pointer"
              >
                {metaLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {metaLoading ? "Generating..." : "Generate Meta Data"}
              </Button>
            </div>
          )}

          {(showMeta || rec.meta?.title) && rec.meta && (
            <div className="space-y-3 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Tags className="h-4 w-4 text-blue-500" />
                  <p className="text-sm font-semibold text-[color:var(--foreground)]">SEO Meta Data</p>
                </div>
                <button
                  type="button"
                  onClick={handleGenerateMeta}
                  disabled={metaLoading}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-[color:var(--border)] px-2.5 py-1 text-[11px] font-medium text-[color:var(--muted-foreground)] transition-colors hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] cursor-pointer disabled:opacity-50"
                >
                  {metaLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  Regenerate
                </button>
              </div>

              {[
                { key: "title", label: "Meta Title", value: rec.meta.title, limit: "50-60 chars", len: rec.meta.title.length },
                { key: "description", label: "Meta Description", value: rec.meta.description, limit: "150-160 chars", len: rec.meta.description.length },
                { key: "slug", label: "URL Slug", value: rec.meta.slug },
                { key: "canonical", label: "Canonical URL", value: rec.meta.canonical },
                { key: "ogTitle", label: "OG Title", value: rec.meta.ogTitle },
                { key: "ogDescription", label: "OG Description", value: rec.meta.ogDescription },
                { key: "twitterTitle", label: "Twitter Title", value: rec.meta.twitterTitle },
                { key: "twitterDescription", label: "Twitter Description", value: rec.meta.twitterDescription },
              ].map((item) => (
                <div key={item.key} className="group flex items-start gap-3 rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">{item.label}</p>
                      {item.limit && (
                        <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-medium", item.len && item.len >= parseInt(item.limit) && item.len <= parseInt(item.limit.split("-")[1] || "999") ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600")}>
                          {item.len} / {item.limit}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm leading-relaxed text-[color:var(--foreground)]">{item.value || "-"}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyMeta(item.key, item.value)}
                    className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[color:var(--muted-foreground)] opacity-0 transition hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] group-hover:opacity-100 cursor-pointer"
                  >
                    {metaCopied === item.key ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                  </button>
                </div>
              ))}

              {rec.meta.schema && (
                <div className="group rounded-xl border border-[color:var(--border)] bg-[color:var(--background)] p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--muted-foreground)]">JSON-LD Schema</p>
                    <button
                      type="button"
                      onClick={() => copyMeta("schema", rec.meta?.schema || "")}
                      className="flex h-7 w-7 items-center justify-center rounded-md text-[color:var(--muted-foreground)] opacity-0 transition hover:bg-[color:var(--muted)] hover:text-[color:var(--foreground)] group-hover:opacity-100 cursor-pointer"
                    >
                      {metaCopied === "schema" ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                  <pre className="mt-2 max-h-40 overflow-auto rounded-lg bg-[color:var(--muted)] p-3 text-xs text-[color:var(--foreground)]">
                    {(() => { try { return JSON.stringify(JSON.parse(rec.meta.schema), null, 2); } catch { return rec.meta.schema; } })()}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* humanize CTA */}
          {!rec.humanize?.isHumanized && (
            <div className="flex flex-col gap-3 rounded-2xl border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm text-[color:var(--foreground)]">
                <Telescope className="h-4 w-4 text-[color:var(--primary)]" />
                Make it sound human & pass AI detection.
              </div>
              <button
                type="button"
                onClick={() => setStage("humanize")}
                className="inline-flex items-center justify-center gap-1.5 rounded-full bg-[color:var(--primary)] px-4 py-2 text-sm font-semibold text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" /> Humanize
              </button>
            </div>
          )}

          {rec.humanize?.isHumanized && (
            <div className="flex items-center gap-2 rounded-xl border border-green-500/30 bg-green-500/5 px-3 py-2 text-xs text-[color:var(--foreground)]">
              <Check className="h-3.5 w-3.5 text-green-500" />
              Content has been humanized - showing the humanized version above.
            </div>
          )}

          {/* refine prompt */}
          <div className="flex items-center gap-2 rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] py-2 pl-4 pr-2">
            <input
              value={refine}
              onChange={(e) => setRefine(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleRefine(); } }}
              placeholder="Ask for a change - e.g. make the intro shorter, add an FAQ section..."
              className="flex-1 bg-transparent text-sm text-[color:var(--foreground)] placeholder:text-[color:var(--muted-foreground)] focus:outline-none"
              disabled={refining}
            />
            <button
              type="button"
              onClick={handleRefine}
              disabled={refining || !refine.trim()}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--primary)] text-[color:var(--primary-foreground)] transition-opacity hover:opacity-90 cursor-pointer disabled:opacity-50"
              aria-label="Send"
            >
              {refining ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowUp className="h-4 w-4" />}
            </button>
          </div>
        </div>
        );
      })()}

      {/* STAGE: humanize */}
      {stage === "humanize" && record && (
        <HumanizeFlow
          contentId={record._id}
          onBack={() => setStage("content")}
          onHumanized={(humanizedContent, newAnalysis) => {
            setRecord((prev) =>
              prev
                ? {
                    ...prev,
                    humanize: {
                      isHumanized: true,
                      humanizedContent,
                      analysis: newAnalysis,
                    },
                  }
                : prev,
            );
          }}
        />
      )}
    </div>
  );
}

/* ── Landing ── */
function Home({ onPick }: { onPick: (v: Exclude<View, "home">) => void }) {
  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-col justify-center py-10">
      <div className="text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[color:var(--primary)] to-[color:var(--primary)]/80 shadow-lg shadow-[color:var(--primary)]/25">
          <Sparkles className="h-6 w-6 text-[color:var(--primary-foreground)]" />
        </div>
        <h1 className="mt-4 text-2xl font-bold text-[color:var(--foreground)]">
          On-Page SEO
        </h1>
        <p className="mt-1.5 text-sm text-[color:var(--muted-foreground)]">
          Two things, done well — research your keywords, then create the
          content.
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <button
            key={m.view}
            type="button"
            onClick={() => onPick(m.view)}
            className="group flex flex-col rounded-2xl border border-[color:var(--border)] bg-[color:var(--card)] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-[color:var(--primary)]/40 hover:shadow-lg hover:shadow-[color:var(--primary)]/5 cursor-pointer"
          >
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--primary)]/15 to-[color:var(--primary)]/5 transition-all group-hover:from-[color:var(--primary)]/25 group-hover:to-[color:var(--primary)]/10">
              <m.icon className="h-5 w-5 text-[color:var(--primary)]" />
            </div>
            <p className="mt-4 text-base font-semibold text-[color:var(--foreground)]">
              {m.title}
            </p>
            <p className="mt-0.5 text-xs font-medium text-[color:var(--primary)]">
              {m.tagline}
            </p>
            <p className="mt-2 text-[13px] leading-relaxed text-[color:var(--muted-foreground)]">
              {m.blurb}
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[color:var(--foreground)]">
              Open
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function OnPageSeoPage() {
  const [view, setView] = useState<View>("home");
  const [prefill, setPrefill] = useState<{
    topic: string;
    keywords: string[];
    nonce: number;
  }>({ topic: "", keywords: [], nonce: 0 });
  const scrollRef = useRef<HTMLDivElement>(null);

  const goHome = useCallback(() => setView("home"), []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0 });
  }, [view]);

  const handleSendToContent = useCallback((ideas: KeywordIdea[], seed?: string) => {
    if (!ideas.length) return;
    const kws = ideas.map((i) => i.keyword);
    const topic = seed ? titleCase(seed) : titleCase(ideas[0].keyword);
    setPrefill((p) => ({ topic, keywords: kws, nonce: p.nonce + 1 }));
    setView("content-creation");
  }, []);

  return (
    <DashboardShell>
      <div
        ref={scrollRef}
        className={cn(
          "min-h-full px-1 py-2",
          view === "keyword-research" ? "w-full" : "w-full",
        )}
      >
        {view === "home" && <Home onPick={setView} />}
        {view === "keyword-research" && (
          <KeywordResearch
            onBack={goHome}
            onSendToContent={handleSendToContent}
          />
        )}
        {view === "content-creation" && (
          <ContentCreation
            key={prefill.nonce}
            onBack={goHome}
            initialTopic={prefill.topic}
            initialKeywords={prefill.keywords}
          />
        )}
      </div>
    </DashboardShell>
  );
}
