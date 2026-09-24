import assert from 'node:assert/strict';
import {probeHttpsRedirect as probe} from '../lib/https-redirect-evidence';
const page=new URL('https://example.com/private?query=not-for-probe');
const hop={url:'http://example.com/private',status:301,target:'https://example.com/private'};
export async function testHttpsRedirect(){
  const good=await probe(page,async start=>{
    assert.equal(start.href,'http://example.com/private');
    return {status:200,finalUrl:'https://example.com/private',redirectTrace:[hop]};
  });
  assert.equal(good.status,'Pass');assert.match(good.note,/301/);
  assert.equal((await probe(page,async()=>({status:200,finalUrl:'http://example.com/',redirectTrace:[]}))).status,'Fail');
  assert.equal((await probe(page,async()=>({status:503,finalUrl:'https://example.com/',redirectTrace:[hop]}))).status,'N/A');
  assert.equal((await probe(page,async()=>{throw new Error('timeout');})).status,'N/A');
  let portRequests=0;
  assert.equal((await probe(new URL('https://example.com:8443'),async()=>{portRequests++;throw new Error('must not load');})).status,'N/A');
  assert.equal(portRequests,0);
  assert.equal((await probe(page,async()=>({status:200,finalUrl:'https://other.example/',redirectTrace:[{...hop,target:'https://other.example/'}]}))).status,'Partial');
  assert.equal((await probe(page,async()=>({status:200,finalUrl:'https://example.com/',redirectTrace:[hop]}))).status,'Partial');
  assert.equal((await probe(page,async()=>({status:200,finalUrl:'https://example.com/',redirectTrace:[]}))).status,'N/A');
  assert.equal((await probe(page,async()=>({status:200,finalUrl:'https://example.com/',redirectTrace:[hop,{url:'https://example.com/',status:302,target:'http://example.com/back'},{url:'http://example.com/back',status:301,target:'https://example.com/'}]}))).status,'Partial');
  console.log('HTTP-start probes: scope, success, plaintext, errors, missing traces, ports and host/downgrade review passed.');
}
