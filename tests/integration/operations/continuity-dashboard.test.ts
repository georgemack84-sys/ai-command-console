import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({
  getSessionUser: vi.fn(),
}));

vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceMember: vi.fn(),
}));

import { getSessionUser } from "@/src/lib/auth";
import { GET as ContinuityDashboardGET } from "@/app/api/operations/continuity/route";

describe("operations continuity dashboard route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue({
      id: "user_1",
      email: "operator@example.com",
      name: "Operator",
      role: "admin",
      status: "active",
      workspaceId: "workspace_1",
      workspaceName: "Pulse Workspace",
    } as never);
  });

  it("returns a normalized read-only dashboard payload", async () => {
    const response = await ContinuityDashboardGET(new Request("http://localhost/api/operations/continuity"));
    const payload = await response.json();

    expect(payload.ok).toBe(true);
    expect(payload.data.generatedAt).toBeDefined();
    expect(payload.data.runtimeContinuityState).toBeDefined();
    expect(payload.data.stewardship).toBeDefined();
    expect(payload.data.operationalStabilityAssessment).toBeDefined();
    expect(payload.data.recoveryPrioritization).toBeDefined();
  });
});
