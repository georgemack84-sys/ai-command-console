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

  it("only accepts a narrowing that is narrower than the established durable knowledge", async () => {
    const ledger = new InMemoryProvenanceLedger();
    const broadScope = { type: "ORGANIZATION", id: "noesis" } as const;
    const narrowScope = { type: "PROJECT", id: "noesis" } as const;
    const existing = { id: "P-broad", recordType: "DURABLE_KNOWLEDGE" as const, statement: "Use managed storage.", classification: "PRINCIPLE" as const, scope: broadScope, authority: "HUMAN", candidateId: "CP-broad", approvalId: "HA-broad", evidenceRefs: [], status: "ACTIVE" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const };
    const successor = { ...existing, id: "P-narrow", scope: narrowScope, candidateId: "CP-narrow", approvalId: "HA-narrow" };
    const narrowConflict = { ...conflict, id: "CF-narrow", existingKnowledgeId: existing.id, candidateKnowledgeId: successor.id, scope: narrowScope };
    const narrowProposal = { ...proposal, id: "RP-narrow", conflictId: narrowConflict.id, proposedOutcome: "NARROW_SCOPE" as const };
    await ledger.append(existing); await ledger.append(successor); await ledger.append(narrowConflict); await ledger.append(narrowProposal);
    const decision = await new ConflictResolutionDecisionService(ledger, () => "CRD-narrow", (suffix) => `relationship:${suffix}`, () => "2026-08-23T01:00:00.000Z").decide({ conflictId: narrowConflict.id, proposalId: narrowProposal.id, acceptedOutcome: "NARROW_SCOPE", decisionMaker: { actorId: "user:owner", actorType: "HUMAN" }, decisionAuthority: "HUMAN_DECISION", decisionReason: "This only applies to the project.", executionPlan: { narrowedScope: narrowScope } });
    const result = await new ConflictResolutionExecutor(ledger, () => "CR-narrow", () => "relationship:narrow", () => "2026-08-23T01:00:00.000Z").execute(decision!.id);
    expect(result).toMatchObject({ status: "EXECUTED", resolution: { resolutionType: "NARROW_SCOPE" } });
    expect((await ledger.getRelationships(successor.id)).some((link) => link.type === "NARROWS_SCOPE_OF" && link.toId === existing.id)).toBe(true);
  });

  it("requires a separately durable merged record and preserves both source links", async () => {
    const ledger = new InMemoryProvenanceLedger();
    const existing = { id: "P-merge", recordType: "DURABLE_KNOWLEDGE" as const, statement: "Use monitored storage.", classification: "PRINCIPLE" as const, scope, authority: "HUMAN", candidateId: "CP-source", approvalId: "HA-source", evidenceRefs: [], status: "ACTIVE" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const };
    const candidate = { id: "CP-merge", recordType: "CANDIDATE_KNOWLEDGE" as const, statement: "Encrypt monitored storage.", classification: "PRINCIPLE" as const, scope, authority: "HUMAN", extractionRefs: [], evidenceRefs: [], status: "CONFLICTED" as const, createdAt: "2026-08-23T00:00:00.000Z", immutable: true as const };
    const merged = { ...existing, id: "P-merged", statement: "Use monitored, encrypted storage.", candidateId: candidate.id, approvalId: "HA-merged" };
    const mergeConflict = { ...conflict, id: "CF-merge", existingKnowledgeId: existing.id, candidateKnowledgeId: candidate.id, type: "DUPLICATE_OR_OVERLAP" as const };
    const mergeProposal = { ...proposal, id: "RP-merge", conflictId: mergeConflict.id, proposedOutcome: "MERGE" as const };
    await ledger.append(existing); await ledger.append(candidate); await ledger.append(merged); await ledger.append(mergeConflict); await ledger.append(mergeProposal);
    const decision = await new ConflictResolutionDecisionService(ledger, () => "CRD-merge", (suffix) => `relationship:${suffix}`, () => "2026-08-23T01:00:00.000Z").decide({ conflictId: mergeConflict.id, proposalId: mergeProposal.id, acceptedOutcome: "MERGE", decisionMaker: { actorId: "user:owner", actorType: "HUMAN" }, decisionAuthority: "HUMAN_DECISION", decisionReason: "Preserve both compatible details.", executionPlan: { mergedKnowledgeId: merged.id } });
    const result = await new ConflictResolutionExecutor(ledger, () => "CR-merge", () => "relationship:merge", () => "2026-08-23T01:00:00.000Z").execute(decision!.id);
    expect(result).toMatchObject({ status: "EXECUTED", resolution: { resolutionType: "MERGE", resultingKnowledgeIds: [merged.id] } });
    expect((await ledger.getRelationships(merged.id)).filter((link) => link.type === "MERGED_FROM").map((link) => link.toId).sort()).toEqual([candidate.id, existing.id].sort());
  });
});
