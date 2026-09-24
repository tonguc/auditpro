# Robots.txt bot ve sayfa kanıtı — TECH19

Googlebot, OAI-SearchBot ve PerplexityBot kararları artık yapılandırılmış kayıttır:
sayfa URL'si, bot, alınan politika URL/HTTP durumu, seçilen grup ve eşleşen kural.
Arayüz bot başlıklarını açarak sayfaları inceletir; uzun bir İngilizce not yerine
Türkçe/İngilizce durum ve belirsizlik nedeni gösterilir.

Farklı origin'e ait sayfaya ana origin'in politikası uygulanmaz: unknown olarak
kaydedilir. Aynı URL tekrarları kaldırılır. Alınamayan, aşırı büyük, desteklenmeyen
ve kodlanmış/karmaşık eşleştirme durumları izin olarak gösterilmez.

Bu paket robots eşleştirme kapsamını genişletmez; mevcut sınırlı eşleştiriciyi
denetlenebilir yapar. HTTP 4xx dahil eksik politika yorumu temkinli olarak
belirsizdir; gerçek bot erişimi/indeksleme/AI görünürlüğü kanıtlanmaz. Engelleme
kasıtlı olabilir; t1 puan dışıdır. Kalibre kontrol sayısı 8 kalır.

Regresyonlar: üç bot, URL tekrarları, farklı origin, kural/grup korunması,
503 ve kodlanmış yol belirsizliği; önceki eşleştirme testleri korunur.

QA: 39/39 geçti; launch-readiness-2026-09-13T19-23-10-336Z.json. İlk derlemede bulunan kayıt tipi uyumsuzluğu düzeltildi ve tam QA yeniden geçti.

Yayın: 13 Eylül 2026 TECH19 parola korumalı yayında. Gerçek tarama tech19-result.json: 60 sayfa / 180 bot-sayfa kararı; üç bot için de 60 izinli kural kararı. Bu gerçek erişim/indekslenme garantisi değildir. Tarama 66.3 saniye (tek koşu).
İlk hosted test iç içe summary seçici belirsizliğinde durdu; otomatik TECH18 rollback çalıştı. Test seçicisi doğrudan çocuk summary olarak düzeltildi; tekrar deployda robots kural detayı, Türkçe/mobil ve apex/www parola/ödeme engelleri geçti. Rollback kopyası pilot-images.before-tech19.yml korunur.

