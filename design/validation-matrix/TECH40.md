# TECH40 — dış bağlantı bildirimi ve yanlış alarm düzeltmesi

14 Eylül 2026. Yerel aday; aktif yayın TECH35.

o44, target=_blank bağlantılarda açık noopener yokluğunu Partial, diğerlerini
Pass sayıyordu. Bu ölçüm noreferrer etkisini ve örtük _blank korumasını hesaba
katmıyor; alaka, güvenlik veya SEO sonucunu da doğrulamıyordu. Artık N/A ve
puan dışı kaynak gözlemidir. Bağlantı olmaması başarı sayılmaz.

Kaynak: https://html.spec.whatwg.org/multipage/links.html#link-type-noopener
ve #link-type-noreferrer (14 Eylül 2026).

parse5 üzerinden gerçek HTML a[href] öğeleri alınır. Template/script/style/
noscript ve yabancı namespace öğeleri dışlanır. İlk base href/target bildirimleri,
bağıl/protokol bağımsız URL, entity çözümü ve ASCII rel tokenları ele alınır.
Yalnızca sayfanın origin'i dışındaki HTTP(S) hedefleri kaydedilir; kimlik
bilgisi içeren hedefler dışlanır. Kaynak sayfa altında hedef URL, target ve
rel listesi gösterilir. HTTP isteği veya bağlantı tıklaması eklenmedi.

Bu envanter JavaScript ile değişen davranışı, gerçek pencere opener durumunu,
hedefin güvenliğini, içerik alakasını veya AI görünürlüğünü doğrulamaz.
Türkçe/İngilizce kontrol başlığı iddiayı kaynak bildirimleriyle sınırlar.

Regresyon: inert/foreign markup, base mirası ve boş target geçersiz kılması,
entity/protokol bağımsız hedef, rel tokenları ve noopener/noreferrer/opener
kombinasyonlarında yanlış hüküm verilmemesi. İki sayfada birleştirme ve gerçek
API/Chromium site matrisinde kaynak sayfa/hedef/rel kanıtı doğrulanır.

Tam QA 40/40 geçti (225,0 saniye). Rapor:
launch-readiness-reports/launch-readiness-2026-09-14T15-35-20-432Z.json.
Birleşik kaynak paketi deployment-artifacts/povlex-20260914-tech40.tar.gz;
cutover-tech40.sh aktif TECH35'ten geçiş için hazır, çalıştırılmadı.
TECH36–40 birleşik aday; önceki aktarım reddi
nedeniyle sunucuya kaynak aktarımı veya yayın yeniden denenmedi.
