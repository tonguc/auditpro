# Tonguç Karaçay — AI otomasyon danışmanlığı GEO eylem planı

Tarih: 19 Eylül 2026

Bu belge, TECH67 ile tamamlanan özel Gemini/OpenAI kaynak karşılaştırmasını
`tonguckaracay.com` için uygulanabilir bir iyileştirme sırasına dönüştürür. Bu
bir görünürlük skoru değildir. Yeni model çağrısı yapılmadı; çalışma canlı
sayfaların salt okunur teknik incelemesine ve mevcut özel raporların
toplulaştırılmış kaynak verisine dayanır.

## Uygulama durumu — 20 Eylül 2026

P0 ve ilk P1 içerik paketi `tonguckaracay.com` kaynak deposunda uygulandı ve
20 Eylül 2026'da `41480ad` commit'iyle `main` üzerinden Vercel üretimine
yayınlandı.

- Beş Türkçe/İngilizce hizmet çifti, toplam on sayfa için self-canonical,
  karşılıklı `tr`/`en`, İngilizce hizmet sayfasına `x-default`, Open Graph URL
  ve `Service.url` aynı kesin adreslere hizalandı.
- TR/EN AI sayfaları genel "AI çözümleri" konumundan "KOBİ'ler için AI
  otomasyon danışmanlığı" konumuna taşındı.
- İnsan onayı, ölçümlü pilot, veri sınırı ve dört aşamalı teslimat/kabul tablosu
  görünür HTML'e eklendi.
- Kaynağı sayfada doğrulanmayan yüzde grafikleri, sabit başlangıç fiyatı ve
  koşulsuz KVKK/GDPR uyum garantisi kaldırıldı; güvenlik cevabı proje özelinde
  sağlayıcı/hesap/saklama doğrulaması ve veri sorumlusu sınırlarıyla yazıldı.
- Kaynak regresyonları 10/10 hizmet metadata sayfasında ve iki AI içerik
  sayfasında geçti; Next.js üretim derlemesi 208/208 statik sayfa üretti.
- Gerçek Chromium kontrolünde masaüstü ve 390 px mobil sayfada yatay taşma veya
  hata örtüsü yoktu; başlıklar ve dört teslimat satırı göründü.
- Vercel üretim dağıtımı başarılı tamamlandı. Önbelleksiz canlı kontrolde on
  sayfanın 10/10'u 200 döndü; self-canonical, karşılıklı `tr`/`en`, İngilizce
  `x-default` ve Open Graph URL kontrollerinin tamamı geçti.
- Canlı sitemap on hizmet URL'sinin 10/10'unu içeriyor. `llms.txt`, Türkçe ve
  İngilizce AI otomasyon danışmanlığı URL'leriyle güncellendi ve yayın ayı
  Eylül 2026 olarak doğrulandı.
- Google Search Console URL Denetleme üzerinden yeniden indeksleme isteği bu
  çalışmada gönderilemedi. Genel sayfalar için yazma yetkili bir GSC API'si
  yok; yerleşik oturumlu tarayıcı otomasyonu başlatılamadı. Oturum çerezlerini
  kopyalayan riskli bir geçici profil çözümü kullanılmadı. Bu, yayından kalan
  tek manuel adımdır.
- Ayrı takip: mevcut Google Analytics isteklerinden bazıları CSP tarafından
  engelleniyor. Bu GEO paketinin işlevini bozmaz; analitik/CSP kararı ayrı ele
  alınmalıdır. Kurulum ayrıca güvenlik uyarısı taşıyan Next.js 14.2.0 kullanıyor;
  sürüm yükseltmesi ayrı testli iş olmalıdır.

## P2 iç bağlantı durumu — 21 Eylül 2026

İlk P2 iç bağlantı paketi `281f709` ile üretime yayınlandı.

- Ana sayfa, header, footer ve `llms.txt` hizmet URL'lerine zaten doğru
  bağlandığı için bu alanlarda gereksiz değişiklik yapılmadı.
- TR/EN danışmanlık ve eğitim sayfalarına “danışmanlık mı, eğitim mi?”
  karar bloğu ve karşılıklı nihai URL eklendi.
- Müşteri hizmetleri agent'ı, hasta takip, chatbot token maliyeti ve
  e-ticaret ürün açıklaması TR/EN çiftleri kendi dilindeki danışmanlık ve
  eğitim sayfalarına bağlandı.
- Bağlantılar istemci etkileşimine bağlı değil; ilk sunucu HTML'inde
  görünür ve ara yönlendirme yerine nihai URL'leri kullanır.
- 12/12 canlı URL 200, tek H1 ve beklenen doğrudan bağlantı kontrolünü
  geçti. 1440 ve 390 px tarayıcı kontrollerinde yatay taşma bulunmadı.
- Yeni sabit-prompt baseline çalıştırılmadı; paket görünürlük artışı
  veya nedensellik iddia etmez.

P2 iç bağlantı maddesi kısmen tamamlandı. Sonraki tur, kalan yazıları
niyet ve dil eşlemesine göre tarayıp yalnız gerçek kullanım senaryosu olan
sayfaları kümeye eklemelidir; mekanik site-geneli link çoğaltılmamalıdır.

## Yönetici kararı

Yeni bir AI otomasyon hizmet sayfası açmak ilk iş değildir. Mevcut Türkçe sayfa
[`/hizmetler/yapay-zeka-cozumleri`](https://tonguckaracay.com/hizmetler/yapay-zeka-cozumleri)
zaten 200 döner, sitemap'te bulunur, kapsamlı başlıklara ve `Service` ile
`FAQPage` yapılandırılmış verisine sahiptir. Yayın öncesi canlı HTML'de canonical
`https://tonguckaracay.com`, Türkçe/İngilizce/x-default hreflang hedefleri de
ana sayfalardı. İngilizce eş sayfada canonical `https://tonguckaracay.com/en`
olarak çıkıyordu. Arama motoruna "bu hizmet sayfası ana sayfanın kopyasıdır"
benzeri çelişkili bir sinyal gönderen bu teknik kimlik hatası `41480ad` ile
düzeltildi.

Ardından aynı sayfa, genel "AI çözümleri" anlatısından şu satın alma niyetine
daha kesin cevap verecek biçimde güçlendirilmelidir:

> Türkiye'deki KOBİ'ler için iş süreci analizi, güvenli pilot, entegrasyon,
> ekip eğitimi ve bakım sunan AI otomasyon danışmanlığı.

## Kanıt özeti

### Canlı teknik erişim

- `robots.txt` 200 ve `text/plain` döndü; genel taramaya izin veriyor ve
  GPTBot, ClaudeBot, Google-Extended, PerplexityBot, Meta-ExternalAgent ile
  CCBot için açık `Allow: /` içeriyor.
- `llms.txt` 200 ve `text/plain` döndü. AI çözümlerini uzmanlık olarak tanımlıyor
  ve Türkçe/İngilizce hizmet yollarını listeliyor.
- `sitemap.xml` 200 ve `application/xml` döndü; Türkçe ve İngilizce AI hizmet
  URL'lerini içeriyor.
- AI hizmet sayfası 200, `index, follow`, özgün title/description, tek H1,
  kapsamlı H2/H3 yapısı ve `Service`, `FAQPage`, `Person`, `Organization`
  şemaları taşıyor.
- Buna karşılık Türkçe ve İngilizce AI hizmet sayfalarının canonical ve
  hreflang hedefleri sayfaların kendi dil eşleri değil ana sayfalardır.
- [`/ai-egitimi`](https://tonguckaracay.com/ai-egitimi) ve incelenen blog
  sayfaları doğru self-canonical ve karşılıklı dil eşleri gösterdi. Sorun bu
  örneklemde özellikle eski hizmet şablonunda görünüyor; SEO danışmanlığı
  sayfasında da aynı ana sayfa canonical'i gözlendi.

### Üç tamamlanmış kaynak raporu

| Niyet kümesi | Kaynaklı gözlem | Toplam gözlem | Benzersiz kaynak alan adı | Sık görülen örnekler |
| --- | ---: | ---: | ---: | --- |
| Kullanım senaryosu keşfi | 27 | 30 | 67 | `cbot.ai` 5; `alotech.com.tr`, `corius.com.tr`, `ggtech.co`, `nexsol.com.tr`, `palmate.ai`, `planris.com` 2'şer |
| Satın alma ve risk | 25 | 30 | 45 | `turkiye.ai` 5; `akillikobi.org.tr`, `ey.com`, `protan.com.tr` 4'er; `kosgeb.gov.tr`, `kvkk.gov.tr`, `tobb.org.tr` 3'er |
| Sağlayıcı keşfi | 23 | 30 | 61 | `ey.com`, `mimozabilisim.com`, `protan.com.tr` 3'er; `haceegitim.com`, `nextstation.com.tr`, `turkalpartners.com`, `zeo.org` 2'şer |

Bu tablo "bu sitelerden bağlantı satın al" listesi değildir. Yalnızca
motorların üç raporda hangi tür kaynakları seçtiğini gösterir: somut kullanım
senaryoları, güven/risk açıklamaları, kamu ve meslek kuruluşu kaynakları,
uzmanlık sayfaları ve uygulanabilir hizmet anlatıları.

## Önceliklendirilmiş uygulama sırası

### P0 — Hizmet sayfasının teknik kimliğini düzelt — yerelde tamamlandı

Hedef süre: ilk yayın.

1. Türkçe canonical:
   `https://tonguckaracay.com/hizmetler/yapay-zeka-cozumleri`
2. İngilizce canonical:
   `https://tonguckaracay.com/en/services/ai-solutions`
3. İki sayfada karşılıklı hreflang:
   - `tr` → Türkçe hizmet sayfası
   - `en` → İngilizce hizmet sayfası
   - `x-default` → seçilen varsayılan hizmet sayfası; ana sayfa olmamalı
4. Aynı eski hizmet şablonunu kullanan diğer sayfaları tarayıp canonical ve
   hreflang eşleşmesini sayfa bazında düzelt.
5. Sitemap URL'leri, canonical'ler, iç bağlantılar ve yapılandırılmış veri URL
   alanları aynı kesin adresi kullanmalı; sondaki slash varyantları tek yöne
   301 olmalı.

Kabul ölçütleri:

- Her hizmet URL'si kendi kendini canonical gösterir.
- TR ve EN sayfalar birbirini doğru dil eşleri olarak gösterir.
- Canonical hedefleri 200 döner; yönlendirme veya zincir yoktur.
- Canlı kaynak HTML'de değerler görünür; yalnız istemci JavaScript'ine bağlı
  değildir.
- Google Search Console URL incelemesinde kullanıcı canonical'i doğru görünür;
  Google seçimi ayrıca izlenir, garanti edilmiş sayılmaz.

### P1 — Mevcut sayfayı net bir danışmanlık varlığına dönüştür — ilk paket yerelde tamamlandı

Hedef title önerisi:

> KOBİ'ler İçin AI Otomasyon Danışmanlığı | Tonguç Karaçay

Hedef H1 önerisi:

> KOBİ'ler için yapay zeka otomasyon danışmanlığı

İlk iki paragraf; hedef kitleyi, teslimatı, coğrafyayı ve sınırı doğrudan
söylemeli. Örnek iskelet:

> Türkiye'deki KOBİ'lerin tekrar eden satış, müşteri hizmetleri, içerik ve
> operasyon işlerini analiz ediyor; küçük bir pilotla başlayıp CRM, e-posta,
> WhatsApp, takvim veya raporlama sistemlerine insan onaylı AI iş akışları
> kuruyorum. Hizmet; ihtiyaç analizi, risk ve veri sınıflandırması, prototip,
> entegrasyon, ekip eğitimi ve ölçüm planını kapsar.

Sayfanın cevaplaması gereken satın alma soruları:

1. Kimler için uygun, kimler için uygun değil?
2. Hangi süreçler otomasyona uygundur?
3. Keşif, pilot, üretim ve bakım aşamalarında ne teslim edilir?
4. Hangi sistemlerle entegrasyon yapılabilir?
5. Veri nerede işlenir; KVKK rol ve sorumlulukları nasıl belirlenir?
6. Hangi kararlar mutlaka insan onayında kalır?
7. Başarı hangi başlangıç metriği ve zaman aralığıyla ölçülür?
8. Ücretlendirmeyi etkileyen kapsam değişkenleri nelerdir?
9. Bakım, hata yönetimi, model/tedarikçi değişimi ve çıkış planı nedir?
10. Eğitimden farkı nedir; hangi durumda yalnız eğitim yeterlidir?

### P1 — Alıntılanabilir kanıt blokları ekle

Her blok tek bir iddiayı, yöntemi ve sınırı birlikte taşımalı. Pazarlama
sıfatları yerine aşağıdaki gerçek varlıklar üretilmeli:

- **Teslimat tablosu:** aşama, müşteri girdisi, teslim edilen çıktı, süre
  aralığı, kabul koşulu.
- **Uygunluk matrisi:** süreç hacmi, hata maliyeti, veri hassasiyeti, insan
  onayı ihtiyacı ve otomasyon uygunluğu.
- **Pilot ölçüm kartı:** başlangıç değeri, pilot sonrası değer, dönem, örneklem,
  kullanılan sistem, sınırlama.
- **Risk sicili:** risk, önlem, sorumlu, insan onayı, geri alma yöntemi.
- **Entegrasyon matrisi:** CRM, muhasebe, e-posta, WhatsApp, takvim, destek ve
  veri ambarı; destek düzeyi "örnek", "doğrulandı" veya "proje özel" diye
  ayrılmalı.
- **Bakım çerçevesi:** izleme, hatalı çıktı, maliyet limiti, model değişimi,
  veri silme ve hizmetten çıkış.

Anonim vaka kullanılacaksa müşteri izni, sektör, dönem, başlangıç noktası,
ölçüm yöntemi ve sınırlama yazılmalı. Logo listesi tek başına AI otomasyon
projesi kanıtı sayılmamalı.

### P1 — Kaynaksız yüzdeleri doğrula, yumuşat veya kaldır

Aşağıdaki canlı içeriklerde görülen türden oranlar bir "iddia sicili"ne
alınmalıdır: KOBİ'lerin `%68` isteği, yanıt süresinde `%40–60` düşüş, Instagram
işinde `%80` hızlanma, hasta ekibi iş yükünde `%60–70` azalma, token maliyetinde
`%60–75` veya `%70` tasarruf ve AI aramanın sorguların yaklaşık `%50`'sini
karşıladığı ifadeleri.

Her iddia için şu alanlardan biri zorunlu olmalı:

- güvenilir birincil kaynak ve doğru yayın tarihi;
- Tonguç Karaçay'a ait ölçümse örneklem, tarih, başlangıç, yöntem ve sınırlama;
- kanıt yoksa kesin yüzde yerine açıkça örnek/olasılık dili.

Kaynak varmış izlenimi veren fakat kaynağı tıklanabilir biçimde göstermeyen
istatistik, üretken motorlar açısından alıntılanabilirlikten çok güven sorunu
yaratabilir.

### P2 — Üç niyet kümesi için destek içerikleri

Yeni içerikler hizmet sayfasına bağlanmalı; her içerik tek bir niyeti
tamamlamalıdır.

#### Sağlayıcı keşfi

- "AI otomasyon danışmanı nasıl seçilir? 12 kanıt sorusu"
- "Ajans, bağımsız danışman ve yazılım şirketi: hangi model ne zaman uygun?"
- "AI otomasyon teklifi karşılaştırma şablonu"

İçerikler tarafsız seçim ölçütleri sunmalı; rakip isimlerini kanıtsız sıralayan
"en iyi" listesi üretilmemeli.

#### Kullanım senaryosu keşfi

- WhatsApp/CRM lead sınıflandırma ve insan devri
- müşteri destek bilgi tabanı ve hata geri kazanımı
- e-posta, belge, teklif ve rapor akışları
- randevu hatırlatma ve hassas veri sınırları
- e-ticaret ürün/veri akışları

Mevcut hasta takip, chatbot maliyeti ve AI araçları yazıları bu kümeye iç
bağlantıyla bağlanabilir; fakat ispatlanmamış sonuç oranları önce düzeltilmeli.

#### Satın alma ve risk

- "KOBİ için AI otomasyon pilotu: bütçe kalemleri ve ROI çalışma tablosu"
- "KVKK açısından üretken AI veri sınıflandırma kontrol listesi"
- "AI otomasyon bakım sözleşmesinde bulunması gerekenler"
- "No-code/low-code otomasyonda sahiplik, yedekleme ve çıkış planı"
- "İnsan onayı nerede zorunlu tutulmalı?"

Hukuki uyum garantisi verilmemeli. KVKK için resmi mevzuat ve Kurum kaynakları
gösterilmeli; proje özelinde hukuk uzmanı incelemesinin sınırı belirtilmeli.

### P2 — İç bağlantı ve varlık tutarlılığı

- Ana sayfadaki "AI Dönüşümü" ve footer "AI Çözümleri" bağlantıları doğrudan
  düzeltilmiş hizmet sayfasına gitmeli.
- AI eğitimi sayfası "danışmanlık mı eğitim mi?" ayrımıyla hizmet sayfasına;
  hizmet sayfası da eğitim seçeneğine bağlanmalı.
- İlgili tüm kullanım senaryosu yazılarında yazar, hizmet ve vaka bağlantıları
  görünür HTML içinde yer almalı.
- `Person`, `Organization`, `Service`, yazar adı, adreslenen pazarlar ve hizmet
  tanımı TR/EN sürümlerinde aynı gerçeği anlatmalı.
- `llms.txt` içindeki "Last updated: April 2026" gerçek güncellemeyle birlikte
  yenilenmeli; Türkçe AI hizmet URL'si Key Pages/Services alanına açıkça
  eklenmeli.

Durum, 21 Eylül 2026: İlk P2 paketi `281f709` ile danışmanlık/eğitim karar
bloklarını ve dört TR/EN kullanım senaryosu çiftini bağladı. İkinci dalga
`f3cc393` ile dijital pazarlama agent'ı, Claude MCP içerik takvimi, Reels
analizi ve KOBİ AI eğitimi çiftlerini ekledi; böylece regresyonla korunan eş
kullanım senaryosu sayısı sekize çıktı. Yalnızca iddia-temizliği geçmiş,
bağlamı gerçek sayfalar bağlandı. VPS ve geniş AI/UI/ücretsiz araç içerikleri,
editoryal ve iddia denetimi tamamlanana kadar dışarıda bırakıldı. Yeni
sabit-prompt baseline olmadığı için bu yayınlardan görünürlük veya nedensellik
sonucu çıkarılmıyor.

### P3 — Kazanılmış dış doğrulama

Amaç bağlantı satın almak değil, üçüncü tarafça doğrulanabilir uzmanlık izi
oluşturmaktır.

- İzinli müşteri vaka çalışmaları: müşterinin kendi sitesinde veya ortak vaka
  sayfasında karşılıklı, gerçeğe uygun yayın.
- Meslek kuruluşları ve sektör yayınlarında ölçüm yöntemi açıklanan uzman
  yazıları, webinarlar veya röportajlar.
- Ürün/entegrasyon ortaklarının çözüm dizinlerinde doğrulanmış profil ve vaka.
- Kamu ve meslek kuruluşu kaynakları (`kvkk.gov.tr`, `kosgeb.gov.tr`, TOBB gibi)
  kanıt kaynağı olarak kullanılabilir; ilişki veya onay varmış gibi sunulamaz.
- Ad, unvan, site, uzmanlık ve sosyal profil bilgilerinde tutarlılık.

Ücretli link yerleştirme, sahte yorum, otomatik dizin yayılımı veya gerçekte
olmayan müşteri/ortaklık iddiası bu planın dışındadır.

## 30/60/90 günlük uygulama planı

| Dönem | Çıktı | Başarı kanıtı |
| --- | --- | --- |
| İlk 7 gün | Canonical/hreflang düzeltmesi; hizmet şablonu taraması; iddia sicili | Canlı HTML kontrolleri, sitemap/canonical eşleşmesi, Search Console inceleme isteği |
| 8–30 gün | Hizmet sayfası yeniden yazımı; teslimat/risk/entegrasyon tabloları; en az bir yöntemli vaka | Sayfada görünür HTML, geçerli şema, kaynak ve yöntem bağlantıları |
| 31–60 gün | Üç niyet kümesinden en az birer destek içeriği; iç bağlantı ağı | Hizmet sayfasına ve içerikler arası doğru canonical iç bağlantılar |
| 61–90 gün | İzinli ortak vaka veya uzman yayını; ikinci vaka; güncelleme kaydı | Üçüncü taraf URL, yayın tarihi, doğrulanabilir ilişki ve ölçüm sınırı |

## Ölçüm tasarımı

Teknik düzeltme yayınlandıktan ve yeniden tarama için makul süre geçtikten sonra
aynı 30 sabit soru korunmalıdır. Karşılaştırılabilirlik için soru metni, dil,
ülke bağlamı, motor, arama yöntemi ve rapor şeması değiştirilmemelidir.

Önerilen sıra:

1. Ücretsiz kontroller: canonical/hreflang, sitemap, schema, index durumu ve
   alıntılanabilir metin blokları.
2. Search Console üzerinden hizmet sayfası indeksleme/canonical gözlemi.
3. İçerik ve dış kanıtlar yayımlandıktan sonra en az 4–6 hafta bekleme.
4. Yeni ücretli motor turu ancak ayrıca kişisel bağlam aktarımı, motor, çağrı
   sayısı ve yaklaşık bütçe için açık onay alınırsa çalıştırılır.
5. Sonuç yine motor/tur/kaynak kapsama sınırlarıyla raporlanır; eksik kaynak
   metadatası sıfır atıf gibi değerlendirilmez.

Takip metrikleri:

- 30 sabit soruda marka geçişi;
- kaynaklı gözlemlerde hedef alan adı atfı;
- sağlayıcı keşfi, kullanım senaryosu ve satın alma/risk kümeleri ayrı sonuç;
- hizmet sayfasının doğrudan atıf aldığı soru sayısı;
- motorlar arası URL ve alan adı örtüşmesi;
- kaynak metadatası kapsamı;
- organik gösterim, tıklama ve nitelikli görüşme talebi (AI atfıyla
  karıştırılmadan ayrı tutulur).

## Yapılmayacaklar

- Mevcut 0/30 sonucu kamuya açık nihai skor veya "AI'da görünmüyorum" hükmü
  olarak yayımlamak.
- Teknik canonical sorunu çözülmeden benzer ikinci bir hizmet sayfası açmak.
- Yalnız `llms.txt` veya schema ekleyerek görünürlük garantisi vermek.
- Kaynaksız yüzdeleri çoğaltmak.
- Rakiplerin kaynak aldığı alan adlarını mekanik backlink listesi saymak.
- Yeni ücretli model turunu açık onay olmadan çalıştırmak.
- Üyelik/ödeme işini öne almak veya kurtarma sırasını değiştirmek.

## Yöntem notu

Planın GEO içerik mühendisliği yaklaşımı Eugen Ullrich'in çalışmasına dayanır:
[eullrich.com](https://eullrich.com), CC BY 4.0. Uygulanan temel ilkeler:
erişilebilirlik kapısı, ilk HTML'de çekirdek içerik, semantik ve parçalanabilir
yanıt blokları, kaynaklandırılmış özgün kanıt, niyet temelli önceliklendirme ve
manipülasyonsuz üçüncü taraf doğrulaması.
