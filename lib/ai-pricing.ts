// AI cost estimation with explicit pricing provenance (P1-P3 plan, B1).
//
// Estimates are always labelled with their basis and a price version. The
// provider-reported cost (OpenRouter `usage.cost`, USD credits) is stored in
// its own column as the reconciliation figure and is never merged into the
// EUR estimate.
//
// Prices verified on 2026-09-23 against the linked pages:
// - OpenRouter web search with the Exa fallback "auto" mode costs USD 0.007
//   per request (up to 10 results). "Native" search is provider passthrough.
//   https://openrouter.ai/docs/features/web-search
// - OpenRouter returns the charged cost as `usage.cost` on every response.
//   https://openrouter.ai/docs/use-cases/usage-accounting
// - Per-model token prices verified 2026-09-23 (sources recorded per entry in
//   MODEL_TOKEN_PRICES_USD). Models absent from the table use the
//   deployment-configured fallback rates and are labelled "fallback-rate" —
//   no price is ever fabricated.

export const AI_PRICE_VERSION = "2026-09-23";

export type AiCostBasis = "price-table" | "fallback-rate" | "unknown";

export type AiModelTokenPriceUsd = {
  inputUsdPer1k: number;
  outputUsdPer1k: number;
  source: string;
  verified: string;
};

export const MODEL_TOKEN_PRICES_USD: Record<string, AiModelTokenPriceUsd> = {
  "openai/gpt-5.6-luna": {
    inputUsdPer1k: 0.0002,
    outputUsdPer1k: 0.0012,
    source: "openrouter.ai/openai/gpt-5.6-luna model page ($0.20/M input, $1.20/M output), web search 2026-09-23",
    verified: "2026-09-23",
  },
  "perplexity/sonar": {
    inputUsdPer1k: 0.001,
    outputUsdPer1k: 0.001,
    source: "Perplexity pricing docs via web search (base Sonar $1/M input and output; its $5/1k request fee is covered by the search-call pricing), 2026-09-23",
    verified: "2026-09-23",
  },
  "anthropic/claude-sonnet-4.6": {
    inputUsdPer1k: 0.003,
    outputUsdPer1k: 0.015,
    source: "pricepertoken.com + OpenRouter compare pages, web search 2026-09-23 (input $3/M confirmed; output $15/M is the Claude Sonnet family rate — partial verification)",
    verified: "2026-09-23",
  },
  // google/gemini-3.5-flash-lite: no consistent published rate found on
  // 2026-09-23 — deliberately absent, it uses the fallback rates.
};

const SEARCH_USD_PER_CALL = 0.007;

function bounded(value: string | undefined, fallback: number, minimum: number, maximum: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= minimum && parsed <= maximum ? parsed : fallback;
}

// USD prices convert at parity unless the deployment sets a rate: an
// approximation named explicitly here so it is never mistaken for an FX feed.
export function eurPerUsd() {
  return bounded(process.env.AUDITPRO_EUR_PER_USD, 1, 0.1, 3);
}

export function searchEurPerCall() {
  return bounded(process.env.AUDITPRO_AI_SEARCH_EUR_PER_CALL, Number((SEARCH_USD_PER_CALL * eurPerUsd()).toFixed(6)), 0, 1);
}

function fallbackInputEurPer1k() {
  return bounded(process.env.AUDITPRO_AI_INPUT_EUR_PER_1K, 0.002, 0, 1);
}

function fallbackOutputEurPer1k() {
  return bounded(process.env.AUDITPRO_AI_OUTPUT_EUR_PER_1K, 0.006, 0, 1);
}

export type AiCostInput = {
  model: string;
  inputTokens: number;
  outputTokens: number;
  webSearchCalls?: number;
  usageKnown?: boolean;
};

export type AiCostEstimate = {
  estimatedCostEur: number | null;
  costBasis: AiCostBasis;
  priceVersion: string;
  tokenCostEur: number;
  searchCostEur: number;
};

export function estimateAiCost(
  input: AiCostInput,
  priceTable: Record<string, AiModelTokenPriceUsd> = MODEL_TOKEN_PRICES_USD,
): AiCostEstimate {
  if (input.usageKnown === false) {
    // Error/timeout paths with no reported usage: spend is unknown and must
    // never be recorded as a zero-cost success.
    return { estimatedCostEur: null, costBasis: "unknown", priceVersion: AI_PRICE_VERSION, tokenCostEur: 0, searchCostEur: 0 };
  }
  const table = priceTable[input.model];
  const inputEurPer1k = table ? table.inputUsdPer1k * eurPerUsd() : fallbackInputEurPer1k();
  const outputEurPer1k = table ? table.outputUsdPer1k * eurPerUsd() : fallbackOutputEurPer1k();
  const tokenCostEur = Number(((Math.max(0, input.inputTokens) / 1000) * inputEurPer1k + (Math.max(0, input.outputTokens) / 1000) * outputEurPer1k).toFixed(6));
  const webSearchCalls = Number.isFinite(input.webSearchCalls) ? Math.max(0, Math.trunc(input.webSearchCalls as number)) : 0;
  const searchCostEur = Number((webSearchCalls * searchEurPerCall()).toFixed(6));
  return {
    estimatedCostEur: Number((tokenCostEur + searchCostEur).toFixed(6)),
    costBasis: table ? "price-table" : "fallback-rate",
    priceVersion: AI_PRICE_VERSION,
    tokenCostEur,
    searchCostEur,
  };
}
