# Povlex — Ölçüm ve Eksik Analizi

İnceleme tarihi: 11 Eylül 2026. Durum: mevcut kod incelemesi ve önerilen ölçüm sözleşmesi; uygulama değişikliği veya canlı yayın onayı değildir.

## 1. Karar özeti

Çalışan tarama, raporlama, tarayıcı ölçümü, kimlik doğrulama ve kota altyapısı korunmalı. Bununla birlikte mevcut testlerin geçmesi, SEO kurallarının güncelliğini veya AI görünürlük ölçümünün geçerliliğini kanıtlamıyor. AI özelliğini yalnızca anahtar ekleyerek tamamlanmış ürün diye açmak doğru değil.

Önce yanlış kesinlik üreten kurallar düzeltilmeli, ardından aşağıdaki ölçüm sözleşmesi uygulanmalı. Bu incelemede ücretli model isteği, satın alma veya canlı değişiklik yapılmadı. Parolalı pilot ve ödemeler-kapalı koşulu korunuyor.

“Eksiksiz” sözü bütün interneti veya gizli algoritmaları ölçmek anlamına gelmemeli. Taahhüt: ilan edilen kapsam içindeki her kontrolün kanıtlı sonucu veya açık ölçülememe nedeni bulunur. Site büyüklüğü, sektör, ülke, dil ve veri erişimi kapsamı etkiler.

## 2. Önceki kararlar ve bugünkü gerçek

- [Online Proje Dönüşümü](https://chatgpt.com/c/6a8c6f22-1e5c-83eb-a274-f941890de22c): analiz → kanıt → müşteri adayı → ücretli optimizasyon → yeniden ölçüm; ilk sürümde 10–20 otomatik site kontrolü, AI Readiness ile AI Visibility ayrımı ve analiz başına maliyet ölçümü. Bu 10–20 sayı, AI sorusu sayısı değil.
- [İçerik planı oluşturma](https://chatgpt.com/c/6a8e21e9-784c-83ed-beb7-49dec71f04b7): içerik stratejisi ve konsey kurallarının revizyonu; Povlex API soru/maliyet kararı bulunmadı.
- Sonraki tüm geliştirme kararları bu iki sohbetten çıkarsanamaz. Aboneliklerin tarihsel olarak yetkisiz eklendiği iddia edilmiyor; burada mevcut kod tespit ediliyor.

| Kodda bugün | Gerçek davranış / sınır |
|---|---|
| lib/plans.ts | Free: AI yok. Pro: 10 soru × 1 model, ayda 20 rapor. Agency: 10 × 3, ayda 100. Enterprise: 10 × 3, ayda 500. Bunlar Povlex paketleri. |
| lib/ai-visibility.ts: buildAiVisibilityPrompts | En fazla 10 sabit şablon; 2 marka sorusu + 8 keşif sorusu; sektör boşsa professional services varsayılıyor. Konum/persona ayrı alan değil. |
| configuredAiVisibilityEngines | İlk model OpenAI; üç modelde OpenAI, Gemini, Perplexity. Model isimleri ortamdan değişebilir. |
| defaultGenerator | 350 çıktı tokenı, 30 saniye zaman aşımı, en fazla 2 SDK tekrar denemesi; eşzamanlı 2 iş. Web araması açıkça yapılandırılmamış. |
| runAiVisibilityScan | Yanıttaki marka alt-dizesini ve metindeki URL'leri sayıyor. Arama sonucu anotasyonlarını korumuyor; URL içeriğinin iddiayı desteklediğini doğrulamıyor. |
| Skor | Mention %70 + citation %30; bu ağırlıklar ürün varsayımı. scoreEligible daima false. “30 keşif sorusu/model, iki çalışma” açıklaması var ama bunu gerçekleştiren akış yok. |
| lib/usage-ledger.ts | Tokenlar için iki genel EUR fiyatı kullanılıyor; model/arama/sağlayıcı bazlı gerçek fatura değil. |
| app/api/analyze/route.ts | HTML ve site örneklemi, sitemap, bazı gerçek iç bağlantı istekleri ve tarayıcı bulguları mevcut. Search Console, analytics, saha CWV ve AI görünürlüğünü açıkça kapsam dışında gösteriyor. |
| lib/browser-measurements.ts | Beş ekran profili; kontrast/erişilebilir ad, klavye, taşma, hedef boyutu, CTA ve form ölçümleri. Bunlar tam WCAG uygunluğu veya saha performansı belgesi değil. |

## 3. Resmî kriterler: neleri biliyoruz?

### Google / Google'ın AI arama özellikleri

Erişim, çalışan sayfa ve indekslenebilir içerik temel şartlardır; uygunluk indekslenme veya önerilme garantisi değildir. robots ile taramayı engellemek ve noindex ile indekslemeyi yönetmek farklıdır. [Teknik gereklilikler](https://developers.google.com/search/docs/essentials/technical?hl=en)

AI araması için temel SEO geçerlidir; özel bir AI schema'sı gerekli değildir. Google, llms.txt gibi dosyaları AI aramasında başarı şartı olarak sunmuyor. Bu dosya yok diye puan kırılmamalı. Google'ın AI Search özellikleri ile Gemini API aynı ölçüm yüzeyi değildir. [AI optimizasyon kılavuzu](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide)

Başlık için evrensel 50–60 karakter zorunluluğu yoktur; açıklık, özgünlük ve cihazda gösterim önemlidir. [Başlıklar](https://developers.google.com/search/docs/appearance/title-link)

SearchAction ile ilişkili sitelinks search box kaldırıldı; eksik SearchAction genel SEO başarısızlığı değildir. WebSite kullanımının tümü kaldırılmış değildir. [Resmî duyuru](https://developers.google.com/search/blog/2024/10/sitelinks-search-box)

Yapılandırılmış veri sayfa türüne uygun olmalı; yalnız bir anahtar kelimenin JSON-LD içinde geçmesi doğrulama değildir. [Yapılandırılmış veri](https://developers.google.com/search/docs/appearance/structured-data/sd-policies)

### OpenAI

OAI-SearchBot arama içindir; GPTBot eğitim tercihiyle ilgilidir. GPTBot'u kapatmak tek başına ChatGPT aramasından çıkmak değildir. ChatGPT-User kullanıcı tarafından başlatılan erişimdir. robots ve yayımlanan IP bilgileri ayrı kontrol edilmelidir. Povlex'in kendi IP'sinden başarılı erişim gerçek OpenAI botunun WAF'tan geçebildiğini kanıtlamaz. [Bot belgeleri](https://developers.openai.com/api/docs/bots)

### Perplexity

PerplexityBot arama için, Perplexity-User kullanıcı isteğiyle erişim içindir; robots ve WAF/IP koşulları önemlidir. Bot erişimi marka önerisi garantisi değildir. [Bot belgeleri](https://docs.perplexity.ai/docs/resources/perplexity-crawlers)

### Bing / Copilot

Yetkili site sahibinin Bing Webmaster Tools AI Performance raporu, alıntılanan sayfalar ve görünürlük eğilimleri için doğrudan gözlem kaynağı olabilir. Hesapta kullanılabilirlik ve dışa aktarım/API kapsamı entegrasyondan önce doğrulanmalı. Bu incelemede Bing genel yönerge sayfasının içeriği araçla okunamadı; okunmuş gibi kurallar türetilmedi. [AI Performance](https://www.bing.com/webmasters/help/ai-performance-9f8e7d6c)

## 4. Ölçüm matrisi ve yapılacak işler

Durumlar: mevcut = kod yolu görüldü; kısmi = kapsam/yorum sınırlı; eksik = incelenen akışta uygulanmış entegrasyon bulunmadı. Checklist'te bir satırın bulunması otomasyon demek değil.

| Alan | Mevcut durum | Tamamlanacak kanıt / kabul ölçütü | LLM gerekir mi? |
|---|---|---|---|
| HTTP ve yönlendirme | Mevcut; örneklem bazlı | Başlangıç URL, her yönlendirme, son durum; HTTP→HTTPS bağımsız test | Hayır |
| robots / bot erişimi | Dosya ve regex kontrolü | Bot ve URL bazlı Allow/Disallow önceliği, jokerler, erişim hatası sınıflandırması; WAF ayrı | Hayır |
| Sitemap | /sitemap.xml ve bazı index işleme | robots içindeki Sitemap konumları, XML geçerliliği, kapsam ve gerçek değişime uygun lastmod | Hayır |
| İndeksleme | noindex okunuyor | URL başına direktifler; gerçek indeks durumu için yetkili Search Console verisi | Hayır |
| Canonical | Aynı origin kontrolü | Hedef erişimi, noindex/redirect çelişkisi, URL tutarlılığı; çapraz domain otomatik hata olmasın | Hayır |
| Hreflang | Checklist var; otomasyon doğrulanmadı | Dil kodu, karşılıklı ve self referans, hedef durumu; yalnız çok dilli sitelerde | Hayır |
| Başlık/açıklama | Mevcut; bazı sabit eşikler | Sayfa başına özgünlük, eksiklik ve amaca uygunluk; uzunluk danışmanlık sinyali | Anlam için isteğe bağlı |
| Başlık hiyerarşisi | Sayma ve atlama kontrolü | H1 sayısı tek başına genel SEO hatası sayılmasın; gerçek sayfa yapısı gösterilsin | Genellikle hayır |
| İç bağlantılar | Gerçek hedef doğrulaması mevcut | Test edilen/keşfedilen oranı, ulaşılamayanlar; yetkili URL envanteri olmadan orphan iddiası yok | Hayır |
| Görseller | alt varlığı, boyut, format, lazy kontrolleri | Dekoratif görsel ayrımı; ilk görsel=üst bölüm varsayımı düzeltilsin; format tek başına kalite değil | Alt anlamı için isteğe bağlı |
| Schema | Regex düzeyi | JSON ayrıştırma, @graph, türün sayfaya uygunluğu, gerekli alanlar, görünür içerikle uyum | Hayır |
| İçerik | Bazı metin/link işaretleri | Hizmet/ürün amacı, kanıt, açıklık, güncellik; kaynak pasajıyla gerekçe | Sınırlı bağlamla evet |
| Kurum/yazar/güven | About/contact işaretleri kısmi | Kimlik, kaynak ve iddiaların doğrulanması; yalnız link varlığından otorite sonucu çıkarma | Yorumda yardımcı |
| Mobil / erişilebilirlik | Playwright + axe mevcut | Gerçek hata örnekleri, hangi sayfa/profil, başarısız ve belirsiz düğümler; tüm WCAG iddiası yok | Hayır |
| Performans | Sunucu süreleri; CWV yok | Laboratuvar ölçümü ayrı; CrUX/Search Console saha verisi ayrı; veri yoksa ölçülemedi | Hayır |
| CRO | CTA/form sinyalleri | Kullanım kolaylığı bulgusu ayrı; dönüşüm artışı için analytics ve deney gerekir | Yorumda yardımcı |
| AI hazırlığı | Checklist ile gerçek ölçüm karışma riski | Bot/URL erişimi ve semantik içerik; özel dosya varlığından görünürlük türetme | Kısmen |
| AI görünürlüğü | 10 şablonlu ön gözlem | Açık arama modu, gerçek kaynak anotasyonları, sabit sorgu seti, tekrar ve kapsama oranı | Evet |
| Gerçek ticari sonuç | Entegrasyon yok | Yetkili trafik/lead/satış verisi; öncesi/sonrası tek başına nedensellik değil | Hayır |

[CWV açıklaması](https://developers.google.com/search/docs/appearance/core-web-vitals) ve [insan odaklı içerik](https://developers.google.com/search/docs/fundamentals/creating-helpful-content), performans ve içerik kontrollerinin dayanaklarıdır.

## 5. Öncelikli kod bulguları

| Öncelik | Bulgular ve dosya | Risk | Düzeltmenin kabul ölçütü |
|---|---|---|---|
| P0 | AI: 10 soru sınırı ile 30×2 yayın koşulu çelişiyor; lib/ai-visibility.ts | Tamamlanmış ölçüm izlenimi | Ön gözlem ve karşılaştırmalı çalışma ayrı; durum gerçekten toplanan kanıttan türetilir |
| P0 | OpenAI/Gemini için açık arama araçları ve kaynak anotasyonları yok | Model belleği ile web görünürlüğü karışabilir | Her sonuçta API yüzeyi, model, arama modu, kaynaklar ve tarih; aramasız çalışma ayrı etiket |
| P0 | Marka alt-dize eşleşmesi; brandPosition karakter konumu | Kısa marka yanlış pozitifleri, karakter konumuna sıra anlamı verilmesi | Marka alias/kelime sınırı ve olumsuz anılma testleri; öneri sırası ayrı veya ölçülemedi |
| P0 | URL regex ile alıntı çıkarımı | Uydurulmuş URL veya ilgisiz bağlantı gerçek kanıt sayılabilir | Sağlayıcı kaynak metadatası + güvenli URL kontrolü; erişim ile iddia desteği ayrı |
| P0 | Token bazlı genel EUR tahmini; hata çıktısında 0 token | Arama ve başarısız denemelerin faturası görünmez | Sağlayıcı maliyeti/istek kimliği, arama sayısı, fiyat sürümü; bilinmeyen harcama sıfır sayılmaz |
| P1 | t1 robots varlığını Pass sayabiliyor; eksik dosyayı Fail sayıyor | Tarama izni yanlış yorumlanabilir | Dosya varlığı ile bot/URL erişim kararını ayır |
| P1 | t3: lastmod 30/90 gün eşiği | Değişmemiş doğru içerik haksız cezalandırılır | Tarih doğruluğu değerlendirilir; yaş tek başına hata olmaz |
| P1 | o2, o10, o12, o34: uzunluk, tek H1, H1-title farkı, görsel varlığı | Evrensel gereklilik olmayan kurallar puan düşürür | Olgu saklanır; bağlama bağlı öneri veya uygulanamaz; resmî zorunluluk iddiası kaldırılır |
| P1 | t36 SearchAction; schema regexleri | Güncel olmayan veya yanlış pozitif SEO bulgusu | SearchAction genel başarı şartı olmaktan çıkar; JSON ve uygunluk test edilir |
| P1 | Ölçülmemiş/skora girmeyen bulguların durumları | N/A, bilinmiyor ve uygulanamaz karışabilir | Ayrı durumlar: geçti, başarısız, kısmi, ölçülemedi, uygulanamaz |
| P1 | Hazır paket kotaları | Kod limitiyle ekonomik sürdürülebilirlik karıştırılır | Rapor kapsamı ve kullanım maliyeti onayından sonra paketleri yeniden hesapla |

P0 burada ürün doğruluğu açısından önceliktir; teyit edilmemiş güvenlik açığı iddiası değildir. Bu bulgular henüz düzeltilmedi.

## 6. Önerilen ölçüm sözleşmesi — ürün hipotezi

### A. Teknik/site içi rapor

İlk tarama için mevcut Standard 25 sayfa sınırı korunabilir: ana sayfa, temel hizmet/ürün, hakkında, iletişim, örnek içerik ve ilgili dil/konum sayfaları seçilir. Bu öneri, bütün siteyi eksiksiz taradık iddiası değildir. Seçim yöntemi ve kapsam raporda görünür. Teknik kontroller LLM çağırmaz; sunucu/tarayıcı maliyeti yine vardır.

Her bulgu: kontrol kimliği, kural sürümü, kaynak belge, URL, tarih, yöntem, gözlenen değer/pasaj, kapsam, durum, güven, öncelik ve düzeltme. Resmî gereklilik / iyi uygulama / Povlex hipotezi alanı zorunlu.

### B. AI görünürlük çalışması

İlk kalibrasyon için öneri: bir domain, bir hedef pazar, bir dil, en fazla üç ana hizmet. Altı niyet grubu × iki soru = 12 markasız keşif sorusu. Gruplar: hizmet sağlayıcı bulma, yerel arama (uygunsa), sorun/çözüm, karşılaştırma, kullanım senaryosu, seçim/güven ölçütleri. Yerel olmayan işte grup değiştirilir ve kaydedilir. İki marka sorusu ayrı tanı amaçlı eklenir.

14 soru × 3 model × 2 ayrı çalışma = 84 API yanıtı; görünürlük paydasına yalnız 72 markasız yanıt adaydır. Bu sayılar mevcut uygulamada yok; maliyet/kalite kalibrasyonu için öneridir, sektör standardı veya yeterli örneklem garantisi değildir. Kullanıcı onayı olmadan paket taahhüdüne dönüştürülmez.

Sorgular hizmet/konum bilgisiyle hazırlanıp çalışma başlamadan dondurulur. Başarısız sonuçların yerine olumlu sonuç getiren sorular seçilmez. Aynı müşterinin öncesi/sonrası karşılaştırmasında set, dil, sağlayıcı ve arama modu sabit tutulur; değişirse yeni baz ölçüm oluşturulur. İkinci çalışma anlık retry değil, ayrı tarihli gözlemdir. Önbellekten dönen yanıt bağımsız tekrar sayılmaz.

Rapor: her modelde marka anılma oranı, kaynak gösterilme oranı, başarısız istekler, kapsama, iki çalışma arasındaki değişkenlik ve ham kanıt. Başlangıçta modelleri tek 0–100 evrensel skorda birleştirme. 12 soruda tek değişim oranı yaklaşık 8,3 puan oynatır; bu bütün kullanıcı sorgularının pazar payı değildir.

84 yanıtlık çalışma güvenilir sonuç üretmezse daha çok soru körlemesine eklenmez: sektörle alakasız sorgu, arama desteği, kesilmiş yanıt ve kaynak doğruluğu önce düzeltilir. Genişleme gerekçeli ve yeniden maliyetlendirilmiş olur.

### C. Optimizasyon

Bulunan eksik ile AI tarafından seçilmeme nedeni arasında kesin nedensellik kurulmaz. Öneriler gözlenen kanıta ve resmî iyi uygulamalara dayanır. İçerik üretimi, müşterinin sitesine değişiklik uygulama ve sonraki ölçüm ayrı iş kalemleridir. İlk konsey kararındaki hizmet satışı modeli korunur.

## 7. Maliyet modeli

Sağlayıcı henüz seçilmedi; fiyat ve hesap erişimi uçtan uca doğrulanmadan satın alma önerisi kesinleştirilmeyecek. Vercel Hobby satın alma koşulları konusunda önceki açıklamalar çelişti; genel belge veya CLI onay ekranı ödeme uygunluğunun kanıtı değildir. Kullanıcı ödeme ekranını görmek istiyor; bu tercih korunur.

Formül:

`rapor API maliyeti = Σ(giriş tokenı × giriş fiyatı + çıktı/düşünme tokenı × uygun fiyat + gerçek arama çağrıları × arama fiyatı + diğer araç ücretleri) + ücretlenen tekrarlar + yorum/öneri üretimi`

Fiyatlar aynı para birimine çevrilmeli; cache, reasoning ve sağlayıcı farklılıkları açık tutulmalı. Platforma kredi yükleme komisyonu, vergi ve kur farkı ayrı. Kullanıcı kotası, sağlayıcıya ödenen dolar değildir.

Bugünkü 10×3 çalışma 30 mantıksal istek; iki SDK retry ile uygun hatalarda teorik olarak 90 SDK denemesine çıkabilir. Bu, 90 kez ücret kesin alınır demek değildir. Gateway'in kendi yönlendirme tekrarları da ayrı izlenmelidir.

### Doğrulanmış tek model fiyatıyla örnek

[OpenRouter Sonar](https://openrouter.ai/perplexity/sonar): 1 milyon giriş tokenı $1, çıktı tokenı $1; 1.000 web araması $5. Varsayım: her yanıtta bir ücretli arama ve 500 giriş + 500 çıktı tokenı → $0,006/yanıt. Arama bağlamı ve fatura davranışı gerçek pilotta doğrulanmalı; bu token boyutu mevcut 350 çıktı sınırının değil, planlama örneğinin varsayımıdır.

84 yanıtlık üç modelli öneride Sonar payı 28 yanıttır: yaklaşık $0,168. Buna diğer iki model, içerik yorumu ve tekrarlar eklenir. Bu tutar TAM rapor fiyatı değildir.

### Üç modelin ortalama maliyetine duyarlılık — fiyat teklifi değil

| Tüm modellerde ortalama ücretli yanıt maliyeti (varsayım) | 84 yanıt | %20 planlama payıyla | $10 kullanılabilir krediyle tam çalışma |
|---:|---:|---:|---:|
| $0,006 | $0,504 | $0,6048 | 16 |
| $0,015 | $1,26 | $1,512 | 6 |
| $0,030 | $2,52 | $3,024 | 3 |

%20 pay garanti üst sınır değildir. Bu tabloda içerik yeniden yazımı, hosting, emek, vergi ve yükleme komisyonu yoktur. İyileştirme sonrası aynı kapsam tekrar edilirse çalışma sayısı iki kat olur. Önceki “$10 ile 160 domain” örneği yalnız 10 Sonar sorusuydu; tam Povlex hizmetine genellenemez.

[OpenRouter ücretleri](https://openrouter.ai/docs/faq): kredi yüklemede %5,5, en az $0,80. Örneğin $10 kullanılabilir kredi için $10,80, vergiler hariç. Bu inceleme ödeme yetkisi değildir.

### Ticari karar

`müşteri katkısı = tahsil edilen hizmet bedeli - model/arama - altyapı payı - rapor inceleme/düzeltme emeği - destek - ödeme giderleri`

İlk konsey modeli hizmet satışıdır. Raporun tek başına ucuz olması satışın kârlı olduğunu kanıtlamaz. Lead→satış oranı, optimizasyon süresi ve satış fiyatı henüz doğrulanmadı; başa baş müşteri adedi uydurulamaz. Hizmet başına kabul edilen maliyet bütçesi belirlenmeden sınırsız ücretsiz AI taraması açılmamalı.

## 8. Güvenlik ve harcama sınırları

Mevcut SSRF/DNS sabitleme, kullanıcı/organizasyon sınırları ve kota rezervasyonu korunur. Alıntı URL'leri de aynı güvenli erişim kurallarına tabi olur. Yeni sağlayıcı anahtarı yalnız sunucuda, proje özelinde ve kullanım limitli olmalı. Otomatik kredi yükleme kapalı; inceleme için yeni ücretli abonelik yok.

İstek başlamadan token/arama üst sınırına göre rezervasyon, domain ve organizasyon bazlı günlük limit, çalışma başına iptal ve küresel durdurma anahtarı gerekir. Bütçe biterse eksik sonuç açık raporlanır. Timeout harcamayı sıfır varsaydırmaz; sağlayıcıyla sonradan mutabakat yapılır. Ham yanıt/kaynak saklama süresi ve erişim sınırı tanımlanır; model sağlayıcısının eğitim ve saklama tercihleri ayrıca kontrol edilir.

## 9. Test ve teslim sırası

Mevcut gerçek QA mekanizması scripts altındaki testler ve launch-readiness raporlarıdır. Test ekranındaki etiketler tek başına kanıt sayılmadı. Önceki 10 Eylül raporunda 38 adım passed; bu inceleme sırasında yeni tam yerel kontrol başlatıldı. Güncel sonuç aşağıda ayrıca kaydedilecek.

1. P1 SEO semantik düzeltmeleri: robots bot grupları, geçerli eski lastmod, SearchAction olmayan site, 50 karakterden kısa doğru başlık, çoklu H1 ve dekoratif görsel fixture'ları. Yanlış olumlu/olumsuzları test et.
2. P0 AI sözleşmesi: markanın kısa/çok anlamlı adı, olumsuz anılma, kaynak anotasyonu, kesilmiş çıktı, aramasız sonuç, başarısız model ve tekrar karşılaştırmaları.
3. Maliyet hesabı: farklı modeller, arama adedi, token/cache/reasoning, eşzamanlı rezervasyon, timeout sonrası bilinmeyen maliyet ve bütçe aşımı testleri.
4. Sonra onaylı küçük bütçeyle gerçek sağlayıcı kalibrasyonu; sorgu ve maliyet kaydı. Fixture testi gerçek kaynak kalitesinin yerine geçmez.
5. Parolalı hosted kullanıcı akışı, organizasyon izolasyonu, ücretli ödeme engeli ve rollback testi. Sonuçlar geçmeden genel kullanıma açma.

### Güncel doğrulama sonucu

11 Eylül 2026 tarihinde `npm run launch:readiness`: **38/38 adım geçti**, yaklaşık 101,8 saniye. Build, gerçek yerel tarayıcı akışları, rendered measurements ve AI fixture testleri dahil. Rapor: `launch-readiness-reports/launch-readiness-2026-09-11T13-46-17-480Z.json`. Ayrıca `npm run test:launch-readiness` geçti.

Bu çalıştırmada ayrı PostgreSQL entegrasyon testi veya canlı OVH testi yeniden çalıştırılmadı. PDF raster doğrulamasının zorunlu ortam bayrağı bu çalıştırmada ayrıca ayarlanmadı; 38 adımın geçmesi bütün isteğe bağlı kontrollerin zorunlu koşullarla tekrarlandığı anlamına gelmez. Gerçek AI yanıt kalitesi ve fiyatı için yeni API isteği gönderilmedi. Testler, bu raporda saptanan SEO/ölçüm tasarımı hatalarını çürüten kanıt değildir.

Yukarıdaki ilk doğrulama rapor aşamasına aittir. Aşağıdaki takip çalışmasında SEO kuralları düzeltilmiştir. Sağlayıcı geçişi, 84 yanıtlık deney ve yeni paketler uygulanmadı.


### SEO kural temizliği — 11 Eylül 2026

Aktif soru listesinden, puan paydasından ve önerilerden çıkarılan 12 kimlik:

- t3: sitemap için 30 günlük yaş şartı.
- t36: WebSite + SearchAction zorunluluğu.
- o2: başlık için 50–60 karakter şartı.
- o10: tam bir H1 şartı.
- o12: H1 ve title farklı olmalı şartı.
- o18: anahtar kelime ilk 100 kelimede olmalı şartı.
- o19: %1–2 anahtar kelime yoğunluğu.
- o20: LSI anahtar kelime kontrolü.
- o34: görsel yoksa başarısız sayılması.
- o42: sayfada 100 bağlantı sınırı.
- serp8: başlıkta güç/duygu kelimesi zorunluluğu.
- serp14: llms.txt zorunluluğu ile içerik okunabilirliğinin karıştırılması.

Kimlikler geçmiş kayıtlarla uyumluluk için ayrılmıştır; kayıt silinmez. Aktif katalog bunları dışlar. Eski sonuçlar bu kimliklerle puan veya öneri oluşturamaz.

Geçerli içerik/pagination kontrollerinin açıklamalarından keyfî kelime sayıları, yaş sınırı, rel=prev/next ve FAQ şeması zorunluluğu çıkarıldı. Arama botu erişimi eğitim botu erişiminden ayrıldı.

Robots varlığı (t1), sabit sitemap yolu (t2), canonical adresinin varlığı/origin kontrolü (t5), URL parametresi (t14) ve bağlantı sayısı (o37) tek başına uygulama doğruluğunu kanıtlamadığından otomatik bulguları yalnız tanısaldır; puana katılmaz. Tam doğrulama yöntemleri ayrıca geliştirilmelidir.

Ölçüm sözleşmesi 0.3.0 oldu. Önceki sözleşmeyle toplanan kanıtlar güncel puan için yeniden ölçülmelidir. Puan gösterme eşikleri düşürülmedi. Bu nedenle yeterli kanıt olmayan raporlar puan göstermeyebilir.

Bu değişiklikler yereldir; OVH test yayını bu çalışma sırasında güncellenmedi. Bu ilk temizlik, kalan bütün otomatik kontrollerin ve AI ölçümünün kalibre edildiği anlamına gelmez.

Temizlik sonrası doğrulama: launch:readiness 38/38 geçti (115,1 saniye). Rapor: launch-readiness-reports/launch-readiness-2026-09-11T14-28-12-816Z.json. Yeni regresyonlar, tip kontrolü, derleme ve yerel tarayıcı akışları dahil. Ayrı PostgreSQL entegrasyonu, canlı OVH ve gerçek AI sağlayıcı testi bu çalışmaya dahil değildir.

Takip çalışması: 0.4.0 ölçüm sözleşmesiyle tüm aktif kontrollerin yöntem envanteri ve 15 kalibrasyon senaryosu hazırlandı. Güncel kapsam, sınırlamalar ve 39/39 QA sonucu POVLEX-KONTROL-KALIBRASYONU.md dosyasındadır. Genel puan için mevcut doğrulanmış kapsam yeterli değildir; canlıya aktarım yapılmadı.

