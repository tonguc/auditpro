# Povlex ölçüm envanteri ve kalibrasyon — 16 Eylül 2026

Aktif katalog: 199 kontrol. HTML/HTTP veya tarayıcı bulgusu üreten: 50. Bağlı otomatik bulgusu olmayan: 149. Puana aday olarak izin verilen dar kapsamlı ölçüm: 8.

Bu envanter soru → çalışan ölçüm → puan kararı eşlemesidir. Manuel kontrolün değersiz olduğu veya bütün SEO kriterlerinin bilimsel olarak doğrulandığı iddia edilmez. Yeni/şüpheli yöntemler varsayılan olarak puan dışındadır. Kaynak alanı, motorun bulgu üretmesini gösterir; modelin genel tavsiyesi veya kullanıcı işaretlemesi otomatik kanıt değildir.

## Bulgular ve yapılanlar

- Tüm 199 kontrol katalogda tekil kimlik ve yöntem sınıfıyla kayda alındı:
  8 `verified-bounded`, 42 `observation`, 149 `external-evidence-required`.
  Bu sınıflandırma ve ölçüm regresyonları 16 Eylül 2026'da çalıştırıldı.
- Kalibrasyon görevi, her kontrolün otomatik puan üretip üretemeyeceğini
  fail-closed biçimde belirleme anlamında tamamlandı. Gerçek sitelerde uzman
  etiketi olmadan genel SEO doğruluk oranı veya sıralama etkisi iddia edilmez.

- Etiket varlığı; içerik doğruluğu, şema geçerliliği, güvenlik veya dönüşüm başarısı sayılmıyor.
- HTTP sayfasına normal bağlantı artık gömülü güvensiz kaynakla karıştırılmıyor. Tam mixed-content tespiti için CSS, srcset ve dinamik ağ istekleri de gerekir; bu kontrol tanısaldır.
- Yorum ve script içindeki sahte başlık/metadata puana girmiyor. HTML kaynağı ölçümü JavaScript sonrası içeriğin tam tarayıcı ayrıştırması değildir.
- Bozuk canonical URL analizi çökertmiyor. Canonical doğruluğu puanlanmıyor.
- Birden çok robots etiketi ve none direktifi gözden kaçırılmıyor. Yayıncının indexleme niyeti ve bot kapsamı bilinmeden başarılı/başarısız SEO puanı verilmiyor.
- Görsel uzantısı, HTML boyut özellikleri, tahmini ekran konumu ve async/defer varlığı performans puanı üretmiyor. Core Web Vitals ölçülmedi.
- Başlık/açıklama varlığı ve örnek içindeki tekrarlar dar kontrollerdir; kalite veya bütün site için hüküm değildir. Başlık ve açıklama puan ağırlıkları sıralama etkisinin ölçüsü değildir.
- CTA, alan sayısı, otomatik doldurma, klavye/fokus ve dokunma hedefi sezgileri tanısaldır. İşlev testleri korunmuştur; bağlamsal doğrulama yapılmadan dönüşüm/WCAG başarısı sayılmaz.
- Tarayıcıdaki kontrast ve erişilebilir ad testleri yalnız test edilen düğümleri kapsar. Tüm site erişilebilirliği veya SEO başarısı anlamına gelmez.

## Deney

Üretim analiz fonksiyonları testten de kullanılabilen modüllere ayrıldı. 15 kalibrasyon senaryosu; doğru/eksik metadata, sahte metadata, HTTPS/HTTP, normal bağlantı/gömülü kaynak, bozuk canonical, robots varyasyonları, SVG/CSS/module script/form, geçersiz şema ve iki sayfalı tekrar örneklerini kapsar. Ayrıca gerçek Chromium'da beş ekran boyutuyla doğru/hatalı örnekler kontrast ve erişilebilir ad açısından sınanır.

Çalıştırma: npm run test:measurement-calibration ve npm run test:rendered. İkisi de npm run launch:readiness içinde zorunludur.

## Ürün sonucu

Ölçüm sözleşmesi 0.4.0. Önceki kanıtlar yeniden ölçülmelidir. Eşikler düşürülmedi: mevcut doğrulanmış kapsam genel puan için yeterli değildir. Bu koşulda genel SEO/AI puanı yayımlamak yerine ölçülen bulgular sunulmalıdır. Canlı OVH aktarımı, gerçek domain karşılaştırması, gerçek AI yanıt kalibrasyonu ve harcama yapılmadı.

## Dayanaklar

- [Google robots direktifleri](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag): none, bot kapsamı ve birden çok direktif.
- [Google yapılandırılmış veri ilkeleri](https://developers.google.com/search/docs/appearance/structured-data/sd-policies): içerikle uyum ve gerekli özellikler; tip adının geçmesi yeterli değil.
- [MDN mixed content](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Mixed_content): kaynak yükleme ile normal navigasyon ayrımı.

## Kontrol bazında envanter

| Kimlik | Kategori | Soru | Çalışan kanıt | Karar | Kapsam / gerekçe |
|---|---|---|---|---|---|
| serp1 | GEO & AI Visibility | Site appears in Google top 10 for main keyword | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp2 | GEO & AI Visibility | SERP intent matches content type | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp3 | GEO & AI Visibility | Content addresses relevant user needs and information gaps | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp4 | GEO & AI Visibility | Featured snippet / answer box opportunity detected | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp5 | GEO & AI Visibility | Relevant audience questions are answered accurately | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp6 | GEO & AI Visibility | Content answers a clear, specific question | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp7 | GEO & AI Visibility | Content structured in short, scannable chunks | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp9 | GEO & AI Visibility | Google AI Overview detected for this keyword | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp10 | GEO & AI Visibility | Site cited as source in Google AI Overview | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp11 | GEO & AI Visibility | Content structured for AI answer extraction | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp12 | GEO & AI Visibility | Brand appears in AI-generated answers for core queries | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp13 | GEO & AI Visibility | AI crawlers not blocked in robots.txt | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp15 | GEO & AI Visibility | Content includes unique data, insights or first-hand information | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp16 | GEO & AI Visibility | Brand has entity signals (Knowledge Graph / structured presence) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp17 | GEO & AI Visibility | Author byline and bio on all content pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp18 | GEO & AI Visibility | Person schema markup on author pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp19 | GEO & AI Visibility | About page demonstrates real expertise & credibility | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp20 | GEO & AI Visibility | References high-authority sources (.gov, .edu, research) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| serp21 | GEO & AI Visibility | Content shows human editorial oversight (not raw AI output) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t1 | Technical SEO | robots.txt file exists & is correct | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t2 | Technical SEO | XML sitemap exists and is valid | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t4 | Technical SEO | No important pages are noindex | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t5 | Technical SEO | Canonical tags correctly implemented | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t6 | Technical SEO | No orphan pages (0 internal links) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t7 | Technical SEO | Crawl depth ≤ 3 clicks from homepage | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t8 | Technical SEO | Pagination handled correctly | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t9 | Technical SEO | No redirect chains (max 1 hop) | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t10 | Technical SEO | No broken internal links (404s) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t11 | Technical SEO | International / hreflang tags correct | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t12 | Technical SEO | GSC shows no crawl anomalies | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t13 | Technical SEO | JavaScript not blocking key content | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t14 | Technical SEO | URL structure is clean and descriptive | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t15 | Technical SEO | LCP ≤ 2.5s (Largest Contentful Paint) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t16 | Technical SEO | FID / INP ≤ 200ms (Interaction to Next Paint) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t17 | Technical SEO | CLS ≤ 0.1 (Cumulative Layout Shift) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t18 | Technical SEO | Mobile PageSpeed score ≥ 70 | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t19 | Technical SEO | Desktop PageSpeed score ≥ 85 | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t20 | Technical SEO | Images use WebP / AVIF format | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t21 | Technical SEO | Images have width & height attributes | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t22 | Technical SEO | Lazy loading on below-fold images | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t23 | Technical SEO | Render-blocking JS/CSS minimized | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t24 | Technical SEO | TTFB < 800ms (Time to First Byte) | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t25 | Technical SEO | Font loading optimized (font-display: swap) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t26 | Technical SEO | Third-party scripts deferred or async | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t27 | Technical SEO | SSL certificate valid and not expiring soon | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t28 | Technical SEO | Fetched pages are served over HTTPS | HTML/HTTP | Sınırlı ölçüm; kanıt uygunsa puana aday | Fetched sample uses HTTPS |
| t29 | Technical SEO | HTTP → HTTPS redirect in place | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t30 | Technical SEO | www / non-www canonicalized | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t31 | Technical SEO | HSTS header present | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t32 | Technical SEO | No mixed content (HTTP resources on HTTPS pages) | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t33 | Technical SEO | Security headers present (CSP, X-Frame-Options) | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t34 | Technical SEO | No sensitive data exposed in source or URLs | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t35 | Technical SEO | Organization schema implemented | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t37 | Technical SEO | BreadcrumbList schema on inner pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t38 | Technical SEO | Product schema on product pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t39 | Technical SEO | Article/BlogPosting schema on blog posts | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t40 | Technical SEO | FAQ schema on FAQ pages | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t41 | Technical SEO | Review/Rating schema correct | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t42 | Technical SEO | No schema markup errors in GSC | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t43 | Technical SEO | LocalBusiness schema if applicable | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t44 | Technical SEO | Mobile-first indexing compatible | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t45 | Technical SEO | Viewport meta tag correct | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t46 | Technical SEO | No horizontal scroll on mobile | Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t47 | Technical SEO | Touch target size observation (48px heuristic) | Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t48 | Technical SEO | No intrusive interstitials on mobile | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t49 | Technical SEO | AMP implemented if news/article site | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t50 | Technical SEO | 404 page is helpful and links back to site | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t51 | Technical SEO | Thin content pages handled (noindex or improved) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t52 | Technical SEO | Duplicate content managed via canonicals | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t53 | Technical SEO | Site language correctly declared in HTML tag | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t54 | Technical SEO | International targeting configured in GSC | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t55 | Technical SEO | CDN in use for static assets | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t56 | Technical SEO | Server response codes correct for all pages | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t57 | Technical SEO | Log file analysis shows no crawl waste | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t58 | Technical SEO | Internal search result pages blocked from index | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t59 | Technical SEO | Faceted navigation handled correctly | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t60 | Technical SEO | Print CSS pages not indexed | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t61 | Technical SEO | Session IDs or tracking params not indexed | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t62 | Technical SEO | Breadcrumb navigation present | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t63 | Technical SEO | XML sitemap excludes noindex and redirect URLs | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| t64 | Technical SEO | Site speed consistent across all templates | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| t65 | Technical SEO | No AI-generated content penalties (GSC traffic) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o1 | On-Page & Content | Fetched pages contain nonempty title tags | HTML/HTTP | Sınırlı ölçüm; kanıt uygunsa puana aday | Fetched HTML contains a nonempty title |
| o3 | On-Page & Content | Primary keyword appears in title tag (near start) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o4 | On-Page & Content | Title tags are unique within the fetched sample | HTML/HTTP | Sınırlı ölçüm; kanıt uygunsa puana aday | Title uniqueness within the fetched sample |
| o5 | On-Page & Content | Fetched pages contain nonempty meta descriptions | HTML/HTTP | Sınırlı ölçüm; kanıt uygunsa puana aday | Fetched HTML contains a nonempty meta description |
| o6 | On-Page & Content | Meta description includes primary + secondary keyword | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o7 | On-Page & Content | Meta description has a clear call-to-action | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o8 | On-Page & Content | Meta descriptions are unique within the fetched sample | HTML/HTTP | Sınırlı ölçüm; kanıt uygunsa puana aday | Meta description uniqueness within the fetched sample |
| o9 | On-Page & Content | Open Graph / Twitter Card tags present | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o11 | On-Page & Content | H1 contains primary keyword | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o13 | On-Page & Content | Heading hierarchy correct (H1→H2→H3) | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o14 | On-Page & Content | H2s contain secondary keywords | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o15 | On-Page & Content | Headings are descriptive (not "Section 1") | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o16 | On-Page & Content | FAQ sections use H2/H3 for questions | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o17 | On-Page & Content | No keyword stuffing in headings | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o21 | On-Page & Content | No keyword cannibalization | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o22 | On-Page & Content | Target keyword in image alt text (where relevant) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o23 | On-Page & Content | Target keyword in URL slug | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o24 | On-Page & Content | Long-tail keyword variations covered | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o25 | On-Page & Content | Featured snippet optimization attempted | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o26 | On-Page & Content | Search intent matched correctly | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o27 | On-Page & Content | Content length appropriate for query type | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o28 | On-Page & Content | Content is original (no duplicate or spun) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o29 | On-Page & Content | Content updated regularly (freshness) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o30 | On-Page & Content | Thin content pages improved or consolidated | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o31 | On-Page & Content | Content uses data, stats, or original research | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o32 | On-Page & Content | Content covers topic comprehensively (topical authority) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o33 | On-Page & Content | Readability score appropriate for audience | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o35 | On-Page & Content | Content answers common user questions | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o36 | On-Page & Content | No AI-generated content without human review | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o37 | On-Page & Content | Internal linking strategy in place | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o38 | On-Page & Content | Anchor text is descriptive (not "click here") | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o39 | On-Page & Content | No broken internal links | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o40 | On-Page & Content | Important pages linked from homepage | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o41 | On-Page & Content | Content links to relevant internal resources | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o43 | On-Page & Content | Navigation links consistent across site | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o44 | On-Page & Content | External links open in new tab & are relevant | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o45 | On-Page & Content | Author bios present on all blog/article content | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o46 | On-Page & Content | About page is comprehensive and credible | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o47 | On-Page & Content | Contact information visible on every page | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o48 | On-Page & Content | Trust signals present (awards, press, clients) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| o49 | On-Page & Content | Privacy policy and terms of service present | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| o50 | On-Page & Content | External links point to authoritative sources | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u1 | UX Heuristics | H1: System status always visible (loading, progress) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u2 | UX Heuristics | H1: Forms show inline validation feedback | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u3 | UX Heuristics | H1: Async operations show clear loading state | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u4 | UX Heuristics | H2: UI language matches user language (no jargon) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u5 | UX Heuristics | H2: Icons have visible labels (no icon-only nav) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u6 | UX Heuristics | H3: Users can undo / go back from any action | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u7 | UX Heuristics | H3: Browser back button works as expected | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u8 | UX Heuristics | H4: UI visually consistent across all pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u9 | UX Heuristics | H4: Terminology consistent (same words for same things) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u10 | UX Heuristics | H4: Button styles consistent (primary/secondary/danger) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u11 | UX Heuristics | H5: Destructive actions require confirmation | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u12 | UX Heuristics | H5: Forms have clear required field indicators | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u13 | UX Heuristics | H5: Password show/hide toggle available | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u14 | UX Heuristics | H5: Input fields show expected format (date, phone) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u15 | UX Heuristics | H6: Navigation always visible (not hidden) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u16 | UX Heuristics | H6: Search prominently placed and functional | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u17 | UX Heuristics | H7: Keyboard shortcuts documented if present | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u18 | UX Heuristics | H7: Complex tasks have help/tutorial available | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u19 | UX Heuristics | H8: Minimal design — no unnecessary elements | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u20 | UX Heuristics | H8: Page has clear visual hierarchy | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u21 | UX Heuristics | H9: Error messages explain what went wrong | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u22 | UX Heuristics | H9: Error messages suggest how to fix the issue | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u23 | UX Heuristics | H10: New users can complete core task without help | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u24 | UX Heuristics | H10: Familiar UI patterns used where appropriate | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u25 | UX Heuristics | Navigation labels are clear and unambiguous | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u26 | UX Heuristics | Active navigation state clearly indicated | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u27 | UX Heuristics | Breadcrumbs present on inner pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u28 | UX Heuristics | Footer navigation is comprehensive and useful | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| u29 | UX Heuristics | Search results are relevant and well-formatted | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u30 | UX Heuristics | 404 page helps users recover | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u31 | UX Heuristics | Mega menu / dropdown usable on touch devices | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u32 | UX Heuristics | Information architecture tested with users | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u33 | UX Heuristics | Tested text passes applicable WCAG contrast checks | Tarayıcı | Sınırlı ölçüm; kanıt uygunsa puana aday | Axe text contrast checks on tested nodes |
| u34 | UX Heuristics | All images have descriptive alt text | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| u35 | UX Heuristics | Site fully navigable by keyboard alone | Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| u36 | UX Heuristics | Focus indicators visible on all interactive elements | Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| u37 | UX Heuristics | Tested controls have accessible names | HTML/HTTP + Tarayıcı | Sınırlı ölçüm; kanıt uygunsa puana aday | Axe accessible-name checks on tested nodes |
| u38 | UX Heuristics | Mobile navigation is simple and thumb-friendly | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| u39 | UX Heuristics | Forms are optimized for mobile input | HTML/HTTP + Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| u40 | UX Heuristics | Content priority preserved on mobile | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c1 | Conversion & CTA | Primary CTA visible above the fold | Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| c2 | Conversion & CTA | CTA copy is action-oriented and specific | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c3 | Conversion & CTA | CTA button has strong visual contrast | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c4 | Conversion & CTA | Single primary CTA per page section | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c5 | Conversion & CTA | CTA repeated strategically for long pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c6 | Conversion & CTA | Hover/active states on all CTAs | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c7 | Conversion & CTA | CTA above fold tested across device sizes | Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| c8 | Conversion & CTA | Sticky CTA or sticky header with CTA on mobile | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c9 | Conversion & CTA | Customer testimonials present on key pages | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c10 | Conversion & CTA | Social proof (customer count, logos, reviews) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c11 | Conversion & CTA | Trust badges (secure payment, guarantees) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c12 | Conversion & CTA | Pricing is clear with no hidden fees | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c13 | Conversion & CTA | Risk reversal offered (free trial, guarantee) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c14 | Conversion & CTA | Case studies or results data present | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c15 | Conversion & CTA | Third-party review integration (G2, Trustpilot) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c16 | Conversion & CTA | Contact info visible throughout conversion flow | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c17 | Conversion & CTA | Forms have minimal required fields | HTML/HTTP + Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| c18 | Conversion & CTA | Form progress shown for multi-step forms | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c19 | Conversion & CTA | Auto-fill supported on all form fields | HTML/HTTP + Tarayıcı | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| c20 | Conversion & CTA | Form errors shown inline, not on submit | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c21 | Conversion & CTA | Thank you / confirmation page provides next step | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c22 | Conversion & CTA | Guest checkout available (e-commerce) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c23 | Conversion & CTA | Checkout steps minimized (< 3 steps) | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c24 | Conversion & CTA | Mobile checkout / conversion flow tested | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c25 | Conversion & CTA | Apple Pay / Google Pay available on mobile | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c26 | Conversion & CTA | Phone number is click-to-call on mobile | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| c27 | Conversion & CTA | Mobile popups do not obstruct conversion flow | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c28 | Conversion & CTA | Mobile page load < 3s on 4G connection | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c29 | Conversion & CTA | Conversion tracking set up in GA4 | HTML/HTTP | Tanısal; puan dışı | Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli. |
| c30 | Conversion & CTA | Heatmap / session recording tool in place | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c31 | Conversion & CTA | A/B testing program active | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c32 | Conversion & CTA | Funnel drop-off points identified and addressed | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c33 | Conversion & CTA | Hero section communicates value prop in < 5 secs | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c34 | Conversion & CTA | Pricing page has comparison table | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |
| c35 | Conversion & CTA | Exit intent strategy in place | Otomatik kanıt bağlı değil | Manuel/entegrasyon gerekli; puan dışı | Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı. |

## Son QA sonucu

39/39 zorunlu adım geçti (91,5 saniye). Rapor: launch-readiness-reports/launch-readiness-2026-09-11T16-07-38-852Z.json. Yeni 15 senaryo, gerçek tarayıcı örnekleri, derleme, tip kontrolü ve yerel uygulama akışları dahil. Ayrı PostgreSQL entegrasyonu, canlı OVH doğrulaması ve ücretli AI çağrısı yapılmadı.


Takip: 0.5.0 indeksleme/canonical/sitemap/JSON-LD iyileştirmeleri ve 41 senaryolu test sonucu POVLEX-SEO-MOTORU-05.md dosyasındadır. Puana aday yöntem sayısı 7 olarak korunmuştur.


Takip: 0.6.0 robots/canonical hedef/görünür şema karşılaştırması ve QA sonucu POVLEX-SEO-MOTORU-06.md dosyasındadır. Canlı site güncellenmedi.


Takip: 0.7.0 üç gerçek domain denemesi, tarayıcı kaynak yükleme düzeltmeleri ve 39/39 QA sonucu POVLEX-GERCEK-DOMAIN-DOGRULAMASI.md dosyasındadır.

