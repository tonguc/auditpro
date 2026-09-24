# TECH30 — özet bulgudan etkilenen URL'ye erişim

Kullanıcı “Meta açıklaması eksik sayfalar” kartında hangi sayfanın etkilendiğini
göremiyordu. Overview priority-work kartı yalnızca başlık ve kanıt düğmesi
içeriyordu; URL listesi detay penceresindeydi.

Kart artık kayıtlı Fail/Partial pageResults üzerinden etkilenen adresleri
tekilleştirir, ilk üçünü doğrudan gösterir; kalan adet kanıt detayına yönlendirir.
Pass ve N/A adresler sorunlu diye listelenmez. URL kanıtı olmayan kayıtta yeniden
analiz gerektiği açıkça yazılır; not metninden URL tahmin edilmez.
Yalnızca HTTP(S), kullanıcı/parola içermeyen URL'ler bağlantı yapılır.
Uzun adresler mobilde satıra kırılır. TR/EN açıklamalar eklendi.

Testler: app-flow eski/eksik kayıt mesajını doğrular; hosted regresyon aynı
kayıtta bir eksik, bir başarılı ve bir belirsiz sayfadan yalnızca eksik sayfanın
özet kartında bağlantı olmasını doğrular.
Yerel tam QA 40/40 geçti, 129,7 saniye:
launch-readiness-reports/launch-readiness-2026-09-13T23-54-27-742Z.json.
Sunucu app/worker 20260914-tech30 yayını doğrulandı: TECH30_VERIFIED.
Derleme bağlantısı koptuktan sonra imajların tamamlandığı salt okunur doğrulandı;
cutover ancak bundan sonra yapıldı. Hosted eksik açıklama URL'si özet kartında
göründü; başarılı ve belirsiz URL'ler listede bulunmadı. TR/rapor/mobil/AI kanıtı
ve apex/www parola/ödeme kapıları geçti. Geri dönüş: pilot-images.before-tech30.yml.
