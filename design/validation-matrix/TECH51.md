# TECH51 — robots.txt kanıt sınırı

`t1` kontrolü artık robots.txt dosyasının genel olarak “doğru” olduğunu
ima etmez. Adı ve yöntem açıklaması, gerçekte ölçülen robots.txt alımı
ve örnek adreslerdeki bot kurallarıyla sınırlandırıldı.

HTTP 2xx yanıtının tek başına geçerli politika kanıtı sayılması kaldırıldı.
Yanıtın `Content-Type` değeri `text/plain` değilse veya eksikse bot/sayfa
kararı artık “izinli” gösterilmez; belirsiz ve inceleme gerektiren kanıt olarak
saklanır. Arayüz politika adresini, HTTP durumunu ve içerik türünü birlikte
gösterir. Ölçüm kaydı belirlenen ve belirsiz karar sayılarını ayrı tutar;
yöntem sürümü `robots-sampled-paths@1.1.0` olarak kaydedilir.

Bu gözlem puan dışıdır. Kural izni gerçek bot erişimini, indekslenmeyi,
arama sonucu görünürlüğünü veya AI alıntısını kanıtlamaz. 4xx/5xx
davranışı ve kodlanmış/karmaşık yollar farklı tarayıcı davranışlarına
genellenmez.

Yerel yayın kapısı 40/40 geçti:
`launch-readiness-2026-09-16T14-58-23-780Z.json` (157,8 saniye).
Dört site türü + kaynak hatası matrisi 10 sayfa, 50 gerçek viewport ve 30
sayfa kararıyla geçti. Yanlış/eksik içerik türü ile `text/plain; charset`
regresyonları, TR arayüz adı ve üretli özellik kapıları doğrulandı.

Hazır kaynak paketi `deployment-artifacts/povlex-20260916-tech51.tar.gz`;
SHA256 `8B0950ECBA4C07FDEBBA733D88918F6B907448B895F4688868EE5F6E55C69559`.
Kullanıcının 16 Eylül açık onayıyla kaynak ve doğrulama betikleri pinli OVH
hedefine aktarıldı. Geçiş öncesi veritabanı yedeği alındı; app/worker
`20260916-tech51` olarak yayımlandı. Parola ve ödeme kapıları iki alan adında
geçti. Kalıcı bulgu kanıtı, `application/json` Content-Type belirsizliği ve
EN/TR başlıkları canlıda doğrulandı: `TECH51_VERIFIED`. App sağlıklı, worker
çalışıyor; rollback kaydı `pilot-images.before-tech51.yml` (TECH50).
