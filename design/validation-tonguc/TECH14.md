# Site haritası kapsamı — TECH14

13 Eylül 2026, parola korumalı pilotta yayımlandı.

Site haritası indeksleri artık ilk alt katmanla sınırlı kalmadan, döngüleri
engelleyen ve aynı adresi tekrar istemeyen bir keşif akışıyla izlenir. Aynı
kaynak alanının dışındaki haritalar, bozuk/desteklenmeyen XML, alınamayan yanıt
ve bütçe nedeniyle istenmeyen haritalar ayrı durumlarla saklanır.

En fazla 12 site haritası isteği ve 10.000 sayfa adresi sınırı vardır. Sayfa
adresi sınırına ulaşılırsa kayıt ayrıca işaretlenir. HTML analizi için mevcut
plan sınırı değişmez. Keşfedilen adres, başarıyla analiz edilmiş sayfa değildir.

## Doğrulama

İç içe indeks, döngü, tekrar, istek bütçesi, 500 yanıtı, geçersiz XML,
başka kaynak alanı, boş geçerli harita ve adres sınırı regresyonları geçti.
39/39 QA raporu: `launch-readiness-2026-09-13T14-04-54-090Z.json`.
Yayındaki tarayıcı testinde site haritası bütçe uyarısı, Türkçe/mobil akış ve
parola/ödeme korumaları doğrulandı.

[Gerçek koşu](tech14-result.json): sitemap.xml HTTP 200, 98 adres keşfi;
yönlendirmeler ve bağlantılardan keşifle 60 benzersiz sayfa analiz edildi.
Önceki üç HTTP 500 adresi, canonical hedefi ve erişilebilirlik kanıtı korundu.

Bu, tüm URL'lerin veya dil/konum/oturum varyantlarının keşfedildiği iddiası değildir.
Tarayıcı örneklemi hâlâ üç sayfadır. Yeni kapsam kanıtı için yeniden analiz gerekir.
