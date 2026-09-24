import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runAiVisibilityScan, type AiVisibilityPrompt } from "../lib/ai-visibility";

const questions = [
  "Tonguç Karacay hangi hizmetleri sunuyor?",
  "tonguckaracay.com kimlere yönelik hizmet veriyor?",
  "Türkiye'de KOBİ için yapay zekâ otomasyonu danışmanı olarak kimleri değerlendirebilirim?",
  "Türkiye'de müşteri hizmetlerini yapay zekâyla geliştirmek için hangi danışmanlarla çalışabilirim?",
  "Türkiye'de satış süreçlerini otomatikleştiren danışman veya ajans önerir misin?",
  "Türkiye'de bir işletmeye yapay zekâ yol haritası hazırlayan uzmanlar kimler?",
  "Türkiye'de küçük bir ekibin iş akışlarını otomatikleştirmek için hizmet sağlayıcı önerir misin?",
  "Türkiye'de şirketlere yapay zekâ eğitimi ve uygulama desteğini birlikte sunan kimler var?",
  "Türkiye'de özel yapay zekâ asistanı geliştirmek için hangi hizmet sağlayıcıları karşılaştırmalıyım?",
  "Türkiye'de yapay zekâ danışmanlığı sağlayıcısı seçerken hangi firmaları veya uzmanları incelemeliyim?",
];

const prompts: AiVisibilityPrompt[] = questions.map((query, index) => ({
  id: `openrouter-pilot-tr-20260919:${index + 1}`,
  kind: index < 2 ? (index === 0 ? "brand-direct" : "brand-review") : "discovery-intent",
  query,
  contributesToVisibility: index >= 2,
}));

async function main() {
  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") {
    throw new Error("The public AI feature must remain disabled during the private pilot.");
  }

  const runs = [];
  for (const round of [1, 2]) {
    const result = await runAiVisibilityScan({
      brandName: "Tonguç Karacay",
      domain: "tonguckaracay.com",
      industry: "yapay zekâ otomasyonu danışmanlığı",
      locale: "tr",
      promptLimit: 10,
      prompts,
      engines: [{ id: "perplexity", label: "Perplexity", model: "perplexity/sonar" }],
      userId: "private-openrouter-pilot",
      concurrency: 1,
    });
    runs.push({ round, ...result });
    if (round === 1 && (result.observations[0]?.error || result.observations[0].citationEvidence !== "provider-sources")) break;
  }

  const report = {
    method: "openrouter-perplexity-sonar-private-pilot@1.0.0",
    model: "perplexity/sonar",
    expectedMaximumCalls: 20,
    executedCalls: runs.reduce((total, run) => total + run.observations.length, 0),
    concurrency: 1,
    retries: 0,
    publicAiFeatureEnabled: false,
    runs,
  };
  const reportPath = process.env.AUDITPRO_AI_PILOT_REPORT_PATH || "/tmp/openrouter-ai-pilot.json";
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ executedCalls: report.executedCalls, completed: runs.flatMap((run) => run.observations).filter((item) => !item.error).length, reportPath }));
}

void main();
