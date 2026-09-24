import { analyzeHtml, setFinding, type Finding, type AuditStatus } from './html-measurements';
import type { CrawlOutcome } from './crawl-outcomes';
import type { MeasurementEvidence } from './measurement-contract';
import { crawlTimingValue, CRAWL_TIMING_LIMITS } from './crawl-timing';
export type CrawledPage = {
  url: URL;
  html: string;
  response: Response;
  durationMs: number;
  redirects: number;
  title: string;
  description: string;
};


const SITEWIDE_FINDING_IDS = new Set([
  "o1", "o2", "o5", "o9", "o10", "o13", "u34", "t21", "t22", "t20", "t4", "t5",
  "t14", "t24", "t26", "t28", "t29", "t31", "t32", "t33", "t45", "t53", "o42", "o44", "u37",
  "u39", "c17", "c19", "t35", "t40", "t43", "o47",
]);

// Unfetched attempted pages count against every site-wide claim: an address we never
// downloaded can neither pass nor fail, so it lowers completeness instead of being dropped.
// A truncated discovery budget (sitemap page/request caps) breaks completeness the same
// way: the discovered set understates the site, so no pass may be published from it.
export function mergeSitewideFindings(homeFindings: Record<string, Finding>, pages: CrawledPage[], crawlOutcomes: CrawlOutcome[] = [], pageBudgetReached = false) {
  pages = [...new Map(pages.map(page => [page.url.href, page])).values()];
  const unfetched = crawlOutcomes.filter(row => row.outcome !== 'analyzed');
  const unfetchedNote = unfetched.length
    ? ` ${unfetched.length} attempted page(s) could not be fetched (${[...new Set(unfetched.map(row => row.outcome))].join(", ")}); site-wide status covers reachable pages only and cannot publish a pass.`
    : "";
  const budgetNote = pageBudgetReached
    ? " Sitemap page discovery hit its request/page budget, so the discovered sample is truncated and cannot publish a pass."
    : "";
  if (!pages.length) return homeFindings;
  const perPage = pages.map((page) => ({ page, findings: analyzeHtml(page.html, page.url, page.response, page.durationMs, page.redirects) }));
  const severity: Record<AuditStatus, number> = { Fail: 4, Partial: 3, Pass: 2, "N/A": 1 };
  for (const id of SITEWIDE_FINDING_IDS) {
    const checks = perPage.map(({ page, findings }) => ({ page, finding: findings[id] })).filter((entry) => entry.finding);
    if (!checks.length) continue;
    const applicable = checks.filter(({ finding }) => finding.status !== "N/A");
    const considered = applicable.length ? applicable : checks;
    const worst = considered.reduce((current, entry) => severity[entry.finding.status] > severity[current.finding.status] ? entry : current);
    const failedPages = checks.filter(({ finding }) => finding.status === "Fail").map(({ page }) => page.url.href);
    const partialPages = checks.filter(({ finding }) => finding.status === "Partial").length;
    const passedPages = checks.filter(({ finding }) => finding.status === "Pass").length;
    const confidenceOrder: Record<MeasurementEvidence["confidence"], number> = { low: 1, medium: 2, high: 3 };
    const confidence = checks.reduce<MeasurementEvidence["confidence"]>(
      (current, entry) => confidenceOrder[entry.finding.evidence.confidence] < confidenceOrder[current] ? entry.finding.evidence.confidence : current,
      "high",
    );
    const scopedChecks = checks.filter((entry) => entry.finding.evidence.scope);
    const covered = scopedChecks.length
      ? scopedChecks.reduce((sum, entry) => sum + (entry.finding.evidence.scope?.discovered ?? 0), 0)
      : checks.length;
    const scope = covered || unfetched.length
      ? {
          tested: scopedChecks.length
            ? scopedChecks.reduce((sum, entry) => sum + (entry.finding.evidence.scope?.tested ?? 0), 0)
            : checks.length,
          discovered: covered + unfetched.length,
          complete: (scopedChecks.length ? scopedChecks.every((entry) => entry.finding.evidence.scope?.complete) : true) && unfetched.length === 0 && !pageBudgetReached,
        }
      : undefined;
    setFinding(
      homeFindings,
      id,
      worst.finding.status,
      `Checked ${checks.length} pages: ${passedPages} passed, ${partialPages} partial, ${failedPages.length ? `${checks.filter(({ finding }) => finding.status === "Fail").length} failed` : "0 failed"}.${failedPages.length ? ` Problem pages include ${failedPages.join(", ")}.` : ""}${unfetchedNote}${budgetNote} ${worst.finding.note}`,
      {
        source: worst.finding.evidence.source,
        confidence,
        scoreEligible: checks.every((entry) => entry.finding.evidence.scoreEligible),
        scope,
        pageResults: checks.map(({page, finding}) => ({url: page.url.href, status: finding.status,
          ...(finding.evidence.pageResults?.[0]?.value !== undefined ? {value: finding.evidence.pageResults[0].value} : {}),
          ...(finding.evidence.pageResults?.[0]?.headerDeclarations ? {headerDeclarations: finding.evidence.pageResults[0].headerDeclarations} : {}),
          ...(finding.evidence.pageResults?.[0]?.declarations ? {declarations: finding.evidence.pageResults[0].declarations} : {})})),
      },
    );
  }

  for (const [id, presenceId, label] of [["o4", "o1", "titles"], ["o8", "o5", "meta descriptions"]] as const) {
    const values = perPage.map(({page, findings}) => ({url: page.url.href, value: findings[presenceId].evidence.pageResults?.[0]?.value ?? "", declarations: findings[presenceId].evidence.pageResults?.[0]?.declarations ?? []}));
    const key = (value: string) => value.trim().replace(/\s+/g, " ").toLowerCase();
    const ambiguous = values.filter(row => row.declarations.length > 1);
    const populated = values.filter(row => row.declarations.length <= 1 && key(row.value));
    const counts = new Map<string, number>();
    for (const row of populated) counts.set(key(row.value), (counts.get(key(row.value)) ?? 0) + 1);
    const duplicated = populated.filter(row => (counts.get(key(row.value)) ?? 0) > 1);
    const status: AuditStatus = duplicated.length ? "Fail" : populated.length >= 2 && !ambiguous.length ? "Pass" : "N/A";
    setFinding(homeFindings, id, status, `Compared ${populated.length} nonempty ${label} across ${pages.length} pages; ${duplicated.length} pages share a duplicate value. ${pages.length - populated.length - ambiguous.length} missing values are handled by the separate presence control. ${ambiguous.length} pages with multiple declarations are excluded from uniqueness comparison.${populated.length < 2 ? " At least two nonempty values are needed for comparison." : ""}${unfetchedNote}${budgetNote}`, {
      scoreEligible: ambiguous.length === 0,
      scope: unfetched.length || pageBudgetReached ? { tested: pages.length, discovered: pages.length + unfetched.length, complete: false } : undefined,
      pageResults: values.map(row => ({...row, status: row.declarations.length > 1 || !key(row.value) || populated.length < 2 ? "N/A" : (counts.get(key(row.value)) ?? 0) > 1 ? "Fail" : "Pass"})),
    });
  }
  const redirectedPages = pages.filter((page) => page.redirects > 1);
  const singleHopPages = pages.filter((page) => page.redirects === 1);
  setFinding(homeFindings, "t9", redirectedPages.length ? "Fail" : "Pass", `${redirectedPages.length ? `${redirectedPages.length} crawled pages used more than one redirect.` : `No redirect chain longer than one hop was found in the crawled sample; ${singleHopPages.length} pages used one acceptable hop.`}${unfetchedNote}${budgetNote}`, {
    scope: { tested: pages.length, discovered: pages.length + unfetched.length, complete: unfetched.length === 0 && !pageBudgetReached },
  });
  const durations = pages.map((page) => page.durationMs).filter(value => Number.isFinite(value) && value >= 0);
  const fastest = Math.min(...durations);
  const slowest = Math.max(...durations);
  setFinding(homeFindings, "t64", "N/A", `${durations.length}/${pages.length} pages have timing observations.${durations.length ? ` Final response-header intervals ranged from ${Math.round(fastest)} to ${Math.round(slowest)} ms.` : ' Timing unavailable.'} Templates were not classified and repeated measurements were not taken. ${CRAWL_TIMING_LIMITS}`, {
    confidence: 'low', scoreEligible: false,
    pageResults: pages.map(page => ({url: page.url.href, status: 'N/A', value: crawlTimingValue(page.durationMs)})),
  });
  setFinding(homeFindings, "t56", "N/A", `The current crawl sample does not verify every discovered link target.`, { confidence: "low", scoreEligible: false });
  return homeFindings;
}
