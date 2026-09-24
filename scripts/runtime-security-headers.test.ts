import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { existsSync } from "node:fs";
import { request as httpRequest } from "node:http";
import { request as httpsRequest } from "node:https";
import { createServer } from "node:net";
import { join } from "node:path";

const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const buildIdPath = join(process.cwd(), ".next", "BUILD_ID");
let port = process.env.RUNTIME_SECURITY_HEADERS_PORT || "";
let baseUrl = process.env.RUNTIME_SECURITY_HEADERS_BASE_URL || "";
let server: ChildProcess | undefined;
let logs = "";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runtimeUrl(path: string) {
  return new URL(path, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
}

async function findFreePort() {
  return await new Promise<string>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => {
        if (!address || typeof address === "string") reject(new Error("Unable to allocate a runtime security header port."));
        else resolve(String(address.port));
      });
    });
  });
}

function startServer() {
  if (!existsSync(nextBin)) throw new Error("Next.js binary not found. Run npm install first.");
  if (!existsSync(buildIdPath)) throw new Error("Production build not found. Run npm run build before runtime security header verification.");
  baseUrl = `http://localhost:${port}`;
  server = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd: process.cwd(),
    env: {
      ...process.env,
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

async function fetchRawHeaders(url: string) {
  return await new Promise<string[]>((resolve, reject) => {
    const parsed = new URL(url);
    const client = parsed.protocol === "https:" ? httpsRequest : httpRequest;
    const request = client(parsed, { method: "GET" }, (response) => {
      response.resume();
      response.on("end", () => resolve(response.rawHeaders));
    });
    request.setTimeout(10_000, () => {
      request.destroy(new Error(`Timed out fetching raw headers from ${url}`));
    });
    request.once("error", reject);
    request.end();
  });
}

function assertSingleRawHeader(rawHeaders: string[], path: string, headerName: string) {
  const count = rawHeaders.filter((value, index) =>
    index % 2 === 0 && value.toLowerCase() === headerName.toLowerCase()
  ).length;
  assert.equal(count, 1, `${path} must emit exactly one ${headerName} header`);
}

function assertRuntimeHeaders(response: Response, path: string) {
  const csp = response.headers.get("content-security-policy");
  assert.ok(csp, `${path} must include enforced Content-Security-Policy`);
  assert.equal(response.headers.get("content-security-policy-report-only"), null, `${path} must not include report-only CSP`);
  assert.doesNotMatch(csp, /,\s*(?:default-src|script-src|style-src|img-src|font-src|connect-src|object-src|base-uri|form-action|frame-ancestors|report-uri)\b/, `${path} must not comma-join multiple CSP values`);
  assert.match(csp, /default-src 'self'/, `${path} CSP must define default-src`);
  assert.match(csp, /connect-src 'self'/, `${path} CSP must restrict connect-src`);
  assert.doesNotMatch(csp, /'unsafe-eval'/, `${path} CSP must not allow unsafe-eval`);
  assert.doesNotMatch(csp, /script-src[^;]*blob:/, `${path} CSP must not allow blob scripts`);
  assert.doesNotMatch(csp, /connect-src[^;]*https:/, `${path} CSP must not allow broad HTTPS connect-src`);
  assert.doesNotMatch(csp, /connect-src[^;]*ws:/, `${path} CSP must not allow cleartext WebSocket connect-src`);
  assert.doesNotMatch(csp, /connect-src[^;]*wss:/, `${path} CSP must not allow broad WebSocket connect-src`);
  assert.equal(response.headers.get("strict-transport-security"), "max-age=31536000; includeSubDomains");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.equal(response.headers.get("referrer-policy"), "strict-origin-when-cross-origin");
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)/);
}

async function assertRawRuntimeHeaders(path: string) {
  const rawHeaders = await fetchRawHeaders(runtimeUrl(path));
  for (const headerName of [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy",
    "Permissions-Policy",
  ] as const) {
    assertSingleRawHeader(rawHeaders, path, headerName);
  }
  assert.equal(
    rawHeaders.some((value, index) => index % 2 === 0 && value.toLowerCase() === "content-security-policy-report-only"),
    false,
    `${path} must not emit Content-Security-Policy-Report-Only`,
  );
}

async function main() {
  try {
    if (!baseUrl) {
      if (!port) port = await findFreePort();
      startServer();
      await waitForServer();
    }

    for (const path of ["/", "/api/healthz", "/api/security/csp-report"] as const) {
      const response = await fetch(runtimeUrl(path));
      assertRuntimeHeaders(response, path);
      await assertRawRuntimeHeaders(path);
    }
  } finally {
    await stopServer();
  }

  console.log(`Runtime security header flow passed: ${baseUrl}`);
}

void main();
