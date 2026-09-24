import { syncSubscription, validateBillingSyncInput } from "@/lib/billing";
import { hasDatabase } from "@/lib/db";
import { errorName, logOperation, operationResponse, requestIdFromHeaders } from "@/lib/operation-log";
import { safeSecretMatches } from "@/lib/secret-auth";
import { recordSecurityFailure } from "@/lib/security-rate-limit";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

type BillingSyncRequestBody = unknown;

function authorized(request: Request) {
  return safeSecretMatches(
    process.env.AUDITPRO_BILLING_SYNC_SECRET,
    request.headers.get("x-auditpro-billing-secret"),
  );
}

async function parseBillingSyncRequestBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, error: "Request body must be a JSON object." };
    }
    return { ok: true as const, body: body as BillingSyncRequestBody };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  if (!authorized(request)) {
    const rateLimit = recordSecurityFailure(request, "billing-sync");
    if (rateLimit.limited) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "billing.sync",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "rate_limited", statusCode: 429 },
      });
      return operationResponse(
        { error: "Too many billing authentication attempts." },
        {
          status: 429,
          headers: {
            ...noStoreHeaders,
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
        requestId,
      );
    }
    logOperation({
      level: "warn",
      component: "api",
      operation: "billing.sync",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "unauthorized", statusCode: 401 },
    });
    return operationResponse(
      { error: "Billing sync is not authorized." },
      {
        status: 401,
        headers: noStoreHeaders,
      },
      requestId,
    );
  }
  const parsedBody = await parseBillingSyncRequestBody(request);
  if (!parsedBody.ok) {
    logOperation({
      level: "warn",
      component: "api",
      operation: "billing.sync",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "invalid_body", statusCode: 400 },
    });
    return operationResponse({ error: parsedBody.error }, { status: 400, headers: noStoreHeaders }, requestId);
  }
  if (!hasDatabase()) {
    logOperation({
      level: "error",
      component: "api",
      operation: "billing.sync",
      requestId,
      status: "error",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "database_missing", statusCode: 503 },
    });
    return operationResponse(
      { error: "Database is required for billing sync." },
      { status: 503, headers: noStoreHeaders },
      requestId,
    );
  }

  try {
    const input = validateBillingSyncInput(parsedBody.body);
    const result = await syncSubscription(input);
    logOperation({
      level: "info",
      component: "api",
      operation: "billing.sync",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: { provider: input.provider, subscriptionStatus: input.status },
    });
    return operationResponse(result, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    logOperation({
      level: "warn",
      component: "api",
      operation: "billing.sync",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { error: errorName(error), statusCode: 400 },
    });
    return operationResponse(
      { error: error instanceof Error ? error.message : "Billing sync failed." },
      { status: 400, headers: noStoreHeaders },
      requestId,
    );
  }
}
