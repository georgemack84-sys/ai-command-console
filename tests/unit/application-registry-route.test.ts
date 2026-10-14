import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: vi.fn(), requireWorkspaceViewer: vi.fn() }));
vi.mock("@/src/server/services/application-registry-service", () => ({ listRegisteredApplications: vi.fn(), registerApplication: vi.fn() }));

import { GET, POST } from "@/app/api/platform/applications/route";
import { getSessionUser } from "@/src/lib/auth";
import { AppError } from "@/src/server/api/errors";
import { requireWorkspaceManager, requireWorkspaceViewer } from "@/src/server/auth/permissions";
import { listRegisteredApplications, registerApplication } from "@/src/server/services/application-registry-service";

const user = { id: "user_1", email: "operator@example.com", name: "Operator", role: "operator" as const, status: "active" as const, workspaceId: "workspace_1", workspaceName: "Workspace" };

describe("application registry route", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getSessionUser).mockResolvedValue(user); });

  it("lists only the current workspace applications", async () => {
    vi.mocked(listRegisteredApplications).mockResolvedValue([]);
    const response = await GET();
    expect(response.status).toBe(200);
    expect(listRegisteredApplications).toHaveBeenCalledWith("workspace_1");
  });

  it("requires workspace-manager access for registration", async () => {
    vi.mocked(registerApplication).mockResolvedValue({ created: true, application: { applicationId: "app_1" } } as never);
    const response = await POST(new Request("http://localhost/api/platform/applications", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ slug: "nuru" }) }));
    expect(response.status).toBe(201);
    expect(requireWorkspaceManager).toHaveBeenCalledWith(expect.objectContaining({ userId: "user_1", workspaceId: "workspace_1" }));
    expect(registerApplication).toHaveBeenCalledWith("workspace_1", "user_1", { slug: "nuru" });
  });

  it("rejects unauthenticated callers", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
  });

  it("fails closed when workspace access is denied", async () => {
    vi.mocked(requireWorkspaceViewer).mockRejectedValueOnce(new AppError(403, "forbidden", "You do not have access to this workspace."));
    const response = await GET();
    expect(response.status).toBe(403);
    expect(listRegisteredApplications).not.toHaveBeenCalled();
  });
});
