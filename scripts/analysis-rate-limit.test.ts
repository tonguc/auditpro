import assert from "node:assert/strict";

import {
  analysisRateLimitBucketCountForTests,
  enforceAnalysisRateLimit,
  resetAnalysisRateLimitForTests,
} from "../lib/analysis-rate-limit";
import { forwardedClient } from "../lib/forwarded-client";

function requestFor(client: string) {
  return new Request("http://localhost/api/analyze", {
    headers: { "x-forwarded-for": client },
  });
}

resetAnalysisRateLimitForTests();

for (let index = 0; index < 5; index += 1) {
  assert.deepEqual(enforceAnalysisRateLimit(requestFor("203.0.113.10"), "example.com"), {
    allowed: true,
    retryAfter: 0,
  });
}

for (let index = 0; index < 500; index += 1) {
  const allowed = enforceAnalysisRateLimit(requestFor(`198.51.100.${index}`), `spray-${index}.example`);
  assert.equal(allowed.allowed, true);
}

assert.ok(analysisRateLimitBucketCountForTests() <= 500);

const sixth = enforceAnalysisRateLimit(requestFor("203.0.113.10"), "example.com");
assert.equal(sixth.allowed, true);

const seventh = enforceAnalysisRateLimit(requestFor("203.0.113.10"), "example.com");
assert.equal(seventh.allowed, false);
assert.ok(seventh.retryAfter > 0);
assert.ok(analysisRateLimitBucketCountForTests() <= 500);

// A1 (P1 plan): forwarded-prefix rotation and the trusted-hop policy.
const previousHops = process.env.AUDITPRO_TRUSTED_PROXY_HOPS;
try {
  delete process.env.AUDITPRO_TRUSTED_PROXY_HOPS;
  assert.equal(
    forwardedClient(requestFor("spoofed-a, spoofed-b, 203.0.113.10")),
    "203.0.113.10",
    "an unset env must still use the documented default of one trusted hop",
  );

  for (let index = 0; index < 6; index += 1) {
    const allowed = enforceAnalysisRateLimit(requestFor(`10.0.0.${index}, 203.0.113.20`), "rotate.example");
    assert.equal(allowed.allowed, true, `attempt ${index + 1} must stay allowed`);
  }
  const spoofedSeventh = enforceAnalysisRateLimit(requestFor("10.0.0.99, 203.0.113.20"), "rotate.example");
  assert.equal(spoofedSeventh.allowed, false, "rotating the forwarded prefix must not reset the analysis bucket");

  process.env.AUDITPRO_TRUSTED_PROXY_HOPS = "2";
  assert.equal(
    forwardedClient(requestFor("spoofed, 203.0.113.10, 198.51.100.9")),
    "203.0.113.10",
    "two trusted hops step over the proxy address",
  );

  process.env.AUDITPRO_TRUSTED_PROXY_HOPS = "0";
  assert.equal(
    forwardedClient(new Request("http://localhost/api/analyze", { headers: { "x-forwarded-for": "spoofed", "x-real-ip": "203.0.113.10" } })),
    "203.0.113.10",
    "zero trusted hops ignores XFF entirely",
  );
  assert.equal(forwardedClient(requestFor("spoofed")), "local", "zero trusted hops without XFF falls back");
} finally {
  if (previousHops === undefined) delete process.env.AUDITPRO_TRUSTED_PROXY_HOPS;
  else process.env.AUDITPRO_TRUSTED_PROXY_HOPS = previousHops;
}

console.log("Analysis rate limit fixtures passed.");
