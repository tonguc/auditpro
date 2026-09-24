import type { PoolClient } from "pg";

import { query, transaction } from "@/lib/db";
import { AI_PRICE_VERSION, estimateAiCost, type AiCostBasis } from "./ai-pricing";

export type CreditKind = "ai_prompt" | "ai_response";

export type CreditReservation = {
  ok: true;
  ledgerId: string;
  month: string;
  duplicate?: boolean;
} | {
  ok: false;
  month: string;
  used: number;
  requested: number;
  limit: number;
};

export class CreditReservationError extends Error {
  constructor(
    public readonly kind: CreditKind | "ai_report",
    public readonly reservation?: Extract<CreditReservation, { ok: false }>,
  ) {
    super(kind === "ai_report" ? "AI report allowance exceeded." : `${kind} credit allowance exceeded.`);
  }
}

export type AiUsageEvent = {
  organizationId: string;
  feature: string;
  provider: string;
  model: string;
  promptId?: string;
  engineId?: string;
  inputTokens: number;
  outputTokens: number;
  promptCredits: number;
  responseCredits: number;
  estimatedCostEur?: number;
  webSearchCalls?: number;
  usageKnown?: boolean;
  costBasis?: AiCostBasis;
  priceVersion?: string;
  providerCostUsd?: number;
  requestId?: string;
  metadata?: Record<string, unknown>;
};

export type AiVisibilityCreditReconciliation = {
  organizationId: string;
  referenceId: string;
  month: string;
  reservedPromptCredits: number;
  actualPromptCredits: number;
  reservedResponseCredits: number;
  actualResponseCredits: number;
};

export type AiVisibilityReportReconciliation = {
  organizationId: string;
  referenceId: string;
  month: string;
  reason?: string;
  metadata?: Record<string, unknown>;
};

export type AiAccountingFailure = {
  organizationId?: string;
  referenceId: string;
  failureStage: "usage_recording" | "report_reconciliation" | "credit_reconciliation" | "reservation_reconciliation";
  errorName: string;
  metadata?: Record<string, unknown>;
};

// Compatibility wrapper over the provenance-aware estimator (lib/ai-pricing.ts).
// New callers should use estimateAiCost() so the cost basis and price version
// are recorded with the event instead of a bare number.
export function estimateAiCostEur(inputTokens: number, outputTokens: number) {
  return estimateAiCost({ model: "", inputTokens, outputTokens }).estimatedCostEur ?? 0;
}

export function responseCreditsForTokens(outputTokens: number) {
  return Math.max(1, Math.ceil(outputTokens / 350));
}

async function currentLedgerMonth(client: PoolClient) {
  const monthResult = await client.query<{ month: string }>("SELECT date_trunc('month', now())::date::text AS month");
  return monthResult.rows[0]?.month ?? new Date().toISOString().slice(0, 7) + "-01";
}

async function reserveMonthlyCreditsWithClient(
  client: PoolClient,
  organizationId: string,
  kind: CreditKind,
  amount: number,
  limit: number,
  referenceId: string,
): Promise<CreditReservation> {
  const month = await currentLedgerMonth(client);
  if (amount <= 0) return { ok: true, ledgerId: "", month };
  if (limit <= 0) return { ok: false, month, used: 0, requested: amount, limit };

  await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${organizationId}:${kind}:${month}`]);
  const existing = await client.query<{ id: string }>(
    `SELECT id
     FROM credit_ledger
     WHERE organization_id = $1
       AND month = $2
       AND credit_kind = $3
       AND reference_id = $4
       AND reason = 'reserve'
     LIMIT 1`,
    [organizationId, month, kind, referenceId],
  );
  if (existing.rows[0]) return { ok: true, ledgerId: existing.rows[0].id, month, duplicate: true };

  const usage = await client.query<{ used: string }>(
    `SELECT COALESCE(SUM(amount), 0)::text AS used
     FROM credit_ledger
     WHERE organization_id = $1 AND month = $2 AND credit_kind = $3`,
    [organizationId, month, kind],
  );
  const used = Number(usage.rows[0]?.used ?? 0);
  if (used + amount > limit) return { ok: false, month, used, requested: amount, limit };

  const reserved = await client.query<{ id: string }>(
    `INSERT INTO credit_ledger (organization_id, month, credit_kind, amount, reason, reference_id)
     VALUES ($1, $2, $3, $4, 'reserve', $5)
     RETURNING id`,
    [organizationId, month, kind, amount, referenceId],
  );
  return { ok: true, ledgerId: reserved.rows[0].id, month };
}

export async function reserveMonthlyCredits(
  organizationId: string,
  kind: CreditKind,
  amount: number,
  limit: number,
  referenceId: string,
) {
  return transaction((client) => reserveMonthlyCreditsWithClient(client, organizationId, kind, amount, limit, referenceId));
}

export async function reserveAiVisibilityCredits(input: {
  organizationId: string;
  promptCredits: number;
  promptCreditLimit: number;
  responseCredits: number;
  responseCreditLimit: number;
  referenceId: string;
}) {
  return transaction(async (client) => {
    const prompt = await reserveMonthlyCreditsWithClient(
      client,
      input.organizationId,
      "ai_prompt",
      input.promptCredits,
      input.promptCreditLimit,
      input.referenceId,
    );
    if (!prompt.ok) return { ok: false as const, kind: "ai_prompt" as const, reservation: prompt };

    const response = await reserveMonthlyCreditsWithClient(
      client,
      input.organizationId,
      "ai_response",
      input.responseCredits,
      input.responseCreditLimit,
      input.referenceId,
    );
    if (!response.ok) return { ok: false as const, kind: "ai_response" as const, reservation: response };

  return { ok: true as const, prompt, response };
  });
}

export async function reserveAiVisibilityQuota(input: {
  organizationId: string;
  reportLimit: number;
  promptCredits: number;
  promptCreditLimit: number;
  responseCredits: number;
  responseCreditLimit: number;
  referenceId: string;
}) {
  return transaction(async (client) => {
    const month = await currentLedgerMonth(client);
    await client.query("SELECT pg_advisory_xact_lock(hashtext($1))", [`${input.organizationId}:ai_visibility:${month}:${input.referenceId}`]);
    const existingReservations = await client.query<{ credit_kind: CreditKind; id: string }>(
      `SELECT credit_kind, id
       FROM credit_ledger
       WHERE organization_id = $1
         AND month = $2
         AND reference_id = $3
         AND reason = 'reserve'
         AND credit_kind IN ('ai_prompt', 'ai_response')`,
      [input.organizationId, month, input.referenceId],
    );
    const existingPrompt = existingReservations.rows.find((row) => row.credit_kind === "ai_prompt");
    const existingResponse = existingReservations.rows.find((row) => row.credit_kind === "ai_response");
    if (existingPrompt && existingResponse) {
      return {
        ok: true as const,
        prompt: { ok: true as const, ledgerId: existingPrompt.id, month, duplicate: true },
        response: { ok: true as const, ledgerId: existingResponse.id, month, duplicate: true },
      };
    }

    const usage = await client.query(
      `INSERT INTO usage_monthly (organization_id, month, ai_reports)
       VALUES ($1, date_trunc('month', now())::date, 1)
       ON CONFLICT (organization_id, month) DO UPDATE SET ai_reports = usage_monthly.ai_reports + 1
       WHERE usage_monthly.ai_reports + 1 <= $2
       RETURNING organization_id`,
      [input.organizationId, input.reportLimit],
    );
    if (!usage.rowCount) throw new CreditReservationError("ai_report");
    await client.query(
      `INSERT INTO ai_report_reservations (organization_id, month, reference_id, metadata)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (organization_id, month, reference_id) DO NOTHING`,
      [input.organizationId, month, input.referenceId, { reportLimit: input.reportLimit }],
    );

    const prompt = await reserveMonthlyCreditsWithClient(
      client,
      input.organizationId,
      "ai_prompt",
      input.promptCredits,
      input.promptCreditLimit,
      input.referenceId,
    );
    if (!prompt.ok) throw new CreditReservationError("ai_prompt", prompt);

    const response = await reserveMonthlyCreditsWithClient(
      client,
      input.organizationId,
      "ai_response",
      input.responseCredits,
      input.responseCreditLimit,
      input.referenceId,
    );
    if (!response.ok) throw new CreditReservationError("ai_response", response);

    return { ok: true as const, prompt, response };
  }).catch((error) => {
    if (error instanceof CreditReservationError) return { ok: false as const, kind: error.kind, reservation: error.reservation };
    throw error;
  });
}

export async function reconcileAiVisibilityCredits(input: AiVisibilityCreditReconciliation) {
  const promptRefund = Math.max(0, input.reservedPromptCredits - Math.max(0, input.actualPromptCredits));
  const responseRefund = Math.max(0, input.reservedResponseCredits - Math.max(0, input.actualResponseCredits));
  if (promptRefund <= 0 && responseRefund <= 0) {
    return { promptRefund: 0, responseRefund: 0, promptRefundApplied: false, responseRefundApplied: false };
  }

  return transaction(async (client) => {
    let promptRefundApplied = false;
    let responseRefundApplied = false;
    const refundCandidates: Array<[CreditKind, number]> = [
      ["ai_prompt", promptRefund],
      ["ai_response", responseRefund],
    ];
    const refunds = refundCandidates.filter((refund) => refund[1] > 0);
    for (const [kind, amount] of refunds) {
      const inserted = await client.query(
        `INSERT INTO credit_ledger (organization_id, month, credit_kind, amount, reason, reference_id, metadata)
         VALUES ($1, $2, $3, $4, 'refund', $5, $6)
         ON CONFLICT (organization_id, month, credit_kind, reference_id, reason)
         WHERE reference_id IS NOT NULL
         DO NOTHING
         RETURNING id`,
        [
          input.organizationId,
          input.month,
          kind,
          -amount,
          input.referenceId,
          {
            reservedPromptCredits: input.reservedPromptCredits,
            actualPromptCredits: input.actualPromptCredits,
            reservedResponseCredits: input.reservedResponseCredits,
            actualResponseCredits: input.actualResponseCredits,
          },
        ],
      );
      const applied = Boolean(inserted.rowCount);
      if (kind === "ai_prompt") promptRefundApplied = applied;
      if (kind === "ai_response") responseRefundApplied = applied;
    }
    return { promptRefund, responseRefund, promptRefundApplied, responseRefundApplied };
  });
}

export async function reconcileAiVisibilityReportQuota(input: AiVisibilityReportReconciliation) {
  return transaction(async (client) => {
    const marker = await client.query(
      `INSERT INTO ai_report_reconciliations (organization_id, month, reference_id, reason, metadata)
       SELECT $1, $2, $3, $4, $5
       WHERE EXISTS (
         SELECT 1
         FROM ai_report_reservations
         WHERE organization_id = $1
           AND month = $2
           AND reference_id = $3
       )
       ON CONFLICT (organization_id, month, reference_id) DO NOTHING
       RETURNING reference_id`,
      [
        input.organizationId,
        input.month,
        input.referenceId,
        input.reason ?? "scan_failed",
        input.metadata ?? {},
      ],
    );
    if (!marker.rowCount) return { reportRefunded: false };

    await client.query(
      `UPDATE usage_monthly
       SET ai_reports = GREATEST(ai_reports - 1, 0)
       WHERE organization_id = $1 AND month = $2`,
      [input.organizationId, input.month],
    );
    return { reportRefunded: true };
  });
}

export async function recordAiUsageEvent(event: AiUsageEvent) {
  // Estimate and provider truth stay separate: estimated_cost_eur is our
  // labelled estimate and provider_cost_usd is the charged figure kept for
  // reconciliation. Unknown spend keeps basis 'unknown' instead of zero cost.
  const estimate = event.costBasis === "unknown"
    ? { estimatedCostEur: 0, costBasis: "unknown" as AiCostBasis, priceVersion: event.priceVersion ?? AI_PRICE_VERSION }
    : (() => {
        const computed = estimateAiCost({
          model: event.model,
          inputTokens: event.inputTokens,
          outputTokens: event.outputTokens,
          webSearchCalls: event.webSearchCalls,
          usageKnown: event.usageKnown ?? true,
        });
        return {
          estimatedCostEur: event.estimatedCostEur ?? computed.estimatedCostEur ?? 0,
          costBasis: computed.costBasis,
          priceVersion: computed.priceVersion,
        };
      })();
  await query(
    `INSERT INTO ai_usage_events (
       organization_id, feature, provider, model, prompt_id, engine_id,
       input_tokens, output_tokens, prompt_credits, response_credits,
       estimated_cost_eur, request_id, metadata,
       web_search_calls, cost_basis, price_version, provider_cost_usd
     ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)`,
    [
      event.organizationId,
      event.feature,
      event.provider,
      event.model,
      event.promptId ?? null,
      event.engineId ?? null,
      event.inputTokens,
      event.outputTokens,
      event.promptCredits,
      event.responseCredits,
      estimate.estimatedCostEur,
      event.requestId ?? null,
      event.metadata ?? {},
      event.webSearchCalls ?? 0,
      estimate.costBasis,
      estimate.priceVersion,
      event.providerCostUsd ?? null,
    ],
  );
}

export async function recordAiAccountingFailure(event: AiAccountingFailure) {
  if (!event.organizationId) {
    await query(
      `INSERT INTO ai_accounting_failures (
         organization_id, reference_id, failure_stage, error_name, metadata
       ) VALUES (NULL, $1, $2, $3, $4)
       ON CONFLICT (reference_id, failure_stage)
       WHERE resolved_at IS NULL AND organization_id IS NULL
       DO UPDATE SET
         error_name = EXCLUDED.error_name,
         metadata = EXCLUDED.metadata,
         attempts = ai_accounting_failures.attempts + 1,
         last_seen_at = now()`,
      [
        event.referenceId,
        event.failureStage,
        event.errorName,
        event.metadata ?? {},
      ],
    );
    return;
  }

  await query(
    `INSERT INTO ai_accounting_failures (
       organization_id, reference_id, failure_stage, error_name, metadata
     ) VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (organization_id, reference_id, failure_stage)
     WHERE resolved_at IS NULL AND organization_id IS NOT NULL
     DO UPDATE SET
       error_name = EXCLUDED.error_name,
       metadata = EXCLUDED.metadata,
       attempts = ai_accounting_failures.attempts + 1,
       last_seen_at = now()`,
    [
      event.organizationId,
      event.referenceId,
      event.failureStage,
      event.errorName,
      event.metadata ?? {},
    ],
  );
}
