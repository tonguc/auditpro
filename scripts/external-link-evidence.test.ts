import assert from 'node:assert/strict';
import {externalLinkEvidence} from '../lib/external-link-evidence';
import {analyzeHtml} from '../lib/html-measurements';
import {mergeSitewideFindings, type CrawledPage} from '../lib/site-measurements';
const url=new URL('https://example.com/');
assert.deepEqual(externalLinkEvidence('<template><a href="https://fake.test/"></a></template><svg><a href="https://fake.test/"></a></svg><p>https://fake.test/</p><a href="/same"></a><a href="mailto:a@b.test"></a><a href="https://user:pass@fake.test/"></a>',url),[]);
const links=externalLinkEvidence('<base href="https://outside.test/dir/"><base target="_blank"><a href="next?a=1&amp;b=2" rel="NoReferrer NOREFERRER">A</a><a href="//other.test/" target="" rel="opener">B</a>',url);
assert.deepEqual(links,[{url:'https://outside.test/dir/next?a=1&b=2',target:'_blank',rel:['noreferrer']},{url:'https://other.test/',target:'',rel:['opener']}]);
for(const rel of ['', 'noopener', 'noreferrer', 'opener', 'opener noopener']){
 const html=`<a href="https://outside.test/" target=_blank rel="${rel}">External</a>`;
 const finding=analyzeHtml(html,url,new Response(''),0,0).o44;
 assert.equal(finding.status,'N/A');assert.equal(finding.evidence.scoreEligible,false);
 assert.match(finding.evidence.pageResults![0].value!,/https:\/\/outside.test\//);
}
const pages:CrawledPage[]=[{url,html:'<a href="https://outside.test/" target=_blank>External</a>',response:new Response(''),durationMs:0,redirects:0,title:'',description:''},{url:new URL('/detail',url),html:'<p>No outbound links</p>',response:new Response(''),durationMs:0,redirects:0,title:'',description:''}];
const merged=mergeSitewideFindings({},pages).o44;
assert.deepEqual(merged.evidence.pageResults?.map(row=>row.url),[url.href,'https://example.com/detail']);
assert.match(merged.evidence.pageResults![0].value!,/outside.test/);
assert.equal(merged.evidence.pageResults![1].value,'HTTP(S): 0');
assert.equal(merged.status,'N/A');
console.log('External link evidence: parsed anchors, base inheritance, rel tokens, inert/foreign markup, no false verdict and per-page targets passed.');
