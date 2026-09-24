# TECH42 — eşzamanlı inceleme nedenleri

14 Eylül 2026. Yerel aday; aktif yayın TECH35.

Önceki arayüz tek bir gerekçe seçiyordu; method-not-calibrated üst bilgisi
eksik kapsamı gizleyebiliyor, yalnızca sayfa sonuçlarında bulunan eksik
kaynak/kapsam bilgisi genel açıklamada hiç gösterilmeyebiliyordu.

Artık kayıtlı nedenler kaynak, kapsam, çoklu metadata, tekrarlanan metrik ve
yöntem sırasıyla bir arada gösterilir. Aynı neden sayfa ve üst kayıtta olsa
bile bir kez görünür. Bilinmeyen neden yalnızca tanınan kanıt yoksa gösterilir.
Sayfa sayısından, N/A durumundan veya AI kaynak türünden yeni engel üretilmez.
Puan, bulgu sayısı, API çağrıları veya ölçüm yöntemleri değiştirilmedi.

Regresyon: dört eşzamanlı neden, sayfa kayıtları, tekrarların ayıklanması,
bilinmeyen kayıtlar ve örneklem sayısından eksiklik varsayılmaması.
Uygulama akışında kapsam ve yöntem nedenlerinin TR/EN birlikte gösterimi.

Tam QA 40/40 geçti (135,3 saniye). Rapor:
launch-readiness-reports/launch-readiness-2026-09-14T18-10-10-167Z.json.
Birleşik paket deployment-artifacts/povlex-20260914-tech42.tar.gz;
cutover-tech42.sh aktif TECH35'ten geçiş için hazırlandı, çalıştırılmadı.
Önceki kaynak aktarımı reddi nedeniyle sunucuya aktarım ve
yayın yeniden denenmedi. Üyelik/ödeme ve gerçek AI çağrıları kapsam dışında.
