// ─── SerpApi Integration ─────────────────────────────────────────────────────
// Uses serpapi.com to fetch real Google SERP data for SERP intent & AEO checks

export interface SerpResult {
  position: number
  title: string
  link: string
  snippet: string
  wordCount?: number
}

export interface SerpData {
  keyword: string
  totalResults: number
  siteRank: number | null              // null = not in top 10
  hasFeatureSnippet: boolean           // AEO opportunity
  hasPeopleAlsoAsk: boolean            // FAQ schema opportunity
  hasAnswerBox: boolean                // Direct answer box
  intentType: 'informational' | 'commercial' | 'transactional' | 'navigational' | 'mixed'
  topResults: SerpResult[]             // Top 10 organic results
  competitorAvgWords: number           // Avg word count of top 3 results
  siteAppearsInSERP: boolean
}

// Extract main keyword from page title or H1
export function extractMainKeyword(title: string | null, h1: string[]): string {
  const source = h1[0] || title || ''
  // Strip common suffixes like "| Brand Name" or "- Site Name"
  const cleaned = source.replace(/[|\-–—].{0,40}$/, '').trim()
  // Take first 6 words max
  return cleaned.split(/\s+/).slice(0, 6).join(' ')
}

// Detect SERP intent from top results
function detectIntent(results: SerpResult[]): SerpData['intentType'] {
  const titles = results.slice(0, 5).map(r => (r.title + ' ' + r.snippet).toLowerCase())
  const allText = titles.join(' ')

  const infoSignals   = (allText.match(/\b(what|how|why|guide|tutorial|learn|tips|best practices|explained)\b/g) || []).length
  const transSignals  = (allText.match(/\b(buy|price|order|shop|deal|discount|cheap|purchase|sale)\b/g) || []).length
  const commSignals   = (allText.match(/\b(best|top|review|vs|compare|alternative|recommend|rated)\b/g) || []).length
  const navSignals    = (allText.match(/\b(login|sign in|official|website|homepage|contact)\b/g) || []).length

  const max = Math.max(infoSignals, transSignals, commSignals, navSignals)
  if (max === 0) return 'informational'
  if (infoSignals === max)  return 'informational'
  if (transSignals === max) return 'transactional'
  if (commSignals === max)  return 'commercial'
  if (navSignals === max)   return 'navigational'
  return 'mixed'
}

// Estimate word count from snippet (~150 chars ≈ 25 words on avg)
function estimateWords(snippet: string): number {
  return snippet.trim().split(/\s+/).length * 8 // rough multiplier
}

export async function fetchSerpData(
  keyword: string,
  siteUrl: string,
  apiKey: string
): Promise<SerpData | null> {
  if (!keyword || !apiKey) return null

  try {
    const params = new URLSearchParams({
      engine: 'google',
      q: keyword,
      num: '10',
      api_key: apiKey,
    })

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 12000)

    const res = await fetch(`https://serpapi.com/search.json?${params}`, {
      signal: controller.signal,
    })
    clearTimeout(timer)

    if (!res.ok) return null

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await res.json() as Record<string, any>

    // Parse organic results
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const organic: SerpResult[] = (data.organic_results ?? []).map((r: any, i: number) => ({
      position: i + 1,
      title: r.title ?? '',
      link: r.link ?? '',
      snippet: r.snippet ?? '',
      wordCount: estimateWords(r.snippet ?? ''),
    }))

    // Check if site appears
    const siteDomain = new URL(siteUrl).hostname.replace(/^www\./, '')
    const siteResult = organic.find(r => r.link.includes(siteDomain))
    const siteRank = siteResult ? siteResult.position : null

    // Featured snippet
    const hasFeatureSnippet = !!(data.answer_box || data.featured_snippet)
    const hasAnswerBox = !!(data.answer_box)
    const hasPeopleAlsoAsk = Array.isArray(data.related_questions) && data.related_questions.length > 0

    // Competitor avg words (top 3)
    const top3 = organic.slice(0, 3)
    const competitorAvgWords = top3.length > 0
      ? Math.round(top3.reduce((s, r) => s + (r.wordCount ?? 0), 0) / top3.length)
      : 0

    return {
      keyword,
      totalResults: data.search_information?.total_results ?? 0,
      siteRank,
      hasFeatureSnippet,
      hasPeopleAlsoAsk,
      hasAnswerBox,
      intentType: detectIntent(organic),
      topResults: organic,
      competitorAvgWords,
      siteAppearsInSERP: siteRank !== null,
    }
  } catch {
    return null
  }
}
