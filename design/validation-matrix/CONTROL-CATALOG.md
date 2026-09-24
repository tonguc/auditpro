# Pilot kontrol kapsamı

Bu katalog tüm kontrollerin tamamlandığı iddiası değildir. verified-bounded yalnızca dar ölçümü; observation puan dışı kanıtı; external-evidence-required henüz otomatik ölçülmeyen kapsamı belirtir.

{"verified-bounded":8,"observation":42,"external-evidence-required":149}

| ID | Kontrol | Sınıf | Uygulanabilirlik | Site bağlamı |
|---|---|---|---|---|
| serp1 | Site appears in Google top 10 for main keyword | external-evidence-required | Target intent, market, language and engine/source-specific evidence | GEO/SERP denetimleri hedef anahtar kelime odaklı içerik stratejisinde uygulanır. |
| serp2 | SERP intent matches content type | external-evidence-required | Target intent, market, language and engine/source-specific evidence | SERP niyet uyumu anahtar kelime hedefli her pazar için uygulanır. |
| serp3 | Content addresses relevant user needs and information gaps | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Kullanıcı ihtiyacı uyumu ürün/hizmet ve içerik sayfalarında uygulanır. |
| serp4 | Featured snippet / answer box opportunity detected | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Özet kutu/cevap bölümü fırsatı bilgi odaklı içeriklerde uygulanır. |
| serp5 | Relevant audience questions are answered accurately | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Soru-cevap derinliği destek ve eğitim odaklı içerikte anlamlıdır. |
| serp6 | Content answers a clear, specific question | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Net mesaj odaklı tek amaçlı sayfalarda uygulanır. |
| serp7 | Content structured in short, scannable chunks | external-evidence-required | Target intent, market, language and engine/source-specific evidence | İçerik okunabilirlik akışında uygulanır. |
| serp9 | Google AI Overview detected for this keyword | external-evidence-required | Target intent, market, language and engine/source-specific evidence | AI Overview tespiti motor odaklı içerik denetiminde uygulanır. |
| serp10 | Site cited as source in Google AI Overview | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Marka görünürlüğü AI alıntılarına hizmet odaklı içerikte uygulanır. |
| serp11 | Content structured for AI answer extraction | external-evidence-required | Target intent, market, language and engine/source-specific evidence | AI yanıt çıkarımı için yapı kontrolü bilgi ürünlerinde uygulanır. |
| serp12 | Brand appears in AI-generated answers for core queries | external-evidence-required | Target intent, market, language and engine/source-specific evidence | AI görünürlük denetimi marka konuşma ağında uygulanır. |
| serp13 | AI crawlers not blocked in robots.txt | external-evidence-required | Target intent, market, language and engine/source-specific evidence | AI bot erişimi robots politikası SEO ve GEO hedefli sitelerde uygulanır. |
| serp15 | Content includes unique data, insights or first-hand information | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Orijinal veri/öngörü kontrolleri uzman içerik ve araştırma sitelerinde anlamlıdır. |
| serp16 | Brand has entity signals (Knowledge Graph / structured presence) | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Entity sinyalleri marka profil çabası olan tüm kurumsal sitelerde uygulanır. |
| serp17 | Author byline and bio on all content pages | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Yazar byline denetimi editoryel içerik sunan sitelerde uygulanır. |
| serp18 | Person schema markup on author pages | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Person schema denetimi yazar bazlı içerik sitelerinde uygulanır. |
| serp19 | About page demonstrates real expertise & credibility | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Hakkında güvenilirlik denetimi güven temelli marka sitelerinde anlamlıdır. |
| serp20 | References high-authority sources (.gov, .edu, research) | external-evidence-required | Target intent, market, language and engine/source-specific evidence | Otorite kaynak referansları içerik sayfalarında uygulanır. |
| serp21 | Content shows human editorial oversight (not raw AI output) | external-evidence-required | Target intent, market, language and engine/source-specific evidence | İnsan editleme denetimi üretilen içerik riski olan sitelerde uygulanır. |
| t1 | robots.txt retrieval and sampled-path rules | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Kural tabanlı erişim ve robots politikası SEO giriş kontrolü için her site tipinde gereklidir. |
| t2 | XML sitemap exists and is valid | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Sitemap varlık denetimi tüm siteler için uygulanır; XML varlığın işlevi sektöre göre değişir. |
| t4 | No important pages are noindex | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Noindex denetimi site kapsamlı index stratejisinde geçerlidir; içerik stratejisine göre ayrıştırılmalıdır. |
| t5 | Canonical tags correctly implemented | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Canonical denetimi crawl edilebilir sayfa seti olan tüm siteler için uygulanır. |
| t6 | No orphan pages (0 internal links) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t7 | Crawl depth ≤ 3 clicks from homepage | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t8 | Pagination handled correctly | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Pagination denetimi ürün listeleri, kategori ve haber akışı siteleri için kritik; portföy sitelerinde sınırlı uygulanır. |
| t9 | No redirect chains (max 1 hop) | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t10 | No broken internal links (404s) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t11 | International / hreflang tags correct | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t12 | GSC shows no crawl anomalies | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t13 | JavaScript not blocking key content | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t14 | Page paths and URL parameter declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | URL parametre davranışı query odaklı sitelerde önceliklidir; istatistiksel amaçlı sayfalarda farklı yorumlanır. |
| t15 | LCP ≤ 2.5s (Largest Contentful Paint) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | CWV ölçümleri sadece teknik ölçüm hattı ile tamamlanmalıdır; bu kontrol bir çerçeve yalnızdır. |
| t16 | FID / INP ≤ 200ms (Interaction to Next Paint) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | CWV ölçümleri gerçek kullanıcı davranışı yerine tarayıcı paneli/sentetik ölçümle tamamlanmalıdır. |
| t17 | CLS ≤ 0.1 (Cumulative Layout Shift) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | CLS denetimi medya/tema yoğun sayfalarda önemlidir. |
| t18 | Mobile PageSpeed score ≥ 70 | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobile PageSpeed kontrolü trafik yoğun mobil sitelerde önceliklidir. |
| t19 | Desktop PageSpeed score ≥ 85 | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Desktop CWV kontrolü kurumsal ürün sitelerinde daha anlamlıdır. |
| t20 | Image source declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Görsel envanteri tüm sitelerde uygulanır; kalite yorumu içerik tipine bağlıdır. |
| t21 | Image width and height declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Görsel boyut denetimi medya ağırlıklı sayfalarda daha değerli bir sinyal olur. |
| t22 | Image loading declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Yükleme bildirimi denetimi, çok görsel sayfalarda ve uzun form sayfalarında anlamlıdır. |
| t23 | Render-blocking JS/CSS minimized | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Render-blocking denetimi frontend mimarisine göre sitelerin çoğunda tamamlayıcıdır. |
| t24 | Crawler response-header timing | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Header zamanlaması izleme, sabit CDN davranışı olan yapılarda daha kullanılabilir. |
| t25 | Font loading optimized (font-display: swap) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Font yükleme denetimi tipografi odaklı sitelerde öne çıkar. |
| t26 | Script loading declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Script yükleme denetimi SPA/hybrid yapılarda daha belirleyicidir. |
| t27 | SSL certificate valid and not expiring soon | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | SSL denetimi tüm sitelerde uygulanır. |
| t28 | Fetched pages are served over HTTPS | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | HTTPS servis denetimi temel güvenlik/gibi kontrol olarak evrensel uygulanır. |
| t29 | HTTP → HTTPS redirect in place | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | HTTP→HTTPS yönlendirme denetimi tek domainli üretim yapılarında temel geçerlidir. |
| t30 | www / non-www canonicalized | external-evidence-required | Requires control-specific integration or expert evidence before judgement | www/non-www normalizasyonu marka alanı stratejisinde önemlidir. |
| t31 | HSTS response declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Güvenlik başlık denetimi genel olarak uygulanır; politika yorumu domain özelidir. |
| t32 | No mixed content (HTTP resources on HTTPS pages) | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Mixed content denetimi mixed içerik üreten sitelerde kritiktir. |
| t33 | Security response header declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Güvenlik header denetimi yüksek seviyeli güvenlik politikalarında önemlidir. |
| t34 | No sensitive data exposed in source or URLs | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Gizli veri riski incelemesi ürün/hizmet siteleri için en kritik |
| t35 | Organization schema implemented | observation | Only applicable entity/content types; absence is not a universal defect | Organization schema, markalı siteler için anlamlıdır; tek ürün alt-alanı için zorunlu değildir. |
| t37 | BreadcrumbList schema on inner pages | external-evidence-required | Requires control-specific integration or expert evidence before judgement | BreadcrumbList schema, derin kategori yapısı olan sitelerde uygulanır. |
| t38 | Product schema on product pages | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Product schema, ürün ve e-ticaret kataloglarında uygulanır. |
| t39 | Article/BlogPosting schema on blog posts | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Article/BlogPosting schema, haber/blog yayın sitelerinde uygulanır. |
| t40 | FAQ schema on FAQ pages | observation | Only applicable entity/content types; absence is not a universal defect | FAQ schema, içerik ve destek sayfalarında anlamlıdır. |
| t41 | Review/Rating schema correct | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Review/Rating schema, ürün/paket/servis güven sinyali toplayan sitelerde uygulanır. |
| t42 | No schema markup errors in GSC | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Schema hata denetimi için schema üreten tüm sitelerde uygulanır. |
| t43 | LocalBusiness schema if applicable | observation | Only applicable entity/content types; absence is not a universal defect | LocalBusiness schema, yerel işletme ve ofis hizmeti sunan sitelerde uygulanır. |
| t44 | Mobile-first indexing compatible | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil-first inceleme Google odaklı sitelerde uygulanır. |
| t45 | Viewport meta tag correct | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Viewport denetimi responsive tasarım sunan tüm sitelerde uygulanır. |
| t46 | No horizontal scroll on mobile | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Dokunmatik kaydırma/taşma denetimi mobil öncelikli tüm sitelerde uygulanır. |
| t47 | Touch target size observation (48px heuristic) | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Dokunmatik hedef denetimi özellikle mobil akış odaklı sitelerde anlamlıdır. |
| t48 | No intrusive interstitials on mobile | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kullanıcı deneyimi engelleyicileri her sayfada görülmeli. |
| t49 | AMP implemented if news/article site | external-evidence-required | Requires control-specific integration or expert evidence before judgement | AMP odaklıdır; haber ve uzun metinli yayın sitelerinde geçerlilik kazanır. |
| t50 | 404 page is helpful and links back to site | external-evidence-required | Requires control-specific integration or expert evidence before judgement | 404 deneyimi genel olarak tüm siteler için değerlidir. |
| t51 | Thin content pages handled (noindex or improved) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | İçerik kalitesi denetimi içerik odaklı sitelerde kritik. |
| t52 | Duplicate content managed via canonicals | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Duplicate içerik yönetimi çok sayfalı içerik sitelerinde anlamlıdır. |
| t53 | Site language correctly declared in HTML tag | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Dil bildirimleri tüm çok dilli veya uluslararası hedeflerde önceliklidir. |
| t54 | International targeting configured in GSC | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Uluslararası hedefleme sadece bölgesel/çok dil hedefi olan sitelerde uygulanır. |
| t55 | CDN in use for static assets | external-evidence-required | Requires control-specific integration or expert evidence before judgement | CDN denetimi dağıtık dağıtım yapan sitelerde anlamlı. |
| t56 | Checked addresses return successful HTTP responses | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Genel erişilebilirlik denetimi tüm siteler için bir ön kontrol. |
| t57 | Log file analysis shows no crawl waste | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Log-tabanlı analiz, trafik hacmi yüksek sitelerde operasyonel olarak uygulanır. |
| t58 | Internal search result pages blocked from index | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Arama sonuçları engelleme, e-ticaret olmayan CMS'lar için nadiren kritik. |
| t59 | Faceted navigation handled correctly | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Parametre yönetimi filtreli katalog sitelerinde yüksek önceliklidir. |
| t60 | Print CSS pages not indexed | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Yazdırma CSS denetimi belge yayınlı sitelerde anlamlıdır. |
| t61 | Session IDs or tracking params not indexed | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Takip parametresi denetimi CRM/analitik odaklı sitelerde uygulanır. |
| t62 | Breadcrumb navigation present | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Breadcrumb navigasyon çok seviyeli bilgi mimarisinde anlamlıdır. |
| t63 | XML sitemap excludes noindex and redirect URLs | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Sitemap filtrelenmesi sitenin indeksleme stratejisine göre önem kazanır. |
| t64 | Response-header observations across sampled pages | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Header timing karşılaştırması site şablonu stabilite gerektirir. |
| t65 | No AI-generated content penalties (GSC traffic) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | AI ceza/performans denetimi reklam ve içerik hacimli sitelerde anlamlıdır. |
| o1 | Fetched pages contain nonempty title tags | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Genel metin ve başlık denetimi, yayınlanan tüm sayfalara uygulanır. |
| o3 | Primary keyword appears in title tag (near start) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o4 | Title tags are unique within the fetched sample | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Başlık eşsizliği sadece karşılaştırılan sayfalar için anlamlıdır; site tipine göre varyasyon kabul edilebilir. |
| o5 | Fetched pages contain nonempty meta descriptions | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Meta açıklama denetimi tüm sayfalar için uygulanır; içerik ağırlığı ve reklam formatına göre fark doğar. |
| o6 | Meta description includes primary + secondary keyword | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o7 | Meta description has a clear call-to-action | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o8 | Meta descriptions are unique within the fetched sample | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Meta açıklama benzersizliği karşılaştırmalı olarak ve minimum iki sayfa olduğunda değerlendirilir. |
| o9 | Open Graph / Twitter Card tags present | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o11 | H1 contains primary keyword | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o13 | Heading hierarchy correct (H1→H2→H3) | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o14 | H2s contain secondary keywords | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o15 | Headings are descriptive (not "Section 1") | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o16 | FAQ sections use H2/H3 for questions | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o17 | No keyword stuffing in headings | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o21 | No keyword cannibalization | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o22 | Target keyword in image alt text (where relevant) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o23 | Target keyword in URL slug | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o24 | Long-tail keyword variations covered | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o25 | Featured snippet optimization attempted | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o26 | Search intent matched correctly | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o27 | Content length appropriate for query type | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o28 | Content is original (no duplicate or spun) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o29 | Content updated regularly (freshness) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o30 | Thin content pages improved or consolidated | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o31 | Content uses data, stats, or original research | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o32 | Content covers topic comprehensively (topical authority) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o33 | Readability score appropriate for audience | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o35 | Content answers common user questions | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o36 | No AI-generated content without human review | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o37 | Internal linking strategy in place | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o38 | Anchor text is descriptive (not "click here") | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o39 | No broken internal links | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o40 | Important pages linked from homepage | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o41 | Content links to relevant internal resources | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o43 | Navigation links consistent across site | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o44 | External link targets and rel declarations | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o45 | Author bios present on all blog/article content | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o46 | About-page navigation candidates | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o47 | Email and phone link declarations by page | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o48 | Trust signals present (awards, press, clients) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o49 | Policy-page navigation candidates | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o50 | External links point to authoritative sources | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| u1 | H1: System status always visible (loading, progress) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Teknik durum göstergeleri tüm sitelerde uygulanır. |
| u2 | H1: Forms show inline validation feedback | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Form/inceleme alanlarında inline validasyon varsa bu bir kalite denetimidir. |
| u3 | H1: Async operations show clear loading state | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Asenkron durum göstergesi etkileşim odaklı sayfalarda uygulanır. |
| u4 | H2: UI language matches user language (no jargon) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Dil tutarlılığı kullanıcı deneyimi metin ağırlıklı her sayfada önemlidir. |
| u5 | H2: Icons have visible labels (no icon-only nav) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | İkon etiket kontrolü gezinti yoğun sayfalarda uygulanır. |
| u6 | H3: Users can undo / go back from any action | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Undo/geri dönüş kontrolü çok adımlı akışlarda önemlidir. |
| u7 | H3: Browser back button works as expected | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Back-button davranışı genel olarak tüm uygulamalarda kontrol edilir. |
| u8 | H4: UI visually consistent across all pages | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Görsel tutarlılık çoklu sayfalı sitelerde uygulanır. |
| u9 | H4: Terminology consistent (same words for same things) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Terminoloji tutarlılığı marka dili güçlü sitelerde uygulanır. |
| u10 | H4: Button styles consistent (primary/secondary/danger) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Buton stilleri ürün ve form odaklı sitelerde daha belirleyicidir. |
| u11 | H5: Destructive actions require confirmation | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kritik eylemler için onay ekranları güvenli ürün satış sitelerinde zorunludur. |
| u12 | H5: Forms have clear required field indicators | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Form işaretleme denetimi form toplama hedefi olan her sayfada uygulanır. |
| u13 | H5: Password show/hide toggle available | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Şifre göster/gizle denetimi auth akışı olan sayfalarda uygulanır. |
| u14 | H5: Input fields show expected format (date, phone) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Format yönergesi etkileşim alanlarında form girişlerinde uygulanır. |
| u15 | H6: Navigation always visible (not hidden) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Navigasyon görünürlüğü sitenin tüm ana akışlarında uygulanır. |
| u16 | H6: Search prominently placed and functional | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Arama fonksiyonu olan sitelerde aranabilirlik denetimi uygulanır. |
| u17 | H7: Keyboard shortcuts documented if present | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Klavye kısayol dokümantasyonu var ise yönlendiricili ürünlerde önemlidir. |
| u18 | H7: Complex tasks have help/tutorial available | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Yardım dokümantasyonu eğitim gerektiren karmaşık akışlarda uygulanır. |
| u19 | H8: Minimal design — no unnecessary elements | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Minimalist gereksinimi marka ve ürün hedefine göre değişken yorumlanır. |
| u20 | H8: Page has clear visual hierarchy | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Görsel hiyerarşi kullanıcı odaklı deneyimlerde uygulanır. |
| u21 | H9: Error messages explain what went wrong | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Hata mesajı kalitesi aksiyon odaklı arayüzlerde uygulanır. |
| u22 | H9: Error messages suggest how to fix the issue | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Hata iyileştirme yönlendirmeleri aksiyon odaklı akışlarda uygulanır. |
| u23 | H10: New users can complete core task without help | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kullanıcı ilk turu tamamlaması için onboarding denetimi ürün eğitimli sitelerde uygulanır. |
| u24 | H10: Familiar UI patterns used where appropriate | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kullanıcı dostu kalıplar karmaşık ürünlerde uygulanır. |
| u25 | Navigation labels are clear and unambiguous | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Net navigasyon etiketleri ürün ve içerik sitelerinde kritik. |
| u26 | Active navigation state clearly indicated | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Aktif nav durumu yönlendirme yoğun menülerde uygulanır. |
| u27 | Breadcrumbs present on inner pages | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kenar menü/breadcrumb işlevi derin içerikte uygulanır. |
| u28 | Footer navigation is comprehensive and useful | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Footer kullanım denetimi bilgilendirici sayfa yapılarında uygulanır. |
| u29 | Search results are relevant and well-formatted | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Arama sonuç kalitesi denetimi içerik/ürün keşif sayfalarında uygulanır. |
| u30 | 404 page helps users recover | external-evidence-required | Requires control-specific integration or expert evidence before judgement | 404 kurtarma deneyimi destek/kurumsal sitelerde kritik. |
| u31 | Mega menu / dropdown usable on touch devices | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil menü kullanım denetimi ürün/hizmet akışı menülerinde uygulanır. |
| u32 | Information architecture tested with users | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kullanıcı testleri kullanıcı bulgusu olan projelerde ayrı kanıtla uygulanır. |
| u33 | Tested text passes applicable WCAG contrast checks | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Kontrast denetimi tüm sayfalarda uygulanır. |
| u34 | All images have descriptive alt text | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Alt metin denetimi görsel içeriği olan her sayfada uygulanır. |
| u35 | Site fully navigable by keyboard alone | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Klavye navigasyonu etkileşimli akışlarda uygulanır. |
| u36 | Focus indicators visible on all interactive elements | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | Odak belirginliği odaklı kullanılabilirlik standartlarında uygulanır. |
| u37 | Tested controls have accessible names | verified-bounded | Fetched/rendered sample only; missing/incomplete data remains unknown | Erişilebilir ad denetimi test edilen kontrol seti için geçerlidir. |
| u38 | Mobile navigation is simple and thumb-friendly | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil navigasyon denetimi mobil ürün/hizmet sitelerinde uygulanır. |
| u39 | Forms are optimized for mobile input | observation | Only relevant controls/forms and their actual purpose; absence is not failure | Mobil form uyumluluğu yalnızca form bulunan akışlarda uygulanır. |
| u40 | Content priority preserved on mobile | external-evidence-required | Requires control-specific integration or expert evidence before judgement | İçerik önceliği içeriğin anlaşıldığı sayfalarda uygulanır |
| c1 | Primary CTA visible above the fold | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | CTA görünürlük denetimi dönüşüm hedefi olan sayfalarda uygulanır. |
| c2 | CTA copy is action-oriented and specific | external-evidence-required | Requires control-specific integration or expert evidence before judgement | CTA metni denetimi satış akış sayfalarında kritik. |
| c3 | CTA button has strong visual contrast | external-evidence-required | Requires control-specific integration or expert evidence before judgement | CTA kontrast denetimi buton-dominant sayfalarda önemlidir. |
| c4 | Single primary CTA per page section | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Tek CTA prensibi uzun satış akışlı sayfalarda özellikle önemlidir. |
| c5 | CTA repeated strategically for long pages | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Tekrarlanan CTA denetimi uzun içerik akışlarında uygulanır. |
| c6 | Hover/active states on all CTAs | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Hover/active durum denetimi interaktif butonlu ürün sayfalarında anlamlıdır. |
| c7 | CTA above fold tested across device sizes | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | CTA görünürlüğü akış testi mobil/masaüstü dağılımı olan satış ve kayıt sayfalarında uygulanır. |
| c8 | Sticky CTA or sticky header with CTA on mobile | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Sticky CTA denetimi mobil dönüşüm sayfaları için önemlidir. |
| c9 | Customer testimonials present on key pages | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Müşteri referansları güven odaklı sayfalarda uygulanır. |
| c10 | Social proof (customer count, logos, reviews) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Sosyal kanıt denetimi hizmet ve ürün satış sitelerinde anlamlıdır. |
| c11 | Trust badges (secure payment, guarantees) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Güven rozetleri ödeme veya güvene dayalı dönüşüm sunan sitelerde uygulanır. |
| c12 | Pricing is clear with no hidden fees | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Fiyat şeffaflığı ücretli ürün/satış sayfalarında uygulanır. |
| c13 | Risk reversal offered (free trial, guarantee) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Risk azaltıcı öğeler (garanti/deneme) abonelik ve satın alım sitelerinde uygulanır. |
| c14 | Case studies or results data present | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Vaka çalışması denetimi danışmanlık ve B2B satış sitelerinde uygulanır. |
| c15 | Third-party review integration (G2, Trustpilot) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Üçüncü parti review entegrasyonu review varlığı olan sitelerde uygulanır. |
| c16 | Contact info visible throughout conversion flow | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Sürekli temas numarası isteyen sitelerde uygulanır. |
| c17 | Form fields and required declarations | observation | Only relevant controls/forms and their actual purpose; absence is not failure | Form alan denetimi form barındıran sayfalarda uygulanır. |
| c18 | Form progress shown for multi-step forms | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Çok adımlı form denetimi form akışı olan satış/hizmet sitelerinde uygulanır. |
| c19 | Form autocomplete declarations | observation | Only relevant controls/forms and their actual purpose; absence is not failure | Autofill denetimi form davranışını etkileyen sitelerde uygulanır. |
| c20 | Form errors shown inline, not on submit | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Inline hata denetimi etkileşimli formlarda uygulanır. |
| c21 | Thank you / confirmation page provides next step | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Onay sonrası yönlendirme denetimi dönüşüm tamamlayan akışlarda uygulanır. |
| c22 | Guest checkout available (e-commerce) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Guest checkout yalnızca e-ticaret akışlarında geçerli bir kontrol. |
| c23 | Checkout steps minimized (< 3 steps) | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Checkout adım kontrolü ödeme yolculuğu bulunan siteler için anlamlıdır. |
| c24 | Mobile checkout / conversion flow tested | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil dönüşüm akışı denetimi satış/ürün/lead sitelerinde uygulanır. |
| c25 | Apple Pay / Google Pay available on mobile | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil ödeme yöntemi denetimi mobil ödeme sunan sitelerde uygulanır. |
| c26 | Phone link declarations by page | observation | Only relevant controls/forms and their actual purpose; absence is not failure | Telefon etiketleri hizmet odaklı ve acil iletişim sayfalarında uygulanır. |
| c27 | Mobile popups do not obstruct conversion flow | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil popup denetimi mobil dönüşüm odaklı sitelerde önemlidir. |
| c28 | Mobile page load < 3s on 4G connection | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Mobil yüklenme denetimi yüksek trafiğe sahip ve satış odaklı sayfalarda uygulanır. |
| c29 | Conversion tracking set up in GA4 | observation | Fetched/rendered sample only; missing/incomplete data remains unknown | GA4 dönüşüm ölçüm altyapısı varsa uygulanır; yoksa eksik bir eksiklik olarak işaretlenir. |
| c30 | Heatmap / session recording tool in place | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Kullanıcı davranış kaydı araçları ölçüm altyapısı olan sitelerde anlamlıdır. |
| c31 | A/B testing program active | external-evidence-required | Requires control-specific integration or expert evidence before judgement | A/B test altyapısı bulunan sitelerde uygulanır. |
| c32 | Funnel drop-off points identified and addressed | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Funnel düşüş noktası analizi conversion takibi yapılan sitelerde uygulanır. |
| c33 | Hero section communicates value prop in < 5 secs | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Hero mesajı denetimi değer önerisi ön planda olan landing sayfalarda uygulanır. |
| c34 | Pricing page has comparison table | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Fiyatlandırma karşılaştırması ücretli/plan sunan sitelerde uygulanır. |
| c35 | Exit intent strategy in place | external-evidence-required | Requires control-specific integration or expert evidence before judgement | Exit-intent denetimi dönüşüm odaklı sitelerde uygulanır. |

## Site bağlamı özet matrisi

| ID | Kontrol | Site bağlamı |
|---|---|---|
| serp1 | Site appears in Google top 10 for main keyword | GEO/SERP denetimleri hedef anahtar kelime odaklı içerik stratejisinde uygulanır. |
| serp2 | SERP intent matches content type | SERP niyet uyumu anahtar kelime hedefli her pazar için uygulanır. |
| serp3 | Content addresses relevant user needs and information gaps | Kullanıcı ihtiyacı uyumu ürün/hizmet ve içerik sayfalarında uygulanır. |
| serp4 | Featured snippet / answer box opportunity detected | Özet kutu/cevap bölümü fırsatı bilgi odaklı içeriklerde uygulanır. |
| serp5 | Relevant audience questions are answered accurately | Soru-cevap derinliği destek ve eğitim odaklı içerikte anlamlıdır. |
| serp6 | Content answers a clear, specific question | Net mesaj odaklı tek amaçlı sayfalarda uygulanır. |
| serp7 | Content structured in short, scannable chunks | İçerik okunabilirlik akışında uygulanır. |
| serp9 | Google AI Overview detected for this keyword | AI Overview tespiti motor odaklı içerik denetiminde uygulanır. |
| serp10 | Site cited as source in Google AI Overview | Marka görünürlüğü AI alıntılarına hizmet odaklı içerikte uygulanır. |
| serp11 | Content structured for AI answer extraction | AI yanıt çıkarımı için yapı kontrolü bilgi ürünlerinde uygulanır. |
| serp12 | Brand appears in AI-generated answers for core queries | AI görünürlük denetimi marka konuşma ağında uygulanır. |
| serp13 | AI crawlers not blocked in robots.txt | AI bot erişimi robots politikası SEO ve GEO hedefli sitelerde uygulanır. |
| serp15 | Content includes unique data, insights or first-hand information | Orijinal veri/öngörü kontrolleri uzman içerik ve araştırma sitelerinde anlamlıdır. |
| serp16 | Brand has entity signals (Knowledge Graph / structured presence) | Entity sinyalleri marka profil çabası olan tüm kurumsal sitelerde uygulanır. |
| serp17 | Author byline and bio on all content pages | Yazar byline denetimi editoryel içerik sunan sitelerde uygulanır. |
| serp18 | Person schema markup on author pages | Person schema denetimi yazar bazlı içerik sitelerinde uygulanır. |
| serp19 | About page demonstrates real expertise & credibility | Hakkında güvenilirlik denetimi güven temelli marka sitelerinde anlamlıdır. |
| serp20 | References high-authority sources (.gov, .edu, research) | Otorite kaynak referansları içerik sayfalarında uygulanır. |
| serp21 | Content shows human editorial oversight (not raw AI output) | İnsan editleme denetimi üretilen içerik riski olan sitelerde uygulanır. |
| t1 | robots.txt retrieval and sampled-path rules | Kural tabanlı erişim ve robots politikası SEO giriş kontrolü için her site tipinde gereklidir. |
| t2 | XML sitemap exists and is valid | Sitemap varlık denetimi tüm siteler için uygulanır; XML varlığın işlevi sektöre göre değişir. |
| t4 | No important pages are noindex | Noindex denetimi site kapsamlı index stratejisinde geçerlidir; içerik stratejisine göre ayrıştırılmalıdır. |
| t5 | Canonical tags correctly implemented | Canonical denetimi crawl edilebilir sayfa seti olan tüm siteler için uygulanır. |
| t6 | No orphan pages (0 internal links) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t7 | Crawl depth ≤ 3 clicks from homepage | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t8 | Pagination handled correctly | Pagination denetimi ürün listeleri, kategori ve haber akışı siteleri için kritik; portföy sitelerinde sınırlı uygulanır. |
| t9 | No redirect chains (max 1 hop) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t10 | No broken internal links (404s) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t11 | International / hreflang tags correct | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t12 | GSC shows no crawl anomalies | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t13 | JavaScript not blocking key content | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| t14 | Page paths and URL parameter declarations | URL parametre davranışı query odaklı sitelerde önceliklidir; istatistiksel amaçlı sayfalarda farklı yorumlanır. |
| t15 | LCP ≤ 2.5s (Largest Contentful Paint) | CWV ölçümleri sadece teknik ölçüm hattı ile tamamlanmalıdır; bu kontrol bir çerçeve yalnızdır. |
| t16 | FID / INP ≤ 200ms (Interaction to Next Paint) | CWV ölçümleri gerçek kullanıcı davranışı yerine tarayıcı paneli/sentetik ölçümle tamamlanmalıdır. |
| t17 | CLS ≤ 0.1 (Cumulative Layout Shift) | CLS denetimi medya/tema yoğun sayfalarda önemlidir. |
| t18 | Mobile PageSpeed score ≥ 70 | Mobile PageSpeed kontrolü trafik yoğun mobil sitelerde önceliklidir. |
| t19 | Desktop PageSpeed score ≥ 85 | Desktop CWV kontrolü kurumsal ürün sitelerinde daha anlamlıdır. |
| t20 | Image source declarations | Görsel envanteri tüm sitelerde uygulanır; kalite yorumu içerik tipine bağlıdır. |
| t21 | Image width and height declarations | Görsel boyut denetimi medya ağırlıklı sayfalarda daha değerli bir sinyal olur. |
| t22 | Image loading declarations | Yükleme bildirimi denetimi, çok görsel sayfalarda ve uzun form sayfalarında anlamlıdır. |
| t23 | Render-blocking JS/CSS minimized | Render-blocking denetimi frontend mimarisine göre sitelerin çoğunda tamamlayıcıdır. |
| t24 | Crawler response-header timing | Header zamanlaması izleme, sabit CDN davranışı olan yapılarda daha kullanılabilir. |
| t25 | Font loading optimized (font-display: swap) | Font yükleme denetimi tipografi odaklı sitelerde öne çıkar. |
| t26 | Script loading declarations | Script yükleme denetimi SPA/hybrid yapılarda daha belirleyicidir. |
| t27 | SSL certificate valid and not expiring soon | SSL denetimi tüm sitelerde uygulanır. |
| t28 | Fetched pages are served over HTTPS | HTTPS servis denetimi temel güvenlik/gibi kontrol olarak evrensel uygulanır. |
| t29 | HTTP → HTTPS redirect in place | HTTP→HTTPS yönlendirme denetimi tek domainli üretim yapılarında temel geçerlidir. |
| t30 | www / non-www canonicalized | www/non-www normalizasyonu marka alanı stratejisinde önemlidir. |
| t31 | HSTS response declarations | Güvenlik başlık denetimi genel olarak uygulanır; politika yorumu domain özelidir. |
| t32 | No mixed content (HTTP resources on HTTPS pages) | Mixed content denetimi mixed içerik üreten sitelerde kritiktir. |
| t33 | Security response header declarations | Güvenlik header denetimi yüksek seviyeli güvenlik politikalarında önemlidir. |
| t34 | No sensitive data exposed in source or URLs | Gizli veri riski incelemesi ürün/hizmet siteleri için en kritik |
| t35 | Organization schema implemented | Organization schema, markalı siteler için anlamlıdır; tek ürün alt-alanı için zorunlu değildir. |
| t37 | BreadcrumbList schema on inner pages | BreadcrumbList schema, derin kategori yapısı olan sitelerde uygulanır. |
| t38 | Product schema on product pages | Product schema, ürün ve e-ticaret kataloglarında uygulanır. |
| t39 | Article/BlogPosting schema on blog posts | Article/BlogPosting schema, haber/blog yayın sitelerinde uygulanır. |
| t40 | FAQ schema on FAQ pages | FAQ schema, içerik ve destek sayfalarında anlamlıdır. |
| t41 | Review/Rating schema correct | Review/Rating schema, ürün/paket/servis güven sinyali toplayan sitelerde uygulanır. |
| t42 | No schema markup errors in GSC | Schema hata denetimi için schema üreten tüm sitelerde uygulanır. |
| t43 | LocalBusiness schema if applicable | LocalBusiness schema, yerel işletme ve ofis hizmeti sunan sitelerde uygulanır. |
| t44 | Mobile-first indexing compatible | Mobil-first inceleme Google odaklı sitelerde uygulanır. |
| t45 | Viewport meta tag correct | Viewport denetimi responsive tasarım sunan tüm sitelerde uygulanır. |
| t46 | No horizontal scroll on mobile | Dokunmatik kaydırma/taşma denetimi mobil öncelikli tüm sitelerde uygulanır. |
| t47 | Touch target size observation (48px heuristic) | Dokunmatik hedef denetimi özellikle mobil akış odaklı sitelerde anlamlıdır. |
| t48 | No intrusive interstitials on mobile | Kullanıcı deneyimi engelleyicileri her sayfada görülmeli. |
| t49 | AMP implemented if news/article site | AMP odaklıdır; haber ve uzun metinli yayın sitelerinde geçerlilik kazanır. |
| t50 | 404 page is helpful and links back to site | 404 deneyimi genel olarak tüm siteler için değerlidir. |
| t51 | Thin content pages handled (noindex or improved) | İçerik kalitesi denetimi içerik odaklı sitelerde kritik. |
| t52 | Duplicate content managed via canonicals | Duplicate içerik yönetimi çok sayfalı içerik sitelerinde anlamlıdır. |
| t53 | Site language correctly declared in HTML tag | Dil bildirimleri tüm çok dilli veya uluslararası hedeflerde önceliklidir. |
| t54 | International targeting configured in GSC | Uluslararası hedefleme sadece bölgesel/çok dil hedefi olan sitelerde uygulanır. |
| t55 | CDN in use for static assets | CDN denetimi dağıtık dağıtım yapan sitelerde anlamlı. |
| t56 | Checked addresses return successful HTTP responses | Genel erişilebilirlik denetimi tüm siteler için bir ön kontrol. |
| t57 | Log file analysis shows no crawl waste | Log-tabanlı analiz, trafik hacmi yüksek sitelerde operasyonel olarak uygulanır. |
| t58 | Internal search result pages blocked from index | Arama sonuçları engelleme, e-ticaret olmayan CMS'lar için nadiren kritik. |
| t59 | Faceted navigation handled correctly | Parametre yönetimi filtreli katalog sitelerinde yüksek önceliklidir. |
| t60 | Print CSS pages not indexed | Yazdırma CSS denetimi belge yayınlı sitelerde anlamlıdır. |
| t61 | Session IDs or tracking params not indexed | Takip parametresi denetimi CRM/analitik odaklı sitelerde uygulanır. |
| t62 | Breadcrumb navigation present | Breadcrumb navigasyon çok seviyeli bilgi mimarisinde anlamlıdır. |
| t63 | XML sitemap excludes noindex and redirect URLs | Sitemap filtrelenmesi sitenin indeksleme stratejisine göre önem kazanır. |
| t64 | Response-header observations across sampled pages | Header timing karşılaştırması site şablonu stabilite gerektirir. |
| t65 | No AI-generated content penalties (GSC traffic) | AI ceza/performans denetimi reklam ve içerik hacimli sitelerde anlamlıdır. |
| o1 | Fetched pages contain nonempty title tags | Genel metin ve başlık denetimi, yayınlanan tüm sayfalara uygulanır. |
| o3 | Primary keyword appears in title tag (near start) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o4 | Title tags are unique within the fetched sample | Başlık eşsizliği sadece karşılaştırılan sayfalar için anlamlıdır; site tipine göre varyasyon kabul edilebilir. |
| o5 | Fetched pages contain nonempty meta descriptions | Meta açıklama denetimi tüm sayfalar için uygulanır; içerik ağırlığı ve reklam formatına göre fark doğar. |
| o6 | Meta description includes primary + secondary keyword | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o7 | Meta description has a clear call-to-action | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o8 | Meta descriptions are unique within the fetched sample | Meta açıklama benzersizliği karşılaştırmalı olarak ve minimum iki sayfa olduğunda değerlendirilir. |
| o9 | Open Graph / Twitter Card tags present | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o11 | H1 contains primary keyword | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o13 | Heading hierarchy correct (H1→H2→H3) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o14 | H2s contain secondary keywords | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o15 | Headings are descriptive (not "Section 1") | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o16 | FAQ sections use H2/H3 for questions | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o17 | No keyword stuffing in headings | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o21 | No keyword cannibalization | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o22 | Target keyword in image alt text (where relevant) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o23 | Target keyword in URL slug | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o24 | Long-tail keyword variations covered | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o25 | Featured snippet optimization attempted | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o26 | Search intent matched correctly | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o27 | Content length appropriate for query type | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o28 | Content is original (no duplicate or spun) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o29 | Content updated regularly (freshness) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o30 | Thin content pages improved or consolidated | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o31 | Content uses data, stats, or original research | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o32 | Content covers topic comprehensively (topical authority) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o33 | Readability score appropriate for audience | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o35 | Content answers common user questions | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o36 | No AI-generated content without human review | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o37 | Internal linking strategy in place | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o38 | Anchor text is descriptive (not "click here") | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o39 | No broken internal links | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o40 | Important pages linked from homepage | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o41 | Content links to relevant internal resources | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o43 | Navigation links consistent across site | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o44 | External link targets and rel declarations | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o45 | Author bios present on all blog/article content | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o46 | About-page navigation candidates | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o47 | Email and phone link declarations by page | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o48 | Trust signals present (awards, press, clients) | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o49 | Policy-page navigation candidates | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| o50 | External links point to authoritative sources | Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır. |
| u1 | H1: System status always visible (loading, progress) | Teknik durum göstergeleri tüm sitelerde uygulanır. |
| u2 | H1: Forms show inline validation feedback | Form/inceleme alanlarında inline validasyon varsa bu bir kalite denetimidir. |
| u3 | H1: Async operations show clear loading state | Asenkron durum göstergesi etkileşim odaklı sayfalarda uygulanır. |
| u4 | H2: UI language matches user language (no jargon) | Dil tutarlılığı kullanıcı deneyimi metin ağırlıklı her sayfada önemlidir. |
| u5 | H2: Icons have visible labels (no icon-only nav) | İkon etiket kontrolü gezinti yoğun sayfalarda uygulanır. |
| u6 | H3: Users can undo / go back from any action | Undo/geri dönüş kontrolü çok adımlı akışlarda önemlidir. |
| u7 | H3: Browser back button works as expected | Back-button davranışı genel olarak tüm uygulamalarda kontrol edilir. |
| u8 | H4: UI visually consistent across all pages | Görsel tutarlılık çoklu sayfalı sitelerde uygulanır. |
| u9 | H4: Terminology consistent (same words for same things) | Terminoloji tutarlılığı marka dili güçlü sitelerde uygulanır. |
| u10 | H4: Button styles consistent (primary/secondary/danger) | Buton stilleri ürün ve form odaklı sitelerde daha belirleyicidir. |
| u11 | H5: Destructive actions require confirmation | Kritik eylemler için onay ekranları güvenli ürün satış sitelerinde zorunludur. |
| u12 | H5: Forms have clear required field indicators | Form işaretleme denetimi form toplama hedefi olan her sayfada uygulanır. |
| u13 | H5: Password show/hide toggle available | Şifre göster/gizle denetimi auth akışı olan sayfalarda uygulanır. |
| u14 | H5: Input fields show expected format (date, phone) | Format yönergesi etkileşim alanlarında form girişlerinde uygulanır. |
| u15 | H6: Navigation always visible (not hidden) | Navigasyon görünürlüğü sitenin tüm ana akışlarında uygulanır. |
| u16 | H6: Search prominently placed and functional | Arama fonksiyonu olan sitelerde aranabilirlik denetimi uygulanır. |
| u17 | H7: Keyboard shortcuts documented if present | Klavye kısayol dokümantasyonu var ise yönlendiricili ürünlerde önemlidir. |
| u18 | H7: Complex tasks have help/tutorial available | Yardım dokümantasyonu eğitim gerektiren karmaşık akışlarda uygulanır. |
| u19 | H8: Minimal design — no unnecessary elements | Minimalist gereksinimi marka ve ürün hedefine göre değişken yorumlanır. |
| u20 | H8: Page has clear visual hierarchy | Görsel hiyerarşi kullanıcı odaklı deneyimlerde uygulanır. |
| u21 | H9: Error messages explain what went wrong | Hata mesajı kalitesi aksiyon odaklı arayüzlerde uygulanır. |
| u22 | H9: Error messages suggest how to fix the issue | Hata iyileştirme yönlendirmeleri aksiyon odaklı akışlarda uygulanır. |
| u23 | H10: New users can complete core task without help | Kullanıcı ilk turu tamamlaması için onboarding denetimi ürün eğitimli sitelerde uygulanır. |
| u24 | H10: Familiar UI patterns used where appropriate | Kullanıcı dostu kalıplar karmaşık ürünlerde uygulanır. |
| u25 | Navigation labels are clear and unambiguous | Net navigasyon etiketleri ürün ve içerik sitelerinde kritik. |
| u26 | Active navigation state clearly indicated | Aktif nav durumu yönlendirme yoğun menülerde uygulanır. |
| u27 | Breadcrumbs present on inner pages | Kenar menü/breadcrumb işlevi derin içerikte uygulanır. |
| u28 | Footer navigation is comprehensive and useful | Footer kullanım denetimi bilgilendirici sayfa yapılarında uygulanır. |
| u29 | Search results are relevant and well-formatted | Arama sonuç kalitesi denetimi içerik/ürün keşif sayfalarında uygulanır. |
| u30 | 404 page helps users recover | 404 kurtarma deneyimi destek/kurumsal sitelerde kritik. |
| u31 | Mega menu / dropdown usable on touch devices | Mobil menü kullanım denetimi ürün/hizmet akışı menülerinde uygulanır. |
| u32 | Information architecture tested with users | Kullanıcı testleri kullanıcı bulgusu olan projelerde ayrı kanıtla uygulanır. |
| u33 | Tested text passes applicable WCAG contrast checks | Kontrast denetimi tüm sayfalarda uygulanır. |
| u34 | All images have descriptive alt text | Alt metin denetimi görsel içeriği olan her sayfada uygulanır. |
| u35 | Site fully navigable by keyboard alone | Klavye navigasyonu etkileşimli akışlarda uygulanır. |
| u36 | Focus indicators visible on all interactive elements | Odak belirginliği odaklı kullanılabilirlik standartlarında uygulanır. |
| u37 | Tested controls have accessible names | Erişilebilir ad denetimi test edilen kontrol seti için geçerlidir. |
| u38 | Mobile navigation is simple and thumb-friendly | Mobil navigasyon denetimi mobil ürün/hizmet sitelerinde uygulanır. |
| u39 | Forms are optimized for mobile input | Mobil form uyumluluğu yalnızca form bulunan akışlarda uygulanır. |
| u40 | Content priority preserved on mobile | İçerik önceliği içeriğin anlaşıldığı sayfalarda uygulanır |
| c1 | Primary CTA visible above the fold | CTA görünürlük denetimi dönüşüm hedefi olan sayfalarda uygulanır. |
| c2 | CTA copy is action-oriented and specific | CTA metni denetimi satış akış sayfalarında kritik. |
| c3 | CTA button has strong visual contrast | CTA kontrast denetimi buton-dominant sayfalarda önemlidir. |
| c4 | Single primary CTA per page section | Tek CTA prensibi uzun satış akışlı sayfalarda özellikle önemlidir. |
| c5 | CTA repeated strategically for long pages | Tekrarlanan CTA denetimi uzun içerik akışlarında uygulanır. |
| c6 | Hover/active states on all CTAs | Hover/active durum denetimi interaktif butonlu ürün sayfalarında anlamlıdır. |
| c7 | CTA above fold tested across device sizes | CTA görünürlüğü akış testi mobil/masaüstü dağılımı olan satış ve kayıt sayfalarında uygulanır. |
| c8 | Sticky CTA or sticky header with CTA on mobile | Sticky CTA denetimi mobil dönüşüm sayfaları için önemlidir. |
| c9 | Customer testimonials present on key pages | Müşteri referansları güven odaklı sayfalarda uygulanır. |
| c10 | Social proof (customer count, logos, reviews) | Sosyal kanıt denetimi hizmet ve ürün satış sitelerinde anlamlıdır. |
| c11 | Trust badges (secure payment, guarantees) | Güven rozetleri ödeme veya güvene dayalı dönüşüm sunan sitelerde uygulanır. |
| c12 | Pricing is clear with no hidden fees | Fiyat şeffaflığı ücretli ürün/satış sayfalarında uygulanır. |
| c13 | Risk reversal offered (free trial, guarantee) | Risk azaltıcı öğeler (garanti/deneme) abonelik ve satın alım sitelerinde uygulanır. |
| c14 | Case studies or results data present | Vaka çalışması denetimi danışmanlık ve B2B satış sitelerinde uygulanır. |
| c15 | Third-party review integration (G2, Trustpilot) | Üçüncü parti review entegrasyonu review varlığı olan sitelerde uygulanır. |
| c16 | Contact info visible throughout conversion flow | Sürekli temas numarası isteyen sitelerde uygulanır. |
| c17 | Form fields and required declarations | Form alan denetimi form barındıran sayfalarda uygulanır. |
| c18 | Form progress shown for multi-step forms | Çok adımlı form denetimi form akışı olan satış/hizmet sitelerinde uygulanır. |
| c19 | Form autocomplete declarations | Autofill denetimi form davranışını etkileyen sitelerde uygulanır. |
| c20 | Form errors shown inline, not on submit | Inline hata denetimi etkileşimli formlarda uygulanır. |
| c21 | Thank you / confirmation page provides next step | Onay sonrası yönlendirme denetimi dönüşüm tamamlayan akışlarda uygulanır. |
| c22 | Guest checkout available (e-commerce) | Guest checkout yalnızca e-ticaret akışlarında geçerli bir kontrol. |
| c23 | Checkout steps minimized (< 3 steps) | Checkout adım kontrolü ödeme yolculuğu bulunan siteler için anlamlıdır. |
| c24 | Mobile checkout / conversion flow tested | Mobil dönüşüm akışı denetimi satış/ürün/lead sitelerinde uygulanır. |
| c25 | Apple Pay / Google Pay available on mobile | Mobil ödeme yöntemi denetimi mobil ödeme sunan sitelerde uygulanır. |
| c26 | Phone link declarations by page | Telefon etiketleri hizmet odaklı ve acil iletişim sayfalarında uygulanır. |
| c27 | Mobile popups do not obstruct conversion flow | Mobil popup denetimi mobil dönüşüm odaklı sitelerde önemlidir. |
| c28 | Mobile page load < 3s on 4G connection | Mobil yüklenme denetimi yüksek trafiğe sahip ve satış odaklı sayfalarda uygulanır. |
| c29 | Conversion tracking set up in GA4 | GA4 dönüşüm ölçüm altyapısı varsa uygulanır; yoksa eksik bir eksiklik olarak işaretlenir. |
| c30 | Heatmap / session recording tool in place | Kullanıcı davranış kaydı araçları ölçüm altyapısı olan sitelerde anlamlıdır. |
| c31 | A/B testing program active | A/B test altyapısı bulunan sitelerde uygulanır. |
| c32 | Funnel drop-off points identified and addressed | Funnel düşüş noktası analizi conversion takibi yapılan sitelerde uygulanır. |
| c33 | Hero section communicates value prop in < 5 secs | Hero mesajı denetimi değer önerisi ön planda olan landing sayfalarda uygulanır. |
| c34 | Pricing page has comparison table | Fiyatlandırma karşılaştırması ücretli/plan sunan sitelerde uygulanır. |
| c35 | Exit intent strategy in place | Exit-intent denetimi dönüşüm odaklı sitelerde uygulanır. |