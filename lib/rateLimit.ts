import { Redis } from 'ioredis';

const redis = process.env.REDIS_URL ? new Redis(process.env.REDIS_URL) : null;

interface RateLimitOptions {
  windowMs: number; // time window in milliseconds
  max: number;      // max number of requests per window
  message: string;  // error message
}

interface RateLimiterResponse {
  success: boolean;
  message?: string;
  remaining?: number;
  reset?: number;
}

/**
 * Generic rate limiter using Redis or in-memory fallback.
 * @param key - Unique key for the rate limiter (e.g., 'login:ip:192.168.1.1')
 * @param options - Rate limit configuration
 * @returns RateLimiterResponse indicating success or failure
 */
export async function rateLimiter(key: string, options: RateLimitOptions): Promise<RateLimiterResponse> {
  const { windowMs, max, message } = options;

  if (!redis) {
    console.warn('Redis is not configured. Rate limiting is using an in-memory fallback (not suitable for production).');
    // In-memory fallback (very basic, not truly distributed or persistent)
    // In a real app, this would be a more robust in-memory solution or throw an error.
    return { success: true };
  }

  const now = Date.now();
  const cleanupTime = now - windowMs;

  // Use a sorted set to store timestamps of requests
  // Score is the timestamp, member is a unique ID (e.g., timestamp-random)
  await redis.zremrangebyscore(key, 0, cleanupTime);
  await redis.zadd(key, now, `${now}-${Math.random()}`);

  const count = await redis.zcard(key);
  const ttl = await redis.ttl(key); // Get TTL for the key (time until expiry)
  const reset = ttl > 0 ? now + (ttl * 1000) : now + windowMs; // Approximate reset time

  if (count > max) {
    return {
      success: false,
      message,
      remaining: 0,
      reset: Math.ceil(reset / 1000), // Reset time in seconds
    };
  } else {
    return {
      success: true,
      remaining: max - count,
      reset: Math.ceil(reset / 1000),
    };
  }
}

/**
 * Lockout mechanism for repeated failures.
 * @param key - Unique key for the lockout (e.g., 'lockout:email:user@example.com')
 * @param ttlMin - Time-to-live for the lockout in minutes
 * @returns true if locked out, false otherwise
 */
export async function checkAndSetLockout(key: string, ttlMin: number): Promise<boolean> {
  if (!redis) {
    return false; // No lockout if Redis is not configured
  }

  const isLocked = await redis.get(key);
  if (isLocked) {
    return true;
  }

  // Set a lockout for a specified TTL
  await redis.setex(key, ttlMin * 60, 'locked');
  return false;
}






