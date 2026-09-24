import assert from 'node:assert/strict';
import { findingMetric, findingSummary, scoreExclusionReason, summarizeFindings, UX_RISK_CONTROLS } from '../lib/finding-summary';

// A recorded observation is not a confirmed failure. N/A is not a pass.
const ids=Array.from({length:26},(_,i)=>String(i));
const evidence=Object.fromEntries(ids.map(id=>[id,{}]));
const notes=Object.fromEntries(ids.map(id=>[id,'Observed']));
assert.deepEqual(summarizeFindings(ids,{'0':'Pass'},evidence,notes),{total:26,issues:0,passed:1,unavailable:0,review:25});
assert.deepEqual(summarizeFindings(ids,{'0':'Fail','1':'Partial','2':'Pass','3':'N/A'},evidence,notes),{total:26,issues:2,passed:1,unavailable:1,review:22});
assert.deepEqual(summarizeFindings(ids,{},{},{}),{total:0,issues:0,passed:0,unavailable:0,review:0});

// User-language summaries rebuild the headline meaning from structured
// evidence; they never guess and never leave an awkward contradiction like
// "found on 0/125".
const c1 = { sourceControlIds: ['c1'], observed: { clear: 0, aboveFold: 0 }, scope: { tested: 125, discovered: 125, complete: true } };
assert.match(findingSummary(c1, 'tr') ?? '', /125 görünümün hiçbirinde net bir birincil eylem bulunamadı/);
assert.equal(findingMetric(c1, 'tr'), '0 / 125');
const c1ok = { sourceControlIds: ['c1'], observed: { clear: 125, aboveFold: 120 }, scope: { tested: 125, discovered: 125, complete: true } };
assert.match(findingSummary(c1ok, 'tr') ?? '', /125'inde net bir birincil eylem var/);

const u33 = { sourceControlIds: ['u33'], observed: { failed: 1224, incomplete: 2334 }, scope: { tested: 10855, discovered: 10855, complete: false } };
assert.match(findingSummary(u33, 'tr') ?? '', /1\.?224 metin\/arka plan çifti yeterli kontrasta sahip değil/);
assert.match(findingSummary(u33, 'tr') ?? '', /elle kontrol edilmeyi bekliyor/);

const u35 = { sourceControlIds: ['u35'], observed: { trapDetected: true } };
assert.match(findingSummary(u35, 'tr') ?? '', /tuza/);

const t47 = { sourceControlIds: ['t47'], observed: { failed: 3165 }, scope: { tested: 5224, discovered: 5224, complete: true } };
assert.match(findingSummary(t47, 'tr') ?? '', /3\.?165 dokunma hedefi 48×48 pikselin altında/);
assert.equal(findingMetric(t47, 'en'), '3,165 / 5,224');

const c19 = { sourceControlIds: ['c19'], observed: { autocomplete: 48, fields: 155 } };
assert.match(findingSummary(c19, 'tr') ?? '', /155 form alanının 48'inde autocomplete/);

// No structured numbers → honest fallback signal (null), never invented text.
assert.equal(findingSummary({ sourceControlIds: ['t2'], observed: {} }, 'tr'), null);

assert.match(scoreExclusionReason('method-not-calibrated', 'tr') ?? '', /kalibre edilmedi/);
assert.match(scoreExclusionReason('coverage-incomplete', 'tr') ?? '', /belirsiz kaldı/);
assert.match(scoreExclusionReason(undefined, 'en') ?? '', /evidence threshold/);

assert.ok(UX_RISK_CONTROLS.has('c1') && UX_RISK_CONTROLS.has('t47'));
assert.equal(UX_RISK_CONTROLS.has('t2'), false);

console.log('Finding summaries passed: user-language TR/EN, structured evidence, honest fallbacks.');
