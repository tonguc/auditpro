// Reviewed presentation copy, not scoring rules or inferred page-level evidence.
const guidance = {
  t56: {
    tr: ["Kontrol edilen adreslerde HTTP hataları", "Listelenen adreslerin hata kodlarını ve yönlendiği hedefleri kontrol edin. 4xx yanıtlarında adres/erişim durumunu, 5xx yanıtlarında sunucu sorununu araştırın.", "Aynı adresleri tekrar kontrol edin. Bu kontrol içerik kaynaklı soft 404, indekslenme veya taranmayan sayfalar hakkında sonuç vermez."],
    en: ["HTTP errors at checked addresses", "Inspect the listed status codes and redirect targets. Investigate address/access conditions for 4xx and server failures for 5xx.", "Recheck the same addresses. This control does not establish soft 404 content, indexability, or the health of unrequested pages."],
  },
  o1: {
    tr: ["Boş sayfa başlıkları bulundu", "Etkilenen sayfalara içeriği doğru tanımlayan başlıklar yazın.", "Aynı sayfaları yeniden tarayın; başlıkların dolu olduğunu kontrol edin."],
    en: ["Empty page titles found", "Write descriptive titles for the affected pages.", "Recrawl the same pages and check that their titles are nonempty."],
  },
  o4: {
    tr: ["Tekrarlanan sayfa başlıkları bulundu", "Aynı başlığı kullanan sayfaları inceleyin; farklı içerikleri ayırt eden başlıklar hazırlayın.", "Aynı örneklemde başlıkların benzersizliğini yeniden kontrol edin."],
    en: ["Repeated page titles found", "Review pages sharing a title and distinguish different content with specific titles.", "Check title uniqueness again within the same sample."],
  },
  o5: {
    tr: ["Eksik meta açıklamaları bulundu", "Etkilenen sayfalar için içeriği doğru özetleyen açıklamalar hazırlayın.", "Aynı sayfaları yeniden tarayın; açıklama alanlarının dolu olduğunu kontrol edin."],
    en: ["Missing meta descriptions found", "Write accurate content summaries for the affected pages.", "Recrawl the same pages and verify that description fields are nonempty."],
  },
  o8: {
    tr: ["Tekrarlanan meta açıklamaları bulundu", "Ortak açıklama kullanan sayfaları inceleyin; her sayfanın içeriğine uygun özgün açıklamalar yazın.", "Aynı örneklemde açıklamaların benzersizliğini yeniden kontrol edin."],
    en: ["Repeated meta descriptions found", "Review pages sharing a description and write specific summaries for each page.", "Check description uniqueness again within the same sample."],
  },
  t28: {
    tr: ["HTTPS sunumunda sorun bulundu", "Kanıttaki son adresi ve bağlantı sonucunu inceleyin; HTTPS üzerinden erişilemeyen sayfaları düzeltin.", "Aynı sayfaların son adreslerine HTTPS üzerinden başarıyla ulaşıldığını yeniden doğrulayın."],
    en: ["HTTPS delivery needs attention", "Inspect the final URL and connection result in the evidence; fix pages unavailable over HTTPS.", "Verify successful HTTPS access to the final URLs of the same pages."],
  },
} as const;

export function findingGuidance(id: string, locale: string) {
  const entry = guidance[id as keyof typeof guidance];
  return entry?.[locale === "tr" ? "tr" : "en"];
}
