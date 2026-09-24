import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const dockerfile = readFileSync(join(process.cwd(), "Dockerfile"), "utf8");
const compose = readFileSync(join(process.cwd(), "docker-compose.yml"), "utf8");

function serviceBlock(name: string) {
  const match = compose.match(new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z][a-z0-9_-]*:\\n|^volumes:)`, "m"));
  assert.ok(match, `docker-compose.yml must include ${name} service`);
  return match[1];
}

function nestedValue(block: string, section: string, key: string) {
  const match = block.match(new RegExp(`^    ${section}:\\n(?:      .+\\n)*?      ${key}: (.+)$`, "m"));
  return match?.[1]?.trim();
}

function dependencyCondition(block: string, dependency: string) {
  const match = block.match(new RegExp(`^    depends_on:\\n(?:      [a-z][a-z0-9_-]*:\\n        condition: .+\\n)*?      ${dependency}:\\n        condition: (.+)$`, "m"));
  return match?.[1]?.trim();
}

const app = serviceBlock("app");
const worker = serviceBlock("worker");
const migrator = serviceBlock("migrator");
const caddy = serviceBlock("caddy");

assert.match(dockerfile, /FROM node:24-bookworm-slim AS dependencies/);
assert.match(dockerfile, /FROM browser-runtime AS runner/);
assert.match(dockerfile, /FROM browser-runtime AS worker/);
assert.match(dockerfile, /FROM dependencies AS migrator/);
assert.match(dockerfile, /playwright install --with-deps chromium/);
assert.match(dockerfile, /PLAYWRIGHT_BROWSERS_PATH=\/ms-playwright/);
assert.match(dockerfile, /RUN npm ci/);
assert.match(dockerfile, /HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3/);
assert.match(dockerfile, /\/api\/healthz/);
assert.match(dockerfile, /process\.exit\(response\.ok \? 0 : 1\)/);
assert.equal(nestedValue(app, "build", "context"), ".");
assert.equal(nestedValue(app, "build", "target"), "runner");
assert.equal(nestedValue(worker, "build", "context"), ".");
assert.equal(nestedValue(worker, "build", "target"), "worker");
assert.equal(nestedValue(migrator, "build", "context"), ".");
assert.equal(nestedValue(migrator, "build", "target"), "migrator");
assert.equal(dependencyCondition(migrator, "database"), "service_healthy");
assert.equal(dependencyCondition(app, "migrator"), "service_completed_successfully");
assert.equal(dependencyCondition(worker, "migrator"), "service_completed_successfully");
assert.equal(dependencyCondition(caddy, "app"), "service_healthy");
assert.match(app, /DATABASE_POOL_SIZE: \$\{DATABASE_POOL_SIZE:-10\}/);
assert.match(worker, /DATABASE_POOL_SIZE: \$\{DATABASE_POOL_SIZE:-10\}/);
assert.match(migrator, /DATABASE_POOL_SIZE: \$\{DATABASE_POOL_SIZE:-2\}/);
assert.match(app, /AUDITPRO_DEFAULT_PLAN: \$\{AUDITPRO_DEFAULT_PLAN:-free\}/);
assert.match(worker, /AUDITPRO_DEFAULT_PLAN: \$\{AUDITPRO_DEFAULT_PLAN:-free\}/);
assert.match(app, /AUDITPRO_SIGNUP_ENABLED: \$\{AUDITPRO_SIGNUP_ENABLED:-false\}/);
assert.match(app, /AUDITPRO_STALE_JOB_MS: \$\{AUDITPRO_STALE_JOB_MS:-1800000\}/);
assert.match(worker, /AUDITPRO_STALE_JOB_MS: \$\{AUDITPRO_STALE_JOB_MS:-1800000\}/);
assert.match(app, /AUDITPRO_WORKER_POLL_MS: \$\{AUDITPRO_WORKER_POLL_MS:-2500\}/);
assert.match(worker, /AUDITPRO_WORKER_POLL_MS: \$\{AUDITPRO_WORKER_POLL_MS:-2500\}/);
assert.match(app, /AUDITPRO_LAUNCH_READINESS_REPORT_DIR: \/app\/launch-readiness-reports/);
assert.match(app, /AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS: \$\{AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS:-86400000\}/);
assert.match(app, /AUDITPRO_BACKUP_DIR: \/app\/backups/);
assert.match(app, /AUDITPRO_BACKUP_MAX_AGE_MS: \$\{AUDITPRO_BACKUP_MAX_AGE_MS:-86400000\}/);
assert.match(app, /AUDITPRO_REQUIRE_PDF_RENDER: \$\{AUDITPRO_REQUIRE_PDF_RENDER:-true\}/);
assert.match(app, /- \.\/launch-readiness-reports:\/app\/launch-readiness-reports:ro/);
assert.match(app, /- \.\/backups:\/app\/backups:ro/);
assert.match(compose, /migrator:\s+build:[\s\S]+env_file:\s+- \.env/);

console.log("Docker health fixtures passed.");
