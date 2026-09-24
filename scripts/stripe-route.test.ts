import assert from "node:assert/strict";

import { stripeSignatureForPayload } from "../lib/stripe-webhook";

async function main() {
  process.env.AUDITPRO_LOG_LEVEL = "off";
  process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  delete process.env.DATABASE_URL;

  const { POST } = await import("../app/api/webhooks/stripe/route");
  const payload = JSON.stringify({
    id: "evt_123",
    type: "customer.subscription.updated",
    data: {
      object: {
        id: "sub_123",
        customer: "cus_123",
        status: "active",
        metadata: { organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3" },
        items: { data: [{ price: { id: "price_pro" } }] },
      },
    },
  });

  const invalid = await POST(new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "t=1,v1=bad" },
    body: payload,
  }));
  assert.equal(invalid.status, 400);
  assert.equal(invalid.headers.get("Cache-Control"), "no-store");
  assert.ok(invalid.headers.get("x-auditpro-request-id"));
  assert.deepEqual(await invalid.json(), { error: "Invalid Stripe webhook." });

  const invalidJsonPayload = "{";
  const invalidJson = await POST(new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": stripeSignatureForPayload(invalidJsonPayload, "whsec_test") },
    body: invalidJsonPayload,
  }));
  assert.equal(invalidJson.status, 400);
  assert.equal(invalidJson.headers.get("Cache-Control"), "no-store");
  assert.deepEqual(await invalidJson.json(), { error: "Invalid Stripe webhook." });

  const validNoDb = await POST(new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": stripeSignatureForPayload(payload, "whsec_test") },
    body: payload,
  }));
  assert.equal(validNoDb.status, 503);
  assert.equal(validNoDb.headers.get("Cache-Control"), "no-store");
  assert.ok(validNoDb.headers.get("x-auditpro-request-id"));

  const checkoutPayload = JSON.stringify({
    id: "evt_checkout",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_123",
        customer: "cus_123",
        subscription: "sub_123",
        payment_status: "paid",
        metadata: {
          organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
          priceId: "price_pro",
        },
      },
    },
  });
  const checkoutNoDb = await POST(new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": stripeSignatureForPayload(checkoutPayload, "whsec_test") },
    body: checkoutPayload,
  }));
  assert.equal(checkoutNoDb.status, 503);
  assert.equal(checkoutNoDb.headers.get("Cache-Control"), "no-store");

  const tooLarge = await POST(new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: {
      "Content-Length": String(257 * 1024),
      "stripe-signature": stripeSignatureForPayload(payload, "whsec_test"),
    },
    body: payload,
  }));
  assert.equal(tooLarge.status, 413);
  assert.equal(tooLarge.headers.get("Cache-Control"), "no-store");

  const oversizedChunked = await POST(new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": stripeSignatureForPayload(payload, "whsec_test") },
    body: new Blob(["x".repeat(257 * 1024)]).stream(),
    duplex: "half",
  } as RequestInit));
  assert.equal(oversizedChunked.status, 413);
  assert.equal(oversizedChunked.headers.get("Cache-Control"), "no-store");

  console.log("Stripe route fixtures passed.");
}

void main();
