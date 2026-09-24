# TECH33 — sınırlı tekrarlı yanıt başlığı ölçümü

Mevcut Chromium ağ katmanı güvenlik için kaynakları Node üzerinden tamamen
alıp route.fulfill ile tarayıcıya verir. Bu oturumdan gerçek ziyaretçi TTFB/CWV
iddiası çıkarılamaz. Ağ güvenliği devre dışı bırakılmadı.

t64 artık ilk üç benzersiz taranmış final URL için üç sıralı tur ölçüm yapar.
En fazla dokuz istek, istek başına en fazla 5 saniye, toplam 15 saniye istek
bütçesi. DNS ve bağlantı kapatma ayrı olduğundan kesin toplam duvar saati sınırı
değildir. Her istekte mevcut public URL/DNS-pinning/yönlendirme güvenliği kullanılır.
Yalnızca 2xx, aynı final URL ve geçerli süre kabul edilir. Hata/başka hedef/eksik
tur başarılı sayılmaz. Medyan, aralık, ham geçerli süreler, başarısız ve atlanan
denemeler sayfa URL'siyle saklanır. methodVersion: repeated-crawler-headers@1.0.0.

Bu küçük sunucu örneklemidir: cache durumu kontrol edilmez, CPU/ağ kısıtlaması
yoktur. Browser TTFB, CWV, şablon tutarlılığı veya p95 değildir; puan üretmez.
t24 tekil ilk tarama gözlemi olarak korunur. Yeni ücretli servis yok.

Kalibrasyon: üç hedef/dokuz istek sınırı, tekilleştirme, tur sırası, medyan,
kısmi hata, zaman bütçesi, değişen hedef, 503, geçersiz süre. API/Chromium
matrisinde üç geçerli tekrarın URL ve yöntem sürümüyle dönmesi doğrulanır.

İlk QA sunucuya özel .ts betiğinin yerel typecheck'e dahil olması nedeniyle
derlemede durdu. Betik deployment-artifacts altında .mjs olarak ayrıldı.
Tekrar tam QA 40/40 geçti, 130,1 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T10-13-53-165Z.json.
Üretim worker kalibrasyonu ve internete kapalı API/Chromium matrisi geçti.
Gerçek OVH koşusu 2026-09-14T10:20:45Z: https://tonguckaracay.com/en için
60, 190, 74 ms; medyan 74 ms; üç geçerli tekrar; başarısız/atlanan yok.
Kanıt: deployment-artifacts/tech33-live-timing-result.json. Bu tek sayfalık
sunucu örneğidir, genel performans doğruluğu veya kapasite kanıtı değildir.
App/worker 20260914-tech33 yayımlandı: TECH33_VERIFIED.
Hosted TR/rapor/mobil ve apex/www parola/ödeme kapıları geçti.
Geri dönüş: pilot-images.before-tech33.yml. Eski analizler yeniden çalıştırılmalı.
