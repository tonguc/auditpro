import { AUDIT_CATEGORIES, WEIGHTS, type Status } from './audit-data'

export type AuditResults = Record<string, Status>  // itemId → Status

export interface CategoryScore {
  id:      string
  label:   string
  icon:    string
  color:   string
  score:   number          // 0–100
  grade:   'A' | 'B' | 'C' | 'D'
  weight:  number
  passed:  number
  failed:  number
  partial: number
  total:   number          // excluding N/A
}

export interface AuditScore {
  overall:    number
  weighted:   number
  grade:      'A' | 'B' | 'C' | 'D'
  rating:     string
  categories: CategoryScore[]
}

export function getGrade(score: number): 'A' | 'B' | 'C' | 'D' {
  if (score >= 90) return 'A'
  if (score >= 70) return 'B'
  if (score >= 50) return 'C'
  return 'D'
}

export function getRating(score: number): string {
  if (score >= 90) return '⭐ Excellent'
  if (score >= 70) return '✅ Good'
  if (score >= 50) return '⚠️ Needs Improvement'
  return '🔴 Critical'
}

export function calculateScore(results: AuditResults): AuditScore {
  const categories: CategoryScore[] = AUDIT_CATEGORIES.map(cat => {
    const allItems = cat.sections.flatMap(s => s.items)
    let pass = 0, partial = 0, fail = 0, na = 0

    allItems.forEach(item => {
      const s = results[item.id]
      if (s === 'Pass')    pass++
      else if (s === 'Partial') partial++
      else if (s === 'Fail')   fail++
      else if (s === 'N/A')    na++
    })

    const total = pass + partial + fail
    const score = total > 0
      ? Math.round((pass * 2 + partial * 1) / (total * 2) * 100)
      : 0

    return {
      id:      cat.id,
      label:   cat.label,
      icon:    cat.icon,
      color:   cat.color,
      score,
      grade:   getGrade(score),
      weight:  WEIGHTS[cat.id] ?? 0.25,
      passed:  pass,
      failed:  fail,
      partial,
      total,
    }
  })

  const weighted = Math.round(
    categories.reduce((sum, c) => sum + c.score * c.weight, 0)
  )
  const overall = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  )

  return {
    overall,
    weighted,
    grade:  getGrade(weighted),
    rating: getRating(weighted),
    categories,
  }
}

export function getTopIssues(results: AuditResults, limit = 10) {
  const PRIORITY_SCORE: Record<string, number> = {
    Critical: 4, High: 3, Medium: 2, Low: 1,
  }

  return AUDIT_CATEGORIES
    .flatMap(cat =>
      cat.sections.flatMap(sec =>
        sec.items
          .filter(item => results[item.id] === 'Fail' || results[item.id] === 'Partial')
          .map(item => ({
            id:       item.id,
            item:     item.item,
            category: cat.label,
            catColor: cat.color,
            priority: item.priority,
            status:   results[item.id] as Status,
            score:    PRIORITY_SCORE[item.priority] ?? 1,
          }))
      )
    )
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}
