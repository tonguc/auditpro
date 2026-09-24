# TECH41 — güvenlik başlıklarında iddia/kanıt ayrımı

14 Eylül 2026; yerel aday, aktif yayın TECH35.

t31 yalnızca HSTS varlığından Pass, t33 en az üç başlıktan Pass üretiyordu.
Boş/etkisiz/geçersiz değerler böylece başarı sayılabiliyordu. İki kontrol de
N/A, puan dışı yanıt gözlemine daraltıldı; yokluk da genel güvenlik hatası
olarak sınıflandırılmaz. Gerçek uygulama güvenlik ayarları değiştirilmedi.

Seçili son yanıt başlıkları izin listesiyle alınır: HSTS; CSP, CSP Report-Only,
X-Frame-Options, X-Content-Type-Options, Referrer-Policy. Çerez ve ilgisiz
başlıklar alınmaz. Fetch Headers birleşik değerleri korunur; tel üzerindeki
ayrı başlık satırlarını veya tarayıcı uygulamasını yeniden kurma iddiası yoktur.

Kaynak URL altında bulunmayan (null), boş ('') ve bildirilen değerler ayrı
Türkçe/İngilizce gösterilir. Gözlem için yanıltıcı “0 sorun” başlığı kullanılmaz.
Ham değer dışa aktarma uyumluluğu için pageResults.value içinde de tutulur.

HSTS sözdizimi/üst alan mirası/preload ve gerçek tarayıcı koruması doğrulanmaz.
CSP Report-Only ayrı başlıktır; uygulanan politika değildir. Meta ile sunulan
politikalar ve yönergeler arası ilişkiler kapsam dışıdır. Başlık envanteri SEO
veya GEO görünürlüğü kanıtı değildir; yeni puan kontrolü eklenmedi.

Kaynaklar (14 Eylül 2026):
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Strict-Transport-Security
- https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Security-Policy-Report-Only

Kalibrasyon: boş/geçersiz/max-age=0 HSTS, HTTP/HTTPS, başlık sayısı, report-only,
izin listesi, çok sayfalı birleştirme. API/Chromium matrisinde kaynak URL ve
değer kaybı kontrolü; uygulama akışında TR/EN ve 390px genişlik testi.

İlk tam QA uygulama testinde iç içe summary öğeleri nedeniyle seçici belirsizliği
yakaladı. Seçici doğrudan ana summary ile sınırlandı; test:app-flow tekrar geçti
(TR/EN görünüm ve 390px taşma kontrolü dahil). Tekrar tam QA 40/40 geçti,
136,6 saniye. Rapor:
launch-readiness-reports/launch-readiness-2026-09-14T18-02-05-375Z.json.
Birleşik TECH36–41 paketi deployment-artifacts/povlex-20260914-tech41.tar.gz.
cutover-tech41.sh TECH35'ten geçiş için hazırlandı, çalıştırılmadı.
Önceki aktarım reddi nedeniyle sunucuya aktarım veya yayın
yeniden denenmedi. Üyelik, ödeme ve gerçek AI çağrıları kapsam dışı.
