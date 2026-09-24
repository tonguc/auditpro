import { testCanonicalTargets } from './seo-followup.test';
import {testHttpsRedirect} from './https-redirect-evidence.test';
import {testRepeatedTimings} from './repeated-crawl-timing.test';
import './http-status-measurement.test';
import './language-evidence.test';
import './content-evidence.test';
import './loading-evidence.test';
import './contact-evidence.test';
import './external-link-evidence.test';
import './external-link-checks.test';
import './field-cwv.test';
import './finding-summary.test';
import './security-header-evidence.test';
import './url-parameter-evidence.test';
import './image-declarations.test';
import './source-observations.test';
import './navigation-hints.test';
import './site-type-matrix.test';
import './seo-evidence.test';
import assert from 'node:assert/strict';
import { analyzeHtml } from '../lib/html-measurements';
import { structuredDataEvidence } from '../lib/seo-evidence';
import { mergeSitewideFindings, type CrawledPage } from '../lib/site-measurements';
import { buildOnlineScorecards } from '../lib/online-score';
import { AUDIT_CATEGORIES, calculateScore } from '../lib/audit-model';
import { CALIBRATED_CONTROLS } from '../lib/measurement-policy';
import { P0_AUTOMATED_CONTROL_TARGET } from '../lib/measurement-contract';
import { decodeBody } from '../lib/body-decode';

const page = (head = '', body = '') => `<!doctype html><html lang="en"><head>${head}</head><body>${body}</body></html>`;
const measure = (html: string, url = 'https://example.com/', headers = {}) => analyzeHtml(html, new URL(url), new Response('', { headers }), 100, 0);
assert.equal(measure(page('<template><title>Fake</title><meta name="description" content="Fake"></template>')).o1.status, 'Fail');
assert.equal(measure(page('<title>&nbsp;</title><meta name="description" content="&#32;">')).o5.status, 'Fail');
assert.equal(measure(page('<title>&nbsp;</title>')).o1.status, 'Fail');
assert.equal(measure(page('', '<svg><title>Icon label</title></svg>')).o1.status, 'Fail');
assert.equal(measure(page('<style>/* <title>Fake</title> */</style>')).o1.status, 'Fail');
assert.equal(measure(page('<template><meta name="description" content="Fake"></template>')).o5.status, 'Fail');
assert.equal(measure(page('<title>Fish &amp; Chips</title>')).o1.evidence.pageResults?.[0].value, 'Fish & Chips');
assert.equal(measure(page('<meta name="description" content="It\'s useful > really">')).o5.evidence.pageResults?.[0].value, "It's useful > really");
let cases = 0;
function check(name: string, test: () => void) { test(); cases++; console.log(`PASS ${name}`); }
check('image order cannot establish below-fold lazy-loading failure', () => {
  assert.equal(measure(page('', '<img src="/hero.png"><img src="/logo.png">')).t22.status, 'N/A');
});
check('module scripts without defer cannot be classified as failures', () => {
  assert.equal(measure(page('<script type="module" src="/app.js"></script>')).t26.status, 'N/A');
});
check('redirect count does not prove an HTTP to HTTPS redirect', () => {
  const result=analyzeHtml(page(),new URL('https://example.com/'),new Response(''),100,1);
  assert.equal(result.t29.status,'N/A');
});

check('short title and no images are not penalized', () => {
  const findings = measure(page('<title>Help</title><meta name="description" content="Useful help.">'));
  assert.equal(findings.o1.status, 'Pass');
  assert.equal(findings.o5.status, 'Pass');
  for (const id of ['o2', 'o10', 'o12', 'o34', 'o42', 't3', 't36']) assert.equal(findings[id], undefined);
});
check('missing title and description are detected', () => {
  const findings = measure(page());
  assert.equal(findings.o1.status, 'Fail');
  assert.equal(findings.o5.status, 'Fail');
});
check('commented metadata is not real metadata', () => {
  const findings = measure(page('<!-- <title>Fake</title><meta name="description" content="fake"> -->'));
  assert.equal(findings.o1.status, 'Fail');
  assert.equal(findings.o5.status, 'Fail');
});
check('HTML strings inside scripts are not document metadata', () => {
  assert.equal(measure(page('<script>const x = "<title>Fake</title>"</script>')).o1.status, 'Fail');
});
check('HTTPS success and HTTP failure describe the fetched URL', () => {
  assert.equal(measure(page()).t28.status, 'Pass');
  assert.equal(measure(page(), 'http://example.com/').t28.status, 'Fail');
});
check('HTTP navigation link is not mixed content', () => {
  const finding=measure(page('', '<a href="http://example.org/">Reference</a>')).t32;
  assert.equal(finding.status, 'N/A');assert.deepEqual(JSON.parse(finding.evidence.pageResults![0].value!),[]);
});
check('HTTP embedded script is detected separately', () => {
  const finding=measure(page('', '<script src="http://example.org/app.js"></script>')).t32;
  assert.equal(finding.status, 'N/A');assert.equal(JSON.parse(finding.evidence.pageResults![0].value!)[0].url,'http://example.org/app.js');
});
check('invalid canonical cannot crash the analysis', () => {
  const findings = measure(page('<link rel="canonical" href="http://[">'));
  assert.equal(findings.t5.evidence.scoreEligible, false);
});
check('none and repeated googlebot directives need review, not an indexability pass', () => {
  for (const head of ['<meta name="robots" content="none">', '<meta name="robots" content="index"><meta name="googlebot" content="noindex">']) {
    const finding = measure(page(head)).t4;
    assert.equal(finding.status, 'Partial');
    assert.equal(finding.evidence.scoreEligible, false);
  }
});
check('scoped X-Robots-Tag cannot establish universal failure', () => {
  assert.equal(measure(page(), undefined, { 'X-Robots-Tag': 'otherbot: noindex' }).t4.evidence.scoreEligible, false);
});
check('CSS sizing, SVG, module scripts and legitimate forms cannot create score penalties', () => {
  const f = measure(page('<style>img{width:100px;height:100px}</style>', '<img src="icon.svg"><img src="logo.svg"><script type="module" src="/main.js"></script><form><input name="query"></form>'));
  for (const id of ['t20', 't21', 't22', 't26', 'c19', 'c17']) assert.equal(f[id].evidence.scoreEligible, false, id);
});
check('schema keyword in invalid JSON is not proof of correct structured data', () => {
  const f = measure(page('<script type="application/ld+json">{ broken Organization FAQPage LocalBusiness }</script>'));
  for (const id of ['t35', 't40', 't43']) assert.equal(f[id].evidence.scoreEligible, false, id);
});
check('source diagnostics cannot bypass scoring policy with scoreEligible=true', () => {
  const f = measure(page('<title>Help</title>'));
  const evidence = Object.fromEntries(Object.entries(f).map(([id, finding]) => [id, { ...finding.evidence, scoreEligible: true }]));
  const results = Object.fromEntries(Object.entries(f).map(([id, finding]) => [id, finding.status]));
  assert.equal(calculateScore(results, evidence).totalEvaluated, 5);
  assert.equal(calculateScore(results, evidence).scoreEligible, false);
});
check('every scoring HTML output has a reviewed measurement', () => {
  for (const [id, f] of Object.entries(measure(page('<title>Help</title>')))) {
    if (f.evidence.scoreEligible) assert.equal(CALIBRATED_CONTROLS[id]?.source, 'crawler');
  }
});
check('duplicate titles and descriptions are detected within a two-page sample', () => {
  const sample = (title: string, description: string, path: string): CrawledPage => ({ url: new URL(path, 'https://example.com'), title, description, html: page(`<title>${title}</title><meta name="description" content="${description}">`), response: new Response(''), durationMs: 100, redirects: 0 });
  const a = sample('First', 'First description', '/');
  const same = mergeSitewideFindings(measure(a.html), [a, sample('First', 'First description', '/two')]);
  assert.equal(same.o4.status, 'Fail');
  assert.equal(same.o8.status, 'Fail');
  const different = mergeSitewideFindings(measure(a.html), [a, sample('Second', 'Second description', '/two')]);
  assert.equal(different.o4.status, 'Pass');
  assert.equal(different.o8.status, 'Pass');
});
const samplePage = (path: string, description: string, title = path): CrawledPage => ({url:new URL(path,'https://example.com'),title,description,html:page(`<title>${title}</title><meta name="description" content="${description}">`),response:new Response(''),durationMs:100,redirects:0});
check('missing description is one presence problem, not a duplicate problem', () => {
  const pages = [samplePage('/','Home'),samplePage('/a','A'),samplePage('/b','B'),samplePage('/c','C'),samplePage('/blog/missing','')];
  const f = mergeSitewideFindings(measure(pages[0].html), pages);
  assert.equal(f.o5.status,'Fail'); assert.equal(f.o8.status,'Pass');
  assert.deepEqual(f.o5.evidence.pageResults?.filter(row=>row.status==='Fail').map(row=>row.url),['https://example.com/blog/missing']);
  assert.equal(f.o5.evidence.pageResults?.length,5); assert.doesNotMatch(f.o5.note,/homepage/i);
  assert.equal(f.o8.evidence.pageResults?.find(row=>row.url.endsWith('/missing'))?.status,'N/A');
});
check('all members of duplicate group have evidence, distinct page does not', () => {
  const pages=[samplePage('/a','Same'),samplePage('/b','Same'),samplePage('/c','Distinct')];
  const f=mergeSitewideFindings(measure(pages[0].html),pages);
  assert.deepEqual(f.o8.evidence.pageResults?.filter(row=>row.status==='Fail').map(row=>row.url),['https://example.com/a','https://example.com/b']);
});
check('one populated value cannot establish uniqueness',()=>{
  const pages=[samplePage('/a','Only'),samplePage('/b','')];
  assert.equal(mergeSitewideFindings(measure(pages[0].html),pages).o8.status,'N/A');
});
check('missing titles are not duplicate titles',()=>{
  const pages=[samplePage('/a','A','First'),samplePage('/b','B','Second'),samplePage('/c','C','')];
  const f=mergeSitewideFindings(measure(pages[0].html),pages);
  assert.equal(f.o1.status,'Fail');assert.equal(f.o4.status,'Pass');
});
check('single page retains URL evidence without an invented uniqueness pass',()=>{
  const p=samplePage('/article','');const f=mergeSitewideFindings(measure(p.html),[p]);
  assert.equal(f.o5.evidence.pageResults?.[0].url,p.url.href);assert.equal(f.o8.status,'N/A');
});
check('duplicate checks use parsed measurements instead of untrusted crawl metadata',()=>{
  const a=samplePage('/a','Real A');const b=samplePage('/b','Real B');a.description=b.description='Fake';
  assert.equal(mergeSitewideFindings(measure(a.html),[a,b]).o8.status,'Pass');
});
check('redirect aliases of one final URL do not create duplicates',()=>{
  const a=samplePage('/a','Same');const f=mergeSitewideFindings(measure(a.html),[a,{...a}]);
  assert.equal(f.o8.status,'N/A');assert.equal(f.o5.evidence.pageResults?.length,1);
});
check('equivalent HTML entities cannot hide duplicate metadata',()=>{
  const a=samplePage('/a','Fish &amp; Chips','Fish &amp; Chips');
  const b=samplePage('/b','Fish &#38; Chips','Fish &#38; Chips');
  const f=mergeSitewideFindings(measure(a.html,a.url.href),[a,b]);
  assert.equal(f.o4.status,'Fail');assert.equal(f.o8.status,'Fail');
  assert.equal(f.o8.evidence.pageResults?.[0].value,'Fish & Chips');
});
check('single response timings never invent performance verdicts and retain URLs',()=>{
  for(const durationMs of [0,799,800,1800,9000,NaN,Infinity,-1]){
    const p={...samplePage('/timed','Description'),durationMs};
    const findings=mergeSitewideFindings(measure(p.html),[p]);
    for(const id of ['t24','t64']){
      assert.equal(findings[id].status,'N/A');
      assert.equal(findings[id].evidence.scoreEligible,false);
      assert.equal(findings[id].evidence.pageResults?.[0].url,p.url.href);
      assert.doesNotMatch(findings[id].note,/NaN|Infinity/);
      assert.match(findings[id].evidence.pageResults![0].value!,Number.isFinite(durationMs)&&durationMs>=0?/ms/:/unavailable/);
    }
  }
});
check('sample timing variation is not proof of template inconsistency',()=>{
  const a={...samplePage('/fast','A'),durationMs:20};
  const b={...samplePage('/slow','B'),durationMs:9000};
  const f=mergeSitewideFindings(measure(a.html,a.url.href),[a,b]);
  assert.equal(f.t64.status,'N/A');
  assert.deepEqual(f.t64.evidence.pageResults?.map(row=>row.url),[a.url.href,b.url.href]);
  assert.match(f.t64.note,/20 to 9000 ms/);
  assert.match(f.t24.evidence.pageResults![1].value!,/9000 ms/);
  assert.match(f.t64.note,/Templates were not classified/);
});
check('multiple declarations remain visible and do not choose a search engine value',()=>{
  const a=samplePage('/a','First','First');
  a.html=a.html.replace('</head>','<title>Second</title><meta name="description" content="Second"></head>');
  const b=samplePage('/b','First','First');
  const f=mergeSitewideFindings(measure(a.html),[a,b]);
  for(const id of ['o1','o5']){
    assert.equal(f[id].status,'Pass','presence alone is still established');
    assert.deepEqual(f[id].evidence.pageResults![0].declarations,['First','Second']);
  }
  for(const id of ['o4','o8']){
    assert.equal(f[id].status,'N/A');assert.equal(f[id].evidence.scoreEligible,false);
    assert.equal(f[id].evidence.pageResults![0].status,'N/A');
  }
});
check('empty first metadata does not hide a populated second declaration',()=>{
  const f=measure(page('<title></title><title>Actual</title><meta name="description" content=""><meta name="description" content="Actual">'));
  assert.equal(f.o1.status,'Pass');assert.equal(f.o5.status,'Pass');
  assert.deepEqual(f.o5.evidence.pageResults![0].declarations,['','Actual']);
});
check('known duplicates survive alongside ambiguous declarations without aggregate scoring',()=>{
  const a=samplePage('/a','Same','Same'),b=samplePage('/b','Same','Same'),c=samplePage('/c','Other','Other');
  c.html=c.html.replace('</head>','<meta name="description" content="Other"></head>');
  const f=mergeSitewideFindings(measure(a.html),[a,b,c]);
  assert.equal(f.o8.status,'Fail');assert.equal(f.o8.evidence.scoreEligible,false);
  assert.deepEqual(f.o8.evidence.pageResults!.map(row=>row.status),['Fail','Fail','N/A']);
});
check('many form fields and autocomplete declarations cannot establish conversion or autofill verdicts',()=>{
  const many=page('',`<form id="contact">${'<input autocomplete="off">'.repeat(12)}</form>`);
  const f=measure(many);
  assert.equal(f.c17.status,'N/A');assert.equal(f.c19.status,'N/A');
  assert.equal(f.c17.evidence.scoreEligible,false);assert.equal(f.c19.evidence.scoreEligible,false);
});
check('contact evidence is page-specific and is not a visibility or conversion verdict',()=>{
  const a=samplePage('/a','A'),b=samplePage('/b','B');
  a.html=a.html.replace('</body>','<a href="tel:+123">Call</a><a href="mailto:hello@example.com">Email</a></body>');
  b.html=b.html.replace('</body>','<p>tel:+999</p></body>');
  const f=mergeSitewideFindings(measure(a.html,a.url.href),[a,b]);
  assert.equal(f.o47.status,'N/A');assert.equal(f.o47.evidence.scoreEligible,false);
  assert.deepEqual(f.o47.evidence.pageResults!.map(row=>row.url),[a.url.href,b.url.href]);
  assert.equal(f.c26.status,'Pass');assert.equal(f.c26.evidence.scoreEligible,true);
  assert.deepEqual(f.c26.evidence.pageResults!.map(row=>row.url),[a.url.href]);
  assert.match(f.c26.evidence.pageResults![0].value!,/tel:\+123/);
});
check('about/privacy keywords do not establish credibility, policy presence or failure',()=>{
  for(const html of [page('', '<p>privacy terms about</p>'),page('', '<a href="/about">About</a>'),page('')]){
    for(const id of ['o46','o49']){assert.equal(measure(html)[id].status,'N/A');assert.equal(measure(html)[id].evidence.scoreEligible,false);}
  }
});
check('an unfetched page breaks site-wide scope instead of publishing a pass',()=>{
  const pages=[samplePage('/','Home'),samplePage('/a','A')];
  const merged=mergeSitewideFindings(measure(pages[0].html),pages,[
    {url:'https://example.com/broken',finalUrl:'https://example.com/broken',status:0,outcome:'unavailable'},
  ]);
  // The raw verdict for the pages we could download stays what it was: a failure is never
  // invented from an undownloadable page.
  assert.equal(merged.o5.status,'Pass');
  assert.equal(merged.o5.evidence.scoreEligible,true);
  assert.equal(merged.o5.evidence.scope?.tested,2);
  assert.equal(merged.o5.evidence.scope?.discovered,3);
  assert.equal(merged.o5.evidence.scope?.complete,false);
  assert.equal(merged.t9.evidence.scope?.complete,false);
  assert.match(merged.o5.note,/could not be fetched/);
  const cards=buildOnlineScorecards({
    findings:merged,
    sitemapDiscovery:{maps:[],pages:[]} as never,
    robotsDetails:[],contentDetails:[],schemaDetails:[],languageDetails:[],
  });
  const description=cards.seo.checks.find(c=>c.id==='seo-description');
  assert.equal(description?.status,'Unavailable','incomplete site-wide scope must not publish a pass');
  assert.ok((cards.overall?.notices ?? 0)>0,'and it is not silently dropped either');
  const clean=buildOnlineScorecards({
    findings:mergeSitewideFindings(measure(pages[0].html),pages,[]),
    sitemapDiscovery:{maps:[],pages:[]} as never,
    robotsDetails:[],contentDetails:[],schemaDetails:[],languageDetails:[],
  });
  assert.equal(clean.seo.checks.find(c=>c.id==='seo-description')?.status,'Pass','a complete crawl scope still publishes');
  assert.equal(
    cards.overall?.errors,
    clean.overall?.errors,
    'a fetch failure changes availability, never the defect count',
  );
});
check('declared charsets are decoded instead of assuming UTF-8', () => {
  // windows-1254 (Turkish): ş = 0xFE, ı = 0xFD -> the title reads "Başlık".
  const cp1254 = new Uint8Array(Buffer.concat([
    Buffer.from('<meta charset="windows-1254"><title>Ba'),
    Buffer.from([0xfe]),
    Buffer.from('l'),
    Buffer.from([0xfd]),
    Buffer.from('k</title>'),
  ]));
  const fromHeader = decodeBody(cp1254, 'text/html; charset=windows-1254');
  assert.ok(fromHeader.includes('<title>Başlık</title>'), 'transport charset must win over the UTF-8 default');
  const fromMeta = decodeBody(cp1254, null);
  assert.ok(fromMeta.includes('<title>Başlık</title>'), 'the <meta charset> prescan must apply when the header is silent');
  const unknown = decodeBody(cp1254, 'text/html; charset=x-not-a-real-charset');
  assert.equal(typeof unknown, 'string', 'an unknown charset label must fall back instead of throwing');
  const withBom = decodeBody(new Uint8Array([0xef, 0xbb, 0xbf, 0x41]), 'text/html; charset=iso-8859-1');
  assert.equal(withBom, 'A', 'a UTF-8 BOM outranks the transport charset');
  assert.equal(measure(page(fromHeader)).o1.status, 'Pass', 'the calibrated title control must receive decoded text');
});

check('calibrated inventory matches the published measurement inventory', () => {
  const activeIds = new Set(AUDIT_CATEGORIES.flatMap(category => category.sections.flatMap(section => section.items.map(item => item.id))));
  assert.equal(activeIds.size, 199, 'active catalog changed — refresh POVLEX-KONTROL-KALIBRASYONU.md and the P1-P3 plan');
  const calibratedIds = Object.keys(CALIBRATED_CONTROLS);
  assert.equal(calibratedIds.length, 19, 'calibrated inventory changed — update the calibration inventory and the P1-P3 plan');
  assert.equal(calibratedIds.filter(id => id.startsWith('serp')).length, 0, 'serp stays unmeasured until the B4 decision lands');
  assert.equal(P0_AUTOMATED_CONTROL_TARGET, 82, 'automation target changed — update the published inventory');
  for (const id of calibratedIds) assert.ok(activeIds.has(id), `${id} is calibrated but missing from the active catalog`);
});

check('a truncated page budget breaks the site-wide completeness claim', () => {
  const pages=[samplePage('/a','Title A','First'),samplePage('/b','Title B','Second')];
  const bounded=mergeSitewideFindings(measure(pages[0].html),pages,[],true);
  assert.equal(bounded.o5.evidence.scope?.complete,false,'discovery truncation must break completeness');
  assert.match(bounded.o5.note,/budget/);
  assert.equal(bounded.o8.evidence.scope?.complete,false);
  assert.equal(bounded.t9.evidence.scope?.complete,false);
  assert.equal(bounded.o8.status,'Pass','no duplicates in a truncated sample stays a raw pass; scoring demotes it through scope');
  const unbounded=mergeSitewideFindings(measure(pages[0].html),pages);
  assert.equal(unbounded.o5.evidence.scope?.complete ?? true,true);
  assert.equal(unbounded.o8.status,'Pass');
});

check('schema required-field gaps are diagnostics, not failures', () => {
  const html = `<!doctype html><html><head><script type="application/ld+json">{"@type":"Organization","name":"Acme"}</script><script type="application/ld+json">{broken</script></head><body></body></html>`;
  const { blocks, organization } = structuredDataEvidence(html);
  assert.equal(blocks[0].state, 'parsed');
  assert.ok(blocks[0].fields?.includes('name'));
  assert.deepEqual(blocks[0].missingRequired, ['Organization.url'], 'missing required fields are listed for review');
  assert.equal(blocks[1].state, 'invalid');
  assert.equal(blocks[1].missingRequired, undefined, 'invalid blocks get no invented coverage');
  assert.equal(organization.status, 'Partial', 'presence semantics stay unchanged; gaps never become Fail');
});

console.log(`${cases} measurement calibration scenarios passed.`);

void testCanonicalTargets().catch(error => { console.error(error); process.exitCode = 1; });
void testHttpsRedirect().catch(error => { console.error(error); process.exitCode = 1; });
void testRepeatedTimings().catch(error => { console.error(error); process.exitCode = 1; });
