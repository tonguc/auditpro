import type {CrawlOutcome} from './crawl-outcomes';
import type {MeasurementEvidence} from './measurement-contract';
export function measureHttpStatuses(crawl: CrawlOutcome[], links: Array<{url:string; finalUrl:string;status:number;verified:boolean}>, discoveredLinks:string[]) {
  const rows = new Map<string, NonNullable<MeasurementEvidence['pageResults']>[number]>();
  for (const url of [...crawl.map(row=>row.url), ...discoveredLinks]) rows.set(url,{url,status:'N/A',value:'Not requested or response unavailable'});
  const add=(url:string,status?:number,finalUrl?:string)=>{
    if (!status) return;
    const next: NonNullable<MeasurementEvidence['pageResults']>[number] = {url,status:status>=400&&status<=599?'Fail':status>=200&&status<300?'Pass':'N/A',value:`HTTP ${status}${finalUrl&&finalUrl!==url?` → ${finalUrl}`:''}`};
    // Keep an observed HTTP error even if a later request succeeds: intermittent errors still occurred.
    if(rows.get(url)?.status!=='Fail') rows.set(url,next);
  };
  crawl.forEach(row=>add(row.url,row.status,row.finalUrl));
  links.filter(row=>row.verified).forEach(row=>add(row.url,row.status,row.finalUrl));
  const pageResults=[...rows.values()];
  const failed=pageResults.filter(row=>row.status==='Fail').length;
  const tested=pageResults.filter(row=>row.status!=='N/A').length;
  const complete=pageResults.length>0&&tested===pageResults.length;
  return {status:failed?'Fail' as const:complete?'Pass' as const:'N/A' as const,scoreEligible:failed>0||complete,pageResults,scope:{tested,discovered:pageResults.length,complete},note:`${tested}/${pageResults.length} discovered addresses have conclusive HTTP responses; ${failed} addresses returned HTTP 4xx/5xx. Unrequested/unavailable addresses are not passes. This is response status in the discovered sample, not indexability or whole-site health.`};
}
