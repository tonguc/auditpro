# TECH47 — takip kartlarında diğer sayfaları kaybetmeme

14 Eylül 2026. Yerel aday; aktif TECH35.

Kaynak/kapsam takip kartı yalnızca ilk uygun kontrolü alıyordu. Daha sonraki
kontrollerdeki farklı adresler genel bakışta gösterilmiyordu. Artık her tür
için tüm kayıtlar incelenir; yeni adresler kendi kontrolüne bağlı kartta
gösterilir. Aynı türde aynı URL tekrar kart üretmez. Kaynak ve kapsam türleri
ayrı tutulur. Kartta kontrol adı TR/EN belirtilir; düğme o kontrolü açar.

Bu liste kontrol başına eksiksiz iş listesi değildir: aynı sayfa/tür için
ilk kayıt seçilir, diğer ölçümler kanıt detaylarında kalır. Yeni veya
belirsiz URL tahmini yapılmaz. Skor ve analiz yöntemleri değişmedi.

Regresyon: farklı kontrolün yeni URL'sini koruma, örtüşen adreslerde tekrar
önleme, hedef kontrol eşleşmesi. Tarayıcı akışında iki kapsam kartı ve her
birinden doğru kanıta geçiş; TR/EN ve mobil kart kontrolleri.
Tam QA 40/40 geçti (134,2 sn):
launch-readiness-reports/launch-readiness-2026-09-14T20-13-38-417Z.json.
Birleşik paket deployment-artifacts/povlex-20260914-tech47.tar.gz;
cutover-tech47.sh TECH35'ten geçiş için hazır, çalıştırılmadı.
Önceki aktarım reddi nedeniyle yayın yeniden denenmedi.
