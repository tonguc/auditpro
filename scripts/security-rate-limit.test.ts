import assert from "node:assert/strict";

import { resetSecurityRateLimit } from "../lib/security-rate-limit";

async function main() {
  process.env.AUDITPRO_ADMIN_SECRET = "admin-secret";
  process.env.AUDITPRO_BILLING_SYNC_SECRET = "billing-secret";
  process.env.AUDITPRO_TRUSTED_PROXY_HOPS = "1";
  delete process.env.DATABASE_URL;
  resetSecurityRateLimit();

  const { GET: adminHealth } = await import("../app/api/admin/health/route");
  const { POST: billingSync } = await import("../app/api/billing/sync/route");

  for (let index = 0; index < 5; index += 1) {
    const response = await adminHealth(new Request("http://localhost/api/admin/health", {
      headers: { "x-forwarded-for": "203.0.113.10" },
    }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }

  const limitedAdmin = await adminHealth(new Request("http://localhost/api/admin/health", {
    headers: { "x-forwarded-for": "203.0.113.10" },
  }));
  assert.equal(limitedAdmin.status, 429);
  assert.equal(limitedAdmin.headers.get("Cache-Control"), "no-store");
  assert.ok(Number(limitedAdmin.headers.get("Retry-After")) > 0);

  const authorizedAdmin = await adminHealth(new Request("http://localhost/api/admin/health", {
    headers: {
      "x-forwarded-for": "203.0.113.10",
      "x-auditpro-admin-secret": "admin-secret",
    },
  }));
  assert.equal(authorizedAdmin.status, 200);

  // A1 (P1 plan): only the rightmost XFF entry is trusted, so rotating a
  // client-controlled prefix cannot reset the security bucket.
  const spoofedAdmin = await adminHealth(new Request("http://localhost/api/admin/health", {
    headers: { "x-forwarded-for": "198.51.100.7, 203.0.113.10" },
  }));
  assert.equal(spoofedAdmin.status, 429, "rotating the forwarded prefix must not reset the bucket");

  const otherAdminClient = await adminHealth(new Request("http://localhost/api/admin/health", {
    headers: { "x-forwarded-for": "198.51.100.7, 198.51.100.8" },
  }));
  assert.equal(otherAdminClient.status, 401, "a genuinely different client keeps its own bucket");

  for (let index = 0; index < 5; index += 1) {
    const response = await billingSync(new Request("http://localhost/api/billing/sync", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-real-ip": "203.0.113.11",
      },
      body: "{}",
    }));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get("Cache-Control"), "no-store");
  }

  const limitedBilling = await billingSync(new Request("http://localhost/api/billing/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": "203.0.113.11",
    },
    body: "{}",
  }));
  assert.equal(limitedBilling.status, 429);
  assert.ok(Number(limitedBilling.headers.get("Retry-After")) > 0);

  const authorizedBilling = await billingSync(new Request("http://localhost/api/billing/sync", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-real-ip": "203.0.113.11",
      "x-auditpro-billing-secret": "billing-secret",
    },
    body: "{}",
  }));
  assert.equal(authorizedBilling.status, 503);

  console.log("Security rate limit fixtures passed.");
}

void main();
