# TECH63 — OpenAI tek soruluk son kalibrasyon kapısı

Onaylı TECH62 kalibrasyonu iki istekte de `finish_reason: length` ile bitti ve
0/2 tamamlandı. Kullanım 6052 giriş ve 1084 çıkış tokeniydi; iki native arama
dahil liste fiyatlarıyla yaklaşık maliyet 0,024 USD'dir. Yanıt metni olmadığı
için marka veya kaynak sonucu üretilmedi.

TECH63, minimal reasoning ayarını korurken GPT-5 Mini tamamlanma bütçesini
350'den 1200 tokena çıkarır. Tam turdan önce yalnız bir sabit soruyu çalıştıran,
farklı açık-onay belirteci isteyen son kalibrasyon kapısı eklenmiştir. Tahmini
bütçe 0,03 USD'dir; açık onay gelmeden çağrı yapılmaz.

Kullanıcının ayrı açık onayından sonra tek çağrı 1/1 tamamlandı: 9098 giriş ve
1756 çıkış tokeni kaydedildi. Sağlayıcı kaynak metadatasındaki beş URL'nin
tamamı güvenli çözümleyicide nihai adresine ulaştı; çözülmeyen kaynak yoktu.
Marka geçişi 0/1 ve `tonguckaracay.com` atfı 0/1 oldu. Liste fiyatlarıyla bir
native arama dahil yaklaşık maliyet 0,016 USD'dir. Bu yalnız teknik yolun metin
ve kaynak üretebildiğini kanıtlayan tek gözlemdir; görünürlük skoru veya
görünmezlik hükmü değildir. Ham ve çözülmüş raporlar canlı sunucudaki
`qa-private/ai-pilot` dizininde 0600 izinle saklanır.

30 sabit soruluk OpenAI karşılaştırması çalıştırılmadı. Kalibrasyondaki gerçek
kullanım ölçeklenerek tur için yaklaşık 0,50 USD ayrılmalıdır; kişisel bağlamın
OpenRouter/OpenAI'a yeniden aktarımı ve bu bütçe için yeni açık onay gerekir.

Yerel `test:ai-visibility`, kalibrasyon kapısı fikstürü ve üretim derlemesi geçti.
Fikstürler TECH63 worker imajında ağ kapalı geçti. Canlı apex/www parola ve
ödeme kapıları `TECH63_VERIFIED` sonucu verdi; app `healthy`, worker `running`,
genel AI bayrağı `false` ve `pilot-images.before-tech63.yml` rollback kaydı hazır.

Arşiv SHA256:
`C392A14E70785C25EC33AD3F2EC22153E5BA7BECECE600ABB6A1A0C46C9DC1E5`.
