import type { MeasurementEvidence } from './measurement-contract';

export type ReviewAction = {id: string; kind: 'titles' | 'descriptions' | 'resources' | 'coverage'; urls: string[]};
export function reviewActions(evidence: Record<string, MeasurementEvidence> = {}): ReviewAction[] {
  const actions: ReviewAction[] = [];
  for (const [id, kind] of [['o1','titles'],['o5','descriptions']] as const) {
    const urls = [...new Set((evidence[id]?.pageResults ?? []).filter(row => (row.declarations?.length ?? 0) > 1).map(row => row.url))];
    if (urls.length) actions.push({id,kind,urls});
  }
  for (const [kind,state] of [['resources','incomplete-resources'],['coverage','incomplete-coverage']] as const) {
    const covered=new Set<string>();
    for(const [id,item] of Object.entries(evidence)) {
      const urls=[...new Set((item.pageResults??[]).filter(row=>row.measurementState===state).map(row=>row.url))].filter(url=>!covered.has(url));
      if(!urls.length)continue;
      actions.push({id,kind,urls});
      urls.forEach(url=>covered.add(url));
    }
  }
  return actions;
}
