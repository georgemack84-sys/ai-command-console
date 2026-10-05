import { describe, expect, it, vi } from "vitest";
import { extractClaimCandidates } from "@/src/nuru/claim-extraction";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn(), audit: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruNormalizedDocument: { findUnique: mocks.findUnique }, nuruClaimCandidate: { upsert: mocks.upsert, findMany: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));
import { NuruClaimExtractionService } from "@/src/server/services/nuru-claim-extraction-service";

describe("Nuru claim extraction", () => {
  it("binds each candidate to an exact stable passage", () => {
    const claims = extractClaimCandidates("RAW-1", [{ heading: "Launch", content: "Artemis will launch in 2028. The mission should use a safe trajectory.", ordinal: 0 }]);
    expect(claims).toEqual(expect.arrayContaining([expect.objectContaining({ claimType: "QUANTITATIVE", passageReference: "RAW-1#section-1", confidence: 0.35 })]));
    expect(claims.every((claim) => claim.fingerprint.length === 64)).toBe(true);
  });

  it("persists candidates as non-canonical evidence", async () => {
    mocks.findUnique.mockResolvedValue({ id: "DOC-1", workspaceId: "workspace-1", rawArtifactId: "RAW-1", sourceRegistryId: "NSI-1", status: "EXTRACTED", sections: [{ heading: "Launch", content: "Artemis will launch in 2028.", ordinal: 0 }] });
    const claims = await NuruClaimExtractionService.generate({ normalizedDocumentId: "DOC-1", workspaceId: "workspace-1" }, "human:1", "corr-1");
    expect(claims[0]).toMatchObject({ status: "CANDIDATE", rawArtifactId: "RAW-1", sourceRegistryId: "NSI-1" });
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ status: "CANDIDATE" }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "NSI_CLAIM_CANDIDATES_GENERATED" }));
  });

  it("does not create claims from a pending document", async () => {
    mocks.findUnique.mockResolvedValue({ id: "DOC-2", workspaceId: "workspace-1", status: "EXTRACTION_PENDING" });
    await expect(NuruClaimExtractionService.generate({ normalizedDocumentId: "DOC-2", workspaceId: "workspace-1" }, "human:1", "corr-2")).rejects.toMatchObject({ status: 409, code: "document_not_extractable" });
  });
});
