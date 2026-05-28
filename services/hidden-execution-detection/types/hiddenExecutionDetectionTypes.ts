import type { ImmutableAuditLedgerEntry } from "@/services/audit/immutableAuditLedger";

export type HiddenExecutionVector =
  | "delayed_invocation_path"
  | "scheduler_registration"
  | "recursive_orchestration"
  | "retry_loop"
  | "hidden_adapter"
  | "unauthorized_queue"
  | "implicit_dispatch_semantics"
  | "runtime_mutation_pathway"
  | "event_triggered_execution"
  | "background_worker_semantics"
  | "callback_invocation_path"
  | "self_repair_semantics"
  | "authority_expansion_path";

export type HiddenExecutionSeverity =
  | "none"
  | "low"
  | "medium"
  | "high"
  | "critical";

export type HiddenExecutionArtifactType =
  | "recommendation"
  | "proposal"
  | "replay"
  | "approval_dependency"
  | "governance_snapshot"
  | "operator_authority"
  | "lineage"
  | "unknown";

export type HiddenExecutionScanStatus =
  | "passed"
  | "blocked"
  | "escalated"
  | "failed_closed";

export type HiddenExecutionBlockReason =
  | "artifact_missing"
  | "artifact_unknown"
  | "circular_structure"
  | "detector_error"
  | "hash_failure"
  | "governance_binding_inconsistent"
  | "replay_binding_inconsistent"
  | "high_uncertainty"
  | "hidden_execution_detected";

export interface HiddenExecutionFinding {
  findingId: string;
  vector: HiddenExecutionVector;
  severity: HiddenExecutionSeverity;
  path: string;
  matchedTerm?: string;
  evidence: string;
  blocked: boolean;
  escalationRequired: boolean;
  executionAuthorized: false;
  findingHash: string;
}

export interface HiddenExecutionDetectionReport {
  reportId: string;
  artifactId: string;
  artifactType: HiddenExecutionArtifactType;
  scannedAt: string;
  scanStatus: HiddenExecutionScanStatus;
  scanPassed: boolean;
  findings: HiddenExecutionFinding[];
  detectedVectors: HiddenExecutionVector[];
  severity: HiddenExecutionSeverity;
  blocked: boolean;
  escalationRequired: boolean;
  blockReasons: string[];
  governanceSnapshotId?: string;
  replaySnapshotId?: string;
  validatorVersion?: string;
  proposalLineageHash?: string;
  recommendationLineageHash?: string;
  replayHash?: string;
  executionAuthorized: false;
  reportHash: string;
  auditHash: string;
}

export type HiddenExecutionAuditRecord = Readonly<{
  recordId: string;
  artifactId: string;
  artifactType: HiddenExecutionArtifactType;
  severity: HiddenExecutionSeverity;
  blocked: boolean;
  escalationRequired: boolean;
  reportHash: string;
  auditHash: string;
  executionAuthorized: false;
}>;

export type HiddenExecutionDetectionInput = Readonly<{
  artifactId: string;
  artifactType: HiddenExecutionArtifactType;
  artifact: unknown;
  scannedAt: string;
  governanceSnapshotId?: string;
  replaySnapshotId?: string;
  validatorVersion?: string;
  proposalLineageHash?: string;
  recommendationLineageHash?: string;
  replayHash?: string;
  existingAuditLedger?: readonly HiddenExecutionAuditLedgerEntry[];
  metadata?: Readonly<Record<string, unknown>>;
}>;

export type HiddenExecutionAuditLedgerEntry =
  ImmutableAuditLedgerEntry<Readonly<Record<string, unknown>>>;

export type HiddenExecutionDetectionResult = Readonly<{
  report: HiddenExecutionDetectionReport;
  auditRecord: HiddenExecutionAuditRecord;
  auditLedger: readonly HiddenExecutionAuditLedgerEntry[];
  deterministicHash: string;
  errors: readonly string[];
  warnings: readonly string[];
  derivedOnly: true;
}>;
