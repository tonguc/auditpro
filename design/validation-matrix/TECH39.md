# TECH39 — güven ve politika bağlantılarında kanıt sınırı

o46 About benzeri kelimelerden sayfa güvenilirliği, o49 ise gövde içinde
privacy/terms geçmesinden politika varlığı sonucu çıkarabiliyordu. Her ikisi
N/A gözlem olarak daraltıldı; yokluğu da tek başına hata sayılmaz.

Gerçek HTML namespace a öğelerinin site içi bağlantıları içinden Türkçe/İngilizce
ad veya URL yolu eşleşmeleri aday olarak seçilir. Sorgu metni kullanılmaz;
roundabout gibi alt kelime eşleşmeleri dışlanır. Template/script/yabancı SVG
bağlantıları aday değildir. Harici hedefler mevcut iç bağlantı kapsamı dışındadır.

Her kaynak sayfa altında hedef ve bağlantı metni saklanır. HTTP durumu yalnızca
o kesin URL daha önce kontrol edilmişse eklenir; yeni ağ isteği yoktur.
Bir aday veya HTTP 200; içerik yeterliliği, güvenilirlik, hukuki uygunluk, SEO
sıralaması veya GEO görünürlüğü değildir. Tanıma dilinin sınırlı olması, aday
bulunmamasının hata olmayışı TR/EN arayüzünde açıklanır.

Kalibrasyon: inert/yabancı markup, gövde kelimeleri, sorgu dışlama, kelime sınırı,
Türkçe/encoded yol, desteklenmeyen adlandırma; API/Chromium'da kaynak sayfa,
aday hedef ve HTTP kanıtı. Üyelik/ödeme geliştirmesi yok.
İlk QA Türkçe "Koşulları" ekli biçiminin kaçırıldığını yakaladı; aday tanıma
düzeltildi. İlgili kalibrasyon ve yeniden tam QA 40/40 geçti, 159,3 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T15-03-45-222Z.json.
TECH36–39 yerel aday; aktif yayın TECH35. Önceki otomatik onay
denetimi reddi nedeniyle kaynak aktarımı yeniden denenmedi.
Birleşik paket: deployment-artifacts/povlex-20260914-tech39.tar.gz.
cutover-tech39.sh aktif TECH35'ten geçiş için hazırlandı; çalıştırılmadı.
