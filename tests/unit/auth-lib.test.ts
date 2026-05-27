import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: () => ({ value: "session-token" }),
  })),
  headers: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

vi.mock("@/src/server/auth/session-token", () => ({
  createSessionToken: vi.fn(),
  readSessionToken: vi.fn(() => ({ sessionId: "session_1", userId: "user_1", expiresAt: new Date(Date.now() + 60_000).toISOString() })),
  SESSION_COOKIE_NAME: "ai_command_console_session",
}));

vi.mock("@/src/server/services/auth-service", () => ({
  createUserAccount: vi.fn(),
  authenticateUser: vi.fn(),
  createAuthSession: vi.fn(),
  deleteAuthSession: vi.fn(),
  resolveSessionUser: vi.fn(() => new Promise(() => {})),
  deleteUserAccount: vi.fn(),
}));

describe("auth getSessionUser", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.useFakeTimers();
    process.env.NODE_ENV = "development";
  });

  afterEach(() => {
    vi.useRealTimers();
    process.env.NODE_ENV = originalNodeEnv;
    vi.clearAllMocks();
  });

  it("fails open to null when local session lookup times out", async () => {
    const authModule = await import("@/src/lib/auth");

    const pending = authModule.getSessionUser();
    await vi.advanceTimersByTimeAsync(1_500);

    await expect(pending).resolves.toBeNull();
  });
});
