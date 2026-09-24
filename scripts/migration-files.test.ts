import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const migrationsDir = join(process.cwd(), "database", "migrations");
const files = readdirSync(migrationsDir).filter((file) => file.endsWith(".sql")).sort();

assert.deepEqual(files, [
  "001_initial.sql",
  "002_jobs_billing_usage.sql",
  "003_analysis_job_heartbeat.sql",
  "004_analysis_job_usage_reconciliation.sql",
  "005_credit_ledger_reconciliation.sql",
  "006_credit_ledger_ai_scope.sql",
  "007_ai_report_quota_reconciliation.sql",
  "008_ai_report_reservations.sql",
  "009_ai_accounting_failures.sql",
  "010_ai_accounting_failure_idempotency.sql",
  "011_pilot_ai_runs.sql",
  "012_ai_usage_cost_accounting.sql",
]);

for (const file of files) {
  assert.match(file, /^\d{3}_[a-z0-9_]+\.sql$/);
  const sql = readFileSync(join(migrationsDir, file), "utf8");
  assert.ok(sql.trim().length > 0, `${file} must not be empty`);
  assert.doesNotMatch(sql, /\bDROP\s+(?:TABLE|DATABASE|SCHEMA)\b/i, `${file} must not contain destructive drops`);
}

const combined = files.map((file) => readFileSync(join(migrationsDir, file), "utf8")).join("\n");
assert.match(combined, /ALTER TABLE audits ALTER COLUMN external_id SET NOT NULL/);
assert.match(combined, /provider_event_created timestamptz/);
assert.match(combined, /usage_monthly_month_idx/);
assert.match(combined, /analysis_jobs_created_idx/);
assert.match(combined, /analysis_jobs_status_started_idx/);
assert.match(combined, /analysis_jobs_status_updated_idx/);
assert.match(combined, /reserved_pages integer/);
assert.match(combined, /usage_month date/);
assert.match(combined, /usage_reconciled_at timestamptz/);
assert.match(combined, /usage_refunded_pages integer/);
assert.match(combined, /analysis_jobs_usage_reconciliation_idx/);
assert.match(combined, /credit_ledger_month_kind_idx/);
assert.match(combined, /credit_ledger_reference_reason_idx/);
assert.match(combined, /ALTER TABLE credit_ledger DROP CONSTRAINT IF EXISTS credit_ledger_amount_check/);
assert.match(combined, /CHECK \(credit_kind IN \('ai_prompt', 'ai_response'\)\)/);
assert.match(combined, /ai_usage_events_created_idx/);
assert.match(combined, /CREATE TABLE IF NOT EXISTS ai_report_reconciliations/);
assert.match(combined, /PRIMARY KEY \(organization_id, month, reference_id\)/);
assert.match(combined, /ai_report_reconciliations_created_idx/);
assert.match(combined, /CREATE TABLE IF NOT EXISTS ai_report_reservations/);
assert.match(combined, /report_count integer NOT NULL DEFAULT 1 CHECK \(report_count = 1\)/);
assert.match(combined, /ai_report_reservations_created_idx/);
assert.match(combined, /CREATE TABLE IF NOT EXISTS ai_accounting_failures/);
assert.match(combined, /failure_stage text NOT NULL/);
assert.match(combined, /attempts integer NOT NULL DEFAULT 1 CHECK \(attempts > 0\)/);
assert.match(combined, /last_seen_at timestamptz NOT NULL DEFAULT now\(\)/);
assert.match(combined, /ai_accounting_failures_unresolved_idx/);
assert.match(combined, /ai_accounting_failures_unresolved_reference_stage_idx/);
assert.match(combined, /CREATE TABLE IF NOT EXISTS pilot_ai_runs/);
assert.match(combined, /pilot_ai_runs_status_idx/);
assert.match(combined, /web_search_calls integer NOT NULL DEFAULT 0 CHECK \(web_search_calls >= 0\)/);
assert.match(combined, /cost_basis text NOT NULL DEFAULT 'unknown' CHECK \(cost_basis IN \('price-table', 'fallback-rate', 'unknown'\)\)/);
assert.match(combined, /price_version text/);
assert.match(combined, /provider_cost_usd numeric\(12, 6\)/);
assert.match(combined, /pg_index/i, "migration should avoid duplicate unique indexes when a table constraint already exists");

for (const table of [
  "auth_users",
  "organizations",
  "subscriptions",
  "billing_events",
  "analysis_jobs",
  "credit_ledger",
  "ai_usage_events",
  "pilot_ai_runs",
]) {
  assert.match(combined, new RegExp(`CREATE TABLE IF NOT EXISTS ${table}\\b`), `${table} must be created by migrations`);
}

const runner = readFileSync(join(process.cwd(), "scripts", "migrate.ts"), "utf8");
assert.match(runner, /pg_try_advisory_lock/, "migration runner must use bounded advisory locking");
assert.match(runner, /no-transaction/, "migration runner must support non-transaction migrations for future concurrent indexes");

console.log("Migration file fixtures passed.");
