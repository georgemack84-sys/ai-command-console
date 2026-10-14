import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: vi.fn() }));

import { POST } from "@/app/api/platform/applications/validate/route";
import { getSessionUser } from "@/src/lib/auth";
import { requireWorkspaceManager } from "@/src/server/auth/permissions";

const user = { id: "user_1", email: "operator@example.com", name: "Operator", role: "operator" as const, status: "active" as const, workspaceId: "workspace_1", workspaceName: "Workspace" };
const input = { slug: "nuru", displayName: "Nuru", description: "Knowledge and evidence.", ownerApplicationContact: "nuru@proprium.example", supportedContractVersions: ["1.0"], metadata: { domain: "knowledge" } };

describe("application onboarding validation route", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getSessionUser).mockResolvedValue(user); });

  it("validates an application configuration without registering it", async () => {
    const response = await POST(new Request("http://localhost/api/platform/applications/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
    const payload = await response.json();
    expect(response.status).toBe(200);
    expect(payload.data.application.slug).toBe("nuru");
    expect(payload.data.checks).toHaveLength(3);
    expect(requireWorkspaceManager).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: "workspace_1" }));
  });

  it("rejects an invalid configuration without returning a misleading readiness result", async () => {
    const response = await POST(new Request("http://localhost/api/platform/applications/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...input, supportedContractVersions: ["1"] }) }));
    expect(response.status).toBe(400);
  });

  it("requires authentication", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const response = await POST(new Request("http://localhost/api/platform/applications/validate", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input) }));
    expect(response.status).toBe(401);
  });
});
