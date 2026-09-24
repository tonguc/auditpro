export const TR_AUDIT_TITLES: Record<string, string> = Object.fromEntries(`
serp1|Anahtar kelimede Google ilk 10 görünürlüğü
serp2|Arama amacı ile içerik türünün uyumu
serp3|Kullanıcı ihtiyaçlarının ve bilgi açıklarının karşılanması
serp4|Öne çıkan yanıt fırsatı
serp5|Hedef kitlenin sorularına doğru yanıtlar
serp6|Belirli bir soruya açık yanıt
serp7|Kısa ve taranabilir içerik bölümleri
serp9|Google AI Overview görünümü
serp10|Google AI Overview içinde kaynak gösterilme
serp11|AI yanıtlarında kullanılabilecek içerik yapısı
serp12|Temel sorguların AI yanıtlarında marka görünürlüğü
serp13|AI tarayıcılarının robots.txt erişimi
serp15|Özgün veri ve birinci elden bilgi
serp16|Markanın varlık ve kimlik sinyalleri
serp17|İçeriklerde yazar adı ve biyografisi
serp18|Yazar sayfalarında Person şeması
serp19|Hakkımızda sayfasında uzmanlık ve güvenilirlik
serp20|Güvenilir kaynaklara atıflar
serp21|İçeriklerde insan editör denetimi
t1|robots.txt alımı ve örnek adres kuralları
t2|XML site haritasının varlığı ve geçerliliği
t4|Önemli sayfalarda noindex durumu
t5|Canonical etiketlerinin uygulanması
t6|İç bağlantısı olmayan sayfalar
t7|Ana sayfadan en fazla üç tıklamada erişim
t8|Sayfalama yapısının uygulanması
t9|Yönlendirme zincirleri
t10|Kırık iç bağlantılar (404)
t11|Uluslararası hedefleme ve hreflang etiketleri
t12|Search Console tarama sorunları
t13|JavaScript nedeniyle erişilemeyen ana içerik
t14|Sayfa yolları ve URL parametreleri
t15|En büyük içerik öğesinin yüklenme süresi (LCP)
t16|Etkileşime yanıt süresi (FID / INP)
t17|Görsel düzen kayması (CLS)
t18|Mobil PageSpeed puanı
t19|Masaüstü PageSpeed puanı
t20|Görsel kaynak bildirimleri
t21|Görsel genişlik ve yükseklik bildirimleri
t22|Görsellerin yükleme bildirimleri
t23|Görüntülemeyi engelleyen JavaScript ve CSS
t24|Povlex taramasında yanıt başlıklarını bekleme süresi
t25|Yazı tipi yükleme ayarları
t26|Betiklerin yükleme bildirimleri
t27|SSL sertifikasının geçerliliği ve süresi
t28|İncelenen sayfalarda HTTPS kullanımı
t29|HTTP'den HTTPS'ye yönlendirme
t30|www ve www olmayan adreslerin tutarlılığı
t31|Yanıtlardaki HSTS bildirimleri
t32|HTTPS sayfalarda HTTP kaynakları
t33|Yanıtlardaki güvenlik başlığı bildirimleri
t34|Kaynak kodda veya URL'de hassas veri
t35|Organization yapılandırılmış verisi
t37|İç sayfalarda BreadcrumbList şeması
t38|Ürün sayfalarında Product şeması
t39|Yazılarda Article / BlogPosting şeması
t40|Sık sorulan sorularda FAQ şeması
t41|Değerlendirme ve puan şeması
t42|Search Console şema hataları
t43|Uygun işletmelerde LocalBusiness şeması
t44|Mobil öncelikli dizine ekleme uyumu
t45|Mobil görünüm (viewport) etiketi
t46|Mobilde yatay taşma
t47|Dokunma hedefi boyutları (48 piksel gözlemi)
t48|Mobilde içeriği kapatan ara ekranlar
t49|Haber ve yazı sitelerinde AMP uygulaması
t50|Yol gösteren 404 sayfası
t51|Yetersiz içerikli sayfaların ele alınması
t52|Yinelenen içerik ve canonical kullanımı
t53|HTML içinde site dilinin tanımı
t54|Search Console uluslararası hedeflemesi
t55|Statik kaynaklarda CDN kullanımı
t56|Kontrol edilen adreslerin HTTP yanıtları
t57|Sunucu günlüklerinde tarama verimliliği
t58|Site içi arama sonuçlarının dizin durumu
t59|Filtreli gezinmenin yönetimi
t60|Yazdırma sayfalarının dizin durumu
t61|Oturum ve takip parametrelerinin dizin durumu
t62|İçerik yolu gezinmesi
t63|Site haritasında noindex ve yönlendirme adresleri
t64|İncelenen sayfalardaki yanıt süresi gözlemleri
t65|Search Console trafik ve içerik incelemesi
o1|İncelenen sayfalarda dolu başlık etiketleri
o3|Başlıkta anahtar kelime kullanımı
o4|İncelenen örneklemde benzersiz başlıklar
o5|İncelenen sayfalarda dolu meta açıklamaları
o6|Meta açıklamasında ilgili anahtar kelimeler
o7|Meta açıklamasında açık eylem çağrısı
o8|İncelenen örneklemde benzersiz meta açıklamaları
o9|Open Graph ve Twitter Card etiketleri
o11|H1 başlığında anahtar kelime
o13|Başlık hiyerarşisi (H1–H2–H3)
o14|Alt başlıklarda ilgili anahtar kelimeler
o15|Açıklayıcı bölüm başlıkları
o16|Soru başlıklarında H2 / H3 kullanımı
o17|Başlıklarda aşırı anahtar kelime kullanımı
o21|Sayfalar arası anahtar kelime çakışması
o22|Görsel alternatif metinlerinde ilgili anahtar kelimeler
o23|URL yolunda hedef anahtar kelime
o24|Ayrıntılı arama sorgularının kapsamı
o25|Öne çıkan yanıt için içerik düzeni
o26|Arama amacına uygunluk
o27|Sorgu türüne uygun içerik uzunluğu
o28|İçeriğin özgünlüğü
o29|İçeriğin güncelliği
o30|Yetersiz içeriklerin iyileştirilmesi veya birleştirilmesi
o31|Veri, istatistik ve özgün araştırma kullanımı
o32|Konunun kapsamlı ele alınması
o33|Hedef kitleye uygun okunabilirlik
o35|Yaygın kullanıcı sorularının yanıtlanması
o36|AI içeriklerinde insan denetimi
o37|İç bağlantı stratejisi
o38|Açıklayıcı bağlantı metinleri
o39|Kırık iç bağlantılar
o40|Ana sayfadan önemli sayfalara bağlantılar
o41|İlgili iç kaynaklara bağlantılar
o43|Site genelinde tutarlı gezinme bağlantıları
o44|Dış bağlantı adresleri ve açılma bildirimleri
o45|Yazılarda yazar biyografileri
o46|Hakkımızda sayfasına aday bağlantılar
o47|Sayfalardaki e-posta ve telefon bağlantıları
o48|Ödül, basın ve müşteri güven sinyalleri
o49|Politika sayfalarına aday bağlantılar
o50|Güvenilir dış kaynaklara bağlantılar
u1|Sistem durumunun görünürlüğü
u2|Formlarda alan içi doğrulama geri bildirimi
u3|İşlemlerde açık yüklenme durumu
u4|Kullanıcının anlayacağı arayüz dili
u5|Simgelerin görünür etiketleri
u6|İşlemleri geri alma ve geri dönme
u7|Tarayıcının geri düğmesinin davranışı
u8|Sayfalar arasında görsel tutarlılık
u9|Tutarlı terim kullanımı
u10|Tutarlı düğme stilleri
u11|Geri alınamayan işlemlerde onay
u12|Zorunlu form alanlarının belirtilmesi
u13|Parolayı gösterme ve gizleme
u14|Beklenen giriş biçiminin açıklanması
u15|Gezinmenin görünürlüğü
u16|Aramanın görünürlüğü ve çalışması
u17|Klavye kısayollarının açıklanması
u18|Karmaşık görevlerde yardım
u19|Gereksiz öğelerden arınmış tasarım
u20|Açık görsel hiyerarşi
u21|Sorunu açıklayan hata mesajları
u22|Çözüm öneren hata mesajları
u23|Yeni kullanıcının temel görevi tamamlaması
u24|Tanıdık arayüz kalıpları
u25|Açık gezinme etiketleri
u26|Seçili gezinme öğesinin belirtilmesi
u27|İç sayfalarda içerik yolu
u28|Yararlı alt bilgi gezinmesi
u29|İlgili ve düzenli arama sonuçları
u30|404 sayfasında kullanıcıya yol gösterme
u31|Dokunmatik cihazlarda menü kullanımı
u32|Bilgi mimarisinin kullanıcılarla test edilmesi
u33|Test edilen metinlerde WCAG kontrast kontrolleri
u34|Görsellerde açıklayıcı alternatif metin
u35|Yalnızca klavyeyle gezinme
u36|Etkileşimli öğelerde görünür odak
u37|Test edilen kontrollerde erişilebilir adlar
u38|Kolay mobil gezinme
u39|Mobil girişe uygun formlar
u40|Mobilde içerik önceliğinin korunması
c1|İlk ekranda ana eylem çağrısı
c2|Açık ve eyleme yönelten düğme metni
c3|Eylem düğmesinin görsel kontrastı
c4|Bölüm başına tek ana eylem
c5|Uzun sayfalarda eylem çağrısının tekrarı
c6|Eylem düğmelerinde etkileşim durumları
c7|Farklı ekranlarda ana eylemin görünürlüğü
c8|Mobilde sabit eylem düğmesi
c9|Önemli sayfalarda müşteri görüşleri
c10|Müşteri sayısı, logo ve değerlendirmeler
c11|Güvenli ödeme ve garanti işaretleri
c12|Açık fiyatlandırma
c13|Deneme ve garanti seçenekleri
c14|Örnek çalışmalar ve sonuç verileri
c15|Bağımsız değerlendirme entegrasyonu
c16|Dönüşüm akışında iletişim bilgileri
c17|Form alanları ve zorunluluk bildirimleri
c18|Çok adımlı formlarda ilerleme bilgisi
c19|Formlarda otomatik doldurma bildirimleri
c20|Alan içinde form hataları
c21|Onay sayfasında sonraki adım
c22|Üye olmadan alışveriş
c23|Ödeme adımlarının sayısı
c24|Mobil ödeme ve dönüşüm akışı
c25|Mobilde Apple Pay / Google Pay
c26|Sayfalardaki telefon bağlantısı bildirimleri
c27|Dönüşümü engelleyen mobil açılır pencereler
c28|4G bağlantıda mobil yüklenme süresi
c29|GA4 dönüşüm takibi
c30|Isı haritası ve oturum kaydı
c31|A/B test programı
c32|Dönüşüm hunisinde kayıp noktaları
c33|İlk bölümde değer önerisinin açıklığı
c34|Fiyat sayfasında karşılaştırma
c35|Çıkış niyetine yönelik yaklaşım
`.trim().split('\n').map(line => line.split('|')));

export const TR_SECTIONS: Record<string,string> = {
serp_visibility:'Arama talebi ve sonuç görünürlüğü',aeo:'Yanıt olarak kullanılabilirlik',aio:'Google AI Overview kapsamı',geo:'GEO ve AI görünürlüğü',eeat:'Uzmanlık ve güven sinyalleri',crawl:'Tarama ve dizine ekleme',cwv:'Temel web performansı',https:'HTTPS ve güvenlik',schema:'Yapılandırılmış veri',mobile:'Mobil ve teknik deneyim',intl:'Uluslararası ve ileri kontroller',title:'Başlık ve meta verileri',headings:'Başlıklar ve yapı',keywords:'Anahtar kelime kullanımı',content:'İçerik kalitesi',links:'İç bağlantılar',nielsen15:'Kullanılabilirlik ilkeleri 1–5',nielsen610:'Kullanılabilirlik ilkeleri 6–10',navigation:'Gezinme ve bilgi mimarisi',accessibility:'Erişilebilirlik',mobileux:'Mobil deneyim',cta:'Eylem çağrısı tasarımı',trust:'Güven sinyalleri',forms:'Formlar ve ödeme',mobile_cro:'Mobil dönüşüm',analytics:'Analitik ve test',page:'Sayfa düzeyi'};
