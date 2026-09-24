import assert from 'node:assert/strict';
import { externalLinkCheckBudget, externalLinkChecksEnabled, planExternalLinkChecks, summarizeExternalLinkChecks, type ExternalLinkCheck } from '../lib/external-link-checks';
import type { ExternalLink } from '../lib/external-link-evidence';

// P1-P3 plan C2: external status checks are bounded, deduplicated and OFF by
// default — the crawler must never issue external requests implicitly.
assert.equal(externalLinkChecksEnabled(), false, 'external link checks stay off unless explicitly enabled');
assert.equal(externalLinkChecksEnabled('enabled'), true);
assert.equal(externalLinkChecksEnabled('on'), false, 'only the explicit enabled value turns requests on');
assert.equal(externalLinkCheckBudget(), 20);
assert.equal(externalLinkCheckBudget('5'), 5);
assert.equal(externalLinkCheckBudget('500'), 100, 'the external budget is capped');
assert.equal(externalLinkCheckBudget('garbage'), 20);

const link = (url: string): ExternalLink => ({ url, target: '', rel: [] });
const plan = planExternalLinkChecks([link('https://a.example/1'), link('https://a.example/1'), link('https://b.example/2'), link('https://c.example/3')], 2);
assert.deepEqual(plan.targets.map((target) => target.url), ['https://a.example/1', 'https://b.example/2'], 'targets are deduplicated and the budget bounds requests');
assert.equal(plan.discovered, 3, 'the unrequested target still counts against completeness');
const boundedChecks: ExternalLinkCheck[] = [
  { url: 'https://a.example/1', finalUrl: 'https://a.example/1', status: 200, verified: true },
  { url: 'https://b.example/2', finalUrl: 'https://b.example/2', status: 404, verified: true },
];
const bounded = summarizeExternalLinkChecks(plan.discovered, boundedChecks);
assert.equal(bounded.scope.tested, 2);
assert.equal(bounded.scope.complete, false, 'a truncated budget cannot claim complete coverage');
assert.equal(bounded.failed, 1, 'observed 4xx remains evidence');
const unverified = summarizeExternalLinkChecks(1, [{ url: 'https://a.example/1', finalUrl: 'https://a.example/1', status: 0, verified: false }]);
assert.equal(unverified.scope.complete, false, 'unavailable targets are not passes');
const complete = summarizeExternalLinkChecks(1, [{ url: 'https://a.example/1', finalUrl: 'https://a.example/1', status: 200, verified: true }]);
assert.equal(complete.scope.complete, true);

console.log('External link checks passed: bounded budget, deduplication, failures and default-off policy.');
