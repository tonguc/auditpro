# AuditPro — Proje Notları

## Proje Yapısı

Bu repo iki ayrı üründen oluşuyor:

### 1. Online App (Next.js)
`app/` ve `lib/` klasörleri — Vercel'e deploy edilen, API'li, AI destekli audit uygulaması.
- URL bazlı AI audit (Claude API)
- ZIP upload audit
- Manuel audit
- White label PDF export
- Çoklu audit localStorage geçmişi

### 2. Offline Audit Tool (Standalone HTML) ← ANA ÜRÜN
**Dosya:** `auditpro-offline.html`

Etsy ve Gumroad'da satılmak üzere hazırlanan, **tek HTML dosyası** olarak çalışan offline audit aracı.

- React 18 + ReactDOM bundle içinde (sunucu gerekmez)
- Tarayıcıda direkt açılır, kurulum yok
- **211 audit maddesi, 5 kategori**
- Mevcut versiyon: **v1.0** (launch-ready)
- ZIP: `AuditPro_V1.0.zip` (~405KB)

#### Offline Tool Kategorileri
1. ⚙️ Technical SEO (65 items)
2. 📝 On-Page & Content (50 items)
3. 🎯 UX Heuristics (40 items)
4. ⚡ Conversion & CTA (35 items)
5. 🤖 AI & SERP Visibility (21 items)

#### ZIP İçeriği (5 dosya)
- `auditpro-offline.html` — Ana araç
- `QuickStart.html` — Adım adım rehber (yazdırılabilir)
- `Sample_Full_Audit.pdf` — 100% coverage, Grade B (86/100)
- `Sample_Partial_Audit.pdf` — 40% coverage, grade withheld (Directional Score)
- `README.txt` — Kullanım notları

---

## Geliştirme Notları

### Branch
`claude/adoring-cray-6whcy`

### Offline Tool'a Yeni Özellik Eklerken
- `auditpro-offline.html` tek dosya — tüm CSS, JS ve data içinde
- React 18 CDN bundle kullanıyor (minified, inline)
- localStorage ile state saklanıyor:
  - `auditpro_audits` — audit geçmişi
  - `auditpro_whitelabel` — brand ayarları (key: `brandColor`, NOT `primaryColor`)
  - `auditpro_theme` — dark/light
  - `auditpro_onboarded` — onboarding modal dismissed flag
- PDF export: jsPDF (CDN, inline) — `window.print()` değil
- Deploy gerekmez, direkt tarayıcıda test edilebilir
- Test suite: `node test_auditpro.mjs` — 43/43 test geçmeli

### JS Syntax Kontrolü
Her büyük değişiklikten sonra:
```bash
node --input-type=module <<'EOF'
import { readFileSync } from 'fs';
const html = readFileSync('./auditpro-offline.html', 'utf8');
const scriptMatches = [...html.matchAll(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/g)];
let combined = '';
for (const m of scriptMatches) combined += m[1] + '\n';
try { new Function(combined); console.log('JS syntax OK'); }
catch(e) { console.log('SYNTAX ERROR:', e.message); }
EOF
```

### PDF Koordinat Sistemi
- A4: W=210mm, H=297mm, M=15 (sol/sağ margin)
- jsPDF kullanılıyor — tüm koordinatlar mm cinsinden
- `checkPageBreak(h)` ile sayfa taşması kontrol edilir
- `addPage()` ile yeni sayfa açılır, footer her sayfaya `drawFooter()` ile eklenir

### splitTextToSize() Kritik Kural
**`setFontSize()` + `setFont()` her zaman `splitTextToSize()` çağrısından ÖNCE yapılmalı.**
Aksi halde ölçüm yanlış font boyutunda yapılır, render'da metin taşar.

```js
// DOĞRU
doc.setFontSize(7);
doc.setFont('helvetica', 'normal');
const lines = doc.splitTextToSize(text, width);

// YANLIŞ — taşma riski
const lines = doc.splitTextToSize(text, width);
doc.setFontSize(7);
```

### PDF Generation Script (Playwright)
`/tmp/gen_final_pdfs2.mjs` — sample PDF'leri üretir.
- Item ID regex: `/id:\s*'((?:[toucs]\d+|serp\d+))'/g` — serp\d+ dahil
- Seed: `score:null` → reload → `calculateScore()` in page → reseed with score → reload
- Blob intercept: `URL.createObjectURL` override ile PDF base64 yakalanır
- White label config key: `brandColor` (NOT `primaryColor`)

---

## Scoring Sistemi (Coverage-Aware)

### catCovLevel(evaluated, total)
```js
// 0 item:    Not Reviewed Yet    | confidence: None     | showGrade: false | isLow
// 1-29%:    Preliminary Score    | confidence: Low      | showGrade: false | isLow
// 30-59%:   Directional Score    | confidence: Med-Low  | showGrade: false | isDirect ← grade withheld
// 60-79%:   Indicative Score     | confidence: Medium   | showGrade: true  | isMed
// 80%+:     Full Audit Score     | confidence: High     | showGrade: true  | isHigh
```

**Önemli:** %60 altında hiçbir yerde letter grade gösterilmez.

### Skor Hesabı
- Blank (boş) itemlar skora girmez — ne pass ne fail
- N/A itemlar hariç tutulur
- Sadece reviewed (Pass/Partial/Fail) itemlar hesaplanır
- `calculateScore()` — genel skor ve kategori bazlı skorlar döndürür

### Confidence Dili (tutarlı kullanım)
- `Low confidence` — %30 altı
- `Medium-low confidence` — %30-59 (küçük 'l')
- `Medium confidence` — %60-79
- `High confidence` — %80+

---

## PDF Yapısı (Sayfa Sırası)

1. **Cover Page** — Genel skor, grade (≥60% ise), Section Scores tablosu
2. **Executive Summary Page** — Exec summary, Estimated Impact, Audit Summary stats, Top Priority Issues
3. **Category Detail Pages** (5 adet) — Her kategori için ayrı sayfa, section insights, checklist
4. **Next Steps Page** — 5 adımlı aksiyon planı (coverage'a göre dinamik)
5. **About This Report Page** — Prepared By/For kartları, scoring metodolojisi

### Section Scores Tablosu (Cover)
Format: CATEGORY | COVERAGE bar+% | REVIEWED SCORE | CONFIDENCE
- Grade kolonu yok — confusion önlenir
- Tüm kategoriler aynı formatta gösterilir

### Audit Summary Stats (Executive Page)
5 kutu: Total Checks / Reviewed / Passed / Partial / Failed
- Her kutunun üstünde ince renkli aksent çubuğu

### Top Priority Issues
- Sol renkli aksent çubuğu (priority rengi)
- Kolon başlıkları: PRIORITY | ISSUE · WHY IT MATTERS · ACTION
- `→` işaretiyle renklendirilmiş aksiyon satırı
- `getImpactAndFix()` kural motorundan impact/fix alır

### AI/SERP Category — PDF Özel Kural
`serp + evaluated === 0` durumunda:
- covLine draw edilmez (overlap bug önlenir)
- Subtitle text y=22.5'te: "Assess readiness for ChatGPT, Perplexity, Gemini & next-generation search experiences"

### IMPACT_MAP Kural Motoru
`getImpactAndFix(itemText, howTo)` — item metnindeki anahtar kelimelere göre spesifik why/biz/fix döndürür.
Match bulunamazsa generic fallback kullanılır.

**Kritik:** Anahtar kelimeler `combined.includes(k)` ile eşlenir — regex değil, literal string.
```js
// DOĞRU
keys: ['touch target', 'tap target', '48px']

// ÇALIŞMAZ — includes() regex anlamaz
keys: ['tap.*size', 'touch.*size']
```

**First-match-wins:** Spesifik kurallar genel kurallardan ÖNCE gelmelidir.
- `heading hierarchy correct` → h1 kuralından önce
- `session id / tracking param` → GA4/analytics kuralından önce
- `mobile page load / 4g` → webp/image kuralından önce
- `can undo / go back` → heading kuralından önce
- `webp image / .webp` (substring trap: 'webp' matches 'webpagetest')

---

## AI/SERP Tone Kuralları (v1.0 Launch)

**Yasak dil (overclaiming):**
- ~~"major traffic sources"~~
- ~~"Optimize your presence in ChatGPT"~~
- ~~"cited by modern search"~~
- ~~"primary discovery channel"~~

**Doğru dil (readiness/signals):**
- "AI-assisted search experiences are becoming an important discovery layer"
- "Assess readiness for ChatGPT, Perplexity, Gemini & next-generation search experiences"
- "potentially cited by modern search and AI systems"
- "potential citation across AI-driven search experiences"
- "Where relevant, consider /llms.txt... emerging practice, not a guaranteed factor"

---

## OnboardingModal (v1.0)

İlk kez açan kullanıcıya gösterilen "Before You Audit" overlay:

```js
// localStorage key
'auditpro_onboarded' = '1'  // set on dismiss, check on init

// State init
const [showOnboarding, setShowOnboarding] = useState(() => {
  try { return !localStorage.getItem('auditpro_onboarded'); }
  catch { return false; }
});
```

- Her iki buton da aynı dismiss handler'ı çağırır
- App return: `React.Fragment` wrapper ile modal sibling olarak render edilir
- Test suite: `freshPage()` her zaman `auditpro_onboarded:'1'` seed eder (returning user sim.)

**Modal içeriği:**
1. AuditPro is a manual toolkit (crawler değil)
2. Blank ve N/A itemlar skora girmez
3. Partial vs full audit use cases
4. "Higher coverage = higher confidence" callout
5. Primary: "I Understand — Start Auditing"
6. Secondary: "Don't show this again"

---

## White Label PDF Showcase (Dashboard)

White Label tab'ında "Client Report Showcase" bölümü:
- **Üstte:** Full-width overlapping PDF mockup (cover page önde, exec summary arkada)
  - Cover: SAMPLE REPORT band → brand-color agency header → 86/100 + Grade B 64px → section scores
  - Exec summary: hafifçe görünür arkada
- **Altta:** 4 value item, 2×2 grid, borderless box format
  - 🏷️ Brand every PDF with your agency identity
  - 📊 Avoid premature grades with coverage-aware scoring
  - 🎯 Turn findings into prioritized fixes
  - ✅ Audit SEO, UX, CRO, and AI visibility
- Wrapper: sadece `marginTop:8` — arka plan/border yok, mockup kart genişliğini tam kullanır
- Agency adı ve website canlı olarak White Label config'den gelir

---

## Bilinen v1.1 Backlog

- IMPACT_MAP coverage artırılabilir (kaç item generic fallback'e düşüyor ölçülmedi)
- N/A edge case: tüm itemlar N/A ise "Not evaluated" yerine daha doğru mesaj
- White Label boş bırakılırsa PDF edge case test edilmeli
- Re-audit karşılaştırma özelliği (v1 yok, listing'de vaat edilmemeli)
- WEAKEST_MEANING `serp` için partial audit bağlamı (40% overall ama Technical 100% → Section Scores tablosu zaten çözüyor)

---

## Bu Oturumda Yapılanlar (v1.0 Final Launch)

### Dashboard PDF Preview — Client Report Showcase
- Carousel (5 slayt) tamamen kaldırıldı
- Yerine static "Client Report Showcase" layout:
  - İlk versiyon: 2-kolon (sol kartlar + sağ mockup)
  - Son versiyon: full-width mockup üstte + 4 value box altta
- Mockup font boyutları: agency adı 16px, skor 64px, Grade B badge 64×64, section scores 9.5px
- Back page (exec summary) hafifçe görünür (absolute, offset 14px)
- SAMPLE REPORT: açık gri band (#e6e8f0) — subtle, ucuzlatmıyor
- "Full sample · 100% coverage · High confidence" context notu 7px (okunabilir)

### AI/SERP Bug & Tone Fixes
- **PDF concat bug:** `serp + evaluated=0` → covLine ve subtitle aynı y=22.5'e yazılıyordu → "scoreOptimize" concatenation → düzeltildi
- Subtitle: "Optimize your presence" → "Assess readiness for ChatGPT, Perplexity, Gemini & next-generation search experiences"
- AI_SERP_INTRO: "cited" → "potentially cited", "AI-driven" → "AI-assisted"
- Next Steps step 4: "major traffic sources" → "important discovery layer"
- llms.txt IMPACT_MAP: "Add llms.txt" → "Where relevant, consider /llms.txt... emerging practice"
- Section insights (serp): "citation" → "potential citation"

### OnboardingModal — Before You Audit
- Yeni `OnboardingModal` bileşeni (ClearAllModal ile aynı stil)
- `App` component: `showOnboarding` state + `handleDismissOnboarding` handler
- App return: `React.Fragment` wrapper (modal sibling overlay olarak)
- localStorage: `auditpro_onboarded` — set on dismiss, checked on init
- test_auditpro.mjs: `freshPage()` her zaman `auditpro_onboarded:'1'` seed eder

### QuickStart.html
- "Before You Audit" bölümü eklendi (Section 1'den önce)
- Partial vs Full audit karşılaştırma kartları (yeşil/mavi)
- Coverage threshold açıklaması
- Backup reminder

### README.txt
- "IMPORTANT: HOW SCORING WORKS" bölümü eklendi
- Blank/NA dışlanma, coverage = confidence, grade threshold, use cases

### Scoring & Grade Mantığı (önceki oturum)
- 4-tier coverage sistemi: 0% / 1-29% / 30-59% / 60-79% / 80%+
- Grade eşiği %60'a yükseltildi — isDirect (30-59%) artık grade withheld
- `catCovLevel()` tüm PDF ve UI'da tutarlı

### PDF Tasarım (önceki oturum)
- Section Scores → flat tablo (CATEGORY | COVERAGE | REVIEWED SCORE | CONFIDENCE)
- Audit Summary → 5 renkli stat kutusu
- Top Priority Issues → flat satır düzeni, sol aksent çubuğu, → aksiyon
- About This Report → profesyonel kart düzeni

### Kritik Bug Fixes (önceki oturum)
- `totalItems2` duplicate const → siyah ekran — düzeltildi
- `splitTextToSize()` font sıralama hatası — 5 yerde düzeltildi
- IMPACT_MAP first-match-wins ordering: undo, heading-hierarchy, session-id, GA4, mobile-load, browser-back, pagination
- `webp` substring trap: 'webp' → 'webp image' / '.webp' (webpagetest false match önlendi)
- White label `primaryColor` → `brandColor` (PDF generation crash fix)
- Item ID regex: `[toucs]\d+` → `(?:[toucs]\d+|serp\d+)` (serp items eksikti)

### WEAKEST_MEANING Copy (önceki oturum)
```js
const WEAKEST_MEANING = {
  technical: 'the technical foundation, improving how search engines crawl, index, and rank the site',
  onpage: 'on-page content and search signals, increasing keyword relevance and organic click-through rates',
  ux: 'user experience, reducing the friction that causes visitors to disengage before converting',
  cro: 'conversion performance, closing the gaps that prevent visitors from becoming customers',
  serp: 'AI and search visibility, strengthening the signals that drive brand presence in modern search results'
};
// "the " prefix stripping: .replace(/^the\s+/i, '') for "A stronger X" sentence
```
