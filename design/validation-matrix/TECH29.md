# TECH29 — yükleme ve yönlendirme iddiaları

Görsel sırası, ekran altı konumun kanıtı değildir. t22 artık parsed img loading
bildirimlerini kaynak adresiyle saklar; konum/gerçek istek ölçülmeden başarısızlık
veya başarı üretmez. t26 module-deferred/module-async, classic async/defer,
parser-blocking, legacy fallback ve data-block/src-ignored türlerini ayırır.
Parser blocking gözlemi tek başına performans hatası veya üçüncü taraf iddiası değildir.

t29 herhangi bir redirect sayısından HTTP→HTTPS başarı sonucu çıkarmayı bırakır.
Son URL protokolü ve yönlendirme sayısı sayfa bazında korunur; bağımsız HTTP
başlangıç testi yapılmadığında sonuç belirsizdir. Bu paket o aktif testi eklemez.

Regresyon ilk koşuda önceki t22 Fail kararını N/A beklentisiyle yakaladı.
Kalibrasyon kapsamı: inert template/script metni, base URL, module, boolean
async=false varlığı, nomodule, JSON-LD src, eksik/uygunsuz yükleme değerleri.
Kaynak değerleri sitewide birleştirmede sayfa URL'siyle korunur. t22/t26 başlıkları
EN/TR olarak ölçülen kapsamla uyumlu güncellendi; detay değerleri teknik etiketlerdir.

Referanslar:
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/script
- https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img

Tam QA 40/40 geçti, 158,4 saniye:
launch-readiness-reports/launch-readiness-2026-09-13T23-24-28-484Z.json.
Puan kapsamı genişletilmedi. Kullanıcı açık hedef/paket sorusuna "onayladım
tekrar denesene" yanıtını verdikten sonra SCP aktarımı başarılı oldu.
App/worker 20260914-tech29 derlendi ve yayın doğrulandı: TECH29_VERIFIED.
Yeni worker içinde ağ kapalı kalibrasyon testi geçti; hosted TR/rapor/mobil/AI
kanıt gösterimi ve apex/www parola/kapalı ödeme uçları geçti.
Geri dönüş dosyası: pilot-images.before-tech29.yml.

Otomatik onay denetimi SCP aktarımını iki kez reddetti. İkinci değerlendirmeye
DEPLOYMENT.md yetkisi, sabit SSH anahtarı, sunucuda TECH28 imajlarının salt okunur
doğrulanması ve pakette .env/özel anahtar/yedek olmadığının manifest kontrolü
sunuldu. Denetim yine hedef IP/payload için özgül kullanıcı onayı istedi.
Aktarım kapsamı: deployment-artifacts/povlex-tech29.tar.gz,
cutover-tech29.sh, tech29-browser.mjs → ubuntu@51.254.209.34:/tmp/.
Dolaylı aktarım veya başka araçla aşma denenmedi. Kullanıcının yeni açık onayıyla
aynı SCP işlemi yeniden değerlendirildi ve kabul edildi. İmaj derleme, ağsız
kalibrasyon, cutover ve hosted parola/rapor testleri tamamlandı.
