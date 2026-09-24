# P0 — Ölçüm / Puanlama Güvenilirliği Düzeltmeleri (Takip Raporu)

Tarih: 2026-09-23
Kapsam: kararlaştırılan **9 maddelik P0 kararının** uygulanması. P1–P3 bilinçli olarak ertelenmiştir.

---

## 1. Karar ve karşılığı gelen değişiklik

| # | Karar | Uygulanan değişiklik |
|---|-------|-----------------------|
| 1 | Tek puanlama motoru: `online-score.ts` | UI'daki tüm puan görünümleri (ScoreStrip, kenar çubuğu, Markdown/PDF dışa aktarım, rapor ve sunum görünümleri, kaydedilen denetim listesi, yönetici özeti metni) artık `buildOnlineScorecards` çıktısını okur. |
| 2 | Tek ağırlık seti `.28/.24/.18/.12/.18` | Yeni dosya `lib/scoring-weights.ts`: `ONLINE_PILLAR_WEIGHTS` tek kaynak. v1 motoru `LEGACY_CATEGORY_WEIGHTS` üzerinden aynı değerlere maplenir (technical .28, ux .18, onpage→content .24, cro .12, serp→geo .18). |
| 3 | v1 (`calculateScore`) yalnız geçmiş kayıt uyumluluğu için | `audit-model.ts` içinde `LEGACY_ENGINE_PUBLISHES_SCORE = false` sabitlendi; kategori ve genel `scoreEligible` bu bayrağa bağlandı. Ulaşılamaz kapı (13/10/8/7/5) sorunu bu şekilde sonlandırdı: kapılar artık **asla yanlış bir "eşik" vaadi üretmiyor** ve v1 hiçbir yerde sayı üretmiyor. |
| 4 | Kalibre edilmemiş 8 türetilmiş kontrol puanlamadan çıkar | `seo/geo/technical/content` kartlarındaki index, canonical, sitemap, robots/tarayıcı erişimi, başlık yapısı, şema, dil, imageAlt kontrolleri `sourceControlIds ⊆ CALIBRATED_CONTROLS` kapısına takıldı; kalibre değillerse `Observation`. |
| 5 | Bu kontroller UI'dan kaybolmaz | Yeni `Observation` durumu + panoda "Gözlemsel bulgular" bölümü (`score-observation-list`). Ham verdict `observedStatus` alanında saklanır, kanıt metniyle birlikte yayımlanır. |
| 6 | GEO hazırlığı yöntemler kalibre edilene kadar puansız | Testle sabitlendi: tamamen "Pass" gelen fixture'ta `geo.score === null`, `geo.coveragePct === 0`, 8 kontrolün tamamı gözlem. |
| 7 | Canlı AI görünürlüğü skora karışmaz | `buildOnlineScorecards` girişi AI görünürlüğü içermez; `scope` metni "does not measure ... live AI-engine citations" doğrulanır. AI görünürlüğü UI'da `visibilityIndex/100` yerine **yönsel anılma oranı + örneklem (n/eşik)** olarak gösterilir. |
| 8 | Kapsam hiçbir formülle skora girmez | `overall` hesabındaki "kapsam düşükse 50'ye çekme" karışımı kaldırıldı. Test: ham 87 → 87 yayımlanır; 55% kapsam skoru **71'e çekmez**, yalnızca yayın kapısını belirler. |
| 9 | "0 sorun" yalnız tam ölçülmüş kategoride | Boş durum metni: "Ölçülen N kontrolde 0 sorun — X kontrol ölçülemedi, Y kontrol gözlem olarak yayımlandı." |

---

## 2. Ölçüm sözleşmesi (her v2 kontrol için)

`lib/online-score.ts` içinde tüm kontroller şu alanları taşır:

- `sourceControlIds` — dayandığı katalog kontrolleri (kalibrasyon kapısı; kalibre edilince kapı otomatik açılır)
- `methodVersion` — `measurement-contract@0.7.0`
- `scoreEligible` — `calibrated(source) && evidence.scoreEligible`
- `scope` — `{ tested, discovered, complete }` (varsa)
- `confidence`, `reasonCode`

Puanlama yalnız `scoreEligible && scope.complete` üzerinden çalışır.

Durum önceliği (`verdict`):

1. `Observation` / `Unavailable` upstream kuralı → olduğu gibi kalır
2. `scope.complete === false` ve ham verdict `Fail` değilse → `Unavailable`
3. `reasonCode ∈ {coverage-incomplete, scope-incomplete, incomplete-browser-resources}` → `Unavailable`
4. `scoreEligible === false` → `Observation`
5. aksi halde ham verdict (`Fail` dahil)

**İzlenebilir başarısızlık gizlenmez:** eksik kapsam `Pass`/`Partial` yayınlamayı engeller; gözlemlenen gerçek `Fail` yayımlanmaya devam eder (http-status ölçümüyle aynı kural).

---

## 3. Dosyalar

### Yeni
- `lib/scoring-weights.ts` — tek ağırlık kaynağı (`ONLINE_PILLAR_WEIGHTS`, `LEGACY_CATEGORY_WEIGHTS`, `ONLINE_WEIGHTS_SUM = 1`)

### Değişen
- `lib/online-score.ts` — çekirdek yeniden yazım: `Observation` durumu, sözleşme alanları, kalibrasyon kapısı, kapsam kapısı, kapsam karışımının kaldırılması, paylaşılan ağırlıklar
- `lib/site-measurements.ts` — `mergeSitewideFindings(home, pages, crawlOutcomes)` üçüncü parametresi: indirilemeyen sayfalar `scope.discovered`'e eklenir, `scope.complete` bozulur, site-geneli `Pass` yayınlamaz; `o4/o8` ve `t9` de kapsam taşır
- `app/api/analyze/route.ts` — `crawlOutcomes` merge çağrısına geçirilir (satır ~407)
- `scripts/measurement-calibration.test.ts` — indirilemeyen sayfa senaryosu: `scope.complete` bozulur, `Pass` `Unavailable` olur, hata sayısı değişmez
- `lib/audit-model.ts` — `WEIGHTS` → `LEGACY_CATEGORY_WEIGHTS`; `LEGACY_ENGINE_PUBLISHES_SCORE = false`; kapı, kalibre envanterin tavanıyla (`min(gate, achievable)`) sınırlandırıldı
- `lib/measurement-contract.ts` — `CATEGORY_SCORE_GATES` artık LEGACY olarak işaretlendi
- `app/audit-app.tsx` — v1 rozet splice'i kaldırıldı; `publishedOverall/publishedScoreLabel/publishedCoveragePct/publishedGradeLabel` yardımcıları tek motoru kullanır; ScoreStrip online kartlardan beslenir; AI kartları yönsel anılma + örneklem gösterir; panoda gözlem filtresi ve gözlem listesi; öncelik listeleri `scoreEligible !== false` ile süzülür
- `lib/ui-i18n.ts` — yeni anahtarlar: `promptCount`, `confidenceHigh`, `confidenceMedium` (en + tr; `Dictionary` partial olduğu için diğer diller en'e düşer)
- `scripts/online-score.test.ts` — beklentiler güncellendi + 9 regresyon senaryosu
- `TEST_PLAN.md`, `DEPLOYMENT.md` — kapının adım listesinde eksik olan `test:online-score`, `test:access-policy`, `test:pilot-ai-policy` eklendi (doküman/kapı senkronizasyonu)
- `package.json`, `package-lock.json` — `next` tam sürüme sabitlendi (preflight korumasının şartı; kullanıcı onaylı)

### Değiştirilmedi (bilinçli)
- `lib/geo-publication-gate.ts`, `lib/measurement-policy.ts` (`CALIBRATED_CONTROLS` 19 kontrol), `CATEGORY_SCORE_GATES` sayıları
- `scripts/geo-positioning.test.ts`'nin sabitlediği v1 katalog etiketleri (`"GEO & AI Visibility"`, `AUDIT_CATEGORIES[0].id === 'serp'`) — GEO/AI ayrımı online-score tarafında yapıldı

---

## 4. Düzeltilen hatlar (regresyon testleriyle sabitlendi)

| Hata | Eski davranış | Yeni davranış | Test |
|------|---------------|---------------|------|
| Ulaşılamaz kategori kapıları (13/10/8/7/5 vs 19 kalibre kontrol) | `categories.every(...)` hiç doğru değil, her site eksik ölçüm görünür | v1 yayından kaldırıldı; kapılar envanter tavanıyla sınırlı | `LEGACY_ENGINE_PUBLISHES_SCORE = false` + `measurement-calibration` |
| İndirilemeyen sayfa site-geneli `Pass` üretiyordu | kapsam bozulmuyordu | `scope.complete=false` → `Unavailable` | `technicalHttp("Pass", false)` |
| Kapsam tamamsa `Fail` gizleniyordu | — | gözlemlenen `Fail` yayımlanır | `technicalHttp("Fail", false)` |
| Kapsam skora karışıyordu (87 → 71) | blend | skor ham kalır, yalnız kapı eşiği uygulanır | `overall.score === 87` |
| `h1 !== 1` kuralı (emekli o10) | Fail | gözlem; `affectedUrls` boş | `multiH1` |
| Canonical yokluğu `Partial` | Pass/Partial | `Unavailable` (eksik kanıt); bozuk canonical hedefi `Fail` kalır | `noCanonical` / `brokenCanonical` |
| scoreEligible:false bulgular sayıya giriyordu | hatalar/warnings | `Observation`; `errors === 0`, kapsam düşer | `ineligibleTitle` |
| Canlı AI görünürlüğü 0–100 puandı | `visibilityIndex/100` | anılma oranı % + `n/eşik keşif sorusu` | UI (ScoreStrip, GeoEvidenceStatus) |

---

## 5. İlk geçişte beklenen görünüm (kullanıcıca kabul edildi)

Tümü-geçen bir örnek fixture üzerinden:

| Kart | Kapsam | Puan | Durum |
|------|--------|------|-------|
| Online SEO | 72% | 86 | Preliminary |
| GEO hazırlığı | 0% | — (null) | Insufficient, 8 gözlem |
| Teknik SEO | 45% | — (null) | Insufficient |
| İçerik | 50% | 70 | Preliminary |
| UX | 100% | 100 | Measured |
| Dönüşüm | 100% | 100 | Measured |
| **Genel** | **55%** | **87** | Preliminary |

Gözlem 17, ölçülemeyen 0, hata 1 (başlık).

---

## 6. Test sonuçları

| Test | Sonuç |
|------|-------|
| `npx tsc --noEmit -p tsconfig.json` | ✅ temiz |
| `npm run test:online-score` | ✅ (güncellenmiş + 9 regresyon senaryosu) |
| `npm run test:measurement-calibration` | ✅ (35 senario — yeni: "an unfetched page breaks site-wide scope instead of publishing a pass") |
| `npm run test:launch-readiness` | ✅ |
| `npm run test:geo-positioning` | ✅ |
| `npm run test:geo-publication-gate` | ✅ |
| `npm run test:site-api-matrix` | ✅ |
| `npm run test:app-flow` | ✅ (tarayıcı akışı, PDF render atlandı) |
| `npm run test:analysis-route` | ✅ |
| `npm run test:rendered` | ✅ |
| `npm run test:ai-visibility` | ✅ |
| `npm run test:access-policy` | ✅ |
| `npm run test:pilot-ai-policy` | ✅ |
| `npm run test:deployment-docs` | ✅ |
| `url-parameter / security-header / finding-summary / crawl-scope / page-evidence` | ✅ |
| `npm run launch:readiness` (şemsiye) | ✅ **43/43 adım, 199.0s** — rapor: `launch-readiness-reports/launch-readiness-2026-09-22T23-18-08-328Z.json` |

---

## 7. Bloker: preflight tam sürüm koruması (çözüldü)

`npm run launch:readiness` **[1/43] preflight** adımında, P0 değişiklikleriyle ilgisi olmayan önceden var olan bir nedenle duruyordu:

```
AssertionError: next must use an exact version for reproducible production builds
actual: '^16.3.3'   expected: /^\d+\.\d+\.\d+...$/
```

`package.json` `dependencies.next` değeri `^16.3.3`; kilitli ve kurulu sürüm zaten `16.3.3`. Kullanıcı onayıyla **`"next": "16.3.3"` olarak sabitlendi** (`package.json` + `package-lock.json` kök spec). Kurulu sürüm değişmez, tekrarlanabilirlik şartı karşılanır. Sonuç: şemniye kapı **43/43 adım yeşil** (199.0s).

Ek olarak `TEST_PLAN.md` ve `DEPLOYMENT.md` içindeki "launch kapısı adımları" blokları `launchReadinessSteps` ile senkron değildi (`test:online-score`, `test:access-policy`, `test:pilot-ai-policy` eksikti); her iki dokümana eklendi. Bu, `test:launch-readiness`'in dayattığı doküman/kapı senkronizasyonudur.

---

## 8. Erteleyen P1–P3 (bilerek yapılmadı)

Web search'ün production GEO'suna girmesi, `citationRate` kalibrasyonu, maliyet/token muhasebesi, SSRF port bypass, rate-limit spoofing, charset, CWV alanı ölçümleri. Ayrıca `t56` gibi yüksek ağırlıklı kontrollerde kapsamlı link doğrulaması tamamlanana kadar `Pass` yayımlanmaması bilinçli bir sıkılık düzeyidir; saha verisiyle gözden geçirilebilir.

Güncelleme: bu maddelerin tamamı kod kanıtıyla doğrulanıp önceliklendirildi → **`POVLEX-P1-P3-ERTELENEN-PLAN.md`** (14 madde: P1 A1–A4, P2 B1–B7, P3 C1–C3; onay/bağımlılık/efor tablolarıyla).
