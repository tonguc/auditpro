# TECH34 — çoklu başlık ve açıklama bildirimleri

parse5 okuyucusu ilk title/description değerini saklıyor, sonraki bildirimleri
gizliyordu. Artık document head içindeki bütün title ve name=description
bildirimleri normalize edilmiş, entity çözülmüş belge sırasıyla saklanır.
Template/SVG/script içeriği halen document metadata sayılmaz.

o1/o5 yalnızca dolu metin varlığını ölçer: ilk bildirim boş, ikinci doluysa
"hiç açıklama yok" demez. Pass tek geçerli bildirim veya arama motorunun seçimi
anlamına gelmez. pageResults.declarations kanıtında tüm metinler görülür.
Birden fazla bildirim için TR/EN inceleme açıklaması ve sıra listesi eklenmiştir.

o4/o8 benzersizlik karşılaştırması çoklu bildirimli sayfaları N/A olarak dışlar.
Bu sayfalar eksik açıklama sayısına eklenmez. Diğer sayfalardaki doğrulanmış
tekrarlar Fail satırı olarak korunur; belirsiz kapsamda toplu puan üretilmez.
Tek/eksik bildirim davranışı ve mevcut eski kayıtların görüntülenmesi korunur.

Testler: farklı/aynı çoklu değer, ilk boş ikinci dolu, belirsiz sayfa yanında
gerçek tekrarlar, API/Chromium'da declarations korunması. Hosted test kalıcı
kayıttan ikinci açıklamanın kanıt penceresinde görünmesini doğrular.

Yerel tam QA 40/40 geçti, 137,7 saniye:
launch-readiness-reports/launch-readiness-2026-09-14T11-00-58-289Z.json.
Üretim worker kalibrasyonu ve internete kapalı API/Chromium matrisi geçti.
App/worker 20260914-tech34 yayımlandı: TECH34_VERIFIED.
Hosted testte kaydedilen ikinci açıklama ve çoklu bildirim uyarısı görüldü;
TR/rapor/mobil ve apex/www parola/ödeme kapıları geçti.
Geri dönüş: pilot-images.before-tech34.yml. Eski analizler yeniden çalıştırılmalı.
