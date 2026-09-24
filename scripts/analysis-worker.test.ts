import assert from "node:assert/strict";

import { hasDatabase } from "../lib/db";
import { runAnalysisWorkerOnce } from "../lib/analysis-jobs";
import { runAnalysisWorkerLoop } from "./analysis-worker";

async function main() {
  const previousDatabaseUrl = process.env.DATABASE_URL;
  const previousLogLevel = process.env.AUDITPRO_LOG_LEVEL;
  process.env.AUDITPRO_LOG_LEVEL = "off";
  delete process.env.DATABASE_URL;

  assert.equal(hasDatabase(), false);
  assert.equal(await runAnalysisWorkerOnce("fixture-worker"), undefined);

  let stopped = false;
  let calls = 0;
  await runAnalysisWorkerLoop({
    pollMs: 1,
    workerId: "fixture-loop-worker",
    shouldStop: () => stopped,
    runOnce: async () => {
      calls += 1;
      stopped = true;
      return undefined;
    },
  });
  assert.equal(calls, 1);

  let completedBeforeStop = false;
  stopped = false;
  await runAnalysisWorkerLoop({
    pollMs: 1,
    workerId: "fixture-active-worker",
    shouldStop: () => stopped,
    runOnce: async () => {
      stopped = true;
      await new Promise((resolve) => setTimeout(resolve, 5));
      completedBeforeStop = true;
      return "job_fixture";
    },
  });
  assert.equal(completedBeforeStop, true);

  if (previousDatabaseUrl) process.env.DATABASE_URL = previousDatabaseUrl;
  if (previousLogLevel === undefined) {
    delete process.env.AUDITPRO_LOG_LEVEL;
  } else {
    process.env.AUDITPRO_LOG_LEVEL = previousLogLevel;
  }
  console.log("Analysis worker fixtures passed.");
}

void main();
