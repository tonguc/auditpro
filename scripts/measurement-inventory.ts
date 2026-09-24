import { readFileSync, writeFileSync } from 'node:fs';
import { AUDIT_CATEGORIES } from '../lib/audit-model';
import { CALIBRATED_CONTROLS } from '../lib/measurement-policy';

const html = readFileSync('lib/html-measurements.ts', 'utf8') + readFileSync('lib/site-measurements.ts', 'utf8') + readFileSync('app/api/analyze/route.ts', 'utf8');
const browser = readFileSync('lib/browser-measurements.ts', 'utf8');
const crawlerIds = new Set([...html.matchAll(/setFinding\(\s*\w+,\s*"([a-z]+\d+)"/g)].map(m => m[1]));
const browserIds = new Set([...browser.matchAll(/findings\.([a-z]+\d+)\s*=/g)].map(m => m[1]));
const rows = AUDIT_CATEGORIES.flatMap(category => category.sections.flatMap(section => section.items.map(item => {
  const policy = CALIBRATED_CONTROLS[item.id];
  const sources = [crawlerIds.has(item.id) ? 'HTML/HTTP' : '', browserIds.has(item.id) ? 'Tarayıcı' : ''].filter(Boolean).join(' + ');
  return { id: item.id, category: category.label, question: item.item, source: sources || 'Otomatik kanıt bağlı değil', decision: policy ? 'Sınırlı ölçüm; kanıt uygunsa puana aday' : sources ? 'Tanısal; puan dışı' : 'Manuel/entegrasyon gerekli; puan dışı', reason: policy?.measures || (sources ? 'Yöntem kapsamı soru doğruluğunu kanıtlamıyor; doğrulanmış örnek ve bağlam gerekli.' : 'Bu kontrol için puana uygun çalışan bir otomatik ölçüm doğrulanmadı.') };
})));
const auto = rows.filter(row => row.source !== 'Otomatik kanıt bağlı değil').length;
const escape = (text: string) => text.replaceAll('|', '\\|').replaceAll('\n', ' ');
const header = `# Povlex ölçüm envanteri ve kalibrasyon — 11 Eylül 2026

Aktif katalog: ${rows.length} kontrol. HTML/HTTP veya tarayıcı bulgusu üreten: ${auto}. Bağlı otomatik bulgusu olmayan: ${rows.length - auto}. Puana aday olarak izin verilen dar kapsamlı ölçüm: ${Object.keys(CALIBRATED_CONTROLS).length}.

Bu envanter soru → çalışan ölçüm → puan kararı eşlemesidir. Manuel kontrolün değersiz olduğu veya bütün SEO kriterlerinin bilimsel olarak doğrulandığı iddia edilmez. Yeni/şüpheli yöntemler varsayılan olarak puan dışındadır. Kaynak alanı, motorun bulgu üretmesini gösterir; modelin genel tavsiyesi veya kullanıcı işaretlemesi otomatik kanıt değildir.

## Bulgular ve yapılanlar

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
`;
writeFileSync('POVLEX-KONTROL-KALIBRASYONU.md', header + rows.map(row => `| ${Object.values(row).map(escape).join(' | ')} |`).join('\n') + '\n');
console.log(JSON.stringify({ controls: rows.length, automated: auto, scoringCandidates: Object.keys(CALIBRATED_CONTROLS).length }));
