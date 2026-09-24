import type { MeasurementEvidence } from './measurement-contract';

// A narrow, reviewed measurement is not a claim about ranking or conversions.
// Unknown/new controls fail closed until their method has been calibrated.
export const CALIBRATED_CONTROLS: Record<string, { source: string; measures: string }> = {
  o1: { source: 'crawler', measures: 'Fetched HTML contains a nonempty title' },
  o4: { source: 'crawler', measures: 'Title uniqueness within the fetched sample' },
  o5: { source: 'crawler', measures: 'Fetched HTML contains a nonempty meta description' },
  o8: { source: 'crawler', measures: 'Meta description uniqueness within the fetched sample' },
  t28: { source: 'crawler', measures: 'Fetched sample uses HTTPS' },
  t56: { source: 'crawler', measures: 'Observed HTTP response status across discovered crawl and link targets; unavailable or unrequested addresses remain unknown' },
  t9: { source: 'crawler', measures: 'Redirect-hop count within the fetched sample' },
  t45: { source: 'crawler', measures: 'Presence and device-width configuration of the viewport declaration' },
  t46: { source: 'browser', measures: 'Horizontal overflow at required mobile viewport widths' },
  t47: { source: 'browser', measures: 'Rendered mobile and tablet target dimensions against the declared threshold' },
  u33: { source: 'browser', measures: 'Axe text contrast checks on tested nodes' },
  u37: { source: 'browser', measures: 'Axe accessible-name checks on tested nodes' },
  u35: { source: 'browser', measures: 'Keyboard traversal coverage and trap detection in the rendered sample' },
  u36: { source: 'browser', measures: 'Visible focus-change coverage for keyboard-reached controls' },
  u39: { source: 'browser', measures: 'Appropriate input type or inputmode on classifiable mobile form fields' },
  c1: { source: 'browser', measures: 'Visibility and above-fold placement of a high-confidence primary CTA' },
  c17: { source: 'browser', measures: 'Presence and bounded field load of lead-form candidates in the rendered sample' },
  c19: { source: 'browser', measures: 'Autocomplete declaration coverage on rendered form fields' },
  c26: { source: 'crawler', measures: 'Presence of a declared telephone contact path in fetched HTML' },
};

export function calibratedSource(id: string, source: string) {
  return CALIBRATED_CONTROLS[id]?.source === source;
}

export function applyMeasurementPolicy<T extends { evidence: MeasurementEvidence }>(id: string, finding: T): T {
  if (calibratedSource(id, finding.evidence.source)) return finding;
  return { ...finding, evidence: { ...finding.evidence, scoreEligible: false, reasonCode: 'method-not-calibrated' } };
}
