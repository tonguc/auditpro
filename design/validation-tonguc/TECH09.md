# TECH09 doğrulaması

12 Eylül 2026. Parola korumalı pilotta uygulama ve motor `20260912-tech09`.

- Başarısız HTTP ve alınamayan yanıtlar artık envanterden kaybolmaz; sonuç ekranında ayrı görünür.
- HTML dışı/büyük yanıtlar ve tarama sınırı yüzünden istenmeyen adresler ayrıca kaydedilir.
- Kapsam sekmesi istenen adres, yönlendiği adres ve HTTP durumunu gösterir.
- Erişilebilirlik bulguları sayfa/kural/seçici bazında gruplanır; ekran boyutları korunur.
- Canonical kontrolünde kaynak sayfanın karşısında hedef URL bulunur.
- Çalışma planındaki 20 bulgu sınırı kaldırıldı.

## Testler

[Yeni motorun ham sonucu](tech09-result.json): 60 sayfa, üç 500 hatası,
üç tarayıcı sayfası × beş ekran boyutu; dokuz farklı sayfa/kural/öğe birleşimi ve
45 başarısız gözlem. Üç hatanın ve canonical hedefinin korunması
`deployment-artifacts/tech09-live.ts` doğrulamasında kontrol edildi.

39/39 yayın öncesi QA kontrolü geçti:
`launch-readiness-reports/launch-readiness-2026-09-11T21-21-46-324Z.json`.
Tarayıcı regresyon testi aynı öğenin beş ekran boyutunda tek grupta kaldığını kontrol eder.
Yayındaki test hesabında HTTP hata bildirimi, tarama sınırı, Türkçe başlıklar,
iş planı, sayfa kanıtı ve mobil taşma kontrolü geçti. Apex/www parola ve ödeme
kapıları doğrulandı. Önceki karşılaştırma betiğinin sunucuya özel import yolları
ilk derlemeyi durdurdu; göreli yollarla düzeltilerek QA bütünü yeniden geçirildi.

## Kalan sınırlar

- Tarayıcı ölçümü üç sayfalık örneklemdir; tüm site UX testi değildir.
- Ortak bileşenin farklı sayfalardaki kullanımları ayrı sayfa/öğe birleşimidir.
- Canonical varlığı Google'ın seçimi veya içerik eşdeğerliği değildir.
- Demo sayfalarının SEO önceliğini kullanım amacına göre belirleme henüz uygulanmadı.
- Ücretsiz plan değişmedi; 250 üst sınırlı koşu izole motor doğrulamasıdır.
- Sitemap keşfi mevcut bütçelere bağlıdır; bağlantısız bütün URL'lerin keşfi garanti edilmez.
- Eski kayıtlar yeniden ölçülmedi; yeni kanıt için tekrar analiz gerekir.

[Önceki karşılaştırma](COMPARISON.md) TECH08'in tarihsel durumudur.
Bu düzeltmeler tüm teknik doğruluğun tamamlandığı anlamına gelmez.
tonguckaracay.com sitesinin kodu değiştirilmedi.
