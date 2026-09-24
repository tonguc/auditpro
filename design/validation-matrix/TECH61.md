# TECH61 — OpenAI ikinci motor karşılaştırma kapısı

TECH61, aynı 30 sabit ve markasız Türkçe keşif sorusunu Gemini'den bağımsız
`openai/gpt-5-mini` native web aramasıyla ölçmeye hazırlar. Soru metinleri,
kümeler ve marka/atıf analizi değiştirilmez; böylece motor farkı dışında yeni
bir deney değişkeni eklenmez.

## Güvenlik ve maliyet sınırları

- Çalıştırıcı farklı ve tur-özel açık-onay belirteci olmadan sağlayıcı çağrısı
  yapmaz.
- Genel AI özelliği açıkken özel karşılaştırmayı reddeder.
- En fazla 30 ardışık model çağrısı, çağrı başına en fazla bir native arama ve
  en fazla 350 çıktı tokeni kullanır.
- 19 Eylül 2026 liste fiyatları: 0,25 USD/milyon giriş tokeni, 2 USD/milyon
  çıktı tokeni ve 10 USD/1000 web araması. Arama içeriği tokenleri değişebildiği
  için 0,45 USD bir tahmini bütçedir, kesin fatura garantisi değildir.
- Kişisel bağlam ve tahmini bütçe için yeni açık onay gelmeden ücretli tur
  çalıştırılmaz.

## Doğrulama

- `test:ai-source-comparison` açık-onay kapısını, model kimliğini ve 30 soruluk
  sabit seti doğruladı.
- Mevcut Gemini pilot regresyonu ve üretim derlemesi geçti.
- Aynı fikstürler TECH61 worker imajında ağ kapalı geçti. Canlı apex/www
  parola/ödeme kapıları `TECH61_VERIFIED` sonucu verdi; doğrudan Docker
  denetiminde app `healthy`, worker `running` ve genel AI bayrağı `false` kaldı.
- Geri dönüş anlık görüntüsü: `pilot-images.before-tech61.yml` (TECH60).
- Arşiv SHA256:
  `5336E0F77B7FC093E5AD6E1A185D4775E09F5CC91100A68B52BF693EE0679CE9`.
