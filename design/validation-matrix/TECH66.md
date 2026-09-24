# TECH66 — AI koşusu checkpoint ve güvenli devam

Her gözlem atomik checkpoint dosyasına yazılır. Yeniden başlatılan aynı koşu;
prompt seti, planlanan çağrı sayısı, motor, model ve prompt kimliklerini doğrular,
sonra yalnız checkpoint'te bulunmayan işleri yürütür. Bilinmeyen veya yinelenen
prompt kimliği reddedilir.

TECH64 raporundan üretilen yeniden-deneme planı yalnız 11 başarısız promptu içerir
(yedi zaman aşımı, dört token-sınırı kesilmesi), kendi başına çalıştırılamaz ve
ayrı açık-onay belirteci gerektirir. Bu sürümde ücretli yeniden deneme yapılmadı.
OpenRouter zaman aşımı 10–120 saniye, GPT-5 tamamlanma bütçesi 350–4000 token
arasında sınırlandırılmış yapılandırmaya dönüştürüldü.

Yerel görünürlük, kaynak karşılaştırma ve motorlar arası karşılaştırma testleri
ile üretim derlemesi geçti. Aynı fikstürler TECH66 worker imajında ağ kapalı
geçti. Canlı parola/ödeme kapıları `TECH66_VERIFIED`; app `healthy`, worker
`running`, genel AI `false`. Geri dönüş `pilot-images.before-tech66.yml` ile
TECH65'e hazırdır. Arşiv SHA256:
`334B8D400BB9E4EC2BF1DAE4AF2B4F3547003884BAFADBF8822A11F5A541117B`.
