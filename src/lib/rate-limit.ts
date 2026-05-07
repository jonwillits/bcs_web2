/**
 * In-memory sliding window rate limiter for Vercel serverless.
 *
 * Each function instance maintains its own map, so this is not globally
 * consistent across instances. This is sufficient for ~150 concurrent users
 * to prevent brute-force attacks; for 500+ users, migrate to Upstash Redis.
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

// Periodically clean expired entries to prevent memory leaks
const CLEANUP_INTERVAL = 60_000 // 1 minute
let lastCleanup = Date.now()

function cleanup() {
  const now = Date.now()
  if (now - lastCleanup < CLEANUP_INTERVAL) return
  lastCleanup = now
  for (const [key, entry] of store) {
    if (now > entry.resetAt) {
      store.delete(key)
    }
  }
}

/**
 * Check if a request is within rate limits.
 *
 * @param key - Unique identifier (e.g., IP address or email)
 * @param action - Action name (used as part of the cache key)
 * @param maxAttempts - Maximum attempts allowed in the window
 * @param windowMs - Time window in milliseconds
 * @returns { allowed, retryAfterMs } — retryAfterMs is set when blocked
 */
export function checkRateLimit(
  key: string,
  action: string,
  maxAttempts: number,
  windowMs: number
): { allowed: boolean; retryAfterMs?: number } {
  cleanup()

  const cacheKey = `${action}:${key}`
  const now = Date.now()
  const entry = store.get(cacheKey)

  // No existing entry or window expired — allow and start fresh
  if (!entry || now > entry.resetAt) {
    store.set(cacheKey, { count: 1, resetAt: now + windowMs })
    return { allowed: true }
  }

  // Within window — check count
  if (entry.count < maxAttempts) {
    entry.count++
    return { allowed: true }
  }

  // Rate limited
  return {
    allowed: false,
    retryAfterMs: entry.resetAt - now,
  }
}

/**
 * Extract client IP from request headers (Vercel sets x-forwarded-for).
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return request.headers.get('x-real-ip') || 'unknown'
}

/**
 * Create a 429 Too Many Requests response with Retry-After header.
 */
export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSeconds = Math.ceil(retryAfterMs / 1000)
  return new Response(
    JSON.stringify({
      error: 'Too many requests. Please try again later.',
      retryAfter: retryAfterSeconds,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfterSeconds),
      },
    }
  )
}
