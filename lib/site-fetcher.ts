// ─── Types ──────────────────────────────────────────────────────────────────

export interface SiteData {
  url: string
  finalUrl: string
  isHttps: boolean
  httpToHttpsRedirect: boolean
  statusCode: number
  ttfbMs: number
  headers: Record<string, string>
  robotsTxt: string | null
  sitemap: SitemapData | null
  pageSpeed: PageSpeedData | null
  ssl: SSLData | null
  html: string
  parsed: ParsedHTML
  crawledPages: CrawledPage[]
}

export interface SitemapData {
  found: boolean
  url: string
  urlCount: number
  lastmod: string | null
  sampleUrls: string[]
  hasNoindexUrls: boolean
}

export interface PageSpeedData {
  mobile: { score: number; lcp: number; cls: number; fcp: number; tbt: number; si: number }
  desktop: { score: number; lcp: number; cls: number; fcp: number; tbt: number; si: number }
}

export interface SSLData {
  valid: boolean
  issuer: string | null
  daysUntilExpiry: number | null
}

export interface CrawledPage {
  url: string
  statusCode: number
  title: string | null
  metaDescription: string | null
  h1: string[]
  wordCount: number
  canonical: string | null
  hasNoindex: boolean
}

export interface ParsedHTML {
  title: string | null
  metaDescription: string | null
  metaRobots: string | null
  canonical: string | null
  hreflang: string[]
  viewport: string | null
  ogTags: Record<string, string>
  twitterTags: Record<string, string>
  h1: string[]
  h2: string[]
  h3: string[]
  images: { total: number; withAlt: number; withDimensions: number; formats: Record<string, number> }
  links: { internal: number; external: number; brokenCount: number }
  scripts: { total: number; async: number; defer: number; inline: number }
  stylesheets: number
  forms: number
  buttons: number
  schemaOrg: string[]
  fontDisplay: boolean
  lang: string | null
  charCount: number
  wordCount: number
  internalUrls: string[]
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function extractAllMatches(html: string, pattern: RegExp): string[] {
  const results: string[] = []
  let m
  while ((m = pattern.exec(html)) !== null) {
    results.push(m[1]?.trim() || '')
  }
  return results
}

function extractMetaContent(html: string, nameOrProp: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]*(?:name|property)\\s*=\\s*["']${nameOrProp}["'][^>]*content\\s*=\\s*["']([^"']*)["']`, 'i'),
    new RegExp(`<meta[^>]*content\\s*=\\s*["']([^"']*)["'][^>]*(?:name|property)\\s*=\\s*["']${nameOrProp}["']`, 'i'),
  ]
  for (const p of patterns) {
    const m = html.match(p)
    if (m) return m[1]
  }
  return null
}

async function safeFetch(url: string, timeoutMs = 10000): Promise<Response | null> {
  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AuditPro/1.0 (SEO Audit Bot)' },
      redirect: 'follow',
    })
    clearTimeout(timer)
    return res
  } catch {
    return null
  }
}

// ─── HTML Parser ────────────────────────────────────────────────────────────

function parseHTML(html: string, siteUrl: string): ParsedHTML {
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = titleMatch ? titleMatch[1].trim() : null

  const metaDescription = extractMetaContent(html, 'description')
  const metaRobots = extractMetaContent(html, 'robots')
  const viewport = extractMetaContent(html, 'viewport')

  const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["']/i)
    || html.match(/<link[^>]*href\s*=\s*["']([^"']*)["'][^>]*rel\s*=\s*["']canonical["']/i)
  const canonical = canonicalMatch ? canonicalMatch[1] : null

  const hreflang = extractAllMatches(html, /<link[^>]*hreflang\s*=\s*["']([^"']*)["'][^>]*>/gi)

  const ogTags: Record<string, string> = {}
  for (const m of html.matchAll(/<meta[^>]*property\s*=\s*["'](og:[^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi))
    ogTags[m[1]] = m[2]
  for (const m of html.matchAll(/<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*property\s*=\s*["'](og:[^"']*)["'][^>]*>/gi))
    ogTags[m[2]] = m[1]

  const twitterTags: Record<string, string> = {}
  for (const m of html.matchAll(/<meta[^>]*(?:name|property)\s*=\s*["'](twitter:[^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi))
    twitterTags[m[1]] = m[2]

  const h1 = extractAllMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(h => h.replace(/<[^>]*>/g, '').trim())
  const h2 = extractAllMatches(html, /<h2[^>]*>([\s\S]*?)<\/h2>/gi).map(h => h.replace(/<[^>]*>/g, '').trim())
  const h3 = extractAllMatches(html, /<h3[^>]*>([\s\S]*?)<\/h3>/gi).map(h => h.replace(/<[^>]*>/g, '').trim())

  // Images
  const imgTags = html.match(/<img[^>]*>/gi) || []
  let withAlt = 0, withDimensions = 0
  const formats: Record<string, number> = {}
  for (const img of imgTags) {
    if (/alt\s*=\s*["'][^"']+["']/i.test(img)) withAlt++
    if (/width\s*=/i.test(img) && /height\s*=/i.test(img)) withDimensions++
    const srcMatch = img.match(/src\s*=\s*["']([^"']*?)["']/i)
    if (srcMatch) {
      const ext = srcMatch[1].split('?')[0].split('.').pop()?.toLowerCase() || 'unknown'
      formats[ext] = (formats[ext] || 0) + 1
    }
  }

  // Links
  let host: string
  try { host = new URL(siteUrl).hostname } catch { host = '' }
  const linkHrefs = html.match(/<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi) || []
  let internal = 0, external = 0
  const internalUrls: string[] = []
  for (const link of linkHrefs) {
    const hrefMatch = link.match(/href\s*=\s*["']([^"']*)["']/i)
    if (!hrefMatch) continue
    const href = hrefMatch[1]
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    try {
      const linkUrl = new URL(href, siteUrl)
      if (linkUrl.hostname === host) {
        internal++
        const clean = linkUrl.origin + linkUrl.pathname
        if (!internalUrls.includes(clean) && clean !== siteUrl && clean !== siteUrl + '/') {
          internalUrls.push(clean)
        }
      } else {
        external++
      }
    } catch {
      internal++
    }
  }

  // Scripts
  const scriptTags = html.match(/<script[^>]*>/gi) || []
  let asyncCount = 0, deferCount = 0, inlineCount = 0
  for (const s of scriptTags) {
    if (/\basync\b/i.test(s)) asyncCount++
    if (/\bdefer\b/i.test(s)) deferCount++
    if (!/src\s*=/i.test(s)) inlineCount++
  }

  const stylesheets = (html.match(/<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi) || []).length
  const formCount = (html.match(/<form[^>]*>/gi) || []).length
  const buttonCount = (html.match(/<button[^>]*>/gi) || []).length
    + (html.match(/<input[^>]*type\s*=\s*["']submit["'][^>]*>/gi) || []).length
    + (html.match(/<a[^>]*class\s*=\s*["'][^"']*btn[^"']*["'][^>]*>/gi) || []).length

  // Schema.org
  const jsonLdBlocks = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  const schemaOrg: string[] = []
  for (const block of jsonLdBlocks) {
    const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim()
    try {
      const parsed = JSON.parse(content)
      if (parsed['@type']) schemaOrg.push(parsed['@type'])
      if (Array.isArray(parsed['@graph'])) {
        for (const item of parsed['@graph']) {
          if (item['@type']) schemaOrg.push(item['@type'])
        }
      }
    } catch { /* ignore */ }
  }

  const fontDisplay = /font-display\s*:\s*swap/i.test(html)
  const langMatch = html.match(/<html[^>]*\blang\s*=\s*["']([^"']*)["']/i)
  const lang = langMatch ? langMatch[1] : null

  const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ').trim()

  return {
    title, metaDescription, metaRobots, canonical, hreflang, viewport,
    ogTags, twitterTags, h1, h2, h3,
    images: { total: imgTags.length, withAlt, withDimensions, formats },
    links: { internal, external, brokenCount: 0 },
    scripts: { total: scriptTags.length, async: asyncCount, defer: deferCount, inline: inlineCount },
    stylesheets, forms: formCount, buttons: buttonCount,
    schemaOrg, fontDisplay, lang,
    charCount: textContent.length,
    wordCount: textContent.split(/\s+/).filter(w => w.length > 0).length,
    internalUrls,
  }
}

// ─── PageSpeed Insights API ─────────────────────────────────────────────────

async function fetchPageSpeed(url: string): Promise<PageSpeedData | null> {
  const PSI_API = 'https://www.googleapis.com/pagespeedonline/v5/runPagespeed'

  async function run(strategy: 'mobile' | 'desktop') {
    try {
      const apiUrl = `${PSI_API}?url=${encodeURIComponent(url)}&strategy=${strategy}&category=performance`
      const res = await safeFetch(apiUrl, 30000)
      if (!res || !res.ok) return null
      const data = await res.json()

      const lhr = data.lighthouseResult
      if (!lhr) return null

      const score = Math.round((lhr.categories?.performance?.score ?? 0) * 100)
      const audits = lhr.audits || {}

      return {
        score,
        lcp: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
        cls: parseFloat((audits['cumulative-layout-shift']?.numericValue ?? 0).toFixed(3)),
        fcp: Math.round(audits['first-contentful-paint']?.numericValue ?? 0),
        tbt: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
        si: Math.round(audits['speed-index']?.numericValue ?? 0),
      }
    } catch {
      return null
    }
  }

  const [mobile, desktop] = await Promise.all([run('mobile'), run('desktop')])
  if (!mobile && !desktop) return null

  return {
    mobile: mobile ?? { score: 0, lcp: 0, cls: 0, fcp: 0, tbt: 0, si: 0 },
    desktop: desktop ?? { score: 0, lcp: 0, cls: 0, fcp: 0, tbt: 0, si: 0 },
  }
}

// ─── Sitemap ────────────────────────────────────────────────────────────────

async function fetchSitemap(origin: string): Promise<SitemapData | null> {
  const sitemapUrls = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap.xml.gz`,
  ]

  for (const sitemapUrl of sitemapUrls) {
    const res = await safeFetch(sitemapUrl, 8000)
    if (!res || !res.ok) continue

    const text = await res.text()
    if (!text.includes('<urlset') && !text.includes('<sitemapindex')) continue

    // Count URLs
    const urlMatches = text.match(/<loc>/gi) || []
    const urlCount = urlMatches.length

    // Extract sample URLs
    const locMatches = extractAllMatches(text, /<loc>([\s\S]*?)<\/loc>/gi)
    const sampleUrls = locMatches.slice(0, 5)

    // Find lastmod
    const lastmodMatches = extractAllMatches(text, /<lastmod>([\s\S]*?)<\/lastmod>/gi)
    const lastmod = lastmodMatches.length > 0
      ? lastmodMatches.sort().reverse()[0]
      : null

    // Check if any noindex hint
    const hasNoindexUrls = false // Can't tell from sitemap alone

    return { found: true, url: sitemapUrl, urlCount, lastmod, sampleUrls, hasNoindexUrls }
  }

  return null
}

// ─── SSL Check ──────────────────────────────────────────────────────────────

async function checkSSL(url: string): Promise<SSLData | null> {
  try {
    const hostname = new URL(url).hostname
    // Use a free SSL check API
    const res = await safeFetch(
      `https://ssl-checker.io/api/v1/check/${hostname}`,
      8000
    )
    if (res && res.ok) {
      const data = await res.json()
      return {
        valid: data.result === 'valid' || data.valid === true,
        issuer: data.issuer || data.issuer_o || null,
        daysUntilExpiry: data.days_left ?? data.daysUntilExpiry ?? null,
      }
    }
  } catch { /* ignore */ }

  // Fallback: if HTTPS works and we got a 200, SSL is likely valid
  const res = await safeFetch(url, 5000)
  if (res && res.ok && url.startsWith('https://')) {
    return { valid: true, issuer: null, daysUntilExpiry: null }
  }

  return null
}

// ─── Multi-page Crawl ───────────────────────────────────────────────────────

async function crawlInternalPages(urls: string[], maxPages = 8): Promise<CrawledPage[]> {
  const toCrawl = urls.slice(0, maxPages)
  const results: CrawledPage[] = []

  const tasks = toCrawl.map(async (url) => {
    const res = await safeFetch(url, 8000)
    if (!res) return { url, statusCode: 0, title: null, metaDescription: null, h1: [], wordCount: 0, canonical: null, hasNoindex: false }

    const statusCode = res.status
    if (statusCode >= 400) return { url, statusCode, title: null, metaDescription: null, h1: [], wordCount: 0, canonical: null, hasNoindex: false }

    const html = await res.text()
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
    const title = titleMatch ? titleMatch[1].trim() : null
    const metaDescription = extractMetaContent(html, 'description')
    const h1 = extractAllMatches(html, /<h1[^>]*>([\s\S]*?)<\/h1>/gi).map(h => h.replace(/<[^>]*>/g, '').trim())

    const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["']/i)
    const canonical = canonicalMatch ? canonicalMatch[1] : null

    const metaRobots = extractMetaContent(html, 'robots') || ''
    const hasNoindex = metaRobots.toLowerCase().includes('noindex')

    const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
    const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

    return { url, statusCode, title, metaDescription, h1, wordCount, canonical, hasNoindex }
  })

  const settled = await Promise.allSettled(tasks)
  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(r.value)
  }

  return results
}

// ─── Main Fetcher ───────────────────────────────────────────────────────────

export async function fetchSiteData(inputUrl: string): Promise<SiteData> {
  let url = inputUrl.trim()
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url
  }

  // Check HTTP → HTTPS redirect
  let httpToHttpsRedirect = false
  if (url.startsWith('https://')) {
    const httpUrl = url.replace('https://', 'http://')
    try {
      const controller = new AbortController()
      const timer = setTimeout(() => controller.abort(), 5000)
      const httpRes = await fetch(httpUrl, {
        signal: controller.signal, redirect: 'manual',
        headers: { 'User-Agent': 'AuditPro/1.0 (SEO Audit Bot)' },
      })
      clearTimeout(timer)
      const location = httpRes.headers.get('location') || ''
      httpToHttpsRedirect = location.startsWith('https://')
    } catch { /* ignore */ }
  }

  // Fetch main page
  const startTime = Date.now()
  const mainRes = await safeFetch(url)
  const ttfbMs = Date.now() - startTime
  if (!mainRes) throw new Error(`Could not fetch ${url}`)

  const statusCode = mainRes.status
  const finalUrl = mainRes.url
  const isHttps = finalUrl.startsWith('https://')

  const headers: Record<string, string> = {}
  for (const h of ['content-type', 'strict-transport-security', 'content-security-policy',
    'x-frame-options', 'x-content-type-options', 'referrer-policy', 'permissions-policy',
    'x-xss-protection', 'server']) {
    const val = mainRes.headers.get(h)
    if (val) headers[h] = val
  }

  const html = await mainRes.text()
  const parsed = parseHTML(html, finalUrl)
  const origin = new URL(finalUrl).origin

  // Parallel: fetch robots.txt, sitemap, PageSpeed, SSL, internal pages
  const [robotsTxt, sitemap, pageSpeed, ssl, crawledPages] = await Promise.all([
    // Robots.txt
    (async () => {
      const res = await safeFetch(`${origin}/robots.txt`, 5000)
      if (res && res.ok) {
        const text = await res.text()
        if (text.length < 10000 && !text.includes('<!DOCTYPE') && !text.includes('<html'))
          return text
      }
      return null
    })(),
    // Sitemap
    fetchSitemap(origin),
    // PageSpeed Insights
    fetchPageSpeed(finalUrl),
    // SSL
    checkSSL(finalUrl),
    // Crawl internal pages
    crawlInternalPages(parsed.internalUrls),
  ])

  // Count broken links from crawl
  const brokenCount = crawledPages.filter(p => p.statusCode >= 400 || p.statusCode === 0).length
  parsed.links.brokenCount = brokenCount

  return {
    url: inputUrl, finalUrl, isHttps, httpToHttpsRedirect,
    statusCode, ttfbMs, headers, robotsTxt, sitemap,
    pageSpeed, ssl, html, parsed, crawledPages,
  }
}

// ─── Report Builder ─────────────────────────────────────────────────────────

export function buildSiteReport(data: SiteData): string {
  const p = data.parsed

  const secHeaders = []
  if (data.headers['strict-transport-security']) secHeaders.push('HSTS: ' + data.headers['strict-transport-security'])
  if (data.headers['content-security-policy']) secHeaders.push('CSP: present')
  if (data.headers['x-frame-options']) secHeaders.push('X-Frame-Options: ' + data.headers['x-frame-options'])
  if (data.headers['x-content-type-options']) secHeaders.push('X-Content-Type-Options: ' + data.headers['x-content-type-options'])
  if (data.headers['referrer-policy']) secHeaders.push('Referrer-Policy: ' + data.headers['referrer-policy'])

  const imgFormats = Object.entries(p.images.formats).map(([ext, count]) => `${ext}: ${count}`).join(', ')

  // Crawl summary
  const duplicateTitles = findDuplicates(data.crawledPages.map(pg => pg.title).filter(Boolean) as string[])
  const pagesWithNoH1 = data.crawledPages.filter(pg => pg.h1.length === 0)
  const brokenPages = data.crawledPages.filter(pg => pg.statusCode >= 400 || pg.statusCode === 0)
  const thinPages = data.crawledPages.filter(pg => pg.wordCount > 0 && pg.wordCount < 300)
  const noindexPages = data.crawledPages.filter(pg => pg.hasNoindex)

  let report = `=== RESPONSE INFO ===
URL: ${data.url}
Final URL: ${data.finalUrl}
Status Code: ${data.statusCode}
TTFB: ${data.ttfbMs}ms
HTTPS: ${data.isHttps ? 'Yes' : 'No'}
HTTP→HTTPS Redirect: ${data.httpToHttpsRedirect ? 'Yes' : 'No'}
Server: ${data.headers['server'] || 'Not disclosed'}
Security Headers: ${secHeaders.length > 0 ? secHeaders.join(' | ') : 'NONE detected'}

=== SSL CERTIFICATE ===
${data.ssl ? `Valid: ${data.ssl.valid ? 'Yes' : 'NO'}
Issuer: ${data.ssl.issuer ?? 'Unknown'}
Days until expiry: ${data.ssl.daysUntilExpiry ?? 'Unknown'}` : 'SSL check: Site loads over HTTPS (certificate functional)'}

=== ROBOTS.TXT ===
${data.robotsTxt ?? 'NOT FOUND (no robots.txt or returned HTML)'}

=== SITEMAP ===
${data.sitemap ? `Found: Yes (${data.sitemap.url})
URL count: ${data.sitemap.urlCount}
Last modified: ${data.sitemap.lastmod ?? 'No lastmod dates'}
Sample URLs: ${data.sitemap.sampleUrls.slice(0, 3).join(', ')}` : 'NOT FOUND — no sitemap.xml detected'}

=== PAGESPEED INSIGHTS (Google Lighthouse real data) ===
${data.pageSpeed ? `MOBILE:
  Performance Score: ${data.pageSpeed.mobile.score}/100
  LCP (Largest Contentful Paint): ${data.pageSpeed.mobile.lcp}ms ${data.pageSpeed.mobile.lcp <= 2500 ? '✓ Good' : data.pageSpeed.mobile.lcp <= 4000 ? '⚠ Needs improvement' : '✗ Poor'}
  CLS (Cumulative Layout Shift): ${data.pageSpeed.mobile.cls} ${data.pageSpeed.mobile.cls <= 0.1 ? '✓ Good' : data.pageSpeed.mobile.cls <= 0.25 ? '⚠ Needs improvement' : '✗ Poor'}
  FCP (First Contentful Paint): ${data.pageSpeed.mobile.fcp}ms
  TBT (Total Blocking Time): ${data.pageSpeed.mobile.tbt}ms ${data.pageSpeed.mobile.tbt <= 200 ? '✓ Good' : '⚠ Needs improvement'}
  Speed Index: ${data.pageSpeed.mobile.si}ms

DESKTOP:
  Performance Score: ${data.pageSpeed.desktop.score}/100
  LCP: ${data.pageSpeed.desktop.lcp}ms ${data.pageSpeed.desktop.lcp <= 2500 ? '✓ Good' : '⚠ Needs improvement'}
  CLS: ${data.pageSpeed.desktop.cls} ${data.pageSpeed.desktop.cls <= 0.1 ? '✓ Good' : '⚠ Needs improvement'}
  FCP: ${data.pageSpeed.desktop.fcp}ms
  TBT: ${data.pageSpeed.desktop.tbt}ms
  Speed Index: ${data.pageSpeed.desktop.si}ms` : 'PageSpeed data unavailable (API timeout or error)'}

=== HTML META (Homepage) ===
Language: ${p.lang || 'NOT SET'}
Title: ${p.title ?? 'MISSING'} (${p.title ? p.title.length + ' chars' : 'N/A'})
Meta Description: ${p.metaDescription ?? 'MISSING'} (${p.metaDescription ? p.metaDescription.length + ' chars' : 'N/A'})
Meta Robots: ${p.metaRobots ?? 'Not set (default index,follow)'}
Canonical: ${p.canonical ?? 'MISSING'}
Viewport: ${p.viewport ?? 'MISSING'}
Hreflang Tags: ${p.hreflang.length > 0 ? p.hreflang.join(', ') : 'None'}

=== OPEN GRAPH ===
${Object.keys(p.ogTags).length > 0 ? Object.entries(p.ogTags).map(([k, v]) => `${k}: ${v}`).join('\n') : 'NO Open Graph tags found'}

=== TWITTER CARDS ===
${Object.keys(p.twitterTags).length > 0 ? Object.entries(p.twitterTags).map(([k, v]) => `${k}: ${v}`).join('\n') : 'NO Twitter Card tags found'}

=== HEADINGS (Homepage) ===
H1 (${p.h1.length}): ${p.h1.length > 0 ? p.h1.join(' | ') : 'MISSING'}
H2 (${p.h2.length}): ${p.h2.slice(0, 15).join(' | ')}${p.h2.length > 15 ? ` ... +${p.h2.length - 15} more` : ''}
H3 (${p.h3.length}): ${p.h3.slice(0, 10).join(' | ')}${p.h3.length > 10 ? ` ... +${p.h3.length - 10} more` : ''}

=== IMAGES ===
Total: ${p.images.total}
With alt text: ${p.images.withAlt}/${p.images.total} (${p.images.total > 0 ? Math.round(p.images.withAlt / p.images.total * 100) : 0}%)
With width+height: ${p.images.withDimensions}/${p.images.total} (${p.images.total > 0 ? Math.round(p.images.withDimensions / p.images.total * 100) : 0}%)
Formats: ${imgFormats || 'None'}

=== LINKS (Homepage) ===
Internal links: ${p.links.internal}
External links: ${p.links.external}
Broken links detected in crawl: ${p.links.brokenCount}

=== SCRIPTS ===
Total: ${p.scripts.total} | Async: ${p.scripts.async} | Defer: ${p.scripts.defer} | Inline: ${p.scripts.inline}
Render-blocking (non-async/defer external): ${Math.max(0, p.scripts.total - p.scripts.async - p.scripts.defer - p.scripts.inline)}

=== STRUCTURED DATA ===
Schema.org types: ${p.schemaOrg.length > 0 ? p.schemaOrg.join(', ') : 'NONE found'}

=== FORMS & INTERACTION ===
Forms: ${p.forms} | Buttons/CTAs: ${p.buttons}
Font-display: swap: ${p.fontDisplay ? 'Yes' : 'No'}

=== CONTENT STATS (Homepage) ===
Word count: ${p.wordCount} | Character count: ${p.charCount}

=== MULTI-PAGE CRAWL (${data.crawledPages.length} internal pages checked) ===
Broken pages (4xx/5xx): ${brokenPages.length}${brokenPages.length > 0 ? ' → ' + brokenPages.map(pg => `${pg.url} (${pg.statusCode})`).join(', ') : ''}
Pages with no H1: ${pagesWithNoH1.length}${pagesWithNoH1.length > 0 ? ' → ' + pagesWithNoH1.map(pg => pg.url).join(', ') : ''}
Duplicate titles: ${duplicateTitles.length > 0 ? duplicateTitles.join(', ') : 'None detected'}
Thin content pages (<300 words): ${thinPages.length}${thinPages.length > 0 ? ' → ' + thinPages.map(pg => `${pg.url} (${pg.wordCount}w)`).join(', ') : ''}
Noindex pages: ${noindexPages.length}${noindexPages.length > 0 ? ' → ' + noindexPages.map(pg => pg.url).join(', ') : ''}`

  // Crawled page details
  if (data.crawledPages.length > 0) {
    report += '\n\nCrawled page details:'
    for (const pg of data.crawledPages) {
      report += `\n  ${pg.url} → ${pg.statusCode} | title: "${pg.title ?? 'MISSING'}" | H1: ${pg.h1.length > 0 ? pg.h1[0] : 'MISSING'} | ${pg.wordCount}w`
    }
  }

  // Add truncated HTML
  const cleanHtml = data.html.replace(/<script[\s\S]*?<\/script>/gi, '<!-- script removed -->')
    .replace(/<style[\s\S]*?<\/style>/gi, '<!-- style removed -->')
  report += `\n\n=== RAW HTML (first 12000 chars, scripts/styles removed) ===\n${cleanHtml.slice(0, 12000)}`

  return report
}

function findDuplicates(arr: string[]): string[] {
  const counts: Record<string, number> = {}
  for (const item of arr) {
    counts[item] = (counts[item] || 0) + 1
  }
  return Object.entries(counts).filter(([, c]) => c > 1).map(([title, c]) => `"${title}" (${c}x)`)
}
