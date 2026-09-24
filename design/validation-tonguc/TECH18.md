# Noindex kanıtı ve yanlış alarm düzeltmesi — TECH18

`max-image-preview: none` parametre değeri, boşlukla yazıldığında eski token
ayrıştırıcısında bağımsız `none` yönergesi gibi yorumlanabiliyordu. Parametre
değerleri artık noindex/none taramasına katılmıyor. Virgülle ayrılan gerçek
noindex/none, birleşik kısıtlamalar ve bot kapsamı korunuyor. Bot parametresinin
büyük/küçük harf farkı normalize ediliyor.

API t4 kanıtı, her taranmış sayfa için Googlebot'a uygulanabilir HTML meta ve
X-Robots-Tag yönergelerini saklar; detay ekranında kaynak ve değer gösterilir.
Bu, ham HTML/HTTP ölçümüdür; JS değişiklikleri, robots erişimi, gerçek indeksleme
ve sayfanın indekslenme niyeti kanıtlanmaz. Noindex varlığı otomatik site hatası
olarak puanlanmaz; t4 hâlâ puan dışıdır. Kalibre kontrol sayısı 8 kalır.

Kaynak: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
(13 Eylül 2026 incelendi). `none` noindex/nofollow birleşimidir;
`max-image-preview: none` ise görsel önizleme parametresidir.

Regresyonlar: HTML/HTTP parametre değerleri, gerçek noindex ile bir arada kullanım,
HTML/HTTP kaynak ayrımı, bot harf farkı; mevcut scope ve inert metadata testleri.
Robots.txt tam eşleştirme kalibrasyonu bu sürümde tamamlanmış sayılmaz.


## Yayın ve doğrulama
13 Eylül 2026 TECH18 parola korumalı yayında. 39/39 QA geçti: launch-readiness-2026-09-13T18-53-29-832Z.json.
Gerçek tarama tech18-result.json: 60 HTML sayfası, 60 indeksleme kanıtı; uygulanabilir noindex 0. Bu indekslenme garantisi değildir; t4 puan dışıdır. 5 tarayıcı sayfası/25 ölçüm, 69.6 saniye (tek koşu). Önceki 3 HTTP 500 korundu.
Yayındaki indeksleme detay fixture'ı, Türkçe/mobil ve apex/www parola/ödeme kontrolleri geçti. App/worker 20260913-tech18; rollback pilot-images.before-tech18.yml. Yeni veriler için tekrar analiz gerekir.
