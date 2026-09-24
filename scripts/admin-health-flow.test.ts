import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, writeFileSync } from "node:fs";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium, type Browser, type Page } from "playwright";

const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
let port = process.env.ADMIN_HEALTH_FLOW_PORT || "";
let baseUrl = process.env.ADMIN_HEALTH_FLOW_BASE_URL || "";
let server: ChildProcess | undefined;
let logs = "";
const reportDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-flow-report-"));
const backupDir = mkdtempSync(join(tmpdir(), "auditpro-admin-health-flow-backup-"));

const isolatedEnvKeys = [
  "AI_GATEWAY_API_KEY",
  "AUDITPRO_BACKUP_DIR",
  "AUDITPRO_BACKUP_MAX_AGE_MS",
  "AUDITPRO_AI_GEMINI_MODEL",
  "AUDITPRO_AI_INPUT_EUR_PER_1K",
  "AUDITPRO_AI_OPENAI_MODEL",
  "AUDITPRO_AI_OUTPUT_EUR_PER_1K",
  "AUDITPRO_AI_PERPLEXITY_MODEL",
  "AUDITPRO_AI_CLAUDE_MODEL",
  "AUDITPRO_AI_VISIBILITY_ENABLED",
  "AUDITPRO_ALLOW_LOCAL_HEALTH_PROBE",
  "AUDITPRO_BILLING_SYNC_SECRET",
  "AUDITPRO_DEFAULT_PLAN",
  "AUDITPRO_REQUIRE_PDF_RENDER",
  "AUDITPRO_SIGNUP_ENABLED",
  "AUDITPRO_STRIPE_AGENCY_PRICE_ID",
  "AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID",
  "AUDITPRO_STRIPE_PRO_PRICE_ID",
  "BETTER_AUTH_SECRET",
  "BETTER_AUTH_URL",
  "APP_URL",
  "DATABASE_URL",
  "STRIPE_WEBHOOK_SECRET",
  "VERCEL_OIDC_TOKEN",
];

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findFreePort() {
  return await new Promise<string>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => {
        if (!address || typeof address === "string") reject(new Error("Unable to allocate an admin health flow port."));
        else resolve(String(address.port));
      });
    });
  });
}

function startServer() {
  if (!existsSync(nextBin)) throw new Error("Next.js binary not found. Run npm install first.");
  baseUrl = `http://localhost:${port}`;
  writeFileSync(join(reportDir, "launch-readiness-2026-08-27T15-50-31-178Z.json"), JSON.stringify({
    status: "passed",
    finishedAt: new Date().toISOString(),
    durationMs: 107694,
    steps: [
      { script: "test:preflight", status: "passed" },
      { script: "test:admin-health-flow", status: "passed" },
      { script: "test:smoke", status: "passed" },
    ],
  }), "utf8");
  writeFileSync(join(backupDir, "auditpro-flow.sql"), "CREATE TABLE backup_probe(id int);\n", "utf8");
  const env = { ...process.env };
  for (const key of isolatedEnvKeys) delete env[key];
  server = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd: process.cwd(),
    env: {
      ...env,
      AUDITPRO_ADMIN_SECRET: "admin-flow-secret",
      AUDITPRO_BACKUP_DIR: backupDir,
      AUDITPRO_BACKUP_MAX_AGE_MS: "86400000",
      AUDITPRO_DEFAULT_PLAN: "pro",
      AUDITPRO_SIGNUP_ENABLED: "false",
      AUDITPRO_REQUIRE_PDF_RENDER: "true",
      AUDITPRO_AI_INPUT_EUR_PER_1K: "0.002",
      AUDITPRO_AI_OUTPUT_EUR_PER_1K: "0.006",
      AUDITPRO_AI_OPENAI_MODEL: "openai/gpt-5.6-luna",
      AUDITPRO_AI_GEMINI_MODEL: "google/gemini-3.5-flash-lite",
      AUDITPRO_AI_PERPLEXITY_MODEL: "perplexity/sonar",
      AUDITPRO_AI_CLAUDE_MODEL: "anthropic/claude-sonnet-4.6",
      AUDITPRO_AI_VISIBILITY_ENABLED: "false",
      AUDITPRO_LAUNCH_READINESS: "true",
      AUDITPRO_LAUNCH_READINESS_REPORT_DIR: reportDir,
      AUDITPRO_LOG_LEVEL: "off",
      PORT: port,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => {
    logs += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    logs += chunk.toString();
  });
}

async function waitForServer() {
  const deadline = Date.now() + 45_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Owned production server exited before readiness with code ${server.exitCode}.\n${logs}`);
    }
    try {
      const response = await fetch(`${baseUrl}/admin`);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  const message = lastError instanceof Error ? lastError.message : "unknown";
  throw new Error(`Server did not become ready. Last error: ${message}\n${logs}`);
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    server?.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    server?.kill();
  });
}

async function assertVisibleText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
}

async function assertNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  assert.ok(overflow <= 1, `Expected no horizontal overflow, received ${overflow}px.`);
}

async function runAdminFlow(page: Page) {
  await page.goto(`${baseUrl}/admin`, { waitUntil: "domcontentloaded" });
  await assertVisibleText(page, "Production health");
  await page.getByRole("button", { name: /Refresh/i }).click();
  await assertVisibleText(page, "Admin secret is required.");

  await page.getByPlaceholder("AUDITPRO_ADMIN_SECRET").fill("admin-flow-secret");
  await page.getByRole("button", { name: /Refresh/i }).click();
  await assertVisibleText(page, "Launch actions");
  await assertVisibleText(page, "Launch gate");
  await assertVisibleText(page, "Backup");
  await assertVisibleText(page, "3/3 steps");
  await assertVisibleText(page, "old");
  await assertVisibleText(page, "Readiness checks");
  await assertVisibleText(page, "Runtime");
  await assertVisibleText(page, "Billing and AI");
  await assertVisibleText(page, "Usage ledger");
  await assertVisibleText(page, "AUDITPRO_DEFAULT_PLAN is pro.");
  await assertVisibleText(page, "PDF raster verification is required.");
  await assertVisibleText(page, "AI input/output EUR rates are positive.");
  await assertVisibleText(page, "Latest database backup is fresh");
  await assertVisibleText(page, "DATABASE_URL is not configured");
  await assertNoHorizontalOverflow(page);
}

async function main() {
  let browser: Browser | undefined;
  try {
    if (!baseUrl) {
      if (!port) port = await findFreePort();
      startServer();
      await waitForServer();
    }
    browser = await chromium.launch({ headless: true });
    const desktop = await browser.newPage({ viewport: { width: 1280, height: 860 } });
    await runAdminFlow(desktop);
    await desktop.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await runAdminFlow(mobile);
    await mobile.close();
  } finally {
    await browser?.close();
    await stopServer();
  }

  console.log(`Admin health browser flow passed: ${baseUrl}`);
}

void main();
