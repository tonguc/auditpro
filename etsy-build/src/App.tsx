import { useState, useEffect } from 'react'
import { AUDIT_CATEGORIES } from './data/audit-data'
import { calculateScore, getTopIssues, type AuditScore, type AuditResults } from './data/scoring'

// ─── Colors ────────────────────────────────────────────────────────────────────
const C = {
  bg: '#0A0E1A', surface: '#111827', surfaceHover: '#1a2235',
  border: '#1e2d45', text: '#E2E8F0', muted: '#6B7A99',
  accent: '#0EA5E9', accentDim: '#0369A1',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444',
}

const SEV: Record<string, string> = {
  Critical: '#EF4444', High: '#F59E0B', Medium: '#0EA5E9', Low: '#6B7A99',
}

const STATUS_COLOR: Record<string, string> = {
  Pass: '#10B981', Partial: '#F59E0B', Fail: '#EF4444', 'N/A': '#6B7A99',
}
const STATUS_BG: Record<string, string> = {
  Pass: '#10B98122', Partial: '#F59E0B22', Fail: '#EF444422', 'N/A': '#6B7A9922',
}

// ─── ScoreRing ─────────────────────────────────────────────────────────────────
function ScoreRing({ score, size = 120, color = C.accent }: { score: number; size?: number; color?: string }) {
  const stroke = 10, r = (size - stroke) / 2, circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const grade = score >= 90 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'D'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.border} strokeWidth={stroke} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: size > 100 ? 28 : 18, fontWeight: 800, color: C.text, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 11, color, fontWeight: 700 }}>Grade {grade}</span>
      </div>
    </div>
  )
}

// ─── Pro Upsell Modal ─────────────────────────────────────────────────────────
function ProModal({ onUpgrade, onClose }: { onUpgrade: () => void; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 100,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={onClose}>
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16,
        padding: 32, maxWidth: 380, width: '100%', textAlign: 'center' }}
        onClick={e => e.stopPropagation()}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🔓</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          Unlock Full Audit
        </div>
        <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6, marginBottom: 20 }}>
          This check is part of Pro. Upgrade to access all <strong style={{ color: C.text }}>190 checks</strong> across every category.
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24,
          textAlign: 'left', background: C.bg, borderRadius: 10, padding: '14px 16px' }}>
          {[
            { icon: '⚙️', text: 'Technical SEO — 65 checks' },
            { icon: '📝', text: 'On-Page & Content — 50 checks' },
            { icon: '🎯', text: 'UX Heuristics — 40 checks' },
            { icon: '⚡', text: 'Conversion & CTA — 35 checks' },
            { icon: '🤖', text: 'AI & SERP Visibility — 11 checks' },
          ].map(r => (
            <div key={r.text} style={{ display: 'flex', gap: 10, alignItems: 'center',
              fontSize: 12, color: C.muted }}>
              <span>{r.icon}</span><span>{r.text}</span>
            </div>
          ))}
        </div>
        <button onClick={onUpgrade} style={{ width: '100%', background: C.accent, border: 'none',
          borderRadius: 8, padding: '12px', color: '#fff', fontSize: 14, fontWeight: 700,
          cursor: 'pointer', marginBottom: 10 }}>
          Unlock Full Audit →
        </button>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none',
          color: C.muted, fontSize: 12, cursor: 'pointer' }}>
          Maybe later
        </button>
      </div>
    </div>
  )
}

// ─── Sidebar ───────────────────────────────────────────────────────────────────
function Sidebar({ view, setView, isPro, onUpgrade, liveResults }: {
  view: string; setView: (v: 'audit' | 'dashboard') => void
  isPro: boolean; onUpgrade: () => void; liveResults: AuditResults
}) {
  const nav = [
    { id: 'audit',     icon: '◎', label: 'Audit' },
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
  ]

  const allLiteItems = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).filter(i => i.lite)
  let pass = 0, partial = 0, fail = 0
  allLiteItems.forEach(item => {
    const s = liveResults[item.id]
    if (s === 'Pass') pass++
    else if (s === 'Partial') partial++
    else if (s === 'Fail') fail++
  })
  const answered = pass + partial + fail
  const liveScore = answered > 0 ? Math.round((pass * 2 + partial) / (answered * 2) * 100) : null
  const scoreColor = liveScore === null ? C.muted : liveScore >= 70 ? C.green : liveScore >= 50 ? C.amber : C.red

  return (
    <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}><span style={{ color: C.accent }}>Audit</span>Pro</div>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', padding: '2px 7px',
            borderRadius: 10, background: isPro ? `${C.accent}22` : `${C.amber}22`,
            color: isPro ? C.accent : C.amber, border: `1px solid ${isPro ? C.accent : C.amber}44` }}>
            {isPro ? 'PRO' : 'FREE'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>UX + SEO Intelligence</div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {nav.map(n => (
          <div key={n.id} onClick={() => setView(n.id as 'audit' | 'dashboard')} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 8, cursor: 'pointer', marginBottom: 2,
            background: view === n.id ? `${C.accentDim}55` : 'transparent',
            color: view === n.id ? C.accent : C.muted }}>
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{n.icon}</span>
            <span style={{ fontSize: 13, fontWeight: view === n.id ? 600 : 400 }}>{n.label}</span>
          </div>
        ))}
        {liveScore !== null && (
          <div style={{ margin: '12px 0 0', padding: '12px', background: C.bg,
            borderRadius: 10, border: `1px solid ${C.border}` }}>
            <div style={{ fontSize: 10, color: C.muted, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
              Current Score
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: scoreColor, lineHeight: 1 }}>
              {liveScore}
              <span style={{ fontSize: 13, color: C.muted, fontWeight: 400 }}>/100</span>
            </div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>
              {answered} of {isPro ? 190 : allLiteItems.length} checks answered
            </div>
            <div style={{ marginTop: 8, background: C.border, borderRadius: 3, height: 3 }}>
              <div style={{ height: 3, borderRadius: 3, background: scoreColor,
                width: `${(answered / allLiteItems.length) * 100}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}
      </nav>
      {!isPro && (
        <div style={{ margin: '0 12px 12px', background: `${C.accent}11`,
          border: `1px solid ${C.accent}33`, borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 4 }}>
            Free: 18 / 190 checks
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 10, lineHeight: 1.5 }}>
            Unlock 172 advanced checks + AI Auto-Audit.
          </div>
          <button onClick={onUpgrade} style={{ width: '100%', background: C.accent, border: 'none',
            borderRadius: 7, padding: '8px', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Unlock Full Audit →
          </button>
        </div>
      )}
      <div style={{ padding: '12px 24px', borderTop: `1px solid ${C.border}`, fontSize: 10, color: C.muted }}>
        auditpro.xyz
      </div>
    </div>
  )
}

// ─── CategoryDetail modal ──────────────────────────────────────────────────────
function CategoryDetail({ catId, results, isPro, onClose }: {
  catId: string; results: AuditResults; isPro: boolean; onClose: () => void
}) {
  const cat = AUDIT_CATEGORIES.find(c => c.id === catId)!
  const [filter, setFilter] = useState<string>('all')
  const allItems = cat.sections.flatMap(s => s.items)
  const visibleItems = isPro ? allItems : allItems.filter(i => i.lite)
  const filtered = filter === 'all' ? visibleItems : visibleItems.filter(i => (results[i.id] ?? 'none') === filter)
  const counts = {
    Pass: visibleItems.filter(i => results[i.id] === 'Pass').length,
    Partial: visibleItems.filter(i => results[i.id] === 'Partial').length,
    Fail: visibleItems.filter(i => results[i.id] === 'Fail').length,
    'N/A': visibleItems.filter(i => results[i.id] === 'N/A').length,
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000cc', zIndex: 50,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }}
      onClick={onClose}>
      <div style={{ width: 480, height: '100vh', background: C.surface, overflowY: 'auto',
        borderLeft: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '20px 24px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, background: C.surface, zIndex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{cat.icon} {cat.label}</div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: C.muted, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ padding: '12px 24px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['all', 'Pass', 'Partial', 'Fail', 'N/A'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{ padding: '4px 12px', borderRadius: 6, fontSize: 11,
              fontWeight: 600, cursor: 'pointer', border: `1px solid ${filter === f ? STATUS_COLOR[f] ?? C.accent : C.border}`,
              background: filter === f ? `${STATUS_COLOR[f] ?? C.accent}22` : 'transparent',
              color: filter === f ? STATUS_COLOR[f] ?? C.accent : C.muted }}>
              {f}{f !== 'all' ? ` (${counts[f as keyof typeof counts] ?? 0})` : ''}
            </button>
          ))}
        </div>
        {filtered.map((item, i) => {
          const s = results[item.id]
          return (
            <div key={item.id} style={{ padding: '14px 24px', borderBottom: `1px solid ${C.border}`,
              background: i % 2 === 0 ? 'transparent' : `${C.bg}66` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: SEV[item.priority], textTransform: 'uppercase' }}>
                  {item.priority}
                </div>
                {s && <div style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLOR[s], background: STATUS_BG[s],
                  padding: '2px 8px', borderRadius: 5 }}>{s}</div>}
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 4 }}>{item.item}</div>
              <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>{item.howTo}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Dashboard ─────────────────────────────────────────────────────────────────
function DashboardView({ score, issues, auditUrl, results, isPro, onNewAudit, onCatClick }: {
  score: AuditScore; issues: ReturnType<typeof getTopIssues>
  auditUrl: string; results: AuditResults; isPro: boolean
  onNewAudit: () => void; onCatClick: (id: string) => void
}) {
  const [exporting, setExporting] = useState(false)

  async function handleExport() {
    setExporting(true)
    try {
      const { downloadPDF } = await import('./data/pdf-generator')
      await downloadPDF({ agencyName: 'AuditPro', brandColor: '#0EA5E9' }, auditUrl, score, results)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 6 }}>{auditUrl || 'Manual Audit'}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Audit Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExport} disabled={exporting} style={{
            background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '9px 18px', color: C.muted, fontSize: 13, fontWeight: 600,
            cursor: exporting ? 'default' : 'pointer', opacity: exporting ? 0.6 : 1 }}>
            {exporting ? 'Generating…' : '↓ Export PDF'}
          </button>
          <button onClick={onNewAudit} style={{ background: C.accent, border: 'none',
            borderRadius: 8, padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            + New Audit
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
          padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <ScoreRing score={score.weighted} size={130} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase' }}>Weighted Score</div>
            <div style={{ fontSize: 12, color: C.amber, marginTop: 4 }}>{score.rating}</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {score.categories.map(cat => (
            <div key={cat.id} onClick={() => onCatClick(cat.id)}
              onMouseEnter={e => (e.currentTarget.style.borderColor = cat.color)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
              style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12,
                padding: '16px 20px', cursor: 'pointer', transition: 'border-color 0.15s' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600,
                    textTransform: 'uppercase', marginBottom: 4 }}>{cat.icon} {cat.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    {cat.score}<span style={{ fontSize: 12, color: C.muted }}>/100</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    {cat.passed} pass · {cat.failed} fail · <span style={{ color: C.accent }}>details →</span>
                  </div>
                </div>
                <div style={{ background: `${cat.color}22`, border: `1px solid ${cat.color}44`,
                  borderRadius: 8, padding: '4px 12px', fontSize: 20, fontWeight: 800, color: cat.color }}>
                  {cat.grade}
                </div>
              </div>
              <div style={{ marginTop: 12, background: C.border, borderRadius: 4, height: 4 }}>
                <div style={{ height: 4, borderRadius: 4, background: cat.color, width: `${cat.score}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {issues.length > 0 && (
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: `1px solid ${C.border}`,
            display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>🎯 Top Priority Issues</div>
            <div style={{ fontSize: 11, color: C.muted }}>{issues.length} issues</div>
          </div>
          {issues.slice(0, 10).map((issue, i) => {
            const howTo = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).find(it => it.id === issue.id)?.howTo
            return (
              <div key={issue.id} style={{ padding: '13px 24px',
                borderBottom: i < Math.min(issues.length, 10) - 1 ? `1px solid ${C.border}` : 'none',
                display: 'flex', alignItems: 'flex-start', gap: 14,
                background: i % 2 === 0 ? 'transparent' : `${C.bg}66` }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 5,
                  background: SEV[issue.priority] ?? C.muted, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: C.text, marginBottom: 3 }}>{issue.item}</div>
                  {howTo && <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>💡 {howTo}</div>}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0 }}>
                  <div style={{ fontSize: 11, color: C.muted, background: C.border,
                    borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap',
                    width: 140, textAlign: 'left' }}>{issue.category}</div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: SEV[issue.priority] ?? C.muted,
                    textTransform: 'uppercase', width: 60, textAlign: 'right' }}>{issue.priority}</div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Manual Audit ──────────────────────────────────────────────────────────────
function ManualAuditView({ onComplete, isPro, onUpgrade, onResultsChange }: {
  onComplete: (url: string, results: AuditResults) => void
  isPro: boolean
  onUpgrade: () => void
  onResultsChange: (r: AuditResults) => void
}) {
  const [url, setUrl]             = useState('')
  const [activeCat, setActiveCat] = useState('technical')
  const [results, setResults]     = useState<AuditResults>({})
  const [showModal, setShowModal] = useState(false)

  function updateResults(updater: (r: AuditResults) => AuditResults) {
    setResults(r => {
      const next = updater(r)
      onResultsChange(next)
      return next
    })
  }

  const cat = AUDIT_CATEGORIES.find(c => c.id === activeCat)!

  function handleComplete() { onComplete(url, results) }

  const answeredCount = Object.keys(results).length
  const liteTotal = AUDIT_CATEGORIES.flatMap(c => c.sections.flatMap(s => s.items)).filter(i => i.lite).length

  return (
    <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
      {showModal && (
        <ProModal onUpgrade={() => { setShowModal(false); onUpgrade() }} onClose={() => setShowModal(false)} />
      )}
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Manual Audit</h1>
          <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
            {answeredCount} of {isPro ? 190 : liteTotal} checks answered
          </div>
        </div>
        <button onClick={handleComplete} style={{ background: C.green, border: 'none',
          borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
          Complete Audit →
        </button>
      </div>

      {/* URL input */}
      <div style={{ marginBottom: 20 }}>
        <input value={url} onChange={e => setUrl(e.target.value)}
          placeholder="https://yoursite.com (optional — for labeling the report)"
          style={{ width: '100%', background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8,
            padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' }} />
      </div>

      {/* AI notice */}
      <div style={{ background: `${C.border}88`, borderRadius: 8, padding: '10px 16px',
        marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 13, color: C.muted }}>
          ⚡ AI Auto-Audit — scans 190 signals automatically.
          <span style={{ color: C.accent }}> Available in Hosted Pro at auditpro.xyz</span>
        </span>
      </div>

      {/* Category tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {AUDIT_CATEGORIES.map(c => {
          const catItems = c.sections.flatMap(s => s.items)
          const liteItems = catItems.filter(i => i.lite)
          const answered = liteItems.filter(i => results[i.id]).length
          return (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              background: activeCat === c.id ? c.color : C.surface,
              border: `1px solid ${activeCat === c.id ? c.color : C.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: activeCat === c.id ? '#fff' : C.muted,
              fontSize: 12, fontWeight: activeCat === c.id ? 700 : 400, cursor: 'pointer' }}>
              {c.icon} {c.label}
              {!isPro && <span style={{ marginLeft: 6, fontSize: 10, opacity: 0.7 }}>
                {answered}/{liteItems.length}
              </span>}
            </button>
          )
        })}
      </div>

      {/* Items */}
      {cat.sections.map(sec => {
        const liteCount = sec.items.filter(i => i.lite).length
        const lockedCount = isPro ? 0 : sec.items.filter(i => !i.lite).length
        return (
          <div key={sec.id} style={{ marginBottom: 16 }}>
            <div style={{ padding: '10px 16px', background: cat.color, borderRadius: '8px 8px 0 0',
              fontSize: 12, fontWeight: 700, color: '#fff',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{sec.label}</span>
              {lockedCount > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, opacity: 0.85 }}>
                  {liteCount}/{sec.items.length} available
                </span>
              )}
            </div>
            {sec.items.map((item, i) => {
              const isLocked = !isPro && !item.lite
              const s = results[item.id] as string | undefined
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '12px 16px', background: i % 2 === 0 ? C.surface : C.surfaceHover,
                  borderBottom: `1px solid ${C.border}`, opacity: isLocked ? 0.45 : 1 }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: isLocked ? C.border : `${SEV[item.priority]}22`,
                    border: `1px solid ${isLocked ? C.border : SEV[item.priority]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, color: isLocked ? C.muted : SEV[item.priority] }}>
                    {isLocked ? '🔒' : <span style={{ fontSize: 10, fontWeight: 700 }}>{item.num}</span>}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600,
                      color: isLocked ? C.muted : C.text, marginBottom: isLocked ? 0 : 3 }}>
                      {item.item}
                    </div>
                    {!isLocked && (
                      <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>
                        {item.howTo}
                      </div>
                    )}
                  </div>
                  {isLocked ? (
                    <button onClick={() => setShowModal(true)} style={{ flexShrink: 0, padding: '5px 12px',
                      borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      border: `1px solid ${C.accent}44`, background: `${C.accent}11`, color: C.accent }}>
                      Pro
                    </button>
                  ) : (
                    <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                      {(['Pass', 'Partial', 'Fail', 'N/A'] as const).map(v => (
                        <button key={v} onClick={() => updateResults(r => ({ ...r, [item.id]: v }))} style={{
                          padding: '5px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${s === v ? STATUS_COLOR[v] : C.border}`,
                          background: s === v ? STATUS_BG[v] : 'transparent',
                          color: s === v ? STATUS_COLOR[v] : C.muted }}>{v}</button>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      })}
    </div>
  )
}

// ─── App ───────────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView]         = useState<'audit' | 'dashboard'>('audit')
  const [auditUrl, setAuditUrl] = useState('')
  const [results, setResults]   = useState<AuditResults>({})
  const [score, setScore]       = useState<AuditScore | null>(null)
  const [issues, setIssues]     = useState<ReturnType<typeof getTopIssues>>([])
  const [isPro, setIsPro]       = useState(false)
  const [detailCat, setDetailCat] = useState<string | null>(null)

  // Load persisted state on mount
  useEffect(() => {
    try {
      setIsPro(localStorage.getItem('auditpro_pro') === 'true')
      const saved = localStorage.getItem('auditpro_etsy_session')
      if (saved) {
        const { url, res } = JSON.parse(saved)
        if (url) setAuditUrl(url)
        if (res && Object.keys(res).length > 0) {
          setResults(res)
          const sc = calculateScore(res)
          setScore(sc)
          setIssues(getTopIssues(res))
          setView('dashboard')
        }
      }
    } catch { /* ignore */ }
  }, [])

  function handleComplete(url: string, res: AuditResults) {
    const sc = calculateScore(res)
    setAuditUrl(url)
    setResults(res)
    setScore(sc)
    setIssues(getTopIssues(res))
    setView('dashboard')
    try {
      localStorage.setItem('auditpro_etsy_session', JSON.stringify({ url, res }))
    } catch { /* ignore */ }
  }

  function handleUpgrade() {
    setIsPro(true)
    try { localStorage.setItem('auditpro_pro', 'true') } catch { /* ignore */ }
  }

  function handleNewAudit() {
    setResults({})
    setScore(null)
    setIssues([])
    setAuditUrl('')
    setView('audit')
    try { localStorage.removeItem('auditpro_etsy_session') } catch { /* ignore */ }
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {detailCat && score && (
        <CategoryDetail catId={detailCat} results={results} isPro={isPro} onClose={() => setDetailCat(null)} />
      )}
      <Sidebar view={view} setView={setView} isPro={isPro} onUpgrade={handleUpgrade} liveResults={results} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {view === 'audit' && (
          <ManualAuditView onComplete={handleComplete} isPro={isPro} onUpgrade={handleUpgrade}
            onResultsChange={setResults} />
        )}
        {view === 'dashboard' && score && (
          <DashboardView
            score={score} issues={issues} auditUrl={auditUrl}
            results={results} isPro={isPro}
            onNewAudit={handleNewAudit}
            onCatClick={setDetailCat}
          />
        )}
        {view === 'dashboard' && !score && (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 48 }}>📊</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No audit yet</div>
            <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Complete a manual audit to see results</div>
            <button onClick={() => setView('audit')} style={{ background: C.accent, border: 'none',
              borderRadius: 8, padding: '10px 24px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
              Start Audit →
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
