import {parse} from 'parse5';
type Node={tagName?:string;namespaceURI?:string;attrs?:Array<{name:string;value:string}>;childNodes?:Node[]};
export type ContactLink={kind:'tel'|'mailto';target:string;empty:boolean};

// Source declarations only. No clicks, messages, visibility or ownership claims.
export function contactEvidence(html:string):ContactLink[]{
  const links:ContactLink[]=[];
  function walk(node:Node){
    if(['template','script','style','noscript'].includes(node.tagName??''))return;
    if(node.namespaceURI==='http://www.w3.org/1999/xhtml'&&node.tagName==='a'){
      const href=node.attrs?.find(attr=>attr.name==='href')?.value.trim();
      if(href&&/^(tel|mailto):/i.test(href)){
        try{
          const target=new URL(href);
          const kind=target.protocol.slice(0,-1) as 'tel'|'mailto';
          if(kind==='tel'||kind==='mailto')links.push({kind,target:target.protocol+target.pathname,empty:!target.pathname.trim()});
        }catch{}
      }
    }
    for(const child of node.childNodes??[])walk(child);
  }
  walk(parse(html) as unknown as Node);
  return links;
}
