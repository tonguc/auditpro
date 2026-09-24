# TECH24 — API ve Chromium doğruluk matrisi

14 Eylül 2026. Yeni test: npm run test:site-api-matrix.
Bu test yayın öncesi zorunlu QA listesine eklendi; toplam adım sayısı 40.

Dört kontrollü site türü: klinik, mağaza, yazılım ve yayın. Her türde sağlam ve
eksik başlık/meta açıklaması/isimsiz düğme içeren iki sayfa vardır. Ek senaryoda
bir sayfanın CSS kaynağı HTTP 404 verir. Toplam 10 sayfa, 50 gerçek Chromium
viewport ölçümü ve 30 açık sayfa sonucu beklentisi kontrol edilir.

Üretimde kullanılan POST /api/analyze fonksiyonu, HTML tarayıcısı, kaynak
yönlendirmesi ve Chromium ölçümü birlikte çalışır. Global fetch yalnızca bu
test sürecinde sabit yanıtlarla değiştirilir; bilinmeyen hedefe düşüş veya
native fetch çağrısı yoktur. Public IP literal DNS ihtiyacını kaldırır.
Üretim koduna özel test erişimi, SSRF istisnası veya ağ geçidi eklenmedi.

Kontroller: doğru kaynak URL'sine Pass/Fail atanması; tek meta açıklamasından
benzersizlik başarısı uydurulmaması; JSON-LD bloklarının kaynak sayfaya bağlı
kalması; bozuk JSON'un ilgisiz tür hatası üretmemesi; yüklenemeyen CSS varken
tarayıcı ölçümünün N/A/puan dışı kalması ve sağlam sayfa kanıtının korunması.

Bu paket yeni bir SEO puanlama kuralı veya ekran tasarımı eklemez. Mevcut davranışı
sürekli doğrulama altına alır. 30 beklentinin geçmesi saha doğruluğunun %100 olduğu
anlamına gelmez; canlı DNS/TLS taşıması, veritabanına kayıt, müşteri raporu okuma
başarısı ve tüm SEO yöntemlerinin kalibrasyonu bu matrisin kapsamı değildir.
Canlı giriş ve arayüz ayrı hosted test ile kontrol edilir.

Yerel doğrulama: 40/40 geçti, 118,6 saniye.
QA raporu: launch-readiness-2026-09-13T21-36-08-276Z.json.
Test listesi/dokümantasyon tutarlılık testi de geçti. İlk çalışmada tek dolu
meta açıklaması için beklenen API durumu undefined yerine N/A olarak düzeltildi;
bu bir test beklentisi düzeltmesidir, uygulama hatası olarak sayılmadı.
Makine okunur sonuçlar: site-api-matrix.json.

Yayın: App/worker 20260914-tech24, parola korumalı povlex.com üzerinde doğrulandı.
Aynı matris üretim worker imajında --network none ile de geçti. Hosted schema,
Türkçe bulgu/öğe detayları, mobil taşma ve apex/www parola/ödeme engelleri geçti.
Rollback: pilot-images.before-tech24.yml. Veri tabanı veya ücretli API değişmedi.

## 17 Eylül 2026 genişletmesi — yöntem sınırı

Dört site türü ve kaynak-hatası kontrolü yeniden çalıştırıldı. API yanıtındaki
42 puan-dışı gözlemin tamamı, her profil için `scoreEligible: false` kaldı;
sonuç puanı yalnız `CALIBRATED_CONTROLS` içindeki dar yöntemlerden geldi.
Bu koruma, site türü sınıflaması yüzünden tanısal bir bulgunun puana sızmasını
engeller. Makine çıktısı `site-api-matrix.json` içinde
`uncalibratedObservationCount: 42` ile kayıtlıdır. Koşu: 10 sayfa, 50 gerçek
Chromium viewport ölçümü ve kaynak-hatası senaryosu geçti.
