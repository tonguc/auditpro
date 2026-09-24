import assert from 'node:assert/strict';
import {discoverSitemapPages} from '../lib/sitemap-discovery';
const origin='https://example.com';
const xml=(index:boolean, urls:string[])=>`<${index?'sitemapindex':'urlset'} xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.map(url=>`<${index?'sitemap':'url'}><loc>${url}</loc></${index?'sitemap':'url'}>`).join('')}</${index?'sitemapindex':'urlset'}>`;
export async function testSitemapDiscovery(){
 const ns='http://www.sitemaps.org/schemas/sitemap/0.9';
 const prefixed=await discoverSitemapPages([origin+'/prefix-index'],origin,async url=>({url,status:200,text:url.endsWith('prefix-index')
   ? `<s:sitemapindex xmlns:s="${ns}" xmlns:p="${ns}"><p:sitemap><p:loc>${origin}/prefix-leaf</p:loc></p:sitemap></s:sitemapindex>`
   : `<urlset xmlns="${ns}"><url><p:loc xmlns:p="${ns}">${origin}/discovered</p:loc></url><url xmlns="urn:foreign"><loc>${origin}/ignored</loc></url></urlset>`}));
 assert.deepEqual(prefixed.pages,[origin+'/discovered']);assert.equal(prefixed.maps.length,2);
 const mixed=await discoverSitemapPages([origin+'/mixed'],origin,async url=>({url,status:200,text:xml(false,[origin+'/local','https://other.example/page'])}));
 assert.equal(mixed.maps[0].externalEntries,1);assert.deepEqual(mixed.pages,[origin+'/local']);
 const docs:Record<string,string>={'/root':xml(true,[origin+'/child',origin+'/other']),'/child':xml(true,[origin+'/root',origin+'/leaf']),'/leaf':xml(false,[origin+'/a',origin+'/b']),'/other':xml(false,[origin+'/a'])};
 const requested:string[]=[];
 const load=async(url:string)=>{requested.push(url);return {url,status:200,text:docs[new URL(url).pathname]}};
 const all=await discoverSitemapPages([origin+'/root'],origin,load);
 assert.deepEqual(all.pages.sort(),[origin+'/a',origin+'/b']);assert.equal(requested.length,4,'cycle must not refetch root');
 const bounded=await discoverSitemapPages([origin+'/root'],origin,load,1);
 assert.equal(bounded.maps.filter(map=>map.state==='limit').length,2);assert.equal(bounded.pages.length,0);
 const failed=await discoverSitemapPages([origin+'/fail'],origin,async url=>({url,status:500,text:''}));
 assert.equal(failed.maps[0].status,500);assert.equal(failed.maps[0].state,'unavailable');
 const invalid=await discoverSitemapPages([origin+'/bad'],origin,async url=>({url,status:200,text:'<html>error</html>'}));
 assert.equal(invalid.maps[0].state,'unsupported');
 const external=await discoverSitemapPages(['https://other.example/map'],origin,async()=>{throw Error('must not load')});
 assert.equal(external.maps[0].state,'external');
 const cap=await discoverSitemapPages([origin+'/leaf'],origin,load,12,1);assert.equal(cap.pages.length,1);assert.equal(cap.pageLimitReached,true);
 const empty=await discoverSitemapPages([origin+'/empty'],origin,async url=>({url,status:200,text:xml(false,[])}));assert.equal(empty.maps[0].state,'parsed');
 console.log('Sitemap discovery: nested maps, cycles, budgets, failures, invalid XML and page caps passed.');
}
