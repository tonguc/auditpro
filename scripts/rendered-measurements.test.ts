import { configureAuditBrowser } from '../lib/audit-browser-network';
import { compareSchemaText } from '../lib/schema-visible';
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Regression pin (2026-09-23): the bundler's `axe.source` export becomes a
// build-transformed program that crashes on its own minified helpers ONLY in
// production builds (tsx-run tests stay green). The axe bundle must be read
// from the package file at runtime and injected via indirect (sloppy) eval.
const browserSource = readFileSync(new URL('../lib/browser-measurements.ts', import.meta.url), 'utf8');
assert.ok(/\(0,\s*eval\)\(source\)/.test(browserSource), 'axe must be injected via indirect eval');
assert.ok(/resolve\(["']axe-core["']\)/.test(browserSource), 'axe must be read from the package file at runtime, never via the bundled axe.source');
import './browser-sample.test';
import { chromium } from "playwright";
import { deriveRenderedFindings, measureViewportPage, VIEWPORT_PROFILES, type ViewportMeasurement } from "../lib/browser-measurements";

const passingFixture = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;color:#111;background:#fff;font:16px Arial}main{max-width:720px;margin:auto;padding:24px}
a,button,input{min-width:48px;min-height:48px;margin:8px;padding:12px}a{display:inline-flex;background:#075c4c;color:#fff;text-decoration:none}
:focus-visible{outline:3px solid #ffbf00;outline-offset:2px}.cta{font-weight:700}
</style></head><body><main><h1>Reliable analytics for teams</h1><span style="display:none">123456</span><script type="application/ld+json">{"@type":"Organization","name":"Reliable analytics for teams","telephone":"123456"}</script>
<a class="cta" href="/signup">Start Free Trial</a>
<img alt="fixture" loading="lazy" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==">
<script async src="/fixture.js"></script>
<form id="signup"><label>Email <input type="email" name="email" autocomplete="email"></label><button type="submit">Register</button></form>
</main></body></html>`;

const failingFixture = `<!doctype html>
<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>
*{box-sizing:border-box}body{margin:0;color:#aaa;background:#fff;font:16px Arial}main{padding:8px}.wide{width:520px;height:30px;background:#eee}
a,button,[role=button]{outline:none!important;box-shadow:none!important;border-color:transparent!important;background:#eee;color:#aaa;width:40px;height:30px;padding:0}
.cta{display:block;margin-top:1200px;width:180px;height:50px}
</style></head><body><main><h1>Product</h1><div class="wide">Overflow</div>
<button aria-label="Menu">Menu</button><button></button><div role="button" tabindex="-1">Custom</div><a class="cta" href="/signup">Start Free Trial</a>
</main></body></html>`;

async function measureFixture(html: string) {
  const browser = await chromium.launch({ headless: true });
  const measurements = [];
  try {
    for (const profile of VIEWPORT_PROFILES) {
      const context = await browser.newContext({ viewport: { width: profile.width, height: profile.height }, isMobile: profile.isMobile, hasTouch: profile.isMobile, locale: "en-US", timezoneId: "UTC" });
      await configureAuditBrowser(context, async () => ({ status: 200, headers: { 'content-type': 'text/html' }, body: Buffer.from(html) }));
      const page = await context.newPage();
      await page.goto("https://fixture.example/", { waitUntil: "load" });
      const renderedText = await page.evaluate(() => ({ text: document.body.innerText, blocks: [...document.querySelectorAll('script[type="application/ld+json"]')].map(n => n.textContent ?? '') }));
      if (renderedText.blocks.length) { const result = compareSchemaText(renderedText.blocks, renderedText.text); assert.equal(result.tested, 2); assert.equal(result.matched, 1, 'hidden telephone must not match visible text'); }
      measurements.push(await measureViewportPage(page, profile));
      await context.close();
    }
  } finally {
    await browser.close();
  }
  return deriveRenderedFindings(measurements, 1);
}

async function main() {
  const matrix: ViewportMeasurement[] = ['clean', 'broken'].flatMap(name=>VIEWPORT_PROFILES.map(profile=>({
    url:'https://fixture.example/'+name, profile, resourcesComplete:name==='clean',
    contrast:{passed:3,failed:1,incomplete:0}, names:{passed:3,failed:1,incomplete:0,failures:[{rule:'button-name',target:'button'}]},
    overflow:{pixels:0,offenders:0}, touch:{tested:1,failed:0}, cta:{candidates:0,clear:false,aboveFold:false,confidence:0},
    forms:{fields:0,autocomplete:0,leadForms:0,largestLeadForm:0,mobileApplicable:0,mobileCorrect:0},
    imageLoading:{discovered:2,lazy:1,visible:1,lazyVisible:1,performanceMatches:1,lazyPerformanceMatches:1},
    scriptLoading:{discovered:1,modules:0,async:1,defer:0,performanceMatches:1},
  })));
  const mixed=deriveRenderedFindings(matrix,2);
  for(const id of ['u33','u37']) {
    assert.equal(mixed[id].evidence.scoreEligible,false, 'partial resources must never unlock aggregate score');
    assert.equal(mixed[id].evidence.pageResults?.find(row=>row.url.endsWith('/clean'))?.status,'Fail');
    assert.equal(mixed[id].evidence.pageResults?.find(row=>row.url.endsWith('/broken'))?.status,'N/A');
    assert.equal(mixed[id].evidence.pageResults?.find(row=>row.url.endsWith('/broken'))?.measurementState,'incomplete-resources');
  }
  // The pass-side half of the same contract, pinned explicitly.
  const passingMatrix: ViewportMeasurement[] = ['clean','broken'].flatMap(name=>VIEWPORT_PROFILES.map(profile=>({
    url:'https://fixture.example/pass-'+name, profile, resourcesComplete:name==='clean',
    contrast:{passed:3,failed:0,incomplete:0}, names:{passed:3,failed:0,incomplete:0},
    overflow:{pixels:0,offenders:0}, touch:{tested:1,failed:0}, cta:{candidates:1,clear:true,aboveFold:true,confidence:0.9},
    forms:{fields:2,autocomplete:2,leadForms:1,largestLeadForm:2,mobileApplicable:1,mobileCorrect:1},
    imageLoading:{discovered:2,lazy:1,visible:1,lazyVisible:1,performanceMatches:1,lazyPerformanceMatches:1},
    scriptLoading:{discovered:1,modules:0,async:1,defer:0,performanceMatches:1},
  })));
  const passingMixed=deriveRenderedFindings(passingMatrix,2);
  for(const id of ['u33','u37']) {
    assert.equal(passingMixed[id].status,'Pass');
    assert.equal(passingMixed[id].evidence.scoreEligible,false,'partial resources must never unlock a passing score');
  }
  const missing=deriveRenderedFindings(matrix.slice(0,4),1);
  assert.equal(missing.u37.evidence.pageResults?.[0].measurementState,'incomplete-coverage');
  const duplicate=deriveRenderedFindings([...matrix.slice(0,4),matrix[0]],1);
  assert.equal(duplicate.u37.evidence.pageResults?.[0].status,'N/A','duplicate viewport must not impersonate missing viewport');
  assert.equal(duplicate.u37.evidence.scoreEligible,false,'incomplete render cannot publish an aggregate result (failures under broken rendering can be artifacts)');
  const passing = await measureFixture(passingFixture);
  assert.equal(passing.t22.status, "N/A", "viewport image evidence remains an observation, not a loading-quality verdict");
  assert.match(passing.t22.note, /visible image observations/, "image observation should report viewport evidence");
  assert.equal(passing.t22.evidence.scoreEligible, false, "image observation must remain outside the score");
  assert.equal(passing.t26.status, "N/A", "script viewport evidence remains an observation, not an execution verdict");
  assert.match(passing.t26.note, /external-script observations/, "script observation should report browser evidence");
  assert.equal(passing.t26.evidence.scoreEligible, false, "script observation must remain outside the score");
  assert.equal(passing.t46.status, "Pass", "responsive fixture should not overflow on mobile");
  assert.equal(passing.u35.status, "Pass", "all visible controls should be keyboard reachable");
  assert.equal(passing.u36.status, "Pass", "focus-visible styles should be detected");
  assert.equal(passing.c1.status, "Pass", "dominant CTA should be above fold in every viewport");
  assert.equal(passing.c1.evidence.scoreEligible, true, "complete CTA viewport evidence should feed the bounded CRO score");

  assert.equal(passing.u33.status, "Pass");
  assert.equal(passing.u37.status, "Pass");
  assert.equal(passing.u33.evidence.scoreEligible, true);
  assert.equal(passing.u37.evidence.scoreEligible, true);
  // P1-P3 plan C1: lab Core Web Vitals stay observations; t15/t16/t17 are field claims.
  assert.equal(passing.t15.status, "N/A", "lab LCP is an observation, not the field t15 claim");
  assert.match(passing.t15.note, /Lab LCP median/);
  assert.equal(passing.t15.evidence.scoreEligible, false);
  assert.equal(passing.t17.status, "N/A", "lab CLS is an observation, not the field t17 claim");
  assert.match(passing.t17.note, /field Core Web Vitals claim/);
  assert.equal(passing.t17.evidence.scoreEligible, false);
  assert.equal(passing.t16.status, "N/A", "INP cannot be measured without interactions");
  assert.match(passing.t16.note, /no interactions/);
  assert.equal(passing.t16.evidence.scoreEligible, false);
  const formInventory = await measureFixture(passingFixture.replace('</main>', '<input form="signup" aria-label="Reference" required autocomplete="off"><input type="hidden" form="signup"><input form="missing" aria-label="Unowned"></main>'));
  for(const [id,status] of [['c17','Pass'],['c19','Partial']] as const){
    assert.equal(formInventory[id].status,status);
    assert.equal(formInventory[id].evidence.scoreEligible,true);
    assert.equal(formInventory[id].evidence.pageResults?.[0].url,'https://fixture.example/');
    assert.match(formInventory[id].evidence.pageResults![0].value!,/Form 1: 2 fields; 1 required declarations; 2 autocomplete declarations/);
  }
  const failing = await measureFixture(failingFixture);
  assert.equal(failing.t46.status, "Fail", "fixed-width content should fail mobile overflow");
  assert.equal(failing.u35.status, "Fail", "tabindex=-1 custom control should reduce keyboard coverage");
  assert.equal(failing.u36.status, "Fail", "suppressed focus styling should fail focus visibility");
  assert.equal(failing.c1.status, "Fail", "dominant CTA below every fold should fail");
  assert.equal(failing.c7.evidence.scoreEligible, false, "duplicate viewport CTA criterion must remain diagnostic");
  assert.notEqual(failing.u33.status, "Pass", "low contrast must be detected");
  assert.notEqual(failing.u37.status, "Pass", "unnamed button must be detected");
  assert.ok(failing.u37.evidence.elements?.length, 'failing elements must retain selectors');
  assert.ok(failing.u37.evidence.elements!.some(row => row.viewports.length === 5), 'same element across five viewports must be grouped');
  assert.ok(failing.u37.evidence.elements!.length < Number(failing.u37.evidence.observed?.failed), 'viewport repetitions must not inflate distinct element count');
  assert.equal(failing.u37.evidence.pageResults?.length, 1, 'page attribution must survive viewport aggregation');
  for (const id of ["c1", "c17", "c19", "u35", "u36", "u39", "t46", "t47"]) assert.equal(passing[id].evidence.scoreEligible, true, id);
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext({ serviceWorkers: 'block' });
    const network = await configureAuditBrowser(context, async address => ({ status: 200, headers: { 'content-type': address.endsWith('.css') ? 'text/css' : address.endsWith('.js') ? 'application/javascript' : 'text/html' }, body: Buffer.from(address.endsWith('.css') ? 'body{color:rgb(10, 20, 30)}' : address.endsWith('.js') ? 'document.body.dataset.loaded="yes"' : '<link rel="stylesheet" href="/test.css"><body>Fixture<script src="/test.js"></script>') }));
    const page = await context.newPage();
    await page.goto('https://fixture.example/', { waitUntil: 'load' });
    assert.equal(await page.evaluate(() => getComputedStyle(document.body).color), 'rgb(10, 20, 30)');
    assert.equal(await page.evaluate(() => document.body.dataset.loaded), 'yes');
    assert.equal(network.incomplete, false);
    await page.evaluate(async () => { await fetch('/write', { method: 'POST' }).catch(() => {}); });
    assert.equal(network.incomplete, false, 'intentionally blocked write requests must not invalidate read-only page evidence');
    assert.equal(network.blockingIssuesForPage(page).length, 0);
    assert.equal(network.issuesForPage(page)[0].reason, 'read-only-block');
    assert.equal(network.issuesForPage(page)[0].url, 'https://fixture.example/write');
    await context.close();
    const isolated = await browser.newContext({ serviceWorkers: 'block' });
    const budget = await configureAuditBrowser(isolated, async address => ({status: address.includes('/missing') ? 404 : 200, headers: {'content-type':'text/html'}, body:Buffer.from('<body>Fixture</body>')}));
    for (const name of ['first', 'second']) {
      const tab = await isolated.newPage();
      await tab.goto('https://fixture.example/' + name);
      await tab.evaluate(async () => { for(let i=0;i<100;i++) await fetch('/asset/' + i); });
      assert.equal(budget.issuesForPage(tab).length, 0, 'previous pages must not consume this page resource budget');
      if (name === 'second') {
        await tab.evaluate(async () => { await fetch('/missing?token=private'); });
        assert.equal(budget.issuesForPage(tab)[0].status, 404);
        assert.equal(budget.issuesForPage(tab)[0].url, 'https://fixture.example/missing', 'query secrets must not enter evidence');
        await tab.evaluate(async () => { for(let i=0;i<65;i++) await fetch('/extra/' + i).catch(()=>{}); });
        assert.ok(budget.issuesForPage(tab).some(issue=>issue.reason==='page-budget'), 'individual page limit must remain enforced');
      }
      await tab.close();
    }
    await isolated.close();
  } finally { await browser.close(); }
  console.log("Rendered measurement contract tests passed.");
}

void main();
