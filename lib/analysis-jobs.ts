import { POST as runAnalysisRequest } from "@/app/api/analyze/route";
import { hasDatabase, query, transaction } from "@/lib/db";
import { internalAnalysisToken } from "@/lib/internal-analysis";
import { errorName, logOperation } from "@/lib/operation-log";

export type AnalysisJobStatus = "queued" | "running" | "completed" | "failed" | "cancelled";

export type AnalysisJob = {
  id: string;
  url: string;
  pageLimit: number;
  status: AnalysisJobStatus;
  progress: number;
  stage: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
  organizationId?: string;
  reservedPages?: number;
  usageMonth?: string;
  usageReconciledAt?: string;
  usageRefundedPages?: number;
};

type JobStore = {
  jobs: Map<string, AnalysisJob>;
  queue: string[];
  active: number;
};

// A crawl can open five HTTP workers plus a multi-viewport browser run.
// Two concurrent jobs are the conservative default for a small VPS.
const MAX_ACTIVE_JOBS = 2;
const JOB_RETENTION_MS = 60 * 60 * 1000;
const STALE_RUNNING_MS = Number(process.env.AUDITPRO_STALE_JOB_MS ?? 30 * 60 * 1000);
const HEARTBEAT_MS = Math.max(5_000, Math.min(60_000, Math.floor(STALE_RUNNING_MS / 4)));
const INLINE_PERSISTENT_JOBS = process.env.AUDITPRO_INLINE_ANALYSIS_JOBS !== "false";

const globalJobs = globalThis as typeof globalThis & { __auditProJobs?: JobStore };
const store: JobStore = globalJobs.__auditProJobs ?? { jobs: new Map<string, AnalysisJob>(), queue: [], active: 0 };
globalJobs.__auditProJobs = store;

function createId() {
  return `job_${Date.now()}_${crypto.randomUUID()}`;
}

function cleanExpiredJobs() {
  const now = Date.now();
  for (const [id, job] of store.jobs) {
    if (job.completedAt && now - Date.parse(job.completedAt) > JOB_RETENTION_MS) store.jobs.delete(id);
  }
}

function updateJob(id: string, patch: Partial<AnalysisJob>) {
  const current = store.jobs.get(id);
  if (current) store.jobs.set(id, { ...current, ...patch });
}

function toJob(row: {
  id: string;
  url: string;
  page_limit: number;
  status: AnalysisJobStatus;
  progress: number;
  stage: string;
  created_at: Date | string;
  started_at: Date | string | null;
  completed_at: Date | string | null;
  result: unknown;
  error: string | null;
  organization_id: string | null;
  reserved_pages: number | null;
  usage_month: Date | string | null;
  usage_reconciled_at: Date | string | null;
  usage_refunded_pages: number | null;
}): AnalysisJob {
  return {
    id: row.id,
    url: row.url,
    pageLimit: row.page_limit,
    status: row.status,
    progress: row.progress,
    stage: row.stage,
    createdAt: new Date(row.created_at).toISOString(),
    startedAt: row.started_at ? new Date(row.started_at).toISOString() : undefined,
    completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : undefined,
    result: row.result ?? undefined,
    error: row.error ?? undefined,
    organizationId: row.organization_id ?? undefined,
    reservedPages: row.reserved_pages ?? undefined,
    usageMonth: row.usage_month ? new Date(row.usage_month).toISOString().slice(0, 10) : undefined,
    usageReconciledAt: row.usage_reconciled_at ? new Date(row.usage_reconciled_at).toISOString() : undefined,
    usageRefundedPages: row.usage_refunded_pages ?? undefined,
  };
}

export async function updatePersistentJob(id: string, patch: Partial<AnalysisJob>) {
  const entries = Object.entries({
    status: patch.status,
    progress: patch.progress,
    stage: patch.stage,
    started_at: patch.startedAt,
    completed_at: patch.completedAt,
    result: patch.result,
    error: patch.error,
  }).filter(([, value]) => value !== undefined);

  if (!entries.length) return;
  const columns: Record<string, string> = {
    status: "status",
    progress: "progress",
    stage: "stage",
    started_at: "started_at",
    completed_at: "completed_at",
    result: "result",
    error: "error",
  };
  const assignments = entries.map(([key], index) => `${columns[key]} = $${index + 2}`);
  await query(
    `UPDATE analysis_jobs SET ${assignments.join(", ")}, updated_at = now() WHERE id = $1`,
    [id, ...entries.map(([key, value]) => key === "result" ? JSON.stringify(value) : value)],
  );
}

async function getStoredJob(id: string) {
  if (!hasDatabase()) return store.jobs.get(id);
  const result = await query<Parameters<typeof toJob>[0]>(
    `SELECT id, url, page_limit, status, progress, stage, created_at, started_at,
            completed_at, result, error, organization_id, reserved_pages, usage_month,
            usage_reconciled_at, usage_refunded_pages
     FROM analysis_jobs
     WHERE id = $1`,
    [id],
  );
  return result.rows[0] ? toJob(result.rows[0]) : undefined;
}

async function updateStoredJob(id: string, patch: Partial<AnalysisJob>) {
  updateJob(id, patch);
  if (hasDatabase()) await updatePersistentJob(id, patch);
}

export async function touchAnalysisJobHeartbeat(id: string) {
  if (!hasDatabase()) return;
  await query(
    `UPDATE analysis_jobs
     SET updated_at = now()
     WHERE id = $1
       AND status = 'running'`,
    [id],
  );
}

async function reconcileReservedPageUsage(job: AnalysisJob, actualPagesCrawled: number, outcome: "completed" | "failed") {
  if (!hasDatabase() || !job.organizationId) return;
  const reserved = job.reservedPages ?? job.pageLimit;
  const actual = Math.max(0, Math.min(Math.floor(actualPagesCrawled), reserved));
  const refund = Math.max(0, reserved - actual);
  const reconciled = await query<{ organization_id: string; usage_month: string; reserved_pages: number; usage_refunded_pages: number }>(
    `UPDATE analysis_jobs
     SET usage_reconciled_at = now(),
         usage_refunded_pages = $2
     WHERE id = $1
       AND usage_reconciled_at IS NULL
     RETURNING organization_id, usage_month::text, COALESCE(reserved_pages, page_limit) AS reserved_pages, usage_refunded_pages`,
    [job.id, refund],
  );
  const reconciledJob = reconciled.rows[0];
  if (!reconciledJob) return;
  if (!refund) return;
  await query(
    `UPDATE usage_monthly
     SET pages_crawled = GREATEST(pages_crawled - $2, 0)
     WHERE organization_id = $1
       AND month = $3`,
    [reconciledJob.organization_id, refund, reconciledJob.usage_month],
  );
  logOperation({
    level: "info",
    component: "worker",
    operation: "analysis.job.page_usage_reconciled",
    requestId: job.id,
    status: "ok",
    metadata: {
      outcome,
      reservedPages: reconciledJob.reserved_pages,
      actualPagesCrawled: actual,
      refundedPages: refund,
      usageMonth: reconciledJob.usage_month,
    },
  });
}

export async function executeAnalysisJob(id: string, headers: Headers = new Headers()) {
  const job = await getStoredJob(id);
  if (!job) return;
  store.active += 1;
  await updateStoredJob(id, { status: "running", progress: 8, stage: "Connecting to website", startedAt: new Date().toISOString() });

  const progressSteps = [
    { delay: 900, progress: 18, stage: "Reading robots.txt and sitemap" },
    { delay: 2200, progress: 36, stage: "Discovering priority pages" },
    { delay: 4500, progress: 58, stage: "Auditing page-level signals" },
    { delay: 8000, progress: 78, stage: "Consolidating site-wide findings" },
    { delay: 14000, progress: 90, stage: "Preparing the client report" },
  ];
  const timers = progressSteps.map((step) => setTimeout(() => {
    void getStoredJob(id).then((current) => {
      if (current?.status === "running") void updateStoredJob(id, { progress: step.progress, stage: step.stage });
    });
  }, step.delay));
  const heartbeat = setInterval(() => {
    void touchAnalysisJobHeartbeat(id).catch((error) => {
      logOperation({
        level: "warn",
        component: "worker",
        operation: "analysis.job.heartbeat",
        requestId: id,
        status: "warning",
        metadata: { error: errorName(error) },
      });
    });
  }, HEARTBEAT_MS);

  try {
    const request = new Request("http://auditpro.local/api/analyze", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-auditpro-internal": internalAnalysisToken,
        "x-forwarded-for": headers.get("x-forwarded-for") ?? "local-job",
      },
      body: JSON.stringify({ url: job.url, pageLimit: job.pageLimit }),
    });
    const response = await runAnalysisRequest(request);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Website analysis failed.");
    await reconcileReservedPageUsage(job, Number(data.pagesAnalyzed ?? 0), "completed");
    await updateStoredJob(id, {
      status: "completed",
      progress: 100,
      stage: "Analysis complete",
      completedAt: new Date().toISOString(),
      result: data,
    });
  } catch (error) {
    await reconcileReservedPageUsage(job, 0, "failed");
    await updateStoredJob(id, {
      status: "failed",
      progress: 100,
      stage: "Analysis failed",
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Website analysis failed.",
    });
  } finally {
    timers.forEach(clearTimeout);
    clearInterval(heartbeat);
    store.active -= 1;
    void drainQueue(headers);
  }
}

export async function claimNextAnalysisJob(workerId: string) {
  if (!hasDatabase()) return undefined;
  return transaction(async (client) => {
    const claimed = await client.query<Parameters<typeof toJob>[0]>(
      `WITH next_job AS (
         SELECT id
     FROM analysis_jobs
     WHERE status = 'queued'
            OR (status = 'running' AND updated_at < now() - ($2::int * interval '1 millisecond'))
         ORDER BY created_at ASC
         FOR UPDATE SKIP LOCKED
         LIMIT 1
       )
       UPDATE analysis_jobs j
       SET status = 'running',
           progress = GREATEST(progress, 5),
           stage = 'Claimed by analysis worker',
           started_at = now(),
           updated_at = now(),
           worker_id = $1,
           attempts = attempts + 1
       FROM next_job
       WHERE j.id = next_job.id
       RETURNING j.id, j.url, j.page_limit, j.status, j.progress, j.stage, j.created_at,
                 j.started_at, j.completed_at, j.result, j.error, j.organization_id,
                 j.reserved_pages, j.usage_month, j.usage_reconciled_at, j.usage_refunded_pages`,
      [workerId, STALE_RUNNING_MS],
    );
    return claimed.rows[0] ? toJob(claimed.rows[0]) : undefined;
  });
}

export async function runAnalysisWorkerOnce(workerId = `worker_${crypto.randomUUID().slice(0, 8)}`) {
  const job = await claimNextAnalysisJob(workerId);
  if (!job) return undefined;
  await executeAnalysisJob(job.id, new Headers({ "x-forwarded-for": workerId }));
  return job.id;
}

async function drainQueue(headers: Headers) {
  while (store.active < MAX_ACTIVE_JOBS && store.queue.length) {
    const id = store.queue.shift();
    if (id) void executeAnalysisJob(id, headers);
  }
}

export async function createAnalysisJob(url: string, pageLimit: number, headers: Headers, organizationId?: string) {
  cleanExpiredJobs();
  const id = createId();
  const job: AnalysisJob = {
    id,
    url,
    pageLimit,
    status: "queued",
    progress: 2,
    stage: "Analysis accepted",
    createdAt: new Date().toISOString(),
    organizationId,
  };
  if (hasDatabase()) {
    await query(
      `INSERT INTO analysis_jobs (
         id, organization_id, url, page_limit, reserved_pages, usage_month, status, progress, stage
       )
       VALUES ($1, $2, $3, $4, $4, date_trunc('month', now())::date, $5, $6, $7)`,
      [job.id, organizationId ?? null, job.url, job.pageLimit, job.status, job.progress, job.stage],
    );
  }
  if (!hasDatabase() || INLINE_PERSISTENT_JOBS) {
    store.jobs.set(id, job);
    store.queue.push(id);
    void drainQueue(headers);
  }
  return job;
}

export async function createReservedAnalysisJob(input: {
  url: string;
  pageLimit: number;
  headers: Headers;
  organizationId: string;
  monthlyPageLimit: number;
}) {
  cleanExpiredJobs();
  const id = createId();
  const createdAt = new Date().toISOString();
  const job: AnalysisJob = {
    id,
    url: input.url,
    pageLimit: input.pageLimit,
    reservedPages: input.pageLimit,
    status: "queued",
    progress: 2,
    stage: "Analysis accepted",
    createdAt,
    organizationId: input.organizationId,
  };

  if (!hasDatabase()) {
    store.jobs.set(id, job);
    store.queue.push(id);
    void drainQueue(input.headers);
    return { ok: true as const, job };
  }

  const reserved = await transaction(async (client) => {
    const usage = await client.query<{ month: string }>(
      `INSERT INTO usage_monthly (organization_id, month, pages_crawled, audits_started)
       VALUES ($1, date_trunc('month', now())::date, $2, 1)
       ON CONFLICT (organization_id, month) DO UPDATE SET
         pages_crawled = usage_monthly.pages_crawled + EXCLUDED.pages_crawled,
         audits_started = usage_monthly.audits_started + 1
       WHERE usage_monthly.pages_crawled + EXCLUDED.pages_crawled <= $3
       RETURNING month::text`,
      [input.organizationId, input.pageLimit, input.monthlyPageLimit],
    );
    const month = usage.rows[0]?.month;
    if (!month) return { ok: false as const };

    await client.query(
      `INSERT INTO analysis_jobs (
         id, organization_id, url, page_limit, reserved_pages, usage_month, status, progress, stage
       )
       VALUES ($1, $2, $3, $4, $4, $5, $6, $7, $8)`,
      [job.id, input.organizationId, job.url, job.pageLimit, month, job.status, job.progress, job.stage],
    );
    return { ok: true as const, month };
  });

  if (!reserved.ok) return { ok: false as const };
  job.usageMonth = reserved.month;
  if (INLINE_PERSISTENT_JOBS) {
    store.jobs.set(id, job);
    store.queue.push(id);
    void drainQueue(input.headers);
  }
  return { ok: true as const, job };
}

export async function getAnalysisJob(id: string) {
  cleanExpiredJobs();
  return getStoredJob(id);
}
