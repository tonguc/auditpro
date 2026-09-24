import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { analyzeAiAnswer, buildAiVisibilityPrompts, buildComparativeAiVisibilityPrompts, evaluateAiVisibilityEligibility, resolveWebSearchMode, supportsWebSearchTool, webSearchToolParameters, runAiVisibilityScan, type AiVisibilityEngine } from "../lib/ai-visibility";
// note: partial source metadata is disclosed through citationCoverage (B2 c)
import { closeDatabasePool } from "../lib/db";

async function main() {
const previousAiEnabled = process.env.AUDITPRO_AI_VISIBILITY_ENABLED;
const previousAiGatewayKey = process.env.AI_GATEWAY_API_KEY;
const previousDatabaseUrl = process.env.DATABASE_URL;
const previousAuthSecret = process.env.BETTER_AUTH_SECRET;
const previousLogLevel = process.env.AUDITPRO_LOG_LEVEL;
const previousOpenRouterBaseUrl = process.env.AUDITPRO_OPENROUTER_BASE_URL;
const previousFetch = globalThis.fetch;

const prompts = buildAiVisibilityPrompts({ brandName: "Povlex", domain: "auditpro.example", industry: "SEO", locale: "tr" });
assert.equal(prompts.length, 10);
assert.equal(prompts.filter((item) => item.contributesToVisibility).length, 8);
assert.match(prompts[0].query, /Povlex/);

const parsed = analyzeAiAnswer({
  answer: "Povlex is relevant. Sources: https://auditpro.example/report and https://competitor.test/guide.",
  brandName: "Povlex",
  domain: "auditpro.example",
  sourceUrls: ['https://auditpro.example/report','https://competitor.test/guide'],
});
assert.equal(parsed.brandMentioned, true);
assert.equal(parsed.targetCited, true);
assert.deepEqual(parsed.competitorDomains, ["competitor.test"]);

const engine: AiVisibilityEngine = { id: "chatgpt", label: "ChatGPT", model: "fixture/model" };
const summary = await runAiVisibilityScan({
  brandName: "Povlex", domain: "auditpro.example", industry: "SEO", locale: "en", promptLimit: 10, engines: [engine], userId: "test",
  generator: async ({ prompt }) => ({
    text: prompt.includes("Povlex") ? "Povlex is a website audit product." : "Try Povlex: https://auditpro.example/ and https://competitor.test/",
    usage: { inputTokens: 20, outputTokens: 10 },
    sourceUrls: prompt.includes('Povlex') ? [] : ['https://auditpro.example/','https://competitor.test/'],
  }),
});
assert.equal(summary.status, "complete");
assert.equal(summary.coveragePct, 100);
assert.equal(summary.mentionRate, 100);
assert.equal(summary.citationRate, 100);
assert.equal(summary.visibilityIndex, 100);
assert.equal(summary.scoreEligible, false);
assert.equal(summary.searchMode, "none");
assert.equal(summary.discoveryPromptsPerEngine, 8);
assert.equal(summary.inputTokens, 200);
assert.deepEqual(summary.topCompetitors, [{ domain: "competitor.test", citations: 8 }]);

for(const answer of ['Povlexify is a different word','NotPovlex','https://auditpro.example.evil.test/'])assert.equal(analyzeAiAnswer({answer,brandName:'Povlex',domain:'auditpro.example'}).brandMentioned,false);
assert.equal(analyzeAiAnswer({answer:'Try Povlex.',brandName:'Povlex',domain:'auditpro.example'}).brandMentioned,true);
const unsupported=analyzeAiAnswer({answer:'Povlex https://auditpro.example/',brandName:'Povlex',domain:'auditpro.example'});
assert.equal(unsupported.targetCited,false); assert.equal(unsupported.citationEvidence,'unavailable'); assert.deepEqual(unsupported.answerUrls,['https://auditpro.example/']);
const unsafe=analyzeAiAnswer({answer:'',brandName:'',domain:'',sourceUrls:['javascript:alert(1)','https://secret@auditpro.example/']});
assert.equal(unsafe.brandMentioned,false); assert.deepEqual(unsafe.citedUrls,[]);

// P1-P3 plan B2/B3: comparative prompt set, code-enforced publication gate, search mode policy.
const comparative = buildComparativeAiVisibilityPrompts({ brandName: "Povlex", domain: "auditpro.example", industry: "SEO", locale: "tr" });
assert.equal(comparative.length, 32);
assert.equal(comparative.filter((item) => item.contributesToVisibility).length, 30, "the comparative set must carry 30 fixed discovery prompts");
assert.match(comparative[0].query, /Povlex/);
const englishComparative = buildComparativeAiVisibilityPrompts({ brandName: "Povlex", domain: "auditpro.example", industry: "SEO", locale: "de" });
assert.equal(englishComparative.length, 32, "locales without a comparative translation use the English set (declared bound)");
assert.equal(englishComparative.filter((item) => item.contributesToVisibility).length, 30);
const gateOneRun = evaluateAiVisibilityEligibility([{ runId: "r1", promptSetVersion: "v", discoveryPromptsPerEngine: 30, citationSamples: 60 }]);
assert.equal(gateOneRun.eligible, false, "a single run can never publish");
const gateShort = evaluateAiVisibilityEligibility([
  { runId: "r1", promptSetVersion: "v", discoveryPromptsPerEngine: 29, citationSamples: 60 },
  { runId: "r2", promptSetVersion: "v", discoveryPromptsPerEngine: 30, citationSamples: 60 },
]);
assert.equal(gateShort.eligible, false, "29/30 discovery prompts per engine is not publishable");
const gateThinCitations = evaluateAiVisibilityEligibility([
  { runId: "r1", promptSetVersion: "v", discoveryPromptsPerEngine: 30, citationSamples: 10 },
  { runId: "r2", promptSetVersion: "v", discoveryPromptsPerEngine: 30, citationSamples: 10 },
]);
assert.equal(gateThinCitations.eligible, false, "provider-reported citation samples must reach the threshold");
const gateMixedSets = evaluateAiVisibilityEligibility([
  { runId: "r1", promptSetVersion: "v1", discoveryPromptsPerEngine: 30, citationSamples: 60 },
  { runId: "r2", promptSetVersion: "v2", discoveryPromptsPerEngine: 30, citationSamples: 60 },
]);
assert.equal(gateMixedSets.eligible, false, "runs from different prompt set versions cannot be combined");
const gatePass = evaluateAiVisibilityEligibility([
  { runId: "r1", promptSetVersion: "v", discoveryPromptsPerEngine: 30, citationSamples: 30 },
  { runId: "r2", promptSetVersion: "v", discoveryPromptsPerEngine: 30, citationSamples: 30 },
]);
assert.equal(gatePass.eligible, true, "30 discovery prompts per engine across two runs with citations publishes");
assert.equal(resolveWebSearchMode(true), true, "pilot-only keeps the pilot flow searchable");
assert.equal(resolveWebSearchMode(false), false, "pilot-only keeps paid search out of production scans");
assert.equal(resolveWebSearchMode(false, "always"), true);
assert.equal(resolveWebSearchMode(true, "never"), false);
assert.equal(supportsWebSearchTool("openai/gpt-5.6-luna"), true);
assert.equal(supportsWebSearchTool("perplexity/sonar"), false, "Perplexity searches natively and rejects tool use");
delete process.env.AUDITPRO_AI_SEARCH_MAX_RESULTS;
assert.deepEqual(webSearchToolParameters(), { engine: "native", max_uses: 1 }, "unbounded search context unless configured");
process.env.AUDITPRO_AI_SEARCH_MAX_RESULTS = "1";
assert.deepEqual(webSearchToolParameters(), { engine: "native", max_uses: 1, max_results: 1 }, "low-cost mode bounds the injected search context");
process.env.AUDITPRO_AI_SEARCH_MAX_RESULTS = "99";
assert.deepEqual(webSearchToolParameters(), { engine: "native", max_uses: 1 }, "out-of-range settings are ignored, not guessed");
delete process.env.AUDITPRO_AI_SEARCH_MAX_RESULTS;
const deadEngineScan = await runAiVisibilityScan({
  brandName: "Povlex", domain: "auditpro.example", industry: "SEO", locale: "en", promptLimit: 3,
  engines: [engine, { id: "perplexity", label: "Perplexity", model: "perplexity/sonar" }], userId: "test",
  generator: async ({ model }) => {
    if (model.startsWith("perplexity/")) throw new Error("No endpoints found that support tool use.");
    return { text: "Povlex", usage: { inputTokens: 2, outputTokens: 1 } };
  },
});
assert.equal(deadEngineScan.discoveryPromptsPerEngine, 0, "a dead configured engine must block the publication gate");
assert.equal(deadEngineScan.scoreEligible, false);
// B2 (c): partial source metadata no longer nulls the rate; the basis is disclosed.
const partialSources = await runAiVisibilityScan({
  brandName: "Povlex", domain: "auditpro.example", locale: "en", promptLimit: 2, engines: [engine], userId: "test",
  prompts: [
    { id: "basis:1", kind: "discovery-intent", query: "Who cites Povlex sources?", contributesToVisibility: true },
    { id: "basis:2", kind: "discovery-intent", query: "Who else is around?", contributesToVisibility: true },
  ],
  generator: async ({ prompt }) => prompt.includes("sources")
    ? { text: "Povlex https://auditpro.example/", usage: { inputTokens: 2, outputTokens: 1 }, sourceUrls: ["https://auditpro.example/"] }
    : { text: "Someone else", usage: { inputTokens: 2, outputTokens: 1 } },
});
assert.equal(partialSources.citationRate, 100, "the rate covers the provider-source-backed subset");
assert.equal(partialSources.citationSamples, 1);
assert.equal(partialSources.citationCoverage, 50, "responses without source metadata are disclosed as coverage, not guessed");
assert.equal(partialSources.mentionRate, 50);
// Transport retry: one transient "fetch failed" must not permanently punch a
// hole in a fixed measurement set.
const fetchBeforeRetryProbe = globalThis.fetch;
const keyBeforeRetryProbe = process.env.AI_GATEWAY_API_KEY;
process.env.AI_GATEWAY_API_KEY = "retry-probe-key";
let fetchAttempts = 0;
globalThis.fetch = (async () => {
  fetchAttempts += 1;
  if (fetchAttempts === 1) throw new TypeError("fetch failed");
  return new Response(JSON.stringify({ choices: [{ message: { content: "Povlex is fine." } }], usage: { prompt_tokens: 3, completion_tokens: 2 } }), { status: 200, headers: { "content-type": "application/json" } });
}) as typeof fetch;
const retried = await runAiVisibilityScan({ brandName: "Povlex", domain: "auditpro.example", locale: "en", promptLimit: 1, engines: [{ id: "chatgpt", label: "ChatGPT", model: "openai/gpt-5.6-luna" }], userId: "pilot" });
globalThis.fetch = fetchBeforeRetryProbe;
if (keyBeforeRetryProbe === undefined) delete process.env.AI_GATEWAY_API_KEY; else process.env.AI_GATEWAY_API_KEY = keyBeforeRetryProbe;
assert.equal(retried.observations[0]?.error, undefined, "a transient transport failure is retried once");
assert.equal(fetchAttempts, 2, "exactly one retry, never silent repetition");
const noSources=await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:3,engines:[engine],userId:'test',generator:async()=>({text:'Povlex https://auditpro.example/'})});
assert.equal(noSources.mentionRate,100); assert.equal(noSources.citationRate,null); assert.equal(noSources.visibilityIndex,null);
const empty=await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:3,engines:[engine],userId:'test',generator:async()=>({text:' ',usage:{inputTokens:2,outputTokens:1}})});
assert.equal(empty.completedObservations,0); assert.equal(empty.status,'partial'); assert.equal(empty.inputTokens,6); assert.equal(empty.outputTokens,3);

process.env.AI_GATEWAY_API_KEY = "live-ai-gateway-key-123456";
process.env.AUDITPRO_OPENROUTER_BASE_URL = "https://openrouter.test/api/v1/chat/completions";
let openRouterRequest: Request | undefined;
globalThis.fetch = async (input, init) => {
  openRouterRequest = new Request(input, init);
  return new Response(JSON.stringify({
    choices: [{ message: { content: "Povlex is relevant.", annotations: [{ type: "url_citation", url: "https://auditpro.example/report" }] } }],
    usage: { prompt_tokens: 12, completion_tokens: 7 },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
const openRouter = await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:1,engines:[engine],userId:'pilot'});
assert.equal(openRouter.inputTokens,12); assert.equal(openRouter.outputTokens,7); assert.deepEqual(openRouter.observations[0]?.citedUrls,['https://auditpro.example/report']);
assert.equal(openRouterRequest?.url, "https://openrouter.test/api/v1/chat/completions");
assert.equal(openRouterRequest?.headers.get("authorization"), "Bearer live-ai-gateway-key-123456");
const openRouterBody = await openRouterRequest?.json() as { model?: string; max_tokens?: number; temperature?: number; messages?: unknown[] };
assert.equal(openRouterBody.model, "fixture/model");
assert.equal(openRouterBody.max_tokens, 350);
assert.equal(openRouterBody.temperature, 0);
assert.equal(openRouterBody.messages?.length, 2);
const webSearchProbe = await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:1,engines:[engine],userId:'pilot',webSearch:true});
assert.equal(webSearchProbe.observations.length, 1);
const webSearchBody = await openRouterRequest?.json() as { tools?: Array<{ type?: string; parameters?: { engine?: string; max_uses?: number } }>; max_tool_calls?: number };
assert.equal(webSearchBody.tools?.[0]?.type, 'openrouter:web_search');
assert.equal(webSearchBody.tools?.[0]?.parameters?.engine, 'native');
assert.equal(webSearchBody.tools?.[0]?.parameters?.max_uses, 1);
assert.equal(webSearchBody.max_tool_calls, 1);
const openAiEngine: AiVisibilityEngine = { id: "chatgpt", label: "OpenAI GPT-5 Mini", model: "openai/gpt-5-mini" };
const openAiProbe = await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:1,engines:[openAiEngine],userId:'pilot',webSearch:true});
assert.equal(openAiProbe.completedObservations, 1);
const openAiBody = await openRouterRequest?.json() as { max_tokens?: number; max_completion_tokens?: number; reasoning_effort?: string; temperature?: number };
assert.equal(openAiBody.max_tokens, undefined);
assert.equal(openAiBody.max_completion_tokens, 1200);
assert.equal(openAiBody.reasoning_effort, "minimal");
assert.equal(openAiBody.temperature, undefined);
globalThis.fetch = async () => new Response(JSON.stringify({
  choices: [{ finish_reason: "length", message: { content: null } }],
  usage: { prompt_tokens: 41, completion_tokens: 1200 },
}), { status: 200, headers: { "Content-Type": "application/json" } });
const missingText = await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:1,engines:[openAiEngine],userId:'pilot',webSearch:true});
assert.equal(missingText.completedObservations, 0);
assert.equal(missingText.inputTokens, 41);
assert.equal(missingText.outputTokens, 1200);
assert.match(missingText.observations[0]?.error ?? "", /finish_reason: length/);
globalThis.fetch = async (input, init) => {
  openRouterRequest = new Request(input, init);
  return new Response(JSON.stringify({
    choices: [{ message: { content: "Povlex is relevant.", annotations: [] } }],
    usage: { prompt_tokens: 12, completion_tokens: 7 },
  }), { status: 200, headers: { "Content-Type": "application/json" } });
};
const sequential = await runAiVisibilityScan({brandName:'Povlex',domain:'auditpro.example',locale:'en',promptLimit:1,engines:[engine],userId:'pilot',prompts:[{id:'pilot:1',kind:'discovery-intent',query:'Who should I choose?',contributesToVisibility:true}],concurrency:1,generator:async()=>({text:'Povlex'})});
assert.equal(sequential.prompts[0]?.id, 'pilot:1');

const partial = await runAiVisibilityScan({
  brandName: "Povlex", domain: "auditpro.example", locale: "en", promptLimit: 2, engines: [engine], userId: "test",
  generator: async () => { throw new Error("timeout"); },
});
assert.equal(partial.status, "partial");
assert.equal(partial.coveragePct, 0);
assert.equal(partial.visibilityIndex, null);
assert.equal(partial.observations.every((item) => item.error === "timeout"), true);
let resumedCalls = 0;
const resumed = await runAiVisibilityScan({
  brandName: "Povlex", domain: "auditpro.example", locale: "en", promptLimit: 2, engines: [engine], userId: "test",
  existingObservations: [partial.observations[0]!],
  generator: async () => { resumedCalls += 1; return { text: "Povlex" }; },
});
assert.equal(resumedCalls, 1);
assert.equal(resumed.observations[0]?.error, "timeout");
assert.equal(resumed.observations[1]?.brandMentioned, true);
await assert.rejects(() => runAiVisibilityScan({
  brandName: "Povlex", domain: "auditpro.example", locale: "en", promptLimit: 1, engines: [engine], userId: "test",
  existingObservations: [{ ...partial.observations[0]!, promptId: "unknown" }],
  generator: async () => ({ text: "Povlex" }),
}), /Checkpoint observations/);

const routeSource = readFileSync(join(process.cwd(), "app", "api", "ai-visibility", "route.ts"), "utf8");
const ledgerSource = readFileSync(join(process.cwd(), "lib", "usage-ledger.ts"), "utf8");
assert.match(routeSource, /reconcileAiVisibilityCredits/);
assert.match(routeSource, /reconcileAiVisibilityReportQuota/);
assert.match(routeSource, /recordAiAccountingFailure/);
assert.match(routeSource, /failureStage:\s*"usage_recording"/);
assert.match(routeSource, /failureStage:\s*"report_reconciliation"/);
assert.match(routeSource, /failureStage:\s*"credit_reconciliation"/);
assert.match(routeSource, /failureStage:\s*"reservation_reconciliation"/);
assert.match(routeSource, /accountingFailurePersisted/);
assert.match(routeSource, /actualPromptCredits/);
assert.match(routeSource, /actualResponseCredits/);
assert.match(routeSource, /outcome:\s*"accounting_failed"/);
assert.match(routeSource, /outcome:\s*"reservation_reconciliation_failed"/);
assert.match(routeSource, /tokensSpent:\s*true/);
assert.match(routeSource, /zero_success_observations/);
assert.match(routeSource, /reportQuotaRefunded/);
assert.match(ledgerSource, /reason = 'reserve'/);
assert.match(ledgerSource, /'refund'/);
assert.match(ledgerSource, /ai_report_reconciliations/);
assert.match(ledgerSource, /ai_report_reservations/);
assert.match(ledgerSource, /ai_accounting_failures/);
assert.match(ledgerSource, /attempts = ai_accounting_failures\.attempts \+ 1/);
assert.match(ledgerSource, /ON CONFLICT \(organization_id, reference_id, failure_stage\)/);
assert.match(ledgerSource, /WHERE EXISTS \(/);
assert.match(ledgerSource, /GREATEST\(ai_reports - 1, 0\)/);
assert.match(ledgerSource, /ON CONFLICT \(organization_id, month, credit_kind, reference_id, reason\)/);
assert.match(ledgerSource, /duplicate: true/);

try {
  process.env.AUDITPRO_LOG_LEVEL = "off";
  process.env.AUDITPRO_AI_VISIBILITY_ENABLED = "true";
  process.env.AI_GATEWAY_API_KEY = "live-ai-gateway-key-123456";
  delete process.env.DATABASE_URL;
  delete process.env.BETTER_AUTH_SECRET;

  const { POST } = await import("../app/api/ai-visibility/route");
  const unauthenticated = await POST(new Request("http://localhost/api/ai-visibility", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: "https://auditpro.example", brandName: "Povlex" }),
  }));
  assert.equal(unauthenticated.status, 503);
  assert.equal(unauthenticated.headers.get("Cache-Control"), "no-store");
  assert.ok(unauthenticated.headers.get("x-auditpro-request-id"));
  assert.deepEqual(await unauthenticated.json(), {
    error: "AI Visibility requires authenticated organization billing before tokens can be spent.",
  });
} finally {
  if (previousAiEnabled === undefined) delete process.env.AUDITPRO_AI_VISIBILITY_ENABLED;
  else process.env.AUDITPRO_AI_VISIBILITY_ENABLED = previousAiEnabled;
  if (previousAiGatewayKey === undefined) delete process.env.AI_GATEWAY_API_KEY;
  else process.env.AI_GATEWAY_API_KEY = previousAiGatewayKey;
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL;
  else process.env.DATABASE_URL = previousDatabaseUrl;
  if (previousAuthSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
  else process.env.BETTER_AUTH_SECRET = previousAuthSecret;
  if (previousLogLevel === undefined) delete process.env.AUDITPRO_LOG_LEVEL;
  else process.env.AUDITPRO_LOG_LEVEL = previousLogLevel;
  if (previousOpenRouterBaseUrl === undefined) delete process.env.AUDITPRO_OPENROUTER_BASE_URL;
  else process.env.AUDITPRO_OPENROUTER_BASE_URL = previousOpenRouterBaseUrl;
  globalThis.fetch = previousFetch;
  await closeDatabasePool();
}

console.log("AI Visibility fixtures passed.");
}

void main();
