import {parse} from 'parse5';

type Node = {tagName?:string;namespaceURI?:string;attrs?:Array<{name:string;value:string}>;childNodes?:Node[]};
export type ExternalLink = {url:string;target:string;rel:string[]};

// Source declarations only: no navigation, destination trust or runtime security verdict.
export function externalLinkEvidence(html:string, pageUrl:URL):ExternalLink[] {
  const nodes:Node[]=[];
  const attr=(node:Node,name:string)=>node.attrs?.find(item=>item.name===name)?.value;
  function walk(node:Node) {
    if(['template','script','style','noscript'].includes(node.tagName??''))return;
    if(node.namespaceURI==='http://www.w3.org/1999/xhtml')nodes.push(node);
    for(const child of node.childNodes??[])walk(child);
  }
  walk(parse(html) as unknown as Node);
  let base=pageUrl;
  const baseHref=nodes.find(node=>node.tagName==='base'&&attr(node,'href')!==undefined);
  if(baseHref)try{base=new URL(attr(baseHref,'href')!,pageUrl);}catch{}
  const baseTarget=nodes.find(node=>node.tagName==='base'&&attr(node,'target')!==undefined);
  const links:ExternalLink[]=[];
  for(const node of nodes) {
    if(node.tagName!=='a')continue;
    const href=attr(node,'href');
    if(href===undefined)continue;
    try {
      const url=new URL(href,base);
      if(!['http:','https:'].includes(url.protocol)||url.origin===pageUrl.origin||url.username||url.password)continue;
      links.push({url:url.href,target:attr(node,'target')??(baseTarget?attr(baseTarget,'target'):undefined)??'',
        rel:[...new Set((attr(node,'rel')??'').toLowerCase().split(/[\t\n\f\r ]+/).filter(Boolean))]});
    }catch{}
  }
  return links;
}
