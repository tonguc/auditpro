import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { launchReadinessSteps, runLaunchReadiness } from "./launch-readiness";

const packageJson = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8")) as {
  scripts: Record<string, string>;
};
const testPlan = readFileSync(join(process.cwd(), "TEST_PLAN.md"), "utf8");
const deployment = readFileSync(join(process.cwd(), "DEPLOYMENT.md"), "utf8");
const gitignore = readFileSync(join(process.cwd(), ".gitignore"), "utf8");
const dockerignore = readFileSync(join(process.cwd(), ".dockerignore"), "utf8");
const scriptNames = launchReadinessSteps.map((step) => step.script);
const launchCommands = scriptNames.map((script) => `npm run ${script}`);

function commandBlockAfter(source: string, heading: string) {
  const headingIndex = source.indexOf(heading);
  assert.notEqual(headingIndex, -1, `missing heading: ${heading}`);
  const match = source.slice(headingIndex).match(/```bash\n([\s\S]*?)\n```/);
  assert.ok(match, `missing bash block after: ${heading}`);
  return match[1].split(/\r?\n/).filter((line) => line.startsWith("npm run "));
}

assert.equal(new Set(scriptNames).size, scriptNames.length, "launch readiness steps must not be duplicated");
assert.ok(scriptNames.indexOf("build") < scriptNames.indexOf("test:app-flow"), "production build must run before app flow");
assert.ok(scriptNames.indexOf("build") < scriptNames.indexOf("test:cloud-role-flow"), "production build must run before cloud role flow");
assert.ok(scriptNames.indexOf("build") < scriptNames.indexOf("test:admin-health-flow"), "production build must run before admin health browser flow");
assert.ok(scriptNames.indexOf("build") < scriptNames.indexOf("test:runtime-security-headers"), "production build must run before runtime security header flow");
assert.ok(scriptNames.indexOf("test:runtime-security-headers") < scriptNames.indexOf("test:admin-health-flow"), "runtime security header flow must run before admin health browser flow");
assert.ok(scriptNames.indexOf("test:admin-health-ui") < scriptNames.indexOf("test:admin-health-flow"), "admin health UI fixture must run before browser flow");
assert.ok(scriptNames.indexOf("test:cloud-role-flow") < scriptNames.indexOf("test:app-flow"), "cloud role flow must run before app flow");
assert.ok(scriptNames.indexOf("test:app-flow") < scriptNames.indexOf("test:smoke"), "app flow must run before smoke");
assert.equal(scriptNames.at(-1), "test:smoke", "smoke test must be the final launch gate");

for (const required of [
  "test:preflight",
  "test:migrations",
  "test:healthz",
  "test:docker-health",
  "test:admin-health",
  "test:admin-health-ui",
  "test:billing",
  "test:billing-sync",
  "test:billing-route",
  "test:stripe-webhook",
  "test:stripe-route",
  "test:security-rate-limit",
  "test:analysis-rate-limit",
  "test:security-headers",
  "test:runtime-security-headers",
  "test:csp-report",
  "test:operation-log",
  "test:operation-routes",
  "test:public-url",
  "test:analysis-route",
  "test:site-api-matrix",
  "test:analysis-job-route",
  "test:audit-authorization",
  "test:worker",
  "test:worker-operations",
  "test:backup-runbook",
  "test:backup-behavior",
  "test:seed-guard",
  "test:ai-visibility",
  "test:geo-positioning",
  "test:geo-publication-gate",
  "test:deployment-docs",
  "test:measurement-calibration",
  "test:rendered",
  "build",
  "test:admin-health-flow",
  "test:cloud-role-flow",
  "test:app-flow",
  "test:smoke",
]) {
  assert.ok(scriptNames.includes(required), `launch readiness must include ${required}`);
  assert.ok(packageJson.scripts[required], `package.json must define ${required}`);
}

assert.equal(packageJson.scripts["launch:readiness"], "tsx scripts/launch-readiness.ts");
assert.equal(packageJson.scripts["test:launch-readiness"], "tsx scripts/launch-readiness.test.ts");
assert.match(testPlan, /npm run launch:readiness/);
assert.match(testPlan, /npm run test:launch-readiness/);
assert.match(deployment, /npm run launch:readiness/);
assert.match(testPlan, /launch-readiness-reports\//);
assert.match(testPlan, /AUDITPRO_LAUNCH_READINESS_REPORT_DIR/);
assert.match(deployment, /launch-readiness-reports\//);
assert.match(deployment, /AUDITPRO_LAUNCH_READINESS_REPORT_DIR/);
assert.match(gitignore, /launch-readiness-reports/);
assert.match(dockerignore, /^launch-readiness-reports$/m);
assert.match(deployment, /test:integration:postgres/);
assert.doesNotMatch(readFileSync(join(process.cwd(), "scripts", "launch-readiness.ts"), "utf8"), /test:integration:postgres[\s\S]*script:/);

for (const command of launchCommands) {
  assert.ok(testPlan.includes(command), `TEST_PLAN.md must list ${command}`);
  assert.ok(deployment.includes(command), `DEPLOYMENT.md must list ${command}`);
}

assert.deepEqual(
  commandBlockAfter(testPlan, "Individual checks inside the launch gate:"),
  launchCommands,
  "TEST_PLAN.md individual launch gate block must match launch-readiness.ts",
);
assert.deepEqual(
  commandBlockAfter(deployment, "If you need to run the checks individually:"),
  launchCommands,
  "DEPLOYMENT.md individual launch gate block must match launch-readiness.ts",
);

const seenScripts: string[] = [];
const okLogs: string[] = [];
const okErrors: string[] = [];
const okReportDir = mkdtempSync(join(tmpdir(), "auditpro-launch-ok-"));
const okStatus = runLaunchReadiness({
  now: (() => {
    let tick = 0;
    return () => tick++ * 1000;
  })(),
  reportDir: okReportDir,
  runScript(script, env) {
    seenScripts.push(script);
    assert.equal(env.AUDITPRO_LAUNCH_READINESS, "true");
    return { status: 0 };
  },
  stdout: { log: (message) => okLogs.push(String(message)) },
  stderr: { error: (message) => okErrors.push(String(message)) },
});
assert.equal(okStatus, 0);
assert.deepEqual(seenScripts, scriptNames);
assert.ok(okLogs.some((line) => line.includes("step passed: test:preflight in")));
assert.ok(okLogs.some((line) => line.includes("launch readiness passed in")));
assert.ok(okLogs.some((line) => line.includes("launch readiness report written to:")));
assert.deepEqual(okErrors, []);
const okReportFiles = readdirSync(okReportDir).filter((file) => file.endsWith(".json"));
assert.equal(okReportFiles.length, 1);
const okReport = JSON.parse(readFileSync(join(okReportDir, okReportFiles[0]), "utf8")) as {
  status: string;
  failedScript?: string;
  steps: Array<{ script: string; status: string; exitCode: number; durationMs: number }>;
};
assert.equal(okReport.status, "passed");
assert.equal(okReport.failedScript, undefined);
assert.deepEqual(okReport.steps.map((step) => step.script), scriptNames);
assert.ok(okReport.steps.every((step) => step.status === "passed" && step.exitCode === 0 && step.durationMs >= 0));

const failedScripts: string[] = [];
const failureErrors: string[] = [];
const failureReportDir = mkdtempSync(join(tmpdir(), "auditpro-launch-fail-"));
const failedStatus = runLaunchReadiness({
  now: () => 0,
  reportDir: failureReportDir,
  runScript(script) {
    failedScripts.push(script);
    return { status: script === "test:healthz" ? 7 : 0 };
  },
  stdout: { log: () => undefined },
  stderr: { error: (message) => failureErrors.push(String(message)) },
});
assert.equal(failedStatus, 7);
assert.deepEqual(failedScripts, ["test:preflight", "test:migrations", "test:healthz"]);
assert.ok(failureErrors.some((line) => line.includes("failed at: test:healthz")));
assert.ok(failureErrors.some((line) => line.includes("launch readiness report written to:")));
const failureReportFiles = readdirSync(failureReportDir).filter((file) => file.endsWith(".json"));
assert.equal(failureReportFiles.length, 1);
const failureReport = JSON.parse(readFileSync(join(failureReportDir, failureReportFiles[0]), "utf8")) as {
  status: string;
  failedScript?: string;
  steps: Array<{ errorMessage?: string; script: string; status: string; exitCode: number }>;
};
assert.equal(failureReport.status, "failed");
assert.equal(failureReport.failedScript, "test:healthz");
assert.deepEqual(failureReport.steps.map((step) => step.script), failedScripts);
assert.equal(failureReport.steps.at(-1)?.status, "failed");
assert.equal(failureReport.steps.at(-1)?.exitCode, 7);

const spawnErrorReportDir = mkdtempSync(join(tmpdir(), "auditpro-launch-error-"));
const spawnErrorStatus = runLaunchReadiness({
  now: () => 0,
  reportDir: spawnErrorReportDir,
  runScript() {
    return { status: null, error: new Error("spawn failed") };
  },
  stdout: { log: () => undefined },
  stderr: { error: () => undefined },
});
assert.equal(spawnErrorStatus, 1);
const spawnErrorReportFiles = readdirSync(spawnErrorReportDir).filter((file) => file.endsWith(".json"));
assert.equal(spawnErrorReportFiles.length, 1);
const spawnErrorReport = JSON.parse(readFileSync(join(spawnErrorReportDir, spawnErrorReportFiles[0]), "utf8")) as {
  steps: Array<{ errorMessage?: string; exitCode: number }>;
};
assert.equal(spawnErrorReport.steps[0].exitCode, 1);
assert.equal(spawnErrorReport.steps[0].errorMessage, "spawn failed");

const script = readFileSync(join(process.cwd(), "scripts", "launch-readiness.ts"), "utf8");
const health = readFileSync(join(process.cwd(), "lib", "production-health.ts"), "utf8");
const appFlow = readFileSync(join(process.cwd(), "scripts", "app-flow.test.ts"), "utf8");
assert.match(script, /shell: process\.platform === "win32"/);
assert.match(script, /errorMessage/);
assert.match(script, /\.\.\/lib\/launch-readiness-steps/);
assert.match(health, /@\/lib\/launch-readiness-steps/);
assert.doesNotMatch(health, /new Set\(\[\s*"test:preflight"/);
assert.match(appFlow, /AUDITPRO_REQUIRE_PDF_RENDER/);
assert.match(appFlow, /requires pdftoppm/);

console.log("Launch readiness fixtures passed.");
