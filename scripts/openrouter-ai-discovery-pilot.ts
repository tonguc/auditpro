import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { runAiVisibilityScan, type AiVisibilityPrompt } from "../lib/ai-visibility";

// Fixed, unbranded Turkish discovery prompts. They do not contain the target name or domain.
const questions = [
  "Türkiye'de KOBİ'lerin satış ve müşteri hizmetleri süreçlerini yapay zekâyla otomatikleştiren danışmanları nasıl karşılaştırmalıyım?",
  "Türkiye'de küçük işletmeler için yapay zekâ otomasyonu yol haritası hazırlayan uzmanlar kimlerdir?",
  "Türkiye'de CRM, teklif ve takip işlerini yapay zekâyla iyileştirecek danışmanlık hizmeti nereden alınır?",
  "Türkiye'de ekiplerin tekrarlayan operasyonlarını yapay zekâyla otomatikleştiren bağımsız uzman veya ajans önerir misin?",
  "Türkiye'de müşteri destek ekipleri için özel yapay zekâ asistanı kuran hizmet sağlayıcıları nasıl seçebilirim?",
  "Türkiye'de satış ekibinin günlük iş akışlarını yapay zekâ ile sadeleştirmek için hangi danışmanlık seçenekleri var?",
  "Türkiye'de yapay zekâ eğitimi ile uygulama kurulumunu birlikte sunan işletme danışmanları kimlerdir?",
  "Türkiye'de KOBİ'ler için güvenli yapay zekâ otomasyonu projesi başlatırken hangi uzmanları değerlendirmeliyim?",
  "Türkiye'de işletme verimliliği için yapay zekâ otomasyonu hizmeti veren firmaları hangi ölçütlerle karşılaştırmalıyım?",
  "Türkiye'de yapay zekâ destekli müşteri deneyimi ve satış otomasyonu için uzman tavsiyesi verebilir misin?",
];

const prompts: AiVisibilityPrompt[] = questions.map((query, index) => ({
  id: `openrouter-discovery-tr-20260919:${index + 1}`,
  kind: "discovery-intent",
  query,
  contributesToVisibility: true,
}));

async function main() {
  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") {
    throw new Error("The public AI feature must remain disabled during the private pilot.");
  }

  const result = await runAiVisibilityScan({
    brandName: "Tonguç Karacay",
    domain: "tonguckaracay.com",
    industry: "yapay zekâ otomasyonu danışmanlığı",
    locale: "tr",
    promptLimit: prompts.length,
    prompts,
    engines: [{ id: "perplexity", label: "Perplexity", model: "perplexity/sonar" }],
    userId: "private-openrouter-discovery-pilot",
    concurrency: 1,
  });

  const report = {
    method: "openrouter-perplexity-sonar-private-discovery-pilot@1.0.0",
    model: "perplexity/sonar",
    expectedMaximumCalls: prompts.length,
    executedCalls: result.observations.length,
    concurrency: 1,
    retries: 0,
    publicAiFeatureEnabled: false,
    result,
  };
  const reportPath = process.env.AUDITPRO_AI_PILOT_REPORT_PATH || "/tmp/openrouter-ai-discovery-pilot.json";
  await mkdir(dirname(reportPath), { recursive: true });
  await writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ executedCalls: report.executedCalls, completed: result.observations.filter((item) => !item.error).length, reportPath }));
}

void main();
