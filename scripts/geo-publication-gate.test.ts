import assert from "node:assert/strict";

import type { AiVisibilitySummary } from "../lib/ai-visibility";
import {
  geoPublicationChecks,
  geoPublicationStatus,
  hasDirectionalAiEvidence,
  percentMetric,
} from "../lib/geo-publication-gate";

function summary(overrides: Partial<AiVisibilitySummary>): AiVisibilitySummary {
  return {
    status: "complete",
    methodVersion: "0.2.0",
    promptSetVersion: "test",
    measuredAt: new Date(0).toISOString(),
    prompts: [],
    observations: [],
    engines: [],
    completedObservations: 0,
    expectedObservations: 30,
    coveragePct: 0,
    visibilityIndex: null,
    mentionRate: null,
    citationRate: null,
    scoreEligible: false,
    scoreReason: "Directional result only.",
    inputTokens: 0,
    outputTokens: 0,
    topCompetitors: [],
    ...overrides,
  };
}

const pending = undefined;
assert.equal(hasDirectionalAiEvidence(summary({methodVersion:'0.1.0',completedObservations:10,mentionRate:100,citationRate:100})),false);
assert.equal(geoPublicationStatus(summary({methodVersion:'0.1.0',scoreEligible:true,completedObservations:10,mentionRate:100,citationRate:100})),'Evidence pending');
assert.equal(hasDirectionalAiEvidence(pending), false);
assert.equal(geoPublicationStatus(pending), "Evidence pending");
assert.deepEqual(
  geoPublicationChecks(pending).map((check) => check.done),
  [false, false, true, false],
);

const zeroResponse = summary({ completedObservations: 0, expectedObservations: 30, coveragePct: 0 });
assert.equal(hasDirectionalAiEvidence(zeroResponse), false);
assert.equal(geoPublicationStatus(zeroResponse), "Evidence pending");
assert.match(geoPublicationChecks(zeroResponse)[0].detail, /0\/30/);

const malformed = summary({
  completedObservations: 8,
  visibilityIndex: undefined as unknown as null,
  mentionRate: undefined as unknown as null,
  citationRate: undefined as unknown as null,
});
assert.equal(hasDirectionalAiEvidence(malformed), false, "undefined metrics must not count as evidence");
assert.equal(geoPublicationStatus(malformed), "Evidence pending");
assert.equal(percentMetric(undefined), "—");

const partialMalformed = summary({
  completedObservations: 8,
  visibilityIndex: 42,
  mentionRate: undefined as unknown as null,
  citationRate: null,
});
assert.equal(hasDirectionalAiEvidence(partialMalformed), false, "mention and citation rates must both exist");
assert.equal(geoPublicationStatus(partialMalformed), "Evidence pending");
assert.equal(geoPublicationChecks(partialMalformed)[1].done, false);

const directional = summary({
  completedObservations: 24,
  expectedObservations: 30,
  coveragePct: 80,
  visibilityIndex: 58,
  mentionRate: 70,
  citationRate: 30,
  topCompetitors: [{ domain: "competitor.test", citations: 3 }],
});
assert.equal(hasDirectionalAiEvidence(directional), true);
assert.equal(geoPublicationStatus(directional), "Directional only");
assert.deepEqual(
  geoPublicationChecks(directional).map((check) => check.done),
  [true, true, true, false],
);
assert.equal(percentMetric(70), "70%");

// P1-P3 plan B2: the two-run publication threshold is evaluated in code.
const runA = { ...directional, runId: "run-a", promptSetVersion: "cmp", discoveryPromptsPerEngine: 30, citationSamples: 30 };
const runB = { ...directional, runId: "run-b", promptSetVersion: "cmp", discoveryPromptsPerEngine: 30, citationSamples: 30 };
assert.equal(geoPublicationStatus(directional, [runA, runB]), "Publishable", "two qualifying runs publish");
assert.equal(geoPublicationChecks(directional, [runA, runB])[3].done, true);
const singleRunGate = [runA];
assert.equal(geoPublicationStatus(directional, singleRunGate), "Directional only", "one run can never publish");
assert.match(geoPublicationChecks(directional, singleRunGate)[3].detail, /separate runs/);

const publishable = summary({
  completedObservations: 90,
  expectedObservations: 90,
  coveragePct: 100,
  visibilityIndex: 92,
  mentionRate: 95,
  citationRate: 85,
  scoreEligible: true,
  scoreReason: "Publication threshold reached.",
});
assert.equal(geoPublicationStatus(publishable), "Publishable");
assert.deepEqual(
  geoPublicationChecks(publishable).map((check) => check.done),
  [true, true, true, true],
);
assert.match(geoPublicationChecks(publishable)[2].detail, /without changing the global audit score contract/);

console.log("GEO publication gate fixtures passed.");
