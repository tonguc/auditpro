import assert from 'node:assert/strict';
import {analyzeHtml} from '../lib/html-measurements';
import {mergeSitewideFindings, type CrawledPage} from '../lib/site-measurements';
import {securityHeaderEvidence} from '../lib/security-header-evidence';
const url=new URL('https://example.com/');
const headers=new Headers({'Content-Security-Policy':'','Content-Security-Policy-Report-Only':"default-src 'none'",'set-cookie':'private=yes','authorization':'private'});
const inventory=securityHeaderEvidence(headers);
assert.equal(inventory.find(row=>row.name==='content-security-policy')?.value,'');
assert.equal(inventory.find(row=>row.name==='x-frame-options')?.value,null);
assert.equal(inventory.find(row=>row.name==='content-security-policy-report-only')?.value,"default-src 'none'");
assert.doesNotMatch(JSON.stringify(inventory),/private|set-cookie|authorization/);
for(const value of ['', 'max-age=0','garbage','max-age=31536000; includeSubDomains'])for(const protocol of ['http:','https:']){
 const target=new URL(url);target.protocol=protocol;
 const finding=analyzeHtml('',target,new Response('',{headers:{'strict-transport-security':value}}),0,0).t31;
 assert.equal(finding.status,'N/A');assert.equal(finding.evidence.scoreEligible,false);
 assert.equal(finding.evidence.pageResults![0].headerDeclarations![0].value,value);
}
for(const fields of [{},{'content-security-policy':'','x-frame-options':'','referrer-policy':''},{'content-security-policy-report-only':"default-src 'none'"}]){
 const finding=analyzeHtml('',url,new Response('',{headers:fields as HeadersInit}),0,0).t33;
 assert.equal(finding.status,'N/A');assert.equal(finding.evidence.scoreEligible,false);
}
const pages:CrawledPage[]=[url,new URL('/detail',url)].map((url,index)=>({url,html:'',response:new Response('',{headers:index===0?headers:{}}),durationMs:0,redirects:0,title:'',description:''}));
const merged=mergeSitewideFindings({},pages).t33;
assert.deepEqual(merged.evidence.pageResults?.map(row=>row.url),[url.href,'https://example.com/detail']);
assert.equal(merged.evidence.pageResults![0].headerDeclarations![0].value,'');
assert.equal(merged.evidence.pageResults![1].headerDeclarations![0].value,null);
assert.equal(merged.status,'N/A');
console.log('Security headers: absent/empty/raw values, report-only, invalid and disabled HSTS, HTTP delivery, allowlist privacy and page aggregation passed.');
