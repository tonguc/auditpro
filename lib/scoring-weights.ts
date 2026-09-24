// ─── SINGLE SCORING WEIGHT SOURCE ────────────────────────────────────────────
// Published scores come from exactly one engine: buildOnlineScorecards() in
// lib/online-score.ts. These weights are the only numbers that decide how pillars
// combine into the score a client sees.
//
// The legacy v1 engine (calculateScore in lib/audit-model.ts) is retained for
// historical record compatibility only. It maps its old category ids onto the same
// weights through LEGACY_CATEGORY_WEIGHTS, so the retired engine can never disagree
// with the published one.

export const ONLINE_PILLAR_WEIGHTS = {
  technical: 0.28,
  content: 0.24,
  ux: 0.18,
  cro: 0.12,
  geo: 0.18,
} as const;

export type OnlinePillarId = keyof typeof ONLINE_PILLAR_WEIGHTS;

export const ONLINE_PILLAR_IDS = Object.keys(ONLINE_PILLAR_WEIGHTS) as OnlinePillarId[];

export const ONLINE_WEIGHTS_SUM = Number(
  ONLINE_PILLAR_IDS.reduce((sum, id) => sum + ONLINE_PILLAR_WEIGHTS[id], 0).toFixed(10),
);

// Legacy v1 category ids → the same published weight set.
export const LEGACY_CATEGORY_WEIGHTS: Record<string, number> = {
  technical: ONLINE_PILLAR_WEIGHTS.technical,
  ux: ONLINE_PILLAR_WEIGHTS.ux,
  onpage: ONLINE_PILLAR_WEIGHTS.content,
  cro: ONLINE_PILLAR_WEIGHTS.cro,
  serp: ONLINE_PILLAR_WEIGHTS.geo,
};
