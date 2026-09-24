# TECH43 — eksik ölçüm için genel bakış yönlendirmesi

14 Eylül 2026. Yerel aday; aktif yayın TECH35.

Genel bakış takip kartlarına eksik sayfa ölçümlerini tamamlama aksiyonu eklendi.
Yalnızca pageResults.measurementState=incomplete-coverage adresleri alınır;
scope.complete=false tek başına adres üretmez. Aynı adres tekrarlanmaz.
İlk uygun kontrolün adresleri gösterilir ve düğme o kontrolün kanıtını açar;
başka kontrollerdeki adresler o düğmenin altına birleştirilmez. Mevcut ilk üç
adres ve kalan sayı sunumu korunur. Kart eksik ölçümü site hatası saymaz.

Testler: açık sayfa kanıtı şartı, tekrar ayıklama, tam sayfaların dışlanması,
hedef kontrol/adres eşleşmesi; TR/EN genel bakış, 390px taşma ve kanıt düğmesi.
İlk QA mobilde gizlenen yan menü dil seçicisinde durdu; dil kontrolünden önce
masaüstü genişliğine dönülecek şekilde test düzeltildi. Tekrar tam QA 40/40 geçti
(140,6 sn): launch-readiness-reports/launch-readiness-2026-09-14T18-24-06-345Z.json.
TR/EN kart, mobil taşma ve doğru kanıta geçiş testleri geçti.
Birleşik paket deployment-artifacts/povlex-20260914-tech43.tar.gz;
cutover-tech43.sh TECH35'ten geçiş için hazır, çalıştırılmadı.
Skor veya tarama yöntemi değişmedi; ücretli API çağrısı yok.
Önceki aktarım reddi nedeniyle sunucuya aktarım/yayın yeniden denenmedi.
