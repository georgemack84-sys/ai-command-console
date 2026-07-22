import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeIntegrityValidatorResult } from "@/types/outcome-integrity-validator";

export type ReplayBindingState = "PENDING" | "BOUND" | "VALIDATED" | "CERTIFIED" | "FAILED";

export type ReplayReferenceType =
  | "OUTCOME_IDENTITY"
  | "DECISION_RECORD"
  | "RECOMMENDATION"
  | "DECISION_PACKAGE"
  | "OPERATOR_WORKFLOW"
  | "EXECUTION_HISTORY"
  | "OBSERVED_OUTCOME"
  | "NORMALIZED_OUTCOME"
  | "TRUTH_LEDGER_BINDING"
  | "EVIDENCE_REFERENCE"
  | "HISTORICAL_LINEAGE"
  | "REPLAY_METADATA"
  | "INTEGRITY_VERIFICATION";

export type ReplayDependencyType = "EXECUTION" | "GOVERNANCE" | "EVIDENCE" | "OPERATOR_WORKFLOW" | "TRUTH_LEDGER" | "LINEAGE" | "IDENTITY" | "NORMALIZATION";

export type OutcomeReplayCheck =
  | "INTEGRITY_CERTIFICATION"
  | "REPLAY_DEPENDENCY_RESOLUTION"
  | "REPLAY_BINDING"
  | "REPLAY_REFERENCE_REGISTRY"
  | "REPLAY_DEPENDENCY_MAPPING"
  | "REPLAY_VALIDATION"
  | "REPLAY_ORDERING"
  | "TENANT_ISOLATION"
  | "IMMUTABLE_REPLAY_PACKAGE"
  | "CRYPTOGRAPHIC_VERIFICATION";

export type OutcomeReplayFailure =
  | "INTEGRITY_NOT_CERTIFIED"
  | "MISSING_REPLAY_DEPENDENCY_REJECTED"
  | "REPLAY_DIVERGENCE_REJECTED"
  | "HASH_MISMATCH_REJECTED"
  | "LINEAGE_MISMATCH_REJECTED"
  | "TRUTH_LEDGER_MISMATCH_REJECTED"
  | "EVIDENCE_MISMATCH_REJECTED"
  | "CROSS_TENANT_REPLAY_REJECTED"
  | "REPLAY_ORDERING_NONDETERMINISTIC"
  | "REPLAY_PACKAGE_MUTATION_REJECTED"
  | "REPLAY_REGISTRY_APPEND_ONLY_VIOLATED"
  | "DEPENDENCY_GRAPH_INCOMPLETE"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_REPLAY_BINDING_BEHAVIOR";

export type OutcomeReplayBinding = Readonly<{
  replay_binding_id: string;
  normalized_outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  replay_package_id: string;
  outcome_identity_ref: string;
  normalization_version: string;
  replay_dependency_refs: readonly string[];
  replay_reference_refs: readonly string[];
  ledger_binding_refs: readonly string[];
  evidence_refs: readonly string[];
  lineage_graph_ref: string;
  replay_validation_ref: string;
  replay_version: "10.2.6";
  replay_state: ReplayBindingState;
  integrity_hash: string;
}>;

export type ReplayReferenceRecord = Readonly<{
  replay_reference_id: string;
  replay_package_id: string;
  reference_type: ReplayReferenceType;
  source_record_id: string;
  relationship: "reconstructs" | "orders" | "verifies" | "depends_on";
  replay_order: number;
  replay_version: "10.2.6";
  integrity_hash: string;
}>;

export type ReplayDependencyRecord = Readonly<{
  dependency_id: string;
  replay_package_id: string;
  dependency_type: ReplayDependencyType;
  parent_reference: string;
  child_reference: string;
  dependency_sequence: number;
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type ReplayValidationResult = Readonly<{
  validation_id: string;
  replay_package_id: string;
  validation_status: ReplayBindingState;
  reconstructed_identity: string;
  reconstructed_hash: string;
  divergence_detected: boolean;
  divergence_summary: string;
  replay_timestamp: string;
  failures: readonly OutcomeReplayFailure[];
  integrity_hash: string;
}>;

export type ReplayReferenceRegistryRecord = Readonly<{
  registry_id: string;
  replay_package_id: string;
  normalized_outcome_id: string;
  tenant_id: string;
  replay_reference_ids: readonly string[];
  dependency_ids: readonly string[];
  replay_version: "10.2.6";
  ledger_sequence: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ReplayPackage = Readonly<{
  replay_package_id: string;
  normalized_outcome_id: string;
  outcome_identity_ref: string;
  decision_record_ref: string;
  recommendation_ref: string;
  decision_package_ref: string;
  operator_workflow_ref: string;
  execution_history_ref: string;
  observed_outcome_ref: string;
  truth_ledger_binding_refs: readonly string[];
  evidence_refs: readonly string[];
  historical_lineage_ref: string;
  replay_metadata_ref: string;
  integrity_verification_refs: readonly string[];
  immutable: true;
  integrity_hash: string;
}>;

export type ReplayApiSurface = Readonly<{
  api_id: string;
  create_replay_binding: "POST /replay/bind";
  validate_replay: "POST /replay/validate";
  retrieve_replay_package: "GET /replay/{normalized_outcome_id}";
  retrieve_replay_dependencies: "GET /replay/{normalized_outcome_id}/dependencies";
  compare_replay_results: "POST /replay/compare";
  executes_replay: false;
  update_supported: false;
  delete_supported: false;
  integrity_hash: string;
}>;

export type ReplayMetrics = Readonly<{
  metrics_id: string;
  replay_packages_created: number;
  replay_validation_success_rate: number;
  replay_divergence_rate: number;
  dependency_resolution_failures: number;
  hash_mismatches: number;
  replay_latency_ms: number;
  registry_growth: number;
  lineage_mismatches: number;
  tenant_isolation_violations: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ReplayAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeReplayCheck[];
  replay_binder_operational: boolean;
  replay_reference_registry_operational: boolean;
  replay_dependency_mapper_operational: boolean;
  replay_validation_engine_operational: boolean;
  dependency_graph_complete: boolean;
  replay_reconstruction_identical: boolean;
  immutable_replay_package_verified: boolean;
  cryptographic_verification_succeeded: boolean;
  failure_analysis: readonly OutcomeReplayFailure[];
  certification_decision: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type OutcomeReplayBinderInput = Readonly<{
  integrity_validator?: OutcomeIntegrityValidatorResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MISSING_DEPENDENCY"
    | "REPLAY_DIVERGENCE"
    | "HASH_MISMATCH"
    | "LINEAGE_MISMATCH"
    | "TRUTH_LEDGER_MISMATCH"
    | "EVIDENCE_MISMATCH"
    | "CROSS_TENANT_REPLAY"
    | "NONDETERMINISTIC_ORDERING"
    | "PACKAGE_MUTATION"
    | "APPEND_ONLY_VIOLATION"
    | "INCOMPLETE_DEPENDENCY_GRAPH"
    | "INVALID_INTEGRITY"
    | "FAIL_OPEN";
}>;

export type OutcomeReplayBinderResult = Readonly<{
  outcome_replay_binder_version: "outcome-replay-binder/v1";
  integrity_validator: OutcomeIntegrityValidatorResult;
  api_surface: ReplayApiSurface;
  replay_package: ReplayPackage;
  replay_binding: OutcomeReplayBinding;
  replay_references: readonly ReplayReferenceRecord[];
  replay_dependencies: readonly ReplayDependencyRecord[];
  validation: ReplayValidationResult;
  reference_registry: readonly ReplayReferenceRegistryRecord[];
  metrics: ReplayMetrics;
  audit_report: ReplayAuditReport;
  deterministic: true;
  replayable: true;
  binding_only: true;
  executes_replay: false;
  immutable_replay_package: true;
  modifies_outcome_records: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeReplayBinderFoundation = Readonly<{
  outcome_replay_binder_version: "outcome-replay-binder/v1";
  checks: readonly OutcomeReplayCheck[];
  api_surface: ReplayApiSurface;
  result: OutcomeReplayBinderResult;
}>;
