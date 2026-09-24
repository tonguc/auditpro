# Canonical hedef kanıtı — TECH13

13 Eylül 2026, parola korumalı pilotta yayımlandı.

Her sayfa için bildirilen canonical, hedefin son yanıt adresi, HTTP durumu ve
inceleme durumu yapılandırılmış olarak saklanır. HTTP hatası, yanıt alınamaması,
istek sınırı ve HTML dışı hedef ayrı gösterilir. Googlebot'a uygulanabilen
noindex/none ve hedefteki farklı canonical zinciri ayrıca belirtilir.

Başka sayfayı hedeflemek otomatik hata değildir; başarılı HTTP yanıtı içerik
eşdeğerliğini veya Google'ın seçimini kanıtlamaz. Eksik canonical tek başına
hata sayılmaz. Bu geliştirme t5'i genel puanlamaya açmaz.

39/39 QA, hedef hatası/yanıtsızlık/PDF/eksik bildirim/yönlendirme/bütçe ve
noindex/zincir regresyonları geçti. Yayındaki tarayıcıda 404 hedef kanıtı,
inceleme filtresi, Türkçe/mobil akış ve parola/ödeme kapıları doğrulandı.

[Gerçek koşu](tech13-result.json): 60 sayfa. UI/UX hizmet sayfasının `/en`
canonical hedefi ve HTTP 200 yanıtı doğrulandı. Aynı koşuda önceki üç 500
hatasının kaybolmadığı ve erişilebilirlik tekrar gruplaması kontrol edildi.

Eski kayıtlarda yapılandırılmış hedef kanıtı bulunmayabilir; yeni analiz gerekir.
Tarayıcı hâlâ üç sayfayı örnekler. Kaynak eşdeğerliği, Google seçimi ve tam site
indeks durumu bu çalışmada ölçülmedi.
