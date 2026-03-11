import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AUDIT_CATEGORIES } from '@/lib/audit-data'
import { calculateScore, getTopIssues } from '@/lib/scoring'
import { fetchSiteData, buildSiteReport } from '@/lib/site-fetcher'

// Extend Vercel function timeout to 60s (needed for PageSpeed API + Claude)
export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// Items that require external tool access and cannot be verified from our data
const UNVERIFIABLE_ITEMS = [
  't2',   // Sitemap submitted to GSC — we can check if sitemap exists, but not GSC submission
  't12',  // GSC crawl anomalies — requires Google Search Console
  't42',  // Schema markup errors in GSC — requires GSC
  't54',  // International targeting in GSC — requires GSC
  't57',  // Log file analysis — requires server log access
  't65',  // AI-generated content penalties — requires GSC traffic data
  'o21',  // Keyword cannibalization — requires rank tracking tool
  'u32',  // IA tested with users — requires user research data
  'c25',  // Apple Pay / Google Pay — requires checkout access
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

SCORING GUIDANCE — use the REAL data sections to evaluate:

TECHNICAL SEO — use actual measurements:
- t1 (robots.txt): ROBOTS.TXT section shows content → Pass. "NOT FOUND" → Fail
- t3 (sitemap fresh): SITEMAP lastmod within 30 days → Pass
- t5 (canonicals): HTML META canonical present → Pass
- t10 (broken links): MULTI-PAGE CRAWL broken pages = 0 → Pass
- t15 (LCP ≤ 2.5s): PAGESPEED mobile LCP ≤ 2500 → Pass. If PageSpeed unavailable → N/A
- t16 (INP ≤ 200ms): PAGESPEED TBT ≤ 200 → Pass. If unavailable → N/A
- t17 (CLS ≤ 0.1): PAGESPEED CLS ≤ 0.1 → Pass. If unavailable → N/A
- t18 (Mobile score ≥ 70): PAGESPEED mobile score ≥ 70 → Pass. If unavailable → N/A
- t19 (Desktop score ≥ 85): PAGESPEED desktop score ≥ 85 → Pass. If unavailable → N/A
- t20 (WebP/AVIF): IMAGES formats — if webp/avif/svg present → Pass; if only jpg/png → Fail
- t21 (img dimensions): IMAGES with width+height ≥ 80% → Pass
- t24 (TTFB): RESPONSE INFO TTFB < 800 → Pass
- t27 (SSL): SSL section valid → Pass
- t28 (HTTPS): RESPONSE HTTPS = Yes → Pass
- t29 (HTTP→HTTPS): RESPONSE redirect = Yes → Pass
- t35 (Org schema): STRUCTURED DATA has Organization → Pass
- t44 (mobile-first): Viewport meta present → Pass
- t45 (viewport): HTML META viewport present → Pass

ON-PAGE — use parsed HTML data:
- o1 (title exists): HTML META title not MISSING → Pass
- o2 (title length): Title 50-60 chars → Pass; <30 or >70 → Fail
- o5 (meta desc): HTML META description not MISSING → Pass
- o10 (one H1): HEADINGS H1 count = 1 → Pass; 0 or >1 → Fail
- o9 (OG tags): OPEN GRAPH section has tags → Pass

UX — use HTML structure evidence:
- u34 (alt text): IMAGES alt ≥ 80% → Pass; <50% → Fail
- u35 (keyboard nav): Check for tabindex, focus styles in HTML
- Items about subjective UX (loading states, error messages, etc.): If cannot determine from HTML → Partial (not Fail)

CONVERSION — use what's visible in HTML:
- c1 (CTA above fold): Look for prominent buttons/links in first part of HTML
- c9 (testimonials): Search HTML for testimonial-like content
- Items about checkout, payment, A/B testing: If site has no e-commerce → N/A

IMPORTANT: When evidence is ambiguous or the item can't be fully verified from our data,
prefer "Partial" over "Fail". Only use "Fail" when the data CLEARLY shows non-compliance.
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
