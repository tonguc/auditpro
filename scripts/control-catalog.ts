import {AUDIT_CATEGORIES} from '../lib/audit-model';
import {CALIBRATED_CONTROLS} from '../lib/measurement-policy';
import {analyzeHtml} from '../lib/html-measurements';
import {deriveRenderedFindings} from '../lib/browser-measurements';
import {mkdirSync, writeFileSync} from 'node:fs';
import assert from 'node:assert/strict';

const emitted = new Set([...Object.keys(analyzeHtml('', new URL('https://example.com/'), new Response(''), 0, 0)), ...Object.keys(deriveRenderedFindings([], 0)), 't1', 't2', 't9', 't56', 't64', 'o4', 'o8']);
const forms = new Set(['c17', 'c19', 'u39', 'c26']);
const schema = new Set(['t35', 't40', 't43']);

const siteTypeApplicability: Record<string, string> = {
  o1: 'Genel metin ve başlık denetimi, yayınlanan tüm sayfalara uygulanır.',
  o4: 'Başlık eşsizliği sadece karşılaştırılan sayfalar için anlamlıdır; site tipine göre varyasyon kabul edilebilir.',
  o5: 'Meta açıklama denetimi tüm sayfalar için uygulanır; içerik ağırlığı ve reklam formatına göre fark doğar.',
  o8: 'Meta açıklama benzersizliği karşılaştırmalı olarak ve minimum iki sayfa olduğunda değerlendirilir.',
  t1: 'Kural tabanlı erişim ve robots politikası SEO giriş kontrolü için her site tipinde gereklidir.',
  t2: 'Sitemap varlık denetimi tüm siteler için uygulanır; XML varlığın işlevi sektöre göre değişir.',
  t3: 'Sitemap güncelliği alan denetimi; aktif yayın yönetimi olan siteler için uygun.',
  t4: 'Noindex denetimi site kapsamlı index stratejisinde geçerlidir; içerik stratejisine göre ayrıştırılmalıdır.',
  t5: 'Canonical denetimi crawl edilebilir sayfa seti olan tüm siteler için uygulanır.',
  t8: 'Pagination denetimi ürün listeleri, kategori ve haber akışı siteleri için kritik; portföy sitelerinde sınırlı uygulanır.',
  t14: 'URL parametre davranışı query odaklı sitelerde önceliklidir; istatistiksel amaçlı sayfalarda farklı yorumlanır.',
  t15: 'CWV ölçümleri sadece teknik ölçüm hattı ile tamamlanmalıdır; bu kontrol bir çerçeve yalnızdır.',
  t16: 'CWV ölçümleri gerçek kullanıcı davranışı yerine tarayıcı paneli/sentetik ölçümle tamamlanmalıdır.',
  t17: 'CLS denetimi medya/tema yoğun sayfalarda önemlidir.',
  t18: 'Mobile PageSpeed kontrolü trafik yoğun mobil sitelerde önceliklidir.',
  t19: 'Desktop CWV kontrolü kurumsal ürün sitelerinde daha anlamlıdır.',
  t20: 'Görsel envanteri tüm sitelerde uygulanır; kalite yorumu içerik tipine bağlıdır.',
  t21: 'Görsel boyut denetimi medya ağırlıklı sayfalarda daha değerli bir sinyal olur.',
  t22: 'Yükleme bildirimi denetimi, çok görsel sayfalarda ve uzun form sayfalarında anlamlıdır.',
  t23: 'Render-blocking denetimi frontend mimarisine göre sitelerin çoğunda tamamlayıcıdır.',
  t24: 'Header zamanlaması izleme, sabit CDN davranışı olan yapılarda daha kullanılabilir.',
  t25: 'Font yükleme denetimi tipografi odaklı sitelerde öne çıkar.',
  t26: 'Script yükleme denetimi SPA/hybrid yapılarda daha belirleyicidir.',
  t27: 'SSL denetimi tüm sitelerde uygulanır.',
  t28: 'HTTPS servis denetimi temel güvenlik/gibi kontrol olarak evrensel uygulanır.',
  t29: 'HTTP→HTTPS yönlendirme denetimi tek domainli üretim yapılarında temel geçerlidir.',
  t30: 'www/non-www normalizasyonu marka alanı stratejisinde önemlidir.',
  t31: 'Güvenlik başlık denetimi genel olarak uygulanır; politika yorumu domain özelidir.',
  t32: 'Mixed content denetimi mixed içerik üreten sitelerde kritiktir.',
  t33: 'Güvenlik header denetimi yüksek seviyeli güvenlik politikalarında önemlidir.',
  t34: 'Gizli veri riski incelemesi ürün/hizmet siteleri için en kritik',
  t35: 'Organization schema, markalı siteler için anlamlıdır; tek ürün alt-alanı için zorunlu değildir.',
  t36: 'WebSite SearchAction sadece arama kutusu sunulan ve ürün/hizmet açıklığı olan markalarda anlamlıdır.',
  t37: 'BreadcrumbList schema, derin kategori yapısı olan sitelerde uygulanır.',
  t38: 'Product schema, ürün ve e-ticaret kataloglarında uygulanır.',
  t39: 'Article/BlogPosting schema, haber/blog yayın sitelerinde uygulanır.',
  t40: 'FAQ schema, içerik ve destek sayfalarında anlamlıdır.',
  t41: 'Review/Rating schema, ürün/paket/servis güven sinyali toplayan sitelerde uygulanır.',
  t42: 'Schema hata denetimi için schema üreten tüm sitelerde uygulanır.',
  t43: 'LocalBusiness schema, yerel işletme ve ofis hizmeti sunan sitelerde uygulanır.',
  t44: 'Mobil-first inceleme Google odaklı sitelerde uygulanır.',
  t45: 'Viewport denetimi responsive tasarım sunan tüm sitelerde uygulanır.',
  t46: 'Dokunmatik kaydırma/taşma denetimi mobil öncelikli tüm sitelerde uygulanır.',
  t47: 'Dokunmatik hedef denetimi özellikle mobil akış odaklı sitelerde anlamlıdır.',
  t48: 'Kullanıcı deneyimi engelleyicileri her sayfada görülmeli.',
  t49: 'AMP odaklıdır; haber ve uzun metinli yayın sitelerinde geçerlilik kazanır.',
  t50: '404 deneyimi genel olarak tüm siteler için değerlidir.',
  t51: 'İçerik kalitesi denetimi içerik odaklı sitelerde kritik.',
  t52: 'Duplicate içerik yönetimi çok sayfalı içerik sitelerinde anlamlıdır.',
  t53: 'Dil bildirimleri tüm çok dilli veya uluslararası hedeflerde önceliklidir.',
  t54: 'Uluslararası hedefleme sadece bölgesel/çok dil hedefi olan sitelerde uygulanır.',
  t55: 'CDN denetimi dağıtık dağıtım yapan sitelerde anlamlı.',
  t56: 'Genel erişilebilirlik denetimi tüm siteler için bir ön kontrol.',
  t57: 'Log-tabanlı analiz, trafik hacmi yüksek sitelerde operasyonel olarak uygulanır.',
  t58: "Arama sonuçları engelleme, e-ticaret olmayan CMS'lar için nadiren kritik.",
  t59: 'Parametre yönetimi filtreli katalog sitelerinde yüksek önceliklidir.',
  t60: 'Yazdırma CSS denetimi belge yayınlı sitelerde anlamlıdır.',
  t61: 'Takip parametresi denetimi CRM/analitik odaklı sitelerde uygulanır.',
  t62: 'Breadcrumb navigasyon çok seviyeli bilgi mimarisinde anlamlıdır.',
  t63: 'Sitemap filtrelenmesi sitenin indeksleme stratejisine göre önem kazanır.',
  t64: 'Header timing karşılaştırması site şablonu stabilite gerektirir.',
  t65: 'AI ceza/performans denetimi reklam ve içerik hacimli sitelerde anlamlıdır.',
  c1: 'CTA görünürlük denetimi dönüşüm hedefi olan sayfalarda uygulanır.',
  c2: 'CTA metni denetimi satış akış sayfalarında kritik.',
  c3: 'CTA kontrast denetimi buton-dominant sayfalarda önemlidir.',
  c4: 'Tek CTA prensibi uzun satış akışlı sayfalarda özellikle önemlidir.',
  c5: 'Tekrarlanan CTA denetimi uzun içerik akışlarında uygulanır.',
  c6: 'Hover/active durum denetimi interaktif butonlu ürün sayfalarında anlamlıdır.',
  c7: 'CTA görünürlüğü akış testi mobil/masaüstü dağılımı olan satış ve kayıt sayfalarında uygulanır.',
  c8: 'Sticky CTA denetimi mobil dönüşüm sayfaları için önemlidir.',
  c9: 'Müşteri referansları güven odaklı sayfalarda uygulanır.',
  c10: 'Sosyal kanıt denetimi hizmet ve ürün satış sitelerinde anlamlıdır.',
  c11: 'Güven rozetleri ödeme veya güvene dayalı dönüşüm sunan sitelerde uygulanır.',
  c12: 'Fiyat şeffaflığı ücretli ürün/satış sayfalarında uygulanır.',
  c13: 'Risk azaltıcı öğeler (garanti/deneme) abonelik ve satın alım sitelerinde uygulanır.',
  c14: 'Vaka çalışması denetimi danışmanlık ve B2B satış sitelerinde uygulanır.',
  c15: 'Üçüncü parti review entegrasyonu review varlığı olan sitelerde uygulanır.',
  c16: 'Sürekli temas numarası isteyen sitelerde uygulanır.',
  c17: 'Form alan denetimi form barındıran sayfalarda uygulanır.',
  c18: 'Çok adımlı form denetimi form akışı olan satış/hizmet sitelerinde uygulanır.',
  c19: 'Autofill denetimi form davranışını etkileyen sitelerde uygulanır.',
  c20: 'Inline hata denetimi etkileşimli formlarda uygulanır.',
  c21: 'Onay sonrası yönlendirme denetimi dönüşüm tamamlayan akışlarda uygulanır.',
  c22: 'Guest checkout yalnızca e-ticaret akışlarında geçerli bir kontrol.',
  c23: 'Checkout adım kontrolü ödeme yolculuğu bulunan siteler için anlamlıdır.',
  c24: 'Mobil dönüşüm akışı denetimi satış/ürün/lead sitelerinde uygulanır.',
  c25: 'Mobil ödeme yöntemi denetimi mobil ödeme sunan sitelerde uygulanır.',
  c26: 'Telefon etiketleri hizmet odaklı ve acil iletişim sayfalarında uygulanır.',
  c27: 'Mobil popup denetimi mobil dönüşüm odaklı sitelerde önemlidir.',
  c28: 'Mobil yüklenme denetimi yüksek trafiğe sahip ve satış odaklı sayfalarda uygulanır.',
  c29: 'GA4 dönüşüm ölçüm altyapısı varsa uygulanır; yoksa eksik bir eksiklik olarak işaretlenir.',
  c30: 'Kullanıcı davranış kaydı araçları ölçüm altyapısı olan sitelerde anlamlıdır.',
  c31: 'A/B test altyapısı bulunan sitelerde uygulanır.',
  c32: 'Funnel düşüş noktası analizi conversion takibi yapılan sitelerde uygulanır.',
  c33: 'Hero mesajı denetimi değer önerisi ön planda olan landing sayfalarda uygulanır.',
  c34: 'Fiyatlandırma karşılaştırması ücretli/plan sunan sitelerde uygulanır.',
  c35: 'Exit-intent denetimi dönüşüm odaklı sitelerde uygulanır.',
  u1: 'Teknik durum göstergeleri tüm sitelerde uygulanır.',
  u2: 'Form/inceleme alanlarında inline validasyon varsa bu bir kalite denetimidir.',
  u3: 'Asenkron durum göstergesi etkileşim odaklı sayfalarda uygulanır.',
  u4: 'Dil tutarlılığı kullanıcı deneyimi metin ağırlıklı her sayfada önemlidir.',
  u5: 'İkon etiket kontrolü gezinti yoğun sayfalarda uygulanır.',
  u6: 'Undo/geri dönüş kontrolü çok adımlı akışlarda önemlidir.',
  u7: 'Back-button davranışı genel olarak tüm uygulamalarda kontrol edilir.',
  u8: 'Görsel tutarlılık çoklu sayfalı sitelerde uygulanır.',
  u9: 'Terminoloji tutarlılığı marka dili güçlü sitelerde uygulanır.',
  u10: 'Buton stilleri ürün ve form odaklı sitelerde daha belirleyicidir.',
  u11: 'Kritik eylemler için onay ekranları güvenli ürün satış sitelerinde zorunludur.',
  u12: 'Form işaretleme denetimi form toplama hedefi olan her sayfada uygulanır.',
  u13: 'Şifre göster/gizle denetimi auth akışı olan sayfalarda uygulanır.',
  u14: 'Format yönergesi etkileşim alanlarında form girişlerinde uygulanır.',
  u15: 'Navigasyon görünürlüğü sitenin tüm ana akışlarında uygulanır.',
  u16: 'Arama fonksiyonu olan sitelerde aranabilirlik denetimi uygulanır.',
  u17: 'Klavye kısayol dokümantasyonu var ise yönlendiricili ürünlerde önemlidir.',
  u18: 'Yardım dokümantasyonu eğitim gerektiren karmaşık akışlarda uygulanır.',
  u19: 'Minimalist gereksinimi marka ve ürün hedefine göre değişken yorumlanır.',
  u20: 'Görsel hiyerarşi kullanıcı odaklı deneyimlerde uygulanır.',
  u21: 'Hata mesajı kalitesi aksiyon odaklı arayüzlerde uygulanır.',
  u22: 'Hata iyileştirme yönlendirmeleri aksiyon odaklı akışlarda uygulanır.',
  u23: 'Kullanıcı ilk turu tamamlaması için onboarding denetimi ürün eğitimli sitelerde uygulanır.',
  u24: 'Kullanıcı dostu kalıplar karmaşık ürünlerde uygulanır.',
  u25: 'Net navigasyon etiketleri ürün ve içerik sitelerinde kritik.',
  u26: 'Aktif nav durumu yönlendirme yoğun menülerde uygulanır.',
  u27: 'Kenar menü/breadcrumb işlevi derin içerikte uygulanır.',
  u28: 'Footer kullanım denetimi bilgilendirici sayfa yapılarında uygulanır.',
  u29: 'Arama sonuç kalitesi denetimi içerik/ürün keşif sayfalarında uygulanır.',
  u30: '404 kurtarma deneyimi destek/kurumsal sitelerde kritik.',
  u31: 'Mobil menü kullanım denetimi ürün/hizmet akışı menülerinde uygulanır.',
  u32: 'Kullanıcı testleri kullanıcı bulgusu olan projelerde ayrı kanıtla uygulanır.',
  u33: 'Kontrast denetimi tüm sayfalarda uygulanır.',
  u34: 'Alt metin denetimi görsel içeriği olan her sayfada uygulanır.',
  u35: 'Klavye navigasyonu etkileşimli akışlarda uygulanır.',
  u36: 'Odak belirginliği odaklı kullanılabilirlik standartlarında uygulanır.',
  u37: 'Erişilebilir ad denetimi test edilen kontrol seti için geçerlidir.',
  u38: 'Mobil navigasyon denetimi mobil ürün/hizmet sitelerinde uygulanır.',
  u39: 'Mobil form uyumluluğu yalnızca form bulunan akışlarda uygulanır.',
  u40: 'İçerik önceliği içeriğin anlaşıldığı sayfalarda uygulanır',
  serp1: 'GEO/SERP denetimleri hedef anahtar kelime odaklı içerik stratejisinde uygulanır.',
  serp2: 'SERP niyet uyumu anahtar kelime hedefli her pazar için uygulanır.',
  serp3: 'Kullanıcı ihtiyacı uyumu ürün/hizmet ve içerik sayfalarında uygulanır.',
  serp4: 'Özet kutu/cevap bölümü fırsatı bilgi odaklı içeriklerde uygulanır.',
  serp5: 'Soru-cevap derinliği destek ve eğitim odaklı içerikte anlamlıdır.',
  serp6: 'Net mesaj odaklı tek amaçlı sayfalarda uygulanır.',
  serp7: 'İçerik okunabilirlik akışında uygulanır.',
  serp9: 'AI Overview tespiti motor odaklı içerik denetiminde uygulanır.',
  serp10: 'Marka görünürlüğü AI alıntılarına hizmet odaklı içerikte uygulanır.',
  serp11: 'AI yanıt çıkarımı için yapı kontrolü bilgi ürünlerinde uygulanır.',
  serp12: 'AI görünürlük denetimi marka konuşma ağında uygulanır.',
  serp13: 'AI bot erişimi robots politikası SEO ve GEO hedefli sitelerde uygulanır.',
  serp14: 'LLM okunabilirlik denetimi yayın ve içerik sitelerinde uygulanır.',
  serp15: 'Orijinal veri/öngörü kontrolleri uzman içerik ve araştırma sitelerinde anlamlıdır.',
  serp16: 'Entity sinyalleri marka profil çabası olan tüm kurumsal sitelerde uygulanır.',
  serp17: 'Yazar byline denetimi editoryel içerik sunan sitelerde uygulanır.',
  serp18: 'Person schema denetimi yazar bazlı içerik sitelerinde uygulanır.',
  serp19: 'Hakkında güvenilirlik denetimi güven temelli marka sitelerinde anlamlıdır.',
  serp20: 'Otorite kaynak referansları içerik sayfalarında uygulanır.',
  serp21: 'İnsan editleme denetimi üretilen içerik riski olan sitelerde uygulanır.',
};

const defaultSiteScope = 'Diğer kontrol ve sitelere uygulanır; sonuçlar akış bağlamına göre yorumlanmalıdır.';

function scopedApplicability(id: string) {
  return siteTypeApplicability[id] ?? defaultSiteScope;
}

const rows = AUDIT_CATEGORIES.flatMap((category) =>
  category.sections.flatMap((section) =>
    section.items.map((item) => ({
      id: item.id,
      title: item.item,
      category: category.id,
      status: CALIBRATED_CONTROLS[item.id]
        ? 'verified-bounded'
        : emitted.has(item.id)
          ? 'observation'
          : 'external-evidence-required',
      measurement: CALIBRATED_CONTROLS[item.id]?.measures ??
        (emitted.has(item.id)
          ? 'Recorded source/browser evidence; no validated score or semantic verdict'
          : 'No implemented automatic measurement; do not imply completion'),
      applicability: forms.has(item.id)
        ? 'Only relevant controls/forms and their actual purpose; absence is not failure'
        : schema.has(item.id)
          ? 'Only applicable entity/content types; absence is not a universal defect'
          : category.id === 'serp'
            ? 'Target intent, market, language and engine/source-specific evidence'
            : emitted.has(item.id)
              ? 'Fetched/rendered sample only; missing/incomplete data remains unknown'
              : 'Requires control-specific integration or expert evidence before judgement',
      siteTypeApplicability: scopedApplicability(item.id),
      section: section.id,
    }))
  )
);
assert.equal(new Set(rows.map((row) => row.id)).size, rows.length);
for (const id of Object.keys(CALIBRATED_CONTROLS)) assert.ok(rows.some((row) => row.id === id));
const counts = Object.fromEntries(
  ['verified-bounded', 'observation', 'external-evidence-required'].map((kind) => [kind, rows.filter((row) => row.status === kind).length]),
);
mkdirSync('design/validation-matrix', {recursive: true});
writeFileSync(
  'design/validation-matrix/control-catalog.json',
  JSON.stringify({generatedAt: new Date().toISOString(), counts, rows}, null, 2),
);
writeFileSync(
  'design/validation-matrix/CONTROL-CATALOG.md',
  '# Pilot kontrol kapsamı\n\n' +
  'Bu katalog tüm kontrollerin tamamlandığı iddiası değildir. verified-bounded yalnızca dar ölçümü; observation puan dışı kanıtı; external-evidence-required henüz otomatik ölçülmeyen kapsamı belirtir.\n\n' +
  `${JSON.stringify(counts)}\n\n` +
  '| ID | Kontrol | Sınıf | Uygulanabilirlik | Site bağlamı |\n' +
  '|---|---|---|---|---|\n' +
  rows.map((row) => `| ${row.id} | ${row.title} | ${row.status} | ${row.applicability} | ${row.siteTypeApplicability} |`).join('\n') +
  '\n\n## Site bağlamı özet matrisi\n\n' +
  '| ID | Kontrol | Site bağlamı |\n' +
  '|---|---|---|\n' +
  rows.map((row) => `| ${row.id} | ${row.title} | ${row.siteTypeApplicability} |`).join('\n'),
);
console.log(JSON.stringify({total: rows.length, counts}));
