# Yerel geliştirme — 13 Eylül 2026

Durum: Kullanıcının açık kaynak paketi/hedef onayından sonra TECH12 ile
13 Eylül'de OVH parola korumalı test yayınına aktarıldı. Yayındaki sayaç,
inceleme filtresi/gerekçesi ve Türkçe/mobil akış doğrulandı.

## Değişiklikler

- Kategori kartı ve ayrıntı başlığı aynı hesaplamayı kullanır: Fail/Partial sorun
  saptanan kontroller, Pass geçenler, N/A değerlendirilemeyen/uygulanmayanlar ve
  yalnızca not/kanıtı bulunanlar inceleme bekleyenler olarak ayrılır.
- 26 gözlem 26 sorun olarak sunulmaz. Sayılar kontrol sayısıdır, URL/öğe sayısı değildir.
- İnceleme bekleyenler için filtre eklendi.
- Ayrıntıda kayıtlı reasonCode üzerinden inceleme nedeni açıklanır: doğrulanmamış
  yöntem, eksik kapsam, yüklenemeyen kaynaklar, yinelenen ölçüm veya bilinmeyen neden.
- Bilinmeyen nedenden eksik API ya da site hatası çıkarılmaz. Ürünün yöntem
  doğrulama eksikliği açıkça Povlex'in sınırlaması olarak ifade edilir.
- Kontrol ayrıntılarında URL ve öğe kanıtı görünür. İngilizce eski araç talimatı
  yerine mevcut dilde eylem/doğrulama açıklaması kullanılır. İnceleme bekleyen bir
  gözlem için doğrudan siteyi düzeltme talimatı verilmez.

## Doğrulama

Üretim derlemesi ve app-flow tarayıcı testi geçti. App-flow içinde sayaç ve
inceleme gerekçesi regresyon testleri de çalışır. Tarayıcı testi bilinmeyen neden
açıklamasını ve inceleme filtresinin ölçülen sonuçları dışarıda bıraktığını doğrular.

Bu sürüm yöntem kalibrasyonu yapmaz ve mevcut gözlemleri puanlamaya açmaz.
Kaynak paketi, açık aktarım onayı, sunucu derlemesi ve parola korumalı arayüz
doğrulaması TECH12 geçişinde tamamlandı.
