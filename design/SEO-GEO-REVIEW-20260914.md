# SEO/GEO ölçüm incelemesi — 14 Eylül 2026

Bu kayıt kod incelemesidir; bütün kontrollerin veya gerçek sitelerde doğruluğun
onayı değildir. Öncelik: puanlanan yöntemlerde yanlış karar, sonra tanısal
bulguların iddia/kanıt uyumu, sonra yeni kontrol kapsamı.

## TECH28'de giderilen puan riski

o1/o5 başlık ve açıklama varlığı regex ile HTML metninden okunuyordu.
Template içindeki title, gerçek belge başlığıymış gibi Pass veriyordu; regresyon
bu davranışı yeniden üretti. HTML entity çözümlemesi eksik olduğundan yalnızca
boşluk içeren metadata dolu sayılabiliyor, eşdeğer açıklamalar o4/o8'de farklı
sayılabiliyordu. Ayrıştırılmış head üzerinden okuma ve normalize edilmiş sayfa
kanıtı bu hataları giderir. API sayfa özeti ile kontrol kanıtı aynı okuyucuyu kullanır.

Bu yöntem title/meta kalitesi, arama motorunun gösterdiği snippet veya sıralama
etkisi değildir. Aynı sayfada birden çok metadata bildiriminin ayrıca raporlanması
halen açık iştir; mevcut okuyucu ilk bildirimi kullanır.

## Sonraki teknik öncelikler

| Kontrol | Kodda görülen sınırlama | Gereken kanıt |
| --- | --- | --- |
| t22 gecikmeli görsel yükleme | TECH29 yükleme bildirimlerini gösterir; sıra üzerinden ekran altı varsayımı kaldırıldı | Görselin gerçek viewport konumu ve yükleme davranışı |
| t26 betik yükleme | TECH29 module/async/defer bildirimlerini ayırır; performans etkisi çıkarmaz | Gerçek yürütme ve kaynak yüklemesi |
| t29 HTTP→HTTPS | TECH31 kök HTTP başlangıcını, zinciri ve nihai yanıtı test eder | Diğer yolların kapsamı ve kalibrasyon; kök testinden tüm siteye genelleme yapılmaz |
| t24/t64 hız | TECH32 yanlış hız hükmünü kaldırdı; TECH33 üç sayfaya kadar üç tur yanıt başlığı medyan/aralık ve hata sayısı ekler | Tarayıcı/saha performansı ve sürdürülen yük ölçümü; mevcut aracılı Chromium'dan normal ziyaretçi TTFB çıkarılamaz |
| Güven/iletişim/CTA | Anahtar kelime veya nitelik varlığı anlamsal kaliteyi göstermez | Sayfa düzeyinde öğeler, uygulanabilirlik, gerekirse uzman incelemesi |

Bu kontroller puana uygun listede değildir. Ancak puan dışı olmak yanıltıcı
tanısal metni haklı çıkarmaz; sonraki düzeltmelerde Pass/Fail iddiası da kanıta
daraltılmalıdır. Kalibrasyonsuz bir kontrol sırf raporu doldurmak için açılmaz.

## GEO sınırı

OpenRouter seçimi ve 10 USD toplam bütçe kaydedildi; kullanıcı yüklemeyi erteledi.
Gerçek çağrı yok. Marka yönlendirmeli sorular keşif sorularından ayrılır.
Yanıttaki URL, sağlayıcı kaynak metadatası ve bağımsız kaynak doğrulaması üç ayrı
kanıttır. API modeli çıktısı tüketici ChatGPT/Gemini ekranının birebir ölçümü
değildir. Yeni entegrasyon arama motoru/model/tarih/dil/ülke ve maliyeti saklamalıdır.

## Yayın için açık kontroller

Uzman etiketli gerçek site örnekleri; sürekli yük/p95 ölçümü; OVH tam VPS geri
yükleme tatbikatı; kullanıcıların bulgudan etkilenen URL ve eyleme ulaşma testi.
Kısa otomatik test koşuları bunların yerine geçmez.
