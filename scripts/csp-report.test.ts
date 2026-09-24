import assert from "node:assert/strict";

import { resetSecurityRateLimit, securityRateLimitBucketCount } from "../lib/security-rate-limit";

async function main() {
  process.env.AUDITPRO_LOG_LEVEL = "info";
  resetSecurityRateLimit();
  const { POST } = await import("../app/api/security/csp-report/route");
  const originalLog = console.log;
  const logLines: string[] = [];
  console.log = (line?: unknown, ...args: unknown[]) => {
    logLines.push(String(line));
    if (args.length) logLines.push(args.map(String).join(" "));
  };

  try {
    const accepted = await POST(new Request("http://localhost/api/security/csp-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/csp-report",
      },
      body: JSON.stringify({
        "csp-report": {
          "document-uri": "https://auditpro.example.com/private/customer?token=secret",
          "blocked-uri": "https://cdn.example.net/path/to/script.js?session=abc",
          "effective-directive": "script-src-elem",
          "violated-directive": "script-src 'self'",
          disposition: "enforce",
        },
      }),
    }));
    assert.equal(accepted.status, 204);
    assert.equal(accepted.headers.get("Cache-Control"), "no-store");
    assert.ok(accepted.headers.get("x-auditpro-request-id"));
    const cspLog = logLines.find((line) => line.includes('"operation":"security.csp_report"') && line.includes('"status":"ok"'));
    assert.ok(cspLog);
    assert.match(cspLog, /"effectiveDirective":"script-src-elem"/);
    assert.match(cspLog, /"violatedDirective":"script-src 'self'"/);
    assert.match(cspLog, /"blockedSource":"external_https"/);
    assert.doesNotMatch(cspLog, /cdn\.example\.net/);
    assert.doesNotMatch(cspLog, /private\/customer/);
    assert.doesNotMatch(cspLog, /session=abc/);

    const classes = [
      ["https://assets.example.com/long/path.js?token=secret", "external_https"],
      ["http://assets.example.com/script.js", "external_http"],
      ["http://localhost:3000/script.js", "local_http"],
      ["https://127.0.0.1/script.js", "local_https"],
      ["ftp://files.example.com/script.js", "external_other"],
      ["inline", "inline"],
      ["eval", "eval"],
      ["data:text/javascript;base64,secret", "data"],
      ["blob:https://auditpro.example.com/secret-id", "blob"],
      ["https://verylong.example.com/" + "a".repeat(240), "external_https"],
      ["not a url", "unparseable"],
    ] as const;

    for (const [blockedUri, expectedClass] of classes) {
      const beforeCount = logLines.length;
      const response = await POST(new Request("http://localhost/api/security/csp-report", {
        method: "POST",
        headers: {
          "Content-Type": "application/csp-report",
        },
        body: JSON.stringify({
          "csp-report": {
            "blocked-uri": blockedUri,
            "effective-directive": "script-src-elem",
            "violated-directive": "script-src 'self'",
            disposition: "enforce",
          },
        }),
      }));
      assert.equal(response.status, 204);
      const classLog = logLines
        .slice(beforeCount)
        .find((line) => line.includes('"operation":"security.csp_report"') && line.includes('"status":"ok"'));
      assert.ok(classLog);
      assert.match(classLog, new RegExp(`"blockedSource":"${expectedClass}"`));
      assert.doesNotMatch(classLog, /assets\.example\.com|files\.example\.com|verylong\.example\.com|secret-id|token=secret/);
    }
  } finally {
    console.log = originalLog;
    process.env.AUDITPRO_LOG_LEVEL = "off";
  }

  const tooLarge = await POST(new Request("http://localhost/api/security/csp-report", {
    method: "POST",
    headers: {
      "Content-Length": String(33 * 1024),
      "Content-Type": "application/csp-report",
    },
    body: "{}",
  }));
  assert.equal(tooLarge.status, 413);
  assert.equal(tooLarge.headers.get("Cache-Control"), "no-store");
  assert.ok(tooLarge.headers.get("x-auditpro-request-id"));
  const body = await tooLarge.json();
  assert.deepEqual(body, { error: "CSP report is too large." });

  const oversizedChunked = await POST(new Request("http://localhost/api/security/csp-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/csp-report",
    },
    body: new Blob(["x".repeat(33 * 1024)]).stream(),
    duplex: "half",
  } as RequestInit));
  assert.equal(oversizedChunked.status, 413);
  assert.equal(oversizedChunked.headers.get("Cache-Control"), "no-store");
  assert.ok(oversizedChunked.headers.get("x-auditpro-request-id"));

  resetSecurityRateLimit();
  for (let index = 0; index < 60; index += 1) {
    const response = await POST(new Request("http://localhost/api/security/csp-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/csp-report",
        "x-forwarded-for": "203.0.113.22",
      },
      body: "{}",
    }));
    assert.equal(response.status, 204);
  }

  const limited = await POST(new Request("http://localhost/api/security/csp-report", {
    method: "POST",
    headers: {
      "Content-Type": "application/csp-report",
      "x-forwarded-for": "203.0.113.22",
    },
    body: "{}",
  }));
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get("Cache-Control"), "no-store");
  assert.ok(limited.headers.get("x-auditpro-request-id"));
  assert.ok(Number(limited.headers.get("Retry-After")) > 0);
  assert.deepEqual(await limited.json(), { error: "Too many CSP reports." });

  resetSecurityRateLimit();
  for (let index = 0; index < 1_100; index += 1) {
    const response = await POST(new Request("http://localhost/api/security/csp-report", {
      method: "POST",
      headers: {
        "Content-Type": "application/csp-report",
        "x-forwarded-for": `198.51.100.${index}`,
      },
      body: "{}",
    }));
    assert.equal(response.status, 204);
  }
  assert.ok(securityRateLimitBucketCount() <= 1_000);

  console.log("CSP report fixtures passed.");
}

void main();
