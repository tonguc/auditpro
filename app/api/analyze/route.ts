import { robotsPageEvidence } from '@/lib/robots-evidence';
import {measureLanguages} from '@/lib/language-evidence';
import {inspectContent,attachLinkChecks} from '@/lib/content-evidence';
import { discoverSitemapPages } from '@/lib/sitemap-discovery';
import { documentMetadata } from '@/lib/document-metadata';
import { navigationHints } from '@/lib/navigation-hints';
import { probeHttpsRedirect } from '@/lib/https-redirect-evidence';
import { repeatCrawlTimings, repeatedTimingText } from '@/lib/repeated-crawl-timing';
import { CRAWL_TIMING_LIMITS } from '@/lib/crawl-timing';
import { measureHttpStatuses } from '@/lib/http-status-measurement';
import type { CrawlOutcome } from '@/lib/crawl-outcomes';
import { canonicalEvidence, indexingEvidence, structuredDataEvidence } from '@/lib/seo-evidence';
import { inspectCanonicalTargets } from '@/lib/canonical-targets';
import { sitemapEvidence, declaredSitemaps } from '@/lib/seo-evidence';
import { mergeSitewideFindings, type CrawledPage } from '@/lib/site-measurements';
import { analyzeHtml, getAttr, stripTags, metaContent, setFinding, type Finding, type AuditStatus } from '@/lib/html-measurements';
import { internalAnalysisToken } from "@/lib/internal-analysis";
import { MEASUREMENT_CONTRACT_VERSION, type MeasurementEvidence } from "@/lib/measurement-contract";
import { errorName, logOperation, operationResponse, requestIdFromHeaders, stableLogHash } from "@/lib/operation-log";
import { assertPublicUrl, assertRedirectTarget, normalizePublicUrl, pinnedPublicUrlDispatcher, resolvePublicUrl } from "@/lib/public-url";
import { externalLinkCheckBudget, externalLinkChecksEnabled, verifyExternalLinks } from "@/lib/external-link-checks";
import { externalLinkEvidence } from "@/lib/external-link-evidence";
import { fetchFieldCwv, fieldCwvApiKey, fieldCwvThresholdStatus, FIELD_CWV_SOURCE } from "@/lib/field-cwv";
import { decodeBody } from "@/lib/body-decode";
import { measureRenderedPages } from "@/lib/browser-measurements";
import { enforceAnalysisRateLimit } from "@/lib/analysis-rate-limit";
import type { Dispatcher } from "undici";
import { inferSiteTypeProfile, isControlApplicable, summarizeSiteTypeAssessment } from "@/lib/site-type-policy";
import { buildOnlineScorecards } from "@/lib/online-score";

export const runtime = "nodejs";

const noStoreHeaders = { "Cache-Control": "no-store" };

type AnalyzeRequestBody = {
  url?: unknown;
  pageLimit?: unknown;
};

const MAX_HTML_BYTES = 2_500_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_REDIRECTS = 4;
const DEFAULT_MAX_PAGES = 25;
const MAX_RUNTIME_PAGES = 250;
const CRAWL_CONCURRENCY = 5;
const MAX_CHILD_SITEMAPS = 3;
const MAX_LINK_TARGETS = 100;
type PublicFetchResult = {
  response: Response;
  finalUrl: URL;
  durationMs: number;
  redirects: number;
  redirectTrace: import('@/lib/canonical-targets').RedirectHop[];
  close: () => Promise<void>;
};

async function fetchPublic(startUrl: URL, totalTimeoutMs?: number): Promise<PublicFetchResult> {
  let current = startUrl;
  const deadline=totalTimeoutMs ? Date.now()+totalTimeoutMs : undefined;
  const redirectTrace: import('@/lib/canonical-targets').RedirectHop[] = [];
  for (let redirect = 0; redirect <= MAX_REDIRECTS; redirect += 1) {
    const resolution = await resolvePublicUrl(current);
    const dispatcher = pinnedPublicUrlDispatcher(resolution);
    const startedAt = performance.now();
    try {
      const remaining=deadline===undefined?FETCH_TIMEOUT_MS:deadline-Date.now();
      if(remaining<=0)throw new Error('Public request deadline exceeded.');
      const response = await fetch(current, {
        redirect: "manual",
        signal: AbortSignal.timeout(Math.min(FETCH_TIMEOUT_MS,remaining)),
        headers: {
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8",
          "User-Agent": "Povlex/1.0 website audit",
        },
        cache: "no-store",
        dispatcher,
      } as RequestInit & { dispatcher: Dispatcher });
      const durationMs = performance.now() - startedAt;
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location");
        await response.body?.cancel();
        await dispatcher.close();
        if (!location) throw new Error(`Website returned redirect ${response.status} without a destination.`);
        const target = new URL(location, current);
        // Every hop must satisfy the same address policy as the start URL:
        // protocol, credentials and the standard-port allowlist (A2, P1 plan).
        assertRedirectTarget(target);
        redirectTrace.push({url:current.href,status:response.status,target:target.href});
        current = target;
        continue;
      }
      return { response, finalUrl: current, durationMs, redirects: redirect, redirectTrace, close: () => dispatcher.close() };
    } catch (error) {
      await dispatcher.close().catch(() => undefined);
      throw error;
    }
  }
  throw new Error("Website has too many redirects.");
}

async function parseAnalyzeRequestBody(request: Request) {
  try {
    const body = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { ok: false as const, error: "Request body must be a JSON object." };
    }
    return { ok: true as const, body: body as AnalyzeRequestBody };
  } catch {
    return { ok: false as const, error: "Request body must be valid JSON." };
  }
}

function extractInternalUrls(html: string, baseUrl: URL) {
  const urls: URL[] = [];
  const seen = new Set<string>();
  for (const tag of html.match(/<a\b[^>]*>/gi) ?? []) {
    const href = getAttr(tag, "href");
    if (!href || /^(?:#|mailto:|tel:|javascript:|data:)/i.test(href)) continue;
    try {
      const candidate = new URL(href, baseUrl);
      candidate.hash = "";
      if (candidate.origin !== baseUrl.origin || !['http:', 'https:'].includes(candidate.protocol)) continue;
      if (/\.(?:jpg|jpeg|png|gif|webp|avif|svg|pdf|zip|xml|json|css|js|woff2?|ttf|mp4|mp3)$/i.test(candidate.pathname)) continue;
      const key = `${candidate.origin}${candidate.pathname.replace(/\/$/, "") || "/"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      candidate.search = "";
      urls.push(candidate);
    } catch {
      // Ignore malformed links discovered in third-party HTML.
    }
  }
  return urls;
}

function extractSitemapUrls(xml: string, origin: string) {
  return sitemapEvidence(xml).urls.flatMap(value => { const url = new URL(value); return url.origin === origin ? [url] : []; });
}

async function mapWithConcurrency<T, R>(items: T[], concurrency: number, mapper: (item: T) => Promise<R>) {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index]);
    }
  }

  const workerCount = Math.min(concurrency, items.length);
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

async function getSitemapPageUrls(sitemap: Awaited<ReturnType<typeof checkResource>>, finalUrl: URL) {
  if (!sitemap.ok) return [];
  const directUrls = extractSitemapUrls(sitemap.text, finalUrl.origin);
  if (!sitemapEvidence(sitemap.text).index) return directUrls;

  const childSitemaps = directUrls
    .slice(0, MAX_CHILD_SITEMAPS);
  const childResults = await mapWithConcurrency(childSitemaps, MAX_CHILD_SITEMAPS, (url) => checkResource(finalUrl, url.href));
  return childResults.flatMap((child) => child.ok ? extractSitemapUrls(child.text, finalUrl.origin) : []);
}

async function crawlSitePages(homeHtml: string, finalUrl: URL, sitemapUrls: URL[], pageLimit: number, outcomes: CrawlOutcome[]) {
  const queue = [...extractInternalUrls(homeHtml, finalUrl), ...sitemapUrls]
    .filter((candidate) => candidate.pathname !== finalUrl.pathname)
    .sort((a, b) => pagePriority(a) - pagePriority(b));
  const queuedPaths = new Set(queue.map((url) => url.pathname.replace(/\/$/, "") || "/"));
  const crawledPaths = new Set<string>();
  const pages: CrawledPage[] = [];

  while (queue.length > 0 && pages.length < pageLimit - 1) {
    const batch: URL[] = [];
    while (queue.length > 0 && batch.length < CRAWL_CONCURRENCY && pages.length + batch.length < pageLimit - 1) {
      const candidate = queue.shift();
      if (!candidate) break;
      const path = candidate.pathname.replace(/\/$/, "") || "/";
      if (crawledPaths.has(path)) continue;
      crawledPaths.add(path);
      batch.push(candidate);
    }
    if (!batch.length) break;

    const crawledBatch = (await mapWithConcurrency(batch, CRAWL_CONCURRENCY, url => crawlHtmlPage(url, outcomes)))
      .filter((page): page is CrawledPage => Boolean(page));
    pages.push(...crawledBatch);

    for (const page of crawledBatch) {
      for (const discovered of extractInternalUrls(page.html, page.url).sort((a, b) => pagePriority(a) - pagePriority(b))) {
        const path = discovered.pathname.replace(/\/$/, "") || "/";
        if (crawledPaths.has(path) || queuedPaths.has(path) || path === finalUrl.pathname) continue;
        queuedPaths.add(path);
        queue.push(discovered);
      }
    }
  }

  for (const url of queue) {
    if (!outcomes.some(row => row.url === url.href)) outcomes.push({url: url.href, outcome: 'limit'});
  }
  return pages.slice(0, pageLimit - 1);
}

function pagePriority(url: URL) {
  const path = url.pathname.toLowerCase();
  const groups = [
    /\/(?:pricing|fiyat|plans?|paket)/,
    /\/(?:services?|hizmet|solutions?|cozum)/,
    /\/(?:products?|urun|shop|magaza)/,
    /\/(?:about|hakkimizda|hakkımızda|company|kurumsal)/,
    /\/(?:contact|iletisim|iletişim)/,
    /\/(?:blog|articles?|resources?|icerik|içerik)/,
    /\/(?:faq|sss|help|yardim)/,
  ];
  const groupIndex = groups.findIndex((pattern) => pattern.test(path));
  return groupIndex === -1 ? 100 + path.split("/").filter(Boolean).length : groupIndex;
}

async function crawlHtmlPage(url: URL, outcomes: CrawlOutcome[]): Promise<CrawledPage | null> {
  try {
    const { response, finalUrl, durationMs, redirects, close } = await fetchPublic(url);
    try {
      const record = (outcome: CrawlOutcome['outcome']) => outcomes.push({url: url.href, finalUrl: finalUrl.href, status: response.status, outcome});
      if (!response.ok) { record('http-error'); await response.body?.cancel(); return null; }
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) { record('non-html'); await response.body?.cancel(); return null; }
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MAX_HTML_BYTES) { record('too-large'); await response.body?.cancel(); return null; }
      const bytes = await response.arrayBuffer();
      if (bytes.byteLength > MAX_HTML_BYTES) { record('too-large'); return null; }
      const html = decodeBody(bytes, contentType);
      record('analyzed');
      return {
        url: finalUrl,
        html,
        response,
        durationMs,
        redirects,
        title: documentMetadata(html).title,
        description: metaContent(html, "description"),
      };
    } finally {
      await close();
    }
  } catch {
    outcomes.push({url: url.href, outcome: 'unavailable'});
    return null;
  }
}

async function verifyInternalLinks(pages: CrawledPage[]) {
  const discovered = new Map<string, URL>();
  for (const page of pages) {
    for (const url of extractInternalUrls(page.html, page.url)) {
      discovered.set(url.href, url);
    }
  }

  const targets = [...discovered.values()].slice(0, MAX_LINK_TARGETS);
  const checks = await mapWithConcurrency(targets, CRAWL_CONCURRENCY, async (url) => {
    try {
      const { response, finalUrl, close } = await fetchPublic(url);
      try {
        const status = response.status;
        await response.body?.cancel();
        return { url: url.href, finalUrl: finalUrl.href, status, verified: true };
      } finally {
        await close();
      }
    } catch {
      return { url: url.href, finalUrl: url.href, status: 0, verified: false };
    }
  });
  const broken = checks.filter((check) => check.verified && check.status >= 400);
  const unverified = checks.filter((check) => !check.verified);
  const complete = discovered.size <= MAX_LINK_TARGETS && unverified.length === 0;
  return { checks, discoveredUrls: [...discovered.keys()], broken, unverified, tested: checks.length, discovered: discovered.size, complete };
}

async function checkResource(baseUrl: URL, path: string) {
  try {
    const target = new URL(path, baseUrl.origin);
    const { response, finalUrl, close, redirectTrace } = await fetchPublic(target);
    try {
      const reader = response.body?.getReader();
      const chunks: Uint8Array[] = []; let size = 0;
      if (reader) { try { while (true) { const part = await reader.read(); if (part.done) break; size += part.value.byteLength; if (size > 250000) { await reader.cancel(); throw new Error("Resource exceeds inspection limit"); } chunks.push(part.value); } } finally { reader.releaseLock(); } }
      const contentType = response.headers.get("content-type") ?? "";
      return { ok: response.ok, status: response.status, text: decodeBody(Buffer.concat(chunks), contentType), url: finalUrl.href, redirectTrace, contentType, robots: response.headers.get("x-robots-tag") ?? "", link: response.headers.get("link") ?? "" };
    } finally {
      await close();
    }
  } catch (error) {
    return { ok: false, status: 0, text: "", contentType: "", robots: "", link: "", url: new URL(path, baseUrl.origin).href, error: error instanceof Error ? error.message : "Request failed" };
  }
}

export async function POST(request: Request) {
  const startedAt = Date.now();
  const requestId = requestIdFromHeaders(request.headers);
  const authenticationEnabled = Boolean(
    process.env.DATABASE_URL && process.env.BETTER_AUTH_SECRET,
  );
  if (
    authenticationEnabled &&
    request.headers.get("x-auditpro-internal") !== internalAnalysisToken
  ) {
    logOperation({
      level: "warn",
      component: "api",
      operation: "analysis.direct",
      requestId,
      status: "warning",
      durationMs: Date.now() - startedAt,
      metadata: { outcome: "unauthorized", statusCode: 401 },
    });
    return operationResponse(
      { error: "Use the authenticated analysis job endpoint." },
      { status: 401, headers: noStoreHeaders },
      requestId,
    );
  }
  try {
    const parsedBody = await parseAnalyzeRequestBody(request);
    if (!parsedBody.ok) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.direct",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_body", statusCode: 400 },
      });
      return operationResponse({ error: parsedBody.error }, { status: 400, headers: noStoreHeaders }, requestId);
    }
    const body = parsedBody.body;
    if (typeof body.url !== "string") {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.direct",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: { outcome: "invalid_url", statusCode: 400 },
      });
      return operationResponse(
        { error: "Enter a website domain first." },
        { status: 400, headers: noStoreHeaders },
        requestId,
      );
    }
    const requestedUrl = normalizePublicUrl(body.url);
    const requestedPageLimit = typeof body.pageLimit === "number" && Number.isFinite(body.pageLimit) ? body.pageLimit : DEFAULT_MAX_PAGES;
    const pageLimit = Math.max(1, Math.min(Math.floor(requestedPageLimit), MAX_RUNTIME_PAGES));
    await assertPublicUrl(requestedUrl);
    const rateLimit = enforceAnalysisRateLimit(request, requestedUrl.hostname);
    if (!rateLimit.allowed) {
      logOperation({
        level: "warn",
        component: "api",
        operation: "analysis.direct",
        requestId,
        status: "warning",
        durationMs: Date.now() - startedAt,
        metadata: {
          outcome: "rate_limited",
          targetHash: stableLogHash(requestedUrl.hostname),
          retryAfter: rateLimit.retryAfter,
          statusCode: 429,
        },
      });
      return operationResponse(
        { error: "Analysis limit reached for this domain. Please wait a few minutes before trying again." },
        { status: 429, headers: { ...noStoreHeaders, "Retry-After": String(rateLimit.retryAfter) } },
        requestId,
      );
    }
    const { response, finalUrl, durationMs, redirects, close } = await fetchPublic(requestedUrl);
    let html = "";
    try {
      if (!response.ok) throw new Error(`Website returned HTTP ${response.status}.`);
      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) throw new Error("The address did not return an HTML webpage.");
      const contentLength = Number(response.headers.get("content-length") ?? 0);
      if (contentLength > MAX_HTML_BYTES) throw new Error("The homepage is too large to analyze safely.");
      html = decodeBody(await response.arrayBuffer(), contentType).slice(0, MAX_HTML_BYTES);
    } finally {
      await close();
    }
    const [robots, defaultSitemap] = await Promise.all([
      checkResource(finalUrl, "/robots.txt"), checkResource(finalUrl, "/sitemap.xml"),
    ]);
    const defaultSitemapUrl = new URL('/sitemap.xml', finalUrl).href;
    const sitemapDiscovery = await discoverSitemapPages([defaultSitemapUrl,...declaredSitemaps(robots.text, finalUrl.origin, Infinity)], finalUrl.origin, target => target === defaultSitemapUrl ? Promise.resolve(defaultSitemap) : checkResource(finalUrl, target));
    const homePage: CrawledPage = {
      url: finalUrl,
      html,
      response,
      durationMs,
      redirects,
      title: documentMetadata(html).title,
      description: metaContent(html, "description"),
    };
    const sitemapUrls = sitemapDiscovery.pages.map(url => new URL(url));
    const crawlOutcomes: CrawlOutcome[] = [{url: requestedUrl.href, finalUrl: finalUrl.href, status: response.status, outcome: 'analyzed'}];
    const crawledInnerPages = await crawlSitePages(html, finalUrl, sitemapUrls, pageLimit, crawlOutcomes);
    const pages = [...new Map([homePage, ...crawledInnerPages].map(page => [page.url.href, page])).values()];
    const findings = mergeSitewideFindings(analyzeHtml(html, finalUrl, response, durationMs, redirects), pages, crawlOutcomes, sitemapDiscovery.pageLimitReached);
    const siteTypeAssessment = inferSiteTypeProfile(pages.map((page) => ({
      url: page.url,
      html: page.html,
      title: page.title,
      description: page.description,
    })));
    const httpsProbes = await Promise.all(pages.slice(0,3).map(page => probeHttpsRedirect(page.url,async target=>{
      const fetched=await fetchPublic(target,5000);
      try{return {status:fetched.response.status,finalUrl:fetched.finalUrl.href,redirectTrace:fetched.redirectTrace};}
      finally{try{await fetched.response.body?.cancel();}finally{await fetched.close();}}
    })));
    const probeRank={Fail:4,Partial:3,Pass:2,'N/A':1} as const;
    const httpsProbe=httpsProbes.reduce((worst,probe)=>probeRank[probe.status]>probeRank[worst.status]?probe:worst,httpsProbes[0]);
    setFinding(findings,'t29',httpsProbe.status,`${httpsProbes.length} sampled HTTP-path probes. ${httpsProbe.note}`,{scoreEligible:false,scope:{tested:httpsProbes.filter(probe=>probe.status!=='N/A').length,discovered:pages.length,complete:httpsProbes.length===Math.min(3,pages.length)},pageResults:httpsProbes.map(probe=>({url:probe.url,status:probe.status,value:probe.note}))});
    findings.t29.evidence.methodVersion='http-to-https-sampled-paths@1.0.0';
    const repeatedTimings = await repeatCrawlTimings(pages.map(page => page.url.href), async (url, timeoutMs) => {
      const fetched = await fetchPublic(url, timeoutMs);
      try { return {status: fetched.response.status, finalUrl: fetched.finalUrl.href, durationMs: fetched.durationMs}; }
      finally { try { await fetched.response.body?.cancel(); } finally { await fetched.close(); } }
    });
    setFinding(findings, 't64', 'N/A', `Repeated crawler sample: up to 3 pages, 3 rounds, sequential requests. No cache-busting or CPU/network throttling; server cache state is uncontrolled. Small-sample median/range only, not p95 or template consistency. ${CRAWL_TIMING_LIMITS}`, {
      scoreEligible: false, confidence: 'low',
      scope: {tested: repeatedTimings.filter(row => row.values.length === 3).length, discovered: pages.length, complete: pages.length === repeatedTimings.length && repeatedTimings.every(row => row.values.length === 3)},
      pageResults: repeatedTimings.map(row => ({url: row.url, status: 'N/A', value: repeatedTimingText(row)})),
    });
    findings.t64.evidence.methodVersion = 'repeated-crawler-headers@1.0.0';
    const linkCheck = await verifyInternalLinks(pages);
    const contents=pages.map(page=>inspectContent(page.html,page.url));
    const schemaDetails=pages.map(page=>({url:page.url.href,blocks:structuredDataEvidence(page.html).blocks}));
    for(const id of ['t35','t40','t43']) findings[id].evidence.schemaDetails=schemaDetails;
    for(const id of ['o13','u34','o37'])setFinding(findings,id,'N/A','Parsed HTML observations retained per page. Semantic quality and rendered accessibility require review.',{scoreEligible:false});
    findings.o13.evidence.contentDetails=contents.map(({url,headings})=>({url,headings}));
    findings.u34.evidence.contentDetails=contents.map(({url,images})=>({url,images}));
    findings.o37.evidence.contentDetails=contents.map(({url,links})=>({url,links:attachLinkChecks(links,linkCheck.checks)}));
    for (const [id,kind] of [['o46','about'],['o49','policy']] as const) {
      findings[id].evidence.metricId='navigation-candidates';
      findings[id].evidence.contentDetails=contents.map(({url,links})=>({url,links:attachLinkChecks(navigationHints(links,kind),linkCheck.checks)}));
    }
    const httpMeasurement = measureHttpStatuses(crawlOutcomes, linkCheck.checks, linkCheck.discoveredUrls);
    setFinding(
      findings,
      "t56",
      httpMeasurement.status,
      httpMeasurement.note,
      {
        confidence: httpMeasurement.scoreEligible ? 'high' : 'medium',
        scoreEligible: httpMeasurement.scoreEligible,
        scope: httpMeasurement.scope,
        pageResults: httpMeasurement.pageResults,
      },
    );
    // P1-P3 plan C2: optional external link status verification with its own
    // budget and scope (off by default). Every target passes the public-address
    // policy through fetchPublic; external links remain declarations and a
    // status check is a bounded sample, not destination trust.
    if (externalLinkChecksEnabled()) {
      const externalByPage = pages.map(page => externalLinkEvidence(page.html, page.url));
      const distinctExternal = [...new Map(externalByPage.flat().map(link => [link.url, link])).values()];
      const externalChecks = await verifyExternalLinks(distinctExternal, async (target) => {
        try {
          const fetched = await fetchPublic(target, 5000);
          try {
            return { status: fetched.response.status, finalUrl: fetched.finalUrl.href };
          } finally {
            try { await fetched.response.body?.cancel(); } finally { await fetched.close(); }
          }
        } catch {
          return null;
        }
      }, externalLinkCheckBudget());
      findings.o44.note += ` ${externalChecks.note}`;
      findings.o44.evidence.scope = externalChecks.scope;
      findings.o44.evidence.contentDetails = pages.map((page, index) => ({
        url: page.url.href,
        links: externalByPage[index].map(link => {
          const check = externalChecks.checks.find(row => row.url === link.url);
          return { target: link.url, text: link.rel.join(' '), ...(check?.verified ? { status: check.status, finalUrl: check.finalUrl } : {}) };
        }),
      }));
    }
    const robotsDetails = robotsPageEvidence(robots.text, robots.status, robots.url, finalUrl.origin, pages.map(page=>page.url), robots.contentType);
    const robotsDetermined = robotsDetails.filter(row=>row.allowed!==null).length;
    // P1-P3 plan B4: the one serp control with an automated source is measured
    // from the retrieved robots policy — AI search crawlers must not be blocked.
    // Training-crawler access is a separate publisher choice (GPTBot training
    // access is not required for search visibility). The remaining serp controls
    // stay external-evidence-required and the serp category publishes no score.
    const aiSearchBots = robotsDetails.filter(row => ['oai-searchbot', 'perplexitybot', 'claudebot'].includes(row.bot));
    const aiSearchDetermined = aiSearchBots.filter(row => row.allowed !== null);
    const aiSearchBlocked = aiSearchBots.filter(row => row.allowed === false);
    setFinding(findings, 'serp13', aiSearchBlocked.length ? 'Fail' : aiSearchDetermined.length === aiSearchBots.length && aiSearchBots.length ? 'Pass' : 'N/A',
      `${aiSearchDetermined.length}/${aiSearchBots.length} sampled AI search-crawler path decisions are determined from the retrieved robots policy; ${aiSearchBlocked.length} block an AI search crawler. Training-crawler access is a separate publisher choice and GPTBot training access is not required for search visibility.`,
      { source: 'crawler', confidence: 'medium', scoreEligible: false,
        scope: { tested: aiSearchDetermined.length, discovered: aiSearchBots.length, complete: aiSearchDetermined.length === aiSearchBots.length },
        pageResults: aiSearchBots.map(row => ({ url: `${row.bot} ${row.url}`, status: row.allowed === null ? 'N/A' : row.allowed ? 'Pass' : 'Fail', value: row.rule ?? row.reason })) });
    findings.serp13.evidence.methodVersion = 'robots-ai-crawler-access@1.0.0';
    findings.serp13.evidence.robotsDetails = aiSearchBots;
    const languageDetails=measureLanguages(pages);
    setFinding(findings,'t53',languageDetails.every(row=>row.lang) ? 'Pass' : 'Partial','Parsed HTML language declarations; content language and hreflang validity are not established.',{scoreEligible:false,pageResults:languageDetails.map(row=>({url:row.url,status:'N/A',value:row.lang || '—'}))});
    findings.t53.evidence.languageDetails=languageDetails;
    setFinding(findings, 't1', 'N/A', `${robotsDetails.length} bot/page policy observations recorded; ${robotsDetermined} produced a bounded rule decision and ${robotsDetails.length-robotsDetermined} remain undetermined. Only a text/plain policy retrieved for this origin and sampled paths were evaluated; real bot access/indexing not proven.`, { scoreEligible: false });
    findings.t1.evidence.robotsDetails = robotsDetails;
    findings.t1.evidence.methodVersion = 'robots-sampled-paths@1.1.0';
    findings.t1.evidence.observed = {
      policyHttpStatus: robots.status,
      policyContentType: robots.contentType || 'missing',
      sampledDecisions: robotsDetails.length,
      determinedDecisions: robotsDetermined,
    };
    findings.t4.evidence.indexingDetails = pages.map(page=>{
      const check = indexingEvidence(page.html,page.response.headers.get('x-robots-tag') ?? '');
      return {url:page.url.href,bot:'googlebot',noindex:check.noindex,declarations:check.declarations};
    });
    const canonicalDetails: NonNullable<MeasurementEvidence['canonicalDetails']> = [];
    const targetNotes = await inspectCanonicalTargets(pages, target => checkResource(finalUrl, target), 5, canonicalDetails);
    findings.t5.evidence.canonicalDetails = canonicalDetails;
    if (targetNotes.length) findings.t5.note += ' Target inspection: ' + targetNotes.join(' | ');
    findings.t5.evidence.pageResults = pages.map(page => {
      const declaration = canonicalEvidence(page.html, page.url, page.response.headers.get('link') || '');
      return {url: page.url.href, status: declaration.status, value: declaration.target ? `Canonical → ${declaration.target}` : '—'};
    });
    setFinding(findings, "t2", sitemapDiscovery.maps.some(map => map.state === 'parsed') ? 'Partial' : 'N/A', `${sitemapDiscovery.pages.length} unique same-origin page addresses discovered from ${sitemapDiscovery.maps.length} sitemap addresses; ${sitemapDiscovery.maps.filter(map=>map.state!=='parsed').length} sitemap addresses not parsed. Discovery is bounded to 12 sitemap requests and 10000 page addresses; it does not establish whole-site completeness.`, { scoreEligible: false });
    findings.t56.evidence.methodVersion = 'http-response-status@1.0.0';
    findings.t56.evidence.reasonCode = httpMeasurement.scoreEligible ? 'reviewed-bounded-measurement' : 'coverage-incomplete';

    const renderedWarnings: string[] = [];
    let renderedPagesMeasured = 0;
    let renderedViewportRuns = 0;
    let renderedPageCoverage: import('@/lib/browser-sample').BrowserPageCoverage[] = [];
    try {
      const rendered = await measureRenderedPages(pages.map((page) => page.url.href));
      Object.assign(findings, rendered.findings);
      if (rendered.schemaNotes.length) for (const id of ['t35', 't40', 't43']) findings[id].note += ' Rendered content sample: ' + rendered.schemaNotes.join(' | ');
      renderedWarnings.push(...rendered.warnings);
      renderedPagesMeasured = rendered.pagesMeasured;
      renderedViewportRuns = rendered.viewportRuns;
      renderedPageCoverage = rendered.pageCoverage;
    } catch (error) {
      renderedWarnings.push(`Rendered browser measurements were unavailable: ${error instanceof Error ? error.message : "browser error"}`);
    }

    // P1-P3 plan C1 (field): CrUX origin-level p75 metrics upgrade t15/t16/t17
    // from lab observations to bounded field measurements of the claims the
    // controls name (official thresholds, uncalibrated → observation). Without a
    // key the field claim stays unmeasured; the origin string is posted to
    // Google's fixed endpoint, so no audited URL is fetched here.
    const fieldKey = fieldCwvApiKey();
    if (fieldKey) {
      const fieldMetrics = await fetchFieldCwv(finalUrl.origin, fieldKey);
      const field = fieldMetrics.find((row) => row.formFactor === "DESKTOP") ?? fieldMetrics.find((row) => row.formFactor === "PHONE");
      if (field) {
        const fieldFinding = (id: "t15" | "t16" | "t17", kind: "lcp" | "inp" | "cls", label: string, value: number | null, unit: string, metricName: string) => {
          setFinding(findings, id, fieldCwvThresholdStatus(kind, value),
            `Field ${label} p75 ${value ?? "—"}${unit} (Chrome UX Report, origin-level, 28-day window, ${field.formFactor.toLowerCase()}). This is the field metric the control names; the lab pass stays an observation.`,
            { source: "integration", confidence: "medium", scoreEligible: false,
              scope: { tested: value === null ? 0 : 1, discovered: 1, complete: value !== null } });
          findings[id].evidence.methodVersion = FIELD_CWV_SOURCE;
          findings[id].evidence.reasonCode = "field-metric-uncalibrated";
          findings[id].evidence.observed = { [metricName]: value ?? -1, formFactor: field.formFactor, source: FIELD_CWV_SOURCE };
        };
        fieldFinding("t15", "lcp", "LCP", field.lcpMsP75, " ms", "fieldLcpMsP75");
        fieldFinding("t16", "inp", "INP", field.inpMsP75, " ms", "fieldInpMsP75");
        fieldFinding("t17", "cls", "CLS", field.clsP75, "", "fieldClsP75");
      }
    }

    for (const [id, finding] of Object.entries(findings)) {
      if (isControlApplicable(siteTypeAssessment.siteType, id)) continue;
      finding.status = "N/A";
      finding.note = `Not applicable for inferred site type: ${siteTypeAssessment.siteType}. ${finding.note}`;
      finding.evidence.scoreEligible = false;
      finding.evidence.confidence = "low";
      finding.evidence.reasonCode = "not-applicable-for-site-type";
      if (finding.evidence.pageResults?.length) {
        finding.evidence.pageResults = finding.evidence.pageResults.map((row) => ({
          ...row,
          status: "N/A",
          value: row.value ?? "Not applicable",
        }));
      }
    }

    const scoreEligibleFindings = Object.entries(findings).filter(([, finding]) => finding.evidence.scoreEligible);
    const diagnosticFindings = Object.entries(findings).filter(([, finding]) => !finding.evidence.scoreEligible);
    const results = Object.fromEntries(scoreEligibleFindings.map(([id, finding]) => [id, finding.status]));
    const notes = Object.fromEntries(Object.entries(findings).map(([id, finding]) => [id, finding.evidence.scoreEligible ? finding.note : `Diagnostic only (not scored): ${finding.note}`]));
    const measurementEvidence = Object.fromEntries(Object.entries(findings).map(([id, finding]) => [id, finding.evidence]));
    const onlineScorecards = buildOnlineScorecards({
      findings,
      sitemapDiscovery,
      robotsDetails,
      contentDetails: contents,
      schemaDetails,
      languageDetails,
    });
    const responseBody = {
      requestedUrl: requestedUrl.href,
      finalUrl: finalUrl.href,
      fetchedAt: new Date().toISOString(),
      checked: Object.keys(results).length,
      diagnosticCount: diagnosticFindings.length,
      pagesAnalyzed: pages.length,
      renderedPageCoverage,
      renderedPagesMeasured,
      renderedViewportRuns,
      pageLimit,
      requestedPageLimit,
      creditsUsed: pages.length,
      pages: pages.map((page) => page.url.href),
      crawlOutcomes,
      sitemapDiscovery,
      automatedItemIds: Object.keys(results),
      measurementEvidence,
      onlineScorecards,
      results,
      notes,
      warnings: [
        `Automated results cover ${pages.length} representative page${pages.length === 1 ? "" : "s"} and directly testable technical signals.`,
        "Search Console, analytics, field Core Web Vitals, and AI-engine visibility remain outside the score until their evidence sources are connected.",
        ...renderedWarnings,
      ],
      siteTypeAssessment: summarizeSiteTypeAssessment(siteTypeAssessment),
    };
    logOperation({
      level: "info",
      component: "api",
      operation: "analysis.direct",
      requestId,
      status: "ok",
      durationMs: Date.now() - startedAt,
      metadata: {
        targetHash: stableLogHash(requestedUrl.hostname),
        pagesAnalyzed: responseBody.pagesAnalyzed,
        renderedPagesMeasured,
        renderedViewportRuns,
        pageLimit,
        warnings: responseBody.warnings.length,
        seoScore: responseBody.onlineScorecards.seo.score,
        geoScore: responseBody.onlineScorecards.geo.score,
        // P2 B5 telemetry (numbers/booleans only, no URLs): budget and scope coverage
        // feed the later t56 strictness and sitemap-budget decisions with field data.
        scopeTelemetry: {
          sitemapPagesDiscovered: sitemapDiscovery.pages.length,
          sitemapPageLimitReached: sitemapDiscovery.pageLimitReached,
          linkTargetsDiscovered: linkCheck.discovered,
          linkTargetsTested: linkCheck.tested,
          linkBudgetReached: linkCheck.discovered > linkCheck.tested,
          linkScopeComplete: linkCheck.complete,
          httpStatusScopeComplete: httpMeasurement.scope?.complete ?? false,
          crawlAttempted: crawlOutcomes.length,
          crawlUnfetched: crawlOutcomes.filter(row => row.outcome !== 'analyzed').length,
        },
      },
    });
    return operationResponse(responseBody, { headers: noStoreHeaders }, requestId);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Website analysis failed.";
    const status = /private network|credentials|standard web ports|Enter a website|Only HTTP/i.test(message) ? 400 : 502;
    logOperation({
      level: status >= 500 ? "error" : "warn",
      component: "api",
      operation: "analysis.direct",
      requestId,
      status: status >= 500 ? "error" : "warning",
      durationMs: Date.now() - startedAt,
      metadata: { error: errorName(error), statusCode: status },
    });
    return operationResponse({ error: message }, { status, headers: noStoreHeaders }, requestId);
  }
}
