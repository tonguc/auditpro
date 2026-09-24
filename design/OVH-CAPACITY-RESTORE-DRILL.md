# OVH kapasite ve tam geri-yükleme tatbikatı

## Amaç ve sınır

Bu tatbikat canlı pilotun normal kullanım kapasitesini ve OVH seviyesindeki
tam VPS kurtarmayı doğrular. Mevcut üç turlu crawler zamanlaması bu testin
yerine geçmez. Üyelik, ödeme, ücretli AI ve parola yapılandırması kapsam dışıdır.

## Güvenli kapasite koşusu

- Hedef yalnız parola korumalı `povlex.com` pilottur; üretim dışı, rastgele
  `example.invalid` hesapları kullanılır.
- Önce 10 dakika boyunca sabit düşük eşzamanlılıkla okunabilir sağlık/audit
  akışı ölçülür; sonra yalnızca önceden kabul edilen üst sınıra kadar artılır.
- Her aşamada istek sayısı, başarı/hata oranı, p50/p95/p99, kuyruk gecikmesi,
  app/worker CPU-RAM-disk kullanımı ve veritabanı bağlantı sayısı kaydedilir.
- Hata oranı %1'i aşarsa, p95 belirlenen eşiği aşarsa, bellek baskısı oluşursa
  veya worker kuyruğu büyümeye devam ederse koşu hemen durur ve önceki kararlı
  eşzamanlılığa dönülür.
- Sonuç yalnız test edilen süre, trafik şekli ve VPS boyutu için geçerlidir;
  genel müşteri kapasitesi veya SLA ilanı değildir.

## Tam VPS geri-yükleme tatbikatı

1. Geçerli OVH geri-yükleme noktası, tarih ve kapsadığı disk doğrulanır.
2. Tatbikat, canlı VPS'in üzerine değil ayrı OVH kurtarma örneğine yapılır.
3. Kurtarılan örnekte disk, Docker/Compose, app, worker, veritabanı, parola
   kapısı ve ödeme engeli doğrulanır; hiçbir gerçek kullanıcı verisi dışarı
   aktarılmaz.
4. Uygulama veritabanı içerik özetleri ile kaynak yedek karşılaştırılır;
   başlatma ve sınırlı disposable-qa akışı test edilir.
5. Kurtarma süresi, eksik yapılandırma, manuel müdahale ve geri dönüş kararı
   kaydedilir. Başarısızlık, canlı VPS'i değiştirmeden tatbikatı kapatır.

## Başlatmadan önce gereken kararlar

- Maksimum test eşzamanlılığı ve hedef p95 eşiği.
- Kabul edilebilir test süresi ve pilot kullanıcı etkisi penceresi.
- Ayrı kurtarma örneği için OVH maliyet/kapasite onayı ve geri-yükleme noktası.

Bu üç karar olmadan gerçek yük veya tam VPS geri yükleme başlatılmaz.

## Başlangıç erişilebilirlik ölçümü — 16 Eylül 2026

- Canlı öncesi durum: uygulama, worker ve veritabanı sağlıklı; disk `%28`
  dolu (`11 GB / 38 GB`), kullanılabilir bellek yaklaşık `2,9 GB` idi.
- Parola korumalı ana sayfaya, analiz işi oluşturmadan, en fazla iki eşzamanlı
  istekle 30 saniyeye yayılmış 10 istek yapıldı.
- Sonuç: `10/10` HTTP `200`; ortalama `115 ms`, medyan `94 ms`, p95/p99
  (bu küçük örneklemde en yüksek değer) `222 ms`; hata gözlenmedi.
- Bu yalnız kapı ve uygulama erişilebilirliği için düşük etkili bir başlangıç
  ölçümüdür. Crawler/worker yükünü, kuyruk gecikmesini veya müşteri kapasitesini
  kanıtlamaz; yukarıdaki 10 dakikalık kontrollü koşunun yerine geçmez.

## Kontrollü iki-analiz kapasite koşusu — 16 Eylül 2026

- Parola kapısı veya müşteri hesabı akışı kullanılmadan, önceden doğrulanmış
  test alanında iki eşzamanlı, salt-okunur beşer sayfalık analiz tekrarlandı.
  Her turdan sonra yeni çift başlatıldı; eşzamanlı analiz sayısı hiçbir anda
  ikiyi geçmedi.
- 20 turda 40 analiz HTTP `200` ile tamamlandı. Her analiz beş sayfayı işledi;
  hata gözlenmedi. Süreler: ortalama `23,421 saniye`, p50 `23,432 saniye`, p95
  `24,018 saniye`, p99 ve en yüksek `24,570 saniye` (40 ölçüm).
- Otomatik koruma eşiği: bir çiftteki analizlerden herhangi biri `45 saniyeyi`
  aşarsa veya bir tur hatayla biterse koşu duracaktı; eşik ihlali olmadı.
- Koşu sonundaki canlı kaynak fotoğrafı: app `71,63 MiB`, worker `138,6 MiB`,
  PostgreSQL `53,9 MiB`; disk hâlâ `%28` dolu ve yaklaşık `2,9 GB`
  kullanılabilir bellek vardı. App, worker ve veritabanı sağlıklıydı.
- Bu, yalnız bu VPS, hedef alan ve iki eşzamanlı analiz sınırı için kontrollü
  kanıttır. Çoklu müşteri izolasyonu, daha yüksek eşzamanlılık, kuyruk baskısı
  veya SLA iddiası değildir.
