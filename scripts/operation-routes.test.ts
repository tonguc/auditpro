import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const routeFiles = [
  ["admin health", join("app", "api", "admin", "health", "route.ts")],
  ["billing sync", join("app", "api", "billing", "sync", "route.ts")],
  ["stripe webhook", join("app", "api", "webhooks", "stripe", "route.ts")],
  ["audits", join("app", "api", "audits", "route.ts")],
  ["analysis direct", join("app", "api", "analyze", "route.ts")],
  ["analysis job create", join("app", "api", "analyze", "jobs", "route.ts")],
  ["analysis job read", join("app", "api", "analyze", "jobs", "[id]", "route.ts")],
  ["ai visibility", join("app", "api", "ai-visibility", "route.ts")],
] as const;

for (const [name, path] of routeFiles) {
  const source = readFileSync(join(process.cwd(), path), "utf8");
  assert.match(source, /requestIdFromHeaders/, `${name} must create a request id`);
  assert.match(source, /logOperation/, `${name} must emit operation logs`);
  assert.match(source, /operationResponse/, `${name} must return request id headers`);
}

const analysis = readFileSync(join(process.cwd(), "app", "api", "analyze", "route.ts"), "utf8");
const analysisJobs = readFileSync(join(process.cwd(), "app", "api", "analyze", "jobs", "route.ts"), "utf8");
const analysisJobRead = readFileSync(join(process.cwd(), "app", "api", "analyze", "jobs", "[id]", "route.ts"), "utf8");
const aiVisibility = readFileSync(join(process.cwd(), "app", "api", "ai-visibility", "route.ts"), "utf8");
const audits = readFileSync(join(process.cwd(), "app", "api", "audits", "route.ts"), "utf8");
const billingSync = readFileSync(join(process.cwd(), "app", "api", "billing", "sync", "route.ts"), "utf8");
const cspReport = readFileSync(join(process.cwd(), "app", "api", "security", "csp-report", "route.ts"), "utf8");
const analysisRateLimit = readFileSync(join(process.cwd(), "lib", "analysis-rate-limit.ts"), "utf8");
const logger = readFileSync(join(process.cwd(), "lib", "operation-log.ts"), "utf8");

function assertBefore(source: string, earlier: string, later: string, message: string) {
  const earlierIndex = source.indexOf(earlier);
  const laterIndex = source.indexOf(later);
  assert.notEqual(earlierIndex, -1, `${message}: missing ${earlier}`);
  assert.notEqual(laterIndex, -1, `${message}: missing ${later}`);
  assert.ok(earlierIndex < laterIndex, message);
}

function noStoreHeaderUsages(source: string) {
  return source.match(/headers:\s*(?:noStoreHeaders|\{[^}]*\.\.\.noStoreHeaders)/g)?.length;
}

assert.match(analysis, /stableLogHash\(requestedUrl\.hostname\)/);
assert.match(analysis, /parseAnalyzeRequestBody/);
assert.match(analysis, /outcome:\s*"invalid_body"/);
assert.match(analysis, /resolvePublicUrl/);
assert.match(analysis, /pinnedPublicUrlDispatcher/);
assert.match(analysis, /dispatcher/);
assert.match(analysis, /enforceAnalysisRateLimit\(request, requestedUrl\.hostname\)/);
assert.match(analysisRateLimit, /const MAX_RATE_LIMIT_BUCKETS = 500/);
assert.match(analysisRateLimit, /requestLog\.delete\(key\)/);
assert.match(analysisRateLimit, /requestLog\.size > MAX_RATE_LIMIT_BUCKETS/);
assert.match(analysisRateLimit, /while \(requestLog\.size > MAX_RATE_LIMIT_BUCKETS\)/);
assert.match(analysisRateLimit, /function evictLeastUsedBucket/);
assert.match(analysisJobs, /stableLogHash\(requestedUrl\.hostname\)/);
assert.match(analysisJobs, /assertPublicUrl/);
assert.match(analysisJobs, /parseAnalysisJobRequestBody/);
assert.match(analysisJobs, /outcome:\s*"invalid_body"/);
assert.ok(
  analysisJobs.indexOf("requestedUrl = normalizePublicUrl(body.url);") >
    analysisJobs.indexOf("await requireOrganization(request.headers)"),
  "analysis job create must authenticate before URL normalization",
);
assert.ok(
  analysisJobs.indexOf("const parsedBody = await parseAnalysisJobRequestBody(request);") >
    analysisJobs.indexOf("await requireOrganization(request.headers)"),
  "analysis job create must authenticate before body parsing",
);
assertBefore(
  analysisJobRead,
  "await requireOrganization(request.headers)",
  "const job = await getAnalysisJob(id);",
  "analysis job read must authenticate before job lookup",
);
assertBefore(
  analysisJobs,
  "await assertPublicUrl(requestedUrl);",
  "await createReservedAnalysisJob",
  "analysis job create must validate public URLs before quota reservation",
);
assertBefore(
  analysisJobs,
  "await assertPublicUrl(requestedUrl);",
  "await createReservedAnalysisJob",
  "analysis job create must validate public URLs before jobs are queued",
);
assert.match(analysisJobs, /createReservedAnalysisJob/);
assert.match(billingSync, /parseBillingSyncRequestBody/);
assert.match(billingSync, /outcome:\s*"invalid_body"/);
assertBefore(
  billingSync,
  "if (!authorized(request))",
  "const parsedBody = await parseBillingSyncRequestBody(request);",
  "billing sync must authenticate before body parsing",
);
assertBefore(
  billingSync,
  "const parsedBody = await parseBillingSyncRequestBody(request);",
  "if (!hasDatabase())",
  "billing sync must validate JSON before database availability checks",
);
assert.match(audits, /parseAuditDocumentRequestBody/);
assert.match(audits, /outcome:\s*"invalid_body"/);
assertBefore(
  audits,
  "assertCanMutateOrganization(organization.role);",
  "const parsedBody = await parseAuditDocumentRequestBody(request);",
  "audit upsert must authenticate before body parsing",
);
assertBefore(
  audits,
  "const parsedBody = await parseAuditDocumentRequestBody(request);",
  "if (!validDocument(document))",
  "audit upsert must parse JSON before validating audit documents",
);
assert.match(aiVisibility, /stableLogHash\(url\.hostname\)/);
assert.match(aiVisibility, /assertPublicUrl/);
assert.match(aiVisibility, /parseAiVisibilityRequestBody/);
assert.match(aiVisibility, /outcome:\s*"invalid_body"/);
assert.match(aiVisibility, /try\s*\{\s*url = normalizePublicUrl\(body\.url\);/);
assertBefore(
  aiVisibility,
  "await requireOrganization(request.headers)",
  "await assertPublicUrl(url);",
  "AI Visibility must authenticate before public URL DNS validation",
);
assertBefore(
  aiVisibility,
  'return operationResponse({ error: parsedBody.error }, { status: 400, headers: noStoreHeaders }, requestId);',
  "const reservation = await reserveAiVisibilityQuota",
  "AI Visibility must reject invalid JSON before quota is reserved",
);
assertBefore(
  aiVisibility,
  '{ error: "Enter a website domain first." }',
  "const reservation = await reserveAiVisibilityQuota",
  "AI Visibility must reject missing URLs before quota is reserved",
);
assertBefore(
  aiVisibility,
  '"Enter a valid website domain."',
  "const reservation = await reserveAiVisibilityQuota",
  "AI Visibility must reject normalized URL errors before quota is reserved",
);
assertBefore(
  aiVisibility,
  "await assertPublicUrl(url);",
  "const reservation = await reserveAiVisibilityQuota",
  "AI Visibility must validate public URLs before quota is reserved",
);
assertBefore(
  aiVisibility,
  "const reservation = await reserveAiVisibilityQuota",
  "const result = await runAiVisibilityScan",
  "AI Visibility must reserve quota before token-spending scan starts",
);
assert.doesNotMatch(analysis, /metadata:\s*\{\s*requestedUrl:\s*requestedUrl\.href/);
assert.doesNotMatch(aiVisibility, /metadata:\s*\{\s*url:\s*url\.href/);
assert.match(logger, /sensitiveKeyPattern/);
assert.match(logger, /AUDITPRO_LOG_LEVEL/);
assert.match(cspReport, /requestIdFromHeaders/);
assert.match(cspReport, /logOperation/);
assert.match(cspReport, /AUDITPRO_REQUEST_ID_HEADER/);
assert.match(cspReport, /operation:\s*"security\.csp_report"/);
assert.match(cspReport, /outcome:\s*"too_large"/);
assert.match(cspReport, /outcome:\s*"rate_limited"/);
const stripeRoute = readFileSync(join(process.cwd(), "app", "api", "webhooks", "stripe", "route.ts"), "utf8");
assert.match(stripeRoute, /maxStripeWebhookBytes/);
assert.match(stripeRoute, /readBoundedWebhookBody/);
assert.match(stripeRoute, /missing organization metadata/i);
assert.match(stripeRoute, /:dead_letter/);
assert.match(stripeRoute, /const noStoreHeaders = \{ "Cache-Control": "no-store" \}/);
assert.equal(
  stripeRoute.match(/operationResponse\(/g)?.length,
  stripeRoute.match(/headers: noStoreHeaders/g)?.length,
  "Stripe webhook operation responses must include Cache-Control no-store",
);
for (const [name, source] of [
  ["audits", audits],
  ["billing sync", billingSync],
  ["analysis direct", analysis],
  ["analysis job create", analysisJobs],
  ["analysis job read", analysisJobRead],
  ["AI Visibility", aiVisibility],
] as const) {
  assert.match(source, /const noStoreHeaders = \{ "Cache-Control": "no-store" \}/, `${name} must define no-store headers`);
  assert.equal(
    source.match(/operationResponse\(/g)?.length,
    noStoreHeaderUsages(source),
    `${name} operation responses must include Cache-Control no-store`,
  );
}

console.log("Operation route fixtures passed.");
