import type {MeasurementEvidence} from './measurement-contract';

export function pageEvidenceSummary(rows:NonNullable<MeasurementEvidence['pageResults']>) {
  return {
    total:rows.length,
    affected:rows.filter(row=>row.status==='Fail'||row.status==='Partial').length,
    unresolved:rows.filter(row=>row.status==='N/A'||row.measurementState?.startsWith('incomplete')).length,
  };
}
