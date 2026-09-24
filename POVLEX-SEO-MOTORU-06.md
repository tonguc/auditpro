# Povlex SEO motoru 0.6.0 — 11 Eylül 2026

## Sonuç

Robots.txt, canonical hedef ve görünür içerik karşılaştırması mevcut analize eklendi. Bu gözlemler tanısaldır; puana aday sayısı hâlâ 7 ve genel puan eşikleri değiştirilmedi. Önceki kanıtlar güncel sözleşme için yeniden ölçülmelidir.

## Robots.txt

Googlebot, OAI-SearchBot ve PerplexityBot için indirilen origin politikasında örnek sayfa yolları değerlendirilir. Aynı botun grupları birleştirilir; özel grup yıldız grubundan önce gelir. En uzun eşleşme ve eşitlikte Allow uygulanır; yorumlar, boş Disallow, yıldız ve sonlandırıcı desteklenir. Yol büyük/küçük harfe duyarlıdır. Eğitim botunun engellenmesi arama botuna genellenmez.

Kodlanmış/non-ASCII yollar, aşırı karmaşık örüntüler ve erişilemeyen robots yanıtları belirsizdir. Bu, tam RFC 9309/sağlayıcı davranışı simülasyonu değildir; gerçek bot IP/WAF erişimi veya indeks durumunu kanıtlamaz. Kötü amaçlı regex geri izleme riskini önlemek için joker eşleşmesi regex kullanmaz.

## Canonical hedefler

Önce zaten taranan sayfalar kullanılır. Analiz başına en fazla 5 ek hedef isteği yapılır; mevcut public-URL/DNS sabitleme ve redirect korumaları kullanılır. HTTP durumu, HTML olup olmaması, yönlendirme, uygulanabilir noindex/none ve başka canonical hedefi bildirmesi raporlanır. Erişim/limit sorunu başarı sayılmaz. İçerik eşdeğerliği ve Google'ın seçtiği canonical hâlâ doğrulanmış değildir.

## Görünür şema metni

Mevcut güvenli Chromium taramasındaki en fazla 3 sayfanın masaüstü görünümünden body.innerText ve JSON-LD blokları alınır. Organization/LocalBusiness adı-telefonu ve Question/Answer metinleri örneklenir. Gizli CSS içeriği bu görünür metne dahil olmaz. En fazla 100 benzersiz alan karşılaştırılır. Eşleşmeme; format, dil, kapalı akordeon veya dinamik içerik nedeniyle olabilir; otomatik hata/başarı puanı değildir. Şema özelliklerinin tüm gereklilikleri ve anlamsal doğruluk henüz değerlendirilmez.

## Testler

Önceki 41 senaryoya ek robots ve şema metni regresyonları; canonical için istek limiti, noindex, zincir, 404, public-URL engeli ve self-canonical önbellek testleri çalıştırılır. Gerçek tarayıcı fixture'ı görünür adın eşleştiğini ve display:none telefonun eşleşmediğini doğrular. Kalıcı launch:readiness akışına dahildir.

## Sınırlar

Bu çalışma yereldir. Canlı OVH aktarımı, gerçek domain karşılaştırması, ücretli AI çağrısı ve ayrı PostgreSQL entegrasyonu yapılmadı.

Dayanak: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec ve https://developers.google.com/search/docs/appearance/structured-data/sd-policies

## QA sonucu

39/39 yayın öncesi adım geçti (92,1 saniye). Derleme, tip kontrolü, ölçüm regresyonları ve gerçek yerel tarayıcı akışları dahil. Rapor: launch-readiness-reports/launch-readiness-2026-09-11T16-43-34-393Z.json.

