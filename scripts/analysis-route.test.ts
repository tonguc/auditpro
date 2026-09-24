import assert from "node:assert/strict";

import { internalAnalysisToken } from "../lib/internal-analysis";

async function main() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousAuthSecret = process.env.BETTER_AUTH_SECRET;
  const previousLogLevel = process.env.AUDITPRO_LOG_LEVEL;

  try {
    process.env.AUDITPRO_LOG_LEVEL = "off";
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;

    const { POST } = await import("../app/api/analyze/route");

    const invalidJson = await POST(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }));
    assert.equal(invalidJson.status, 400);
    assert.equal(invalidJson.headers.get("Cache-Control"), "no-store");
    assert.ok(invalidJson.headers.get("x-auditpro-request-id"));
    assert.deepEqual(await invalidJson.json(), { error: "Request body must be valid JSON." });

    const invalidShape = await POST(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    }));
    assert.equal(invalidShape.status, 400);
    assert.equal(invalidShape.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await invalidShape.json(), { error: "Request body must be a JSON object." });

    const missingUrl = await POST(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    assert.equal(missingUrl.status, 400);
    assert.equal(missingUrl.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await missingUrl.json(), { error: "Enter a website domain first." });

    const privateUrl = await POST(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: "http://127.0.0.1" }),
    }));
    assert.equal(privateUrl.status, 400);
    assert.equal(privateUrl.headers.get("Cache-Control"), "no-store");

    // A2 (P1 plan): a redirect hop must satisfy the same address policy as the
    // start URL. The public literal passes the SSRF validator and fetch is
    // intercepted, so no network is used. Refusing an upstream redirect
    // answers 502 (upstream behaviour), while the client-supplied address
    // above stayed 400.
    const nativeFetch = globalThis.fetch;
    try {
      globalThis.fetch = (async () => new Response(null, {
        status: 301,
        headers: { location: "https://93.184.216.34:8443/target" },
      })) as typeof fetch;
      const redirectPort = await POST(new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: "https://93.184.216.34/start" }),
      }));
      assert.equal(redirectPort.status, 502);
      const redirectPayload = await redirectPort.json();
      assert.match(redirectPayload.error, /redirected to a non-standard web port/);
    } finally {
      globalThis.fetch = nativeFetch;
    }

    process.env.DATABASE_URL = "postgresql://auditpro:secret@localhost:5432/auditpro";
    process.env.BETTER_AUTH_SECRET = "production-auth-secret-for-analysis-route";

    const unauthorizedMalformed = await POST(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }));
    assert.equal(unauthorizedMalformed.status, 401);
    assert.equal(unauthorizedMalformed.headers.get("Cache-Control"), "no-store");
    assert.ok(unauthorizedMalformed.headers.get("x-auditpro-request-id"));

    const internalMalformed = await POST(new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auditpro-internal": internalAnalysisToken,
      },
      body: "{",
    }));
    assert.equal(internalMalformed.status, 400);
    assert.equal(internalMalformed.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await internalMalformed.json(), { error: "Request body must be valid JSON." });
  } finally {
    if (previousDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = previousDatabaseUrl;
    }
    if (previousAuthSecret === undefined) {
      delete process.env.BETTER_AUTH_SECRET;
    } else {
      process.env.BETTER_AUTH_SECRET = previousAuthSecret;
    }
    if (previousLogLevel === undefined) {
      delete process.env.AUDITPRO_LOG_LEVEL;
    } else {
      process.env.AUDITPRO_LOG_LEVEL = previousLogLevel;
    }
  }

  console.log("Analysis route fixtures passed.");
}

void main();
