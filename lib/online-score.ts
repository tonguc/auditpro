import type { ContentEvidence } from "./content-evidence";
import type { Finding } from "./html-measurements";
import type { LanguageEvidence } from "./language-evidence";
import { MEASUREMENT_CONTRACT_VERSION } from "./measurement-contract";
import { CALIBRATED_CONTROLS } from "./measurement-policy";
import type { RobotsPageEvidence } from "./robots-evidence";
import type { SchemaDetail } from "./seo-evidence";
import { ONLINE_PILLAR_WEIGHTS } from "./scoring-weights";
import type { SitemapDiscovery } from "./sitemap-discovery";

export const ONLINE_SCORE_METHOD_VERSION = "2.1.0";

// Observation is a measured-but-not-scored control: its method is not calibrated, so it is
// published as a diagnostic instead of a verdict. It never contributes to any score.
export type OnlineScoreStatus = "Pass" | "Partial" | "Fail" | "Observation" | "Unavailable";
export type OnlineScoreVerdict = Exclude<OnlineScoreStatus, "Unavailable" | "Observation">;
export type OnlineScoreScope = { tested: number; discovered: number; complete: boolean };

export type OnlineScoreCheck = {
  id: string;
  label: string;
  labelTr: string;
  action: string;
  actionTr: string;
  evidence: string;
  status: OnlineScoreStatus;
  /** Raw verdict captured before the calibration gate demoted it to Observation. */
  observedStatus?: OnlineScoreVerdict;
  weight: number;
  affectedUrls: string[];
  /** Catalog controls behind this check. Publication requires every one of them calibrated. */
  sourceControlIds?: string[];
  observed?: Record<string, string | number | boolean>;
  methodVersion?: string;
  scoreEligible?: boolean;
  confidence?: "low" | "medium" | "high";
  reasonCode?: string;
  scope?: OnlineScoreScope;
};

export type OnlineScorecard = {
  id: "seo" | "geo" | "technical" | "content" | "ux" | "cro";
  label: string;
  labelTr: string;
  score: number | null;
  coveragePct: number;
  measuredChecks: number;
  /** Controls measured outside the score (diagnostics), kept visible on purpose. */
  observationChecks?: number;
  totalChecks: number;
  status: "Measured" | "Preliminary" | "Insufficient";
  checks: OnlineScoreCheck[];
};

export type OnlineScorecards = {
  version: "1.0.0" | "2.0.0";
  scope: string;
  seo: OnlineScorecard;
  geo: OnlineScorecard;
  overall?: {
    score: number | null;
    coveragePct: number;
    status?: "Measured" | "Preliminary" | "Insufficient";
    measuredChecks: number;
    totalChecks: number;
    errors: number;
    warnings: number;
    notices: number;
    observations?: number;
  };
  pillars?: {
    technical: OnlineScorecard;
    content: OnlineScorecard;
    ux: OnlineScorecard;
    cro: OnlineScorecard;
    geo: OnlineScorecard;
  };
};

export function onlineScoreCheckFamily(id: string) {
  if (id === "content-headings" || id === "geo-structure") return "answer-structure";
  if (id.endsWith("-canonical")) return "canonical";
  if (id.endsWith("-sitemap")) return "sitemap";
  if (id.endsWith("-language")) return "language";
  if (id === "technical-mobile" || id === "ux-overflow") return "mobile-overflow";
  if (id === "ux-mobile-input" || id === "cro-mobile-input") return "mobile-input";
  return id;
}

type Input = {
  findings: Record<string, Finding>;
  sitemapDiscovery: SitemapDiscovery;
  robotsDetails: RobotsPageEvidence[];
  contentDetails: ContentEvidence[];
  schemaDetails: SchemaDetail[];
  languageDetails: LanguageEvidence[];
};

type MeasurementContract = Pick<
  OnlineScoreCheck,
  "sourceControlIds" | "methodVersion" | "scoreEligible" | "confidence" | "reasonCode" | "scope"
>;

type CheckInput = Omit<OnlineScoreCheck, "affectedUrls"> & { affectedUrls?: string[] };

type ScoredCheck = OnlineScoreCheck & { status: OnlineScoreVerdict };

const scoreValue: Record<OnlineScoreVerdict, number> = {
  Pass: 1,
  Partial: 0.5,
  Fail: 0,
};

const UNCERTAIN_REASONS = new Set([
  "coverage-incomplete",
  "scope-incomplete",
  "incomplete-browser-resources",
]);

function isScored(row: OnlineScoreCheck): row is ScoredCheck {
  return row.status === "Pass" || row.status === "Partial" || row.status === "Fail";
}

function check(input: CheckInput): OnlineScoreCheck {
  return {
    sourceControlIds: [],
    methodVersion: "measurement-contract@" + MEASUREMENT_CONTRACT_VERSION,
    scoreEligible: false,
    confidence: "low",
    reasonCode: "not-measured",
    ...input,
    affectedUrls: input.affectedUrls ?? [],
  };
}

function affected(finding: Finding | undefined) {
  return finding?.evidence.pageResults
    ?.filter((row) => row.status === "Fail" || row.status === "Partial")
    .map((row) => row.url) ?? [];
}

function calibratedControls(sourceControlIds: string[]) {
  return sourceControlIds.length > 0 && sourceControlIds.every((id) => Boolean(CALIBRATED_CONTROLS[id]));
}

// Every v2 control carries the same measurement contract: source controls, method version,
// scoreEligible, scope and confidence. The score only ever sees scoreEligible && complete.
function measurementContract(finding: Finding | undefined, sourceControlIds: string[]): MeasurementContract {
  const evidence = finding?.evidence;
  const calibrated = calibratedControls(sourceControlIds);
  return {
    sourceControlIds,
    methodVersion: evidence?.methodVersion ?? "measurement-contract@" + MEASUREMENT_CONTRACT_VERSION,
    scoreEligible: Boolean(calibrated && evidence?.scoreEligible),
    confidence: evidence?.confidence ?? "low",
    reasonCode: evidence?.reasonCode ?? (calibrated ? "score-eligible" : "method-not-calibrated"),
    scope: evidence?.scope ? { ...evidence.scope } : undefined,
  };
}

function verdict(raw: OnlineScoreStatus, contract: MeasurementContract): OnlineScoreStatus {
  // Already demoted by an upstream rule: never promote it back to a verdict.
  if (raw === "Observation" || raw === "Unavailable") return raw;
  // An incomplete site-wide scope may still publish an observed failure. It may never
  // publish a pass: unknown pages are not passed pages.
  if (contract.scope && !contract.scope.complete && raw !== "Fail") return "Unavailable";
  if (contract.reasonCode === "incomplete-browser-resources") return "Unavailable";
  if (!contract.scoreEligible) {
    return contract.reasonCode && UNCERTAIN_REASONS.has(contract.reasonCode) ? "Unavailable" : "Observation";
  }
  return raw;
}

function findingBased(input: {
  id: string;
  sourceControlIds: string[];
  finding?: Finding;
  label: string;
  labelTr: string;
  action: string;
  actionTr: string;
  weight: number;
  fallback?: string;
}): OnlineScoreCheck {
  const contract = measurementContract(input.finding, input.sourceControlIds);
  const raw = input.finding && input.finding.status !== "N/A"
    ? (input.finding.status as OnlineScoreVerdict)
    : undefined;
  const status = raw === undefined ? "Unavailable" : verdict(raw, contract);
  return check({
    id: input.id,
    label: input.label,
    labelTr: input.labelTr,
    action: input.action,
    actionTr: input.actionTr,
    evidence: input.finding?.note ?? input.fallback ?? "Measurement unavailable.",
    observed: input.finding?.evidence.observed,
    status,
    ...(status === "Observation" && raw ? { observedStatus: raw } : {}),
    weight: input.weight,
    affectedUrls: affected(input.finding),
    ...contract,
  });
}

function derivedCheck(input: {
  id: string;
  sourceControlIds: string[];
  finding?: Finding;
  label: string;
  labelTr: string;
  action: string;
  actionTr: string;
  weight: number;
  raw: OnlineScoreStatus;
  evidence: string;
  affectedUrls?: string[];
}): OnlineScoreCheck {
  const contract = measurementContract(input.finding, input.sourceControlIds);
  const status = verdict(input.raw, contract);
  return check({
    id: input.id,
    label: input.label,
    labelTr: input.labelTr,
    action: input.action,
    actionTr: input.actionTr,
    evidence: input.evidence,
    observed: input.finding?.evidence.observed,
    status,
    ...(status === "Observation" && input.raw !== "Observation" && input.raw !== "Unavailable" ? { observedStatus: input.raw } : {}),
    weight: input.weight,
    affectedUrls: input.affectedUrls ?? [],
    ...contract,
  });
}

function indexingCheck(findings: Record<string, Finding>) {
  const details = findings.t4?.evidence.indexingDetails ?? [];
  const blocked = details.filter((row) => row.noindex);
  return {
    raw: (!details.length ? "Unavailable" : blocked.length ? "Fail" : "Pass") as OnlineScoreStatus,
    evidence: !details.length
      ? "No sampled index-directive evidence was available."
      : `${details.length} sampled pages inspected; ${blocked.length} declare noindex/none for Googlebot. A noindex directive may be intentional; presence alone is an observation.`,
    affectedUrls: blocked.map((row) => row.url),
  };
}

function canonicalCheck(findings: Record<string, Finding>) {
  const details = findings.t5?.evidence.canonicalDetails ?? [];
  if (!details.length) return { raw: "Unavailable" as OnlineScoreStatus, evidence: "Canonical evidence was unavailable.", affectedUrls: [] as string[] };
  const broken = details.filter((row) => ["invalid", "http-error", "non-html"].includes(row.state) || row.noindex || row.chain || row.targetCanonicalInvalid);
  // Absence of a canonical is not an error by itself: it is neither a pass nor a partial.
  const missing = details.filter((row) => row.state === "missing");
  const unresolved = details.filter((row) => ["unavailable", "budget"].includes(row.state));
  const declared = details.filter((row) => !broken.includes(row) && !missing.includes(row) && !unresolved.includes(row));
  const raw: OnlineScoreStatus = broken.length ? "Fail" : declared.length ? "Pass" : "Unavailable";
  return {
    raw,
    evidence: `${details.length} sampled pages inspected; ${broken.length} conflicting/broken canonicals, ${declared.length} consistent declarations, ${missing.length} without a declared canonical (absence alone is not an error) and ${unresolved.length} unresolved canonical targets.`,
    affectedUrls: broken.map((row) => row.url),
  };
}

function sitemapCheck(discovery: SitemapDiscovery) {
  const parsed = discovery.maps.filter((row) => row.state === "parsed");
  const failed = discovery.maps.filter((row) => row.state === "unsupported" || row.state === "unavailable");
  const status: OnlineScoreStatus = !discovery.maps.length
    ? "Unavailable"
    : parsed.length && discovery.pages.length
      ? "Pass"
      : failed.length
        ? "Fail"
        : "Partial";
  return {
    raw: status,
    evidence: `${parsed.length}/${discovery.maps.length} inspected sitemap documents parsed; ${discovery.pages.length} same-origin page addresses discovered.`,
    affectedUrls: failed.map((row) => row.url),
  };
}

function crawlerAccess(details: RobotsPageEvidence[], bots: string[]) {
  const rows = details.filter((row) => bots.includes(row.bot));
  const blocked = rows.filter((row) => row.allowed === false);
  const unknown = rows.filter((row) => row.allowed === null);
  const status: OnlineScoreStatus = !rows.length || unknown.length === rows.length
    ? "Unavailable"
    : blocked.length
      ? "Fail"
      : unknown.length
        ? "Partial"
        : "Pass";
  return {
    raw: status,
    evidence: `${rows.length} bot/path decisions inspected; ${blocked.length} blocked and ${unknown.length} unresolved. Policy permission from the retrieved robots.txt does not prove actual bot access or AI visibility.`,
    affectedUrls: blocked.map((row) => row.url),
  };
}

function answerStructure(details: ContentEvidence[]) {
  if (!details.length) return { raw: "Unavailable" as OnlineScoreStatus, evidence: "No parsed heading evidence was available.", affectedUrls: [] as string[] };
  const rows = details.map((row) => {
    const headings = row.headings ?? [];
    return { url: row.url, h1: headings.filter((heading) => heading.level === 1).length, h2: headings.filter((heading) => heading.level === 2).length };
  });
  const missingH1 = rows.filter((row) => row.h1 === 0);
  // Retired control o10: "exactly one H1" is not a scoring rule. Multiple H1 elements are
  // recorded as an observation and never scored under a different id.
  const multipleH1 = rows.filter((row) => row.h1 > 1);
  const shallow = rows.filter((row) => row.h1 >= 1 && row.h2 === 0);
  const status: OnlineScoreStatus = missingH1.length || shallow.length ? "Partial" : "Pass";
  return {
    raw: status,
    evidence: `${rows.length} sampled pages inspected; ${missingH1.length} declare no H1, ${multipleH1.length} declare more than one H1 (multiple H1 is recorded, not scored) and ${shallow.length} have no H2 answer sections.`,
    affectedUrls: [...missingH1, ...shallow].map((row) => row.url),
  };
}

function entitySchema(details: SchemaDetail[]) {
  if (!details.length) return { raw: "Unavailable" as OnlineScoreStatus, evidence: "No schema inspection evidence was available.", affectedUrls: [] as string[] };
  const blocks = details.flatMap((row) => row.blocks.map((block) => ({ url: row.url, ...block })));
  const valid = blocks.filter((row) => row.state === "parsed");
  const entityTypes = new Set(["Organization", "Person", "WebSite", "Article", "BlogPosting", "Service", "LocalBusiness"]);
  const entityBlocks = valid.filter((row) => row.types.some((type) => entityTypes.has(type)));
  const invalid = blocks.filter((row) => row.state === "invalid");
  const status: OnlineScoreStatus = entityBlocks.length && !invalid.length ? "Pass" : entityBlocks.length ? "Partial" : "Fail";
  return {
    raw: status,
    evidence: `${blocks.length} JSON-LD blocks inspected; ${entityBlocks.length} declare a recognized entity/content type and ${invalid.length} contain invalid JSON. Schema presence does not verify ranking eligibility or AI citation.`,
    affectedUrls: invalid.map((row) => row.url),
  };
}

function languageCheck(details: LanguageEvidence[]) {
  if (!details.length) return { raw: "Unavailable" as OnlineScoreStatus, evidence: "No language declarations were inspected.", affectedUrls: [] as string[] };
  const missing = details.filter((row) => !row.lang);
  return {
    raw: missing.length ? "Fail" as OnlineScoreStatus : "Pass" as OnlineScoreStatus,
    evidence: `${details.length} sampled pages inspected; ${missing.length} lack an HTML language declaration.`,
    affectedUrls: missing.map((row) => row.url),
  };
}

function imageAltCheck(details: ContentEvidence[]) {
  const images = details.flatMap((row) => (row.images ?? []).map((image) => ({ url: row.url, ...image })));
  if (!images.length) return { raw: "Unavailable" as OnlineScoreStatus, evidence: "No parsed image elements were available.", affectedUrls: [] as string[] };
  const missing = images.filter((image) => image.alt === null);
  const ratio = missing.length / images.length;
  const status: OnlineScoreStatus = !missing.length ? "Pass" : ratio <= 0.1 ? "Partial" : "Fail";
  return {
    raw: status,
    evidence: `${images.length} parsed image elements inspected; ${missing.length} lack an alt attribute. Decorative intent still requires review.`,
    affectedUrls: [...new Set(missing.map((image) => image.url))],
  };
}

function scorecard(id: OnlineScorecard["id"], label: string, labelTr: string, checks: OnlineScoreCheck[]): OnlineScorecard {
  const scored = checks.filter(isScored);
  const totalWeight = checks.reduce((sum, row) => sum + row.weight, 0);
  const measuredWeight = scored.reduce((sum, row) => sum + row.weight, 0);
  const earned = scored.reduce((sum, row) => sum + row.weight * scoreValue[row.status], 0);
  const coveragePct = totalWeight ? Math.round(measuredWeight / totalWeight * 100) : 0;
  const status = coveragePct >= 80 ? "Measured" : coveragePct >= 50 ? "Preliminary" : "Insufficient";
  return {
    id,
    label,
    labelTr,
    score: measuredWeight && coveragePct >= 50 ? Math.round(earned / measuredWeight * 100) : null,
    coveragePct,
    measuredChecks: scored.length,
    observationChecks: checks.filter((row) => row.status === "Observation").length,
    totalChecks: checks.length,
    status,
    checks,
  };
}

export function buildOnlineScorecards(input: Input): OnlineScorecards {
  const { findings } = input;
  const index = indexingCheck(findings);
  const canonical = canonicalCheck(findings);
  const sitemap = sitemapCheck(input.sitemapDiscovery);
  const googleAccess = crawlerAccess(input.robotsDetails, ["googlebot"]);
  const aiAccess = crawlerAccess(input.robotsDetails, ["oai-searchbot", "perplexitybot", "claudebot"]);
  const structure = answerStructure(input.contentDetails);
  const schema = entitySchema(input.schemaDetails);
  const language = languageCheck(input.languageDetails);
  const imageAlt = imageAltCheck(input.contentDetails);

  const seoChecks = [
    findingBased({ id: "seo-http", sourceControlIds: ["t56"], finding: findings.t56, label: "Reachable pages", labelTr: "Erişilebilir sayfalar", action: "Fix the listed 4xx/5xx responses and rerun the same URLs.", actionTr: "Listelenen 4xx/5xx yanıtlarını düzeltin ve aynı URL'leri yeniden tarayın.", weight: 15, fallback: "HTTP evidence unavailable." }),
    findingBased({ id: "seo-https", sourceControlIds: ["t28"], finding: findings.t28, label: "HTTPS delivery", labelTr: "HTTPS sunumu", action: "Serve every sampled page over HTTPS and remove insecure final destinations.", actionTr: "Örneklenen tüm sayfaları HTTPS üzerinden sunun ve güvensiz nihai hedefleri kaldırın.", weight: 10, fallback: "HTTPS evidence unavailable." }),
    findingBased({ id: "seo-title", sourceControlIds: ["o1"], finding: findings.o1, label: "Page titles", labelTr: "Sayfa başlıkları", action: "Add a specific, nonempty title to every affected page.", actionTr: "Etkilenen her sayfaya özgün ve boş olmayan bir başlık ekleyin.", weight: 10, fallback: "Title evidence unavailable." }),
    findingBased({ id: "seo-title-unique", sourceControlIds: ["o4"], finding: findings.o4, label: "Unique titles", labelTr: "Benzersiz başlıklar", action: "Differentiate pages that share the same title.", actionTr: "Aynı başlığı kullanan farklı sayfaların başlıklarını ayrıştırın.", weight: 8, fallback: "Title comparison unavailable." }),
    findingBased({ id: "seo-description", sourceControlIds: ["o5"], finding: findings.o5, label: "Meta descriptions", labelTr: "Meta açıklamaları", action: "Write an accurate, nonempty description for every affected page.", actionTr: "Etkilenen her sayfa için doğru ve boş olmayan bir meta açıklaması yazın.", weight: 8, fallback: "Description evidence unavailable." }),
    findingBased({ id: "seo-description-unique", sourceControlIds: ["o8"], finding: findings.o8, label: "Unique descriptions", labelTr: "Benzersiz açıklamalar", action: "Replace shared descriptions with page-specific summaries.", actionTr: "Ortak açıklamaları sayfaya özgü özetlerle değiştirin.", weight: 6, fallback: "Description comparison unavailable." }),
    derivedCheck({ id: "seo-index", sourceControlIds: ["t4"], finding: findings.t4, label: "Sampled indexability", labelTr: "Örneklenen sayfaların indekslenebilirliği", action: "Confirm intent for every noindex page; remove accidental noindex/none directives.", actionTr: "Her noindex sayfasının amacını doğrulayın; yanlışlıkla eklenen noindex/none direktiflerini kaldırın.", weight: 12, raw: index.raw, evidence: index.evidence, affectedUrls: index.affectedUrls }),
    derivedCheck({ id: "seo-canonical", sourceControlIds: ["t5"], finding: findings.t5, label: "Canonical identity", labelTr: "Canonical kimliği", action: "Add one consistent canonical per indexable page and repair broken targets or chains.", actionTr: "İndekslenebilir her sayfaya tek ve tutarlı canonical ekleyin; bozuk hedefleri ve zincirleri düzeltin.", weight: 10, raw: canonical.raw, evidence: canonical.evidence, affectedUrls: canonical.affectedUrls }),
    derivedCheck({ id: "seo-sitemap", sourceControlIds: ["t2"], finding: findings.t2, label: "XML sitemap", labelTr: "XML sitemap", action: "Publish a valid same-origin sitemap and list canonical indexable URLs.", actionTr: "Geçerli, aynı origin'de bir sitemap yayımlayın ve canonical indekslenebilir URL'leri listeleyin.", weight: 6, raw: sitemap.raw, evidence: sitemap.evidence, affectedUrls: sitemap.affectedUrls }),
    findingBased({ id: "seo-mobile", sourceControlIds: ["t46"], finding: findings.t46, label: "Mobile horizontal overflow", labelTr: "Mobil yatay taşma", action: "Fix the overflowing elements at 320px and 390px viewports.", actionTr: "320px ve 390px görünümde taşan öğeleri düzeltin.", weight: 7, fallback: "Rendered mobile evidence unavailable." }),
    findingBased({ id: "seo-contrast", sourceControlIds: ["u33"], finding: findings.u33, label: "Text contrast", labelTr: "Metin kontrastı", action: "Fix the listed WCAG contrast failures in the sampled rendered pages.", actionTr: "Örneklenen render edilmiş sayfalardaki WCAG kontrast hatalarını düzeltin.", weight: 4, fallback: "Contrast evidence unavailable." }),
    findingBased({ id: "seo-accessible-name", sourceControlIds: ["u37"], finding: findings.u37, label: "Accessible names", labelTr: "Erişilebilir adlar", action: "Give every affected interactive control an accessible name.", actionTr: "Etkilenen her etkileşimli kontrole erişilebilir bir ad verin.", weight: 4, fallback: "Accessible-name evidence unavailable." }),
  ];

  const geoChecks = [
    derivedCheck({ id: "geo-ai-crawl", sourceControlIds: ["t1"], label: "AI crawler access", labelTr: "AI tarayıcı erişimi", action: "Review robots.txt rules for OAI-SearchBot, PerplexityBot and ClaudeBot; allow the pages intended for discovery.", actionTr: "OAI-SearchBot, PerplexityBot ve ClaudeBot robots.txt kurallarını inceleyin; keşfedilmesini istediğiniz sayfalara izin verin.", weight: 25, raw: aiAccess.raw, evidence: aiAccess.evidence, affectedUrls: aiAccess.affectedUrls }),
    derivedCheck({ id: "geo-search-crawl", sourceControlIds: ["t1"], label: "Googlebot access", labelTr: "Googlebot erişimi", action: "Remove accidental Googlebot blocks from pages intended for search.", actionTr: "Aramada görünmesini istediğiniz sayfalardaki yanlış Googlebot engellerini kaldırın.", weight: 10, raw: googleAccess.raw, evidence: googleAccess.evidence, affectedUrls: googleAccess.affectedUrls }),
    derivedCheck({ id: "geo-index", sourceControlIds: ["t4"], finding: findings.t4, label: "Indexable source pages", labelTr: "İndekslenebilir kaynak sayfalar", action: "Remove accidental noindex directives from the pages meant to become answer sources.", actionTr: "Yanıt kaynağı olmasını istediğiniz sayfalardaki yanlış noindex direktiflerini kaldırın.", weight: 15, raw: index.raw, evidence: index.evidence, affectedUrls: index.affectedUrls }),
    derivedCheck({ id: "geo-canonical", sourceControlIds: ["t5"], finding: findings.t5, label: "Stable page identity", labelTr: "Kararlı sayfa kimliği", action: "Use one reachable canonical URL for every source page.", actionTr: "Her kaynak sayfa için erişilebilir tek bir canonical URL kullanın.", weight: 10, raw: canonical.raw, evidence: canonical.evidence, affectedUrls: canonical.affectedUrls }),
    derivedCheck({ id: "geo-sitemap", sourceControlIds: ["t2"], finding: findings.t2, label: "Discoverable source inventory", labelTr: "Keşfedilebilir kaynak envanteri", action: "Expose canonical source pages through a valid sitemap.", actionTr: "Canonical kaynak sayfaları geçerli bir sitemap üzerinden yayımlayın.", weight: 10, raw: sitemap.raw, evidence: sitemap.evidence, affectedUrls: sitemap.affectedUrls }),
    derivedCheck({ id: "geo-structure", sourceControlIds: ["o13"], label: "Answer-ready heading structure", labelTr: "Yanıta hazır başlık yapısı", action: "Use one clear H1 and descriptive H2 sections that answer specific questions.", actionTr: "Tek bir açık H1 ve belirli soruları yanıtlayan açıklayıcı H2 bölümleri kullanın.", weight: 15, raw: structure.raw, evidence: structure.evidence, affectedUrls: structure.affectedUrls }),
    derivedCheck({ id: "geo-entity", sourceControlIds: ["t35"], label: "Entity and content schema", labelTr: "Varlık ve içerik şeması", action: "Add valid JSON-LD for the real organization/person and applicable content type; keep it consistent with visible content.", actionTr: "Gerçek kuruluş/kişi ve uygun içerik türü için geçerli JSON-LD ekleyin; görünür içerikle tutarlı tutun.", weight: 10, raw: schema.raw, evidence: schema.evidence, affectedUrls: schema.affectedUrls }),
    derivedCheck({ id: "geo-language", sourceControlIds: ["t53"], label: "Declared content language", labelTr: "Beyan edilen içerik dili", action: "Declare the correct HTML language on every source page.", actionTr: "Her kaynak sayfada doğru HTML dilini beyan edin.", weight: 5, raw: language.raw, evidence: language.evidence, affectedUrls: language.affectedUrls }),
  ];

  const technicalChecks = [
    findingBased({ id: "technical-http", sourceControlIds: ["t56"], finding: findings.t56, label: "HTTP status health", labelTr: "HTTP durum sağlığı", action: "Repair the listed broken or unavailable internal destinations.", actionTr: "Listelenen bozuk veya erişilemeyen iç hedefleri düzeltin.", weight: 18, fallback: "HTTP evidence unavailable." }),
    findingBased({ id: "technical-https", sourceControlIds: ["t28"], finding: findings.t28, label: "HTTPS delivery", labelTr: "HTTPS sunumu", action: "Serve every audited page over HTTPS.", actionTr: "Denetlenen tüm sayfaları HTTPS üzerinden sunun.", weight: 10, fallback: "HTTPS evidence unavailable." }),
    derivedCheck({ id: "technical-googlebot", sourceControlIds: ["t1"], label: "Googlebot crawl access", labelTr: "Googlebot tarama erişimi", action: "Remove accidental Googlebot blocks on pages intended for search.", actionTr: "Aramaya açık sayfalardaki yanlış Googlebot engellerini kaldırın.", weight: 10, raw: googleAccess.raw, evidence: googleAccess.evidence, affectedUrls: googleAccess.affectedUrls }),
    derivedCheck({ id: "technical-index", sourceControlIds: ["t4"], finding: findings.t4, label: "Index directives", labelTr: "İndeks direktifleri", action: "Review and remove accidental noindex declarations.", actionTr: "Yanlışlıkla eklenen noindex bildirimlerini inceleyip kaldırın.", weight: 15, raw: index.raw, evidence: index.evidence, affectedUrls: index.affectedUrls }),
    derivedCheck({ id: "technical-canonical", sourceControlIds: ["t5"], finding: findings.t5, label: "Canonical targets", labelTr: "Canonical hedefleri", action: "Repair conflicting, chained, or unreachable canonical targets.", actionTr: "Çelişkili, zincirli veya erişilemeyen canonical hedeflerini düzeltin.", weight: 15, raw: canonical.raw, evidence: canonical.evidence, affectedUrls: canonical.affectedUrls }),
    derivedCheck({ id: "technical-sitemap", sourceControlIds: ["t2"], finding: findings.t2, label: "XML sitemap", labelTr: "XML sitemap", action: "Publish a valid same-origin sitemap containing canonical pages.", actionTr: "Canonical sayfaları içeren geçerli ve aynı origin'de bir sitemap yayımlayın.", weight: 10, raw: sitemap.raw, evidence: sitemap.evidence, affectedUrls: sitemap.affectedUrls }),
    findingBased({ id: "technical-redirects", sourceControlIds: ["t9"], finding: findings.t9, label: "Redirect chains", labelTr: "Yönlendirme zincirleri", action: "Point internal links directly to final URLs and remove multi-hop chains.", actionTr: "İç bağlantıları doğrudan nihai URL'lere yönlendirin ve çok adımlı zincirleri kaldırın.", weight: 8, fallback: "Redirect evidence unavailable." }),
    findingBased({ id: "technical-mobile", sourceControlIds: ["t46"], finding: findings.t46, label: "Mobile overflow", labelTr: "Mobil yatay taşma", action: "Fix elements that overflow at required mobile widths.", actionTr: "Zorunlu mobil genişliklerde taşan öğeleri düzeltin.", weight: 9, fallback: "Rendered mobile evidence unavailable." }),
    derivedCheck({ id: "technical-language", sourceControlIds: ["t53"], label: "Language declaration", labelTr: "Dil bildirimi", action: "Declare the correct HTML language on every audited page.", actionTr: "Denetlenen her sayfada doğru HTML dilini bildirin.", weight: 5, raw: language.raw, evidence: language.evidence, affectedUrls: language.affectedUrls }),
  ];

  const contentChecks = [
    findingBased({ id: "content-title", sourceControlIds: ["o1"], finding: findings.o1, label: "Page titles", labelTr: "Sayfa başlıkları", action: "Add a clear, nonempty title to every affected page.", actionTr: "Etkilenen her sayfaya açık ve boş olmayan bir başlık ekleyin.", weight: 15, fallback: "Title evidence unavailable." }),
    findingBased({ id: "content-title-unique", sourceControlIds: ["o4"], finding: findings.o4, label: "Unique titles", labelTr: "Benzersiz başlıklar", action: "Differentiate pages that share the same title.", actionTr: "Aynı başlığı paylaşan sayfaları ayrıştırın.", weight: 10, fallback: "Title comparison unavailable." }),
    findingBased({ id: "content-description", sourceControlIds: ["o5"], finding: findings.o5, label: "Meta descriptions", labelTr: "Meta açıklamaları", action: "Write a specific meta description for every affected page.", actionTr: "Etkilenen her sayfa için özgün bir meta açıklaması yazın.", weight: 15, fallback: "Description evidence unavailable." }),
    findingBased({ id: "content-description-unique", sourceControlIds: ["o8"], finding: findings.o8, label: "Unique descriptions", labelTr: "Benzersiz açıklamalar", action: "Replace repeated descriptions with page-specific summaries.", actionTr: "Tekrarlanan açıklamaları sayfaya özgü özetlerle değiştirin.", weight: 10, fallback: "Description comparison unavailable." }),
    derivedCheck({ id: "content-headings", sourceControlIds: ["o13"], label: "Answer-ready headings", labelTr: "Yanıta hazır başlıklar", action: "Use one clear H1 and descriptive H2 sections.", actionTr: "Tek bir açık H1 ve açıklayıcı H2 bölümleri kullanın.", weight: 15, raw: structure.raw, evidence: structure.evidence, affectedUrls: structure.affectedUrls }),
    derivedCheck({ id: "content-schema", sourceControlIds: ["t35"], label: "Entity/content schema", labelTr: "Varlık ve içerik şeması", action: "Add valid JSON-LD that matches visible content.", actionTr: "Görünür içerikle eşleşen geçerli JSON-LD ekleyin.", weight: 15, raw: schema.raw, evidence: schema.evidence, affectedUrls: schema.affectedUrls }),
    derivedCheck({ id: "content-language", sourceControlIds: ["t53"], label: "Declared language", labelTr: "Beyan edilen dil", action: "Declare the correct language for each page.", actionTr: "Her sayfa için doğru dili beyan edin.", weight: 10, raw: language.raw, evidence: language.evidence, affectedUrls: language.affectedUrls }),
    derivedCheck({ id: "content-image-alt", sourceControlIds: ["u34"], label: "Image alternatives", labelTr: "Görsel alternatifleri", action: "Add meaningful alt text where images convey information; keep decorative images empty-alt.", actionTr: "Bilgi taşıyan görsellere anlamlı alt metni ekleyin; dekoratif görselleri boş alt ile bırakın.", weight: 10, raw: imageAlt.raw, evidence: imageAlt.evidence, affectedUrls: imageAlt.affectedUrls }),
  ];

  const uxChecks = [
    findingBased({ id: "ux-viewport", sourceControlIds: ["t45"], finding: findings.t45, label: "Responsive viewport", labelTr: "Duyarlı viewport", action: "Add a device-width viewport declaration.", actionTr: "device-width içeren bir viewport bildirimi ekleyin.", weight: 10, fallback: "Viewport evidence unavailable." }),
    findingBased({ id: "ux-overflow", sourceControlIds: ["t46"], finding: findings.t46, label: "Mobile horizontal overflow", labelTr: "Mobil yatay taşma", action: "Fix overflowing elements at 320px and 390px.", actionTr: "320px ve 390px genişliklerde taşan öğeleri düzeltin.", weight: 15, fallback: "Rendered mobile evidence unavailable." }),
    findingBased({ id: "ux-touch", sourceControlIds: ["t47"], finding: findings.t47, label: "Touch target size", labelTr: "Dokunma hedefi boyutu", action: "Increase undersized mobile controls to the declared minimum.", actionTr: "Küçük mobil kontrolleri belirtilen minimum boyuta çıkarın.", weight: 15, fallback: "Touch-target evidence unavailable." }),
    findingBased({ id: "ux-contrast", sourceControlIds: ["u33"], finding: findings.u33, label: "Text contrast", labelTr: "Metin kontrastı", action: "Correct the listed WCAG contrast failures.", actionTr: "Listelenen WCAG kontrast hatalarını düzeltin.", weight: 15, fallback: "Contrast evidence unavailable." }),
    findingBased({ id: "ux-names", sourceControlIds: ["u37"], finding: findings.u37, label: "Accessible names", labelTr: "Erişilebilir adlar", action: "Give every affected control an accessible name.", actionTr: "Etkilenen her kontrole erişilebilir bir ad verin.", weight: 15, fallback: "Accessible-name evidence unavailable." }),
    findingBased({ id: "ux-keyboard", sourceControlIds: ["u35"], finding: findings.u35, label: "Keyboard reachability", labelTr: "Klavye erişilebilirliği", action: "Make every interactive control keyboard reachable and remove traps.", actionTr: "Her etkileşimli kontrolü klavyeyle erişilebilir yapın ve tuzakları kaldırın.", weight: 10, fallback: "Keyboard evidence unavailable." }),
    findingBased({ id: "ux-focus", sourceControlIds: ["u36"], finding: findings.u36, label: "Visible focus", labelTr: "Görünür odak", action: "Provide a clearly visible focus state for keyboard users.", actionTr: "Klavye kullanıcıları için açıkça görünür odak durumu sağlayın.", weight: 10, fallback: "Focus evidence unavailable." }),
    findingBased({ id: "ux-mobile-input", sourceControlIds: ["u39"], finding: findings.u39, label: "Mobile form inputs", labelTr: "Mobil form alanları", action: "Use appropriate input types and inputmode values.", actionTr: "Uygun input type ve inputmode değerlerini kullanın.", weight: 10, fallback: "Mobile input evidence unavailable." }),
  ];

  const croChecks = [
    findingBased({ id: "cro-primary-cta", sourceControlIds: ["c1"], finding: findings.c1, label: "Primary CTA visibility", labelTr: "Birincil CTA görünürlüğü", action: "Expose one clear, high-confidence primary action across key viewports.", actionTr: "Temel ekran genişliklerinde tek ve açık bir birincil aksiyon gösterin.", weight: 30, fallback: "CTA evidence unavailable." }),
    findingBased({ id: "cro-lead-form", sourceControlIds: ["c17"], finding: findings.c17, label: "Lead path and form load", labelTr: "Lead yolu ve form yükü", action: "Provide a clear lead path and reduce unnecessarily long forms.", actionTr: "Açık bir lead yolu sağlayın ve gereksiz uzun formları kısaltın.", weight: 25, fallback: "Lead-form evidence unavailable." }),
    findingBased({ id: "cro-autocomplete", sourceControlIds: ["c19"], finding: findings.c19, label: "Form assistance", labelTr: "Form yardımı", action: "Add suitable autocomplete declarations to eligible fields.", actionTr: "Uygun alanlara doğru autocomplete bildirimlerini ekleyin.", weight: 20, fallback: "Autocomplete evidence unavailable." }),
    findingBased({ id: "cro-mobile-input", sourceControlIds: ["u39"], finding: findings.u39, label: "Mobile input readiness", labelTr: "Mobil giriş hazırlığı", action: "Use mobile-appropriate input types and keyboards.", actionTr: "Mobil uyumlu alan türleri ve klavyeler kullanın.", weight: 10, fallback: "Mobile input evidence unavailable." }),
    findingBased({ id: "cro-phone-path", sourceControlIds: ["c26"], finding: findings.c26, label: "Direct phone path", labelTr: "Doğrudan telefon yolu", action: "Expose a valid click-to-call route where phone conversion is applicable.", actionTr: "Telefon dönüşümü uygunsa geçerli bir tıkla-ara yolu gösterin.", weight: 15, fallback: "Phone path evidence unavailable." }),
  ];

  const pillars = {
    technical: scorecard("technical", "Technical SEO", "Teknik SEO", technicalChecks),
    content: scorecard("content", "On-page & content", "Sayfa içi ve içerik", contentChecks),
    ux: scorecard("ux", "UX & accessibility", "UX ve erişilebilirlik", uxChecks),
    cro: scorecard("cro", "Conversion readiness", "Dönüşüm hazırlığı", croChecks),
    geo: scorecard("geo", "GEO readiness", "GEO hazırlığı", geoChecks),
  };
  const pillarWeights = ONLINE_PILLAR_WEIGHTS;
  const pillarRows = (Object.keys(pillarWeights) as Array<keyof typeof pillarWeights>).map((id) => ({ card: pillars[id], weight: pillarWeights[id] }));
  const scoredWeight = pillarRows.filter((row) => row.card.score !== null).reduce((sum, row) => sum + row.weight, 0);
  const overallChecks = pillarRows.flatMap((row) => row.card.checks);
  const openChecks = overallChecks
    .filter((row) => row.status === "Fail" || row.status === "Partial")
    .sort((a, b) => a.status === b.status ? b.weight - a.weight : a.status === "Fail" ? -1 : 1);
  const uniqueOpenChecks = [...new Map(openChecks.map((row) => [onlineScoreCheckFamily(row.id), row])).values()];
  const coveragePct = Math.round(pillarRows.reduce((sum, row) => sum + row.card.coveragePct * row.weight, 0));
  const rawScore = scoredWeight ? pillarRows.reduce((sum, row) => sum + (row.card.score ?? 0) * row.weight, 0) / scoredWeight : null;
  const overallStatus: "Measured" | "Preliminary" | "Insufficient" = coveragePct >= 80 ? "Measured" : coveragePct >= 50 ? "Preliminary" : "Insufficient";
  const overall = {
    // Coverage is published next to the score, never blended into it: a raw 87 with 55%
    // coverage must not be presented as 71. The gate decides whether it is shown at all.
    score: rawScore !== null && coveragePct >= 50 ? Math.round(rawScore) : null,
    coveragePct,
    status: overallStatus,
    measuredChecks: overallChecks.filter(isScored).length,
    totalChecks: overallChecks.length,
    errors: uniqueOpenChecks.filter((row) => row.status === "Fail").length,
    warnings: uniqueOpenChecks.filter((row) => row.status === "Partial").length,
    notices: overallChecks.filter((row) => row.status === "Unavailable").length,
    observations: overallChecks.filter((row) => row.status === "Observation").length,
  };

  return {
    version: "2.0.0",
    scope: "Sampled technical SEO and GEO readiness. It does not measure rankings, Search Console performance, traffic, conversions, or live AI-engine citations.",
    seo: scorecard("seo", "Online SEO score", "Online SEO puanı", seoChecks),
    geo: pillars.geo,
    overall,
    pillars,
  };
}
