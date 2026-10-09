import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: vi.fn() }));
vi.mock("@/src/server/services/source-service", () => ({ requestSourceRefresh: vi.fn() }));

import { requireWorkspaceManager } from "@/src/server/auth/permissions";
import { requestSourceRefresh } from "@/src/server/services/source-service";
import { executeSourceRefreshAction } from "@/src/server/services/source-refresh-action-service";

const actor = {
  id: "user_1",
  workspaceId: "workspace_1",
  name: "Manager",
  email: "manager@example.com",
  role: "admin",
} as const;

describe("source refresh action service", () => {
  beforeEach(() => vi.clearAllMocks());

  it("revalidates workspace authority before admitted queue mutation", async () => {
    vi.mocked(requestSourceRefresh).mockResolvedValue({ id: "job_1" } as never);

    const result = await executeSourceRefreshAction({ sourceId: "source_1" }, actor);

    expect(requireWorkspaceManager).toHaveBeenCalledWith({
      userId: "user_1",
      userRole: "admin",
      workspaceId: "workspace_1",
    });
    expect(requestSourceRefresh).toHaveBeenCalledWith({
      workspaceId: "workspace_1",
      userId: "user_1",
      userRole: "admin",
      sourceId: "source_1",
    });
    expect(result).toEqual({ data: { job: { id: "job_1" } }, status: 202 });
  });
});
