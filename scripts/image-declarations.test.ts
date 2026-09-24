import assert from 'node:assert/strict';
import {analyzeHtml} from '../lib/html-measurements';
import {loadingEvidence} from '../lib/loading-evidence';
import {mergeSitewideFindings,type CrawledPage} from '../lib/site-measurements';
const url=new URL('https://example.com/');
const html='<base href="/assets/"><template><img src="fake.webp"></template><img src="photo.jpg" alt="fake.avif" width="bad" height="0"><picture><source type="image/avif" srcset="real.avif"><img src="fallback.png" srcset="large.png 2x" width=""></picture>';
const parsed=loadingEvidence(html,url).images;
assert.equal(parsed.length,2);
assert.equal(parsed[0].src,'https://example.com/assets/photo.jpg');
assert.equal(parsed[0].width,'bad');assert.equal(parsed[0].height,'0');
assert.equal(parsed[1].width,'');assert.equal(parsed[1].height,null);assert.equal(parsed[1].hasSrcset,true);
for(const html of ['', '<img src="image.webp" width="10" height="20">', '<img src="image.jpg">', '<img src="/dynamic?format=avif">'])for(const id of ['t20','t21']){
 const finding=analyzeHtml(html,url,new Response(''),0,0)[id];assert.equal(finding.status,'N/A');assert.equal(finding.evidence.scoreEligible,false);
}
const pages:CrawledPage[]=[{url,html,response:new Response(''),durationMs:0,redirects:0,title:'',description:''},{url:new URL('/other',url),html:'',response:new Response(''),durationMs:0,redirects:0,title:'',description:''}];
const result=mergeSitewideFindings({},pages);
for(const id of ['t20','t21']){assert.deepEqual(result[id].evidence.pageResults?.map(row=>row.url),[url.href,'https://example.com/other']);assert.doesNotMatch(result[id].evidence.pageResults![0].value!,/fake/);assert.equal(result[id].evidence.pageResults![1].value,'No parsed image elements.');}
assert.match(result.t21.evidence.pageResults![0].value!,/width="bad"/);
console.log('Image declarations: parsed source URLs, inert markup, invalid/empty dimensions, srcset and per-page evidence without format/CLS verdicts passed.');
