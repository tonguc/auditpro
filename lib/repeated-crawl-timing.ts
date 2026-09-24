export type TimingAttempt = {status: number; finalUrl: string; durationMs: number};
export type RepeatedTiming = {url: string; attempts: number; values: number[]; failed: number; skipped: number; median: number | null; min: number | null; max: number | null};

// Small, sequential sample: no percentile or user-experience verdict is inferred.
export async function repeatCrawlTimings(urls: string[], load: (url: URL, timeoutMs: number) => Promise<TimingAttempt>, now = () => performance.now()) {
  const targets = [...new Set(urls)].slice(0, 3);
  const deadline = now() + 15000;
  const rows: RepeatedTiming[] = targets.map(url => ({url, attempts: 0, values: [], failed: 0, skipped: 0, median: null, min: null, max: null}));
  for (let round = 0; round < 3; round++) {
    for (const row of rows) {
      const remaining = Math.floor(deadline - now());
      if (remaining <= 0) { row.skipped++; continue; }
      row.attempts++;
      try {
        const sample = await load(new URL(row.url), Math.min(5000, remaining));
        if (sample.status < 200 || sample.status >= 300 || sample.finalUrl !== row.url || !Number.isFinite(sample.durationMs) || sample.durationMs < 0) { row.failed++; continue; }
        row.values.push(sample.durationMs);
      } catch { row.failed++; }
    }
  }
  for (const row of rows) {
    const sorted = [...row.values].sort((a, b) => a - b);
    if (!sorted.length) continue;
    row.min = sorted[0]; row.max = sorted[sorted.length - 1];
    const mid = Math.floor(sorted.length / 2);
    row.median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return rows;
}

export function repeatedTimingText(row: RepeatedTiming) {
  const summary = row.median === null ? 'Timing unavailable' : `Median ${Math.round(row.median)} ms; range ${Math.round(row.min!)}–${Math.round(row.max!)} ms`;
  return `${summary}. ${row.values.length}/3 valid observations; ${row.failed} failed or changed-target attempts; ${row.skipped} skipped by time budget. Raw ms: ${row.values.map(value => Math.round(value)).join(', ') || 'none'}.`;
}
