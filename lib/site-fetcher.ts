export interface SiteData {
  url: string
  finalUrl: string
  isHttps: boolean
  httpToHttpsRedirect: boolean
  statusCode: number
  ttfbMs: number
  headers: Record<string, string>
  robotsTxt: string | null
  html: string
  parsed: ParsedHTML
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
  links: { internal: number; external: number; broken: string[] }
  scripts: { total: number; async: number; defer: number; inline: number }
  stylesheets: number
  forms: number
  buttons: number
  schemaOrg: string[]
  fontDisplay: boolean
  lang: string | null
  charCount: number
  wordCount: number
}

function extractAttr(html: string, tagPattern: RegExp, attr: string): string | null {
  const match = html.match(tagPattern)
  if (!match) return null
  const attrMatch = match[0].match(new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, 'i'))
  return attrMatch ? attrMatch[1] : null
}

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
  const ogMatches = html.matchAll(/<meta[^>]*property\s*=\s*["'](og:[^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi)
  for (const m of ogMatches) ogTags[m[1]] = m[2]
  const ogMatches2 = html.matchAll(/<meta[^>]*content\s*=\s*["']([^"']*)["'][^>]*property\s*=\s*["'](og:[^"']*)["'][^>]*>/gi)
  for (const m of ogMatches2) ogTags[m[2]] = m[1]

  const twitterTags: Record<string, string> = {}
  const twMatches = html.matchAll(/<meta[^>]*(?:name|property)\s*=\s*["'](twitter:[^"']*)["'][^>]*content\s*=\s*["']([^"']*)["'][^>]*>/gi)
  for (const m of twMatches) twitterTags[m[1]] = m[2]

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
  const linkTags = html.match(/<a[^>]*href\s*=\s*["']([^"']*)["'][^>]*>/gi) || []
  let internal = 0, external = 0
  for (const link of linkTags) {
    const hrefMatch = link.match(/href\s*=\s*["']([^"']*)["']/i)
    if (!hrefMatch) continue
    const href = hrefMatch[1]
    if (href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) continue
    try {
      const linkUrl = new URL(href, siteUrl)
      if (linkUrl.hostname === host) internal++
      else external++
    } catch {
      internal++ // relative links
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
  const jsonLdMatches = html.match(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || []
  const schemaOrg: string[] = []
  for (const block of jsonLdMatches) {
    const content = block.replace(/<script[^>]*>|<\/script>/gi, '').trim()
    try {
      const parsed = JSON.parse(content)
      if (parsed['@type']) schemaOrg.push(parsed['@type'])
      if (Array.isArray(parsed['@graph'])) {
        for (const item of parsed['@graph']) {
          if (item['@type']) schemaOrg.push(item['@type'])
        }
      }
    } catch { /* ignore parse errors */ }
  }

  const fontDisplay = /font-display\s*:\s*swap/i.test(html)

  const langMatch = html.match(/<html[^>]*\blang\s*=\s*["']([^"']*)["']/i)
  const lang = langMatch ? langMatch[1] : null

  const textContent = html.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  const charCount = textContent.length
  const wordCount = textContent.split(/\s+/).filter(w => w.length > 0).length

  return {
    title, metaDescription, metaRobots, canonical, hreflang, viewport,
    ogTags, twitterTags, h1, h2, h3,
    images: { total: imgTags.length, withAlt, withDimensions, formats },
    links: { internal, external, broken: [] },
    scripts: { total: scriptTags.length, async: asyncCount, defer: deferCount, inline: inlineCount },
    stylesheets, forms: formCount, buttons: buttonCount,
    schemaOrg, fontDisplay, lang, charCount, wordCount,
  }
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

export async function fetchSiteData(inputUrl: string): Promise<SiteData> {
  // Normalize URL
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
        signal: controller.signal,
        redirect: 'manual',
        headers: { 'User-Agent': 'AuditPro/1.0 (SEO Audit Bot)' },
      })
      clearTimeout(timer)
      const location = httpRes.headers.get('location') || ''
      httpToHttpsRedirect = location.startsWith('https://')
    } catch {
      // Can't check, assume false
    }
  }

  // Fetch main page
  const startTime = Date.now()
  const mainRes = await safeFetch(url)
  const ttfbMs = Date.now() - startTime

  if (!mainRes) {
    throw new Error(`Could not fetch ${url}`)
  }

  const statusCode = mainRes.status
  const finalUrl = mainRes.url
  const isHttps = finalUrl.startsWith('https://')

  const headers: Record<string, string> = {}
  const importantHeaders = [
    'content-type', 'strict-transport-security', 'content-security-policy',
    'x-frame-options', 'x-content-type-options', 'referrer-policy',
    'permissions-policy', 'x-xss-protection', 'server',
  ]
  for (const h of importantHeaders) {
    const val = mainRes.headers.get(h)
    if (val) headers[h] = val
  }

  const html = await mainRes.text()

  // Fetch robots.txt
  let robotsTxt: string | null = null
  try {
    const origin = new URL(finalUrl).origin
    const robotsRes = await safeFetch(`${origin}/robots.txt`, 5000)
    if (robotsRes && robotsRes.ok) {
      const text = await robotsRes.text()
      if (text.length < 10000 && !text.includes('<!DOCTYPE') && !text.includes('<html')) {
        robotsTxt = text
      }
    }
  } catch { /* ignore */ }

  const parsed = parseHTML(html, finalUrl)

  return {
    url: inputUrl,
    finalUrl,
    isHttps,
    httpToHttpsRedirect,
    statusCode,
    ttfbMs,
    headers,
    robotsTxt,
    html,
    parsed,
  }
}

export function buildSiteReport(data: SiteData): string {
  const p = data.parsed
  const secHeaders = []
  if (data.headers['strict-transport-security']) secHeaders.push('HSTS: ' + data.headers['strict-transport-security'])
  if (data.headers['content-security-policy']) secHeaders.push('CSP: present')
  if (data.headers['x-frame-options']) secHeaders.push('X-Frame-Options: ' + data.headers['x-frame-options'])
  if (data.headers['x-content-type-options']) secHeaders.push('X-Content-Type-Options: ' + data.headers['x-content-type-options'])
  if (data.headers['referrer-policy']) secHeaders.push('Referrer-Policy: ' + data.headers['referrer-policy'])

  const imgFormats = Object.entries(p.images.formats).map(([ext, count]) => `${ext}: ${count}`).join(', ')

  let report = `=== RESPONSE INFO ===
URL: ${data.url}
Final URL: ${data.finalUrl}
Status Code: ${data.statusCode}
TTFB: ${data.ttfbMs}ms
HTTPS: ${data.isHttps ? 'Yes' : 'No'}
HTTP→HTTPS Redirect: ${data.httpToHttpsRedirect ? 'Yes' : 'No'}
Server: ${data.headers['server'] || 'Not disclosed'}
Security Headers: ${secHeaders.length > 0 ? secHeaders.join(' | ') : 'NONE detected'}

=== ROBOTS.TXT ===
${data.robotsTxt ?? 'NOT FOUND (no robots.txt or returned HTML)'}

=== HTML META ===
Language: ${p.lang || 'NOT SET'}
Title: ${p.title ?? 'MISSING'}
Title Length: ${p.title ? p.title.length + ' chars' : 'N/A'}
Meta Description: ${p.metaDescription ?? 'MISSING'}
Meta Description Length: ${p.metaDescription ? p.metaDescription.length + ' chars' : 'N/A'}
Meta Robots: ${p.metaRobots ?? 'Not set (default index,follow)'}
Canonical: ${p.canonical ?? 'MISSING'}
Viewport: ${p.viewport ?? 'MISSING'}
Hreflang Tags: ${p.hreflang.length > 0 ? p.hreflang.join(', ') : 'None'}

=== OPEN GRAPH ===
${Object.keys(p.ogTags).length > 0 ? Object.entries(p.ogTags).map(([k, v]) => `${k}: ${v}`).join('\n') : 'NO Open Graph tags found'}

=== TWITTER CARDS ===
${Object.keys(p.twitterTags).length > 0 ? Object.entries(p.twitterTags).map(([k, v]) => `${k}: ${v}`).join('\n') : 'NO Twitter Card tags found'}

=== HEADINGS ===
H1 (${p.h1.length}): ${p.h1.length > 0 ? p.h1.join(' | ') : 'MISSING'}
H2 (${p.h2.length}): ${p.h2.slice(0, 15).join(' | ')}${p.h2.length > 15 ? ` ... +${p.h2.length - 15} more` : ''}
H3 (${p.h3.length}): ${p.h3.slice(0, 10).join(' | ')}${p.h3.length > 10 ? ` ... +${p.h3.length - 10} more` : ''}

=== IMAGES ===
Total: ${p.images.total}
With alt text: ${p.images.withAlt} (${p.images.total > 0 ? Math.round(p.images.withAlt / p.images.total * 100) : 0}%)
With width+height: ${p.images.withDimensions} (${p.images.total > 0 ? Math.round(p.images.withDimensions / p.images.total * 100) : 0}%)
Formats: ${imgFormats || 'None'}

=== LINKS ===
Internal links: ${p.links.internal}
External links: ${p.links.external}

=== SCRIPTS ===
Total: ${p.scripts.total}
Async: ${p.scripts.async}
Defer: ${p.scripts.defer}
Inline: ${p.scripts.inline}
Non-async/defer external: ${p.scripts.total - p.scripts.async - p.scripts.defer - p.scripts.inline}

=== STYLESHEETS ===
External stylesheets: ${p.stylesheets}

=== STRUCTURED DATA ===
Schema.org types: ${p.schemaOrg.length > 0 ? p.schemaOrg.join(', ') : 'NONE found'}

=== FORMS & INTERACTION ===
Forms: ${p.forms}
Buttons/CTAs: ${p.buttons}
Font-display: swap detected: ${p.fontDisplay ? 'Yes' : 'No'}

=== CONTENT STATS ===
Word count: ${p.wordCount}
Character count: ${p.charCount}`

  // Add truncated HTML for Claude to inspect directly
  const cleanHtml = data.html.replace(/<script[\s\S]*?<\/script>/gi, '<!-- script removed -->')
    .replace(/<style[\s\S]*?<\/style>/gi, '<!-- style removed -->')
  const truncated = cleanHtml.slice(0, 15000)
  report += `\n\n=== RAW HTML (first 15000 chars, scripts/styles removed) ===\n${truncated}`

  return report
}
