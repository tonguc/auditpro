// fetchPublic times only the final fetch until its response headers are available.
// DNS is resolved before this interval; redirects and body consumption are separate.
export function crawlTimingValue(durationMs: number): string {
  return Number.isFinite(durationMs) && durationMs >= 0
    ? `${Math.round(durationMs)} ms — final response headers; one crawler observation`
    : 'Timing unavailable';
}

export const CRAWL_TIMING_LIMITS = 'Measured from the crawler after DNS resolution until final response headers. Excludes previous redirect hops and body download. Not browser TTFB, page load time or field Core Web Vitals. No performance verdict follows from one observation.';
