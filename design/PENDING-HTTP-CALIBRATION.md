# HTTP kontrolü — yerel geliştirme, 13 Eylül 2026

13 Eylül güncellemesi: Kullanıcının açık aktarım onayından sonra TECH12
parola korumalı pilotta yayımlandı. 39/39 QA ve yayındaki tarayıcı/erişim testleri
geçti. Gerçek koşu 60 sayfada üç 500 adresini doğruladı; t56 Fail ve puanlamaya
uygun sonuç verdi. Kanıt: `validation-tonguc/tech12-result.json`.

## Yeni ölçüm

t56 artık yalnızca keşfedilen adreslerde gözlenen HTTP yanıt durumunu ölçer.
Tarama ve bağlantı kontrolü tek adres kümesinde birleşir. 4xx/5xx gözlenen adres
başarısızdır; alınamayan yanıt veya tarama sınırı başarı sayılmaz. Hiç veri yoksa
başarı üretmez. Kapsam eksik ve hiç hata görülmemişse N/A kalır. Eksik kapsamda
gözlenen hata, yalnızca gözlenen adres için hata kanıtıdır. Sonraki başarılı istek
önceki hata gözlemini silmez. Aynı istek adresi iki kez sayılmaz.

Her satır istenen adresi, HTTP kodunu ve varsa son adresi saklar. Kontrol başlığı
ve eylem açıklaması soft 404, indekslenme ve bütün site sağlığı iddialarını dışlar.
Kalibre edilen kontroller listesine bu dar HTTP yöntemi eklendi; diğer tanısal
kontroller otomatik olarak puanlamaya açılmadı.

## Regresyonlar

`scripts/http-status-measurement.test.ts` kalibrasyon test zincirine bağlandı.
200, 404/500, boş kapsam, yanıt alınamaması, istek sınırı, yinelenen adres ve
aralıklı hata durumları kontrol edilir. Sayaç/inceleme gerekçesi testleri de
app-flow zincirindedir. Sunucuya geçişten sonra gerçek site taraması ve parola
kapısı yeniden doğrulanmalıdır.

Önceki arayüz değişiklikleri: [inceleme gerekçesi](PENDING-EVIDENCE-UX.md).
