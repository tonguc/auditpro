# TECH37 — form sayımından dönüşüm hükmü çıkarılmaması

UX incelemesi: HTML ve browser yöntemleri çok alanlı formu belirli eşiklerden
sonra başarısız sayıyor, autocomplete niteliği varlığını çalışan autofill gibi
yorumlayabiliyordu. c17/c19 artık N/A tanısal gözlemdir; sayıdan dönüşüm kaybı,
gereksiz alan veya gerçek autofill desteği sonucu çıkarılmaz.

Browser desktop ölçümü her form için DOM form.elements üzerinden alan, required
ve autocomplete bildirim sayılarını sayfa URL'siyle saklar. Form dışındaki
form=id ilişkili kontroller dahildir; başka/olmayan form sahibine bağlı olanlar
o forma eklenmez. Hidden/submit/button/reset/image girişleri dışlanır. CSS
görünürlüğü, gereklilik ve amaç bu sayıların doğruladığı şeyler değildir.
Kullanıcının girdiği değerler toplanmaz. TR/EN kontrol başlıkları daraltıldı.

SEO/GEO sınırı: Bu envanter SEO sıralaması veya AI görünürlük kaybı değildir.
Puan katkısı yok. İletişim bağlantılarının anlamsal/doğru ayrıştırma incelemesi
sonraki ayrı iş olarak kalır. Üyelik ve ödeme geliştirmesi yapılmadı.

Testler: çok alan ve autocomplete=off hata/başarı üretmez; gerçek Chromium'da
form dışı ilişki, hidden ve ilişkisiz kontrol ayrımı; API'de URL/N/A kanıtı.
Tam QA 40/40 geçti, 191,0 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T14-24-39-755Z.json.
TECH36 ile birlikte yalnızca yerel adaydır. Aktif yayın TECH35.
Aktarım onayı denetiminin önceki reddi nedeniyle yeni SCP denenmedi.
Hazır paket: deployment-artifacts/povlex-20260914-tech37.tar.gz.
cutover-tech37.sh aktif TECH35'ten geçiş için hazırlanmıştır; çalıştırılmadı.
