# TECH54 — HTTP başlangıç yönlendirmesinde yol korunumu

`t29`, taranan ilk üç sayfanın her biri için aynı yolun HTTP başlangıç URL'sini
ayrıca dener ve yönlendirme zinciriyle son HTTPS URL'sini sayfa bazında saklar.
Başarılı bir HTTPS sonu ancak hedef ana makine ve yol korunuyorsa `Pass` olur.
Ana makine değişikliği, HTTPS'ten tekrar HTTP'ye iniş veya yolun değişmesi
`Partial` ve inceleme gerektiren sonuçtur. Ağ hatası, iz bulunamaması ve standart
olmayan portlar `N/A` olarak kalır.

Bu kontrol örneklenen en fazla üç sayfanın yönlendirme gözlemidir; tüm site
yollarını, sertifika geçerliliğini, HSTS'yi veya SEO kalitesini doğrulamaz.
Puan kapsamı genişlemez.

Yerel yayın kapısı 40/40 geçti:
`launch-readiness-reports/launch-readiness-2026-09-16T18-16-09-899Z.json`
(136,4 saniye). Ölçüm kalibrasyonu; aynı yol, yol değişikliği, ana makine
değişikliği, HTTPS'ten HTTP'ye iniş, hata, iz yokluğu ve standart olmayan port
senaryolarını kapsar. Site API/Chromium matrisi de geçti.

OVH parola korumalı pilota app/worker `20260917-tech54` olarak yayımlandı.
`povlex.com` ve `www.povlex.com` için anonim/yanlış parola engeli, doğru parola
erişimi ve ödeme engeli geçti (`TECH54_VERIFIED`). Geri dönüş kaydı
`pilot-images.before-tech54.yml` TECH53 görüntülerini korur.
