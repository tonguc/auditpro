# Povlex GEO Aksiyon Planı — 23 Eylül 2026

Bu plan, **ölçülmüş kanıttan** türetilmiştir (Povlex-P1-P3 planı B2 kalibrasyon programı). Buradaki eylem önerileri ölçülen verilere dayanır; "hipotez" olarak işaretlenenler ölçülmemiştir.

---

## 1. Ölçüm kanıtı (yayımlanabilir kalitede)

Kaynak: `design/validation-matrix/ai-visibility-comparative-2026-09-23T17-14-42-635Z.json` — **2 bağımsız koşu, %100 kapsam, 256 başarılı yanıt**, 30 sabit Türkçe isimsiz keşif sorusu × 4 motor (ChatGPT, Gemini, Perplexity, Claude); yayın kapısı `eligible: true`.

| Metrik | Sonuç |
|--------|-------|
| **İsimsiz keşif sorularında anılma** | **0 / 224** |
| **Hedef alan adının (povlex.com) alıntılanması** | **0 / 256** |
| Marka adıyla sorulan sorularda anılma | 16 / 16 (beklenen: soru markayı içeriyor) |
| Kaynak metadata'sı taşıyan yanıt | 201 / 256 (%79) |

**Okuma:** Motorlar Povlex'i **doğrudan sorulduğunda tanıyor**, ama sektör sorularında **hiç önermiyor** ve **hiç kaynak göstermiyor**. Bu, ürün bilinirliği değil **kaynak/otorite boşluğu** sorunudur — yani içerik ve üçüncü taraf görünürlüğüyle çözülebilir.

## 2. Motorlar nereden alıntı yapıyor? (kaynak yüzeyleri)

256 yanıttan derlenen alıntı domainleri — **görünürlüğün kazanılacağı yüzeyler bunlardır**:

| Kaynak | Alıntı | Ne tür yüzey |
|--------|--------|--------------|
| semrush.com | 114 | Blog + araç + karşılaştırma |
| ahrefs.com | 66 | Blog + araç |
| seobility.net | 66 | Ücretsiz SEO test aracı + liste |
| zapier.com | 63 | "En iyi X araçları" listicle'ları |
| seranking.com | 62 | Araç + blog |
| onelittleweb.com | 58 | AI araç dizini/karşılaştırma |
| blog.hubspot.com | 52 | Listicle + rehber |
| agencyanalytics.com | 40 | Ajans araçları listeleri |
| seoptimer.com | 40 | Ücretsiz denetim aracı + dizin |
| experte.com | 36 | Araç test/inceleme (DE) |
| flowninja.ai / airops.com | 32 / 30 | AI araç dizinleri |
| justdial.com | 28 | Yerel/servis dizini (TR dahil) |
| spyfu.com | 20 | Araç + karşılaştırma |

## 3. Kim görünüyor? (rakip görünürlüğü)

Aynı yanıtlarda **anılan** markalar (görünme sayısı): semrush.com 72 · zapier.com 59 · ahrefs.com 53 · onelittleweb.com 44 · seranking.com 44 · agencyanalytics.com 40 · blog.hubspot.com 40 · experte.com 36 · flowninja.com 32 · seobility.net 32 · seoptimer.com 30 · airops.com 30 · spyfu.com 20 · manus.im 20.

## 4. Hipotezler (ölçülmedi — varsayım)
- Listicle/dizin görünürlüğü alıntı payını en hızlı yükselten kaldıraçtır (kaynak listesindeki 10/13 yüzey liste/dizin türü).
- "Semrush/Ahrefs alternatifi" arama niyeti, karşılaştırma sayfalarından besleniyor.
- Özgün veri yayımlayan markalar (benchmark, sektör raporu) uzun vadede en kalıcı alıntı kaynağını oluşturur.

## 5. Aksiyon planı

### Faz 1 — Dizin ve listeler (Hafta 0–4, düşük efor, çoğu ücretsiz)
1. **AI araç dizinleri:** onelittleweb.com, flowninja.ai, airops.com — ürün kaydı + kısa açıklama (motorların en çok kullandığı liste türü).
2. **Ücretsiz araç/inceleme yüzeyleri:** seobility.net, seoptimer.com, experte.com tarzı "en iyi SEO araçları" test listelerine giriş başvurusu.
3. **Yazılım dizinleri:** G2, Capterra, Product Hunt; TR için justdial benzeri servis dizinleri.
4. **povlex.com üzerinde:** `llms.txt`, Organization/Product şemasındaki `missingRequired` alanlarının tamamlanması (kendi C3 aracımızın listesi), net "kim için, ne yapar, kanıt" bloğu.

### Faz 2 — Listicle PR ve karşılaştırmalar (Hafta 4–12)
5. **zapier.com/blog ve blog.hubspot.com türü "best AI SEO tools" listelerine** ürün sunumu (editörlü listeler; ücretsiz ama zaman alır).
6. **"Semrush alternatifi / Ahrefs alternatifi" karşılaştırma sayfaları** (kendi sitemizde + üçüncü taraf incelemelerinde) — rakip görünürlüğünün doğrudan karşıtı.
7. **Vaka çalışmaları:** sayısal sonuçlarla (önce/sonra denetim puanları) — alıntılanabilir veri.

### Faz 3 — Otorite ve kalıcı alıntı (Hafta 12+)
8. **Özgün veri yayınları:** Povlex verisiyle sektör benchmark raporu (ör. "500 sitede teknik SEO hatalarının dağılımı") — alıntı mıknatısı.
9. **PR / bahsedilme:** sektör yayınlarında uzman görüşleri; podcast/konuk yazılar.
10. **TR + EN paralel içerik:** ölçülen soru seti Türkçe; EN pazar için ayrı 30'luk set zaten mevcut (`buildComparativeAiVisibilityPrompts`, en).

## 6. Ölçüm döngüsü (ilerleme nasıl izlenir)
| Program | Kapsam | Maliyet (ölçülen) | Ne zaman |
|---------|--------|-------------------|----------|
| **Nabız** (1 koşu, 30 soru × 4 motor) | Yönsel anılma/atıf trendi | ~$2–4 | 4–6 haftada bir |
| **Tam program** (30×2 yayın kalitesi) | Yayımlanabilir kanıt | ~$5–10 | 3 ayda bir veya büyük kampanya sonrası |
| **Eksik-tamamlama** (resume) | Yalnız gedikler | $0,05–0,50 | Boşluk kaldığında |

Komut hazır: `scripts/ai-visibility-comparative.ts` (bütçe tavanı `AUDITPRO_AI_COMPARATIVE_BUDGET_USD` ile zorunlu).

## 7. Bu planın iddia etmediği şeyler
- Görünürlük artışının **garantisi** yoktur; motorlar kendi kaynak seçimlerini yapar (ölçüm bunu gösteriyor).
- Rakip/tahmin yorumları (§4) ölçülmüş değil, hipotezdir.
- Alıntı sayısındaki artışın sıralama/trafik getireceği iddia edilmez; yalnız **görünürlük metriği** izlenir.
