import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  authenticateUser: vi.fn(),
  setSessionCookie: vi.fn(),
}));

import { POST } from "@/app/api/auth/dev-login/route";
import { authenticateUser, setSessionCookie } from "@/src/lib/auth";

describe("dev login route", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.NODE_ENV = "test";
  });

  it("signs in with the local demo account outside production", async () => {
    vi.mocked(authenticateUser).mockResolvedValue({
      user: {
        id: "user_1",
        email: "operator@pulse.local",
        name: "Morgan Lane",
        role: "operator",
        status: "active",
        workspaceId: "workspace_1",
        workspaceName: "Pulse",
      },
    });

    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(authenticateUser).toHaveBeenCalledWith("operator@pulse.local", "demo-password");
    expect(setSessionCookie).toHaveBeenCalled();
  });

  it("is unavailable in production", async () => {
    process.env.NODE_ENV = "production";

    const response = await POST();
    const payload = await response.json();

    expect(response.status).toBe(404);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("not_found");
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });
});
