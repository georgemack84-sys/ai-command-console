import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), get: vi.fn(), audit: vi.fn(), safeUrl: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruRawArtifact: { create: mocks.create, findUnique: mocks.findUnique } } }));
vi.mock("@/src/server/services/nuru-source-registry-service", () => ({ NuruSourceRegistryService: { get: mocks.get } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));
vi.mock("@/src/server/security/server-url-policy", () => ({ assertSafeSourceUrl: mocks.safeUrl }));

import { NuruManualIngestionService } from "@/src/server/services/nuru-manual-ingestion-service";
import { AppError } from "@/src/server/api/errors";

const source = {
  id: "NSI-1", workspaceId: "workspace-1", name: "NASA", domain: "www.nasa.gov", baseUrl: "https://www.nasa.gov/", category: "GOVERNMENT", topics: [], authorityClass: "PRIMARY", ingestionMethods: ["MANUAL"], refreshPolicy: "ON_DEMAND", admissionState: "APPROVED", operationalState: "HEALTHY", enabled: true, requiresReview: false,
} as const;

describe("Nuru manual ingestion", () => {
  beforeEach(() => vi.clearAllMocks());

  it("stores an immutable content-hashed raw artifact before processing", async () => {
    mocks.get.mockResolvedValue(source);
    const artifact = await NuruManualIngestionService.ingest({ workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "text/markdown", contentText: "# Artemis" }, "human:1", "corr-1");
    expect(artifact.contentHash).toMatch(/^sha256:/);
    expect(artifact.byteLength).toBe(9);
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ sourceRegistryId: "NSI-1", contentType: "text/markdown" }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "NSI_RAW_ARTIFACT_STORED" }));
  });

  it("reuses the content-addressed artifact instead of storing duplicate bytes", async () => {
    mocks.get.mockResolvedValue(source);
    mocks.findUnique.mockResolvedValue({ id: "RAW-EXISTING", contentHash: "sha256:existing", body: Buffer.from("# Artemis") });
    const artifact = await NuruManualIngestionService.ingest({ workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "text/markdown", contentText: "# Artemis" }, "human:1", "corr-reuse");
    expect(artifact).toMatchObject({ id: "RAW-EXISTING", contentHash: "sha256:existing", body: undefined });
    expect(mocks.create).not.toHaveBeenCalled();
  });

  it("refuses intake from a source that has not been approved", async () => {
    mocks.get.mockResolvedValue({ ...source, admissionState: "REVIEW_REQUIRED", requiresReview: true });
    await expect(NuruManualIngestionService.ingest({ workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "text/plain", contentText: "pending" }, "human:1", "corr-2")).rejects.toThrow(/requires human approval/i);
  });

  it("reports unavailable sources as a client-visible policy conflict", async () => {
    mocks.get.mockResolvedValue({ ...source, enabled: false });
    await expect(NuruManualIngestionService.ingest({ workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "text/plain", contentText: "disabled" }, "human:1", "corr-3")).rejects.toMatchObject<AppError>({ status: 409, code: "source_disabled" });
  });

  it("rejects invalid base64 before storing an artifact", async () => {
    mocks.get.mockResolvedValue(source);
    await expect(NuruManualIngestionService.ingest({ workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "application/pdf", contentBase64: "not base64" }, "human:1", "corr-4")).rejects.toMatchObject({ issues: expect.any(Array) });
  });
});
