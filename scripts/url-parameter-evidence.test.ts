import assert from 'node:assert/strict';
import {analyzeHtml} from '../lib/html-measurements';
import {mergeSitewideFindings,type CrawledPage} from '../lib/site-measurements';
const urls=['https://example.com/products?color=red&page=2','https://example.com/12345','https://example.com/search?q=private-test-value&q=second&empty=&flag','https://example.com/%C3%BCr%C3%BCn?%64il=tr#part'];
const pages:CrawledPage[]=urls.map(value=>({url:new URL(value),html:'',response:new Response(''),durationMs:0,redirects:0,title:'',description:''}));
for(const page of pages){const finding=analyzeHtml(page.html,page.url,page.response,0,0).t14;assert.equal(finding.status,'N/A');assert.equal(finding.evidence.scoreEligible,false);assert.equal(finding.evidence.pageResults![0].url,page.url.href);}
const merged=mergeSitewideFindings({},pages).t14;
assert.deepEqual(merged.evidence.pageResults?.map(row=>row.url),urls);
const details=merged.evidence.pageResults!.map(row=>JSON.parse(row.value!));
assert.deepEqual(details[0],{path:'/products',parameterNames:['color','page']});
assert.deepEqual(details[1],{path:'/12345',parameterNames:[]});
assert.deepEqual(details[2].parameterNames,['q','q','empty','flag']);
assert.deepEqual(details[3].parameterNames,['dil']);
assert.doesNotMatch(JSON.stringify(details),/private-test-value|second|#part/,'summary records names, not parameter values or fragments; source URL remains the exact evidence URL');
assert.equal(merged.status,'N/A');
console.log('URL parameter evidence: pagination, filters, repeated/empty parameters, encoding, per-page mapping and no invented SEO verdict passed.');
