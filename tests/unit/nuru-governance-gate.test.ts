import { describe, expect, it } from "vitest";
import { NuruGovernanceGate } from "@/src/server/services/nuru-governance-gate";

const base = { proposalId: "proposal-1", recommendation: "ACCEPT" as const, qualityStatus: "PASS" as const, confidence: 0.94, evidenceQuality: "STRONG" as const, sourceAuthority: "OWNER" as const, requiredReview: true, correlationId: "corr-governance" };

describe("Nuru Governance Gate", () => {
  it("requires a human decision before it authorizes a durable mutation", () => {
    expect(NuruGovernanceGate.evaluate({ ...base, humanApproved: false }).outcome).toBe("HUMAN_REVIEW_REQUIRED");
    expect(NuruGovernanceGate.evaluate({ ...base, humanApproved: true })).toMatchObject({ outcome: "APPROVED", authorizedAction: "ARCHIVE" });
  });

  it("routes conflicts and insufficient evidence away from archive authorization", () => {
    expect(NuruGovernanceGate.evaluate({ ...base, humanApproved: true, qualityStatus: "CONFLICT", conflictDetected: true }).outcome).toBe("HUMAN_REVIEW_REQUIRED");
    expect(NuruGovernanceGate.evaluate({ ...base, humanApproved: true, qualityStatus: "INSUFFICIENT_EVIDENCE" }).outcome).toBe("MORE_EVIDENCE_REQUIRED");
  });

  it("applies a higher threshold to supersession", () => {
    expect(NuruGovernanceGate.evaluate({ ...base, recommendation: "SUPERSEDE", confidence: 0.85, humanApproved: true }).outcome).toBe("HUMAN_REVIEW_REQUIRED");
  });
});
