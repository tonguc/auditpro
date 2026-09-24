import assert from "node:assert/strict";

async function main() {
  process.env.AUDITPRO_LOG_LEVEL = "off";
  process.env.AUDITPRO_BILLING_SYNC_SECRET = "test-secret";
  delete process.env.DATABASE_URL;

  const { POST } = await import("../app/api/billing/sync/route");
  const payload = {
    organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
    provider: "stripe",
    providerSubscriptionId: "sub_123",
    providerPriceId: "price_pro",
    status: "active",
  };

  const unauthorized = await POST(new Request("http://localhost/api/billing/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  }));
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get("Cache-Control"), "no-store");

  const malformed = await POST(new Request("http://localhost/api/billing/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auditpro-billing-secret": "test-secret" },
    body: "{",
  }));
  assert.equal(malformed.status, 400);
  assert.equal(malformed.headers.get("Cache-Control"), "no-store");
  assert.ok(malformed.headers.get("x-auditpro-request-id"));
  assert.deepEqual(await malformed.json(), { error: "Request body must be valid JSON." });

  const invalidShape = await POST(new Request("http://localhost/api/billing/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auditpro-billing-secret": "test-secret" },
    body: JSON.stringify([]),
  }));
  assert.equal(invalidShape.status, 400);
  assert.equal(invalidShape.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await invalidShape.json(), { error: "Request body must be a JSON object." });

  const noDatabase = await POST(new Request("http://localhost/api/billing/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-auditpro-billing-secret": "test-secret" },
    body: JSON.stringify(payload),
  }));
  assert.equal(noDatabase.status, 503);
  assert.equal(noDatabase.headers.get("Cache-Control"), "no-store");

  console.log("Billing route fixtures passed.");
}

void main();
