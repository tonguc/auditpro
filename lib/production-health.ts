import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

import { hasDatabase, query } from "@/lib/db";
import { launchReadinessSteps } from "@/lib/launch-readiness-steps";
import { isPlanId, PLAN_IDS } from "@/lib/plans";
import { pinnedPublicUrlDispatcher, resolvePublicUrl } from "@/lib/public-url";
import type { Dispatcher } from "undici";

const launchReadinessScriptIds = new Set(launchReadinessSteps.map((step) => step.script));

export type HealthStatus = "ok" | "warning" | "error";

export type ProductionHealth = {
  status: HealthStatus;
  checkedAt: string;
  runtime: {
    nodeEnv: string;
    appUrlConfigured: boolean;
    authConfigured: boolean;
    databaseConfigured: boolean;
  };
  migrations?: {
    applied: number;
    latest?: string;
    error?: string;
  };
  jobs?: {
    queued: number;
    running: number;
    failedRecent: number;
    staleRunning: number;
  };
  billing: {
    adminSyncConfigured: boolean;
    stripeWebhookConfigured: boolean;
    stripePricesConfigured: boolean;
  };
  ai: {
    enabled: boolean;
    gatewayConfigured: boolean;
    modelCount: number;
  };
  usage?: {
    currentMonthOrganizations: number;
    pagesCrawled: number;
    aiReports: number;
    aiPromptCredits: number;
    aiResponseCredits: number;
    estimatedAiCostEur: number;
    unresolvedAiAccountingFailures: number;
  };
  launch?: {
    ageMs?: number;
    status: "passed" | "failed" | "missing";
    finishedAt?: string;
    durationMs?: number;
    failedScript?: string;
    passedSteps?: number;
    totalSteps?: number;
  };
  backup?: {
    ageMs?: number;
    status: "fresh" | "stale" | "missing";
    sizeBytes?: number;
  };
  checks: Array<{ id: string; status: HealthStatus; message: string }>;
};

type LaunchHealth = NonNullable<ProductionHealth["launch"]>;
type BackupHealth = NonNullable<ProductionHealth["backup"]>;

const staleJobMs = Number(process.env.AUDITPRO_STALE_JOB_MS ?? 30 * 60 * 1000);
const defaultLaunchReportMaxAgeMs = 24 * 60 * 60 * 1000;
const defaultBackupMaxAgeMs = 24 * 60 * 60 * 1000;
const allowedLogLevels = ["debug", "info", "warn", "error", "off"];
const placeholderPatterns = [/^replace-/, /^change-me$/, /^placeholder$/i, /^your-/i, /^test-/i, /^demo-/i, /^example-/i];

function statusRank(status: HealthStatus) {
  return status === "error" ? 3 : status === "warning" ? 2 : 1;
}

function overallStatus(checks: ProductionHealth["checks"]): HealthStatus {
  return checks.reduce<HealthStatus>(
    (current, check) => statusRank(check.status) > statusRank(current) ? check.status : current,
    "ok",
  );
}

function numberFrom(value: unknown) {
  return Number(value ?? 0);
}

function positiveNumberFrom(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function envValue(key: string) {
  return process.env[key]?.trim() ?? "";
}

function isPlaceholder(value: string) {
  return !value || placeholderPatterns.some((pattern) => pattern.test(value));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown database error.";
}

function isLocalHealthProbeAllowed() {
  return process.env.NODE_ENV !== "production" && process.env.AUDITPRO_ALLOW_LOCAL_HEALTH_PROBE === "true";
}

function requiredSecurityHeaderFailures(headers: Headers) {
  const csp = headers.get("content-security-policy");
  const failures: string[] = [];
  if (!csp) failures.push("Content-Security-Policy");
  if (headers.get("content-security-policy-report-only")) failures.push("no report-only CSP");
  if (!csp?.includes("default-src 'self'")) failures.push("CSP default-src");
  if (!csp?.includes("connect-src 'self'")) failures.push("CSP connect-src");
  if (csp?.includes("'unsafe-eval'")) failures.push("CSP unsafe-eval");
  if (/script-src[^;]*blob:/.test(csp ?? "")) failures.push("CSP blob scripts");
  if (/connect-src[^;]*(?:https:|ws:|wss:)/.test(csp ?? "")) failures.push("CSP broad connect-src");
  if (headers.get("strict-transport-security") !== "max-age=31536000; includeSubDomains") failures.push("Strict-Transport-Security");
  if (headers.get("x-frame-options") !== "DENY") failures.push("X-Frame-Options");
  if (headers.get("x-content-type-options") !== "nosniff") failures.push("X-Content-Type-Options");
  if (headers.get("referrer-policy") !== "strict-origin-when-cross-origin") failures.push("Referrer-Policy");
  if (!headers.get("permissions-policy")?.includes("camera=(), microphone=(), geolocation=(), payment=()")) failures.push("Permissions-Policy");
  return failures;
}

async function probeSecurityHeaders(appUrl: string) {
  const url = new URL("/", appUrl);
  const localProbeAllowed = isLocalHealthProbeAllowed();
  const resolution = localProbeAllowed ? undefined : await resolvePublicUrl(url);
  const dispatcher = resolution ? pinnedPublicUrlDispatcher(resolution) : undefined;
  try {
    const response = await fetch(url, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_500),
      ...(dispatcher ? { dispatcher } : {}),
    } as RequestInit & { dispatcher?: Dispatcher });
    const failures = requiredSecurityHeaderFailures(response.headers);
    return { status: response.status, failures };
  } finally {
    dispatcher?.close();
  }
}

function pushConfigChecks(checks: ProductionHealth["checks"]) {
  const defaultPlan = envValue("AUDITPRO_DEFAULT_PLAN");
  checks.push({
    id: "default_plan",
    status: !defaultPlan ? "warning" : isPlanId(defaultPlan) ? "ok" : "error",
    message: !defaultPlan
      ? "AUDITPRO_DEFAULT_PLAN is not set; free fallback is assumed."
      : isPlanId(defaultPlan)
        ? `AUDITPRO_DEFAULT_PLAN is ${defaultPlan}.`
        : `AUDITPRO_DEFAULT_PLAN must be one of ${PLAN_IDS.join(", ")}.`,
  });

  const signupEnabled = envValue("AUDITPRO_SIGNUP_ENABLED");
  checks.push({
    id: "signup_gate",
    status: signupEnabled === "true" ? "error" : signupEnabled === "false" || !signupEnabled ? "ok" : "error",
    message: signupEnabled === "true"
      ? "AUDITPRO_SIGNUP_ENABLED must stay false until onboarding is invite or checkout gated."
      : signupEnabled === "false" || !signupEnabled
        ? "Public email signup is disabled."
        : "AUDITPRO_SIGNUP_ENABLED must be true or false.",
  });

  const logLevel = envValue("AUDITPRO_LOG_LEVEL");
  checks.push({
    id: "log_level",
    status: !logLevel ? "warning" : !allowedLogLevels.includes(logLevel) ? "error" : logLevel === "debug" || logLevel === "off" ? "warning" : "ok",
    message: !logLevel
      ? "AUDITPRO_LOG_LEVEL is not set; info fallback is assumed."
      : !allowedLogLevels.includes(logLevel)
        ? "AUDITPRO_LOG_LEVEL must be one of debug, info, warn, error, or off."
        : logLevel === "debug" || logLevel === "off"
          ? `AUDITPRO_LOG_LEVEL is ${logLevel}; keep production at info unless investigating a short-lived issue.`
          : `AUDITPRO_LOG_LEVEL is ${logLevel}.`,
  });

  const pdfRender = envValue("AUDITPRO_REQUIRE_PDF_RENDER");
  checks.push({
    id: "pdf_render_gate",
    status: !pdfRender || pdfRender === "false" ? "warning" : pdfRender === "true" ? "ok" : "error",
    message: !pdfRender
      ? "AUDITPRO_REQUIRE_PDF_RENDER is not set; PDF raster verification may be skipped."
      : pdfRender === "true"
        ? "PDF raster verification is required."
        : pdfRender === "false"
          ? "PDF raster verification is not required in this environment."
          : "AUDITPRO_REQUIRE_PDF_RENDER must be true or false.",
  });

  const aiInputRate = envValue("AUDITPRO_AI_INPUT_EUR_PER_1K");
  const aiOutputRate = envValue("AUDITPRO_AI_OUTPUT_EUR_PER_1K");
  const rates = [aiInputRate, aiOutputRate].map(Number);
  const anyRateMissing = !aiInputRate || !aiOutputRate;
  const allRatesPositive = rates.every((rate) => Number.isFinite(rate) && rate > 0);
  checks.push({
    id: "ai_cost_rates",
    status: anyRateMissing ? "warning" : allRatesPositive ? "ok" : "error",
    message: anyRateMissing
      ? "AI input/output EUR rates are not both set; runtime defaults are assumed."
      : allRatesPositive
        ? "AI input/output EUR rates are positive."
        : "AI input/output EUR rates must be positive numbers.",
  });

  if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true") {
    const modelKeys = ["AUDITPRO_AI_OPENAI_MODEL", "AUDITPRO_AI_GEMINI_MODEL", "AUDITPRO_AI_PERPLEXITY_MODEL", "AUDITPRO_AI_CLAUDE_MODEL"];
    const models = modelKeys.map((key) => envValue(key));
    const hasPlaceholder = models.some((model) => model && isPlaceholder(model));
    const hasMissing = models.some((model) => !model);
    checks.push({
      id: "ai_models",
      status: hasPlaceholder || hasMissing ? "error" : "ok",
      message: hasPlaceholder
        ? "AI Visibility model IDs must not use placeholder values."
        : hasMissing
          ? "AI Visibility model IDs must all be configured when AI Visibility is enabled."
          : "AI Visibility model IDs are configured.",
    });
  }
}

function launchReportDirectory() {
  return process.env.AUDITPRO_LAUNCH_READINESS_REPORT_DIR ?? join(process.cwd(), "launch-readiness-reports");
}

function backupDirectory() {
  return process.env.AUDITPRO_BACKUP_DIR ?? join(process.cwd(), "backups");
}

function launchScriptId(value: unknown) {
  if (typeof value !== "string") return undefined;
  return launchReadinessScriptIds.has(value) ? value : undefined;
}

function readLatestLaunchReport(now = Date.now()): LaunchHealth {
  const directory = launchReportDirectory();
  if (!existsSync(/*turbopackIgnore: true*/ directory)) return { status: "missing" };

  try {
    const latest = readdirSync(/*turbopackIgnore: true*/ directory)
      .filter((file) => /^launch-readiness-.*\.json$/.test(file))
      .map((file) => join(/*turbopackIgnore: true*/ directory, file))
      .sort((left, right) => statSync(/*turbopackIgnore: true*/ right).mtimeMs - statSync(/*turbopackIgnore: true*/ left).mtimeMs)[0];
    if (!latest) return { status: "missing" };

    const report = JSON.parse(readFileSync(/*turbopackIgnore: true*/ latest, "utf8")) as {
      durationMs?: unknown;
      failedScript?: unknown;
      finishedAt?: unknown;
      status?: unknown;
      steps?: Array<{ status?: unknown }>;
    };
    const status = report.status === "passed" ? "passed" : report.status === "failed" ? "failed" : "missing";
    const steps = Array.isArray(report.steps) ? report.steps : [];
    const finishedAt = typeof report.finishedAt === "string" ? report.finishedAt : undefined;
    const finishedAtMs = finishedAt ? Date.parse(finishedAt) : Number.NaN;
    return {
      status,
      finishedAt,
      ageMs: Number.isFinite(finishedAtMs) ? Math.max(0, now - finishedAtMs) : undefined,
      durationMs: typeof report.durationMs === "number" ? report.durationMs : undefined,
      failedScript: launchScriptId(report.failedScript),
      passedSteps: steps.filter((step) => step.status === "passed").length,
      totalSteps: steps.length,
    };
  } catch {
    return { status: "missing" };
  }
}

function readLatestBackup(now = Date.now(), maxAgeMs = defaultBackupMaxAgeMs): BackupHealth {
  const directory = backupDirectory();
  if (!existsSync(/*turbopackIgnore: true*/ directory)) return { status: "missing" };

  try {
    const latest = readdirSync(/*turbopackIgnore: true*/ directory)
      .filter((file) => /^auditpro-.*\.sql$/.test(file))
      .map((file) => {
        const path = join(/*turbopackIgnore: true*/ directory, file);
        return { path, stat: statSync(/*turbopackIgnore: true*/ path) };
      })
      .filter((file) => file.stat.isFile() && file.stat.size > 0)
      .sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs)[0];
    if (!latest) return { status: "missing" };

    const ageMs = Math.max(0, now - latest.stat.mtimeMs);
    return {
      status: ageMs <= maxAgeMs ? "fresh" : "stale",
      ageMs,
      sizeBytes: latest.stat.size,
    };
  } catch {
    return { status: "missing" };
  }
}

export async function getProductionHealth(): Promise<ProductionHealth> {
  const checks: ProductionHealth["checks"] = [];
  const launch: LaunchHealth = readLatestLaunchReport();
  const launchReportMaxAgeMs = positiveNumberFrom(process.env.AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS, defaultLaunchReportMaxAgeMs);
  const backupMaxAgeMs = positiveNumberFrom(process.env.AUDITPRO_BACKUP_MAX_AGE_MS, defaultBackupMaxAgeMs);
  const backup: BackupHealth = readLatestBackup(Date.now(), backupMaxAgeMs);
  const launchReportStale = launch.status === "passed" && (launch.ageMs === undefined || launch.ageMs > launchReportMaxAgeMs);
  const databaseConfigured = hasDatabase();
  const authConfigured = Boolean(process.env.BETTER_AUTH_SECRET && process.env.BETTER_AUTH_URL);
  const appUrlConfigured = Boolean(process.env.APP_URL || process.env.BETTER_AUTH_URL);
  const stripePricesConfigured = Boolean(
    process.env.AUDITPRO_STRIPE_PRO_PRICE_ID &&
      process.env.AUDITPRO_STRIPE_AGENCY_PRICE_ID &&
      process.env.AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID,
  );

  checks.push({
    id: "database",
    status: "warning",
    message: databaseConfigured ? "DATABASE_URL is configured; connectivity has not been checked yet." : "DATABASE_URL is not configured; local-only storage is active.",
  });
  checks.push({
    id: "auth",
    status: authConfigured ? "ok" : "warning",
    message: authConfigured ? "Authentication secrets are configured." : "Authentication is not fully configured.",
  });
  checks.push({
    id: "billing",
    status: process.env.STRIPE_WEBHOOK_SECRET && stripePricesConfigured ? "ok" : "warning",
    message: process.env.STRIPE_WEBHOOK_SECRET && stripePricesConfigured
      ? "Stripe webhook and price mapping are configured."
      : "Stripe webhook secret or price mapping is missing.",
  });
  checks.push({
    id: "ai",
    status: process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true" && !process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN ? "warning" : "ok",
    message: process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true"
      ? "AI Visibility is enabled."
      : "AI Visibility is disabled.",
  });
  if (!process.env.APP_URL) {
    checks.push({
      id: "security_headers",
      status: "warning",
      message: "APP_URL is not configured; public security header probe was skipped.",
    });
  } else {
    try {
      const probe = await probeSecurityHeaders(process.env.APP_URL);
      checks.push({
        id: "security_headers",
        status: probe.status >= 200 && probe.status < 500 && probe.failures.length === 0 ? "ok" : "error",
        message: probe.failures.length === 0
          ? "Public app response includes enforced CSP and required security headers."
          : `Public app response is missing or weakening: ${probe.failures.join(", ")}.`,
      });
    } catch (error) {
      checks.push({
        id: "security_headers",
        status: "error",
        message: `Public security header probe failed: ${errorMessage(error)}`,
      });
    }
  }
  checks.push({
    id: "launch_readiness",
    status: launch.status === "failed" ? "error" : launch.status === "passed" && !launchReportStale ? "ok" : "warning",
    message: launch.status === "failed"
      ? `Latest launch readiness failed at ${launch.failedScript ?? "an unknown step"}.`
      : launch.status === "passed"
        ? launchReportStale
          ? `Latest launch readiness passed with ${launch.passedSteps ?? 0}/${launch.totalSteps ?? 0} steps, but the report is older than the freshness window.`
          : `Latest launch readiness passed with ${launch.passedSteps ?? 0}/${launch.totalSteps ?? 0} steps.`
        : "No launch readiness report found.",
  });
  checks.push({
    id: "backup",
    status: backup.status === "fresh" ? "ok" : "warning",
    message: backup.status === "fresh"
      ? `Latest database backup is fresh and ${backup.sizeBytes ?? 0} bytes.`
      : backup.status === "stale"
        ? "Latest database backup is older than the freshness window."
        : "No non-empty database backup was found.",
  });
  pushConfigChecks(checks);

  let migrations: ProductionHealth["migrations"];
  let jobs: ProductionHealth["jobs"];
  let usage: ProductionHealth["usage"];
  const aiModels = [
    process.env.AUDITPRO_AI_OPENAI_MODEL,
    process.env.AUDITPRO_AI_GEMINI_MODEL,
    process.env.AUDITPRO_AI_PERPLEXITY_MODEL,
    process.env.AUDITPRO_AI_CLAUDE_MODEL,
  ].filter(Boolean);

  if (databaseConfigured) {
    try {
      await query("SELECT 1");
      const databaseCheck = checks.find((check) => check.id === "database");
      if (databaseCheck) {
        databaseCheck.status = "ok";
        databaseCheck.message = "Database connection succeeded.";
      }
    } catch (error) {
      const message = errorMessage(error);
      const databaseCheck = checks.find((check) => check.id === "database");
      if (databaseCheck) {
        databaseCheck.status = "error";
        databaseCheck.message = `Database connection failed: ${message}`;
      }
      return {
        status: overallStatus(checks),
        checkedAt: new Date().toISOString(),
        runtime: {
          nodeEnv: process.env.NODE_ENV ?? "development",
          appUrlConfigured,
          authConfigured,
          databaseConfigured,
        },
        migrations: { applied: 0, error: message },
        billing: {
          adminSyncConfigured: Boolean(process.env.AUDITPRO_BILLING_SYNC_SECRET),
          stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
          stripePricesConfigured,
        },
        ai: {
          enabled: process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true",
          gatewayConfigured: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
          modelCount: aiModels.length || 3,
        },
        launch,
        backup,
        checks,
      };
    }

    try {
      const [migrationResult, jobResult, usageResult, creditResult, aiCostResult, aiAccountingFailuresResult, stale] = await Promise.all([
        query<{ applied: string; latest: string | null }>(
          `SELECT COUNT(*)::text AS applied, MAX(version) AS latest
           FROM schema_migrations`,
        ),
        query<{ status: string; count: string }>(
          `SELECT status, COUNT(*)::text AS count
           FROM analysis_jobs
           WHERE created_at >= now() - interval '24 hours'
              OR status IN ('queued', 'running')
           GROUP BY status`,
        ),
        query<{ orgs: string; pages: string; reports: string }>(
          `SELECT COUNT(*)::text AS orgs,
                  COALESCE(SUM(pages_crawled), 0)::text AS pages,
                  COALESCE(SUM(ai_reports), 0)::text AS reports
           FROM usage_monthly
           WHERE month = date_trunc('month', now())::date`,
        ),
        query<{ kind: string; amount: string }>(
          `SELECT credit_kind AS kind, COALESCE(SUM(amount), 0)::text AS amount
           FROM credit_ledger
           WHERE month = date_trunc('month', now())::date
           GROUP BY credit_kind`,
        ),
        query<{ cost: string }>(
          `SELECT COALESCE(SUM(estimated_cost_eur), 0)::text AS cost
           FROM ai_usage_events
           WHERE created_at >= date_trunc('month', now())`,
        ),
        query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM ai_accounting_failures
           WHERE resolved_at IS NULL`,
        ),
        query<{ count: string }>(
          `SELECT COUNT(*)::text AS count
           FROM analysis_jobs
           WHERE status = 'running'
             AND updated_at < now() - ($1::int * interval '1 millisecond')`,
          [staleJobMs],
        ),
      ]);

      migrations = {
        applied: numberFrom(migrationResult.rows[0]?.applied),
        latest: migrationResult.rows[0]?.latest ?? undefined,
      };
      checks.push({
        id: "migrations",
        status: migrations.applied >= 2 ? "ok" : "warning",
        message: migrations.applied >= 2 ? `Latest migration: ${migrations.latest}.` : "No migration history found.",
      });

      const counts = new Map(jobResult.rows.map((row) => [row.status, numberFrom(row.count)]));
      jobs = {
        queued: counts.get("queued") ?? 0,
        running: counts.get("running") ?? 0,
        failedRecent: counts.get("failed") ?? 0,
        staleRunning: numberFrom(stale.rows[0]?.count),
      };
      checks.push({
        id: "worker",
        status: jobs.staleRunning > 0 ? "warning" : "ok",
        message: jobs.staleRunning > 0 ? `${jobs.staleRunning} running job(s) are stale.` : "No stale running jobs detected.",
      });

      const credits = new Map(creditResult.rows.map((row) => [row.kind, numberFrom(row.amount)]));
      usage = {
        currentMonthOrganizations: numberFrom(usageResult.rows[0]?.orgs),
        pagesCrawled: numberFrom(usageResult.rows[0]?.pages),
        aiReports: numberFrom(usageResult.rows[0]?.reports),
        aiPromptCredits: credits.get("ai_prompt") ?? 0,
        aiResponseCredits: credits.get("ai_response") ?? 0,
        estimatedAiCostEur: numberFrom(aiCostResult.rows[0]?.cost),
        unresolvedAiAccountingFailures: numberFrom(aiAccountingFailuresResult.rows[0]?.count),
      };
      checks.push({
        id: "ai_accounting_failures",
        status: usage.unresolvedAiAccountingFailures > 0 ? "error" : "ok",
        message: usage.unresolvedAiAccountingFailures > 0
          ? `${usage.unresolvedAiAccountingFailures} unresolved AI accounting failure(s) require review.`
          : "No unresolved AI accounting failures detected.",
      });
    } catch (error) {
      const message = errorMessage(error);
      migrations = { applied: 0, error: message };
      checks.push({
        id: "health_queries",
        status: "error",
        message: `Health aggregate query failed: ${message}`,
      });
    }
  }

  return {
    status: overallStatus(checks),
    checkedAt: new Date().toISOString(),
    runtime: {
      nodeEnv: process.env.NODE_ENV ?? "development",
      appUrlConfigured,
      authConfigured,
      databaseConfigured,
    },
    migrations,
    jobs,
    billing: {
      adminSyncConfigured: Boolean(process.env.AUDITPRO_BILLING_SYNC_SECRET),
      stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
      stripePricesConfigured,
    },
    ai: {
      enabled: process.env.AUDITPRO_AI_VISIBILITY_ENABLED === "true",
      gatewayConfigured: Boolean(process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN),
      modelCount: aiModels.length || 3,
    },
    usage,
    launch,
    backup,
    checks,
  };
}
