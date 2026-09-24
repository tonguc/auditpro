import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const doc = readFileSync(join(process.cwd(), "DEPLOYMENT.md"), "utf8");
const testPlan = readFileSync(join(process.cwd(), "TEST_PLAN.md"), "utf8");

for (const required of [
  "npm run preflight",
  "npm run test:launch-readiness",
  "npm run launch:readiness",
  "npm run test:admin-health-flow",
  "launch-readiness-reports/",
  "AUDITPRO_LAUNCH_READINESS_REPORT_DIR",
  "AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS",
  "AUDITPRO_BACKUP_MAX_AGE_MS",
  "AUDITPRO_REQUIRE_PDF_RENDER=true",
  "AUDITPRO_DEFAULT_PLAN=free",
  "AUDITPRO_SIGNUP_ENABLED=false",
  "AUDITPRO_AI_INPUT_EUR_PER_1K=0.002",
  "AUDITPRO_AI_OUTPUT_EUR_PER_1K=0.006",
  "Preflight validates `AUDITPRO_DEFAULT_PLAN`, `AUDITPRO_SIGNUP_ENABLED`",
  "APP_DOMAIN=audit.example.com",
  "`APP_DOMAIN` is the hostname only",
  "`POSTGRES_PASSWORD` must be set",
  "AUDITPRO_PREFLIGHT_CHECK_DB=true npm run preflight",
  "docker compose --env-file .env run --rm -e AUDITPRO_PREFLIGHT_CHECK_DB=true migrator ./node_modules/.bin/tsx scripts/preflight.ts",
  "The `migrator` service uses `env_file: .env`",
  "docker compose up migrator",
  "docker compose up -d app worker caddy",
  "The app service mounts `./launch-readiness-reports` and `./backups` read-only",
  "AUDITPRO_LOG_LEVEL=info",
  "Set `AUDITPRO_REQUIRE_PDF_RENDER=true`",
  "Logs must not include request bodies, authorization headers, cookies, Stripe signatures, raw customer email addresses, or raw audited URLs.",
  "npm run db:backup",
  "docker compose --project-name auditpro-restore-drill --env-file .env.staging up -d database",
  "-v ON_ERROR_STOP=1 --single-transaction",
  "temporarily disable Stripe webhook delivery",
  "replay missed Stripe events",
  "Do not restore a backup over production while Stripe webhooks or workers are actively writing.",
  "/api/healthz",
  "Do not publish the app container's `3000` port directly to the internet.",
  "enforced `Content-Security-Policy` header",
  "Public hostname responses include enforced `Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, and `X-Content-Type-Options` headers",
  "/api/webhooks/stripe",
  "AUDITPRO_INLINE_ANALYSIS_JOBS=false",
  "DATABASE_POOL_SIZE`, `AUDITPRO_DEFAULT_PLAN`, `AUDITPRO_STALE_JOB_MS`, and `AUDITPRO_WORKER_POLL_MS`",
  "AUDITPRO_STALE_JOB_MS",
  "AUDITPRO_WORKER_POLL_MS",
  "Worker shutdown is graceful",
  "reconciles unused pages after completion and refunds the reservation after failure",
  "stop_grace_period: 35m",
  "updated_at heartbeat",
  "AUDITPRO_ALLOW_SEED=false",
  "AUDITPRO_ALLOW_PRODUCTION_SEED=false",
  "AUDITPRO_ALLOW_REMOTE_SEED=false",
  "AUDITPRO_INTEGRATION_DATABASE_URL",
  "Do not point `AUDITPRO_INTEGRATION_DATABASE_URL` at the production database.",
  "Do not roll back migrations by deleting tables or editing applied migration files.",
  "AI Visibility is billable.",
  "Latest launch readiness",
  "Latest database backup is visible and fresh",
]) {
  assert.ok(doc.includes(required), `DEPLOYMENT.md must include ${required}`);
}

assert.doesNotMatch(doc, /dev-admin-secret/);
assert.match(testPlan, /npm run test:deployment-docs/);
assert.match(testPlan, /npm run test:preflight/);
assert.match(testPlan, /npm run test:operation-log/);
assert.match(testPlan, /npm run test:operation-routes/);
assert.match(testPlan, /npm run test:audit-authorization/);
assert.match(testPlan, /npm run test:worker/);
assert.match(testPlan, /npm run test:worker-operations/);
assert.match(testPlan, /AUDITPRO_REQUIRE_PDF_RENDER=true/);

console.log("Deployment docs fixtures passed.");
