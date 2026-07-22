import type {
  DecisionOutcomeIntakeAdapterResult,
  OutcomeIntakeFailure,
} from "@/types/decision-outcome-intake-adapter";
import type {
  OutcomeObservationRecord,
  OutcomeType,
  OutcomeValidationState,
} from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";

export type OutcomeObservationLifecycleState = "RECEIVED" | "NORMALIZED" | "OBSERVED" | "VALIDATED" | "RECORDED" | "REPLAYABLE";

export type OutcomeExecutionStatus = "COMPLETED" | "PARTIALLY_COMPLETED" | "FAILED" | "INTERRUPTED" | "CANCELLED" | "ROLLED_BACK" | "UNKNOWN";
export type OutcomeObservationStatus = "OBSERVED" | "REJECTED" | "DUPLICATE" | "INSUFFICIENT_EVIDENCE";

export type OutcomeObservationCheck =
  | "INTAKE_VALIDATION"
  | "OBSERVATION_BUILDER"
  | "OUTCOME_RESOLUTION"
  | "OBSERVATION_CLASSIFICATION"
  | "STRUCTURAL_VALIDATION"
  | "EVIDENCE_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "CONSISTENCY_CHECK"
  | "INTEGRITY_VALIDATION"
  | "LEDGER_IMMUTABILITY"
  | "TENANT_ISOLATION"
  | "CONSTITUTIONAL_GOVERNANCE";

export type OutcomeObservationFailure =
  | "INTAKE_NOT_VALIDATED"
  | "IDENTICAL_EVIDENCE_PRODUCED_DIVERGENT_OBSERVATION"
  | "INFERRED_OUTCOME_ACCEPTED"
  | "PREDICTIVE_INFORMATION_ACCEPTED"
  | "UNSUPPORTED_OUTCOME_CLASSIFICATION_ACCEPTED"
  | "EVIDENCE_LINEAGE_INCOMPLETE"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "DUPLICATE_OBSERVATION_GENERATED"
  | "NONDETERMINISTIC_SERIALIZATION_DETECTED"
  | "INTEGRITY_HASH_MISMATCH_DETECTED"
  | "OBSERVATION_MUTATED_AFTER_RECORDING"
  | "TENANT_ISOLATION_VIOLATED"
  | "CONSTITUTIONAL_CONSTRAINTS_BYPASSED"
  | "REQUIRED_FIELD_MISSING"
  | "UNAUTHORIZED_MODIFICATION_REJECTED"
  | "ANALYSIS_ATTEMPTED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_OBSERVATION_BEHAVIOR";

export type ObservationBuilderResult = Readonly<{
  builder_id: string;
  intake_id: string;
  outcome_identity_assembled: boolean;
  observation_metadata_assembled: boolean;
  decision_refs_assembled: boolean;
  mission_refs_assembled: boolean;
  operator_refs_assembled: boolean;
  governance_refs_assembled: boolean;
  evidence_refs_assembled: boolean;
  replay_metadata_assembled: boolean;
  source_fidelity_preserved: boolean;
  inferred_values_absent: boolean;
  observation_record: OutcomeObservationRecord;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeResolutionResult = Readonly<{
  resolver_id: string;
  outcome_type: OutcomeType;
  observation_complete: boolean;
  execution_status: OutcomeExecutionStatus;
  rollback_state: string;
  observation_status: OutcomeObservationStatus;
  classification_basis_refs: readonly string[];
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeObservationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED";
  structural_valid: boolean;
  evidence_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  constitutional_governance_preserved: boolean;
  immutable_after_recording: boolean;
  only_observed_facts: boolean;
  failures: readonly OutcomeObservationFailure[];
  intake_failures: readonly OutcomeIntakeFailure[];
  integrity_hash: string;
}>;

export type ObservationConsistencyCheck = Readonly<{
  consistency_id: string;
  identical_evidence: boolean;
  identical_references: boolean;
  identical_classification: boolean;
  identical_serialization: boolean;
  identical_replay: boolean;
  consistency_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type ObservationReplayMetadata = Readonly<{
  replay_metadata_id: string;
  decision_refs: readonly string[];
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  operator_refs: readonly string[];
  intake_refs: readonly string[];
  ledger_refs: readonly string[];
  observation_sequence: readonly string[];
  reconstruction_hash: string;
  integrity_hash: string;
}>;

export type OutcomeObservationLedgerRecord = Readonly<{
  ledger_id: string;
  outcome_id: string;
  tenant_id: string;
  mission_id: string;
  decision_id: string;
  outcome_type: OutcomeType;
  lifecycle_state: OutcomeObservationLifecycleState;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  observation_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type OutcomeObservationMetrics = Readonly<{
  metrics_id: string;
  observations_created: number;
  observations_rejected: number;
  classifications_by_type: readonly OutcomeType[];
  insufficient_evidence_occurrences: number;
  validation_failures: number;
  replay_success_rate: number;
  observation_generation_latency_ms: number;
  duplicate_observation_attempts: number;
  integrity_verification_failures: number;
  governance_validation_failures: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type OutcomeObservationAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly OutcomeObservationCheck[];
  observed_results_captured: boolean;
  operator_decisions_captured: boolean;
  governance_effects_captured: boolean;
  execution_status_captured: boolean;
  mission_changes_captured: boolean;
  actual_impacts_captured: boolean;
  evidence_lineage_preserved: boolean;
  replay_metadata_complete: boolean;
  deterministic_observation_verified: boolean;
  immutable_ledger_verified: boolean;
  analysis_logic_absent: boolean;
  failure_analysis: readonly OutcomeObservationFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type OutcomeObservationEngineInput = Readonly<{
  intake_adapter?: DecisionOutcomeIntakeAdapterResult;
  role?: VisibilityRole;
  outcome_type?: OutcomeType;
  scenario?:
    | "BASELINE"
    | "PARTIAL_SUCCESS"
    | "FAILED_OUTCOME"
    | "OVERRIDE"
    | "ESCALATION"
    | "ROLLBACK"
    | "UNKNOWN"
    | "INSUFFICIENT_EVIDENCE"
    | "INVALID_INTAKE"
    | "DIVERGENT_OBSERVATION"
    | "INFERRED_OUTCOME"
    | "PREDICTIVE_INFORMATION"
    | "UNSUPPORTED_CLASSIFICATION"
    | "INCOMPLETE_EVIDENCE"
    | "MISSING_GOVERNANCE"
    | "MISSING_REPLAY"
    | "DUPLICATE_OBSERVATION"
    | "NONDETERMINISTIC_SERIALIZATION"
    | "HASH_MISMATCH"
    | "MUTATED_AFTER_RECORDING"
    | "TENANT_VIOLATION"
    | "CONSTITUTIONAL_BYPASS"
    | "MISSING_REQUIRED_FIELD"
    | "UNAUTHORIZED_MODIFICATION"
    | "ANALYSIS_ATTEMPTED"
    | "FAIL_OPEN";
}>;

export type OutcomeObservationEngineResult = Readonly<{
  observation_engine_version: "outcome-observation-engine/v1";
  intake_adapter: DecisionOutcomeIntakeAdapterResult;
  builder: ObservationBuilderResult;
  resolver: OutcomeResolutionResult;
  consistency_check: ObservationConsistencyCheck;
  replay_metadata: ObservationReplayMetadata;
  validation: OutcomeObservationValidation;
  observation_record: OutcomeObservationRecord;
  observation_ledger: readonly OutcomeObservationLedgerRecord[];
  metrics: OutcomeObservationMetrics;
  audit_report: OutcomeObservationAuditReport;
  lifecycle: readonly OutcomeObservationLifecycleState[];
  deterministic: true;
  replayable: true;
  observational_only: true;
  permits_analysis: false;
  permits_prediction: false;
  permits_recommendation: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type OutcomeObservationEngineFoundation = Readonly<{
  observation_engine_version: "outcome-observation-engine/v1";
  checks: readonly OutcomeObservationCheck[];
  lifecycle: readonly OutcomeObservationLifecycleState[];
  result: OutcomeObservationEngineResult;
}>;
