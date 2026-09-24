import assert from "node:assert/strict";
import {
  requireSourceComparisonCalibrationAuthorization,
  SOURCE_COMPARISON_CALIBRATION_AUTHORIZATION,
  SOURCE_COMPARISON_CALIBRATION_ESTIMATED_BUDGET_USD,
  SOURCE_COMPARISON_CALIBRATION_PROMPT_COUNT,
} from "./openrouter-ai-source-prompt-set";

assert.equal(SOURCE_COMPARISON_CALIBRATION_ESTIMATED_BUDGET_USD, 0.03);
assert.equal(SOURCE_COMPARISON_CALIBRATION_PROMPT_COUNT, 1);
assert.throws(
  () => requireSourceComparisonCalibrationAuthorization({}),
  /Explicit approval is required/,
);
assert.doesNotThrow(() => requireSourceComparisonCalibrationAuthorization({
  AUDITPRO_AI_COMPARISON_CALIBRATION_AUTHORIZATION: SOURCE_COMPARISON_CALIBRATION_AUTHORIZATION,
}));

console.log("OpenRouter OpenAI source calibration fixtures passed.");
