import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const nextConfig = readFileSync(join(process.cwd(), "next.config.ts"), "utf8");
const caddyfile = readFileSync(join(process.cwd(), "Caddyfile"), "utf8");
const testPlan = readFileSync(join(process.cwd(), "TEST_PLAN.md"), "utf8");

for (const header of [
  "Strict-Transport-Security",
  "X-Content-Type-Options",
  "X-Frame-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Content-Security-Policy",
]) {
  assert.ok(nextConfig.includes(header), `next.config.ts must include ${header}`);
  if (header !== "Content-Security-Policy") {
    assert.ok(caddyfile.includes(header), `Caddyfile must include ${header}`);
  }
}

assert.match(nextConfig, /source: "\/:path\*"/);
assert.match(nextConfig, /X-Frame-Options"[\s\S]+DENY/);
assert.match(nextConfig, /camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\)/);
assert.match(caddyfile, /-Server/);
assert.match(nextConfig, /report-uri \/api\/security\/csp-report/);
assert.match(nextConfig, /frame-ancestors 'none'/);
assert.match(nextConfig, /connect-src 'self'/);
assert.doesNotMatch(nextConfig, /'unsafe-eval'/);
assert.doesNotMatch(nextConfig, /script-src[^"]*blob:/);
assert.doesNotMatch(nextConfig, /connect-src[^"]*https:/);
assert.doesNotMatch(nextConfig, /connect-src[^"]*ws:/);
assert.doesNotMatch(nextConfig, /connect-src[^"]*wss:/);
assert.doesNotMatch(nextConfig, /Content-Security-Policy-Report-Only/);
assert.match(testPlan, /npm run test:security-headers/);

console.log("Security headers fixtures passed.");
