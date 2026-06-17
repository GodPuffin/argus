/**
 * Best-effort in-memory rate limiter for the public demo.
 *
 * A per-IP token bucket guards `/api/chat` against runaway cost/abuse on a
 * public showcase. It is intentionally simple: state lives on `globalThis` so
 * it survives module reloads within a warm serverless instance, but resets on
 * cold start and is NOT shared across instances. Acceptable for a demo; a
 * hardened deploy would back this with Redis/Upstash.
 */

interface Bucket {
  tokens: number;
  updatedAt: number;
}

interface RateLimiterConfig {
  /** Maximum burst size. */
  capacity: number;
  /** Tokens refilled per second. */
  refillPerSecond: number;
}

const DEFAULT_CONFIG: RateLimiterConfig = {
  capacity: 12,
  refillPerSecond: 12 / 60,
};

declare global {
  // eslint-disable-next-line no-var
  var __demoRateBuckets: Map<string, Bucket> | undefined;
}

function buckets(): Map<string, Bucket> {
  if (!globalThis.__demoRateBuckets) {
    globalThis.__demoRateBuckets = new Map();
  }
  return globalThis.__demoRateBuckets;
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export function checkRateLimit(
  key: string,
  config: RateLimiterConfig = DEFAULT_CONFIG,
): RateLimitResult {
  const now = Date.now();
  const store = buckets();
  const bucket = store.get(key) ?? { tokens: config.capacity, updatedAt: now };

  const elapsedSeconds = (now - bucket.updatedAt) / 1000;
  bucket.tokens = Math.min(
    config.capacity,
    bucket.tokens + elapsedSeconds * config.refillPerSecond,
  );
  bucket.updatedAt = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    store.set(key, bucket);
    return {
      ok: true,
      remaining: Math.floor(bucket.tokens),
      retryAfterSeconds: 0,
    };
  }

  store.set(key, bucket);
  const tokensNeeded = 1 - bucket.tokens;
  const retryAfterSeconds = Math.ceil(tokensNeeded / config.refillPerSecond);
  return { ok: false, remaining: 0, retryAfterSeconds };
}

/** Extract a best-effort client identifier from request headers. */
export function clientKeyFromRequest(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return (fwd.split(",")[0] ?? fwd).trim();
  return (
    req.headers.get("x-real-ip") ??
    req.headers.get("cf-connecting-ip") ??
    "anonymous"
  );
}
