/**
 * Upstash Redis rate limiter.
 * Returns { success: true } in development or if Upstash env vars are not set,
 * so the build and local dev don't crash without Redis configured.
 */
export async function checkRateLimit(
  identifier: string,
  action: string,
  limit = 3,
  windowSeconds = 86400 // 24 hours
): Promise<{ success: boolean; remaining?: number }> {
  const url   = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // Graceful fallback — no Redis configured
  if (!url || !token) {
    if (process.env.NODE_ENV !== "production") return { success: true };
    // In production, fail closed if Redis isn't configured
    console.warn("Upstash Redis not configured — rate limiting disabled.");
    return { success: true };
  }

  try {
    const { Ratelimit } = await import("@upstash/ratelimit");
    const { Redis }     = await import("@upstash/redis");

    const redis = new Redis({ url, token });
    const ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
      prefix: `freebie-finder:${action}`,
    });

    const result = await ratelimit.limit(identifier);
    return { success: result.success, remaining: result.remaining };
  } catch (err) {
    console.error("Rate limit check failed:", err);
    return { success: true }; // fail open on unexpected errors
  }
}
