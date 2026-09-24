import assert from 'node:assert/strict';
import { repeatCrawlTimings, repeatedTimingText } from '../lib/repeated-crawl-timing';

export async function testRepeatedTimings() {
  let calls = 0;
  const urls = ['https://example.com/a','https://example.com/b','https://example.com/c','https://example.com/d'];
  const rows = await repeatCrawlTimings([urls[0],...urls], async url => ({status:200,finalUrl:url.href,durationMs:[10,100,1000][Math.floor(calls++/3)]}), () => 0);
  assert.equal(calls,9); assert.equal(rows.length,3);
  for(const row of rows){assert.equal(row.median,100);assert.equal(row.min,10);assert.equal(row.max,1000);assert.equal(row.attempts,3);}
  let tick = 0;
  const limited = await repeatCrawlTimings(urls,async url=>{tick+=15000;return {status:200,finalUrl:url.href,durationMs:1};},()=>tick);
  assert.equal(limited.reduce((sum,row)=>sum+row.attempts,0),1);
  assert.equal(limited.reduce((sum,row)=>sum+row.skipped,0),8);
  let attempt=0;
  const partial=await repeatCrawlTimings([urls[0]],async url=>{attempt++;if(attempt===2)throw Error('timeout');return {status:200,finalUrl:url.href,durationMs:attempt*10};},()=>0);
  assert.equal(partial[0].median,20);assert.equal(partial[0].failed,1);
  assert.match(repeatedTimingText(partial[0]),/2\/3 valid/);
  for(const response of [{status:503,finalUrl:urls[0],durationMs:1},{status:200,finalUrl:urls[1],durationMs:1},{status:200,finalUrl:urls[0],durationMs:NaN}]){
    const [bad]=await repeatCrawlTimings([urls[0]],async()=>response,()=>0);
    assert.equal(bad.median,null);assert.equal(bad.failed,3);assert.match(repeatedTimingText(bad),/unavailable/);
  }
  assert.deepEqual(await repeatCrawlTimings([],async()=>{throw Error('unexpected');}),[]);
  console.log('Repeated timing: sample cap, rounds, median, partial failures, budget, redirects and invalid values passed.');
}
