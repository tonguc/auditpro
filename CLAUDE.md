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
- **211 audit maddesi, 5 kategori** (önceki versiyon: 190 madde)
- Mevcut versiyon: **v1.0** (Etsy'ye çıkmaya hazır)
- ZIP: `AuditPro_V1.0.zip`

#### Offline Tool Kategorileri
1. ⚙️ Technical SEO (65 items)
2. 📝 On-Page & Content (50 items)
3. 🎯 UX Heuristics (40 items)
4. ⚡ Conversion & CTA (35 items)
5. 🤖 AI & SERP Visibility (11 items)

---

## Geliştirme Notları

### Branch
`claude/adoring-cray-6whcy`

### Offline Tool'a Yeni Özellik Eklerken
- `auditpro-offline.html` tek dosya — tüm CSS, JS ve data içinde
- React 18 CDN bundle kullanıyor (minified, inline)
- localStorage ile state saklanıyor (`auditpro_audits`, `auditpro_whitelabel`, `auditpro_theme`)
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

---

## Scoring Sistemi (Coverage-Aware)

### catCovLevel(evaluated, total)
```js
// 0 item:   Not Reviewed Yet   | confidence: None  | showGrade: false | isLow
// 1-29%:   Preliminary Score   | confidence: Low   | showGrade: false | isLow
// 30-59%:  Directional Score   | confidence: Med-Low | showGrade: false | isDirect  ← grade withheld
// 60-79%:  Indicative Score    | confidence: Medium | showGrade: true  | isMed
// 80%+:    Full Audit Score    | confidence: High  | showGrade: true  | isHigh
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

---

## Bilinen v1.1 Backlog

- IMPACT_MAP coverage artırılabilir (kaç item generic fallback'e düşüyor ölçülmedi)
- N/A edge case: tüm itemlar N/A ise "Not evaluated" yerine daha doğru mesaj
- White Label boş bırakılırsa PDF edge case test edilmeli
- Re-audit karşılaştırma özelliği (v1 yok, listing'de vaat edilmemeli)
- Örnek PDF listing'e eklenmeli (tam dolu audit, iki farklı grade senaryosu)

---

## Bu Oturumda Yapılanlar (v1.0 Launch Polish)

### Scoring & Grade Mantığı
- 4-tier coverage sistemi kuruldu: 0% / 1-29% / 30-59% / 60-79% / 80%+
- **Grade eşiği %60'a yükseltildi** — isDirect (30-59%) artık grade withheld
- `catCovLevel()` tüm PDF ve UI'da tutarlı kullanılıyor
- Cover, kategori detay, About sayfası hepsi aynı grade mantığını sergiliyor

### PDF Tasarım Değişiklikleri
- **Section Scores** → kolon başlıklı flat tablo (CATEGORY | COVERAGE | REVIEWED SCORE | CONFIDENCE)
- **Audit Summary** → 5 renkli stat kutusu (Reviewed eklendi, aksent çubuğu)
- **Top Priority Issues** → flat satır düzeni, sol aksent çubuğu, → aksiyon satırı
- **About This Report** → profesyonel kart düzeni (lcy/rcy sıralı takip, email taşması yok)
- **Category detail satırlar** → 8mm → 9mm, bölümler arası +8mm boşluk

### Metin ve Copy
- About sayfası scoring açıklaması rapor davranışıyla uyumlu hale getirildi
- Potential Improvements closing: "The reviewed findings point to [Category] as the clearest near-term opportunity"
- Confidence dili tutarlılaştırıldı: `Medium-low confidence` (küçük 'l') her yerde
- Touch targets IMPACT_MAP'e spesifik giriş eklendi

### Kritik Bug Düzeltmeleri
- `totalItems2` duplicate const → siyah ekran (JS syntax error) — düzeltildi
- `splitTextToSize()` font sıralama hatası → 5 farklı yerde render/ölçüm fontu uyumsuzluğu — düzeltildi
- Bullet metinleri `splitTextToSize` ile sarmalandı (POTENTIAL IMPROVEMENTS taşması)
- `catCovLevel()` showGrade isDirect için false yapıldı
