# Povlex parola korumalı test yayını — 11 Eylül 2026

Yeni ölçüm sürümü https://povlex.com adresine taşındı. Mevcut site parolası korunuyor.
Ölçüm sözleşmesi 0.7.0; uygulama ve analiz işçisi `20260911-seo07` etiketli.
Gerçek ödeme ve ücretli yapay zekâ çağrıları kapalı.

## Doğrulama sonuçları

- Yerel kalite kapısı: 39/39 başarılı. Rapor: `launch-readiness-reports/launch-readiness-2026-09-11T17-01-01-763Z.json`.
- Ubuntu üzerindeki iki imaj derlemesi başarılı. Son doğrulama betiğindeki tip hatası giderildikten sonra yerel kalite kapısı yeniden çalıştırıldı.
- Linux üzerinde ölçüm kalibrasyonu, robots/canonical/schema regresyonları ve Chromium ölçüm testleri başarılı.
- Pilot yapılandırması ve veritabanı ön kontrolü başarılı; 10/10 migrasyon mevcut. Şema değişmedi.
- Hem povlex.com hem www: parolasız ve yanlış parolalı istek 401; doğru parola 200.
- Ödeme ve Stripe bildirim uçları site parolasıyla bile 403.
- Geçici QA hesaplarıyla kayıt, giriş, rapor kaydetme/yeniden okuma ve hesaplar arası veri ayrımı başarılı.
- Sunucudaki example.com analizi tamamlandı: 0.7.0 kanıt sözleşmesi, beş ekran boyutu ölçümü, eski `__name` hatası yok.
- Geçiş öncesi yedek ayrı `povlex_restore_seo07` veritabanına geri yüklendi. Migrasyon 10, kullanıcı 7, rapor 2, analiz işi 2: kaynakla aynı. Bu sayılar yeni yayın test hesapları oluşturulmadan önceki durumu gösterir.

## Sunucudaki dosyalar

- Etkin Compose klasörü: `/opt/povlex/releases/20260911-candidate`; proje adı `povlex`.
- Yeni imajların kaynak klasörü: `/opt/povlex/releases/20260911-seo07`.
- Kaynak paket SHA256: `151ed64f034dbea212cc8d572de469c04513aebd0a408955b0eebbdaeedac77d`.
- Geçiş yedeği: etkin klasörün `backups/povlex-before-seo07.sql` dosyası; yalnız sunucuda tutuldu.
- Geri dönüş yapılandırması: `pilot-images.before-seo07.yml`. Önceki imajlar saklandı.
- Caddy, veritabanı, parola ve günlük yedekleme yolları değiştirilmedi.

## Sınırlar

Bu yayın, doğrulanmış teknik ölçümler içindir; gerçek AI ürünlerindeki görünürlük ölçülmüş sayılmaz. Ücretli AI devreye alınmadı. Tam 39 adımlı kapı yerelde; Linux üzerinde derleme, kalibrasyon, tarayıcı ve gerçek pilot akışı çalıştırıldı. Yedek geri yükleme testi bu sürümde başarılı; şifrelenmiş sunucu dışı otomatik yedekleme bu çalışmada doğrulanmadı. Genel kullanıma açılmadan önce ayrıca ele alınmalıdır.
