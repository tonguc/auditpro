# TECH46 — görsel biçimi ve boyut bildirimleri

14 Eylül 2026; yerel aday, aktif TECH35.

t20 herhangi bir img niteliğindeki WebP/AVIF uzantısından başarı, diğer
biçimlerden hata çıkarabiliyordu. t21 boş olmayan width/height değerlerinden
geçerlilik sınamadan başarı veriyordu. İkisi N/A, puan dışı gözleme daraltıldı.
TR/EN başlıklar kaynak ve boyut bildirimleri olarak düzeltildi.

Mevcut parse5 loadingEvidence okuyucusu kullanılır: template/script sahte
öğeleri sayılmaz; gerçek img src adresi base ile çözülür. Her sayfa altında
src, srcset niteliği varlığı veya width/height ham değerleri kaydedilir.
Eksik null, boş string ve diğer değerler korunur. Srcset içeriği ayrıştırılmaz;
picture seçimi, gerçek Content-Type/byte içeriği, CSS boyutları/aspect-ratio,
görsel kalitesi ve gerçek layout shift ölçülmez. PNG/JPEG otomatik kusur değildir.

Kaynaklar (14 Eylül 2026):
- https://developers.google.com/search/docs/appearance/google-images
- https://web.dev/articles/optimize-cls

Regresyon: inert görsel, yanıltıcı alt metni, base adresi, geçersiz/boş boyut,
picture/srcset, farklı dosya/parametre biçimleri, sayfa bazlı birleşim.
API/Chromium matrisi boş görsel örnekleminin başarıya dönüşmediğini doğrular.
Tam QA 40/40 geçti (168,1 sn):
launch-readiness-reports/launch-readiness-2026-09-14T20-00-06-592Z.json.
Birleşik paket deployment-artifacts/povlex-20260914-tech46.tar.gz;
cutover-tech46.sh TECH35'ten geçiş için hazır, çalıştırılmadı.
Önceki aktarım reddi nedeniyle yayın yeniden denenmedi.
