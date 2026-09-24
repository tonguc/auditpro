import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { Pool } from "pg";

const integrationUrl = process.env.AUDITPRO_INTEGRATION_DATABASE_URL;

function isLocalDatabase(url: URL) {
  return ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
}

function schemaConnectionString(url: string, schema: string) {
  const next = new URL(url);
  next.searchParams.set("options", `-c search_path=${schema},public`);
  return next.toString();
}

function tsxBin() {
  return join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
}

function expectedMigrationCount() {
  return readdirSync(join(process.cwd(), "database", "migrations"))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/i.test(file))
    .length;
}

async function main() {
  if (!integrationUrl) {
    console.log("Skipping PostgreSQL integration tests: AUDITPRO_INTEGRATION_DATABASE_URL is not set.");
    return;
  }

  const parsed = new URL(integrationUrl);
  if (!isLocalDatabase(parsed) && process.env.AUDITPRO_ALLOW_REMOTE_INTEGRATION_DB !== "true") {
    throw new Error("Refusing to run PostgreSQL integration tests against a remote database without AUDITPRO_ALLOW_REMOTE_INTEGRATION_DB=true.");
  }

  const schema = `auditpro_it_${Date.now()}_${crypto.randomUUID().replaceAll("-", "").slice(0, 8)}`;
  assert.match(schema, /^auditpro_it_[a-z0-9_]+$/);

  const adminPool = new Pool({ connectionString: integrationUrl, max: 1 });
  const testDatabaseUrl = schemaConnectionString(integrationUrl, schema);
  const backupDir = mkdtempSync(join(tmpdir(), "auditpro-postgres-it-backup-"));

  try {
    await adminPool.query(`CREATE SCHEMA ${schema}`);

    execFileSync(tsxBin(), ["scripts/migrate.ts"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        DATABASE_URL: testDatabaseUrl,
        DATABASE_POOL_SIZE: "2",
        AUDITPRO_MIGRATION_LOCK_TIMEOUT_MS: "5000",
      },
      stdio: "pipe",
    });

    process.env.DATABASE_URL = testDatabaseUrl;
    process.env.DATABASE_POOL_SIZE = "2";
    process.env.AUDITPRO_BACKUP_DIR = backupDir;
    process.env.AUDITPRO_BACKUP_MAX_AGE_MS = "86400000";
    process.env.AUDITPRO_DEFAULT_PLAN = "pro";
    process.env.AUDITPRO_INLINE_ANALYSIS_JOBS = "false";
    process.env.AUDITPRO_LOG_LEVEL = "info";
    process.env.AUDITPRO_REQUIRE_PDF_RENDER = "true";
    process.env.AUDITPRO_ADMIN_SECRET = "integration-admin-secret";
    process.env.BETTER_AUTH_SECRET = "integration-auth-secret";
    process.env.BETTER_AUTH_URL = "http://localhost:3000";
    process.env.APP_URL = "http://localhost:3000";
    process.env.AUDITPRO_STRIPE_PRO_PRICE_ID = "price_it_pro";
    process.env.AUDITPRO_STRIPE_AGENCY_PRICE_ID = "price_it_agency";
    process.env.AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID = "price_it_enterprise";
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_integration";
    process.env.AUDITPRO_BILLING_SYNC_SECRET = "billing_integration";
    process.env.AUDITPRO_AI_VISIBILITY_ENABLED = "false";
    process.env.AUDITPRO_AI_INPUT_EUR_PER_1K = "0.002";
    process.env.AUDITPRO_AI_OUTPUT_EUR_PER_1K = "0.006";
    process.env.AUDITPRO_AI_OPENAI_MODEL = "openai/gpt-5.6-luna";
    process.env.AUDITPRO_AI_GEMINI_MODEL = "google/gemini-3.5-flash-lite";
    process.env.AUDITPRO_AI_PERPLEXITY_MODEL = "perplexity/sonar";
    process.env.AUDITPRO_AI_CLAUDE_MODEL = "anthropic/claude-sonnet-4.6";
    writeFileSync(join(backupDir, "auditpro-integration.sql"), "CREATE TABLE backup_probe(id int);\n", "utf8");

    const { query } = await import("../lib/db");
    const { syncSubscription } = await import("../lib/billing");
    const { createAnalysisJob, claimNextAnalysisJob } = await import("../lib/analysis-jobs");
    const {
      reconcileAiVisibilityCredits,
      reconcileAiVisibilityReportQuota,
      recordAiAccountingFailure,
      reserveAiVisibilityQuota,
    } = await import("../lib/usage-ledger");
    const { GET: getAdminHealth } = await import("../app/api/admin/health/route");

    const migrations = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM schema_migrations");
    assert.equal(Number(migrations.rows[0]?.count), expectedMigrationCount());

    const organization = await query<{ id: string }>(
      `INSERT INTO organizations (name, slug, plan_id)
       VALUES ($1, $2, 'free')
       RETURNING id`,
      ["Integration Org", `integration-${Date.now()}`],
    );
    const organizationId = organization.rows[0]?.id;
    assert.ok(organizationId);

    const newerActive = await syncSubscription({
      organizationId,
      provider: "stripe",
      providerCustomerId: "cus_it",
      providerSubscriptionId: "sub_it",
      providerPriceId: "price_it_pro",
      status: "active",
      providerEventCreated: "2026-08-26T10:00:00.000Z",
      eventId: "evt_it_active",
    });
    assert.equal(newerActive.duplicate, false);
    assert.equal(newerActive.accessPlanId, "pro");

    await syncSubscription({
      organizationId,
      provider: "stripe",
      providerCustomerId: "cus_it",
      providerSubscriptionId: "sub_it",
      providerPriceId: "price_it_agency",
      status: "canceled",
      providerEventCreated: "2026-08-26T09:00:00.000Z",
      eventId: "evt_it_older_cancel",
    });

    const subscriptionAfterOlderEvent = await query<{ status: string; plan_id: string; provider_price_id: string }>(
      `SELECT status, plan_id, provider_price_id
       FROM subscriptions
       WHERE organization_id = $1`,
      [organizationId],
    );
    assert.deepEqual(subscriptionAfterOlderEvent.rows[0], {
      status: "active",
      plan_id: "pro",
      provider_price_id: "price_it_pro",
    });

    const orgAfterOlderEvent = await query<{ plan_id: string }>(
      "SELECT plan_id FROM organizations WHERE id = $1",
      [organizationId],
    );
    assert.equal(orgAfterOlderEvent.rows[0]?.plan_id, "pro");

    const duplicate = await syncSubscription({
      organizationId,
      provider: "stripe",
      providerCustomerId: "cus_it",
      providerSubscriptionId: "sub_it",
      providerPriceId: "price_it_pro",
      status: "active",
      providerEventCreated: "2026-08-26T10:00:00.000Z",
      eventId: "evt_it_active",
    });
    assert.equal(duplicate.duplicate, true);

    const deletedWithoutPrice = await syncSubscription({
      organizationId,
      provider: "stripe",
      providerCustomerId: "cus_it",
      providerSubscriptionId: "sub_it",
      status: "canceled",
      providerEventCreated: "2026-08-26T11:00:00.000Z",
      eventId: "evt_it_deleted_without_price",
    });
    assert.equal(deletedWithoutPrice.accessPlanId, "free");
    const orgAfterDeletedEvent = await query<{ plan_id: string }>(
      "SELECT plan_id FROM organizations WHERE id = $1",
      [organizationId],
    );
    assert.equal(orgAfterDeletedEvent.rows[0]?.plan_id, "free");
    const subscriptionAfterDeletedEvent = await query<{ status: string; plan_id: string; provider_price_id: string | null }>(
      `SELECT status, plan_id, provider_price_id
       FROM subscriptions
       WHERE organization_id = $1`,
      [organizationId],
    );
    assert.deepEqual(subscriptionAfterDeletedEvent.rows[0], {
      status: "canceled",
      plan_id: "pro",
      provider_price_id: null,
    });

    const aiReferenceId = `ai-it-${crypto.randomUUID()}`;
    const reservation = await reserveAiVisibilityQuota({
      organizationId,
      reportLimit: 3,
      promptCredits: 4,
      promptCreditLimit: 20,
      responseCredits: 3,
      responseCreditLimit: 20,
      referenceId: aiReferenceId,
    });
    assert.equal(reservation.ok, true);
    if (!reservation.ok) throw new Error("Expected AI quota reservation to pass.");
    const duplicateReservation = await reserveAiVisibilityQuota({
      organizationId,
      reportLimit: 3,
      promptCredits: 4,
      promptCreditLimit: 20,
      responseCredits: 3,
      responseCreditLimit: 20,
      referenceId: aiReferenceId,
    });
    assert.equal(duplicateReservation.ok, true);

    const usageAfterDuplicateReservation = await query<{ ai_reports: string }>(
      `SELECT ai_reports::text
       FROM usage_monthly
       WHERE organization_id = $1 AND month = $2`,
      [organizationId, reservation.prompt.month],
    );
    assert.equal(usageAfterDuplicateReservation.rows[0]?.ai_reports, "1");

    const creditReconciliation = await reconcileAiVisibilityCredits({
      organizationId,
      referenceId: aiReferenceId,
      month: reservation.prompt.month,
      reservedPromptCredits: 4,
      actualPromptCredits: 1,
      reservedResponseCredits: 3,
      actualResponseCredits: 1,
    });
    assert.equal(creditReconciliation.promptRefundApplied, true);
    assert.equal(creditReconciliation.responseRefundApplied, true);
    const duplicateCreditReconciliation = await reconcileAiVisibilityCredits({
      organizationId,
      referenceId: aiReferenceId,
      month: reservation.prompt.month,
      reservedPromptCredits: 4,
      actualPromptCredits: 1,
      reservedResponseCredits: 3,
      actualResponseCredits: 1,
    });
    assert.equal(duplicateCreditReconciliation.promptRefundApplied, false);
    assert.equal(duplicateCreditReconciliation.responseRefundApplied, false);
    const creditLedgerRows = await query<{ credit_kind: string; reason: string; amount: string; rows: string }>(
      `SELECT credit_kind, reason, SUM(amount)::text AS amount, COUNT(*)::text AS rows
       FROM credit_ledger
       WHERE organization_id = $1
         AND month = $2
         AND reference_id = $3
       GROUP BY credit_kind, reason
       ORDER BY credit_kind, reason`,
      [organizationId, reservation.prompt.month, aiReferenceId],
    );
    assert.deepEqual(creditLedgerRows.rows, [
      { credit_kind: "ai_prompt", reason: "refund", amount: "-3", rows: "1" },
      { credit_kind: "ai_prompt", reason: "reserve", amount: "4", rows: "1" },
      { credit_kind: "ai_response", reason: "refund", amount: "-2", rows: "1" },
      { credit_kind: "ai_response", reason: "reserve", amount: "3", rows: "1" },
    ]);

    const reportReconciliation = await reconcileAiVisibilityReportQuota({
      organizationId,
      referenceId: aiReferenceId,
      month: reservation.prompt.month,
      reason: "integration_zero_success",
    });
    assert.equal(reportReconciliation.reportRefunded, true);
    const duplicateReportReconciliation = await reconcileAiVisibilityReportQuota({
      organizationId,
      referenceId: aiReferenceId,
      month: reservation.prompt.month,
      reason: "integration_zero_success",
    });
    assert.equal(duplicateReportReconciliation.reportRefunded, false);
    const usageAfterReportReconciliation = await query<{ ai_reports: string }>(
      `SELECT ai_reports::text
       FROM usage_monthly
       WHERE organization_id = $1 AND month = $2`,
      [organizationId, reservation.prompt.month],
    );
    assert.equal(usageAfterReportReconciliation.rows[0]?.ai_reports, "0");

    await recordAiAccountingFailure({
      organizationId,
      referenceId: aiReferenceId,
      failureStage: "usage_recording",
      errorName: "IntegrationUsageError",
      metadata: { attempt: 1 },
    });
    await recordAiAccountingFailure({
      organizationId,
      referenceId: aiReferenceId,
      failureStage: "usage_recording",
      errorName: "IntegrationUsageError",
      metadata: { attempt: 2 },
    });
    await recordAiAccountingFailure({
      referenceId: "anonymous-ai-it",
      failureStage: "reservation_reconciliation",
      errorName: "AnonymousIntegrationError",
    });
    await recordAiAccountingFailure({
      referenceId: "anonymous-ai-it",
      failureStage: "reservation_reconciliation",
      errorName: "AnonymousIntegrationError",
    });
    const accountingFailures = await query<{ organization_id: string | null; reference_id: string; failure_stage: string; attempts: string }>(
      `SELECT organization_id::text, reference_id, failure_stage, attempts::text
       FROM ai_accounting_failures
       WHERE reference_id IN ($1, 'anonymous-ai-it')
       ORDER BY organization_id NULLS LAST, reference_id`,
      [aiReferenceId],
    );
    assert.deepEqual(accountingFailures.rows, [
      {
        organization_id: organizationId,
        reference_id: aiReferenceId,
        failure_stage: "usage_recording",
        attempts: "2",
      },
      {
        organization_id: null,
        reference_id: "anonymous-ai-it",
        failure_stage: "reservation_reconciliation",
        attempts: "2",
      },
    ]);

    const job = await createAnalysisJob("https://example.com", 3, new Headers(), organizationId);
    assert.equal(job.status, "queued");

    const claims = await Promise.all(Array.from({length:8},(_,index)=>claimNextAnalysisJob(`integration-contender-${index}`)));
    assert.equal(claims.filter(Boolean).length,1,'eight competing claims must acquire the single queued job exactly once');
    const claimed = claims.find(Boolean);
    assert.equal(claimed?.id, job.id);
    assert.equal(claimed?.status, "running");

    await query(
      `UPDATE analysis_jobs
       SET started_at = now() - interval '2 hours',
           updated_at = now()
       WHERE id = $1`,
      [job.id],
    );

    const notReclaimed = await claimNextAnalysisJob("integration-worker-fresh-heartbeat");
    assert.equal(notReclaimed, undefined);

    await query(
      `UPDATE analysis_jobs
       SET updated_at = now() - interval '2 hours'
       WHERE id = $1`,
      [job.id],
    );

    const reclaimed = await claimNextAnalysisJob("integration-worker-2");
    assert.equal(reclaimed?.id, job.id);

    const jobAfterReclaim = await query<{ worker_id: string; attempts: string }>(
      "SELECT worker_id, attempts::text AS attempts FROM analysis_jobs WHERE id = $1",
      [job.id],
    );
    assert.deepEqual(jobAfterReclaim.rows[0], {
      worker_id: "integration-worker-2",
      attempts: "2",
    });

    const healthResponse = await getAdminHealth(new Request("http://localhost/api/admin/health", {
      headers: { "x-auditpro-admin-secret": "integration-admin-secret" },
    }));
    assert.equal(healthResponse.status, 200);
    const health = await healthResponse.json();
    assert.equal(health.runtime.databaseConfigured, true);
    assert.ok(health.migrations.applied >= 2);
    assert.equal(health.billing.stripeWebhookConfigured, true);
    assert.equal(health.backup.status, "fresh");
    assert.ok(Array.isArray(health.checks));
    assert.ok(health.checks.some((check: { id: string; status: string }) => check.id === "database" && check.status === "ok"));
    assert.ok(health.checks.some((check: { id: string; status: string }) => check.id === "default_plan" && check.status === "ok"));
    assert.ok(health.checks.some((check: { id: string; status: string }) => check.id === "pdf_render_gate" && check.status === "ok"));
    assert.ok(health.checks.some((check: { id: string; status: string }) => check.id === "ai_cost_rates" && check.status === "ok"));
    assert.ok(health.checks.some((check: { id: string; status: string }) => check.id === "backup" && check.status === "ok"));
    assert.ok(health.checks.some((check: { id: string; status: string }) => check.id === "ai_accounting_failures" && check.status === "error"));
    assert.equal(health.usage.unresolvedAiAccountingFailures, 2);

    console.log("PostgreSQL integration fixtures passed.");
  } finally {
    const { closeDatabasePool } = await import("../lib/db");
    await closeDatabasePool().catch(() => undefined);
    await adminPool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`).catch(() => undefined);
    await adminPool.end();
    rmSync(backupDir, { force: true, recursive: true });
  }
}

void main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
