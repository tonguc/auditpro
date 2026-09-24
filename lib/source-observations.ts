import {parse} from 'parse5';
type Node={tagName?:string;namespaceURI?:string;attrs?:Array<{name:string;value:string}>;childNodes?:Node[]};
export function sourceObservations(html:string,pageUrl:URL){
 const nodes:Node[]=[];
 const attr=(node:Node,key:string)=>node.attrs?.find(row=>row.name===key)?.value;
 function walk(node:Node){if(['template','script','style','noscript'].includes(node.tagName??''))return;if(node.namespaceURI==='http://www.w3.org/1999/xhtml')nodes.push(node);for(const child of node.childNodes??[])walk(child);}
 walk(parse(html) as unknown as Node);
 let base=pageUrl;const baseNode=nodes.find(node=>node.tagName==='base'&&attr(node,'href')!==undefined);
 if(baseNode)try{base=new URL(attr(baseNode,'href')!,pageUrl);}catch{}
 const resources:Array<{element:string;attribute:string;url:string}>=[];
 for(const node of nodes){
  const keys=node.tagName==='link' && (attr(node,'rel')??'').toLowerCase().split(/\s+/).some(token=>['stylesheet','preload','modulepreload'].includes(token))?['href']:['img','iframe','source','audio','video','input'].includes(node.tagName??'')?['src',...(node.tagName==='video'?['poster']:[])]:[];
  for(const key of keys){const raw=attr(node,key);if(raw===undefined)continue;try{const target=new URL(raw,base);if(target.protocol==='http:'&&!target.username&&!target.password)resources.push({element:node.tagName!,attribute:key,url:target.href});}catch{}}
 }
 const forms=nodes.filter(node=>node.tagName==='form');
 const fields=nodes.filter(node=>['input','select','textarea'].includes(node.tagName??'')&&!['hidden','submit','button','reset','image'].includes((attr(node,'type')??'').toLowerCase()));
 return {lang:attr(nodes.find(node=>node.tagName==='html')??{},'lang')??'',footerCount:nodes.filter(node=>node.tagName==='footer').length,forms:forms.length,fields:fields.map(node=>({element:node.tagName,type:attr(node,'type')??'',inputmode:attr(node,'inputmode')??'',required:attr(node,'required')!==undefined,autocomplete:attr(node,'autocomplete')??null})),resources};
}
