import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { AUDIT_CATEGORIES } from '@/lib/audit-data'
import { calculateScore, getTopIssues } from '@/lib/scoring'
import { fetchSiteData, buildSiteReport } from '@/lib/site-fetcher'
import { runDeterministicChecks, getLLMItems } from '@/lib/deterministic-checks'

export const maxDuration = 60

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json()
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 })

    // 1. Fetch real site data
    const siteData = await fetchSiteData(url)

    // 2. Run deterministic checks (code-based, 100% consistent)
    const deterministicResults = runDeterministicChecks(siteData)

    // 3. Only send remaining items to LLM (content quality, keyword analysis, UX subjective)
    const llmItemIds = getLLMItems()
    const llmItems = AUDIT_CATEGORIES.flatMap(cat =>
      cat.sections.flatMap(sec =>
        sec.items
          .filter(item => llmItemIds.includes(item.id))
          .map(item => ({
            id: item.id,
            category: cat.label,
            item: item.item,
          }))
      )
    )

    // 4. Build focused report for LLM (only what it needs)
    const siteReport = buildSiteReport(siteData)

    const prompt = `You are a senior UX + SEO content auditor. Below is data from: ${url}

${siteReport}

=== TASK ===
Evaluate ONLY these ${llmItems.length} content/quality items. All technical checks have been done by code.

Rules:
- "Pass" = clearly meets the standard based on the data
- "Fail" = clearly does NOT meet the standard
- "Partial" = mixed evidence or partially meets
- "N/A" = not applicable to this site type
- When unsure, prefer "Partial" over "Fail"
- Be fair and consistent

Respond with ONLY a JSON object. Keys = item IDs, values = "Pass"/"Partial"/"Fail"/"N/A".

Items to evaluate:
${llmItems.map(i => `${i.id}: [${i.category}] ${i.item}`).join('\n')}`

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      temperature: 0,
      messages: [{ role: 'user', content: prompt }],
    })

    const text = message.content[0].type === 'text' ? message.content[0].text : '{}'
    let llmResults: Record<string, string> = {}
    try {
      const clean = text.replace(/```json\n?|\n?```/g, '').trim()
      llmResults = JSON.parse(clean)
    } catch {
      // If LLM fails, mark all LLM items as Partial (safe fallback)
      for (const id of llmItemIds) llmResults[id] = 'Partial'
    }

    // 5. Merge: deterministic results + LLM results
    const results: Record<string, string> = { ...deterministicResults, ...llmResults }

    const scores = calculateScore(results as AuditResults)
    const topIssues = getTopIssues(results as AuditResults)

    return NextResponse.json({ results, scores, topIssues })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

type AuditResults = Record<string, 'Pass' | 'Partial' | 'Fail' | 'N/A' | null>
