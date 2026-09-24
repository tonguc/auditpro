# TECH28 — başlık ve meta açıklaması doğruluğu

Regex tabanlı title/meta okuma, template içindeki sahte başlığı Pass sayıyordu.
Yeni test değişiklikten önce actual Pass / expected Fail sonucu verdi.
lib/document-metadata.ts parse5 ile gerçek document head öğelerini okur.
Template, SVG title ve style/script metinleri belge başlığı sayılmaz.
HTML entity'leri çözülür; yalnızca boşluk olan değerler boş sayılır.
Nitelik içindeki apostrof ve > karakteri açıklamayı kesmez.
o4/o8 karşılaştırması eşdeğer entity yazımlarını aynı değer olarak görür.
API sayfa özeti de aynı okuyucuyu kullanır. Sayfa analizi içinde metadata bir
kez ayrıştırılır; sosyal/viewport metadata sorguları aynı sonucu kullanır.

Tam QA: 40/40, 124,0 saniye.
launch-readiness-reports/launch-readiness-2026-09-13T23-14-10-909Z.json.
Puan genişletilmedi. Metadata kalitesi veya Google snippet seçimi ölçülmedi.
Aynı sayfada çoklu bildirimleri ayrı raporlama halen açıktır (ilk bildirim okunur).

Yayın doğrulandı: app/worker 20260914-tech28, TECH28_VERIFIED.
Sunucu imajında ağsız kalibrasyon testi geçti. Hosted TR/rapor/mobil ve AI
kanıt gösterimi geçti; apex/www parola kapısı ve kapalı ödeme uçları doğrulandı.
Geri dönüş: pilot-images.before-tech28.yml. Eski kayıtlar yeniden analiz ister.
