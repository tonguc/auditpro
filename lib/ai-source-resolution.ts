import type { Dispatcher } from "undici";
import { pinnedPublicUrlDispatcher, resolvePublicUrl } from "./public-url";

const REDIRECT_HOSTS = new Set(["vertexaisearch.cloud.google.com"]);

export type ResolvedAiSource = {
  providerUrl: string;
  resolvedUrl: string;
  state: "direct" | "resolved" | "unresolved";
};

type ResolutionOptions = {
  loadRedirect?: (url: URL) => Promise<URL | null>;
  validateDestination?: (url: URL) => Promise<void>;
  maximumHops?: number;
};

function safeHttpUrl(value: string | URL) {
  const url = value instanceof URL ? new URL(value.href) : new URL(value);
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
    throw new Error("Unsupported provider source URL.");
  }
  if (url.port && !["80", "443"].includes(url.port)) throw new Error("Unsupported provider source port.");
  url.hash = "";
  return url;
}

async function loadProviderRedirect(url: URL) {
  if (!REDIRECT_HOSTS.has(url.hostname.toLowerCase())) throw new Error("Provider redirect host is not allowlisted.");
  const dispatcher = pinnedPublicUrlDispatcher(await resolvePublicUrl(url));
  try {
    const response = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(15_000),
      headers: { "User-Agent": "Povlex/1.0 AI source verification" },
      dispatcher,
    } as RequestInit & { dispatcher: Dispatcher });
    const location = response.headers.get("location");
    return location && response.status >= 300 && response.status < 400
      ? safeHttpUrl(new URL(location, url))
      : null;
  } finally {
    await dispatcher.close();
  }
}

export async function resolveAiSourceUrl(address: string, options: ResolutionOptions = {}): Promise<ResolvedAiSource> {
  const providerUrl = safeHttpUrl(address);
  if (!REDIRECT_HOSTS.has(providerUrl.hostname.toLowerCase())) {
    return { providerUrl: providerUrl.href, resolvedUrl: providerUrl.href, state: "direct" };
  }

  const loadRedirect = options.loadRedirect ?? loadProviderRedirect;
  const validateDestination = options.validateDestination ?? (async (url: URL) => { await resolvePublicUrl(url); });
  const maximumHops = Math.max(1, Math.min(options.maximumHops ?? 3, 5));
  let current = providerUrl;

  for (let hop = 0; hop < maximumHops; hop++) {
    const next = await loadRedirect(current);
    if (!next) return { providerUrl: providerUrl.href, resolvedUrl: providerUrl.href, state: "unresolved" };
    const safeNext = safeHttpUrl(next);
    if (!REDIRECT_HOSTS.has(safeNext.hostname.toLowerCase())) {
      await validateDestination(safeNext);
      return { providerUrl: providerUrl.href, resolvedUrl: safeNext.href, state: "resolved" };
    }
    current = safeNext;
  }

  return { providerUrl: providerUrl.href, resolvedUrl: providerUrl.href, state: "unresolved" };
}

export async function resolveAiSourceUrls(addresses: string[], concurrency = 4) {
  const unique = [...new Set(addresses)];
  const results = new Array<ResolvedAiSource>(unique.length);
  let cursor = 0;
  await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), unique.length) }, async () => {
    while (cursor < unique.length) {
      const index = cursor++;
      try {
        results[index] = await resolveAiSourceUrl(unique[index]);
      } catch {
        const safe = safeHttpUrl(unique[index]);
        results[index] = { providerUrl: safe.href, resolvedUrl: safe.href, state: "unresolved" };
      }
    }
  }));
  return results;
}
