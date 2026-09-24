import {readFileSync,writeFileSync} from 'node:fs';
import {documentMetadata} from '../lib/document-metadata';
import {analyzeHtml} from '../lib/html-measurements';
import assert from 'node:assert/strict';
type ReferencePage = {file?: string; url: string; status: number; sha256?: string; titles: string[]; descriptions: string[]; error?: string};
const reference: ReferencePage[]=JSON.parse(readFileSync('design/validation-matrix/real-snapshots/reference.json','utf8'));
const comparisons=reference.filter(row=>row.file).map(row=>{
 const html=readFileSync(row.file!,'utf8');const actual=documentMetadata(html);const findings=analyzeHtml(html,new URL(row.url),new Response('',{status:row.status}),0,0);
 return {url:row.url,sha256:row.sha256,titlesMatch:JSON.stringify(actual.titles)===JSON.stringify(row.titles),descriptionsMatch:JSON.stringify(actual.descriptions)===JSON.stringify(row.descriptions),titleDecision:findings.o1.status,titleExpected:row.titles.some(Boolean)?'Pass':'Fail',descriptionDecision:findings.o5.status,descriptionExpected:row.descriptions.some(Boolean)?'Pass':'Fail',titles:actual.titles,descriptions:actual.descriptions};
});
writeFileSync('design/validation-matrix/real-seo-comparison.json',JSON.stringify({scope:'Same captured HTML, independent Python HTMLParser vs Povlex parse5. Bounded metadata presence validation, not human expert or complete site accuracy.',unavailable:reference.filter(row=>row.error),comparisons},null,2));
assert.ok(comparisons.length>=2,'need at least two usable real pages');
for(const row of comparisons){assert.ok(row.titlesMatch,row.url);assert.ok(row.descriptionsMatch,row.url);assert.equal(row.titleDecision,row.titleExpected);assert.equal(row.descriptionDecision,row.descriptionExpected);}
console.log(JSON.stringify({pages:comparisons.length,metadataDecisions:comparisons.length*2,mismatches:0,unavailable:reference.filter(row=>row.error).length}));
