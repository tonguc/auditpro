import type { Page } from "playwright";

// P1-P3 plan C1: LAB Core Web Vitals from the stabilized browser pass.
// t15/t16/t17 are FIELD claims (CrUX / Search Console). The values collected
// here are observations only: a local headless run with reduced motion and
// suppressed animations is not field data, and the automated pass performs no
// interactions, so INP cannot be measured even in lab.
export type LabCwv = { lcpMs: number | null; cls: number | null };

export async function collectLabCwv(page: Page): Promise<LabCwv> {
  const data = await page.evaluate(async () => {
    const lcpEntries = performance.getEntriesByType("largest-contentful-paint") as unknown as Array<{ startTime: number }>;
    const lcpMs = lcpEntries.length ? Math.round(lcpEntries[lcpEntries.length - 1].startTime) : null;
    let cls = 0;
    await new Promise<void>((resolve) => {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as Array<{ hadRecentInput: boolean; value: number }>) {
            if (!entry.hadRecentInput) cls += entry.value;
          }
        });
        observer.observe({ type: "layout-shift", buffered: true } as PerformanceObserverInit);
        requestAnimationFrame(() => requestAnimationFrame(() => { observer.disconnect(); resolve(); }));
      } catch {
        resolve();
      }
    });
    return { lcpMs, cls: Number(cls.toFixed(4)) };
  });
  return {
    lcpMs: typeof data.lcpMs === "number" ? data.lcpMs : null,
    cls: typeof data.cls === "number" ? data.cls : null,
  };
}
