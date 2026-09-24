# P1–P3 — Ertelenen İşler Raporu ve Planı

Tarih: 2026-09-23
Kapsam: P0 raporunun §8'inde bilerek ertelenen maddeler + `POVLEX-OLCUM-VE-EKSIK-ANALIZI.md` §4/§5'teki açık P1 kalemlerinin bugünkü durumu. **Bu rapor yalnızca plan/analizdir; burada anlatılan değişiklikler henüz uygulanmamıştır.**

Dayanaklar: `POVLEX-P0-OLCUM-GUVENILIRLIGI-DUZELTMELERI.md` (§8), `POVLEX-OLCUM-VE-EKSIK-ANALIZI.md` (§4 ölçüm matrisi, §5 öncelikli bulgular), `POVLEX-KONTROL-KALIBRASYONU.md` (199 kontrol envanteri). Her madde şu anda kodda gözlemlenen durumla (dosya:satır) doğrulanmıştır.

---

## 1. Öncelik ölçütü

- **P1** — Onay gerektirmeyen, küçük/orta, güvenlik veya puan güvenilirliğini doğrudan etkileyen iş. Sıradaki sprint.
- **P2** — Karar, bütçe (ücretli API/arama) veya saha verisi gerektiren işler.
- **P3** — Harici entegrasyon/keşif gerektiren uzak işler.

Efor: **S** < 0,5 gün · **M** 0,5–2 gün · **L** 3+ gün / entegrasyon.

---

## 2. Özet tablo (14 madde)

| ID | İş | Öncelik | Efor | Onay |
|----|----|---------|------|------|
| A1 | Rate-limit `x-forwarded-for` spoofing sertleştirme | P1 | S | Hayır |
| A2 | SSRF: yönlendirme hedefinde port/kredential yeniden doğrulaması | P1 | S | Hayır |
| A3 | Charset-duyarlı HTML/XML çözümleme | P1 | M | Hayır |
| A4 | Kalibrasyon envanteri drift testi | P1 | S | Hayır |
| B1 | Maliyet/token muhasebesi (model + arama bazlı) | P2 | M–L | Evet (fiyat doğrulama) |
| B2 | `citationRate` kalibrasyonu + 30×2 karşılaştırmalı çalışma akışı | P2 | M | Evet (harcama) |
| B3 | Web search'in production GEO'ya girmesi | P2 | S–M | Evet (harcama) |
| B4 | `serp` kategorisi kararı (21 kontrol, 0 ölçüm) | P2 | S (karar) / M–L (ölçüm) | Evet (ürün) |
| B5 | `t56` link bütçesi + sitemap kapsam telemetrisi | P2 | M | Hayır (saha verisi) |
| B6 | Paket kotalarının yeniden hesaplanması | P2 | S | Evet (ticari) |
| B7 | robots bot/URL öncelik doğrulaması (eski P1'in kalanı) | P2 | M | Hayır |
| C1 | Core Web Vitals (laboratuvar + saha) | P3 | L | Evet (GSC/API) |
| C2 | Dış bağlantı doğrulaması | P3 | M–L | Hayır |
| C3 | Şema içerik uyumu (tür ↔ görünür içerik) | P3 | M | Hayır |

---

## 3. P1 — onaysız, küçük işler

### A1 · Rate-limit IP sahteciliği (`x-forwarded-for`)

- **Kodda bugün:** `lib/security-rate-limit.ts:10-14` — `x-forwarded-for` başlığının **ilk** girdisi koşulsuz alınır (`split(",")[0]`), sonra `x-real-ip`, sonra `"local"`. Aynı desen `lib/analysis-rate-limit.ts:6-9`. Güvenilir proxy tanımı/`TRUSTED_PROXY_HOPS` yok.
- **Risk:** Arka uç proxy başlığı **sona ekleyen** davranıştaysa (yaygın) istemci ilk girdiyi kontrol eder; döndürdüğü her farklı değerle 5 deneme/5 dk güvenlik kovasını (`security-rate-limit`) ve 6 istek/10 dk analiz kovasını (`analysis-rate-limit`) sıfırlayabilir.
- **Mevcut test kapsamı:** `scripts/security-rate-limit.test.ts:16,23,31` ve `scripts/analysis-rate-limit.test.ts:11` sabit tek bir XFF değeriyle limit **alışını** doğrular; döndürülen XFF ile limit **aşılması** senaryosu yoktur.
- **Önerilen değişiklik:** XFF'den sağdan sayarak güvenilmeyen hop sayısını (`TRUSTED_PROXY_HOPS` ortam değişkeni, varsayılan platform davranışına göre) çıkaracak ortak bir `forwardedClient` yardımcısı; `security-rate-limit`, `analysis-rate-limit` ve varsa diğer XFF okuyucuları aynı yardımcıyı kullanır.
- **Test:** döndürülen XFF girdileriyle aynı oturumda limit aşılamaz; proxy ekleme senaryosunda gerçek istemci IP'si korunur.
- **Efor:** S.

### A2 · SSRF: yönlendirme hedefinde port/kredential kontrolü atlanıyor

- **Kodda bugün:** `lib/public-url.ts:15-25` `normalizePublicUrl` protokol (`:20`), kredential (`:21`) ve **port izin listesi** (`:22` — yalnız `80`/`443`) denetler. Buna karşılık `app/api/analyze/route.ts:53-93` `fetchPublic`, `redirect: "manual"` ile her hop'ta `resolvePublicUrl` çağırır (`:58` — DNS/gizli adres + sabitleme koruması **çalışıyor**), ancak yönlendirme dalında yalnız protokolü kontrol eder (`:83`). `normalizePublicUrl` hedefe **yeniden uygulanmaz**; `MAX_REDIRECTS = 4` (`route.ts:38`).
- **Risk:** `https://host:8443/` gibi standart olmayan bir porta yönlendirme, ilan edilen port politikasını bypass eder (her hop'ta özel/gizli adres reddi korunur; bu bir "politika ihlali + port taraması" açığıdır, tam SSRF değildir). Kredential kontrolü de atlanır; ikinci savunma hattı olarak undici'nin kredentialli URL reddi büyük olasılıkla devreye girer, ancak bu **uygulamanın kuralı değildir**. `checkResource` yolundaki kaynak yükleyici de yönlendirmede kredentiali reddeder ama port kontrolü yapmaz — doğrulama yolları arasında tutarsızlık var.
- **Mevcut test kapsamı:** `scripts/public-url.test.ts` yalnız `isPrivateAddress`/`resolvePublicUrl`/dispatcher'ı import eder; `normalizePublicUrl`'in (port/kredential) **hiç testi yoktur**, yönlendirme hedefi senaryosu hiç yoktur.
- **Önerilen değişiklik:** `fetchPublic` yönlendirme dalında hedefe `normalizePublicUrl` (veya port/kredential kontrolünü çıkaran ortak helper) uygula; `checkResource` aynı helper'ı kullansın.
- **Test:** `public-url.test.ts`'e port (`:8443`) ve kredential reddi senaryoları; `analysis-route` testine standart olmayan porta yönlendiren zincir senaryosu (reddedilmeli).
- **Efor:** S.

### A3 · Charset çözümlemesi yok (UTF-8 varsayımı)

- **Kodda bugün:** HTML `await response.text()` (`app/api/analyze/route.ts:227`, `:385`) — Fetch spec'i `Content-Type` içindeki `charset=` parametresini ** yok sayar**, bedeni UTF-8 (BOM hariç) çözer. Kaynak bedenleri `Buffer.concat(...).toString('utf8')` (`route.ts:285`). `lib/` içinde `TextDecoder` kullanımı yok (`TextDecoder` yalnız stripe/csp-report webhook'larında).
- **Risk:** windows-1252/latin-1 sayfalarda mojibake → başlık/açıklama/robots/canonical regex ölçümleri bozulur. Bu, P0'da **puana aday** hale gelen kalibre kontrolleri (ör. `o1`/`o4` başlık özgünlüğü, `o5`/`o8` meta) doğrudan etkileyebilir: yanlış kodlama → yanlış bulgu → yanlış puan. Ölçüm güvenilirliği sorunu, kozmetik değil.
- **Önerilen değişiklik:** `Content-Type` başlığındaki charset ile `new TextDecoder(label)` üzerinden çöz (yoksa UTF-8; HTML spec'i gereği ilk 1024 byte'taki `<meta charset>`'e de bak); XML kaynakları için aynı yardımcı.
- **Test:** `charset=windows-1252` bildiren Türkçe karakterli fixture sayfa; başlık/meta doğru çözülmeli. Doğal ev: `scripts/measurement-calibration.test.ts` veya `scripts/site-api-matrix.test.ts`.
- **Efor:** M (iki çözümleme noktası + fixture).

### A4 · Kalibrasyon envanteri drift testi

- **Kodda bugün:** `lib/measurement-policy.ts:5-25` → `CALIBRATED_CONTROLS` = **19** kontrol (t 6, o 4, u 5, c 4, **serp 0**). `lib/measurement-contract.ts:11` → `P0_AUTOMATED_CONTROL_TARGET = 82`. Yani hedefin **%23'ü** kalibre; `serp` dışındaki hiçbir kategoride sıfır kalibre kontrol yok. Katalog: 211 id − 12 emekli (`lib/audit-model.ts:1424`) = **199 aktif**.
- **Risk:** Kapı testleri (`site-api-matrix.test.ts:82-87`, `measurement-calibration.test.ts:109`) tek tek kontrolleri sıkar ama **envanter sayısını** kimse tutmaz: bir kontrolün sessizce kalibre listesinden çıkması veya emekli bir id'nin kalibre listede kalması fark edilmez. `POVLEX-KONTROL-KALIBRASYONU.md` ile kod arasındaki eşleşme kanıtlanmaz.
- **Önerilen değişiklik:** Test şunları zorlasın: (a) her kalibre id aktif (emekli olmayan) katalogda; (b) sayım (19, serp 0, hedef 82) belgelenen envanterle eşit — drift olursa hata mesajı belgeyi güncellemeyi söylesin; (c) `serp` için kalibre kontrol olmaya devam ediyor mu bilinçli olarak doğrulansın (B4 kararıyla uyumlu).
- **Test:** yeni senaryo `measurement-calibration` veya `site-api-matrix` içine.
- **Efor:** S.

---

## 4. P2 — karar/bütçe/veri gerektiren işler

### B1 · Maliyet/token muhasebesi

- **Kodda bugün:** Tokenlar gözlem bazında toplanıp `lib/ai-visibility.ts:275` özetlenir ve `lib/usage-ledger.ts:328` `recordAiUsageEvent` ile `ai_usage_events.estimated_cost_eur`'a yazılır (`database/schema.sql:211`); `lib/production-health.ts:471` bunu toplar. Pilot tarafında `lib/pilot-ai.ts` `estimatePilotAiCost` ortam değişkeniyle fiyatlanır (giriş/çıkış 1K EUR + arama başı EUR). Kalan boşluk (analiz §5): fiyatlar **model/sağlayıcı/arama bazlı gerçek fatura değil**, iki genel EUR varsayımı; arama çağrıları ve **hata çıktısı** (0 token) fiyatlanmıyor; fiyat sürümü saklanmıyor.
- **Neden ertelendi:** P0 9 maddenin dar kapsamındaydı; gerçek sağlayıcı fiyat doğrulaması ayrıca onay gerektiriyor.
- **Önerilen değişiklik:** Fiyat tablosu (model + giriş/çıkış/arama fiyatı, para birimi, `priceVersion`), arama sayacı × arama fiyatı, bilinmeyen harcamayı sıfır yerine `unknown` alanında tutma; hata/timeout yollarında tahmin ↔ mutabakat ayrımı.
- **Test:** farklı model, farklı arama adedi, hata çıktısı, timeout sonrası bilinmeyen maliyet senaryoları (`scripts/billing*`/usage testleri).
- **Onay:** Gerçek sağlayıcı fiyat sayfasının doğrulaması (küçük bütçeyle pilot).
- **Efor:** M–L. **B6 bu maddeye bağımlıdır.**

### B2 · `citationRate` kalibrasyonu + 30×2 çalışma akışı

- **Kodda bugün:** `lib/ai-visibility.ts:266` — `citationRate`, başarılı her keşif gözlemi `citationEvidence === 'provider-sources'` **değilse** `null`; `:273` `visibilityIndex = mention*0.7 + citation*0.3` sabit ağırlıkla; `:274` **`scoreEligible: false` kodda sabit**, gerekçe yalnızca metin: *"at least 30 fixed discovery prompts per engine across two separate runs"*. Bu eşiği **hiçbir akış uygulamıyor** ve hiç kimse `true` üretemiyor; iki ayrı çalışma (run) takibi yok. `geo-publication-gate.ts` de `scoreEligible`'ı okur.
- **Neden ertelendi:** P0 kararının 7. maddesi AI görünürlüğünü skorun dışına itti; kalibrasyon ayrı bir ürün/ölçüm kararı.
- **Önerilen değişiklik:** (a) `MIN_DISCOVERY_PROMPTS = 30` ve `MIN_RUNS = 2` sabitleri + run kimliği/tarihi takibi; (b) `scoreEligible` yalnız sayaçlarla `true` olabilsin (metin değil kod); (c) `citationRate`'e en az başarılı örneklem ve iki çalışma arası değişkenlik eşliği; (d) 10 şablonlu ön gözlem akışı ile karşılaştırmalı çalışma akışını ayır.
- **Test:** 29 soru/1 run → `false`; 30×2 → `true` (sayım); citation kanıtı `unavailable` → `null`; `geo-publication-gate` senaryoları.
- **Onay:** Genişletilmiş soru seti ücretli olacağı için harcama onayı.
- **Efor:** M.

### B3 · Web search'in production GEO'ya girmesi

- **Kodda bugün:** `app/api/ai-visibility/route.ts:263` → `webSearch: pilotMode`. Yani **yalnız pilot modda** açık; `lib/ai-visibility.ts:180-181` `openrouter:web_search`, `max_uses: 1`. Üretim akışı aramasız çalışıyor ve P0 sonrası sonuç zaten skor dışı + yönsel gösteriliyor.
- **Neden ertelendi:** Her üretim çağrısında ücretli arama maliyeti doğurur; fiyat doğrulaması (B1) ve bütçe kararı olmadan açılmaz.
- **Önerilen değişiklik:** (a) arama modunu sonuç kartında açık etiketle (`searchMode: none | web`) — aramasız çalışmada model belleği ile web görünürlüğü karıştırılmasın; (b) pilot → production geçişi için B1 maliyet tahminiyle birlikte bütçe kararı; (c) alıntı kanıtı her zaman sağlayıcı kaynak metadatasından.
- **Test:** aramasız çalışma etiketi; `citationEvidence` senaryoları (`scripts/ai-visibility.test.ts` genişletilir).
- **Onay:** Harcama.
- **Efor:** S–M.

### B4 · `serp` kategorisi: 21 kontrol, 0 ölçüm

- **Kodda bugün:** `serp1–serp21` kontrollerinin **hiçbiri** kodda bulgu üretmiyor (`html-measurements`/`source-observations` içinde `serp` referansı yok); envanterde tamamı "Otomatik kanıt bağlı değil; puan dışı" (`POVLEX-KONTROL-KALIBRASYONU.md`). Buna rağmen `CORE_METRIC_TARGETS.serp = 10` ve `CATEGORY_SCORE_GATES.serp = 5` sayımları duruyor (`measurement-contract.ts:8,22`), UI kategoriyi GEO/AI hazırlığına yönlendiriyor.
- **Risk:** Ölçülmeyen bir kategori için hedef/kapı sayıları yayımlanmış görünüyor; envanter dürüstlüğü açısından en büyük tutarsızlık (P0 felsefesiyle çelişir).
- **Seçenekler:** (a) kategori/kapıları skor envanterinden düş (küçük); (b) gerçekten ölçülebilir alt kümeyi bağla — örn. `serp13` (AI botlarının robots.txt'de engellenmemesi) aslında mevcut robots kanıtından türetilebilir; gerisi manel/entegrasyon kalır (büyük).
- **Not:** `geo-positioning.test.ts` v1 katalog etiketlerini (`AUDIT_CATEGORIES[0].id === 'serp'`, `"GEO & AI Visibility"`) sabitler — etiket **değiştirilmemeli**; karar puan/kapı envanteriyle ilgili.
- **Onay:** Ürün kararı.
- **Efor:** S (seçenek a) / M–L (seçenek b).

### B5 · `t56` link bütçesi ve kapsam sıkılığı (saha verisiyle)

- **Kodda bugün:** `lib/http-status-measurement.ts:15-18` — `scoreEligible: failed > 0 || complete`; `complete` = keşfedilen her adrese kararlı yanıt. Bütçe: `MAX_LINK_TARGETS = 100` (`route.ts:43`, dilimleme `:256`, `complete` `:273`); 100'den fazla link keşfedilen sitede kapsam tamamlanamaz → skor düşer. P0'daki gibi bu **bilinçli sıkılık**: kapsam tamamlanana kadar `Pass` yayımlanmaz.
- **Ayrıca:** `lib/sitemap-discovery.ts:3,6,24,29` — `maxDocuments=12`, `maxPages=10000`, `pageLimitReached` yalnız `app/audit-app.tsx:1805` metninde görünür; site-geneli bulgu kapsamına **sınır olarak taşınmaz** (P0'daki indirilemeyen sayfa kuralının kuzeni).
- **Neden ertelendi:** Doğru gevşeme eşiğini saha verisi belirler (büyük sitelerde kapsam tamamlanma oranı), kod tahmini değil.
- **Önerilen değişiklik:** (a) telemetri: taramalarda `discovered > 100` oranı ve kapsam tamamlanma oranı kaydedilsin; (b) `pageLimitReached`'ı `scope.complete`/kapsam notuna taşı; (c) veriyle birlikte karar: bütçe artışı mı, oransal tamamlanma eşiği mi.
- **Test:** `scripts/http-status-measurement.test.ts` (mevcut) + bütçe aşımında kapsam davranışı senaryosu; sitemap `pageLimitReached` kapsam senaryosu (`sitemap-discovery.test.ts` mevcut).
- **Efor:** M (telemetri + kural), kararı veri sonrası.

### B6 · Paket kotalarının yeniden hesaplanması

- **Durum:** `lib/plans.ts` kotaları kod limiti olarak duruyor (analiz §5 P1 satırı: kod limiti ≠ ekonomik sürdürülebilirlik).
- **Bağımlılık:** B1 maliyet muhasebesi bittikten sonra `müşteri katkısı` formülüyle hesaplanabilir; rapor kapsamı ve kullanım maliyeti onayı olmadan paketlere yansıtılır.
- **Efor:** S (hesaplama) + karar.
- **Onay:** Ticari.

### B7 · robots bot/URL öncelik doğrulaması (eski P1'in kalanı)

- **Kodda bugün:** `lib/robots-evidence.ts:1,6` — bot grubu/URL kararı (`robotsDecision`) ve `different-origin` için `allowed: null` + `reasonCode: 'different-origin'` ("policy-not-retrieved") doğru şekilde bilinmeyen sayıyor; robots.txt ağdan çekiliyor. Kalan eksik (analiz §4): **bot/URL bazlı Allow/Disallow önceliği, joker (wildcard) eşleşmesi ve erişim hatası sınıflandırmasının** uçtan uca doğrulanması; `t1` zaten kalibre değil (gözlem).
- **Neden ertelendi:** P0'ın 9 maddesi dışında kaldı; derin kural motoru işi.
- **Önerilen değişiklik:** kural motoru öncelik sırasını (en spesifik → longest-match → Allow/Disallow) referans fixture'larla doğrula; `reasonCode` zenginleştir (`unsupported`/`complex` ayrımı mevcut, kapsamı genişlet).
- **Test:** `scripts/seo-followup.test.ts` genişletilir (joker, çakışan kurallar, bot özel grup).
- **Efor:** M.

**Kapanan eski P1 kalemleri (artık iş listesinde değil):** `t3`, `t36`, `o2`, `o10`, `o12`, `o18`, `o19`, `o20`, `o34`, `o42`, `serp8`, `serp14` emekli (`audit-model.ts:1424`); "ölçülmemiş bulgu durumları" ayrımı P0'da `Observation`/`Unavailable` + `reasonCode` ile kapandı; `t1` varlık/erişim ayrımı kısmen kapandı (kalibre değil, gözlem — derin doğrulama B7'de).

---

## 5. P3 — entegrasyon/keşif

### C1 · Core Web Vitals

- **Kodda bugün:** LCP/CLS/INP **hiçbir yerde ölçülüyor değil**. `lib/crawl-timing.ts` açıkça "not field Core Web Vitals" uyarısı taşır; `lib/browser-measurements.ts` (t22) "LCP/CLS yargılamaz"; `route.ts` saha CWV'nin skor dışında kaldığını bildirir. `t15/t16/t17` (LCP/INP/CLS) envanterde "Otomatik kanıt bağlı değil; puan dışı".
- **Önerilen değişiklik (iki parça):** (a) **Laboratuvar:** stabil tarayıcı sayfasında `PerformanceObserver` ile LCP/CLS/INP topla → yeni kalibre aday kontroller (önce gözlem, sonra `CALIBRATED_CONTROLS`); (b) **Saha:** CrUX / Search Console entegrasyonu — veri yoksa `Unavailable` (P0 kuralı).
- **Test:** `rendered-measurements` fixture + kalibrasyon senaryosu; saha verisi yokluğunda skor dışı davranış.
- **Onay:** Saha için GSC/CrUX erişimi.
- **Efor:** L.

### C2 · Dış bağlantı doğrulaması

- **Kodda bugün:** `lib/external-link-evidence.ts:6` — *"Source declarations only: no navigation, destination trust or runtime security verdict."* Dış bağlantılar **hiç çekilmiyor**; yalnız dahili linkler (≤100, B5) doğrulanıyor.
- **Önerilen değişiklik:** Ayrı bütçe/dış istek kuralıyla dış link durumu (4xx/5xx, yönlendirme), kendi `scope` kapsamı içinde — dahili bütçeyi bozmadan.
- **Test:** `external-link-edge` senaryoları + kapsam `scope.complete` davranışı.
- **Efor:** M–L.

### C3 · Şema içerik uyumu

- **Durum:** 0.5.0 ile JSON ayrıştırma/@graph iyileştirmesi yapıldı; kalan (analiz §4): **türün sayfaya uygunluğu, gerekli alanlar ve görünür içerikle uyum** düzeyinde doğrulama hâlâ regex/alan varlığı düzeyinde.
- **Önerilen değişiklik:** JSON-LD ağacında sayfa türü → beklenen alan seti ↔ görünür metin pasajı eşleşmesi; `reasonCode` ile kanıt eksikliğini `Fail` yapma.
- **Efor:** M.

---

## 6. Önerilen sıra ve bağımlılıklar

```
Sprint 1 (onaysız)  : A1 → A2 → A3 → A4        [P1, ~2 gün]
Karar aşaması       : B4 kararı (serp), B3 bütçe önkoşulu = B1 fiyatı
Sprint 2 (onaylı)   : B1 → B6 ; paralel B2 ve B3 (harcama onayıyla)
Veri bekleyen       : B5 (telemetri topla → karar)
Sürekli             : B7 (eski P1 kalanı)
Uzak                : C1 → C2 / C3
```

- B1 → B6 (maliyet olmadan kota yeniden hesaplanmaz).
- B1 → B2/B3 (arama/token fiyatı bilinmeden harcama onayı anlamlı değil).
- B4 kararı A4'ün envanter testindeki `serp` beklentisini belirler.

---

## 7. Kapı (launch:readiness) etkisi

P0 dersi geçerli: her yeni test `scripts/*.test.ts` ise `package.json` `test:*`, `lib/launch-readiness-steps.ts`, `TEST_PLAN.md` ve `DEPLOYMENT.md` adım bloklarına **aynı anda** eklenmelidir; aksi halde `test:launch-readiness` doküman/kapı senkronizasyonundan döner. A1–A4 bittikten sonra `npm run launch:readiness` (43/43 adım) yeniden yeşil olmalı.

---

## 8. Onay gerekenler (özet)

| Madde | Onay türü |
|-------|-----------|
| B1 | Gerçek sağlayıcı fiyat doğrulaması (küçük bütçe) |
| B2 | Genişletilmiş soru setinin harcama onayı |
| B3 | Production'da ücretli web araması bütçesi |
| B4 | Ürün kararı: `serp` kategorisini düşür / kısmi ölç |
| B6 | Ticari: paket kotaları |
| C1 | Harici erişim: GSC/CrUX anahtarı |

A1–A4, B5, B7, C2, C3 onay gerektirmez.

---

## 9. Uygulama durumu (A1–P1 paketi)

**2026-09-23 — A1–A4 uygulandı** (kullanıcı onayı: "P1 paketinin tamamı").

| Madde | Yapılan değişiklik | Test |
|-------|--------------------|------|
| **A1** XFF spoofing | Yeni `lib/forwarded-client.ts`: yalnız `AUDITPRO_TRUSTED_PROXY_HOPS` (varsayılan 1) kadar sağdan hop güvenilir; istemci kontrolüneki sol-sonek döndürülemez. `lib/security-rate-limit.ts` ve `lib/analysis-rate-limit.ts` aynı yardımcıyı kullanıyor. `DEPLOYMENT.md` .env örneği + açıklama eklendi. | `test:security-rate-limit` (döndrülen önek kovayı sıfırlayamaz), `test:analysis-rate-limit` (6 deneme + 7. reddedilir; hops 1/2/0 politikası) |
| **A2** Redirect port/kredential | `lib/public-url.ts` içinde tek politika kaynağı: `isStandardWebPort`, `isAllowedWebAddress`, `assertRedirectTarget`; `normalizePublicUrl` aynı port listesini kullanıyor (mesajlar değişmedi). `fetchPublic` her hop'ta, `loadPublicBrowserResource` hem başlangıçta hem yönlendirmede politikayı uyguluyor. | `test:public-url` (giriş + yönlendirme politikası), `test:analysis-route` (8443'e yönlendirme → 502, tümü stub'lı fetch ile) |
| **A3** Charset | Yeni `lib/body-decode.ts`: BOM → HTTP charset → 1024-byte `<meta charset>` ön-oku → UTF-8; bilinmeyen etiket UTF-8'e düşer. `route.ts` üç çözümleme noktasında (tarama HTML, ana sayfa, `checkResource`) `decodeBody` kullanıyor. | `test:measurement-calibration`: "declared charsets are decoded instead of assuming UTF-8" (windows-1254 başlığı `Başlık` → o1 `Pass`) |
| **A4** Envanter drift testi | `test:measurement-calibration` içinde: aktif katalog **199**, kalibre **19**, `serp` kalibre **0**, `P0_AUTOMATED_CONTROL_TARGET` **82** sabitlendi; her kalibre id aktif katalogda olmalı. Drift = belge güncelleme hatası. | "calibrated inventory matches the published measurement inventory" |

Not: A3 fixture'ı windows-1254 (Türkçe) — `ş=0xFE`, `ı=0xFD` (0x9F her iki sayfada `Ÿ`'dür).

Kapı dersi: ilk `launch:readiness` koşusu **[15/43] `test:csp-report`**'ta kırıldı (429≠204). Kök neden A1'in kendi hatasıydı: `Number(env ?? "")` tanimsizken `Number("")` → **0** veriyor, varsayılan `1` hop yerine `0` uygulanıyordu → XFF yok sayılıp tüm istemciler `csp-report:local` kovasına düşüyordu. Güvenlik testi `="1"` set ettiği için yeşil kalmış ve yanıltmıştı. Düzeltme: tanimsiz/boş `AUDITPRO_TRUSTED_PROXY_HOPS` artık açıkça `1`'e (varsayilana) düşer; `analysis-rate-limit` testine **env tanimsızken varsayılan** senaryosu eklendi — bu senaryo olmasa hata tekrar sızmış olurdu.

Kapı sonucu: `npm run launch:readiness` — **43/43 adım yeşil (164.7s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T00-09-25-472Z.json`.

---

## 10. Uygulama durumu (B5 + B7 — onaysız P2)

**2026-09-23 — B5 ve B7 uygulandı** ("devam edelim" ile önerilen onaysız P2 paketi).

### B5 · t56/sitemap kapsam telemetrisi ve kapsam sıkılığı

| Parça | Yapılan | Test |
|-------|---------|------|
| (a) Telemetri | Başarılı analiz logu (`analysis.direct`) metadata'sına `scopeTelemetry` eklendi: sitemap sayfa sayısı, `pageLimitReached`, link hedefi keşfedilen/test edilen, `linkBudgetReached`, `linkScopeComplete`, `httpStatusScopeComplete`, crawl denenen/tutunamayan sayıları. **Yalnız sayı/bool** — log politikası gereği ham URL yok. Bu veri, P2-B5(c) kararını (bütçe artışı mı oransal eşiğin mi) saha verisiyle verecek. | Tam hat (`site-api-matrix`) bu log yolunu çalıştırıyor; log gizliliği `test:operation-log` |
| (b) `pageLimitReached` kapsamı | `mergeSitewideFindings`'e 4. param: `pageBudgetReached`. Sitemap keşfi bütçeyle kesildiğinde site-geneli bulguların `scope.complete` değeri **düşer** (o1/o5 grubu, o4/o8, t9) ve not "truncated ... cannot publish a pass" uyarısı taşır. P0 kuralı korunuyor: `raw !== "Fail"` iken eksik kapsam → `Unavailable`; **Fail kanıt olduğu için kalır**. | `test:measurement-calibration`: "a truncated page budget breaks the site-wide completeness claim" |
| Link bütçesi kapsamı | `verifyInternalLinks`'in 100 hedef bütçesi zaten `measureHttpStatuses`'ta kapsamı kırıyordu (`discoveredUrls` tamamı, doğrulanan ≤100 → N/A satırlar); artık testle sabit. | `test:http-status-measurement` (measurement-calibration içinde): 150 keşfedilen/100 doğrulanan → `scope.complete:false`, `scoreEligible:false`; tek Fail → hâlâ `Fail` + `scoreEligible:true` |
| (c) `t56` sıkılık kararı | **Bilinçli olarak ertelendi** — karar saha verisi istiyor; (a) telemetrisi birikince `discovered>100` oranı ve kapsam tamamlanma oranına göre karar verilecek. | — |

### B7 · robots bot/URL öncelik doğrulaması (RFC 9309 referanslı)

Kaynak: **RFC 9309** tam metni okunarak karşılaştırıldı (`lib/robots-evidence.ts`). Sapmalar düzeltildi, davranış referans fixture'larla sabitlendi:

| RFC maddesi | Önceki | Şimdi |
|-------------|--------|-------|
| §5.1 `Disallow: *.gif$` (yıldızla başlayan kural) | Sessizce yok sayılıyordu (`startsWith('/')` filtresi) — RFC örneğindeki `.gif` kısıtı uygulanmıyordu | `*` ile başlayan desenler geçerli; `$` son-uç sabitlemesi korunarak eşleşiyor |
| §2.2.1 grup seçimi | Yalnız **birebir** token eşleşmesi, sonra `*` | Token artık bot ürün-token'ının **öneki** (case-insensitive) olarak eşleşir (referans ayrıştırıcı davranışı; RFC birebir eşleşmesinin üst kümesi). **En uzun token = en spesifik grup kazanır**, eşit spesifiklikte gruplar birleşir, `*` yalnız hiç token eşleşmezse. `User-agent: google` artık googlebot'a uygulanıyor; `googlebot-news` grubu googlebot'u yakalamıyor |
| §2.2.2 ilk UA satırından önceki kurallar | Yok sayılıyordu ✓ | Korundu + fixture sabitli |
| §2.2.2 öncelik | En uzun literal desen → eşitlikte Allow | Korundu; RFC §5.1/§5.2 örnekleriyle sabitlendi |
| Boş `User-agent:` değeri | Gruba boş token yazılıyordu | Yok sayılır |
| `reasonCode` ayrımı | Kodlanmış/yüksek karmaşıklik tek kod altında (`complex`) | **`unsupported`** = kodlu/ASCII-dışı eşleşme bilerek tahmin edilmiyor; **`complex`** = sınırlı eşleştirici limitleri (uzunluk/yıldız yükü). UI'da her iki kodun da etiketi zorunlu (`audit-app.tsx`) — sözleşme gereği arayüz kaybı yok |

Test: `test:seo-followup` (measurement-calibration'e bağlı) — RFC §5.1 tam fixture'ı (foobot/barbot-bazbot/quxbot/`*`), §5.2 uzun-eşleşme, grup önceliği (`google` vs `googlebot` vs `googlebot-news` vs `*`), yıldız-aşırımı → `complex`, kodlanmış yol → `unsupported` (eski `'complex'` iddiası kasıtlı olarak güncellendi — yalnız tanı kodu, **karar değişmedi**: her ikisinde de `allowed: null`).

Kapı sonucu (B5+B7): `npm run launch:readiness` — **43/43 adım yeşil (126.1s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T00-36-17-406Z.json`.

---

## 11. Uygulama durumu (B1 · maliyet/token muhasebesi)

**2026-09-23 — B1 uygulandı.** Fiyat doğrulaması web'den yapıldı (ücretsiz; harcama yapılmadı):

**Doğrulanan sağlayıcı gerçekleri** (2026-09-23, kaynaklı):
- OpenRouter web araması, Exa yedeği "auto" modu: **USD 0,007/istek** (10 sonuca kadar); `native` arama sağlayıcı geçişiyle fiyatlanır — https://openrouter.ai/docs/features/web-search
- Her yanıtta **`usage.cost`** (USD kredi) otomatik döner: https://openrouter.ai/docs/use-cases/usage-accounting
- `perplexity/sonar` model sayfası: başarısız üretimler faturalanmaz; yanıt `usage.cost` taşır.
- **Model token fiyatları doğrulanamadı** (yapılandırılan 3 model için yayımlanmış birim fiyat alınamadı) → `MODEL_TOKEN_PRICES_USD` **kasten boş**: fiyat uydurulmuyor. Listede olmayan model `fallback-rate` etiketiyle yapılandırılabilir genel oranları kullanır.

**Yapılan değişiklikler:**

| Parça | İçerik |
|-------|--------|
| `lib/ai-pricing.ts` (yeni) | Fiyat tablosu + `AI_PRICE_VERSION = "2026-09-23"` + `AiCostBasis` (`price-table` / `fallback-rate` / `unknown`) + arama sayacı × `AUDITPRO_AI_SEARCH_EUR_PER_CALL` (varsayılan doğrulanmış USD 0,007 × `AUDITPRO_EUR_PER_USD` paritesi; FX taklidi açıkça adlandırılmış). `usageKnown: false` (hata/timeout, kullanım raporsuz) → **`estimatedCostEur: null` + `unknown`** — sıfır maliyet asla yazılmaz. Fiyatlar doğrulanana kadar `price-table` yolu testlerde enjekte tabloyla canlı tutulur. |
| Tahmin ↔ mutabakat ayrımı | `estimated_cost_eur` (bizim etiketli tahminimiz, EUR) ile `provider_cost_usd` (sağlayıcının kestiği gerçek tutar, USD kredi) **ayrı kolonlarda**; asla birleştirilmez. |
| Kullanım olayları | `recordAiUsageEvent` artık `web_search_calls`, `cost_basis`, `price_version`, `provider_cost_usd` yazıyor. Hata gözlemleri: kullanım raporlanmışsa tahmin (OpenRouterResponseError tokenları), raporsuzsa `unknown`. Sağlayıcı arama sayacı raporlamazsa `max_uses: 1` tavanı **varsayılır** ve yorum satırında böyle denir. |
| Şema | `database/migrations/012_ai_usage_cost_accounting.sql` + `database/schema.sql` aynı kolonlarla (`cost_basis` CHECK'li, `provider_cost_usd` NULL olabilir). |
| `lib/pilot-ai.ts` | Dokunulmadı (pilot fiyatlaması testle pinli ve ayrı bir bütçe politikası). |

**Testler** (`test:billing`): tablo fiyatlı model → `price-table`, listesiz model → `fallback-rate`, 2 arama × doğrulanmış fiyat, raporlanmış sıfır → ölçülü kullanım, `usageKnown: false` → `null` + `unknown`, `priceVersion` damgası. `test:migrations` 012 + kolon regexleriyle güncellendi; `test:ai-visibility` kaynak pinleri korundu.

Kapı sonucu (B1): `npm run launch:readiness` — **43/43 adım yeşil (147.6s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T09-30-38-823Z.json`.

---

## 12. Uygulama durumu (B2, B3, B4, B6, C1, C2, C3 — "kalanları bitir")

**2026-09-23** — B2/B3/B4/B6/C1/C2/C3 kod tarafları uygulandı. Üç noktada **dış adım** bilerek kalmıştır (§12 sonu).

### B2 · `citationRate` kalibrasyonu + 30×2 akışı (kod bitti)
- **Kod bağlı kapı:** `evaluateAiVisibilityEligibility(runs)` — `MIN_DISCOVERY_PROMPTS=30` (motor başına sabit keşif seti), `MIN_RUNS=2`, `MIN_CITATION_SAMPLES=30`, farklı `promptSetVersion`'lı koşular birleştirilemez. `scoreEligible`/`scoreReason` artık **sayım sonucu**; asla tek koşu yayımlayamaz. `geo-publication-gate` çoklu-tur (`aiVisibilityRuns`) üzerinden aynı kapıyı kullanır; tekil `AiVisibilitySummary.scoreEligible` da aynı fonksiyondan gelir (eski prose kaldırıldı).
- **Akış ayrımı (d):** pilot 10 şablonluk set **değişmedi**; yeni `buildComparativeAiVisibilityPrompts` = 32 şablon (2 marka + **30 keşif**), `AI_VISIBILITY_COMPARATIVE_SET_VERSION = "2026-09-23.1"`, en/tr setleri (diğer diller için **ilan edilen sınır**: İngilizce set). `discoveryPromptsPerEngine` (motorda en az ölçülen sabit keşif sayısı) ve `citationSamples` (sağlayıcı kaynaklı) özet alanları olarak raporlanır; tur karşılaştırmalı panel zaten `aiVisibilityRuns` ile çalışır.
- **Çalıştırıcı:** `scripts/ai-visibility-comparative.ts` — **ücretli adım**; `AUDITPRO_AI_COMPARATIVE_APPROVED=yes` olmadan tek token harcamaz, iki koşuyu çalıştırır ve kapıyı JSON olarak basar.
- **Test:** `test:ai-visibility` (32/30 set, 29/1-koşu/ince-atıf/karışık-set reddi, 30×2 kabulü), `test:geo-publication-gate` (iki koşu → "Publishable"; tek koşu → "Directional only").
- **Kalan dış adım:** 30×2 ücretli koşuların gerçekten çalıştırılıp verinin toplanması (bütçe onayınızla `scripts/ai-visibility-comparative.ts`).

### B3 · Production web search (kod bitti)
- `resolveWebSearchMode(pilotMode)` + `AUDITPRO_AI_WEB_SEARCH_MODE` = `pilot-only` (varsayılan) / `always` / `never`. Üretim taramaları varsayılan olarak **aramasız**; mod artık sonuç kartında etiketli (`searchMode: "web" | "none"` + UI rozeti + i18n en/tr).
- **Kalan dış adım:** `always`'a geçiş = bütçe kararı (arama başı doğrulanmış fiyat B1'de; DEPLOYMENT.md'de uyarı notlu).

### B4 · `serp` kararı — seçenek (b) uygulandı
- **`serp13` ("AI crawlers not blocked in robots.txt") artık ölçülüyor:** robots politikasından `oai-searchbot`/`perplexitybot`/`claudebot` yol kararları (`robots-ai-crawler-access@1.0.0`); engellenen varsa `Fail` (kanıt), tamamı kararlıysa `Pass`, değilse `N/A`. `scoreEligible: false` (hiçbir skora girmez; serp kategorisi puan yayımlamaz). Eğitim botu erişiminin ayrı bir yayıncı seçimi olduğu (GPTBot eğitim erişimi arama görünürlüğü için şart değil) notta açıkça yazılı.
- Kalan 20 serp kontrolü `external-evidence-required` kalır; `CORE_METRIC_TARGETS.serp`/`CATEGORY_SCORE_GATES.serp` legacy yorum tablosunda (v1 emekli, istemciye sayı yayımlamaz). Serp kalibre sayısı **0** olarak kalır (A4 envanter testi değişmedi).
- **Test:** `test:site-api-matrix` tam hat üzerinden yeşil (bulgu var, `results` yok, gözlem sayacı korundu).

### B6 · Paket kotalarının yeniden hesaplanması (analiz bitti, karar size ait)
- Yeni `lib/plan-economics.ts`: müşteri katkısı = fiyat − (gözlem başına en kötü durum maliyeti × aylık en kötü durum gözlem sayısı); hedef **kullanım maliyeti ≤ fiyatın %25'i** (açık varsayım, `TARGET_USAGE_COST_SHARE`). `scripts/billing.test.ts` tabloyu **pinledi** (analiz test temelli):
- | Plan | Fiyat | En kötü gözlem/ay | Aramalı maliyet | Katkı | Hedefte mi? |
  |------|-------|-------------------|-----------------|-------|-------------|
  | Free | 0 € | 0 | 0 € | — | ✓ |
  | Pro | 19 € | 200 | 3,24 € | %83 | ✓ |
  | Agency | 49 € | 3.000 | 48,6 € | **%1** | ✗ |
  | Enterprise | 149 € | 15.000 | **243 €** | **−%63** | ✗ |
- Aramasız en kötü durumda bile Agency %44, Enterprise %7 katkı — açık **kota açığı**.
- **Teklif (onayınıza sunulur, `plans.ts`'e DOKUNULMADI):** hedefi tutturmak için `aiReportsPerMonth`: Agency 100→**25** (750 gözlem → 12,15 €, %75 katkı), Enterprise 500→**75** (2.250 gözlem → 36,45 €, %75 katkı); kredi limitleri orantılı: Agency 3.000→**750**, Enterprise 15.000→**2.250** (billing invariantları korunur). Alternatif: fiyat artışı veya gözlem başına maliyet düşüşü (daha küçük completion bütçesi). Karar sizin.

### C1 · Core Web Vitals (lab bitti, saha dış adımlı)
- Yeni `lib/cwv-evidence.ts` (`collectLabCwv`): stabilize edilmiş masaüstü geçişinde buffered `PerformanceObserver`/`largest-contentful-paint` ile **lab LCP + CLS** toplanır (`ViewportMeasurement.cwv`). `t15`/`t17` bulguları **gözlem** (`N/A`, `scoreEligible:false`, `reasonCode:'lab-proxy-not-field'`) ve notta "bu alan CWV iddiasıdır, lab değerleri gözlemdir" der; `t16` (INP) **bilinçli ölçülmez**: otomatik geçişte etkileşim yoktur, not bunu söyler.
- **Test:** `test:rendered` (t15/t17 lab gözlem + t16 etkileşimsizlik notu, skor-dışı).
- **Kalan dış adım:** saha CWV = CrUX/Search Console entegrasyonu — **GSC anahtarı** gerektirir; anahtar olmadan yapılamaz.

### C2 · Dış bağlantı doğrulaması (kod bitti, varsayılan kapalı)
- Yeni `lib/external-link-checks.ts`: `planExternalLinkChecks` (tekilleştirme + bütçe), `summarizeExternalLinkChecks` (saf kapsam/sonuç), `verifyExternalLinks` (ince async istek döngüsü). **Kendi bütçesi** (`AUDITPRO_EXTERNAL_LINK_CHECK_LIMIT`, varsayılan 20, en fazla 100) ve **kendi kapsamı**; kesilen bütçe `scope.complete`'ı kırar, ulaşılamayan hedef **geçiş sayılmaz**, gözlenen 4xx/5xx kanıt kalır. Her hedef `fetchPublic` üzerinden **adres politikasından** geçer. `o44`'e `contentDetails` + kapsam olarak bağlanır; `o44` değer biçimi (test pinli) yalnız etkin modda not ekler.
- **Test:** `test:measurement-calibration` → `External link checks passed` (bütçe/tekilleştirme/hata/varsayılan-kapalı).
- **Açma kararı:** `AUDITPRO_EXTERNAL_LINK_CHECKS=enabled` (DEPLOYMENT.md) — varsayılan kapalı kalır, çünkü tarayıcı sessizce dış istek atmamalı.

### C3 · Şema içerik uyumu (kod bitti)
- `structuredDataEvidence` blokları artık `fields` + `missingRequired` taşıyor: bildirilen `@type` başına gerekli alan varlığı (`Organization.name/url`, `LocalBusiness.name/address/telephone`, `FAQPage.mainEntity`, `Question.name/acceptedAnswer`, `Product.name/offers`, `Article/BlogPosting.headline/datePublished`, `WebSite`, `BreadcrumbList`) kontrol edilir; eksikler `Organization.url` biçiminde **inceleme için listelenir**, asla `Fail` üretmez (varlık ≠ doğruluk ilkesi). Blok başına alan toplama bilinen bir eşleme sınırı olarak yorumlandı. `compareSchemaText` görünür-metin uyumu zaten vardı.
- **Test:** `test:measurement-calibration` → "schema required-field gaps are diagnostics, not failures" (39 senaryo).

### Kalan dış adımlar (özet) — 2026-09-23 güncel durumu
| # | Adım | Durum |
|---|------|-------|
| 1 | B2 30×2 ücretli karşılaştırmalı koşular | ✅ **TAMAMLANDI (2026-09-23):** kapı `eligible: true` — 30/30 × 2 koşu, %100 kapsam, 201 atıf örneği; sonuç anılma %0 / atıf %0 (yayımlanabilir bulgu). Toplam ~$9,90. |
| 2 | B3 arama modu kararı | **Uygulandı:** `AUDITPRO_AI_WEB_SEARCH_MODE=always` (`.env.local` + DEPLOYMENT.md örneği/notu; karar tarihi 2026-09-23, B1 maliyet defteri ve B6 kota düzeltmesiyle destekli). |
| 3 | B6 kota/fiyat kararı | **Uygulandı:** §12 teklifi `lib/plans.ts`'e geçirildi (Agency rapor 100→25, krediler 3.000→750; Enterprise 500→75, krediler 15.000→2.250). `test:billing` pinleri güncellendi: her iki plan da %25 kullanım-maliyeti hedefini **tutuyor** (en kötü durum: Agency 12,15 € / %75 katkı; Enterprise 36,45 € / %75 katkı). Fiyatlar değişmedi. |
| 4 | C1 saha CWV | **Kod tamamlandı:** `lib/field-cwv.ts` (CrUX `records:query`, PHONE+DESKTOP p75, resmî eşikler LCP 2,5s/4s · INP 200/500ms · CLS 0,1/0,25; anahtar yoksa ölçüm **yok**, asla geçiş uydurulmaz). `t15`/`t16`/`t17` saha verisiyle `Pass/Partial/Fail` ham karar + `field-metric-uncalibrated` gözlemi olur. **Kalan: `AUDITPRO_CRUX_API_KEY` sağlanması.** |

**B2 koşu günlüğü (2026-09-23):** 1–2. karşılaştırmalı koşular çalıştırıldı (Povlex/povlex.com/tr, 2×32×4 gözlem). Sonuç: kapı **kapalı** — `29/30 sabit keşif/motor` (2. koşuda Gemini'nin tek çağrısı zaman aşımı), atıf örneği 135 ✓, koşu 2 ✓; anılma %0, atıf null (isimsiz keşif sorularında Povlex anılmıyor — dürüst ölçüm). Koşu iki **bütünlük açığı** yakalattı ve ikisi de düzeltildi: (1) yayın kapısı tamamen verisiz kalan yapılandırılmış motoru paydanın dışına çıkarıyordu → artık her motor sayılır, verisiz motor **0**/30 ile kapıyı kapatır (`test:ai-visibility` "dead engine" senaryosu); (2) `perplexity/sonar` `openrouter:web_search` aracını reddediyor ("No endpoints found that support tool use") → Perplexity modellerine araç gönderilmiyor, kendi aramasının `citations` kanıtı kullanılıyor (`supportsWebSearchTool`). Tam koşu kayıtları (gözlemler dahil) `design/validation-matrix/ai-visibility-comparative-*.json` altına yazılır.

**B2 harcama mutabakatı (2026-09-23, kullanıcı verisiyle doğrulandı):** 4 koşu (2 program × 2×32×4) toplam **1.789.927 girdi + 189.673 çıktı token + ~310 arama** ≈ **7 USD** (OpenRouter paneli). B1 modelinin tahmini: **6,89 €** → **~%2 sapma** — maliyet defteri canlıda doğrulandı. Sözsel erken tahminler (2–4 €) düşüktü; nedeni gözlem başına girdi hacminin ~1.000 yerine ~5.000 olması (arama bağlamı enjeksiyonu). Kredi tükenmesiyle koptu: OpenRouter "Insufficient credits" hataları; fail-closed kapı bunu **0/30** olarak dürüstçe raporladı.

**B2 TAMAMLANDI (2026-09-23, final):** düşük maliyetli tamamlama (yalnız eksik çağrılar + `max_results:1` arama bağlamı + tek taşıma-yeniden-deneme) ile iki koşu **%100 kapsamla** kapandı: `30/30 sabit keşif/motor × 2 koşu`, atıf örneği **201** → **yayın kapısı AÇILDI (`eligible: true`)** — "Publication threshold reached". Ölçüm sonucu: anılma **%0**, atıf **%0** (B2-(c) temeliyle: 201 kaynaklı yanıtın 0'ı hedefi alıntıladı) — Povlex, 30 Türkçe isimsiz keşif sorusunda 4 motorda görünmüyor; yayımlanabilir kalitede, eyleme geçirilebilir bir GEO bulgusudur. Toplam program maliyeti **~$9,90** (4 koşu ~$7 + tamamlamalar $2,74 + $0,05 + $0,11). Son kayıt: `design/validation-matrix/ai-visibility-comparative-2026-09-23T17-14-42-635Z.json`.

**FİNAL kapı sonucu:** `npm run launch:readiness` — **43/43 adım yeşil (151.0s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T17-15-39-286Z.json`. P0 + P1–P3 planının tüm maddeleri kapandı; geriye yalnızca isteğe bağlı `AUDITPRO_CRUX_API_KEY` (saha CWV) kalıyor.

---

## 13. Gerçek-site web testi: iki üretim hatası (2026-09-23, gece)

Kullanıcı testi (drkemaltuskan.com) tarayıcı katmanının puana hiç girmediğini gösterdi ("skorlar yok"). Yerelde ücretsiz yeniden üretimle iki gerçek hata bulundu ve düzeltildi:

| # | Hata | Etki | Düzeltme |
|---|------|------|----------|
| 1 | **`installAxe` enjeksiyonu production'a özel kırılıyordu** — paketleyicinin `axe.source` ihracatı, build sırasında dönüştürülmüş bir program döndürüyor ve kendi minify değişkenlerinde `ReferenceError` veriyordu (her build'de ad değişiyordu: `u`→`t` → artefakt kanıtı). tsx/test koşuları ihracatı bozulmadan aldığı için **hiçbir test yakalamadı**. | 0/25 viewport ölçümü → tüm tarayıcı kontrolleri puan dışı → sütunlar `—` | axe paket dosyası **çalışma anında diskten** okunuyor (`createRequire(...).resolve('axe-core')`), dolaylı eval ile enjekte ediliyor; iki regresyon pini eklendi (`test:rendered`) |
| 2 | **`media/resource-size` (3MB cap) tüm render'ı geçersiz kılıyordu** | Sağlıklı sitede bile 16 kontrol `incomplete-browser-resources` ile düşüyordu | `RENDER_CRITICAL` listesi (document/stylesheet/script/font/iframe/xhr/fetch) — görsel/media kesintileri kaydedilir ama kontrast/ad/klavye/form ölçümünü geçersiz kılamaz |

Doğrulama (aynı site, üretim build): `renderedPagesMeasured 0→5`, `viewportRuns 0→25`, `checked 8→16`, skorlanan kontroller tarayıcı katmanını kapsıyor (u35/u36/u37/u39, c17/c19, t46/t47), `failedViewports: []`. Kullanıcı adımı: güncellenmiş build'i dağıtmak ve analizi yeniden çalıştırmak.

Kapı sonucu (bu vaka): `npm run launch:readiness` — **43/43 adım yeşil (121.1s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T18-41-45-756Z.json`. İki regresyon pini (`test:rendered`: indirect-eval + paketten okuma) kapıda yeşil.

**Ücretsiz kapanış paketi (2026-09-23):** (1) `POVLEX-GEO-AKSIYON-PLANI.md` yazıldı — ölçülen kaynak/rakip istatistiklerinden türetilmiş fazlı plan (semrush 114, ahrefs 66, zapier 63, onelittleweb 58... alıntı kaynakları; isimsiz keşifte anılma 0/224). (2) Dış link doğrulaması `.env.local`'de açıldı (`AUDITPRO_EXTERNAL_LINK_CHECKS=enabled`). (3) B1 model fiyat tablosu **doğrulanmış** fiyatlarla dolduruldu (kaynak+tarihli): `openai/gpt-5.6-luna` $0,20/$1,20 per M; `perplexity/sonar` $1/$1 per M; `anthropic/claude-sonnet-4.6` $3/$15 per M (çıktı aile standardı, kısmi doğrulama); `google/gemini-3.5-flash-lite` bilinçli olarak yok (fallback etiketiyle kalır).

Son tur kapı sonucu: `npm run launch:readiness` — **43/43 adım yeşil (148.8s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T10-07-21-404Z.json`.

Kapı sonucu (kalanlar): `npm run launch:readiness` — **43/43 adım yeşil (132.1s)**; rapor: `launch-readiness-reports/launch-readiness-2026-09-23T09-56-10-182Z.json`.
