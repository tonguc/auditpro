import { forwardedClient } from "./forwarded-client";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 6;
const MAX_RATE_LIMIT_BUCKETS = 500;
const requestLog = new Map<string, number[]>();

function clientKey(request: Request, scope: string) {
  return `${forwardedClient(request)}:${scope}`;
}

export function enforceAnalysisRateLimit(request: Request, scope: string) {
  const key = clientKey(request, scope);
  const now = Date.now();
  const recent = (requestLog.get(key) ?? []).filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= RATE_LIMIT_REQUESTS) {
    const retryAfter = Math.max(1, Math.ceil((RATE_LIMIT_WINDOW_MS - (now - recent[0])) / 1000));
    return { allowed: false, retryAfter };
  }

  recent.push(now);
  requestLog.delete(key);
  requestLog.set(key, recent);

  if (requestLog.size > MAX_RATE_LIMIT_BUCKETS) {
    for (const [bucketKey, timestamps] of requestLog) {
      if (!timestamps.some((timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS)) requestLog.delete(bucketKey);
    }
  }
  while (requestLog.size > MAX_RATE_LIMIT_BUCKETS) {
    evictLeastUsedBucket();
  }
  return { allowed: true, retryAfter: 0 };
}

function evictLeastUsedBucket() {
  let evictKey: string | undefined;
  let evictAttemptCount = Number.POSITIVE_INFINITY;
  let evictNewestAttempt = Number.POSITIVE_INFINITY;

  for (const [bucketKey, timestamps] of requestLog) {
    const newestAttempt = timestamps.at(-1) ?? 0;
    if (
      timestamps.length < evictAttemptCount ||
      (timestamps.length === evictAttemptCount && newestAttempt < evictNewestAttempt)
    ) {
      evictKey = bucketKey;
      evictAttemptCount = timestamps.length;
      evictNewestAttempt = newestAttempt;
    }
  }

  if (evictKey) requestLog.delete(evictKey);
}

export function resetAnalysisRateLimitForTests() {
  requestLog.clear();
}

export function analysisRateLimitBucketCountForTests() {
  return requestLog.size;
}
