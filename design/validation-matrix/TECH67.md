# TECH67 — başarısız OpenAI promptlarını tamamlama ve nihai karşılaştırma

Kişisel bağlam aktarımı ve yaklaşık 0,15–0,20 USD kullanım için yeni açık onay
alındı. TECH66'nın otomatik çalışmayan planındaki 11 başarısız prompt birer kez,
60 saniye zaman aşımı ve 1800 token üst sınırıyla çalıştırıldı; otomatik tekrar
yapılmadı. 11/11 tamamlandı (63180 giriş, 21282 çıkış tokeni). On bir aramanın
tamamının ücretlendirildiği varsayımıyla liste fiyatı tahmini yaklaşık 0,168
USD'dir; kesin fatura değildir.

Sekiz yanıt sağlayıcı kaynak metadatası taşıdı. 40 URL'nin tamamı çözüldü, 38
nihai URL benzersizdi; marka geçişi 0/11, kaynaklı yanıtlarda hedef atfı 0/8 oldu.
İlk 19 başarılı gözlemle birleşik OpenAI seti 30/30 tamamlandı: 0/30 marka,
22/30 kaynaklı yanıt, kaynaklı yanıtlarda 0/22 hedef atfı, 110 çözülmüş ve 105
benzersiz nihai URL.

Nihai üç-rapor karşılaştırmasında 20/30 prompt üç raporda, beş prompt iki
raporda, beş prompt tek raporda kaynaklıydı. Gemini turları 17 birebir URL
paylaşırken Gemini-1/OpenAI üç, Gemini-2/OpenAI iki URL paylaştı. Üç raporda
ortak alan adları `cbot.ai`, `ey.com`, `mimozabilisim.com` ve `protan.com.tr`.
Kaynaksız tamamlanmış gözlemler ve motor başına iki bağımsız tam tur bulunmaması
nedeniyle yayınlanabilir skor üretilmez.

Karşılaştırma testi, üretim derlemesi ve ağ kapalı worker fikstürleri geçti.
Canlı parola/ödeme kapıları `TECH67_VERIFIED`; app `healthy`, worker `running`,
genel AI `false`. Özel ham, checkpoint, çözülmüş, birleşik ve karşılaştırma
raporları 0600 izinlidir. Arşiv SHA256:
`6679035E204EA325312D0D9B7D340CC225843116F38BF8FEE24AF5DEE7CFCE74`.
