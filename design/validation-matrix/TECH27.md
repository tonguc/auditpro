# TECH27 — XML site haritalarında doğru adres keşfi

14 Eylül 2026. Geçerli bir site haritasının kök ve çocuk etiketleri aynı XML
namespace'ini farklı öneklerle tanımladığında adresler sessizce atlanıyordu.
Yeni regresyon ilk çalışmada beklenen /service yerine boş liste döndürerek
hatayı yeniden üretti. Önek metni yerine kapsam içindeki namespace URI'si
çözümleniyor. Varsayılan namespace ve çocuk öğedeki yerel tanımlar desteklenir.

Yabancı namespace'e geçirilmiş url öğeleri sayfa adresi sayılmaz. Yabancı loc
zorunlu sitemap loc yerine geçmez. Farklı öneklerle iki loc verilmesi yine
geçersizdir. URL güvenliği, DTD yasağı, belge/sayfa sınırları ve puan politikası
korunur. Tam XSD doğrulaması veya bütün site kapsamı iddia edilmez.

Kalıcı testler: scripts/seo-evidence.test.ts ve scripts/sitemap-discovery.test.ts.
Karışık önekli sitemapindex → alt sitemap → sayfa keşfi uçtan uca keşif
fonksiyonunda doğrulanır. Bu testler mevcut measurement-calibration QA adımındadır.
Protokol referansı: https://www.sitemaps.org/protocol.html

Yerel tam QA 40/40 geçti, 140,7 saniye:
launch-readiness-reports/launch-readiness-2026-09-13T23-05-24-166Z.json.
Üretim derlemesi, gerçek Chromium matrisleri ve uygulama akışları bu koşudadır.

Sunucu yayını: 20260914-tech27 app/worker doğrulandı (TECH27_VERIFIED).
Yeni worker imajında measurement-calibration testi --network none ile geçti.
Hosted rapor detayları, TR etiketler, mobil görünüm ve AI belirsizlik gösterimi
geçti. Apex/www anonim/yanlış parola erişimi engelli, doğru parola çalışıyor;
gerçek ödeme uçları kapalı. Geri dönüş: pilot-images.before-tech27.yml.
