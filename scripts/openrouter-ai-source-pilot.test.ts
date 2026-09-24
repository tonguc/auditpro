import assert from "node:assert/strict";
import {
  requireSourcePilotAuthorization,
  SOURCE_PILOT_AUTHORIZATION,
  SOURCE_PILOT_ESTIMATED_MAXIMUM_USD,
  SOURCE_PILOT_PROMPT_SET_VERSION,
  sourcePilotPromptDefinitions,
  sourcePilotPrompts,
} from "./openrouter-ai-source-prompt-set";

assert.equal(SOURCE_PILOT_PROMPT_SET_VERSION, "tr-ai-automation-discovery-2026-09-19.2");
assert.equal(SOURCE_PILOT_ESTIMATED_MAXIMUM_USD, 0.45);
assert.equal(sourcePilotPromptDefinitions.length, 30);
assert.equal(sourcePilotPrompts.length, 30);
assert.equal(new Set(sourcePilotPromptDefinitions.map((item) => item.id)).size, 30);
assert.equal(new Set(sourcePilotPrompts.map((item) => item.query)).size, 30);

for (const cluster of ["provider-discovery", "use-case-discovery", "procurement-and-risk"] as const) {
  assert.equal(sourcePilotPromptDefinitions.filter((item) => item.cluster === cluster).length, 10, cluster);
}

for (const prompt of sourcePilotPrompts) {
  assert.equal(prompt.kind, "discovery-intent");
  assert.equal(prompt.contributesToVisibility, true);
  assert.match(prompt.id, new RegExp(`^${SOURCE_PILOT_PROMPT_SET_VERSION}:`));
  assert.match(prompt.query, /Türkiye'de/);
  assert.doesNotMatch(prompt.query.toLocaleLowerCase("tr-TR"), /tonguç|karacay|tonguckaracay/);
}

assert.throws(
  () => requireSourcePilotAuthorization({}),
  /Explicit approval is required/,
);
assert.doesNotThrow(() => requireSourcePilotAuthorization({
  AUDITPRO_AI_PILOT_AUTHORIZATION: SOURCE_PILOT_AUTHORIZATION,
}));

console.log("OpenRouter 30-prompt source pilot fixtures passed.");
