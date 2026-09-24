import assert from "node:assert/strict";

import type { Finding } from "../lib/html-measurements";
import { buildOnlineScorecards, type OnlineScorecards } from "../lib/online-score";
import { LEGACY_CATEGORY_WEIGHTS, ONLINE_PILLAR_WEIGHTS, ONLINE_WEIGHTS_SUM } from "../lib/scoring-weights";

function finding(status: Finding["status"], url = "https://example.test/"): Finding {
  return {
    status,
    note: `${status} fixture`,
    evidence: {
      scoreEligible: true,
      pageResults: [{ url, status, value: status }],
      scope: { tested: 1, discovered: 1, complete: true },
    },
  } as Finding;
}

const findings: Record<string, Finding> = {
  t56: finding("Pass"),
  t28: finding("Pass"),
  o1: finding("Fail"),
  o4: finding("Pass"),
  o5: finding("Pass"),
  o8: finding("Pass"),
  t4: {
    ...finding("Pass"),
    evidence: { ...finding("Pass").evidence, indexingDetails: [{ url: "https://example.test/", bot: "googlebot", noindex: false, declarations: [] }] },
  } as Finding,
  t5: {
    ...finding("Pass"),
    evidence: { ...finding("Pass").evidence, canonicalDetails: [{ url: "https://example.test/", state: "review" }] },
  } as unknown as Finding,
  t46: finding("Pass"),
  t9: finding("Pass"),
  t45: finding("Pass"),
  t47: finding("Pass"),
  u33: finding("Pass"),
  u37: finding("Pass"),
  u35: finding("Pass"),
  u36: finding("Pass"),
  u39: finding("Pass"),
  c1: finding("Pass"),
  c17: finding("Pass"),
  c19: finding("Pass"),
  c26: finding("Pass"),
};

const baseInput = {
  findings,
  sitemapDiscovery: {
    maps: [{ url: "https://example.test/sitemap.xml", state: "parsed", entries: 1 }],
    pages: ["https://example.test/"],
  } as unknown as Parameters<typeof buildOnlineScorecards>[0]["sitemapDiscovery"],
  robotsDetails: [
    { bot: "googlebot", url: "https://example.test/", allowed: true },
    { bot: "oai-searchbot", url: "https://example.test/", allowed: true },
    { bot: "perplexitybot", url: "https://example.test/", allowed: true },
    { bot: "claudebot", url: "https://example.test/", allowed: true },
  ] as Parameters<typeof buildOnlineScorecards>[0]["robotsDetails"],
  contentDetails: [{ url: "https://example.test/", headings: [{ level: 1, text: "Example" }, { level: 2, text: "Answer" }], images: [{ src: "https://example.test/hero.png", alt: "Hero" }] }] as Parameters<typeof buildOnlineScorecards>[0]["contentDetails"],
  schemaDetails: [{ url: "https://example.test/", blocks: [{ state: "parsed", types: ["Organization"] }] }] as Parameters<typeof buildOnlineScorecards>[0]["schemaDetails"],
  languageDetails: [{ url: "https://example.test/", lang: "en" }] as Parameters<typeof buildOnlineScorecards>[0]["languageDetails"],
};

const scorecards = buildOnlineScorecards(baseInput);

function check(card: NonNullable<NonNullable<OnlineScorecards["pillars"]>[keyof NonNullable<OnlineScorecards["pillars"]>]>, id: string) {
  const found = card.checks.find((item) => item.id === id);
  assert.ok(found, `expected check ${id}`);
  return found;
}

// ─── Single weight set (.28 / .24 / .18 / .12 / .18) ─────────────────────────
assert.equal(ONLINE_WEIGHTS_SUM, 1, "pillar weights must sum to exactly 1");
assert.deepEqual(
  { ...ONLINE_PILLAR_WEIGHTS },
  { technical: 0.28, content: 0.24, ux: 0.18, cro: 0.12, geo: 0.18 },
  "the published weight set is the single source of truth",
);
assert.equal(LEGACY_CATEGORY_WEIGHTS.onpage, ONLINE_PILLAR_WEIGHTS.content);
assert.equal(LEGACY_CATEGORY_WEIGHTS.serp, ONLINE_PILLAR_WEIGHTS.geo);
assert.equal(LEGACY_CATEGORY_WEIGHTS.technical, ONLINE_PILLAR_WEIGHTS.technical);
assert.equal(LEGACY_CATEGORY_WEIGHTS.ux, ONLINE_PILLAR_WEIGHTS.ux);
assert.equal(LEGACY_CATEGORY_WEIGHTS.cro, ONLINE_PILLAR_WEIGHTS.cro);

// ─── Card shape and measured/observation split ───────────────────────────────
assert.equal(scorecards.version, "2.0.0");
assert.equal(scorecards.seo.totalChecks, 12);
assert.equal(scorecards.geo.totalChecks, 8);
// Only calibrated controls are scored: the three derived SEO checks (index, canonical,
// sitemap) sit outside the calibrated inventory and are published as observations.
assert.equal(scorecards.seo.coveragePct, 72, "three uncalibrated derived checks must leave the score");
assert.equal(scorecards.seo.measuredChecks, 9);
assert.equal(scorecards.seo.observationChecks, 3);
assert.equal(scorecards.seo.score, 86, "one failed 10-point title check inside a 72-point measured core");
assert.equal(scorecards.seo.status, "Preliminary");

// GEO readiness is unscored until its methods are calibrated one by one.
assert.equal(scorecards.geo.score, null, "GEO readiness must stay unscored before calibration");
assert.equal(scorecards.geo.coveragePct, 0);
assert.equal(scorecards.geo.observationChecks, 8);
assert.match(scorecards.scope, /does not measure rankings/i);
assert.match(scorecards.scope, /live AI-engine citations/i, "live AI visibility must never enter this scope");

assert.equal(scorecards.pillars?.technical.totalChecks, 9);
assert.equal(scorecards.pillars?.content.totalChecks, 8);
assert.equal(scorecards.pillars?.ux.totalChecks, 8);
assert.equal(scorecards.pillars?.cro.totalChecks, 5);
assert.equal(scorecards.pillars?.technical.coveragePct, 45, "technical relies on four calibrated controls only");
assert.equal(scorecards.pillars?.technical.score, null, "45% coverage is below the 50% publication floor");
assert.equal(scorecards.pillars?.content.score, 70);
assert.equal(scorecards.pillars?.ux.score, 100);
assert.equal(scorecards.pillars?.cro.score, 100);

// ─── Overall: coverage never blends into the score ───────────────────────────
assert.equal(scorecards.overall?.totalChecks, 38);
assert.equal(scorecards.overall?.coveragePct, 55);
assert.equal(
  scorecards.overall?.score,
  87,
  "raw weighted score stays 87; 55% coverage may withhold it but must never pull it toward 50",
);
assert.equal(scorecards.overall?.status, "Preliminary");
assert.equal(scorecards.overall?.measuredChecks, 21);
assert.equal(scorecards.overall?.observations, 17, "every uncalibrated control stays visible as an observation");
assert.equal(scorecards.overall?.errors, 1, "the failed title contributes once to the five-pillar overall issue count");
assert.equal(scorecards.overall?.warnings, 0);
assert.equal(scorecards.overall?.notices, 0, "complete scope fixtures are measurable, not unavailable");

// ─── Measurement contract carried by every check ─────────────────────────────
for (const card of [scorecards.seo, scorecards.geo, ...(Object.values(scorecards.pillars ?? {}))]) {
  for (const item of card.checks) {
    assert.ok(Array.isArray(item.sourceControlIds) && item.sourceControlIds.length > 0, `${item.id} must declare sourceControlIds`);
    assert.ok(typeof item.methodVersion === "string" && item.methodVersion.length > 0, `${item.id} must declare methodVersion`);
    assert.equal(item.scoreEligible, item.status !== "Observation" && item.status !== "Unavailable", `${item.id} scoreEligible must match its status`);
    assert.ok(typeof item.confidence === "string", `${item.id} must declare confidence`);
    assert.ok(typeof item.reasonCode === "string", `${item.id} must declare reasonCode`);
  }
}
const httpCheck = check(scorecards.pillars!.technical, "technical-http");
assert.deepEqual(httpCheck.sourceControlIds, ["t56"]);
assert.deepEqual(httpCheck.scope, { tested: 1, discovered: 1, complete: true });
const indexCheck = check(scorecards.seo, "seo-index");
assert.deepEqual(indexCheck.sourceControlIds, ["t4"], "uncalibrated source ids stay declared so calibration reopens the gate");
assert.equal(indexCheck.status, "Observation", "an evidence-eligible backing finding does not bypass the calibration gate");
assert.equal(indexCheck.scoreEligible, false);
assert.equal(indexCheck.reasonCode, "method-not-calibrated");

assert.deepEqual(scorecards.seo.checks.find((item) => item.id === "seo-title")?.affectedUrls, ["https://example.test/"]);
assert.match(scorecards.seo.checks.find((item) => item.id === "seo-title")?.actionTr ?? "", /başlık/i);

// ─── Unavailable, not Fail: an empty input invents nothing ───────────────────
const unavailable = buildOnlineScorecards({
  findings: {},
  sitemapDiscovery: { maps: [], pages: [], pageLimitReached: false } as Parameters<typeof buildOnlineScorecards>[0]["sitemapDiscovery"],
  robotsDetails: [],
  contentDetails: [],
  schemaDetails: [],
  languageDetails: [],
});
assert.ok(unavailable.seo.coveragePct < 50);
assert.equal(unavailable.seo.status, "Insufficient");
assert.ok(unavailable.seo.checks.some((item) => item.status === "Unavailable"));
assert.equal(unavailable.overall?.measuredChecks, 0, "an empty input must not invent sitemap or schema verdicts");
assert.equal(unavailable.overall?.score, null);
assert.equal(unavailable.overall?.errors, 0);

// ─── Regression: scoreEligible === false is an observation, never an issue ───
const ineligibleTitle = buildOnlineScorecards({
  ...baseInput,
  findings: {
    ...findings,
    o1: {
      ...finding("Fail"),
      evidence: { ...finding("Fail").evidence, scoreEligible: false, reasonCode: "method-not-calibrated" },
    },
  },
});
const demoted = check(ineligibleTitle.pillars!.content, "content-title");
assert.equal(demoted.status, "Observation");
assert.equal(demoted.observedStatus, "Fail", "the raw verdict stays visible for diagnostics");
assert.equal(demoted.scoreEligible, false);
assert.equal(ineligibleTitle.pillars!.content.observationChecks, 5);
assert.equal(ineligibleTitle.pillars!.content.score, null, "a diagnostic can never be counted as measured coverage");
assert.equal(ineligibleTitle.overall?.errors, 0, "demoted findings must not read as issues");

// ─── Regression: incomplete scope blocks Pass, but never hides an observed fail
function technicalHttp(status: Finding["status"], complete: boolean) {
  const cards = buildOnlineScorecards({
    ...baseInput,
    findings: {
      ...findings,
      t56: { ...finding(status), evidence: { ...finding(status).evidence, scope: { tested: 1, discovered: 2, complete } } },
    },
  });
  return check(cards.pillars!.technical, "technical-http");
}
assert.equal(technicalHttp("Pass", false).status, "Unavailable", "a pass may not be published while pages are unmeasured");
assert.equal(technicalHttp("Partial", false).status, "Unavailable");
assert.equal(technicalHttp("Fail", false).status, "Fail", "an observed failure stays publishable with incomplete scope");
assert.equal(technicalHttp("Pass", true).status, "Pass");

// ─── Regression: retired rule o10 — "exactly one H1" is not a scoring rule ───
const multiH1 = buildOnlineScorecards({
  ...baseInput,
  contentDetails: [{ url: "https://example.test/two-h1", headings: [{ level: 1, text: "A" }, { level: 1, text: "B" }, { level: 2, text: "Answer" }] }] as Parameters<typeof buildOnlineScorecards>[0]["contentDetails"],
});
const headingCheck = check(multiH1.pillars!.content, "content-headings");
assert.notEqual(headingCheck.status, "Fail", "multiple H1 elements must not fail a score under another id");
assert.equal(headingCheck.observedStatus, "Pass");
assert.deepEqual(headingCheck.affectedUrls, [], "the retired h1 === 1 rule contributes no affected URL");

// ─── Regression: canonical absence alone is not Fail or Partial ──────────────
const noCanonical = buildOnlineScorecards({
  ...baseInput,
  findings: {
    ...findings,
    t5: {
      ...finding("Pass"),
      evidence: { ...finding("Pass").evidence, canonicalDetails: [{ url: "https://example.test/", state: "missing" }] },
    } as unknown as Finding,
  },
});
const canonical = check(noCanonical.seo, "seo-canonical");
assert.equal(canonical.status, "Unavailable", "a page without a declared canonical is unmeasured, not defective");
assert.notEqual(canonical.status, "Fail");
assert.deepEqual(canonical.affectedUrls, []);

const brokenCanonical = buildOnlineScorecards({
  ...baseInput,
  findings: {
    ...findings,
    t5: {
      ...finding("Pass"),
      evidence: { ...finding("Pass").evidence, canonicalDetails: [{ url: "https://example.test/", state: "invalid" }] },
    } as unknown as Finding,
  },
});
assert.notEqual(check(brokenCanonical.seo, "seo-canonical").observedStatus, "Pass", "a broken canonical is still an observed failure");

console.log("Online SEO and GEO score fixtures passed.");
