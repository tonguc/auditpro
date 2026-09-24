import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const page = readFileSync(join(process.cwd(), "app", "admin", "page.tsx"), "utf8");
const panel = readFileSync(join(process.cwd(), "app", "admin", "admin-health-panel.tsx"), "utf8");
const css = readFileSync(join(process.cwd(), "app", "globals.css"), "utf8");

assert.match(page, /<AdminHealthPanel \/>/);
assert.match(panel, /"use client"/);
assert.match(panel, /fetch\("\/api\/admin\/health"/);
assert.match(panel, /"x-auditpro-admin-secret": trimmedSecret/);
assert.match(panel, /actionItems/);
assert.match(panel, /Launch actions/);
assert.match(panel, /Launch gate/);
assert.match(panel, /Backup/);
assert.match(panel, /AI accounting failures/);
assert.match(panel, /launchGateValue/);
assert.match(panel, /launchGateDetail/);
assert.match(panel, /formatAge/);
assert.match(panel, /formatBytes/);
assert.match(panel, /No blocking launch actions detected/);
assert.doesNotMatch(panel, /process\.env\.AUDITPRO_ADMIN_SECRET/);
assert.doesNotMatch(panel, /localStorage/);
assert.match(panel, /cache: "no-store"/);
assert.match(css, /\.admin-health-shell/);
assert.match(css, /\.admin-action-panel/);
assert.match(css, /@media \(max-width: 620px\)/);

console.log("Admin health UI fixtures passed.");
