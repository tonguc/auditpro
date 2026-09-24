import { parse } from 'parse5';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

type Node = { nodeName: string; tagName?: string; value?: string; attrs?: { name: string; value: string }[]; childNodes?: Node[] };
export type SeoCheck = { status: 'Pass' | 'Partial' | 'Fail' | 'N/A'; note: string; target?: string };
const attr = (node: Node, name: string) => node.attrs?.find(a => a.name === name)?.value ?? '';
function elements(html: string) {
  const found: Node[] = [], pending: Node[] = [parse(html) as unknown as Node];
  while (pending.length) {
    const n = pending.pop()!;
    if (n.tagName) found.push(n);
    if (!['template', 'script', 'style'].includes(n.nodeName)) pending.push(...(n.childNodes ?? []).slice().reverse());
  }
  return found;
}

export type IndexingDetail = { url: string; bot: string; noindex: boolean; declarations: Array<{source:'html'|'http'; value:string}> };
export function indexingEvidence(html: string, header: string, bot = 'googlebot'): SeoCheck & { noindex: boolean; declarations: IndexingDetail['declarations'] } {
  bot = bot.toLowerCase();
  const declarations: IndexingDetail['declarations'] = [];
  const rules: string[] = [];
  for (const node of elements(html)) {
    if (node.tagName === 'meta' && ['robots', bot].includes(attr(node, 'name').toLowerCase())) { rules.push(attr(node, 'content')); declarations.push({source:'html',value:attr(node,'content')}); }
  }
  // A scoped HTTP rule stays scoped until the next explicit agent token.
  let scope = '*';
  const values = new Set(['max-snippet', 'max-image-preview', 'max-video-preview', 'unavailable_after']);
  for (const part of header.split(',')) {
    const match = part.trim().match(/^([\w-]+):\s*(.*)$/);
    let rule = part.trim();
    if (match && !values.has(match[1].toLowerCase())) { scope = match[1].toLowerCase(); rule = match[2]; }
    if (scope === '*' || scope === bot) { rules.push(rule); if(rule) declarations.push({source:'http',value:rule}); }
  }
  // Parameter values such as max-image-preview: none are not indexing directives.
  const tokens = rules.flatMap(rule=>rule.toLowerCase().split(',').filter(part=>!part.includes(':'))).join(',').split(/[,\s]+/);
  const blocked = tokens.includes('noindex') || tokens.includes('none');
  return { noindex: blocked, declarations, status: blocked ? 'Partial' : 'N/A', note: `${bot}: ${blocked ? 'an applicable noindex/none directive was detected' : 'no applicable noindex/none directive was detected'}. ${rules.length ? `Applicable declarations: ${rules.join('; ')}.` : ''} This does not establish robots.txt access, indexing intent, or actual search indexing.` };
}

export function canonicalEvidence(html: string, pageUrl: URL, linkHeader = ''): SeoCheck {
  const nodes = elements(html);
  const baseHref = nodes.find(n => n.tagName === 'base' && attr(n, 'href'));
  let base = pageUrl;
  try { if (baseHref) base = new URL(attr(baseHref, 'href'), pageUrl); } catch { return { status: 'Partial', note: 'Invalid document base URL; canonical resolution requires review.' }; }
  const declarations = nodes.filter(n => n.tagName === 'link' && attr(n, 'rel').toLowerCase().split(/\s+/).includes('canonical')).map(n => ({ value: attr(n, 'href'), base }));
  for (const match of linkHeader.matchAll(/<([^>]+)>\s*([^,]*)/g)) {
    if (/;\s*rel\s*=\s*(?:"[^"]*\bcanonical\b[^"]*"|'[^']*\bcanonical\b[^']*'|canonical\b)/i.test(match[2])) declarations.push({ value: match[1], base: pageUrl });
  }
  if (!declarations.length) return { status: 'N/A', note: 'No canonical declaration was found. Absence alone is not an SEO error.' };
  const urls: string[] = [];
  for (const d of declarations) {
    try {
      if (!d.value.trim()) throw new Error('empty');
      const url = new URL(d.value, d.base);
      if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) throw new Error('unsupported');
      if (url.hash) return { status: 'Partial', note: 'Canonical contains a fragment; review the declaration.' };
      urls.push(url.href);
    } catch { return { status: 'Fail', note: 'A canonical declaration is empty, malformed, or uses an unsupported URL.' }; }
  }
  if (new Set(urls).size > 1) return { status: 'Fail', note: `Conflicting canonical declarations: ${[...new Set(urls)].join(', ')}.` };
  return { status: 'Partial', target: urls[0], note: `Canonical declaration resolves consistently to ${urls[0]}. Target reachability, content equivalence and the search engine's selected canonical were not verified; cross-domain targets are not automatically errors.` };
}

// P1-P3 plan C3: required-field presence per declared type. Gaps are
// diagnostics for manual review and never Fail verdicts; semantic correctness
// and rich-result eligibility stay unclaimed. Fields are collected per block
// (nested objects included), which is a declared matching bound.
const SCHEMA_REQUIRED_FIELDS: Record<string, string[]> = {
  Organization: ['name', 'url'],
  LocalBusiness: ['name', 'address', 'telephone'],
  FAQPage: ['mainEntity'],
  Question: ['name', 'acceptedAnswer'],
  Product: ['name', 'offers'],
  Article: ['headline', 'datePublished'],
  BlogPosting: ['headline', 'datePublished'],
  WebSite: ['name', 'url'],
  BreadcrumbList: ['itemListElement'],
};
export type SchemaDetail = { url: string; blocks: Array<{ index: number; state: 'parsed' | 'invalid' | 'limited'; types: string[]; fields?: string[]; missingRequired?: string[] }> };
export function structuredDataEvidence(html: string) {
  const scripts = elements(html).filter(n => n.tagName === 'script' && attr(n, 'type').trim().toLowerCase() === 'application/ld+json');
  const types = new Set<string>();
  const blocks: SchemaDetail['blocks'] = [];
  let invalid = 0;
  for (const script of scripts) {
    const blockTypes = new Set<string>();
    const blockFields = new Set<string>();
    try {
      const pending: unknown[] = [JSON.parse((script.childNodes ?? []).map(n => n.value ?? '').join(''))];
      let visited = 0;
      while (pending.length && visited++ < 10000) {
        const value = pending.pop();
        if (!value || typeof value !== 'object') continue;
        if (Array.isArray(value)) { pending.push(...value); continue; }
        const obj = value as Record<string, unknown>;
        for (const key of Object.keys(obj)) if (key !== '@context' && key !== '@type') blockFields.add(key);
        for (const type of [obj['@type']].flat()) if (typeof type === 'string') { const name = type.replace(/^https?:\/\/schema\.org\//, ''); types.add(name); blockTypes.add(name); }
        pending.push(...Object.values(obj));
      }
      const missingRequired = [...blockTypes].flatMap(type => (SCHEMA_REQUIRED_FIELDS[type] ?? []).filter(field => !blockFields.has(field)).map(field => `${type}.${field}`));
      blocks.push({index:blocks.length+1,state:pending.length ? 'limited' : 'parsed',types:[...blockTypes],fields:[...blockFields],missingRequired});
    } catch { invalid++; blocks.push({index:blocks.length+1,state:'invalid',types:[]}); }
  }
  const check = (type: string): SeoCheck => ({ status: types.has(type) ? 'Partial' : 'N/A', note: `${scripts.length} JSON-LD blocks found; ${invalid} invalid JSON blocks; ${blocks.filter(b=>b.state==='limited').length} inspection limits reached. ${type} ${types.has(type) ? 'is declared via @type' : 'was not observed in inspected JSON'}. Invalid blocks cannot be attributed to an undeclared type. Required properties, context expansion, applicability and agreement with visible content still require review; this is not rich-result eligibility.` });
  return { blocks, organization: check('Organization'), faq: check('FAQPage'), localBusiness: check('LocalBusiness') };
}

type XmlNamespaces = Record<string, string>;
function xmlNamespaces(value: unknown, inherited: XmlNamespaces): XmlNamespaces {
  const result = { ...inherited };
  if (value && typeof value === 'object') {
    for (const [key, uri] of Object.entries(value)) {
      if (key === '@_xmlns') result[''] = String(uri);
      else if (key.startsWith('@_xmlns:')) result[key.slice(8)] = String(uri);
    }
  }
  return result;
}
const SITEMAP_NS = 'http://www.sitemaps.org/schemas/sitemap/0.9';
function sitemapChildren(value: unknown, localName: string, inherited: XmlNamespaces) {
  if (!value || typeof value !== 'object') return [];
  return Object.entries(value).flatMap(([name, children]) => {
    if (name.startsWith('@_') || name.split(':').pop() !== localName) return [];
    return [children].flat().flatMap(child => {
      const namespaces = xmlNamespaces(child, inherited);
      const prefix = name.includes(':') ? name.split(':')[0] : '';
      return namespaces[prefix] === SITEMAP_NS ? [{ value: child, namespaces }] : [];
    });
  });
}

export function sitemapEvidence(xml: string): SeoCheck & { urls: string[]; index: boolean; parsed: boolean } {
  const fail = (note: string) => ({ status: 'Fail' as const, note, urls: [], index: false, parsed: false });
  if (Buffer.byteLength(xml, 'utf8') > 250000) return { ...fail('Sitemap exceeds the local inspection limit; not fully inspected.'), status: 'Partial' };
  if (/<!DOCTYPE|<!ENTITY/i.test(xml)) return { ...fail('DTD/entity declarations are outside supported sitemap inspection; no entities were expanded.'), status: 'Partial' };
  if (XMLValidator.validate(xml) !== true) return fail('Sitemap XML is not well formed.');
  const doc = new XMLParser({ ignoreAttributes: false, parseTagValue: false, removeNSPrefix: false }).parse(xml);
  const rootName = Object.keys(doc).find(k => !k.startsWith('?'));
  if (!rootName || !['urlset', 'sitemapindex'].includes(rootName.split(':').pop()!)) return fail('Expected a urlset or sitemapindex root.');
  const root = doc[rootName];
  const namespaces = xmlNamespaces(root, {});
  const prefix = rootName.includes(':') ? rootName.split(':')[0] : '';
  if (namespaces[prefix] !== SITEMAP_NS) return { ...fail('Sitemap namespace is missing or unsupported.'), status: 'Partial' };
  const index = rootName.split(':').pop() === 'sitemapindex';
  const records = sitemapChildren(root, index ? 'sitemap' : 'url', namespaces);
  const urls: string[] = [];
  for (const record of records) {
    try {
      const locations = sitemapChildren(record.value, 'loc', record.namespaces);
      if (locations.length !== 1) throw new Error('missing or duplicate loc');
      const location = locations[0].value;
      const text = typeof location === 'string' ? location : location && typeof location === 'object' && Object.keys(location).every(key => key.startsWith('@_') || key === '#text') ? location['#text'] : undefined;
      if (typeof text !== 'string') throw new Error('non-text loc');
      const url = new URL(text);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.hash) throw new Error('invalid loc');
      urls.push(url.href);
    } catch { return fail('Sitemap contains a missing, relative, duplicate loc element or unsupported URL.'); }
  }
  return { status: urls.length ? 'Partial' : 'N/A', note: `Well-formed ${rootName} with ${urls.length} absolute URL entries. Reachability, indexing and completeness were not established. lastmod age is not scored.`, urls: [...new Set(urls)], index, parsed: true };
}

export function declaredSitemaps(robots: string, origin: string, limit = 3) {
  return [...new Set([...robots.matchAll(/^\s*sitemap\s*:\s*(\S+)/gim)].flatMap(m => {
    try { const url = new URL(m[1]); return url.origin === origin && !url.username && !url.password ? [url.href] : []; } catch { return []; }
  }))].slice(0, limit);
}
