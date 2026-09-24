import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runAiVisibilityScan, type AiVisibilityPrompt } from "../lib/ai-visibility";

const prompts: AiVisibilityPrompt[] = [
  { id: "openrouter-annotation-tr-20260919:1", kind: "discovery-intent", contributesToVisibility: true, query: "Türkiye'de KOBİ'ler için yapay zekâ otomasyonu danışmanlarını güvenilir kaynaklara dayanarak nasıl karşılaştırabilirim?" },
  { id: "openrouter-annotation-tr-20260919:2", kind: "discovery-intent", contributesToVisibility: true, query: "Türkiye'de müşteri hizmetleri ve satış otomasyonu için yapay zekâ danışmanlığı seçerken hangi hizmet sağlayıcılarını değerlendirmeliyim?" },
];

async function main() {
  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") throw new Error("The public AI feature must remain disabled during the private calibration.");
  const result = await runAiVisibilityScan({
    brandName: "Tonguç Karacay", domain: "tonguckaracay.com", industry: "yapay zekâ otomasyonu danışmanlığı", locale: "tr",
    promptLimit: prompts.length, prompts, engines: [{ id: "gemini", label: "Gemini", model: "google/gemini-3.5-flash-lite" }],
    userId: "private-openrouter-annotation-calibration", concurrency: 1, webSearch: true,
  });
  const report = { method: "openrouter-gemini-native-search-annotation-calibration@1.0.0", expectedMaximumCalls: prompts.length, maximumSearchesPerCall: 1, publicAiFeatureEnabled: false, result };
  const reportPath = process.env.AUDITPRO_AI_PILOT_REPORT_PATH || "/tmp/openrouter-ai-annotation-calibration.json";
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ executedCalls: result.observations.length, completed: result.observations.filter((item) => !item.error).length, reportPath }));
}

void main();
