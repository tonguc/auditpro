import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AUDIT_CATEGORIES } from '@/lib/audit-data'
import { calculateScore, getTopIssues } from '@/lib/scoring'
import { fetchSiteData, buildSiteReport } from '@/lib/site-fetcher'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Items that require external tool access and cannot be verified from our data
const UNVERIFIABLE_ITEMS = [
  't12',  // GSC crawl anomalies — requires Google Search Console
  't54',  // International targeting in GSC — requires GSC
  't57',  // Log file analysis — requires server log access
  't65',  // AI-generated content penalties — requires GSC traffic data
  'o21',  // Keyword cannibalization — requires rank tracking tool
  'c29',  // GA4 conversion tracking — requires GA4 access
  'c30',  // Heatmap tool — requires Hotjar/Clarity access
  'c31',  // A/B testing program — requires internal access
  'c32',  // Funnel drop-off — requires analytics access
]

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // Fetch real site data: HTML, headers, robots.txt, sitemap, PageSpeed, SSL, internal pages
    const siteData = await fetchSiteData(url)
    const siteReport = buildSiteReport(siteData)

    const allItems = AUDIT_CATEGORIES.flatMap(cat =>
      cat.sections.flatMap(sec =>
        sec.items.map(item => ({
          id: item.id,
          category: cat.label,
          item: item.item,
        }))
      )
    )

    const prompt = `You are a senior UX + SEO auditor. Below is REAL crawl data fetched from: ${url}

This data includes: HTTP response headers, robots.txt, sitemap.xml analysis, Google PageSpeed Insights scores (real Lighthouse data), SSL certificate status, multi-page crawl results, HTML analysis, and structured data detection.

${siteReport}

=== AUDIT TASK ===
Based STRICTLY on the real data above, evaluate each audit item.

SCORING RULES — follow these exactly:
- "Pass" = the data clearly confirms this standard IS met
- "Fail" = the data clearly confirms this standard is NOT met
- "Partial" = evidence is mixed or the standard is only partially met
- "N/A" = this item cannot be verified from the data provided, OR is not applicable to this site type

CRITICAL N/A RULES — these items MUST be "N/A" because they require external tool access we don't have:
${UNVERIFIABLE_ITEMS.map(id => `- ${id}`).join('\n')}

SCORING GUIDANCE for key items using REAL data provided:
- t1 (robots.txt): Check the ROBOTS.TXT section — if content is shown, it exists → Pass
- t2 (sitemap): Check SITEMAP section — if found with URLs → Pass
- t3 (sitemap freshness): Check lastmod date in SITEMAP section
- t10 (broken links): Check MULTI-PAGE CRAWL broken pages count
- t15 (LCP ≤ 2.5s): Use PAGESPEED INSIGHTS mobile LCP value
- t16 (INP/FID ≤ 200ms): Use TBT as proxy — TBT ≤ 200ms → Pass
- t17 (CLS ≤ 0.1): Use PAGESPEED INSIGHTS CLS value
- t18 (Mobile PageSpeed ≥ 70): Use mobile Performance Score
- t19 (Desktop PageSpeed ≥ 85): Use desktop Performance Score
- t20 (WebP/AVIF): Check IMAGES formats — if mostly webp/avif/svg → Pass
- t27 (SSL valid): Check SSL CERTIFICATE section
- t35 (Organization schema): Check STRUCTURED DATA section
- o1-o4 (title tags): Check HTML META and MULTI-PAGE CRAWL for titles
- o10-o11 (H1): Check HEADINGS section and crawled page H1s
- u34 (alt text): Check IMAGES with alt text percentage — >90% → Pass

Be strict but fair. If PageSpeed data shows good scores, give credit. If sitemap exists, give credit.
The same data MUST always produce the same verdict — be deterministic.

Respond with ONLY a JSON object where keys are item IDs and values are "Pass", "Partial", "Fail", or "N/A".

Audit items:
${allItems.map(i => `${i.id}: [${i.category}] ${i.item}`).join('\n')}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    let results: Record<string, string> = {}
    try {
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      results = JSON.parse(clean)
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 })
    }

    // Force N/A for unverifiable items (safety net in case LLM doesn't comply)
    for (const id of UNVERIFIABLE_ITEMS) {
      if (results[id]) results[id] = 'N/A'
    }

    const scores    = calculateScore(results as AuditResults)
    const topIssues = getTopIssues(results as AuditResults)

    return NextResponse.json({ results, scores, topIssues })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type AuditResults = Record<string, 'Pass' | 'Partial' | 'Fail' | 'N/A' | null>
