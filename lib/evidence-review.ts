import type {MeasurementEvidence} from './measurement-contract';

// Explain the recorded limitation without inventing a missing integration or a site defect.
export function evidenceReviewReasons(evidence?: MeasurementEvidence) {
  const reasons: Array<'reviewResources'|'reviewCoverage'|'reviewMetadata'|'reviewDuplicate'|'reviewMethod'|'reviewUnknown'>=[];
  if (!evidence) return ['reviewUnknown'] as const;
  const rows=evidence.pageResults??[];
  if (evidence.reasonCode === 'incomplete-browser-resources' || rows.some(row=>row.measurementState==='incomplete-resources')) reasons.push('reviewResources');
  if (evidence.reasonCode === 'coverage-incomplete' || evidence.scope?.complete === false || rows.some(row=>row.measurementState==='incomplete-coverage')) reasons.push('reviewCoverage');
  if (rows.some(row => (row.declarations?.length ?? 0) > 1)) reasons.push('reviewMetadata');
  if (evidence.reasonCode === 'duplicate-metric-diagnostic') reasons.push('reviewDuplicate');
  if (evidence.reasonCode === 'method-not-calibrated') reasons.push('reviewMethod');
  return reasons.length ? reasons : ['reviewUnknown'] as const;
}

export function evidenceReviewReason(evidence?: MeasurementEvidence) {
  return evidenceReviewReasons(evidence)[0];
}
