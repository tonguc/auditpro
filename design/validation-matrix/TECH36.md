# TECH36 — görünür ve doğru analiz kapsamı

Genel bakış/bulgular ekranındaki küçük kapsam dipnotu belirgin bir kapsam
kartına dönüştürüldü. Gerçekte incelenen, istenen üst sınır, uygulanan üst sınır,
analiz edilemeyen ve tarama sınırında atlanan adresler ayrı gösterilir.
Tek düğme tam adres/neden listesine götürür. Benzersiz URL sayıları kullanılır;
bu sayılardan site büyüklüğü, tarama yüzdesi veya AI görünürlüğü hesaplanmaz.

İstenen sayı üst sınırdır; mutlaka o kadar sayfa bulunduğu anlamına gelmez.
Daha düşük uygulanan sınır, kayıt nedeni kanıtlamıyorsa üyelik planına bağlanmaz.
Eksik eski kayıtta incelenen sayfa sayısı 1 varsayılmaz; bilinmiyor gösterilir.
Doğrudan analyze API de requestedPageLimit döndürür.

Testler: eksik/sıfır ayrımı, hatalı sayılar, yinelenen atlama adresleri, neden
uydurmama ve API istenen sınır. Hosted fixture 25/5/3 ve 1/1 atlama sayılarını,
kapsam düğmesini, TR başlığını ve mobil taşmamasını doğrular.
Üyelik/ödeme geliştirmesi yok.
Yerel QA 40/40 geçti, 230,3 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T13-26-34-225Z.json.
Yayın BEKLİYOR. Otomatik onay denetimi SCP kaynak/betik aktarımını reddetti.
DEPLOYMENT yetkisi, sabit host anahtarı ve arşivde .env/özel anahtar/qa-private/
.git bulunmadığı doğrulandıktan sonra aynı işlem yeniden değerlendirildi; yine
spesifik payload/hedef için açık kullanıcı yetkisi yetersiz gerekçesiyle reddedildi.
Aktif sürüm TECH35; TECH36 sunucu derlemesi veya cutover başlatılmadı.
Hazır arşiv: deployment-artifacts/povlex-20260914-tech36.tar.gz.
SHA256: A41D8B1310A9D42F9ED096E8199D3B169C0BFD34F69BE5707546230BEB9824C4.
