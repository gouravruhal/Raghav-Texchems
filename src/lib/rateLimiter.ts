/**
 * Rate Limiting & Throttling Utility
 *
 * Implements a sliding-window rate limiter on the client-side to mitigate
 * brute-force attempts and denial-of-service spam on critical actions.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // in milliseconds
}

const actionTimestamps: Map<string, number[]> = new Map();

/**
 * Check whether an action key is permitted under rate limit rules.
 * Returns { allowed: true } if permitted, or { allowed: false, retryAfterSeconds: number } if throttled.
 */
export function checkRateLimit(
  actionKey: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 60 * 1000 }
): { allowed: boolean; retryAfterSeconds: number } {
  const now = Date.now();
  const timestamps = actionTimestamps.get(actionKey) || [];

  // Filter timestamps within the sliding window
  const validTimestamps = timestamps.filter((time) => now - time < config.windowMs);

  if (validTimestamps.length >= config.maxRequests) {
    const oldestTimestamp = validTimestamps[0];
    const retryAfterMs = config.windowMs - (now - oldestTimestamp);
    const retryAfterSeconds = Math.max(1, Math.ceil(retryAfterMs / 1000));

    return {
      allowed: false,
      retryAfterSeconds,
    };
  }

  // Record this attempt
  validTimestamps.push(now);
  actionTimestamps.set(actionKey, validTimestamps);

  return {
    allowed: true,
    retryAfterSeconds: 0,
  };
}

/**
 * Reset rate limit counter for a specific key (e.g. upon successful authentication)
 */
export function resetRateLimit(actionKey: string): void {
  actionTimestamps.delete(actionKey);
}
