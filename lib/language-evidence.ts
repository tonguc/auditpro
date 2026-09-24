import {parse} from 'parse5';
type Node={tagName?:string; attrs?:Array<{name:string;value:string}>; childNodes?:Node[]};
export type LanguageEvidence={url:string;lang:string;alternates:Array<{language:string;target:string;absolute:boolean;conflict:boolean;sampled:boolean;returnInHtml?:boolean}>};
function declarations(html:string) {
  const root=parse(html) as unknown as Node;
  const attr=(n:Node,key:string)=>n.attrs?.find(a=>a.name===key)?.value.trim() ?? '';
  let lang=''; const alternates:Array<{language:string;target:string;absolute:boolean}>=[];
  function visit(node:Node,inHead=false) {
    if(node.tagName==='html')lang=attr(node,'lang');
    if(['template','script','style'].includes(node.tagName ?? ''))return;
    inHead ||= node.tagName==='head';
    if(inHead && node.tagName==='link' && attr(node,'rel').toLowerCase().split(/\s+/).includes('alternate') && node.attrs?.some(a=>a.name==='hreflang')) {
      const target=attr(node,'href'); let absolute=false;
      try {const url=new URL(target); absolute=/^https?:\/\//i.test(target)&&!url.username&&!url.password&&!url.hash;}catch{}
      alternates.push({language:attr(node,'hreflang').toLowerCase(),target,absolute});
    }
    for(const child of node.childNodes ?? [])visit(child,inHead);
  }
  visit(root); return {lang,alternates};
}
export function measureLanguages(pages:Array<{url:URL;html:string}>):LanguageEvidence[] {
  const samples=new Map(pages.map(page=>[page.url.href,declarations(page.html)]));
  return [...samples].map(([url,entry])=>({url,lang:entry.lang,alternates:entry.alternates.map(alternate=>{
    const destination=alternate.absolute ? samples.get(new URL(alternate.target).href) : undefined;
    return {...alternate,conflict:entry.alternates.some(other=>other.language===alternate.language&&other.target!==alternate.target),sampled:Boolean(destination),
      ...(destination ? {returnInHtml:destination.alternates.some(other=>other.absolute&&new URL(other.target).href===url)} : {})};
  })}));
}
