# Povlex SEO motoru 0.5.0 — 11 Eylül 2026

## Yapılan değişiklikler

- İndeksleme: gerçek HTML ayrıştırması, birden fazla meta etiketi, none ve HTTP başlığındaki bot kapsamı. Başka botun noindex kuralı Googlebot'a uygulanmıyor. Sonuç, gerçek indeks durumu veya yayıncının niyeti olarak sunulmuyor.
- Canonical: HTML ve HTTP Link başlığının karşılaştırılması, birden fazla hedefte çakışma, boş/geçersiz adres, base URL ve HTML entity çözümleme. Eksiklik veya başka domaine işaret etmek otomatik hata değil. Hedef sayfa ve içerik eşdeğerliği henüz doğrulanmıyor.
- Yapılandırılmış veri: JSON gerçekten ayrıştırılıyor; serbest metindeki tip adı yerine @type, dizi ve @graph inceleniyor. Bozuk JSON saptanıyor. Zorunlu özellikler, JSON-LD bağlam genişletme ve görünür içerikle uyum henüz kontrol edilmiyor; rich result garantisi verilmiyor.
- Sitemap: XML sözdizimi, kök ve namespace, loc alanları ve mutlak HTTP(S) URL kontrolü. Index ile sayfa listesi ayrılıyor. Robots.txt'den en fazla üç aynı-origin alternatif sitemap keşfediliyor; alt sitemap sayısı kök başına üç ile sınırlı. Dosya uzantısına bağlı keşif kaldırıldı.
- Kaynak gövdeleri 250.000 baytta sınırlı okunuyor; kesilmiş XML geçerli sitemap gibi analiz edilmiyor. DTD/entity genişletme yapılmıyor. Özel ağ korumaları mevcut sabitlenmiş DNS/redirect denetiminden geçmeye devam ediyor. Harici sitemap bildirimleri ve gzip sitemap dosyaları kapsam dışında.
- Tanısal bulguların notları API sonucuna ekleniyor; mevcut kanıt alanında okunabiliyor. Tanısal sonuçlar puanı etkilemiyor.
- Regex ile robots.txt içindeki herhangi bir slash'ı site genelinde engelleme diye niteleyen ifade kaldırıldı. Per-bot/per-path robots.txt değerlendirmesi sonraki iştir.

## Test ve ürün sınırı

26 yeni SEO senaryosu + önceki 15 kalibrasyon senaryosu geçti. Kalıcı QA akışına dahil. Puan aday sayısı 7 olarak korunuyor; daha ayrıntılı tanısal gözlem, otomatik olarak genel SEO başarısı anlamına gelmiyor. Eski kanıtlar için yeniden analiz gerekli (sözleşme 0.5.0).

Yeni bağımlılıklar: parse5 ve fast-xml-parser, tam sürümleri package.json/package-lock.json içinde sabit. Mevcut Sharp bağımlılığındaki bildirilen güvenlik açığı uyumlu güncellemeyle kapatıldı; npm audit --omit=dev: 0 bulgu.

Canlı OVH aktarımı, gerçek domain karşılaştırması, PostgreSQL entegrasyonunun yeniden çalıştırılması ve ücretli AI çağrısı bu aşamada yapılmadı.

## Kaynaklar

- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/crawling-indexing/canonicalization
- https://www.sitemaps.org/protocol.html
- https://parse5.js.org/functions/parse5.parse.html
- https://github.com/NaturalIntelligence/fast-xml-parser

## QA sonucu

39/39 adım geçti (118,2 saniye). 41 ölçüm senaryosu, derleme, tip kontrolü ve yerel tarayıcı akışları dahil. Rapor: launch-readiness-reports/launch-readiness-2026-09-11T16-17-32-720Z.json.

