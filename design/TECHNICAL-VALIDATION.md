# TECH08 — Sayfa kanıtı ve örneklem doğruluğu

11 Eylül 2026. Parola korumalı pilotta uygulama ve işçi `20260911-tech08`.

## Kapatılan hatalar

- Alt sayfalara yanlışlıkla Homepage denmesi giderildi (başlık, açıklama ve diğer HTML kontrol notları).
- HTML kontrolleri her sayfanın tam URL'sini, durumunu ve başlık/açıklama değerini kaydeder.
- Eksik başlık/açıklama, tekrar kontrolünde ikinci bir eksiklik işi oluşturmaz.
- Tekrar karşılaştırması yalnızca dolu değerleri kullanır; ikiden az dolu değer varsa N/A.
- Gerçek tekrar grubundaki tüm adresler kaydedilir; boş alanlar tekrar sayılmaz.
- Aynı son URL'ye yönlenen sayfalar iki kez sayılmaz.
- İş planı ve yan panel sayfa kanıtını gösterir; eksik kanıt için adres uydurulmaz.
- İstenen sayfa sayısı, planın uyguladığı sınır ve gerçekte taranan sayı ayrıdır.

## Gerçek tarama doğrulaması

Ayrı QA hesabında, ücretli AI olmadan drkemaltuskan.com tarandı.
İstenen: 25. Planın uyguladığı sınır: 5. Gerçek tarama: 5 farklı URL.

1. https://drkemaltuskan.com/
2. https://drkemaltuskan.com/iletisim/
3. https://drkemaltuskan.com/blog/
4. https://drkemaltuskan.com/blog/botoks-yaptirdim-pismanim/
5. https://drkemaltuskan.com/blog/burun-tikanikligi-nedenleri/

Eksik meta açıklaması yalnızca 5. adreste bulundu. Tekrarlanan açıklama yok.
o5=Fail, o8=Pass. Bu sonuç yalnızca taranan örneklemi kapsar.
Kullanıcının eski raporu değiştirilmedi; yeni kanıt için yeniden tarama gerekir.

## Doğrulamalar ve sınırlar

39/39 QA: launch-readiness-2026-09-11T20-44-42-773Z.json.
Son yönlendirme düzeltmesi sonrası ölçüm kalibrasyonu ve API testi tekrar geçti.
Son metin düzeltmesi sonrası derleme ve app-flow tekrar geçti.
Linux'ta 22 ölçüm kalibrasyonu senaryosu ve 26 SEO kanıt senaryosu geçti.
Pilot: sayfa adresi bağlantısı, panel, iş planı, mobil görünüm ve parola/ödeme engelleri geçti.

İlk yayın denemesi, geniş demo verisindeki bulgunun ilk 20 iş dışında kalmasıyla
testte durdu ve otomatik geri alındı. Odaklanmış tek eksiklik senaryosu daha sonra geçti.
**Açık iş:** İş planındaki ilk 20 sınırı ayrıca ele alınmalı; bütün işlerin gösterildiği iddia edilmez.
HTML kaynaklı kanıt dışındaki bazı ölçümlerde URL eşleştirmesi hâlâ yoktur.
Bu çalışma tüm SEO/GEO yöntemlerinin doğruluğunun tamamlandığı anlamına gelmez.

Geri dönüş: aktif Compose klasöründeki pilot-images.before-tech08.yml dosyasını
pilot-images.yml olarak geri koyup app ve worker servislerini birlikte yeniden oluştur.
