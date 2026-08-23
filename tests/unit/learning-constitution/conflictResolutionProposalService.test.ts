import { describe, expect, it } from "vitest";

import { ConflictResolutionProposalService, InMemoryProvenanceLedger } from "@/services/learning-constitution";
import type { ConflictDimensionComparisons, ConflictRecord, ConflictResolutionProposal } from "@/types/learning-constitution";

const scope = { type: "PROJECT", id: "noesis" } as const;
const comparison = (rationaleCode: string) => ({ existing: "existing", candidate: "candidate", outcome: "UNKNOWN" as const, rationaleCode });
const comparisons: ConflictDimensionComparisons = { scope: comparison("scope"), authority: comparison("authority"), evidence: comparison("evidence"), confidence: comparison("confidence"), temporal: comparison("temporal"), persistenceEffect: "NONE", authorityEffect: "UNCHANGED", executionPermissionGranted: false };
const conflict: ConflictRecord = { id: "CF-1", recordType: "CONFLICT", existingKnowledgeId: "P-1", candidateKnowledgeId: "CP-1", type: "DIRECT_CONTRADICTION", scope, authorityComparison: comparisons.authority, evidenceComparison: comparisons.evidence, confidenceComparison: comparisons.confidence, provenanceRefs: [], resolutionReasoning: "test", status: "RESOLUTION_PROPOSED", createdAt: "2026-08-23T00:00:00.000Z", immutable: true };
const proposal: ConflictResolutionProposal = { id: "RP-1", recordType: "CONFLICT_RESOLUTION_PROPOSAL", conflictId: "CF-1", proposedOutcome: "ESCALATE", reasoning: ["test"], comparisons, requiresApproval: true, status: "ESCALATED", conflictPolicyVersion: "8.1.0", createdAt: "2026-08-23T00:00:00.000Z", proposedBy: { actorId: "agent:noesis", actorType: "AGENT" }, immutable: true };
const snapshot = (knowledgeId: string) => ({ knowledgeId, statement: knowledgeId, classification: "PRINCIPLE" as const, scope, authority: "HUMAN_DECISION" });

describe("ConflictResolutionProposalService", () => {
  it("freezes an evidence package and audit event alongside the proposal", async () => {
    const ledger = new InMemoryProvenanceLedger();
    await ledger.append(conflict);
    const result = await new ConflictResolutionProposalService(ledger, () => "REP-1", () => "CFE-1", (suffix) => `relationship:${suffix}`).record({ proposal, existingItem: snapshot("P-1"), candidateItem: snapshot("CP-1"), evidenceRefs: [], provenanceRefs: ["TE-1"], actor: { actorId: "agent:noesis", actorType: "AGENT" } });
    expect(result).toMatchObject({ status: "RECORDED", evidencePackage: { id: "REP-1", policyVersions: { conflict: "8.1.0" } }, auditEvent: { id: "CFE-1", eventType: "CONFLICT_PROPOSAL_RECORDED" }, persistenceEffect: "CREATED", executionPermissionGranted: false });
    expect(await ledger.getRelationships("RP-1")).toHaveLength(3);
  });
});
