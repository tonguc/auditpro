export const PLAN_IDS = ["free", "pro", "agency", "enterprise"] as const;
export type PlanId = (typeof PLAN_IDS)[number];

export type PlanPolicy = {
  id: PlanId;
  name: string;
  monthlyPriceEur: number | null;
  domains: number | null;
  pagesPerMonth: number;
  pagesPerAudit: number;
  aiReportsPerMonth: number;
  aiPromptsPerReport: number;
  aiEnginesPerReport: number;
  aiPromptCreditsPerMonth: number;
  aiResponseCreditsPerMonth: number;
  aiResponseCreditsPerReport: number;
  users: number;
  scheduledAudits: boolean;
  whiteLabel: boolean;
};

export const PLAN_POLICIES: Record<PlanId, PlanPolicy> = {
  free: {
    id: "free",
    name: "Free",
    monthlyPriceEur: 0,
    domains: 1,
    pagesPerMonth: 10,
    pagesPerAudit: 5,
    aiReportsPerMonth: 0,
    aiPromptsPerReport: 0,
    aiEnginesPerReport: 0,
    aiPromptCreditsPerMonth: 0,
    aiResponseCreditsPerMonth: 0,
    aiResponseCreditsPerReport: 0,
    users: 1,
    scheduledAudits: false,
    whiteLabel: false,
  },
  pro: {
    id: "pro",
    name: "Pro",
    monthlyPriceEur: 19,
    domains: 10,
    pagesPerMonth: 5_000,
    pagesPerAudit: 250,
    aiReportsPerMonth: 20,
    aiPromptsPerReport: 10,
    aiEnginesPerReport: 1,
    aiPromptCreditsPerMonth: 200,
    aiResponseCreditsPerMonth: 200,
    aiResponseCreditsPerReport: 10,
    users: 1,
    scheduledAudits: true,
    whiteLabel: false,
  },
  agency: {
    id: "agency",
    name: "Agency",
    monthlyPriceEur: 49,
    domains: 50,
    pagesPerMonth: 25_000,
    pagesPerAudit: 250,
    // Quota recalculation (P1-P3 plan B6, 2026-09-23): worst-case AI usage cost
    // must stay within 25% of the plan price at the verified rates
    // (lib/plan-economics.ts). 100 reports x 10 prompts x 3 engines cost up to
    // 48.60 EUR/month against a 49 EUR price; 25 reports keep the worst case at
    // 12.15 EUR (75% contribution).
    aiReportsPerMonth: 25,
    aiPromptsPerReport: 10,
    aiEnginesPerReport: 3,
    aiPromptCreditsPerMonth: 750,
    aiResponseCreditsPerMonth: 750,
    aiResponseCreditsPerReport: 30,
    users: 5,
    scheduledAudits: true,
    whiteLabel: true,
  },
  enterprise: {
    id: "enterprise",
    name: "Enterprise",
    monthlyPriceEur: 149,
    domains: null,
    pagesPerMonth: 100_000,
    pagesPerAudit: 250,
    // Quota recalculation (P1-P3 plan B6, 2026-09-23): 500 reports cost up to
    // 243 EUR/month against a 149 EUR price (negative contribution). 75 reports
    // keep the worst case at 36.45 EUR (75% contribution).
    aiReportsPerMonth: 75,
    aiPromptsPerReport: 10,
    aiEnginesPerReport: 3,
    aiPromptCreditsPerMonth: 2_250,
    aiResponseCreditsPerMonth: 2_250,
    aiResponseCreditsPerReport: 30,
    users: 20,
    scheduledAudits: true,
    whiteLabel: true,
  },
};

export const SCAN_MODES = {
  quick: { id: "quick", name: "Quick", pages: 5 },
  standard: { id: "standard", name: "Standard", pages: 25 },
} as const;

export function isPlanId(value: unknown): value is PlanId {
  return typeof value === "string" && PLAN_IDS.includes(value as PlanId);
}

export function getPlanPolicy(value: unknown) {
  return PLAN_POLICIES[isPlanId(value) ? value : "free"];
}

export function allowedPageLimit(planId: PlanId, requestedPages: number) {
  const plan = PLAN_POLICIES[planId];
  return Math.max(1, Math.min(Math.floor(requestedPages), plan.pagesPerAudit));
}

export function aiPromptCreditLimit(planId: PlanId) {
  return PLAN_POLICIES[planId].aiPromptCreditsPerMonth;
}

export function aiResponseCreditLimit(planId: PlanId) {
  return PLAN_POLICIES[planId].aiResponseCreditsPerMonth;
}
