import { NextRequest, NextResponse } from 'next/server';

// ─── In-Memory Token-Bucket Rate Limiter ────────────────────────────────────
//
// Each unique key (typically the client IP) gets a bucket that refills at a
// steady rate. Requests consume one token; when the bucket is empty the
// request is rejected with HTTP 429.
//
// This is intentionally process-local. For a horizontally scaled deployment,
// swap the backing store for Redis or Upstash.

type Bucket = {
  tokens: number;
  lastRefill: number;
};

const buckets = new Map<string, Bucket>();

// Periodic cleanup — remove stale entries every 5 minutes to prevent leaks.
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function ensureCleanup(bucketMaxAge: number): void {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      if (now - bucket.lastRefill > bucketMaxAge) {
        buckets.delete(key);
      }
    }
    // Allow the timer to be garbage-collected if no more entries.
    if (buckets.size === 0 && cleanupTimer) {
      clearInterval(cleanupTimer);
      cleanupTimer = null;
    }
  }, CLEANUP_INTERVAL_MS);
  // Don't keep the Node.js process alive just for cleanup.
  if (cleanupTimer && typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

export type RateLimitConfig = {
  /** Maximum burst size (bucket capacity). */
  maxTokens: number;
  /** Tokens added per window. */
  refillCount: number;
  /** Window duration in milliseconds. */
  refillWindowMs: number;
  /** How long to keep stale buckets before cleanup (ms). Default 10 min. */
  bucketMaxAge?: number;
};

/**
 * Predefined rate-limit profiles.
 *
 * - `auth`   — Strict: 5 requests per minute, burst 5 (login/signup).
 * - `api`    — Moderate: 30 requests per minute, burst 10.
 * - `review` — Moderate: 10 requests per minute, burst 3.
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  auth: { maxTokens: 5, refillCount: 5, refillWindowMs: 60_000 },
  api: { maxTokens: 10, refillCount: 30, refillWindowMs: 60_000 },
  review: { maxTokens: 3, refillCount: 10, refillWindowMs: 60_000 },
  report: { maxTokens: 5, refillCount: 5, refillWindowMs: 60_000 },
};

function getClientKey(request: NextRequest): string {
  // Prefer X-Forwarded-For (set by reverse proxies / Vercel), fall back to
  // connection remoteAddress.
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return request.headers.get('x-real-ip') ?? 'unknown';
}

function tryConsume(key: string, config: RateLimitConfig): {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
} {
  const now = Date.now();
  const bucketMaxAge = config.bucketMaxAge ?? 10 * 60_000;

  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = { tokens: config.maxTokens, lastRefill: now };
    buckets.set(key, bucket);
  }

  // Refill tokens based on elapsed time.
  const elapsed = now - bucket.lastRefill;
  const tokensToAdd = (elapsed / config.refillWindowMs) * config.refillCount;
  bucket.tokens = Math.min(config.maxTokens, bucket.tokens + tokensToAdd);
  bucket.lastRefill = now;

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    ensureCleanup(bucketMaxAge);
    return { allowed: true, remaining: Math.floor(bucket.tokens), retryAfterSec: 0 };
  }

  // Calculate how long until one token is available.
  const msUntilToken = ((1 - bucket.tokens) / config.refillCount) * config.refillWindowMs;
  ensureCleanup(bucketMaxAge);
  return {
    allowed: false,
    remaining: 0,
    retryAfterSec: Math.ceil(msUntilToken / 1000),
  };
}

/**
 * Check rate limit for a request. Returns `null` if allowed, or a 429
 * `NextResponse` if the limit has been exceeded.
 *
 * Usage in an API route:
 * ```ts
 * const limited = checkRateLimit(request, 'auth');
 * if (limited) return limited;
 * ```
 */
export function checkRateLimit(
  request: NextRequest,
  profile: keyof typeof RATE_LIMITS | RateLimitConfig,
): NextResponse | null {
  const config = typeof profile === 'string' ? RATE_LIMITS[profile] : profile;
  if (!config) return null;

  const key = `${typeof profile === 'string' ? profile : 'custom'}:${getClientKey(request)}`;
  const result = tryConsume(key, config);

  if (result.allowed) return null;

  return NextResponse.json(
    { error: 'Too many requests. Please try again shortly.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(result.retryAfterSec),
        'X-RateLimit-Limit': String(config.maxTokens),
        'X-RateLimit-Remaining': '0',
      },
    },
  );
}
