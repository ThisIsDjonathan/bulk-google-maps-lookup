import { safeRedisOperation, isRedisAvailable } from "@/lib/redis-utils";
import { headers } from "next/headers";

// Configure rate limits
export const RATE_LIMIT = {
  // Maximum number of requests in the time window
  MAX_REQUESTS: process.env.NEXT_PUBLIC_DAILY_LIMIT
    ? parseInt(process.env.NEXT_PUBLIC_DAILY_LIMIT)
    : 50,
  // Time window in milliseconds (24 hours)
  WINDOW_MS: 24 * 60 * 60 * 1000,
};

export async function getClientIp(): Promise<string> {
  try {
    const headersList = await headers();
    return headersList.get("x-forwarded-for") || "unknown-ip";
  } catch (error) {
    console.error("Error getting client IP:", error);
    return "unknown-ip";
  }
}

export async function getRateLimitInfo(ip: string): Promise<{
  remaining: number;
  resetAt: Date;
  isLimited: boolean;
  used: number;
}> {
  const now = Date.now();

  // Keys for Redis
  const countKey = `rate_limit:${ip}:count`;
  const resetAtKey = `rate_limit:${ip}:reset_at`;

  if (isRedisAvailable()) {
    // Get current values from Redis
    const [count, resetAtStr] = await safeRedisOperation(
      async (redis) => {
        return Promise.all([
          redis.get<number>(countKey) || 0,
          redis.get<string>(resetAtKey),
        ]);
      },
      [0, null],
    );

    let resetAt = resetAtStr
      ? new Date(resetAtStr)
      : new Date(now + RATE_LIMIT.WINDOW_MS);

    // If reset time has passed, create a new period
    if (resetAt.getTime() < now) {
      resetAt = new Date(now + RATE_LIMIT.WINDOW_MS);

      // Reset count and update reset time in Redis
      await safeRedisOperation(async (redis) => {
        await redis.set(countKey, 0);
        await redis.set(resetAtKey, resetAt.toISOString());
        // Set expiration to slightly after reset time to ensure automatic cleanup
        const ttlSeconds = Math.ceil(RATE_LIMIT.WINDOW_MS / 1000) + 60;
        await redis.expire(countKey, ttlSeconds);
        await redis.expire(resetAtKey, ttlSeconds);
      }, null);
    }

    const used = typeof count === "number" ? count : 0;
    const remaining = Math.max(0, RATE_LIMIT.MAX_REQUESTS - used);

    console.log(
      `Rate limit for ${ip}: ${used} used, ${remaining} remaining, resets at ${resetAt.toISOString()}`,
    );

    return {
      remaining,
      resetAt,
      isLimited: used >= RATE_LIMIT.MAX_REQUESTS,
      used,
    };
  } else {
    // Fallback to a permissive limit if Redis is not available
    console.warn(
      "Redis not available for rate limiting, using permissive fallback",
    );
    return {
      remaining: RATE_LIMIT.MAX_REQUESTS,
      resetAt: new Date(now + RATE_LIMIT.WINDOW_MS),
      isLimited: false,
      used: 0,
    };
  }
}

/**
 * Increment the rate limit counter for a client
 * Returns false if the rate limit is exceeded
 */
export async function incrementRateLimit(ip: string): Promise<boolean> {
  const now = Date.now();

  // Keys for Redis
  const countKey = `rate_limit:${ip}:count`;
  const resetAtKey = `rate_limit:${ip}:reset_at`;

  if (isRedisAvailable()) {
    // Get current values from Redis
    const [currentCount, resetAtStr] = await safeRedisOperation(
      async (redis) => {
        return Promise.all([
          redis.get<number>(countKey) || 0,
          redis.get<string>(resetAtKey),
        ]);
      },
      [0, null],
    );

    let resetAt = resetAtStr
      ? new Date(resetAtStr)
      : new Date(now + RATE_LIMIT.WINDOW_MS);
    let count = typeof currentCount === "number" ? currentCount : 0;

    // If reset time has passed, create a new period
    if (resetAt.getTime() < now) {
      resetAt = new Date(now + RATE_LIMIT.WINDOW_MS);
      count = 0;
    }

    // Check if already rate limited
    if (count >= RATE_LIMIT.MAX_REQUESTS) {
      console.log(
        `Rate limit already exceeded for ${ip}: ${count}/${RATE_LIMIT.MAX_REQUESTS}`,
      );
      return false;
    }

    // Increment count
    count++;

    // Update Redis
    await safeRedisOperation(async (redis) => {
      await redis.set(countKey, count);
      if (!resetAtStr) {
        await redis.set(resetAtKey, resetAt.toISOString());
      }

      // Set expiration to slightly after reset time to ensure automatic cleanup
      const ttlSeconds = Math.ceil((resetAt.getTime() - now) / 1000) + 60;
      await redis.expire(countKey, ttlSeconds);
      await redis.expire(resetAtKey, ttlSeconds);
    }, null);

    console.log(
      `Incremented rate limit for ${ip}: now ${count}/${RATE_LIMIT.MAX_REQUESTS}`,
    );
    return true;
  } else {
    // Fallback to always allow if Redis is not available
    console.warn("Redis not available for rate limiting, allowing request");
    return true;
  }
}

export async function clearRateLimits(ip?: string): Promise<void> {
  if (!isRedisAvailable()) {
    console.warn("Redis not available, cannot clear rate limits");
    return;
  }

  if (ip) {
    // Clear specific IP
    await safeRedisOperation(async (redis) => {
      await redis.del(`rate_limit:${ip}:count`);
      await redis.del(`rate_limit:${ip}:reset_at`);
    }, null);
    console.log(`Cleared rate limits for ${ip}`);
  } else {
    // Clear all rate limits (admin function)
    await safeRedisOperation(async (redis) => {
      const keys = await redis.keys("rate_limit:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    }, null);
    console.log("Cleared all rate limits");
  }
}
