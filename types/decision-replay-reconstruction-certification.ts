import type { DeterministicOrchestrationCertificationResult } from "@/types/decision-deterministic-orchestration-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type ReplayReconstructionStage =
  | "INPUT_REPLAY"
  | "CONTEXT_REPLAY"
  | "DEPENDENCY_REPLAY"
  | "CONFLICT_REPLAY"
  | "PRIORITY_REPLAY"
  | "GOVERNANCE_REPLAY"
  | "OPERATOR_REPLAY"
  | "FINAL_DECISION_REPLAY";

export type ReplayReconstructionCheck =
  | "RECONSTRUCTION_COMPLETENESS"
  | "REPLAY_FIDELITY"
  | "DIVERGENCE_DETECTION"
  | "LINEAGE_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "GOVERNANCE_REPLAY"
  | "OPERATOR_REPLAY"
  | "TENANT_ISOLATION";

export type ReplayCertificationState = "PASS" | "FAIL";
export type ReplayDivergenceSeverity = "NONE" | "INFORMATIONAL" | "MINOR" | "MAJOR" | "CRITICAL";

export type ReplayReconstructionCertificationFailure =
  | "DETERMINISTIC_ORCHESTRATION_CERTIFICATION_INVALID"
  | "REPLAY_MISMATCH"
  | "MISSING_REPLAY_RECORDS"
  | "MISSING_LEDGER_REFERENCES"
  | "INCOMPLETE_RECONSTRUCTION"
  | "CONTEXT_REPLAY_MISMATCH"
  | "DEPENDENCY_GRAPH_MISMATCH"
  | "CONFLICT_REPLAY_MISMATCH"
  | "PRIORITY_REPLAY_MISMATCH"
  | "GOVERNANCE_REPLAY_MISMATCH"
  | "CONSTITUTIONAL_REPLAY_MISMATCH"
  | "AUTHORITY_REPLAY_MISMATCH"
  | "OPERATOR_REPLAY_MISMATCH"
  | "FINAL_RECOMMENDATION_MISMATCH"
  | "DECISION_PACKAGE_MISMATCH"
  | "REPLAY_LINEAGE_BROKEN"
  | "INTEGRITY_HASH_MISMATCH"
  | "MISSING_CERTIFICATION_EVIDENCE"
  | "HIDDEN_REPLAY_LOGIC"
  | "FAIL_OPEN_REPLAY_BEHAVIOR"
  | "UNDETECTED_REPLAY_DIVERGENCE"
  | "CROSS_TENANT_REPLAY_CONTAMINATION"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type ReplayReconstructionSnapshot = Readonly<{
  snapshot_id: string;
  tenant_id: string;
  mission_id: string;
  replay_source: "ORIGINAL" | "RECONSTRUCTED";
  input_refs: readonly string[];
  context_refs: readonly string[];
  dependency_refs: readonly string[];
  conflict_refs: readonly string[];
  priority_refs: readonly string[];
  governance_refs: readonly string[];
  constitutional_refs: readonly string[];
  authority_refs: readonly string[];
  operator_refs: readonly string[];
  final_decision_refs: readonly string[];
  decision_package_refs: readonly string[];
  ledger_refs: readonly string[];
  certification_refs: readonly string[];
  replay_metadata_refs: readonly string[];
  stage_order: readonly ReplayReconstructionStage[];
  reconstruction_hash: string;
  integrity_hash: string;
}>;

export type ReplayDivergenceReport = Readonly<{
  divergence_report_id: string;
  tenant_id: string;
  mission_id: string;
  original_snapshot_id: string;
  replay_snapshot_id: string;
  input_match: boolean;
  context_match: boolean;
  dependency_match: boolean;
  conflict_match: boolean;
  priority_match: boolean;
  governance_match: boolean;
  constitutional_match: boolean;
  authority_match: boolean;
  operator_match: boolean;
  final_decision_match: boolean;
  package_match: boolean;
  ledger_match: boolean;
  severity: ReplayDivergenceSeverity;
  detected: boolean;
  divergences: readonly ReplayReconstructionCertificationFailure[];
  integrity_hash: string;
}>;

export type ReplayLineageValidation = Readonly<{
  lineage_validation_id: string;
  tenant_id: string;
  mission_id: string;
  parent_child_relationships_complete: boolean;
  dependency_lineage_complete: boolean;
  decision_lineage_complete: boolean;
  evidence_lineage_complete: boolean;
  governance_lineage_complete: boolean;
  operator_lineage_complete: boolean;
  certification_lineage_complete: boolean;
  validation_state: ReplayCertificationState;
  integrity_hash: string;
}>;

export type ReplayIntegrityValidation = Readonly<{
  integrity_validation_id: string;
  tenant_id: string;
  mission_id: string;
  replay_hashes_reproduced: boolean;
  immutable_ledger_refs_valid: boolean;
  signatures_valid: boolean;
  lineage_integrity_valid: boolean;
  snapshot_integrity_valid: boolean;
  certification_refs_valid: boolean;
  validation_state: ReplayCertificationState;
  integrity_hash: string;
}>;

export type ReplayCertificationEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  reconstruction_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  divergence_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  lineage_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type ReplayReconstructionReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  replay_scope: readonly ReplayReconstructionStage[];
  certified_checks: readonly ReplayReconstructionCheck[];
  reconstruction_results: ReplayCertificationState;
  replay_test_results: ReplayCertificationState;
  context_reconstruction: ReplayCertificationState;
  dependency_reconstruction: ReplayCertificationState;
  conflict_reconstruction: ReplayCertificationState;
  priority_reconstruction: ReplayCertificationState;
  governance_reconstruction: ReplayCertificationState;
  operator_reconstruction: ReplayCertificationState;
  final_decision_reconstruction: ReplayCertificationState;
  divergence_analysis: ReplayDivergenceSeverity;
  integrity_verification: ReplayCertificationState;
  failure_analysis: readonly ReplayReconstructionCertificationFailure[];
  certification_decision: ReplayCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type ReplayCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "REPLAY_RECONSTRUCTED" | "REPLAY_COMPARED" | "DIVERGENCE_VALIDATED" | "LINEAGE_VALIDATED" | "INTEGRITY_VALIDATED" | "REPLAY_CERTIFIED" | "REPLAY_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: ReplayCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ReplayReconstructionCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  deterministic_certification_valid: boolean;
  replay_reconstructed: boolean;
  replay_records_complete: boolean;
  ledger_references_complete: boolean;
  context_replay_valid: boolean;
  dependency_replay_valid: boolean;
  conflict_replay_valid: boolean;
  priority_replay_valid: boolean;
  governance_replay_valid: boolean;
  constitutional_replay_valid: boolean;
  authority_replay_valid: boolean;
  operator_replay_valid: boolean;
  final_recommendation_replay_valid: boolean;
  decision_package_replay_valid: boolean;
  lineage_complete: boolean;
  integrity_verified: boolean;
  certification_evidence_complete: boolean;
  hidden_replay_logic_absent: boolean;
  divergence_detection_valid: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly ReplayReconstructionCertificationFailure[];
  integrity_hash: string;
}>;

export type ReplayReconstructionCertificationInput = Readonly<{
  deterministic_certification?: DeterministicOrchestrationCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "DETERMINISM_INVALID"
    | "REPLAY_MISMATCH"
    | "MISSING_REPLAY_RECORDS"
    | "MISSING_LEDGER_REFERENCES"
    | "INCOMPLETE_RECONSTRUCTION"
    | "CONTEXT_MISMATCH"
    | "DEPENDENCY_MISMATCH"
    | "CONFLICT_MISMATCH"
    | "PRIORITY_MISMATCH"
    | "GOVERNANCE_MISMATCH"
    | "CONSTITUTIONAL_MISMATCH"
    | "AUTHORITY_MISMATCH"
    | "OPERATOR_MISMATCH"
    | "FINAL_RECOMMENDATION_MISMATCH"
    | "PACKAGE_MISMATCH"
    | "LINEAGE_BROKEN"
    | "HASH_MISMATCH"
    | "MISSING_EVIDENCE"
    | "HIDDEN_REPLAY_LOGIC"
    | "FAIL_OPEN"
    | "UNDETECTED_DIVERGENCE"
    | "CROSS_TENANT"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type ReplayReconstructionCertificationResult = Readonly<{
  certification_version: "decision-replay-reconstruction-certification/v1";
  deterministic_certification: DeterministicOrchestrationCertificationResult;
  original_snapshot: ReplayReconstructionSnapshot;
  replay_snapshot: ReplayReconstructionSnapshot;
  divergence_report: ReplayDivergenceReport;
  lineage_validation: ReplayLineageValidation;
  integrity_validation: ReplayIntegrityValidation;
  evidence_package: ReplayCertificationEvidencePackage;
  reconstruction_report: ReplayReconstructionReport;
  replay_ledger: readonly ReplayCertificationLedgerEntry[];
  validation: ReplayReconstructionCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_replay_records: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type ReplayReconstructionCertificationFoundation = Readonly<{
  certification_version: "decision-replay-reconstruction-certification/v1";
  stages: readonly ReplayReconstructionStage[];
  checks: readonly ReplayReconstructionCheck[];
  result: ReplayReconstructionCertificationResult;
}>;
