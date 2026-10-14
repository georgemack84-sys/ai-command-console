import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/src/lib/auth", () => ({ getSessionUser: vi.fn() }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: vi.fn() }));
vi.mock("@/src/server/services/application-identity-service", () => ({ createServicePrincipal: vi.fn(), rotateServiceCredential: vi.fn(), revokeServiceCredential: vi.fn() }));

import { POST as createPrincipal } from "@/app/api/platform/applications/[applicationId]/service-principals/route";
import { POST as rotateCredential } from "@/app/api/platform/applications/[applicationId]/service-principals/[principalId]/credentials/rotate/route";
import { DELETE as revokeCredential } from "@/app/api/platform/applications/[applicationId]/service-principals/[principalId]/credentials/[credentialId]/route";
import { getSessionUser } from "@/src/lib/auth";
import { createServicePrincipal, rotateServiceCredential, revokeServiceCredential } from "@/src/server/services/application-identity-service";

const user = { id: "user_1", email: "operator@example.com", name: "Operator", role: "operator" as const, status: "active" as const, workspaceId: "workspace_1", workspaceName: "Workspace" };

describe("application identity routes", () => {
  beforeEach(() => { vi.clearAllMocks(); vi.mocked(getSessionUser).mockResolvedValue(user); });

  it("issues a credential only through a workspace-managed service principal", async () => {
    vi.mocked(createServicePrincipal).mockResolvedValue({ principal: { principalId: "principal_1" }, credential: { credentialId: "credential_1", token: "papp_credential_1_once" } } as never);
    const response = await createPrincipal(new Request("http://localhost", { method: "POST", body: JSON.stringify({ displayName: "Nuru integration" }) }), { params: Promise.resolve({ applicationId: "application_1" }) });
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.data.credential.token).toBe("papp_credential_1_once");
    expect(createServicePrincipal).toHaveBeenCalledWith("workspace_1", "application_1", "user_1", { displayName: "Nuru integration" });
  });

  it("rotates and revokes through explicit scoped endpoints", async () => {
    vi.mocked(rotateServiceCredential).mockResolvedValue({ credentialId: "credential_2", token: "papp_credential_2_once" } as never);
    vi.mocked(revokeServiceCredential).mockResolvedValue({ credentialId: "credential_2", status: "REVOKED" } as never);
    const params = Promise.resolve({ applicationId: "application_1", principalId: "principal_1" });
    const rotated = await rotateCredential(new Request("http://localhost", { method: "POST" }), { params });
    const revoked = await revokeCredential(new Request("http://localhost", { method: "DELETE" }), { params: Promise.resolve({ applicationId: "application_1", principalId: "principal_1", credentialId: "credential_2" }) });
    expect(rotated.status).toBe(201);
    expect(revoked.status).toBe(200);
    expect(rotateServiceCredential).toHaveBeenCalledWith("workspace_1", "application_1", "principal_1", "user_1");
    expect(revokeServiceCredential).toHaveBeenCalledWith("workspace_1", "application_1", "principal_1", "credential_2", "user_1");
  });

  it("does not issue credentials to an unauthenticated caller", async () => {
    vi.mocked(getSessionUser).mockResolvedValue(null);
    const response = await createPrincipal(new Request("http://localhost", { method: "POST", body: "{}" }), { params: Promise.resolve({ applicationId: "application_1" }) });
    expect(response.status).toBe(401);
    expect(createServicePrincipal).not.toHaveBeenCalled();
  });
});
