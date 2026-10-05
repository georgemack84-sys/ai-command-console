import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), findMany: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruSourceRegistry: { create: mocks.create, findUnique: mocks.findUnique, findMany: mocks.findMany, update: mocks.update } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));
vi.mock("@/src/server/security/server-url-policy", () => ({ assertSafeSourceUrl: vi.fn() }));

import { NuruSourceRegistryService } from "@/src/server/services/nuru-source-registry-service";

describe("Nuru Source Intelligence registry", () => {
  it("records source identity and admission policy independently", async () => {
    const source = await NuruSourceRegistryService.register({
      id: "NSI-100",
      workspaceId: "workspace-1",
      name: "NASA",
      domain: "www.nasa.gov",
      baseUrl: "https://www.nasa.gov/",
      category: "GOVERNMENT",
      authorityClass: "PRIMARY",
      ingestionMethods: ["RSS"],
      admissionState: "REVIEW_REQUIRED",
      operationalState: "HEALTHY",
      enabled: true,
      requiresReview: true,
    }, "human:1", "corr-1");

    expect(source).toMatchObject({ id: "NSI-100", admissionState: "REVIEW_REQUIRED", operationalState: "HEALTHY" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: "NSI-100" }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "NSI_SOURCE_REGISTERED" }));
  });

  it("approves a pending source and records the human decision", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "NSI-101", workspaceId: "workspace-1", name: "NASA", domain: "www.nasa.gov", baseUrl: "https://www.nasa.gov/", category: "GOVERNMENT", topics: [], authorityClass: "PRIMARY", ingestionMethods: ["MANUAL"], refreshPolicy: "ON_DEMAND", admissionState: "REVIEW_REQUIRED", operationalState: "HEALTHY", enabled: true, requiresReview: true, createdAt: new Date(),
    });
    const source = await NuruSourceRegistryService.review("NSI-101", "workspace-1", "APPROVE", "Official source approved for manual intake.", "human:2", "corr-2");
    expect(source).toMatchObject({ admissionState: "APPROVED", requiresReview: false, enabled: true });
    expect(mocks.update).toHaveBeenCalledWith(expect.objectContaining({ data: { admissionState: "APPROVED", requiresReview: false, enabled: true } }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "NSI_SOURCE_REVIEWED", decision: "APPROVE" }));
  });

  it("does not allow cross-workspace source review", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "NSI-102", workspaceId: "workspace-2", name: "Other", category: "OFFICIAL", topics: [], authorityClass: "UNKNOWN", ingestionMethods: ["MANUAL"], refreshPolicy: "ON_DEMAND", admissionState: "REVIEW_REQUIRED", operationalState: "HEALTHY", enabled: true, requiresReview: true, createdAt: new Date(),
    });
    await expect(NuruSourceRegistryService.review("NSI-102", "workspace-1", "BLOCK", "Outside workspace.", "human:2", "corr-3")).rejects.toMatchObject({ status: 404, code: "source_not_found" });
  });

  it("normalizes nullable database fields before applying the registry contract", async () => {
    mocks.findUnique.mockResolvedValue({
      id: "NSI-103", workspaceId: "workspace-1", name: "Fixture", domain: null, baseUrl: null, category: "DOCUMENTATION", topics: [], authorityClass: "PRIMARY", ingestionMethods: ["MANUAL"], refreshPolicy: "ON_DEMAND", admissionState: "APPROVED", operationalState: "HEALTHY", enabled: true, requiresReview: false, createdAt: new Date(), lastCheckedAt: null, lastSuccessfulFetch: null,
    });
    await expect(NuruSourceRegistryService.get("NSI-103")).resolves.toMatchObject({ id: "NSI-103", domain: undefined, baseUrl: undefined, lastCheckedAt: undefined, lastSuccessfulFetch: undefined });
  });
});
