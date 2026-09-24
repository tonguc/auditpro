# Gerçek domain doğrulaması — 11 Eylül 2026

## Kapsam

example.com, www.python.org ve www.w3.org ana sayfaları gerçek analiz API fonksiyonuyla (pageLimit=1) incelendi. Her sitede beş ekran boyutu kullanıldı. Bağımsız kontrolde aynı sitelerin HTML'i Chromium DOM ayrıştırıcısıyla okundu; başlık, meta description ve HTML canonical bildirimleri karşılaştırıldı. Bu üç site bütün sektörleri, teknik hataları veya tüm sayfaları temsil etmez.

## Gerçek denemenin ortaya çıkardığı sorunlar

1. tsx çalıştırıcısının Playwright callback'lerine eklediği __name yardımcısı tarayıcıda yoktu. Önceki fixture bunu elle eklediği için hata yakalanmıyordu. Kurulum üretim tarayıcı akışına taşındı; fixture artık aynı kurulumu kullanıyor ve hatayı gizleyen ayrı müdahale kaldırıldı.
2. Eski tarayıcı ağı yalnız belge isteklerine izin veriyordu; harici CSS/JS/font ve resimler engelleniyordu. Bu, gerçek görünüm ölçümünü bozabilecek bir tasarım hatasıydı. Kaynaklar artık DNS sabitlenmiş public-URL denetimli aracıyla yükleniyor. Özel ağlar, kimlik bilgili URL'ler, desteklenmeyen protokoller ve yazma istekleri engelleniyor. Service worker ve websocket sınırları korunuyor.
3. Kaynak yüklemesi eksikse bütün tarayıcı puan kanıtları geçersiz sayılıyor. Uygulama kaynak hatasını sitenin SEO hatası diye puanlamıyor.

Kaynak sınırları: istek başına 15 saniye / 2,5 MB; ekran bağlamı başına 160 istek / 30 MB. Kaynak bütçesi, engellenmiş istek, HTTP hata veya ağ sorunu eksik ölçüm uyarısı üretir. Tarayıcıya cookie aktarılmaz; oturum açılmış kullanıcı görünümü ölçülmez. Görünüm anlık örnektir; bütün dinamik durumların doğrulanması değildir.

## Karşılaştırma

| Site | Bağımsız başlık | Meta açıklama | HTML canonical | Tekrar ölçümü |
|---|---|---|---|---|
| example.com | Example Domain | Yok; motor doğru saptadı | Yok; ceza verilmedi | 5 ekran tamamlandı; kaynak uyarısı yok |
| python.org | Welcome to Python.org | 52 karakter; varlık doğru saptandı | Yok; ceza verilmedi | 5 ekran tamamlandı; eksik kaynak nedeniyle tarayıcı puanı kapalı |
| w3.org | W3C | 184 karakter; varlık doğru saptandı | Yok; ceza verilmedi | 5 ekran tamamlandı; kaynak uyarısı yok |

Python.org HTML'inde beş H1 bulundu. Kaldırılmış tek-H1 kuralı tekrar puana girmedi. Açıklama uzunluğu başarı kriteri olarak kullanılmadı. Python.org kontrast çıktısındaki ihlal ve belirsizlikler, kaynak yükleme sorunu varken doğrulanmış site kusuru olarak yorumlanmamalıdır. Tam erişilebilirlik, robots bot erişimi, sitemap kapsamı ve gerçek indeks durumu bu üç metadata karşılaştırmasıyla doğrulanmış sayılmaz.

## Kanıtlar ve tekrar

launch-readiness-reports/live/ altında her domain için ilk deneme (.baseline.json), düzeltme sonrası sonuç (.json) ve bağımsız DOM bulguları (.reference.json) saklandı.

Canlı kontrol: npx tsx scripts/live-measurement-check.ts
Bağımsız DOM kontrolü: npx tsx scripts/live-source-reference.ts
Bu komutlar internet erişimi gerektirir; olağan QA'nın sabit sonucu olarak kullanılmaz.

Ölçüm sözleşmesi 0.7.0 oldu. Canlı OVH siteye aktarım ve ücretli AI çağrısı yapılmadı. Genel puan eşiği değiştirilmedi.

## QA sonucu

39/39 adım geçti (100,5 saniye); derleme, tip kontrolü, CSS/JS yükleme ve engellenmiş yazma isteği regresyonları, ölçüm testleri ve yerel uygulama akışları dahil. Rapor: launch-readiness-reports/launch-readiness-2026-09-11T16-50-05-118Z.json. Ayrı PostgreSQL entegrasyonu yeniden çalıştırılmadı.

