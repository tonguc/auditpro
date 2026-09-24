# TECH26 — AI kaynak ve marka kanıtının doğruluğu

14 Eylül 2026, yöntem 0.2.0. Parola korumalı pilotta yayımlandı.

- Metindeki URL ile sağlayıcının kaynak metadatası ayrıldı. İlk grup atıf sayılmaz.
- Kaynak metadatası yoksa atıf oranı ve görünürlük endeksi null; sıfır uydurulmaz.
- Marka alt dizileri ve yanıltıcı alan adları marka görünürlüğü sayılmaz.
- Boş yanıt başarısızdır; dönen token kullanımı maliyet hesabında korunur.
- Diğer kaynak siteler yalnızca keşif sorularından hesaplanır; rakip oldukları iddia edilmez.
- Eski yöntemle kaydedilmiş sonuçlar yeniden ölçüm uyarısıyla gösterilir; yayın kapısı bunları kabul etmez.
- Arayüz eksik kaynak kanıtını ve doğrulanmamış yanıt bağlantılarını açıklar.

Yerel 40/40 QA geçti (136,1 saniye):
launch-readiness-reports/launch-readiness-2026-09-13T22-30-08-460Z.json.
Son küçük keşif-kaynak filtrelemesi ve etiket değişikliğinden sonra ilgili AI testi
ve üretim derlemesi tekrar geçti. Tam QA bu son iki küçük değişiklikten öncedir.

Sunucu imajı içindeki AI fixture testi Docker --network none ile geçti.
Buluta kaydedilip yeniden açılan örnekte eksik atıf kanıtı ve doğrulanmamış URL
tarayıcıda doğrulandı. Mevcut TR/schema/teknik detaylar ve mobil kontroller geçti.
Apex/www anonim ve yanlış parola erişimi engelli; doğru parola çalışıyor;
gerçek ödeme uçları kapalı. Cutover sonucu TECH26_VERIFIED.

App/worker: 20260914-tech26. Geri dönüş: pilot-images.before-tech26.yml.
Gerçek ücretli motor çağrısı yapılmadı. Sağlayıcı metadatası bağımsız kaynak
doğruluğu değildir; tüketici ChatGPT arayüzünün görünürlüğü ölçülmüş değildir.
