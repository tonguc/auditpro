# TECH52 — viewport görsel yükleme kanıtı

`t22` artık yalnız kaynak HTML'deki `loading` niteliğini saymaz. Her örnek
sayfa ve beş viewport için görünür görsel sayısı, görünür lazy görseller ve
görsel kaynağının o tarayıcı koşusundaki Performance Resource kaydıyla eşleşmesi
saklanır. Bu, ekran konumu ve kaynak gözlemini açıklar.

Sonuç yine puan dışı `N/A` gözlemdir. Lazy niteliği veya bir kaynak eşleşmesi,
uygun yükleme stratejisi, decode zamanı, öncelik, aktarılan byte, LCP ya da CLS
başarısı/başarısızlığı değildir. Eksik kaynak veya eksik viewport koşusu başarı
iddiasına dönüştürülemez.

Yerel yayın kapısı 40/40 geçti:
`launch-readiness-reports/launch-readiness-2026-09-16T15-37-05-561Z.json`
(172,8 saniye). OVH yedeği sonrası app/worker `20260916-tech52` olarak
yayımlandı. İki alan adında parola ve ödeme kapıları geçti; app sağlıklı,
worker çalışıyor. Geri dönüş kaydı `pilot-images.before-tech52.yml` (TECH51).
