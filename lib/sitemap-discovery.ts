import {sitemapEvidence} from './seo-evidence';
export type SitemapResource={url:string;status:number;text:string};
export type SitemapDiscovery = {pages:string[]; maps:Array<{url:string;finalUrl?:string;status?:number;state:'parsed'|'unavailable'|'unsupported'|'limit'|'external';entries?:number;externalEntries?:number}>; pageLimitReached:boolean};
export async function discoverSitemapPages(seeds:string[], origin:string, load:(url:string)=>Promise<SitemapResource>, maxDocuments=12, maxPages=10000):Promise<SitemapDiscovery> {
  const queue=[...new Set(seeds)]; const seen=new Set<string>();const pages=new Set<string>();
  const maps:SitemapDiscovery['maps']=[];let fetched=0;let pageLimitReached=false;
  while(queue.length){
    const url=queue.shift()!;if(seen.has(url))continue;seen.add(url);
    let address:URL;try{address=new URL(url)}catch{maps.push({url,state:'unsupported'});continue;}
    if(address.origin!==origin||address.username||address.password){maps.push({url,state:'external'});continue;}
    if(fetched>=maxDocuments){maps.push({url,state:'limit'});continue;}
    fetched++;
    try{
      const resource=await load(url);
      if(resource.status!==200){maps.push({url,finalUrl:resource.url,status:resource.status||undefined,state:'unavailable'});continue;}
      if(new URL(resource.url).origin!==origin){maps.push({url,finalUrl:resource.url,status:resource.status,state:'external'});continue;}
      const parsed=sitemapEvidence(resource.text);
      maps.push({url,finalUrl:resource.url,status:resource.status,state:parsed.parsed?'parsed':'unsupported',entries:parsed.urls.length,externalEntries:parsed.index ? undefined : parsed.urls.filter(value=>new URL(value).origin!==origin).length});
      if(!parsed.parsed)continue;
      if(parsed.index){queue.push(...parsed.urls);continue;}
      for(const page of parsed.urls){
        if(new URL(page).origin!==origin)continue;
        if(pages.has(page))continue;
        if(pages.size>=maxPages){pageLimitReached=true;continue;}
        pages.add(page);
      }
    }catch{maps.push({url,state:'unavailable'});}
  }
  return {pages:[...pages],maps,pageLimitReached};
}
