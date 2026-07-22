import type { ComplianceEvaluation } from "@/types/decision-compliance";

export type DecisionReplayType =
  | "INPUT"
  | "EVIDENCE"
  | "RISK"
  | "CONFIDENCE"
  | "GOVERNANCE"
  | "CONSTITUTIONAL"
  | "AUTHORITY"
  | "DECISION"
  | "RECOMMENDATION"
  | "PLAN"
  | "MISSION_HEALTH"
  | "FORECAST"
  | "RECOVERY"
  | "CERTIFICATION"
  | "OPERATOR_ACTION"
  | "LIFECYCLE"
  | "LINEAGE";

export type ReplayValidationStatus = "VALID" | "FAILED_CLOSED";
export type ReplayStatus = "READY" | "FAILED";

export type ReplayReferenceRecord = Readonly<{
  replay_reference_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  replay_type: DecisionReplayType;
  source_component: string;
  referenced_record_id: string;
  replay_order: number;
  replay_version: "replay/v1";
  integrity_hash: string;
  replay_timestamp: string;
  lineage_refs: readonly string[];
  created_at: string;
  append_only: true;
}>;

export type DecisionLineageRecord = Readonly<{
  lineage_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  parent_decision_id?: string;
  child_decision_ids: readonly string[];
  originating_input_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  replay_refs: readonly string[];
  decision_output_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
  append_only: true;
}>;

export type ReplayMetadata = Readonly<{
  replay_id: string;
  orchestration_id: string;
  replay_version: "replay/v1";
  schema_version: "1.0.0";
  replay_sequence: readonly DecisionReplayType[];
  replay_timestamp: string;
  replay_actor: "SYSTEM";
  serialization_version: "decision-replay-canonical-json/v1";
  integrity_algorithm: "SHA-256";
  replay_status: ReplayStatus;
  deterministic_hash: string;
}>;

export type DecisionReplayLineageContract = Readonly<{
  replay_contract_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  compliance_evaluation: ComplianceEvaluation;
  replay_references: readonly ReplayReferenceRecord[];
  lineage: DecisionLineageRecord;
  metadata: ReplayMetadata;
  integrity_hash: string;
  advisory_only: true;
}>;

export type ReplayLineageFailure =
  | "MISSING_REFERENCE"
  | "BROKEN_LINEAGE"
  | "INVALID_PARENT"
  | "INVALID_CHILD"
  | "REPLAY_ORDER_FAILURE"
  | "HASH_MISMATCH"
  | "SERIALIZATION_MISMATCH"
  | "TENANT_VIOLATION"
  | "MISSION_VIOLATION"
  | "VERSION_MISMATCH"
  | "UNKNOWN_REFERENCE"
  | "DUPLICATE_REPLAY_REFERENCE"
  | "CIRCULAR_LINEAGE";

export type ReplayLineageValidationResult = Readonly<{
  validation_status: ReplayValidationStatus;
  replay_contract_id: string;
  failures: readonly ReplayLineageFailure[];
  checks: Readonly<{
    replay_references_exist: boolean;
    replay_references_unique: boolean;
    replay_ordering_valid: boolean;
    referenced_records_exist: boolean;
    replay_versions_supported: boolean;
    integrity_hashes_reproducible: boolean;
    tenant_ownership_preserved: boolean;
    mission_ownership_preserved: boolean;
    lineage_complete: boolean;
    lineage_acyclic: boolean;
  }>;
}>;

export type HistoricalReconstructionResult = Readonly<{
  replay_contract_id: string;
  reconstruction_valid: boolean;
  reconstructed_sequence: readonly DecisionReplayType[];
  reconstructed_record_ids: readonly string[];
  reconstructed_lineage_id: string;
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly ReplayLineageFailure[];
}>;

export type ReplayLineageInput = Readonly<{
  compliance_evaluation?: ComplianceEvaluation;
  parent_decision_id?: string;
  child_decision_ids?: readonly string[];
  scenario?: "BASELINE" | "MISSING_REFERENCE" | "DUPLICATE_REFERENCE" | "ORDER_FAILURE" | "UNSUPPORTED_VERSION" | "UNKNOWN_REFERENCE" | "BROKEN_LINEAGE" | "INVALID_PARENT" | "INVALID_CHILD" | "CIRCULAR_LINEAGE" | "TENANT_VIOLATION" | "MISSION_VIOLATION" | "HASH_MISMATCH" | "SERIALIZATION_MISMATCH";
}>;

export type ReplayLineageObservability = Readonly<{
  replay_generation_count: number;
  replay_validation_failures: number;
  lineage_graph_size: number;
  replay_latency_ms: number;
  reconstruction_latency_ms: number;
  orphaned_lineage_count: number;
  replay_version_distribution: Readonly<Record<string, number>>;
  integrity_mismatches: number;
  replay_ordering_violations: number;
  historical_reconstruction_success_rate: number;
}>;
