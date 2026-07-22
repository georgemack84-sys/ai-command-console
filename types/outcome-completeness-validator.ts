import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeEvidenceRegistryResult } from "@/types/outcome-evidence-registry";

export type OutcomeCompletenessLifecycleState = "RECEIVED" | "STRUCTURAL_VALIDATION" | "REFERENCE_VALIDATION" | "COMPLETENESS_VALIDATION" | "QUALITY_ASSESSMENT" | "CERTIFIED";

export type OutcomeCompletenessValidationState =
  | "VALID"
  | "INVALID"
  | "INCOMPLETE"
  | "INSUFFICIENT_EVIDENCE"
  | "REPLAY_INCOMPLETE"
  | "GOVERNANCE_INCOMPLETE"
  | "OPERATOR_INCOMPLETE"
  | "MISSION_INCOMPLETE";

export type OutcomeCompletenessCheck =
  | "STRUCTURAL_METADATA"
  | "SCHEMA_VERSION"
  | "DECISION_LINKAGE"
  | "EVIDENCE_PRESENCE"
  | "OPERATOR_REFERENCES"
  | "GOVERNANCE_REFERENCES"
  | "REPLAY_REFERENCES"
  | "MISSION_LINKAGE"
  | "INTEGRITY_METADATA"
  | "MISSING_DATA_DETECTION"
  | "DETERMINISTIC_VALIDATION"
  | "TENANT_ISOLATION"
  | "CONSTITUTIONAL_GOVERNANCE";

export type OutcomeCompletenessFailure =
  | "INCOMPLETE_OBSERVATION_ACCEPTED"
  | "MISSING_EVIDENCE_ACCEPTED_WITHOUT_INSUFFICIENT_EVIDENCE"
  | "MISSING_REPLAY_REFERENCES_ACCEPTED"
  | "MISSING_OPERATOR_REFERENCES_ACCEPTED"
  | "MISSING_GOVERNANCE_REFERENCES_ACCEPTED"
  | "MISSING_MISSION_LINKAGE_ACCEPTED"
  | "MISSING_DECISION_LINKAGE_ACCEPTED"
  | "MISSING_SCHEMA_VERSION_ACCEPTED"
  | "MISSING_INTEGRITY_HASH_ACCEPTED"
  | "ORPHAN_OUTCOME_OBSERVATION_ACCEPTED"
  | "VALIDATION_RESULTS_NONDETERMINISTIC"
  | "COMPLETENESS_RULES_BYPASSED"
  | "REPLAY_RECONSTRUCTION_DIFFERS_FROM_VALIDATION"
  | "INTEGRITY_VERIFICATION_OMITTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "INFERRED_REFERENCE_ACCEPTED"
  | "OBSERVATION_MUTATED_DURING_VALIDATION"
  | "EVIDENCE_REGISTRY_NOT_VALIDATED"
  | "CONSTITUTIONAL_GOVERNANCE_BYPASSED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_COMPLETENESS_VALIDATION_BEHAVIOR";

export type OutcomeCompletenessRuleResult = Readonly<{
  rule_id: string;
  validation_area: "STRUCTURAL" | "RELATIONSHIP" | "EVIDENCE" | "REPLAY" | "INTEGRITY";
  required: true;
  present: boolean;
  validation_state: OutcomeCompletenessValidationState;
  failure_result: OutcomeValidationState | "INSUFFICIENT_EVIDENCE";
  integrity_hash: string;
}>;

export type OutcomeMissingDataReport = Readonly<{
  detector_id: string;
  missing_identifiers: readonly string[];
  missing_evidence: readonly string[];
  missing_operator_refs: readonly string[];
  missing_governance_refs: readonly string[];
  missing_replay_metadata: readonly string[];
  missing_mission_refs: readonly string[];
  missing_integrity_metadata: readonly string[];
  orphan_refs: readonly string[];
  inferred_refs: readonly string[];
  repair_attempted: false;
  integrity_hash: string;
}>;

export type OutcomeCompletenessValidation = Readonly<{
  validation_id: string;
  validation_status: OutcomeCompletenessValidationState;
  structural_complete: boolean;
  decision_linkage_valid: boolean;
  evidence_complete: boolean;
  operator_references_complete: boolean;
  governance_references_complete: boolean;
  replay_references_complete: boolean;
  mission_linkage_valid: boolean;
  integrity_metadata_valid: boolean;
  deterministic_validation: boolean;
  replay_reconstruction_identical: boolean;
  tenant_isolated: boolean;
  observation_immutable: boolean;
  constitutional_governance_enforced: boolean;
  failures: readonly OutcomeCompletenessFailure[];
  integrity_hash: string;
}>;

export type OutcomeQualityReport = Readonly<{
  report_id: string;
  validation_status: OutcomeCompletenessValidationState;
  completeness_score: number;
  completeness_label: "100% Complete" | "95% Complete" | "80% Complete" | "Incomplete";
  missing_components: readonly string[];
  decision_validation: OutcomeValidationState;
  evidence_validation: OutcomeValidationState | "INSUFFICIENT_EVIDENCE";
  operator_validation: OutcomeValidationState;
  governance_validation: OutcomeValidationState;
  replay_validation: OutcomeValidationState;
  mission_validation: OutcomeValidationState;
  integrity_validation: OutcomeValidationState;
  final_certification_recommendation: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeCompletenessReplayReport = Readonly<{
  replay_report_id: string;
  validation_hash: string;
  quality_hash: string;
  missing_data_hash: string;
  rule_hashes: readonly string[];
  replay_reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  deterministic_ordering: boolean;
  integrity_hash: string;
}>;

export type OutcomeCompletenessMetrics = Readonly<{
  metrics_id: string;
  outcome_records_validated: number;
  validation_success_rate: number;
  completeness_score_distribution: readonly number[];
  missing_evidence_occurrences: number;
  missing_replay_occurrences: number;
  missing_operator_references: number;
  missing_governance_references: number;
  missing_mission_references: number;
  validation_latency_ms: number;
  replay_validation_success_rate: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeCompletenessAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeCompletenessCheck[];
  completeness_engine_operational: boolean;
  validation_rule_engine_operational: boolean;
  missing_data_detector_operational: boolean;
  quality_report_deterministic: boolean;
  validation_decision_engine_operational: boolean;
  outcome_observation_ledger_gate_enforced: boolean;
  metrics_advisory_only: boolean;
  observation_remained_immutable: boolean;
  failure_analysis: readonly OutcomeCompletenessFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeCompletenessValidatorInput = Readonly<{
  evidence_registry?: OutcomeEvidenceRegistryResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "MISSING_DECISION"
    | "MISSING_DECISION_PACKAGE"
    | "MISSING_EVIDENCE"
    | "MISSING_OPERATOR"
    | "MISSING_GOVERNANCE"
    | "MISSING_REPLAY"
    | "MISSING_MISSION"
    | "MISSING_SCHEMA_VERSION"
    | "MISSING_INTEGRITY_HASH"
    | "ORPHAN_OBSERVATION"
    | "NONDETERMINISTIC_VALIDATION"
    | "RULE_BYPASS"
    | "REPLAY_MISMATCH"
    | "INTEGRITY_OMITTED"
    | "TENANT_VIOLATION"
    | "INFERRED_REFERENCE"
    | "OBSERVATION_MUTATED"
    | "INVALID_EVIDENCE_REGISTRY"
    | "CONSTITUTIONAL_BYPASS"
    | "FAIL_OPEN";
}>;

export type OutcomeCompletenessValidatorResult = Readonly<{
  outcome_completeness_validator_version: "outcome-completeness-validator/v1";
  evidence_registry: OutcomeEvidenceRegistryResult;
  rule_results: readonly OutcomeCompletenessRuleResult[];
  missing_data_report: OutcomeMissingDataReport;
  validation: OutcomeCompletenessValidation;
  quality_report: OutcomeQualityReport;
  replay_report: OutcomeCompletenessReplayReport;
  metrics: OutcomeCompletenessMetrics;
  audit_report: OutcomeCompletenessAuditReport;
  lifecycle: readonly OutcomeCompletenessLifecycleState[];
  deterministic: true;
  replayable: true;
  completeness_only: true;
  permits_correctness_judgment: false;
  modifies_observation: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeCompletenessValidatorFoundation = Readonly<{
  outcome_completeness_validator_version: "outcome-completeness-validator/v1";
  checks: readonly OutcomeCompletenessCheck[];
  lifecycle: readonly OutcomeCompletenessLifecycleState[];
  result: OutcomeCompletenessValidatorResult;
}>;
