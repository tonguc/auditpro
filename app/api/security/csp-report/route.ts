import { NextResponse } from "next/server";

import { AUDITPRO_REQUEST_ID_HEADER, logOperation, requestIdFromHeaders } from "@/lib/operation-log";
import { recordSecurityFailure } from "@/lib/security-rate-limit";

export const runtime = "nodejs";

const maxReportBytes = 32 * 1024;
const reportRateLimit = {
  windowMs: 60 * 1000,
  maxAttempts: 60,
};

async function readBoundedBody(request: Request) {
  if (!request.body) return { tooLarge: false, payload: "" };
  const reader = request.body.getReader();
  let total = 0;
  const chunks: Uint8Array[] = [];

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
      if (total > maxReportBytes) {
        await reader.cancel().catch(() => undefined);
        return { tooLarge: true, payload: "" };
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
}

function stringField(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, 120) : undefined;
}

function blockedSourceClass(value: unknown) {
  const raw = typeof value === "string" && value.trim() ? value.trim() : undefined;
  if (!raw) return undefined;
  if (raw === "inline" || raw === "eval") return raw;
  if (raw === "data" || raw.startsWith("data:")) return "data";
  if (raw === "blob" || raw.startsWith("blob:")) return "blob";
  try {
    const parsed = new URL(raw);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1"
        ? `local_${parsed.protocol.slice(0, -1)}`
        : `external_${parsed.protocol.slice(0, -1)}`;
    }
    return "external_other";
  } catch {
    return "unparseable";
  }
}

function cspReportMetadata(payload: string) {
  if (!payload.trim()) return {};
  try {
    const parsed = JSON.parse(payload) as { "csp-report"?: Record<string, unknown> };
    const report = parsed["csp-report"];
    if (!report || typeof report !== "object") return {};
    return {
      effectiveDirective: stringField(report["effective-directive"]),
      violatedDirective: stringField(report["violated-directive"]),
      disposition: stringField(report.disposition),
      blockedSource: blockedSourceClass(report["blocked-uri"]),
    };
  } catch {
    return { parseError: true };
  }
}

function tooLargeResponse(requestId: string, startedAt: number) {
  logOperation({
    level: "warn",
    component: "api",
    operation: "security.csp_report",
    requestId,
    status: "warning",
    durationMs: Date.now() - startedAt,
    metadata: { outcome: "too_large", statusCode: 413 },
  });
  return NextResponse.json(
    { error: "CSP report is too large." },
    {
      status: 413,
      headers: {
        "Cache-Control": "no-store",
        [AUDITPRO_REQUEST_ID_HEADER]: requestId,
      },
    },
  );
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  const rateLimit = recordSecurityFailure(request, "csp-report", reportRateLimit);
  if (rateLimit.limited) {
    logOperation({
      level: "warn",
      component: "api",
      operation: "security.csp_report",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "rate_limited", statusCode: 429 },
    });
    return NextResponse.json(
      { error: "Too many CSP reports." },
      {
        status: 429,
        headers: {
          "Cache-Control": "no-store",
          [AUDITPRO_REQUEST_ID_HEADER]: requestId,
          "Retry-After": String(rateLimit.retryAfter),
        },
      },
    );
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > maxReportBytes) return tooLargeResponse(requestId, startedAt);

  const body = await readBoundedBody(request);
  if (body.tooLarge) return tooLargeResponse(requestId, startedAt);

  logOperation({
    level: "info",
    component: "api",
    operation: "security.csp_report",
    requestId,
    status: "ok",
    durationMs: Date.now() - startedAt,
    metadata: { statusCode: 204, ...cspReportMetadata(body.payload) },
  });
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Cache-Control": "no-store",
      [AUDITPRO_REQUEST_ID_HEADER]: requestId,
    },
  });
}
