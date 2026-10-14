import { describe, expect, it } from "vitest";
import { AppError } from "@/src/server/api/errors";
import { registerApplication, type ApplicationRegistryStore, type ApplicationRegistryTransaction, type RegisteredApplicationView } from "@/src/server/services/application-registry-service";

function storeFixture() {
  const applications: RegisteredApplicationView[] = [];
  const audit: Array<Record<string, unknown>> = [];
  const transaction: ApplicationRegistryTransaction = {
    findBySlug: async (_workspaceId, slug) => applications.find((application) => application.slug === slug) ?? null,
    create: async (_workspaceId, application) => { applications.push(application); return application; },
    appendAudit: async (event) => { audit.push(event); },
  };
  const store: ApplicationRegistryStore = {
    transaction: async (work) => work(transaction),
    list: async () => applications,
  };
  return { store, applications, audit };
}

const input = {
  slug: "nuru", displayName: "Nuru", description: "Knowledge and evidence.",
  ownerApplicationContact: "nuru@proprium.example", supportedContractVersions: ["1.0"], metadata: { domain: "knowledge" },
};

describe("application registry", () => {
  it("registers a draft application without issuing authority and writes audit evidence", async () => {
    const fixture = storeFixture();
    const result = await registerApplication("workspace_1", "user_1", input, fixture.store);

    expect(result.created).toBe(true);
    expect(result.application.lifecycleState).toBe("DRAFT");
    expect(result.application.metadata).toEqual({ domain: "knowledge" });
    expect(fixture.audit).toHaveLength(1);
    expect(fixture.audit[0]).toMatchObject({ type: "application.registered", metadata: expect.objectContaining({ slug: "nuru" }) });
  });

  it("is idempotent for an equivalent retry", async () => {
    const fixture = storeFixture();
    await registerApplication("workspace_1", "user_1", input, fixture.store);
    const retry = await registerApplication("workspace_1", "user_1", input, fixture.store);

    expect(retry.created).toBe(false);
    expect(fixture.applications).toHaveLength(1);
    expect(fixture.audit).toHaveLength(1);
  });

  it("rejects a duplicate slug with different registration data", async () => {
    const fixture = storeFixture();
    await registerApplication("workspace_1", "user_1", input, fixture.store);

    await expect(registerApplication("workspace_1", "user_1", { ...input, displayName: "Nuru Rebuilt" }, fixture.store))
      .rejects.toMatchObject<Partial<AppError>>({ status: 409, code: "application_slug_conflict" });
  });

  it("rejects invalid contract versions before registration", async () => {
    const fixture = storeFixture();
    await expect(registerApplication("workspace_1", "user_1", { ...input, supportedContractVersions: ["version-one"] }, fixture.store)).rejects.toThrow();
    expect(fixture.applications).toHaveLength(0);
  });

  it("rejects caller-supplied lifecycle state rather than granting activation through registration", async () => {
    const fixture = storeFixture();
    await expect(registerApplication("workspace_1", "user_1", { ...input, lifecycleState: "ACTIVE" }, fixture.store)).rejects.toThrow();
    expect(fixture.applications).toHaveLength(0);
  });
});
