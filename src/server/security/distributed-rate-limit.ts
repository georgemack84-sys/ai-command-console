import { createClient, type RedisClientType } from "redis";
import { env, isProduction } from "@/src/config/env";
import { AppError } from "@/src/server/api/errors";
import { enforceRateLimit, rateLimitingEnabled } from "@/src/server/security/rate-limit";

type RateLimitOptions = { limit: number; windowMs: number };
let client: RedisClientType | null = null;

async function redisClient() {
  if (!env.REDIS_URL) throw new AppError(503, "rate_limit_backend_unavailable", "Redis rate-limit backend is not configured.");
  if (!client) {
    client = createClient({ url: env.REDIS_URL });
    client.on("error", () => undefined);
  }
  if (!client.isOpen) await client.connect();
  return client;
}

/** Shared limiter. Production refuses process-local counters. */
export async function enforceDistributedRateLimit(key: string, options: RateLimitOptions) {
  if (!rateLimitingEnabled()) return;
  if (env.RATE_LIMIT_BACKEND === "memory") {
    if (isProduction()) throw new AppError(503, "rate_limit_backend_unavailable", "Production requires the Redis rate-limit backend.");
    enforceRateLimit(key, options);
    return;
  }
  try {
    const redis = await redisClient();
    const namespaced = `nsi:rate-limit:${key}`;
    const count = await redis.incr(namespaced);
    if (count === 1) await redis.pExpire(namespaced, options.windowMs);
    if (count > options.limit) {
      const retryAfterMs = Math.max(0, await redis.pTTL(namespaced));
      throw new AppError(429, "rate_limited", "Too many requests. Please try again later.", { retryAfterMs });
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(503, "rate_limit_backend_unavailable", "Redis rate-limit backend is unavailable.");
  }
}
