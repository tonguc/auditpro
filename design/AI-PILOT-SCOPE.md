# AI pilot kapsamı ve maliyet sınırı

Kod incelemesi: 13 Eylül 2026, lib/ai-visibility.ts.

Plan tablosunda ücretsiz kullanım 0, Pro 10 soru × 1 motor, Agency/Enterprise
10 soru × 3 motor tanımlı. Aşağıdaki 30 yanıt hesabı üç motorlu kapsam içindir;
her hesapta otomatik olarak üç motor çalıştığı anlamına gelmez.

Mevcut soru şablonu en çok 10 sorudur: 2 marka yönlendirmeli kontrol ve 8
keşif sorusu. Üç motor seçilirse 30 yanıt istenir; görünürlük oranının
paydasına yalnızca başarılı keşif yanıtları girer (tam başarıda 24).
Bir tekrar turu uygulanıyor; eşzamanlılık 2. Yanıt başına çıkış sınırı
350 token, yeniden deneme sınırı 2. Dolayısıyla 30 başarılı çağrı için
en çok 10.500 normal çıkış tokenı hedeflenir; yeniden denemeler, sağlayıcı
ücretleri ve görünmeyen muhakeme tokenları bunu kesin fatura üst sınırı yapmaz.

Maliyet formülü, her motor için:
soru × tur × [(giriş tokenı × giriş $/milyon + çıkış tokenı × çıkış $/milyon)
/ 1.000.000 + varsa arama/istek ücreti]. Başarısız veya yeniden denenen
isteklerin ücretleri ayrıca hesaba katılmalıdır.

Bugün sabit dolar/domain veya 10 dolara domain adedi yayımlamak doğru değil:
aktif sağlayıcı fiyatları, web arama davranışı ve gerçek kullanım ölçülmedi.
TECH26 / yöntem 0.2.0 ile yanıt metnindeki URL kaynak sayılmıyor. Yalnızca
sağlayıcının kaynak metadatası sayılıyor; metadata yoksa atıf oranı belirsiz.
Bu metadata da kaynağın içeriğini veya doğruluğunu bağımsız kanıtlamaz. API yanıtları
tüketici ChatGPT/Gemini arayüzlerindeki sonuçlarla aynı ölçüm değildir.

Pilot karar: Bu akış yön gösteren deney olarak kalır, SEO puanına katılmaz.
Marka yönlendirmeli ve keşif soruları raporda ayrı tutulmalıdır. Genel sektör
şablonları yerine müşteri niyetleri ve hedef ülke/dil için sabit soru seti
kalibrasyonu gerekir. Kodun 30 soru × iki tur eşiği bir ürün politikasıdır;
bilimsel doğruluk garantisi değildir. Ücretli bağlantı ve maliyet onayı
olmadan gerçek motor çağrısı etkinleştirilmez.

14 Eylül bütçe yanıtı: en fazla 5 USD, yalnızca planlama sınırı; harcama onayı
değildir. Somut deney ve koşullar: AI-5USD-TEST-PLAN.md.
