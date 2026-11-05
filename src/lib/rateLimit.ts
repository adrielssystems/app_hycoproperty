interface RateLimitRecord {
  count: number;
  resetTime: number;
}

// In-memory sliding window cache per IP / Identifier
const ipCache = new Map<string, RateLimitRecord>();

// Clean up stale entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, value] of ipCache.entries()) {
      if (value.resetTime <= now) {
        ipCache.delete(key);
      }
    }
  }, 5 * 60 * 1000);
  // Unref interval if in Node environment so it doesn't hold the process open
  if (interval && typeof (interval as any).unref === 'function') {
    (interval as any).unref();
  }
}

export interface RateLimitOptions {
  limit?: number;        // Max requests allowed in the window
  windowMs?: number;     // Window duration in milliseconds (default 60s)
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Sliding window rate limiter for API endpoints
 */
export function rateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): RateLimitResult {
  const limit = options.limit ?? 60;
  const windowMs = options.windowMs ?? 60 * 1000;
  const now = Date.now();

  const record = ipCache.get(identifier);

  if (!record || record.resetTime <= now) {
    ipCache.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil((now + windowMs) / 1000),
    };
  }

  record.count += 1;

  if (record.count > limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(record.resetTime / 1000),
    };
  }

  return {
    success: true,
    limit,
    remaining: Math.max(0, limit - record.count),
    reset: Math.ceil(record.resetTime / 1000),
  };
}

