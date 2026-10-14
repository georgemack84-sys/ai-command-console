import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ register: vi.fn(), declare: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() }));
vi.mock("@/src/server/services/application-registry-service", () => ({ registerApplication: mocks.register }));
vi.mock("@/src/server/services/application-capability-service", () => ({ declareApplicationCapability: mocks.declare }));
vi.mock("@/src/server/db/prisma", () => ({ prisma: { applicationCapability: { findFirst: mocks.findFirst, findMany: mocks.findMany } } }));

import { NURU_REFERENCE_CAPABILITIES, provisionNuruReferenceIntegration } from "@/src/server/services/nuru-application-integration";

describe("Nuru Track 2 enrollment", () => {
  beforeEach(() => { Object.values(mocks).forEach((mock) => mock.mockReset()); });

  it("registers Nuru once in DRAFT and declares inert capabilities without credentials or grants", async () => {
    mocks.register.mockResolvedValue({ application: { applicationId: "nuru-app", lifecycleState: "DRAFT" }, created: true });
    mocks.findFirst.mockResolvedValue(null);
    mocks.findMany.mockResolvedValue([{ capabilityKey: "evidence.retrieve" }, { capabilityKey: "knowledge.search" }]);
    const result = await provisionNuruReferenceIntegration("workspace-1", "operator-1");
    expect(mocks.register).toHaveBeenCalledOnce();
    expect(mocks.declare).toHaveBeenCalledTimes(NURU_REFERENCE_CAPABILITIES.length);
    expect(result).toMatchObject({ registered: true, activationRequired: true, credentialsCreated: false, grantsCreated: false });
  });

  it("does not create a credential or grant when enrollment is replayed", async () => {
    mocks.register.mockResolvedValue({ application: { applicationId: "nuru-app", lifecycleState: "DRAFT" }, created: false });
    mocks.findFirst.mockResolvedValue({ id: "existing" });
    mocks.findMany.mockResolvedValue([]);
    const result = await provisionNuruReferenceIntegration("workspace-1", "operator-1");
    expect(mocks.declare).not.toHaveBeenCalled();
    expect(result).toMatchObject({ registered: false, activationRequired: true, credentialsCreated: false, grantsCreated: false });
  });
});
