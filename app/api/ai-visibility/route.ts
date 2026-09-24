import { configuredAiVisibilityEngines, resolveWebSearchMode, runAiVisibilityScan } from "@/lib/ai-visibility";
import { errorName, logOperation, operationResponse, requestIdFromHeaders, stableLogHash } from "@/lib/operation-log";
import { getPlanPolicy } from "@/lib/plans";
import { requireOrganization, UnauthorizedError } from "@/lib/server-session";
import { assertPublicUrl, normalizePublicUrl } from "@/lib/public-url";
import { LOCALES, type Locale } from "@/lib/ui-i18n";
import { recordAiAccountingFailure, recordAiUsageEvent, reconcileAiVisibilityCredits, reconcileAiVisibilityReportQuota, reserveAiVisibilityQuota, responseCreditsForTokens } from "@/lib/usage-ledger";
import { completePilotAiScan, estimatePilotAiCost, failPilotAiScan, pilotAiEnabled, pilotAiPolicy, reservePilotAiScan } from "@/lib/pilot-ai";

export const runtime = "nodejs";
export const maxDuration = 180;

const noStoreHeaders = { "Cache-Control": "no-store" };

type AiVisibilityRequestBody = {
  url?: unknown;
  brandName?: unknown;
  industry?: unknown;
  locale?: unknown;
};

type AiVisibilityReservationContext = {
  organizationId: string;
  referenceId: string;
  month: string;
  reservedPromptCredits: number;
  reservedResponseCredits: number;
};

async function parseAiVisibilityRequestBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, error: "Request body must be a JSON object." };
    }
    return { ok: true as const, body: body as AiVisibilityRequestBody };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  let reservationContext: AiVisibilityReservationContext | undefined;
  let pilotReservationId: string | undefined;
  try {
    if (process.env.AUDITPRO_AI_VISIBILITY_ENABLED !== "true") {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "disabled", tokensSpent: false, statusCode: 503 },
      });
      return operationResponse(
        { error: "AI Visibility is not enabled on this server. No tokens were spent." },
        { status: 503, headers: noStoreHeaders },
        requestId,
      );
    }
    if (!process.env.AI_GATEWAY_API_KEY && !process.env.VERCEL_OIDC_TOKEN) {
      logOperation({
        level: "error",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "error",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "gateway_missing", tokensSpent: false, statusCode: 503 },
      });
      return operationResponse(
        { error: "AI Gateway credentials are not configured. No tokens were spent." },
        { status: 503, headers: noStoreHeaders },
        requestId,
      );
    }
    const parsedBody = await parseAiVisibilityRequestBody(request);
    if (!parsedBody.ok) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_body", tokensSpent: false, statusCode: 400 },
      });
      return operationResponse({ error: parsedBody.error }, { status: 400, headers: noStoreHeaders }, requestId);
    }
    const body = parsedBody.body;
    if (typeof body.url !== "string" || !body.url.trim()) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_url", tokensSpent: false, statusCode: 400 },
      });
      return operationResponse(
        { error: "Enter a website domain first." },
        { status: 400, headers: noStoreHeaders },
        requestId,
      );
    }
    const pilotMode = pilotAiEnabled();
    const webSearchEnabled = resolveWebSearchMode(pilotMode);
    const authenticationEnabled = Boolean(process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET);
    if (!authenticationEnabled && !pilotMode) {
      logOperation({
        level: "error",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "error",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "auth_required", tokensSpent: false, statusCode: 503 },
      });
      return operationResponse(
        { error: "AI Visibility requires authenticated organization billing before tokens can be spent." },
        { status: 503, headers: noStoreHeaders },
        requestId,
      );
    }
    const organization = pilotMode ? null : await requireOrganization(request.headers);
    let url: URL;
    try {
      url = normalizePublicUrl(body.url);
      await assertPublicUrl(url);
    } catch (error) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_url", tokensSpent: false, statusCode: 400 },
      });
      return operationResponse(
        { error: error instanceof Error ? error.message : "Enter a valid website domain." },
        { status: 400, headers: noStoreHeaders },
        requestId,
      );
    }
    const locale: Locale = typeof body.locale === "string" && LOCALES.includes(body.locale as Locale) ? body.locale as Locale : "en";
    if (organization?.role === "viewer") {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "viewer_forbidden", tokensSpent: false, statusCode: 403 },
      });
      return operationResponse(
        { error: "Viewer accounts cannot start billable AI scans." },
        { status: 403, headers: noStoreHeaders },
        requestId,
      );
    }
    const plan = getPlanPolicy(organization?.plan_id ?? process.env.AUDITPRO_DEFAULT_PLAN);
    const pilotPolicy = pilotAiPolicy();
    const promptLimit = pilotMode ? pilotPolicy.promptLimit : plan.aiPromptsPerReport;
    const engineLimit = pilotMode ? pilotPolicy.engineLimit : plan.aiEnginesPerReport;
    if (!pilotMode && (!plan.aiReportsPerMonth || !promptLimit || !engineLimit)) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "plan_forbidden", plan: plan.id, tokensSpent: false, statusCode: 403 },
      });
      return operationResponse(
        { error: `AI Visibility is not included in the ${plan.name} plan.` },
        { status: 403, headers: noStoreHeaders },
        requestId,
      );
    }
    const engines = configuredAiVisibilityEngines(engineLimit);
    const promptCredits = promptLimit * engines.length;
    const responseCredits = pilotMode ? promptCredits : plan.aiResponseCreditsPerReport;
    const ledgerReferenceId = crypto.randomUUID();
    if (pilotMode) {
      const pilotReservation = await reservePilotAiScan({
        requestId: ledgerReferenceId,
        targetHash: stableLogHash(url.hostname),
        promptCount: promptLimit,
        engineCount: engines.length,
      });
      if (!pilotReservation.ok) {
        const message = pilotReservation.reason === "database_required"
          ? "Pilot AI requires the persistent database. No tokens were spent."
          : "Pilot AI budget or scan limit has been reached. No tokens were spent.";
        return operationResponse({ error: message }, { status: pilotReservation.reason === "database_required" ? 503 : 429, headers: noStoreHeaders }, requestId);
      }
      pilotReservationId = pilotReservation.id;
    }
    if (organization) {
      const reservation = await reserveAiVisibilityQuota({
        organizationId: organization.organization_id,
        reportLimit: plan.aiReportsPerMonth,
        promptCredits,
        promptCreditLimit: plan.aiPromptCreditsPerMonth,
        responseCredits,
        responseCreditLimit: plan.aiResponseCreditsPerMonth,
        referenceId: ledgerReferenceId,
      });
      if (!reservation.ok) {
        if (reservation.kind === "ai_report") {
          logOperation({
            level: "warn",
            component: "api",
            operation: "ai.visibility.scan",
            requestId,
            status: "warning",
            durationMs: Date.now() - startedAt,
            metadata: { outcome: "quota_exhausted", quotaKind: reservation.kind, plan: plan.id, tokensSpent: false, statusCode: 429 },
          });
          return operationResponse(
            { error: `The ${plan.name} monthly AI report allowance has been reached.` },
            { status: 429, headers: noStoreHeaders },
            requestId,
          );
        }
        logOperation({
          level: "warn",
          component: "api",
          operation: "ai.visibility.scan",
          requestId,
          status: "warning",
          durationMs: Date.now() - startedAt,
          metadata: { outcome: "quota_exhausted", quotaKind: reservation.kind, plan: plan.id, tokensSpent: false, statusCode: 429 },
        });
        return operationResponse(
          { error: `The ${plan.name} monthly ${reservation.kind === "ai_prompt" ? "prompt" : "response"} credit allowance has been reached.` },
          { status: 429, headers: noStoreHeaders },
          requestId,
        );
      }
      reservationContext = {
        organizationId: organization.organization_id,
        referenceId: ledgerReferenceId,
        month: reservation.prompt.month,
        reservedPromptCredits: promptCredits,
        reservedResponseCredits: responseCredits,
      };
    }
    const result = await runAiVisibilityScan({
      brandName: typeof body.brandName === "string" ? body.brandName.slice(0, 120) : "",
      domain: url.hostname,
      industry: typeof body.industry === "string" ? body.industry.slice(0, 160) : "",
      locale,
      promptLimit,
      engines,
      userId: organization?.user.id ?? `local:${url.hostname}`,
      webSearch: webSearchEnabled,
      runId: ledgerReferenceId,
    });
    if (pilotMode && pilotReservationId) {
      const claudeSearches = result.observations.filter((observation) => observation.engineId === "claude" && !observation.error).length;
      const actualCostEur = estimatePilotAiCost(result.inputTokens, result.outputTokens, claudeSearches);
      await completePilotAiScan(pilotReservationId, result, result.inputTokens, result.outputTokens, actualCostEur);
    }
    if (organization) {
      const usageEvents = result.observations.map((observation) => ({
        organizationId: organization.organization_id,
        feature: "ai-visibility",
        provider: observation.engineId,
        model: observation.model,
        promptId: observation.promptId,
        engineId: observation.engineId,
        inputTokens: observation.inputTokens,
        outputTokens: observation.outputTokens,
        webSearchCalls: observation.webSearchCalls ?? (webSearchEnabled ? 1 : 0),
        providerCostUsd: observation.providerCostUsd,
        // Errors without reported usage are unknown spend, not zero spend. The
        // assumed search count is the `max_uses: 1` cap when the provider does
        // not report one; provider_cost_usd reconciles the actual charge.
        usageKnown: !observation.error || observation.inputTokens > 0 || observation.outputTokens > 0,
        promptCredits: observation.error ? 0 : 1,
        responseCredits: observation.error ? 0 : responseCreditsForTokens(observation.outputTokens),
        requestId: ledgerReferenceId,
        metadata: {
          methodVersion: result.methodVersion,
          promptSetVersion: result.promptSetVersion,
          status: observation.error ? "failed" : "completed",
        },
      }));
      try {
        await Promise.all(usageEvents.map((event) => recordAiUsageEvent(event)));
      } catch (error) {
        const persisted = await recordAiAccountingFailure({
          organizationId: organization.organization_id,
          referenceId: ledgerReferenceId,
          failureStage: "usage_recording",
          errorName: errorName(error),
          metadata: {
            requestId,
            observations: usageEvents.length,
          },
        }).then(() => true, () => false);
        logOperation({
          level: "error",
          component: "api",
          operation: "ai.visibility.scan",
          requestId,
          status: "error",
          durationMs: Date.now() - startedAt,
          metadata: {
            outcome: "accounting_failed",
            accountingFailurePersisted: persisted,
            error: errorName(error),
            ledgerReferenceId,
            tokensSpent: true,
          },
        });
      }
      try {
        const actualPromptCredits = usageEvents.reduce((total, event) => total + event.promptCredits, 0);
        const actualResponseCredits = Math.min(
          responseCredits,
          usageEvents.reduce((total, event) => total + event.responseCredits, 0),
        );
        if (reservationContext) {
          if (usageEvents.length > 0 && actualPromptCredits === 0) {
            await reconcileAiVisibilityReportQuota({
              organizationId: reservationContext.organizationId,
              referenceId: reservationContext.referenceId,
              month: reservationContext.month,
              reason: "zero_success_observations",
              metadata: { requestId, observations: usageEvents.length },
            });
          }
        }
      } catch (error) {
        const persisted = await recordAiAccountingFailure({
          organizationId: organization.organization_id,
          referenceId: ledgerReferenceId,
          failureStage: "report_reconciliation",
          errorName: errorName(error),
          metadata: { requestId, observations: usageEvents.length },
        }).then(() => true, () => false);
        logOperation({
          level: "error",
          component: "api",
          operation: "ai.visibility.scan",
          requestId,
          status: "error",
          durationMs: Date.now() - startedAt,
          metadata: {
            outcome: "accounting_failed",
            accountingFailurePersisted: persisted,
            failureStage: "report_reconciliation",
            error: errorName(error),
            ledgerReferenceId,
            tokensSpent: true,
          },
        });
      }
      try {
        const actualPromptCredits = usageEvents.reduce((total, event) => total + event.promptCredits, 0);
        const actualResponseCredits = Math.min(
          responseCredits,
          usageEvents.reduce((total, event) => total + event.responseCredits, 0),
        );
        if (reservationContext) {
          await reconcileAiVisibilityCredits({
            organizationId: reservationContext.organizationId,
            referenceId: reservationContext.referenceId,
            month: reservationContext.month,
            reservedPromptCredits: promptCredits,
            actualPromptCredits,
            reservedResponseCredits: responseCredits,
            actualResponseCredits,
          });
        }
      } catch (error) {
        const persisted = await recordAiAccountingFailure({
          organizationId: organization.organization_id,
          referenceId: ledgerReferenceId,
          failureStage: "credit_reconciliation",
          errorName: errorName(error),
          metadata: { requestId, observations: usageEvents.length },
        }).then(() => true, () => false);
        logOperation({
          level: "error",
          component: "api",
          operation: "ai.visibility.scan",
          requestId,
          status: "error",
          durationMs: Date.now() - startedAt,
          metadata: {
            outcome: "accounting_failed",
            accountingFailurePersisted: persisted,
            failureStage: "credit_reconciliation",
            error: errorName(error),
            ledgerReferenceId,
            tokensSpent: true,
          },
        });
      }
    }
    logOperation({
      level: "info",
      component: "api",
      operation: "ai.visibility.scan",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: {
        plan: plan.id,
        pilotMode,
        targetHash: stableLogHash(url.hostname),
        observations: result.observations.length,
        failedObservations: result.observations.filter((observation) => observation.error).length,
        promptCredits,
        responseCreditsReserved: responseCredits,
        reportQuotaRefunded: reservationContext ? result.observations.length > 0 && result.observations.every((observation) => observation.error) : false,
        tokensSpent: true,
      },
    });
    return operationResponse(result, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    if (pilotReservationId) await failPilotAiScan(pilotReservationId, errorName(error)).catch(() => undefined);
    if (error instanceof UnauthorizedError) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "ai.visibility.scan",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "unauthorized", tokensSpent: false, statusCode: 401 },
      });
      return operationResponse({ error: error.message }, { status: 401, headers: noStoreHeaders }, requestId);
    }
    if (reservationContext) {
      try {
        await reconcileAiVisibilityReportQuota({
          organizationId: reservationContext.organizationId,
          referenceId: reservationContext.referenceId,
          month: reservationContext.month,
          reason: "scan_failed",
          metadata: { requestId },
        });
        await reconcileAiVisibilityCredits({
          organizationId: reservationContext.organizationId,
          referenceId: reservationContext.referenceId,
          month: reservationContext.month,
          reservedPromptCredits: reservationContext.reservedPromptCredits,
          actualPromptCredits: 0,
          reservedResponseCredits: reservationContext.reservedResponseCredits,
          actualResponseCredits: 0,
        });
      } catch (accountingError) {
        const persisted = await recordAiAccountingFailure({
          organizationId: reservationContext.organizationId,
          referenceId: reservationContext.referenceId,
          failureStage: "reservation_reconciliation",
          errorName: errorName(accountingError),
          metadata: { requestId },
        }).then(() => true, () => false);
        logOperation({
          level: "error",
          component: "api",
          operation: "ai.visibility.scan",
          requestId,
          status: "error",
          durationMs: Date.now() - startedAt,
          metadata: {
            outcome: "reservation_reconciliation_failed",
            accountingFailurePersisted: persisted,
            error: errorName(accountingError),
            ledgerReferenceId: reservationContext.referenceId,
          },
        });
      }
    }
    logOperation({
      level: "error",
      component: "api",
      operation: "ai.visibility.scan",
      requestId,
      status: "error",
      durationMs: Date.now() - startedAt,
      metadata: { error: errorName(error), statusCode: 502 },
    });
    return operationResponse(
      { error: error instanceof Error ? error.message : "AI Visibility scan failed." },
      { status: 502, headers: noStoreHeaders },
      requestId,
    );
  }
}
