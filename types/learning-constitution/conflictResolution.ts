import type { ConflictDimensionComparisons } from "./conflictComparison";
import type { ConflictRecord, ConflictResolutionOutcome } from "./conflictEngine";
import type { ProvenanceActor } from "./provenance";
import type { KnowledgeClassification } from "./constitutionalVocabulary";
import type { KnowledgeScopeReference } from "./knowledgeScope";

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

export type ConflictKnowledgeSnapshot = Readonly<{
  knowledgeId: string;
  statement: string;
  classification: KnowledgeClassification;
  scope: KnowledgeScopeReference;
  authority: string;
}>;

/** Immutable view of the facts available at proposal time; later evidence cannot rewrite it. */
export type ResolutionEvidencePackage = Readonly<{
  id: string;
  recordType: "RESOLUTION_EVIDENCE_PACKAGE";
  conflictId: string;
  proposalId: string;
  existingItem: ConflictKnowledgeSnapshot;
  candidateItem: ConflictKnowledgeSnapshot;
  comparisons: ConflictDimensionComparisons;
  evidenceRefs: readonly string[];
  provenanceRefs: readonly string[];
  policyVersions: Readonly<{ conflict: string; authority: string; scope: string; evidence: string; provenance: string }>;
  createdAt: string;
  immutable: true;
}>;

export type ConflictAuditEvent = Readonly<{
  id: string;
  recordType: "CONFLICT_EVENT";
  eventType: "CONFLICT_PROPOSAL_RECORDED";
  conflictId: string;
  proposalId: string;
  evidencePackageId: string;
  actor: ProvenanceActor;
  occurredAt: string;
  immutable: true;
}>;

export type ConflictClarificationRequest = Readonly<{
  id: string;
  recordType: "CONFLICT_CLARIFICATION_REQUEST";
  conflictId: string;
  question: string;
  candidateOutcomes: readonly ConflictResolutionOutcome[];
  requiredAuthority: string;
  requestedBy: ProvenanceActor;
  createdAt: string;
  immutable: true;
}>;

export type ConflictEscalation = Readonly<{
  id: string;
  recordType: "CONFLICT_ESCALATION";
  conflictId: string;
  proposalId?: string;
  reason: string;
  targetAuthority: string;
  escalatedBy: ProvenanceActor;
  createdAt: string;
  immutable: true;
}>;
