import { createAnalysisJob, createReservedAnalysisJob } from "@/lib/analysis-jobs";
import { errorName, logOperation, operationResponse, requestIdFromHeaders, stableLogHash } from "@/lib/operation-log";
import { allowedPageLimit, getPlanPolicy } from "@/lib/plans";
import { hasUnlimitedPilotPageAnalysis } from "@/lib/pilot-policy";
import { assertPublicUrl, normalizePublicUrl } from "@/lib/public-url";
import { requireOrganization, UnauthorizedError } from "@/lib/server-session";
import { authenticationRequired, publicAnalysisEnabled, publicAnalysisPageLimit } from "@/lib/access-policy";
import { enforceAnalysisRateLimit } from "@/lib/analysis-rate-limit";

const noStoreHeaders = { "Cache-Control": "no-store" };

type AnalysisJobRequestBody = {
  url?: unknown;
  pageLimit?: unknown;
};

async function parseAnalysisJobRequestBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, error: "Request body must be a JSON object." };
    }
    return { ok: true as const, body: body as AnalysisJobRequestBody };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const authenticationEnabled = authenticationRequired();
    const publicMode = publicAnalysisEnabled();
    const organization = authenticationEnabled
      ? await requireOrganization(request.headers)
      : null;
    const parsedBody = await parseAnalysisJobRequestBody(request);
    if (!parsedBody.ok) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.create",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_body", statusCode: 400 },
      });
      return operationResponse({ error: parsedBody.error }, { status: 400, headers: noStoreHeaders }, requestId);
    }
    const body = parsedBody.body;
    if (typeof body.url !== "string" || !body.url.trim()) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.create",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_url", statusCode: 400 },
      });
      return operationResponse({ error: "Enter a website domain first." }, { status: 400, headers: noStoreHeaders }, requestId);
    }
    const plan = getPlanPolicy(
      organization?.plan_id ?? process.env.AUDITPRO_DEFAULT_PLAN,
    );
    const unlimitedPilotPages = hasUnlimitedPilotPageAnalysis();
    let requestedUrl: URL;
    try {
      requestedUrl = normalizePublicUrl(body.url);
      await assertPublicUrl(requestedUrl);
    } catch (error) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.create",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_url", statusCode: 400 },
      });
      return operationResponse(
        { error: error instanceof Error ? error.message : "Enter a valid website domain." },
        { status: 400, headers: noStoreHeaders },
        requestId,
      );
    }
    if (publicMode) {
      const rateLimit = enforceAnalysisRateLimit(request, "public-job");
      if (!rateLimit.allowed) {
        return operationResponse(
          { error: "Public analysis limit reached. Please wait a few minutes before trying again." },
          { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfter) } },
          requestId,
        );
      }
    }
    const requestedPages = typeof body.pageLimit === "number" && Number.isFinite(body.pageLimit) ? body.pageLimit : 25;
    const pageLimit = publicMode
      ? Math.min(Math.max(1, Math.floor(requestedPages)), publicAnalysisPageLimit())
      : unlimitedPilotPages
      ? Math.max(1, Math.min(Math.floor(requestedPages), 250))
      : Math.min(allowedPageLimit(plan.id, requestedPages), 250);
    const job = organization
      ? unlimitedPilotPages
        ? await createAnalysisJob(requestedUrl.href, pageLimit, request.headers, organization.organization_id)
        : await createReservedAnalysisJob({
          url: requestedUrl.href,
          pageLimit,
          headers: request.headers,
          organizationId: organization.organization_id,
          monthlyPageLimit: plan.pagesPerMonth,
        }).then((reservation) => {
          if (reservation.ok) return reservation.job;
          return null;
        })
      : await createAnalysisJob(requestedUrl.href, pageLimit, request.headers);
    if (!job) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.create",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "quota_exhausted", plan: plan.id, pageLimit, statusCode: 429 },
      });
      return operationResponse(
        {
          error: `The ${plan.name} monthly page allowance has been reached.`,
          errorCode: "MONTHLY_PAGE_QUOTA_REACHED",
        },
        { status: 429, headers: noStoreHeaders },
        requestId,
      );
    }
    logOperation({
      level: "info",
      component: "api",
      operation: "analysis.job.create",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: {
        jobId: job.id,
        plan: plan.id,
        pageLimit,
        unlimitedPilotPages,
        publicMode,
        targetHash: stableLogHash(requestedUrl.hostname),
      },
    });
    return operationResponse(
      { jobId: job.id, status: job.status, progress: job.progress, stage: job.stage, requestedPageLimit: requestedPages, effectivePageLimit: pageLimit },
      { status: 202, headers: noStoreHeaders },
      requestId,
    );
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.create",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "unauthorized", statusCode: 401 },
      });
      return operationResponse({ error: error.message }, { status: 401, headers: noStoreHeaders }, requestId);
    }
    logOperation({
      level: "warn",
      component: "api",
      operation: "analysis.job.create",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { error: errorName(error), statusCode: 400 },
    });
    return operationResponse(
      { error: "Unable to create the analysis job." },
      { status: 400, headers: noStoreHeaders },
      requestId,
    );
  }
}
