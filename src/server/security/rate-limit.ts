import { AppError } from "@/src/server/api/errors";
import { env } from "@/src/config/env";

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
};

const store = new Map<string, RateLimitState>();

function nowMs() {
  return Date.now();
}

export function rateLimitingEnabled() {
  const configured = env.RATE_LIMIT_ENABLED?.toLowerCase();
  if (configured === "false" || configured === "0" || configured === "no") {
    return false;
  }
  return true;
}

export function getDefaultWindowMs() {
  const configured = Number(env.RATE_LIMIT_WINDOW_MS);
  return Number.isFinite(configured) && configured >= 1_000 ? Math.floor(configured) : 60_000;
}

export function getAuthRateLimit() {
  const configured = Number(env.RATE_LIMIT_AUTH_LIMIT);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 8;
}

export function getSourceRateLimit() {
  const configured = Number(env.RATE_LIMIT_SOURCE_LIMIT);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 20;
}

export function getJobsRateLimit() {
  const configured = Number(env.RATE_LIMIT_JOBS_LIMIT);
  return Number.isFinite(configured) && configured >= 1 ? Math.floor(configured) : 30;
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

export function rateLimit(key: string, options: RateLimitOptions) {
  const current = store.get(key);
  const now = nowMs();
  if (!current || current.resetAt <= now) {
    const nextState = { count: 1, resetAt: now + options.windowMs };
    store.set(key, nextState);
    return { allowed: true, remaining: options.limit - 1, resetAt: nextState.resetAt };
  }

  if (current.count >= options.limit) {
    return { allowed: false, remaining: 0, resetAt: current.resetAt };
  }

  current.count += 1;
  store.set(key, current);
  return { allowed: true, remaining: options.limit - current.count, resetAt: current.resetAt };
}

export function enforceRateLimit(key: string, options: RateLimitOptions) {
  if (!rateLimitingEnabled()) {
    return;
  }

  const result = rateLimit(key, options);
  if (!result.allowed) {
    const retryAfterMs = Math.max(0, result.resetAt - nowMs());
    throw new AppError(429, "rate_limited", "Too many requests. Please try again later.", {
      retryAfterMs,
    });
  }
}
