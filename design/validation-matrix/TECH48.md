# TECH48 — birleşik SEO doğruluk incelemesi ve test yayını

Kullanıcı 1 ve 2. ana işlerin yürütülmesini ve ardından OVH test yayınına
aktarımı açıkça onayladı. Parola/ödeme sınırları korunur.

Kalan HTML regex çıkarımları incelendi: sosyal önizleme, heading/alt/iç link,
sertifika bitişi, HTTP kaynak bildirimi, viewport/lang, footer/form/ARIA ve
analytics kaynak kelimelerinden anlamsal başarı/başarısızlık çıkarılmaz.
Gerçek kaynak okumaları parse5 ile alınır, sayfa kanıtı saklanır. Browser axe
ölçümleri yalnızca mevcut dar kalibrasyonla değerlendirilir. Diğer browser
heuristikleri mevcut eşik gözlemleridir; yeni doğrulanmış puan eklenmedi.

199 kontrolün tamamı CONTROL-CATALOG.md ve control-catalog.json içinde listelendi:
8 doğrulanmış dar kontrol, 42 otomatik gözlem, 149 harici/uzman kanıtı gerektirir.
Katalog tüm özelliklerin otomatik tamamlandığı iddiası değildir. Kontrol türü
ve uygulanabilirlik sınırları yazılıdır. Entegrasyon veya insan uzman kanıtı
olmayan özelliklere doğruluk yüzdesi veya tamamlandı etiketi verilemez.

Beş gerçek sayfanın aynı HTML örneği Python HTMLParser ve Povlex parse5 ile
bağımsız okundu: 10 title/meta varlık kararı eşleşti, uyuşmazlık yok.
Kaynak/özet: real-snapshots/reference.json ve real-seo-comparison.json.
Bu sınırlı karşılaştırma insan uzman kabulü veya tüm SEO kontrollerinin
doğrulanması yerine geçmez. Kontrol matrisi mevcut dört site türü ve eksik
kaynak senaryoları üzerine kalan kaynak regresyonlarıyla genişletildi.

Tam QA 40/40 geçti (157,9 sn):
launch-readiness-reports/launch-readiness-2026-09-14T20-31-55-129Z.json.
İlk derlemede yeni karşılaştırma betiğinin eksik TypeScript tipi düzeltildi;
tam QA yeniden çalıştırıldı. Üretim imajı kalibrasyonu ve internete kapalı
API/Chromium matrisi geçti: dört site türü + eksik kaynak, 10 sayfa,
50 viewport, 30 sayfa kararı.

Gerçek OVH worker koşuları: tonguckaracay.com/en 5 sayfa / 25 viewport / 60,1 sn;
drkemaltuskan.com 5 sayfa / 25 viewport / 102,5 sn. Eksik meta açıklaması olan
sayfa https://drkemaltuskan.com/blog/burun-tikanikligi-nedenleri/ olarak ölçüldü.
Kanıt: tech48-live-0.json, tech48-live-1.json, tech48-live-summary.json.
Bu çıktı kullanıcıların eski analizlerini değiştirmez; yeniden analiz gerekir.

TECH48, TECH36–47 yerel paketleriyle birlikte parola korumalı OVH pilotuna
yayımlandı. İki hosted test denemesi eski kapalı-ayrıntı varsayımları nedeniyle
TECH35'e otomatik döndü; testler yeni davranışı açıkça sınayacak şekilde düzeltildi.
Son koşu TECH48_VERIFIED: kayıt sonrası kanıtlar, TR/EN başlıklar, rapor, mobil,
apex/www parola ve ödeme kapıları geçti. App sağlık 200, worker başlangıcı başarılı.
Üretim uygulama kodu bu test düzeltmeleri sırasında değişmedi.
Geri dönüş dosyası pilot-images.before-tech48.yml, önceki sürüm TECH35.

199 kontrolün tamamının ölçümü veya doğruluğu bitmedi. Harici/uzman kanıtı
gerektiren kontroller, gerçek AI deneyleri, uzun süreli yük ve kullanıcı kabulü
açık kalır. Bu inceleme puana uygun sekiz kontrolü genişletmez.
