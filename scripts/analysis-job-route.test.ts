import assert from "node:assert/strict";

async function main() {
  const { hasUnlimitedPilotPageAnalysis } = await import("../lib/pilot-policy");
  assert.equal(hasUnlimitedPilotPageAnalysis({ AUDITPRO_DEPLOYMENT_MODE: "pilot", AUDITPRO_PILOT_UNLIMITED_PAGES: "true" }), true);
  assert.equal(hasUnlimitedPilotPageAnalysis({ AUDITPRO_DEPLOYMENT_MODE: "public-test", AUDITPRO_PILOT_UNLIMITED_PAGES: "true" }), false);
  assert.equal(hasUnlimitedPilotPageAnalysis({ AUDITPRO_DEPLOYMENT_MODE: "production", AUDITPRO_PILOT_UNLIMITED_PAGES: "true" }), false);
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousAuthSecret = process.env.BETTER_AUTH_SECRET;
  const previousLogLevel = process.env.AUDITPRO_LOG_LEVEL;
  const previousPublicMode = process.env.AUDITPRO_PUBLIC_ANALYSIS_ENABLED;

  try {
    process.env.AUDITPRO_LOG_LEVEL = "off";
    delete process.env.DATABASE_URL;
    delete process.env.BETTER_AUTH_SECRET;

    const { POST } = await import("../app/api/analyze/jobs/route");

    const invalidJson = await POST(new Request("http://localhost/api/analyze/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }));
    assert.equal(invalidJson.status, 400);
    assert.equal(invalidJson.headers.get("Cache-Control"), "no-store");
    assert.ok(invalidJson.headers.get("x-auditpro-request-id"));
    assert.deepEqual(await invalidJson.json(), { error: "Request body must be valid JSON." });

    const invalidShape = await POST(new Request("http://localhost/api/analyze/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([]),
    }));
    assert.equal(invalidShape.status, 400);
    assert.equal(invalidShape.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await invalidShape.json(), { error: "Request body must be a JSON object." });

    const missingUrl = await POST(new Request("http://localhost/api/analyze/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    }));
    assert.equal(missingUrl.status, 400);
    assert.equal(missingUrl.headers.get("Cache-Control"), "no-store");
    assert.deepEqual(await missingUrl.json(), { error: "Enter a website domain first." });

    process.env.DATABASE_URL = "postgresql://auditpro:secret@localhost:5432/auditpro";
    process.env.BETTER_AUTH_SECRET = "production-auth-secret-for-analysis-job-route";

    const unauthorizedMalformed = await POST(new Request("http://localhost/api/analyze/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }));
    assert.equal(unauthorizedMalformed.status, 401);
    assert.equal(unauthorizedMalformed.headers.get("Cache-Control"), "no-store");
    assert.ok(unauthorizedMalformed.headers.get("x-auditpro-request-id"));

    process.env.AUDITPRO_PUBLIC_ANALYSIS_ENABLED = "true";
    const publicMalformed = await POST(new Request("http://localhost/api/analyze/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{",
    }));
    assert.equal(publicMalformed.status, 400, "explicit public mode must bypass account authentication");
    assert.deepEqual(await publicMalformed.json(), { error: "Request body must be valid JSON." });
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
    if (previousPublicMode === undefined) {
      delete process.env.AUDITPRO_PUBLIC_ANALYSIS_ENABLED;
    } else {
      process.env.AUDITPRO_PUBLIC_ANALYSIS_ENABLED = previousPublicMode;
    }
  }

  console.log("Analysis job route fixtures passed.");
}

void main();
