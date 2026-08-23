import { describe, expect, it } from "vitest";

import { ConflictResolutionDecisionService, ConflictResolutionExecutor, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { ConflictDimensionComparisons, ConflictRecord, ConflictResolutionProposal } from "@/types/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const axis = { existing: "", candidate: "", outcome: "UNKNOWN" as const, rationaleCode: "test" };
const comparisons: ConflictDimensionComparisons = { scope: axis, authority: axis, evidence: axis, confidence: axis, temporal: axis, persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
const conflict: ConflictRecord = { id: "CF-1", recordType: "CONFLICT", existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "CORRECTION_CONFLICT", scope, authorityComparison: axis, evidenceComparison: axis, confidenceComparison: axis, provenanceRefs: [], resolutionReasoning: "test", status: "AWAITING_APPROVAL", createdAt: "2026-08-23T00:00:00.000Z", immutable: true };
const proposal: ConflictResolutionProposal = { id: "RP-1", recordType: "CONFLICT_RESOLUTION_PROPOSAL", conflictId: "CF-1", proposedOutcome: "SUPERSEDE", reasoning: ["test"], comparisons, requiresApproval: true, status: "AWAITING_APPROVAL", conflictPolicyVersion: "8.1.0", createdAt: "2026-08-23T00:00:00.000Z", proposedBy: { actorId: "agent:noesis", actorType: "AGENT" }, immutable: true };

describe("ConflictResolutionExecutor", () => {
  it("requires an authorized human decision and a durable successor before supersession", async () => {
    const ledger = new InMemoryProvenanceLedger(); await ledger.append(conflict); await ledger.append(proposal);
    const decision = await new ConflictResolutionDecisionService(ledger, () => "CRD-1", (suffix) => `relationship:${suffix}`, () => "2026-08-23T01:00:00.000Z").decide({ conflictId: "CF-1", proposalId: "RP-1", acceptedOutcome: "SUPERSEDE", decisionMaker: { actorId: "user:owner", actorType: "HUMAN" }, decisionAuthority: "HUMAN_DECISION", decisionReason: "Explicit correction." });
    expect(decision?.recordType).toBe("CONFLICT_RESOLUTION_DECISION");
    expect(await new ConflictResolutionExecutor(ledger).execute("CRD-1")).toMatchObject({ status: "REJECTED", reasonCode: "DURABLE_SUCCESSOR_REQUIRED", persistenceEffect: "NONE" });
  });

  it("records a human rejection without deleting the conflicting candidate", async () => {
    const ledger = new InMemoryProvenanceLedger();
    const rejectionConflict = { ...conflict, id: "CF-reject", candidateKnowledgeId: "CP-reject" };
    const rejectionProposal = { ...proposal, id: "RP-reject", conflictId: rejectionConflict.id, proposedOutcome: "REJECT" as const };
    const candidate = { id: "CP-reject", recordType: "CANDIDATE_KNOWLEDGE" as const, statement: "Use SQLite.", classification: "PRINCIPLE" as const, scope, authority: "AGENT_INFERRED", extractionRefs: [], evidenceRefs: [], status: "CONFLICTED" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const };
    await ledger.append(rejectionConflict); await ledger.append(rejectionProposal); await ledger.append(candidate);
    const decision = await new ConflictResolutionDecisionService(ledger, () => "CRD-reject", (suffix) => `relationship:${suffix}`, () => "2026-08-23T01:00:00.000Z").decide({ conflictId: rejectionConflict.id, proposalId: rejectionProposal.id, acceptedOutcome: "REJECT", decisionMaker: { actorId: "user:owner", actorType: "HUMAN" }, decisionAuthority: "HUMAN_DECISION", decisionReason: "The established rule remains authoritative." });
    const result = await new ConflictResolutionExecutor(ledger, () => "CR-reject", () => "relationship:execution", () => "2026-08-23T01:00:00.000Z").execute(decision!.id);
    expect(result).toMatchObject({ status: "EXECUTED", resolution: { resolutionType: "REJECT", affectedKnowledgeIds: ["CP-reject"] } });
    expect((await ledger.get("CP-reject"))?.recordType).toBe("CANDIDATE_KNOWLEDGE");
    expect((await ledger.getAll()).some((record) => record.recordType === "HUMAN_APPROVAL" && record.candidateId === "CP-reject" && record.decision === "REJECTED")).toBe(true);
  });
});
