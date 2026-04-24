import { AUDIT_CATEGORIES } from './audit-data'
import type { AuditScore, AuditResults } from './scoring'

export interface WhiteLabelConfig {
  agencyName: string
  brandColor: string
}

// Convert hex to RGB
function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '')
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ]
}

// Lighter version of a color for backgrounds
function lighten(rgb: [number, number, number], amount = 0.9): [number, number, number] {
  return [
    Math.round(rgb[0] + (255 - rgb[0]) * amount),
    Math.round(rgb[1] + (255 - rgb[1]) * amount),
    Math.round(rgb[2] + (255 - rgb[2]) * amount),
  ]
}

const STATUS_COLORS: Record<string, [number, number, number]> = {
  Pass:    [16, 185, 129],
  Partial: [245, 158, 11],
  Fail:    [239, 68, 68],
  'N/A':   [107, 122, 153],
}

export async function downloadPDF(
  config: WhiteLabelConfig,
  auditUrl: string,
  score: AuditScore,
  results: AuditResults
) {
  // Dynamic import — jsPDF only loads client-side when needed
  const { default: jsPDF } = await import('jspdf')

  const doc = new jsPDF('p', 'mm', 'a4')
  const W = 210, H = 297
  const M = 15 // margin
  const brandRgb = hexToRgb(config.brandColor)
  const brandLight = lighten(brandRgb, 0.92)
  let y = 0

  // ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────

  function addPage() {
    doc.addPage()
    y = M
    drawFooter()
  }

  function drawFooter() {
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(`${config.agencyName} — UX + SEO Audit Report`, M, H - 8)
    doc.text(`${auditUrl}`, W - M, H - 8, { align: 'right' })
  }

  function checkPageBreak(needed: number) {
    if (y + needed > H - 20) {
      addPage()
    }
  }

  // ─── PAGE 1: COVER ──────────────────────────────────────────────────────────

  // Brand header bar
  doc.setFillColor(...brandRgb)
  doc.rect(0, 0, W, 60, 'F')

  // Agency name
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(28)
  doc.setFont('helvetica', 'bold')
  doc.text(config.agencyName, M, 30)

  // Subtitle
  doc.setFontSize(13)
  doc.setFont('helvetica', 'normal')
  doc.text('UX + SEO Audit Report', M, 42)

  // Audit URL
  doc.setFontSize(10)
  doc.text(auditUrl, M, 52)

  // Date
  y = 75
  doc.setTextColor(100, 100, 100)
  doc.setFontSize(10)
  doc.text(`Report Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, M, y)

  // ─── Overall Score Section ────────────────────────────────────────────────
  y = 95

  // Score box
  doc.setFillColor(...brandLight)
  doc.roundedRect(M, y, W - 2 * M, 45, 4, 4, 'F')
  doc.setDrawColor(...brandRgb)
  doc.roundedRect(M, y, W - 2 * M, 45, 4, 4, 'S')

  // Weighted score
  doc.setFontSize(36)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...brandRgb)
  doc.text(`${score.weighted}`, M + 20, y + 28)

  doc.setFontSize(14)
  doc.text('/100', M + 45, y + 28)

  // Grade & rating
  doc.setFontSize(16)
  doc.setTextColor(60, 60, 60)
  doc.text(`Grade: ${score.grade}`, M + 75, y + 22)
  doc.setFontSize(11)
  doc.setTextColor(100, 100, 100)
  const ratingClean = score.rating.replace(/[⭐✅⚠️🔴]/g, '').trim()
  doc.text(ratingClean, M + 75, y + 32)

  // ─── Category Scores ─────────────────────────────────────────────────────
  y += 60
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Category Scores', M, y)
  y += 10

  const catBoxW = (W - 2 * M - 15) / 4

  score.categories.forEach((cat, i) => {
    const x = M + i * (catBoxW + 5)
    const catColorRgb = hexToRgb(cat.color)
    const catLight = lighten(catColorRgb, 0.92)

    doc.setFillColor(...catLight)
    doc.roundedRect(x, y, catBoxW, 40, 3, 3, 'F')
    doc.setDrawColor(...catColorRgb)
    doc.roundedRect(x, y, catBoxW, 40, 3, 3, 'S')

    doc.setFontSize(22)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...catColorRgb)
    doc.text(`${cat.score}`, x + catBoxW / 2, y + 18, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(80, 80, 80)
    const label = cat.label.replace('Technical SEO', 'Tech SEO').replace('On-Page & Content', 'On-Page').replace('UX Heuristics', 'UX').replace('Conversion & CTA', 'CRO')
    doc.text(label, x + catBoxW / 2, y + 27, { align: 'center' })

    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text(`Grade ${cat.grade}`, x + catBoxW / 2, y + 35, { align: 'center' })
  })

  // ─── Summary Stats ────────────────────────────────────────────────────────
  y += 55
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('Summary', M, y)
  y += 10

  const totalPass = score.categories.reduce((s, c) => s + c.passed, 0)
  const totalFail = score.categories.reduce((s, c) => s + c.failed, 0)
  const totalPartial = score.categories.reduce((s, c) => s + c.partial, 0)
  const totalItems = score.categories.reduce((s, c) => s + c.total, 0)

  const stats = [
    { label: 'Total Items Checked', value: `${totalItems}`, color: [30, 30, 30] as [number, number, number] },
    { label: 'Passed', value: `${totalPass}`, color: STATUS_COLORS.Pass },
    { label: 'Partial', value: `${totalPartial}`, color: STATUS_COLORS.Partial },
    { label: 'Failed', value: `${totalFail}`, color: STATUS_COLORS.Fail },
  ]

  const statW = (W - 2 * M - 15) / 4
  stats.forEach((stat, i) => {
    const x = M + i * (statW + 5)
    doc.setFillColor(245, 247, 250)
    doc.roundedRect(x, y, statW, 22, 3, 3, 'F')

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(...stat.color)
    doc.text(stat.value, x + statW / 2, y + 12, { align: 'center' })

    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(120, 120, 120)
    doc.text(stat.label, x + statW / 2, y + 19, { align: 'center' })
  })

  drawFooter()

  // ─── DETAIL PAGES: One per category ─────────────────────────────────────

  AUDIT_CATEGORIES.forEach(cat => {
    addPage()
    const catColor = hexToRgb(cat.color)

    // Category header
    doc.setFillColor(...catColor)
    doc.rect(0, 0, W, 22, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${cat.label}`, M, 15)

    const catScore = score.categories.find(c => c.id === cat.id)
    if (catScore) {
      doc.setFontSize(14)
      doc.text(`${catScore.score}/100 — Grade ${catScore.grade}`, W - M, 15, { align: 'right' })
    }

    y = 30

    cat.sections.forEach(sec => {
      checkPageBreak(20)

      // Section header
      doc.setFillColor(...lighten(catColor, 0.85))
      doc.rect(M, y, W - 2 * M, 8, 'F')
      doc.setFontSize(9)
      doc.setFont('helvetica', 'bold')
      doc.setTextColor(...catColor)
      doc.text(sec.label, M + 3, y + 5.5)
      y += 10

      sec.items.forEach((item, idx) => {
        checkPageBreak(10)

        const status = (results[item.id] as string) || 'N/A'
        const statusColor = STATUS_COLORS[status] || STATUS_COLORS['N/A']

        if (idx % 2 === 0) {
          doc.setFillColor(248, 249, 252)
          doc.rect(M, y, W - 2 * M, 8, 'F')
        }

        doc.setFontSize(7)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(150, 150, 150)
        doc.text(`${item.num}`, M + 3, y + 5.5)

        doc.setFontSize(8)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(40, 40, 40)
        const maxTextW = W - 2 * M - 40
        const itemText = doc.splitTextToSize(item.item, maxTextW)
        doc.text(itemText[0], M + 12, y + 5.5)

        doc.setFillColor(...statusColor)
        const badgeX = W - M - 22
        doc.roundedRect(badgeX, y + 1, 20, 5.5, 2, 2, 'F')
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        doc.setTextColor(255, 255, 255)
        doc.text(status, badgeX + 10, y + 5, { align: 'center' })

        y += 8
      })

      y += 3
    })
  })

  // ─── FINAL PAGE: Disclaimer ─────────────────────────────────────────────

  addPage()
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...brandRgb)
  doc.text(config.agencyName, M, y + 10)

  y += 20
  doc.setFontSize(11)
  doc.setTextColor(60, 60, 60)
  doc.text('About This Report', M, y)
  y += 8

  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  const disclaimer = doc.splitTextToSize(
    `This UX + SEO audit report was generated for ${auditUrl} on ${new Date().toLocaleDateString()}. ` +
    `The audit covers 190 checkpoints across Technical SEO, On-Page & Content, UX Heuristics, and Conversion & CTA categories. ` +
    `Results are based on automated analysis of real site data including HTML structure, response headers, Core Web Vitals (via PageSpeed Insights API), SSL certificates, sitemap, and robots.txt. ` +
    `Some items require manual verification or access to tools like Google Search Console. ` +
    `Scores may vary slightly based on network conditions and server response times.`,
    W - 2 * M
  )
  doc.text(disclaimer, M, y)

  y += disclaimer.length * 5 + 15
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...brandRgb)
  doc.text(`Prepared by ${config.agencyName}`, M, y)

  drawFooter()

  const safeName = auditUrl.replace(/https?:\/\//, '').replace(/[^a-zA-Z0-9.-]/g, '_')
  doc.save(`${config.agencyName.replace(/\s+/g, '-')}_Audit_${safeName}.pdf`)
}
