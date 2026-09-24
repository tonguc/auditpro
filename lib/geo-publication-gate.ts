import type { AiVisibilitySummary } from "@/lib/ai-visibility";
import { AI_VISIBILITY_METHOD_VERSION, evaluateAiVisibilityEligibility } from './ai-visibility';

export type GeoPublicationCheck = {
  label: string;
  done: boolean;
  detail: string;
};

export function hasMetric(value: number | null | undefined) {
  return value !== null && value !== undefined;
}

export function hasDirectionalAiEvidence(aiVisibility?: AiVisibilitySummary) {
  return Boolean(
    aiVisibility &&
    aiVisibility.methodVersion === AI_VISIBILITY_METHOD_VERSION &&
    aiVisibility.completedObservations > 0 &&
    hasMetric(aiVisibility.mentionRate) &&
    hasMetric(aiVisibility.citationRate),
  );
}

export function percentMetric(value: number | null | undefined) {
  return hasMetric(value) ? `${value}%` : "—";
}

export function geoPublicationChecks(aiVisibility?: AiVisibilitySummary, runs?: AiVisibilitySummary[]): GeoPublicationCheck[] {
  const hasEvidence = hasDirectionalAiEvidence(aiVisibility);
  const runGate = runs?.length ? evaluateAiVisibilityEligibility(runs) : null;
  return [
    {
      label: "Prompt-level engine evidence exists",
      done: hasEvidence,
      detail: aiVisibility ? `${aiVisibility.completedObservations}/${aiVisibility.expectedObservations} engine responses measured` : "Run AI scan after website analysis",
    },
    {
      label: "Mention and citation rates are measurable",
      done: hasEvidence && hasMetric(aiVisibility?.mentionRate) && hasMetric(aiVisibility?.citationRate),
      detail: hasEvidence ? `${percentMetric(aiVisibility?.mentionRate)} mentions, ${percentMetric(aiVisibility?.citationRate)} citations` : "Waiting for successful discovery prompts",
    },
    {
      label: "GEO result is not mixed into global score",
      done: true,
      detail: aiVisibility?.scoreEligible
        ? "Publishable GEO can be reported as its own scored result without changing the global audit score contract"
        : "Directional GEO evidence stays outside the published score until the publication threshold is met",
    },
    {
      label: "Publication threshold reached",
      done: Boolean(hasEvidence && (runGate ? runGate.eligible : aiVisibility?.scoreEligible)),
      detail: (runGate ? runGate.scoreReason : aiVisibility?.scoreReason) ?? "Requires fixed prompt coverage across engines and repeat runs",
    },
  ];
}

export function geoPublicationStatus(aiVisibility?: AiVisibilitySummary, runs?: AiVisibilitySummary[]) {
  const publishable = runs?.length ? evaluateAiVisibilityEligibility(runs).eligible : Boolean(aiVisibility?.scoreEligible);
  if (hasDirectionalAiEvidence(aiVisibility) && publishable) return "Publishable";
  return hasDirectionalAiEvidence(aiVisibility) ? "Directional only" : "Evidence pending";
}
