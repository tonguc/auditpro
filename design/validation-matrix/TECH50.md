# TECH50 — parola korumalı pilotta sınırsız aylık analiz

Test ortamında üyelik planının aylık sayfa kotası analizleri durduruyordu. Pilot
artık `AUDITPRO_PILOT_UNLIMITED_PAGES=true` olduğunda aylık sayfa kotasını uygulamaz.
Bu bayrak yalnız `AUDITPRO_DEPLOYMENT_MODE=pilot` ile çalışır. Public-test veya
production modunda aynı bayrak preflight hatası üretir.

Tek analizde 250 sayfalık mutlak güvenlik tavanı, arayüzdeki 5/25 sayfa seçimi,
iki eşzamanlı analiz sınırı, URL güvenliği, yetkilendirme ve hız sınırları korunur.
Üyelik, Stripe ve ücretli AI açılmadı.

Yerel yayın QA’sı 40/40 geçti:
`launch-readiness-2026-09-14T22-40-27-998Z.json` (190,9 saniye). Linux imajında
analiz işi politika testi ve yeni sunucu yedeği geçti. Canlıda yeni bir Free test
hesabı 25 sayfalık iş başlattı; Free planın beş sayfalık sınırına düşürülmedi.
Parola, yanlış parola, apex/www ve ödeme engelleri geçti: `TECH50_VERIFIED`.

Sahip hesabı TECH49’daki geçici Pro durumundan tekrar Free durumuna döndürüldü.
App sağlıklı, worker çalışıyor. Geri dönüş dosyaları `pilot-images.before-tech50.yml`,
`docker-compose.before-tech50.yml` ve sunucuya özel `.env.before-tech50` dosyasıdır.
