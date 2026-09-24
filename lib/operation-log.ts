import { createHash } from "node:crypto";

import { NextResponse } from "next/server";

export const AUDITPRO_REQUEST_ID_HEADER = "x-auditpro-request-id";

type LogLevel = "debug" | "info" | "warn" | "error";
type OperationStatus = "ok" | "warning" | "error";
type MetadataValue = null | boolean | number | string | MetadataValue[] | { [key: string]: MetadataValue };

type OperationLogEvent = {
  level: LogLevel;
  component: string;
  operation: string;
  requestId: string;
  status: OperationStatus;
  durationMs?: number;
  metadata?: Record<string, unknown>;
};

const levelRank: Record<LogLevel | "off", number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  off: 50,
};

const sensitiveKeyPattern = /(?:authorization|cookie|password|secret|signature|token|body|payload|email|url)/i;

function configuredLevel() {
  const value = process.env.AUDITPRO_LOG_LEVEL;
  return value === "debug" || value === "info" || value === "warn" || value === "error" || value === "off"
    ? value
    : "info";
}

function shouldLog(level: LogLevel) {
  return levelRank[level] >= levelRank[configuredLevel()];
}

function sanitizeValue(value: unknown, depth = 0): MetadataValue {
  if (value === null || typeof value === "boolean" || typeof value === "number") return value;
  if (typeof value === "string") return value.length > 300 ? `${value.slice(0, 300)}...` : value;
  if (Array.isArray(value)) return value.slice(0, 20).map((item) => sanitizeValue(item, depth + 1));
  if (typeof value === "object" && depth < 2) {
    const sanitized: Record<string, MetadataValue> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>).slice(0, 30)) {
      sanitized[key] = sensitiveKeyPattern.test(key) ? "[redacted]" : sanitizeValue(nestedValue, depth + 1);
    }
    return sanitized;
  }
  return String(value).slice(0, 300);
}

export function stableLogHash(value: string) {
  return createHash("sha256").update(value).digest("hex").slice(0, 16);
}

export function requestIdFromHeaders(headers: Headers) {
  const incoming = headers.get(AUDITPRO_REQUEST_ID_HEADER) || headers.get("x-request-id");
  if (incoming && /^[a-zA-Z0-9._:-]{8,96}$/.test(incoming)) return incoming;
  return crypto.randomUUID();
}

export function operationResponse(
  body: unknown,
  init: ResponseInit | undefined,
  requestId: string,
) {
  const headers = new Headers(init?.headers);
  headers.set(AUDITPRO_REQUEST_ID_HEADER, requestId);
  return NextResponse.json(body, { ...init, headers });
}

export function logOperation(event: OperationLogEvent) {
  if (!shouldLog(event.level)) return;
  const entry = {
    type: "auditpro.operation",
    ts: new Date().toISOString(),
    component: event.component,
    operation: event.operation,
    requestId: event.requestId,
    status: event.status,
    durationMs: event.durationMs,
    metadata: event.metadata ? sanitizeValue(event.metadata) : undefined,
  };
  const line = JSON.stringify(entry);
  if (event.level === "error") {
    console.error(line);
  } else if (event.level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export function errorName(error: unknown) {
  return error instanceof Error ? error.name : "UnknownError";
}
