import assert from "node:assert/strict";
import {
  requireSourceComparisonAuthorization,
  SOURCE_COMPARISON_AUTHORIZATION,
  SOURCE_COMPARISON_ESTIMATED_BUDGET_USD,
  SOURCE_COMPARISON_MODEL,
  SOURCE_COMPARISON_RETRY_AUTHORIZATION,
  SOURCE_PILOT_PROMPT_SET_VERSION,
  selectSourceComparisonRetryPrompts,
  sourcePilotPrompts,
} from "./openrouter-ai-source-prompt-set";

assert.equal(SOURCE_COMPARISON_MODEL, "openai/gpt-5-mini");
assert.equal(SOURCE_COMPARISON_ESTIMATED_BUDGET_USD, 0.50);
assert.equal(sourcePilotPrompts.length, 30);
assert.throws(
  () => requireSourceComparisonAuthorization({}),
  /Explicit approval is required/,
);
assert.doesNotThrow(() => requireSourceComparisonAuthorization({
  AUDITPRO_AI_COMPARISON_AUTHORIZATION: SOURCE_COMPARISON_AUTHORIZATION,
}));
assert.throws(() => selectSourceComparisonRetryPrompts({
  promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
  requiresFreshExplicitApproval: true,
  failedPromptIds: [sourcePilotPrompts[0]!.id],
}, {}), /Fresh explicit approval/);
const retryPrompts = selectSourceComparisonRetryPrompts({
  promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
  requiresFreshExplicitApproval: true,
  failedPromptIds: [sourcePilotPrompts[3]!.id, sourcePilotPrompts[8]!.id],
}, { AUDITPRO_AI_COMPARISON_RETRY_AUTHORIZATION: SOURCE_COMPARISON_RETRY_AUTHORIZATION });
assert.deepEqual(retryPrompts.map((item) => item.id), [sourcePilotPrompts[3]!.id, sourcePilotPrompts[8]!.id]);
assert.throws(() => selectSourceComparisonRetryPrompts({
  promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
  requiresFreshExplicitApproval: true,
  failedPromptIds: ["unknown"],
}, { AUDITPRO_AI_COMPARISON_RETRY_AUTHORIZATION: SOURCE_COMPARISON_RETRY_AUTHORIZATION }), /unknown prompt id/);

console.log("OpenRouter OpenAI source comparison fixtures passed.");
