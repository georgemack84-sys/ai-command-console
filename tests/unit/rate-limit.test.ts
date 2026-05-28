import { describe, expect, it, vi } from "vitest";

vi.mock("@/src/config/env", () => ({
  env: {
    RATE_LIMIT_ENABLED: "true",
    RATE_LIMIT_WINDOW_MS: "1000",
    RATE_LIMIT_AUTH_LIMIT: "2",
    RATE_LIMIT_SOURCE_LIMIT: "2",
    RATE_LIMIT_JOBS_LIMIT: "2",
  },
}));

import { rateLimit, enforceRateLimit, getDefaultWindowMs } from "@/src/server/security/rate-limit";
import { AppError } from "@/src/server/api/errors";

describe("rate limiting", () => {
  it("blocks when limit exceeded", () => {
    const windowMs = getDefaultWindowMs();
    const key = "test:limit";
    expect(rateLimit(key, { limit: 2, windowMs }).allowed).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs }).allowed).toBe(true);
    expect(rateLimit(key, { limit: 2, windowMs }).allowed).toBe(false);
  });

  it("enforceRateLimit throws AppError when exceeded", () => {
    const key = "test:enforce";
    const windowMs = getDefaultWindowMs();
    enforceRateLimit(key, { limit: 1, windowMs });
    expect(() => enforceRateLimit(key, { limit: 1, windowMs })).toThrow(AppError);
  });
});
