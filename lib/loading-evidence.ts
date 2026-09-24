import {parse} from 'parse5';

type Node={tagName?:string;namespaceURI?:string;attrs?:Array<{name:string;value:string}>;childNodes?:Node[]};
const attr=(node:Node,key:string)=>node.attrs?.find(row=>row.name===key)?.value;
const HTML='http://www.w3.org/1999/xhtml';
const jsTypes=new Set(['text/javascript','application/javascript','text/ecmascript','application/ecmascript','application/x-javascript','text/jscript','text/livescript','text/x-javascript','text/x-ecmascript','application/x-ecmascript', ...['1.0','1.1','1.2','1.3','1.4','1.5'].map(version=>`text/javascript${version}`)]);

export function loadingEvidence(html:string,pageUrl:URL){
  const nodes:Node[]=[];
  const walk=(node:Node)=>{
    if(node.tagName==='template')return;
    nodes.push(node);
    if(['script','style','noscript'].includes(node.tagName??''))return;
    for(const child of node.childNodes??[])walk(child);
  };
  walk(parse(html) as unknown as Node);
  let base=pageUrl;
  const baseNode=nodes.find(node=>node.namespaceURI===HTML&&node.tagName==='base'&&attr(node,'href')!==undefined);
  try{if(baseNode)base=new URL(attr(baseNode,'href')!,pageUrl);}catch{}
  const resolve=(value:string)=>{try{const url=new URL(value,base);return ['https:','http:'].includes(url.protocol)&&!url.username&&!url.password?url.href:'[non-HTTP or credential URL]';}catch{return '[invalid URL]';}};
  const images=nodes.filter(node=>node.namespaceURI===HTML&&node.tagName==='img').map(node=>{
    const declared=(attr(node,'loading')??'').trim().toLowerCase();
    return {src:attr(node,'src')?resolve(attr(node,'src')!):'[no src; srcset may apply]',width:attr(node,'width')??null,height:attr(node,'height')??null,hasSrcset:attr(node,'srcset')!==undefined,loading:declared==='lazy'?'lazy':declared==='eager'?'eager':declared?'invalid/default-eager':'default-eager'};
  });
  const scripts=nodes.filter(node=>node.namespaceURI===HTML&&node.tagName==='script'&&attr(node,'src')!==undefined).map(node=>{
    const type=(attr(node,'type')??'').trim().toLowerCase();
    const mode=type==='module'?(attr(node,'async')!==undefined?'module-async':'module-deferred')
      :type&&!jsTypes.has(type)?'data-block/src-ignored'
      :attr(node,'nomodule')!==undefined?'legacy-fallback'
      :attr(node,'async')!==undefined?'classic-async'
      :attr(node,'defer')!==undefined?'classic-deferred':'classic-parser-blocking';
    return {src:attr(node,'src')?resolve(attr(node,'src')!):'[empty src]',mode};
  });
  return {images,scripts};
}
