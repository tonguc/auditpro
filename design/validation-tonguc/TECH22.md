# Başlık, görsel ve iç bağlantı kanıtı — TECH22

Aktif API, o13/u34/o37 için eski regex ve bağlantı sayısı eşiği gözlemlerini
parse5 kaynaklı sayfa/öğe kanıtıyla değiştirir. Bu üç kontrol N/A/puan dışı kalır;
eski yardımcı analyzeHtml fonksiyonunun diğer tüketicileri yeniden kalibre edilmiş
sayılmaz. HTML template/script/style içerikleri sayılmaz; CSS görünürlüğü ayrıca
ölçülmez. Birden çok H1 tek başına hata değildir; aşağı doğru seviye atlama gözlemi
gösterilir, bölüm kapanışında daha üst seviyeye dönüş atlama sayılmaz.

Alt eksik/null, boş ve dolu olarak ayrılır. Boş alt dekoratif niyeti kanıtlamaz;
otomatik hata da değildir. Görsel açıklamasının anlamsal doğruluğu, ARIA/rol
istisnaları ve render edilmiş erişilebilirlik ayrıca değerlendirilmelidir.

İç bağlantılar kaynak URL altında hedef ve HTML metniyle gösterilir; belge base
adresi dikkate alınır. Yalnızca tam hedefle eşleşen mevcut doğrulanmış HTTP sonucu
aktarılır. Query farkı, taranmamış/bütçe dışı hedef veya ağ hatası success sayılmaz.
Ek istek yoktur; bağlantı sayısı kalite puanı değildir. Bozuk hedef HTTP kontrolü
t56'da kalır; o37 aynı hatayı ikinci puan olarak üretmez.

Kaynaklar (13 Eylül 2026):
https://www.w3.org/WAI/tutorials/images/decorative/
https://www.w3.org/WAI/tutorials/page-structure/headings/

Regresyonlar: inert öğeler, metin entity çözümü, başlık sırası, alt durumları,
base çözümü, fragment bağlantıları ve query hassas HTTP eşleştirmesi.

QA: 39/39 geçti; launch-readiness-2026-09-13T20-23-28-709Z.json. Yayın doğrulaması geçti.

13 Eylül 2026 TECH22 parola korumalı yayında. Gerçek tarama tech22-result.json: 60 sayfa, 1608 başlık öğesi, 272 img, 1687 iç bağlantı örneği. Bunlar benzersiz site hatası sayıları değildir. Her kontrol 60 kaynak sayfa kaydını korur; 3 mevcut HTTP 500 korunmuştur. 70.0 saniye tek koşu.
Hosted Türkçe başlık/seviye detayı, önceki kanıt ekranları, mobil ve apex/www parola/ödeme engelleri geçti. App/worker 20260913-tech22; rollback pilot-images.before-tech22.yml. Yeni kanıtlar için analizi yeniden çalıştırın.
