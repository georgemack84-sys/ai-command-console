import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  manager: vi.fn(),
  limit: vi.fn(),
  review: vi.fn(),
}));

vi.mock("@/src/lib/auth", () => ({ getSessionUser: mocks.session }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: mocks.manager }));
vi.mock("@/src/server/security/nsi-write-rate-limit", () => ({ enforceNsiWriteRateLimit: mocks.limit }));
vi.mock("@/src/server/services/nuru-source-registry-service", async () => {
  const { z } = await import("zod");
  return {
    NuruSourceRegistryService: { review: mocks.review },
    sourceReviewActionSchema: z.enum(["APPROVE", "BLOCK", "WITHDRAW"]),
  };
});

import { AppError } from "@/src/server/api/errors";
import { PATCH } from "@/app/api/nuru/source-registry/[id]/review/route";

const manager = {
  id: "manager-a",
  email: "manager@example.test",
  name: "Manager A",
  role: "operator",
  status: "active",
  workspaceId: "workspace-a",
  workspaceName: "Workspace A",
};

function request() {
  return new Request("http://localhost:5050/api/nuru/source-registry/source-in-workspace-b/review", {
    method: "PATCH",
    headers: { "content-type": "application/json", origin: "http://localhost:5050" },
    body: JSON.stringify({ action: "BLOCK", reason: "This source belongs to another workspace." }),
  });
}

const context = { params: Promise.resolve({ id: "source-in-workspace-b" }) } as RouteContext<"/api/nuru/source-registry/[id]/review">;

describe("NSI source review route security", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.session.mockResolvedValue(manager);
    mocks.manager.mockResolvedValue({ role: "admin" });
  });

  it("rejects an unauthenticated review request", async () => {
    mocks.session.mockResolvedValue(null);
    const response = await PATCH(request(), context);
    expect(response.status).toBe(401);
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("rejects a viewer before the mutation can run", async () => {
    mocks.manager.mockRejectedValue(new AppError(403, "forbidden", "Insufficient workspace permissions."));
    const response = await PATCH(request(), context);
    expect(response.status).toBe(403);
    expect(mocks.limit).not.toHaveBeenCalled();
    expect(mocks.review).not.toHaveBeenCalled();
  });

  it("does not permit a source from another workspace to be reviewed", async () => {
    mocks.review.mockRejectedValue(new AppError(404, "source_not_found", "The source was not found in this workspace."));
    const response = await PATCH(request(), context);
    expect(response.status).toBe(404);
    expect(mocks.review).toHaveBeenCalledWith(
      "source-in-workspace-b",
      "workspace-a",
      "BLOCK",
      "This source belongs to another workspace.",
      "human:manager-a",
      expect.any(String),
    );
  });
});
