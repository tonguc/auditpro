import type {RedirectHop} from './canonical-targets';

export type RedirectProbeResponse={status:number;finalUrl:string;redirectTrace:RedirectHop[]};
export async function probeHttpsRedirect(page:URL,load:(url:URL)=>Promise<RedirectProbeResponse>){
  const start=new URL(page);start.protocol='http:';start.search='';start.hash='';
  const unknown=(note:string)=>({status:'N/A' as const,url:start.href,note});
  if(page.port)return unknown('Nonstandard port: HTTP counterpart was not guessed.');
  try{
    const result=await load(start);
    const final=new URL(result.finalUrl);
    const hops=result.redirectTrace;
    const trace=hops.map(hop=>`${hop.url} — HTTP ${hop.status} → ${hop.target}`).join('\n');
    const note=`HTTP-path probe only: ${start.href}\n${trace}\nFinal: ${final.href} — HTTP ${result.status}. This does not verify every path, HSTS or certificate expiry.`;
    if(result.status<200||result.status>=300)return unknown(note+' Final response was not successful; redirect health is inconclusive.');
    if(final.protocol==='http:')return {status:'Fail' as const,url:start.href,note:note+' The tested HTTP origin served a successful response without ending on HTTPS.'};
    if(final.protocol!=='https:'||!hops.length||hops[0].url!==start.href)return unknown(note+' No complete HTTP-start redirect evidence.');
    const downgraded=hops.some(hop=>new URL(hop.url).protocol==='https:'&&new URL(hop.target).protocol==='http:');
    const otherHost=final.hostname!==page.hostname||hops.some(hop=>new URL(hop.target).hostname!==page.hostname);
    const otherPath=final.pathname!==page.pathname;
    return {status:downgraded||otherHost||otherPath?'Partial' as const:'Pass' as const,url:start.href,note:note+(downgraded?' HTTPS-to-HTTP downgrade observed.':'')+(otherHost?' Host changed; destination ownership and intent require review.':'')+(otherPath?' Path changed; destination intent requires review.':'')};
  }catch{return unknown('HTTP-origin probe unavailable, blocked, timed out or exceeded redirect limits. This is not proof of a missing HTTPS redirect.');}
}
