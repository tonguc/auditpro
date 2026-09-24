import { hasDatabase, query, transaction } from "@/lib/db";

function boundedNumber(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value ?? fallback);
  return Number.isFinite(parsed) ? Math.max(minimum, Math.min(parsed, maximum)) : fallback;
}

export function pilotAiEnabled(env: NodeJS.ProcessEnv = process.env) {
  return env.AUDITPRO_DEPLOYMENT_MODE === "pilot"
    && env.AUDITPRO_PUBLIC_ANALYSIS_ENABLED === "true"
    && env.AUDITPRO_AI_VISIBILITY_ENABLED === "true"
    && env.AUDITPRO_PILOT_AI_ENABLED === "true";
}

export function pilotAiPolicy(env: NodeJS.ProcessEnv = process.env) {
  const maxScans = Math.floor(boundedNumber(env.AUDITPRO_PILOT_AI_MAX_SCANS, 10, 1, 100));
  const maxDomains = Math.floor(boundedNumber(env.AUDITPRO_PILOT_AI_MAX_DOMAINS, 5, 1, 50));
  const maxScansPerDomain = Math.floor(boundedNumber(env.AUDITPRO_PILOT_AI_SCANS_PER_DOMAIN, 2, 1, 10));
  const budgetEur = boundedNumber(env.AUDITPRO_PILOT_AI_BUDGET_EUR, 10, 0.1, 1000);
  const reservedCostEur = boundedNumber(env.AUDITPRO_PILOT_AI_RESERVED_EUR_PER_SCAN, 1, 0.01, budgetEur);
  return { maxScans, maxDomains, maxScansPerDomain, budgetEur, reservedCostEur, promptLimit: 10, engineLimit: 4 };
}

export async function reservePilotAiScan(input: { requestId: string; targetHash: string; promptCount: number; engineCount: number }) {
  if (!hasDatabase()) return { ok: false as const, reason: "database_required" as const };
  const policy = pilotAiPolicy();
  return transaction(async (client) => {
    await client.query("SELECT pg_advisory_xact_lock(hashtext('auditpro:pilot_ai_budget'))");
    const existing = await client.query<{ id: string }>("SELECT id FROM pilot_ai_runs WHERE request_id = $1", [input.requestId]);
    if (existing.rows[0]) return { ok: true as const, id: existing.rows[0].id, duplicate: true };
    const usage = await client.query<{ scans: string; reserved: string; domains: string; target_scans: string }>(
      `SELECT COUNT(*)::text AS scans,
              COALESCE(SUM(reserved_cost_eur), 0)::text AS reserved,
              COUNT(DISTINCT target_hash)::text AS domains,
              COUNT(*) FILTER (WHERE target_hash = $1)::text AS target_scans
       FROM pilot_ai_runs`,
      [input.targetHash],
    );
    const scans = Number(usage.rows[0]?.scans ?? 0);
    const reserved = Number(usage.rows[0]?.reserved ?? 0);
    const domains = Number(usage.rows[0]?.domains ?? 0);
    const targetScans = Number(usage.rows[0]?.target_scans ?? 0);
    if (scans >= policy.maxScans) return { ok: false as const, reason: "scan_limit" as const, scans, limit: policy.maxScans };
    if (targetScans >= policy.maxScansPerDomain) return { ok: false as const, reason: "domain_scan_limit" as const, scans: targetScans, limit: policy.maxScansPerDomain };
    if (targetScans === 0 && domains >= policy.maxDomains) return { ok: false as const, reason: "domain_limit" as const, domains, limit: policy.maxDomains };
    if (reserved + policy.reservedCostEur > policy.budgetEur) return { ok: false as const, reason: "budget_limit" as const, reserved, limit: policy.budgetEur };
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO pilot_ai_runs (request_id, target_hash, status, prompt_count, engine_count, reserved_cost_eur)
       VALUES ($1, $2, 'reserved', $3, $4, $5) RETURNING id`,
      [input.requestId, input.targetHash, input.promptCount, input.engineCount, policy.reservedCostEur],
    );
    return { ok: true as const, id: inserted.rows[0].id, duplicate: false };
  });
}

export function estimatePilotAiCost(inputTokens: number, outputTokens: number, claudeSearches: number) {
  const inputPer1k = boundedNumber(process.env.AUDITPRO_PILOT_AI_INPUT_EUR_PER_1K, 0.005, 0, 1);
  const outputPer1k = boundedNumber(process.env.AUDITPRO_PILOT_AI_OUTPUT_EUR_PER_1K, 0.025, 0, 1);
  const searchEur = boundedNumber(process.env.AUDITPRO_CLAUDE_SEARCH_EUR_PER_REQUEST, 0.01, 0, 1);
  return Number(((inputTokens / 1000) * inputPer1k + (outputTokens / 1000) * outputPer1k + claudeSearches * searchEur).toFixed(6));
}

export async function completePilotAiScan(id: string, result: unknown, inputTokens: number, outputTokens: number, actualCostEur: number) {
  await query(
    `UPDATE pilot_ai_runs SET status = 'completed', result = $2, input_tokens = $3, output_tokens = $4,
       actual_cost_eur = $5, completed_at = now() WHERE id = $1`,
    [id, JSON.stringify(result), inputTokens, outputTokens, actualCostEur],
  );
}

export async function failPilotAiScan(id: string, errorName: string) {
  await query(
    `UPDATE pilot_ai_runs SET status = 'failed', error_name = $2, completed_at = now() WHERE id = $1`,
    [id, errorName],
  );
}
