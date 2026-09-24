// Manual comparative calibration runner (P1-P3 plan, B2). This is the PAID
// step of the AI-visibility calibration program: it spends real API tokens on
// two separate runs of the 32-template comparative prompt set and prints the
// code-enforced publication gate (lib/ai-visibility.ts).
//
// The API key is read from .env / .env.local so it never has to appear on a
// command line. Two spending safeguards apply:
//   - AUDITPRO_AI_COMPARATIVE_BUDGET_USD (default "2") is a HARD cap summed
//     from the provider-reported cost (provider_cost_usd) of each run; the
//     runner stops on its own before exceeding it.
//   - AUDITPRO_AI_COMPARATIVE_RESUME=<record.json> re-asks ONLY the failed
//     observations of earlier runs (same run identity), so successful answers
//     are never re-bought.
// Explicit approval is still required before any token is spent:
//   AUDITPRO_AI_COMPARATIVE_APPROVED=yes npx tsx scripts/ai-visibility-comparative.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";

for (const file of [".env", ".env.local"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([\w.]+)\s*=\s*(.*)$/);
    if (match && process.env[match[1]] === undefined) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

import {
  buildComparativeAiVisibilityPrompts,
  configuredAiVisibilityEngines,
  evaluateAiVisibilityEligibility,
  resolveWebSearchMode,
  runAiVisibilityScan,
  type AiVisibilityObservation,
  type AiVisibilitySummary,
} from "../lib/ai-visibility";
import { LOCALES, type Locale } from "../lib/ui-i18n";

type RunRecord = { runId?: string; observations?: AiVisibilityObservation[] };

function providerCostUsd(observations: AiVisibilityObservation[]) {
  return observations.reduce((total, observation) => total + (observation.providerCostUsd ?? 0), 0);
}

function observationKey(observation: AiVisibilityObservation) {
  return `${observation.engineId}\0${observation.model}\0${observation.promptId}`;
}

async function main() {
  if (process.env.AUDITPRO_AI_COMPARATIVE_APPROVED !== "yes") {
    console.error("Refusing to spend tokens: set AUDITPRO_AI_COMPARATIVE_APPROVED=yes only after budget approval.");
    process.exitCode = 1;
    return;
  }
  const brandName = process.env.AUDITPRO_AI_COMPARATIVE_BRAND ?? "";
  const domain = process.env.AUDITPRO_AI_COMPARATIVE_DOMAIN ?? "";
  if (!brandName || !domain) {
    console.error("Set AUDITPRO_AI_COMPARATIVE_BRAND and AUDITPRO_AI_COMPARATIVE_DOMAIN.");
    process.exitCode = 1;
    return;
  }
  const budgetUsd = Number(process.env.AUDITPRO_AI_COMPARATIVE_BUDGET_USD ?? "2");
  const industry = process.env.AUDITPRO_AI_COMPARATIVE_INDUSTRY ?? "";
  const locale: Locale = LOCALES.includes(process.env.AUDITPRO_AI_COMPARATIVE_LOCALE as Locale)
    ? process.env.AUDITPRO_AI_COMPARATIVE_LOCALE as Locale
    : "en";
  const prompts = buildComparativeAiVisibilityPrompts({ brandName, domain, industry, locale });
  const engines = configuredAiVisibilityEngines(4);
  // Low-cost calibration mode: bound the injected search context to one result
  // per search (documented plugin parameter) — it is the dominant token cost.
  if (process.env.AUDITPRO_AI_SEARCH_MAX_RESULTS === undefined) process.env.AUDITPRO_AI_SEARCH_MAX_RESULTS = "1";

  // Resume mode re-asks only failed observations of recorded runs.
  const resumePath = process.env.AUDITPRO_AI_COMPARATIVE_RESUME;
  const resumeRuns: RunRecord[] = resumePath
    ? ((JSON.parse(readFileSync(resumePath, "utf8")) as { runs?: RunRecord[] }).runs ?? [])
    : [];
  const runSpecs: Array<{ runId?: string; existingObservations?: AiVisibilityObservation[] }> = resumeRuns.length
    ? resumeRuns.map((run) => ({ runId: run.runId, existingObservations: (run.observations ?? []).filter((observation) => !observation.error) }))
    : [{}, {}];

  const runs: AiVisibilitySummary[] = [];
  let spentUsd = 0;
  for (const [index, spec] of runSpecs.entries()) {
    if (spentUsd >= budgetUsd) {
      console.error(`Budget cap reached (${spentUsd.toFixed(2)}/${budgetUsd} USD provider-reported); stopping before run ${index + 1}.`);
      break;
    }
    const runId = spec.runId ?? `comparative-${new Date().toISOString().slice(0, 10)}-${index + 1}`;
    console.error(`Comparative run ${index + 1}/${runSpecs.length} (${runId}): ${prompts.length} prompts x ${engines.length} engines${spec.existingObservations?.length ? `, resuming with ${spec.existingObservations.length} kept observations` : ""}...`);
    const run = await runAiVisibilityScan({
      brandName,
      domain,
      industry,
      locale,
      promptLimit: prompts.length,
      prompts,
      engines,
      userId: "comparative-calibration",
      concurrency: 2,
      webSearch: resolveWebSearchMode(true),
      runId,
      existingObservations: spec.existingObservations,
      onObservation: (observation) => console.error(`  ${observation.engineId} ${observation.promptId}: ${observation.error ?? "ok"}`),
    });
    runs.push(run);
    // The cap counts NEW spending only: resumed observations were already paid.
    const keptKeys = new Set((spec.existingObservations ?? []).map(observationKey));
    spentUsd += providerCostUsd(run.observations.filter((observation) => !keptKeys.has(observationKey(observation))));
    console.error(`Run ${index + 1} done: provider-reported NEW cost so far ${spentUsd.toFixed(4)} USD (cap ${budgetUsd}).`);
  }

  const gate = evaluateAiVisibilityEligibility(runs);
  // Persist the full run records (observations included) so a future gap can be
  // inspected — and resumed — without re-spending tokens.
  mkdirSync("design/validation-matrix", { recursive: true });
  const outPath = `design/validation-matrix/ai-visibility-comparative-${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
  writeFileSync(outPath, JSON.stringify({ gate, spentUsd, runs }, null, 2));
  console.error(`Full run records written to ${outPath}`);
  console.log(JSON.stringify({
    gate,
    spentUsd,
    runs: runs.map((run) => ({
      runId: run.runId,
      measuredAt: run.measuredAt,
      coveragePct: run.coveragePct,
      mentionRate: run.mentionRate,
      citationRate: run.citationRate,
      discoveryPromptsPerEngine: run.discoveryPromptsPerEngine,
      citationSamples: run.citationSamples,
      inputTokens: run.inputTokens,
      outputTokens: run.outputTokens,
    })),
  }, null, 2));
}

void main();
