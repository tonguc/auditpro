import assert from 'node:assert/strict';
import {sourceObservations} from '../lib/source-observations';
import {analyzeHtml} from '../lib/html-measurements';
const url=new URL('https://example.com/');
const html='<html lang="tr"><head><base href="http://assets.example/"></head><body><template><footer><input type=email required><img src="fake.png"></footer></template><footer></footer><form><input type=email required="false"><input type=hidden><textarea autocomplete=""></textarea></form><img src="photo.jpg"><a href="http://other.example">Link</a><link rel="alternate stylesheet" href="main.css"></body></html>';
const result=sourceObservations(html,url);
assert.equal(result.footerCount,1);assert.equal(result.forms,1);assert.equal(result.fields.length,2);assert.equal(result.fields[0].required,true);assert.equal(result.lang,'tr');assert.deepEqual(result.resources.map(row=>row.url),['http://assets.example/photo.jpg','http://assets.example/main.css']);
for(const markup of ['',html,'<button>Accessible text</button>','<meta name=viewport content="not-width=device-width"><p>G-FAKE</p>']){
 const f=analyzeHtml(markup,url,new Response(''),0,0);
 for(const id of ['o9','o13','u34','t27','t32','t53','o37','u28','u37','u39','c17','c19','c29']){assert.equal(f[id].status,'N/A',id);assert.equal(f[id].evidence.scoreEligible,false,id);}
 assert.equal(f.t45.evidence.scoreEligible,true,'viewport declaration is a bounded source check');
 assert.equal(f.t45.status,markup.includes('not-width=device-width')?'Partial':'Fail');
}
console.log('Source audit: parsed evidence and unknown semantics remain separate for remaining HTML controls.');
