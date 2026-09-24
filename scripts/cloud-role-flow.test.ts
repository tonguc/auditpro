import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { chromium, type Browser, type Page, type Route } from "playwright";

type Role = "viewer" | "member" | "owner";
type CloudCall = { method: string; status: number; requestId: string };

const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const mockToken = `cloud-role-${Date.now()}`;
let port = process.env.CLOUD_ROLE_FLOW_PORT || "";
let baseUrl = process.env.CLOUD_ROLE_FLOW_BASE_URL || "";
let server: ChildProcess | undefined;
let logs = "";

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
        if (!address || typeof address === "string") reject(new Error("Unable to allocate a cloud role flow port."));
        else resolve(String(address.port));
      });
    });
  });
}

function startServer() {
  if (!existsSync(nextBin)) throw new Error("Next.js binary not found. Run npm install first.");
  baseUrl = `http://localhost:${port}`;
  server = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      AUDITPRO_E2E_CLOUD_MOCK: "1",
      AUDITPRO_E2E_CLOUD_MOCK_TOKEN: mockToken,
      AUDITPRO_LAUNCH_READINESS: "true",
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
      const response = await fetch(baseUrl);
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

async function installCloudMock(page: Page, role: Role) {
  const calls: CloudCall[] = [];
  await page.route("**/api/audits**", async (route) => {
    const request = route.request();
    const method = request.method();
    if (method === "GET") {
      calls.push({ method, status: 200, requestId: `mock-${role}-get` });
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json", "x-auditpro-request-id": `mock-${role}-get` },
        body: JSON.stringify({ audits: [] }),
      });
      return;
    }
    if (role === "viewer" && (method === "PUT" || method === "DELETE")) {
      calls.push({ method, status: 403, requestId: `mock-${role}-forbidden` });
      await forbidden(route, role);
      return;
    }
    if (method === "PUT" || method === "DELETE") {
      calls.push({ method, status: 200, requestId: `mock-${role}-${method.toLowerCase()}` });
      await route.fulfill({
        status: 200,
        headers: { "content-type": "application/json", "x-auditpro-request-id": `mock-${role}-${method.toLowerCase()}` },
        body: JSON.stringify({ ok: true }),
      });
      return;
    }
    await route.fallback();
  });
  return calls;
}

async function forbidden(route: Route, role: Role) {
  await route.fulfill({
    status: 403,
    headers: { "content-type": "application/json", "x-auditpro-request-id": `mock-${role}-forbidden` },
    body: JSON.stringify({ error: "Viewer accounts cannot modify organization audits." }),
  });
}

async function clickByRole(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name }).first().click();
}

async function assertVisibleText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
}

async function clickDeleteAudit(page: Page) {
  const button = page.locator('button[aria-label="Delete audit"], button[title="Delete audit"]').first();
  await button.waitFor({ state: "visible", timeout: 10_000 });
  await button.click();
}

async function runRoleFlow(browser: Browser, role: Role) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 860 } });
  const calls = await installCloudMock(page, role);
  await page.goto(`${baseUrl}/cloud-role-flow?token=${encodeURIComponent(mockToken)}`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /Load demo/i }).waitFor({ state: "visible", timeout: 15_000 });
  await clickByRole(page, /Load demo/i);
  await assertVisibleText(page, "Example Client");

  if (role === "viewer") {
    await waitForCall(calls, "PUT", 403);
    await assertVisibleText(page, "Example Client");
    await clickDeleteAudit(page);
    await assertVisibleText(page, "Viewer accounts cannot delete cloud audits.");
    await assertVisibleText(page, "Example Client");
    await waitForCall(calls, "DELETE", 403);
  } else {
    await clickByRole(page, /^Action Center$/i);
    await assertVisibleText(page, "Action Center");
    await clickDeleteAudit(page);
    await assertVisibleText(page, "No saved audits yet.");
    await waitForCall(calls, "PUT", 200);
    await waitForCall(calls, "DELETE", 200);
  }
  await page.close();
}

async function waitForCall(calls: CloudCall[], method: string, status: number) {
  const deadline = Date.now() + 10_000;
  while (Date.now() < deadline) {
    if (calls.some((call) => call.method === method && call.status === status && call.requestId.startsWith("mock-"))) return;
    await delay(100);
  }
  throw new Error(`Expected cloud ${method} ${status} call.`);
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
    await runRoleFlow(browser, "viewer");
    await runRoleFlow(browser, "member");
    await runRoleFlow(browser, "owner");
  } finally {
    await browser?.close();
    await stopServer();
  }

  console.log(`Cloud role browser flow passed: ${baseUrl}`);
}

void main();
