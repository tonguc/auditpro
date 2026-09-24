# TECH31 — bağımsız HTTP başlangıç kontrolü

Analiz artık son taranan adresin kök HTTP adresini ayrıca kontrol eder.
Orijinal sayfa yolu ve sorgusu düz HTTP isteğine taşınmaz. Standart dışı portta
karşılık tahmin edilmez. Her yönlendirmede mevcut public-URL/DNS-pinning koruması
kullanılır; en fazla dört yönlendirme izlenir. İstekler kalan 5 saniyelik bütçeyi
paylaşır; DNS çözümlemesi ayrı olduğundan bu kesin toplam süre garantisi değildir.

Başarılı HTTPS hedefi ve izlenmiş zincir Pass; başarılı HTTP yanıtıyla bitiş Fail;
alan adı değişikliği veya HTTPS'ten HTTP'ye dönüş Partial/inceleme gerektirir.
Bağlantı hatası, 4xx/5xx, eksik zincir ve aşılan sınırlar N/A'dır, eksik
yönlendirme hatası olarak sunulmaz. pageResults yalnızca test edilen kök URL'yi
ve gözlenen zinciri içerir. Tüm yolların yönlendirmesi, HSTS veya sertifika
bitiş tarihi doğrulanmış sayılmaz. t29 toplam puanın dışında kalır.

Kalibrasyon: URL kapsamı, 301, HTTP 200, 503, zaman aşımı, özel portta sıfır
istek, alan değişimi, eksik zincir, downgrade. Gerçek API/Chromium matrisinde
kök URL, tek kanıt satırı, Pass/Fail/N/A ayrımı ve puan dışında kalma doğrulandı.
Matris: dört site türü + eksik kaynak, 10 sayfa, 50 viewport.

Yerel tam QA 40/40 geçti, 159,3 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T05-39-56-587Z.json.
Sunucuda app/worker 20260914-tech31 yayımlandı: TECH31_VERIFIED.
Üretim worker imajında internete kapalı kalibrasyon ve API/Chromium matrisi geçti.
Hosted TR/rapor/mobil ve apex/www parola/ödeme kapıları geçti.
Geri dönüş: pilot-images.before-tech31.yml. Önceki kayıtlar yeniden analiz edilmelidir.
