# TECH62 — OpenAI reasoning yanıtı ve iki soruluk kalibrasyon kapısı

Onaylı TECH61 karşılaştırması 30 istek denedi ancak 0/30 tamamlandı. HTTP hata
yanıtı yerine her istekte son yanıt metni eksikti. Önceki hata yolu sağlayıcının
token kullanımını rapora taşımadığı için kaydedilen sıfır token gerçek maliyetin
sıfır olduğunu kanıtlamaz. Bu başarısız denemeden marka veya atıf sonucu
çıkarılmaz ve tam tur otomatik tekrarlanmaz.

TECH62, GPT-5 Mini isteğinde eski `max_tokens` yerine
`max_completion_tokens` kullanır, reasoning eforunu `minimal` olarak sabitler ve
metinsiz yanıtta güvenli bitiş nedeninin yanında sağlayıcı token kullanımını da
korur. Yeni tam turdan önce farklı açık-onay belirteci isteyen iki soruluk
kalibrasyon zorunludur. Kalibrasyon en fazla iki ardışık çağrı ve çağrı başına
bir native aramayla sınırlı; tahmini bütçesi 0,04 USD'dir.

## Doğrulama

- `test:ai-visibility` OpenAI istek biçimini, minimal reasoning ayarını, metinsiz
  yanıt bitiş nedenini ve hata yolundaki token muhasebesini doğruladı.
- `test:ai-source-comparison-calibration` iki çağrı sınırını ve ayrı açık-onay
  kapısını doğruladı.
- Üretim derlemesi geçti.
- Ücretli kalibrasyon henüz çalıştırılmadı.
- Aynı fikstürler TECH62 worker imajında ağ kapalı geçti. Canlı apex/www parola
  ve ödeme kapıları `TECH62_VERIFIED` sonucu verdi; app `healthy`, worker
  `running`, genel AI bayrağı `false` ve rollback kaydı hazır.
- Arşiv SHA256:
  `7355C51E4F112F7D36017CC83ACC85B68368E79F556C0F1494B0B0D4FB25E779`.
