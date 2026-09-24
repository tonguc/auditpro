import assert from 'node:assert/strict';
import {measureLanguages} from '../lib/language-evidence';
const page=(path:string,head:string)=>({url:new URL(path,'https://example.com'),html:`<html lang="en"><head>${head}</head></html>`});
const rows=measureLanguages([
  page('/en','<link rel=alternate hreflang=fr href="https://example.com/fr"><link rel=alternate hreflang=de href="/de"><link rel=alternate hreflang=fr href="https://other.example/fr"><template><link rel=alternate hreflang=xx href="https://example.com/fake"></template>'),
  page('/fr','<link rel=alternate hreflang=en href="https://example.com/en">'),
]);
assert.equal(rows[0].lang,'en'); assert.equal(rows[0].alternates.length,3);
assert.equal(rows[0].alternates[0].returnInHtml,true);
assert.equal(rows[0].alternates[0].conflict,true);
assert.equal(rows[0].alternates[1].absolute,false);
assert.equal(rows[0].alternates[2].sampled,false);
assert.equal(rows[0].alternates[2].returnInHtml,undefined,'unfetched is not a failed reciprocal link');
assert.equal(measureLanguages([page('/','')])[0].alternates.length,0);
const noReturn=measureLanguages([page('/en','<link rel=alternate hreflang=fr href="https://example.com/fr">'),page('/fr','')]);
assert.equal(noReturn[0].alternates[0].returnInHtml,false);
console.log('Language evidence: reciprocity, conflicts, sample limits and inert declarations passed.');
