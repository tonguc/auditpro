import { closeDatabasePool, hasDatabase } from "../lib/db";
import { runAnalysisWorkerOnce } from "../lib/analysis-jobs";
import { logOperation } from "../lib/operation-log";
import { pathToFileURL } from "node:url";

const workerId = process.env.AUDITPRO_WORKER_ID ?? `worker_${process.pid}`;
const pollMs = Number(process.env.AUDITPRO_WORKER_POLL_MS ?? 2500);

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  if (!hasDatabase()) {
    throw new Error("DATABASE_URL is required for the persistent analysis worker.");
  }

  let stopping = false;
  const stop = (signal: NodeJS.Signals) => {
    if (stopping) return;
    stopping = true;
    logOperation({
      level: "warn",
      component: "worker",
      operation: "analysis.worker.shutdown_requested",
      requestId: workerId,
      status: "warning",
      metadata: { signal },
    });
  };

  process.once("SIGTERM", stop);
  process.once("SIGINT", stop);

  try {
    await runAnalysisWorkerLoop({
      shouldStop: () => stopping,
      workerId,
    });
  } finally {
    await closeDatabasePool();
  }
}

export type AnalysisWorkerLoopOptions = {
  pollMs?: number;
  runOnce?: (workerId: string) => Promise<string | undefined>;
  shouldStop?: () => boolean;
  workerId?: string;
};

export async function runAnalysisWorkerLoop(options: AnalysisWorkerLoopOptions = {}) {
  const loopWorkerId = options.workerId ?? workerId;
  const loopPollMs = options.pollMs ?? pollMs;
  const runOnce = options.runOnce ?? runAnalysisWorkerOnce;
  const shouldStop = options.shouldStop ?? (() => false);

  logOperation({
    level: "info",
    component: "worker",
    operation: "analysis.worker.start",
    requestId: loopWorkerId,
    status: "ok",
    metadata: { pollMs: loopPollMs },
  });

  while (!shouldStop()) {
    const processedJobId = await runOnce(loopWorkerId);
    if (!processedJobId && !shouldStop()) await delay(loopPollMs);
  }

  logOperation({
    level: "info",
    component: "worker",
    operation: "analysis.worker.stop",
    requestId: loopWorkerId,
    status: "ok",
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  void main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
