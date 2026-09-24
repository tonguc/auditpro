import type { ContentEvidence } from './content-evidence';
type Link = NonNullable<ContentEvidence['links']>[number];
const normalize = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/ı/g,'i');
export function navigationHints(links: Link[], kind: 'about' | 'policy'): Link[] {
  const pattern = kind === 'about' ? /(?:^|[^a-z])(?:about|hakkimizda)(?:$|[^a-z])/ : /(?:^|[^a-z])(?:privacy|terms|gizlilik|kosullari?|sartlari?)(?:$|[^a-z])/;
  return links.filter(link => {
    try {
      const url = new URL(link.target);
      let path = url.pathname;
      try { path = decodeURIComponent(path); } catch {}
      return pattern.test(normalize(path + ' ' + link.text));
    } catch { return false; }
  });
}
