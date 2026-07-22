import type { FoundationSchemaCertificationResult } from "@/types/decision-foundation-schema-certification";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OrchestrationDeterminismStage =
  | "INTAKE"
  | "NORMALIZATION"
  | "CONTEXT_BUILDING"
  | "DEPENDENCY_GRAPH"
  | "CONFLICT_ARBITRATION"
  | "PRIORITY_CALCULATION"
  | "DECISION_PACKAGE"
  | "REPLAY_VALIDATION";

export type OrchestrationDeterminismCheck =
  | "INPUT_EQUIVALENCE"
  | "PROCESSING_EQUIVALENCE"
  | "OUTPUT_EQUIVALENCE"
  | "ORDERING_EQUIVALENCE"
  | "FINGERPRINT_EQUIVALENCE"
  | "REPLAY_EQUIVALENCE"
  | "INTEGRITY_EQUIVALENCE";

export type DeterminismCertificationState = "PASS" | "FAIL";
export type OrchestrationDifferenceClassification = "NONE" | "EXPECTED_VERSION_CONTROLLED" | "CRITICAL" | "CERTIFICATION_FAILURE";

export type DeterministicOrchestrationCertificationFailure =
  | "FOUNDATION_CERTIFICATION_INVALID"
  | "NONDETERMINISTIC_INTAKE"
  | "NONDETERMINISTIC_NORMALIZATION"
  | "NONDETERMINISTIC_CONTEXT_BUILDING"
  | "DEPENDENCY_GRAPH_VARIATION"
  | "GRAPH_ORDERING_VARIATION"
  | "CONFLICT_ARBITRATION_INCONSISTENCY"
  | "PRIORITY_SCORE_VARIATION"
  | "TIE_BREAKING_INCONSISTENCY"
  | "DECISION_PACKAGE_VARIATION"
  | "REPLAY_DIVERGENCE"
  | "OUTPUT_MISMATCH"
  | "FINGERPRINT_MISMATCH"
  | "INTEGRITY_HASH_MISMATCH"
  | "HIDDEN_ORCHESTRATION_PATH"
  | "EVIDENCE_INCOMPLETE"
  | "FAIL_OPEN_PROCESSING"
  | "TENANT_DEPENDENT_OUTPUT_VARIATION"
  | "AUTHORIZATION_FAILURE"
  | "EXECUTION_AUTHORITY_GRANTED";

export type OrchestrationExecutionFingerprint = Readonly<{
  fingerprint_id: string;
  tenant_id: string;
  mission_id: string;
  input_fingerprint: string;
  context_fingerprint: string;
  dependency_fingerprint: string;
  conflict_fingerprint: string;
  priority_fingerprint: string;
  governance_fingerprint: string;
  package_fingerprint: string;
  replay_fingerprint: string;
  final_orchestration_fingerprint: string;
  integrity_hash: string;
}>;

export type OrchestrationExecutionRecord = Readonly<{
  execution_id: string;
  tenant_id: string;
  mission_id: string;
  candidate_order: readonly string[];
  normalized_record_refs: readonly string[];
  context_refs: readonly string[];
  graph_node_order: readonly string[];
  graph_edge_order: readonly string[];
  conflict_resolution_order: readonly string[];
  priority_order: readonly string[];
  tie_breaking_order: readonly string[];
  decision_package_refs: readonly string[];
  replay_refs: readonly string[];
  stage_order: readonly OrchestrationDeterminismStage[];
  output_hash: string;
  fingerprint: OrchestrationExecutionFingerprint;
  integrity_hash: string;
}>;

export type OrchestrationComparisonReport = Readonly<{
  comparison_id: string;
  tenant_id: string;
  mission_id: string;
  baseline_execution_id: string;
  comparison_execution_id: string;
  input_match: boolean;
  processing_match: boolean;
  output_match: boolean;
  ordering_match: boolean;
  fingerprint_match: boolean;
  replay_match: boolean;
  integrity_match: boolean;
  difference_classification: OrchestrationDifferenceClassification;
  differences: readonly DeterministicOrchestrationCertificationFailure[];
  integrity_hash: string;
}>;

export type OutputEquivalenceValidation = Readonly<{
  validation_id: string;
  tenant_id: string;
  mission_id: string;
  record_counts_match: boolean;
  ordering_match: boolean;
  values_match: boolean;
  references_match: boolean;
  explanations_match: boolean;
  recommendations_match: boolean;
  alternatives_match: boolean;
  lineage_match: boolean;
  replay_refs_match: boolean;
  validation_state: DeterminismCertificationState;
  integrity_hash: string;
}>;

export type OrderingValidationReport = Readonly<{
  ordering_report_id: string;
  tenant_id: string;
  mission_id: string;
  intake_ordering_deterministic: boolean;
  dependency_ordering_deterministic: boolean;
  priority_ordering_deterministic: boolean;
  arbitration_ordering_deterministic: boolean;
  package_ordering_deterministic: boolean;
  replay_ordering_deterministic: boolean;
  ledger_ordering_deterministic: boolean;
  stage_order: readonly OrchestrationDeterminismStage[];
  validation_state: DeterminismCertificationState;
  integrity_hash: string;
}>;

export type DeterminismEvidencePackage = Readonly<{
  evidence_package_id: string;
  tenant_id: string;
  mission_id: string;
  execution_evidence_refs: readonly string[];
  comparison_evidence_refs: readonly string[];
  fingerprint_evidence_refs: readonly string[];
  replay_evidence_refs: readonly string[];
  integrity_evidence_refs: readonly string[];
  complete: boolean;
  immutable: boolean;
  integrity_hash: string;
}>;

export type DeterminismCertificationReport = Readonly<{
  report_id: string;
  tenant_id: string;
  mission_id: string;
  executive_summary: string;
  certified_stages: readonly OrchestrationDeterminismStage[];
  certified_checks: readonly OrchestrationDeterminismCheck[];
  test_environment: string;
  execution_configuration: string;
  input_comparison: DeterminismCertificationState;
  processing_comparison: DeterminismCertificationState;
  output_comparison: DeterminismCertificationState;
  ordering_verification: DeterminismCertificationState;
  replay_verification: DeterminismCertificationState;
  fingerprint_verification: DeterminismCertificationState;
  integrity_verification: DeterminismCertificationState;
  failure_analysis: readonly DeterministicOrchestrationCertificationFailure[];
  certification_decision: DeterminismCertificationState;
  production_readiness: "READY" | "BLOCKED";
  integrity_hash: string;
}>;

export type DeterminismCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  tenant_id: string;
  mission_id: string;
  event_type: "DETERMINISM_TESTED" | "EXECUTIONS_COMPARED" | "FINGERPRINTS_VERIFIED" | "OUTPUT_EQUIVALENCE_VERIFIED" | "ORDERING_VERIFIED" | "DETERMINISM_CERTIFIED" | "DETERMINISM_BLOCKED";
  scope_ref: string;
  evidence_ref: string;
  certification_state: DeterminismCertificationState;
  replay_refs: readonly string[];
  event_timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type DeterministicOrchestrationCertificationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  foundation_certified: boolean;
  intake_deterministic: boolean;
  normalization_deterministic: boolean;
  context_deterministic: boolean;
  dependency_graph_deterministic: boolean;
  graph_ordering_deterministic: boolean;
  conflict_arbitration_deterministic: boolean;
  priority_scoring_deterministic: boolean;
  tie_breaking_deterministic: boolean;
  package_generation_deterministic: boolean;
  replay_deterministic: boolean;
  output_equivalent: boolean;
  fingerprints_reproducible: boolean;
  integrity_verified: boolean;
  hidden_paths_absent: boolean;
  evidence_complete: boolean;
  tenant_safe: boolean;
  fail_closed: boolean;
  authorization_valid: boolean;
  advisory_only: boolean;
  failures: readonly DeterministicOrchestrationCertificationFailure[];
  integrity_hash: string;
}>;

export type DeterministicOrchestrationCertificationInput = Readonly<{
  foundation_certification?: FoundationSchemaCertificationResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "FOUNDATION_INVALID"
    | "INTAKE_VARIATION"
    | "NORMALIZATION_VARIATION"
    | "CONTEXT_VARIATION"
    | "GRAPH_VARIATION"
    | "GRAPH_ORDER_VARIATION"
    | "ARBITRATION_VARIATION"
    | "PRIORITY_VARIATION"
    | "TIE_BREAKING_VARIATION"
    | "PACKAGE_VARIATION"
    | "REPLAY_DIVERGENCE"
    | "OUTPUT_MISMATCH"
    | "FINGERPRINT_MISMATCH"
    | "HASH_MISMATCH"
    | "HIDDEN_PATH"
    | "EVIDENCE_INCOMPLETE"
    | "FAIL_OPEN"
    | "TENANT_VARIATION"
    | "UNAUTHORIZED_ROLE"
    | "EXECUTION_AUTHORITY";
}>;

export type DeterministicOrchestrationCertificationResult = Readonly<{
  certification_version: "decision-deterministic-orchestration-certification/v1";
  foundation_certification: FoundationSchemaCertificationResult;
  executions: readonly OrchestrationExecutionRecord[];
  comparison_report: OrchestrationComparisonReport;
  output_equivalence: OutputEquivalenceValidation;
  ordering_report: OrderingValidationReport;
  evidence_package: DeterminismEvidencePackage;
  determinism_report: DeterminismCertificationReport;
  determinism_ledger: readonly DeterminismCertificationLedgerEntry[];
  validation: DeterministicOrchestrationCertificationValidation;
  deterministic: true;
  replayable: true;
  advisory_only: true;
  mutates_orchestrator_state: false;
  execution_authority_granted: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type DeterministicOrchestrationCertificationFoundation = Readonly<{
  certification_version: "decision-deterministic-orchestration-certification/v1";
  stages: readonly OrchestrationDeterminismStage[];
  checks: readonly OrchestrationDeterminismCheck[];
  result: DeterministicOrchestrationCertificationResult;
}>;
