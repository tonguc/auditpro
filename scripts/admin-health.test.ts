import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import { mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

async function loadAdminHealth(reportDir: string) {
  process.env.AUDITPRO_LAUNCH_READINESS_REPORT_DIR = reportDir;
  const { GET } = await import("../app/api/admin/health/route");
  const response = await GET(new Request("http://localhost/api/admin/health", {
    headers: { "x-auditpro-admin-secret": "admin-secret" },
  }));
  assert.equal(response.status, 200);
  return await response.json();
}

async function startHeaderProbeServer(headers: Record<string, string>) {
  const server = createServer((_, response) => {
    for (const [key, value] of Object.entries(headers)) response.setHeader(key, value);
    response.statusCode = 200;
    response.end("ok");
  });
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve());
  });
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return { server, url: `http://127.0.0.1:${address.port}` };
}

async function closeServer(server: Server) {
  await new Promise<void>((resolve) => server.close(() => resolve()));
}

async function main() {
  const reportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-report-"));
  const missingBackupDir = join(tmpdir(), `auditpro-admin-health-backup-missing-${Date.now()}`);
  writeFileSync(join(reportDir, "launch-readiness-2026-08-27T15-50-31-178Z.json"), JSON.stringify({
    status: "passed",
    finishedAt: new Date().toISOString(),
    durationMs: 107694,
    steps: [
      { script: "test:preflight", status: "passed" },
      { script: "test:smoke", status: "passed" },
    ],
  }), "utf8");

  process.env.AUDITPRO_LOG_LEVEL = "off";
  process.env.AUDITPRO_ADMIN_SECRET = "admin-secret";
  process.env.AUDITPRO_BACKUP_DIR = missingBackupDir;
  delete process.env.AUDITPRO_DEFAULT_PLAN;
  delete process.env.AUDITPRO_BACKUP_MAX_AGE_MS;
  delete process.env.AUDITPRO_REQUIRE_PDF_RENDER;
  delete process.env.AUDITPRO_AI_INPUT_EUR_PER_1K;
  delete process.env.AUDITPRO_AI_OUTPUT_EUR_PER_1K;
  delete process.env.AUDITPRO_AI_VISIBILITY_ENABLED;
  delete process.env.AUDITPRO_AI_OPENAI_MODEL;
  delete process.env.AUDITPRO_AI_GEMINI_MODEL;
  delete process.env.AUDITPRO_AI_PERPLEXITY_MODEL;
  delete process.env.AUDITPRO_AI_CLAUDE_MODEL;
  delete process.env.AI_GATEWAY_API_KEY;
  delete process.env.DATABASE_URL;
  delete process.env.BETTER_AUTH_SECRET;
  delete process.env.BETTER_AUTH_URL;
  delete process.env.APP_URL;
  delete process.env.AUDITPRO_ALLOW_LOCAL_HEALTH_PROBE;

  const { GET } = await import("../app/api/admin/health/route");
  const unauthorized = await GET(new Request("http://localhost/api/admin/health"));
  assert.equal(unauthorized.status, 401);

  const authorized = await GET(new Request("http://localhost/api/admin/health", {
    headers: { "x-auditpro-admin-secret": "admin-secret" },
  }));
  assert.equal(authorized.status, 200);
  assert.equal(authorized.headers.get("Cache-Control"), "no-store");

  const body = await loadAdminHealth(reportDir);
  assert.equal(body.runtime.databaseConfigured, false);
  assert.equal(body.runtime.authConfigured, false);
  assert.equal(body.launch.status, "passed");
  assert.ok(body.launch.ageMs >= 0);
  assert.equal(body.launch.passedSteps, 2);
  assert.equal(body.launch.totalSteps, 2);
  assert.equal(body.billing.adminSyncConfigured, Boolean(process.env.AUDITPRO_BILLING_SYNC_SECRET));
  assert.ok(Array.isArray(body.checks));
  assert.ok(body.checks.some((check: { id: string }) => check.id === "database"));
  assert.ok(body.checks.some((check: { id: string; status: string }) => check.id === "launch_readiness" && check.status === "ok"));
  assert.ok(body.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "security_headers" &&
    check.status === "warning" &&
    check.message.includes("APP_URL is not configured")
  ));
  assert.ok(body.checks.some((check: { id: string; status: string }) => check.id === "default_plan" && check.status === "warning"));
  assert.ok(body.checks.some((check: { id: string; status: string }) => check.id === "log_level" && check.status === "warning"));
  assert.ok(body.checks.some((check: { id: string; status: string }) => check.id === "pdf_render_gate" && check.status === "warning"));
  assert.ok(body.checks.some((check: { id: string; status: string }) => check.id === "ai_cost_rates" && check.status === "warning"));
  assert.equal(body.backup.status, "missing");
  assert.ok(body.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "backup" &&
    check.status === "warning" &&
    check.message.includes("No non-empty database backup")
  ));

  process.env.AUDITPRO_ALLOW_LOCAL_HEALTH_PROBE = "true";
  const missingHeaders = await startHeaderProbeServer({});
  process.env.APP_URL = missingHeaders.url;
  const missingHeadersBody = await loadAdminHealth(reportDir);
  assert.equal(missingHeadersBody.status, "error");
  assert.ok(missingHeadersBody.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "security_headers" &&
    check.status === "error" &&
    check.message.includes("Content-Security-Policy") &&
    check.message.includes("Strict-Transport-Security")
  ));
  await closeServer(missingHeaders.server);

  const requiredHeaders = {
    "Content-Security-Policy": "default-src 'self'; connect-src 'self'; script-src 'self' 'unsafe-inline'; frame-ancestors 'none'; report-uri /api/security/csp-report",
    "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  };
  const goodHeaders = await startHeaderProbeServer(requiredHeaders);
  process.env.APP_URL = goodHeaders.url;
  const goodHeadersBody = await loadAdminHealth(reportDir);
  assert.ok(goodHeadersBody.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "security_headers" &&
    check.status === "ok" &&
    check.message.includes("enforced CSP")
  ));
  await closeServer(goodHeaders.server);
  delete process.env.APP_URL;
  delete process.env.AUDITPRO_ALLOW_LOCAL_HEALTH_PROBE;

  const healthSource = readFileSync(join(process.cwd(), "lib", "production-health.ts"), "utf8");
  assert.match(healthSource, /resolvePublicUrl/);
  assert.match(healthSource, /pinnedPublicUrlDispatcher/);
  assert.match(healthSource, /process\.env\.NODE_ENV !== "production"/);
  assert.match(healthSource, /id:\s*"ai_accounting_failures"/);
  assert.match(healthSource, /unresolvedAiAccountingFailures > 0 \? "error" : "ok"/);

  const freshBackupDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-backup-fresh-"));
  process.env.AUDITPRO_BACKUP_DIR = freshBackupDir;
  writeFileSync(join(freshBackupDir, "auditpro-fresh.sql"), "CREATE TABLE backup_probe(id int);\n", "utf8");
  const freshBackupBody = await loadAdminHealth(reportDir);
  assert.equal(freshBackupBody.backup.status, "fresh");
  assert.ok(freshBackupBody.backup.sizeBytes > 0);
  assert.ok(freshBackupBody.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "backup" &&
    check.status === "ok" &&
    check.message.includes("fresh")
  ));

  const staleBackupDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-backup-stale-"));
  const staleBackupPath = join(staleBackupDir, "auditpro-stale.sql");
  process.env.AUDITPRO_BACKUP_DIR = staleBackupDir;
  writeFileSync(staleBackupPath, "CREATE TABLE backup_probe(id int);\n", "utf8");
  const staleBackupTime = new Date(Date.now() - 48 * 60 * 60 * 1000);
  utimesSync(staleBackupPath, staleBackupTime, staleBackupTime);
  const staleBackupBody = await loadAdminHealth(reportDir);
  assert.equal(staleBackupBody.backup.status, "stale");
  assert.ok(staleBackupBody.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "backup" &&
    check.status === "warning" &&
    check.message.includes("freshness window")
  ));

  const overrideBackupDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-backup-override-"));
  const overrideBackupPath = join(overrideBackupDir, "auditpro-override.sql");
  process.env.AUDITPRO_BACKUP_DIR = overrideBackupDir;
  writeFileSync(overrideBackupPath, "CREATE TABLE backup_probe(id int);\n", "utf8");
  const overrideBackupTime = new Date(Date.now() - 2 * 60 * 60 * 1000);
  utimesSync(overrideBackupPath, overrideBackupTime, overrideBackupTime);
  process.env.AUDITPRO_BACKUP_MAX_AGE_MS = String(60 * 60 * 1000);
  const shortBackupOverrideBody = await loadAdminHealth(reportDir);
  assert.equal(shortBackupOverrideBody.backup.status, "stale");
  process.env.AUDITPRO_BACKUP_MAX_AGE_MS = String(3 * 60 * 60 * 1000);
  const longBackupOverrideBody = await loadAdminHealth(reportDir);
  assert.equal(longBackupOverrideBody.backup.status, "fresh");
  delete process.env.AUDITPRO_BACKUP_MAX_AGE_MS;

  process.env.AUDITPRO_BACKUP_DIR = missingBackupDir;

  process.env.AUDITPRO_DEFAULT_PLAN = "starter";
  const invalidPlanBody = await loadAdminHealth(reportDir);
  assert.equal(invalidPlanBody.status, "error");
  assert.ok(invalidPlanBody.checks.some((check: { id: string; status: string }) =>
    check.id === "default_plan" &&
    check.status === "error"
  ));
  process.env.AUDITPRO_DEFAULT_PLAN = "pro";

  process.env.AUDITPRO_AI_INPUT_EUR_PER_1K = "0";
  process.env.AUDITPRO_AI_OUTPUT_EUR_PER_1K = "free";
  const invalidCostBody = await loadAdminHealth(reportDir);
  assert.equal(invalidCostBody.status, "error");
  assert.ok(invalidCostBody.checks.some((check: { id: string; status: string }) =>
    check.id === "ai_cost_rates" &&
    check.status === "error"
  ));
  process.env.AUDITPRO_AI_INPUT_EUR_PER_1K = "0.002";
  process.env.AUDITPRO_AI_OUTPUT_EUR_PER_1K = "0.006";

  process.env.AUDITPRO_REQUIRE_PDF_RENDER = "maybe";
  const invalidPdfGateBody = await loadAdminHealth(reportDir);
  assert.equal(invalidPdfGateBody.status, "error");
  assert.ok(invalidPdfGateBody.checks.some((check: { id: string; status: string }) =>
    check.id === "pdf_render_gate" &&
    check.status === "error"
  ));
  process.env.AUDITPRO_REQUIRE_PDF_RENDER = "true";

  process.env.AUDITPRO_AI_VISIBILITY_ENABLED = "true";
  process.env.AI_GATEWAY_API_KEY = "live-ai-gateway-key-123456";
  process.env.AUDITPRO_AI_OPENAI_MODEL = "openai/gpt-5.6-luna";
  process.env.AUDITPRO_AI_GEMINI_MODEL = "replace-with-model";
  process.env.AUDITPRO_AI_PERPLEXITY_MODEL = "perplexity/sonar";
  process.env.AUDITPRO_AI_CLAUDE_MODEL = "anthropic/claude-sonnet-4.6";
  const placeholderModelBody = await loadAdminHealth(reportDir);
  assert.equal(placeholderModelBody.status, "error");
  assert.ok(placeholderModelBody.checks.some((check: { id: string; status: string }) =>
    check.id === "ai_models" &&
    check.status === "error"
  ));
  process.env.AUDITPRO_AI_GEMINI_MODEL = "";
  const missingModelBody = await loadAdminHealth(reportDir);
  assert.equal(missingModelBody.status, "error");
  assert.ok(missingModelBody.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "ai_models" &&
    check.status === "error" &&
    check.message.includes("must all be configured")
  ));
  process.env.AUDITPRO_AI_VISIBILITY_ENABLED = "false";

  const missingReportDir = join(tmpdir(), `auditpro-admin-health-missing-${Date.now()}`);
  const missingBody = await loadAdminHealth(missingReportDir);
  assert.equal(missingBody.launch.status, "missing");
  assert.ok(missingBody.checks.some((check: { id: string; status: string }) => check.id === "launch_readiness" && check.status === "warning"));

  const emptyReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-empty-"));
  const emptyBody = await loadAdminHealth(emptyReportDir);
  assert.equal(emptyBody.launch.status, "missing");

  const malformedReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-malformed-"));
  writeFileSync(join(malformedReportDir, "launch-readiness-bad.json"), "{not json", "utf8");
  const malformedBody = await loadAdminHealth(malformedReportDir);
  assert.equal(malformedBody.launch.status, "missing");

  const failedReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-failed-"));
  writeFileSync(join(failedReportDir, "launch-readiness-failed.json"), JSON.stringify({
    status: "failed",
    failedScript: "test:admin-health-flow",
    durationMs: 1234,
    steps: [
      { script: "test:preflight", status: "passed" },
      { script: "test:admin-health-flow", status: "failed" },
    ],
  }), "utf8");
  const failedBody = await loadAdminHealth(failedReportDir);
  assert.equal(failedBody.status, "error");
  assert.equal(failedBody.launch.status, "failed");
  assert.equal(failedBody.launch.failedScript, "test:admin-health-flow");
  assert.ok(failedBody.checks.some((check: { id: string; status: string }) => check.id === "launch_readiness" && check.status === "error"));

  const staleReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-stale-"));
  writeFileSync(join(staleReportDir, "launch-readiness-stale.json"), JSON.stringify({
    status: "passed",
    finishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    durationMs: 1234,
    steps: [{ script: "test:smoke", status: "passed" }],
  }), "utf8");
  const staleBody = await loadAdminHealth(staleReportDir);
  assert.equal(staleBody.launch.status, "passed");
  assert.ok(staleBody.launch.ageMs > 24 * 60 * 60 * 1000);
  assert.ok(staleBody.checks.some((check: { id: string; status: string; message: string }) =>
    check.id === "launch_readiness" &&
    check.status === "warning" &&
    check.message.includes("freshness window")
  ));

  const overrideReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-override-"));
  writeFileSync(join(overrideReportDir, "launch-readiness-override.json"), JSON.stringify({
    status: "passed",
    finishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    durationMs: 1234,
    steps: [{ script: "test:smoke", status: "passed" }],
  }), "utf8");
  process.env.AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS = String(60 * 60 * 1000);
  const shortOverrideBody = await loadAdminHealth(overrideReportDir);
  assert.ok(shortOverrideBody.checks.some((check: { id: string; status: string }) =>
    check.id === "launch_readiness" &&
    check.status === "warning"
  ));
  process.env.AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS = String(3 * 60 * 60 * 1000);
  const longOverrideBody = await loadAdminHealth(overrideReportDir);
  assert.ok(longOverrideBody.checks.some((check: { id: string; status: string }) =>
    check.id === "launch_readiness" &&
    check.status === "ok"
  ));
  delete process.env.AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS;

  const unsafeFailedReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-unsafe-"));
  writeFileSync(join(unsafeFailedReportDir, "launch-readiness-unsafe.json"), JSON.stringify({
    status: "failed",
    failedScript: "DATABASE_URL=secret ".repeat(20),
    steps: [{ status: "failed" }],
  }), "utf8");
  const unsafeFailedBody = await loadAdminHealth(unsafeFailedReportDir);
  assert.equal(unsafeFailedBody.launch.failedScript, undefined);
  assert.ok(unsafeFailedBody.checks.some((check: { id: string; message: string }) =>
    check.id === "launch_readiness" &&
    check.message.includes("unknown step") &&
    !check.message.includes("DATABASE_URL")
  ));

  const latestReportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-latest-"));
  const olderPath = join(latestReportDir, "launch-readiness-old.json");
  const newerPath = join(latestReportDir, "launch-readiness-new.json");
  writeFileSync(olderPath, JSON.stringify({ status: "failed", failedScript: "test:smoke", steps: [{ status: "failed" }] }), "utf8");
  writeFileSync(newerPath, JSON.stringify({ status: "passed", durationMs: 10, steps: [{ status: "passed" }] }), "utf8");
  const now = new Date();
  const earlier = new Date(now.getTime() - 60_000);
  utimesSync(olderPath, earlier, earlier);
  utimesSync(newerPath, now, now);
  const latestBody = await loadAdminHealth(latestReportDir);
  assert.equal(latestBody.launch.status, "passed");
  assert.equal(latestBody.launch.totalSteps, 1);

  rmSync(reportDir, { force: true, recursive: true });
  rmSync(freshBackupDir, { force: true, recursive: true });
  rmSync(staleBackupDir, { force: true, recursive: true });
  rmSync(overrideBackupDir, { force: true, recursive: true });
  rmSync(emptyReportDir, { force: true, recursive: true });
  rmSync(malformedReportDir, { force: true, recursive: true });
  rmSync(failedReportDir, { force: true, recursive: true });
  rmSync(staleReportDir, { force: true, recursive: true });
  rmSync(overrideReportDir, { force: true, recursive: true });
  rmSync(unsafeFailedReportDir, { force: true, recursive: true });
  rmSync(latestReportDir, { force: true, recursive: true });

  console.log("Admin health fixtures passed.");
}

void main();
