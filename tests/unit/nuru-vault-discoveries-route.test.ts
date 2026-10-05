import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSessionUser: vi.fn(), requireWorkspaceViewer: vi.fn(), rebuild: vi.fn(), listDiscoveryView: vi.fn(), adapter: vi.fn() }));
vi.mock("@/src/lib/auth", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceViewer: mocks.requireWorkspaceViewer }));
vi.mock("@/src/server/repositories/nuru-vault-persistence-adapter", () => ({ NuruVaultPersistenceAdapter: mocks.adapter }));
vi.mock("@/src/server/services/nuru-vault-canonical-projection-service", () => ({ NuruVaultCanonicalProjectionService: { rebuild: mocks.rebuild, listDiscoveryView: mocks.listDiscoveryView } }));

import { GET } from "@/app/api/nuru/vault/discoveries/route";

describe("GET /api/nuru/vault/discoveries", () => {
  beforeEach(() => {
    mocks.getSessionUser.mockReset();
    mocks.requireWorkspaceViewer.mockReset();
    mocks.rebuild.mockReset();
    mocks.listDiscoveryView.mockReset();
    mocks.adapter.mockReset();
  });

  it("returns only a freshly rebuilt workspace-scoped canonical projection", async () => {
    const vault = {};
    mocks.getSessionUser.mockResolvedValue({ id: "user-1", role: "operator", workspaceId: "workspace-1" });
    mocks.requireWorkspaceViewer.mockResolvedValue({ role: "member" });
    mocks.adapter.mockImplementation(class { constructor() { return vault; } });
    mocks.rebuild.mockResolvedValue({ revision: "7", entries: [] });
    mocks.listDiscoveryView.mockResolvedValue([{ canonicalRecordId: "canonical-1", interpretation: "Evidence-bound discovery." }]);

    const response = await GET();
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ ok: true, data: { revision: "7", discoveries: [{ canonicalRecordId: "canonical-1", interpretation: "Evidence-bound discovery." }] } });
    expect(mocks.adapter).toHaveBeenCalledWith("workspace-1");
    expect(mocks.requireWorkspaceViewer).toHaveBeenCalledWith({ userId: "user-1", userRole: "operator", workspaceId: "workspace-1" });
  });

  it("rejects anonymous retrieval before it reaches the Vault adapter", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    const response = await GET();
    expect(response.status).toBe(401);
    expect(mocks.adapter).not.toHaveBeenCalled();
  });
});
