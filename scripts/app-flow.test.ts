import assert from "node:assert/strict";
import './finding-summary.test';
import './evidence-review.test';
import './review-actions.test';
import './crawl-scope-summary.test';
import './page-evidence-summary.test';
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer } from "node:net";
import { dirname, join } from "node:path";
import { chromium, type Browser, type Download, type Locator, type Page } from "playwright";

let port = process.env.APP_FLOW_PORT || "";
const externalBaseUrl = process.env.APP_FLOW_BASE_URL;
const requirePdfRender = process.env.AUDITPRO_REQUIRE_PDF_RENDER === "true";
let baseUrl = externalBaseUrl || "";
const nextBin = join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
let server: ChildProcess | undefined;
let logs = "";

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function findFreePort() {
  return await new Promise<string>((resolve, reject) => {
    const probe = createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const address = probe.address();
      probe.close(() => {
        if (!address || typeof address === "string") reject(new Error("Unable to allocate an app-flow port."));
        else resolve(String(address.port));
      });
    });
  });
}

async function responseFromExistingServer() {
  try {
    const response = await fetch(baseUrl);
    return response.ok ? response : null;
  } catch {
    return null;
  }
}

function startServer() {
  if (!existsSync(nextBin)) throw new Error("Next.js binary not found. Run npm install first.");
  baseUrl = `http://localhost:${port}`;
  server = spawn(process.execPath, [nextBin, "start", "-p", port], {
    cwd: process.cwd(),
    env: { ...process.env, PORT: port },
    stdio: ["ignore", "pipe", "pipe"],
  });
  server.stdout?.on("data", (chunk) => {
    logs += chunk.toString();
  });
  server.stderr?.on("data", (chunk) => {
    logs += chunk.toString();
  });
}

async function stopServer() {
  if (!server || server.exitCode !== null) return;
  await new Promise<void>((resolve) => {
    const timeout = setTimeout(resolve, 5_000);
    server?.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
    server?.kill();
  });
}

async function waitForServer() {
  const deadline = Date.now() + 45_000;
  let lastError: unknown;
  while (Date.now() < deadline) {
    if (server?.exitCode !== null && server?.exitCode !== undefined) {
      throw new Error(`Owned production server exited before readiness with code ${server.exitCode}.\n${logs}`);
    }
    try {
      const response = await fetch(baseUrl);
      if (response.ok) return;
    } catch (error) {
      lastError = error;
    }
    await delay(500);
  }
  const message = lastError instanceof Error ? lastError.message : "unknown";
  throw new Error(`Server did not become ready. Last error: ${message}\n${logs}`);
}

async function clickByRole(page: Page, name: string | RegExp) {
  await page.getByRole("button", { name }).first().click();
}

async function downloadFromClick(page: Page, action: () => Promise<unknown>) {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    action(),
  ]);
  return download;
}

async function openMoreActions(page: Page) {
  const details = page.locator("details.more-actions");
  if (await details.getAttribute("open") === null) {
    await details.locator("summary").click();
  }
}

async function main() {
  let browser: Browser | undefined;
  try {
    if (externalBaseUrl) {
      if (!await responseFromExistingServer()) throw new Error(`APP_FLOW_BASE_URL is not reachable: ${baseUrl}`);
    } else {
      if (!port) port = await findFreePort();
      startServer();
      await waitForServer();
    }

    browser = await chromium.launch({ headless: true });
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(error.message));

    await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: /Load demo/i }).waitFor({ state: "visible", timeout: 15_000 });
    await clickByRole(page, /Load demo/i);
    await assertVisibleText(page, "Example Client");
    await page.evaluate(() => {
      const audits = JSON.parse(localStorage.getItem("auditpro_audits") || "[]");
      const audit = audits.find((entry: { id: string }) => entry.id === "demo");
      audit.scan = { ...(audit.scan || {}), checked: audit.scan?.checked ?? 0, diagnosticCount: audit.scan?.diagnosticCount ?? 0, finalUrl: audit.scan?.finalUrl ?? "https://example.com/", fetchedAt: audit.scan?.fetchedAt ?? new Date(0).toISOString(), warnings: audit.scan?.warnings ?? [] };
      audit.scan.onlineScorecards = {
        version: "1.0.0",
        scope: "Fixture scope",
        seo: { id: "seo", label: "Online SEO score", labelTr: "Online SEO puanı", score: 72, coveragePct: 100, measuredChecks: 1, totalChecks: 1, status: "Measured", checks: [{ id: "seo-fixture", label: "Fixture check", labelTr: "Test kontrolü", action: "Fix the fixture.", actionTr: "Test bulgusunu düzeltin.", evidence: "Fixture evidence", status: "Fail", weight: 100, affectedUrls: ["https://example.com/"] }] },
        geo: { id: "geo", label: "GEO readiness score", labelTr: "GEO hazırlık puanı", score: 64, coveragePct: 100, measuredChecks: 1, totalChecks: 1, status: "Measured", checks: [{ id: "geo-fixture", label: "Fixture check", labelTr: "Test kontrolü", action: "Fix the fixture.", actionTr: "Test bulgusunu düzeltin.", evidence: "Fixture evidence", status: "Fail", weight: 100, affectedUrls: ["https://example.com/"] }] },
      };
      localStorage.setItem("auditpro_audits", JSON.stringify(audits));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await assertVisibleText(page, "Measured SEO and GEO status");
    await assertVisibleText(page, "72/100");
    await assertVisibleText(page, "64/100");
    await assertVisibleText(page, "Fix the fixture.");
    await assertVisibleText(page, "GEO & AI Visibility");
    await page.evaluate(() => {
      const audits = JSON.parse(localStorage.getItem("auditpro_audits") || "[]");
      const audit = audits.find((entry: { id: string }) => entry.id === "demo");
      sessionStorage.setItem("auditpro_legacy_scorecards", JSON.stringify(audit.scan.onlineScorecards));
      const pillars = {
        technical: { id: "technical", label: "Technical SEO", labelTr: "Teknik SEO", score: 82, coveragePct: 88, measuredChecks: 7, totalChecks: 8, status: "Measured", checks: [{ id: "technical-fixture", label: "Technical SEO fixture", labelTr: "Teknik SEO testi", action: "Fix the fixture with a documented owner.", actionTr: "Test bulgusunu sorumlu atayarak düzeltin.", evidence: "7 of 8 bounded checks measured.", status: "Fail", weight: 10, affectedUrls: ["https://example.com/"] }] },
        content: { id: "content", label: "On-page & content", labelTr: "Sayfa içi ve içerik", score: 71, coveragePct: 88, measuredChecks: 7, totalChecks: 8, status: "Measured", checks: [{ id: "content-fixture", label: "Content fixture", labelTr: "İçerik testi", action: "Fix the fixture with a documented owner.", actionTr: "Test bulgusunu sorumlu atayarak düzeltin.", evidence: "7 of 8 bounded checks measured.", status: "Partial", weight: 10, affectedUrls: ["https://example.com/"] }] },
        ux: { id: "ux", label: "UX & accessibility", labelTr: "UX ve erişilebilirlik", score: 90, coveragePct: 88, measuredChecks: 7, totalChecks: 8, status: "Measured", checks: [{ id: "ux-fixture", label: "UX fixture", labelTr: "UX testi", action: "Fix the fixture with a documented owner.", actionTr: "Test bulgusunu sorumlu atayarak düzeltin.", evidence: "7 of 8 bounded checks measured.", status: "Pass", weight: 10, affectedUrls: ["https://example.com/"] }] },
        cro: { id: "cro", label: "Conversion readiness", labelTr: "Dönüşüm hazırlığı", score: 64, coveragePct: 88, measuredChecks: 7, totalChecks: 8, status: "Measured", checks: [{ id: "cro-fixture", label: "CRO fixture", labelTr: "Dönüşüm testi", action: "Fix the fixture with a documented owner.", actionTr: "Test bulgusunu sorumlu atayarak düzeltin.", evidence: "7 of 8 bounded checks measured.", status: "Fail", weight: 10, affectedUrls: ["https://example.com/"] }] },
        geo: { id: "geo", label: "GEO readiness", labelTr: "GEO hazırlığı", score: 76, coveragePct: 88, measuredChecks: 7, totalChecks: 8, status: "Measured", checks: [{ id: "geo-fixture", label: "GEO fixture", labelTr: "GEO testi", action: "Fix the fixture with a documented owner.", actionTr: "Test bulgusunu sorumlu atayarak düzeltin.", evidence: "7 of 8 bounded checks measured.", status: "Partial", weight: 10, affectedUrls: ["https://example.com/"] }] },
      };
      audit.scan.onlineScorecards = { version: "2.0.0", scope: "Fixture scope", seo: audit.scan.onlineScorecards.seo, geo: pillars.geo, pillars, overall: { score: 78, coveragePct: 88, measuredChecks: 35, totalChecks: 38, errors: 2, warnings: 2, notices: 3 } };
      localStorage.setItem("auditpro_audits", JSON.stringify(audits));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await assertVisibleText(page, "Site Health");
    await assertVisibleText(page, "Overall health score");
    await assertVisibleText(page, "Priority issues");
    assert.equal(await page.locator('.health-ring').count(), 1, 'site health score ring must render');
    assert.equal(await page.locator('.pillar-score-card').count(), 5, 'five scored pillars must render');
    await page.screenshot({ path: join(process.cwd(), 'deployment-artifacts', 'site-health-dashboard.png'), fullPage: true });
    await page.evaluate(() => {
      const audits = JSON.parse(localStorage.getItem("auditpro_audits") || "[]");
      const audit = audits.find((entry: { id: string }) => entry.id === "demo");
      audit.scan.onlineScorecards = JSON.parse(sessionStorage.getItem("auditpro_legacy_scorecards") || "null");
      localStorage.setItem("auditpro_audits", JSON.stringify(audits));
    });
    await page.reload({ waitUntil: "domcontentloaded" });
    await page.locator('.category-nav').getByRole('button', { name: /GEO & AI Visibility/ }).click();
    await assertVisibleText(page, "GEO evidence will appear after AI scan");
    await assertVisibleText(page, "Pending evidence");
    await assertVisibleText(page, "Prompt coverage");
    await assertNoVisibleText(page, /^serp$/i);
    // A stored diagnostic has evidence but deliberately no scored result.
    await page.evaluate(() => {
      const audits = JSON.parse(localStorage.getItem('auditpro_audits') || '[]');
      const audit = audits.find((entry: {id: string}) => entry.id === 'demo');
      delete audit.results.t1;
      audit.notes.t1 = 'Diagnostic only (not scored): ROBOTS_VISIBLE_REGRESSION: sampled policy needs review';
      audit.scan = { ...audit.scan, checked: 1, warnings: [], measurementEvidence: { ...audit.scan?.measurementEvidence, t1: {source: 'crawler', confidence: 'medium', scoreEligible: false, contractVersion: '0.7.0'} } };
      localStorage.setItem('auditpro_audits', JSON.stringify(audits));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await assertVisibleText(page, 'Analysis by category');
    await assertVisibleText(page, 'What the analysis found');
    await page.locator('.priority-work h2').filter({hasText:'Start here'}).waitFor();
    await page.locator('.priority-affected-pages').getByText('Affected URLs were not saved for this finding. Run the analysis again to identify the pages.',{exact:true}).first().waitFor();
    const categoryBox = await page.locator('.category-overview').boundingBox();
    const priorityBox = await page.locator('.priority-work').boundingBox();
    assert.ok(categoryBox && priorityBox && categoryBox.y < priorityBox.y, 'Categories precede priority work');
    assert.equal(await page.locator('.analysis-settings').getAttribute('open'), null, 'Completed audit settings start collapsed');
    assert.equal(await page.locator('.audit-results-grid').count(), 0, 'Overview must not contain the long checklist');
    await page.locator('.priority-work-cards button').first().click();
    await page.locator('.result-detail[open]').waitFor();
    await page.locator('.result-detail').getByRole('heading',{name:'Recommended action',exact:true}).waitFor();
    await page.locator('.result-detail').getByRole('heading',{name:'How to verify',exact:true}).waitFor();
    assert.equal(await page.locator('.finding-distribution').count(),0,'Finding counts must not look like health bars');
    await page.locator('.result-detail').getByText('This finding has no stored page-level evidence.',{exact:false}).waitFor();
    await page.keyboard.press('Escape');
    await page.locator('.priority-work-cards button').first().click();
    await page.locator('.result-detail .result-primary').click();
    await page.locator('.finding-detail[open]').first().waitFor({state:'visible'});
    await page.locator('.category-overview-cards').getByRole('button', {name: /Technical SEO/}).click();
    await page.locator('#finding-t1 .finding-detail summary').click();
    await assertVisibleText(page, 'ROBOTS_VISIBLE_REGRESSION');
    await page.locator('#finding-t1').getByText('Why is this awaiting review?', {exact:true}).waitFor();
    await page.locator('#finding-t1').getByText('This record does not explain why a definitive result is unavailable.', {exact:false}).waitFor();
    await page.getByRole('button',{name:'awaiting review',exact:true}).click();
    assert.equal(await page.locator('.audit-row').count(),1,'Review filter must exclude measured results');
    await page.getByRole('button',{name:'All',exact:true}).click();
    await assertVisibleText(page, 'Observation · review required');
    await page.locator('.filter-bar').getByRole('button', {name: 'Fail', exact: true}).click();
    await assertNoVisibleText(page, /ROBOTS_VISIBLE_REGRESSION/);
    await page.locator('.category-overview-cards').getByRole('button', {name: /Technical SEO/}).click();
    await page.locator('#finding-t1 .finding-detail summary').click();
    await assertVisibleText(page, 'ROBOTS_VISIBLE_REGRESSION');
    await page.locator('.language-control select').selectOption('tr');
    await assertVisibleText(page, 'Tarama ve dizine ekleme');
    await assertVisibleText(page, 'robots.txt alımı ve örnek adres kuralları');
    assert.ok(!(await page.locator('.audit-row-heading').allTextContents()).join(' ').includes('Critical'));
    await page.locator('.category-overview-cards').getByRole('button', {name: /Sayfa İçi/}).click();
    await assertVisibleText(page, 'İncelenen sayfalarda dolu başlık etiketleri');
    await page.locator('.language-control select').selectOption('en');
    await page.locator('.category-overview-cards').getByRole('button', {name: /Technical SEO/}).click();
    await page.evaluate(() => window.scrollTo({top:0,behavior:'instant'}));
    await page.screenshot({path: 'launch-readiness-reports/category-evidence-desktop.png', fullPage: false});
    await page.setViewportSize({width: 390, height: 820});
    await assertNoHorizontalOverflow(page.locator('.category-overview'), 'category evidence must fit mobile');
    await page.setViewportSize({width: 1366, height: 900});
    await injectLongEvidenceNotes(page);
    await page.reload({ waitUntil: "domcontentloaded" });
    await assertVisibleText(page, "Example Client");
    await page.locator('.result-tabs').getByRole('button', {name:'Findings',exact:true}).click();
    await page.locator(".finding-detail summary").first().click();
    await assertVisibleText(page, "Long pagination evidence");
    await clickByRole(page, /Save audit/i);
    await assertVisibleText(page, "Audit saved.");
    await clickByRole(page, /^Action Center$/i);
    await assertHeading(page, "Action Center");
    await assertNoHorizontalOverflow(page.locator(".action-item").first(), "desktop action item must not overflow horizontally");
    await page.setViewportSize({ width: 390, height: 820 });
    await assertNoHorizontalOverflow(page.locator(".action-item").first(), "mobile action item must not overflow horizontally");
    await page.setViewportSize({ width: 1366, height: 900 });
    const screenshotInput = page.locator(".action-fields input[type='file'][aria-label^='Screenshot for']").first();
    assert.equal(await screenshotInput.getAttribute("accept"), "image/png,image/jpeg,image/webp,image/gif");
    const evidenceBytes = Array.from(Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=",
      "base64",
    ));
    await dispatchSyntheticFile(screenshotInput, "auditpro-evidence.png", "image/png", evidenceBytes);
    await assertVisibleText(page, "auditpro-evidence.png");

    await clickByRole(page, /^Report$/i);
    await assertHeading(page, "Audit Report");
    await assertVisibleText(page, "Report readiness");
    await assertVisibleText(page, "GEO publication gate");
    await assertVisibleText(page, "Evidence pending");
    await openMoreActions(page);
    const csvDownload = await downloadFromClick(page, () => page.getByRole("button", { name: /Export CSV/i }).click());
    const csvPath = await assertDownload(csvDownload, /\.csv$/);
    assertCsvLooksValid(csvPath);
    assertFileIncludes(csvPath, ["Screenshot Evidence", "auditpro-evidence.png"]);
    const markdownDownload = await downloadFromClick(page, () => page.getByRole("button", { name: /Export MD/i }).click());
    const markdownPath = await assertDownload(markdownDownload, /\.md$/);
    assertFileIncludes(markdownPath, [
      "# Povlex Report: Example Client",
      "## Report Readiness",
      "Online SEO score: 72/100",
      "GEO readiness score: 64/100",
      "## Online SEO and GEO Actions",
      "## GEO Publication Gate",
      "Status: Evidence pending",
      "### GEO & AI Visibility",
      "Score: Not measured",
      "Screenshot attached: auditpro-evidence.png",
    ]);
    assertFileExcludes(markdownPath, ["### GEO & AI Visibility\nScore: 0/100"]);
    const pdfDownload = await downloadFromClick(page, () => page.getByRole("button", { name: /Download PDF/i }).click());
    const pdfPath = await assertDownload(pdfDownload, /report.*\.pdf$/);
    assertPdfLooksValid(pdfPath, 4);
    assertPdfTextIncludes(pdfPath, ["Executive Summary", "GEO Publication Gate", "Section Scores", "30-60-90 Day Roadmap", "Priority Issues", "Long pagination evidence"]);
    assertPdfFirstPageRenders(pdfPath);

    await clickByRole(page, /^Proposal$/i);
    await assertHeading(page, "Improvement Proposal");
    await assertVisibleText(page, "GEO publication gate");
    await assertVisibleText(page, "Evidence pending");
    await openMoreActions(page);
    const proposalPdf = await downloadFromClick(page, () => page.getByRole("button", { name: /Download PDF/i }).click());
    const proposalPdfPath = await assertDownload(proposalPdf, /proposal.*\.pdf$/);
    assertPdfLooksValid(proposalPdfPath, 2);
    assertPdfTextIncludes(proposalPdfPath, ["30-60-90 Day Roadmap", "Priority Issues"]);
    assertPdfFirstPageRenders(proposalPdfPath);
    await clickByRole(page, /^Presentation$/i);
    await assertHeading(page, "Audit Snapshot");
    await assertVisibleText(page, "GEO publication gate");
    await assertVisibleText(page, "Evidence pending");
    await openMoreActions(page);
    const presentationPdf = await downloadFromClick(page, () => page.getByRole("button", { name: /Download PDF/i }).click());
    const presentationPdfPath = await assertDownload(presentationPdf, /presentation.*\.pdf$/);
    assertPdfLooksValid(presentationPdfPath, 1);
    assertPdfFirstPageRenders(presentationPdfPath);
    await clickByRole(page, /^Settings$/i);
    await assertHeading(page, "White label settings");
    await clickByRole(page, /^QA$/i);
    await assertHeading(page, "QA checklist");
    await assertVisibleText(page, "Load demo creates a sample audit");
    await assertVisibleText(page, "GEO publication gate");
    await assertVisibleText(page, "Evidence pending");
    await assertVisibleText(page, "Prompt-level engine evidence exists");
    await assertVisibleText(page, "Publication threshold reached");
    await assertVisibleText(page, "Screenshot evidence can be attached per finding");
    await assertVisibleText(page, "Open");
    await assertVisibleText(page, "Run AI scan after website analysis");

    await openMoreActions(page);
    await clickByRole(page, /Duplicate/i);
    await assertVisibleText(page, "Example Client copy");
    await page.getByRole("button", { name: /Delete audit/i }).first().click();
    await page.getByRole("heading", { name: "Example Client copy" }).waitFor({ state: "detached", timeout: 10_000 });

    const backupDownload = await downloadFromClick(page, () => page.getByRole("button", { name: /^Export$/i }).click());
    const backupPath = await assertDownload(backupDownload, /\.json$/);
    assertFileIncludes(backupPath, [
      '"version": "2.0-next"',
      '"clientName": "Example Client"',
      '"screenshotName": "auditpro-evidence.png"',
      '"screenshot": "data:image/png;base64,',
    ]);
    page.once("dialog", (dialog) => void dialog.accept());
    await clickByRole(page, /Clear all/i);
    await assertVisibleText(page, "No saved audits yet.");
    await page.locator("input[type='file'][accept='application/json,.json']").setInputFiles(backupPath);
    await assertVisibleText(page, "Backup imported.");
    await assertVisibleText(page, "Example Client");

    await page.evaluate(() => {
      const audits=JSON.parse(localStorage.getItem('auditpro_audits')||'[]');
      const audit=audits.find((entry:{id:string})=>entry.id==='demo');
      delete audit.results.t33;
      audit.notes.t33='Response header declarations only';
      audit.scan={...audit.scan,measurementEvidence:{...audit.scan?.measurementEvidence,t33:{source:'crawler',confidence:'high',scoreEligible:false,contractVersion:'0.7.0',pageResults:[{url:'https://example.com/header-evidence',status:'N/A',headerDeclarations:[{name:'content-security-policy',value:null},{name:'x-frame-options',value:''},{name:'content-security-policy-report-only',value:"default-src 'none'"}]}]}}};
      audit.scan.measurementEvidence.t33.reasonCode='method-not-calibrated';
      audit.scan.measurementEvidence.t33.scope={tested:1,discovered:2,complete:false};
      audit.scan.measurementEvidence.t33.pageResults[0].measurementState='incomplete-coverage';
      delete audit.results.t14;
      audit.notes.t14='URL declarations only';
      audit.scan.measurementEvidence.t14={source:'crawler',confidence:'low',scoreEligible:false,contractVersion:'0.7.0',pageResults:[{url:'https://example.com/products?page=2',status:'N/A',value:'page parameter observed',measurementState:'incomplete-coverage'}]};
      localStorage.setItem('auditpro_audits',JSON.stringify(audits));
    });
    await page.reload({waitUntil:'domcontentloaded'});
    await page.locator('.category-overview-cards').getByRole('button',{name:/Technical SEO/}).click();
    await page.locator('#finding-t33 > .finding-detail > summary').click();
    await page.locator('#finding-t14 > .finding-detail > summary').click();
    const uncertainPages=page.locator('#finding-t14 .page-evidence-results');
    await uncertainPages.getByText('Pages without a complete pass/fail determination',{exact:false}).waitFor();
    await uncertainPages.getByRole('link',{name:'https://example.com/products?page=2',exact:true}).waitFor();
    assert.equal(await uncertainPages.getByText('No failed or partial page checks in this record.',{exact:true}).count(),0);
    const headerEvidence=page.locator('#finding-t33 .page-evidence-results');
    await headerEvidence.getByText('Response headers by page',{exact:true}).waitFor();
    await headerEvidence.getByText('Not present in this response',{exact:true}).waitFor();
    await headerEvidence.getByText('Present with an empty value',{exact:true}).waitFor();
    await headerEvidence.getByText("default-src 'none'",{exact:true}).waitFor();
    await headerEvidence.getByText('https://example.com/header-evidence',{exact:true}).waitFor();
    const reasons=page.locator('#finding-t33 .legacy-evidence li');
    assert.equal(await reasons.count(),2);
    await reasons.filter({hasText:'The recorded sample or checks are incomplete.'}).waitFor();
    await reasons.filter({hasText:"method has not yet been calibrated"}).waitFor();
    await page.locator('.language-control select').selectOption('tr');
    await headerEvidence.getByText('Sayfa bazında yanıt başlıkları',{exact:true}).waitFor();
    await headerEvidence.getByText('Bu yanıtta bulunamadı',{exact:true}).waitFor();
    await headerEvidence.getByText('Başlık mevcut, değeri boş',{exact:true}).waitFor();
    await uncertainPages.getByText('Kesin başarı/başarısızlık kararı bulunmayan sayfalar',{exact:false}).waitFor();
    assert.equal(await reasons.count(),2);
    await reasons.filter({hasText:'Kaydedilen örneklem veya kontroller eksik.'}).waitFor();
    await reasons.filter({hasText:'ölçüm yöntemi güvenilir başarı/başarısızlık kararı için henüz doğrulanmadı'}).waitFor();
    await page.setViewportSize({width:390,height:844});
    await assertNoHorizontalOverflow(headerEvidence,'Header evidence must fit mobile width');
    await page.getByRole('button',{name:'Genel bakış',exact:true}).click();
    const coverageCards=page.locator('.review-actions article').filter({has:page.getByRole('heading',{name:'Eksik sayfa ölçümlerini tamamlayın',exact:true})});
    assert.equal(await coverageCards.count(),2);
    const coverageCard=coverageCards.filter({hasText:'https://example.com/header-evidence'});
    await coverageCard.getByText('https://example.com/header-evidence',{exact:true}).waitFor();
    await assertNoHorizontalOverflow(coverageCard,'Coverage follow-up must fit mobile width');
    await coverageCard.getByRole('button').click();
    await page.locator('.result-detail[open]').getByText('https://example.com/header-evidence',{exact:true}).waitFor();
    await page.keyboard.press('Escape');
    await coverageCards.filter({hasText:'https://example.com/products?page=2'}).getByRole('button').click();
    await page.locator('.result-detail[open]').getByRole('link',{name:'https://example.com/products?page=2',exact:true}).waitFor();
    await page.keyboard.press('Escape');
    await page.setViewportSize({width:1440,height:1000});
    await page.locator('.language-control select').selectOption('en');
    assert.equal(await page.locator('.review-actions').getByRole('heading',{name:'Complete missing page measurements',exact:true}).count(),2);
    assert.deepEqual(pageErrors, [], "client-side page errors must not occur during app flow");
    assert.deepEqual(
      consoleErrors.filter((message) => !/favicon/i.test(message)),
      [],
      "console errors must not occur during app flow",
    );
  } finally {
    await browser?.close();
    await stopServer();
  }

  console.log(`App browser flow passed: ${baseUrl}`);
}

async function assertVisibleText(page: Page, text: string) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "visible", timeout: 10_000 });
}

async function assertNoVisibleText(page: Page, text: string | RegExp) {
  await expectHidden(page.getByText(text, { exact: typeof text === "string" }));
}

async function expectHidden(locator: Locator) {
  await locator.first().waitFor({ state: "hidden", timeout: 2_000 }).catch(async () => {
    assert.equal(await locator.first().isVisible(), false, "technical category ids must not be visible in the UI");
  });
}

async function assertNoHorizontalOverflow(locator: Locator, message: string) {
  await locator.waitFor({ state: "visible", timeout: 10_000 });
  const hasOverflow = await locator.evaluate((element) => element.scrollWidth > element.clientWidth + 1);
  assert.equal(hasOverflow, false, message);
}

async function injectLongEvidenceNotes(page: Page) {
  await page.evaluate(() => {
    const raw = localStorage.getItem("auditpro_audits");
    if (!raw) throw new Error("Demo audit storage missing.");
    const audits = JSON.parse(raw) as Array<{ id: string; results?: Record<string, string>; notes?: Record<string, string> }>;
    const demo = audits.find((audit) => audit.id === "demo");
    if (!demo?.results) throw new Error("Demo audit missing results.");
    const longEvidence = `Long pagination evidence. ${"This note validates multi-page PDF table row wrapping without losing client evidence. ".repeat(70)}`;
    demo.notes = Object.fromEntries(Object.keys(demo.results).map((id) => [id, longEvidence]));
    localStorage.setItem("auditpro_audits", JSON.stringify(audits));
  });
}

async function dispatchSyntheticFile(locator: Locator, name: string, type: string, bytes: number[]) {
  await locator.evaluate((element, fileData) => {
    const input = element as HTMLInputElement;
    const file = new File([new Uint8Array(fileData.bytes)], fileData.name, { type: fileData.type });
    const transfer = new DataTransfer();
    transfer.items.add(file);
    input.files = transfer.files;
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }, { name, type, bytes });
}

async function assertDownload(download: Download, filenamePattern: RegExp) {
  assert.match(download.suggestedFilename(), filenamePattern);
  const path = await download.path();
  assert.ok(path, `download path must exist for ${download.suggestedFilename()}`);
  return path;
}

function assertFileIncludes(path: string, needles: string[]) {
  const content = readFileSync(path, "utf8");
  for (const needle of needles) {
    assert.ok(content.includes(needle), `${path} must include ${needle}`);
  }
}

function assertFileExcludes(path: string, needles: string[]) {
  const content = readFileSync(path, "utf8");
  for (const needle of needles) {
    assert.ok(!content.includes(needle), `${path} must not include ${needle}`);
  }
}

function assertCsvLooksValid(path: string) {
  const content = readFileSync(path, "utf8");
  assertFileIncludes(path, ["Category", "Recommended Action", "Implementation Status", "Screenshot Evidence"]);
  assert.ok(content.split(/\r?\n/).length > 1, "CSV export must include at least one finding row");
  assert.match(content, /"(Critical|High|Medium|Low)"/);
  assert.match(content, /"(Fail|Partial)"/);
}

function assertPdfLooksValid(path: string, minimumPages: number) {
  const content = readFileSync(path);
  assert.equal(content.subarray(0, 4).toString("ascii"), "%PDF");
  assert.ok(statSync(path).size > 1_000, "PDF export must not be empty");
  const body = content.toString("latin1");
  const pages = body.match(/\/Type\s*\/Page\b/g)?.length ?? 0;
  assert.ok(pages >= minimumPages, `PDF export must include at least ${minimumPages} page(s)`);
  assert.doesNotMatch(body, /undefined|NaN/);
}

function assertPdfTextIncludes(path: string, needles: string[]) {
  const body = readFileSync(path).toString("latin1");
  for (const needle of needles) {
    const escaped = needle.replace(/[()\\]/g, "\\$&");
    assert.match(body, new RegExp(escaped), `PDF export must include ${needle}`);
  }
}

function assertPdfFirstPageRenders(path: string) {
  const probe = spawnSync("pdftoppm", ["-v"], { encoding: "utf8" });
  if (probe.error || probe.status !== 0) {
    if (requirePdfRender) {
      throw new Error("PDF render verification requires pdftoppm. Install Poppler or set AUDITPRO_REQUIRE_PDF_RENDER=false for local-only runs.");
    }
    console.log("PDF render verification skipped: pdftoppm is not available.");
    return;
  }
  const outputPrefix = join(dirname(path), `render-${Date.now()}`);
  const render = spawnSync("pdftoppm", ["-r", "72", "-f", "1", "-singlefile", path, outputPrefix], { encoding: "utf8" });
  assert.equal(render.status, 0, `pdftoppm must render first PDF page.\n${render.stderr}`);
  const ppmPath = `${outputPrefix}.ppm`;
  assert.ok(existsSync(ppmPath), "pdftoppm must create a first-page PPM file");
  const ppm = readFileSync(ppmPath);
  assertPpmLooksNonBlank(ppm, ppmPath);
}

function assertPpmLooksNonBlank(ppm: Buffer, path: string) {
  assert.equal(ppm.subarray(0, 2).toString("ascii"), "P6", `${path} must be a binary PPM image`);
  let cursor = 2;
  const tokens: string[] = [];
  while (tokens.length < 3 && cursor < ppm.length) {
    while (/\s/.test(String.fromCharCode(ppm[cursor]))) cursor += 1;
    if (ppm[cursor] === 35) {
      while (cursor < ppm.length && ppm[cursor] !== 10) cursor += 1;
      continue;
    }
    let token = "";
    while (cursor < ppm.length && !/\s/.test(String.fromCharCode(ppm[cursor]))) {
      token += String.fromCharCode(ppm[cursor]);
      cursor += 1;
    }
    tokens.push(token);
  }
  while (cursor < ppm.length && /\s/.test(String.fromCharCode(ppm[cursor]))) cursor += 1;
  const [width, height, maxValue] = tokens.map(Number);
  assert.ok(width >= 300 && height >= 400 && maxValue === 255, `${path} must have a valid rendered page size`);
  const pixels = ppm.subarray(cursor);
  assert.ok(pixels.length >= width * height * 3, `${path} must include RGB pixel data`);
  let darkSamples = 0;
  const stride = Math.max(3, Math.floor(pixels.length / 5_000 / 3) * 3);
  for (let index = 0; index < pixels.length - 2; index += stride) {
    const brightness = pixels[index] + pixels[index + 1] + pixels[index + 2];
    if (brightness < 735) darkSamples += 1;
  }
  assert.ok(darkSamples > 20, `${path} must not render as a blank white page`);
}

async function assertHeading(page: Page, name: string) {
  await page.getByRole("heading", { name }).first().waitFor({ state: "visible", timeout: 10_000 });
}

void main();
