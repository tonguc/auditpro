import assert from 'node:assert/strict';
import {pageEvidenceSummary} from '../lib/page-evidence-summary';
const row={url:'https://example.com/',status:'N/A' as const};
assert.deepEqual(pageEvidenceSummary([]),{total:0,affected:0,unresolved:0});
assert.deepEqual(pageEvidenceSummary([row]),{total:1,affected:0,unresolved:1});
assert.deepEqual(pageEvidenceSummary([{...row,status:'Pass',measurementState:'incomplete-resources'}]),{total:1,affected:0,unresolved:1});
assert.deepEqual(pageEvidenceSummary([{...row,status:'Pass',measurementState:'complete'}]),{total:1,affected:0,unresolved:0});
assert.deepEqual(pageEvidenceSummary([{...row,status:'Fail'},row,{...row,status:'Partial',measurementState:'incomplete-coverage'}]),{total:3,affected:2,unresolved:2});
console.log('Page evidence summary: N/A and incomplete records never imply successful checks.');
