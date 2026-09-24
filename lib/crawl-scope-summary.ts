import type { CrawlOutcome } from './crawl-outcomes';
export function crawlScopeSummary(scan: {pagesAnalyzed?: number; requestedPageLimit?: number; pageLimit?: number; crawlOutcomes?: CrawlOutcome[]}) {
  const count = (value?: number) => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
  const outcomes = scan.crawlOutcomes;
  return {
    analyzed: count(scan.pagesAnalyzed), requested: count(scan.requestedPageLimit), applied: count(scan.pageLimit),
    unprocessed: outcomes ? new Set(outcomes.filter(row => row.outcome !== 'analyzed' && row.outcome !== 'limit').map(row => row.url)).size : null,
    limited: outcomes ? new Set(outcomes.filter(row => row.outcome === 'limit').map(row => row.url)).size : null,
    reduced: count(scan.requestedPageLimit) !== null && count(scan.pageLimit) !== null && scan.requestedPageLimit! > scan.pageLimit!,
  };
}
