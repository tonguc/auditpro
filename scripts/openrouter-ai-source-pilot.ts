import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runAiVisibilityScan } from "../lib/ai-visibility";
import {
  requireSourcePilotAuthorization,
  SOURCE_PILOT_ESTIMATED_MAXIMUM_USD,
  SOURCE_PILOT_PROMPT_SET_VERSION,
  sourcePilotPromptDefinitions,
  sourcePilotPrompts,
} from "./openrouter-ai-source-prompt-set";

async function main() {
  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") throw new Error("The public AI feature must remain disabled during the private pilot.");
  requireSourcePilotAuthorization(process.env);
  const result = await runAiVisibilityScan({
    brandName: "Tonguç Karacay", domain: "tonguckaracay.com", industry: "yapay zekâ otomasyonu danışmanlığı", locale: "tr",
    promptLimit: sourcePilotPrompts.length, prompts: sourcePilotPrompts,
    engines: [{ id: "gemini", label: "Gemini", model: "google/gemini-3.5-flash-lite" }],
    userId: "private-openrouter-source-pilot", concurrency: 1, webSearch: true,
  });
  const report = {
    method: "openrouter-gemini-native-search-source-pilot@2.0.0",
    promptSetVersion: SOURCE_PILOT_PROMPT_SET_VERSION,
    promptClusters: sourcePilotPromptDefinitions,
    expectedMaximumCalls: sourcePilotPrompts.length,
    estimatedMaximumUsd: SOURCE_PILOT_ESTIMATED_MAXIMUM_USD,
    maximumSearchesPerCall: 1,
    publicAiFeatureEnabled: false,
    result,
  };
  const reportPath = process.env.AUDITPRO_AI_PILOT_REPORT_PATH || "/tmp/openrouter-ai-source-pilot.json";
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ executedCalls: result.observations.length, completed: result.observations.filter((item) => !item.error).length, reportPath }));
}

void main();
