import assert from 'node:assert/strict';
import { canonicalEvidence, indexingEvidence, structuredDataEvidence, sitemapEvidence, declaredSitemaps } from '../lib/seo-evidence';
const url = new URL('https://example.com/page');
let passed = 0;
function check(name: string, run: () => void) { run(); passed++; console.log(`PASS ${name}`); }
check('otherbot indexing rules do not apply to Google', () => assert.equal(indexingEvidence('', 'otherbot: noindex, nofollow').status, 'N/A'));
check('scope switches to googlebot', () => assert.equal(indexingEvidence('', 'otherbot: nofollow, googlebot: noindex').status, 'Partial'));
check('unscoped noindex applies to Google', () => assert.equal(indexingEvidence('', 'noindex, nofollow').status, 'Partial'));
check('none expands to an indexing restriction', () => assert.equal(indexingEvidence('<meta name=robots content=none>', '').status, 'Partial'));
check('repeated directives use the restrictive rule', () => assert.equal(indexingEvidence('<meta name=robots content=index><meta name=googlebot content=noindex>', '').status, 'Partial'));
check('template and script metadata are inert', () => assert.equal(indexingEvidence('<template><meta name=robots content=noindex></template><script>"<meta name=robots content=noindex>"</script>', '').status, 'N/A'));
check('missing canonical is not failure', () => assert.equal(canonicalEvidence('', url).status, 'N/A'));
check('conflicting HTML canonicals are detected', () => assert.equal(canonicalEvidence('<link rel=canonical href=/one><link rel=canonical href=/two>', url).status, 'Fail'));
check('HTTP and HTML canonical conflict is detected', () => assert.equal(canonicalEvidence('<link rel=canonical href=/one>', url, '<https://example.com/two>; rel="canonical"').status, 'Fail'));
check('duplicate identical declarations are consistent but not verified targets', () => assert.equal(canonicalEvidence('<link rel=canonical href=/one><link rel=canonical href=/one>', url).status, 'Partial'));
check('document base and escaped query entities resolve correctly', () => assert.match(canonicalEvidence('<base href="https://example.com/base/"><link rel=canonical href="one?a=1&amp;b=2">', url).note, /https:\/\/example.com\/base\/one\?a=1&b=2/));
check('cross-domain canonical is not automatically invalid', () => assert.equal(canonicalEvidence('<link rel=canonical href="https://other.example/">', url).status, 'Partial'));
check('unsupported canonical scheme is invalid', () => assert.equal(canonicalEvidence('<link rel=canonical href="javascript:alert(1)">', url).status, 'Fail'));
check('schema names in free text do not imply declared types', () => assert.equal(structuredDataEvidence('<script type="application/ld+json">{"description":"Organization"}</script>').organization.status, 'N/A'));
check('graph and type arrays are inspected', () => assert.equal(structuredDataEvidence('<script type="application/ld+json">{"@graph":[{"@type":["Organization","LocalBusiness"]}]}</script>').organization.status, 'Partial'));
check('invalid JSON does not invent a missing organization error', () => {
  const result=structuredDataEvidence('<script type="application/ld+json">{broken}</script>');
  assert.equal(result.organization.status,'N/A'); assert.equal(result.blocks[0].state,'invalid');
});
check('unrelated invalid block does not invalidate declared organization', () => {
  const result=structuredDataEvidence('<script type="application/ld+json">{"@type":"Organization"}</script><script type="application/ld+json">{broken}</script>');
  assert.equal(result.organization.status,'Partial'); assert.equal(result.faq.status,'N/A');
  assert.deepEqual(result.blocks.map(b=>b.state),['parsed','invalid']);
});
check('large graph is explicitly incomplete', () => {
  const result=structuredDataEvidence('<script type="application/ld+json">'+JSON.stringify({'@graph':Array.from({length:10001},()=>({'@type':'Thing'}))})+'</script>');
  assert.equal(result.blocks[0].state,'limited');
});
check('no JSON-LD is not a universal error', () => assert.equal(structuredDataEvidence('').organization.status, 'N/A'));
const wrap = (body: string) => `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
check('sitemap child prefixes may differ while identifying the same namespace', () => {
  const result = sitemapEvidence('<s:urlset xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:p="http://www.sitemaps.org/schemas/sitemap/0.9"><p:url><p:loc>https://example.com/service</p:loc></p:url></s:urlset>');
  assert.deepEqual(result.urls, ['https://example.com/service']);
});
check('an overridden namespace must not produce sitemap page addresses', () => {
  assert.equal(sitemapEvidence(wrap('<url xmlns="urn:unrelated"><loc>https://example.com/not-a-page</loc></url>')).urls.length, 0);
});
check('loc can declare its own equivalent prefix', () => {
  assert.deepEqual(sitemapEvidence(wrap('<url><p:loc xmlns:p="http://www.sitemaps.org/schemas/sitemap/0.9">https://example.com/local</p:loc></url>')).urls, ['https://example.com/local']);
});
check('foreign loc cannot replace a required sitemap loc', () => {
  assert.equal(sitemapEvidence(wrap('<url><loc xmlns="urn:foreign">https://example.com/foreign</loc></url>')).parsed, false);
});
check('two equivalent prefix loc elements are still duplicates', () => {
  assert.equal(sitemapEvidence(wrap('<url><loc>https://example.com/a</loc><p:loc xmlns:p="http://www.sitemaps.org/schemas/sitemap/0.9">https://example.com/b</p:loc></url>')).parsed, false);
});
check('valid sitemap decodes URL entities and ignores age', () => {
  const result = sitemapEvidence(wrap('<url><loc>https://example.com/?a=1&amp;b=2</loc><lastmod>2001-01-01</lastmod></url>'));
  assert.deepEqual(result.urls, ['https://example.com/?a=1&b=2']); assert.equal(result.status, 'Partial');
});
check('malformed XML is rejected', () => assert.equal(sitemapEvidence(wrap('<url><loc>x</url>')).status, 'Fail'));
check('relative loc is rejected', () => assert.equal(sitemapEvidence(wrap('<url><loc>/relative</loc></url>')).status, 'Fail'));
check('duplicate loc elements are rejected', () => assert.equal(sitemapEvidence(wrap('<url><loc>https://example.com/a</loc><loc>https://example.com/b</loc></url>')).status, 'Fail'));
check('DTD cannot expand entities', () => assert.equal(sitemapEvidence('<!DOCTYPE urlset [<!ENTITY secret SYSTEM "file:///etc/passwd">]>'+wrap('<url><loc>&secret;</loc></url>')).urls.length, 0));
check('inspection limit never accepts truncated XML', () => assert.equal(sitemapEvidence(wrap(' '.repeat(250001))).status, 'Partial'));
check('namespace prefixes are supported', () => assert.deepEqual(sitemapEvidence('<s:urlset xmlns:s="http://www.sitemaps.org/schemas/sitemap/0.9"><s:url><s:loc>https://example.com/</s:loc></s:url></s:urlset>').urls, ['https://example.com/']));
check('sitemap index is distinguished from page URLs', () => assert.equal(sitemapEvidence('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><sitemap><loc>https://example.com/map</loc></sitemap></sitemapindex>').index, true));
check('declared sitemap discovery is bounded and same-origin', () => assert.deepEqual(declaredSitemaps('Sitemap: https://example.com/custom\nSitemap: http://127.0.0.1/map\nSitemap: https://other.example/map\nSitemap: https://user:pass@example.com/map', url.origin), ['https://example.com/custom']));
console.log(`${passed} SEO evidence scenarios passed.`);
// A directive value is not itself a standalone indexing directive.
for (const html of ['<meta name=robots content="max-image-preview: none">','<meta name=robots content="max-image-preview:none">']) {
  assert.equal(indexingEvidence(html,'').noindex,false);
}
assert.equal(indexingEvidence('', 'max-image-preview: none').noindex,false);
assert.equal(indexingEvidence('', 'max-image-preview: none, noindex').noindex,true);
assert.equal(indexingEvidence('<meta name=robots content="none">','').noindex,true);
assert.equal(indexingEvidence('<meta name=googlebot content=noindex>','','Googlebot').noindex,true);
assert.deepEqual(indexingEvidence('<meta name=robots content=noindex>','noindex').declarations.map(row=>row.source),['html','http']);
