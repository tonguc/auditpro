# TECH25 — teknik kanıtların API doğrulaması

14 Eylül 2026. Mevcut site-api-matrix testi genişletildi. Gerçek API ve Chromium
yolu korunur; tüm ağ yanıtları test içinde sabittir, native fetch kullanılmaz.

Yeni kontroller:

- Her sayfa için üç bot kararı: genel Disallow altında Googlebot/Perplexitybot
  engelli, kendine ait Allow grubundaki OAI-SearchBot izinli olarak raporlanır.
- Robots HTTP 503 durumunda tüm kararlar belirsizdir; izin/hata puanı uydurulmaz.
- Aynı sitede noindex bildirimi olmayan sayfa ile HTML noindex olan sayfa ayrılır.
  HTTP max-image-preview: none bildirimi noindex diye yorumlanmaz.
- Canonical 301 → 404 zinciri kaynak URL, yönlendirme adımı ve son HTTP durumu
  ile korunur. Diğer örneklerde text/plain hedef, noindex hedef ve kaynak sayfaya
  dönen canonical bildirimi ayrı doğrulanır. Bildirim yokluğu hata sayılmaz.
- Robots, indeksleme ve canonical tanısal kanıtları yayınlanan puana girmez.

Bu ek kontroller mevcut 10 sayfa/50 viewport koşusunun içinde çalışır; yeni
tarayıcı koşusu gerektirmez. 30 sayfa sonucu beklentisine teknik kanıt
beklentileri eklenmiştir; 30 sayısı bütün assertion sayısı değildir.

Bu paket ölçüm davranışında hata bulup düzeltmiş gibi sunulmamalıdır: yeni
senaryolar mevcut davranışta geçti. Değişiklik, teknik kanıt zincirini kalıcı
regresyon kontrolüne almaktır. Gerçek bot erişimi, Google'ın seçtiği canonical,
indeksleme niyeti veya tüm sitelerde doğruluk kanıtlanmış değildir.

Yerel QA: 40/40 geçti, 137,7 saniye.
Rapor: launch-readiness-2026-09-13T21-50-51-746Z.json.
Yeni teknik beklentiler beş senaryonun tamamında geçti; bu sonuçlar
site-api-matrix.json dosyasında kapsamlarıyla kaydedilir.

Yayın doğrulandı: 20260914-tech25 app/worker. Yeni matris aynı worker imajında
Docker --network none ile geçti. Hosted Türkçe/schema/öğe detayları, mobil
taşma, apex/www parola engelleri ve kapalı ödeme uçları doğrulandı.
Rollback: pilot-images.before-tech25.yml. Ücretli servis veya veritabanı değişmedi.
