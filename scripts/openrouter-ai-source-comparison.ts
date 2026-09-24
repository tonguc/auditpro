import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runAiVisibilityScan, type AiVisibilityObservation } from "../lib/ai-visibility";
import {
  requireSourceComparisonAuthorization,
  SOURCE_COMPARISON_ESTIMATED_BUDGET_USD,
  SOURCE_COMPARISON_MODEL,
  SOURCE_PILOT_PROMPT_SET_VERSION,
  selectSourceComparisonRetryPrompts,
  sourcePilotPromptDefinitions,
  sourcePilotPrompts,
} from "./openrouter-ai-source-prompt-set";

async function main() {
  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") {
    throw new Error("The public AI feature must remain disabled during the private comparison.");
  }
  requireSourceComparisonAuthorization(process.env);
  const retryPlanPath = process.env.AUDITPRO_AI_COMPARISON_RETRY_PLAN_PATH?.trim();
  const selectedPrompts = retryPlanPath
    ? selectSourceComparisonRetryPrompts(JSON.parse(await readFile(retryPlanPath, "utf8")), process.env)
    : sourcePilotPrompts;
  const reportPath = process.env.AUDITPRO_AI_COMPARISON_REPORT_PATH
    || "/tmp/openrouter-ai-source-comparison.json";
  const checkpointPath = `${reportPath}.checkpoint`;
  await mkdir(dirname(reportPath), { recursive: true });
  const checkpoint = await readFile(checkpointPath, "utf8").then((value) => JSON.parse(value) as {
    promptSetVersion?: string;
    expectedMaximumCalls?: number;
    observations?: AiVisibilityObservation[];
  }).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return undefined;
    throw error;
  });
  if (checkpoint && (checkpoint.promptSetVersion !== SOURCE_PILOT_PROMPT_SET_VERSION
    || checkpoint.expectedMaximumCalls !== selectedPrompts.length
    || !Array.isArray(checkpoint.observations))) {
    throw new Error("The comparison checkpoint does not match this run plan.");
  }
  const checkpointObservations: AiVisibilityObservation[] = checkpoint?.observations ?? [];
  const writeAtomic = async (path: string, value: unknown) => {
    const temporaryPath = `${path}.tmp`;
    await writeFile(temporaryPath, JSON.stringify(value, null, 2), { flag: "w" });
    await rename(temporaryPath, path);
  };
  const result = await runAiVisibilityScan({
    brandName: "Tonguç Karacay",
    domain: "tonguckaracay.com",
    industry: "yapay zekâ otomasyonu danışmanlığı",
    locale: "tr",
    promptLimit: selectedPrompts.length,
    prompts: selectedPrompts,
    engines: [{ id: "chatgpt", label: "OpenAI GPT-5 Mini", model: SOURCE_COMPARISON_MODEL }],
    userId: "private-openrouter-openai-source-comparison",
    concurrency: 1,
    webSearch: true,
    existingObservations: checkpointObservations,
    onObservation: async (observation) => {
      checkpointObservations.push(observation);
      await writeAtomic(checkpointPath, {
        method: "openrouter-openai-native-search-checkpoint@1.0.0",
        promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
        expectedMaximumCalls: selectedPrompts.length,
        completedCalls: checkpointObservations.length,
        observations: checkpointObservations,
      });
    },
  });
  const report = {
    method: retryPlanPath
      ? "openrouter-openai-native-search-failed-retry@1.0.0"
      : "openrouter-openai-native-search-source-comparison@2.0.0",
    promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
    promptClusters: sourcePilotPromptDefinitions,
    expectedMaximumCalls: selectedPrompts.length,
    estimatedBudgetUsd: SOURCE_COMPARISON_ESTIMATED_BUDGET_USD,
    maximumSearchesPerCall: 1,
    publicAiFeatureEnabled: false,
    result,
  };
  await writeAtomic(reportPath, report);
  console.log(JSON.stringify({
    executedCalls: result.observations.length,
    completed: result.observations.filter((item) => !item.error).length,
    reportPath,
  }));
}

void main();
