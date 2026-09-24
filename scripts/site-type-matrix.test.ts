import assert from 'node:assert/strict';
import { analyzeHtml } from '../lib/html-measurements';
import { structuredDataEvidence } from '../lib/seo-evidence';

// Controlled fixtures: these outcomes establish regression coverage, not field accuracy.
let falsePositives=0, falseNegatives=0, decisions=0;
for(const [kind,type] of [['clinic','Physician'],['shop','Product'],['software','SoftwareApplication'],['publication','Article']]) {
  for(const missing of [false,true]) {
    const html=`<!doctype html><html lang="tr"><head>${missing?'':`<title>${kind}</title><meta name="description" content="${kind} information">`}<script type="application/ld+json">${JSON.stringify({'@context':'https://schema.org','@type':type})}</script></head><body><h1>${kind}</h1><p>Sample content</p></body></html>`;
    const findings=analyzeHtml(html,new URL(`https://example.com/${kind}`),new Response('',{status:200}),100,0);
    for(const id of ['o1','o5']) {
      const failed=findings[id].status==='Fail'; decisions++;
      if(failed&&!missing) falsePositives++;
      if(!failed&&missing) falseNegatives++;
      assert.equal(failed,missing,`${kind}: ${id}`);
    }
    const schema=structuredDataEvidence(html);
    assert.equal(schema.faq.status,'N/A',`${kind}: FAQ absence is not a universal fault`);
    assert.deepEqual(schema.blocks[0].types,[type]);
  }
}
console.log(`Controlled site-type matrix: ${decisions} title/description decisions; false positives=${falsePositives}; missed faults=${falseNegatives}. Four site types; not a real-world accuracy estimate.`);
