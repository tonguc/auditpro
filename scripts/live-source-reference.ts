import { chromium } from 'playwright';
import { writeFileSync } from 'node:fs';
import { loadPublicBrowserResource } from '../lib/audit-browser-network';
async function main(){
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({javaScriptEnabled:false});
  await context.route('**/*',r=>r.abort());
  for(const url of ['https://example.com/','https://www.python.org/','https://www.w3.org/']){
   const resource=await loadPublicBrowserResource(url);
   const page=await context.newPage(); await page.setContent(resource.body.toString('utf8'),{waitUntil:'domcontentloaded'});
   const dom=await page.evaluate<{title:string;description:string|null;canonicals:(string|null)[];h1:(string|undefined)[]}>('({title:document.title,description:document.querySelector("meta[name=description]")?.getAttribute("content")??null,canonicals:[...document.querySelectorAll("link[rel~=canonical]")].map(x=>x.getAttribute("href")),h1:[...document.querySelectorAll("h1")].map(x=>x.textContent?.trim())})');
   console.log(JSON.stringify({url,status:resource.status,...dom}));
   writeFileSync('launch-readiness-reports/live/'+new URL(url).hostname+'.reference.json',JSON.stringify({url,status:resource.status,...dom},null,2));
   await page.close();
  }
  await context.close();
 } finally {await browser.close();}
}
void main().catch(e=>{console.error(e);process.exitCode=1;});
