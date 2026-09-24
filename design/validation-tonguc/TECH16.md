# Sayfa kaynak bütçesi ve hata kanıtları — TECH16

13 Eylül 2026. Parola korumalı test ortamında yayımlandı.

## Düzeltme

Tarayıcı bağlamı birden fazla sayfayı paylaşıyordu; 160 istek / 30 MB sınırı
sayfa yerine bağlam genelinde uygulanıyordu. İlk sayfalar sonraki sayfaların
kaynak hakkını tüketebiliyordu. Bütçe artık Page nesnesi bazında bağımsızdır.
Tek dosya boyutu, salt okunur istek ve güvenli genel URL kontrolleri korunur.

HTTP hataları, sayfa bütçesi, dosya boyutu, yazma engeli ve güvenli yükleme
başarısızlıkları sayfa/ekran boyutu/dosya düzeyinde kaydedilir. Kaynak URL'lerinin
sorgu parametreleri ve fragmentleri kayda girmez. Genel yükleme hatasında kesin
neden iddia edilmez. Sayfa başına en fazla 160 hata kaydı tutulur.

Kapsam ekranı bu kayıtları açılabilir bir listede gösterir. Her ekran boyutunun
isteği ayrı gözlemdir; liste uzunluğu benzersiz site sorunu sayısı değildir.

## Doğrulama

39/39 QA geçti: `launch-readiness-2026-09-13T14-28-28-492Z.json`.
Regresyonlar: iki sayfanın toplam 200 isteğinde birbirinin bütçesini tüketmemesi,
tek sayfanın sınırının korunması, HTTP 404 nedeni, yazma isteği engeli ve sorgu
parametrelerinin hata kanıtından çıkarılması.

Gerçek test: [tech16-result.json](tech16-result.json). 60 HTML sayfası, 5 tarayıcı
sayfası, 25 ekran boyutu ölçümü, 67.9 saniye (tek koşu; yük testi değildir).
Blog sayfasında `images.unsplash.com/photo-1571721795195-a2ca2d3370e9` görseli
beş ekran boyutunda da HTTP 404 verdi. Diğer dört sayfanın kaynak hata listesi
boştu. Bu koşuda sayfa bütçesi hatası yoktu. TECH15'te neden kaydı olmadığı için
eski uyarının ortak bütçeden kaynaklandığı kanıtlanmış değildir.

Tarayıcı bulguları gerçek kaynak eksikliği nedeniyle hâlâ puan dışıdır. Önceki
üç HTTP 500 sayfa hatası ve 15 benzersiz sayfa/öğe erişilebilirlik kanıtı korundu.
Yayındaki kaynak hata listesinde dosya/HTTP 404 fixture'ı, Türkçe/mobil kontroller,
apex/www parola ve ödeme engelleri geçti. App/worker TECH16; geri dönüş dosyası
`pilot-images.before-tech16.yml`. Yeni kanıtları almak için analiz yeniden çalıştırılmalı.

## Sınırlar

Gerçek kaynak eksikliği varsa toplu tarayıcı puanı hâlâ yayımlanmaz. Kaynağın
hangi ölçümü etkilediği otomatik kesinleştirilmediğinden bu koruma kaldırılmadı.
WebSocket engeli genel eksiklik bayrağını korur; dosya listesi bütün ağ olaylarının
eksiksiz HAR kaydı değildir. Veritabanı şeması veya ücretli AI çağrıları değişmedi.
