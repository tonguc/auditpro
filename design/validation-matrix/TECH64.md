# TECH64 — OpenAI 30 soruluk kaynaklı karşılaştırma v2

TECH64, daha önce başarısız olan v1 onayını yeniden kullanmaz. 30 sabit Türkçe
keşif sorusunu `openai/gpt-5-mini` native web search ile çalıştırmak için ayrı
`approved-openrouter-30-openai-source-comparison-v2` belirtecini ve kalibrasyon
kullanımından türetilmiş 0,50 USD tahmini bütçeyi kullanır. Genel AI özelliğinin
kapalı olması zorunludur; çağrılar ardışık ve çağrı başına en fazla bir aramadır.

Kullanıcının kişisel bağlam aktarımı ve yaklaşık 0,50 USD bütçe için açık
onayından sonra 30/30 istek denendi, 19 yanıt tamamlandı. Dört yanıt
`finish_reason: length` ile metinsiz kaldı, yedi istek zaman aşımına uğradı;
otomatik tekrar yapılmadı. Kaydedilen kullanım 98311 giriş ve 33223 çıkış
tokenidir. Liste fiyatları ve en fazla 30 ücretli arama varsayımıyla yaklaşık
üst tahmin 0,391 USD'dir; sağlayıcı faturası değildir.

19 tamamlanmış yanıtın 14'ünde sağlayıcı kaynak metadatası vardı. Dönen 70
URL'nin tamamı güvenli çözümleyicide nihai adresine ulaştı; çözülmeyen URL yoktu
ve 70 nihai URL benzersizdi. Marka geçişi 0/19, kaynaklı yanıtlarda
`tonguckaracay.com` atfı 0/14 oldu. Beş başarılı yanıtta kaynak metadatası yoktu.
Eksik 11 gözlem ve kaynaksız beş yanıt nedeniyle atıf oranı ile görünürlük
endeksi hesaplanmaz; bu kısmi ikinci-motor ölçümü yayınlanabilir skor değildir.

Yerel `test:ai-source-comparison`, `test:ai-visibility` ve üretim derlemesi
geçti. Aynı fikstürler TECH64 worker imajında ağ kapalı geçti. Canlı apex/www
parola ve ödeme kapıları `TECH64_VERIFIED` sonucu verdi; app `healthy`, worker
`running`, genel AI bayrağı `false`. Ham ve çözülmüş raporlar sunucuda 0600
izinle saklanır. Geri dönüş kaydı `pilot-images.before-tech64.yml` ile TECH63'tür.

Arşiv SHA256:
`940A02A69976F6617F7619C114EDCBDB050E384AED77FA898A49506EA8159E2E`.
