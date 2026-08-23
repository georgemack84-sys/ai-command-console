import { describe, expect, it } from "vitest";

import { ConflictResolutionAuthorityGate, DeterministicConflictResolutionPlanner } from "@/services/learning-constitution";
import type { ConflictDimensionComparisons, ConflictRecord } from "@/types/learning-constitution";

const comparisons: ConflictDimensionComparisons = { scope: { existing: "same", candidate: "same", outcome: "EQUIVALENT", rationaleCode: "same" }, authority: { existing: "human", candidate: "agent", outcome: "EXISTING_STRONGER", rationaleCode: "human" }, evidence: { existing: "a", candidate: "b", outcome: "INCOMPARABLE", rationaleCode: "evidence" }, confidence: { existing: "0.9", candidate: "0.8", outcome: "EXISTING_STRONGER", rationaleCode: "confidence" }, temporal: { existing: "", candidate: "", outcome: "UNKNOWN", rationaleCode: "time" }, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
const conflict = (type: ConflictRecord["type"]): ConflictRecord => ({ id: "CF-218", recordType: "CONFLICT", existingKnowledgeId: "P-17", candidateKnowledgeId: "CP-42", type, scope: { type: "PROJECT", id: "noesis" }, authorityComparison: comparisons.authority, evidenceComparison: comparisons.evidence, confidenceComparison: comparisons.confidence, provenanceRefs: ["TE-1"], resolutionReasoning: "test", status: "RESOLUTION_PROPOSED", createdAt: "2026-08-23T00:00:00.000Z", immutable: true });

describe("DeterministicConflictResolutionPlanner", () => {
  it("proposes but does not execute a rejection when existing authority is stronger", () => {
    const proposal = new DeterministicConflictResolutionPlanner(() => "RP-1", () => "2026-08-23T01:00:00.000Z").plan(conflict("DIRECT_CONTRADICTION"), comparisons, { actorId: "agent:noesis", actorType: "AGENT" });
    expect(proposal).toMatchObject({ proposedOutcome: "REJECT", status: "AWAITING_APPROVAL", requiresApproval: true, conflictPolicyVersion: "8.1.0" });
    expect(new ConflictResolutionAuthorityGate().evaluate({ proposal, resolver: proposal.proposedBy, attemptingExecution: true })).toMatchObject({ decision: "DENY", reasonCode: "AGENT_CANNOT_APPROVE_OR_EXECUTE", executionPermissionGranted: false });
  });

  it("treats corrections as approval-required supersession proposals", () => {
    const proposal = new DeterministicConflictResolutionPlanner(() => "RP-2").plan(conflict("CORRECTION_CONFLICT"), comparisons, { actorId: "agent:noesis", actorType: "AGENT" });
    expect(proposal).toMatchObject({ proposedOutcome: "SUPERSEDE", status: "AWAITING_APPROVAL" });
  });
});
