import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runAiVisibilityScan } from "../lib/ai-visibility";
import {
  requireSourceComparisonCalibrationAuthorization,
  SOURCE_COMPARISON_CALIBRATION_ESTIMATED_BUDGET_USD,
  SOURCE_COMPARISON_CALIBRATION_PROMPT_COUNT,
  SOURCE_COMPARISON_MODEL,
  SOURCE_PILOT_PROMPT_SET_VERSION,
  sourcePilotPrompts,
} from "./openrouter-ai-source-prompt-set";

const sourceComparisonCalibrationPrompts = sourcePilotPrompts.slice(0, SOURCE_COMPARISON_CALIBRATION_PROMPT_COUNT);

async function main() {
  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") {
    throw new Error("The public AI feature must remain disabled during calibration.");
  }
  requireSourceComparisonCalibrationAuthorization(process.env);
  const result = await runAiVisibilityScan({
    brandName: "Tonguç Karacay",
    domain: "tonguckaracay.com",
    industry: "yapay zekâ otomasyonu danışmanlığı",
    locale: "tr",
    promptLimit: sourceComparisonCalibrationPrompts.length,
    prompts: sourceComparisonCalibrationPrompts,
    engines: [{ id: "chatgpt", label: "OpenAI GPT-5 Mini", model: SOURCE_COMPARISON_MODEL }],
    userId: "private-openrouter-openai-source-calibration",
    concurrency: 1,
    webSearch: true,
  });
  const report = {
    method: "openrouter-openai-native-search-source-calibration@2.0.0",
    promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
    expectedMaximumCalls: sourceComparisonCalibrationPrompts.length,
    estimatedBudgetUsd: SOURCE_COMPARISON_CALIBRATION_ESTIMATED_BUDGET_USD,
    maximumSearchesPerCall: 1,
    publicAiFeatureEnabled: false,
    result,
  };
  const reportPath = process.env.AUDITPRO_AI_COMPARISON_CALIBRATION_REPORT_PATH
    || "/tmp/openrouter-ai-source-comparison-calibration.json";
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    executedCalls: result.observations.length,
    completed: result.observations.filter((item) => !item.error).length,
    inputTokens: result.inputTokens,
    outputTokens: result.outputTokens,
    reportPath,
  }));
}

void main();
