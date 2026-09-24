import assert from 'node:assert/strict';
import { crawlScopeSummary } from '../lib/crawl-scope-summary';
assert.deepEqual(crawlScopeSummary({}),{analyzed:null,requested:null,applied:null,unprocessed:null,limited:null,reduced:false});
const summary=crawlScopeSummary({pagesAnalyzed:3,requestedPageLimit:25,pageLimit:5,crawlOutcomes:[{url:'https://example.com/a',outcome:'analyzed'},{url:'https://example.com/b',outcome:'non-html'},{url:'https://example.com/b',outcome:'non-html'},{url:'https://example.com/c',outcome:'unavailable'},{url:'https://example.com/d',outcome:'limit'}]});
assert.deepEqual(summary,{analyzed:3,requested:25,applied:5,unprocessed:2,limited:1,reduced:true});
assert.equal(crawlScopeSummary({pagesAnalyzed:NaN}).analyzed,null);
assert.equal(crawlScopeSummary({pagesAnalyzed:0,crawlOutcomes:[]}).analyzed,0);
assert.equal(crawlScopeSummary({pageLimit:25,pagesAnalyzed:3}).reduced,false,'fewer discovered pages is not evidence of a plan restriction');
console.log('Crawl scope: missing vs zero, deduplicated exclusions, requested/applied limits and no invented plan cause passed.');
