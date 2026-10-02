import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ enforce: vi.fn() }));

vi.mock("@/src/server/security/distributed-rate-limit", () => ({
  enforceDistributedRateLimit: mocks.enforce,
}));

import { enforceNsiWriteRateLimit } from "@/src/server/security/nsi-write-rate-limit";

describe("NSI write rate limiting", () => {
  it("limits actor, workspace, and a hashed client-network key", async () => {
    await enforceNsiWriteRateLimit(new Request("https://nuru.example/api", { headers: { "x-forwarded-for": "198.51.100.23", origin: "http://localhost:5050" } }), {
      operation: "fetch-dispatch",
      userId: "user-1",
      workspaceId: "workspace-1",
    });

    expect(mocks.enforce).toHaveBeenCalledTimes(3);
    expect(mocks.enforce).toHaveBeenNthCalledWith(1, "nsi:fetch-dispatch:actor:user-1", { limit: 6, windowMs: 60_000 });
    expect(mocks.enforce).toHaveBeenNthCalledWith(2, "nsi:fetch-dispatch:workspace:workspace-1", { limit: 6, windowMs: 60_000 });
    expect(mocks.enforce.mock.calls[2]?.[0]).toMatch(/^nsi:fetch-dispatch:ip:[a-f0-9]{32}$/);
  });

  it("rejects an originless cookie-authenticated mutation before rate limiting", async () => {
    await expect(enforceNsiWriteRateLimit(new Request("https://nuru.example/api"), {
      operation: "write",
      userId: "user-1",
      workspaceId: "workspace-1",
    })).rejects.toMatchObject({ status: 403, code: "csrf_origin_required" });
  });
});
