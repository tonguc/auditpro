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

const SEV: Record<string, string> = {
  Critical: '#EF4444', High: '#F59E0B', Medium: '#0EA5E9', Low: '#10B981',
}

function ScoreRing({ score, size = 120, color = C.accent }: { score: number; size?: number; color?: string }) {
  const stroke = 10
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
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
        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
          <span style={{ color: C.accent }}>Audit</span>Pro
        </div>
        <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>UX + SEO Intelligence</div>
      </div>
      <nav style={{ padding: '16px 12px', flex: 1 }}>
        {nav.map(n => (
          <div key={n.id} onClick={() => setPage(n.id)} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
            borderRadius: 8, cursor: 'pointer', marginBottom: 2,
            background: page === n.id ? `${C.accentDim}55` : 'transparent',
            color: page === n.id ? C.accent : C.muted,
          }}>
            <span style={{ fontSize: 14, width: 18, textAlign: 'center' }}>{n.icon}</span>
            <span style={{ fontSize: 13, fontWeight: page === n.id ? 600 : 400 }}>{n.label}</span>
          </div>
        ))}
      </nav>
      <div style={{ padding: '16px 24px', borderTop: `1px solid ${C.border}`,
        fontSize: 11, color: C.muted }}>auditpro.tonguckaracay.com</div>
    </div>
  )
}

function DashboardView({ score, issues, auditUrl, setPage }: {
  score: AuditScore | null
  issues: ReturnType<typeof getTopIssues>
  auditUrl: string
  setPage: (p: string) => void
}) {
  if (!score) return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: 16 }}>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <div style={{ fontSize: 11, color: C.muted, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>{auditUrl}</div>
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
            <div key={cat.id} style={{ background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 12, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600,
                    textTransform: 'uppercase', marginBottom: 4 }}>{cat.icon} {cat.label}</div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: C.text, lineHeight: 1 }}>
                    {cat.score}<span style={{ fontSize: 12, color: C.muted }}>/100</span>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>
                    {cat.passed} pass · {cat.failed} fail
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
        {issues.slice(0, 10).map((issue, i) => (
          <div key={issue.id} style={{ padding: '13px 24px',
            borderBottom: i < 9 ? `1px solid ${C.border}` : 'none',
            display: 'flex', alignItems: 'center', gap: 14,
            background: i % 2 === 0 ? 'transparent' : `${C.bg}66` }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%',
              background: SEV[issue.priority] ?? C.muted, flexShrink: 0 }} />
            <div style={{ flex: 1, fontSize: 13, color: C.text }}>{issue.item}</div>
            <div style={{ fontSize: 11, color: C.muted, background: C.border,
              borderRadius: 6, padding: '3px 10px', whiteSpace: 'nowrap' }}>{issue.category}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: SEV[issue.priority] ?? C.muted,
              textTransform: 'uppercase', width: 60, textAlign: 'right' }}>{issue.priority}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SCAN_STEPS = [
  'Crawling site structure…', 'Checking Technical SEO…',
  'Analyzing On-Page content…', 'Evaluating UX heuristics…',
  'Auditing CRO elements…', 'Generating AI report…',
]

function AuditView({ onComplete }: {
  onComplete: (url: string, results: AuditResults, score: AuditScore) => void
}) {
  const [step, setStep]         = useState<'url' | 'scanning' | 'manual'>('url')
  const [url, setUrl]           = useState('')
  const [progress, setProgress] = useState(0)
  const [scanLabel, setScanLabel] = useState(SCAN_STEPS[0])
  const [error, setError]       = useState('')
  const [mode, setMode]         = useState<'ai' | 'manual'>('ai')
  const [results, setResults]   = useState<AuditResults>({})
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
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      clearInterval(t)
      if (!res.ok) throw new Error('Audit failed')
      const data = await res.json()
      setProgress(100)
      setTimeout(() => onComplete(url, data.results, data.scores), 400)
    } catch {
      clearInterval(t)
      setError('AI audit failed. Try manual mode or check your API key.')
      setStep('url')
    }
  }

  if (step === 'scanning') return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', padding: 40, gap: 20 }}>
      <ScoreRing score={progress} size={150} />
      <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>{scanLabel}</div>
      <div style={{ fontSize: 13, color: C.muted }}>{url}</div>
      <div style={{ width: 300, background: C.border, borderRadius: 4, height: 4 }}>
        <div style={{ height: 4, borderRadius: 4, background: C.accent,
          width: `${progress}%`, transition: 'width 0.2s' }} />
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
          <button onClick={() => { const sc = calculateScore(results); onComplete(url || 'Manual Audit', results, sc) }}
            style={{ background: C.green, border: 'none', borderRadius: 8,
              padding: '10px 20px', color: '#fff', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
            Complete Audit →
          </button>
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {AUDIT_CATEGORIES.map(c => (
            <button key={c.id} onClick={() => setActiveCat(c.id)} style={{
              background: activeCat === c.id ? c.color : C.surface,
              border: `1px solid ${activeCat === c.id ? c.color : C.border}`,
              borderRadius: 8, padding: '8px 16px',
              color: activeCat === c.id ? '#fff' : C.muted,
              fontSize: 12, fontWeight: activeCat === c.id ? 700 : 400, cursor: 'pointer' }}>
              {c.icon} {c.label}
            </button>
          ))}
        </div>
        {cat.sections.map(sec => (
          <div key={sec.id} style={{ marginBottom: 16 }}>
            <div style={{ padding: '10px 16px', background: cat.color,
              borderRadius: '8px 8px 0 0', fontSize: 12, fontWeight: 700, color: '#fff' }}>
              {sec.label}
            </div>
            {sec.items.map((item, i) => {
              const s = results[item.id]
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
                    {(['Pass', 'Partial', 'Fail', 'N/A'] as const).map(v => {
                      const vc = v === 'Pass' ? C.green : v === 'Fail' ? C.red : v === 'Partial' ? C.amber : C.muted
                      return (
                        <button key={v} onClick={() => setResults(r => ({ ...r, [item.id]: v }))} style={{
                          padding: '5px 9px', borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                          border: `1px solid ${s === v ? vc : C.border}`,
                          background: s === v ? `${vc}22` : 'transparent',
                          color: s === v ? vc : C.muted,
                        }}>{v}</button>
                      )
                    })}
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
        <div style={{ fontSize: 11, color: C.accent, fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 16 }}>New Audit</div>
        <h2 style={{ fontSize: 32, fontWeight: 800, color: C.text, marginBottom: 10 }}>
          Enter a URL to audit
        </h2>
        <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 32 }}>
          Claude AI analyzes <strong style={{ color: C.text }}>190 UX + SEO signals</strong> and generates a full scored report.
        </p>
        <div style={{ display: 'flex', background: C.surface, borderRadius: 10, padding: 4,
          marginBottom: 20, border: `1px solid ${C.border}` }}>
          {(['ai', 'manual'] as const).map(m => (
            <button key={m} onClick={() => setMode(m)} style={{
              flex: 1, padding: '8px', borderRadius: 7, border: 'none',
              background: mode === m ? C.accent : 'transparent',
              color: mode === m ? '#fff' : C.muted,
              fontSize: 13, fontWeight: mode === m ? 600 : 400, cursor: 'pointer' }}>
              {m === 'ai' ? '⚡ AI Auto-Audit' : '✍️ Manual Audit'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
          <input value={url} onChange={e => setUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (mode === 'ai' ? runAI() : setStep('manual'))}
            placeholder={mode === 'ai' ? 'https://yoursite.com' : 'https://yoursite.com (optional)'}
            style={{ flex: 1, background: C.surface, border: `1px solid ${C.border}`,
              borderRadius: 10, padding: '14px 18px', color: C.text, fontSize: 14, outline: 'none' }} />
          <button onClick={mode === 'ai' ? runAI : () => setStep('manual')} style={{
            background: C.accent, border: 'none', borderRadius: 10,
            padding: '14px 22px', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {mode === 'ai' ? 'Run →' : 'Start →'}
          </button>
        </div>
        {error && <div style={{ fontSize: 12, color: C.red, marginTop: 8 }}>{error}</div>}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginTop: 16 }}>
          {['190 checks', 'AI-powered', 'Pass/Fail scoring', 'Priority issues'].map(t => (
            <span key={t} style={{ fontSize: 12, color: C.muted }}>✓ {t}</span>
          ))}
        </div>
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
          <button style={{ background: color, border: 'none', borderRadius: 8,
            padding: '11px 20px', color: '#fff', fontWeight: 600, fontSize: 13, width: '100%', cursor: 'pointer' }}>
            Save Changes
          </button>
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
  const [page, setPage]         = useState('dashboard')
  const [score, setScore]       = useState<AuditScore | null>(null)
  const [issues, setIssues]     = useState<ReturnType<typeof getTopIssues>>([])
  const [auditUrl, setAuditUrl] = useState('')

  const handleComplete = (url: string, results: AuditResults, sc: AuditScore) => {
    setAuditUrl(url)
    setScore(sc)
    setIssues(getTopIssues(results))
    setPage('dashboard')
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.bg, color: C.text,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      <Sidebar page={page} setPage={setPage} />
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {page === 'dashboard'  && <DashboardView score={score} issues={issues} auditUrl={auditUrl} setPage={setPage} />}
        {page === 'audit'      && <div style={{ flex: 1, display: 'flex', overflowY: 'auto' }}><AuditView onComplete={handleComplete} /></div>}
        {page === 'whitelabel' && <WhiteLabelView />}
      </div>
    </div>
  )
}
