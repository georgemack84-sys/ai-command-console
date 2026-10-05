import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), update: vi.fn(), audit: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruClaimCandidate: { findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));
import { NuruClaimReviewService } from "@/src/server/services/nuru-claim-review-service";
import { NuruCitationService } from "@/src/server/services/nuru-citation-service";

const claim = { id: "CLM-1", workspaceId: "workspace-1", normalizedDocumentId: "DOC-1", rawArtifactId: "RAW-1", sourceRegistryId: "NSI-1", passageReference: "RAW-1#section-1", passageText: "Evidence passage.", claimText: "Candidate claim.", status: "CANDIDATE" };
describe("Nuru claim review and citations", () => {
  it("retains a claim for quality without accepting it as knowledge", async () => {
    mocks.findUnique.mockResolvedValue(claim); mocks.update.mockResolvedValue({ ...claim, status: "RETAINED_FOR_QUALITY" });
    await expect(NuruClaimReviewService.review({ claimId: "CLM-1", workspaceId: "workspace-1", action: "RETAIN", reason: "Evidence is relevant." }, "human:1", "corr-1")).resolves.toMatchObject({ status: "RETAINED_FOR_QUALITY" });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "NSI_CLAIM_REVIEWED" }));
  });

  it("resolves a stable citation to the full evidence chain", async () => {
    mocks.findUnique.mockResolvedValue(claim);
    await expect(NuruCitationService.forClaim("CLM-1", "workspace-1")).resolves.toMatchObject({ citationId: "NURU-CIT-CLM-1", normalizedDocumentId: "DOC-1", rawArtifactId: "RAW-1", sourceRegistryId: "NSI-1", passageReference: "RAW-1#section-1" });
  });

  it("hides a cross-workspace claim", async () => {
    mocks.findUnique.mockResolvedValue({ ...claim, workspaceId: "workspace-2" });
    await expect(NuruCitationService.forClaim("CLM-1", "workspace-1")).rejects.toMatchObject({ status: 404, code: "claim_candidate_not_found" });
  });
});
