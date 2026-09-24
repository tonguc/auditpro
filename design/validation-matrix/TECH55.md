# TECH55 — OpenRouter özel AI görünürlük pilotu

AI görünürlük çağrıları, Vercel AI Gateway varsayımı yerine OpenRouter'ın
OpenAI-uyumlu `chat/completions` uç noktasına açıkça yönlendirilir. Sağlayıcı
yanıtındaki `citations` alanı varsa kaynak metadatası olarak saklanır; cevapta
geçen URL'ler kaynak yerine geçmez.

Gerçek koşu, normal kullanıcı AI ekranını açmaz. Özel pilot `perplexity/sonar`
ile Türkiye/Türkçe için 10 sabit soru ve en fazla iki ardışık tur çalıştırır;
azami 20 çağrı, eşzamanlılık 1, yeniden deneme 0 ve yanıt sınırı 350 tokendir.
İlk yanıt hata verirse veya sağlayıcı kaynak metadatası getirmezse ikinci tur
başlatılmaz. Sonuçlar puan dışıdır; üyelik, ödeme veya otomatik bakiye yükleme
etkinleştirilmez.

## Canlı pilot sonucu — 19 Eylül 2026

`perplexity/sonar` ile tek ardışık tur tamamlandı: 10/10 yanıt, 513 giriş ve
3421 çıkış tokeni. Doğrudan marka sorularında geçiş 2/2, keşif niyetli sekiz
soruda 0/8 oldu. Sağlayıcı `citations` metadatası dönmediği için atıf oranı
hesaplanamadı ve ikinci tur bilinçli olarak çalıştırılmadı. Bu sonuç, marka
görünmezliği veya kaynak yokluğu hakkında genellenebilir hüküm değildir. Genel
AI bayrağı canlıda `false` kaldı.
