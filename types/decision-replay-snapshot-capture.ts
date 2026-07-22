import type { DecisionReplayArtifactRef, DecisionReplayRecord, DecisionReplayValidationStatus } from "@/types/decision-replay-contract";

export type ReplaySnapshotType =
  | "DECISION_CANDIDATE"
  | "NORMALIZED_CANDIDATE"
  | "DECISION_CONTEXT"
  | "DEPENDENCY_GRAPH"
  | "PRIORITY_RANKING"
  | "CONFLICT_ANALYSIS"
  | "GOVERNANCE_VALIDATION"
  | "DECISION_PACKAGE"
  | "OPERATOR_ACTION"
  | "FINAL_DECISION";

export type ReplaySnapshotLifecycleState = "CREATED" | "CAPTURED" | "VALIDATED" | "REGISTERED" | "LEDGER_COMMITTED" | "AVAILABLE_FOR_REPLAY" | "REJECTED" | "ARCHIVED";

export type ReplaySnapshotFailure =
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_CORRUPTED"
  | "DUPLICATE_IDENTITY"
  | "INCOMPLETE_LINEAGE"
  | "INTEGRITY_MISMATCH"
  | "INVALID_SCHEMA"
  | "UNSUPPORTED_VERSION"
  | "TENANT_MISMATCH"
  | "ORCHESTRATION_MISMATCH"
  | "GOVERNANCE_REFS_MISSING"
  | "CONSTITUTIONAL_REFS_MISSING"
  | "REPLAY_REFS_MISSING"
  | "SERIALIZATION_FAILURE"
  | "REGISTRY_FAILURE"
  | "LEDGER_COMMIT_FAILURE"
  | "UNKNOWN_LIFECYCLE_STATE";

export type ReplaySnapshotRecord = Readonly<{
  snapshot_id: string;
  snapshot_type: ReplaySnapshotType;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  snapshot_version: "decision-replay-snapshot/v1";
  schema_version: "decision-replay-snapshot-schema/v1";
  capture_timestamp: string;
  lifecycle_state: ReplaySnapshotLifecycleState;
  serialized_snapshot: string;
  lineage_refs: readonly DecisionReplayArtifactRef[];
  replay_refs: readonly DecisionReplayArtifactRef[];
  governance_refs: readonly DecisionReplayArtifactRef[];
  constitutional_refs: readonly DecisionReplayArtifactRef[];
  validation_status: DecisionReplayValidationStatus;
  integrity_hash: string;
}>;

export type ReplaySnapshotRegistryEntry = Readonly<{
  snapshot_id: string;
  snapshot_type: ReplaySnapshotType;
  orchestration_id: string;
  mission_id: string;
  tenant_id: string;
  snapshot_version: "decision-replay-snapshot/v1";
  lifecycle_state: ReplaySnapshotLifecycleState;
  lineage_refs: readonly string[];
  capture_timestamp: string;
  integrity_hash: string;
}>;

export type ReplaySnapshotLedgerEntry = Readonly<{
  ledger_entry_id: string;
  sequence: number;
  snapshot_id: string;
  snapshot_type: ReplaySnapshotType;
  serialized_snapshot: string;
  snapshot_integrity_hash: string;
  lineage_ref: string;
  replay_ref: string;
  validation_status: DecisionReplayValidationStatus;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type SnapshotCoverageReport = Readonly<{
  orchestration_id: string;
  required_snapshot_count: number;
  captured_snapshot_count: number;
  missing_snapshots: readonly ReplaySnapshotType[];
  duplicate_snapshots: readonly ReplaySnapshotType[];
  coverage_percentage: number;
  replay_ready: boolean;
  validation_status: DecisionReplayValidationStatus;
  integrity_hash: string;
}>;

export type ReplaySnapshotCaptureValidation = Readonly<{
  validation_id: string;
  orchestration_id: string;
  validation_status: DecisionReplayValidationStatus;
  snapshot_schema_valid: boolean;
  serialization_deterministic: boolean;
  integrity_hashes_reproducible: boolean;
  lineage_complete: boolean;
  replay_refs_complete: boolean;
  governance_refs_preserved: boolean;
  constitutional_refs_preserved: boolean;
  registry_complete: boolean;
  ledger_append_only: boolean;
  coverage_complete: boolean;
  replay_ready: boolean;
  failures: readonly ReplaySnapshotFailure[];
  integrity_hash: string;
}>;

export type ReplaySnapshotCaptureResult = Readonly<{
  capture_version: "decision-replay-snapshot-capture/v1";
  replay_contract: DecisionReplayRecord;
  snapshots: readonly ReplaySnapshotRecord[];
  registry: readonly ReplaySnapshotRegistryEntry[];
  ledger: readonly ReplaySnapshotLedgerEntry[];
  coverage_report: SnapshotCoverageReport;
  validation: ReplaySnapshotCaptureValidation;
  lineage_chain: readonly string[];
  deterministic: true;
  advisory_only: true;
  mutates_original_orchestration: false;
  integrity_hash: string;
}>;

export type ReplaySnapshotCaptureFoundation = Readonly<{
  capture_version: "decision-replay-snapshot-capture/v1";
  required_snapshot_types: readonly ReplaySnapshotType[];
  lifecycle_states: readonly ReplaySnapshotLifecycleState[];
  terminal_states: readonly ReplaySnapshotLifecycleState[];
  result: ReplaySnapshotCaptureResult;
}>;
