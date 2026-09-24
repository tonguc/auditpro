// A recorded observation is not a confirmed failure. N/A is not a pass.
export function summarizeFindings(ids: string[], results: Record<string, string>, evidence: Record<string, unknown>, notes: Record<string, string>) {
  const visible = ids.filter(id => results[id] || (evidence[id] && notes[id]));
  return {
    total: visible.length,
    issues: visible.filter(id => results[id] === 'Fail' || results[id] === 'Partial').length,
    passed: visible.filter(id => results[id] === 'Pass').length,
    unavailable: visible.filter(id => results[id] === 'N/A').length,
    review: visible.filter(id => !results[id]).length,
  };
}

// User-language finding summaries (P1-P3 kapanışı, 2026-09-23 ürün testi).
//
// Measurement libraries generate English technical notes on purpose (bounded,
// repeatable method language). The product UI must speak the user's language,
// so these templates rebuild the headline meaning from the STRUCTURED evidence
// (`observed` + `scope`) instead of translating prose. When a control has no
// structured numbers the caller falls back to the technical note — an honest
// gap, never a guess.

export type SummaryLocale = "tr" | "en";

export type SummaryInput = {
  sourceControlIds?: string[];
  observed?: Record<string, string | number | boolean>;
  reasonCode?: string;
  scope?: { tested: number; discovered: number; complete: boolean };
};

// Controls whose findings are actionable UX risks even when the score holds
// them back (calibration or coverage gates).
export const UX_RISK_CONTROLS = new Set(["c1", "c17", "c19", "u33", "u35", "u36", "u37", "u39", "t46", "t47"]);

const num = (value: unknown) => (typeof value === "number" && Number.isFinite(value) ? value : null);

function controlId(input: SummaryInput) {
  return input.sourceControlIds?.[0] ?? "";
}

export function findingMetric(input: SummaryInput, locale: SummaryLocale): string | null {
  const id = controlId(input);
  const observed = input.observed ?? {};
  const denominator = input.scope?.discovered ?? null;
  const fraction = (fail: unknown) => {
    const failed = num(fail);
    return failed === null ? null : `${failed.toLocaleString(locale === "tr" ? "tr-TR" : "en-US")} / ${(denominator ?? 0).toLocaleString(locale === "tr" ? "tr-TR" : "en-US")}`;
  };
  switch (id) {
    case "c1": return fraction(observed.clear);
    case "u33": return fraction(observed.failed);
    case "u37": return fraction(observed.failed);
    case "t47": return fraction(observed.failed);
    case "t46": return fraction(observed.failedRuns);
    case "u36": return fraction(observed.visible);
    case "u39": return fraction(observed.correct);
    case "c19": return fraction(observed.autocomplete);
    case "c17": return num(observed.leadForms) !== null ? `${observed.leadForms}` : null;
    case "u35": return observed.trapDetected ? (locale === "tr" ? "tuza" : "trap") : null;
    default: return null;
  }
}

export function findingSummary(input: SummaryInput, locale: SummaryLocale): string | null {
  const id = controlId(input);
  const observed = input.observed ?? {};
  const total = input.scope?.discovered ?? 0;
  const tr = locale === "tr";
  switch (id) {
    case "c1": {
      const clear = num(observed.clear) ?? 0;
      const above = num(observed.aboveFold) ?? 0;
      return clear === 0
        ? tr ? `${total} görünümün hiçbirinde net bir birincil eylem bulunamadı — ziyaretçi bir sonraki adımı göremiyor.` : `No clear primary action was found in any of ${total} views — visitors cannot see the next step.`
        : tr ? `${total} görünümün ${clear}'inde net bir birincil eylem var; ${above}'ı katlanır alanın üstünde duruyor.` : `A clear primary action appears in ${clear} of ${total} views; ${above} sit above the fold.`;
    }
    case "u33": {
      const failed = num(observed.failed) ?? 0;
      const incomplete = num(observed.incomplete) ?? 0;
      return tr
        ? `${failed.toLocaleString("tr-TR")} metin/arka plan çifti yeterli kontrasta sahip değil. ${incomplete.toLocaleString("tr-TR")} çift elle kontrol edilmeyi bekliyor.`
        : `${failed.toLocaleString("en-US")} text/background pairs fail contrast. ${incomplete.toLocaleString("en-US")} pairs need manual review.`;
    }
    case "u35": {
      const trap = observed.trapDetected === true;
      return trap
        ? tr ? "Klavye gezinmesinde tuzak var: odak bir kontrolden çıkamıyor, klavyeyle sayfa sonuna kadar gidilemiyor." : "Keyboard navigation contains a trap: focus cannot leave a control, so the page cannot be traversed by keyboard."
        : tr ? "Klavyeyle gezinmede tuzak bulunamadı." : "No keyboard trap was found.";
    }
    case "u36": {
      const visible = num(observed.visible) ?? 0;
      const reached = num(observed.reached) ?? total;
      return tr ? `Klavyeyle erişilen ${reached} kontrolün ${visible}'inde görünür odak değişimi var.` : `${visible} of ${reached} keyboard-reached controls show a visible focus change.`;
    }
    case "u37": {
      const failed = num(observed.failed) ?? 0;
      const elements = num(observed.uniquePageElements) ?? 0;
      return tr
        ? `${failed} kontrolde erişilebilir ad eksik — ekran okuyucu kullanıcılar bu kontrolleri tanıyamıyor. ${elements} benzersiz öğe etkilendi.`
        : `${failed} controls lack an accessible name — screen-reader users cannot identify them. ${elements} distinct elements are affected.`;
    }
    case "t46": {
      const failedRuns = num(observed.failedRuns) ?? 0;
      return failedRuns === 0
        ? tr ? "Mobil görünümlerde yatay taşma bulunamadı." : "No horizontal overflow was found on mobile views."
        : tr ? `${failedRuns} mobil ölçümde yatay taşma var — içerik ekran dışına taşıyor, kullanıcı sağa kaydırmak zorunda kalıyor.` : `${failedRuns} mobile runs overflow horizontally — content pushes off-screen and forces sideways scrolling.`;
    }
    case "t47": {
      const failed = num(observed.failed) ?? 0;
      return tr ? `${failed.toLocaleString("tr-TR")} dokunma hedefi 48×48 pikselin altında — yanlışlıkla dokunma riski yüksek.` : `${failed.toLocaleString("en-US")} touch targets are below 48×48 px — mis-taps are likely.`;
    }
    case "u39": {
      const correct = num(observed.correct) ?? 0;
      const applicable = num(observed.applicable) ?? 0;
      return tr ? `${applicable} mobil form alanının yalnızca ${correct}'inde uygun klavye/alan türü tanımlı.` : `Only ${correct} of ${applicable} mobile form fields declare an appropriate keyboard/input type.`;
    }
    case "c17": {
      const leadForms = num(observed.leadForms) ?? 0;
      const largest = num(observed.largestLeadForm) ?? 0;
      return leadForms === 0
        ? tr ? "Açık bir iletişim/lead formu bulunamadı — ziyaretçi iletişim kuracak yol göremiyor." : "No clear lead form was found — visitors have no obvious way to get in touch."
        : tr ? `${leadForms} lead formu bulundu; en büyüğünde ${largest} alan var. Uzun formlar dönüşümü düşürür.` : `${leadForms} lead form(s) found; the largest has ${largest} fields. Long forms reduce conversion.`;
    }
    case "c19": {
      const autocomplete = num(observed.autocomplete) ?? 0;
      const fields = num(observed.fields) ?? 0;
      return tr ? `${fields} form alanının ${autocomplete}'inde autocomplete bildirimi var — mobilde otomatik doldurma çoğu alanda çalışmıyor.` : `${autocomplete} of ${fields} form fields declare autocomplete — mobile autofill fails on most fields.`;
    }
    case "t56": {
      const failed = (input.scope?.tested ?? 0);
      void failed;
      return null;
    }
    default: return null;
  }
}

// Why a measured control is not in the score — the question the product must
// answer instead of leaving a bare "—".
export function scoreExclusionReason(reasonCode: string | undefined, locale: SummaryLocale): string | null {
  const tr = locale === "tr";
  switch (reasonCode) {
    case "method-not-calibrated":
      return tr ? "Yöntemi henüz kalibre edilmedi; bulgu yayımlanır ama puana girmez." : "Its method is not calibrated yet: the finding is published but never scored.";
    case "coverage-incomplete":
      return tr ? "Ölçümün bir kısmı belirsiz kaldı (ör. kontrastta elle kontrol gereken düğümler); kanıt tamamlanana kadar puan yayımlanmaz." : "Part of the measurement is inconclusive; no score is published until the evidence is complete.";
    case "incomplete-browser-resources":
      return tr ? "Bazı sayfa kaynakları yüklenemediği için tarayıcı ölçümü güvenilir değildi." : "Some page resources failed to load, so the rendered measurement could not be trusted.";
    case "not-applicable-for-site-type":
      return tr ? "Bu kontrol belirlenen site türü için geçerli değil." : "This control does not apply to the inferred site type.";
    case "scope-incomplete":
      return tr ? "Ölçüm kapsamı tamamlanmadı; eksik sayfalar geçti sayılmaz." : "Measurement scope is incomplete; missing pages are never counted as passes.";
    default: return tr ? "Kanıt eşiği sağlanmadığı için puan yayımlanmadı." : "The evidence threshold was not met, so no score is published.";
  }
}
