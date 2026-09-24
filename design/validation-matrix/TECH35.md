# TECH35 — kanıta bağlı takip işleri

UX: Çoklu metadata kanıtı detayda vardı ancak özet hangi işi yapacağını
söylemiyordu. Genel bakışa "Önce bunları netleştirin" bölümü eklendi. Başlık,
somut sonraki adım, ilgili URL'ler ve doğru kanıt penceresine erişim içerir.
Bölüm yalnızca somut kayıt varsa görünür; doğrulanmış hata sayısını değiştirmez.

SEO: Çoklu title/description için varlık ve benzersizlik iki ayrı iş kartına
dönüştürülmez. Kaynakları eksik yüklenen sayfalar yalnızca measurementState
kanıtından seçilir. Düğmenin hedefinde bulunmayan URL'ler kartta vaat edilmez.
Metadata inceleme nedeni artık genel "neden bilinmiyor" yerine açıklanır.

GEO: AI kaynağı veya kalibre edilmemiş yöntem etiketi tek başına iş/sorun
oluşturmaz. Bu kartların ölçülmüş AI görünürlük kaybı olmadığı TR/EN açıklanır.
Gerçek AI testleri kredi yüklemesini beklemeye devam eder.

Kontroller: boş/eski kayıt, kaynak/yöntemden kusur uydurmama, çoklu metadata
tekilleştirme, URL-hedef eşleşmesi. Hosted test EN kartları ve kanıt açılışını,
TR başlığı ve mobil taşmamasını kontrol eder. Üyelik/ödeme geliştirmesi yok.

Yerel QA 40/40 geçti, 130,4 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T11-15-34-603Z.json.
Üretim imajında takip mantığı testi ağ kapalı koşulda geçti.
App/worker 20260914-tech35 yayımlandı: TECH35_VERIFIED.
Hosted EN iki takip kartı/kanıt açılışı, TR bölüm başlığı ve mobil taşmama
kontrolleri geçti. Apex/www parola kapısı korundu, ödeme kapalı.
Geri dönüş: pilot-images.before-tech35.yml.
