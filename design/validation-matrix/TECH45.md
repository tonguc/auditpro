# TECH45 — belirsiz sayfa sonuçlarını başarı gibi sunmama

14 Eylül 2026. Yerel aday; aktif yayın TECH35.

Genel sayfa kanıtı bileşeni tüm satırlar N/A iken de “başarısız/kısmi kontrol
yok” diyordu. Artık N/A veya incomplete ölçüm olan satırlar ayrı sayılır;
kesin karar eksikliği TR/EN açıklanır. Etkilenen satır yoksa başlık nötr sayfa
sonuçları olur. Belirsizlik varsa boş başarı ifadesi kullanılmaz ve kayıtlı
sayfalar varsayılan olarak açık gösterilir. Fail/Partial satırları ve ölçüm
sonuçları değiştirilmez; eksik ölçüm Fail satırı aynı zamanda belirsiz olabilir.

Regresyon: N/A, eksik kaynak/kapsam, tam Pass, karma satırlar; uygulamada N/A
URL'nin tıklama gerektirmeden görünmesi, yanıltıcı boş başarı metninin yokluğu,
TR/EN belirsizlik açıklaması. Özel schema/header vb. kanıt bileşenleri değişmedi.

Tam QA 40/40 geçti (133,9 sn):
launch-readiness-reports/launch-readiness-2026-09-14T19-17-35-523Z.json.
TR/EN sayfa kanıtı ve varsayılan açık adres görünümü doğrulandı.
Birleşik paket deployment-artifacts/povlex-20260914-tech45.tar.gz;
cutover-tech45.sh TECH35'ten geçiş için hazır, çalıştırılmadı.
Ücretli servis veya gerçek AI çağrısı yok. Önceki aktarım
reddi nedeniyle sunucuya aktarım ve yayın yeniden denenmedi.
