import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: vi.fn(), requireWorkspaceViewer: vi.fn() }));
vi.mock("@/src/server/services/application-capability-service", () => ({ declareApplicationCapability: vi.fn(), discoverApplicationCapabilities: vi.fn() }));

import { GET, POST } from "@/app/api/platform/applications/[applicationId]/capabilities/route";
import { getSessionUser } from "@/src/lib/auth";
import { declareApplicationCapability, discoverApplicationCapabilities } from "@/src/server/services/application-capability-service";

const user = { id: "user_1", email: "operator@example.com", name: "Operator", role: "operator" as const, status: "active" as const, workspaceId: "workspace_1", workspaceName: "Workspace" };
const declaration = { capabilityKey: "knowledge.search", version: "1.0", description: "Search knowledge.", inputSchema: { query: { type: "string" } }, requiredPermissions: ["knowledge.read"], constraints: ["read-only"] };

describe("application capability route", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getSessionUser).mockResolvedValue(user); });

  it("makes declared capabilities discoverable without an execution grant", async () => {
    vi.mocked(discoverApplicationCapabilities).mockResolvedValue([{ ...declaration, capabilityId: "cap_1", applicationId: "app_1", declaredAt: new Date().toISOString(), executionAuthorized: false }] as never);
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ applicationId: "app_1" }) });
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.data.capabilities[0].executionAuthorized).toBe(false);
    expect(discoverApplicationCapabilities).toHaveBeenCalledWith("workspace_1", "app_1");
  });

  it("declares a capability only under the current workspace manager", async () => {
    vi.mocked(declareApplicationCapability).mockResolvedValue({ capabilityId: "cap_1", executionAuthorized: false } as never);
    const response = await POST(new Request("http://localhost", { method: "POST", body: JSON.stringify(declaration) }), { params: Promise.resolve({ applicationId: "app_1" }) });
    expect(response.status).toBe(201);
    expect(declareApplicationCapability).toHaveBeenCalledWith("workspace_1", "app_1", "user_1", declaration);
  });

  it("requires authentication for capability discovery", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const response = await GET(new Request("http://localhost"), { params: Promise.resolve({ applicationId: "app_1" }) });
    expect(response.status).toBe(401);
  });
});
