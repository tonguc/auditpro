import assert from "node:assert/strict";

import { PLAN_POLICIES } from "../lib/plans";
import { estimateAiCostEur, responseCreditsForTokens } from "../lib/usage-ledger";
import { AI_PRICE_VERSION, estimateAiCost } from "../lib/ai-pricing";
import { planEconomics, TARGET_USAGE_COST_SHARE } from "../lib/plan-economics";

for (const plan of Object.values(PLAN_POLICIES)) {
  assert.ok(plan.aiPromptCreditsPerMonth >= plan.aiReportsPerMonth * plan.aiPromptsPerReport * plan.aiEnginesPerReport);
  assert.ok(plan.aiResponseCreditsPerMonth >= plan.aiReportsPerMonth * plan.aiResponseCreditsPerReport);
  assert.ok(plan.pagesPerAudit <= 250, `${plan.id} pagesPerAudit must not exceed the current crawler cap`);
}

assert.equal(responseCreditsForTokens(1), 1);
assert.equal(responseCreditsForTokens(350), 1);
assert.equal(responseCreditsForTokens(351), 2);
assert.equal(estimateAiCostEur(1000, 1000), 0.008);

// B1 cost accounting: provenance-labelled estimates, priced search calls,
// unknown spend, and the provider-cost figure kept for reconciliation.
const fallback = estimateAiCost({ model: "unlisted/model", inputTokens: 1000, outputTokens: 1000 });
assert.equal(fallback.estimatedCostEur, 0.008);
assert.equal(fallback.costBasis, "fallback-rate", "unlisted models use configured fallback rates, never a fabricated price");
assert.equal(fallback.priceVersion, AI_PRICE_VERSION);
const priced = estimateAiCost({ model: "vendor/verified", inputTokens: 1000, outputTokens: 1000 }, {
  "vendor/verified": { inputUsdPer1k: 0.001, outputUsdPer1k: 0.002, source: "test-table", verified: "2026-09-23" },
});
assert.equal(priced.costBasis, "price-table");
assert.equal(priced.estimatedCostEur, 0.003, "verified USD token prices convert at the configured parity rate");
const searched = estimateAiCost({ model: "unlisted/model", inputTokens: 0, outputTokens: 0, webSearchCalls: 2 });
assert.equal(searched.searchCostEur, 0.014, "two search calls at the verified USD 0.007 rate");
assert.equal(searched.estimatedCostEur, 0.014);
const reportedZero = estimateAiCost({ model: "unlisted/model", inputTokens: 0, outputTokens: 0 });
assert.equal(reportedZero.estimatedCostEur, 0);
assert.equal(reportedZero.costBasis, "fallback-rate", "a reported zero is measured usage, not unknown spend");
const unknownSpend = estimateAiCost({ model: "unlisted/model", inputTokens: 0, outputTokens: 0, usageKnown: false });
assert.equal(unknownSpend.estimatedCostEur, null, "error/timeout paths without usage must not be priced as zero");
assert.equal(unknownSpend.costBasis, "unknown");

// B6 plan economics: worst-case monthly AI usage cost against plan price at the
// verified rates. These pins ARE the commercial decision analysis; the quota
// recalculation below is applied in lib/plans.ts (2026-09-23) and both adjusted
// plans must now satisfy the 25% usage-cost target.
assert.equal(TARGET_USAGE_COST_SHARE, 0.25, "documented assumption: usage cost stays within 25% of price");
const withSearch = Object.fromEntries(planEconomics(1).map((row) => [row.planId, row]));
assert.equal(withSearch.free.observations, 0, "free carries no AI usage");
assert.equal(withSearch.free.withinTarget, true);
assert.equal(withSearch.pro.observations, 200);
assert.equal(withSearch.pro.worstCaseCostEur, 3.24);
assert.equal(withSearch.pro.withinTarget, true, "pro worst case stays within the cost target");
assert.equal(withSearch.agency.observations, 750);
assert.equal(withSearch.agency.worstCaseCostEur, 12.15);
assert.equal(withSearch.agency.withinTarget, true, "recalculated agency quotas stay within the 25% usage-cost target");
assert.equal(withSearch.enterprise.observations, 2250);
assert.equal(withSearch.enterprise.worstCaseCostEur, 36.45);
assert.equal(withSearch.enterprise.withinTarget, true, "recalculated enterprise quotas stay within the plan price and the cost target");
const withoutSearch = Object.fromEntries(planEconomics(0).map((row) => [row.planId, row]));
assert.equal(withoutSearch.pro.worstCaseCostEur, 1.84);
assert.equal(withoutSearch.agency.withinTarget, true, "the recalculated quotas hold even without web search");
assert.equal(withoutSearch.enterprise.withinTarget, true);

console.log("Billing and credit fixtures passed.");
