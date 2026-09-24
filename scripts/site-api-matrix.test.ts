import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync} from 'node:fs';
import {internalAnalysisToken} from '../lib/internal-analysis';
import {POST} from '../app/api/analyze/route';
import {SITE_TYPE_CONTROL_APPLICABILITY} from '../lib/site-type-policy';
import {CALIBRATED_CONTROLS} from '../lib/measurement-policy';

// Public literal passes the production SSRF validator; every fetch is intercepted.
// Never fall back to native fetch. Chromium uses the production routed loader.
const origin='https://93.184.216.34';
const nativeFetch=globalThis.fetch;
const previousDatabase=process.env.DATABASE_URL;
const previousLog=process.env.AUDITPRO_LOG_LEVEL;
const reports:unknown[]=[];
const observedUncalibratedControls=new Set<string>();
async function main(){
 delete process.env.DATABASE_URL; process.env.AUDITPRO_LOG_LEVEL='off';
  type SiteProfile={kind:string;schemaType:string;siteType:'health|service'|'ecommerce'|'software'|'editorial'|'control';purpose:string;keywords:string[]};
  const siteProfiles:SiteProfile[]=[
    {kind:'clinic',schemaType:'Physician',siteType:'health|service',purpose:'local-service, contact-rich, trust-driven',keywords:['contact','service','about','privacy']},
    {kind:'shop',schemaType:'Product',siteType:'ecommerce',purpose:'catalog-and-checkout, purchase conversion',keywords:['product','cart','checkout']},
    {kind:'software',schemaType:'SoftwareApplication',siteType:'software',purpose:'saas feature pages and signup funnel',keywords:['signup','trial','pricing']},
    {kind:'publication',schemaType:'Article',siteType:'editorial',purpose:'article/blog publishing and topical depth',keywords:['article','blog','insight']},
    {kind:'resource-failure',schemaType:'Organization',siteType:'control',purpose:'stability and error-state control profile',keywords:['fallback']}
  ];
  try {
  for(const {kind,schemaType,siteType,purpose,keywords} of siteProfiles){
   const resourceFailure=kind==='resource-failure';
   const home=`${origin}/${kind}`, detail=`${home}/detail`;
   const html=(broken:boolean)=>`<!doctype html><html lang="tr"><head><meta name="viewport" content="width=device-width,initial-scale=1">${broken?'':`<title>${kind}</title><meta name="description" content="${kind} description">`}<link rel="canonical" href="${broken?detail:home}"><style>body{color:#111;background:#fff;font:18px Arial}button,a{min-width:48px;min-height:48px}</style><script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':schemaType})}</script>${broken?'<script type="application/ld+json">{bad}</script>':''}</head><body><h1>${kind}</h1><p>Fixture information</p><button${broken?'':' aria-label="Open menu"'}></button>${broken?'':`<a href="${detail}">Details</a>`}</body></html>`;
   let requests=0;
   globalThis.fetch=async(input)=>{
    requests++;
    const url=new URL(input instanceof Request?input.url:String(input));
    if(url.protocol==='http:'){
     assert.equal(url.href,'http://93.184.216.34/','HTTP probe must use only the origin, never the audited path');
     if(kind==='shop')return new Response('plaintext',{status:200});
     if(kind==='software')return new Response('unavailable',{status:503});
     if(kind==='publication')throw new Error('fixture timeout');
     return new Response(null,{status:301,headers:{location:origin+'/'}});
    }
    assert.equal(url.origin,origin,'no external request is permitted');
    if(url.pathname==='/')return new Response('<html><title>Probe target</title></html>',{headers:{'content-type':'text/html'}});
    if(url.pathname==='/robots.txt')return new Response(`User-agent: *\nDisallow: /${kind}/detail\nUser-agent: oai-searchbot\nAllow: /`,{status:kind==='publication'?503:200,headers:{'content-type':'text/plain'}});
    if(url.pathname==='/sitemap.xml')return new Response('missing',{status:404,headers:{'content-type':'text/plain'}});
    if(url.pathname==='/favicon.ico')return new Response(null,{status:204});
    if(url.pathname==='/missing.css')return new Response('missing',{status:404});
    if(url.pathname==='/canonical-old')return new Response(null,{status:301,headers:{location:'/canonical-gone'}});
    if(url.pathname==='/canonical-gone')return new Response('missing',{status:404,headers:{'content-type':'text/html'}});
    if(url.pathname==='/canonical-text')return new Response('not HTML',{headers:{'content-type':'text/plain'}});
    if(url.pathname==='/canonical-noindex')return new Response(`<head><link rel="canonical" href="${detail}"></head>`,{headers:{'content-type':'text/html','x-robots-tag':'googlebot: noindex'}});
    assert.ok([home,detail].includes(url.href),`unexpected fixture URL ${url.href}`);
    let content=html(url.href===detail);
    if(url.href===home)content=content.replace('</body>','<a href="https://outbound.example/" target="_blank" rel="noreferrer">Reference</a></body>');
    if(kind==='clinic'&&url.href===home)content=content.replace('>Details</a>','>About and privacy</a>');
    if(url.href===home)content=content.replace('</body>','<a href="tel:+123">Call</a><a href="mailto:info@example.com">Email</a></body>');
    if(kind==='clinic'&&url.href===home)content=content.replace('</head>','<title>Alternate clinic</title><meta name="description" content="Alternate clinic description"></head>');
    if(url.href===detail){
     content=content.replace('</head>','<meta name="robots" content="noindex"></head>');
     const target=kind==='clinic'?'/canonical-old':kind==='shop'?'/canonical-text':kind==='software'?'/canonical-noindex':null;
     if(target)content=content.replace(`<link rel="canonical" href="${detail}">`,`<link rel="canonical" href="${origin+target}">`);
     if(kind==='publication')content=content.replace(`<link rel="canonical" href="${detail}">`,'');
    }
    return new Response(resourceFailure&&url.href===detail ? content.replace('</head>','<link rel="stylesheet" href="/missing.css"></head>') : content,{headers:{'content-type':'text/html','x-robots-tag':'max-image-preview: none',...(url.href===home ? {'strict-transport-security':'max-age=0','content-security-policy-report-only':"default-src 'none'",'x-frame-options':''} : {})}});
   };
   const response=await POST(new Request('http://localhost/api/analyze',{method:'POST',headers:{'content-type':'application/json','x-auditpro-internal':internalAnalysisToken},body:JSON.stringify({url:home,pageLimit:2})}));
   const result=await response.json();
   assert.equal(response.status,200,JSON.stringify(result));
   assert.equal(result.pagesAnalyzed,2);
   assert.equal(result.onlineScorecards?.version,'2.0.0');
   assert.equal(result.onlineScorecards?.pillars?.technical?.totalChecks,9);
   assert.equal(result.onlineScorecards?.pillars?.content?.totalChecks,8);
   assert.equal(result.onlineScorecards?.pillars?.ux?.totalChecks,8);
   assert.equal(result.onlineScorecards?.pillars?.cro?.totalChecks,5);
   assert.equal(result.onlineScorecards?.overall?.totalChecks,38);
   assert.equal(result.onlineScorecards?.seo?.totalChecks,12);
   assert.equal(result.onlineScorecards?.geo?.totalChecks,8);
   assert.ok(typeof result.onlineScorecards?.seo?.coveragePct==='number');
   assert.ok(result.onlineScorecards?.seo?.checks.some((check:any)=>check.action&&check.actionTr));
   assert.equal(result.siteTypeAssessment?.profile, siteType);
   for (const [controlId, evidence] of Object.entries(result.measurementEvidence as Record<string, any>)) {
    if (CALIBRATED_CONTROLS[controlId]) continue;
    observedUncalibratedControls.add(controlId);
    assert.equal(evidence.scoreEligible, false, `${kind} ${controlId}: uncalibrated evidence must not score`);
   }
   for (const controlId of Object.keys(result.results as Record<string, unknown>)) {
    assert.ok(CALIBRATED_CONTROLS[controlId], `${kind} ${controlId}: only calibrated controls may publish a score`);
   }
   const notApplicableControls = siteType === 'control'
    ? []
    : Object.entries(SITE_TYPE_CONTROL_APPLICABILITY).filter(([,allowed]) => !allowed.includes(siteType));
   for (const [controlId] of notApplicableControls) {
    if (!(controlId in result.measurementEvidence)) {
      continue;
    }
    const evidence=result.measurementEvidence[controlId];
    assert.equal(evidence.reasonCode,'not-applicable-for-site-type', `${kind} ${controlId}`);
    assert.equal(evidence.scoreEligible,false);
    assert.equal(result.results?.[controlId], undefined);
    if (evidence.pageResults?.length) {
      assert.ok(evidence.pageResults.every((row:any)=>row.status==='N/A'));
    }
   }
   for(const id of ['t20','t21']){
    assert.equal(result.results[id],undefined);
    assert.deepEqual(result.measurementEvidence[id].pageResults.map((row:any)=>row.url),[home,detail]);
    assert.ok(result.measurementEvidence[id].pageResults.every((row:any)=>row.status==='N/A'&&row.value==='No parsed image elements.'));
   }
   assert.equal(result.results.t14,undefined,'URL appearance alone must not produce a scored result');
   assert.deepEqual(result.measurementEvidence.t14.pageResults.map((row:any)=>row.url),[home,detail]);
   assert.deepEqual(result.measurementEvidence.t14.pageResults.map((row:any)=>JSON.parse(row.value)),[{path:new URL(home).pathname,parameterNames:[]},{path:new URL(detail).pathname,parameterNames:[]}]);
   for(const id of ['t31','t33']){
    assert.equal(result.results[id],undefined);
    const rows=result.measurementEvidence[id].pageResults;
    assert.deepEqual(rows.map((row:any)=>row.url),[home,detail]);
    assert.ok(rows[1].headerDeclarations.every((header:any)=>header.value===null));
    if(id==='t31')assert.equal(rows[0].headerDeclarations[0].value,'max-age=0');
    else {
     assert.equal(rows[0].headerDeclarations.find((header:any)=>header.name==='content-security-policy-report-only').value,"default-src 'none'");
     assert.equal(rows[0].headerDeclarations.find((header:any)=>header.name==='x-frame-options').value,'');
    }
   }
   assert.equal(result.results.o44,undefined);
   assert.deepEqual(result.measurementEvidence.o44.pageResults.map((row:any)=>row.url),[home,detail]);
   assert.match(result.measurementEvidence.o44.pageResults[0].value,/https:\/\/outbound.example\//);
   assert.match(result.measurementEvidence.o44.pageResults[0].value,/noreferrer/);
   assert.equal(result.measurementEvidence.o44.pageResults[1].value,'HTTP(S): 0');
   for(const id of ['o46','o49']){
    assert.equal(result.results[id],undefined);
    const rows=result.measurementEvidence[id].contentDetails;
    assert.deepEqual(rows.map((row:any)=>row.url),[home,detail]);
    assert.equal(rows[0].links.length,kind==='clinic'?1:0);
    assert.equal(rows[1].links.length,0);
    if(kind==='clinic'){assert.equal(rows[0].links[0].target,detail);assert.equal(rows[0].links[0].status,200);}
   }
   assert.equal(result.results.o47,undefined);
   assert.deepEqual(result.measurementEvidence.o47.pageResults.map((row:any)=>row.url),[home,detail]);
   assert.match(result.measurementEvidence.o47.pageResults[0].value,/tel:\+123/);
   assert.doesNotMatch(result.measurementEvidence.o47.pageResults[1].value,/123/);
   const phoneApplicable=siteType==='health|service'||siteType==='control';
   assert.equal(result.results.c26,phoneApplicable?'Pass':undefined);
   assert.equal(result.measurementEvidence.c26.scoreEligible,phoneApplicable);
   assert.deepEqual(result.measurementEvidence.c26.pageResults.map((row:any)=>row.url),[home]);
   assert.match(result.measurementEvidence.c26.pageResults[0].value,/tel:\+123/);
   for(const id of ['c17','c19']){
    assert.equal(result.results[id],resourceFailure||id==='c19'?undefined:'Fail');
    assert.deepEqual(result.measurementEvidence[id].pageResults.map((row:any)=>row.url),[home,detail]);
    if(id==='c17') assert.ok(result.measurementEvidence[id].pageResults.every((row:any)=>row.status==='N/A'));
    else assert.ok(result.measurementEvidence[id].pageResults.every((row:any)=>row.status==='N/A'||['Pass','Partial','Fail'].includes(row.status)),'form rows carry actionable statuses when fields exist, N/A when they do not');
   }
   assert.equal(result.requestedPageLimit,2);
   if(kind==='clinic'){
    assert.deepEqual(result.measurementEvidence.o5.pageResults[0].declarations,['clinic description','Alternate clinic description']);
    assert.equal(result.measurementEvidence.o8.scoreEligible,false);
   }
   assert.equal(result.measurementEvidence.t64.methodVersion,'repeated-crawler-headers@1.0.0');
   assert.ok(result.measurementEvidence.t64.pageResults.every((row:any)=>/3\/3 valid observations/.test(row.value)));
   for(const id of ['t24','t64']){
    assert.equal(result.results[id],undefined);
    assert.equal(result.measurementEvidence[id].scoreEligible,false);
    assert.deepEqual(result.measurementEvidence[id].pageResults.map((row:any)=>row.url),[home,detail]);
    assert.ok(result.measurementEvidence[id].pageResults.every((row:any)=>row.status==='N/A'&&/ms/.test(row.value)));
   }
   const redirect=result.measurementEvidence.t29;
   assert.equal(redirect.scoreEligible,false);
   assert.equal(result.results.t29,undefined);
   assert.equal(redirect.methodVersion,'http-to-https-sampled-paths@1.0.0');
   assert.equal(redirect.pageResults.length,2);
   assert.deepEqual(redirect.pageResults.map((row:any)=>row.url),[home.replace('https:','http:'),detail.replace('https:','http:')]);
   assert.ok(redirect.pageResults.every((row:any)=>['Pass','Partial','Fail','N/A'].includes(row.status)));
   assert.equal(result.renderedViewportRuns,10);
   assert.ok(result.renderedPageCoverage.every((row:any)=>row.failedViewports.length===0));
   assert.ok(result.renderedPageCoverage.filter((row:any)=>!resourceFailure||row.url===home).every((row:any)=>!row.resourceIssues?.length));
   for(const id of ['o1','o5','u37']){
    const rows=result.measurementEvidence[id].pageResults;
    assert.equal(rows.find((r:any)=>r.url===home)?.status,'Pass',`${kind}/${id}: healthy page`);
    assert.equal(rows.find((r:any)=>r.url===detail)?.status,resourceFailure&&id==='u37'?'N/A':'Fail',`${kind}/${id}: defective or uncertain page`);
   }
   for(const id of ['t35','t40','t43']){
    assert.equal(result.results[id],undefined,'uncalibrated schema must remain outside published score');
    const rows=result.measurementEvidence[id].schemaDetails;
    assert.deepEqual(rows.find((r:any)=>r.url===home).blocks.map((b:any)=>b.state),['parsed']);
    assert.deepEqual(rows.find((r:any)=>r.url===detail).blocks.map((b:any)=>b.state),['parsed','invalid']);
   }
   assert.equal(result.results.o8,kind==='clinic'?undefined:'N/A','ambiguous or single populated description cannot establish uniqueness');
   for(const id of ['t1','t4','t5'])assert.equal(result.results[id],undefined,'diagnostic evidence must not invent scored results');
   const indexing=result.measurementEvidence.t4.indexingDetails;
   assert.equal(indexing.find((r:any)=>r.url===home).noindex,false,'max-image-preview none is not noindex');
   assert.equal(indexing.find((r:any)=>r.url===detail).noindex,true);
   const robots=result.measurementEvidence.t1.robotsDetails;
   assert.equal(result.measurementEvidence.t1.methodVersion,'robots-sampled-paths@1.1.0');
   assert.equal(result.measurementEvidence.t1.observed.policyContentType,'text/plain');
   assert.equal(robots.length,8);
   for(const bot of ['googlebot','perplexitybot','oai-searchbot','claudebot']){
    const row=robots.find((r:any)=>r.bot===bot&&r.url===detail);
    assert.equal(row.allowed,kind==='publication'?null:bot==='oai-searchbot');
    assert.equal(row.policyStatus,kind==='publication'?503:200);
   }
   const canonical=result.measurementEvidence.t5.canonicalDetails;
   const row=canonical.find((r:any)=>r.url===detail);
   assert.equal(canonical.find((r:any)=>r.url===home).httpStatus,200);
   if(kind==='clinic'){
    assert.equal(row.state,'http-error'); assert.equal(row.httpStatus,404);
    assert.deepEqual(row.redirectTrace,[{url:origin+'/canonical-old',status:301,target:origin+'/canonical-gone'}]);
   }else if(kind==='shop')assert.equal(row.state,'non-html');
   else if(kind==='software'){
    assert.equal(row.noindex,true); assert.equal(row.returnsToSource,true); assert.equal(row.targetCanonical,detail);
   }else if(kind==='publication')assert.equal(row.state,'missing');
   if(resourceFailure){
    assert.equal(result.results.u37,undefined,'incomplete render cannot publish an aggregate result');
    assert.equal(result.measurementEvidence.u37.scoreEligible,false);
    assert.equal(result.measurementEvidence.u37.pageResults.find((r:any)=>r.url===detail).measurementState,'incomplete-resources');
    assert.ok(result.renderedPageCoverage.find((r:any)=>r.url===detail).resourceIssues.every((r:any)=>r.status===404&&r.url===origin+'/missing.css'));
   }
   reports.push({
    kind,
    siteType,
    purpose,
    keywords,
    pages:2,
    viewportRuns:10,
    requests,
    verifiedDecisions:6,
    technicalEvidence:['bot-specific robots policy','page-specific noindex','canonical target state'],
    status:'passed',
  });
  }
  mkdirSync('design/validation-matrix',{recursive:true});
  writeFileSync('design/validation-matrix/site-api-matrix.json',JSON.stringify({scope:'Controlled API + real Chromium fixtures; not a field accuracy estimate',uncalibratedObservationCount:observedUncalibratedControls.size,runs:reports},null,2));
  assert.ok(observedUncalibratedControls.size >= 31, `expected the remaining diagnostic observations in the matrix, received ${observedUncalibratedControls.size}`);
  console.log('Site API matrix passed: 4 site types plus resource failure, 10 pages, 50 real viewport measurements, 30 page-level decisions and schema provenance.');
 } finally {
  globalThis.fetch=nativeFetch;
  if(previousDatabase===undefined)delete process.env.DATABASE_URL;else process.env.DATABASE_URL=previousDatabase;
  if(previousLog===undefined)delete process.env.AUDITPRO_LOG_LEVEL;else process.env.AUDITPRO_LOG_LEVEL=previousLog;
 }
}
main().catch(error=>{console.error(error);process.exitCode=1});

