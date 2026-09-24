# TECH49 — başarısız analiz ve pilot kota UX düzeltmesi

Başarısız analiz isteği daha önce ham İngilizce kota mesajını gösteriyor ve tarama
oluşmadığı hâlde 0 bulgulu kontrol listesini açıyordu. Bu ekran başarılı analiz
izlenimi verdiği için teknik olarak doğru değildi.

API artık aylık sayfa kotası için `MONTHLY_PAGE_QUOTA_REACHED` kodunu döndürüyor.
Türkçe arayüz bu kodu yerelleştiriyor, yeni sonuç oluşturulmadığını ve eski
raporların değişmediğini açıklıyor. Sonuç veya kaydedilmiş demo bulunmadığında
kontrol sayacı yerine tamamlanmış analiz olmadığını belirten boş durum gösteriliyor.
Kaydedilmiş demo ve gerçek raporların kontrol listeleri korunuyor.

Yerel yayın kapısı 40/40 geçti:
`launch-readiness-2026-09-14T22-22-01-851Z.json` (214,8 saniye). Linux üretim
imajı ayrıca OVH üzerinde derlendi; worker kalibrasyonu internete kapalı geçti.
Yayın öncesi veritabanı yedeği başarıyla üretildi.

Canlı parola kapısı, yanlış parola reddi, apex/www, ödeme engeli, İngilizce/Türkçe
boş durum ve Türkçe kota mesajı geçti: `TECH49_VERIFIED`. App sağlıklı, worker
çalışıyor. Geri dönüş dosyası `pilot-images.before-tech49.yml` ve önceki sürüm
TECH48.

Sahip hesabına ödeme veya AI sağlayıcısı açmadan geçici Pro pilot analiz kotası
tanımlandı. Üyelik/ödeme geliştirmesi ertelenmiş durumda; bu test yetkisi o aşamada
yeniden ele alınmalıdır.
