import {structuredDataEvidence} from './seo-evidence';

export type SiteTypeProfile = 'health|service' | 'ecommerce' | 'software' | 'editorial' | 'control';

export type SiteTypeAssessment = {
  siteType: SiteTypeProfile;
  signals: string[];
};

const schemaSignals: Record<Exclude<SiteTypeProfile, 'control'>, string[]> = {
  ecommerce: ['Product', 'Offer', 'AggregateOffer', 'ShoppingCart', 'Store', 'ProductModel', 'PriceSpecification', 'ShoppingCart'],
  software: ['SoftwareApplication', 'WebApplication', 'MobileApplication', 'SoftwareSourceCode'],
  editorial: ['Article', 'BlogPosting', 'NewsArticle', 'TechArticle'],
  'health|service': ['Physician', 'MedicalOrganization', 'HealthAndBeautyBusiness', 'Dentist', 'Doctor', 'MedicalBusiness', 'Service'],
};

const pathSignals: Record<Exclude<SiteTypeProfile, 'control'>, RegExp[]> = {
  ecommerce: [/\bproduct\b/i, /\/shop\b/i, /\/urun/i, /\bproducts?\b/i, /\bcart\b/i, /\bcheckout\b/i, /\bbasket\b/i],
  software: [/\/app\b/i, /\/software\b/i, /\bsign[- ]?up\b/i, /\btrial\b/i, /\bsaas\b/i, /\blogin\b/i, /\bdashboard\b/i],
  editorial: [/\/blog\b/i, /\/article/i, /\/haber\b/i, /\/news\b/i, /\/insight\b/i, /\/guide\b/i],
  'health|service': [/\/clinic\b/i, /\/hizmet\b/i, /\/doktor\b/i, /\/iletisim\b/i, /\/contact\b/i, /\/randevu\b/i, /\/doctor\b/i],
};

const pageTypeHints: Record<Exclude<SiteTypeProfile, 'control'>, RegExp[]> = {
  ecommerce: [/product/i, /checkout|cart|sepete|basket|sepet/i, /shop|magaza|magazamiz/i],
  software: [/signup|sign.?up|trial|deneme|plan|pricing|fiyat|özellik|features|dashboard|giriş|giris/i],
  editorial: [/makale|article|blog|yazı|rehber|analysis|analysis/i, /haber|news|insight/i],
  'health|service': [/dr\.|doktor|clinic|hasta|randevu|appointment|contact|telefon|contact-us|iletişim/i],
};

export const SITE_TYPE_CONTROL_APPLICABILITY: Record<string, SiteTypeProfile[]> = {
  t38: ['ecommerce'],
  t39: ['editorial'],
  t43: ['health|service'],
  t49: ['editorial'],
  t58: ['editorial', 'software'],
  t59: ['ecommerce'],
  c22: ['ecommerce'],
  c23: ['ecommerce'],
  c24: ['ecommerce', 'software'],
  c25: ['ecommerce'],
  c34: ['ecommerce', 'software'],
  c28: ['ecommerce', 'software'],
  c27: ['ecommerce', 'software'],
  c26: ['health|service'],
  c33: ['ecommerce', 'software', 'health|service', 'editorial'],
  c29: ['ecommerce', 'software', 'health|service'],
};

const CONTROL_DEFAULT: SiteTypeProfile[] = ['ecommerce', 'software', 'health|service', 'editorial'];

function normalize(value: string | null | undefined) {
  return (value || '').toLowerCase().trim();
}

function detectFromSchema(html: string): Record<Exclude<SiteTypeProfile, 'control'>, number> {
  const blocks = structuredDataEvidence(html).blocks;
  const schemaTypes = blocks.flatMap((block) => block.types.map((type) => normalize(type)));
  const scores: Record<Exclude<SiteTypeProfile, 'control'>, number> = {
    ecommerce: 0,
    software: 0,
    editorial: 0,
    'health|service': 0,
  };

  for (const candidate of schemaTypes) {
    for (const [kind, labels] of Object.entries(schemaSignals) as [Exclude<SiteTypeProfile, 'control'>, string[]][]) {
      if (labels.some((label) => label.toLowerCase() === candidate)) {
        scores[kind] += 3;
      }
    }
  }

  return scores;
}

function detectFromPathAndText(url: string, html: string, title = '', description = ''): Record<Exclude<SiteTypeProfile, 'control'>, number> {
  const sample = [url, title, description].map(normalize).join(' ');
  const scores: Record<Exclude<SiteTypeProfile, 'control'>, number> = {
    ecommerce: 0,
    software: 0,
    editorial: 0,
    'health|service': 0,
  };

  for (const [kind, rules] of Object.entries(pathSignals) as [Exclude<SiteTypeProfile, 'control'>, RegExp[]][]) {
    if (rules.some((rule) => rule.test(url))) scores[kind] += 2;
  }

  const normalizedHtml = normalize(html);
  for (const [kind, rules] of Object.entries(pageTypeHints) as [Exclude<SiteTypeProfile, 'control'>, RegExp[]][]) {
    if (rules.some((rule) => rule.test(sample) || rule.test(normalizedHtml))) scores[kind] += 1;
  }

  return scores;
}

function combineScores(scoresList: Array<Record<Exclude<SiteTypeProfile, 'control'>, number>>) {
  const totals: Record<Exclude<SiteTypeProfile, 'control'>, number> = {
    ecommerce: 0,
    software: 0,
    editorial: 0,
    'health|service': 0,
  };

  for (const scores of scoresList) {
    for (const kind of Object.keys(totals) as Array<Exclude<SiteTypeProfile, 'control'>>) {
      totals[kind] += scores[kind] ?? 0;
    }
  }

  return totals;
}

export function inferSiteTypeProfile(pages: ReadonlyArray<{ url: { href: string }; html: string; title?: string; description?: string }>): SiteTypeAssessment {
  if (!pages.length) {
    return { siteType: 'control', signals: ['No parsed pages; defaulting to control profile.'] };
  }

  const title = pages[0]?.title ?? '';
  const description = pages[0]?.description ?? '';

  const scoresList = pages.map((page) => {
    const schemaScores = detectFromSchema(page.html);
    const pathScores = detectFromPathAndText(page.url?.href || '', page.html, title, description);
    return {
      ecommerce: schemaScores.ecommerce + pathScores.ecommerce,
      software: schemaScores.software + pathScores.software,
      editorial: schemaScores.editorial + pathScores.editorial,
      'health|service': schemaScores['health|service'] + pathScores['health|service'],
    };
  });

  const totals = combineScores(scoresList);
  const ranked = Object.entries(totals).sort(([, a], [, b]) => b - a) as [Exclude<SiteTypeProfile, 'control'>, number][];

  const [topProfile, topScore] = ranked[0];
  const secondScore = ranked[1]?.[1] ?? 0;

  if (topScore >= 3 && topScore > secondScore) {
    return {
      siteType: topProfile,
      signals: [`Detected ${topProfile} signals with score ${topScore} vs next ${secondScore}.`],
    };
  }

  return {
    siteType: 'control',
    signals: ['No dominant site-type signal; using control profile.', `Top scores: ${ranked.map(([kind, score]) => `${kind}:${score}`).join(', ')}`],
  };
}

export function isControlApplicable(siteType: SiteTypeProfile, controlId: string) {
  const allowed = SITE_TYPE_CONTROL_APPLICABILITY[controlId];
  if (!allowed) return true;
  if (siteType === 'control') return true;
  return allowed.includes(siteType);
}

export function summarizeSiteTypeAssessment(assessment: SiteTypeAssessment) {
  return {
    profile: assessment.siteType,
    notes: assessment.signals,
  };
}

export function allSupportedSiteProfiles(): SiteTypeProfile[] {
  return CONTROL_DEFAULT;
}
