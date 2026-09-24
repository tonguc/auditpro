# HTML dil/hreflang ve sitemap kapsamı — TECH21

HTML dil bildirimi parse5 ile gerçek html öğesinden okunur. Head içindeki
alternate/hreflang bildirimleri dil/hedef çiftleri olarak saklanır; template,
script ve body içindeki bildirimler bu kanıta katılmaz. Mutlak HTTP(S) olmayan,
kimlik bilgisi veya fragment içeren hedefler işaretlenir. Aynı dilin farklı
hedeflere işaret etmesi görünürdür.

Yalnızca zaten taranan hedef HTML'sinde kaynak sayfaya dönüş bağlantısı aranır.
Taranmayan hedef unknown kalır, başarısız sayılmaz. Hedef HTML'de dönüş olmaması
HTTP veya sitemap bildiriminin de olmadığı anlamına gelmez. Ek istek/AI harcaması
yapılmaz. Dil kodunun ISO geçerliliği, bütün dil kümesinin tutarlılığı, içerik
dili, çeviri eşdeğerliği ve HTTP/sitemap hreflang henüz doğrulanmaz. t53 puan
dışıdır; hreflang yokluğu otomatik site hatası değildir.

Sitemap başına farklı origin nedeniyle crawl dışında kalan URL sayısı gösterilir.
Bu farklı origin adreslerinin yanlış olduğu iddiası değildir; crawler kapsamıdır.

Kaynak: https://developers.google.com/search/docs/specialty/international/localized-versions
(13 Eylül 2026 incelendi). HTML/HTTP/sitemap eşdeğer bildirim yollarıdır;
hreflang URL'leri tam adres olmalı, karşılıklı bildirim gereklidir.

Regresyonlar: örneklemde karşılıklı bağlantı, taranmayan hedef, eksik HTML dönüşü,
çakışan dil hedefleri, relative adres, inert template, boş bildirim ve sitemap
origin dışı kapsam sayısı.

QA: 39/39 geçti; launch-readiness-2026-09-13T20-11-40-205Z.json. Yayın doğrulaması geçti.

13 Eylül 2026 TECH21 parola korumalı yayında. Gerçek tarama tech21-result.json: 60 sayfa dil kaydı, 163 HTML hreflang bildirimi; t53 puan dışı. 68.6 saniye tek koşudur. Hosted hreflang örneklem belirsizliği, Türkçe/mobil ve apex/www parola/ödeme engelleri geçti. App/worker 20260913-tech21; rollback pilot-images.before-tech21.yml. Yeni kanıtlar için tekrar analiz gerekir.
