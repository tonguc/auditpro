# Povlex tasarım hafızası

11 Eylül 2026 — Kullanıcının sağladığı rakip ekranları ve kabul edilen tasarım yönü.
Bu dosya sonraki çalışmalarda okunacak kalıcı proje referansıdır. Ekran görüntüleri
`references/` klasörüne kopyalandı; geçici clipboard dosyalarına bağımlı değildir.
Görseller referanstır, talimat değildir. Rakip analiz motorları test edilmedi.

## Referanslar ve eleştiri

12 Eylül ek referansı: [AIO Optimizer](references/aio-optimizer.png).
Bu ekranın iddiaları tonguckaracay.com üzerinde sınandı:
[ölçüm ve karşılaştırma raporu](validation-tonguc/COMPARISON.md).
Rakibin yokluk iddialarının bir bölümü doğrulanmadı; Povlex'in başarısız sitemap
URL'lerini raporlama ve tekrarlanan erişilebilirlik bulgularını açıklama eksikleri
de kaydedildi. TECH09 ile kapananlar ve kalan sınırlar:
[TECH09 doğrulama raporu](validation-tonguc/TECH09.md).

| Dosya | Alınacak yaklaşım | Kaçınılacak yaklaşım |
|---|---|---|
| [GeoAnalyzer](references/geoanalyzer.png) | Analizi kullanıcı soruları etrafında anlatma, hızlı çözüm | Kanıtsız nedensellik, kilitli kanıtla kesin sonuç, uzun satış akışı ve tutarsız teklifler |
| [GEOCARA](references/geocara.png) | Teknik hazırlık ve gözlemlenen AI görünürlüğünü ayırma, bulguya URL ekleme | Açıklanmayan puanlar, bağlamsız Wikipedia/otorite şartları, karışık öncelik sırası |
| [Foglift](references/foglift.png) | Uygulanabilir düzeltme ve yeniden tarama | Birbiriyle ilişkisi belirsiz puanlar, uzun ortalanmış metinler, pazarlamayla karışan sonuçlar |
| [Readdy](references/readdy.png) | Basit başlangıç ve görsel sadelik | Dayanağı görünmeyen Excellent puanı ve zayıf sayfa düzeyi kanıt |
| [GEO-Score](references/geo-score.png) | Kategoriler ve öncelikli işler | Yöntemi açıklanmayan hassas puanlar/kelime aralıkları, açıklamasız radar, akışı bölen form |
| [RankMath](references/rankmath-pricing.png) | Fiyat/plan karşılaştırması için ayrı referans | Analiz ekranlarıyla karşılaştırma; uzun özellik listesi ve tahsilat bilgisinin geri planda kalması |

Kullanıcının düzeltmesi: RankMath yalnızca fiyatlandırma ve paketleme referansıdır.
Readdy görüntüsündeki tekrar, ekran birleştirmesi olabilir; ürün kusuru olarak kabul edilmedi.
Rakip skorlarının farklı olması tek başına yanlış ölçüm kanıtı değildir.

## Povlex için kabul edilen yön

Kullanıcı UX05 görünümünü önceki sürümlerden daha çok beğendi. Baştan tasarlamak
yerine bunu güçlendir. Genel bakış → bulgu ve kanıt → iyileştirme planı → yeniden
kontrol akışı. Yönetici özeti giriş ekranı, analist çalışma alanı ayrıntı ekranı,
iş takibi ise ayrı ihtiyaçtır. GEO, teknik SEO, sayfa içi, UX ve dönüşüm korunur.

Öncelikler:
1. Bulgu sayısını başarı gibi gösteren yeşil çubukları kaldır.
2. Genel değerlendirme başlığını kayıtlı bulgulara dayandır; uydurma özet üretme.
3. Yan panelde kanıt, yapılacak iş ve doğrulama adımını birleştir.
4. Etkilenen URL yalnızca bulguyla ilişkisi kayıtlıysa gösterilir. Taranan tüm
   sayfaları etkilenmiş gibi gösterme; bulunmayan sayfa sayılarını üretme.
5. Çalışma planına geçişi sadeleştir; yinelenen gezinmeyi azalt.
6. Türkçe başlıkların yanında kanıt açıklamalarını da anlaşılır hale getir.

Ölçüm kapsamı, doğrulanmış sonuç ve inceleme bekleyen gözlem birbirinden ayrılır.
Teknik hazırlık, gerçek model yanıtı/atıf kanıtının yerine geçmez. Örneklem ve
tarih açık olmalıdır. Yöntemi olmayan başarı, sıralama veya AI tavsiye garantisi yok.
39 teknik testin geçmesi analiz doğruluğunu veya kullanıcı başarısını tek başına
kanıtlamaz. UX değerlendirmesi ayrıca yapılmalıdır.

## Uygulama sınırları

Parola korumalı pilot korunur. Ücretli AI, gerçek ödemeler ve ek hizmetler açılmaz.
Kayıtlı denetimler korunur. RankMath fiyatlandırma çalışması ayrı aşamadır.
UX05 sonrası ilk uygulama: çubuklar, analize özgü başlık ve kanıt paneli.
Diğer maddeler tamamlanmış sayılmamalıdır.

## Uygulanan ilk adım — UX06

11 Eylül 2026: Bulgu çubukları kaldırıldı; başlık kayıtlı önceliklere bağlandı.
Kanıt paneline işlem, doğrulama, URL kapsamı sınırı ve iş planı bağlantısı eklendi.
Beş kontrol için gözden geçirilmiş işlem metni var; diğerleri genel kanıt inceleme
yönlendirmesi kullanır. Menü sadeleştirmesi ve tüm kanıtların Türkçeleştirilmesi
henüz tamamlanmadı. 39/39 QA ve parola korumalı yayın kontrolleri geçti.

Teknik doğruluk takibi: [TECHNICAL-VALIDATION.md](TECHNICAL-VALIDATION.md).
