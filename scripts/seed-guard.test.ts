import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const seedScript = readFileSync(join(process.cwd(), "scripts", "seed-demo.ts"), "utf8");

assert.match(seedScript, /AUDITPRO_ALLOW_SEED/);
assert.match(seedScript, /NODE_ENV === "production"/);
assert.match(seedScript, /AUDITPRO_ALLOW_REMOTE_SEED/);
assert.match(seedScript, /localhost/);
assert.match(seedScript, /127\.0\.0\.1/);

console.log("Seed guard fixtures passed.");
