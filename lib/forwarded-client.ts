// Client address resolution for rate-limit keys.
//
// Each trusted proxy APPENDS the address it received the connection from to
// X-Forwarded-For, so only the rightmost TRUSTED_PROXY_HOPS entries are
// infrastructure-added; everything to their left is client-controlled text.
// The previous code read the FIRST entry, which let a caller rotate the
// spoofed prefix to mint a fresh bucket and reset both the security and the
// analysis rate limits. One helper keeps both limiters on the same trust rule.
const DEFAULT_TRUSTED_PROXY_HOPS = 1;
const MAX_TRUSTED_PROXY_HOPS = 10;

function trustedProxyHops() {
  const raw = process.env.AUDITPRO_TRUSTED_PROXY_HOPS;
  // `Number("")` is 0, which would silently mean "trust nothing"; unset must
  // still be the documented default of one trusted hop.
  if (raw === undefined || raw === "") return DEFAULT_TRUSTED_PROXY_HOPS;
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 && parsed <= MAX_TRUSTED_PROXY_HOPS
    ? parsed
    : DEFAULT_TRUSTED_PROXY_HOPS;
}

export function forwardedClient(request: Request): string {
  const hops = trustedProxyHops();
  const entries = (request.headers.get("x-forwarded-for") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (hops > 0 && entries.length) {
    // Clamped: a header rewritten to a single address by an outer proxy is
    // still the client address even when it is shorter than the hop count.
    return entries[Math.max(0, entries.length - hops)];
  }
  return request.headers.get("x-real-ip")?.trim() || "local";
}
