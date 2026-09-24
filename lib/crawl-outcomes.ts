export type CrawlOutcome = {
  url: string;
  finalUrl?: string;
  status?: number;
  outcome: 'analyzed' | 'http-error' | 'unavailable' | 'non-html' | 'too-large' | 'limit';
};

export function crawlFailures(outcomes: CrawlOutcome[]) {
  return outcomes.filter(row => row.outcome === 'http-error' || row.outcome === 'unavailable');
}
