# TECH58 — Kaynak annotation kalibrasyonu

Özel Gemini kalibrasyonu yalnız iki sabit keşif sorusu çalıştırır. İstek başına
OpenRouter native web search en fazla birdir; genel AI özelliği kapalıyken çalışan
bu betik kullanıcı arayüzünden çağrılamaz.

19 Eylül 2026 sonucu: 2/2 yanıt tamamlandı; sağlayıcı kaynak metadatası her iki
yanıtta da geldi (sırasıyla 3 ve 2 URL). Hedef alan adı kaynaklarda yoktu; marka
geçişi 0/2, hedef-alıntı oranı 0/2 oldu. İki soru yalnız teknik entegrasyon
kalibrasyonudur; yayınlanabilir skor, görünmezlik veya rakip hükmü değildir.

Linux üretim imajı ile apex/www parola ve ödeme kapıları geçti
(`TECH58_VERIFIED`). Genel AI bayrağı `false` kaldı.

## Kaynaklı keşif pilotu — 19 Eylül 2026

Kullanıcının açık onayıyla, hedef kişinin adı, alan adı ve danışmanlık bağlamı
OpenRouter üzerinden tek Gemini motoruna gönderildi. On sabit, marka adı içermeyen
Türkçe keşif sorusu; çağrı başına en fazla bir native arama ile sırayla çalıştı.
10/10 yanıt tamamlandı (822 giriş, 3460 çıkış tokeni), 30 sağlayıcı kaynak URL'si
geldi; hedef alan adına yönelik alıntı 0/10 ve keşif geçişi 0/10 oldu. Bu kaynaklı
ölçümdür; ancak tek motorlu, tek turlu örnek olduğu için yayınlanabilir skor veya
kesin görünmezlik hükmü değildir. Genel AI bayrağı `false` kaldı.

## Kaynaklı keşif pilotu, ikinci ayrı tur — 19 Eylül 2026

Kullanıcı, kişisel bağlamın yeniden OpenRouter'a gönderilmesini ve yaklaşık
0,15 USD kullanımı açıkça onayladı. Aynı 10 sabit soru, aynı Gemini modeli ve
çağrı başına en fazla bir native arama ile ikinci bağımsız turda sırayla
çalıştı. Tur 10/10 tamamlandı (812 giriş, 3460 çıkış tokeni). Marka geçişi
0/10 ve hedef alan adı alıntısı 0/10 kaldı.

Sağlayıcı kaynak metadatası 9/10 yanıtta vardı; toplam 16 benzersiz kaynak URL'si
döndü. İkinci soruda kaynak metadatası gelmediği için tur düzeyinde atıf oranı ve
görünürlük endeksi hesaplanmadı. İki turun birleşik betimsel sonucu: 20/20
tamamlanan yanıt, 0/20 marka geçişi, 0/20 hedef alıntısı, 46 kaynak URL'si ve
19/20 kaynak metadatası bulunan yanıt. Sabit set yalnız 10 sorudan ve tek motordan
oluştuğu için bu sonuç yine yayınlanabilir skor, kesin görünmezlik veya rakip
hükmü değildir.

Ham ikinci tur raporu sunucuda erişimi sınırlı
`qa-private/openrouter-ai-source-pilot-round2.json` dosyasında tutulur. Genel AI
bayrağı `false` kaldı; app, worker, Caddy ve veritabanı turdan sonra çalışır
durumda doğrulandı. İki sıfır-token entegrasyon reddi ayrı hata kanıtı olarak
saklandı ve ölçüm turuna dahil edilmedi.

## Harici içerik yayını — 21 Eylül 2026

`tonguckaracay.com` CLM-008 ikinci dalgası `2bbb1cb` ile Vercel üretimine
yayınlandı. E-ticaret ürün açıklaması ve Instagram Reels konularındaki dört
TR/EN URL, kaynaksız performans ve müşteri sonucu iddialarından arındırıldı;
tarihli kaynak, insan onayı ve kontrollü ölçüm akışları eklendi. Canlı sekiz
masaüstü/mobil kontrol geçti. Bu yayın yeni bir OpenRouter ölçümü değildir ve
önceki tek motorlu iki turun sonuçlarını değiştirmez; yeni karşılaştırmalı ölçüm
için yine açık kullanıcı onayı gerekir. Genel AI bayrağı `false`, Povlex sürümü
TECH67 ve kurtarmanın sırası değişmeden kaldı. Ücretli model çağrısı yapılmadı.
