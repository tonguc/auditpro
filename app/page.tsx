'use client'

import { useState } from 'react'
import { AUDIT_CATEGORIES } from '@/lib/audit-data'
import { calculateScore, getTopIssues, type AuditScore, type AuditResults } from '@/lib/scoring'

const C = {
  bg: '#0A0E1A', surface: '#111827', surfaceHover: '#1a2235',
  border: '#1e2d45', accent: '#0EA5E9', accentDim: '#0c4a6e',
  green: '#10B981', amber: '#F59E0B', red: '#EF4444', purple: '#8B5CF6',
  text: '#F0F4FF', muted: '#6B7A99',
}
const SEV: Record<string, string> = { Critical: '#EF4444', High: '#F59E0B', Medium: '#0EA5E9', Low: '#10B981' }
const STATUS_COLOR: Record<string, string> = { Pass: '#10B981', Partial: '#F59E0B', Fail: '#EF4444', 'N/A': '#6B7A99' }
const STATUS_BG: Record<string, string>    = { Pass: '#10B98122', Partial: '#F59E0B22', Fail: '#EF444422', 'N/A': '#6B7A9922' }

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

function Sidebar({ page, setPage }: { page: string; setPage: (p: string) => void }) {
  const nav = [
    { id: 'dashboard', icon: '▦', label: 'Dashboard' },
    { id: 'audit',     icon: '◎', label: 'New Audit' },
    { id: 'whitelabel',icon: '◈', label: 'White Label' },
  ]
  return (
    <div style={{ width: 220, background: C.surface, borderRight: `1px solid ${C.border}`,
      display: 'flex', flexDirection: 'column', minHeight: '100vh', flexShrink: 0 }}>
      <div style={{ padding: '24px 24px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}><span style={{ color: C.accent }}>Audit</span>Pro</div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>UX + SEO Intelligence</div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {nav.map(n => (
          <div key={n.id} onClick={() => setPage(n.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 8, cursor: 'pointer', marginBottom: 2,
            background: page === n.id ? `${C.accentDim}55` : 'transparent',
            color: page === n.id ? C.accent : C.muted }}>
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{n.icon}</span>
            <span style={{ fontSize: 13, fontWeight: page === n.id ? 600 : 400 }}>{n.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.muted }}>
        auditpro.tonguckaracay.com
      </div>
    </div>
  )
}

function CategoryDetail({ catId, results, onClose }: { catId: string; results: AuditResults; onClose: () => void }) {
  const cat = AUDIT_CATEGORIES.find(c => c.id === catId)!
  const [filter, setFilter] = useState<string>('all')
  const allItems = cat.sections.flatMap(s => s.items)
  const filtered = filter === 'all' ? allItems : allItems.filter(i => (results[i.id] ?? 'none') === filter)
  const counts = {
    Pass:    allItems.filter(i => results[i.id] === 'Pass').length,
    Partial: allItems.filter(i => results[i.id] === 'Partial').length,
    Fail:    allItems.filter(i => results[i.id] === 'Fail').length,
    'N/A':   allItems.filter(i => results[i.id] === 'N/A').length,
  }
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000,
      display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-end' }} onClick={onClose}>
      <div style={{ width: 700, height: '100vh', background: C.surface, overflowY: 'auto',
        borderLeft: `1px solid ${C.border}` }} onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px 28px', borderBottom: `1px solid ${C.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          position: 'sticky', top: 0, background: C.surface, zIndex: 10 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{cat.icon} {cat.label}</div>
            <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>
              {allItems.length} items · {counts.Pass} pass · {counts.Fail} fail · {counts.Partial} partial
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: `1px solid ${C.border}`,
            borderRadius: 8, padding: '6px 14px', color: C.muted, fontSize: 13, cursor: 'pointer' }}>✕ Close</button>
        </div>
        <div style={{ padding: '16px 28px', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { key: 'all',     label: `All (${allItems.length})`,   color: C.accent },
            { key: 'Fail',    label: `Fail (${counts.Fail})`,       color: C.red },
            { key: 'Partial', label: `Partial (${counts.Partial})`, color: C.amber },
            { key: 'Pass',    label: `Pass (${counts.Pass})`,       color: C.green },
            { key: 'N/A',     label: `N/A (${counts['N/A']})`,     color: C.muted },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${filter === f.key ? f.color : C.border}`,
              background: filter === f.key ? `${f.color}22` : 'transparent',
              color: filter === f.key ? f.color : C.muted }}>
              {f.label}
            </button>
          ))}
        </div>
        <div style={{ padding: '16px 28px' }}>
          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted }}>No items match this filter</div>
          )}
          {filtered.map(item => {
            const status = results[item.id] as string | undefined
            return (
              <div key={item.id} style={{ marginBottom: 10, borderRadius: 10,
                border: `1px solid ${status ? `${STATUS_COLOR[status]}44` : C.border}`,
                background: status ? STATUS_BG[status] : `${C.bg}88` }}>
                <div style={{ padding: '14px 18px', display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                  <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                    background: `${SEV[item.priority]}22`, border: `1px solid ${SEV[item.priority]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: SEV[item.priority] }}>{item.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{item.item}</span>
                      <span style={{ fontSize: 10, color: SEV[item.priority], fontWeight: 700,
                        textTransform: 'uppercase', background: `${SEV[item.priority]}22`,
                        padding: '2px 8px', borderRadius: 10 }}>{item.priority}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, fontStyle: 'italic' }}>
                      💡 {item.howTo}
                    </div>
                  </div>
                  {status && (
                    <div style={{ flexShrink: 0, padding: '4px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700,
                      background: STATUS_BG[status], color: STATUS_COLOR[status],
                      border: `1px solid ${STATUS_COLOR[status]}44` }}>
                      {status === 'Pass' ? '✓ Pass' : status === 'Fail' ? '✗ Fail' : status === 'Partial' ? '~ Partial' : 'N/A'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function DashboardView({ score, issues, auditUrl, results, setPage }: {
  score: AuditScore | null; issues: ReturnType<typeof getTopIssues>
  auditUrl: string; results: AuditResults; setPage: (p: string) => void
}) {
  const [detailCat, setDetailCat] = useState<string | null>(null)
  if (!score) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
      <div style={{ fontSize: 48 }}>📊</div>
      <div style={{ fontSize: 16, fontWeight: 600, color: C.text }}>No audit yet</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 8 }}>Run your first audit to see results</div>
      <button onClick={() => setPage('audit')} style={{ background: C.accent, border: 'none',
        borderRadius: 8, padding: '10px 24px', color: '#fff', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
        Start First Audit →
      </button>
    </div>
  )
  return (
    <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
      {detailCat && <CategoryDetail catId={detailCat} results={results} onClose={() => setDetailCat(null)} />}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase',
            letterSpacing: '0.08em', marginBottom: 6 }}>{auditUrl}</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text }}>Audit Dashboard</h1>
        </div>
        <button onClick={() => setPage('audit')} style={{ background: C.accent, border: 'none',
          borderRadius: 8, padding: '9px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          + New Audit
        </button>
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
            <div key={cat.id} onClick={() => setDetailCat(cat.id)}
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
              borderBottom: i < 9 ? `1px solid ${C.border}` : 'none',
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
                  borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap' }}>{issue.category}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: SEV[issue.priority] ?? C.muted,
                  textTransform: 'uppercase', width: 60, textAlign: 'right' }}>{issue.priority}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const SCAN_STEPS = ['Crawling site structure…','Checking Technical SEO…','Analyzing On-Page content…','Evaluating UX heuristics…','Auditing CRO elements…','Generating AI report…']

function AuditView({ onComplete }: { onComplete: (url: string, results: AuditResults, score: AuditScore) => void }) {
  const [step, setStep]           = useState<'url' | 'scanning' | 'manual'>('url')
  const [url, setUrl]             = useState('')
  const [progress, setProgress]   = useState(0)
  const [scanLabel, setScanLabel] = useState(SCAN_STEPS[0])
  const [error, setError]         = useState('')
  const [mode, setMode]           = useState<'ai' | 'manual'>('ai')
  const [results, setResults]     = useState<AuditResults>({})
  const [activeCat, setActiveCat] = useState('technical')

  const runAI = async () => {
    if (!url.trim()) return
    setStep('scanning'); setProgress(0); setError('')
    let p = 0
    const t = setInterval(() => {
      p += Math.random() * 1.5 + 0.5
      setScanLabel(SCAN_STEPS[Math.min(Math.floor((p / 100) * SCAN_STEPS.length), SCAN_STEPS.length - 1)])
      if (p >= 90) { clearInterval(t); setProgress(90) } else setProgress(Math.round(p))
    }, 120)
    try {
      const res = await fetch('/api/audit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url }) })
      clearInterval(t)
      if (!res.ok) throw new Error('failed')
      const data = await res.json()
      setProgress(100)
      setTimeout(() => onComplete(url, data.results, data.scores), 400)
    } catch { clearInterval(t); setError('AI audit failed. Try manual mode.'); setStep('url') }
  }

  if (step === 'scanning') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 }}>
      <ScoreRing score={progress} size={150} />
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{scanLabel}</div>
      <div style={{ fontSize: 13, color: C.muted }}>{url}</div>
      <div style={{ width: 300, background: C.border, borderRadius: 4, height: 4 }}>
        <div style={{ height: 4, borderRadius: 4, background: C.accent, width: `${progress}%`, transition: 'width 0.2s' }} />
      </div>
    </div>
  )

  if (step === 'manual') {
    const cat = AUDIT_CATEGORIES.find(c => c.id === activeCat)!
    return (
      <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text }}>Manual Audit</h1>
            <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>{url || 'No URL entered'}</div>
          </div>
          <button onClick={() => onComplete(url || 'Manual Audit', results, calculateScore(results))}
            style={{ background: C.green, border: 'none', borderRadius: 8, padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Complete Audit →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {AUDIT_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              background: activeCat === c.id ? c.color : C.surface,
              border: `1px solid ${activeCat === c.id ? c.color : C.border}`,
              borderRadius: 8, padding: '8px 16px', color: activeCat === c.id ? '#fff' : C.muted,
              fontSize: 12, fontWeight: activeCat === c.id ? 700 : 400, cursor: 'pointer' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {cat.sections.map(sec => (
          <div key={sec.id} style={{ marginBottom: 16 }}>
            <div style={{ padding: '10px 16px', background: cat.color, borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: 700, color: '#fff' }}>{sec.label}</div>
            {sec.items.map((item, i) => {
              const s = results[item.id] as string | undefined
              return (
                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 14,
                  padding: '12px 16px', background: i % 2 === 0 ? C.surface : C.surfaceHover,
                  borderBottom: `1px solid ${C.border}` }}>
                  <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                    background: `${SEV[item.priority]}22`, border: `1px solid ${SEV[item.priority]}44`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, fontWeight: 700, color: SEV[item.priority] }}>{item.num}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: C.text, marginBottom: 3 }}>{item.item}</div>
                    <div style={{ fontSize: 11, color: C.muted, fontStyle: 'italic', lineHeight: 1.5 }}>{item.howTo}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
                    {(['Pass','Partial','Fail','N/A'] as const).map(v => (
                      <button key={v} onClick={() => setResults(r => ({ ...r, [item.id]: v }))} style={{
                        padding: '5px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        border: `1px solid ${s === v ? STATUS_COLOR[v] : C.border}`,
                        background: s === v ? STATUS_BG[v] : 'transparent',
                        color: s === v ? STATUS_COLOR[v] : C.muted }}>{v}</button>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ maxWidth: 520, width: '100%', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>New Audit</div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 10 }}>Enter a URL to audit</h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Claude AI analyzes <strong style={{ color: C.text }}>190 UX + SEO signals</strong> and generates a full scored report.
        </p>
        <div style={{ display: 'flex', background: C.surface, borderRadius: 10, padding: 4, marginBottom: 20, border: `1px solid ${C.border}` }}>
          {(['ai','manual'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: '8px', borderRadius: 7, border: 'none',
              background: mode === m ? C.accent : 'transparent', color: mode === m ? '#fff' : C.muted,
              fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer' }}>
              {m === 'ai' ? '⚡ AI Auto-Audit' : '✍️ Manual Audit'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'ai' ? runAI() : setStep('manual'))}
            placeholder={mode === 'ai' ? 'https://yoursite.com' : 'https://yoursite.com (optional)'}
            style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 10,
              padding: '14px 18px', color: C.text, fontSize: 14, outline: 'none' }} />
          <button onClick={mode === 'ai' ? runAI : () => setStep('manual')} style={{
            background: C.accent, border: 'none', borderRadius: 10, padding: '14px 22px',
            color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {mode === 'ai' ? 'Run →' : 'Start →'}
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{error}</div>}
      </div>
    </div>
  )
}

function WhiteLabelView() {
  const [name, setName]   = useState('Acme Agency')
  const [color, setColor] = useState('#0EA5E9')
  return (
    <div style={{ padding: '32px 36px', flex: 1, overflowY: 'auto' }}>
      <h1 style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8 }}>White Label</h1>
      <p style={{ color: C.muted, fontSize: 13, marginBottom: 28 }}>Customize branding on client-facing PDF reports.</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 680 }}>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Agency Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={{ width: '100%',
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 8,
              padding: '10px 14px', color: C.text, fontSize: 13, outline: 'none' }} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 11, color: C.muted, fontWeight: 600, textTransform: 'uppercase',
              letterSpacing: '0.08em', display: 'block', marginBottom: 8 }}>Brand Color</label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                style={{ width: 44, height: 44, border: 'none', borderRadius: 8, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: C.muted }}>{color}</span>
            </div>
          </div>
          <button style={{ background: color, border: 'none', borderRadius: 8, padding: '11px 20px',
            color: '#fff', fontWeight: 600, fontSize: 13, width: '100%', cursor: 'pointer' }}>Save Changes</button>
        </div>
        <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 20 }}>PDF Preview</div>
          <div style={{ background: C.bg, borderRadius: 10, padding: 20, border: `1px solid ${C.border}` }}>
            <div style={{ background: color, borderRadius: 8, padding: '16px 20px', marginBottom: 14 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#fff' }}>{name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>UX + SEO Audit Report</div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Technical','On-Page','UX','CRO'].map((l, i) => (
                <div key={l} style={{ flex: 1, background: C.surface, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color, lineHeight: 1 }}>{[72,58,81,44][i]}</div>
                  <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [page, setPage]       = useState('dashboard')
  const [score, setScore]     = useState<AuditScore | null>(null)
  const [issues, setIssues]   = useState<ReturnType<typeof getTopIssues>>([])
  const [auditUrl, setUrl]    = useState('')
  const [results, setResults] = useState<AuditResults>({})

  const handleComplete = (url: string, res: AuditResults, sc: AuditScore) => {
    setUrl(url); setScore(sc); setResults(res); setIssues(getTopIssues(res)); setPage('dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {page === 'dashboard'  && <DashboardView score={score} issues={issues} auditUrl={auditUrl} results={results} setPage={setPage} />}
        {page === 'audit'      && <div style={{ flex: 1, display: 'flex', overflowY: 'auto' }}><AuditView onComplete={handleComplete} /></div>}
        {page === 'whitelabel' && <WhiteLabelView />}
      </div>
    </div>
  )
}
