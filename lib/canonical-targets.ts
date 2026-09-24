import { canonicalEvidence, indexingEvidence } from './seo-evidence';
export type RedirectHop = {url:string; status:number; target:string};
export type CanonicalResource = { status: number; text: string; url: string; contentType: string; robots: string; link: string; redirectTrace?:RedirectHop[] };
export type CanonicalDetail = {url:string; target?:string; finalUrl?:string; httpStatus?:number; state:'missing'|'invalid'|'unavailable'|'budget'|'http-error'|'non-html'|'review'; noindex?:boolean; chain?:boolean; redirected?:boolean; redirectTrace?:RedirectHop[]; targetCanonical?:string; targetCanonicalInvalid?:boolean; returnsToSource?:boolean};
export async function inspectCanonicalTargets(pages: { html: string; url: URL; response: Response }[], load: (url: string) => Promise<CanonicalResource>, limit = 5, details: CanonicalDetail[] = []) {
  const observations: string[] = [];
  const cache = new Map<string,CanonicalResource>(pages.map(p => [p.url.href, { status: p.response.status, text: p.html, url: p.url.href, contentType: p.response.headers.get('content-type') || 'text/html', robots: p.response.headers.get('x-robots-tag') || '', link: p.response.headers.get('link') || '' }]));
  const unavailable = new Set<string>();
  let fetched = 0;
  for (const page of pages) {
    const declaration = canonicalEvidence(page.html, page.url, page.response.headers.get('link') || '');
    if (!declaration.target) { details.push({url:page.url.href,state:declaration.status==='N/A'?'missing':'invalid'}); continue; }
    const target = declaration.target;
    const row: CanonicalDetail = {url:page.url.href,target,state:'review'};
    details.push(row);
    if (unavailable.has(target)) {row.state='unavailable'; observations.push(`${page.url.href}: shared target previously unavailable.`); continue;}
    if (!cache.has(target)) {
      if (fetched >= limit) { row.state='budget'; observations.push(`${page.url.href}: target not checked (request budget).`); continue; }
      fetched++;
      try { cache.set(target, await load(target)); } catch { unavailable.add(target); row.state='unavailable'; observations.push(`${page.url.href}: target unavailable or blocked by public-URL protection.`); continue; }
    }
    const resource = cache.get(target)!;
    row.finalUrl=resource.url; row.httpStatus=resource.status || undefined; row.redirected=resource.url!==target;
    row.redirectTrace=resource.redirectTrace;
    if (!resource.status) {row.state='unavailable'; observations.push(`${page.url.href}: target unavailable or blocked by public-URL protection.`);continue;}
    const prefix = `${page.url.href} → ${target}: `;
    if (resource.status !== 200) {row.state=resource.status>=400&&resource.status<=599?'http-error':'review'; observations.push(prefix + `HTTP ${resource.status}; target suitability is unverified.`); continue; }
    if (!/text\/html|application\/xhtml\+xml/i.test(resource.contentType)) {row.state='non-html'; observations.push(prefix + 'non-HTML target; content comparison not supported.'); continue; }
    const index = indexingEvidence(resource.text, resource.robots);
    const own = canonicalEvidence(resource.text, new URL(resource.url), resource.link);
    row.noindex=index.status==='Partial'; row.chain=Boolean(own.target&&own.target!==resource.url);
    row.targetCanonical=own.target;
    row.targetCanonicalInvalid=own.status==='Fail';
    row.returnsToSource=Boolean(row.chain && own.target===page.url.href);
    observations.push(prefix + `HTTP 200${resource.url !== target ? ` redirected to ${resource.url}` : ''}. ${index.status === 'Partial' ? 'Target declares noindex/none. ' : ''}${own.target && own.target !== resource.url ? 'Target declares a different canonical (chain). ' : ''}${own.status === 'Fail' ? 'Target canonical declarations are invalid/conflicting. ' : ''}Content equivalence and Google-selected canonical not established.`);
  }
  return observations;
}
