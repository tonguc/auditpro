import { getAnalysisJob } from "@/lib/analysis-jobs";
import { errorName, logOperation, operationResponse, requestIdFromHeaders } from "@/lib/operation-log";
import { requireOrganization, UnauthorizedError } from "@/lib/server-session";
import { authenticationRequired } from "@/lib/access-policy";

const noStoreHeaders = { "Cache-Control": "no-store" };

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  try {
    const { id } = await context.params;
    const authenticationEnabled = authenticationRequired();
    const organization = authenticationEnabled
      ? await requireOrganization(request.headers)
      : null;
    const job = await getAnalysisJob(id);
    if (!job || (organization && job.organizationId !== organization.organization_id)) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.read",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "not_found", jobId: id, statusCode: 404 },
      });
      return operationResponse(
        { error: "Analysis job not found or expired." },
        { status: 404, headers: noStoreHeaders },
        requestId,
      );
    }
    const { organizationId: _organizationId, ...publicJob } = job;
    logOperation({
      level: "debug",
      component: "api",
      operation: "analysis.job.read",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: { jobId: id, jobStatus: publicJob.status },
    });
    return operationResponse(publicJob, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.job.read",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "unauthorized", statusCode: 401 },
      });
      return operationResponse({ error: error.message }, { status: 401, headers: noStoreHeaders }, requestId);
    }
    logOperation({
      level: "error",
      component: "api",
      operation: "analysis.job.read",
      requestId,
      status: "error",
      durationMs: Date.now() - startedAt,
      metadata: { error: errorName(error), statusCode: 500 },
    });
    return operationResponse(
      { error: "Unable to read the analysis job." },
      { status: 500, headers: noStoreHeaders },
      requestId,
    );
  }
}
