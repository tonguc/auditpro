import assert from "node:assert/strict";
import { compareResolvedSourceReports, type ResolvedSourceReport } from "../lib/ai-source-engine-comparison";

const report = (observations: ResolvedSourceReport["observations"]): ResolvedSourceReport => ({
  promptSetVersion: "fixed-set-v1",
  summary: { completed: observations.filter((item) => !item.error).length },
  observations,
});
const result = compareResolvedSourceReports([
  { id: "gemini-r1", engine: "gemini", round: "1", report: report([
    { promptId: "p1", brandMentioned: false, providerSourcesPresent: true, resolvedUrls: ["https://a.test/x", "https://shared.test/a"], targetCited: false },
    { promptId: "p2", brandMentioned: false, providerSourcesPresent: false, resolvedUrls: [], targetCited: false },
  ]) },
  { id: "openai-r1", engine: "openai", round: "1", report: report([
    { promptId: "p1", brandMentioned: false, providerSourcesPresent: true, resolvedUrls: ["https://shared.test/b", "https://a.test/x"], targetCited: false },
    { promptId: "p2", error: "timeout", brandMentioned: false, providerSourcesPresent: false, resolvedUrls: [], targetCited: false },
  ]) },
]);
assert.equal(result.reports[0]?.completed, 2);
assert.equal(result.reports[1]?.completed, 1);
assert.equal(result.pairwise[0]?.exactSourceUrlOverlap, 1);
assert.equal(result.pairwise[0]?.sourceDomainOverlap, 2);
assert.equal(result.pairwise[0]?.completedPromptOverlap, 1);
assert.deepEqual(result.domainsSeenInMultipleReports, [
  { domain: "a.test", reportCount: 2 },
  { domain: "shared.test", reportCount: 2 },
]);
assert.equal(result.publicationEligible, false);
assert.match(result.publicationReason, /two complete independent rounds per engine/);
console.log("AI source engine comparison fixtures passed.");
