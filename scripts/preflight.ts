import { existsSync, readFileSync, readdirSync } from "node:fs";
import { isIP } from "node:net";
import { join } from "node:path";
import { Pool } from "pg";

import { isPlanId, PLAN_IDS } from "../lib/plans";

type PreflightStatus = "ok" | "warning" | "error";

type PreflightCheck = {
  id: string;
  status: PreflightStatus;
  message: string;
};

type PreflightOptions = {
  checkDatabase?: boolean;
};

export type PreflightEnv = Record<string, string | undefined>;

const placeholderPatterns = [
  /^$/,
  /^replace-/,
  /^change-me$/,
  /^placeholder$/i,
  /^your-/i,
  /^test-/i,
  /^demo-/i,
  /^example-/i,
  /^whsec_replace$/,
  /^price_replace_/,
];

function statusRank(status: PreflightStatus) {
  return status === "error" ? 3 : status === "warning" ? 2 : 1;
}

function overallStatus(checks: PreflightCheck[]): PreflightStatus {
  return checks.reduce<PreflightStatus>(
    (current, check) => statusRank(check.status) > statusRank(current) ? check.status : current,
    "ok",
  );
}

function envValue(env: PreflightEnv, key: string) {
  return env[key]?.trim() ?? "";
}

function parseEnvLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) return undefined;
  const separator = trimmed.indexOf("=");
  if (separator === -1) return undefined;
  const key = trimmed.slice(0, separator).trim();
  let value = trimmed.slice(separator + 1).trim();
  if (!/^[A-Z0-9_]+$/.test(key)) return undefined;
  if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
    value = value.slice(1, -1);
  }
  return { key, value };
}

export function loadPreflightEnvContent(
  env: PreflightEnv,
  content: string,
  loadedKeys: Set<string> = new Set(),
) {
  for (const line of content.split(/\r?\n/)) {
    const parsed = parseEnvLine(line);
    if (!parsed) continue;
    if (env[parsed.key] === undefined || loadedKeys.has(parsed.key)) {
      env[parsed.key] = parsed.value;
      loadedKeys.add(parsed.key);
    }
  }
  return loadedKeys;
}

export function loadPreflightEnv(env: PreflightEnv = process.env) {
  const loadedKeys = new Set<string>();
  for (const file of [".env", ".env.local"]) {
    const path = join(process.cwd(), file);
    if (!existsSync(path)) continue;
    loadPreflightEnvContent(env, readFileSync(path, "utf8"), loadedKeys);
  }
}

function isPlaceholder(value: string) {
  return placeholderPatterns.some((pattern) => pattern.test(value));
}

function requireSecret(env: PreflightEnv, key: string, minLength: number, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  if (!value) {
    checks.push({ id: key, status: "error", message: `${key} is missing.` });
    return;
  }
  if (isPlaceholder(value)) {
    checks.push({ id: key, status: "error", message: `${key} still uses a placeholder value.` });
    return;
  }
  if (value.length < minLength) {
    checks.push({ id: key, status: "warning", message: `${key} is shorter than the recommended ${minLength} characters.` });
    return;
  }
  checks.push({ id: key, status: "ok", message: `${key} is configured.` });
}

function requireHostname(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  if (!value) {
    checks.push({ id: key, status: "error", message: `${key} is missing.` });
    return undefined;
  }
  if (isPlaceholder(value)) {
    checks.push({ id: key, status: "error", message: `${key} still uses a placeholder value.` });
    return undefined;
  }
  if (/^https?:\/\//i.test(value) || /[/?#]/.test(value)) {
    checks.push({ id: key, status: "error", message: `${key} must be a hostname without protocol or path.` });
    return undefined;
  }
  try {
    const parsed = new URL(`https://${value}`);
    const hostname = parsed.hostname.toLowerCase();
    const publicHostname = isIP(hostname) === 0 &&
      hostname.includes(".") &&
      hostname !== "localhost" &&
      !hostname.endsWith(".localhost") &&
      !hostname.endsWith(".local");
    checks.push({
      id: key,
      status: publicHostname ? "ok" : "error",
      message: publicHostname ? `${key} is configured.` : `${key} must be a public production hostname.`,
    });
    return publicHostname ? hostname : undefined;
  } catch {
    checks.push({ id: key, status: "error", message: `${key} is not a valid hostname.` });
    return undefined;
  }
}

function requireUrl(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  if (!value) {
    checks.push({ id: key, status: "error", message: `${key} is missing.` });
    return undefined;
  }
  try {
    const parsed = new URL(value);
    const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    checks.push({
      id: key,
      status: parsed.protocol === "https:" || isLocal ? "ok" : "error",
      message: parsed.protocol === "https:" || isLocal
        ? `${key} is ${parsed.origin}.`
        : `${key} must use HTTPS for production.`,
    });
    return parsed;
  } catch {
    checks.push({ id: key, status: "error", message: `${key} is not a valid URL.` });
    return undefined;
  }
}

function requireDatabaseUrl(env: PreflightEnv, checks: PreflightCheck[]) {
  const value = envValue(env, "DATABASE_URL");
  if (!value) {
    checks.push({ id: "DATABASE_URL", status: "error", message: "DATABASE_URL is missing." });
    return;
  }
  try {
    const parsed = new URL(value);
    const isPostgres = ["postgres:", "postgresql:"].includes(parsed.protocol);
    if (!isPostgres) {
      checks.push({
        id: "DATABASE_URL",
        status: "error",
        message: "DATABASE_URL must be a PostgreSQL URL.",
      });
      return;
    }
    if (isPlaceholder(parsed.password)) {
      checks.push({
        id: "DATABASE_URL",
        status: "error",
        message: "DATABASE_URL still uses a placeholder database password.",
      });
      return;
    }
    checks.push({
      id: "DATABASE_URL",
      status: "ok",
      message: "DATABASE_URL uses PostgreSQL.",
    });
  } catch {
    checks.push({ id: "DATABASE_URL", status: "error", message: "DATABASE_URL is not a valid connection string." });
  }
}

function requireBoolean(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  const valid = value === "true" || value === "false";
  checks.push({
    id: key,
    status: valid ? "ok" : "error",
    message: valid ? `${key} is ${value}.` : `${key} must be true or false.`,
  });
}

function forbidEnabledFlag(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  if (value === "true" || value === "1") {
    checks.push({
      id: key,
      status: "error",
      message: `${key} must not be enabled in production.`,
    });
    return;
  }
  checks.push({
    id: key,
    status: "ok",
    message: value ? `${key} is disabled.` : `${key} is not set.`,
  });
}

function forbidValue(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  if (value) {
    checks.push({
      id: key,
      status: "error",
      message: `${key} must be empty in production.`,
    });
    return;
  }
  checks.push({
    id: key,
    status: "ok",
    message: `${key} is not set.`,
  });
}

function requirePositiveInt(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = Number(envValue(env, key));
  checks.push({
    id: key,
    status: Number.isInteger(value) && value > 0 ? "ok" : "error",
    message: Number.isInteger(value) && value > 0 ? `${key} is ${value}.` : `${key} must be a positive integer.`,
  });
}

function requirePositiveNumber(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = Number(envValue(env, key));
  checks.push({
    id: key,
    status: Number.isFinite(value) && value > 0 ? "ok" : "error",
    message: Number.isFinite(value) && value > 0 ? `${key} is ${value}.` : `${key} must be a positive number.`,
  });
}

function requirePlanId(env: PreflightEnv, checks: PreflightCheck[]) {
  const value = envValue(env, "AUDITPRO_DEFAULT_PLAN");
  checks.push({
    id: "AUDITPRO_DEFAULT_PLAN",
    status: isPlanId(value) ? "ok" : "error",
    message: isPlanId(value)
      ? `AUDITPRO_DEFAULT_PLAN is ${value}.`
      : `AUDITPRO_DEFAULT_PLAN must be one of ${PLAN_IDS.join(", ")}.`,
  });
}

function requireConfiguredText(env: PreflightEnv, key: string, checks: PreflightCheck[]) {
  const value = envValue(env, key);
  checks.push({
    id: key,
    status: value && !isPlaceholder(value) ? "ok" : "error",
    message: value && !isPlaceholder(value) ? `${key} is configured.` : `${key} must be configured.`,
  });
}

function requireLogLevel(env: PreflightEnv, checks: PreflightCheck[]) {
  const value = envValue(env, "AUDITPRO_LOG_LEVEL");
  const allowed = ["debug", "info", "warn", "error", "off"];
  if (!allowed.includes(value)) {
    checks.push({
      id: "AUDITPRO_LOG_LEVEL",
      status: "error",
      message: "AUDITPRO_LOG_LEVEL must be one of debug, info, warn, error, or off.",
    });
    return;
  }
  checks.push({
    id: "AUDITPRO_LOG_LEVEL",
    status: value === "debug" || value === "off" ? "warning" : "ok",
    message: value === "debug" || value === "off"
      ? `AUDITPRO_LOG_LEVEL is ${value}; keep production at info unless investigating a short-lived issue.`
      : `AUDITPRO_LOG_LEVEL is ${value}.`,
  });
}

function requireStripePriceIds(env: PreflightEnv, checks: PreflightCheck[]) {
  for (const key of [
    "AUDITPRO_STRIPE_PRO_PRICE_ID",
    "AUDITPRO_STRIPE_AGENCY_PRICE_ID",
    "AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID",
  ]) {
    const value = envValue(env, key);
    checks.push({
      id: key,
      status: value.startsWith("price_") && !isPlaceholder(value) ? "ok" : "error",
      message: value.startsWith("price_") && !isPlaceholder(value)
        ? `${key} is mapped.`
        : `${key} must be a real Stripe price id.`,
    });
  }
}

function requireStripeWebhookSecret(env: PreflightEnv, checks: PreflightCheck[]) {
  const value = envValue(env, "STRIPE_WEBHOOK_SECRET");
  if (!value) {
    checks.push({ id: "STRIPE_WEBHOOK_SECRET", status: "error", message: "STRIPE_WEBHOOK_SECRET is missing." });
    return;
  }
  if (isPlaceholder(value)) {
    checks.push({ id: "STRIPE_WEBHOOK_SECRET", status: "error", message: "STRIPE_WEBHOOK_SECRET still uses a placeholder value." });
    return;
  }
  if (value.length < 12) {
    checks.push({ id: "STRIPE_WEBHOOK_SECRET", status: "error", message: "STRIPE_WEBHOOK_SECRET is too short." });
    return;
  }
  checks.push({
    id: "STRIPE_WEBHOOK_SECRET",
    status: value.startsWith("whsec_") && value.length > "whsec_".length ? "ok" : "error",
    message: value.startsWith("whsec_") && value.length > "whsec_".length
      ? "STRIPE_WEBHOOK_SECRET has the expected Stripe webhook prefix."
      : "STRIPE_WEBHOOK_SECRET must start with whsec_.",
  });
}

function migrationCount() {
  return readdirSync(join(process.cwd(), "database", "migrations"))
    .filter((file) => /^\d+_[a-z0-9_]+\.sql$/i.test(file))
    .length;
}

async function databaseCheck(env: PreflightEnv, checks: PreflightCheck[]) {
  const databaseUrl = envValue(env, "DATABASE_URL");
  if (!databaseUrl) return;

  const pool = new Pool({
    connectionString: databaseUrl,
    max: 1,
    connectionTimeoutMillis: 5_000,
  });

  try {
    await pool.query("SELECT 1");
    const migrationResult = await pool.query<{ count: string }>("SELECT COUNT(*)::text AS count FROM schema_migrations");
    const applied = Number(migrationResult.rows[0]?.count ?? 0);
    const expected = migrationCount();
    checks.push({
      id: "database_connectivity",
      status: "ok",
      message: "Database connectivity succeeded.",
    });
    checks.push({
      id: "database_migrations",
      status: applied >= expected ? "ok" : "error",
      message: `Applied migrations: ${applied}/${expected}.`,
    });
  } catch (error) {
    checks.push({
      id: "database_connectivity",
      status: "error",
      message: error instanceof Error ? error.message : "Database connectivity failed.",
    });
  } finally {
    await pool.end().catch(() => undefined);
  }
}

export async function runPreflight(env: PreflightEnv = process.env, options: PreflightOptions = {}) {
  const checks: PreflightCheck[] = [];
  const mode = envValue(env, "AUDITPRO_DEPLOYMENT_MODE");
  const pilot = mode === "pilot" || mode === "public-test";
  const passwordPilotAi = mode === "pilot" &&
    envValue(env, "AUDITPRO_PUBLIC_ANALYSIS_ENABLED") === "true" &&
    envValue(env, "AUDITPRO_AI_VISIBILITY_ENABLED") === "true" &&
    envValue(env, "AUDITPRO_PILOT_AI_ENABLED") === "true";
  const unlimitedPilotPages = envValue(env, "AUDITPRO_PILOT_UNLIMITED_PAGES") === "true";
  if (mode === "pilot") {
    requireConfiguredText(env, "PILOT_AUTH_USER", checks);
    checks.push({ id: "pilot_access", status: /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(envValue(env, "PILOT_AUTH_HASH")) ? "ok" : "error", message: "Pilot requires a bcrypt access hash; verify the Caddy access gate before publishing." });
  }
  if (pilot) {
    if (mode === "public-test") checks.push({ id: "public_test_plan", status: envValue(env, "AUDITPRO_DEFAULT_PLAN") === "free" ? "ok" : "error", message: "Public test requires the free plan; owner authorization is required before exposing the site." });
    for (const key of ["AUDITPRO_BILLING_SYNC_SECRET", "STRIPE_WEBHOOK_SECRET", "AUDITPRO_STRIPE_PRO_PRICE_ID", "AUDITPRO_STRIPE_AGENCY_PRICE_ID", "AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID"]) forbidValue(env, key, checks);
    if (!passwordPilotAi) {
      for (const key of ["AI_GATEWAY_API_KEY", "VERCEL_OIDC_TOKEN"]) forbidValue(env, key, checks);
      forbidEnabledFlag(env, "AUDITPRO_AI_VISIBILITY_ENABLED", checks);
    }
    if (mode === "pilot") {
      requireBoolean(env, "AUDITPRO_PUBLIC_ANALYSIS_ENABLED", checks);
      requireBoolean(env, "AUDITPRO_PILOT_AI_ENABLED", checks);
      checks.push({
        id: "pilot_ai_scope",
        status: envValue(env, "AUDITPRO_PILOT_AI_ENABLED") !== "true" || passwordPilotAi ? "ok" : "error",
        message: passwordPilotAi
          ? "Billable AI is restricted to the password-protected public-analysis pilot."
          : "Pilot AI remains disabled unless every password-pilot safety flag is enabled.",
      });
    }
  }
  const appDomain = requireHostname(env, "APP_DOMAIN", checks);
  const appUrl = requireUrl(env, "APP_URL", checks);
  const authUrl = requireUrl(env, "BETTER_AUTH_URL", checks);

  if (appDomain && appUrl && appUrl.hostname.toLowerCase() !== appDomain) {
    checks.push({
      id: "app_domain_url",
      status: "error",
      message: "APP_DOMAIN must match APP_URL hostname.",
    });
  } else if (appDomain && appUrl) {
    checks.push({ id: "app_domain_url", status: "ok", message: "APP_DOMAIN matches APP_URL." });
  }

  if (appUrl && authUrl && appUrl.origin !== authUrl.origin) {
    checks.push({
      id: "app_auth_origin",
      status: "error",
      message: `APP_URL origin (${appUrl.origin}) differs from BETTER_AUTH_URL origin (${authUrl.origin}).`,
    });
  } else if (appUrl && authUrl) {
    checks.push({ id: "app_auth_origin", status: "ok", message: "APP_URL and BETTER_AUTH_URL origins match." });
  }

  requireDatabaseUrl(env, checks);
  requireSecret(env, "POSTGRES_PASSWORD", 16, checks);
  requireSecret(env, "BETTER_AUTH_SECRET", 32, checks);
  requireSecret(env, "AUDITPRO_ADMIN_SECRET", 24, checks);
  if (!pilot) {
    requireSecret(env, "AUDITPRO_BILLING_SYNC_SECRET", 24, checks);
    requireStripeWebhookSecret(env, checks);
    requireStripePriceIds(env, checks);
  }
  requirePlanId(env, checks);
  requirePositiveInt(env, "DATABASE_POOL_SIZE", checks);
  requirePositiveInt(env, "AUDITPRO_STALE_JOB_MS", checks);
  requirePositiveInt(env, "AUDITPRO_WORKER_POLL_MS", checks);
  requirePositiveInt(env, "AUDITPRO_MIGRATION_LOCK_TIMEOUT_MS", checks);
  requirePositiveInt(env, "AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS", checks);
  requirePositiveInt(env, "AUDITPRO_BACKUP_MAX_AGE_MS", checks);
  requirePositiveNumber(env, "AUDITPRO_AI_INPUT_EUR_PER_1K", checks);
  requirePositiveNumber(env, "AUDITPRO_AI_OUTPUT_EUR_PER_1K", checks);
  requireLogLevel(env, checks);
  requireBoolean(env, "AUDITPRO_AI_VISIBILITY_ENABLED", checks);
  requireBoolean(env, "AUDITPRO_INLINE_ANALYSIS_JOBS", checks);
  requireBoolean(env, "AUDITPRO_ALLOW_SEED", checks);
  requireBoolean(env, "AUDITPRO_ALLOW_PRODUCTION_SEED", checks);
  requireBoolean(env, "AUDITPRO_ALLOW_REMOTE_SEED", checks);
  requireBoolean(env, "AUDITPRO_REQUIRE_PDF_RENDER", checks);
  requireBoolean(env, "AUDITPRO_SIGNUP_ENABLED", checks);
  requireBoolean(env, "AUDITPRO_PILOT_UNLIMITED_PAGES", checks);
  checks.push({
    id: "pilot_unlimited_pages_scope",
    status: !unlimitedPilotPages || mode === "pilot" ? "ok" : "error",
    message: unlimitedPilotPages
      ? "Unlimited monthly page analysis is restricted to the password-protected pilot."
      : "Unlimited pilot page analysis is disabled.",
  });
  forbidEnabledFlag(env, "AUDITPRO_E2E_CLOUD_MOCK", checks);
  forbidValue(env, "AUDITPRO_E2E_CLOUD_MOCK_TOKEN", checks);
  if (!pilot) forbidEnabledFlag(env, "AUDITPRO_SIGNUP_ENABLED", checks);

  const aiGatewayKey = envValue(env, "AI_GATEWAY_API_KEY");
  const vercelOidcToken = envValue(env, "VERCEL_OIDC_TOKEN");
  const hasValidAiCredential = Boolean(aiGatewayKey && !isPlaceholder(aiGatewayKey) && aiGatewayKey.length >= 20) ||
    Boolean(vercelOidcToken && !isPlaceholder(vercelOidcToken) && vercelOidcToken.length >= 20);
  if (envValue(env, "AUDITPRO_AI_VISIBILITY_ENABLED") === "true" && !hasValidAiCredential) {
    checks.push({
      id: "AI_GATEWAY_API_KEY",
      status: "error",
      message: "AI Visibility is enabled but no AI gateway credential is configured.",
    });
  }
  if (envValue(env, "AUDITPRO_AI_VISIBILITY_ENABLED") === "true") {
    requireConfiguredText(env, "AUDITPRO_AI_OPENAI_MODEL", checks);
    requireConfiguredText(env, "AUDITPRO_AI_GEMINI_MODEL", checks);
    requireConfiguredText(env, "AUDITPRO_AI_PERPLEXITY_MODEL", checks);
    requireConfiguredText(env, "AUDITPRO_AI_CLAUDE_MODEL", checks);
  }

  const inlineJobs = envValue(env, "AUDITPRO_INLINE_ANALYSIS_JOBS");
  if (inlineJobs === "true") {
    checks.push({
      id: "worker_mode",
      status: "warning",
      message: "AUDITPRO_INLINE_ANALYSIS_JOBS should be false in production so workers process durable jobs.",
    });
  } else if (inlineJobs === "false") {
    checks.push({ id: "worker_mode", status: "ok", message: "Durable worker mode is enabled." });
  }

  if (envValue(env, "AUDITPRO_ALLOW_SEED") === "true" || envValue(env, "AUDITPRO_ALLOW_PRODUCTION_SEED") === "true" || envValue(env, "AUDITPRO_ALLOW_REMOTE_SEED") === "true") {
    checks.push({
      id: "seed_guards",
      status: "error",
      message: "Seed guards must stay disabled for production preflight.",
    });
  } else {
    checks.push({ id: "seed_guards", status: "ok", message: "Seed guards are disabled." });
  }

  if (options.checkDatabase || envValue(env, "AUDITPRO_PREFLIGHT_CHECK_DB") === "true") {
    await databaseCheck(env, checks);
  }

  return {
    status: overallStatus(checks),
    checkedAt: new Date().toISOString(),
    checks,
  };
}

function printPreflight(result: Awaited<ReturnType<typeof runPreflight>>) {
  console.log(`AuditPro preflight: ${result.status.toUpperCase()} (${result.checkedAt})`);
  for (const check of result.checks) {
    console.log(`${check.status.toUpperCase().padEnd(7)} ${check.id} - ${check.message}`);
  }
}

async function main() {
  loadPreflightEnv();
  const result = await runPreflight();
  printPreflight(result);
  if (result.status === "error") process.exitCode = 1;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/scripts/preflight.ts")) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
