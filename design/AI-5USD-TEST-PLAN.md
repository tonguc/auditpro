# Gerçek AI deneyi — güncel toplam sınır 10 USD

Son kullanıcı güncellemesi: "10 dolar da öderiz sorun değil". Ortak ödeme
noktası önceliklidir; toplam bütçe 10 USD olarak yükseltildi. Aşağıdaki 5 USD
ifadeleri önceki planın tarihsel sınırıdır. 10 USD krediye ek işlem ücreti
toplamı aşabileceğinden satın alma ekranında kredi ve toplam ayrı değerlendirilir.
Bu turda satın alma veya ücretli çağrı yapılmadı.

14 Eylül 2026. Kullanıcının yanıtı planlama içindir; harcama onayı değildir.
Bu belgeyle hiçbir kredi satın alınmadı, ücretli çağrı veya otomatik yükleme açılmadı.

## Güncel satın alma tercihi — kullanıcı düzeltmesi

Kullanıcı birden fazla AI sağlayıcısını tek bakiye ve tek ödeme noktasından
kullanmak istiyor. Doğrudan Perplexity hesabı açtırmak hedef çözüm değildir.
Vercel hesabındaki Pro engeli nedeniyle Vercel satın alma yolu dışarıda kalır.
Öncelikli aday OpenRouter; Cloudflare Unified Billing alternatifidir.
OpenRouter minimum 5 USD kredi ve %5,5 (en az 0,80 USD) satın alma ücretiyle
karttan en az 5,80 USD gerektirir (varsa vergi hariç). Mevcut toplam 5 USD
yetkisini aşar; kullanıcı sınırı değiştirmedikçe satın alınamaz.
Cloudflare %5 yükleme ücreti uygular; gereken modellerin Unified Billing
kapsamı ve minimum yükleme tutarı ödeme öncesi ayrıca doğrulanmalıdır.
Kaynaklar: https://openrouter.ai/terms ; https://openrouter.ai/docs/faq ;
https://developers.cloudflare.com/ai-gateway/features/unified-billing/
Aşağıdaki tek motor deneyi ölçüm kapsamıdır, ayrı ödeme hesabı zorunluluğu değildir.

## İlk deney

Hedef: tonguckaracay.com, Türkiye, Türkçe. Yalnızca herkese açık içerik.
Bir motor: Perplexity Sonar; 10 sabit soru × 2 bağımsız tur = en fazla 20 çağrı.
İlk soru aynı zamanda kaynak metadata ve faturalama kontrolüdür; ayrı ek çağrı yok.
İlk yanıtta kaynak verisi veya kullanım kaydı yoksa kalan 19 çağrı durur.
Marka yönlendirmeli iki soru görünürlük paydasından çıkarılır: tam başarıda
16 keşif yanıtı bulunur. Bu küçük örnek bir ürün doğrulama deneyidir, pazar
görünürlüğü için güvenilir genel yüzde ya da üç motor karşılaştırması değildir.

Sabit sorular:

1. Tonguç Karacay hangi hizmetleri sunuyor? (marka kontrolü)
2. tonguckaracay.com kimlere yönelik hizmet veriyor? (marka kontrolü)
3. Türkiye'de KOBİ için yapay zekâ otomasyonu danışmanı olarak kimleri değerlendirebilirim?
4. Türkiye'de müşteri hizmetlerini yapay zekâyla geliştirmek için hangi danışmanlarla çalışabilirim?
5. Türkiye'de satış süreçlerini otomatikleştiren danışman veya ajans önerir misin?
6. Türkiye'de bir işletmeye yapay zekâ yol haritası hazırlayan uzmanlar kimler?
7. Türkiye'de küçük bir ekibin iş akışlarını otomatikleştirmek için hizmet sağlayıcı önerir misin?
8. Türkiye'de şirketlere yapay zekâ eğitimi ve uygulama desteğini birlikte sunan kimler var?
9. Türkiye'de özel yapay zekâ asistanı geliştirmek için hangi hizmet sağlayıcıları karşılaştırmalıyım?
10. Türkiye'de yapay zekâ danışmanlığı sağlayıcısı seçerken hangi firmaları veya uzmanları incelemeliyim?

Bu soru seti test hipotezidir; hedef sitedeki güncel hizmetlerle eşleşmesi koşu
öncesi okunarak doğrulanır. Marka kontrolü dışında hedef marka sistem mesajına
verilmez. Aynı sorular ikinci turda değiştirilmez; ülke hedefi soruda belirtilir,
gerçek Türkiye kullanıcı konumunun simüle edildiği iddia edilmez.

## Fiyat ve durdurma

Resmî Sonar fiyatı: giriş/çıkış ayrı ayrı 1 USD/milyon token; istek ücreti
arama bağlamına göre 0,005 / 0,008 / 0,012 USD. Örnek olarak çağrı başına
1.000 giriş + 350 çıkış tokenıyla 20 çağrı 0,127–0,267 USD eder.
Bu bir hesaplama varsayımıdır; gerçek tokenlar ve aracı hizmetin tahsilatı
ölçülmeden kesin fiyat veya 5 USD ile domain sayısı vaat edilmez.
Kaynak: https://docs.perplexity.ai/docs/getting-started/pricing

Gateway'nin 14 Eylül herkese açık model kataloğunda perplexity/sonar mevcut,
ancak pricing alanı boştu. Bu nedenle doğrudan sağlayıcı fiyatı Gateway için
doğrulanmış son fatura fiyatı gibi sunulamaz.
Katalog: https://ai-gateway.vercel.sh/v1/models

Koşu için gereken korumalar: eşzamanlılık 1, yeniden deneme 0, maksimum 20 çağrı,
350 çıkış tokenı; otomatik motor/sağlayıcı değişimi yok. Her yanıt sonrası
kullanım ve bakiye kontrolü. Operasyonel durdurma eşiği 1 USD; toplam kullanıcı
sınırı vergiler/işlem ücreti dahil 5 USD. Sağlayıcı tarafında uygulanabilir
harcama sınırı/bakiye doğrulanmadan yalnızca tahminle koşu başlatılmaz.
Bu deney ayarları mevcut normal tarama ayarlarına henüz uygulanmış değildir.

Kullanıcı düzeltmesi: Vercel hesabında kredi alımı Pro yükseltmesi istiyor.
Vercel kredi satın alma yolu bu deneyden çıkarıldı; kullanıcıyı yeniden aynı
ekrana yönlendirmeyin. Alternatif ilk yol doğrudan Perplexity API Console.
Resmî yardım sayfası API için Pro aboneliği gerekmediğini doğruluyor.
Yol: https://console.perplexity.ai → Billing → Buy more credits.
Minimum yükleme ve vergi dahil toplam tutar belgede belirtilmiyor; ödeme
ekranında doğrulanmadan 5 USD ile satın alınabileceği vaat edilmez.
Automatic Top Up kapalı kalır. Satın alma ve ücretli çağrı için onay yok.
Kaynak: https://www.perplexity.ai/help-center/en/articles/10354847-api-payment-and-billing
Mevcut uygulama Gateway kullanıyor; doğrudan Perplexity bağlantısı henüz
uygulanmadı. Kredi almak tek başına bağlantıyı değiştirmez; entegrasyon ve
ilgili testler ayrıca tamamlanmalıdır.

## Kabul ölçütleri

Her yanıt için soru/tur/model/zaman, ham yanıt, sağlayıcı kaynakları, marka
eşleşmesi, hatalar ve kullanım kaydı saklanır. Kaynak URL'leri okunarak hedef
markayı gerçekten destekleyip desteklemediği karşılaştırılır; erişilemeyen
kaynak belirsiz kalır. Elle etiketlenen sonuç ile Povlex sonucu farkları
tek tek raporlanır. İki turdaki değişim ve gerçek toplam/domain maliyeti yazılır.
Sıfır marka görünürlüğü teknik hata değildir. Kaynaksız yanıt sıfır atıf diye
sunulmaz. Sonuçlar SEO puanına katılmaz; parola koruması sürer.

Sonraki karar: Bu deney güvenilir ve ekonomik çıkarsa diğer iki motorun
arama araçları ve fiyatları ayrıca doğrulanır. Mevcut sıradan metin çağrılarını
ChatGPT/Gemini canlı arama görünürlüğü olarak pazarlamayız.
