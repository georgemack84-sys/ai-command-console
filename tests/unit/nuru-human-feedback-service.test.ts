import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn() }));

vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({
  nuruKnowledgeRepository: { nuruHumanFeedback: mocks },
}));

import { NuruHumanFeedbackService } from "@/src/server/services/nuru-human-feedback-service";

describe("Nuru human feedback service", () => {
  it("records an immutable human decision as pending evaluation data", async () => {
    await NuruHumanFeedbackService.record({ proposalId: "CP-61", agentRecommendation: "MERGE", humanDecision: "KEEP_SEPARATE", reason: "Different architectural scopes.", reviewer: "owner", correlationId: "corr-1" });
    expect(mocks.create).toHaveBeenCalledWith({ data: expect.objectContaining({ proposalId: "CP-61", agentRecommendation: "MERGE", humanDecision: "KEEP_SEPARATE", evaluationStatus: "PENDING_REVIEW" }) });
  });

  it("exposes only pending records to the evaluation dataset", async () => {
    await NuruHumanFeedbackService.evaluationDataset();
    expect(mocks.findMany).toHaveBeenCalledWith({ where: { evaluationStatus: "PENDING_REVIEW" }, orderBy: { createdAt: "asc" } });
  });

  it("requires a usable human rationale", async () => {
    await expect(NuruHumanFeedbackService.record({ proposalId: "CP-61", agentRecommendation: "MERGE", humanDecision: "KEEP_SEPARATE", reason: "no", reviewer: "owner", correlationId: "corr-1" })).rejects.toThrow();
  });
});
