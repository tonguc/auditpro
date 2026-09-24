import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  loadPreflightEnv,
  loadPreflightEnvContent,
  runPreflight,
  type PreflightEnv,
} from "./preflight";

const productionEnv = {
  AUDITPRO_DEFAULT_PLAN: "free",
  AUDITPRO_DEPLOYMENT_MODE: "production",
  AUDITPRO_PILOT_UNLIMITED_PAGES: "false",
  APP_DOMAIN: "auditpro.example.com",
  APP_URL: "https://auditpro.example.com",
  BETTER_AUTH_URL: "https://auditpro.example.com",
  DATABASE_URL: "postgresql://auditpro:strong-password@localhost:5432/auditpro",
  POSTGRES_PASSWORD: "strong-postgres-password",
  BETTER_AUTH_SECRET: "12345678901234567890123456789012",
  AUDITPRO_ADMIN_SECRET: "admin-secret-123456789012",
  AUDITPRO_BILLING_SYNC_SECRET: "billing-secret-1234567890",
  STRIPE_WEBHOOK_SECRET: "whsec_live_123",
  AUDITPRO_STRIPE_PRO_PRICE_ID: "price_live_pro",
  AUDITPRO_STRIPE_AGENCY_PRICE_ID: "price_live_agency",
  AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID: "price_live_enterprise",
  DATABASE_POOL_SIZE: "10",
  AUDITPRO_STALE_JOB_MS: "1800000",
  AUDITPRO_WORKER_POLL_MS: "2500",
  AUDITPRO_MIGRATION_LOCK_TIMEOUT_MS: "30000",
  AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS: "86400000",
  AUDITPRO_BACKUP_MAX_AGE_MS: "86400000",
  AUDITPRO_LOG_LEVEL: "info",
  AUDITPRO_AI_INPUT_EUR_PER_1K: "0.002",
  AUDITPRO_AI_OUTPUT_EUR_PER_1K: "0.006",
  AUDITPRO_AI_OPENAI_MODEL: "openai/gpt-5.6-luna",
  AUDITPRO_AI_GEMINI_MODEL: "google/gemini-3.5-flash-lite",
  AUDITPRO_AI_PERPLEXITY_MODEL: "perplexity/sonar",
  AUDITPRO_AI_CLAUDE_MODEL: "anthropic/claude-sonnet-4.6",
  AUDITPRO_AI_VISIBILITY_ENABLED: "false",
  AUDITPRO_INLINE_ANALYSIS_JOBS: "false",
  AUDITPRO_ALLOW_SEED: "false",
  AUDITPRO_ALLOW_PRODUCTION_SEED: "false",
  AUDITPRO_ALLOW_REMOTE_SEED: "false",
  AUDITPRO_REQUIRE_PDF_RENDER: "true",
  AUDITPRO_SIGNUP_ENABLED: "false",
  AUDITPRO_E2E_CLOUD_MOCK: "false",
  AUDITPRO_E2E_CLOUD_MOCK_TOKEN: "",
} satisfies PreflightEnv;

async function main() {
  const healthy = await runPreflight(productionEnv);
  assert.equal(healthy.status, "ok");
  const pilotEnv: PreflightEnv = { ...productionEnv, AUDITPRO_DEPLOYMENT_MODE: "pilot", AUDITPRO_PILOT_UNLIMITED_PAGES: "true", AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "false", AUDITPRO_PILOT_AI_ENABLED: "false", PILOT_AUTH_USER: "tester", PILOT_AUTH_HASH: "$2a$14$" + "a".repeat(53), AUDITPRO_SIGNUP_ENABLED: "true", AUDITPRO_BILLING_SYNC_SECRET: "", STRIPE_WEBHOOK_SECRET: "", AUDITPRO_STRIPE_PRO_PRICE_ID: "", AUDITPRO_STRIPE_AGENCY_PRICE_ID: "", AUDITPRO_STRIPE_ENTERPRISE_PRICE_ID: "" };
  assert.equal((await runPreflight(pilotEnv)).status, "ok");
  const publicTestEnv = { ...pilotEnv, AUDITPRO_DEPLOYMENT_MODE: "public-test", AUDITPRO_PILOT_UNLIMITED_PAGES: "false", PILOT_AUTH_USER: "", PILOT_AUTH_HASH: "" };
  assert.equal((await runPreflight(publicTestEnv)).status, "ok");
  assert.equal((await runPreflight({ ...publicTestEnv, AUDITPRO_DEFAULT_PLAN: "pro" })).status, "error");
  assert.equal((await runPreflight({ ...publicTestEnv, STRIPE_WEBHOOK_SECRET: "whsec_live_123" })).status, "error");
  assert.equal((await runPreflight({ ...publicTestEnv, AUDITPRO_AI_VISIBILITY_ENABLED: "true" })).status, "error");
  assert.equal((await runPreflight({ ...pilotEnv, PILOT_AUTH_HASH: "" })).status, "error");
  assert.equal((await runPreflight({ ...pilotEnv, STRIPE_WEBHOOK_SECRET: "whsec_live_123" })).status, "error");
  assert.equal((await runPreflight({ ...pilotEnv, AUDITPRO_AI_VISIBILITY_ENABLED: "true" })).status, "error");
  const billablePilotEnv: PreflightEnv = {
    ...pilotEnv,
    AUDITPRO_SIGNUP_ENABLED: "false",
    AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "true",
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AUDITPRO_PILOT_AI_ENABLED: "true",
    AI_GATEWAY_API_KEY: "live-ai-gateway-key-123456",
  };
  assert.equal((await runPreflight(billablePilotEnv)).status, "ok");
  assert.equal((await runPreflight({ ...billablePilotEnv, AUDITPRO_PUBLIC_ANALYSIS_ENABLED: "false" })).status, "error");
  assert.equal((await runPreflight({ ...billablePilotEnv, AUDITPRO_PILOT_AI_ENABLED: "false" })).status, "error");
  assert.equal((await runPreflight({ ...pilotEnv, AUDITPRO_DEPLOYMENT_MODE: "production" })).status, "error");
  assert.equal((await runPreflight({ ...publicTestEnv, AUDITPRO_PILOT_UNLIMITED_PAGES: "true" })).status, "error");
  assert.ok(healthy.checks.some((check) => check.id === "worker_mode" && check.status === "ok"));
  assert.ok(healthy.checks.some((check) => check.id === "AUDITPRO_E2E_CLOUD_MOCK" && check.status === "ok"));
  assert.ok(healthy.checks.some((check) => check.id === "AUDITPRO_E2E_CLOUD_MOCK_TOKEN" && check.status === "ok"));
  assert.ok(!healthy.checks.some((check) => check.id === "database_connectivity"));

  const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  const packageLock = JSON.parse(readFileSync(join(process.cwd(), "package-lock.json"), "utf8")) as {
    packages?: Record<string, {
      dependencies?: Record<string, string>;
      devDependencies?: Record<string, string>;
      version?: string;
    }>;
  };
  const lockRoot = packageLock.packages?.[""];
  const dependencyVersions = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const lockDependencyVersions = {
    ...lockRoot?.dependencies,
    ...lockRoot?.devDependencies,
  };
  const exactVersionPattern = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
  for (const [name, version] of Object.entries(dependencyVersions)) {
    assert.match(version, exactVersionPattern, `${name} must use an exact version for reproducible production builds`);
    assert.equal(lockDependencyVersions[name], version, `${name} must match package-lock root metadata`);
    assert.equal(packageLock.packages?.[`node_modules/${name}`]?.version, version, `${name} must match package-lock resolved version`);
  }

  const placeholder = await runPreflight({
    ...productionEnv,
    BETTER_AUTH_SECRET: "replace-with-at-least-32-random-characters",
    AUDITPRO_INLINE_ANALYSIS_JOBS: "true",
  });
  assert.equal(placeholder.status, "error");
  assert.ok(placeholder.checks.some((check) => check.id === "BETTER_AUTH_SECRET" && check.status === "error"));
  assert.ok(placeholder.checks.some((check) => check.id === "worker_mode" && check.status === "warning"));

  const missingComposeInput = await runPreflight({
    ...productionEnv,
    APP_DOMAIN: "",
    POSTGRES_PASSWORD: "",
  });
  assert.equal(missingComposeInput.status, "error");
  assert.ok(missingComposeInput.checks.some((check) => check.id === "APP_DOMAIN" && check.status === "error"));
  assert.ok(missingComposeInput.checks.some((check) => check.id === "POSTGRES_PASSWORD" && check.status === "error"));

  const appDomainMismatch = await runPreflight({
    ...productionEnv,
    APP_DOMAIN: "other.example.com",
  });
  assert.equal(appDomainMismatch.status, "error");
  assert.ok(appDomainMismatch.checks.some((check) => check.id === "app_domain_url" && check.status === "error"));

  for (const APP_DOMAIN of ["127.0.0.1", "10.0.0.1"]) {
    const privateAppDomain = await runPreflight({
      ...productionEnv,
      APP_DOMAIN,
    });
    assert.equal(privateAppDomain.status, "error");
    assert.ok(privateAppDomain.checks.some((check) =>
      check.id === "APP_DOMAIN" &&
      check.status === "error" &&
      check.message.includes("public production hostname")
    ));
  }

  const aiMissingGateway = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
  });
  assert.equal(aiMissingGateway.status, "error");
  assert.ok(aiMissingGateway.checks.some((check) => check.id === "AI_GATEWAY_API_KEY" && check.status === "error"));

  const aiPlaceholderGateway = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AI_GATEWAY_API_KEY: "replace-with-ai-key",
  });
  assert.equal(aiPlaceholderGateway.status, "error");
  assert.ok(aiPlaceholderGateway.checks.some((check) => check.id === "AI_GATEWAY_API_KEY" && check.status === "error"));

  const aiTestGateway = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AI_GATEWAY_API_KEY: "test-key",
  });
  assert.equal(aiTestGateway.status, "error");
  assert.ok(aiTestGateway.checks.some((check) => check.id === "AI_GATEWAY_API_KEY" && check.status === "error"));

  const aiConfigured = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AI_GATEWAY_API_KEY: "live-ai-gateway-key-123456",
  });
  assert.equal(aiConfigured.status, "ok");

  const invalidDefaultPlan = await runPreflight({
    ...productionEnv,
    AUDITPRO_DEFAULT_PLAN: "starter",
  });
  assert.equal(invalidDefaultPlan.status, "error");
  assert.ok(invalidDefaultPlan.checks.some((check) =>
    check.id === "AUDITPRO_DEFAULT_PLAN" &&
    check.status === "error"
  ));

  const signupEnabled = await runPreflight({
    ...productionEnv,
    AUDITPRO_SIGNUP_ENABLED: "true",
  });
  assert.equal(signupEnabled.status, "error");
  assert.ok(signupEnabled.checks.some((check) =>
    check.id === "AUDITPRO_SIGNUP_ENABLED" &&
    check.status === "error"
  ));

  const invalidAiInputPrice = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_INPUT_EUR_PER_1K: "0",
  });
  assert.equal(invalidAiInputPrice.status, "error");
  assert.ok(invalidAiInputPrice.checks.some((check) =>
    check.id === "AUDITPRO_AI_INPUT_EUR_PER_1K" &&
    check.status === "error"
  ));

  const invalidAiOutputPrice = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_OUTPUT_EUR_PER_1K: "free",
  });
  assert.equal(invalidAiOutputPrice.status, "error");
  assert.ok(invalidAiOutputPrice.checks.some((check) =>
    check.id === "AUDITPRO_AI_OUTPUT_EUR_PER_1K" &&
    check.status === "error"
  ));

  const missingAiModel = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AI_GATEWAY_API_KEY: "live-ai-gateway-key-123456",
    AUDITPRO_AI_GEMINI_MODEL: "",
  });
  assert.equal(missingAiModel.status, "error");
  assert.ok(missingAiModel.checks.some((check) =>
    check.id === "AUDITPRO_AI_GEMINI_MODEL" &&
    check.status === "error"
  ));

  const placeholderAiModel = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AI_GATEWAY_API_KEY: "live-ai-gateway-key-123456",
    AUDITPRO_AI_PERPLEXITY_MODEL: "replace-with-model",
  });
  assert.equal(placeholderAiModel.status, "error");
  assert.ok(placeholderAiModel.checks.some((check) =>
    check.id === "AUDITPRO_AI_PERPLEXITY_MODEL" &&
    check.status === "error"
  ));

  const missingClaudeModel = await runPreflight({
    ...productionEnv,
    AUDITPRO_AI_VISIBILITY_ENABLED: "true",
    AI_GATEWAY_API_KEY: "live-ai-gateway-key-123456",
    AUDITPRO_AI_CLAUDE_MODEL: "",
  });
  assert.equal(missingClaudeModel.status, "error");
  assert.ok(missingClaudeModel.checks.some((check) => check.id === "AUDITPRO_AI_CLAUDE_MODEL" && check.status === "error"));

  const invalidStripeSecret = await runPreflight({
    ...productionEnv,
    STRIPE_WEBHOOK_SECRET: "plain-secret-123456",
  });
  assert.equal(invalidStripeSecret.status, "error");
  assert.ok(invalidStripeSecret.checks.some((check) => check.id === "STRIPE_WEBHOOK_SECRET" && check.status === "error"));

  const emptyStripeSecret = await runPreflight({
    ...productionEnv,
    STRIPE_WEBHOOK_SECRET: "whsec_",
  });
  assert.equal(emptyStripeSecret.status, "error");
  assert.ok(emptyStripeSecret.checks.some((check) => check.id === "STRIPE_WEBHOOK_SECRET" && check.status === "error"));

  const invalidLaunchReadinessMaxAge = await runPreflight({
    ...productionEnv,
    AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS: "0",
  });
  assert.equal(invalidLaunchReadinessMaxAge.status, "error");
  assert.ok(invalidLaunchReadinessMaxAge.checks.some((check) =>
    check.id === "AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS" &&
    check.status === "error"
  ));

  const invalidBackupMaxAge = await runPreflight({
    ...productionEnv,
    AUDITPRO_BACKUP_MAX_AGE_MS: "0",
  });
  assert.equal(invalidBackupMaxAge.status, "error");
  assert.ok(invalidBackupMaxAge.checks.some((check) =>
    check.id === "AUDITPRO_BACKUP_MAX_AGE_MS" &&
    check.status === "error"
  ));

  const invalidLogLevel = await runPreflight({
    ...productionEnv,
    AUDITPRO_LOG_LEVEL: "verbose",
  });
  assert.equal(invalidLogLevel.status, "error");
  assert.ok(invalidLogLevel.checks.some((check) =>
    check.id === "AUDITPRO_LOG_LEVEL" &&
    check.status === "error"
  ));

  const disabledLogLevel = await runPreflight({
    ...productionEnv,
    AUDITPRO_LOG_LEVEL: "off",
  });
  assert.equal(disabledLogLevel.status, "warning");
  assert.ok(disabledLogLevel.checks.some((check) =>
    check.id === "AUDITPRO_LOG_LEVEL" &&
    check.status === "warning" &&
    check.message.includes("keep production at info")
  ));

  const layeredEnv: PreflightEnv = { SHELL_ONLY: "from-shell" };
  const loadedKeys = loadPreflightEnvContent(layeredEnv, "BETTER_AUTH_SECRET=replace-me\nSHELL_ONLY=from-dotenv");
  loadPreflightEnvContent(layeredEnv, "BETTER_AUTH_SECRET=real-secret\nSHELL_ONLY=from-local", loadedKeys);
  assert.equal(layeredEnv.BETTER_AUTH_SECRET, "real-secret");
  assert.equal(layeredEnv.SHELL_ONLY, "from-shell");

  const authOriginMismatch = await runPreflight({
    ...productionEnv,
    BETTER_AUTH_URL: "https://auth.auditpro.example.com",
  });
  assert.equal(authOriginMismatch.status, "error");
  assert.ok(authOriginMismatch.checks.some((check) => check.id === "app_auth_origin" && check.status === "error"));

  const publicHttpUrl = await runPreflight({
    ...productionEnv,
    APP_URL: "http://auditpro.example.com",
  });
  assert.equal(publicHttpUrl.status, "error");
  assert.ok(publicHttpUrl.checks.some((check) => check.id === "APP_URL" && check.status === "error"));

  const e2eCloudMockEnabled = await runPreflight({
    ...productionEnv,
    AUDITPRO_E2E_CLOUD_MOCK: "1",
  });
  assert.equal(e2eCloudMockEnabled.status, "error");
  assert.ok(e2eCloudMockEnabled.checks.some((check) => check.id === "AUDITPRO_E2E_CLOUD_MOCK" && check.status === "error"));

  const invalidPdfRenderRequirement = await runPreflight({
    ...productionEnv,
    AUDITPRO_REQUIRE_PDF_RENDER: "yes",
  });
  assert.equal(invalidPdfRenderRequirement.status, "error");
  assert.ok(invalidPdfRenderRequirement.checks.some((check) =>
    check.id === "AUDITPRO_REQUIRE_PDF_RENDER" &&
    check.status === "error"
  ));

  const e2eCloudMockTokenSet = await runPreflight({
    ...productionEnv,
    AUDITPRO_E2E_CLOUD_MOCK_TOKEN: "local-test-token",
  });
  assert.equal(e2eCloudMockTokenSet.status, "error");
  assert.ok(e2eCloudMockTokenSet.checks.some((check) => check.id === "AUDITPRO_E2E_CLOUD_MOCK_TOKEN" && check.status === "error"));

  const placeholderDatabasePassword = await runPreflight({
    ...productionEnv,
    DATABASE_URL: "postgresql://auditpro:change-me@localhost:5432/auditpro",
  });
  assert.equal(placeholderDatabasePassword.status, "error");
  assert.ok(placeholderDatabasePassword.checks.some((check) =>
    check.id === "DATABASE_URL" &&
    check.status === "error" &&
    check.message.includes("placeholder database password")
  ));

  const loadedEnv: PreflightEnv = { AUDITPRO_ADMIN_SECRET: "from-shell" };
  loadPreflightEnvContent(loadedEnv, "AUDITPRO_ADMIN_SECRET=from-dotenv");
  assert.equal(loadedEnv.AUDITPRO_ADMIN_SECRET, "from-shell");

  const script = readFileSync(join(process.cwd(), "scripts", "preflight.ts"), "utf8");
  assert.match(script, /APP_DOMAIN/);
  assert.match(script, /isIP/);
  assert.match(script, /POSTGRES_PASSWORD/);
  assert.match(script, /AUDITPRO_PREFLIGHT_CHECK_DB/);
  assert.match(script, /AUDITPRO_LAUNCH_READINESS_MAX_AGE_MS/);
  assert.match(script, /AUDITPRO_BACKUP_MAX_AGE_MS/);
  assert.match(script, /AUDITPRO_LOG_LEVEL/);
  assert.match(script, /AUDITPRO_REQUIRE_PDF_RENDER/);
  assert.match(script, /AUDITPRO_SIGNUP_ENABLED/);
  assert.match(script, /AUDITPRO_DEFAULT_PLAN/);
  assert.match(script, /AUDITPRO_AI_INPUT_EUR_PER_1K/);
  assert.match(script, /AUDITPRO_AI_OUTPUT_EUR_PER_1K/);
  assert.match(script, /AUDITPRO_AI_OPENAI_MODEL/);
  assert.match(script, /AUDITPRO_AI_GEMINI_MODEL/);
  assert.match(script, /AUDITPRO_AI_PERPLEXITY_MODEL/);
  assert.match(script, /schema_migrations/);
  assert.match(script, /process\.exitCode = 1/);

  console.log("Preflight fixtures passed.");
}

void main();
