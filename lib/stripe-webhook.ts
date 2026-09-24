import { createHmac, timingSafeEqual } from "node:crypto";

import { isSubscriptionStatus, type BillingSyncInput, type SubscriptionStatus } from "@/lib/billing";
import { isPlanId } from "@/lib/plans";

export type StripeWebhookEvent = {
  id: string;
  type: string;
  created?: number;
  data?: { object?: unknown };
};

export type StripeCheckoutRecord = {
  provider: "stripe";
  eventId: string;
  organizationId?: string;
  payload: Record<string, unknown>;
};

type StripeSubscriptionObject = {
  id?: unknown;
  customer?: unknown;
  status?: unknown;
  current_period_end?: unknown;
  metadata?: Record<string, unknown>;
  items?: { data?: Array<{ price?: { id?: unknown } }> };
};

type StripeCheckoutSessionObject = {
  id?: unknown;
  customer?: unknown;
  subscription?: unknown;
  payment_status?: unknown;
  status?: unknown;
  metadata?: Record<string, unknown>;
};

const DEFAULT_TOLERANCE_SECONDS = 300;
const subscriptionEvents = new Set([
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
]);

function parseStripeSignatureHeader(header: string) {
  const pairs = header.split(",").map((part) => part.trim().split("="));
  const timestamp = pairs.find(([key]) => key === "t")?.[1];
  const signatures = pairs.filter(([key]) => key === "v1").map(([, value]) => value).filter(Boolean);
  if (!timestamp || !signatures.length) throw new Error("Invalid Stripe signature header.");
  return { timestamp, signatures };
}

function safeEqualHex(left: string, right: string) {
  const leftBuffer = Buffer.from(left, "hex");
  const rightBuffer = Buffer.from(right, "hex");
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function stripeSignatureForPayload(payload: string, secret: string, timestamp = Math.floor(Date.now() / 1000)) {
  const signedPayload = `${timestamp}.${payload}`;
  const signature = createHmac("sha256", secret).update(signedPayload).digest("hex");
  return `t=${timestamp},v1=${signature}`;
}

export function verifyStripeWebhookPayload(input: {
  payload: string;
  signatureHeader: string | null;
  secret: string | undefined;
  nowSeconds?: number;
  toleranceSeconds?: number;
}) {
  if (!input.secret) throw new Error("Stripe webhook secret is not configured.");
  if (!input.signatureHeader) throw new Error("Stripe signature header is missing.");
  const { timestamp, signatures } = parseStripeSignatureHeader(input.signatureHeader);
  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) throw new Error("Invalid Stripe signature timestamp.");
  const nowSeconds = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  const toleranceSeconds = input.toleranceSeconds ?? DEFAULT_TOLERANCE_SECONDS;
  if (Math.abs(nowSeconds - timestampSeconds) > toleranceSeconds) throw new Error("Stripe signature timestamp is outside tolerance.");

  const expected = createHmac("sha256", input.secret).update(`${timestamp}.${input.payload}`).digest("hex");
  if (!signatures.some((signature) => safeEqualHex(signature, expected))) {
    throw new Error("Stripe signature verification failed.");
  }
  try {
    return JSON.parse(input.payload) as StripeWebhookEvent;
  } catch {
    throw new Error("Stripe webhook payload is not valid JSON.");
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function statusFromStripe(value: unknown): SubscriptionStatus {
  if (isSubscriptionStatus(value)) return value;
  return "inactive";
}

function periodEndFromStripe(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? new Date(value * 1000).toISOString()
    : undefined;
}

function eventCreatedAt(event: StripeWebhookEvent) {
  return typeof event.created === "number" && Number.isFinite(event.created)
    ? new Date(event.created * 1000).toISOString()
    : undefined;
}

function metadataPlan(metadata: Record<string, unknown> | undefined) {
  const planId = stringValue(metadata?.planId);
  return isPlanId(planId) ? planId : undefined;
}

function metadataPriceId(metadata: Record<string, unknown> | undefined) {
  return stringValue(metadata?.priceId) ?? stringValue(metadata?.providerPriceId);
}

function checkoutSubscriptionStatus(session: StripeCheckoutSessionObject | undefined): SubscriptionStatus {
  const paymentStatus = stringValue(session?.payment_status);
  if (paymentStatus === "paid" || paymentStatus === "no_payment_required") return "active";
  return "incomplete";
}

export function billingInputFromStripeEvent(event: StripeWebhookEvent): BillingSyncInput | undefined {
  if (subscriptionEvents.has(event.type)) {
    const subscription = event.data?.object as StripeSubscriptionObject | undefined;
    const metadata = subscription?.metadata;
    const organizationId = stringValue(metadata?.organizationId);
    const providerSubscriptionId = stringValue(subscription?.id);
    if (!organizationId) throw new Error("Stripe subscription event is missing organization metadata.");
    if (!providerSubscriptionId) throw new Error("Stripe subscription event is missing a subscription id.");
    return {
      organizationId,
      provider: "stripe",
      providerCustomerId: stringValue(subscription?.customer),
      providerSubscriptionId,
      providerPriceId: stringValue(subscription?.items?.data?.[0]?.price?.id),
      planId: metadataPlan(metadata),
      status: event.type === "customer.subscription.deleted" ? "canceled" : statusFromStripe(subscription?.status),
      currentPeriodEnd: periodEndFromStripe(subscription?.current_period_end),
      providerEventCreated: eventCreatedAt(event),
      eventId: event.id,
      metadata: { stripeEventType: event.type },
    };
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data?.object as StripeCheckoutSessionObject | undefined;
    const metadata = session?.metadata;
    const organizationId = stringValue(metadata?.organizationId);
    const providerSubscriptionId = stringValue(session?.subscription);
    if (!organizationId) throw new Error("Stripe checkout session is missing organization metadata.");
    if (!providerSubscriptionId) throw new Error("Stripe checkout session is missing a subscription id.");
    return {
      organizationId,
      provider: "stripe",
      providerCustomerId: stringValue(session?.customer),
      providerSubscriptionId,
      providerPriceId: metadataPriceId(metadata),
      planId: metadataPlan(metadata),
      status: checkoutSubscriptionStatus(session),
      providerEventCreated: eventCreatedAt(event),
      eventId: event.id,
      metadata: {
        stripeEventType: event.type,
        stripeCheckoutSessionId: stringValue(session?.id),
        stripeCheckoutStatus: stringValue(session?.status),
        stripePaymentStatus: stringValue(session?.payment_status),
      },
    };
  }

  return undefined;
}

export function checkoutRecordFromStripeEvent(event: StripeWebhookEvent): StripeCheckoutRecord | undefined {
  if (event.type !== "checkout.session.completed") return undefined;
  const session = event.data?.object as StripeCheckoutSessionObject | undefined;
  const metadata = session?.metadata;
  return {
    provider: "stripe",
    eventId: event.id,
    organizationId: stringValue(metadata?.organizationId),
    payload: {
      stripeEventType: event.type,
      stripeEventCreated: eventCreatedAt(event),
      stripeCheckoutSessionId: stringValue(session?.id),
      stripeCustomerId: stringValue(session?.customer),
      stripeSubscriptionId: stringValue(session?.subscription),
      metadata: metadata ?? {},
    },
  };
}
