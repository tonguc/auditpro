import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const port = process.env.SMOKE_PORT || "3100";
let baseUrl = process.env.SMOKE_BASE_URL || "http://localhost:3000";
const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");

if (!existsSync(nextBin)) {
  throw new Error("Next.js binary not found. Run npm install first.");
}

let server;

let logs = "";

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForServer() {
  const deadline = Date.now() + 30_000;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return response;
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  throw new Error(`Server did not become ready. Last error: ${lastError?.message || "unknown"}\n${logs}`);
}

async function responseFromExistingServer() {
  try {
    const response = await fetch(baseUrl);
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

function startServer() {
  baseUrl = `http://localhost:${port}`;
  server = spawn(process.execPath, [nextBin, "dev", "-p", port], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout.on("data", (chunk) => {
    logs += chunk.toString();
  });
  server.stderr.on("data", (chunk) => {
    logs += chunk.toString();
  });
}

function assertIncludes(html, needle) {
  if (!html.includes(needle)) {
    throw new Error(`Expected page HTML to include: ${needle}`);
  }
}

try {
  let response = await responseFromExistingServer();
  if (!response) {
    startServer();
    response = await waitForServer();
  }
  const html = await response.text();
  const requiredStrings = [
    "Povlex",
    "Load demo",
    "Export CSV",
    "Export MD",
    "Download PDF",
    "Analyze website",
    "No completed analysis yet",
    "Report",
    "Proposal",
    "Presentation",
    "Settings",
    "QA",
  ];

  for (const value of requiredStrings) assertIncludes(html, value);

  if (html.includes("data-nextjs-dialog")) {
    throw new Error("Next.js error overlay detected in SSR output.");
  }

  const blockedNetworkTargets = [
    "http://localhost",
    "http://127.0.0.1",
    "http://[::1]",
    "http://[::ffff:127.0.0.1]",
  ];
  for (const url of blockedNetworkTargets) {
    const privateNetworkResponse = await fetch(`${baseUrl}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    if (privateNetworkResponse.status !== 400) {
      throw new Error(`Expected ${url} analysis to return 400, received ${privateNetworkResponse.status}.`);
    }
  }

  console.log(`Smoke test passed: ${baseUrl}`);
} finally {
  server?.kill();
}
