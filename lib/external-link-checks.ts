import type { ExternalLink } from "./external-link-evidence";

// P1-P3 plan C2: optional external link status verification with its own
// budget and scope. It is OFF by default so the crawler never issues external
// requests implicitly (site fixtures assert this); enabling it is an explicit
// deployment decision and every target still passes the public-address policy
// through the injected loader. External links remain declarations: a status
// check is a bounded sample, not destination trust or runtime security.
//
// The planning and summarising logic is synchronous and pure so the budget and
// scope semantics are unit-testable; only the request loop awaits.
export type ExternalLinkCheck = { url: string; finalUrl: string; status: number; verified: boolean };

export function externalLinkChecksEnabled(setting = process.env.AUDITPRO_EXTERNAL_LINK_CHECKS) {
  return setting === "enabled";
}

export function externalLinkCheckBudget(setting = process.env.AUDITPRO_EXTERNAL_LINK_CHECK_LIMIT) {
  const parsed = Number(setting);
  return Number.isInteger(parsed) && parsed >= 0 ? Math.min(parsed, 100) : 20;
}

export function planExternalLinkChecks(links: ExternalLink[], budget: number) {
  const distinct = [...new Map(links.map((link) => [link.url, link])).values()];
  return { targets: distinct.slice(0, Math.max(0, budget)), discovered: distinct.length };
}

export function summarizeExternalLinkChecks(discovered: number, checks: ExternalLinkCheck[]) {
  const failed = checks.filter((check) => check.verified && check.status >= 400).length;
  const unverified = checks.filter((check) => !check.verified).length;
  return {
    failed,
    unverified,
    scope: { tested: checks.filter((check) => check.verified).length, discovered, complete: checks.length === discovered && unverified === 0 },
  };
}

export async function verifyExternalLinks(
  links: ExternalLink[],
  load: (url: URL) => Promise<{ status: number; finalUrl: string } | null>,
  budget: number,
) {
  const plan = planExternalLinkChecks(links, budget);
  const checks: ExternalLinkCheck[] = [];
  for (const link of plan.targets) {
    try {
      const result = await load(new URL(link.url));
      checks.push(result
        ? { url: link.url, finalUrl: result.finalUrl, status: result.status, verified: true }
        : { url: link.url, finalUrl: link.url, status: 0, verified: false });
    } catch {
      checks.push({ url: link.url, finalUrl: link.url, status: 0, verified: false });
    }
  }
  const { scope, failed, unverified } = summarizeExternalLinkChecks(plan.discovered, checks);
  return {
    checks,
    scope,
    note: `${plan.targets.length}/${plan.discovered} external targets requested within the external-link budget; ${failed} returned HTTP 4xx/5xx and ${unverified} were unavailable. Unrequested and unavailable targets are not passes.`,
  };
}
