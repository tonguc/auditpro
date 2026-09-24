import type { AiVisibilityPrompt } from "../lib/ai-visibility";

export const SOURCE_PILOT_PROMPT_SET_VERSION = "tr-ai-automation-discovery-2026-09-19.2";
export const SOURCE_PILOT_AUTHORIZATION = "approved-openrouter-30-source-pilot-v1";
export const SOURCE_PILOT_ESTIMATED_MAXIMUM_USD = 0.45;
export const SOURCE_COMPARISON_AUTHORIZATION = "approved-openrouter-30-openai-source-comparison-v2";
export const SOURCE_COMPARISON_ESTIMATED_BUDGET_USD = 0.50;
export const SOURCE_COMPARISON_MODEL = "openai/gpt-5-mini";
export const SOURCE_COMPARISON_RETRY_AUTHORIZATION = "approved-openrouter-openai-failed-retry-v1";
export const SOURCE_COMPARISON_CALIBRATION_AUTHORIZATION = "approved-openrouter-1-openai-source-calibration-v2";
export const SOURCE_COMPARISON_CALIBRATION_ESTIMATED_BUDGET_USD = 0.03;
export const SOURCE_COMPARISON_CALIBRATION_PROMPT_COUNT = 1;

export type SourcePilotCluster = "provider-discovery" | "use-case-discovery" | "procurement-and-risk";

export type SourcePilotPromptDefinition = {
  id: string;
  cluster: SourcePilotCluster;
  query: string;
};

const definitions: SourcePilotPromptDefinition[] = [
  {
    id: "provider-discovery:01",
    cluster: "provider-discovery",
    query: "Türkiye'de KOBİ'ler için yapay zekâ otomasyonu danışmanlarını güvenilir kaynaklara dayanarak nasıl karşılaştırabilirim?",
  },
  {
    id: "provider-discovery:02",
    cluster: "provider-discovery",
    query: "Türkiye'de küçük işletmelere satış ve müşteri hizmetleri otomasyonu kuran uzmanlar kimlerdir?",
  },
  {
    id: "provider-discovery:03",
    cluster: "provider-discovery",
    query: "Türkiye'de CRM, teklif ve takip işlerini yapay zekâ ile iyileştirecek danışmanlık hizmeti nereden alınır?",
  },
  {
    id: "provider-discovery:04",
    cluster: "provider-discovery",
    query: "Türkiye'de ekiplerin tekrarlayan operasyonlarını yapay zekâyla otomatikleştiren hizmet sağlayıcıları nasıl değerlendirmeliyim?",
  },
  {
    id: "provider-discovery:05",
    cluster: "provider-discovery",
    query: "Türkiye'de müşteri destek ekipleri için özel yapay zekâ asistanı kuran danışmanları hangi kaynaklardan karşılaştırabilirim?",
  },
  {
    id: "provider-discovery:06",
    cluster: "provider-discovery",
    query: "Türkiye'de satış ekibinin iş akışlarını yapay zekâ ile sadeleştirmek için hangi uzmanlık hizmetleri var?",
  },
  {
    id: "provider-discovery:07",
    cluster: "provider-discovery",
    query: "Türkiye'de yapay zekâ eğitimi ile uygulama kurulumunu birlikte sunan işletme danışmanları kimlerdir?",
  },
  {
    id: "provider-discovery:08",
    cluster: "provider-discovery",
    query: "Türkiye'de KOBİ'ler için güvenli yapay zekâ otomasyonu projesi başlatırken hangi uzmanları değerlendirmeliyim?",
  },
  {
    id: "provider-discovery:09",
    cluster: "provider-discovery",
    query: "Türkiye'de işletme verimliliği için yapay zekâ otomasyonu hizmeti veren firmaları hangi ölçütlerle karşılaştırmalıyım?",
  },
  {
    id: "provider-discovery:10",
    cluster: "provider-discovery",
    query: "Türkiye'de yapay zekâ destekli müşteri deneyimi ve satış otomasyonu için hangi danışmanlık seçenekleri bulunur?",
  },
  {
    id: "use-case-discovery:01",
    cluster: "use-case-discovery",
    query: "Türkiye'de KOBİ'ler için WhatsApp taleplerini sınıflandıran ve satış ekibine aktaran yapay zekâ sistemi kuran uzmanlar kimlerdir?",
  },
  {
    id: "use-case-discovery:02",
    cluster: "use-case-discovery",
    query: "Türkiye'de teklif hazırlama ve müşteri takip sürecini yapay zekâ ile otomatikleştiren danışmanları nereden bulabilirim?",
  },
  {
    id: "use-case-discovery:03",
    cluster: "use-case-discovery",
    query: "Türkiye'de randevu, hatırlatma ve müşteri geri dönüşlerini yapay zekâyla yöneten KOBİ çözümleri hangi firmalarda var?",
  },
  {
    id: "use-case-discovery:04",
    cluster: "use-case-discovery",
    query: "Türkiye'de belge, e-posta ve rapor işlemlerini yapay zekâ ile otomatikleştirecek uzmanlık hizmetlerini kimler sunuyor?",
  },
  {
    id: "use-case-discovery:05",
    cluster: "use-case-discovery",
    query: "Türkiye'de e-ticaret müşteri desteği ve sipariş soruları için özel yapay zekâ asistanı kuran danışmanlar kimlerdir?",
  },
  {
    id: "use-case-discovery:06",
    cluster: "use-case-discovery",
    query: "Türkiye'de hizmet işletmelerinin gelen talepleri nitelendirmesi için yapay zekâ otomasyonu kuran sağlayıcılar hangileridir?",
  },
  {
    id: "use-case-discovery:07",
    cluster: "use-case-discovery",
    query: "Türkiye'de mevcut CRM ve muhasebe araçlarını yapay zekâ iş akışlarına bağlayan danışmanlık firmaları kimlerdir?",
  },
  {
    id: "use-case-discovery:08",
    cluster: "use-case-discovery",
    query: "Türkiye'de kod yazmadan veya az kodla KOBİ otomasyonu kuran yapay zekâ uzmanlarını nasıl karşılaştırabilirim?",
  },
  {
    id: "use-case-discovery:09",
    cluster: "use-case-discovery",
    query: "Türkiye'de yönetim raporlarını ve işletme göstergelerini yapay zekâyla hazırlayan KOBİ danışmanları kimlerdir?",
  },
  {
    id: "use-case-discovery:10",
    cluster: "use-case-discovery",
    query: "Türkiye'de birden fazla adımlı iş süreçlerini yapay zekâ ajanlarıyla otomatikleştiren hizmet sağlayıcıları hangileridir?",
  },
  {
    id: "procurement-and-risk:01",
    cluster: "procurement-and-risk",
    query: "Türkiye'de KVKK'ya uygun KOBİ yapay zekâ otomasyonu kurabilecek danışmanları hangi kanıtlarla değerlendirmeliyim?",
  },
  {
    id: "procurement-and-risk:02",
    cluster: "procurement-and-risk",
    query: "Türkiye'de sınırlı bütçeyle yapay zekâ otomasyonu pilotu başlatmak isteyen KOBİ'ler hangi uzmanlarla görüşmeli?",
  },
  {
    id: "procurement-and-risk:03",
    cluster: "procurement-and-risk",
    query: "Türkiye'de önce küçük bir yapay zekâ otomasyonu pilotu kurup sonucu ölçen danışmanlık hizmetleri hangileridir?",
  },
  {
    id: "procurement-and-risk:04",
    cluster: "procurement-and-risk",
    query: "Türkiye'de KOBİ'lere yapay zekâ otomasyonu sonrası bakım, izleme ve ekip desteği sunan firmaları nasıl bulabilirim?",
  },
  {
    id: "procurement-and-risk:05",
    cluster: "procurement-and-risk",
    query: "Türkiye'de yapay zekâ otomasyonu yatırımının geri dönüşünü ölçen ve raporlayan danışmanlar kimlerdir?",
  },
  {
    id: "procurement-and-risk:06",
    cluster: "procurement-and-risk",
    query: "Türkiye'de mevcut iş yazılımlarını değiştirmeden yapay zekâ otomasyonu ekleyen uzmanları hangi kaynaklardan karşılaştırabilirim?",
  },
  {
    id: "procurement-and-risk:07",
    cluster: "procurement-and-risk",
    query: "Türkiye'de Türkçe eğitim, dokümantasyon ve uygulama desteği veren yapay zekâ otomasyonu danışmanları kimlerdir?",
  },
  {
    id: "procurement-and-risk:08",
    cluster: "procurement-and-risk",
    query: "Türkiye'de KOBİ'ler için yapay zekâ otomasyonu tedarikçisi seçerken referans, güvenlik ve teslim kapsamı nasıl karşılaştırılır?",
  },
  {
    id: "procurement-and-risk:09",
    cluster: "procurement-and-risk",
    query: "Türkiye'de sektöre özel KOBİ yapay zekâ otomasyonu geliştiren danışmanları bulmak için hangi kaynaklara bakmalıyım?",
  },
  {
    id: "procurement-and-risk:10",
    cluster: "procurement-and-risk",
    query: "Türkiye'de yapay zekâ otomasyonu projesinde veri güvenliği, insan onayı ve hata yönetimini birlikte sunan firmalar kimlerdir?",
  },
];

export const sourcePilotPromptDefinitions = Object.freeze(definitions.map((item) => Object.freeze({ ...item })));

export const sourcePilotPrompts: AiVisibilityPrompt[] = sourcePilotPromptDefinitions.map((item) => ({
  id: `${SOURCE_PILOT_PROMPT_SET_VERSION}:${item.id}`,
  kind: "discovery-intent",
  query: item.query,
  contributesToVisibility: true,
}));

export function requireSourcePilotAuthorization(environment: Record<string, string | undefined>) {
  if (environment.AUDITPRO_AI_PILOT_AUTHORIZATION !== SOURCE_PILOT_AUTHORIZATION) {
    throw new Error("Explicit approval is required before the 30-prompt paid source pilot can run.");
  }
}

export function requireSourceComparisonAuthorization(environment: Record<string, string | undefined>) {
  if (environment.AUDITPRO_AI_COMPARISON_AUTHORIZATION !== SOURCE_COMPARISON_AUTHORIZATION) {
    throw new Error("Explicit approval is required before the 30-prompt paid OpenAI comparison can run.");
  }
}

export function selectSourceComparisonRetryPrompts(
  plan: { promptSetVersion?: string; requiresFreshExplicitApproval?: boolean; failedPromptIds?: unknown },
  environment: Record<string, string | undefined>,
) {
  if (environment.AUDITPRO_AI_COMPARISON_RETRY_AUTHORIZATION !== SOURCE_COMPARISON_RETRY_AUTHORIZATION) {
    throw new Error("Fresh explicit approval is required before failed OpenAI prompts can be retried.");
  }
  if (plan.promptSetVersion !== SOURCE_PILOT_PROMPT_SET_VERSION || plan.requiresFreshExplicitApproval !== true || !Array.isArray(plan.failedPromptIds)) {
    throw new Error("The retry plan is not compatible with the fixed source prompt set.");
  }
  const requested = new Set(plan.failedPromptIds.filter((value): value is string => typeof value === "string"));
  if (requested.size !== plan.failedPromptIds.length || requested.size === 0) throw new Error("The retry plan must contain unique failed prompt ids.");
  const selected = sourcePilotPrompts.filter((prompt) => requested.has(prompt.id));
  if (selected.length !== requested.size) throw new Error("The retry plan contains an unknown prompt id.");
  return selected;
}

export function requireSourceComparisonCalibrationAuthorization(environment: Record<string, string | undefined>) {
  if (environment.AUDITPRO_AI_COMPARISON_CALIBRATION_AUTHORIZATION !== SOURCE_COMPARISON_CALIBRATION_AUTHORIZATION) {
    throw new Error("Explicit approval is required before the 1-prompt paid OpenAI calibration can run.");
  }
}
