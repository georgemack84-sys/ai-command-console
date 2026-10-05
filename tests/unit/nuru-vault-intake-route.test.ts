import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSessionUser: vi.fn(), requireWorkspaceManager: vi.fn(), rateLimit: vi.fn(), readJson: vi.fn(), adapter: vi.fn(), intake: vi.fn() }));
vi.mock("@/src/lib/auth", () => ({ getSessionUser: mocks.getSessionUser }));
vi.mock("@/src/server/auth/permissions", () => ({ requireWorkspaceManager: mocks.requireWorkspaceManager }));
vi.mock("@/src/server/security/nsi-write-rate-limit", () => ({ enforceNsiWriteRateLimit: mocks.rateLimit }));
vi.mock("@/src/server/security/request-body-limit", () => ({ readJsonWithinLimit: mocks.readJson }));
vi.mock("@/src/server/repositories/nuru-vault-persistence-adapter", () => ({ NuruVaultPersistenceAdapter: mocks.adapter }));
vi.mock("@/src/server/services/nuru-source-registry-service", () => ({ NuruSourceRegistryService: {} }));
vi.mock("@/src/server/services/nuru-vault-source-intake-service", async (importOriginal) => ({ ...(await importOriginal<typeof import("@/src/server/services/nuru-vault-source-intake-service")>()), NuruVaultSourceIntakeService: { intake: mocks.intake } }));

import { POST } from "@/app/api/nuru/vault/intake/route";

const payload = { sourceRegistryId: "registry-1", acquisitionMethod: "MANUAL", sourceContent: "Fixture source.", sourceClassification: "PUBLIC", evidence: { locator: "fixture://source#1", content: "Fixture evidence." }, candidate: { interpretation: "A grounded discovery.", confidence: 0.8 } };

describe("POST /api/nuru/vault/intake", () => {
  beforeEach(() => { Object.values(mocks).forEach((mock) => mock.mockReset()); });

  it("requires a workspace manager and delegates through the Vault intake service", async () => {
    const vault = {};
    mocks.getSessionUser.mockResolvedValue({ id: "user-1", role: "operator", workspaceId: "workspace-1" });
    mocks.requireWorkspaceManager.mockResolvedValue({ role: "admin" });
    mocks.rateLimit.mockResolvedValue(undefined);
    mocks.readJson.mockResolvedValue(payload);
    mocks.adapter.mockImplementation(class { constructor() { return vault; } });
    mocks.intake.mockResolvedValue({ candidate: { id: "candidate-1" } });

    const response = await POST(new Request("https://console.test/api/nuru/vault/intake", { method: "POST", headers: { origin: "https://console.test" }, body: JSON.stringify(payload) }));
    expect(response.status).toBe(201);
    expect(mocks.adapter).toHaveBeenCalledWith("workspace-1");
    expect(mocks.intake).toHaveBeenCalledWith(expect.objectContaining({ sourceRegistryId: "registry-1" }), expect.objectContaining({ workspaceId: "workspace-1", actor: "human:user-1" }), expect.anything(), vault);
  });

  it("rejects anonymous writes before request parsing or adapter construction", async () => {
    mocks.getSessionUser.mockResolvedValue(null);
    const response = await POST(new Request("https://console.test/api/nuru/vault/intake", { method: "POST" }));
    expect(response.status).toBe(401);
    expect(mocks.readJson).not.toHaveBeenCalled();
    expect(mocks.adapter).not.toHaveBeenCalled();
  });
});
