import AdmZip from 'adm-zip'
import { parseHTML } from './site-fetcher'
import type { SiteData, CrawledPage } from './site-fetcher'

export function buildSiteDataFromZip(buffer: Buffer, zipFilename: string): SiteData {
  const zip = new AdmZip(buffer)
  const entries = zip.getEntries()

  const htmlEntries = entries.filter(
    e => !e.isDirectory && /\.html?$/i.test(e.entryName)
  )

  if (htmlEntries.length === 0) throw new Error('Zip içinde HTML dosyası bulunamadı')

  const mainEntry =
    htmlEntries.find(e => e.entryName === 'index.html' || e.entryName.endsWith('/index.html')) ??
    htmlEntries[0]

  const mainHtml = mainEntry.getData().toString('utf-8')
  const fakeUrl = `zip://${zipFilename}`
  const parsed = parseHTML(mainHtml, fakeUrl)

  // robots.txt / sitemap in zip
  const robotsEntry = entries.find(e => e.entryName === 'robots.txt')
  const robotsTxt = robotsEntry ? robotsEntry.getData().toString('utf-8') : null

  const sitemapEntry = entries.find(
    e => e.entryName === 'sitemap.xml' || e.entryName.endsWith('/sitemap.xml')
  )

  const crawledPages: CrawledPage[] = htmlEntries
    .filter(e => e !== mainEntry)
    .slice(0, 20)
    .map(e => {
      const html = e.getData().toString('utf-8')
      const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
      const title = titleMatch ? titleMatch[1].trim() : null
      const descMatch = html.match(/<meta[^>]*name\s*=\s*["']description["'][^>]*content\s*=\s*["']([^"']*)["']/i)
      const metaDescription = descMatch ? descMatch[1] : null
      const h1 = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)].map(m =>
        m[1].replace(/<[^>]*>/g, '').trim()
      )
      const canonicalMatch = html.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*href\s*=\s*["']([^"']*)["']/i)
      const canonical = canonicalMatch ? canonicalMatch[1] : null
      const metaRobots = (html.match(/<meta[^>]*name\s*=\s*["']robots["'][^>]*content\s*=\s*["']([^"']*)["']/i) ?? [])[1] ?? ''
      const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
      const wordCount = text.split(/\s+/).filter(w => w.length > 0).length

      return {
        url: e.entryName,
        statusCode: 200,
        title,
        metaDescription,
        h1,
        wordCount,
        canonical,
        hasNoindex: metaRobots.toLowerCase().includes('noindex'),
        schemaOrg: [],
      }
    })

  return {
    url: zipFilename,
    finalUrl: zipFilename,
    isHttps: false,
    httpToHttpsRedirect: false,
    statusCode: 200,
    ttfbMs: 0,
    headers: {},
    robotsTxt,
    sitemap: sitemapEntry
      ? { found: true, url: 'sitemap.xml', urlCount: 0, lastmod: null, sampleUrls: [], hasNoindexUrls: false }
      : null,
    pageSpeed: null,
    ssl: null,
    html: mainHtml,
    parsed,
    crawledPages,
    serp: null,
  }
}
