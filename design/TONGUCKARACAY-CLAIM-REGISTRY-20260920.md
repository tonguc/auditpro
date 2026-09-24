# Tonguç Karaçay — sayısal iddia sicili

Tarih: 20 Eylül 2026

Bu sicil, `tonguckaracay.com` içeriğinde alıntılanabilirlik ve güven açısından
önce ele alınacak sayısal iddiaları izler. Bir iddianın burada bulunması doğru
veya yanlış olduğu anlamına gelmez; yayınlanabilir kanıtının henüz hangi
durumda olduğunu gösterir.

## Durum tanımları

- **Yayınlanabilir:** Birincil kaynak bağlantısı veya yeniden üretilebilir
  birinci taraf ölçüm yöntemi görünürdür.
- **Kaynaklandır:** İddia makul olabilir; fakat tıklanabilir birincil kaynak,
  doğru tarih ve kapsam eklenmelidir.
- **Ölçüm gerekli:** Birinci taraf sonuç iddiasıdır; örneklem, dönem, başlangıç,
  yöntem ve sınırlama olmadan yayınlanmamalıdır.
- **Karşılama dili:** Kanıt tamamlanana kadar kesin sonuç yerine açıkça örnek,
  hedef veya olasılık dili kullanılmalıdır.
- **Kaldırıldı:** Canlı hizmet sayfasından çıkarılmış ve regresyon testiyle
  korunmuştur.

## Öncelikli kayıtlar

| Kimlik | Yüzey | İddia | Tür / risk | Mevcut kanıt | Durum | Yayın için gereken |
| --- | --- | --- | --- | --- | --- | --- |
| CLM-001 | TR/EN AI hizmet sayfaları | İşlerin yaklaşık `%80`'inin otomasyonu; iş yükünde `%60–70` azalma | Satın alma sonucu; yüksek | Sayfada yöntem veya kaynak yoktu | **Kaldırıldı** (`41480ad`) | Yeniden kullanılacaksa süreç tanımı, başlangıç, örneklem, dönem, insan onayı ve ham ölçüm özeti |
| CLM-002 | `kobi-yapay-zeka-egitim-programi.md` | Türkiye'deki KOBİ'lerin `%68`'i AI entegrasyonu istiyor fakat nereden başlayacağını bilmiyor | Pazar istatistiği; yüksek | Metinde tıklanabilir birincil kaynak yoktu | **Kaldırıldı** (`f1f2fe0`) | Yeniden kullanılacaksa asıl rapor, saha tarihi, örneklem ve sorunun tam kapsamı gerekir |
| CLM-003 | Aynı eğitim yazısının TR/EN çifti | Yanıt süresinde `%40–60` düşüş; bir e-ticaret KOBİ'sinde soruların `%55`'i chatbot tarafından çözüldü | Birinci taraf sonuç; yüksek | Müşteri, dönem ve ölçüm yöntemi görünmüyordu | **Kaldırıldı / yeniden kuruldu** (`f1f2fe0`) | Yeni metin ön test/son test, insan düzeltme süresi, hata ve kabul oranını birlikte ölçer |
| CLM-004 | `claude-mcp-instagram-icerik-takvimi-otomasyonu.md` ve İngilizce eşi | Planlama sürecinde `%80` hızlanma / üretimde `%60–70` hızlanma | Verimlilik sonucu; orta-yüksek | Metinde deney düzeni veya kaynak yoktu | **Kaldırıldı / yeniden kuruldu** (`f1f2fe0`) | Yeni metin aynı görev setinde manuel/destekli süre, yeniden işleme, kalite kapısı ve insan onayı kullanır |
| CLM-005 | TR/EN hasta takip ve randevu hatırlatma yazıları | İş yükü, gelmeme, gelir ve klinik sonuç yüzdeleri; sabit fiyatlar; koşulsuz uyum | Sağlık ve müşteri sonucu; çok yüksek | Eski metinde yöntem, dönem ve izin görünmüyordu | **Kaldırıldı / yeniden kuruldu** (`f523be5`) | Yeni metin yalnız ölçüm kartı doldurulduğunda sonuç yayımlanmasına izin verir; resmi KVKK rehberlerine bağlanır |
| CLM-006 | TR/EN müşteri hizmetleri chatbotu token maliyeti yazıları | Genel tasarruf yüzdeleri, sabit model fiyatları ve belgesiz müşteri sonuçları | Teknik/mali sonuç; yüksek ve zamana duyarlı | Eski metin güncel olmayan model/fiyat tablolarına dayanıyordu | **Kaldırıldı / yeniden kuruldu** (`cb71ac1`) | Yeni metin resmi fiyat bağlantıları, gerçek kullanım alanları, görev başı maliyet formülü ve kalite kapısı kullanır |
| CLM-007 | `geo-checklist-turkce-icerik-optimizasyonu.md` ve İngilizce eşi | AI aramanın sorguların yaklaşık `%50`'sini karşıladığı; ChatGPT'nin 900 milyon haftalık kullanıcısı; Google aramalarının `%45`'inde AI Overview | Hızla değişen pazar verisi; yüksek | İfadelerin yanında güncel birincil kaynak yoktu | **Kaldırıldı / yeniden kuruldu** (`d83e5d9`) | Değişken sayılar kaldırıldı; birincil Google, OpenAI, Perplexity ve GEO makalesi kaynakları ile açık kapsam sınırları eklendi |
| CLM-008 | Çeşitli AI-agent ve GEO checklist yazıları | “Müşterilerimizde”, “danışmanlık projelerimizde” veya “takip ettiğimiz işletmelerde” gözlenen yüzdeler | Birinci taraf deneyim; yüksek | Görünür vaka yöntemi ve izin kaydı yoktu | **Kapatıldı** (`b137e37` + `2bbb1cb` + `94af0d4` + `15015e0` + `d83e5d9`, 19 URL) | Belgesiz sonuçlar kaldırıldı; yeni sonuç ancak yayın kapısındaki yöntem, izin ve kapsam alanları tamamlanırsa eklenebilir |

## Yayın kapısı

Yeni veya güncellenen bir sayısal iddia aşağıdaki alanlar dolmadan
`Yayınlanabilir` durumuna geçirilemez:

1. İddianın tam cümlesi ve kullanılacağı URL.
2. İddia sahibi: dış kaynak mı, Tonguç Karaçay ölçümü mü?
3. Birincil kaynak URL'si veya ölçüm veri kümesi/kayıt kimliği.
4. Kaynak yayın tarihi; birinci taraf ölçümse başlangıç ve bitiş tarihleri.
5. Örneklem, payda, metrik formülü ve karşılaştırma tabanı.
6. Coğrafya, sektör, araç/model sürümü ve sonucu değiştiren koşullar.
7. Sınırlama ve sonuçların genellenemeyeceği durumlar.
8. Müşteri verisi varsa yayın/anonimleştirme izni.
9. En son doğrulama tarihi ve tekrar inceleme tarihi.

## Uygulama sırası

1. Önce sağlık, maliyet ve doğrudan müşteri sonucu iddiaları: CLM-005,
   CLM-006, CLM-003 ve CLM-008.
2. Ardından hızla değişen pazar istatistikleri: CLM-007 ve CLM-002.
3. Son olarak verimlilik örnekleri: CLM-004.
4. Kanıt bulunamayan her kesin yüzde, kaynak arama süresi dolduğunda sayı
   içermeyen koşullu dile çevrilir; yeni bir sayı tahmin edilmez.

## Tamamlanan ilk düzeltme

CLM-001, 20 Eylül 2026 üretim yayınında kapatıldı. TR/EN AI hizmet
sayfalarındaki kaynaksız sonuç yüzdeleri ve sabit başlangıç fiyatı kaldırıldı;
yerine ölçümlü pilot, insan onayı, veri sınırı ve proje özelinde kabul koşulları
kondu. Bu sicil yeni kanıt üretmez ve yayınlanabilir görünürlük skoru değildir.

CLM-005 de aynı gün `f523be5` ile kapatıldı. Türkçe ve İngilizce sağlık
yazıları yeniden kuruldu; doğrulanmayan yüzdeler, müşteri sonuçları, satıcı
sıralamaları ve sabit fiyatlar kaldırıldı. Sağlık verisinin özel nitelikli veri
olduğunu açıklayan resmi KVKK sayfası ve işleme rehberi eklendi. İki sayfada
otomasyona uygunluk tablosu, zorunlu insan sınırı ve pilot ölçüm kartı görünür
HTML'dedir.

CLM-006, `cb71ac1` ile kapatıldı. Türkçe ve İngilizce token maliyeti yazılarında
eski model fiyatları, genel tasarruf yüzdeleri ve yöntem kaydı olmayan müşteri
sonuçları kaldırıldı. OpenAI, Anthropic ve Google'ın resmi fiyat sayfaları;
önbelleksiz girdi, önbellekli girdi, çıktı, araç, depolama ve tekrar kalemlerini
ayıran formül; üç semantik tablo ve kalite kabul kapısı eklendi.

CLM-002, CLM-003 ve CLM-004, `f1f2fe0` ile kapatıldı. KOBİ eğitimi ve Claude
MCP/Instagram yazılarının TR/EN çiftlerinde kaynağı olmayan pazar ve verimlilik
yüzdeleri, sabit fiyatlar, güncelliği doğrulanamayan kurulum reçeteleri ve
belgesiz müşteri sonuçları kaldırıldı. Yerine eğitim ön test/son test kartı,
manuel-destekli iş akışı ölçümü, resmi MCP/Anthropic/Meta bağlantıları, insan
onayı, veri sınırları ve toplam maliyet formülleri kondu.

CLM-008'in ilk dalgası `b137e37` ile yayımlandı. Müşteri hizmetleri AI-agent ve
dijital pazarlama AI-agent yazılarının dört TR/EN URL'sinde yöntem kaydı olmayan
müşteri sonuçları, genel otomasyon yüzdeleri, sabit fiyat/süre ve koşulsuz
otonomi ifadeleri kaldırıldı. Yerine yetki merdiveni, insan devri/onayı, iki
turlu ölçüm kartı, geri alma kuralı ve kabul edilen görev başı maliyet kondu.
İkinci dalga `2bbb1cb` ile 21 Eylül 2026'da yayımlandı. E-ticaret ürün
açıklaması ve Instagram Reels trend analizi yazılarının dört TR/EN URL'sinde
kaynaksız müşteri sonuçları, sabit fiyatlar, genel performans yüzdeleri, gerçek
zamanlı trend ve viral tahmin ifadeleri kaldırıldı. Yerine onaylı ürün verisi,
tarihli kaynak kartı, insan onayı, kontrollü deney ve tam maliyet ölçümü kondu.
Düzeltilmiş ana dal taramasında ilk dalga sonrasında 15 eşleşme bulundu; ikinci
dalga sonrasında 11 dosya kaldı. Üçüncü dalga `94af0d4` ile 21 Eylül 2026'da
yayımlandı. Genel AI token fiyatlama ve Google Ads optimizasyon yazılarının dört
TR/EN URL'sinde değişken fiyatları sabitleyen tablolar, belgesiz müşteri sonuçları
ve genel performans vaatleri kaldırıldı. Yerine resmi sağlayıcı belgeleri, kabul
edilen görev başı maliyet, açık dönüşüm tanımı, ölçüm sözleşmesi ve tek değişkenli
deney akışı kondu. Aynı taramada artık yedi dosya kaldığı için kayıt henüz
bütünüyle kapalı değildir. Dördüncü dalga `15015e0` ile aynı gün yayımlandı.
AI-agent barındırma, prompt mühendisliği geliri, e-ticaret yerel SEO TR/EN çifti
ve Türkçe AI araçları rehberinde sabit fiyat/gelir, belgesiz müşteri sonucu,
sıralama süresi, eski ürün-plan bilgisi ve genel performans yüzdeleri kaldırıldı.
Yerine resmi kaynaklar, sabit test seti, insan onayı, restore testi, uygunluk
kuralları ve kabul edilen görev başı maliyet kondu. Envanterde kalan iki dosya,
CLM-007'nin hızla değişen pazar istatistiklerini de içeren aynı TR/EN GEO çiftidir;
iki kayıt son pakette birlikte ele alınacaktır.

Son paket `d83e5d9` ile 21 Eylül 2026'da yayımlandı. Türkçe ve
İngilizce GEO checklist sayfalarındaki kaynaksız pazar yüzdeleri, yöntemsiz
müşteri sonuçları, sabit güncelleme/uzunluk kuralları ve schema veya tarama
erişiminin atfı garanti ettiği ifadeler kaldırıldı. Birincil kaynak tablosu,
erişim kapısı, kanıt blokları, platform kontrolleri ve baseline gerektiren
ölçüm sözleşmesi eklendi. Böylece CLM-007 ve CLM-008 kapandı; envanterde
sıfır dosya kaldı. Konu-özel yayın öncesi baseline olmadığından bu yayına
nedensel görünürlük sonucu atfedilmez.
