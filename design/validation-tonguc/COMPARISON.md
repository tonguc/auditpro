# Tonguckaracay.com — rakip / Povlex doğrulaması

12 Eylül 2026, Türkiye saati. Hedef: https://tonguckaracay.com/.
Povlex motoru: pilot ortamındaki `povlex-worker:20260911-tech08`.

## Sonuç

Rakip ekranındaki önemli yokluk iddiaları mevcut HTTP ve tarayıcı ölçümleriyle
çelişiyor. Ancak Povlex de eksiksiz değil: başarısız sitemap adreslerini rapora
taşımıyor, erişilebilirlik tekrarlarını öğe/sayfa düzeyinde açıklamıyor ve canonical
gözlemlerini kullanıcı için yeterince önceliklendirmiyor. Bu test iki motorun
genel doğruluk oranını veya gerçek AI görünürlüğünü kanıtlamaz.

## Nasıl ölçüldü?

Üretimdeki analiz fonksiyonu izole bir test konteynerinde 250 sayfalık üst sınırla
çalıştırıldı. Bu, normal ücretsiz hesabın 5 sayfalık sınırını değiştirmedi.
Kayıtlı müşteri analizleri değiştirilmedi; ücretli AI çağrısı yapılmadı.
Bağımsız HTTP kontrolleri, tarayıcı DOM incelemesi ve ayrıca axe kontrolü yapıldı.
Axe, Povlex'in de kullandığı motor olduğundan ikinci bir bağımsız erişilebilirlik
algoritması değildir; bu kez öğelerin HTML ve seçicileri ayrıca kaydedildi.

## Kapsam

| Ölçüm | Sonuç |
|---|---:|
| Sitemap girişleri | 98 |
| Başarılı yanıt veren sitemap girişleri | 95 |
| Bunların yönlendirme sonrası benzersiz adresleri | 57 |
| Sitemap dışında bağlantılardan bulunan ek sayfalar | 3 |
| Povlex HTML analizi | 60 benzersiz sayfa |
| Sitemap içinde hata veren adresler | 3 |
| Povlex tarayıcı örneklemi | 3 sayfa × 5 ekran boyutu |
| Puanlamaya uygun kontrol | 6 |
| Puan dışında tutulan tanısal kontrol | 44 |

Başarılı sitemap hedeflerinin tamamı 60 sayfalık sonuçta mevcut. Üç ek adres:
`/en/products`, `/en/products/finance-os`, `/demos/finance-os/index.html`.
98 giriş 98 farklı içerik demek değil; yönlendirmeler aynı adrese birleşiyor.
Bu ölçüm keşfedilen ve sitemap'te yayımlanan adresleri kapsar; bağlantısız/gizli
sayfaları veya farklı dil/çerez/konum senaryolarının tamamını garanti etmez.
Tüm 60 sayfa tarayıcıda/UX açısından test edilmiş değildir.

## Ana sayfa: rakip iddialarının kontrolü

Kök adres mevcut testte `/en` adresine yönlendi. İki Accept başlığıyla HTTP
kontrolü ve gerçek tarayıcı aynı HTML sayfasını aldı.

| Rakip ekranı | Kaydedilen mevcut kanıt |
|---|---|
| Content-Type: text/plain | HTTP 200, text/html; charset=utf-8 |
| Title eksik | SEO & Digital Marketing Consultant \| Tonguç Karaçay |
| Meta description eksik | Dolu açıklama mevcut |
| H1=0; H2=0; H3=0 | H1=1; H2=7; H3=19 |
| Viewport eksik | width=device-width, initial-scale=1 |
| HTML lang eksik | en |
| Canonical eksik | https://tonguckaracay.com/en |
| Görsel=0; script=0 | Tarayıcıda görsel=10; script=24 |
| Organization/Person ve WebSite eksik | Üç JSON-LD bloğunda Person, Organization, WebSite mevcut |
| Open Graph eksik | Altı OG alanı mevcut; og:image bu örnekte yok |

Rakibin o anda hangi yanıtı aldığı bilinmiyor. Yanlış/alternatif yanıtın HTML gibi
yorumlanması olası bir açıklama; kanıtlanmış kök neden değil. JSON-LD varlığı,
semantik doğruluğunu veya arama motorunun kabul ettiğini tek başına göstermez.
34 puanını Povlex puanıyla karşılaştırmak uygun değil: kapsam ve yöntemler farklı.

## Gerçek bulgular ve Povlex'in eksikleri

### 1. Sitemap'teki üç adres sunucu hatası veriyor — Povlex özetinde eksik

- https://tonguckaracay.com/gizlilik-politikasi → `/en/gizlilik-politikasi`
- https://tonguckaracay.com/kullanim-kosullari → `/en/kullanim-kosullari`
- https://tonguckaracay.com/e-ticaret-yerel-seo-rehberi → `/en/e-ticaret-yerel-seo-rehberi`

Bağımsız ilk kontrolde 500. Povlex kullanıcı aracısıyla iki tekrarın her birinde
sırasıyla 500 ve 502 görüldü. Geçici neden ihtimali dışlanmaz; test sırasında
erişim başarısızlığı tekrarlanıyor. Yanlışlıkla sağlıklı sayfa sayılmamalı.

Povlex başarısız yanıtları HTML sayfa listesine almıyor. `t56` ise başka bir
bağlantı örneklemini kontrol edip 64/64 bağlantıda hata yok diyor. Bu sonuç
sitemap'in tamamı için geçerli değil. Başarısız URL envanteri ve açık kapsam
gerekiyor; “hata yok” ifadesi yalnızca gerçekten kontrol edilen kümeye bağlanmalı.

### 2. Hizmet sayfalarında canonical ana sayfayı gösteriyor

- https://tonguckaracay.com/en/services/ui-ux-design
- https://tonguckaracay.com/en/services/seo-consulting

İki sayfanın kendi başlığı ve açıklaması var, canonical ise `/en`.
Bu, araştırılması gereken içerik/hedef uyumsuzluğu. Google'ın seçtiği canonical
ve indeks durumu bu testte ölçülmedi. Povlex `t5` notunda adresleri kaydediyor,
ama uzun genel metin önemli örnekleri geri plana itiyor. İlgili URL ve hedefi
yan yana gösteren açıklayıcı bir bulguya ihtiyaç var.

### 3. Sosyal bağlantıların erişilebilir adı yok

Ana sayfa ve yukarıdaki iki hizmet sayfasında LinkedIn, Instagram ve Behance
ikon bağlantıları axe `link-name` kontrolünde başarısız. Görünür metin veya
uygun erişilebilir ad bulunmuyor. Öğe seçicileri ve HTML `groundtruth.json` içinde.

Povlex 3 sayfa × 3 bağlantı × 5 ekran boyutunu **45 başarısız gözlem** olarak
topluyor. Bu 45 ayrı tasarım kusuru değildir. Sayfa/öğe/ekran boyutu ayrımı ve
ortak bileşen tekrarlarının gruplanması gereklidir. Mevcut özet sayaç yeterli değil.

### 4. Demo sayfasında meta açıklaması yok — doğru gözlem, bağlam gerekli

https://tonguckaracay.com/demos/finance-os/index.html

Povlex 59/60 sayfada açıklama buldu; eksik olan bu demo. Bağımsız tarayıcı da
eksikliği doğruladı. Ana sayfa sorunu değil. Demo'nun arama sonuçlarında yer
alması isteniyor mu bilinmeden yüksek öncelikli pazarlama hatası sayılmamalı.

## Teknik doğruluk için sonraki kabul ölçütleri

1. Keşfedilen her URL'nin başarılı, yönlendi, hata verdi veya atlandı durumunu
   sakla; sitemap 500/502 örneğini regresyon testine ekle.
2. Bulgu ile kaynak sayfa/öğe bağını koru; erişilebilirlikte tekrar sayısını farklı
   sorun sayısından ayır. Üç sayfalık örneklemi tüm siteye genelleme.
3. Canonical gözlemlerini kaynak ve hedef URL ile sun; varlık kontrolünü doğru
   hedef/Google indeksleme sonucu gibi adlandırma.
4. Sayfa türü ve indeksleme amacına göre uygulanabilirlik/öncelik belirle.
5. Bu düzeltmelerden sonra aynı sitenin tekrar taramasını bu kanıtlarla karşılaştır.

Bu çalışma yalnızca doğrulama ve raporlamadır; yukarıdaki ürün eksikleri henüz
düzeltilmedi. Test yayını veya hedef sitenin kodu değiştirilmedi.

## Kanıtlar

- [Povlex ham sonuç](povlex.json)
- [Ana sayfa tarayıcı ölçümü](browser.json)
- [HTTP HTML yanıtı](html-response.txt)
- [Sitemap envanteri ve öğe kanıtı](groundtruth.json)
- [Hata tekrarı](recheck.json)
- [Ana sayfa ekran görüntüsü](homepage.png)
- [Kullanıcının rakip ekranı](../references/aio-optimizer.png)
