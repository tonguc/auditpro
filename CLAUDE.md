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
- 190 audit maddesi, 5 kategori
- Mevcut versiyon: **v2.5.1**
- Bu dosya üzerinde çalışmalara devam edilecek

#### Offline Tool Kategorileri
1. ⚙️ Technical SEO (65 items)
2. 📝 On-Page & Content (50 items)
3. 🎯 UX Heuristics (40 items)
4. ⚡ Conversion & CTA (35 items)
5. 🤖 AI & SERP Visibility (11 items)

#### Offline Tool'a Yapılan Son Değişiklikler
- Grade renk skalası: A=yeşil, B=mavi/cyan, C=amber, D=kırmızı
- Grade harfi büyük ve glow efektiyle sağda gösteriliyor

## Geliştirme Notları

### Branch
`claude/adoring-cray-6whcy`

### Offline Tool'a Yeni Özellik Eklerken
- `auditpro-offline.html` tek dosya — tüm CSS, JS ve data içinde
- React 18 CDN bundle kullanıyor (minified, inline)
- localStorage ile state saklanıyor (`auditpro_results`, `auditpro_url`)
- Print/PDF export: `window.print()`
- Deploy gerekmez, direkt tarayıcıda test edilebilir
