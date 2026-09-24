import { configureAuditBrowser } from './audit-browser-network';
import {selectBrowserSample, type BrowserPageCoverage} from './browser-sample';
import { compareSchemaText } from './schema-visible';
import { collectLabCwv } from './cwv-evidence';
import { applyMeasurementPolicy } from './measurement-policy';
import axe from "axe-core";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { chromium, type BrowserContext, type Page } from "playwright";

import { MEASUREMENT_CONTRACT_VERSION, type MeasurementEvidence } from "./measurement-contract";

type BrowserStatus = "Pass" | "Partial" | "Fail" | "N/A";
type RuleSummary = { passed: number; failed: number; incomplete: number; failures?: Array<{rule: string; target: string}> };
type KeyboardSummary = { discovered: number; reached: number; focusVisible: number; trapDetected: boolean };
type ImageLoadingSummary = { discovered: number; lazy: number; visible: number; lazyVisible: number; performanceMatches: number; lazyPerformanceMatches: number };
type ScriptLoadingSummary = { discovered: number; modules: number; async: number; defer: number; performanceMatches: number };

export type ViewportProfile = {
  name: "mobile-320" | "mobile-360" | "mobile-390" | "tablet" | "desktop";
  width: number;
  height: number;
  isMobile: boolean;
};

export type BrowserFinding = {
  status: BrowserStatus;
  note: string;
  evidence: MeasurementEvidence;
};

export type ViewportMeasurement = {
  url?: string;
  resourcesComplete?: boolean;
  profile: ViewportProfile;
  contrast: RuleSummary;
  names: RuleSummary;
  keyboard?: KeyboardSummary;
  overflow: { pixels: number; offenders: number };
  touch: { tested: number; failed: number };
  cta: { candidates: number; clear: boolean; aboveFold: boolean; confidence: number };
  forms: { fields: number; autocomplete: number; leadForms: number; largestLeadForm: number; mobileApplicable: number; mobileCorrect: number; details?: Array<{index: number; fields: number; required: number; autocomplete: number}> };
  imageLoading: ImageLoadingSummary;
  scriptLoading: ScriptLoadingSummary;
  cwv?: { lcpMs: number | null; cls: number | null };
};

export const VIEWPORT_PROFILES: ViewportProfile[] = [
  { name: "mobile-320", width: 320, height: 800, isMobile: true },
  { name: "mobile-360", width: 360, height: 800, isMobile: true },
  { name: "mobile-390", width: 390, height: 844, isMobile: true },
  { name: "tablet", width: 768, height: 1024, isMobile: true },
  { name: "desktop", width: 1365, height: 768, isMobile: false },
];

function makeEvidence(
  metricId: string,
  tested: number,
  discovered: number,
  complete: boolean,
  details: Partial<MeasurementEvidence> = {},
): MeasurementEvidence {
  return {
    source: "browser",
    confidence: complete ? "high" : "medium",
    scoreEligible: complete && tested > 0,
    contractVersion: MEASUREMENT_CONTRACT_VERSION,
    methodVersion: `${metricId}@1.0.0`,
    metricId,
    scope: { tested, discovered, complete },
    ...details,
  };
}

export async function stabilizePage(page: Page) {
  await page.waitForLoadState("load", { timeout: 10000 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addStyleTag({ content: "*,*::before,*::after{animation-duration:0s!important;animation-delay:0s!important;transition-duration:0s!important;caret-color:transparent!important}" });
  await page.evaluate(async () => {
    await document.fonts?.ready;
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
  });
}

let axeSourceCache: string | null = null;
function axeSource() {
  if (axeSourceCache === null) {
    // Read the packaged axe bundle from disk at RUNTIME. Handing the bundler's
    // `axe.source` export to eval produced a build-transformed program that
    // crashes on its own minified helpers (ReferenceError on renamed variables)
    // ONLY in production builds — the tsx-run tests stayed green because they
    // receive the untouched export (2026-09-23 real-site diagnosis).
    const require_ = createRequire(process.cwd() + "/package.json");
    axeSourceCache = readFileSync(require_.resolve("axe-core"), "utf8");
  }
  return axeSourceCache;
}

async function installAxe(page: Page) {
  await page.evaluate((source) => {
    // Indirect eval: classic-script (sloppy) semantics so the UMD bundle takes
    // the browser path and attaches to the page realm.
    (0, eval)(source);
  }, axeSource());
}

async function axeSummary(page: Page, ruleIds: string[]): Promise<RuleSummary> {
  return page.evaluate(async (ids) => {
    const result = await (window as typeof window & { axe: typeof axe }).axe.run(document, { runOnly: { type: "rule", values: ids } });
    const count = (entries: Array<{ nodes: unknown[] }>) => entries.reduce((sum, entry) => sum + entry.nodes.length, 0);
    return { passed: count(result.passes), failed: count(result.violations), incomplete: count(result.incomplete), failures: result.violations.flatMap(rule => rule.nodes.map(node => ({rule: rule.id, target: JSON.stringify(node.target)}))) };
  }, ruleIds);
}

async function measureForms(page: Page) {
  return page.evaluate(() => {
    const ignored = ["hidden", "submit", "button", "reset", "image"];
    const fields = [...document.querySelectorAll<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>("input,select,textarea")]
      .filter((field) => !ignored.includes((field.getAttribute("type") || "").toLowerCase()));
    const forms = [...document.querySelectorAll<HTMLFormElement>("form")];
    const details = forms.map((form,index) => {
      const owned = [...form.elements].filter((field) => field.matches('input,select,textarea') && !ignored.includes((field.getAttribute('type') || '').toLowerCase()));
      return {index:index+1,fields:owned.length,required:owned.filter(field=>field.hasAttribute('required')).length,autocomplete:owned.filter(field=>Boolean(field.getAttribute('autocomplete')?.trim())).length};
    });
    const leadPattern = /contact|iletisim|iletişim|signup|sign-up|register|demo|trial|lead|quote|teklif|subscribe|newsletter/i;
    const leadForms = forms.filter((form) => leadPattern.test(`${form.id} ${form.className} ${form.name} ${form.action} ${form.textContent || ""}`));
    const countFields = (form: HTMLFormElement) => [...form.querySelectorAll("input,select,textarea")]
      .filter((field) => !ignored.includes((field.getAttribute("type") || "").toLowerCase())).length;
    const mobileApplicable = fields.filter((field) => /email|phone|tel|number|date/i.test(`${field.getAttribute("autocomplete") || ""} ${field.getAttribute("name") || ""} ${field.getAttribute("inputmode") || ""}`));
    const mobileCorrect = mobileApplicable.filter((field) => /email|tel|number|date/i.test(`${field.getAttribute("type") || ""} ${field.getAttribute("inputmode") || ""}`));
    return {
      details,
      fields: fields.length,
      autocomplete: fields.filter((field) => Boolean(field.getAttribute("autocomplete")?.trim())).length,
      leadForms: leadForms.length,
      largestLeadForm: leadForms.length ? Math.max(...leadForms.map(countFields)) : 0,
      mobileApplicable: mobileApplicable.length,
      mobileCorrect: mobileCorrect.length,
    };
  });
}

async function measureKeyboard(page: Page): Promise<KeyboardSummary> {
  const discovered = await page.evaluate(() => {
    const selector = "a[href],button,input,select,textarea,[tabindex],[contenteditable='true']";
    const controls = [...document.querySelectorAll<HTMLElement>(selector)].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return !element.hasAttribute("disabled") && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    const baseline: Record<string, { outline: string; shadow: string; border: string; background: string }> = {};
    controls.forEach((element, index) => {
      const id = `auditpro-focus-${index}`;
      element.dataset.auditproFocusId = id;
      const style = getComputedStyle(element);
      baseline[id] = { outline: style.outline, shadow: style.boxShadow, border: style.borderColor, background: style.backgroundColor };
    });
    (window as typeof window & { __auditProFocusBaseline?: typeof baseline }).__auditProFocusBaseline = baseline;
    (document.activeElement as HTMLElement | null)?.blur?.();
    return controls.length;
  });
  if (!discovered) return { discovered: 0, reached: 0, focusVisible: 0, trapDetected: false };

  const reached = new Set<string>();
  const visible = new Set<string>();
  let repeatedBeforeCoverage = false;
  for (let index = 0; index < Math.min(discovered + 8, 200); index += 1) {
    await page.keyboard.press("Tab");
    const focus = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      const id = element?.dataset.auditproFocusId;
      if (!element || !id) return null;
      const style = getComputedStyle(element);
      const baseline = (window as typeof window & { __auditProFocusBaseline?: Record<string, { outline: string; shadow: string; border: string; background: string }> }).__auditProFocusBaseline?.[id];
      const outline = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
      const changed = baseline ? (style.outline !== baseline.outline || style.boxShadow !== baseline.shadow || style.borderColor !== baseline.border || style.backgroundColor !== baseline.background) : false;
      return { id, visible: outline || changed };
    });
    if (!focus) continue;
    if (reached.has(focus.id)) {
      repeatedBeforeCoverage = reached.size < discovered;
      break;
    }
    reached.add(focus.id);
    if (focus.visible) visible.add(focus.id);
  }
  return { discovered, reached: reached.size, focusVisible: visible.size, trapDetected: repeatedBeforeCoverage };
}

async function measureOverflow(page: Page) {
  return page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    const overflow = Math.max(document.documentElement.scrollWidth, document.body?.scrollWidth || 0) - viewport;
    const offenders = [...document.querySelectorAll<HTMLElement>("body *")].filter((element) => {
      const style = getComputedStyle(element);
      const parent = element.parentElement ? getComputedStyle(element.parentElement) : null;
      const intentional = parent && ["auto", "scroll"].includes(parent.overflowX) && element.parentElement!.scrollWidth > element.parentElement!.clientWidth;
      if (intentional || style.position === "fixed" || style.display === "none" || style.visibility === "hidden") return false;
      const rect = element.getBoundingClientRect();
      return rect.width > 0 && (rect.right > viewport + 2 || rect.left < -2);
    });
    return { pixels: Math.max(0, Math.round(overflow)), offenders: offenders.length };
  });
}

async function measureTouchTargets(page: Page) {
  return page.evaluate(() => {
    const targets = [...document.querySelectorAll<HTMLElement>("a[href],button,input,select,textarea,[role='button']")].filter((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const inlineTextLink = element.tagName === "A" && style.display === "inline" && element.parentElement?.matches("p,li");
      return !inlineTextLink && !element.hasAttribute("disabled") && style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    });
    return { tested: targets.length, failed: targets.filter((element) => { const rect = element.getBoundingClientRect(); return rect.width < 48 || rect.height < 48; }).length };
  });
}

async function measureCta(page: Page) {
  return page.evaluate(() => {
    const action = /\b(get|start|try|buy|book|contact|request|quote|demo|trial|sign\s?up|register|subscribe|download|başla|dene|satın\s?al|rezervasyon|iletişim|teklif|kaydol|indir|kaufen|testen|kontakt|angebot|registrieren|commencer|essayer|acheter|réserver|devis|inscrire|comenzar|probar|comprar|reservar|contacto|cotización|registrarse|ابدأ|جرّب|اشتر|احجز|اتصل|سجل|开始|试用|购买|预约|联系|注册)\b/i;
    const intentPath = /\/(signup|register|pricing|plans?|contact|demo|trial|checkout|buy|quote|teklif|iletisim|iletişim)(?:[/?#]|$)/i;
    const exclude = /cookie|consent|login|log in|sign in|menu|close|language|facebook|instagram|linkedin|twitter|whatsapp/i;
    const bodyBackground = getComputedStyle(document.body).backgroundColor;
    const candidates = [...document.querySelectorAll<HTMLElement>("a[href],button,input[type='submit'],[role='button']")].flatMap((element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      const text = (element.innerText || element.getAttribute("value") || element.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ");
      const href = element instanceof HTMLAnchorElement ? element.getAttribute("href") || "" : "";
      if (!text || exclude.test(`${text} ${href}`) || style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.9 || rect.width < 44 || rect.height < 24) return [];
      const intent = action.test(text) && intentPath.test(href) ? 0.35 : action.test(text) || intentPath.test(href) ? 0.25 : 0;
      const purpose = intentPath.test(href) ? 0.25 : action.test(text) ? 0.15 : 0;
      const visual = style.backgroundColor !== bodyBackground && style.backgroundColor !== "rgba(0, 0, 0, 0)" ? 0.15 : 0.05;
      const insideHeight = Math.max(0, Math.min(rect.bottom, innerHeight) - Math.max(rect.top, 0));
      const insideWidth = Math.max(0, Math.min(rect.right, innerWidth) - Math.max(rect.left, 0));
      const aboveFoldRatio = rect.width * rect.height ? insideWidth * insideHeight / (rect.width * rect.height) : 0;
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const covering = centerX >= 0 && centerX <= innerWidth && centerY >= 0 && centerY <= innerHeight ? document.elementFromPoint(centerX, centerY) : element;
      const visibleRatio = covering && (covering === element || element.contains(covering) || covering.contains(element)) ? 1 : 0;
      const position = aboveFoldRatio >= 0.5 ? 0.15 : 0;
      const size = rect.width * rect.height >= 3000 ? 0.1 : 0.05;
      const score = intent + purpose + visual + position + size;
      const signature = `${text.toLowerCase()}|${href.replace(/[?#].*$/, "")}`;
      return [{ signature, score, visibleRatio, aboveFold: aboveFoldRatio >= 0.5 }];
    });
    const groups = new Map<string, { signature: string; score: number; visibleRatio: number; aboveFold: boolean }>();
    for (const candidate of candidates) {
      const current = groups.get(candidate.signature);
      groups.set(candidate.signature, { signature: candidate.signature, score: Math.max(current?.score || 0, candidate.score), visibleRatio: Math.max(current?.visibleRatio || 0, candidate.visibleRatio), aboveFold: Boolean(current?.aboveFold || candidate.aboveFold) });
    }
    const ranked = [...groups.values()].sort((a, b) => b.score - a.score);
    const best = ranked[0];
    const clear = Boolean(best && best.score >= 0.7 && best.visibleRatio >= 0.9 && (!ranked[1] || best.score - ranked[1].score >= 0.15));
    return { candidates: ranked.length, clear, aboveFold: clear ? best.aboveFold : false, confidence: best?.score || 0 };
  });
}

async function measureImageLoading(page: Page): Promise<ImageLoadingSummary> {
  return page.evaluate(() => {
    const resourceUrls = new Set(performance.getEntriesByType("resource").map((entry) => entry.name));
    const images = [...document.images].map((image) => {
      const rect = image.getBoundingClientRect();
      const style = getComputedStyle(image);
      const visible = style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0
        && rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
      const lazy = image.loading === "lazy";
      const source = image.currentSrc || image.src;
      return { lazy, visible, performanceMatch: Boolean(source && resourceUrls.has(source)) };
    });
    return {
      discovered: images.length,
      lazy: images.filter((image) => image.lazy).length,
      visible: images.filter((image) => image.visible).length,
      lazyVisible: images.filter((image) => image.lazy && image.visible).length,
      performanceMatches: images.filter((image) => image.performanceMatch).length,
      lazyPerformanceMatches: images.filter((image) => image.lazy && image.performanceMatch).length,
    };
  });
}

async function measureScriptLoading(page: Page): Promise<ScriptLoadingSummary> {
  return page.evaluate(() => {
    const resourceUrls = new Set(performance.getEntriesByType("resource").map((entry) => entry.name));
    const scripts = [...document.scripts].filter((script) => Boolean(script.src)).map((script) => ({
      module: script.type.toLowerCase() === "module",
      async: script.async,
      defer: script.defer,
      performanceMatch: resourceUrls.has(script.src),
    }));
    return {
      discovered: scripts.length,
      modules: scripts.filter((script) => script.module).length,
      async: scripts.filter((script) => script.async).length,
      defer: scripts.filter((script) => script.defer).length,
      performanceMatches: scripts.filter((script) => script.performanceMatch).length,
    };
  });
}

export async function measureViewportPage(page: Page, profile: ViewportProfile): Promise<ViewportMeasurement> {
  await page.setViewportSize({ width: profile.width, height: profile.height });
  await stabilizePage(page);
  await installAxe(page);
  const contrast = await axeSummary(page, ["color-contrast"]);
  const names = await axeSummary(page, ["button-name", "link-name", "label", "aria-input-field-name"]);
  return {
    profile,
    url: page.url(),
    contrast,
    names,
    keyboard: profile.name === "desktop" ? await measureKeyboard(page) : undefined,
    cwv: profile.name === "desktop" ? await collectLabCwv(page) : undefined,
    overflow: await measureOverflow(page),
    touch: await measureTouchTargets(page),
    cta: await measureCta(page),
    forms: await measureForms(page),
    imageLoading: await measureImageLoading(page),
    scriptLoading: await measureScriptLoading(page),
  };
}

export function deriveRenderedFindings(measurements: ViewportMeasurement[], pageCount: number) {
  const findings: Record<string, BrowserFinding> = {};
  const sumRule = (key: "contrast" | "names") => measurements.reduce((total, item) => ({ passed: total.passed + item[key].passed, failed: total.failed + item[key].failed, incomplete: total.incomplete + item[key].incomplete }), { passed: 0, failed: 0, incomplete: 0 });
  const contrast = sumRule("contrast");
  const names = sumRule("names");
  const viewports = [...new Set(measurements.map((item) => item.profile.name))];
  const expectedRuns = pageCount * VIEWPORT_PROFILES.length;
  const completeMatrix = measurements.length === expectedRuns && measurements.every(row=>row.resourcesComplete !== false)
    && measurements.every(row=>Boolean(row.url))
    && new Set(measurements.map(row=>row.url)).size === pageCount
    && new Set(measurements.map(row=>JSON.stringify([row.url,row.profile.name]))).size === expectedRuns;

  const ruleFinding = (metricId: string, summary: RuleSummary, label: string): BrowserFinding => {
    const tested = summary.passed + summary.failed;
    const discovered = tested + summary.incomplete;
    const complete = completeMatrix && discovered > 0 && tested / discovered >= 0.95;
    return {
      status: tested === 0 ? "N/A" : summary.failed === 0 ? "Pass" : summary.failed / tested <= 0.05 ? "Partial" : "Fail",
      note: `${label} tested ${tested} nodes across ${measurements.length} viewport runs; ${summary.failed} failed and ${summary.incomplete} were inconclusive.`,
      evidence: makeEvidence(metricId, tested, discovered, complete, { viewports, reasonCode: complete ? "coverage-complete" : "coverage-incomplete", observed: { failed: summary.failed, incomplete: summary.incomplete } }),
    };
  };
  findings.u33 = ruleFinding("color-contrast", contrast, "WCAG contrast measurement");
  findings.u37 = ruleFinding("accessible-name", names, "Accessible-name measurement");
  const elements = new Map<string, NonNullable<MeasurementEvidence['elements']>[number]>();
  for (const measurement of measurements) {
    if (!measurement.url) continue;
    for (const failure of measurement.names.failures ?? []) {
      const key = JSON.stringify([measurement.url, failure.rule, failure.target]);
      const row = elements.get(key) ?? {url: measurement.url, ...failure, viewports: []};
      if (!row.viewports.includes(measurement.profile.name)) row.viewports.push(measurement.profile.name);
      elements.set(key, row);
    }
  }
  if (measurements.every(row => row.url && row.names.failures)) {
    findings.u37.evidence.elements = [...elements.values()];
    findings.u37.evidence.observed = {...findings.u37.evidence.observed, uniquePageElements: elements.size, sampledPages: pageCount};
    findings.u37.note += ` ${elements.size} distinct page/rule/selector combinations; viewport repetitions are not separate issues. Browser scope is ${pageCount} sampled pages, not the full site.`;
  }
  // Contrast failures keep their CSS selectors too: "URL kanıtı oluşmadı" is a
  // product defect — a fixable contrast issue must name its targets (u37 pattern).
  if (measurements.every(row => row.url && row.contrast.failures)) {
    const contrastElements = new Map<string, NonNullable<MeasurementEvidence['elements']>[number]>();
    for (const measurement of measurements) {
      if (!measurement.url) continue;
      for (const failure of measurement.contrast.failures ?? []) {
        const key = JSON.stringify([measurement.url, failure.rule, failure.target]);
        const row = contrastElements.get(key) ?? {url: measurement.url, ...failure, viewports: []};
        if (!row.viewports.includes(measurement.profile.name)) row.viewports.push(measurement.profile.name);
        contrastElements.set(key, row);
      }
    }
    findings.u33.evidence.elements = [...contrastElements.values()];
  }

  const perUrlRows = (id: string, failedFor: (runs: ViewportMeasurement[]) => number, totalFor: (runs: ViewportMeasurement[]) => number) => {
    if (!findings[id]) return;
    findings[id].evidence.pageResults = [...new Set(measurements.flatMap((row) => (row.url ? [row.url] : [])))].map((url) => {
      const runs = measurements.filter((row) => row.url === url);
      const resources = runs.every((row) => row.resourcesComplete !== false);
      const failed = failedFor(runs);
      const total = totalFor(runs);
      return {
        url,
        status: (!resources ? "N/A" : total === 0 ? "N/A" : failed > 0 ? "Fail" : "Pass") as "N/A" | "Fail" | "Pass",
        value: `${failed}/${total}`,
        measurementState: (!resources ? "incomplete-resources" : "complete") as "incomplete-resources" | "complete",
      };
    });
  };
  const mobileRuns = (runs: ViewportMeasurement[]) => runs.filter((row) => row.profile.name === "mobile-320" || row.profile.name === "mobile-390");
  perUrlRows("t46", (runs) => mobileRuns(runs).filter((row) => row.overflow.pixels > 2 && row.overflow.offenders > 0).length, (runs) => mobileRuns(runs).length);
  perUrlRows("t47", (runs) => runs.filter((row) => row.profile.isMobile).reduce((sum, row) => sum + row.touch.failed, 0), (runs) => runs.filter((row) => row.profile.isMobile).reduce((sum, row) => sum + row.touch.tested, 0));
  perUrlRows("c1", (runs) => runs.filter((row) => !row.cta.clear || !row.cta.aboveFold).length, (runs) => runs.length);
  perUrlRows("u35", (runs) => (runs.some((row) => row.keyboard?.trapDetected) ? 1 : 0), () => 1);
  perUrlRows("u36", (runs) => runs.reduce((sum, row) => sum + Math.max(0, (row.keyboard?.reached ?? 0) - (row.keyboard?.focusVisible ?? 0)), 0), (runs) => runs.reduce((sum, row) => sum + (row.keyboard?.reached ?? 0), 0));
  perUrlRows("u39", (runs) => runs.filter((row) => row.profile.name === "mobile-390").reduce((sum, row) => sum + Math.max(0, row.forms.mobileApplicable - row.forms.mobileCorrect), 0), (runs) => runs.filter((row) => row.profile.name === "mobile-390").reduce((sum, row) => sum + row.forms.mobileApplicable, 0));

  for (const [id, key] of [['u33', 'contrast'], ['u37', 'names']] as const) {
    findings[id].evidence.pageResults = [...new Set(measurements.flatMap(row=>row.url ? [row.url] : []))].map(url=>{
      const runs = measurements.filter(row=>row.url===url);
      const resources = runs.every(row=>row.resourcesComplete !== false);
      const coverage = runs.length === VIEWPORT_PROFILES.length && VIEWPORT_PROFILES.every(profile=>runs.filter(row=>row.profile.name===profile.name).length===1) && runs.every(row=>row[key].incomplete===0 && row[key].passed+row[key].failed>0);
      return {url, status: !resources || !coverage ? 'N/A' : runs.some(row=>row[key].failed>0) ? 'Fail' : 'Pass', measurementState: !resources ? 'incomplete-resources' : !coverage ? 'incomplete-coverage' : 'complete'};
    });
  }

  const keyboards = measurements.flatMap((item) => item.keyboard ? [item.keyboard] : []);
  const keyboard = keyboards.reduce((total, item) => ({ discovered: total.discovered + item.discovered, reached: total.reached + item.reached, focusVisible: total.focusVisible + item.focusVisible, trapDetected: total.trapDetected || item.trapDetected }), { discovered: 0, reached: 0, focusVisible: 0, trapDetected: false });
  const keyboardCoverage = keyboard.discovered ? keyboard.reached / keyboard.discovered : 0;
  findings.u35 = { status: !keyboard.discovered ? "N/A" : !keyboard.trapDetected && keyboardCoverage >= 0.95 ? "Pass" : keyboardCoverage >= 0.8 ? "Partial" : "Fail", note: `Tab traversal reached ${keyboard.reached}/${keyboard.discovered} visible controls; keyboard trap detected: ${keyboard.trapDetected ? "yes" : "no"}.`, evidence: makeEvidence("keyboard-reachability", keyboard.reached, keyboard.discovered, keyboards.length === pageCount && keyboardCoverage >= 0.95 && !keyboard.trapDetected, { viewports: ["desktop"], observed: { trapDetected: keyboard.trapDetected } }) };
  const focusRate = keyboard.reached ? keyboard.focusVisible / keyboard.reached : 0;
  findings.u36 = { status: !keyboard.reached ? "N/A" : focusRate >= 0.95 ? "Pass" : focusRate >= 0.8 ? "Partial" : "Fail", note: `${keyboard.focusVisible}/${keyboard.reached} keyboard-reached controls exposed a visible computed focus change.`, evidence: makeEvidence("focus-visible", keyboard.reached, keyboard.reached, keyboards.length === pageCount && keyboard.reached >= Math.min(5, keyboard.discovered), { viewports: ["desktop"], observed: { visible: keyboard.focusVisible } }) };

  const mobile = measurements.filter((item) => item.profile.name === "mobile-320" || item.profile.name === "mobile-390");
  const overflowFailures = mobile.filter((item) => item.overflow.pixels > 2 && item.overflow.offenders > 0);
  findings.t46 = { status: !mobile.length ? "N/A" : !overflowFailures.length ? "Pass" : overflowFailures.length / mobile.length <= 0.1 ? "Partial" : "Fail", note: `Unexplained horizontal overflow appeared in ${overflowFailures.length}/${mobile.length} required mobile runs; maximum ${Math.max(0, ...mobile.map((item) => item.overflow.pixels))}px.`, evidence: makeEvidence("mobile-horizontal-overflow", mobile.length, pageCount * 2, mobile.length === pageCount * 2, { viewports: ["mobile-320", "mobile-390"], observed: { failedRuns: overflowFailures.length } }) };

  const touch = measurements.filter((item) => item.profile.isMobile).reduce((total, item) => ({ tested: total.tested + item.touch.tested, failed: total.failed + item.touch.failed }), { tested: 0, failed: 0 });
  const touchFailRate = touch.tested ? touch.failed / touch.tested : 0;
  findings.t47 = { status: !touch.tested ? "N/A" : !touch.failed ? "Pass" : touchFailRate <= 0.05 ? "Partial" : "Fail", note: `${touch.failed}/${touch.tested} visible mobile/tablet targets were smaller than 48×48px after inline-text-link exceptions.`, evidence: makeEvidence("touch-target-size", touch.tested, touch.tested, completeMatrix && touch.tested > 0, { viewports: viewports.filter((name) => name !== "desktop"), threshold: "48x48 CSS pixels", observed: { failed: touch.failed } }) };

  const imageLoading = measurements.reduce((total, item) => ({
    discovered: total.discovered + item.imageLoading.discovered,
    lazy: total.lazy + item.imageLoading.lazy,
    visible: total.visible + item.imageLoading.visible,
    lazyVisible: total.lazyVisible + item.imageLoading.lazyVisible,
    performanceMatches: total.performanceMatches + item.imageLoading.performanceMatches,
    lazyPerformanceMatches: total.lazyPerformanceMatches + item.imageLoading.lazyPerformanceMatches,
  }), { discovered: 0, lazy: 0, visible: 0, lazyVisible: 0, performanceMatches: 0, lazyPerformanceMatches: 0 });
  const imageRows = [...new Set(measurements.flatMap((item) => item.url ? [item.url] : []))].map((url) => {
    const runs = measurements.filter((item) => item.url === url);
    const values = runs.map((item) => `${item.profile.name}: ${item.imageLoading.lazy}/${item.imageLoading.discovered} lazy; ${item.imageLoading.lazyVisible}/${item.imageLoading.visible} lazy visible; ${item.imageLoading.lazyPerformanceMatches}/${item.imageLoading.lazy} lazy matched a performance resource`).join("\n");
    return { url, status: "N/A" as const, value: values || "No completed viewport observation." };
  });
  findings.t22 = {
    status: "N/A",
    note: `${imageLoading.lazy}/${imageLoading.discovered} rendered image observations declared lazy loading across ${measurements.length} viewport runs. ${imageLoading.lazyVisible}/${imageLoading.visible} visible image observations were lazy, and ${imageLoading.lazyPerformanceMatches}/${imageLoading.lazy} lazy observations matched a browser performance resource at measurement time. This records sampled viewport position and resource evidence only; it does not judge loading suitability, decode timing, priority, bytes, LCP or CLS.`,
    evidence: makeEvidence("image-loading-viewport-observation", imageLoading.discovered, imageLoading.discovered, completeMatrix && imageLoading.discovered > 0, { viewports, pageResults: imageRows, observed: { lazy: imageLoading.lazy, visible: imageLoading.visible, lazyVisible: imageLoading.lazyVisible, performanceMatches: imageLoading.performanceMatches, lazyPerformanceMatches: imageLoading.lazyPerformanceMatches }, scoreEligible: false }),
  };

  const scriptLoading = measurements.reduce((total, item) => ({
    discovered: total.discovered + item.scriptLoading.discovered,
    modules: total.modules + item.scriptLoading.modules,
    async: total.async + item.scriptLoading.async,
    defer: total.defer + item.scriptLoading.defer,
    performanceMatches: total.performanceMatches + item.scriptLoading.performanceMatches,
  }), { discovered: 0, modules: 0, async: 0, defer: 0, performanceMatches: 0 });
  const scriptRows = [...new Set(measurements.flatMap((item) => item.url ? [item.url] : []))].map((url) => {
    const runs = measurements.filter((item) => item.url === url);
    return { url, status: "N/A" as const, value: runs.map((item) => `${item.profile.name}: ${item.scriptLoading.discovered} external scripts; module ${item.scriptLoading.modules}; async ${item.scriptLoading.async}; defer ${item.scriptLoading.defer}; ${item.scriptLoading.performanceMatches}/${item.scriptLoading.discovered} matched a performance resource`).join("\n") || "No completed viewport observation." };
  });
  findings.t26 = {
    status: "N/A",
    note: `${scriptLoading.discovered} rendered external-script observations across ${measurements.length} viewport runs: ${scriptLoading.modules} module, ${scriptLoading.async} async and ${scriptLoading.defer} defer declarations; ${scriptLoading.performanceMatches} matched a browser performance resource at measurement time. This records sampled document declarations and resource evidence only; it does not establish execution order, successful evaluation, network timing, parser blocking or performance impact.`,
    evidence: makeEvidence("script-loading-viewport-observation", scriptLoading.discovered, scriptLoading.discovered, completeMatrix && scriptLoading.discovered > 0, { viewports, pageResults: scriptRows, observed: scriptLoading, scoreEligible: false }),
  };

  // P1-P3 plan C1: lab Core Web Vitals as observations. t15/t16/t17 are FIELD
  // claims (CrUX / Search Console); a stabilized local run is not field data and
  // the automated pass performs no interactions, so INP stays unmeasured.
  const cwvSamples = measurements.map((item) => item.cwv).filter((value): value is { lcpMs: number | null; cls: number | null } => Boolean(value));
  const lcpValues = cwvSamples.map((sample) => sample.lcpMs).filter((value): value is number => typeof value === "number");
  const clsValues = cwvSamples.map((sample) => sample.cls).filter((value): value is number => typeof value === "number");
  const median = (values: number[]) => (values.length ? [...values].sort((a, b) => a - b)[Math.floor(values.length / 2)] : null);
  const labLcp = median(lcpValues);
  const labCls = median(clsValues);
  findings.t15 = {
    status: "N/A",
    note: `Lab LCP median ${labLcp ?? "—"} ms across ${lcpValues.length} rendered samples (local Chromium after load stabilization with reduced motion and suppressed animations). t15 is a field Core Web Vitals claim (CrUX / Search Console) and remains unmeasured; lab values are observations only.`,
    evidence: makeEvidence("lab-lcp-observation", lcpValues.length, pageCount, completeMatrix && lcpValues.length === pageCount, { viewports, scoreEligible: false, reasonCode: "lab-proxy-not-field", observed: { labLcpMedianMs: labLcp ?? -1, samples: lcpValues.length } }),
  };
  findings.t17 = {
    status: "N/A",
    note: `Lab CLS median ${labCls ?? "—"} across ${clsValues.length} rendered samples (no user input; animated shifts are suppressed by the stabilization pass). t17 is a field Core Web Vitals claim (CrUX / Search Console) and remains unmeasured; lab values are observations only.`,
    evidence: makeEvidence("lab-cls-observation", clsValues.length, pageCount, completeMatrix && clsValues.length === pageCount, { viewports, scoreEligible: false, reasonCode: "lab-proxy-not-field", observed: { labClsMedian: labCls ?? -1, samples: clsValues.length } }),
  };
  findings.t16 = {
    status: "N/A",
    note: "The automated browser pass performs no interactions, so Interaction to Next Paint cannot be measured even in lab. t16 remains a field claim (CrUX / Search Console) and is unmeasured.",
    evidence: makeEvidence("lab-inp-observation", 0, pageCount, false, { viewports, scoreEligible: false, reasonCode: "lab-proxy-not-field", observed: { interactions: 0 } }),
  };

  const clearCta = measurements.filter((item) => item.cta.clear);
  const aboveFold = clearCta.filter((item) => item.cta.aboveFold);
  const ctaCoverage = measurements.length ? clearCta.length / measurements.length : 0;
  findings.c1 = { status: !measurements.length ? "N/A" : !clearCta.length ? "Fail" : aboveFold.length === clearCta.length ? "Pass" : aboveFold.length ? "Partial" : "Fail", note: `A high-confidence primary CTA was found in ${clearCta.length}/${measurements.length} viewport runs; ${aboveFold.length} were at least 50% above the fold.`, evidence: makeEvidence("primary-cta-visibility", measurements.length, measurements.length, completeMatrix && ctaCoverage >= 0.8, { viewports, threshold: "confidence >= 0.70; lead >= 0.15; visibility >= 90%", observed: { clear: clearCta.length, aboveFold: aboveFold.length } }) };
  findings.c7 = { ...findings.c1, evidence: { ...findings.c1.evidence, scoreEligible: false, metricId: "primary-cta-visibility", reasonCode: "duplicate-metric-diagnostic" } };

  const desktopForms = measurements.filter((item) => item.profile.name === "desktop").map((item) => item.forms);
  const forms = desktopForms.reduce((total, item) => ({ fields: total.fields + item.fields, autocomplete: total.autocomplete + item.autocomplete, leadForms: total.leadForms + item.leadForms, largestLeadForm: Math.max(total.largestLeadForm, item.largestLeadForm), mobileApplicable: total.mobileApplicable + item.mobileApplicable, mobileCorrect: total.mobileCorrect + item.mobileCorrect }), { fields: 0, autocomplete: 0, leadForms: 0, largestLeadForm: 0, mobileApplicable: 0, mobileCorrect: 0 });
  const formRows = measurements.filter(item=>item.profile.name==='desktop' && item.url).map(item=>({url:item.url!,status:'N/A' as const,value:item.forms.details ? item.forms.details.map(form=>`Form ${form.index}: ${form.fields} fields; ${form.required} required declarations; ${form.autocomplete} autocomplete declarations`).join('\n') || 'No form elements recorded.' : 'Per-form details unavailable; rerun this older measurement.'}));
  const autocompleteRate = forms.fields ? forms.autocomplete / forms.fields : 0;
  const c19Rows = measurements.filter(item=>item.profile.name==='desktop' && item.url).map(item=>{
    const rate = item.forms.fields ? item.forms.autocomplete / item.forms.fields : 0;
    return {url:item.url!,status:(!item.forms.fields ? 'N/A' : rate >= 0.8 ? 'Pass' : rate >= 0.5 ? 'Partial' : 'Fail') as 'N/A'|'Pass'|'Partial'|'Fail',value:item.forms.details ? item.forms.details.map(form=>`Form ${form.index}: ${form.fields} fields; ${form.required} required declarations; ${form.autocomplete} autocomplete declarations`).join('\n') || 'No form elements recorded.' : 'Per-form details unavailable; rerun this older measurement.'};
  });
  findings.c19 = { status: !forms.fields ? 'N/A' : autocompleteRate >= 0.8 ? 'Pass' : autocompleteRate >= 0.5 ? 'Partial' : 'Fail', note: `${forms.autocomplete}/${forms.fields} rendered form fields declare an autocomplete attribute. This is a bounded form-assistance signal; token correctness and actual autofill remain outside the check.`, evidence: makeEvidence("form-autocomplete-declarations", forms.fields, forms.fields, desktopForms.length === pageCount && forms.fields > 0, { viewports: ["desktop"],pageResults:c19Rows,threshold:'80% declaration coverage', observed: { autocomplete: forms.autocomplete, fields: forms.fields } }) };
  findings.c17 = { status: !desktopForms.length ? 'N/A' : !forms.leadForms ? forms.fields ? 'Partial' : 'Fail' : forms.largestLeadForm <= 8 ? 'Pass' : forms.largestLeadForm <= 12 ? 'Partial' : 'Fail', note: `${forms.leadForms} lead-form candidates were found; the largest contains ${forms.largestLeadForm} fields. This measures path presence and field load, not conversion performance or business necessity.`, evidence: makeEvidence("lead-form-readiness", desktopForms.length, pageCount, desktopForms.length === pageCount, { viewports: ["desktop"],pageResults:formRows,threshold:'lead path present; <=8 fields pass, 9-12 partial', observed: { leadForms: forms.leadForms, largestLeadForm: forms.largestLeadForm, fields: forms.fields } }) };
  const mobileForms = measurements.filter((item) => item.profile.name === "mobile-390").map((item) => item.forms);
  const applicable = mobileForms.reduce((sum, item) => sum + item.mobileApplicable, 0);
  const correct = mobileForms.reduce((sum, item) => sum + item.mobileCorrect, 0);
  findings.u39 = { status: !applicable ? "N/A" : correct === applicable ? "Pass" : correct / applicable >= 0.9 ? "Partial" : "Fail", note: `${correct}/${applicable} classifiable mobile form fields use an appropriate input type or inputmode.`, evidence: makeEvidence("mobile-form-input", applicable, applicable, mobileForms.length === pageCount && applicable > 0, { viewports: ["mobile-390"], observed: { correct, applicable } }) };
  // Rendered aggregates stay withheld under incomplete evidence in EITHER
  // direction: unlike crawler observations, an unstyled or script-blocked page
  // can produce FALSE failures (missing CSS inflates touch-target and contrast
  // failures; blocked JS can hide the CTA entirely). "partial resources must
  // never unlock aggregate score" and "incomplete render cannot publish an
  // aggregate result" are deliberate contract pins (rendered-measurements and
  // site-api-matrix tests).
  return Object.fromEntries(Object.entries(findings).map(([id, finding]) => [id, applyMeasurementPolicy(id, finding)]));
}

export async function measureRenderedPages(urls: string[]) {
  const browser = await chromium.launch({ headless: true });
  const configuredLimit = Number(process.env.AUDITPRO_RENDERED_PAGE_LIMIT ?? 5);
  const renderedPageLimit = Number.isFinite(configuredLimit) ? Math.max(1, Math.min(Math.floor(configuredLimit), 250)) : 5;
  const targets = selectBrowserSample(urls, renderedPageLimit);
  const pageCoverage: BrowserPageCoverage[] = targets.map(url=>({url,completedViewports:[],failedViewports:[]}));
  const measurements: ViewportMeasurement[] = [];
  const warnings: string[] = [];
  const successfulPages = new Set<string>();
  const schemaNotes: string[] = [];
  let incompleteResources = false;
  try {
    for (const profile of VIEWPORT_PROFILES) {
      const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, isMobile: profile.isMobile, hasTouch: profile.isMobile, locale: "en-US", timezoneId: "UTC", deviceScaleFactor: 1, serviceWorkers: "block", userAgent: "Povlex/1.0 rendered website audit" });
      const network = await configureAuditBrowser(context);
      const profileMeasurements: ViewportMeasurement[] = [];
      for (const url of targets) {
        const page = await context.newPage();
        let measurement: ViewportMeasurement | undefined;
        try {
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
          measurement = await measureViewportPage(page, profile);
          measurements.push(measurement);
          profileMeasurements.push(measurement);
          successfulPages.add(url);
          pageCoverage.find(row=>row.url===url)!.completedViewports.push(profile.name);
          if (profile.name === 'desktop') {
            const content = await page.evaluate(() => ({ text: document.body?.innerText ?? '', blocks: [...document.querySelectorAll('script[type="application/ld+json"]')].map(node => node.textContent ?? '') }));
            if (content.blocks.length) schemaNotes.push(url + ': ' + compareSchemaText(content.blocks, content.text).note);
          }
        } catch (error) {
          const coverage=pageCoverage.find(row=>row.url===url)!;
          if (!coverage.completedViewports.includes(profile.name)) coverage.failedViewports.push(profile.name);
          warnings.push(`Rendered ${profile.name} measurement skipped ${url}: ${error instanceof Error ? error.message : "browser error"}`);
        } finally {
          await page.close();
          if (measurement) measurement.resourcesComplete = network.blockingIssuesForPage(page).length === 0;
          const coverage = pageCoverage.find(row=>row.url===url)!;
          coverage.resourceIssues ??= [];
          coverage.resourceIssues.push(...network.issuesForPage(page).map(issue=>({...issue,viewport:profile.name})));
        }
      }
      incompleteResources ||= network.incomplete;
      if (network.unattributedFailure) for (const measurement of profileMeasurements) measurement.resourcesComplete = false;
      await context.close();
    }
  } finally {
    await browser.close();
  }
  const findings = deriveRenderedFindings(measurements, targets.length);
  if (incompleteResources) {
    warnings.push('Some browser resources were unavailable or blocked; rendered measurements are diagnostic only.');
    for (const finding of Object.values(findings)) { finding.evidence.scoreEligible = false; finding.evidence.reasonCode = 'incomplete-browser-resources'; }
    schemaNotes.push('Resource loading was incomplete; visible-content comparisons require review.');
  }
  return { findings, schemaNotes, warnings, pagesMeasured: successfulPages.size, viewportRuns: measurements.length, pageCoverage };
}
