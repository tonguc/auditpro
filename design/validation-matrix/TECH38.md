# TECH38 — gerçek iletişim bağlantısı bildirimleri

o47 kaynak HTML içinde herhangi bir tel:/mailto: metnini bağlantı sayabiliyordu.
c26 regex'i de gerçek DOM bağlantısı olmayan içeriği yakalayabiliyordu.
parse5 ile HTML namespace içindeki a[href] öğeleri okunur; script/style/template/
noscript, yorum ve SVG a öğeleri dışlanır. Entity ve tırnaksız href desteklenir.

Telefon/e-posta hedefleri sayfa bazında tutulur; mailto subject/body ve fragment
kanıta taşınmaz. Boş hedef bildirim olarak kalır; geçerli numara/adres sayılmaz.
o47 ve c26 bütün taranan sayfalarda ayrı satırlarla raporlanır. Düz metin veya
JavaScript davranışları bağlantı diye uydurulmaz; bulunmaması site hatası sayılmaz.

N/A gözlem: CSS görünürlüğü, mobil kullanılabilirlik, numara/adres doğruluğu,
sahiplik, gerçek arama/e-posta gönderimi ve alternatif iletişim yolları test
edilmez. Bu kanıt güven, SEO sıralaması veya GEO görünürlüğü skoru değildir.
TR/EN başlık ve kontrol açıklamaları ölçülen kapsamla uyumlu hale getirildi.

Kalibrasyon: inert/foreign markup, düz metin, href dışında değer, tırnaksız ve
entity href, boş hedef, mailto sorgusunu ayırma; iki sayfalı URL kanıtı.
API/Chromium matrisi ana sayfa bağlantısı ile bağlantısız alt sayfayı ayırır.
Tam QA 40/40 geçti, 141,4 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T14-42-55-677Z.json.
TECH36–38 yerel aday; aktif yayın TECH35. Önceki aktarım reddi
sonrasında SCP yeniden denenmedi. Üyelik/ödeme geliştirmesi yok.
Birleşik hazır paket: deployment-artifacts/povlex-20260914-tech38.tar.gz.
cutover-tech38.sh aktif TECH35'ten geçiş için hazırlandı; çalıştırılmadı.
