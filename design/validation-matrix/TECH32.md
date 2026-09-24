# TECH32 — tarama sürelerini performans hükmünden ayırma

t24 tek son-istek süresini 800/1800 ms eşikleriyle Pass/Partial/Fail yapıyordu.
t64 tekil sürelerin oranından şablonlar arası tutarlılık kararı çıkarıyordu.
Bu iki yöntem gerçek tarayıcı TTFB, tam sayfa yükleme veya saha Core Web Vitals
ölçümü değildir. Puan dışında olmaları kesin tanısal hükmü haklı çıkarmıyordu.

Artık süreler N/A gözlem olarak saklanır. Her satır ilgili URL ve süreyi içerir.
t64 geçerli sürelerin aralığını ve ölçümü olan sayfa sayısını gösterir; şablon
sınıflandırması ve tekrar yapılmadığını belirtir. Geçersiz/negatif süreler
"unavailable" olur, başarılı veya yavaş sayılmaz. TR/EN başlıklar kapsamı belirtir.

fetchPublic süresi monotonik performance.now ile tutulur. DNS çözümlemesinden
sonra final fetch başlangıcından yanıt başlıkları hazır olana kadardır; önceki
yönlendirmeler ve gövde indirme dahil değildir. Yeni ağ çağrısı veya ücret yok.

Testler: 0/799/800/1800/9000 ms, NaN/Infinity/negatif süre, iki sayfa arasında büyük
fark ve URL kanıtı. Gerçek API/Chromium matrisinde iki kontrolün URL/süre/N/A
satırları ve puan dışında kalması doğrulanır. Tek ölçümden genel hız hükmü yoktur.

Yerel QA 40/40 geçti, 131,4 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T09-27-01-106Z.json.
Üretim worker kalibrasyonu ve internete kapalı API/Chromium matrisi geçti.
App/worker 20260914-tech32 yayımlandı: TECH32_VERIFIED.
Hosted TR/rapor/mobil ve apex/www parola/ödeme kapıları geçti.
Geri dönüş: pilot-images.before-tech32.yml. Eski analizler yeniden çalıştırılmalıdır.
