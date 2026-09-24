import { estimateAiCost } from "./ai-pricing";
import { PLAN_POLICIES, type PlanPolicy } from "./plans";

// P1-P3 plan B6: the "customer contribution" calculation required BEFORE
// package quotas change — worst-case monthly AI usage cost against plan price
// at the verified rates (lib/ai-pricing.ts). plans.ts is deliberately NOT
// modified here: quota and price changes are a commercial approval, and this
// module is the test-grounded analysis that decision reads.
export const TARGET_USAGE_COST_SHARE = 0.25;

// Conservative per-observation upper bound: a full system+prompt input and the
// largest configured completion budget (1200 for the gpt-5 family, else 350).
const WORST_INPUT_TOKENS = 1_000;
const WORST_OUTPUT_TOKENS = 1_200;

export function worstCaseMonthlyObservations(plan: PlanPolicy) {
  return plan.aiReportsPerMonth * plan.aiPromptsPerReport * plan.aiEnginesPerReport;
}

export function planEconomics(webSearchCallsPerObservation: 0 | 1 = 1) {
  return Object.values(PLAN_POLICIES).map((plan) => {
    const observations = worstCaseMonthlyObservations(plan);
    const perObservation = estimateAiCost({
      model: "unlisted/worst-case",
      inputTokens: WORST_INPUT_TOKENS,
      outputTokens: WORST_OUTPUT_TOKENS,
      webSearchCalls: observations ? webSearchCallsPerObservation : 0,
    });
    const worstCaseCostEur = Number(((perObservation.estimatedCostEur ?? 0) * observations).toFixed(2));
    const priceEur = plan.monthlyPriceEur ?? 0;
    const contributionEur = Number((priceEur - worstCaseCostEur).toFixed(2));
    const contributionPct = priceEur > 0 ? Math.round((contributionEur / priceEur) * 100) : 100;
    return {
      planId: plan.id,
      priceEur,
      observations,
      perObservationEur: perObservation.estimatedCostEur,
      worstCaseCostEur,
      contributionEur,
      contributionPct,
      withinTarget: observations === 0 || contributionPct >= Math.round((1 - TARGET_USAGE_COST_SHARE) * 100),
    };
  });
}
