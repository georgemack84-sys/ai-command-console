import type { ConflictDimensionComparisons } from "../../types/learning-constitution/conflictComparison";
import type { ConflictRecord, ConflictResolutionOutcome } from "../../types/learning-constitution/conflictEngine";
import type { ConflictResolutionPlanner as ConflictResolutionPlannerContract, ConflictResolutionProposal } from "../../types/learning-constitution/conflictResolution";
import type { ProvenanceActor } from "../../types/learning-constitution/provenance";

export const CONFLICT_POLICY_VERSION = "8.1.0";

const planFor = (conflict: ConflictRecord, comparisons: ConflictDimensionComparisons): Readonly<{ outcome: ConflictResolutionOutcome; status: ConflictResolutionProposal["status"]; reasons: readonly string[] }> => {
  if (conflict.type === "AMBIGUOUS_CONFLICT") return { outcome: "REQUEST_CLARIFICATION", status: "AWAITING_CLARIFICATION", reasons: ["AMBIGUOUS_CONFLICT_REQUIRES_CLARIFICATION"] };
  if (conflict.type === "CORRECTION_CONFLICT") return { outcome: "SUPERSEDE", status: "AWAITING_APPROVAL", reasons: ["EXPLICIT_CORRECTION_REQUIRES_APPROVAL"] };
  if (conflict.type === "EXCEPTION_CONFLICT") return { outcome: "CREATE_EXCEPTION", status: "AWAITING_APPROVAL", reasons: ["EXCEPTION_MUST_BE_EXPLICIT_AND_BOUNDED"] };
  if (conflict.type === "DUPLICATE_OR_OVERLAP") return { outcome: "MERGE", status: "AWAITING_APPROVAL", reasons: ["DUPLICATE_REQUIRES_GOVERNED_MERGE"] };
  if (conflict.type === "SCOPE_COLLISION") return { outcome: "NARROW_SCOPE", status: "AWAITING_APPROVAL", reasons: ["SCOPE_CHANGE_MUST_BE_EXPLICIT"] };
  if (conflict.type === "TEMPORAL_CONFLICT" && comparisons.temporal.outcome === "CANDIDATE_STRONGER") return { outcome: "SUPERSEDE", status: "AWAITING_APPROVAL", reasons: ["TEMPORAL_REPLACEMENT_REQUIRES_APPROVAL"] };
  if (comparisons.authority.outcome === "EXISTING_STRONGER") return { outcome: "REJECT", status: "AWAITING_APPROVAL", reasons: ["EXISTING_AUTHORITY_PREVAILS"] };
  return { outcome: "ESCALATE", status: "ESCALATED", reasons: ["MATERIAL_CONFLICT_REQUIRES_AUTHORIZED_RESOLUTION"] };
};

/** Deterministic planner: it recommends a disposition but never performs it. */
export class DeterministicConflictResolutionPlanner implements ConflictResolutionPlannerContract {
  constructor(private readonly createId = () => `RP-${crypto.randomUUID()}`, private readonly now = () => new Date().toISOString()) {}

  plan(conflict: ConflictRecord, comparisons: ConflictDimensionComparisons, proposedBy: ProvenanceActor): ConflictResolutionProposal {
    const planned = planFor(conflict, comparisons);
    return {
      id: this.createId(), recordType: "CONFLICT_RESOLUTION_PROPOSAL", conflictId: conflict.id,
      proposedOutcome: planned.outcome, reasoning: planned.reasons, comparisons, requiresApproval: planned.outcome !== "NO_CONFLICT",
      status: planned.status, conflictPolicyVersion: CONFLICT_POLICY_VERSION, createdAt: this.now(), proposedBy, immutable: true,
    };
  }
}
