import { forwardedClient } from "./forwarded-client";

type SecurityLimitBucket = {
  attempts: number[];
};

const defaultWindowMs = 5 * 60 * 1000;
const defaultMaxAttempts = 5;
const maxBuckets = 1_000;
const buckets = new Map<string, SecurityLimitBucket>();

export function recordSecurityFailure(
  request: Request,
  scope: string,
  options: { windowMs?: number; maxAttempts?: number } = {},
) {
  const windowMs = options.windowMs ?? defaultWindowMs;
  const maxAttempts = options.maxAttempts ?? defaultMaxAttempts;
  const now = Date.now();
  const key = `${scope}:${forwardedClient(request)}`;
  const bucket = buckets.get(key) ?? { attempts: [] };
  bucket.attempts = bucket.attempts.filter((timestamp) => now - timestamp < windowMs);
  bucket.attempts.push(now);
  buckets.set(key, bucket);

  if (buckets.size > maxBuckets) {
    for (const [bucketKey, value] of buckets) {
      if (!value.attempts.some((timestamp) => now - timestamp < windowMs)) buckets.delete(bucketKey);
    }
  }
  while (buckets.size > maxBuckets) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }

  if (bucket.attempts.length <= maxAttempts) {
    return { limited: false, retryAfter: 0 };
  }

  return {
    limited: true,
    retryAfter: Math.max(1, Math.ceil((windowMs - (now - bucket.attempts[0])) / 1000)),
  };
}

export function resetSecurityRateLimit() {
  buckets.clear();
}

export function securityRateLimitBucketCount() {
  return buckets.size;
}
