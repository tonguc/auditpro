# Tarayıcı örneklemi — TECH15

13 Eylül 2026, parola korumalı test ortamında yayımlandı.

İlk üç URL yerine en fazla beş farklı URL seçilir. İlk URL korunur; varsa
iletişim, hizmet, ürün ve içerik adres kalıplarından seçim yapılır. Eksik gruplar
kalan keşfedilmiş adreslerle doldurulur. Bu bir URL kalıbı sezgisidir; sayfanın
iş amacını veya bütün siteyi temsil ettiğini kanıtlamaz.

Seçilen her URL için tamamlanan/tamamlanamayan ekran boyutları kaydedilir ve
kapsam ekranında görünür. Tamamlanan ölçüm sayısı, kaynakların eksiksiz yüklendiği
ya da sonucun puanlamaya uygun olduğu anlamına gelmez.

## Kanıt

39/39 QA; örnek çeşitliliği, tekrar ve küçük site regresyonları geçti.
Yayındaki kapsam ekranında başarısız ekran boyutu fixture'ı, Türkçe/mobil ve
parola/ödeme kontrolleri geçti.

[Gerçek test](tech15-result.json): 60 HTML sayfası; ana sayfa, iletişim, UI/UX
hizmeti, ürünler ve blog üzerinde 25 ölçüm; süre 64.5 saniye. Bu tek koşudur,
yük testi veya performans garantisi değildir. 15 sayfa/öğe birleşimi 75 başarısız
erişilebilirlik gözlemiyle kaydedildi; tekrarlar ayrı sorun sayılmadı.

Yeni örneklemde bazı kaynaklar yüklenemedi/engellendi. Mevcut koruma bu nedenle
tarayıcı bulgularını puan dışında bıraktı. Kaynak hata nedenlerinin URL ve sayfa
düzeyinde daha ayrıntılı teşhisi sonraki iştir; bu sorun çözülmüş sayılmamalıdır.
Önceki HTTP 500 ve canonical kanıtları korundu. Yeni örneklem için tekrar analiz gerekir.
