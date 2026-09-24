import assert from "node:assert/strict";

import { estimatePilotAiCost, pilotAiEnabled, pilotAiPolicy } from "../lib/pilot-ai";
import { configuredAiVisibilityEngines } from "../lib/ai-visibility";

const enabled = {
  AUDITPRO_DEPLOYMENT_MODE: "pilot",
  AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "true",
  AUDITPRO_AI_VISIBILITY_ENABLED: "true",
  AUDITPRO_PILOT_AI_ENABLED: "true",
} as unknown as NodeJS.ProcessEnv;

assert.equal(pilotAiEnabled(enabled), true);
assert.equal(pilotAiEnabled({ ...enabled, AUDITPRO_DEPLOYMENT_MODE: "production" }), false);
assert.equal(pilotAiEnabled({ ...enabled, AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "false" }), false);
assert.deepEqual(pilotAiPolicy(enabled), {
  maxScans: 10,
  maxDomains: 5,
  maxScansPerDomain: 2,
  budgetEur: 10,
  reservedCostEur: 1,
  promptLimit: 10,
  engineLimit: 4,
});

const engines = configuredAiVisibilityEngines(4);
assert.deepEqual(engines.map((engine) => engine.id), ["chatgpt", "gemini", "perplexity", "claude"]);
assert.match(engines[3]?.model ?? "", /^anthropic\/claude-/);
assert.equal(estimatePilotAiCost(1_000, 1_000, 10), 0.13);

console.log("Password-protected pilot AI policy fixtures passed.");
