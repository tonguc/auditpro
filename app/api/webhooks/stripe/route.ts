import { recordBillingEvent, syncSubscription } from "@/lib/billing";
import { hasDatabase } from "@/lib/db";
import { errorName, logOperation, operationResponse, requestIdFromHeaders } from "@/lib/operation-log";
import { billingInputFromStripeEvent, checkoutRecordFromStripeEvent, verifyStripeWebhookPayload } from "@/lib/stripe-webhook";

export const runtime = "nodejs";

const maxStripeWebhookBytes = 256 * 1024;
const noStoreHeaders = { "Cache-Control": "no-store" };

async function readBoundedWebhookBody(request: Request) {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxStripeWebhookBytes) return { tooLarge: true, payload: "" };
  if (!request.body) return { tooLarge: false, payload: "" };

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        return {
          tooLarge: false,
          payload: new TextDecoder().decode(Buffer.concat(chunks)),
        };
      }
      total += value.byteLength;
      if (total > maxStripeWebhookBytes) {
        await reader.cancel().catch(() => undefined);
        return { tooLarge: true, payload: "" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  let event;
  try {
    const body = await readBoundedWebhookBody(request);
    if (body.tooLarge) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "stripe.webhook",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "payload_too_large", statusCode: 413 },
      });
      return operationResponse(
        { error: "Stripe webhook payload is too large." },
        { status: 413, headers: noStoreHeaders },
        requestId,
      );
    }
    event = verifyStripeWebhookPayload({
      payload: body.payload,
      signatureHeader: request.headers.get("stripe-signature"),
      secret: process.env.STRIPE_WEBHOOK_SECRET,
    });
  } catch (error) {
    logOperation({
      level: "warn",
      component: "api",
      operation: "stripe.webhook",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "invalid_signature", error: errorName(error), statusCode: 400 },
    });
    return operationResponse(
      { error: "Invalid Stripe webhook." },
      { status: 400, headers: noStoreHeaders },
      requestId,
    );
  }

  if (!hasDatabase()) {
    logOperation({
      level: "error",
      component: "api",
      operation: "stripe.webhook",
      requestId,
      status: "error",
      durationMs: Date.now() - startedAt,
      metadata: { eventType: event.type, outcome: "database_missing", statusCode: 503 },
    });
    return operationResponse(
      { error: "Database is required for Stripe webhooks." },
      { status: 503, headers: noStoreHeaders },
      requestId,
    );
  }

  try {
    const input = billingInputFromStripeEvent(event);
    if (!input) {
      const checkoutRecord = checkoutRecordFromStripeEvent(event);
      if (checkoutRecord) {
        const result = await recordBillingEvent(checkoutRecord);
        logOperation({
          level: "info",
          component: "api",
          operation: "stripe.webhook",
          requestId,
          status: "ok",
          durationMs: Date.now() - startedAt,
          metadata: { eventType: event.type, outcome: "checkout_recorded", duplicate: result.duplicate },
        });
        return operationResponse(
          { received: true, recorded: true, duplicate: result.duplicate },
          { headers: noStoreHeaders },
          requestId,
        );
      }
      logOperation({
        level: "info",
        component: "api",
        operation: "stripe.webhook",
        requestId,
        status: "ok",
        durationMs: Date.now() - startedAt,
        metadata: { eventType: event.type, outcome: "ignored" },
      });
      return operationResponse({ received: true, ignored: true }, { headers: noStoreHeaders }, requestId);
    }
    const result = await syncSubscription(input);
    logOperation({
      level: "info",
      component: "api",
      operation: "stripe.webhook",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: { eventType: event.type, outcome: "subscription_synced", duplicate: result.duplicate },
    });
    return operationResponse({ received: true, ...result }, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    logOperation({
      level: "warn",
      component: "api",
      operation: "stripe.webhook",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { eventType: event.type, error: errorName(error), statusCode: 400 },
    });
    if (error instanceof Error && /missing organization metadata/i.test(error.message)) {
      await recordBillingEvent({
        provider: "stripe",
        eventId: `${event.id}:dead_letter`,
        payload: {
          outcome: "dead_letter",
          reason: error.message,
          stripeEventId: event.id,
          stripeEventType: event.type,
        },
      }).catch(() => undefined);
    }
    return operationResponse(
      { error: error instanceof Error ? error.message : "Stripe webhook sync failed." },
      { status: 400, headers: noStoreHeaders },
      requestId,
    );
  }
}
