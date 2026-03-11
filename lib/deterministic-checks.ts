/**
 * Deterministic Audit Checks
 *
 * These checks run entirely in code — no LLM involved.
 * Same input ALWAYS produces same output.
 */

import type { SiteData } from './site-fetcher'

type Status = 'Pass' | 'Partial' | 'Fail' | 'N/A'
type CheckResult = Record<string, Status>

export function runDeterministicChecks(data: SiteData): CheckResult {
  const r: CheckResult = {}
  const p = data.parsed

  // ═══════════════════════════════════════════════════════════════════════════
  // TECHNICAL SEO
  // ═══════════════════════════════════════════════════════════════════════════

  // t1: robots.txt exists & is correct
  r.t1 = data.robotsTxt ? 'Pass' : 'Fail'

  // t2: XML sitemap exists & submitted to GSC (can only check existence)
  r.t2 = data.sitemap?.found ? 'Pass' : 'Fail'

  // t3: Sitemap up-to-date (< 30 days)
  if (!data.sitemap?.found) {
    r.t3 = 'Fail'
  } else if (data.sitemap.lastmod) {
    const lastmod = new Date(data.sitemap.lastmod)
    const daysSince = (Date.now() - lastmod.getTime()) / (1000 * 60 * 60 * 24)
    r.t3 = daysSince <= 30 ? 'Pass' : 'Fail'
  } else {
    r.t3 = 'Partial' // sitemap exists but no lastmod dates
  }

  // t4: No important pages are noindex
  const noindexPages = data.crawledPages.filter(pg => pg.hasNoindex)
  r.t4 = noindexPages.length === 0 ? 'Pass' : 'Fail'

  // t5: Canonical tags correctly implemented
  r.t5 = p.canonical ? 'Pass' : 'Fail'

  // t6: No orphan pages — need full crawl, check from our limited data
  r.t6 = 'N/A'

  // t7: Crawl depth ≤ 3 — need full crawl
  r.t7 = 'N/A'

  // t8: Pagination handled correctly
  const hasPagination = /<link[^>]*rel\s*=\s*["'](prev|next)["']/i.test(data.html)
  r.t8 = hasPagination ? 'Pass' : 'N/A' // N/A if no paginated content detected

  // t9: No redirect chains — need full crawl with redirect tracking
  r.t9 = 'N/A'

  // t10: No broken internal links (404s)
  const brokenPages = data.crawledPages.filter(pg => pg.statusCode >= 400 || pg.statusCode === 0)
  r.t10 = brokenPages.length === 0 ? 'Pass' : 'Fail'

  // t11: Hreflang tags correct
  if (p.hreflang.length > 0) {
    r.t11 = 'Pass'
  } else {
    r.t11 = 'N/A' // No international content
  }

  // t12: GSC crawl anomalies — requires GSC
  r.t12 = 'N/A'

  // t13: JavaScript not blocking key content
  const renderBlockingScripts = p.scripts.total - p.scripts.async - p.scripts.defer - p.scripts.inline
  r.t13 = renderBlockingScripts <= 2 ? 'Pass' : renderBlockingScripts <= 5 ? 'Partial' : 'Fail'

  // t14: URL structure clean and descriptive
  try {
    const urlPath = new URL(data.finalUrl).pathname
    const hasQueryParams = data.finalUrl.includes('?')
    const hasCleanPath = /^[a-z0-9\-\/\.]+$/i.test(urlPath)
    r.t14 = (!hasQueryParams && hasCleanPath) ? 'Pass' : 'Partial'
  } catch {
    r.t14 = 'Partial'
  }

  // t15-t19: Core Web Vitals & PageSpeed (from real Google data)
  if (data.pageSpeed) {
    const ps = data.pageSpeed
    r.t15 = ps.mobile.lcp <= 2500 ? 'Pass' : ps.mobile.lcp <= 4000 ? 'Partial' : 'Fail'
    r.t16 = ps.mobile.tbt <= 200 ? 'Pass' : ps.mobile.tbt <= 600 ? 'Partial' : 'Fail'
    r.t17 = ps.mobile.cls <= 0.1 ? 'Pass' : ps.mobile.cls <= 0.25 ? 'Partial' : 'Fail'
    r.t18 = ps.mobile.score >= 70 ? 'Pass' : ps.mobile.score >= 50 ? 'Partial' : 'Fail'
    r.t19 = ps.desktop.score >= 85 ? 'Pass' : ps.desktop.score >= 70 ? 'Partial' : 'Fail'
  } else {
    r.t15 = 'N/A'; r.t16 = 'N/A'; r.t17 = 'N/A'; r.t18 = 'N/A'; r.t19 = 'N/A'
  }

  // t20: Images use WebP/AVIF
  const imgFormats = p.images.formats
  const modernFormats = (imgFormats['webp'] || 0) + (imgFormats['avif'] || 0) + (imgFormats['svg'] || 0)
  const legacyFormats = (imgFormats['jpg'] || 0) + (imgFormats['jpeg'] || 0) + (imgFormats['png'] || 0) + (imgFormats['gif'] || 0)
  if (p.images.total === 0) r.t20 = 'N/A'
  else if (legacyFormats === 0) r.t20 = 'Pass'
  else if (modernFormats > legacyFormats) r.t20 = 'Partial'
  else r.t20 = 'Fail'

  // t21: Images have width & height attributes
  if (p.images.total === 0) r.t21 = 'N/A'
  else {
    const ratio = p.images.withDimensions / p.images.total
    r.t21 = ratio >= 0.8 ? 'Pass' : ratio >= 0.5 ? 'Partial' : 'Fail'
  }

  // t22: Lazy loading on below-fold images
  const lazyCount = (data.html.match(/loading\s*=\s*["']lazy["']/gi) || []).length
  if (p.images.total <= 2) r.t22 = 'N/A'
  else r.t22 = lazyCount > 0 ? 'Pass' : 'Fail'

  // t23: Render-blocking JS/CSS minimized
  r.t23 = renderBlockingScripts <= 1 ? 'Pass' : renderBlockingScripts <= 3 ? 'Partial' : 'Fail'

  // t24: TTFB < 800ms
  r.t24 = data.ttfbMs < 800 ? 'Pass' : data.ttfbMs < 1500 ? 'Partial' : 'Fail'

  // t25: Font loading optimized (font-display: swap)
  const hasFonts = /<link[^>]*fonts/i.test(data.html) || /@font-face/i.test(data.html)
  if (!hasFonts) r.t25 = 'N/A'
  else r.t25 = p.fontDisplay ? 'Pass' : 'Fail'

  // t26: Third-party scripts deferred or async
  const externalScripts = p.scripts.total - p.scripts.inline
  if (externalScripts === 0) r.t26 = 'Pass'
  else {
    const deferredRatio = (p.scripts.async + p.scripts.defer) / externalScripts
    r.t26 = deferredRatio >= 0.8 ? 'Pass' : deferredRatio >= 0.5 ? 'Partial' : 'Fail'
  }

  // t27: SSL certificate valid
  if (data.ssl) {
    if (!data.ssl.valid) r.t27 = 'Fail'
    else if (data.ssl.daysUntilExpiry !== null && data.ssl.daysUntilExpiry < 30) r.t27 = 'Partial'
    else r.t27 = 'Pass'
  } else {
    r.t27 = data.isHttps ? 'Pass' : 'Fail' // Fallback: if HTTPS works, SSL is valid
  }

  // t28: All pages served over HTTPS
  r.t28 = data.isHttps ? 'Pass' : 'Fail'

  // t29: HTTP → HTTPS redirect
  r.t29 = data.httpToHttpsRedirect ? 'Pass' : data.isHttps ? 'Partial' : 'Fail'

  // t30: www / non-www canonicalized
  r.t30 = p.canonical ? 'Pass' : 'Partial'

  // t31: HSTS header present
  r.t31 = data.headers['strict-transport-security'] ? 'Pass' : 'Fail'

  // t32: No mixed content
  const httpResources = (data.html.match(/(?:src|href)\s*=\s*["']http:\/\//gi) || []).length
  r.t32 = httpResources === 0 ? 'Pass' : 'Fail'

  // t33: Security headers present
  const secCount = ['content-security-policy', 'x-frame-options', 'x-content-type-options', 'referrer-policy']
    .filter(h => data.headers[h]).length
  r.t33 = secCount >= 3 ? 'Pass' : secCount >= 1 ? 'Partial' : 'Fail'

  // t34: No sensitive data exposed in source
  const sensitivePatterns = /(?:api[_-]?key|secret[_-]?key|password|access[_-]?token)\s*[:=]\s*["'][^"']{8,}/i
  r.t34 = sensitivePatterns.test(data.html) ? 'Fail' : 'Pass'

  // t35-t43: Structured Data / Schema
  const schemas = p.schemaOrg.map(s => s.toLowerCase())
  r.t35 = schemas.includes('organization') ? 'Pass' : 'Fail'
  r.t36 = schemas.includes('website') ? 'Pass' : 'Fail'
  r.t37 = schemas.includes('breadcrumblist') ? 'Pass' : 'N/A'
  r.t38 = schemas.includes('product') ? 'Pass' : 'N/A' // N/A if not e-commerce
  r.t39 = schemas.some(s => s.includes('article') || s.includes('blogposting')) ? 'Pass' : 'N/A'
  r.t40 = schemas.includes('faqpage') ? 'Pass' : 'N/A'
  r.t41 = schemas.some(s => s.includes('review') || s.includes('rating')) ? 'Pass' : 'N/A'
  r.t42 = 'N/A' // Requires GSC
  r.t43 = schemas.includes('localbusiness') ? 'Pass' : 'N/A'

  // t44: Mobile-first indexing compatible (viewport present)
  r.t44 = p.viewport ? 'Pass' : 'Fail'

  // t45: Viewport meta tag correct
  if (!p.viewport) r.t45 = 'Fail'
  else r.t45 = p.viewport.includes('width=device-width') ? 'Pass' : 'Partial'

  // t46: No horizontal scroll on mobile — can't check without rendering
  r.t46 = 'N/A'

  // t47: Touch targets ≥ 48px — can't check without rendering
  r.t47 = 'N/A'

  // t48: No intrusive interstitials
  // Check for common popup/modal patterns in HTML
  const hasPopup = /class\s*=\s*["'][^"']*(popup|modal|overlay|interstitial)[^"']*["']/i.test(data.html)
  r.t48 = hasPopup ? 'Partial' : 'Pass'

  // t49: AMP implemented (if news/article)
  const hasAmp = /<link[^>]*rel\s*=\s*["']amphtml["']/i.test(data.html)
  r.t49 = hasAmp ? 'Pass' : 'N/A'

  // t50: 404 page is helpful — can't fully check
  r.t50 = 'N/A'

  // t51: Thin content pages handled
  const thinPages = data.crawledPages.filter(pg => pg.wordCount > 0 && pg.wordCount < 300)
  r.t51 = thinPages.length === 0 ? 'Pass' : 'Fail'

  // t52: Duplicate content managed via canonicals
  const pagesWithCanonical = data.crawledPages.filter(pg => pg.canonical)
  r.t52 = p.canonical ? 'Pass' : 'Fail'

  // t53: Site language declared
  r.t53 = p.lang ? 'Pass' : 'Fail'

  // t54: International targeting in GSC
  r.t54 = 'N/A'

  // t55: CDN in use
  const cdnHeaders = ['x-cdn', 'cf-ray', 'x-cache', 'x-amz-cf-id', 'x-vercel-id', 'x-served-by']
  const hasCDN = cdnHeaders.some(h => data.headers[h.toLowerCase()]) ||
    /cloudflare|fastly|akamai|cloudfront|vercel|netlify/i.test(data.headers['server'] || '')
  r.t55 = hasCDN ? 'Pass' : 'Partial'

  // t56: Server response codes correct
  const badStatusPages = data.crawledPages.filter(pg => pg.statusCode >= 400)
  r.t56 = badStatusPages.length === 0 ? 'Pass' : 'Fail'

  // t57: Log file analysis
  r.t57 = 'N/A'

  // t58: Internal search pages blocked
  if (data.robotsTxt && /disallow:.*\/search/i.test(data.robotsTxt)) {
    r.t58 = 'Pass'
  } else {
    r.t58 = 'N/A' // No internal search detected or no robots.txt
  }

  // t59: Faceted navigation handled
  r.t59 = 'N/A' // Need deeper crawl

  // t60: Print CSS not indexed
  r.t60 = 'N/A'

  // t61: Session IDs not indexed
  const hasSessionIds = /[?&](session|sid|jsessionid|phpsessid)\s*=/i.test(data.finalUrl)
  r.t61 = hasSessionIds ? 'Fail' : 'Pass'

  // t62: Breadcrumb navigation present
  const hasBreadcrumb = /class\s*=\s*["'][^"']*(breadcrumb)[^"']*["']/i.test(data.html) ||
    schemas.includes('breadcrumblist')
  r.t62 = hasBreadcrumb ? 'Pass' : 'Fail'

  // t63: Sitemap excludes noindex/redirect URLs
  if (!data.sitemap?.found) r.t63 = 'N/A'
  else r.t63 = 'Pass' // Can't fully verify without comparing sitemap URLs vs noindex

  // t64: Site speed consistent — would need to test multiple pages
  r.t64 = 'N/A'

  // t65: AI content penalties
  r.t65 = 'N/A'

  // ═══════════════════════════════════════════════════════════════════════════
  // ON-PAGE & CONTENT
  // ═══════════════════════════════════════════════════════════════════════════

  // o1: Title tag exists
  r.o1 = p.title ? 'Pass' : 'Fail'

  // o2: Title length 50-60 chars
  if (!p.title) r.o2 = 'Fail'
  else if (p.title.length >= 50 && p.title.length <= 60) r.o2 = 'Pass'
  else if (p.title.length >= 30 && p.title.length <= 70) r.o2 = 'Partial'
  else r.o2 = 'Fail'

  // o3: Primary keyword in title — LLM needed
  // o4: Unique title tags
  const titles = [p.title, ...data.crawledPages.map(pg => pg.title)].filter(Boolean) as string[]
  const uniqueTitles = new Set(titles)
  r.o4 = uniqueTitles.size === titles.length ? 'Pass' : 'Fail'

  // o5: Meta description exists
  r.o5 = p.metaDescription ? 'Pass' : 'Fail'

  // o6, o7: Meta desc keywords/CTA — LLM needed

  // o8: No duplicate meta descriptions
  const descs = [p.metaDescription, ...data.crawledPages.map(pg => pg.metaDescription)].filter(Boolean) as string[]
  const uniqueDescs = new Set(descs)
  r.o8 = uniqueDescs.size === descs.length ? 'Pass' : 'Fail'

  // o9: OG tags present
  r.o9 = Object.keys(p.ogTags).length >= 3 ? 'Pass' : Object.keys(p.ogTags).length > 0 ? 'Partial' : 'Fail'

  // o10: Every page has exactly one H1
  r.o10 = p.h1.length === 1 ? 'Pass' : 'Fail'

  // o11: H1 contains primary keyword — LLM needed

  // o12: H1 differs from title
  if (!p.h1[0] || !p.title) r.o12 = 'N/A'
  else r.o12 = p.h1[0] !== p.title ? 'Pass' : 'Partial'

  // o13: Heading hierarchy correct
  const headingOrder = data.html.match(/<h[1-6][^>]*>/gi) || []
  let hierarchyOk = true
  let lastLevel = 0
  for (const h of headingOrder) {
    const level = parseInt(h.match(/h(\d)/i)?.[1] || '0')
    if (level > lastLevel + 1 && lastLevel > 0) { hierarchyOk = false; break }
    lastLevel = level
  }
  r.o13 = hierarchyOk ? 'Pass' : 'Fail'

  // o14-o20: Keyword-related — LLM needed

  // o21: Keyword cannibalization — N/A
  r.o21 = 'N/A'

  // o22-o26: Keyword-related — LLM needed

  // o27: Content length appropriate
  r.o27 = p.wordCount >= 1000 ? 'Pass' : p.wordCount >= 500 ? 'Partial' : p.wordCount >= 100 ? 'Fail' : 'Fail'

  // o28: Content original — can't check
  r.o28 = 'N/A'

  // o29: Content freshness
  const datePatterns = data.html.match(/\b20[2][0-9]-[01]\d-[0-3]\d\b/g)
  if (datePatterns && datePatterns.length > 0) {
    const latestDate = datePatterns.sort().reverse()[0]
    const days = (Date.now() - new Date(latestDate).getTime()) / (1000 * 60 * 60 * 24)
    r.o29 = days <= 90 ? 'Pass' : days <= 365 ? 'Partial' : 'Fail'
  } else {
    r.o29 = 'N/A'
  }

  // o30: Thin content improved
  r.o30 = p.wordCount >= 300 ? 'Pass' : 'Fail'

  // o31-o36: Content quality — LLM needed

  // o37: Internal linking strategy
  r.o37 = p.links.internal >= 10 ? 'Pass' : p.links.internal >= 3 ? 'Partial' : 'Fail'

  // o38: Anchor text descriptive — LLM needed

  // o39: No broken internal links
  r.o39 = brokenPages.length === 0 ? 'Pass' : 'Fail'

  // o40: Important pages linked from homepage
  r.o40 = p.links.internal >= 5 ? 'Pass' : 'Partial'

  // o41: Content links to internal resources
  r.o41 = p.links.internal >= 3 ? 'Pass' : 'Fail'

  // o42: No excessive links
  const totalLinks = p.links.internal + p.links.external
  r.o42 = totalLinks <= 100 ? 'Pass' : totalLinks <= 200 ? 'Partial' : 'Fail'

  // o43: Navigation consistent — need multi-page comparison
  r.o43 = 'N/A'

  // o44: External links open in new tab
  const externalLinksWithTarget = (data.html.match(/<a[^>]*target\s*=\s*["']_blank["'][^>]*>/gi) || []).length
  if (p.links.external === 0) r.o44 = 'N/A'
  else r.o44 = externalLinksWithTarget >= p.links.external * 0.5 ? 'Pass' : 'Partial'

  // o45: Author bios — check for author elements
  const hasAuthor = /class\s*=\s*["'][^"']*(author|byline)[^"']*["']/i.test(data.html) ||
    schemas.some(s => s.includes('person'))
  r.o45 = hasAuthor ? 'Pass' : 'N/A' // N/A if not a blog/article site

  // o46: About page — check if linked
  const hasAboutLink = /href\s*=\s*["'][^"']*(\/about|\/hakkimizda|\/biz-kimiz)[^"']*["']/i.test(data.html)
  r.o46 = hasAboutLink ? 'Pass' : 'Fail'

  // o47: Contact info visible
  const hasPhone = /(?:tel:|phone|telefon)[^<]*/i.test(data.html)
  const hasEmail = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/i.test(data.html)
  const hasAddress = /(?:address|adres)/i.test(data.html)
  const contactCount = [hasPhone, hasEmail, hasAddress].filter(Boolean).length
  r.o47 = contactCount >= 2 ? 'Pass' : contactCount >= 1 ? 'Partial' : 'Fail'

  // o48: Trust signals — LLM needed

  // o49: Privacy policy and terms
  const hasPrivacy = /href\s*=\s*["'][^"']*(privacy|gizlilik|kvkk)[^"']*["']/i.test(data.html)
  const hasTerms = /href\s*=\s*["'][^"']*(terms|kosullar|kullanim)[^"']*["']/i.test(data.html)
  r.o49 = hasPrivacy && hasTerms ? 'Pass' : hasPrivacy || hasTerms ? 'Partial' : 'Fail'

  // o50: External links to authoritative sources — LLM needed

  // ═══════════════════════════════════════════════════════════════════════════
  // UX HEURISTICS
  // ═══════════════════════════════════════════════════════════════════════════

  // Most UX items need interactive testing. We can check a few from HTML:

  // u1: System status visible (loading, progress) — can't fully check
  r.u1 = 'N/A'

  // u2: Inline form validation — check for validation attributes
  const hasValidation = /required|pattern\s*=|type\s*=\s*["']email["']/i.test(data.html)
  r.u2 = p.forms > 0 ? (hasValidation ? 'Pass' : 'Fail') : 'N/A'

  // u3: Async loading state — can't check
  r.u3 = 'N/A'

  // u4: No jargon — LLM needed

  // u5: Icons have labels — can't reliably check
  r.u5 = 'N/A'

  // u6-u7: Undo/back button — can't check
  r.u6 = 'N/A'; r.u7 = 'N/A'

  // u8: Visual consistency — need multi-page comparison
  r.u8 = 'N/A'

  // u9-u10: Terminology/button consistency — need multi-page
  r.u9 = 'N/A'; r.u10 = 'N/A'

  // u11: Destructive actions confirmation — can't check
  r.u11 = 'N/A'

  // u12: Required field indicators
  if (p.forms === 0) r.u12 = 'N/A'
  else r.u12 = /required|aria-required|class\s*=\s*["'][^"']*required/i.test(data.html) ? 'Pass' : 'Fail'

  // u13: Password show/hide — check for password fields
  const hasPasswordField = /type\s*=\s*["']password["']/i.test(data.html)
  r.u13 = hasPasswordField ? 'Partial' : 'N/A'

  // u14: Input format hints
  if (p.forms === 0) r.u14 = 'N/A'
  else r.u14 = /placeholder\s*=/i.test(data.html) ? 'Pass' : 'Partial'

  // u15: Navigation always visible
  const hasNav = /<nav[^>]*>/i.test(data.html) || /<header[^>]*>/i.test(data.html)
  r.u15 = hasNav ? 'Pass' : 'Fail'

  // u16: Search prominently placed
  const hasSearch = /type\s*=\s*["']search["']|class\s*=\s*["'][^"']*search[^"']*["']|name\s*=\s*["'][^"']*search/i.test(data.html)
  r.u16 = hasSearch ? 'Pass' : 'Partial'

  // u17: Keyboard shortcuts documented
  r.u17 = 'N/A' // Low priority

  // u18: Help/tutorial available
  r.u18 = 'N/A'

  // u19: Minimal design — LLM needed

  // u20: Visual hierarchy — LLM needed

  // u21-u22: Error messages — can't check
  r.u21 = 'N/A'; r.u22 = 'N/A'

  // u23: New users can complete task — can't check
  r.u23 = 'N/A'

  // u24: Familiar UI patterns — LLM needed

  // u25: Navigation labels clear — LLM needed

  // u26: Active nav state
  const hasActiveState = /class\s*=\s*["'][^"']*(active|current|selected)[^"']*["']/i.test(data.html)
  r.u26 = hasActiveState ? 'Pass' : 'Partial'

  // u27: Breadcrumbs on inner pages
  r.u27 = hasBreadcrumb ? 'Pass' : 'Partial'

  // u28: Footer navigation
  const hasFooter = /<footer[^>]*>/i.test(data.html)
  r.u28 = hasFooter ? 'Pass' : 'Fail'

  // u29: Search results — can't check
  r.u29 = 'N/A'

  // u30: 404 page — can't fully check
  r.u30 = 'N/A'

  // u31: Mega menu usable on touch — can't check
  r.u31 = 'N/A'

  // u32: IA tested with users
  r.u32 = 'N/A'

  // u33: Color contrast — can't check without rendering
  r.u33 = 'N/A'

  // u34: All images have descriptive alt text
  if (p.images.total === 0) r.u34 = 'N/A'
  else {
    const altRatio = p.images.withAlt / p.images.total
    r.u34 = altRatio >= 0.9 ? 'Pass' : altRatio >= 0.5 ? 'Partial' : 'Fail'
  }

  // u35: Keyboard navigable
  const hasTabindex = /tabindex\s*=/i.test(data.html)
  const hasFocusStyles = /:focus/i.test(data.html)
  r.u35 = (hasTabindex || hasFocusStyles) ? 'Pass' : 'Partial'

  // u36: Focus indicators visible
  r.u36 = hasFocusStyles ? 'Pass' : 'Partial'

  // u37: ARIA labels
  const ariaCount = (data.html.match(/aria-label\s*=/gi) || []).length
  r.u37 = ariaCount >= 3 ? 'Pass' : ariaCount > 0 ? 'Partial' : 'Fail'

  // u38: Mobile nav thumb-friendly — can't check without rendering
  r.u38 = p.viewport ? 'Partial' : 'Fail' // If viewport exists, at least they thought about mobile

  // u39: Forms optimized for mobile input
  if (p.forms === 0) r.u39 = 'N/A'
  else {
    const hasInputTypes = /type\s*=\s*["'](email|tel|number|date|url)["']/i.test(data.html)
    r.u39 = hasInputTypes ? 'Pass' : 'Partial'
  }

  // u40: Content priority on mobile — can't check
  r.u40 = 'N/A'

  // ═══════════════════════════════════════════════════════════════════════════
  // CONVERSION & CTA
  // ═══════════════════════════════════════════════════════════════════════════

  // c1: Primary CTA visible above fold — check first 2000 chars of body
  const bodyStart = data.html.match(/<body[^>]*>([\s\S]{0,3000})/i)?.[1] || ''
  const hasCTAAboveFold = /<(button|a)[^>]*class\s*=\s*["'][^"']*(btn|button|cta)[^"']*["'][^>]*>/i.test(bodyStart) ||
    /<button[^>]*>/i.test(bodyStart)
  r.c1 = hasCTAAboveFold ? 'Pass' : 'Fail'

  // c2: CTA copy action-oriented — LLM needed

  // c3: CTA has strong contrast — can't check without rendering
  r.c3 = 'N/A'

  // c4: Single primary CTA per section — LLM needed

  // c5: CTA repeated on long pages
  const buttonMatches = data.html.match(/<(button|a)[^>]*class\s*=\s*["'][^"']*(btn|button|cta)[^"']*["'][^>]*>/gi) || []
  r.c5 = buttonMatches.length >= 2 ? 'Pass' : 'Partial'

  // c6: Hover/active states — can't check without rendering
  r.c6 = 'N/A'

  // c7: CTA tested across devices — can't check
  r.c7 = 'N/A'

  // c8: Sticky CTA on mobile
  const hasStickyElement = /(?:position\s*:\s*(?:sticky|fixed))|(?:class\s*=\s*["'][^"']*(?:sticky|fixed)[^"']*["'])/i.test(data.html)
  r.c8 = hasStickyElement ? 'Pass' : 'Partial'

  // c9: Customer testimonials — check for testimonial-like content
  const hasTestimonials = /class\s*=\s*["'][^"']*(testimonial|review|feedback|yorum)[^"']*["']/i.test(data.html)
  r.c9 = hasTestimonials ? 'Pass' : 'Fail'

  // c10: Social proof
  const hasSocialProof = /class\s*=\s*["'][^"']*(client|partner|logo|trusted|brand)[^"']*["']/i.test(data.html)
  r.c10 = hasSocialProof ? 'Pass' : 'Partial'

  // c11: Trust badges
  const hasTrustBadges = /class\s*=\s*["'][^"']*(trust|badge|secure|guarantee|güven)[^"']*["']/i.test(data.html)
  r.c11 = hasTrustBadges ? 'Pass' : 'Partial'

  // c12: Pricing clear — check for pricing elements
  const hasPricing = /class\s*=\s*["'][^"']*(pricing|price|fiyat)[^"']*["']/i.test(data.html) ||
    /\$\d+|\€\d+|₺\d+/i.test(data.html)
  r.c12 = hasPricing ? 'Pass' : 'N/A' // N/A if no pricing on this page

  // c13: Risk reversal (free trial, guarantee)
  const hasRiskReversal = /(free trial|money.?back|guarantee|ücretsiz deneme|garanti|iade)/i.test(data.html)
  r.c13 = hasRiskReversal ? 'Pass' : 'N/A'

  // c14: Case studies
  const hasCaseStudies = /class\s*=\s*["'][^"']*(case.?stud|success.?stor|başarı)[^"']*["']/i.test(data.html)
  r.c14 = hasCaseStudies ? 'Pass' : 'N/A'

  // c15: Third-party reviews
  const hasThirdPartyReview = /(trustpilot|g2|capterra|google.?review|yandex|sikayetvar)/i.test(data.html)
  r.c15 = hasThirdPartyReview ? 'Pass' : 'N/A'

  // c16: Contact info in conversion flow
  r.c16 = (hasPhone || hasEmail) ? 'Pass' : 'Fail'

  // c17: Minimal form fields
  if (p.forms === 0) r.c17 = 'N/A'
  else {
    const inputCount = (data.html.match(/<input[^>]*type\s*=\s*["'](?!hidden|submit|button)/gi) || []).length
    r.c17 = inputCount <= 5 ? 'Pass' : inputCount <= 8 ? 'Partial' : 'Fail'
  }

  // c18: Form progress for multi-step
  r.c18 = 'N/A' // Can't check without interaction

  // c19: Auto-fill supported
  if (p.forms === 0) r.c19 = 'N/A'
  else {
    const hasAutocomplete = /autocomplete\s*=/i.test(data.html)
    r.c19 = hasAutocomplete ? 'Pass' : 'Partial'
  }

  // c20: Form errors inline — can't check without interaction
  r.c20 = 'N/A'

  // c21: Thank you page — can't check
  r.c21 = 'N/A'

  // c22: Guest checkout
  r.c22 = 'N/A' // E-commerce specific

  // c23: Checkout steps minimized
  r.c23 = 'N/A' // E-commerce specific

  // c24: Mobile conversion flow tested
  r.c24 = p.viewport ? 'Partial' : 'Fail'

  // c25: Apple Pay / Google Pay
  r.c25 = 'N/A'

  // c26: Click-to-call
  const hasClickToCall = /href\s*=\s*["']tel:/i.test(data.html)
  r.c26 = hasClickToCall ? 'Pass' : hasPhone ? 'Partial' : 'N/A'

  // c27: Mobile popups don't obstruct
  r.c27 = hasPopup ? 'Partial' : 'Pass'

  // c28: Mobile page load < 3s
  if (data.pageSpeed) {
    const totalLoad = data.pageSpeed.mobile.lcp
    r.c28 = totalLoad <= 3000 ? 'Pass' : totalLoad <= 5000 ? 'Partial' : 'Fail'
  } else {
    r.c28 = data.ttfbMs < 1500 ? 'Partial' : 'Fail'
  }

  // c29-c32: Analytics tools — N/A
  r.c29 = 'N/A'; r.c30 = 'N/A'; r.c31 = 'N/A'; r.c32 = 'N/A'

  // c33: Hero section value prop — LLM needed

  // c34: Pricing comparison table
  const hasPricingTable = /class\s*=\s*["'][^"']*(pricing|plan|comparison)[^"']*["']/i.test(data.html)
  r.c34 = hasPricingTable ? 'Pass' : 'N/A'

  // c35: Exit intent
  const hasExitIntent = /exit.?intent|mouseout|mouseleave/i.test(data.html)
  r.c35 = hasExitIntent ? 'Pass' : 'N/A'

  // ═══════════════════════════════════════════════════════════════════════════
  // SERP & AEO (requires SerpApi data — gracefully N/A if not available)
  // ═══════════════════════════════════════════════════════════════════════════

  if (!data.serp) {
    // No SerpApi key configured — mark all N/A
    r.serp1 = 'N/A'; r.serp2 = 'N/A'; r.serp3 = 'N/A'
    r.serp4 = 'N/A'; r.serp5 = 'N/A'; r.serp6 = 'N/A'
    r.serp7 = 'N/A'; r.serp8 = 'N/A'
    r.serp9 = 'N/A'; r.serp10 = 'N/A'; r.serp11 = 'N/A'
  } else {
    const s = data.serp

    // serp1: Site appears in Google top 10
    r.serp1 = s.siteAppearsInSERP
      ? (s.siteRank && s.siteRank <= 3 ? 'Pass' : 'Partial')
      : 'Fail'

    // serp2: SERP intent matches content type
    // We check if page content type (word count / structure) fits the detected intent
    if (s.intentType === 'informational') {
      // Informational → should have decent word count and headings
      r.serp2 = p.wordCount >= 600 && p.h2.length >= 2 ? 'Pass' : 'Partial'
    } else if (s.intentType === 'transactional') {
      // Transactional → should have buttons/CTAs and forms
      r.serp2 = p.buttons >= 2 || p.forms >= 1 ? 'Pass' : 'Partial'
    } else if (s.intentType === 'commercial') {
      // Commercial → should have comparison elements or reviews
      r.serp2 = /review|compar|vs\b|best|top/i.test(data.html) ? 'Pass' : 'Partial'
    } else {
      r.serp2 = 'Partial'
    }

    // serp3: Content depth ≥ competitor average (top 3)
    if (s.competitorAvgWords > 0) {
      const ratio = p.wordCount / s.competitorAvgWords
      r.serp3 = ratio >= 1.0 ? 'Pass' : ratio >= 0.7 ? 'Partial' : 'Fail'
    } else {
      r.serp3 = 'N/A'
    }

    // serp4: Featured snippet / AEO opportunity
    // If featured snippet exists → check if we have Q&A structure
    if (s.hasFeatureSnippet || s.hasAnswerBox) {
      const hasQAStructure = p.h2.some(h => /\?|what|how|why|when|who/i.test(h))
        || /\b(what|how|why|when|is|are|does|do)\b.{10,50}\?/i.test(data.html)
      r.serp4 = hasQAStructure ? 'Pass' : 'Partial'
    } else {
      r.serp4 = 'N/A' // No featured snippet in SERP, not applicable
    }

    // serp5: People Also Ask → FAQ schema
    if (s.hasPeopleAlsoAsk) {
      const hasFaqSchema = p.schemaOrg.some(s => /faq|question/i.test(s))
      r.serp5 = hasFaqSchema ? 'Pass' : 'Fail'
    } else {
      r.serp5 = 'N/A'
    }

    // serp6: Content answers a clear question
    // Check if H1 or title is a question or direct keyword phrase
    const h1Text = p.h1[0] || p.title || ''
    const isQuestion = /\?|what|how|why|best|guide|top|vs\b/i.test(h1Text)
    r.serp6 = isQuestion ? 'Pass' : p.wordCount > 300 ? 'Partial' : 'Fail'

    // serp7: Content in short scannable chunks
    const avgWordsPerHeading = p.h2.length > 0 ? p.wordCount / p.h2.length : p.wordCount
    r.serp7 = avgWordsPerHeading <= 300 ? 'Pass' : avgWordsPerHeading <= 500 ? 'Partial' : 'Fail'

    // serp8: Title has emotional trigger / power word
    const titleLower = (p.title || '').toLowerCase()
    const powerWords = /best|top|ultimate|complete|proven|guide|\d{4}|\d+\s*(tips|ways|steps|reasons)|free|easy|fast|simple/i
    r.serp8 = powerWords.test(titleLower) ? 'Pass' : 'Partial'

    // ── Google AI Overview (AIO) checks ──────────────────────────────────────

    // serp9: AI Overview detected for this keyword
    // If AIO is present, it's an opportunity signal — not inherently good or bad
    r.serp9 = s.hasAIOverview ? 'Pass' : 'N/A'

    // serp10: Site cited as source in AI Overview
    if (s.hasAIOverview) {
      r.serp10 = s.siteInAIOverview ? 'Pass' : 'Fail'
    } else {
      r.serp10 = 'N/A' // No AIO for this keyword
    }

    // serp11: Content structured for AI answer extraction
    // Check: short direct intro, use of lists/tables, clear H2 questions
    const hasDirectAnswer = p.wordCount > 0 && p.h2.length >= 1
    const hasListOrTable = /<(ul|ol|table)/i.test(data.html)
    const hasQuestionHeadings = p.h2.some(h => /\?|what|how|why|when|who|which|is |are |does /i.test(h))
    const aioSignals = [hasDirectAnswer, hasListOrTable, hasQuestionHeadings].filter(Boolean).length
    r.serp11 = aioSignals >= 3 ? 'Pass' : aioSignals >= 1 ? 'Partial' : 'Fail'
  }

  return r
}

/**
 * Returns the list of item IDs that need LLM evaluation.
 * These are items NOT covered by deterministic checks.
 */
export function getLLMItems(): string[] {
  return [
    // On-Page: keyword & content quality
    'o3',  // Primary keyword in title
    'o6',  // Meta desc has keywords
    'o7',  // Meta desc has CTA
    'o11', // H1 contains keyword
    'o14', // H2s contain secondary keywords
    'o15', // Headings descriptive
    'o16', // FAQ sections use H2/H3 for questions
    'o17', // No keyword stuffing
    'o18', // Keyword in first 100 words
    'o19', // Keyword density natural
    'o20', // LSI/semantic keywords
    'o22', // Keyword in alt text
    'o23', // Keyword in URL
    'o24', // Long-tail variations
    'o25', // Featured snippet optimization
    'o26', // Search intent matched
    'o31', // Uses data/stats
    'o32', // Comprehensive coverage
    'o33', // Readability
    'o34', // Visual content included
    'o35', // Answers user questions
    'o36', // No unreviewed AI content
    'o38', // Anchor text descriptive
    'o48', // Trust signals
    'o50', // External links authoritative
    // UX: subjective assessments
    'u4',  // No jargon
    'u19', // Minimal design
    'u20', // Visual hierarchy
    'u24', // Familiar UI patterns
    'u25', // Navigation labels clear
    // CRO: content quality
    'c2',  // CTA copy action-oriented
    'c4',  // Single primary CTA
    'c33', // Hero value prop in 5 secs
  ]
}
