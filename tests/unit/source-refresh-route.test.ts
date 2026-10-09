import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: vi.fn() }));
vi.mock("@/src/server/security/rate-limit", () => ({
  enforceRateLimit: vi.fn(),
  getDefaultWindowMs: vi.fn(() => 60_000),
  getSourceRateLimit: vi.fn(() => 10),
}));
vi.mock("@/src/server/services/governed-source-refresh-action-service", () => ({
  executeGovernedSourceRefreshAction: vi.fn(),
}));

import { POST } from "@/app/api/sources/refresh/route";
import { getSessionUser } from "@/src/lib/auth";
import { executeGovernedSourceRefreshAction } from "@/src/server/services/governed-source-refresh-action-service";

const user = {
  id: "user_1",
  email: "manager@example.com",
  name: "Manager",
  role: "admin",
  status: "active",
  workspaceId: "workspace_1",
  workspaceName: "Workspace",
};

describe("source refresh route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getSessionUser).mockResolvedValue(user);
  });

  it("queues source refresh through governed action execution", async () => {
    vi.mocked(executeGovernedSourceRefreshAction).mockResolvedValue({
      data: { job: { id: "job_1" } },
      status: 202,
    } as never);

    const response = await POST(new Request("http://localhost/api/sources/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: "source_1", confirmed: true }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(202);
    expect(payload.data.job.id).toBe("job_1");
    expect(executeGovernedSourceRefreshAction).toHaveBeenCalledWith(
      { sourceId: "source_1", confirmed: true },
      user,
    );
  });

  it("returns confirmation evidence before queue mutation", async () => {
    vi.mocked(executeGovernedSourceRefreshAction).mockResolvedValue({
      action: "refresh",
      output: "Confirmation required.",
      requiresConfirmation: true,
    } as never);

    const response = await POST(new Request("http://localhost/api/sources/refresh", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceId: "source_1" }),
    }));
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.data.requiresConfirmation).toBe(true);
  });
});
