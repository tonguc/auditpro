import type { BrowserContext, Page } from 'playwright';
import type { Dispatcher } from 'undici';
import { assertRedirectTarget, isAllowedWebAddress, resolvePublicUrl, pinnedPublicUrlDispatcher } from './public-url';

type Resource = { status: number; headers: Record<string, string>; body: Buffer };
export type BrowserResourceIssue = { url: string; resourceType: string; reason: string; status?: number; viewport?: string; blocking?: boolean };
// Resource classes whose failure makes a rendered measurement untrustworthy.
// Images and media are intentionally excluded: their absence cannot falsify
// contrast, accessible-name, keyboard or form measurements.
const RENDER_CRITICAL = ['document', 'stylesheet', 'script', 'font', 'iframe', 'xhr', 'fetch'];
function safeAddress(address: string) {
  try { const url = new URL(address); return url.origin + url.pathname; } catch { return 'Unavailable URL'; }
}
export async function loadPublicBrowserResource(address: string): Promise<Resource> {
  const url = new URL(address);
  if (!isAllowedWebAddress(url)) throw new Error('Unsupported address');
  const dispatcher = pinnedPublicUrlDispatcher(await resolvePublicUrl(url));
  try {
    const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'Povlex/1.0 rendered website audit' }, dispatcher } as RequestInit & { dispatcher: Dispatcher });
    const reader = response.body?.getReader();
    const chunks: Uint8Array[] = []; let size = 0;
    if (reader) try {
      while (true) {
        const part = await reader.read(); if (part.done) break;
        size += part.value.byteLength;
        if (size > 2500000) { await reader.cancel(); throw new Error('Resource limit'); }
        chunks.push(part.value);
      }
    } finally { reader.releaseLock(); }
    const headers = Object.fromEntries(response.headers);
    for (const name of ['content-encoding', 'content-length', 'transfer-encoding', 'set-cookie']) delete headers[name];
    if (headers.location) {
      const target = new URL(headers.location, url);
      assertRedirectTarget(target);
      await resolvePublicUrl(target);
    }
    return { status: response.status, headers, body: Buffer.concat(chunks) };
  } finally { await dispatcher.close(); }
}

export async function configureAuditBrowser(context: BrowserContext, load = loadPublicBrowserResource) {
  const state = { incomplete: false, unattributedFailure: false, requests: 0, bytes: 0 };
  const pages = new WeakMap<Page, { requests: number; bytes: number; issues: BrowserResourceIssue[] }>();
  function pageState(page: Page) {
    let entry = pages.get(page);
    if (!entry) { entry = { requests: 0, bytes: 0, issues: [] }; pages.set(page, entry); }
    return entry;
  }
  // tsx/esbuild can retain function-name helpers inside Playwright callbacks.
  await context.addInitScript('globalThis.__name = (target) => target;');
  await context.routeWebSocket(/.*/, async route => { state.incomplete = true; state.unattributedFailure = true; await route.close(); });
  await context.route('**/*', async route => {
    const request = route.request();
    const entry = pageState(request.frame().page());
    function issue(reason: string, status?: number, blocking = true) {
      if (blocking) state.incomplete = true;
      if (entry.issues.length < 160) entry.issues.push({ url: safeAddress(request.url()), resourceType: request.resourceType(), reason, status, blocking });
    }
    try {
      if (route.request().method() !== 'GET') {
        issue('read-only-block', undefined, false);
        await route.abort('blockedbyclient');
        return;
      }
      state.requests++;
      if (++entry.requests > 160 || entry.bytes > 30000000) throw new Error('Page resource budget');
      const resource = await load(route.request().url());
      state.bytes += resource.body.byteLength;
      entry.bytes += resource.body.byteLength;
      if (entry.bytes > 30000000) throw new Error('Page resource budget');
      if (resource.status >= 400) issue('http-error', resource.status, RENDER_CRITICAL.includes(request.resourceType()));
      await route.fulfill(resource);
    } catch (error) {
      const message = error instanceof Error ? error.message : '';
      // Only render-critical failures (documents, styles, scripts, fonts, xhr)
      // make a render unmeasurable. An oversized media file or image is
      // recorded but cannot invalidate contrast, accessible-name, keyboard or
      // form measurements (2026-09-23 real-site finding: a 3 MB media cap
      // demoted every browser control on a healthy site).
      issue(message === 'Read-only browser' ? 'read-only-block' : message === 'Page resource budget' ? 'page-budget' : message === 'Resource limit' ? 'resource-size' : 'unavailable-or-blocked', undefined, RENDER_CRITICAL.includes(request.resourceType()));
      await route.abort('blockedbyclient');
    }
  });
  return Object.assign(state, {
    issuesForPage: (page: Page) => pageState(page).issues,
    blockingIssuesForPage: (page: Page) => pageState(page).issues.filter((issue) => issue.blocking !== false),
  });
}
