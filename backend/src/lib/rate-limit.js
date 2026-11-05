// Tiny in-memory sliding-window limiter. Good enough for a single Node process;
// if you deploy to many serverless instances, swap this for Redis/Upstash.
const buckets = (globalThis._enxRateBuckets ??= new Map())

// { peek: true } only checks the bucket without recording a hit (use it to count failures only).
export function rateLimit(key, { limit, windowMs, peek = false }) {
  const now = Date.now()
  const hits = (buckets.get(key) ?? []).filter((t) => now - t < windowMs)
  if (hits.length >= limit) {
    buckets.set(key, hits)
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - hits[0])) / 1000) }
  }
  if (peek) return { allowed: true, retryAfter: 0 }
  hits.push(now)
  buckets.set(key, hits)
  return { allowed: true, retryAfter: 0 }
}

export function resetLimit(key) {
  buckets.delete(key)
}

// Needs `app.set('trust proxy', 1)` when running behind a reverse proxy so req.ip is the real client.
export function clientIp(req) {
  return req.ip || 'local'
}
