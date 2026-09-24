"use client";

import { ChangeEvent, useEffect, useMemo, useRef, useState } from "react";
import { summarizeFindings } from '@/lib/finding-summary';
import { evidenceReviewReasons } from '@/lib/evidence-review';
import { pageEvidenceSummary } from '@/lib/page-evidence-summary';
import { reviewActions } from '@/lib/review-actions';
import { crawlScopeSummary } from '@/lib/crawl-scope-summary';
import {
  BarChart3,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  ChevronDown,
  CircleDashed,
  CircleGauge,
  CircleX,
  Copy,
  Download,
  FileChartColumn,
  FileText,
  Globe2,
  Languages,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  MoreHorizontal,
  Minus,
  Plus,
  Presentation,
  RotateCcw,
  Save,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  TriangleAlert,
  Upload,
  UserCircle2,
  LogOut,
} from "lucide-react";
import {
  AUDIT_CATEGORIES,
  type AuditResults,
  calculateScore,
  getTopIssues,
} from "@/lib/audit-model";
import type { AiVisibilitySummary } from "@/lib/ai-visibility";
import { AI_VISIBILITY_METHOD_VERSION } from '@/lib/ai-evidence-policy';
import {
  geoPublicationChecks,
  geoPublicationStatus,
  hasDirectionalAiEvidence,
  percentMetric,
} from "@/lib/geo-publication-gate";
import {
  LOCALES,
  LOCALE_OPTIONS,
  detectLocale,
  getTranslator,
  type Locale,
  type Translate,
} from "@/lib/ui-i18n";
import { TR_AUDIT_TITLES, TR_SECTIONS } from "@/lib/audit-copy-tr";
import { findingGuidance } from "@/lib/finding-guidance";
import { authClient } from "@/lib/auth-client";
import type { MeasurementEvidence } from "@/lib/measurement-contract";
import { onlineScoreCheckFamily, type OnlineScorecard, type OnlineScorecards } from "@/lib/online-score";
import { findingMetric, findingSummary, scoreExclusionReason, UX_RISK_CONTROLS, type SummaryInput } from "@/lib/finding-summary";
import { MEASUREMENT_CONTRACT_VERSION } from "@/lib/measurement-contract";

type Page = "audit" | "actions" | "report" | "proposal" | "presentation" | "settings" | "qa";
type StatusFilter = "all" | "Pass" | "Partial" | "Fail" | "N/A" | "Blank";
type Score = ReturnType<typeof calculateScore>;
function findingTitle(id: string, fallback: string, t?: Translate) { return t?.locale === "tr" ? TR_AUDIT_TITLES[id] ?? fallback : fallback; }
function priorityText(value: string, t?: Translate) { const keys = {Critical:"priorityCritical",High:"priorityHigh",Medium:"priorityMedium",Low:"priorityLow"} as const; return t && value in keys ? t(keys[value as keyof typeof keys]) : value; }
type Issues = ReturnType<typeof getTopIssues>;
type Analysis = ReturnType<typeof buildClientAnalysis>;

// Single scoring engine: the number a client sees comes from the online scorecards
// (lib/online-score.ts). The legacy v1 score is never published anywhere.
function publishedOverall(score: Score, scorecards?: OnlineScorecards) {
  const online = scorecards?.overall;
  if (online) return online.score;
  return score.scoreEligible ? score.overall : null;
}

function publishedScoreLabel(score: Score, scorecards?: OnlineScorecards) {
  const overall = publishedOverall(score, scorecards);
  return overall === null ? "Score withheld: insufficient measurement" : `${overall}/100`;
}

function publishedCoveragePct(score: Score, scorecards?: OnlineScorecards) {
  return scorecards?.overall ? scorecards.overall.coveragePct : score.completionPct;
}

// The published engine has no letter grade: coverage and confidence replace it.
function publishedGradeLabel(score: Score, scorecards?: OnlineScorecards) {
  if (scorecards?.overall) return `${scorecards.overall.coveragePct}% evidence coverage`;
  return score.scoreEligible ? `Grade ${score.grade}` : "Not published";
}

function categoryTextKey(categoryId: string) {
  return (categoryId === "serp" ? "aiReadiness" : categoryId) as "technical" | "onpage" | "ux" | "cro" | "aiReadiness";
}

function onlinePillarForCategory(scorecards: OnlineScorecards | undefined, categoryId: string) {
  if (!scorecards?.pillars) return undefined;
  const key = categoryId === "serp" ? "geo" : categoryId === "onpage" ? "content" : categoryId;
  return scorecards.pillars[key as keyof NonNullable<OnlineScorecards["pillars"]>];
}

function onlinePriorityChecks(scorecards: OnlineScorecards | undefined) {
  if (!scorecards?.pillars) return [];
  const checks = Object.values(scorecards.pillars)
    .flatMap((card) => card.checks)
    // Diagnostics (scoreEligible === false) stay visible as observations, never as issues.
    .filter((check) => check.scoreEligible !== false && (check.status === "Fail" || check.status === "Partial"))
    .sort((a, b) => (a.status === b.status ? b.weight - a.weight : a.status === "Fail" ? -1 : 1));
  return [...new Map(checks.map((check) => [onlineScoreCheckFamily(check.id), check])).values()];
}

function safeHttpUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password ? parsed.href : undefined;
  } catch {
    return undefined;
  }
}

function compactUrl(value: string) {
  try {
    const parsed = new URL(value);
    const label = `${parsed.hostname}${parsed.pathname}${parsed.search}`;
    return label.length > 72 ? `${label.slice(0, 69)}…` : label;
  } catch {
    return value.length > 72 ? `${value.slice(0, 69)}…` : value;
  }
}

function categoryScoreLabel(categoryScore: Pick<Score["categories"][number], "evaluated" | "score" | "scoreEligible">) {
  if (categoryScore.scoreEligible) return `${categoryScore.score}/100`;
  return categoryScore.evaluated > 0 ? "Insufficient measurement" : "Not measured";
}

function geoPublicationSummary(aiVisibility?: AiVisibilitySummary) {
  const checks = geoPublicationChecks(aiVisibility);
  return {
    status: geoPublicationStatus(aiVisibility),
    passed: checks.filter((check) => check.done).length,
    total: checks.length,
    checks,
  };
}

type AnalysisJobResponse = {
  requestedPageLimit?: number;
  effectivePageLimit?: number;
  jobId?: string;
  status: "queued" | "running" | "completed" | "failed";
  progress: number;
  stage: string;
  result?: WebsiteScan & { results: AuditResults; notes: Record<string, string> };
  error?: string;
  errorCode?: "MONTHLY_PAGE_QUOTA_REACHED" | string;
};

type Audit = {
  id: string;
  url: string;
  clientName: string;
  industry?: string;
  clientLogo?: string;
  notes?: Record<string, string>;
  results: AuditResults;
  score: Score;
  date: string;
  scan?: WebsiteScan;
  workflow?: Record<string, FindingWorkflow>;
};

type WorkflowStatus = "Open" | "Planned" | "In progress" | "Done";
type FindingWorkflow = {
  owner: string;
  dueDate: string;
  status: WorkflowStatus;
  screenshot?: string;
  screenshotName?: string;
};

type WebsiteScan = {
  renderedPageCoverage?: import('@/lib/browser-sample').BrowserPageCoverage[];
  sitemapDiscovery?: import('@/lib/sitemap-discovery').SitemapDiscovery;
  crawlOutcomes?: import('@/lib/crawl-outcomes').CrawlOutcome[];
  requestedPageLimit?: number;
  automatedItemIds?: string[];
  checked: number;
  diagnosticCount?: number;
  creditsUsed?: number;
  finalUrl: string;
  fetchedAt: string;
  pageLimit?: number;
  warnings: string[];
  pagesAnalyzed?: number;
  renderedPagesMeasured?: number;
  renderedViewportRuns?: number;
  pages?: string[];
  measurementEvidence?: Record<string, MeasurementEvidence>;
  onlineScorecards?: OnlineScorecards;
  aiVisibility?: AiVisibilitySummary;
  aiVisibilityRuns?: AiVisibilitySummary[];
};

type WhiteLabel = {
  agencyName: string;
  agencyLogo?: string;
  contactEmail: string;
  bookingUrl: string;
  brandColor: string;
};

const AUDITS_KEY = "auditpro_audits";
const WL_KEY = "auditpro_whitelabel";
const LOCALE_KEY = "auditpro_locale";
const MAX_SCREENSHOT_BYTES = 200_000;
const MAX_SCREENSHOT_DATA_URL_LENGTH = Math.ceil(MAX_SCREENSHOT_BYTES * 1.37) + 64;
const SCREENSHOT_ACCEPT = "image/png,image/jpeg,image/webp,image/gif";
const SCREENSHOT_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);
const DEFAULT_WL: WhiteLabel = {
  agencyName: "Your Agency",
  contactEmail: "",
  bookingUrl: "",
  brandColor: "#147c73",
};

const INDUSTRY_PLAYBOOKS = [
  {
    match: ["e-commerce", "ecommerce", "retail", "shop"],
    label: "E-commerce",
    recommendations: [
      "Prioritize checkout speed, guest checkout, payment trust signals, and product schema.",
      "Track add-to-cart rate, checkout abandonment, revenue per session, and organic product clicks.",
      "Treat mobile performance and product page clarity as revenue-impacting fixes, not only UX tasks.",
    ],
  },
  {
    match: ["saas", "software", "b2b"],
    label: "SaaS / Software",
    recommendations: [
      "Prioritize demo/signup CTAs, pricing clarity, comparison pages, and high-intent content.",
      "Track trial/demo conversion rate, activation quality, organic pipeline, and branded search growth.",
      "Use case studies, integration pages, schema, and source-worthy proof to strengthen GEO and AI-search visibility.",
    ],
  },
  {
    match: ["service", "agency", "consulting", "legal", "finance", "health"],
    label: "Professional Services",
    recommendations: [
      "Prioritize trust signals, expertise proof, local/entity signals, and clear contact paths.",
      "Track form submissions, qualified calls, local visibility, and conversion rate by landing page.",
      "Strengthen author bios, case evidence, testimonials, and structured service pages.",
    ],
  },
  {
    match: ["media", "publishing", "content", "education"],
    label: "Content / Publishing",
    recommendations: [
      "Prioritize crawlability, content depth, topical clusters, author signals, and answer extraction.",
      "Track indexed pages, organic entrances, featured snippets, AI citations, and engagement depth.",
      "Refresh thin content and build internal links around commercially important topic clusters.",
    ],
  },
];

const DEFAULT_PLAYBOOK = {
  label: "General",
  recommendations: [
    "Prioritize critical blockers first, then high-impact items with low implementation effort.",
    "Track organic visibility, conversion rate, engagement quality, and issue closure rate after fixes.",
    "Retest after implementation so stakeholders can see score movement and business impact.",
  ],
};

function createId() {
  return `audit_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function CloudAccount() {
  const { data: session } = authClient.useSession();
  if (!session) return null;

  return (
    <details className="account-menu">
      <summary title={session.user.email} aria-label="Account menu">
        <UserCircle2 size={19} aria-hidden="true" />
      </summary>
      <div>
        <strong>{session.user.name}</strong>
        <span>{session.user.email}</span>
        <button
          type="button"
          onClick={() => void authClient.signOut().then(() => window.location.reload())}
        >
          <LogOut size={15} aria-hidden="true" /> Sign out
        </button>
      </div>
    </details>
  );
}

function normalizeAudit(audit: Partial<Audit>): Audit {
  const results = audit.results ?? {};
  return {
    id: audit.id ?? createId(),
    url: audit.url?.trim() || "Untitled website",
    clientName: audit.clientName?.trim() ?? "",
    industry: audit.industry ?? "",
    clientLogo: audit.clientLogo ?? "",
    notes: audit.notes ?? {},
    results,
    score: calculateScore(results, audit.scan?.measurementEvidence),
    date: audit.date ?? new Date().toISOString(),
    scan: audit.scan,
    workflow: normalizeWorkflow(audit.workflow),
  };
}

function upsertAudit(audits: Audit[], audit: Audit) {
  return audits.some((item) => item.id === audit.id)
    ? audits.map((item) => (item.id === audit.id ? audit : item))
    : [audit, ...audits];
}

function downloadJson(filename: string, data: unknown) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

function downloadText(filename: string, text: string, type = "text/plain") {
  const blob = new Blob([text], { type });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(href);
}

function csvCell(value: unknown) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function generateDemoResults(): AuditResults {
  const results: AuditResults = {};
  AUDIT_CATEGORIES.flatMap((cat) =>
    cat.sections.flatMap((section) => section.items),
  ).forEach((item, index) => {
    const n = index % 10;
    results[item.id] = n <= 5 ? "Pass" : n <= 7 ? "Partial" : n === 8 ? "Fail" : "N/A";
  });
  return results;
}

function readImage(file: File, callback: (dataUrl: string) => void) {
  const reader = new FileReader();
  reader.onload = () => callback(String(reader.result));
  reader.readAsDataURL(file);
}

function readEvidenceScreenshot(file: File, callback: (dataUrl: string) => void) {
  if (!SCREENSHOT_TYPES.has(file.type)) {
    window.alert("Please attach a PNG, JPEG, WEBP, or GIF image.");
    return;
  }
  if (file.size > MAX_SCREENSHOT_BYTES) {
    window.alert("Screenshot must be 200 KB or smaller.");
    return;
  }
  readImage(file, callback);
}

function sanitizeScreenshot(value: unknown) {
  if (typeof value !== "string" || !value) return "";
  if (!/^data:image\/(?:png|jpeg|jpg|webp|gif);base64,/i.test(value)) return "";
  return value.length <= MAX_SCREENSHOT_DATA_URL_LENGTH ? value : "";
}

function normalizeWorkflow(workflow: Record<string, FindingWorkflow> | undefined) {
  return Object.fromEntries(
    Object.entries(workflow ?? {}).map(([id, item]) => {
      const screenshot = sanitizeScreenshot(item.screenshot);
      return [
        id,
        {
          owner: item.owner ?? "",
          dueDate: item.dueDate ?? "",
          status: item.status ?? "Open",
          screenshot,
          screenshotName: screenshot ? item.screenshotName ?? "" : "",
        } satisfies FindingWorkflow,
      ];
    }),
  );
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "").padEnd(6, "0").slice(0, 6);
  return [
    parseInt(normalized.slice(0, 2), 16),
    parseInt(normalized.slice(2, 4), 16),
    parseInt(normalized.slice(4, 6), 16),
  ];
}

function getAllAuditItems(results: AuditResults) {
  return AUDIT_CATEGORIES.flatMap((cat) =>
    cat.sections.flatMap((section) =>
      section.items.map((item) => ({
        ...item,
        category: cat.label,
        categoryId: cat.id,
        categoryColor: cat.color,
        section: section.label,
        status: results[item.id],
      })),
    ),
  );
}

function explainIssue(item: { item: string; howTo: string; priority: string; category: string }) {
  const text = `${item.item} ${item.howTo}`.toLowerCase();
  if (text.includes("lcp") || text.includes("pagespeed") || text.includes("mobile page load") || text.includes("ttfb")) {
    return {
      why: "Performance problems reduce patience and make the first impression feel unreliable.",
      impact: "Slow pages usually increase bounce rate, reduce form completion, and can weaken organic visibility.",
      action: item.howTo,
    };
  }
  if (text.includes("robots") || text.includes("sitemap") || text.includes("noindex") || text.includes("canonical") || text.includes("crawl")) {
    return {
      why: "Search engines need clean crawl and indexation signals before content can reliably rank.",
      impact: "Technical SEO gaps can keep valuable pages out of search results or split ranking signals.",
      action: item.howTo,
    };
  }
  if (text.includes("cta") || text.includes("checkout") || text.includes("form") || text.includes("conversion") || text.includes("pricing")) {
    return {
      why: "Conversion friction stops qualified visitors from taking the next step.",
      impact: "Fixing this can improve lead volume or revenue without needing more traffic.",
      action: item.howTo,
    };
  }
  if (text.includes("schema") || text.includes("ai") || text.includes("overview") || text.includes("faq") || text.includes("author")) {
    return {
      why: "Structured, trustworthy content helps search engines and AI systems understand and cite the brand.",
      impact: "Weak entity and answer signals can reduce visibility in modern SERP and AI answer surfaces.",
      action: item.howTo,
    };
  }
  if (text.includes("navigation") || text.includes("accessibility") || text.includes("mobile") || text.includes("readability")) {
    return {
      why: "Usability issues make it harder for visitors to understand, trust, and complete tasks.",
      impact: "Better UX typically improves engagement, conversion rate, and perceived brand quality.",
      action: item.howTo,
    };
  }
  return {
    why: "This checkpoint affects how clearly the site communicates value and supports user decisions.",
    impact: "Leaving it unresolved can reduce trust, search performance, or conversion efficiency.",
    action: item.howTo,
  };
}

function classifyIssue(item: { item: string; priority: string; status?: string; howTo: string }) {
  const text = `${item.item} ${item.howTo}`.toLowerCase();
  const impactLevel = item.priority === "Critical" ? "High" : item.priority === "High" ? "Medium-High" : "Medium";
  const effort =
    text.includes("title") ||
    text.includes("meta") ||
    text.includes("heading") ||
    text.includes("cta") ||
    text.includes("schema") ||
    text.includes("faq") ||
    text.includes("robots") ||
    text.includes("sitemap")
      ? "Low"
      : text.includes("checkout") ||
          text.includes("navigation") ||
          text.includes("page speed") ||
          text.includes("lcp") ||
          text.includes("inp") ||
          text.includes("javascript")
        ? "Medium"
        : "Medium";
  const lane =
    effort === "Low" && (item.priority === "Critical" || item.priority === "High")
      ? "Quick win"
      : item.priority === "Critical"
        ? "Strategic fix"
        : "Backlog";
  return { effort, impactLevel, lane };
}

function getIndustryPlaybook(industry: string) {
  const value = industry.toLowerCase();
  return INDUSTRY_PLAYBOOKS.find((playbook) => playbook.match.some((term) => value.includes(term))) ?? DEFAULT_PLAYBOOK;
}

function buildClientAnalysis(score: Score, results: AuditResults, notes: Record<string, string> = {}, industry = "", scorecards?: OnlineScorecards) {
  const items = getAllAuditItems(results);
  const actionable = items.filter((item) => item.status === "Fail" || item.status === "Partial");
  const critical = actionable.filter((item) => item.priority === "Critical");
  const high = actionable.filter((item) => item.priority === "High");
  const blank = items.filter((item) => !item.status);
  const strongest = [...score.categories].filter((cat) => cat.scoreEligible).sort((a, b) => b.score - a.score)[0];
  const weakest = [...score.categories].filter((cat) => cat.scoreEligible).sort((a, b) => a.score - b.score)[0];
  const playbook = getIndustryPlaybook(industry);
  const published = publishedOverall(score, scorecards);
  const publishedCoverage = publishedCoveragePct(score, scorecards);
  const executiveSummary =
    published === null
      ? `Povlex measured ${score.totalEvaluated} verified controls. No global score is published: ${scorecards?.overall ? `evidence coverage is ${scorecards.overall.coveragePct}% of the intended contract and ${scorecards.overall.observations ?? 0} controls remain observations.` : "the minimum evidence threshold was not met in every pillar."} Category findings and their evidence remain valid and are listed below.`
      : `The site scored ${published}/100 with ${scorecards?.overall?.status === "Measured" ? "full" : "preliminary"} measurement confidence after ${score.totalEvaluated} verified controls and ${scorecards?.overall?.coveragePct ?? 0}% evidence coverage. ${
          published >= 70
            ? "The foundation is workable, with targeted improvements likely to create measurable gains."
            : published >= 50
              ? "The audit shows meaningful gaps that are likely limiting visibility, usability, and conversion performance."
              : "The audit shows substantial blockers that should be treated as a priority before scaling traffic or campaigns."
        }${weakest ? ` The biggest opportunity is ${weakest.label}.` : ""}`;
  const readiness =
    score.totalEvaluated === 0
      ? {
          label: "Not ready",
          message: "No checkpoints have been reviewed yet. Complete the audit before sending a client report.",
        }
      : published === null
        ? {
            label: "Measurement incomplete",
            message: "The available evidence supports individual findings, but not a defensible global score yet.",
          }
      : publishedCoverage < 30
        ? {
            label: "Preliminary",
            message: "This is an early diagnostic. Use it for internal scoping, not as a final client deliverable.",
          }
        : publishedCoverage < 60
          ? {
              label: "Directional",
              message: "Enough evidence exists for directional recommendations, but more review is needed for a final report.",
            }
          : publishedCoverage < 80
            ? {
                label: "Client review draft",
                message: "This can support a client conversation, with remaining gaps clearly disclosed.",
              }
            : {
                label: "Client-ready",
                message: "Coverage is strong enough for a client-ready report, assuming evidence notes are complete.",
              };

  return {
    executiveSummary,
    playbook,
    readiness,
    strongest,
    weakest,
    counts: {
      actionable: actionable.length,
      critical: critical.length,
      high: high.length,
      blank: blank.length,
    },
    categoryNarratives: score.categories.map((cat) => {
      const coverage = cat.total ? Math.round((cat.evaluated / cat.total) * 100) : 0;
      const meaning =
        cat.evaluated === 0
          ? "Not enough evidence has been collected for this category yet."
          : !cat.scoreEligible
            ? `Povlex collected ${cat.evaluated} observations. At least ${cat.minimumEvaluated} are required before this pillar can publish a score.`
          : cat.score >= 80
            ? "This area is a relative strength. Keep it maintained while improving lower-scoring categories."
            : cat.score >= 60
              ? "This area is serviceable but has visible gaps that should be worked into the next optimization cycle."
              : "This area is a priority risk. Improvements here are likely to have an outsized effect on the final result.";
      return { ...cat, coverage, meaning };
    }),
    detailedIssues: actionable
      .sort((a, b) => {
        const rank = { Critical: 4, High: 3, Medium: 2, Low: 1 };
        return (rank[b.priority as keyof typeof rank] ?? 0) - (rank[a.priority as keyof typeof rank] ?? 0);
      })
      .map((item) => ({ ...item, note: notes[item.id] ?? "", ...classifyIssue(item), ...explainIssue(item) })),
    actionPlan: [
      {
        phase: "First 30 days",
        focus: "Remove critical blockers",
        actions: critical.slice(0, 5).map((item) => item.item),
      },
      {
        phase: "Days 31-60",
        focus: "Improve high-impact SEO, UX, and conversion issues",
        actions: high.slice(0, 5).map((item) => item.item),
      },
      {
        phase: "Days 61-90",
        focus: "Retest, document gains, and refine remaining partial items",
        actions: actionable.filter((item) => item.priority !== "Critical" && item.priority !== "High").slice(0, 5).map((item) => item.item),
      },
    ],
    quickWins: actionable
      .map((item) => ({ ...item, ...classifyIssue(item) }))
      .filter((item) => item.lane === "Quick win")
      .slice(0, 8),
    strategicFixes: actionable
      .map((item) => ({ ...item, ...classifyIssue(item) }))
      .filter((item) => item.lane === "Strategic fix")
      .slice(0, 8),
  };
}

export function AuditApp({ cloudEnabled = false, aiVisibilityEnabled = false }: { cloudEnabled?: boolean; aiVisibilityEnabled?: boolean }) {
  const [audits, setAudits] = useState<Audit[]>([]);
  const [activeAuditId, setActiveAuditId] = useState<string | null>(null);
  const [activeCategoryId, setActiveCategoryId] = useState("technical");
  const [priorityFilter, setPriorityFilter] = useState<"all" | "Critical">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState<Page>("audit");
  const [auditView, setAuditView] = useState<"overview" | "findings" | "scope">("overview");
  const [detailId, setDetailId] = useState<string | null>(null);
  const detailDialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (detailId) detailDialog.current?.showModal();
    else detailDialog.current?.close();
  }, [detailId]);
  const [url, setUrl] = useState("");
  const [clientName, setClientName] = useState("");
  const [industry, setIndustry] = useState("");
  const [clientLogo, setClientLogo] = useState("");
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [results, setResults] = useState<AuditResults>({});
  const [whiteLabel, setWhiteLabel] = useState<WhiteLabel>(DEFAULT_WL);
  const [notice, setNotice] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<{ progress: number; stage: string } | null>(null);
  const [analysisError, setAnalysisError] = useState("");
  const [pageLimit, setPageLimit] = useState<5 | 25 | 250>(25);
  const [scan, setScan] = useState<WebsiteScan | undefined>();
  const [workflow, setWorkflow] = useState<Record<string, FindingWorkflow>>({});
  const [locale, setLocale] = useState<Locale>("en");
  const auditsRef = useRef<Audit[]>([]);
  const workflowRef = useRef<Record<string, FindingWorkflow>>({});

  const t = useMemo(() => getTranslator(locale), [locale]);
  const score = useMemo(() => calculateScore(results, scan?.measurementEvidence), [results, scan?.measurementEvidence]);
  const topIssues = useMemo(() => getTopIssues(results, 12), [results]);
  const analysis = useMemo(() => buildClientAnalysis(score, results, notes, industry, scan?.onlineScorecards), [score, results, notes, industry, scan?.onlineScorecards]);
  const activeCategory = AUDIT_CATEGORIES.find((cat) => cat.id === activeCategoryId) ?? AUDIT_CATEGORIES[0];
  const activeAudit = audits.find((audit) => audit.id === activeAuditId) ?? null;

  useEffect(() => {
    const saved = readJson<Audit[]>(AUDITS_KEY, []).map(normalizeAudit);
    const wl = { ...DEFAULT_WL, ...readJson<Partial<WhiteLabel>>(WL_KEY, {}) };
    setAudits(saved);
    setWhiteLabel(wl);
    const savedLocale = localStorage.getItem(LOCALE_KEY);
    const initialLocale = savedLocale && LOCALES.includes(savedLocale as Locale) ? savedLocale as Locale : detectLocale(navigator.language);
    setLocale(initialLocale);
    localStorage.setItem(LOCALE_KEY, initialLocale);
    document.documentElement.lang = initialLocale;
    document.documentElement.dir = initialLocale === "ar" ? "rtl" : "ltr";
    if (saved[0]) selectAudit(saved[0], saved);

    if (cloudEnabled) {
      void fetch("/api/audits", { cache: "no-store" })
        .then(async (response) => {
          if (!response.ok) throw new Error("Cloud audits could not be loaded.");
          return response.json() as Promise<{ audits?: Audit[] }>;
        })
        .then(({ audits: cloudAudits = [] }) => {
          const merged = [...cloudAudits.map(normalizeAudit), ...saved]
            .filter((audit, index, all) => all.findIndex((item) => item.id === audit.id) === index)
            .slice(0, 100);
          try {
            localStorage.setItem(AUDITS_KEY, JSON.stringify(merged));
          } catch {
            flash("Browser storage is full. Remove large screenshots or export a backup.");
          }
          setAudits(merged);
          if (merged[0]) selectAudit(merged[0], merged);

          // Existing local audits are migrated to the account on first sign-in.
          saved.forEach((audit) => {
            void syncAudit(audit).catch(() => undefined);
          });
        })
        .catch(() => {
          flash("Cloud storage is unavailable. Changes remain saved on this device.");
        });
    }
  }, []);

  useEffect(() => {
    auditsRef.current = audits;
  }, [audits]);

  useEffect(() => {
    workflowRef.current = workflow;
  }, [workflow]);

  function flash(message: string) {
    setNotice(message);
    window.setTimeout(() => setNotice(""), 2200);
  }

  function persist(nextAudits: Audit[]) {
    const capped = nextAudits.slice(0, 50);
    const changed = capped.filter((candidate) => {
      const previous = auditsRef.current.find((audit) => audit.id === candidate.id);
      return !previous || JSON.stringify(previous) !== JSON.stringify(candidate);
    });
    try {
      localStorage.setItem(AUDITS_KEY, JSON.stringify(capped));
    } catch {
      flash("Browser storage is full. Remove large screenshots or export a backup.");
      return false;
    }
    auditsRef.current = capped;
    setAudits(capped);
    if (cloudEnabled) {
      changed.forEach((audit) => {
        void syncAudit(audit).catch(() => {
          flash("Saved on this device; cloud sync will be retried later.");
        });
      });
    }
    return true;
  }

  async function syncAudit(audit: Audit) {
    const response = await fetch("/api/audits", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audit),
    });
    if (!response.ok) throw new Error("Audit could not be saved to cloud storage.");
  }

  function changeLocale(nextLocale: Locale) {
    localStorage.setItem(LOCALE_KEY, nextLocale);
    document.documentElement.lang = nextLocale;
    document.documentElement.dir = nextLocale === "ar" ? "rtl" : "ltr";
    setLocale(nextLocale);
  }

  function selectAudit(audit: Audit, source = audits) {
    const found = source.find((item) => item.id === audit.id) ?? audit;
    setActiveAuditId(found.id);
    setUrl(found.url);
    setClientName(found.clientName);
    setIndustry(found.industry ?? "");
    setClientLogo(found.clientLogo ?? "");
    setNotes(found.notes ?? {});
    setResults(found.results ?? {});
    setScan(found.scan);
    setAnalysisError("");
    setAuditView("overview");
    setDetailId(null);
    setWorkflow(normalizeWorkflow(found.workflow));
    setActiveCategoryId("technical");
  }

  function startNewAudit() {
    setActiveAuditId(null);
    setUrl("");
    setClientName("");
    setIndustry("");
    setClientLogo("");
    setNotes({});
    setResults({});
    setScan(undefined);
    setAnalysisError("");
    setWorkflow({});
    setActiveCategoryId("technical");
    setPage("audit");
  }

  function updateWorkflow(itemId: string, field: keyof FindingWorkflow, value: string) {
    setWorkflow((current) => {
      const existing = current[itemId];
      const next = {
        ...current,
        [itemId]: {
          owner: existing?.owner ?? "",
          dueDate: existing?.dueDate ?? "",
          status: existing?.status ?? "Open",
          screenshot: existing?.screenshot ?? "",
          screenshotName: existing?.screenshotName ?? "",
          [field]: value,
        } as FindingWorkflow,
      };
      workflowRef.current = next;
      return next;
    });
  }

  function attachWorkflowScreenshot(itemId: string, screenshotName: string, screenshot: string) {
    const existing = workflowRef.current[itemId];
    const nextWorkflow = {
      ...workflowRef.current,
      [itemId]: {
        owner: existing?.owner ?? "",
        dueDate: existing?.dueDate ?? "",
        status: existing?.status ?? "Open",
        screenshot,
        screenshotName,
      } as FindingWorkflow,
    };
    workflowRef.current = nextWorkflow;
    setWorkflow(nextWorkflow);
    if (!activeAuditId) {
      flash("Save audit to keep screenshot evidence.");
      return;
    }
    const existingAudit = auditsRef.current.find((audit) => audit.id === activeAuditId);
    const audit = normalizeAudit({
      ...existingAudit,
      id: activeAuditId,
      url: url.trim(),
      clientName,
      industry,
      clientLogo,
      notes,
      results,
      scan,
      workflow: nextWorkflow,
      date: new Date().toISOString(),
    });
    const nextAudits = upsertAudit(auditsRef.current, audit);
    if (persist(nextAudits)) flash("Screenshot evidence attached.");
  }

  function saveCurrentAudit() {
    const cleanUrl = url.trim();
    const cleanClient = clientName.trim();
    if (!cleanUrl && !cleanClient) {
      flash(t("addWebsite"));
      return;
    }

    const id = activeAuditId ?? createId();
    const audit = normalizeAudit({
      id,
      url: cleanUrl,
      clientName: cleanClient,
      industry,
      clientLogo,
      notes,
      results,
      date: new Date().toISOString(),
      scan,
      workflow: workflowRef.current,
    });
    const currentAudits = auditsRef.current;
    const next = upsertAudit(currentAudits, audit);
    if (!persist(next)) return;
    setActiveAuditId(id);
    flash(t("auditSaved"));
  }

  async function analyzeWebsite() {
    const cleanUrl = url.trim();
    if (!cleanUrl) {
      flash(t("enterWebsite"));
      return;
    }
    setIsAnalyzing(true);
    setAnalysisError("");
    setAnalysisProgress({ progress: 2, stage: t("analysisProgress") });
    setNotice(t("analysisProgress"));
    try {
      const createResponse = await fetch("/api/analyze/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: cleanUrl, pageLimit }),
      });
      const created = await createResponse.json() as AnalysisJobResponse;
      if (!createResponse.ok || !created.jobId) {
        const message = created.errorCode === "MONTHLY_PAGE_QUOTA_REACHED"
          ? t("analysisQuotaReached")
          : created.error || t("analysisFailed");
        throw new Error(message);
      }

      let job = created;
      const deadline = Date.now() + 45 * 60 * 1000;
      while (job.status === "queued" || job.status === "running") {
        if (Date.now() > deadline) throw new Error("The analysis is still running. Please try again shortly.");
        await new Promise((resolve) => window.setTimeout(resolve, 700));
        const jobResponse = await fetch(`/api/analyze/jobs/${created.jobId}`, { cache: "no-store" });
        job = await jobResponse.json() as AnalysisJobResponse;
        if (!jobResponse.ok) throw new Error(job.error || "Analysis status could not be retrieved.");
        setAnalysisProgress({ progress: job.progress, stage: job.stage });
      }
      if (job.status === "failed" || !job.result) throw new Error(job.error || "Website analysis failed.");
      const data = job.result;
      const nextResults = { ...data.results };
      const nextNotes = { ...data.notes };
      const nextScan: WebsiteScan = {
        automatedItemIds: data.automatedItemIds,
        checked: data.checked,
        diagnosticCount: data.diagnosticCount,
        creditsUsed: data.creditsUsed,
        finalUrl: data.finalUrl,
        fetchedAt: data.fetchedAt,
        pageLimit: data.pageLimit,
        requestedPageLimit: created.requestedPageLimit ?? pageLimit,
        warnings: data.warnings,
        pagesAnalyzed: data.pagesAnalyzed,
        renderedPagesMeasured: data.renderedPagesMeasured,
        renderedViewportRuns: data.renderedViewportRuns,
        renderedPageCoverage: data.renderedPageCoverage,
        pages: data.pages,
        crawlOutcomes: data.crawlOutcomes,
        sitemapDiscovery: data.sitemapDiscovery,
        measurementEvidence: data.measurementEvidence,
        onlineScorecards: data.onlineScorecards,
      };
      const id = activeAuditId ?? createId();
      const latestWorkflow = workflowRef.current;
      const audit = normalizeAudit({
        id,
        url: cleanUrl,
        clientName,
        industry,
        clientLogo,
        notes: nextNotes,
        results: nextResults,
        scan: nextScan,
        workflow: latestWorkflow,
        date: new Date().toISOString(),
      });
      const currentAudits = auditsRef.current;
      const nextAudits = upsertAudit(currentAudits, audit);
      const persisted = persist(nextAudits);
      setResults(nextResults);
      setNotes(nextNotes);
      setScan(nextScan);
      setAnalysisError("");
      if (persisted) {
        setActiveAuditId(id);
        setNotice(`${data.checked} ${t("analysisSaved")}`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t("analysisFailed");
      setNotice("");
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(null);
    }
  }

  async function analyzeAiVisibility() {
    if (!scan) {
      flash("Run the website analysis first.");
      return;
    }
    setIsAnalyzingAi(true);
    setNotice("Running a billable AI Visibility scan...");
    try {
      const response = await fetch("/api/ai-visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim(), brandName: clientName.trim(), industry: industry.trim(), locale }),
      });
      const data = await response.json() as AiVisibilitySummary & { error?: string };
      if (!response.ok) throw new Error(data.error || "AI Visibility scan failed.");
      const priorRuns = scan.aiVisibilityRuns?.length ? scan.aiVisibilityRuns : scan.aiVisibility ? [scan.aiVisibility] : [];
      const nextScan: WebsiteScan = { ...scan, aiVisibility: data, aiVisibilityRuns: [...priorRuns, data].slice(-2) };
      const id = activeAuditId ?? createId();
      const latestWorkflow = workflowRef.current;
      const audit = normalizeAudit({ id, url: url.trim(), clientName, industry, clientLogo, notes, results, scan: nextScan, workflow: latestWorkflow, date: new Date().toISOString() });
      const currentAudits = auditsRef.current;
      const nextAudits = upsertAudit(currentAudits, audit);
      const persisted = persist(nextAudits);
      setScan(nextScan);
      if (persisted) {
        setActiveAuditId(id);
        setNotice(`AI Visibility scan completed: ${data.completedObservations}/${data.expectedObservations} engine responses measured.`);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "AI Visibility scan failed.");
    } finally {
      setIsAnalyzingAi(false);
    }
  }

  function restoreDeletedAudit(audit: Audit, restoreActive: boolean) {
    setAudits((current) => {
      const restored = current.some((item) => item.id === audit.id) ? current : [audit, ...current].slice(0, 50);
      try {
        localStorage.setItem(AUDITS_KEY, JSON.stringify(restored));
      } catch {
        flash("Browser storage is full. Remove large screenshots or export a backup.");
        return current;
      }
      if (restoreActive) selectAudit(audit, restored);
      return restored;
    });
  }

  function deleteAudit(id: string) {
    const deletedAudit = audits.find((audit) => audit.id === id);
    const restoreActive = activeAuditId === id;
    const next = audits.filter((audit) => audit.id !== id);
    if (!persist(next)) return;
    if (cloudEnabled) {
      void fetch(`/api/audits?id=${encodeURIComponent(id)}`, { method: "DELETE" }).then(async (response) => {
        if (response.ok) return;
        const payload = await response.json().catch(() => undefined) as { error?: string } | undefined;
        if (deletedAudit) restoreDeletedAudit(deletedAudit, restoreActive);
        flash(response.status === 403 ? "Viewer accounts cannot delete cloud audits." : payload?.error ?? "Cloud deletion failed.");
      }).catch(() => {
        if (deletedAudit) restoreDeletedAudit(deletedAudit, restoreActive);
        flash("Cloud deletion failed. The audit was restored on this device.");
      });
    }
    if (activeAuditId === id) {
      if (next[0]) selectAudit(next[0], next);
      else startNewAudit();
    }
  }

  function duplicateAudit(audit: Audit) {
    const copy = normalizeAudit({
      ...audit,
      id: createId(),
      clientName: `${audit.clientName || audit.url} copy`,
      results: {},
      notes: {},
      scan: undefined,
      workflow: {},
      date: new Date().toISOString(),
    });
    const next = [copy, ...audits];
    if (!persist(next)) return;
    selectAudit(copy, next);
    flash("Blank copy created.");
  }

  function resetCurrentAudit() {
    if (!activeAuditId) {
      setResults({});
      setNotes({});
      setScan(undefined);
      setWorkflow({});
      workflowRef.current = {};
      return;
    }
    const next = audits.map((audit) =>
      audit.id === activeAuditId
        ? normalizeAudit({ ...audit, notes: {}, results: {}, scan: undefined, workflow: {}, date: new Date().toISOString() })
        : audit,
    );
    if (!persist(next)) return;
    setResults({});
    setNotes({});
    setScan(undefined);
    setWorkflow({});
    workflowRef.current = {};
    flash("Audit checklist reset.");
  }

  function loadDemo() {
    const demoResults = generateDemoResults();
    const demo = normalizeAudit({
      id: "demo",
      url: "example-client.com",
      clientName: "Example Client",
      industry: "SaaS / Software",
      results: demoResults,
      notes: {},
    });
    const next = [demo, ...audits.filter((audit) => audit.id !== "demo")];
    if (!persist(next)) return;
    selectAudit(demo, next);
    flash("Demo audit loaded.");
  }

  function exportBackup() {
    downloadJson(`auditpro_backup_${new Date().toISOString().slice(0, 10)}.json`, {
      version: "2.0-next",
      exported: new Date().toISOString(),
      audits,
      whitelabel: whiteLabel,
    });
  }

  function exportFindingsCsv() {
    const rows = getAllAuditItems(results)
      .filter((item) => item.status === "Fail" || item.status === "Partial")
      .map((item) => {
        const explanation = explainIssue(item);
        const classification = classifyIssue(item);
        return [
          item.category,
          item.section,
          item.priority,
          item.status,
          classification.lane,
          classification.impactLevel,
          classification.effort,
          item.item,
          item.howTo,
          explanation.impact,
          notes[item.id] ?? "",
          workflow[item.id]?.owner ?? "",
          workflow[item.id]?.dueDate ?? "",
          workflow[item.id]?.status ?? "Open",
          workflow[item.id]?.screenshot ? workflow[item.id]?.screenshotName || "Attached" : "No",
        ];
      });
    const header = [
      "Category",
      "Section",
      "Priority",
      "Status",
      "Lane",
      "Impact Level",
      "Effort",
      "Finding",
      "Recommended Action",
      "Business Impact",
      "Evidence Note",
      "Owner",
      "Due Date",
      "Implementation Status",
      "Screenshot Evidence",
    ];
    const csv = [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const target = (clientName || url || "audit").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    downloadText(`auditpro-findings-${target || "audit"}.csv`, csv, "text/csv");
  }

  function exportMarkdownReport() {
    const target = clientName || url || "Current audit";
    const geoSummary = geoPublicationSummary(scan?.aiVisibility);
    const lines = [
      `# Povlex Report: ${target}`,
      "",
      `Prepared by: ${whiteLabel.agencyName || "Povlex"}`,
      `Date: ${new Date().toLocaleDateString()}`,
      industry ? `Industry: ${industry}` : "",
      "",
      "## Executive Summary",
      analysis.executiveSummary,
      "",
      "## Report Readiness",
      `${analysis.readiness.label}: ${analysis.readiness.message}`,
      "",
      "## Score Summary",
      `- Overall score: ${publishedScoreLabel(score, scan?.onlineScorecards)}`,
      `- Measurement: ${scan?.onlineScorecards?.overall ? `${scan.onlineScorecards.overall.status} · ${scan.onlineScorecards.overall.measuredChecks}/${scan.onlineScorecards.overall.totalChecks} measured controls · ${scan.onlineScorecards.overall.notices} not measurable · ${scan.onlineScorecards.overall.observations ?? 0} observations` : "Not published"}`,
      `- Confidence: ${score.confidence}`,
      `- Evidence coverage: ${publishedCoveragePct(score, scan?.onlineScorecards)}%${scan?.onlineScorecards ? ` (${scan.onlineScorecards.overall?.measuredChecks}/${scan.onlineScorecards.overall?.totalChecks} measured controls)` : ` (${score.verifiedForEligibility}/${score.minimumRequired} verified controls)`}`,
      ...(scan?.onlineScorecards ? [
        `- Online SEO score: ${scan.onlineScorecards.seo.score ?? "Not available"}/100 (${scan.onlineScorecards.seo.coveragePct}% evidence coverage)`,
        `- GEO readiness score: ${scan.onlineScorecards.geo.score ?? "Not available"}/100 (${scan.onlineScorecards.geo.coveragePct}% evidence coverage)`,
      ] : []),
      "",
      ...(scan?.onlineScorecards ? [
        "## Online SEO and GEO Actions",
        ...[scan.onlineScorecards.seo, scan.onlineScorecards.geo].flatMap((card) => [
          `### ${t.locale === "tr" ? card.labelTr : card.label}`,
          ...card.checks.filter((item) => item.status === "Fail" || item.status === "Partial").map((item) => `- ${item.status}: ${t.locale === "tr" ? item.labelTr : item.label}. ${t.locale === "tr" ? item.actionTr : item.action}`),
          "",
        ]),
      ] : []),
      "## GEO Publication Gate",
      `Status: ${geoSummary.status} (${geoSummary.passed}/${geoSummary.total} checks passing)`,
      ...geoSummary.checks.map((check) => `- ${check.done ? "Pass" : "Open"}: ${check.label}. ${check.detail}`),
      ...(scan?.aiVisibilityRuns?.length ? [
        "",
        "## AI Visibility Pilot Rounds",
        ...scan.aiVisibilityRuns.map((run, index) => `- Round ${index + 1}: ${run.completedObservations}/${run.expectedObservations} responses, ${run.mentionRate ?? "unknown"}% mentions, ${run.citationRate ?? "unknown"}% provider citations, ${run.inputTokens + run.outputTokens} tokens.`),
      ] : []),
      "",
      `## Industry Playbook: ${analysis.playbook.label}`,
      ...analysis.playbook.recommendations.map((item) => `- ${item}`),
      "",
      "## Category Analysis",
      ...analysis.categoryNarratives.flatMap((cat) => [
        `### ${cat.label}`,
        `Score: ${categoryScoreLabel(cat)} | Coverage: ${cat.coverage}%`,
        cat.meaning,
        "",
      ]),
      "## Quick Wins",
      ...(analysis.quickWins.length ? analysis.quickWins.map((item) => `- ${findingTitle(item.id, item.item, t)}`) : ["No quick wins identified yet."]),
      "",
      "## Strategic Fixes",
      ...(analysis.strategicFixes.length ? analysis.strategicFixes.map((item) => `- ${findingTitle(item.id, item.item, t)}`) : ["No strategic fixes identified yet."]),
      "",
      "## Detailed Findings",
      ...analysis.detailedIssues.flatMap((issue, index) => [
        `### ${index + 1}. ${findingTitle(issue.id, issue.item, t)}`,
        `- Category: ${issue.category}`,
        `- Priority: ${priorityText(issue.priority, t)}`,
        `- Status: ${issue.status}`,
        `- Lane: ${issue.lane}`,
        `- Impact / effort: ${issue.impactLevel} impact, ${issue.effort} effort`,
        `- Why it matters: ${issue.why}`,
        `- Business impact: ${issue.impact}`,
        `- Recommended action: ${issue.action}`,
        issue.note ? `- Evidence note: ${issue.note}` : "",
        workflow[issue.id]?.owner ? `- Owner: ${workflow[issue.id].owner}` : "",
        workflow[issue.id]?.dueDate ? `- Due date: ${workflow[issue.id].dueDate}` : "",
        `- Implementation status: ${workflow[issue.id]?.status ?? "Open"}`,
        workflow[issue.id]?.screenshot ? `- Screenshot attached: ${workflow[issue.id].screenshotName || "Yes"}` : "",
        "",
      ]),
      "## 30-60-90 Day Action Plan",
      ...analysis.actionPlan.flatMap((phase) => [
        `### ${phase.phase}: ${phase.focus}`,
        ...(phase.actions.length ? phase.actions.map((item) => `- ${item}`) : ["No actions identified yet."]),
        "",
      ]),
    ].filter(Boolean);

    const safeName = target.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "audit";
    downloadText(`auditpro-report-${safeName}.md`, lines.join("\n"), "text/markdown");
  }

  function clearAllAudits() {
    if (!window.confirm("Delete all saved audits? This cannot be undone.")) return;
    localStorage.removeItem(AUDITS_KEY);
    setAudits([]);
    startNewAudit();
    flash("All saved audits deleted.");
  }

  function updateCurrentClientLogo(file: File | undefined) {
    if (!file) return;
    readImage(file, (dataUrl) => {
      setClientLogo(dataUrl);
      if (!activeAuditId) return;
      const next = audits.map((audit) =>
        audit.id === activeAuditId ? normalizeAudit({ ...audit, clientLogo: dataUrl }) : audit,
      );
      if (persist(next)) flash("Client logo saved.");
    });
  }

  function importBackup(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result));
        if (!Array.isArray(data.audits)) throw new Error("Invalid backup");
        const imported = data.audits.map(normalizeAudit);
        if (!persist(imported)) return;
        if (data.whitelabel) saveWhiteLabel({ ...DEFAULT_WL, ...data.whitelabel });
        if (imported[0]) selectAudit(imported[0], imported);
        else startNewAudit();
        flash("Backup imported.");
      } catch {
        flash("Import failed: invalid backup file.");
      }
    };
    reader.readAsText(file);
  }

  function saveWhiteLabel(next: WhiteLabel) {
    setWhiteLabel(next);
    localStorage.setItem(WL_KEY, JSON.stringify(next));
  }

  async function downloadPdf(kind: "report" | "proposal" | "presentation" = "report") {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 44;
    const accent = hexToRgb(whiteLabel.brandColor);
    const target = clientName || url || "Current audit";
    const contentWidth = pageWidth - margin * 2;
    let y = margin;

    const addLogo = (src: string | undefined, x: number, yPos: number, maxWidth = 120, maxHeight = 42) => {
      if (!src) return;
      try {
        const format = src.includes("image/png") ? "PNG" : "JPEG";
        pdf.addImage(src, format, x, yPos, maxWidth, maxHeight, undefined, "FAST");
      } catch {
        // Some SVG/WEBP uploads cannot be embedded by jsPDF. The on-screen report still shows them.
      }
    };

    const addFooter = () => {
      const pages = pdf.getNumberOfPages();
      for (let index = 1; index <= pages; index += 1) {
        pdf.setPage(index);
        pdf.setDrawColor(216, 226, 235);
        pdf.line(margin, pageHeight - 34, pageWidth - margin, pageHeight - 34);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(97, 112, 133);
        pdf.text(`${whiteLabel.agencyName || "Povlex"} - ${target}`, margin, pageHeight - 18);
        pdf.text(`Page ${index} of ${pages}`, pageWidth - margin - 54, pageHeight - 18);
      }
    };

    const addPageIfNeeded = (height = 60) => {
      if (y + height <= pageHeight - margin) return;
      pdf.addPage();
      y = margin;
    };

    const addSectionTitle = (title: string, subtitle?: string) => {
      addPageIfNeeded(subtitle ? 56 : 36);
      pdf.setFillColor(241, 247, 245);
      pdf.setDrawColor(201, 219, 214);
      pdf.roundedRect(margin, y - 4, contentWidth, subtitle ? 42 : 28, 5, 5, "FD");
      pdf.setFont("helvetica", "bold");
      pdf.setFontSize(12);
      pdf.setTextColor(...accent);
      pdf.text(title, margin + 12, y + 13);
      if (subtitle) {
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(97, 112, 133);
        pdf.text(pdf.splitTextToSize(subtitle, contentWidth - 24), margin + 12, y + 29);
      }
      y += subtitle ? 54 : 40;
    };

    const addText = (text: string, size = 10, color: [number, number, number] = [56, 67, 84], width = contentWidth) => {
      pdf.setFont("helvetica", "normal");
      pdf.setFontSize(size);
      pdf.setTextColor(...color);
      const lines = pdf.splitTextToSize(text, width);
      const lineHeight = size + 5;
      let cursor = 0;
      while (cursor < lines.length) {
        const availableLines = Math.max(1, Math.floor((pageHeight - margin - y) / lineHeight));
        const chunk = lines.slice(cursor, cursor + availableLines);
        if (y + chunk.length * lineHeight > pageHeight - margin) {
          pdf.addPage();
          y = margin;
          continue;
        }
        pdf.text(chunk, margin, y);
        y += chunk.length * lineHeight;
        cursor += chunk.length;
        if (cursor < lines.length) {
          pdf.addPage();
          y = margin;
        }
      }
      y += 8;
    };

    const addTable = (headers: string[], rows: string[][], widths: number[]) => {
      const rowGap = 4;
      const lineHeight = 10;
      const paddingX = 8;
      const paddingY = 8;
      const tableWidth = widths.reduce((sum, width) => sum + width, 0);

      const drawHeader = () => {
        addPageIfNeeded(30);
        let x = margin;
        pdf.setFillColor(...accent);
        pdf.setDrawColor(...accent);
        pdf.rect(margin, y, tableWidth, 24, "F");
        headers.forEach((header, index) => {
          pdf.setFont("helvetica", "bold");
          pdf.setFontSize(8);
          pdf.setTextColor(255, 255, 255);
          pdf.text(header, x + paddingX, y + 15, { maxWidth: widths[index] - paddingX * 2 });
          x += widths[index];
        });
        y += 24;
      };

      drawHeader();
      rows.forEach((row, rowIndex) => {
        const wrapped = row.map((cell, index) => pdf.splitTextToSize(cell || "-", widths[index] - paddingX * 2));
        let lineOffset = 0;
        while (lineOffset < Math.max(...wrapped.map((lines) => lines.length))) {
          const availableHeight = pageHeight - margin - y;
          const availableLines = Math.floor((availableHeight - paddingY * 2) / lineHeight);
          if (availableLines < 1) {
            pdf.addPage();
            y = margin;
            drawHeader();
            continue;
          }
          const remainingLines = Math.max(...wrapped.map((lines) => Math.max(0, lines.length - lineOffset)));
          const segmentLines = Math.min(remainingLines, availableLines);
          const rowHeight = Math.max(28, segmentLines * lineHeight + paddingY * 2);
          let x = margin;
          pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 252);
          pdf.setDrawColor(224, 232, 240);
          pdf.rect(margin, y, tableWidth, rowHeight, "FD");
          wrapped.forEach((lines, index) => {
            if (index > 0) {
              pdf.setDrawColor(224, 232, 240);
              pdf.line(x, y, x, y + rowHeight);
            }
            const chunk = lines.slice(lineOffset, lineOffset + segmentLines);
            pdf.setFont("helvetica", index === 0 ? "bold" : "normal");
            pdf.setFontSize(8);
            pdf.setTextColor(index === 0 ? 23 : 56, index === 0 ? 32 : 67, index === 0 ? 51 : 84);
            if (chunk.length > 0) pdf.text(chunk, x + paddingX, y + paddingY + 8);
            x += widths[index];
          });
          y += rowHeight + rowGap;
          lineOffset += segmentLines;
          if (lineOffset < Math.max(...wrapped.map((lines) => lines.length))) {
            pdf.addPage();
            y = margin;
            drawHeader();
          }
        }
      });
      y += 8;
    };

    const addMetricCards = () => {
      const cards = [
        ["Score", publishedScoreLabel(score, scan?.onlineScorecards)],
        ["Measurement", scan?.onlineScorecards?.overall?.status ?? "Not published"],
        ["Confidence", score.confidence],
        ["Coverage", `${publishedCoveragePct(score, scan?.onlineScorecards)}%`],
      ];
      const gap = 10;
      const cardWidth = (pageWidth - margin * 2 - gap * 3) / 4;
      addPageIfNeeded(78);
      cards.forEach(([label, value], index) => {
        const x = margin + index * (cardWidth + gap);
        pdf.setDrawColor(216, 226, 235);
        pdf.setFillColor(248, 250, 252);
        pdf.roundedRect(x, y, cardWidth, 58, 6, 6, "FD");
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(8);
        pdf.setTextColor(97, 112, 133);
        pdf.text(label, x + 10, y + 18);
        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(23, 32, 51);
        pdf.text(String(value), x + 10, y + 42);
      });
      y += 76;
    };

    pdf.setFillColor(...accent);
    pdf.rect(0, 0, pageWidth, 120, "F");
    addLogo(whiteLabel.agencyLogo, margin, 24);
    addLogo(clientLogo, pageWidth - margin - 120, 24);
    pdf.setTextColor(255, 255, 255);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.text(whiteLabel.agencyName || "Povlex", margin, whiteLabel.agencyLogo ? 86 : 34);
    pdf.setFontSize(24);
    pdf.text(kind === "proposal" ? "Improvement Proposal" : kind === "presentation" ? "Audit Snapshot" : "Audit Report", margin, whiteLabel.agencyLogo ? 112 : 66);
    pdf.setFontSize(10);
    pdf.text(new Date().toLocaleDateString(), pageWidth - margin - 70, 34);
    y = 154;

    pdf.setTextColor(23, 32, 51);
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(18);
    pdf.text(target, margin, y);
    y += 26;

    addMetricCards();
    addSectionTitle("Executive Summary", "The following sections are structured for client review and implementation planning.");
    addText(analysis.executiveSummary, 11, [23, 32, 51]);
    addText(`Report readiness: ${analysis.readiness.label}. ${analysis.readiness.message}`, 10, [56, 67, 84]);
    if (industry) addText(`Industry: ${industry}`, 10);

    const geoSummary = geoPublicationSummary(scan?.aiVisibility);
    addSectionTitle("GEO Publication Gate", "AI visibility is published only when prompt-level evidence is measurable.");
    addTable(
      ["Check", "Status", "Detail"],
      geoSummary.checks.map((check) => [check.label, check.done ? "Pass" : "Open", check.detail]),
      [160, 70, contentWidth - 230],
    );

    addSectionTitle(`Industry Playbook: ${analysis.playbook.label}`, "Recommended positioning priorities for this client context.");
    addTable(["Priority", "Recommendation"], analysis.playbook.recommendations.map((recommendation, index) => [String(index + 1), recommendation]), [70, contentWidth - 70]);

    addSectionTitle("Section Scores", "Category scores stay unpublished until minimum evidence coverage is reached.");
    addTable(
      ["Section", "Score", "Coverage", "Interpretation"],
      score.categories.map((cat) => {
        const narrative = analysis.categoryNarratives.find((item) => item.id === cat.id);
        return [cat.label, categoryScoreLabel(cat), `${cat.evaluated}/${cat.total}`, narrative?.meaning ?? ""];
      }),
      [116, 74, 70, contentWidth - 260],
    );

    if (kind !== "presentation") {
      addSectionTitle("30-60-90 Day Roadmap", "A phased implementation plan for handoff and client accountability.");
      addTable(
        ["Window", "Focus", "Actions"],
        analysis.actionPlan.map((phase) => [
          phase.phase,
          phase.focus,
          phase.actions.length ? phase.actions.join("; ") : "No actions identified yet.",
        ]),
        [92, 130, contentWidth - 222],
      );
    }

    addSectionTitle("Quick Wins and Strategic Fixes", "Prioritized fixes grouped by likely effort and business impact.");
    addText(`Quick wins: ${analysis.quickWins.length ? analysis.quickWins.map((item) => item.item).join("; ") : "No quick wins identified yet."}`, 10);
    addText(`Strategic fixes: ${analysis.strategicFixes.length ? analysis.strategicFixes.map((item) => item.item).join("; ") : "No strategic fixes identified yet."}`, 10);

    addSectionTitle("Priority Issues", "Backlog-ready issues with priority, status, category, impact, and recommended action.");
    if (topIssues.length === 0) {
      addText("No priority issues marked yet.");
    } else {
      addTable(
        ["Priority", "Status", "Category", "Finding", "Action"],
        analysis.detailedIssues.slice(0, kind === "presentation" ? 5 : 20).map((issue) => [
          issue.priority,
          issue.status ?? "-",
          issue.category,
          `${findingTitle(issue.id, issue.item, t)}. Impact: ${issue.impact}${issue.note ? ` Evidence: ${issue.note}` : ""}`,
          issue.action,
        ]),
        [58, 56, 88, 170, contentWidth - 372],
      );
    }

    const contact = whiteLabel.bookingUrl || whiteLabel.contactEmail;
    if (contact) addText(`Contact: ${contact}`, 10, [23, 32, 51]);

    addFooter();
    const safeName = target.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "audit";
    pdf.save(`auditpro-${kind}-${safeName}.pdf`);
  }

  return (
    <main className="app-shell result-experience" style={{ "--accent": whiteLabel.brandColor } as React.CSSProperties}>
      <aside className="sidebar no-print">
        <div className="brand-block">
          <span className="brand-mark"><BarChart3 size={20} strokeWidth={2.4} /></span>
          <div>
            <strong>Povlex</strong>
            <p>GEO audit suite</p>
          </div>
        </div>

        <label className="language-control">
          <span><Languages size={14} />{t("language")}</span>
          <select value={locale} onChange={(event) => changeLocale(event.target.value as Locale)}>
            {LOCALE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <button className="primary-action" onClick={startNewAudit}><Plus size={17} />{t("newAudit")}</button>

        <nav className="page-nav" aria-label="Main views">
          {([
            ["audit", LayoutDashboard],
            ["actions", ListChecks],
            ["report", FileChartColumn],
            ["proposal", BriefcaseBusiness],
            ["presentation", Presentation],
            ["settings", Settings],
            ["qa", ShieldCheck],
          ] as const).map(([item, Icon]) => (
            <button className={page === item ? "active" : ""} key={item} onClick={() => setPage(item)}>
              <Icon size={17} />
              <span>{t(item)}</span>
              {page === item && <ChevronDown className="nav-indicator" size={15} />}
            </button>
          ))}
        </nav>

        <nav className="category-nav" aria-label="Audit categories">
          {AUDIT_CATEGORIES.map((cat) => {
            const onlinePillar = onlinePillarForCategory(scan?.onlineScorecards, cat.id);
            return (
              <button
                className={cat.id === activeCategoryId ? "active" : ""}
                key={cat.id}
                onClick={() => {
                  setActiveCategoryId(cat.id);
                  setPage("audit");
                  setAuditView("findings");
                }}
              >
                <span style={{ background: cat.color }} />
                <span>{t(categoryTextKey(cat.id))}</span>
                <strong title={onlinePillar ? `${onlinePillar.score ?? "—"}/100 · ${onlinePillar.coveragePct}% ${locale === "tr" ? "kanıt kapsamı" : "evidence coverage"}` : t("notMeasured")}>{onlinePillar?.score ?? "—"}</strong>
              </button>
            );
          })}
        </nav>

        <section className="saved-list" aria-label={t("saved")}>
          <div className="section-heading">
            <h2>{t("saved")}</h2>
            <button title={t("export")} onClick={exportBackup} disabled={audits.length === 0}><Download size={14} /><span className="sr-only">{t("export")}</span></button>
          </div>
          <label className="file-control">
            <Upload size={14} />{t("import")}
            <input type="file" accept="application/json,.json" onChange={importBackup} />
          </label>
          {audits.length === 0 ? (
            <p className="empty-text">{t("noSaved")}</p>
          ) : (
            audits.map((audit) => (
              <div className={audit.id === activeAuditId ? "saved-audit selected" : "saved-audit"} key={audit.id}>
                <button onClick={() => selectAudit(audit)}>
                  <strong>{audit.clientName || audit.url}</strong>
                  <span>{publishedScoreLabel(audit.score, audit.scan?.onlineScorecards)}{audit.scan?.onlineScorecards ? ` - ${publishedGradeLabel(audit.score, audit.scan.onlineScorecards)}` : ""}</span>
                </button>
                <button className="delete-button" onClick={() => deleteAudit(audit.id)} aria-label={t("deleteAudit")} title={t("deleteAudit")}><Trash2 size={14} /></button>
              </div>
            ))
          )}
          <button className="clear-button" onClick={clearAllAudits} disabled={audits.length === 0}><Trash2 size={14} />{t("clearAll")}</button>
        </section>
        <button className="demo-action" onClick={loadDemo}><Sparkles size={15} />{t("loadDemo")}</button>
      </aside>

      <section className="workspace">
        <header className="topbar no-print">
          <div className="workspace-title">
            <span className="view-label"><CircleGauge size={14} />{t(page)}</span>
            <h1>{clientName || t("newAudit")}</h1>
            <p><Globe2 size={14} />{url || t("enterWebsite")}</p>
          </div>
          <div className="header-actions">
            <button className="save-button" onClick={saveCurrentAudit} title={t("saveAudit")}><Save size={17} />{t("saveAudit")}</button>
            <button className="analyze-button" onClick={analyzeWebsite} disabled={isAnalyzing}>
              <Search size={17} />{isAnalyzing ? t("analyzing") : t("analyzeWebsite")}
            </button>
            <details className="more-actions">
              <summary title="More actions"><MoreHorizontal size={19} /></summary>
              <div>
                <button onClick={resetCurrentAudit}><RotateCcw size={15} />{t("reset")}</button>
                <button disabled={!activeAudit} onClick={() => activeAudit && duplicateAudit(activeAudit)}><Copy size={15} />{t("duplicate")}</button>
                <button onClick={exportFindingsCsv}><Download size={15} />{t("exportCsv")}</button>
                <button onClick={exportMarkdownReport}><FileText size={15} />{t("exportMd")}</button>
                <button onClick={() => downloadPdf(page === "proposal" || page === "presentation" ? page : "report")}><Download size={15} />{t("downloadPdf")}</button>
                <button onClick={() => window.print()}><FileText size={15} />{t("printPdf")}</button>
              </div>
            </details>
            {cloudEnabled ? <CloudAccount /> : null}
          </div>
        </header>

        <details className="project-bar no-print analysis-settings" open={!scan}>
          <summary>{t("analysisSettings")}</summary>
          <div className="field-grid">
            <label>{t("client")}<input value={clientName} onChange={(event) => setClientName(event.target.value)} placeholder="Example Client" /></label>
            <label>{t("website")}<input dir="ltr" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="example.com" /></label>
            <label>{t("industry")}<input value={industry} onChange={(event) => setIndustry(event.target.value)} placeholder="SaaS, e-commerce, services" /></label>
            <div className="scan-mode-control" role="group" aria-label="Scan depth">
              <span><BookOpenCheck size={14} />{t("pages")}</span>
              <div>
                {([5, 25, 250] as const).map((limit) => (
                  <button className={pageLimit === limit ? "active" : ""} key={limit} onClick={() => setPageLimit(limit)}>{limit === 250 ? (locale === "tr" ? "Tam site (250)" : "Full site (250)") : limit}</button>
                ))}
              </div>
            </div>
            <label className="file-control inline-file"><Upload size={14} />{t("clientLogo")}<input type="file" accept="image/*" onChange={(event) => updateCurrentClientLogo(event.target.files?.[0])} /></label>
          </div>
        </details>

        {notice && <div className="notice no-print">{notice}</div>}
        {analysisError && (
          <section className="analysis-error no-print" role="alert">
            <TriangleAlert size={20} />
            <div><strong>{t("analysisFailed")}</strong><p>{analysisError}</p></div>
          </section>
        )}
        {analysisProgress && (
          <section className="analysis-progress no-print" aria-live="polite">
            <LoaderCircle size={18} />
            <div>
              <strong>{analysisProgress.stage}</strong>
              <span>{analysisProgress.progress}%</span>
              <div><i style={{ width: `${analysisProgress.progress}%` }} /></div>
            </div>
          </section>
        )}
        {page === "audit" && scan && (
          <>
          <nav className="result-tabs no-print" aria-label={t("audit")}>
            {(["overview", "findings", "scope"] as const).map(view => <button key={view} aria-current={auditView === view ? "page" : undefined} className={auditView === view ? "active" : ""} onClick={() => setAuditView(view)}>{t(view === "overview" ? "overviewTab" : view === "findings" ? "findingsTab" : "scopeTab")}</button>)}
          </nav>
          {auditView === "overview" &&
          <section className="audit-verdict" aria-label={t("auditSummary")}>
            <div className="verdict-copy">
            <h2>{t("auditSummary")}</h2>
            <p>{scan.fetchedAt ? new Date(scan.fetchedAt).toLocaleDateString(locale) : ""} · {scan.pagesAnalyzed ?? "—"} {t("pages")} · {scan.checked} {t("verifiedControls")} · {scan.diagnosticCount ?? 0} {t("observationsLabel")}</p>
            <strong>{scan.onlineScorecards?.pillars
              ? onlinePriorityChecks(scan.onlineScorecards).length
                ? `${t("summaryFocus")} ${onlinePriorityChecks(scan.onlineScorecards).slice(0, 2).map(issue => onlineCheckLabel(issue, locale)).join(" · ")}`
                : t("noConfirmedIssuesSummary")
              : topIssues.length
                ? `${t("summaryFocus")} ${topIssues.slice(0, 2).map(issue => findingGuidance(issue.id, locale)?.[0] ?? findingTitle(issue.id, issue.item, t)).join(" · ")}`
                : t("noConfirmedIssuesSummary")}</strong>
            <p>{t("summaryLimit")}</p>
            <button className="result-primary" onClick={() => document.querySelector('.score-issue-table, .priority-work')?.scrollIntoView({behavior:"smooth",block:"center"})}>{t("browsePriorities")} →</button>
            </div>
            <div className="verdict-metrics">
              <div><strong>{scan.onlineScorecards?.overall ? scan.onlineScorecards.overall.errors + scan.onlineScorecards.overall.warnings : Object.values(results).filter(value => value === "Fail" || value === "Partial").length}</strong><span>{t("priorityCountLabel")}</span></div>
              <div><strong>{scan.pagesAnalyzed ?? "—"}</strong><span>{t("sampledPages")}</span></div>
              <div><strong>{scan.checked}</strong><span>{t("verifiedControls")}</span></div>
              <div><strong>{scan.diagnosticCount ?? 0}</strong><span>{t("observationsLabel")}</span></div>
            </div>
          </section>}
          {auditView !== 'scope' && (()=>{const scope=crawlScopeSummary(scan);return <section className="crawl-scope-summary" aria-label={t('scopeSummaryTitle')}>
            <div><h2>{t('scopeSummaryTitle')}</h2><button onClick={()=>setAuditView('scope')}>{t('scopeOpen')} →</button></div>
            <dl>{[[t('sampledPages'),scope.analyzed],[t('requestedLimit'),scope.requested],[t('effectiveLimit'),scope.applied],[t('scopeUnprocessed'),scope.unprocessed],[t('scopeLimited'),scope.limited]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value ?? '—'}</dd></div>)}</dl>
            <p>{t('scopeNoTotal')}{scope.reduced ? ` ${t('planLimited')}` : ''}</p>
          </section>})()}
          {auditView === "overview" && scan.onlineScorecards && <OnlineScorecardsPanel scorecards={scan.onlineScorecards} locale={locale} measurementEvidence={scan.measurementEvidence} />}
          {auditView !== "scope" && (!scan.onlineScorecards?.pillars || auditView === "findings") &&
          <section className="category-overview" aria-label={t("analysisByCategory")}>
            <h2>{t("analysisByCategory")}</h2>
            <div className="category-overview-cards">
              {AUDIT_CATEGORIES.map(category => {
                const ids = category.sections.flatMap(section => section.items.map(item => item.id));
                const counts = summarizeFindings(ids, results, scan.measurementEvidence ?? {}, notes);
                return <button aria-pressed={auditView === "findings" && category.id === activeCategoryId} key={category.id} className={auditView === "findings" && category.id === activeCategoryId ? "selected" : ""} onClick={() => {setAuditView("findings");setActiveCategoryId(category.id); setPriorityFilter("all"); setStatusFilter("all");}}>
                  <strong>{t(categoryTextKey(category.id))}</strong>
                  <span className="category-count">{counts.issues} <small>{t("measuredIssues")}</small></span>
                  <span className="category-evidence-counts">{counts.passed} {t("passedControls")} · {counts.review} {t("reviewControls")} · {counts.unavailable} {t("unavailableControls")}</span>
                  <span>{counts.total === 0 ? t("additionalEvidenceRequired") : counts.issues === 0 ? t("noIssueNotHealthy") : t("viewFindings")}</span>
                </button>;
              })}
            </div>
          </section>}
          {auditView === "overview" && !scan.onlineScorecards?.pillars && <div className="overview-bottom">
          <section className="priority-work" aria-label={t("priorityWork")}>
            <h2>{t("priorityWork")}</h2>
            <div className="priority-work-cards">
              {topIssues.slice(0, 3).map((issue, index) => {
                const pageRows = scan.measurementEvidence?.[issue.id]?.pageResults ?? [];
                const affectedPages = [...new Map(pageRows.filter(row => row.status === 'Fail' || row.status === 'Partial').map(row => [row.url, row])).values()];
                return <article key={issue.id}>
                  <span>{index + 1} · {priorityText(issue.priority, t)} · {issue.status === "Fail" ? t("fail") : t("partial")}</span>
                  <h3>{issue.id === "o5" ? t("missingDescriptions") : issue.id === "o8" ? t("duplicateDescriptions") : findingTitle(issue.id, issue.item, t)}</h3>
                  <div className="priority-affected-pages">
                    {affectedPages.length ? <><p>{t('affectedScope')}: {affectedPages.length} / {pageRows.length}</p><ul>{affectedPages.slice(0, 3).map(row => {
                      let href: string | undefined;
                      try { const url = new URL(row.url); if (['http:', 'https:'].includes(url.protocol) && !url.username && !url.password) href = url.href; } catch {}
                      return <li key={row.url}>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{row.url}</a> : <span>{row.url}</span>}</li>;
                    })}</ul>{affectedPages.length > 3 && <p>{t('moreAffectedPages')}: {affectedPages.length - 3}</p>}</> : <p>{t('priorityPagesUnavailable')}</p>}
                  </div>
                  <button onClick={() => setDetailId(issue.id)}>{t("openEvidence")} →</button>
                </article>;
              })}
              {!topIssues.length && <p>{t("categoryNoPriority")}</p>}
            </div>
          </section>
          <section className="overview-ai"><Sparkles size={24}/><h2>{t("aiOverviewTitle")}</h2><p>{t("aiOverviewCopy")}</p><strong>{hasDirectionalAiEvidence(scan.aiVisibility) ? t("openEvidence") : t("notMeasured")}</strong><button onClick={() => {setActiveCategoryId("serp");setAuditView("findings");setPriorityFilter("all");setStatusFilter("all");}}>{t("aiOverviewOpen")} →</button></section>
          </div>}
          {auditView === "overview" && Boolean(scan.onlineScorecards?.pillars) && <section className="overview-ai overview-ai-wide"><Sparkles size={24}/><h2>{t("aiOverviewTitle")}</h2><p>{t("aiOverviewCopy")}</p><strong>{hasDirectionalAiEvidence(scan.aiVisibility) ? t("openEvidence") : t("notMeasured")}</strong><button onClick={() => {setActiveCategoryId("serp");setAuditView("findings");setPriorityFilter("all");setStatusFilter("all");}}>{t("aiOverviewOpen")} →</button></section>}
          {auditView === "overview" && reviewActions(scan.measurementEvidence).length > 0 && <section className="review-actions" aria-label={t("reviewActionsTitle")}>
            <h2>{t("reviewActionsTitle")}</h2><p>{t("reviewActionsHelp")}</p>
            <div>{reviewActions(scan.measurementEvidence).map(action=><article key={`${action.kind}:${action.id}`}>
              <h3>{t(action.kind === 'titles' ? 'reviewTitlesAction' : action.kind === 'descriptions' ? 'reviewDescriptionsAction' : action.kind === 'coverage' ? 'reviewCoverageAction' : 'reviewResourcesAction')}</h3>
              <p>{t(action.kind === 'resources' ? 'reviewResourcesActionHelp' : action.kind === 'coverage' ? 'reviewCoverageActionHelp' : 'reviewMetadataActionHelp')}</p>
              <p>{t('reviewControlLabel')}: {findingTitle(action.id, AUDIT_CATEGORIES.flatMap(category=>category.sections.flatMap(section=>section.items)).find(item=>item.id===action.id)?.item ?? action.id,t)}</p>
              <ul>{action.urls.slice(0,3).map(url=><li key={url}>{url}</li>)}</ul>
              {action.urls.length > 3 && <p>{t('moreAffectedPages')}: {action.urls.length-3}</p>}
              <button onClick={()=>setDetailId(action.id)}>{t('openEvidence')} →</button>
            </article>)}</div>
          </section>}
          {scan.crawlOutcomes?.some(row => row.outcome === 'http-error' || row.outcome === 'unavailable') && <section className="page-evidence-results" role="status"><h3>{t('crawlFailuresTitle')}</h3><p>{t('crawlFailuresHelp')}</p><ul>{scan.crawlOutcomes.filter(row => row.outcome === 'http-error' || row.outcome === 'unavailable').map(row => <li key={row.url}><span>{row.url}</span><strong>{row.status ? `HTTP ${row.status}` : t('responseUnavailable')}</strong>{row.finalUrl && row.finalUrl !== row.url && <p>→ {row.finalUrl}</p>}</li>)}</ul></section>}
          {auditView === "scope" && <section className="result-scope"><h2>{t("scopeTab")}</h2><p>{scan.pagesAnalyzed ?? "—"} {t("pages")} · {scan.renderedPagesMeasured ?? 0} {t("renderedPages")} · {scan.renderedViewportRuns ?? 0} {t("viewportRuns")}</p>{scan.crawlOutcomes?.length ? <ul>{scan.crawlOutcomes.map((row,index) => <li key={index}>{row.url} — {t(row.outcome === 'analyzed' ? 'crawlAnalyzed' : row.outcome === 'limit' ? 'crawlLimit' : row.outcome === 'http-error' ? 'crawlHttpError' : row.outcome === 'unavailable' ? 'responseUnavailable' : 'crawlSkipped')}{row.status ? ` (HTTP ${row.status})` : ''}{row.finalUrl && row.url !== row.finalUrl ? ` → ${row.finalUrl}` : ''}</li>)}</ul> : scan.pages?.length ? <ul>{scan.pages.map(pageUrl => <li key={pageUrl}>{pageUrl}</li>)}</ul> : <p>{t("scopeMissing")}</p>}</section>}
          </>
        )}
        {page === 'audit' && scan?.sitemapDiscovery && auditView === 'scope' && <section className="page-evidence-results"><h3>{t('sitemapInventory')}</h3><p>{scan.sitemapDiscovery.pages.length} {t('sitemapPageAddresses')}. {t('sitemapScopeLimit')}</p>{scan.sitemapDiscovery.pageLimitReached && <p>{t('sitemapPageCap')}</p>}<ul>{scan.sitemapDiscovery.maps.map(map=><li key={map.url}><span>{map.url}</span><strong>{t(({parsed:'sitemapParsed',unavailable:'responseUnavailable',unsupported:'sitemapUnsupported',limit:'sitemapBudget',external:'sitemapExternal'} as const)[map.state])}{map.status ? ` · HTTP ${map.status}` : ''}</strong>{map.entries!==undefined && <p>{map.entries} {t('sitemapEntries')}</p>}{Boolean(map.externalEntries) && <p>{map.externalEntries} {t('sitemapExternalEntries')}</p>}{map.finalUrl && map.finalUrl!==map.url && <p>→ {map.finalUrl}</p>}</li>)}</ul></section>}
        {page === 'audit' && scan?.renderedPageCoverage?.length && auditView === 'scope' ? <section className="page-evidence-results"><h3>{t('browserSampleTitle')}</h3><p>{t('browserSampleHelp')}</p><ul>{scan.renderedPageCoverage.map(row=><li key={row.url}><span>{row.url}</span><strong>{row.completedViewports.length}/5 {t('browserCompleted')}</strong>{row.completedViewports.length>0 && <p>{row.completedViewports.join(', ')}</p>}{row.failedViewports.length>0 && <p>{t('browserFailed')}: {row.failedViewports.join(', ')}</p>}{Boolean(row.resourceIssues?.length) && <details><summary>{t('browserResourceIssues')} ({row.resourceIssues!.length})</summary><ul>{row.resourceIssues!.map((issue,index)=><li key={index}><span>{issue.url}</span><p>{issue.viewport} · {issue.resourceType} · {issue.status ? 'HTTP '+issue.status : t(issue.reason==='page-budget'?'resourceBudget':issue.reason==='read-only-block'?'resourceReadOnly':issue.reason==='resource-size'?'resourceSize':'resourceUnavailable')}</p></li>)}</ul></details>}</li>)}</ul></section> : null}
        {page === "audit" && !scan && Object.keys(results).length === 0 && (
          <section className="analysis-empty-state">
            <Search size={26} />
            <div><h2>{t("noCompletedAnalysis")}</h2><p>{t("noCompletedAnalysisHelp")}</p></div>
          </section>
        )}
        {page === "audit" && ((scan && auditView === "findings") || (!scan && Object.keys(results).length > 0)) && (
          <div className="content-grid audit-results-grid">
            <Checklist
              activeCategory={activeCategory}
              aiVisibility={scan?.aiVisibility}
              measurementEvidence={scan?.measurementEvidence ?? {}}
              priorityFilter={priorityFilter}
              notes={notes}
              results={results}
              workflow={workflow}
              t={t}
              statusFilter={statusFilter}
              onPriorityFilter={setPriorityFilter}
              onStatusFilter={setStatusFilter}
              onScreenshot={attachWorkflowScreenshot}
              onWorkflow={updateWorkflow}
            />

          </div>
        )}

        <details className="analysis-appendix" open={page !== "audit" || !scan}>
          <summary>{t("measurementDetails")}</summary>
        {scan && (
          <section className="scan-summary no-print" aria-label="Automated website analysis summary">
            <div>
              <strong>{scan.checked} {t("verifiedControls")} · {scan.diagnosticCount ?? 0} {t("diagnostics")} · {scan.renderedPagesMeasured ?? 0} {t("renderedPages")} · {scan.renderedViewportRuns ?? 0} {t("viewportRuns")} · {scan.pagesAnalyzed ?? "—"}/{scan.pageLimit ?? 25} {t("pages")}</strong>
              <span>{new Date(scan.fetchedAt).toLocaleString(locale)} · {t("measurementContract")} v{score.contractVersion} · {scan.finalUrl}</span>
            </div>
            <div className="scan-detail">
              <p>{t("scanDisclaimer")}</p>
              {scan.pages && scan.pages.length > 1 && (
                <details>
                  <summary>{t("viewAnalyzedPages")}</summary>
                  <ul>{scan.pages.map((pageUrl) => <li key={pageUrl}>{pageUrl}</li>)}</ul>
                </details>
              )}
            </div>
          </section>
        )}
        <details className="measurement-disclosure" open={page !== "audit" || !scan}>
          <summary>{t("measurementDetails")}</summary>
        <ScoreStrip score={score} scorecards={scan?.onlineScorecards} aiVisibility={scan?.aiVisibility} aiVisibilityEnabled={aiVisibilityEnabled} canAnalyzeAi={Boolean(scan)} isAnalyzingAi={isAnalyzingAi} onAnalyzeAi={analyzeAiVisibility} t={t} />
        {scan?.aiVisibility && <AiVisibilityPanel data={scan.aiVisibility} runs={scan.aiVisibilityRuns} t={t} />}
        <MeasurementNotice t={t} />
        </details>

        </details>

        {page === "report" && (
          <ReportView analysis={analysis} score={score} scorecards={scan?.onlineScorecards} topIssues={topIssues} url={url} clientName={clientName} industry={industry} clientLogo={clientLogo} whiteLabel={whiteLabel} aiVisibility={scan?.aiVisibility} />
        )}

        {page === "actions" && (
          <ActionCenter
            measurementEvidence={scan?.measurementEvidence ?? {}}
            analysis={analysis}
            workflow={workflow}
            onScreenshot={attachWorkflowScreenshot}
            onWorkflow={updateWorkflow}
            t={t}
          />
        )}

        {page === "proposal" && (
          <ProposalView analysis={analysis} score={score} topIssues={topIssues} url={url} clientName={clientName} industry={industry} clientLogo={clientLogo} whiteLabel={whiteLabel} aiVisibility={scan?.aiVisibility} />
        )}

        {page === "presentation" && (
          <PresentationView analysis={analysis} score={score} scorecards={scan?.onlineScorecards} topIssues={topIssues} url={url} clientName={clientName} clientLogo={clientLogo} whiteLabel={whiteLabel} aiVisibility={scan?.aiVisibility} />
        )}

        {page === "settings" && <SettingsView whiteLabel={whiteLabel} onSave={saveWhiteLabel} />}

        {page === "qa" && (
          <QAView score={score} audits={audits} analysis={analysis} aiVisibility={scan?.aiVisibility} />
        )}
      </section>
      <dialog className="result-detail" ref={detailDialog} aria-labelledby="result-detail-title" onClose={() => setDetailId(null)}>
        <button className="result-detail-close" onClick={() => setDetailId(null)} aria-label={t("detailClose")}>×</button>
        <h2 id="result-detail-title">{detailId ? findingTitle(detailId, AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).find(item => item.id === detailId)?.item ?? detailId, t) : ""}</h2>
        <h3>{t("evidence")}</h3>
        <p className="result-detail-evidence">{detailId && notes[detailId] ? notes[detailId].replace(/^Diagnostic only \(not scored\):\s*/, "") : t("evidenceMissing")}</p>
        <PageEvidence evidence={detailId ? scan?.measurementEvidence?.[detailId] : undefined} t={t}/>
        <h3>{t("nextAction")}</h3>
        <p>{detailId && findingGuidance(detailId, locale)?.[1] || t("genericNextAction")}</p>
        <h3>{t("verifyAction")}</h3>
        <p>{detailId && findingGuidance(detailId, locale)?.[2] || t("genericVerifyAction")}</p>
        <button className="result-workplan" onClick={() => {setDetailId(null);setPage("actions");}}>{t("reviewWorkPlan")} →</button>
        <button className="result-primary" onClick={() => {
          const id = detailId;
          const category = AUDIT_CATEGORIES.find(cat => cat.sections.some(s => s.items.some(item => item.id === id)));
          setDetailId(null); setAuditView("findings"); setActiveCategoryId(category?.id ?? "technical"); setPriorityFilter("all"); setStatusFilter("all");
          window.setTimeout(() => {const row = document.getElementById('finding-' + id); const details = row?.querySelector('details'); if (details) details.open = true; row?.scrollIntoView({behavior:"smooth",block:"center"});},100);
        }}>{t("detailFull")} →</button>
      </dialog>
    </main>
  );
}

// Discovery observations behind the directional mention rate: shown with its denominator so a
// directional measurement is never read as a score out of 100.
function directionalSample(aiVisibility?: AiVisibilitySummary) {
  const discovery = new Set((aiVisibility?.prompts ?? []).filter((prompt) => prompt.contributesToVisibility).map((prompt) => prompt.id));
  const observed = (aiVisibility?.observations ?? []).filter((observation) => !observation.error && discovery.has(observation.promptId)).length;
  return { observed, expected: discovery.size * (aiVisibility?.engines.length ?? 0) };
}

function ScoreStrip({ score, scorecards, aiVisibility, aiVisibilityEnabled, canAnalyzeAi, isAnalyzingAi, onAnalyzeAi, t }: { score: Score; scorecards?: OnlineScorecards; aiVisibility?: AiVisibilitySummary; aiVisibilityEnabled: boolean; canAnalyzeAi: boolean; isAnalyzingAi: boolean; onAnalyzeAi: () => void; t: Translate }) {
  const overall = scorecards?.overall;
  const published = publishedOverall(score, scorecards);
  const publishedScore = published ?? 0;
  const coveragePct = publishedCoveragePct(score, scorecards);
  const measuredChecks = overall ? overall.measuredChecks : score.totalEvaluated;
  const totalChecks = overall ? overall.totalChecks : score.totalEvaluated;
  const hasAiEvidence = hasDirectionalAiEvidence(aiVisibility);
  const sample = directionalSample(aiVisibility);
  return (
    <section className="score-strip" aria-label="Audit score summary">
      <div className="score-card main-score">
        <div className="score-ring" style={{ "--score": `${publishedScore * 3.6}deg` } as React.CSSProperties}><strong>{published ?? "—"}</strong></div>
        <div><span>{t("websiteAuditScore")}</span><em>{published !== null ? `${coveragePct}% ${t("coverage")}` : t("scoreWithheld")}</em></div>
      </div>
      <div className="score-card">
        <span><BookOpenCheck size={15} />{t("coverage")}</span>
        <strong>{coveragePct}%</strong>
        <div className="metric-track"><i style={{ width: `${coveragePct}%` }} /></div>
        <em>{measuredChecks}/{totalChecks} {t("verifiedControls")}</em>
      </div>
      <div className="score-card">
        <span><CheckCircle2 size={15} />{t("confidence")}</span>
        <strong>{coveragePct >= 80 ? t("confidenceHigh") : coveragePct >= 50 ? t("confidenceMedium") : t("insufficientMeasurement")}</strong>
        <em>{measuredChecks}/{totalChecks} {t("verifiedControls")} · {overall?.observations ?? 0} {t("diagnostics")}</em>
      </div>
      {aiVisibilityEnabled && <div className="score-card visibility-status-card">
        <span><Globe2 size={15} />{t("observedAiVisibility")}</span>
        <strong>{hasAiEvidence ? `${aiVisibility?.mentionRate ?? 0}% ${t("mentions")}` : t("notMeasured")}</strong>
        <em>{hasAiEvidence ? `${sample.observed}/${sample.expected} ${t("promptCount")} · ${aiVisibility?.citationRate ?? 0}% ${t("citations")} · ${t("directional")}` : t("promptEvidenceRequired")}</em>
        <button className="ai-scan-button" onClick={onAnalyzeAi} disabled={!canAnalyzeAi || isAnalyzingAi}>{isAnalyzingAi ? t("scanningAi") : aiVisibility ? t("rerunAiScan") : t("runAiScan")}</button>
      </div>}
    </section>
  );
}

function onlineCheckLabel(check: OnlineScorecard["checks"][number], locale: Locale) {
  return locale === "tr" ? check.labelTr : check.label;
}

function OnlineScorecardsPanel({ scorecards, locale, measurementEvidence }: { scorecards: OnlineScorecards; locale: Locale; measurementEvidence?: Record<string, { contractVersion?: string }> }) {
  if (scorecards.pillars && scorecards.overall) {
    const pillars = Object.values(scorecards.pillars);
    // Version transparency (2026-09-23 product test): a saved record must say
    // which measurement contract produced it. If the stored evidence predates
    // the current engine the user is told the results may be re-interpreted —
    // "why did the same analysis change?" must never be a mystery.
    const storedVersions = [...new Set(Object.values(measurementEvidence ?? {}).map((entry) => entry.contractVersion).filter(Boolean))] as string[];
    const staleVersions = storedVersions.filter((version) => version !== MEASUREMENT_CONTRACT_VERSION);
    const issueCandidates = pillars
      .flatMap((card) => card.checks.map((check) => ({ ...check, pillar: card })))
      // Diagnostics never become issues: scoreEligible === false controls are observations
      // and are published in their own list instead of being counted as problems.
      .filter((item) => item.scoreEligible !== false && (item.status === "Fail" || item.status === "Partial"))
      .sort((a, b) => (a.status === b.status ? b.weight - a.weight : a.status === "Fail" ? -1 : 1));
    const uxRiskControls = (item: { sourceControlIds?: string[] }) => UX_RISK_CONTROLS.has(item.sourceControlIds?.[0] ?? "");
    const issues = [...new Map(issueCandidates.map((item) => [onlineScoreCheckFamily(item.id), item])).values()];
    const observationCandidates = pillars
      .flatMap((card) => card.checks.map((check) => ({ ...check, pillar: card })))
      .filter((item) => item.status === "Observation" || item.scoreEligible === false)
      .sort((a, b) => b.weight - a.weight);
    const observations = [...new Map(observationCandidates.map((item) => [onlineScoreCheckFamily(item.id), item])).values()];
    // Verified UX risks are promoted to their own section: measured experience
    // risks must never hide in the observational list (2026-09-23 product test).
    const uxRisks = [...new Map([...issueCandidates, ...observationCandidates].map((item) => [onlineScoreCheckFamily(item.id), item])).values()].filter(uxRiskControls);
    const score = scorecards.overall.score ?? 0;
    const coverageLabel = scorecards.overall.coveragePct >= 80
      ? (locale === "tr" ? "Güçlü kanıt" : "Strong evidence")
      : scorecards.overall.coveragePct >= 50
        ? (locale === "tr" ? "Ön puan" : "Preliminary score")
        : (locale === "tr" ? "Düşük kanıt" : "Low evidence");
    return (
      <section className="site-health-dashboard" aria-label={locale === "tr" ? "Site sağlığı ve kategori puanları" : "Site health and category scores"}>
        <header className="site-health-header">
          <div>
            <span className="dashboard-eyebrow">{locale === "tr" ? "OTOMATİK DENETİM ÇEKİRDEĞİ" : "AUTOMATED AUDIT CORE"}</span>
            <h2>{locale === "tr" ? "Site Sağlığı" : "Site Health"}</h2>
            <p>{locale === "tr" ? "Teknik SEO, içerik, UX, dönüşüm ve GEO kanıtları tek bir görünümde." : "Technical SEO, content, UX, conversion and GEO evidence in one view."}</p>
            <p className="contract-version">v{MEASUREMENT_CONTRACT_VERSION} · {locale === "tr" ? "ölçüm ve puanlama sürümü" : "measurement & scoring engine"}</p>
          </div>
          <span className={`coverage-confidence ${scorecards.overall.coveragePct >= 80 ? "strong" : scorecards.overall.coveragePct >= 50 ? "preliminary" : "low"}`}>{coverageLabel}</span>
        </header>
        {staleVersions.length > 0 && <p className="score-version-warning">{locale === "tr" ? `Bu kayıt ${staleVersions.join(", ")} ölçüm sözleşmesiyle üretildi ve güncel motorla (v${MEASUREMENT_CONTRACT_VERSION}) yeniden yorumlanmış olabilir. Güncel kanıt için analizi yeniden çalıştırın.` : `This record was produced under measurement contract ${staleVersions.join(", ")} and may be re-interpreted by the current engine (v${MEASUREMENT_CONTRACT_VERSION}). Re-run the analysis for current evidence.`}</p>}

        <div className="site-health-summary">
          <div className="health-score-block">
            <div className="health-ring" style={{ background: `conic-gradient(#0e9f6e ${score}%, #e7eceb ${score}% 100%)` }}>
              <div><strong>{scorecards.overall.score ?? "—"}</strong><span>/100</span></div>
            </div>
            <div><strong>{locale === "tr" ? "Genel sağlık puanı" : "Overall health score"}</strong><p>{scorecards.overall.score !== null ? (locale === "tr" ? "Yalnızca bu taramada ölçülen kanıtlara dayanır." : "Based only on evidence measured in this crawl.") : (locale === "tr" ? `Genel skor yayınlanmadı: kanıt kapsamı %${scorecards.overall.coveragePct} — puan için en az %50 gerekli (Ön puan). Ölçülemeyen kontroller geçti sayılmaz.` : `No overall score is published: evidence coverage is ${scorecards.overall.coveragePct}% — at least 50% is required. Unmeasured controls never count as passes.`)}</p></div>
          </div>
          <dl className="health-stat-grid">
            <div className="error"><dt>{locale === "tr" ? "Hata" : "Errors"}</dt><dd>{scorecards.overall.errors}</dd><small>{locale === "tr" ? "Düzeltme gerekli" : "Needs a fix"}</small></div>
            <div className="warning"><dt>{locale === "tr" ? "Uyarı" : "Warnings"}</dt><dd>{scorecards.overall.warnings}</dd><small>{locale === "tr" ? "İyileştirilebilir" : "Can improve"}</small></div>
            <div className="notice"><dt>{locale === "tr" ? "Ölçülemeyen" : "Not measured"}</dt><dd>{scorecards.overall.notices}</dd><small>{locale === "tr" ? "Ek kanıt gerekli" : "Needs evidence"}</small></div>
            <div className="coverage"><dt>{locale === "tr" ? "Kanıt kapsamı" : "Evidence coverage"}</dt><dd>{scorecards.overall.coveragePct}%</dd><small>{scorecards.overall.measuredChecks}/{scorecards.overall.totalChecks} {locale === "tr" ? "kontrol" : "checks"}</small></div>
          </dl>
        </div>

        <div className="pillar-score-grid">
          {pillars.map((card) => {
            const open = card.checks.filter((item) => item.scoreEligible !== false && (item.status === "Fail" || item.status === "Partial"));
            return <article key={card.id} className="pillar-score-card">
              <div className="pillar-score-head"><span>{locale === "tr" ? card.labelTr : card.label}</span><strong>{card.score ?? "—"}<small>/100</small></strong></div>
              <div className="pillar-score-track"><i style={{ width: `${card.score ?? 0}%` }} /></div>
              <div className="pillar-score-meta"><span className={`pillar-evidence ${card.status.toLowerCase()}`}>{card.status === "Insufficient" ? (locale === "tr" ? "Yetersiz kanıt" : "Insufficient evidence") : card.status === "Preliminary" ? (locale === "tr" ? "Ön puan" : "Preliminary") : (locale === "tr" ? "Ölçüldü" : "Measured")} · {card.coveragePct}%</span><span>{open.length} {locale === "tr" ? "açık konu" : "open issues"}</span></div>
            </article>;
          })}
        </div>

        <section className="score-issue-table" aria-label={locale === "tr" ? "Öncelikli sorunlar" : "Priority issues"}>
          <div className="score-issue-heading"><div><h3>{locale === "tr" ? "Öncelikli sorunlar" : "Priority issues"}</h3><p>{locale === "tr" ? "Etkisi en yüksek hatalar ve uyarılar." : "Highest-impact errors and warnings."}</p></div><strong>{issues.length}</strong></div>
          {issues.length ? <div className="score-table-wrap"><table>
            <thead><tr><th>{locale === "tr" ? "Önem" : "Severity"}</th><th>{locale === "tr" ? "Sorun" : "Issue"}</th><th>{locale === "tr" ? "Kategori" : "Category"}</th><th>{locale === "tr" ? "Etkilenen URL" : "Affected URLs"}</th><th>{locale === "tr" ? "Yapılacak" : "Recommended action"}</th></tr></thead>
            <tbody>{issues.slice(0, 10).map((item) => <tr key={`${item.pillar.id}:${item.id}`}>
              <td><span className={`score-severity ${item.status.toLowerCase()}`}>{item.status === "Fail" ? (locale === "tr" ? "Hata" : "Error") : (locale === "tr" ? "Uyarı" : "Warning")}</span></td>
              <td><strong>{onlineCheckLabel(item, locale)}</strong><p className="score-issue-summary">{findingSummary(item as SummaryInput, locale === "tr" ? "tr" : "en") ?? (item.affectedUrls.length
                ? (locale === "tr" ? `${item.affectedUrls.length} URL'de bu sorun doğrulandı.` : `This issue was confirmed on ${item.affectedUrls.length} URLs.`)
                : (locale === "tr" ? "Kontrol düzeyinde sorun bulundu; URL kanıtı oluşmadı." : "A check-level issue was found without URL evidence."))}</p><details className="score-technical-evidence"><summary>{locale === "tr" ? "Teknik kanıtı göster" : "Show technical evidence"}</summary><p>{item.evidence}</p></details></td>
              <td>{locale === "tr" ? item.pillar.labelTr : item.pillar.label}</td>
              <td>{item.affectedUrls.length ? <details className="score-url-list" open={item.affectedUrls.length <= 3}>
                <summary>{item.affectedUrls.length} {locale === "tr" ? "URL'yi göster" : "show URLs"}</summary>
                <ul>{item.affectedUrls.slice(0, 10).map((url) => {
                  const href = safeHttpUrl(url);
                  return <li key={url}>{href ? <a href={href} target="_blank" rel="noopener noreferrer" title={url}>{compactUrl(url)} <span aria-hidden="true">↗</span></a> : <span>{compactUrl(url)}</span>}</li>;
                })}</ul>
                {item.affectedUrls.length > 10 && <p>+{item.affectedUrls.length - 10} {locale === "tr" ? "URL daha" : "more URLs"}</p>}
              </details> : <span className="score-no-url">—</span>}</td>
              <td>{locale === "tr" ? item.actionTr : item.action}</td>
            </tr>)}</tbody>
          </table></div> : <div className="score-empty-state"><CheckCircle2 size={22}/><strong>{locale === "tr" ? `Ölçülen ${scorecards.overall.measuredChecks} kontrolde 0 sorun` : `0 issues in ${scorecards.overall.measuredChecks} measured controls`}</strong><p>{locale === "tr" ? `${scorecards.overall.notices} kontrol ölçülemedi, ${scorecards.overall.observations ?? 0} kontrol de gözlem olarak yayımlandı. Ölçülemeyen kontrollerin geçtiği anlamına gelmez; kanıt kapsamını kontrol edin.` : `${scorecards.overall.notices} controls could not be measured and ${scorecards.overall.observations ?? 0} controls are published as observations. This does not mean they passed; review evidence coverage.`}</p></div>}
        </section>
        {uxRisks.length > 0 && <section className="score-observation-table ux-risk-section" aria-label={locale === "tr" ? "Doğrulanmış UX riskleri" : "Verified UX risks"}>
          <div className="score-issue-heading"><div><h3>{locale === "tr" ? "Doğrulanmış UX riskleri" : "Verified UX risks"}</h3><p>{locale === "tr" ? "Ölçülmüş ve doğrulanmış deneyim riskleri — puan dışı olsalar bile önceliklidir." : "Measured, verified experience risks — they stay priorities even when the score holds them back."}</p></div><strong>{uxRisks.length}</strong></div>
          <ul className="score-observation-list">{uxRisks.map((item) => {
            const summaryLocale = locale === "tr" ? "tr" : "en";
            const summary = findingSummary(item as SummaryInput, summaryLocale);
            const metric = findingMetric(item as SummaryInput, summaryLocale);
            const exclusion = item.scoreEligible === false ? scoreExclusionReason(item.reasonCode, summaryLocale) : null;
            return <li key={`ux-risk-${item.id}`}>
              <strong>{onlineCheckLabel(item, locale)}</strong>
              <span className="score-observation-tag">{metric ? `${metric} · ` : ""}{item.scoreEligible === false ? (locale === "tr" ? "puan dışı" : "not scored") : (locale === "tr" ? "puana dahil" : "scored")}</span>
              <p>{summary ?? item.evidence}</p>
              {exclusion && <details className="score-technical-evidence"><summary>{locale === "tr" ? "Neden puan yok?" : "Why is there no score?"}</summary><p>{exclusion}</p></details>}
            </li>;
          })}</ul>
        </section>}
        {observations.length > 0 && <section className="score-observation-table" aria-label={locale === "tr" ? "Gözlemsel bulgular" : "Observational findings"}>
          <div className="score-issue-heading"><div><h3>{locale === "tr" ? "Gözlemsel bulgular" : "Observational findings"}</h3><p>{locale === "tr" ? "Puana girmez: yöntemi henüz kalibre edilmemiş kontroller bulgu olarak yayımlanır ve kaybolmaz." : "Never scored: controls whose method is not calibrated yet stay visible as findings."}</p></div><strong>{observations.length}</strong></div>
          <ul className="score-observation-list">{observations.slice(0, 8).map((item) => <li key={`${item.pillar.id}:${item.id}`}>
            <strong>{onlineCheckLabel(item, locale)}</strong>
            <span className="score-observation-tag">{item.observedStatus ? (locale === "tr" ? `gözlem: ${item.observedStatus}` : `observation: ${item.observedStatus}`) : (locale === "tr" ? "gözlem" : "observation")} · {locale === "tr" ? "puan dışı" : "not scored"}</span>
            <p>{findingSummary(item as SummaryInput, locale === "tr" ? "tr" : "en") ?? item.evidence}</p>
          </li>)}</ul>
        </section>}
        <p className="online-score-disclaimer">{locale === "tr" ? "GEO hazırlık puanı teknik keşfedilebilirliği ve yanıt-kaynağı hazırlığını ölçer. Canlı AI anılma ve kaynak gösterimi ayrı AI Görünürlüğü testiyle ölçülür." : "GEO readiness measures technical discoverability and answer-source readiness. Live AI mentions and citations are measured separately by the AI Visibility test."}</p>
      </section>
    );
  }
  const cards = [scorecards.seo, scorecards.geo];
  return (
    <section className="online-scorecards" aria-label={locale === "tr" ? "Online SEO ve GEO puanları" : "Online SEO and GEO scores"}>
      <header>
        <div>
          <h2>{locale === "tr" ? "Ölçülen SEO ve GEO durumu" : "Measured SEO and GEO status"}</h2>
          <p>{locale === "tr" ? "Puanlar yalnızca bu taramada elde edilen kanıtlardan hesaplanır; ölçülemeyen kontroller puanı düşürmez ve kapsam ayrıca gösterilir." : "Scores use only evidence collected in this crawl; unavailable checks do not lower the score and coverage is shown separately."}</p>
        </div>
      </header>
      <div className="online-scorecard-grid">
        {cards.map((card) => {
          const open = card.checks
            .filter((item) => item.scoreEligible !== false && (item.status === "Fail" || item.status === "Partial"))
            .sort((a, b) => (a.status === b.status ? b.weight - a.weight : a.status === "Fail" ? -1 : 1));
          return <article key={card.id}>
            <div className="online-scorecard-head">
              <div><span>{locale === "tr" ? card.labelTr : card.label}</span><strong>{card.score === null ? "—" : `${card.score}/100`}</strong></div>
              <div><span>{locale === "tr" ? "Kanıt kapsamı" : "Evidence coverage"}</span><strong>{card.coveragePct}%</strong><small>{card.measuredChecks}/{card.totalChecks}</small></div>
            </div>
            <div className="online-score-track"><i style={{ width: `${card.score ?? 0}%` }} /></div>
            <h3>{locale === "tr" ? "Öncelikli düzeltmeler" : "Priority fixes"}</h3>
            {open.length ? <ol>{open.slice(0, 4).map((item) => <li key={item.id}>
              <div><span className={`online-status ${item.status.toLowerCase()}`}>{item.status === "Fail" ? (locale === "tr" ? "Başarısız" : "Fail") : (locale === "tr" ? "Kısmi" : "Partial")}</span><strong>{onlineCheckLabel(item, locale)}</strong></div>
              <p>{locale === "tr" ? item.actionTr : item.action}</p>
              {item.affectedUrls.length > 0 && <small>{item.affectedUrls.length} {locale === "tr" ? "etkilenen URL" : "affected URLs"}</small>}
            </li>)}</ol> : <p>{locale === "tr" ? "Bu ölçüm çekirdeğinde açık sorun bulunmadı." : "No open issue was found in this measured core."}</p>}
          </article>;
        })}
      </div>
      <p className="online-score-disclaimer">{locale === "tr" ? "GEO hazırlık puanı teknik keşfedilebilirliği ve yanıt-kaynağı hazırlığını ölçer; canlı AI motoru görünürlüğü, anılma veya kaynak gösterilme garantisi değildir." : "The GEO readiness score measures technical discoverability and answer-source readiness; it does not guarantee live AI-engine visibility, mentions, or citations."}</p>
    </section>
  );
}

function AiVisibilityPanel({ data, runs, t }: { data: AiVisibilitySummary; runs?: AiVisibilitySummary[]; t: Translate }) {
  const current = data.methodVersion === AI_VISIBILITY_METHOD_VERSION;
  const successful = data.observations.filter((observation) => !observation.error);
  const direct = successful.filter((observation) => observation.kind === "brand-direct" || observation.kind === "brand-review");
  const discovery = successful.filter((observation) => !direct.includes(observation));
  const mentionRate = (items: typeof successful) => items.length ? Math.round(items.filter((item) => item.brandMentioned).length / items.length * 100) : null;
  const providerSourcesUnavailable = current && discovery.length > 0 && discovery.some((observation) => observation.citationEvidence !== "provider-sources");
  return (
    <section className="ai-visibility-panel" aria-label="AI Visibility evidence">
      <header>
        <div>
          <span>AI Visibility outcome</span>
          <h2>Prompt-level engine evidence</h2>
          <p>{data.scoreReason}</p>
          <p>{t(current ? 'aiSourceLimit' : 'aiLegacyEvidence')}</p>
        </div>
        <div className="ai-engine-list">{data.engines.map((engine) => <span key={engine.id}>{engine.label}</span>)}</div>
      </header>
      <div className="ai-metric-grid">
        <div><span>Direct brand prompts</span><strong>{percentMetric(current ? mentionRate(direct) : null)}</strong><em>{direct.length} completed direct prompts</em></div>
        <div><span>Discovery prompts</span><strong>{percentMetric(current ? mentionRate(discovery) : null)}</strong><em>{discovery.length} completed unbranded prompts</em></div>
        <div><span>{t('aiProviderCitations')}</span><strong>{percentMetric(current ? data.citationRate : null)}</strong><em>{providerSourcesUnavailable ? t('aiCitationUnknown') : t('aiProviderReported')}</em></div>
        <div><span>Coverage</span><strong>{data.coveragePct}%</strong><em>{data.completedObservations}/{data.expectedObservations} responses</em></div>
        <div><span>{t.locale === "tr" ? "Ölçüm modu" : "Search mode"}</span><strong>{data.searchMode === "web" ? t("searchModeWeb") : t("searchModeNone")}</strong><em>{data.runId ? `run ${data.runId.slice(0, 8)}` : "—"}</em></div>
      </div>
      {runs && runs.length > 0 ? <section className="ai-round-comparison" aria-label="AI visibility pilot rounds">
        <h3>{t.locale === "tr" ? "Pilot tur karşılaştırması" : "Pilot round comparison"}</h3>
        <div>{runs.map((run, index) => <article key={`${run.measuredAt}:${index}`}>
          <strong>{t.locale === "tr" ? `Tur ${index + 1}` : `Round ${index + 1}`}</strong>
          <span>{run.completedObservations}/{run.expectedObservations} {t.locale === "tr" ? "yanıt" : "responses"}</span>
          <span>{run.mentionRate ?? "—"}% {t.locale === "tr" ? "anılma" : "mentions"}</span>
          <span>{run.citationRate ?? "—"}% {t.locale === "tr" ? "kaynak" : "citations"}</span>
        </article>)}</div>
      </section> : null}
      {providerSourcesUnavailable && <p className="ai-source-warning">{t('aiSourceLimit')}</p>}
      <details>
        <summary>Review prompts and engine responses</summary>
        <div className="ai-observation-list">
          {data.observations.map((observation) => {
            const prompt = data.prompts.find((item) => item.id === observation.promptId);
            return (
              <article key={`${observation.engineId}:${observation.promptId}`}>
                <div><strong>{observation.engineId}</strong><span>{prompt?.kind}</span><em>{observation.latencyMs} ms</em></div>
                <p>{prompt?.query}</p>
                {observation.error ? <small>{observation.error}</small> : <blockquote>{observation.answer}</blockquote>}
                <footer><span>{observation.kind === "brand-direct" || observation.kind === "brand-review" ? "Direct brand prompt" : "Discovery prompt"}</span><span>{current ? observation.brandMentioned ? "Brand mentioned" : "No brand mention" : t('aiLegacyEvidence')}</span><span>{!current || observation.citationEvidence!=='provider-sources' ? t('aiCitationUnknown') : observation.targetCited ? t('aiProviderCitations') : t('aiNoTargetSource')}</span></footer>
                {current && <><p>{t('aiSourceUrls')}: {observation.citedUrls.join(' · ') || '—'}</p><p>{t('aiAnswerUrls')}: {observation.answerUrls?.join(' · ') || '—'}</p></>}
              </article>
            );
          })}
        </div>
      </details>
    </section>
  );
}

function MeasurementNotice({ t }: { t: Translate }) {
  return (
    <section className="measurement-notice" aria-label={t("measurementMethod")}>
      <ShieldCheck size={19} aria-hidden="true" />
      <div>
        <strong>{t("measurementMethod")}</strong>
        <p>{t("measurementMethodDetail")}</p>
      </div>
    </section>
  );
}

function GeoEvidenceStatus({ aiVisibility, t }: { aiVisibility?: AiVisibilitySummary; t: Translate }) {
  const hasEvidence = hasDirectionalAiEvidence(aiVisibility);
  const metrics = [
    {
      label: t("promptCoverage"),
      value: hasEvidence && aiVisibility ? `${aiVisibility.completedObservations}/${aiVisibility.expectedObservations}` : "—",
      detail: hasEvidence && aiVisibility ? `${aiVisibility.coveragePct}%` : t("pendingEvidence"),
    },
    {
      label: t("mentions"),
      value: hasEvidence && aiVisibility?.mentionRate !== null && aiVisibility?.mentionRate !== undefined ? `${aiVisibility.mentionRate}%` : "—",
      detail: hasEvidence ? `${directionalSample(aiVisibility).observed}/${directionalSample(aiVisibility).expected} ${t("promptCount")} · ${t("directional")}` : t("pendingEvidence"),
    },
    {
      label: t("citations"),
      value: hasEvidence && aiVisibility?.citationRate !== null && aiVisibility?.citationRate !== undefined ? `${aiVisibility.citationRate}%` : "—",
      detail: hasEvidence ? t("directional") : t("pendingEvidence"),
    },
    {
      label: t("aiOtherSourceDomains"),
      value: hasEvidence ? aiVisibility?.topCompetitors[0]?.domain ?? "—" : "—",
      detail: hasEvidence ? t("directional") : t("pendingEvidence"),
    },
  ];
  return (
    <section className="geo-evidence-status" aria-label={hasEvidence ? t("geoEvidenceMeasuredTitle") : t("geoEvidencePendingTitle")}>
      <header>
        <div>
          <span>{t("observedAiVisibility")}</span>
          <h2>{hasEvidence ? t("geoEvidenceMeasuredTitle") : t("geoEvidencePendingTitle")}</h2>
          <p>{hasEvidence ? t("geoEvidenceMeasuredDetail") : t("geoEvidencePendingDetail")}</p>
        </div>
        <strong>{hasEvidence ? `${aiVisibility?.mentionRate ?? 0}% ${t("mentions")}` : t("notMeasured")}</strong>
      </header>
      <div className="geo-evidence-grid">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <span>{metric.label}</span>
            <strong>{metric.value}</strong>
            <em>{metric.detail}</em>
          </div>
        ))}
      </div>
    </section>
  );
}

function PageEvidence({evidence, t}: {evidence?: MeasurementEvidence; t: Translate}) {
  if (evidence?.pageResults?.some(row=>row.headerDeclarations)) return <section className="page-evidence-results"><h4>{t('headerEvidenceTitle')}</h4><p>{t('headerEvidenceLimit')}</p>{evidence.pageResults.map(row=><details key={row.url} open><summary>{row.url}</summary>{row.headerDeclarations ? <ul>{row.headerDeclarations.map(header=><li key={header.name}><strong>{header.name}</strong>{header.value===null ? <p>{t('headerAbsent')}</p> : header.value==='' ? <p>{t('headerEmpty')}</p> : <code>{header.value}</code>}</li>)}</ul> : <p>{t('legacyEvidence')}</p>}</details>)}</section>;
  if (evidence?.schemaDetails?.length) return <section className="page-evidence-results"><h4>{t('schemaEvidenceTitle')}</h4><p>{t('schemaEvidenceLimit')}</p>{evidence.schemaDetails.map(row=><details key={row.url}><summary>{row.url} · JSON-LD: {row.blocks.length}</summary>{!row.blocks.length && <p>{t('schemaAbsent')}</p>}<ul>{row.blocks.map(block=><li key={block.index}><strong>#{block.index} · {t(block.state==='invalid' ? 'schemaInvalid' : block.state==='limited' ? 'schemaLimited' : 'schemaParsed')}</strong><p>@type: {block.types.join(', ') || '—'}</p></li>)}</ul></details>)}</section>;
  if (evidence?.canonicalDetails?.length) return <section className="page-evidence-results"><h4>{t('canonicalTargets')}</h4><p>{t('canonicalLimits')}</p><ul>{evidence.canonicalDetails.map(row => <li key={row.url}><span>{row.url}</span><p>Canonical → {row.target ?? '—'}</p><strong>{t(({missing:'canonicalMissing',invalid:'canonicalInvalid',unavailable:'canonicalUnavailable',budget:'canonicalBudget','http-error':'canonicalHttpError','non-html':'canonicalNonHtml',review:'canonicalReview'} as const)[row.state])}{row.httpStatus ? ` · HTTP ${row.httpStatus}` : ''}</strong>{row.redirected && <p>{t('canonicalRedirect')}: {row.finalUrl}</p>}{row.target && row.target !== row.url && <p>{t('canonicalDifferent')}</p>}{row.noindex && <p>{t('canonicalNoindex')}</p>}{row.chain && <p>{t('canonicalChain')}</p>}{row.targetCanonical && <p>{t('canonicalTargetDeclaration')}: {row.targetCanonical}</p>}{row.targetCanonicalInvalid && <p>{t('canonicalTargetInvalid')}</p>}{row.returnsToSource && <p>{t('canonicalReturnsSource')}</p>}{Boolean(row.redirectTrace?.length) && <ul>{row.redirectTrace!.map((hop,index)=><li key={index}><span>{hop.url}</span><p>HTTP {hop.status} → {hop.target}</p></li>)}</ul>}</li>)}</ul></section>;
  if (evidence?.indexingDetails?.length) return <section className="page-evidence-results"><h4>{t("indexingEvidenceTitle")}</h4><p>{t("indexingEvidenceLimit")}</p><ul>{evidence.indexingDetails.map(row=><li key={row.url}><span>{row.url}</span><strong>{row.bot} · {t(row.noindex ? "indexingRuleFound" : "indexingRuleAbsent")}</strong>{row.declarations.length ? <ul>{row.declarations.map((rule,index)=><li key={index}><span>{rule.source === "html" ? "HTML meta" : "X-Robots-Tag"}</span><code>{rule.value}</code></li>)}</ul> : <p>{t("indexingNoDeclaration")}</p>}</li>)}</ul></section>;
  if (evidence?.robotsDetails?.length) return <section className="page-evidence-results"><h4>{t("robotsDetailsTitle")}</h4><p>{t("robotsDetailsLimit")}</p>{[...new Set(evidence.robotsDetails.map(row=>row.bot))].map(bot=><details key={bot}><summary>{bot} ({evidence.robotsDetails!.filter(row=>row.bot===bot).length})</summary><ul>{evidence.robotsDetails!.filter(row=>row.bot===bot).map(row=><li key={row.url}><span>{row.url}</span><strong>{t(row.allowed===null ? "robotsUnknown" : row.allowed ? "robotsAllowed" : "robotsDisallowed")}</strong><p>robots.txt: {row.policyUrl} · {row.policyStatus ? "HTTP "+row.policyStatus : t("robotsUnavailable")} · Content-Type: {row.policyContentType || '—'}</p>{row.group && <p>User-agent: <code>{row.group}</code></p>}{row.rule ? <code>{row.rule}</code> : <p>{t(row.reasonCode==="different-origin" ? "robotsDifferentOrigin" : row.reasonCode==="complex" ? "robotsComplex" : row.reasonCode==="unsupported" ? "robotsUnsupported" : row.allowed===null ? "robotsUnavailable" : "robotsNoRule")}</p>}</li>)}</ul></details>)}</section>;
  if (evidence?.languageDetails?.length) return <section className="page-evidence-results"><h4>{t("languageDetailsTitle")}</h4><p>{t("languageDetailsLimit")}</p>{evidence.languageDetails.map(row=><details key={row.url}><summary>{row.url} · lang: {row.lang || "—"} · hreflang: {row.alternates.length}</summary>{!row.alternates.length ? <p>{t("languageNoHtml")}</p> : <ul>{row.alternates.map((alternate,index)=><li key={index}><strong>{alternate.language || "—"}</strong><span>{alternate.target || "—"}</span>{!alternate.absolute && <p>{t("languageInvalidTarget")}</p>}{alternate.conflict && <p>{t("languageConflict")}</p>}<p>{t(!alternate.sampled ? "languageNotSampled" : alternate.returnInHtml ? "languageReturnFound" : "languageReturnAbsent")}</p></li>)}</ul>}</details>)}</section>;
  if (evidence?.contentDetails?.length) return <section className="page-evidence-results"><h4>{t("contentEvidenceTitle")}</h4><p>{t(evidence.metricId === "navigation-candidates" ? "navigationHintsLimit" : "contentEvidenceLimit")}</p>{evidence.contentDetails.map(row=><details key={row.url}><summary>{row.url} ({(row.headings??row.images??row.links??[]).length})</summary><ul>{row.headings?.map((heading,index)=><li key={index}><strong>H{heading.level}</strong><span>{heading.text || "—"}</span>{heading.skipped && <p>{t("contentHeadingSkip")}</p>}</li>)}{row.images?.map((img,index)=><li key={index}><span>{img.src || "—"}</span><strong>{t(img.alt===null ? "contentAltMissing" : img.alt.trim()==="" ? "contentAltEmpty" : "contentAltPresent")}</strong>{img.alt && <p>{img.alt}</p>}</li>)}{row.links?.map((link,index)=><li key={index}><span>{link.target}</span><p>{link.text || "—"}</p><strong>{link.status ? "HTTP "+link.status : t("contentLinkUnknown")}</strong>{link.finalUrl&&link.finalUrl!==link.target && <p>→ {link.finalUrl}</p>}</li>)}</ul></details>)}</section>;
  const rows = evidence?.pageResults;
  if (!rows?.length) return <p className="legacy-evidence">{t("legacyEvidence")}</p>;
  const affected = rows.filter(row => row.status === "Fail" || row.status === "Partial");
  const pageSummary = pageEvidenceSummary(rows);
  const renderRow = (row: NonNullable<MeasurementEvidence["pageResults"]>[number]) => {
    let href: string | undefined;
    try { const url = new URL(row.url); if (url.protocol === "http:" || url.protocol === "https:") href = url.href; } catch {}
    return <li key={row.url}><span>{href ? <a href={href} target="_blank" rel="noopener noreferrer">{row.url}</a> : row.url}</span><strong>{row.status === "Fail" ? t("fail") : row.status === "Partial" ? t("partial") : row.status === "Pass" ? t("pass") : "N/A"}</strong>{row.measurementState && <p>{t(row.measurementState === "complete" ? "pageMeasurementComplete" : row.measurementState === "incomplete-resources" ? "pageMeasurementResources" : "pageMeasurementCoverage")}</p>}{row.value !== undefined && <p>{row.value || t("emptyValue")}</p>}{row.declarations && row.declarations.length > 1 && <div><strong>{t("multipleMetadata")} ({row.declarations.length})</strong><p>{t("multipleMetadataHelp")}</p><ol>{row.declarations.map((value,index)=><li key={index}>{value || t("emptyValue")}</li>)}</ol></div>}</li>;
  };
  return <section className="page-evidence-results"><h4>{pageSummary.affected ? `${t("affectedScope")}: ${affected.length} / ${rows.length}` : `${t("checkedPageResults")}: ${rows.length}`}</h4>{pageSummary.unresolved > 0 && <p>{t("pageVerdictUnavailable")}: {pageSummary.unresolved}. {t("pageVerdictUnavailableHelp")}</p>}{evidence?.elements && <><p>{t('distinctElements')}: {evidence.elements.length}. {t('viewportNotIssues')}</p><ul>{evidence.elements.map((element,index) => <li key={index}><span>{element.url}</span><code>{element.target}</code>{rows.find(row=>row.url===element.url)?.measurementState?.startsWith("incomplete") && <p>{t("pageElementUncertain")}</p>}<p>{element.rule} · {element.viewports.join(', ')}</p></li>)}</ul></>}{rows.some(row=>row.measurementState?.startsWith("incomplete")) && <p>{t("pageMeasurementPartialHelp")}</p>}{affected.length ? <ul>{affected.map(renderRow)}</ul> : pageSummary.unresolved === 0 ? <p>{t("noAffectedPages")}</p> : null}<details open={pageSummary.unresolved > 0}><summary>{t("checkedPageResults")} ({rows.length})</summary><ul>{rows.map(renderRow)}</ul></details></section>;
}

function ActionCenter({
  measurementEvidence,
  analysis,
  workflow,
  onScreenshot,
  onWorkflow,
  t,
}: {
  measurementEvidence: Record<string, MeasurementEvidence>;
  analysis: Analysis;
  workflow: Record<string, FindingWorkflow>;
  onScreenshot: (itemId: string, screenshotName: string, screenshot: string) => void;
  onWorkflow: (itemId: string, field: keyof FindingWorkflow, value: string) => void;
  t: Translate;
}) {
  const [filter, setFilter] = useState<"All" | WorkflowStatus>("All");
  const findings = analysis.detailedIssues.filter((issue) => {
    const status = workflow[issue.id]?.status ?? "Open";
    return filter === "All" || status === filter;
  });

  return (
    <section className="action-center-view">
      <header className="action-center-header">
        <div>
          <span>{t("delivery")}</span>
          <h2>{t("actions")}</h2>
          <p>{t("actionCenterDetail")}</p>
        </div>
        <div className="action-summary" aria-label={t("actions")}>
          <strong>{analysis.counts.actionable}</strong>
          <span>{t("actionableFindings")}</span>
        </div>
      </header>

      <div className="action-filter" role="group" aria-label={t("delivery")}>
        {(["All", "Open", "Planned", "In progress", "Done"] as const).map((status) => (
          <button
            type="button"
            className={filter === status ? "active" : ""}
            key={status}
            onClick={() => setFilter(status)}
          >
            {status === "All" ? t("all") : status === "Open" ? t("open") : status === "Planned" ? t("planned") : status === "In progress" ? t("inProgress") : t("done")}
          </button>
        ))}
      </div>

      <div className="action-list">
        {findings.length === 0 ? (
          <p className="empty-filter">{t("noActionMatches")}</p>
        ) : findings.map((issue) => {
          const itemWorkflow = workflow[issue.id] ?? { owner: "", dueDate: "", status: "Open" as WorkflowStatus };
          return (
            <article className="action-item" key={issue.id}>
              <div className="action-item-copy">
                <div>
                  <span className={`priority-badge priority-${issue.priority.toLowerCase()}`}>{priorityText(issue.priority, t)}</span>
                  <span className="category-badge">{issue.category}</span>
                </div>
                <h3>{findingGuidance(issue.id, t.locale ?? "en")?.[0] ?? findingTitle(issue.id, issue.item, t)}</h3>
                <PageEvidence evidence={measurementEvidence[issue.id]} t={t}/>
                <p>{findingGuidance(issue.id, t.locale ?? "en")?.[1] ?? t("genericNextAction")}</p>
                {issue.note && <details><summary>{t("originalEvidence")}</summary><small>{issue.note}</small></details>}
          </div>
              <div className="action-fields">
                <label>{t("owner")}<input value={itemWorkflow.owner} onChange={(event) => onWorkflow(issue.id, "owner", event.target.value)} /></label>
                <label>{t("dueDate")}<input type="date" value={itemWorkflow.dueDate} onChange={(event) => onWorkflow(issue.id, "dueDate", event.target.value)} /></label>
                <label>{t("delivery")}<select value={itemWorkflow.status} onChange={(event) => onWorkflow(issue.id, "status", event.target.value)}>
                  <option value="Open">{t("open")}</option>
                  <option value="Planned">{t("planned")}</option>
                  <option value="In progress">{t("inProgress")}</option>
                  <option value="Done">{t("done")}</option>
                </select></label>
                <label className="screenshot-control">
                  Screenshot
                  <input
                    aria-label={`Screenshot for ${findingTitle(issue.id, issue.item, t)}`}
                    accept={SCREENSHOT_ACCEPT}
                    type="file"
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      event.target.value = "";
                      if (!file) return;
                      readEvidenceScreenshot(file, (screenshot) => onScreenshot(issue.id, file.name, screenshot));
                    }}
                  />
                </label>
                {itemWorkflow.screenshot && (
                  <div className="screenshot-preview">
                    <img src={itemWorkflow.screenshot} alt="" />
                    <span>{itemWorkflow.screenshotName || "Screenshot attached"}</span>
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function Checklist({
  activeCategory,
  aiVisibility,
  measurementEvidence,
  priorityFilter,
  notes,
  results,
  workflow,
  statusFilter,
  onPriorityFilter,
  onStatusFilter,
  onScreenshot,
  onWorkflow,
  t,
}: {
  activeCategory: (typeof AUDIT_CATEGORIES)[number];
  aiVisibility?: AiVisibilitySummary;
  measurementEvidence: Record<string, MeasurementEvidence>;
  priorityFilter: "all" | "Critical";
  notes: Record<string, string>;
  results: AuditResults;
  workflow: Record<string, FindingWorkflow>;
  statusFilter: StatusFilter;
  onPriorityFilter: (filter: "all" | "Critical") => void;
  onStatusFilter: (filter: StatusFilter) => void;
  onScreenshot: (itemId: string, screenshotName: string, screenshot: string) => void;
  onWorkflow: (itemId: string, field: keyof FindingWorkflow, value: string) => void;
  t: Translate;
}) {
  const isGeoCategory = activeCategory.id === "serp";
  const counts = summarizeFindings(activeCategory.sections.flatMap(section => section.items.map(item => item.id)), results, measurementEvidence, notes);
  const hasActiveFilters = priorityFilter !== "all" || statusFilter !== "all";
  const sections = activeCategory.sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        const status = results[item.id];
        if (!status && !(measurementEvidence[item.id] && notes[item.id])) return false;
        const priorityMatch = priorityFilter === "all" || item.priority === priorityFilter;
        const statusMatch =
          statusFilter === "all" ||
          (statusFilter === "Blank" ? !status : status === statusFilter);
        return priorityMatch && statusMatch;
      }),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <section className="checklist-panel">
      <div className="panel-title">
        <div><p>{t(categoryTextKey(activeCategory.id))}</p><h1>{counts.issues} {t("measuredIssues")}</h1><p>{counts.passed} {t("passedControls")} · {counts.review} {t("reviewControls")} · {counts.unavailable} {t("unavailableControls")}</p><p>{sections.reduce((count, section) => count + section.items.length, 0)} {t("listedControls")}. {t("observationExplanation")}</p></div>
      </div>
      <div className="filter-bar">
        <button className={priorityFilter === "all" ? "active" : ""} onClick={() => onPriorityFilter("all")}>{t("allPriorities")}</button>
        <button className={priorityFilter === "Critical" ? "active" : ""} onClick={() => onPriorityFilter("Critical")}>{t("criticalOnly")}</button>
        {(["all", "Fail", "Partial", "Pass", "N/A", "Blank"] as StatusFilter[]).map((filter) => (
          <button className={statusFilter === filter ? "active" : ""} key={filter} onClick={() => onStatusFilter(filter)}>
            {filter === "Blank" ? t("reviewControls") : filter === "N/A" ? t("na") : t(filter.toLowerCase() as "all" | "fail" | "partial" | "pass" | "blank")}
          </button>
        ))}
      </div>
      {isGeoCategory && <GeoEvidenceStatus aiVisibility={aiVisibility} t={t} />}
      {sections.length === 0 && (!isGeoCategory || hasActiveFilters) && (
        <p className="empty-filter">
          {statusFilter === "all" && priorityFilter === "all" ? t("noAutomatedResults") : t("noMatches")}
        </p>
      )}
      {sections.map((section) => (
        <article className="section-block" key={section.id}>
          <h2>{t.locale === "tr" ? TR_SECTIONS[section.id] ?? section.label : section.label}</h2>
          {section.items.map((item) => (
            <div className="audit-row" id={`finding-${item.id}`} key={item.id}>
              <div className="audit-row-heading">
                <div className="item-copy">
                  <span>{priorityText(item.priority, t)}</span>
                  <h3>{item.num}. {findingTitle(item.id, item.item, t)}</h3>

                </div>
                {!results[item.id] && <div className="result-readout diagnostic"><strong>{t("observationOnly")}</strong><span>{t("notScoredDetail")}</span></div>}
                {results[item.id] && (
                  <div className={`result-readout ${results[item.id]?.toLowerCase().replace("/", "")}`}>
                    <span>
                      {t("auditProResult")} · {measurementEvidence[item.id]?.source ?? "crawler"} · {measurementEvidence[item.id]?.confidence ?? "high"}
                      {measurementEvidence[item.id]?.scope ? ` · ${measurementEvidence[item.id]?.scope?.tested}/${measurementEvidence[item.id]?.scope?.discovered}` : ""}
                    </span>
                    <strong>
                      {results[item.id] === "Pass" && <CheckCircle2 aria-hidden="true" />}
                      {results[item.id] === "Partial" && <CircleDashed aria-hidden="true" />}
                      {results[item.id] === "Fail" && <CircleX aria-hidden="true" />}
                      {results[item.id] === "N/A" && <Minus aria-hidden="true" />}
                      {results[item.id] === "N/A" ? t("na") : t(results[item.id]!.toLowerCase() as "pass" | "partial" | "fail")}
                    </strong>
                  </div>
                )}
              </div>
              <details className="finding-detail">
                <summary>{t("openEvidence")}</summary>
                {!results[item.id] && <section className="legacy-evidence"><strong>{t('whyReview')}</strong><ul>{evidenceReviewReasons(measurementEvidence[item.id]).map(reason=><li key={reason}>{t(reason)}</li>)}</ul><p>{t('reviewNotSiteFailure')}</p></section>}
                <p className="finding-next-step"><strong>{t("reviewNextStep")}: </strong>{!results[item.id] ? t('genericNextAction') : findingGuidance(item.id, t.locale ?? 'en')?.[results[item.id] === 'Fail' || results[item.id] === 'Partial' ? 1 : 2] ?? t('genericNextAction')}</p>
                <PageEvidence evidence={measurementEvidence[item.id]} t={t}/>
              {notes[item.id] ? (
                <div className="evidence-readout"><span>{t("evidence")}</span><p>{notes[item.id].replace(/^Diagnostic only \(not scored\):\s*/, "")}</p></div>
              ) : null}
              {(results[item.id] === "Fail" || results[item.id] === "Partial") && (
                <div className="workflow-controls">
                  <label>
                    {t("owner")}
                    <input
                      aria-label={`Owner for ${findingTitle(item.id, item.item, t)}`}
                      onChange={(event) => onWorkflow(item.id, "owner", event.target.value)}
                      placeholder="Team or person"
                      value={workflow[item.id]?.owner ?? ""}
                    />
                  </label>
                  <label>
                    {t("dueDate")}
                    <input
                      aria-label={`Due date for ${findingTitle(item.id, item.item, t)}`}
                      inputMode="numeric"
                      onChange={(event) => onWorkflow(item.id, "dueDate", event.target.value)}
                      pattern="\d{4}-\d{2}-\d{2}"
                      placeholder="YYYY-MM-DD"
                      type="text"
                      value={workflow[item.id]?.dueDate ?? ""}
                    />
                  </label>
                  <label>
                    {t("delivery")}
                    <select
                      aria-label={`Implementation status for ${findingTitle(item.id, item.item, t)}`}
                      onChange={(event) => onWorkflow(item.id, "status", event.target.value)}
                      value={workflow[item.id]?.status ?? "Open"}
                    >
                      {(["Open", "Planned", "In progress", "Done"] as WorkflowStatus[]).map((status) => (
                        <option key={status} value={status}>{t(status === "In progress" ? "inProgress" : status.toLowerCase() as "open" | "planned" | "done")}</option>
                      ))}
                    </select>
                  </label>
                  <label className="screenshot-control">
                    Screenshot
                    <input
                      aria-label={`Screenshot for ${findingTitle(item.id, item.item, t)}`}
                      accept={SCREENSHOT_ACCEPT}
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        event.target.value = "";
                        if (!file) return;
                        readEvidenceScreenshot(file, (screenshot) => onScreenshot(item.id, file.name, screenshot));
                      }}
                    />
                  </label>
                  {workflow[item.id]?.screenshot && (
                    <div className="screenshot-preview">
                      <img src={workflow[item.id]?.screenshot} alt="" />
                      <span>{workflow[item.id]?.screenshotName || "Screenshot attached"}</span>
                    </div>
                  )}
                </div>
              )}
              </details>
            </div>
          ))}
        </article>
      ))}
    </section>
  );
}

function Insights({
  topIssues,
  t,
}: {
  topIssues: Issues;
  t: Translate;
}) {
  return (
    <aside className="insights-panel">
      <div className="section-heading">
        <h2>{t("topIssues")}</h2>
      </div>
      <IssueList topIssues={topIssues} t={t} />
    </aside>
  );
}

function ReportView({
  analysis,
  score,
  scorecards,
  topIssues,
  url,
  clientName,
  industry,
  clientLogo,
  whiteLabel,
  aiVisibility,
}: {
  analysis: Analysis;
  score: Score;
  scorecards?: OnlineScorecards;
  topIssues: Issues;
  url: string;
  clientName: string;
  industry: string;
  clientLogo: string;
  whiteLabel: WhiteLabel;
  aiVisibility?: AiVisibilitySummary;
}) {
  const target = clientName || url || "Current audit";
  return (
    <section className="document-view">
      <DocumentHeader title="Audit Report" target={target} clientLogo={clientLogo} whiteLabel={whiteLabel} />
      <div className="report-summary">
        <strong>{publishedScoreLabel(score, scorecards)}</strong>
        <p>{analysis.executiveSummary}</p>
        {scorecards?.overall && <p>{scorecards.overall.coveragePct}% evidence coverage · {scorecards.overall.measuredChecks}/{scorecards.overall.totalChecks} measured controls · {scorecards.overall.observations ?? 0} diagnostic observations</p>}
        {industry && <p>Industry: {industry}</p>}
      </div>
      <AnalysisStats analysis={analysis} />
      <ReadinessPanel analysis={analysis} />
      <GeoReportDisclosure aiVisibility={aiVisibility} />
      <IndustryPlaybook analysis={analysis} />
      <CategoryScores score={score} />
      <CategoryNarratives analysis={analysis} />
      <OpportunityMatrix analysis={analysis} />
      <DetailedIssues analysis={analysis} fallbackIssues={topIssues} />
      <ActionPlan analysis={analysis} />
    </section>
  );
}

function ProposalView({
  analysis,
  score,
  topIssues,
  url,
  clientName,
  industry,
  clientLogo,
  whiteLabel,
  aiVisibility,
}: {
  analysis: Analysis;
  score: Score;
  topIssues: Issues;
  url: string;
  clientName: string;
  industry: string;
  clientLogo: string;
  whiteLabel: WhiteLabel;
  aiVisibility?: AiVisibilitySummary;
}) {
  const target = clientName || url || "Current audit";
  const weakest = [...score.categories].filter((cat) => cat.evaluated > 0).sort((a, b) => a.score - b.score)[0];
  return (
    <section className="document-view">
      <DocumentHeader title="Improvement Proposal" target={target} clientLogo={clientLogo} whiteLabel={whiteLabel} />
      <h2>Executive summary</h2>
      <p>{analysis.executiveSummary}</p>
      {industry && <p>This proposal is framed for the {industry} context.</p>}
      <AnalysisStats analysis={analysis} />
      <ReadinessPanel analysis={analysis} />
      <GeoReportDisclosure aiVisibility={aiVisibility} />
      <IndustryPlaybook analysis={analysis} />
      <OpportunityMatrix analysis={analysis} />
      <h2>Recommended next steps</h2>
      <ActionPlan analysis={analysis} />
      <DetailedIssues analysis={analysis} fallbackIssues={topIssues.slice(0, 6)} compact />
      <div className="cta-panel">
        <strong>{whiteLabel.agencyName}</strong>
        <span>{whiteLabel.bookingUrl || whiteLabel.contactEmail || "Add booking/contact info in Settings"}</span>
      </div>
    </section>
  );
}

function AnalysisStats({ analysis }: { analysis: Analysis }) {
  return (
    <div className="analysis-stats">
      <div><span>Critical</span><strong>{analysis.counts.critical}</strong></div>
      <div><span>High</span><strong>{analysis.counts.high}</strong></div>
      <div><span>Actionable</span><strong>{analysis.counts.actionable}</strong></div>
      <div><span>Unreviewed</span><strong>{analysis.counts.blank}</strong></div>
    </div>
  );
}

function ReadinessPanel({ analysis }: { analysis: Analysis }) {
  return (
    <section className="readiness-panel">
      <span>Report readiness</span>
      <strong>{analysis.readiness.label}</strong>
      <p>{analysis.readiness.message}</p>
    </section>
  );
}

function GeoReportDisclosure({ aiVisibility }: { aiVisibility?: AiVisibilitySummary }) {
  const summary = geoPublicationSummary(aiVisibility);
  const disclosure =
    summary.status === "Publishable"
      ? "GEO visibility can be reported as its own scored result while remaining separate from the global audit score."
      : "GEO visibility remains disclosed separately from the global audit score until the publication threshold is met.";
  return (
    <section className="geo-report-disclosure">
      <span>GEO publication gate</span>
      <strong>{summary.status}</strong>
      <p>{summary.passed}/{summary.total} checks passing. {disclosure}</p>
      <ul>
        {summary.checks.map((check) => (
          <li key={check.label}><b>{check.done ? "Pass" : "Open"}:</b> {check.label}. {check.detail}</li>
        ))}
      </ul>
    </section>
  );
}

function IndustryPlaybook({ analysis }: { analysis: Analysis }) {
  return (
    <section className="analysis-section playbook-panel">
      <h2>Industry playbook: {analysis.playbook.label}</h2>
      <ul>
        {analysis.playbook.recommendations.map((recommendation) => (
          <li key={recommendation}>{recommendation}</li>
        ))}
      </ul>
    </section>
  );
}

function CategoryNarratives({ analysis }: { analysis: Analysis }) {
  return (
    <section className="analysis-section">
      <h2>Category analysis</h2>
      <div className="narrative-grid">
        {analysis.categoryNarratives.map((cat) => (
          <article key={cat.id}>
            <span>{cat.coverage}% coverage</span>
            <strong>{cat.label}</strong>
            <p>{cat.meaning}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function OpportunityMatrix({ analysis }: { analysis: Analysis }) {
  return (
    <section className="analysis-section">
      <h2>Quick wins and strategic fixes</h2>
      <div className="opportunity-grid">
        <article>
          <span>Low effort / high value</span>
          <strong>Quick wins</strong>
          {analysis.quickWins.length ? (
            <ul>{analysis.quickWins.map((item) => <li key={item.id}>{item.item}</li>)}</ul>
          ) : (
            <p>No quick wins identified yet.</p>
          )}
        </article>
        <article>
          <span>Higher priority / more involved</span>
          <strong>Strategic fixes</strong>
          {analysis.strategicFixes.length ? (
            <ul>{analysis.strategicFixes.map((item) => <li key={item.id}>{item.item}</li>)}</ul>
          ) : (
            <p>No strategic fixes identified yet.</p>
          )}
        </article>
      </div>
    </section>
  );
}

function DetailedIssues({
  analysis,
  fallbackIssues,
  compact = false,
}: {
  analysis: Analysis;
  fallbackIssues: Issues;
  compact?: boolean;
}) {
  if (analysis.detailedIssues.length === 0) return <IssueList topIssues={fallbackIssues} />;
  return (
    <section className="analysis-section">
      <h2>Issue impact analysis</h2>
      <div className={compact ? "detail-issues compact" : "detail-issues"}>
        {analysis.detailedIssues.slice(0, compact ? 6 : 20).map((issue) => (
          <article key={issue.id}>
            <span>{issue.priority} - {issue.status} - {issue.category}</span>
            <strong>{issue.item}</strong>
            <p><b>Impact / effort:</b> {issue.impactLevel} impact, {issue.effort} effort. Lane: {issue.lane}.</p>
            <p><b>Why it matters:</b> {issue.why}</p>
            <p><b>Business impact:</b> {issue.impact}</p>
            <p><b>Recommended action:</b> {issue.action}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function ActionPlan({ analysis }: { analysis: Analysis }) {
  return (
    <section className="analysis-section">
      <h2>30-60-90 day action plan</h2>
      <div className="action-plan">
        {analysis.actionPlan.map((phase) => (
          <article key={phase.phase}>
            <span>{phase.phase}</span>
            <strong>{phase.focus}</strong>
            {phase.actions.length ? (
              <ul>
                {phase.actions.map((action) => <li key={action}>{action}</li>)}
              </ul>
            ) : (
              <p>No actions identified yet.</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function PresentationView({
  analysis,
  score,
  scorecards,
  topIssues,
  url,
  clientName,
  clientLogo,
  whiteLabel,
  aiVisibility,
}: {
  analysis: Analysis;
  score: Score;
  scorecards?: OnlineScorecards;
  topIssues: Issues;
  url: string;
  clientName: string;
  clientLogo: string;
  whiteLabel: WhiteLabel;
  aiVisibility?: AiVisibilitySummary;
}) {
  const target = clientName || url || "Current audit";
  return (
    <section className="presentation-view">
      <article><DocumentHeader title="Audit Snapshot" target={target} clientLogo={clientLogo} whiteLabel={whiteLabel} /><strong>{publishedScoreLabel(score, scorecards)}</strong><p>{publishedOverall(score, scorecards) !== null ? `${publishedGradeLabel(score, scorecards)} · ${score.confidence} confidence` : "No global score is published yet: the evidence covers individual findings, but not a defensible whole-site score."}</p></article>
      <article><h2>Executive insight</h2><p>{analysis.executiveSummary}</p></article>
      <article><GeoReportDisclosure aiVisibility={aiVisibility} /></article>
      <article><h2>Section scores</h2><CategoryScores score={score} compact /></article>
      <article><h2>Priority issues</h2><IssueList topIssues={topIssues.slice(0, 5)} /></article>
      <article><h2>Next move</h2><ActionPlan analysis={analysis} /></article>
    </section>
  );
}

function SettingsView({ whiteLabel, onSave }: { whiteLabel: WhiteLabel; onSave: (next: WhiteLabel) => void }) {
  const [draft, setDraft] = useState(whiteLabel);
  useEffect(() => setDraft(whiteLabel), [whiteLabel]);
  return (
    <section className="settings-view">
      <h1>White label settings</h1>
      <div className="settings-grid">
        <label>Agency name<input value={draft.agencyName} onChange={(event) => setDraft({ ...draft, agencyName: event.target.value })} /></label>
        <label>Email<input value={draft.contactEmail} onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value })} /></label>
        <label>Booking URL<input value={draft.bookingUrl} onChange={(event) => setDraft({ ...draft, bookingUrl: event.target.value })} /></label>
        <label>Brand color<input type="color" value={draft.brandColor} onChange={(event) => setDraft({ ...draft, brandColor: event.target.value })} /></label>
        <label className="file-control inline-file">Agency logo<input type="file" accept="image/*" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) readImage(file, (agencyLogo) => setDraft({ ...draft, agencyLogo }));
        }} /></label>
      </div>
      {draft.agencyLogo && <img className="logo-preview" src={draft.agencyLogo} alt="Agency logo preview" />}
      <button className="save-button" onClick={() => onSave(draft)}>Save settings</button>
    </section>
  );
}

function GeoPublicationGate({ aiVisibility }: { aiVisibility?: AiVisibilitySummary }) {
  const checks = geoPublicationChecks(aiVisibility);
  const passed = checks.filter((check) => check.done).length;
  const status = geoPublicationStatus(aiVisibility);
  return (
    <section className="geo-publication-gate">
      <header>
        <div>
          <span>GEO publication gate</span>
          <h2>{status}</h2>
          <p>Use this gate before presenting GEO as a scored result. Pending or directional evidence must stay clearly disclosed.</p>
        </div>
        <strong>{passed}/{checks.length}</strong>
      </header>
      <div className="geo-gate-list">
        {checks.map((check) => (
          <article className={check.done ? "done" : ""} key={check.label}>
            <span>{check.done ? "Pass" : "Open"}</span>
            <strong>{check.label}</strong>
            <p>{check.detail}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

function QAView({ score, audits, analysis, aiVisibility }: { score: Score; audits: Audit[]; analysis: Analysis; aiVisibility?: AiVisibilitySummary }) {
  const checks = [
    { label: "Load demo creates a sample audit", done: audits.some((audit) => audit.id === "demo") },
    { label: "At least one checkpoint has been reviewed", done: score.totalEvaluated > 0 },
    { label: "Score, confidence, and coverage are calculated", done: score.totalAll > 0 && score.confidence !== "Low" || score.totalEvaluated > 0 },
    { label: "Client report has readiness status", done: Boolean(analysis.readiness.label) },
    { label: "Action plan is generated", done: analysis.actionPlan.some((phase) => phase.actions.length > 0) },
    { label: "CSV / Markdown / PDF exports are available", done: true },
    { label: "White-label settings are available", done: true },
    { label: "Evidence notes are available per checkpoint", done: true },
    { label: "Screenshot evidence can be attached per finding", done: true },
  ];
  const passed = checks.filter((check) => check.done).length;

  return (
    <section className="settings-view qa-view">
      <h1>QA checklist</h1>
      <p className="qa-summary">{passed}/{checks.length} checks currently passing based on app state.</p>
      <div className="qa-grid">
        {checks.map((check) => (
          <article className={check.done ? "done" : ""} key={check.label}>
            <span>{check.done ? "Pass" : "Needs test"}</span>
            <strong>{check.label}</strong>
          </article>
        ))}
      </div>
      <GeoPublicationGate aiVisibility={aiVisibility} />
      <div className="analysis-section">
        <h2>Recommended manual test flow</h2>
        <ol className="proposal-steps">
          <li>Load demo and verify the score changes from zero.</li>
          <li>Edit several checkpoint statuses and add evidence notes.</li>
          <li>Attach screenshot evidence to a failed or partial finding.</li>
          <li>Save the audit, select it from Saved, duplicate it, reset it, and delete a copy.</li>
          <li>Open Report, Proposal, Presentation, Settings, and QA views.</li>
          <li>Export CSV, Markdown, backup JSON, and PDF.</li>
          <li>Import the backup JSON and confirm the saved audit returns.</li>
        </ol>
      </div>
    </section>
  );
}

function DocumentHeader({
  title,
  target,
  clientLogo,
  whiteLabel,
}: {
  title: string;
  target: string;
  clientLogo?: string;
  whiteLabel: WhiteLabel;
}) {
  return (
    <header className="document-header">
      <div>
        {whiteLabel.agencyLogo && <img className="report-logo" src={whiteLabel.agencyLogo} alt="" />}
        <span>{whiteLabel.agencyName}</span>
        <h1>{title}</h1>
        <p>{target}</p>
      </div>
      {clientLogo && <img className="report-logo client" src={clientLogo} alt="" />}
      <time>{new Date().toLocaleDateString()}</time>
    </header>
  );
}

function CategoryScores({ score, compact = false, locale = "en" }: { score: Score; compact?: boolean; locale?: "tr" | "en" }) {
  return (
    <div className={compact ? "category-scores compact" : "category-scores"}>
      {score.categories.map((cat) => (
        <div key={cat.id}>
          <span>{cat.label}</span>
          <strong>{cat.scoreEligible ? `${cat.score}/100` : cat.evaluated > 0 ? (locale === "tr" ? "Ölçüm yetersiz" : "Insufficient measurement") : (locale === "tr" ? "Ölçülmedi" : "Not measured")}</strong>
          <em>{cat.evaluated}/{cat.minimumEvaluated} minimum observations</em>
        </div>
      ))}
    </div>
  );
}

function IssueList({ topIssues, t }: { topIssues: Issues; t?: Translate }) {
  if (topIssues.length === 0) return <p className="empty-text">{t ? t("noPriorityIssues") : "No priority issues yet."}</p>;
  return (
    <div className="issue-list">
      {topIssues.map((issue) => (
        <div className="issue-card" key={issue.id}>
          <span>{priorityText(issue.priority, t)} - {issue.status}</span>
          <strong>{findingTitle(issue.id, issue.item, t)}</strong>
          <p>{issue.category}</p>
        </div>
      ))}
    </div>
  );
}
