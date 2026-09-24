import { spawnSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export { launchReadinessSteps, type LaunchReadinessStep } from "../lib/launch-readiness-steps";
import { launchReadinessSteps } from "../lib/launch-readiness-steps";

type ScriptResult = {
  error?: Error;
  signal?: NodeJS.Signals | null;
  status: number | null;
};

type LaunchReadinessOptions = {
  now?: () => number;
  reportDir?: string;
  runScript?: (script: string, env: NodeJS.ProcessEnv) => ScriptResult;
  stdout?: Pick<typeof console, "log">;
  stderr?: Pick<typeof console, "error">;
};

type LaunchReadinessReportStep = {
  errorMessage?: string;
  name: string;
  script: string;
  signal?: NodeJS.Signals | null;
  status: "passed" | "failed";
  exitCode: number;
  durationMs: number;
};

type LaunchReadinessReport = {
  status: "passed" | "failed";
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  failedScript?: string;
  steps: LaunchReadinessReportStep[];
};

function npmCommand() {
  return process.platform === "win32" ? "npm.cmd" : "npm";
}

function defaultRunScript(script: string, env: NodeJS.ProcessEnv) {
  return spawnSync(npmCommand(), ["run", script], {
    cwd: process.cwd(),
    env,
    shell: process.platform === "win32",
    stdio: "inherit",
  });
}

function reportDirectory(options: LaunchReadinessOptions) {
  return options.reportDir ?? process.env.AUDITPRO_LAUNCH_READINESS_REPORT_DIR ?? "launch-readiness-reports";
}

function writeReport(report: LaunchReadinessReport, directory: string) {
  mkdirSync(directory, { recursive: true });
  const stamp = report.startedAt.replaceAll(":", "-").replaceAll(".", "-");
  const path = join(directory, `launch-readiness-${stamp}.json`);
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  return path;
}

export function runLaunchReadiness(options: LaunchReadinessOptions = {}) {
  const now = options.now ?? Date.now;
  const runScript = options.runScript ?? defaultRunScript;
  const stdout = options.stdout ?? console;
  const stderr = options.stderr ?? console;
  const startedAt = now();
  const startedAtIso = new Date(startedAt).toISOString();
  const reportSteps: LaunchReadinessReportStep[] = [];
  for (const [index, step] of launchReadinessSteps.entries()) {
    const label = `[${index + 1}/${launchReadinessSteps.length}] ${step.name}`;
    const stepStartedAt = now();
    stdout.log(`\nAuditPro launch readiness: ${label}`);
    const result = runScript(step.script, { ...process.env, AUDITPRO_LAUNCH_READINESS: "true" });
    const stepFinishedAt = now();
    const stepDurationMs = stepFinishedAt - stepStartedAt;
    const stepSeconds = (stepDurationMs / 1000).toFixed(1);
    const exitCode = result.status ?? 1;
    if (exitCode !== 0) {
      reportSteps.push({
        name: step.name,
        script: step.script,
        signal: result.signal,
        status: "failed",
        exitCode,
        durationMs: stepDurationMs,
        errorMessage: result.error?.message,
      });
      const failedReport: LaunchReadinessReport = {
        status: "failed",
        startedAt: startedAtIso,
        finishedAt: new Date(stepFinishedAt).toISOString(),
        durationMs: stepFinishedAt - startedAt,
        failedScript: step.script,
        steps: reportSteps,
      };
      const reportPath = writeReport(failedReport, reportDirectory(options));
      stderr.error(`\nAuditPro launch readiness failed at: ${step.script} after ${stepSeconds}s`);
      stderr.error(`AuditPro launch readiness report written to: ${reportPath}`);
      return exitCode;
    }
    reportSteps.push({
      name: step.name,
      script: step.script,
      signal: result.signal,
      status: "passed",
      exitCode,
      durationMs: stepDurationMs,
    });
    stdout.log(`AuditPro launch readiness step passed: ${step.script} in ${stepSeconds}s`);
  }
  const finishedAt = now();
  const seconds = ((finishedAt - startedAt) / 1000).toFixed(1);
  const report: LaunchReadinessReport = {
    status: "passed",
    startedAt: startedAtIso,
    finishedAt: new Date(finishedAt).toISOString(),
    durationMs: finishedAt - startedAt,
    steps: reportSteps,
  };
  const reportPath = writeReport(report, reportDirectory(options));
  stdout.log(`\nAuditPro launch readiness passed in ${seconds}s.`);
  stdout.log(`AuditPro launch readiness report written to: ${reportPath}`);
  stdout.log("Optional DB integration remains separate: AUDITPRO_INTEGRATION_DATABASE_URL=... npm run test:integration:postgres");
  return 0;
}

if (process.argv[1]?.replaceAll("\\", "/").endsWith("/scripts/launch-readiness.ts")) {
  process.exitCode = runLaunchReadiness();
}
