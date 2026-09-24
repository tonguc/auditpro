import { indexingEvidence, canonicalEvidence, structuredDataEvidence } from './seo-evidence';
import { calibratedSource } from './measurement-policy';
import { documentMetadata } from './document-metadata';
import { loadingEvidence } from './loading-evidence';
import { contactEvidence } from './contact-evidence';
import { externalLinkEvidence } from './external-link-evidence';
import { securityHeaderEvidence } from './security-header-evidence';
import {sourceObservations} from './source-observations';
import {inspectContent} from './content-evidence';
import { crawlTimingValue, CRAWL_TIMING_LIMITS } from './crawl-timing';
import { MEASUREMENT_CONTRACT_VERSION, type MeasurementEvidence, type MeasurementSource } from './measurement-contract';
export type AuditStatus = "Pass" | "Partial" | "Fail" | "N/A";

export type Finding = {
  status: AuditStatus;
  note: string;
  evidence: MeasurementEvidence;
};


export function getAttr(tag: string, name: string) {
  const match = tag.match(new RegExp(`\\s${name}\\s*=\\s*(?:["']([^"']*)["']|([^\\s>]+))`, "i"));
  return (match?.[1] ?? match?.[2] ?? "").trim();
}

export function stripTags(value: string) {
  return value.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function metaContent(html: string, key: string, attr = "name") {
  return documentMetadata(html).meta(key, attr);
}

export function setFinding(
  findings: Record<string, Finding>,
  id: string,
  status: AuditStatus,
  note: string,
  options: {
    source?: MeasurementSource;
    confidence?: MeasurementEvidence["confidence"];
    scoreEligible?: boolean;
    scope?: MeasurementEvidence["scope"];
    pageResults?: MeasurementEvidence["pageResults"];
  } = {},
) {
  findings[id] = {
    status,
    note: `Automated check: ${note}`,
    evidence: {
      source: options.source ?? "crawler",
      confidence: options.confidence ?? "high",
      scoreEligible: calibratedSource(id, options.source ?? "crawler") && (options.scoreEligible ?? true),
      contractVersion: MEASUREMENT_CONTRACT_VERSION,
      reasonCode: calibratedSource(id, options.source ?? "crawler") ? "reviewed-bounded-measurement" : "method-not-calibrated",
      scope: options.scope,
      pageResults: options.pageResults,
    },
  };
}


export function analyzeHtml(html: string, finalUrl: URL, response: Response, durationMs: number, redirects: number) {
  const findings: Record<string, Finding> = {};
  const metadata = documentMetadata(html);
  const loading = loadingEvidence(html, finalUrl);
  const contacts = contactEvidence(html);
  const external = externalLinkEvidence(html, finalUrl);
  const seoIndex = indexingEvidence(html, response.headers.get("x-robots-tag") ?? "");
  const seoCanonical = canonicalEvidence(html, finalUrl, response.headers.get("link") ?? "");
  const seoSchema = structuredDataEvidence(html);
  const source = sourceObservations(html,finalUrl);
  const content = inspectContent(html,finalUrl);
  html = html.replace(/<!--[\s\S]*?-->/g, "");
  html = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, tag => tag.slice(0, tag.indexOf(">") + 1) + "</script>");
  const title = metadata.title;
  const description = metadata.description;

  setFinding(findings, "o1", title ? "Pass" : "Fail", title ? `Page title found: “${title.slice(0, 100)}”.` : "Page has no title tag.");
  setFinding(findings, "o5", description ? "Pass" : "Fail", description ? `Meta description found (${description.length} characters).` : "Page has no meta description.");
  for (const [id, values] of [['o1', metadata.titles], ['o5', metadata.descriptions]] as const) {
    if (values.length > 1) setFinding(findings, id, values.some(Boolean) ? 'Pass' : 'Fail', `${values.length} declarations in the parsed document head; ${values.filter(Boolean).length} nonempty. Presence only: multiple declarations require review, and no search-engine choice is inferred.`);
  }
  setFinding(findings, "o9", "N/A", "Selected social metadata declarations; platform preview, completeness and image reachability were not tested.", {scoreEligible:false});
  setFinding(findings, "o13", "N/A", `${content.headings.length} parsed headings; outline semantics and accessibility require review.`, {scoreEligible:false});
  setFinding(findings, "u34", "N/A", `${content.images.filter(image=>image.alt===null).length}/${content.images.length} parsed images lack an alt attribute. Decorative purpose and equivalent accessible names require review.`, {scoreEligible:false});
  setFinding(findings, "t21", "N/A", `${loading.images.length} parsed image elements; width and height declarations are recorded per image. Attribute presence does not verify valid dimensions, reserved layout space or CLS. CSS sizing, aspect-ratio, intrinsic dimensions and actual layout shifts were not measured.`, {scoreEligible:false});
  setFinding(findings, "t22", "N/A", `${loading.images.filter(image=>image.loading==='lazy').length}/${loading.images.length} parsed images declare lazy loading. HTML order does not establish viewport position; loading suitability and actual requests were not measured.`, {scoreEligible:false});
  setFinding(findings, "t20", "N/A", `${loading.images.length} parsed image src declarations. A filename is not proof of served format, compression quality or savings. Picture/srcset selection, content negotiation, CSS images and response bytes were not measured. PNG/JPEG alone is not a verified SEO or performance defect.`, {scoreEligible:false});

  setFinding(findings, "t4", seoIndex.status, seoIndex.note, { scoreEligible: false });
  setFinding(findings, "t5", seoCanonical.status, seoCanonical.note, { scoreEligible: false });
  setFinding(findings, "t14", "N/A", "Final URL path and query parameter names are recorded per page. Parameters can represent valid filters, pagination or variants; their presence is not an SEO defect, and absence is not evidence of descriptive URLs. Parameter purpose, duplicate content, crawl impact and search-engine canonical selection were not verified. Do not remove parameters based on this observation alone.", { confidence: "low", scoreEligible: false });
  setFinding(findings, "t24", "N/A", `${crawlTimingValue(durationMs)}. ${CRAWL_TIMING_LIMITS}`, { confidence: "low", scoreEligible: false });
  setFinding(findings, "t26", "N/A", `${loading.scripts.length} parsed script src declarations. Module, async, defer, legacy fallback and data blocks are distinguished. Actual execution, network timing and performance impact were not measured; parser blocking alone is not a verified defect.`, {scoreEligible:false});
  setFinding(findings, "t27", "N/A", `Final protocol: ${finalUrl.protocol}. Certificate expiry and renewal were not measured; HTTPS delivery is assessed separately by t28.`, { confidence: "low", scoreEligible: false });
  setFinding(findings, "t28", finalUrl.protocol === "https:" ? "Pass" : "Fail", `Final analyzed URL uses ${finalUrl.protocol.replace(":", "").toUpperCase()}.`);
  setFinding(findings, "t29", "N/A", `Observed ${redirects} redirect(s); final URL uses ${finalUrl.protocol.replace(':','').toUpperCase()}. An independent HTTP-start redirect chain was not measured, so HTTP-to-HTTPS redirection is unknown.`, {scoreEligible:false});
  const httpResources=[...source.resources,...loading.scripts.filter(script=>script.src.startsWith('http:')&&script.mode!=='data-block/src-ignored').map(script=>({element:'script',attribute:'src',url:script.src}))];
  setFinding(findings, "t32", "N/A", `${httpResources.length} parsed HTTP resource declarations; final document uses ${finalUrl.protocol}. Actual mixed-content blocking/upgrading, CSS resources, srcset selection and runtime requests were not tested.`, {scoreEligible:false});
  setFinding(findings, "t33", "N/A", "Selected final-response security header declarations are recorded per page, including absent and empty values. Header count does not establish policy validity or protection. CSP Report-Only is separate and does not enforce a policy. Meta-delivered policies, interacting directives and actual browser behavior were not evaluated.", {scoreEligible:false});
  setFinding(findings, "t31", "N/A", "Final-response HSTS declaration recorded per page. Presence alone does not establish protection: empty or invalid policies, max-age=0, HTTP delivery, inherited policy and preload require distinct interpretation. Policy syntax, preload status and actual browser enforcement were not evaluated.", {scoreEligible:false});
  setFinding(findings, "t35", seoSchema.organization.status, seoSchema.organization.note, { scoreEligible: false });
  setFinding(findings, "t40", seoSchema.faq.status, seoSchema.faq.note, { scoreEligible: false });
  setFinding(findings, "t43", seoSchema.localBusiness.status, seoSchema.localBusiness.note, { scoreEligible: false });
  const viewport = metadata.meta('viewport');
  const responsiveViewport = /(?:^|,)\s*width\s*=\s*device-width\s*(?:,|$)/i.test(viewport);
  setFinding(findings, "t45", !viewport ? "Fail" : responsiveViewport ? "Pass" : "Partial", `Viewport declaration: ${viewport || '[absent]'}. This check verifies the declaration only; rendered mobile behavior is measured separately.`);
  setFinding(findings, "t53", "N/A", `Parsed lang declaration: ${source.lang||'[absent]'}. Language correctness and content agreement were not verified.`,{scoreEligible:false});
  setFinding(findings, "o37", "N/A", `${content.links.length} parsed same-origin links. Link count alone does not establish navigation quality.`,{scoreEligible:false});
  setFinding(findings, "o44", "N/A", `${external.length} external HTTP(S) anchor declarations. Target and rel are source attributes, not verified browser behavior. Missing explicit noopener alone is not a defect: noreferrer also implies noopener, and _blank has implicit protection unless opener is requested. Relevance, destination safety, SEO impact and actual navigation were not tested.`, {scoreEligible:false});
  setFinding(findings, "o46", "N/A", "About-page link candidates require parsed navigation evidence. A matching label does not establish content quality, expertise or credibility; absence is not a verified defect.", { confidence: "low", scoreEligible: false });
  setFinding(findings, "o47", "N/A", `${contacts.length} tel/mailto anchor declarations found in parsed HTML. Visibility, destination validity, ownership, contact-form alternatives and actual interaction were not verified; this does not establish trust or AI visibility.`, {scoreEligible:false});
  setFinding(findings, "o49", "N/A", "Policy-page link candidates require parsed navigation evidence. Keywords do not verify a policy page, its completeness or legal compliance.", { confidence: "low", scoreEligible: false });
  setFinding(findings, "u28", "N/A", `${source.footerCount} parsed footer elements. Usefulness, visibility and completeness were not tested.`,{scoreEligible:false});
  setFinding(findings, "u37", "N/A", "Source markup does not establish accessible names. Requires completed rendered axe measurements.",{scoreEligible:false});
  for(const id of ['u39','c17','c19'])setFinding(findings,id,'N/A',`${source.forms} parsed forms and ${source.fields.length} document input fields. DOM ownership, visibility, purpose and actual interaction require rendered measurement.`,{scoreEligible:false});
  const telephoneContacts = contacts.filter(link=>link.kind==='tel');
  setFinding(findings, "c26", telephoneContacts.length ? "Pass" : "Fail", `${telephoneContacts.length} telephone anchor declarations found. This verifies a direct contact path in HTML; number ownership and call completion are not tested.`, { confidence: "medium" });
  setFinding(findings, "c29", "N/A", "Conversion event delivery requires authorized analytics access and an event test. Script names or source keywords are not evidence of working conversion tracking.", { confidence: "low", scoreEligible: false });

  for (const [id, finding] of Object.entries(findings)) {
    finding.evidence.pageResults = [{url: finalUrl.href, status: finding.status,
      ...(id === "o1" ? {value: title} : id === "o5" ? {value: description} : {})}];
  }
  findings.t22.evidence.pageResults![0].value = loading.images.map(image=>`${image.loading}: ${image.src}`).join('\n') || 'No parsed image elements.';
  findings.t20.evidence.pageResults![0].value = loading.images.map(image=>`${image.src} | srcset=${image.hasSrcset}`).join('\n') || 'No parsed image elements.';
  findings.t21.evidence.pageResults![0].value = loading.images.map(image=>`${image.src} | width=${JSON.stringify(image.width)} | height=${JSON.stringify(image.height)}`).join('\n') || 'No parsed image elements.';
  findings.t26.evidence.pageResults![0].value = loading.scripts.map(script=>`${script.mode}: ${script.src}`).join('\n') || 'No parsed script src declarations.';
  findings.t29.evidence.pageResults![0].value = `${finalUrl.href}; redirects=${redirects}; HTTP-start check unavailable`;
  findings.t24.evidence.pageResults![0].value = crawlTimingValue(durationMs);
  findings.o9.evidence.pageResults![0].value=JSON.stringify({'og:title':metadata.meta('og:title','property'),'og:image':metadata.meta('og:image','property'),'twitter:card':metadata.meta('twitter:card'),'twitter:title':metadata.meta('twitter:title')});
  findings.t32.evidence.pageResults![0].value=JSON.stringify(httpResources);
  findings.t45.evidence.pageResults![0].value=metadata.meta('viewport');
  findings.t53.evidence.pageResults![0].value=source.lang;
  for(const id of ['u39','c17','c19'])findings[id].evidence.pageResults![0].value=JSON.stringify(source.fields);
  findings.t14.evidence.pageResults![0].value = JSON.stringify({path:finalUrl.pathname,parameterNames:[...finalUrl.searchParams.keys()]});
  findings.o1.evidence.pageResults![0].declarations = metadata.titles;
  findings.o5.evidence.pageResults![0].declarations = metadata.descriptions;
  findings.o47.evidence.pageResults![0].value = contacts.map(link=>link.target).join('\n') || 'tel: 0 · mailto: 0';
  findings.c26.evidence.pageResults![0].value = contacts.filter(link=>link.kind==='tel').map(link=>link.target).join('\n') || 'tel: 0';
  findings.o44.evidence.pageResults![0].value = external.map(link=>`${link.url} | target=${JSON.stringify(link.target)} | rel=${JSON.stringify(link.rel)}`).join('\n') || 'HTTP(S): 0';
  for(const id of ['t31','t33']){
    const headers=securityHeaderEvidence(response.headers,id==='t31');
    findings[id].evidence.pageResults![0].headerDeclarations=headers;
    findings[id].evidence.pageResults![0].value=headers.map(header=>`${header.name}: ${JSON.stringify(header.value)}`).join('\n');
  }
  return findings;
}

