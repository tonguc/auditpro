import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { AUDIT_CATEGORIES, RETIRED_AUDIT_IDS, calculateScore, getTopIssues } from "../lib/audit-model";
import { LOCALES, getTranslator } from "../lib/ui-i18n";

const app = readFileSync(join(process.cwd(), "app", "audit-app.tsx"), "utf8");
const auditModel = readFileSync(join(process.cwd(), "lib", "audit-model.ts"), "utf8");
const testPlan = readFileSync(join(process.cwd(), "TEST_PLAN.md"), "utf8");

assert.equal(AUDIT_CATEGORIES[0]?.id, "serp", "GEO must be the first audit pillar");
assert.equal(AUDIT_CATEGORIES[0]?.label, "GEO & AI Visibility");
assert.equal(AUDIT_CATEGORIES[0]?.sections[0]?.label, "Search Demand & SERP Baseline");
assert.ok(
  AUDIT_CATEGORIES[0]?.sections.some((section) => section.id === "geo" && section.label === "GEO - AI Visibility"),
  "GEO section must stay explicit inside the AI visibility pillar",
);
assert.ok(
  auditModel.includes("export const AUDIT_CATEGORIES = [aiSerp, technicalSEO, onPage, uxHeuristics, cro].map("),
  "GEO category order must be deliberate in the model source",
);

assert.equal(getTranslator("en")("aiReadiness"), "GEO & AI Visibility");
assert.equal(getTranslator("tr")("aiReadiness"), "GEO ve AI Görünürlüğü");
for (const locale of LOCALES) {
  const label = getTranslator(locale)("aiReadiness");
  assert.match(label, /GEO/, `${locale} aiReadiness must keep GEO visible`);
  if (locale !== "en") {
    assert.notEqual(label, getTranslator("en")("aiReadiness"), `${locale} aiReadiness must not fall back to English`);
  }
}
assert.match(getTranslator("en")("measurementMethodDetail"), /GEO and AI visibility/);
assert.match(getTranslator("tr")("measurementMethodDetail"), /GEO ve AI görünürlüğü/);

assert.match(app, /GEO audit suite/);
assert.match(app, /strengthen GEO and AI-search visibility/);
assert.match(testPlan, /GEO & AI Visibility is the first audit pillar/);

console.log("GEO positioning fixtures passed.");

// Obsolete records must not reappear in checklists, scores or recommendations.
const activeIds = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items.map(i => i.id)));
for (const id of RETIRED_AUDIT_IDS) assert.ok(!activeIds.includes(id), id);
const { MEASUREMENT_CONTRACT_VERSION } = require('../lib/measurement-contract');
const oldResults = Object.fromEntries(RETIRED_AUDIT_IDS.map(id => [id, 'Fail']));
const oldEvidence = Object.fromEntries(RETIRED_AUDIT_IDS.map(id => [id, { scoreEligible: true, source: "crawler", contractVersion: MEASUREMENT_CONTRACT_VERSION }]));
assert.equal(calculateScore(oldResults, oldEvidence).totalEvaluated, 0);
assert.deepEqual(getTopIssues(oldResults), []);
const validEvidence = { o1: { scoreEligible: true, source: "crawler", contractVersion: MEASUREMENT_CONTRACT_VERSION } };
assert.equal(calculateScore({ ...oldResults, o1: 'Pass' }, { ...oldEvidence, ...validEvidence }).categories.find(c => c.id === 'onpage')?.score, 100);
assert.equal(calculateScore({ o1: 'Pass' }, { o1: { scoreEligible: true, source: "crawler", contractVersion: '0.2.0' } }).totalEvaluated, 0);

// Every active finding and section must have explicit Turkish display text.
const { TR_AUDIT_TITLES, TR_SECTIONS } = require('../lib/audit-copy-tr');
for (const category of AUDIT_CATEGORIES) for (const section of category.sections) {
 assert.ok(TR_SECTIONS[section.id], 'Missing Turkish section: ' + section.id);
 for (const item of section.items) assert.ok(TR_AUDIT_TITLES[item.id] && TR_AUDIT_TITLES[item.id] !== item.item, 'Missing Turkish finding: ' + item.id);
}
assert.equal(getTranslator('tr')('priorityCritical'), 'Kritik');
assert.equal(getTranslator('tr').locale, 'tr');
