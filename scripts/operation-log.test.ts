import assert from "node:assert/strict";

import {
  AUDITPRO_REQUEST_ID_HEADER,
  logOperation,
  operationResponse,
  requestIdFromHeaders,
  stableLogHash,
} from "../lib/operation-log";

const oldLevel = process.env.AUDITPRO_LOG_LEVEL;
const lines: string[] = [];
const oldLog = console.log;
const oldWarn = console.warn;
const oldError = console.error;

try {
  console.log = (line?: unknown) => { lines.push(String(line)); };
  console.warn = (line?: unknown) => { lines.push(String(line)); };
  console.error = (line?: unknown) => { lines.push(String(line)); };

  process.env.AUDITPRO_LOG_LEVEL = "info";

  const requestId = requestIdFromHeaders(new Headers({ "x-request-id": "req_12345678" }));
  assert.equal(requestId, "req_12345678");
  assert.notEqual(requestIdFromHeaders(new Headers({ "x-request-id": "bad secret" })), "bad secret");

  logOperation({
    level: "info",
    component: "api",
    operation: "fixture",
    requestId,
    status: "ok",
    durationMs: 12,
    metadata: {
      safe: "visible",
      authorization: "Bearer should-not-leak",
      nested: { stripeSignature: "should-not-leak", count: 1 },
      longValue: "x".repeat(350),
    },
  });
  logOperation({
    level: "debug",
    component: "api",
    operation: "suppressed",
    requestId,
    status: "ok",
  });

  assert.equal(lines.length, 1);
  assert.ok(!lines[0].includes("should-not-leak"));
  assert.ok(!lines[0].includes("Bearer"));
  assert.match(lines[0], /\[redacted\]/);
  assert.match(lines[0], /visible/);

  const response = operationResponse({ ok: true }, { status: 202 }, requestId);
  assert.equal(response.status, 202);
  assert.equal(response.headers.get(AUDITPRO_REQUEST_ID_HEADER), requestId);
  assert.equal(stableLogHash("example.com"), stableLogHash("example.com"));
} finally {
  console.log = oldLog;
  console.warn = oldWarn;
  console.error = oldError;
  if (oldLevel === undefined) {
    delete process.env.AUDITPRO_LOG_LEVEL;
  } else {
    process.env.AUDITPRO_LOG_LEVEL = oldLevel;
  }
}

console.log("Operation log fixtures passed.");
