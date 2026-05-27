import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";

export type ReplayAuditFailureCode =
  | "PHASE4_2H_REPO_CONTEXT_MISSING"
  | "PHASE4_2H_COMPATIBILITY_TRUTH_VIOLATION"
  | "PHASE4_2H_MISSING_EXECUTION_TRUTH_HASH"
  | "PHASE4_2H_MISSING_EXECUTION_COMPATIBILITY_HASH"
  | "PHASE4_2H_MISSING_COMPATIBILITY_SNAPSHOT"
  | "PHASE4_2H_COMPATIBILITY_HASH_DRIFT"
  | "PHASE4_2H_COMPATIBILITY_SNAPSHOT_MISMATCH"
  | "PHASE4_2H_REPLAY_SNAPSHOT_HASH_MISMATCH"
  | "PHASE4_2H_REPLAY_PROOF_MISMATCH"
  | "PHASE4_2H_AUDIT_ARTIFACT_HASH_MISMATCH"
  | "PHASE4_2H_MUTABLE_REPLAY_INPUT_DETECTED"
  | "PHASE4_2H_APPROVAL_CONTRACT_REHYDRATION_DETECTED"
  | "PHASE4_2H_ROLLBACK_CONTRACT_REGENERATION_DETECTED"
  | "PHASE4_2H_AUTHORITY_GRAPH_DIVERGENCE"
  | "PHASE4_2H_ESCALATION_GRAPH_DIVERGENCE"
  | "PHASE4_2H_LEDGER_EVENT_HASH_MISMATCH"
  | "PHASE4_2H_EVIDENCE_REFERENCE_HASH_MISMATCH";

export type ReplayAuditFailure = Readonly<{
  code: ReplayAuditFailureCode;
  message: string;
  path?: string;
}>;

export type CompatibilityReplayReference = Readonly<{
  executionTruthHash: string;
  executionCompatibilityHash: string;
  compatibilitySnapshotHash: string;
}>;

export type ReplayInputSnapshot = Readonly<{
  snapshotVersion: string;
  planId: string;
  planHash: string;
  normalizedPlanHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  compatibilitySnapshotHash: string;
  compatibilitySnapshot: unknown;
}>;

export type ReplayProof = Readonly<{
  proofVersion: string;
  planId: string;
  originalExecutionTruthHash: string;
  replayedExecutionTruthHash: string;
  originalExecutionCompatibilityHash: string;
  replayedExecutionCompatibilityHash: string;
  originalReplaySnapshotHash: string;
  replayedReplaySnapshotHash: string;
  structuralEquality: boolean;
  verdict: "REPLAY_COMPATIBLE" | "REPLAY_INCOMPATIBLE";
  failureCode?: ReplayAuditFailureCode;
}>;

export type PlanAuditArtifact = Readonly<{
  artifactVersion: string;
  planId: string;
  planHash: string;
  normalizedPlanHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  compatibilitySnapshotHash: string;
  replaySnapshotHash: string;
  replayProofHash: string;
  artifactHash: string;
}>;

export type AuditLedgerEvent = Readonly<{
  eventVersion: string;
  eventType: string;
  planId: string;
  planHash: string;
  previousEventHash?: string;
  payloadHash: string;
  eventHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type PlanEvidenceReference = Readonly<{
  referenceVersion: string;
  planId: string;
  planHash: string;
  normalizedPlanHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  compatibilitySnapshotHash: string;
  replaySnapshotHash: string;
  replayProofHash: string;
  auditArtifactHash: string;
  ledgerEventHashes: readonly string[];
}>;

export type ReplayAuditReadinessVerdict =
  | "REPLAY_AUDIT_READY"
  | "REPLAY_AUDIT_BLOCKED";

export type ReplayAuditInput = Readonly<{
  normalizedPlan: NormalizedPlan;
  executionTruthPackage: ExecutionTruthPackage;
  executionCompatibilityContract: ExecutionCompatibilityContract;
  expectedExecutionTruthHash?: string;
  expectedExecutionCompatibilityHash?: string;
}>;

export type ReplayAuditArtifacts = Readonly<{
  compatibilityReference: CompatibilityReplayReference;
  replayInputSnapshot: ReplayInputSnapshot;
  replaySnapshotHash: string;
  replayProof: ReplayProof;
  replayProofHash: string;
  auditArtifact: PlanAuditArtifact;
  ledgerEvents: readonly AuditLedgerEvent[];
  evidenceReference: PlanEvidenceReference;
  evidenceReferenceHash: string;
}>;

export type ReplayAuditResult = Readonly<{
  verdict: ReplayAuditReadinessVerdict;
  planId: string;
  planHash: string;
  normalizedPlanHash: string;
  executionTruthHash?: string;
  executionCompatibilityHash?: string;
  compatibilitySnapshotHash?: string;
  replaySnapshotHash?: string;
  replayProofHash?: string;
  auditArtifactHash?: string;
  evidenceReferenceHash?: string;
  failures: readonly ReplayAuditFailure[];
  artifacts?: ReplayAuditArtifacts;
}>;
