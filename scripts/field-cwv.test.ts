import assert from 'node:assert/strict';
import { fieldCwvApiKey, fieldCwvThresholdStatus, parseCruxResponse } from '../lib/field-cwv';

// P1-P3 plan C1 (field): CrUX parsing, official thresholds and honest fallbacks.
assert.equal(fieldCwvApiKey(''), null, 'without a CrUX key field CWV stays unmeasured');
assert.equal(fieldCwvApiKey(undefined), null);
assert.equal(fieldCwvApiKey('  abc  '), 'abc');
assert.equal(fieldCwvThresholdStatus('lcp', null), 'N/A', 'missing field data never becomes a pass');
assert.equal(fieldCwvThresholdStatus('lcp', 2500), 'Pass');
assert.equal(fieldCwvThresholdStatus('lcp', 2501), 'Partial');
assert.equal(fieldCwvThresholdStatus('lcp', 4000), 'Partial');
assert.equal(fieldCwvThresholdStatus('lcp', 4001), 'Fail');
assert.equal(fieldCwvThresholdStatus('inp', 200), 'Pass');
assert.equal(fieldCwvThresholdStatus('inp', 201), 'Partial');
assert.equal(fieldCwvThresholdStatus('inp', 500), 'Partial');
assert.equal(fieldCwvThresholdStatus('inp', 501), 'Fail');
assert.equal(fieldCwvThresholdStatus('cls', 0.1), 'Pass');
assert.equal(fieldCwvThresholdStatus('cls', 0.11), 'Partial');
assert.equal(fieldCwvThresholdStatus('cls', 0.25), 'Partial');
assert.equal(fieldCwvThresholdStatus('cls', 0.26), 'Fail');
const parsed = parseCruxResponse({ record: { metrics: {
  largest_contentful_paint: { percentiles: { p75: 2100 } },
  cumulative_layout_shift: { percentiles: { p75: 0.05 } },
} } }, 'PHONE');
assert.equal(parsed?.formFactor, 'PHONE');
assert.equal(parsed?.lcpMsP75, 2100);
assert.equal(parsed?.clsP75, 0.05);
assert.equal(parsed?.inpMsP75, null, 'a metric missing from the record stays unknown');
assert.equal(parseCruxResponse({}, 'PHONE'), null, 'an empty record invents no metric');
assert.equal(parseCruxResponse(null, 'PHONE'), null);
assert.equal(parseCruxResponse({ record: { metrics: { largest_contentful_paint: { percentiles: { p75: '2100' } } } } }, 'PHONE')?.lcpMsP75, null, 'non-numeric percentiles are unknown, not coerced');

console.log('Field CWV passed: CrUX parsing, official thresholds and unmeasured fallbacks.');
