import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({
  requireWorkspaceViewer: vi.fn(),
  requireWorkspaceMember: vi.fn(),
}));
vi.mock("@/src/server/services/workspace-service", () => ({ getWorkspaceSnapshot: vi.fn() }));
vi.mock("@/src/server/services/governed-insight-generation-action-service", () => ({
  executeGovernedInsightGenerationAction: vi.fn(),
}));

import { GET, POST } from "@/app/api/insights/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeGovernedInsightGenerationAction } from "@/src/server/services/governed-insight-generation-action-service";
import { getWorkspaceSnapshot } from "@/src/server/services/workspace-service";

const user = {
  id: "user_1",
  email: "analyst@example.com",
  name: "Analyst",
  role: "operator",
  status: "active",
  workspaceId: "workspace_1",
  workspaceName: "Workspace",
};

describe("insights route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(user);
  });

  it("keeps insight listing read-only", async () => {
    vi.mocked(getWorkspaceSnapshot).mockResolvedValue({ insights: [{ id: "insight_1" }] } as never);

    const response = await GET();
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.insights).toEqual([{ id: "insight_1" }]);
    expect(executeGovernedInsightGenerationAction).not.toHaveBeenCalled();
  });

  it.each([
    [false, "generate-direct", 201, { insights: [{ id: "insight_1" }] }],
    [true, "generate-queued", 202, { job: { id: "job_1" } }],
  ])("governs async=%s generation", async (asyncMode, action, status, data) => {
    vi.mocked(executeGovernedInsightGenerationAction).mockResolvedValue({ data, status } as never);

    const response = await POST(new Request("http://localhost/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ async: asyncMode, confirmed: true }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(status);
    expect(payload.data).toEqual(data);
    expect(executeGovernedInsightGenerationAction).toHaveBeenCalledWith(
      {
        action,
        payload: { async: asyncMode, confirmed: true },
        confirmed: true,
      },
      user,
    );
  });

  it("returns confirmation evidence before generation", async () => {
    vi.mocked(executeGovernedInsightGenerationAction).mockResolvedValue({
      action: "generate-queued",
      output: "Confirmation required.",
      requiresConfirmation: true,
    } as never);

    const response = await POST(new Request("http://localhost/api/insights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ async: true }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.requiresConfirmation).toBe(true);
  });
});
