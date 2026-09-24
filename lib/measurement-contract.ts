export const MEASUREMENT_CONTRACT_VERSION = "0.7.0";

export const CORE_METRIC_TARGETS = {
  technical: 14,
  onpage: 12,
  ux: 10,
  cro: 8,
  serp: 10,
} as const;

export const P0_AUTOMATED_CONTROL_TARGET = 82;

// LEGACY: publication thresholds for the retired v1 engine. They are capped inside
// calculateScore() to the calibrated inventory per category, because gates above that ceiling
// are unreachable by construction and made every site read as an incomplete measurement.
// UI scores come from lib/online-score.ts; this table no longer decides anything a client sees.
export const CATEGORY_SCORE_GATES = {
  technical: 13,
  onpage: 10,
  ux: 8,
  cro: 7,
  serp: 5,
} as const;

export type MeasurementSource = "crawler" | "browser" | "model" | "integration" | "ai-engine";

export type MeasurementEvidence = {
  contentDetails?: import('./content-evidence').ContentEvidence[];
  schemaDetails?: import('./seo-evidence').SchemaDetail[];
  languageDetails?: import('./language-evidence').LanguageEvidence[];
  robotsDetails?: import('./robots-evidence').RobotsPageEvidence[];
  indexingDetails?: import('./seo-evidence').IndexingDetail[];
  canonicalDetails?: import('./canonical-targets').CanonicalDetail[];
  elements?: Array<{url: string; rule: string; target: string; viewports: string[]}>;
  pageResults?: Array<{ url: string; status: "Pass" | "Partial" | "Fail" | "N/A"; value?: string; declarations?: string[]; headerDeclarations?: import('./security-header-evidence').HeaderDeclaration[]; measurementState?: "complete" | "incomplete-resources" | "incomplete-coverage" }>;
  source: MeasurementSource;
  confidence: "low" | "medium" | "high";
  scoreEligible: boolean;
  contractVersion: string;
  metricId?: string;
  methodVersion?: string;
  viewports?: string[];
  reasonCode?: string;
  threshold?: string;
  observed?: Record<string, string | number | boolean>;
  scope?: {
    tested: number;
    discovered: number;
    complete: boolean;
  };
};

export function categoryScoreGate(categoryId: string) {
  return CATEGORY_SCORE_GATES[categoryId as keyof typeof CATEGORY_SCORE_GATES] ?? Number.POSITIVE_INFINITY;
}
