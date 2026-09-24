# Açılış günü kontrol listesi

Bu liste mevcut `povlex.com` pilotunun açılış günündeki kısa karar ve doğrulama
akışıdır. Parola koruması, ödeme engeli ve ücretli AI varsayılan olarak korunur.

## Açılıştan önce

- `povlex.com` ve `www.povlex.com` HTTPS olarak açılıyor; app, worker ve
  veritabanı sağlıklı.
- En güncel otomatik OVH yedek noktası ve yerel SQL yedeği tarihi kaydedilir.
- Parola ile ana sayfa erişimi, anonim isteğin engellenmesi ve ödeme uçlarının
  `403` vermesi doğrulanır.
- Bir örnek analiz, 250 sayfa ve en fazla iki eşzamanlı analiz teknik sınırları
  içinde tamamlanır.
- Kullanıcıya verilecek kısa kullanım notu: analiz başına 250 sayfa; en çok iki
  eşzamanlı analiz; ödeme ve ücretli AI kapalı.

## Yayın kararı

- Parola koruması devam edecekse, pilot hazırdır ve bu listeyle açılır.
- Parola kapısı kaldırılacaksa bu ayrı, açık bir kullanıcı kararıdır; kaldırma
  öncesinde anonim erişim, destek iletişimi ve geri dönüş planı yeniden
  doğrulanır.
- Gerçek ödeme, üyelik planı veya ücretli AI bu açılış kararıyla otomatik olarak
  açılmaz.

## Sonraya bırakılanlar

- Ayrı OVH kurtarma VPS'inde tam geri-yükleme tatbikatı.
- Gerçek kullanıcıyla rapor anlaşılabilirlik testi.
- Kredi yüklendiğinde sınırlı gerçek AI sağlayıcı testi.
