import {parse} from 'parse5';
type Node={tagName?:string;namespaceURI?:string;value?:string;attrs?:Array<{name:string;value:string}>;childNodes?:Node[]};
export type ContentEvidence={url:string;headings?:Array<{level:number;text:string;skipped:boolean}>;images?:Array<{src:string;alt:string|null}>;links?:Array<{target:string;text:string;status?:number;finalUrl?:string}>};
export function inspectContent(html:string,url:URL) {
  const headings:NonNullable<ContentEvidence['headings']>=[],images:NonNullable<ContentEvidence['images']>=[],links:NonNullable<ContentEvidence['links']>=[];
  const attr=(node:Node,key:string)=>node.attrs?.find(row=>row.name===key)?.value;
  const root=parse(html) as unknown as Node; let base=url; let baseSeen=false;
  const nodes:Node[]=[];
  function walk(node:Node) {if(['script','style','template'].includes(node.tagName ?? ''))return;nodes.push(node);for(const child of node.childNodes ?? [])walk(child);}
  walk(root);
  for(const node of nodes)if(node.tagName==='base'&&attr(node,'href')!==undefined&&!baseSeen){baseSeen=true;try{base=new URL(attr(node,'href')!,url);}catch{}}
  function text(node:Node):string {if(['script','style','template'].includes(node.tagName??''))return '';return node.value ?? (node.childNodes??[]).map(text).join('');}
  for(const node of nodes){
    if(node.namespaceURI!=='http://www.w3.org/1999/xhtml')continue;
    if(/^h[1-6]$/.test(node.tagName??'')){const level=Number(node.tagName![1]);headings.push({level,text:text(node).replace(/\s+/g,' ').trim(),skipped:headings.length>0&&level>headings[headings.length-1].level+1});}
    if(node.tagName==='img'){let src=attr(node,'src')??'';try{if(src)src=new URL(src,base).href;}catch{}images.push({src,alt:attr(node,'alt')??null});}
    if(node.tagName==='a'&&node.namespaceURI==='http://www.w3.org/1999/xhtml'){
      const href=attr(node,'href');if(!href||href.trim().startsWith('#'))continue;
      try{const target=new URL(href,base);if(!['http:','https:'].includes(target.protocol)||target.origin!==url.origin||target.username||target.password)continue;target.hash='';links.push({target:target.href,text:text(node).replace(/\s+/g,' ').trim()});}catch{}
    }
  }
  return {url:url.href,headings,images,links};
}
export function attachLinkChecks(links:NonNullable<ContentEvidence['links']>,checks:Array<{url:string;status:number;verified:boolean;finalUrl:string}>) {
  const byUrl=new Map(checks.map(check=>[check.url,check]));
  return links.map(link=>{const check=byUrl.get(link.target);return {...link,...(check?.verified&&check.status ? {status:check.status,finalUrl:check.finalUrl} : {})};});
}
