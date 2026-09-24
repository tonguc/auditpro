# TECH65 — ücretsiz motorlar arası kaynak karşılaştırması

Gemini tur 1, Gemini tur 2 ve kısmi OpenAI turunun çözülmüş özel raporları ağ
kapalı worker içinde karşılaştırıldı; model çağrısı yapılmadı. Gemini turları 17
birebir kaynak URL'si ve 18 alan adı paylaştı. OpenAI ile Gemini tur 1 arasında
iki URL/yedi alan adı, Gemini tur 2 arasında bir URL/üç alan adı örtüştü. Üç
raporda ortak görülen alan adları yalnız `cbot.ai`, `mimozabilisim.com` ve
`protan.com.tr` oldu. 30 promptun 13'ü üç raporda, 11'i iki raporda, altısı tek
raporda sağlayıcı kaynağı taşıdı. Eksik OpenAI gözlemleri ve kaynaksız başarılı
yanıtlar nedeniyle yayın kapısı kapalıdır.

Motor karşılaştırma fikstürü, AI görünürlük regresyonu, üretim derlemesi ve ağ
kapalı worker testleri geçti. Canlı parola/ödeme kapıları `TECH65_VERIFIED`
sonucu verdi; genel AI kapalı kaldı. Arşiv SHA256:
`11AED831653BBDA2E03C25CD514DE3CE51751086751E0F4AEC2F91EB21A2E332`.
