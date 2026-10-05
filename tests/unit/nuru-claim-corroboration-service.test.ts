import { describe, expect, it, vi } from "vitest";
const repository = vi.hoisted(() => ({ findMany: vi.fn(), upsert: vi.fn(async ({ create }) => create) }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruClaimCandidate: { findMany: repository.findMany }, nuruClaimCorroboration: { upsert: repository.upsert, findMany: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));
import { NuruClaimCorroborationService } from "@/src/server/services/nuru-claim-corroboration-service";

describe("Nuru claim corroboration", () => {
  it("rejects same-source claims marked independent", async () => {
    repository.findMany.mockResolvedValueOnce([{ id: "claim-a", sourceRegistryId: "source-1" }, { id: "claim-b", sourceRegistryId: "source-1" }]);
    await expect(NuruClaimCorroborationService.record({ claimCandidateId: "claim-a", supportingClaimId: "claim-b", workspaceId: "workspace-1", sourceRelationship: "INDEPENDENT", supportsClaim: true, rationale: "Separate report" }, "human:1", "corr-1")).rejects.toMatchObject({ code: "independence_conflict" });
  });
  it("records a dependent syndicated source without counting it as independent", async () => {
    repository.findMany.mockResolvedValueOnce([{ id: "claim-a", sourceRegistryId: "source-1" }, { id: "claim-b", sourceRegistryId: "source-2" }]);
    const row = await NuruClaimCorroborationService.record({ claimCandidateId: "claim-a", supportingClaimId: "claim-b", workspaceId: "workspace-1", sourceRelationship: "SYNDICATED", supportsClaim: true, rationale: "Republished wire report" }, "human:1", "corr-2");
    expect(row).toMatchObject({ sourceRelationship: "SYNDICATED", supportsClaim: true });
  });
});
