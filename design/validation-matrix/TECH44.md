# TECH44 — URL parametrelerinden yanlış SEO hükmü kaldırıldı

14 Eylül 2026. Yerel aday; aktif yayın TECH35.

t14 query varsa Partial, yoksa Pass veriyordu; kendi açıklaması bunun SEO
kusuru/kalitesi olmadığını söylüyordu. Artık N/A ve puan dışı gözlemdir.
Kontrol başlığı TR/EN sayfa yolu ve parametre bildirimleriyle sınırlandı.
Her gerçek son URL altında pathname ve çözümlenmiş parametre adları saklanır;
tekrarlanan ve boş adlı parametreler URLSearchParams davranışıyla korunur.
Değerler özete tekrar yazılmaz; mevcut kaynak URL kanıtı tam adresi içerir.

Parametre amacı, duplicate içerik, crawl trap, indeksleme veya Google canonical
seçimi bu gözlemden çıkarılmaz. Filtre/sayfalama/varyant parametresi otomatik
kaldırma gerekçesi değildir. Crawl normalizasyonu/keşfi değiştirilmedi.

Kaynak: https://developers.google.com/search/docs/crawling-indexing/url-structure
(14 Eylül 2026). Regresyon: filtre/sayfalama, parametresiz sayısal yol,
tekrarlanan/boş parametreler, encoding/fragment, sayfa kanıtlarının birleşimi.
Gerçek API/Chromium matrisi kontrol sonucunun puana girmediğini ve adres/yol
eşleşmesini doğrular. Tam QA 40/40 geçti (141,9 sn):
launch-readiness-reports/launch-readiness-2026-09-14T18-29-59-495Z.json.
Birleşik paket deployment-artifacts/povlex-20260914-tech44.tar.gz;
cutover-tech44.sh TECH35'ten geçiş için hazır, çalıştırılmadı.

Önceki kaynak aktarımı reddi nedeniyle aktarım/yayın yeniden denenmedi.
Üyelik/ödeme, ücretli AI veya diğer projelerde değişiklik yok.
