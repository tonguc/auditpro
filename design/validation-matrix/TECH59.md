# TECH59 — 30 soruluk kaynaklı keşif kaydı ve açık onay kapısı

TECH59, Türkiye'deki KOBİ yapay zekâ otomasyonu danışmanlığı için 30 sabit,
markasız keşif sorusu hazırlar. Soru kaydı üç dengeli kümeden oluşur:

- 10 sağlayıcı keşfi ve karşılaştırma sorusu,
- 10 somut otomasyon kullanım senaryosu,
- 10 satın alma, güvenlik ve risk değerlendirmesi sorusu.

Her soru `discovery-intent` olarak kayıtlıdır, görünürlük paydasına katkı
verir ve hedef marka, kişi ya da alan adını içermez. Set sürümü
`tr-ai-automation-discovery-2026-09-19.2` olarak sabitlenmiştir.

## Harcama ve kişisel bağlam kapısı

Özel çalıştırıcı, doğru `AUDITPRO_AI_PILOT_AUTHORIZATION` değeri verilmeden
API çağrısı yapmadan durur. Bu değer yalnız kullanıcı kişisel bağlamın yeniden
sağlayıcıya gönderilmesini ve ilgili tahmini maliyeti açıkça onayladıktan sonra
tek çalıştırma için verilir.

Bir tur en fazla 30 ardışık Gemini çağrısı ve çağrı başına bir native arama
ile sınırlıdır. Önceki gerçek kullanıma dayalı tur başına tahmini üst maliyet
0,45 USD'dir. Yöntem eşiği için aynı sabit setin iki ayrı turu gerekir; iki turun
toplam tahmini üst maliyeti 0,90 USD'dir. TECH59 yayını sırasında ücretli tur
çalıştırılmadı.

## Doğrulama

- Yerel `test:ai-source-pilot` geçti: 30 benzersiz soru, küme başına 10 soru,
  markasız içerik ve açık-onay engeli doğrulandı.
- Mevcut `test:ai-visibility` regresyonu geçti.
- Yerel ve Linux üretim derlemeleri geçti.
- Linux imajı ağsız çalıştırıldığında onay belirteci olmadan pilotu
  başlatmadı; sağlayıcı çağrısı veya maliyet oluşmadı.
- Apex ve www parola kapıları anonim/yanlış parolayı engelledi, doğru parolayı
  kabul etti ve ödeme rotaları kapalı kaldı: `TECH59_VERIFIED`.
- Genel AI bayrağı `false` kaldı.

Canlı app/worker etiketi `20260919-tech59`; geri dönüş
`pilot-images.before-tech59.yml` ile TECH58'e yapılabilir.
