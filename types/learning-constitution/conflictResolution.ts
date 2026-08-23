import type { ConflictDimensionComparisons } from "./conflictComparison";
import type { ConflictRecord, ConflictResolutionOutcome } from "./conflictEngine";
import type { ProvenanceActor } from "./provenance";

export const CONFLICT_RESOLUTION_GATE_DECISIONS = ["ALLOW_ANALYSIS_ONLY", "REQUIRE_APPROVAL", "DENY"] as const;
export type ConflictResolutionGateDecision = (typeof CONFLICT_RESOLUTION_GATE_DECISIONS)[number];

export type ConflictResolutionProposal = Readonly<{
  id: string;
  recordType: "CONFLICT_RESOLUTION_PROPOSAL";
  conflictId: string;
  proposedOutcome: ConflictResolutionOutcome;
  reasoning: readonly string[];
  comparisons: ConflictDimensionComparisons;
  requiresApproval: boolean;
  status: "RESOLUTION_PROPOSED" | "AWAITING_CLARIFICATION" | "AWAITING_APPROVAL" | "ESCALATED";
  conflictPolicyVersion: string;
  createdAt: string;
  proposedBy: ProvenanceActor;
  immutable: true;
}>;

export type ConflictResolutionGateRequest = Readonly<{
  proposal: ConflictResolutionProposal;
  resolver: ProvenanceActor;
  attemptingExecution: boolean;
}>;

export type ConflictResolutionGateResult = Readonly<{
  decision: ConflictResolutionGateDecision;
  reasonCode: "NO_MUTATION_PROPOSED" | "HUMAN_APPROVAL_REQUIRED" | "AGENT_CANNOT_APPROVE_OR_EXECUTE" | "RESOLUTION_EXECUTION_NOT_ENABLED";
  persistenceEffect: "NONE";
  authorityEffect: "UNCHANGED";
  executionPermissionGranted: false;
}>;

export interface ConflictResolutionPlanner {
  plan(conflict: ConflictRecord, comparisons: ConflictDimensionComparisons, proposedBy: ProvenanceActor): ConflictResolutionProposal;
}
