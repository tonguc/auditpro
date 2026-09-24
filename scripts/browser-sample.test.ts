import assert from 'node:assert/strict';
import {selectBrowserSample} from '../lib/browser-sample';
const urls=['/','/services/a','/services/b','/services/c','/contact','/blog','/products/a'].map(path=>'https://example.com'+path);
assert.deepEqual(selectBrowserSample(urls),[urls[0],urls[4],urls[1],urls[6],urls[5]]);
assert.deepEqual(selectBrowserSample([urls[0],urls[0],urls[1]]),[urls[0],urls[1]]);
assert.deepEqual(selectBrowserSample([]),[]);assert.deepEqual(selectBrowserSample(urls,1),[urls[0]]);
assert.equal(selectBrowserSample(urls).every(url=>urls.includes(url)),true);
console.log('Browser sampling: diversity, budget, deduplication and small sites passed.');
