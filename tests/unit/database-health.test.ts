import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/db/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(() => new Promise(() => {})),
  },
}));

describe("database health", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it("returns unavailable when the health check times out", async () => {
    const { checkDatabaseHealth } = await import("@/src/server/health/database-health");

    const pending = checkDatabaseHealth();
    await vi.advanceTimersByTimeAsync(1_500);

    await expect(pending).resolves.toEqual({
      ok: false,
      status: "unavailable",
      details: "Database health check timed out.",
    });
  });
});
