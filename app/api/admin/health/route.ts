import { authorizedAdminRequest } from "@/lib/admin-auth";
import { errorName, logOperation, operationResponse, requestIdFromHeaders } from "@/lib/operation-log";
import { getProductionHealth } from "@/lib/production-health";
import { recordSecurityFailure } from "@/lib/security-rate-limit";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  if (!authorizedAdminRequest(request)) {
    const rateLimit = recordSecurityFailure(request, "admin-health");
    if (rateLimit.limited) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "admin.health",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "rate_limited", statusCode: 429 },
      });
      return operationResponse(
        { error: "Too many admin authentication attempts." },
        {
          status: 429,
          headers: {
            "Cache-Control": "no-store",
            "Retry-After": String(rateLimit.retryAfter),
          },
        },
        requestId,
      );
    }
    logOperation({
      level: "warn",
      component: "api",
      operation: "admin.health",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "unauthorized", statusCode: 401 },
    });
    return operationResponse(
      { error: "Admin health is not authorized." },
      {
        status: 401,
        headers: {
          "Cache-Control": "no-store",
        },
      },
      requestId,
    );
  }

  try {
    const health = await getProductionHealth();
    logOperation({
      level: health.status === "error" ? "error" : health.status === "warning" ? "warn" : "info",
      component: "api",
      operation: "admin.health",
      requestId,
      status: health.status,
      durationMs: Date.now() - startedAt,
      metadata: {
        checks: health.checks.length,
        databaseConfigured: health.runtime.databaseConfigured,
      },
    });
    return operationResponse(health, {
      headers: {
        "Cache-Control": "no-store",
      },
    }, requestId);
  } catch (error) {
    logOperation({
      level: "error",
      component: "api",
      operation: "admin.health",
      requestId,
      status: "error",
      durationMs: Date.now() - startedAt,
      metadata: { error: errorName(error), statusCode: 500 },
    });
    return operationResponse(
      { error: "Admin health check failed." },
      { status: 500, headers: { "Cache-Control": "no-store" } },
      requestId,
    );
  }
}
