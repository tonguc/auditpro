import assert from "node:assert/strict";

import {
  billingInputFromStripeEvent,
  checkoutRecordFromStripeEvent,
  stripeSignatureForPayload,
  verifyStripeWebhookPayload,
  type StripeWebhookEvent,
} from "../lib/stripe-webhook";

const secret = "whsec_test";
const now = 1_800_000_000;
const event: StripeWebhookEvent = {
  id: "evt_123",
  type: "customer.subscription.updated",
  created: now,
  data: {
    object: {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      current_period_end: now + 86_400,
      metadata: { organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3" },
      items: { data: [{ price: { id: "price_agency" } }] },
    },
  },
};
const payload = JSON.stringify(event);
const signature = stripeSignatureForPayload(payload, secret, now);

assert.deepEqual(verifyStripeWebhookPayload({
  payload,
  signatureHeader: signature,
  secret,
  nowSeconds: now,
}), event);
assert.throws(
  () => verifyStripeWebhookPayload({ payload, signatureHeader: signature, secret: "wrong", nowSeconds: now }),
  /verification failed/,
);
assert.throws(
  () => verifyStripeWebhookPayload({ payload, signatureHeader: signature, secret, nowSeconds: now + 301 }),
  /outside tolerance/,
);

const input = billingInputFromStripeEvent(event);
assert.equal(input?.provider, "stripe");
assert.equal(input?.organizationId, "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3");
assert.equal(input?.providerCustomerId, "cus_123");
assert.equal(input?.providerSubscriptionId, "sub_123");
assert.equal(input?.providerPriceId, "price_agency");
assert.equal(input?.status, "active");
assert.equal(input?.providerEventCreated, new Date(now * 1000).toISOString());
assert.equal(input?.eventId, "evt_123");

assert.equal(billingInputFromStripeEvent({ id: "evt_ignore", type: "invoice.payment_succeeded" }), undefined);
assert.throws(
  () => billingInputFromStripeEvent({ id: "evt_missing_org", type: "customer.subscription.updated", data: { object: { id: "sub_123" } } }),
  /missing organization metadata/,
);
assert.throws(
  () => billingInputFromStripeEvent({
    id: "evt_bad",
    type: "customer.subscription.updated",
    data: { object: { metadata: { organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3" } } },
  }),
  /missing a subscription id/,
);

const checkoutEvent: StripeWebhookEvent = {
  id: "evt_checkout",
  type: "checkout.session.completed",
  created: now - 10,
  data: {
    object: {
      id: "cs_123",
      customer: "cus_123",
      subscription: "sub_123",
      payment_status: "paid",
      status: "complete",
      metadata: {
        organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
        priceId: "price_pro",
      },
    },
  },
};
const checkoutInput = billingInputFromStripeEvent(checkoutEvent);
assert.equal(checkoutInput?.organizationId, "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3");
assert.equal(checkoutInput?.providerSubscriptionId, "sub_123");
assert.equal(checkoutInput?.providerCustomerId, "cus_123");
assert.equal(checkoutInput?.providerPriceId, "price_pro");
assert.equal(checkoutInput?.status, "active");
assert.equal(checkoutInput?.eventId, "evt_checkout");
const checkout = checkoutRecordFromStripeEvent(checkoutEvent);
assert.equal(checkout?.organizationId, "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3");
assert.equal(checkout?.payload.stripeSubscriptionId, "sub_123");
assert.equal(checkout?.payload.stripeEventCreated, new Date((now - 10) * 1000).toISOString());
assert.throws(
  () => billingInputFromStripeEvent({
    id: "evt_checkout_missing",
    type: "checkout.session.completed",
    data: { object: { id: "cs_missing", subscription: "sub_123" } },
  }),
  /missing organization metadata/,
);

const unpaidCheckoutInput = billingInputFromStripeEvent({
  id: "evt_checkout_unpaid",
  type: "checkout.session.completed",
  created: now - 5,
  data: {
    object: {
      id: "cs_unpaid",
      customer: "cus_123",
      subscription: "sub_123",
      payment_status: "unpaid",
      metadata: {
        organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
        planId: "agency",
      },
    },
  },
});
assert.equal(unpaidCheckoutInput?.planId, "agency");
assert.equal(unpaidCheckoutInput?.status, "incomplete");

console.log("Stripe webhook fixtures passed.");
