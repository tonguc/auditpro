// P1-P3 plan C1 (field): Chrome UX Report (CrUX) origin-level p75 field metrics.
// Field Core Web Vitals need AUDITPRO_CRUX_API_KEY; without it the field claims
// (t15/t16/t17) stay unmeasured and can never publish a pass (P0 rule). The
// query posts the origin string to Google's fixed endpoint — no audited URL is
// fetched here, so no new SSRF surface is opened.
export const FIELD_CWV_SOURCE = "chrome-ux-report@1.0.0";

export function fieldCwvApiKey(setting = process.env.AUDITPRO_CRUX_API_KEY) {
  return setting?.trim() || null;
}

export type FieldCwvMetric = { formFactor: string; lcpMsP75: number | null; inpMsP75: number | null; clsP75: number | null };

// Official Core Web Vitals thresholds (CrUX / PageSpeed Insights):
// LCP 2.5s/4s, INP 200ms/500ms, CLS 0.1/0.25 (good/poor boundaries).
export function fieldCwvThresholdStatus(kind: "lcp" | "inp" | "cls", value: number | null) {
  if (typeof value !== "number") return "N/A" as const;
  const [good, poor] = kind === "lcp" ? [2500, 4000] : kind === "inp" ? [200, 500] : [0.1, 0.25];
  return (value <= good ? "Pass" : value <= poor ? "Partial" : "Fail") as "Pass" | "Partial" | "Fail";
}

export function parseCruxResponse(payload: unknown, formFactor: string): FieldCwvMetric | null {
  const record = (payload as { record?: { metrics?: Record<string, { percentiles?: { p75?: unknown } }> } } | null)?.record;
  const metrics = record?.metrics;
  if (!metrics) return null;
  const p75 = (name: string) => {
    const value = metrics[name]?.percentiles?.p75;
    return typeof value === "number" ? value : null;
  };
  return {
    formFactor,
    lcpMsP75: p75("largest_contentful_paint"),
    inpMsP75: p75("interaction_to_next_paint"),
    clsP75: p75("cumulative_layout_shift"),
  };
}

export async function fetchFieldCwv(origin: string, key: string, fetchImpl: typeof fetch = fetch): Promise<FieldCwvMetric[]> {
  const results: FieldCwvMetric[] = [];
  for (const formFactor of ["PHONE", "DESKTOP"]) {
    try {
      const response = await fetchImpl(`https://chromeuxreport.googleapis.com/v1/records:query?key=${encodeURIComponent(key)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: origin, formFactor }),
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) continue;
      const parsed = parseCruxResponse(await response.json().catch(() => null), formFactor);
      if (parsed) results.push(parsed);
    } catch {
      // Field data unavailable: never invent a metric and never fail the scan.
    }
  }
  return results;
}
