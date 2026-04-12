import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

import { GET } from "@/app/api/profile/route";
import { getSessionUser } from "@/src/lib/auth";

describe("profile route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated profile", async () => {
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "owner@example.com",
      name: "Owner",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    });

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.profile.email).toBe("owner@example.com");
  });

  it("returns unauthorized for anonymous users", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(401);
    expect(payload.ok).toBe(false);
    expect(payload.error.code).toBe("unauthorized");
  });
});
