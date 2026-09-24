// URL-shape diversity is a sampling heuristic, not proof of a page's business purpose.
export function selectBrowserSample(urls:string[], limit=5) {
  const unique=[...new Set(urls)]; if(limit<=0)return [];
  const chosen=unique.slice(0,1);
  const groups=[/\/(contact|iletisim|iletişim)(\/|$)/i,/\/(services?|hizmetler)(\/|$)/i,/\/(products?|urunler|ürünler)(\/|$)/i,/\/(blog|articles?|resources?|icerik)(\/|$)/i];
  for(const group of groups){
    const candidate=unique.find(url=>{try{return !chosen.includes(url)&&group.test(new URL(url).pathname)}catch{return false}});
    if(candidate&&chosen.length<limit)chosen.push(candidate);
  }
  for(const url of unique){if(chosen.length>=limit)break;if(!chosen.includes(url))chosen.push(url);}
  return chosen;
}
export type BrowserPageCoverage={url:string;completedViewports:string[];failedViewports:string[];resourceIssues?:import('./audit-browser-network').BrowserResourceIssue[]};
