import { Redis } from "@upstash/redis";

// Initialize Redis client
let redis: Redis | null = null;

try {
  if (
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    console.log("Redis client initialized successfully");
  } else {
    console.warn("Redis environment variables are missing");
  }
} catch (error) {
  console.error("Failed to initialize Redis client:", error);
}

/**
 * Execute a Redis operation safely with fallback
 */
export async function safeRedisOperation<T>(
  operation: (redisClient: Redis) => Promise<T>,
  fallback: T,
): Promise<T> {
  if (!redis) {
    console.warn("Redis client not available, using fallback value");
    return fallback;
  }

  try {
    return await operation(redis);
  } catch (error) {
    console.error("Redis operation failed:", error);
    return fallback;
  }
}

/**
 * Check if Redis is available
 */
export function isRedisAvailable(): boolean {
  return redis !== null;
}

/**
 * Get the Redis client (use with caution, prefer safeRedisOperation)
 */
export function getRedisClient(): Redis | null {
  return redis;
}
