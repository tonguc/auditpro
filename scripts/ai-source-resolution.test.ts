import assert from "node:assert/strict";
import { resolveAiSourceUrl } from "../lib/ai-source-resolution";

async function main() {
const direct = await resolveAiSourceUrl("https://example.com/source");
assert.equal(direct.state, "direct");
assert.equal(direct.resolvedUrl, "https://example.com/source");

let validatedHost = "";
const resolved = await resolveAiSourceUrl("https://vertexaisearch.cloud.google.com/grounding-api-redirect/token", {
  loadRedirect: async () => new URL("https://publisher.example/article"),
  validateDestination: async (url) => { validatedHost = url.hostname; },
});
assert.equal(resolved.state, "resolved");
assert.equal(resolved.resolvedUrl, "https://publisher.example/article");
assert.equal(validatedHost, "publisher.example");

const unresolved = await resolveAiSourceUrl("https://vertexaisearch.cloud.google.com/grounding-api-redirect/token", {
  loadRedirect: async () => null,
});
assert.equal(unresolved.state, "unresolved");
assert.equal(unresolved.resolvedUrl, unresolved.providerUrl);

await assert.rejects(
  () => resolveAiSourceUrl("https://vertexaisearch.cloud.google.com/grounding-api-redirect/token", {
    loadRedirect: async () => new URL("http://127.0.0.1/private"),
    validateDestination: async () => { throw new Error("private"); },
  }),
  /private/,
);

console.log("AI source resolution fixtures passed.");
}

void main();
