import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  accessPlanForSubscription,
  billingPricePlanMap,
  isSubscriptionActive,
  planFromBillingInput,
  planFromManualBillingInput,
  validateBillingSyncInput,
} from "../lib/billing";

const env = {
  NODE_ENV: "test",
  AUDITPRO_STRIPE_PRO_PRICE_ID: "price_pro",
  AUDITPRO_STRIPE_AGENCY_PRICE_ID: "price_agency",
  AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID: "price_enterprise",
} satisfies NodeJS.ProcessEnv;

assert.deepEqual(billingPricePlanMap(env), {
  price_pro: "pro",
  price_agency: "agency",
  price_enterprise: "enterprise",
});

assert.equal(planFromBillingInput({ providerPriceId: "price_agency" }, env), "agency");
assert.equal(planFromBillingInput({ planId: "enterprise", providerPriceId: "price_agency" }, env), "agency");
assert.equal(planFromBillingInput({ providerPriceId: "missing" }, env), undefined);
assert.equal(planFromManualBillingInput({ planId: "enterprise" }), "enterprise");

assert.equal(isSubscriptionActive("active"), true);
assert.equal(isSubscriptionActive("trialing"), true);
assert.equal(isSubscriptionActive("past_due"), false);
assert.equal(accessPlanForSubscription("agency", "active"), "agency");
assert.equal(accessPlanForSubscription("agency", "canceled"), "free");

const valid = validateBillingSyncInput({
  organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
  provider: "stripe",
  providerSubscriptionId: "sub_123",
  providerPriceId: "price_pro",
  status: "active",
  currentPeriodEnd: "2026-09-26T00:00:00.000Z",
  providerEventCreated: "2026-08-26T00:00:00.000Z",
  eventId: "evt_123",
});
assert.equal(valid.status, "active");
assert.equal(valid.providerEventCreated, "2026-08-26T00:00:00.000Z");
const billingSource = readFileSync(join(process.cwd(), "lib", "billing.ts"), "utf8");
assert.doesNotMatch(billingSource, /EXCLUDED\.provider_event_created IS NULL/);
assert.match(billingSource, /EXCLUDED\.provider_event_created >= subscriptions\.provider_event_created/);
assert.match(billingSource, /!planId && input\.provider === "stripe" && !isSubscriptionActive\(input\.status\)/);
assert.match(billingSource, /provider_subscription_id = \$2 OR provider = 'stripe'/);
assert.throws(
  () => validateBillingSyncInput({
    organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
    provider: "stripe",
    providerSubscriptionId: "sub_123",
    providerPriceId: "price_pro",
    status: "active",
    providerEventCreated: "not-a-date",
  }),
  /providerEventCreated/,
);

assert.throws(() => validateBillingSyncInput({ provider: "stripe" }), /organizationId/);
assert.throws(
  () => validateBillingSyncInput({
    organizationId: "org",
    provider: "stripe",
    providerSubscriptionId: "sub",
    providerPriceId: "price_pro",
    status: "active",
  }),
  /organizationId must be a UUID/,
);
assert.throws(
  () => validateBillingSyncInput({
    organizationId: "4d1b2015-30c1-40d2-b5c3-b08f4b8616c3",
    provider: "stripe",
    providerSubscriptionId: "sub",
    status: "unknown",
  }),
  /Unsupported subscription status/,
);

console.log("Billing sync fixtures passed.");
