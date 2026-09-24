# TECH60 — güvenli kaynak yönlendirmesi çözümleme

TECH60, Gemini native-search kaynaklarının ham `vertexaisearch.cloud.google.com`
yönlendirme alan adı altında sayılmasını önler. Ayrı ve özel rapor işleyicisi
yalnız izin verilen proxy alanına ağ isteği yapar, DNS sonucunu genel IP'ye
sabitler, özel/yerel hedefleri reddeder ve nihai yayıncı URL'sini kanıta ekler.
Bu işlem model çağrısı yapmaz ve ham raporu değiştirmez.

## Doğrulama

- Yerel `test:ai-source-resolution`, `test:ai-source-pilot`,
  `test:ai-visibility` ve üretim derlemesi geçti.
- Aynı üç fikstür TECH60 worker imajında ağ kapalı olarak geçti.
- Canlı kesimde apex/www parola ve ödeme kapıları geçti: `TECH60_VERIFIED`.
- Doğrudan Docker denetiminde app `healthy`, worker `running`; genel AI bayrağı
  `AUDITPRO_AI_VISIBILITY_ENABLED=false` kaldı.
- Arşiv SHA256:
  `25018047C2DDABD71BB2FB919705630EC52004839D234F7B562F3BDA564CB219`.
- Geri dönüş anlık görüntüsü: `pilot-images.before-tech60.yml` (TECH59).

## İlk 30 soruluk tur

Açık kullanıcı onayıyla yürütülen ilk sabit tur 30/30 tamamlandı: 2499 giriş ve
10380 çıkış tokeni, 0/30 marka geçişi, 27/30 kaynak metadatalı yanıt. Ham 64
kaynak URL'sinin tamamı çözüldü; 52 benzersiz nihai URL bulundu. Kaynaklı 27
yanıtın hiçbirinde `tonguckaracay.com` yoktu. En sık nihai alan adları
`protan.com.tr` (4), `kosgeb.gov.tr` (3), `ey.com` (3) ve `cbot.ai` (3) oldu.

Üç yanıtta sağlayıcı kaynağı bulunmadığından atıf oranı ve görünürlük endeksi
hesaplanmadı. Bu tek motor/tek tur ölçümüdür; yayınlanabilir skor veya genel
görünmezlik hükmü değildir. Aynı 30 sorunun ikinci ayrı turu, kişisel bağlamın
OpenRouter'a gönderilmesi ve yaklaşık en fazla 0,45 USD kullanım için yeniden
açık onay gerektirir.

## İkinci tur ve birleşik görünüm

Kullanıcının kişisel bağlam aktarımı ve yaklaşık en fazla 0,45 USD kullanım için
yeniden verdiği açık onayla aynı sabit set ikinci kez çalıştırıldı. Tur 30/30
tamamlandı (2499 giriş, 10380 çıkış tokeni), marka geçişi 0/30 oldu. Sağlayıcı
kaynak metadatası 26/30 yanıtta vardı; 55 URL'nin tamamı çözüldü, 45 benzersiz
nihai URL bulundu ve kaynaklı 26 yanıtın hiçbirinde hedef alan adı yer almadı.

İki turun betimsel toplamı 60/60 tamamlanan yanıt, 0/60 marka geçişi, 53/60
kaynaklı yanıt, kaynaklı yanıtlarda 0/53 hedef atfı, 119 çözülmüş URL ve 80
benzersiz nihai URL'dir. İki turda birebir ortak olan URL sayısı 17; her iki
turda da kaynak dönen soru sayısı 24/30'dur. Yedi gözlemde sağlayıcı kaynağı
eksik olduğu için atıf oranı ve görünürlük endeksi hesaplanmaz. Sonuç iki turlu
olsa da tek motora dayanır; yayınlanabilir skor değildir.
