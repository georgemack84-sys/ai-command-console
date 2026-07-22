import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { MissionImpactRecorderResult } from "@/types/mission-impact-recorder";

export type ActualizationLifecycleState = "PREDICTION_LINKED" | "OBSERVATION_CAPTURED" | "ACTUALIZATION_CLASSIFIED" | "VALIDATED" | "RECORDED" | "REPLAYABLE";

export type RiskActualizationState = "MATERIALIZED" | "AVOIDED" | "UNDERESTIMATED" | "OVERESTIMATED" | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";
export type ConfidenceActualizationState = "ACCURATE" | "OPTIMISTIC" | "PESSIMISTIC" | "INVALID" | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";
export type ForecastActualizationState = "CORRECT" | "PARTIALLY_CORRECT" | "INCORRECT" | "UNKNOWN" | "INSUFFICIENT_EVIDENCE";

export type ActualizationCheck =
  | "MISSION_IMPACT_VALIDATION"
  | "PREDICTION_LINKAGE"
  | "RISK_ACTUALIZATION"
  | "CONFIDENCE_ACTUALIZATION"
  | "FORECAST_ACTUALIZATION"
  | "STRUCTURAL_VALIDATION"
  | "EVIDENCE_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "HISTORICAL_IMMUTABILITY"
  | "TENANT_ISOLATION"
  | "CONSTITUTIONAL_GOVERNANCE";

export type ActualizationFailure =
  | "MISSION_IMPACT_NOT_VALIDATED"
  | "PREDICTION_CANNOT_BE_LINKED"
  | "EVIDENCE_MISSING"
  | "INFERRED_COMPARISON_ACCEPTED"
  | "ORIGINAL_PREDICTION_MODIFIED"
  | "HISTORICAL_PREDICTION_CHANGED"
  | "DUPLICATE_ACTUALIZATION_CREATED"
  | "REPLAY_RECONSTRUCTION_DIFFERS"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_VIOLATED"
  | "NONDETERMINISTIC_CLASSIFICATION_DETECTED"
  | "RECALIBRATION_ATTEMPTED"
  | "FORECAST_REFERENCE_MISSING"
  | "CONFIDENCE_REFERENCE_MISSING"
  | "RISK_REFERENCE_MISSING"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_ACTUALIZATION_BEHAVIOR";

export type PredictionLinkage = Readonly<{
  linkage_id: string;
  decision_package_id: string;
  mission_id: string;
  outcome_id: string;
  original_risk_refs: readonly string[];
  original_confidence_refs: readonly string[];
  original_forecast_refs: readonly string[];
  observed_outcome_refs: readonly string[];
  prediction_immutable: boolean;
  historical_records_unchanged: boolean;
  integrity_hash: string;
}>;

export type ActualizationClassification = Readonly<{
  classification_id: string;
  risk_actualization: RiskActualizationState;
  confidence_actualization: ConfidenceActualizationState;
  forecast_actualization: ForecastActualizationState;
  classification_basis_refs: readonly string[];
  deterministic_classification: boolean;
  inferred_comparisons_absent: boolean;
  recalibration_absent: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type ActualizationRecord = Readonly<{
  actualization_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  decision_id: string;
  decision_package_id: string;
  prediction_timestamp: string;
  observation_timestamp: string;
  original_risk_refs: readonly string[];
  original_confidence_refs: readonly string[];
  original_forecast_refs: readonly string[];
  observed_outcome_refs: readonly string[];
  risk_actualization: RiskActualizationState;
  confidence_actualization: ConfidenceActualizationState;
  forecast_actualization: ForecastActualizationState;
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  original_prediction_immutable: true;
  historical_decision_records_unchanged: true;
  integrity_hash: string;
}>;

export type ActualizationValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED" | "INSUFFICIENT_EVIDENCE";
  structural_valid: boolean;
  prediction_valid: boolean;
  evidence_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  deterministic: boolean;
  tenant_isolated: boolean;
  original_predictions_immutable: boolean;
  historical_records_unchanged: boolean;
  recalibration_absent: boolean;
  failures: readonly ActualizationFailure[];
  integrity_hash: string;
}>;

export type ActualizationReplayReport = Readonly<{
  replay_report_id: string;
  linkage_hash: string;
  classification_hash: string;
  record_hash: string;
  reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  deterministic_serialization: boolean;
  historical_compatibility_preserved: boolean;
  integrity_hash: string;
}>;

export type ActualizationLedgerRecord = Readonly<{
  ledger_id: string;
  actualization_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  lifecycle_state: ActualizationLifecycleState;
  risk_actualization: RiskActualizationState;
  confidence_actualization: ConfidenceActualizationState;
  forecast_actualization: ForecastActualizationState;
  actualization_hash: string;
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type ActualizationMetrics = Readonly<{
  metrics_id: string;
  actualizations_recorded: number;
  risk_actualization_distribution: readonly RiskActualizationState[];
  confidence_accuracy_distribution: readonly ConfidenceActualizationState[];
  forecast_accuracy_distribution: readonly ForecastActualizationState[];
  prediction_linkage_success_rate: number;
  insufficient_evidence_occurrences: number;
  validation_failures: number;
  replay_reconstruction_success_rate: number;
  processing_latency_ms: number;
  integrity_verification_failures: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type ActualizationAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly ActualizationCheck[];
  risk_recorder_operational: boolean;
  confidence_recorder_operational: boolean;
  forecast_recorder_operational: boolean;
  prediction_linkage_operational: boolean;
  classification_engine_operational: boolean;
  replay_generator_operational: boolean;
  evidence_lineage_preserved: boolean;
  governance_lineage_preserved: boolean;
  replay_lineage_preserved: boolean;
  no_recalibration_performed: boolean;
  historical_predictions_unchanged: boolean;
  failure_analysis: readonly ActualizationFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type RiskConfidenceActualizationRecorderInput = Readonly<{
  mission_impact_recorder?: MissionImpactRecorderResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "RISK_MATERIALIZED"
    | "RISK_AVOIDED"
    | "RISK_UNDERESTIMATED"
    | "RISK_OVERESTIMATED"
    | "CONFIDENCE_ACCURATE"
    | "CONFIDENCE_OPTIMISTIC"
    | "CONFIDENCE_PESSIMISTIC"
    | "CONFIDENCE_INVALID"
    | "FORECAST_CORRECT"
    | "FORECAST_PARTIAL"
    | "FORECAST_INCORRECT"
    | "UNKNOWN"
    | "INSUFFICIENT_EVIDENCE"
    | "MISSING_PREDICTION"
    | "MISSING_RISK_REF"
    | "MISSING_CONFIDENCE_REF"
    | "MISSING_FORECAST_REF"
    | "MISSING_EVIDENCE"
    | "INFERRED_COMPARISON"
    | "PREDICTION_MODIFIED"
    | "HISTORICAL_CHANGE"
    | "DUPLICATE_ACTUALIZATION"
    | "REPLAY_MISMATCH"
    | "MISSING_GOVERNANCE"
    | "INTEGRITY_FAILURE"
    | "TENANT_VIOLATION"
    | "NONDETERMINISTIC_CLASSIFICATION"
    | "RECALIBRATION_ATTEMPTED"
    | "FAIL_OPEN";
}>;

export type RiskConfidenceActualizationRecorderResult = Readonly<{
  actualization_recorder_version: "risk-confidence-actualization-recorder/v1";
  mission_impact_recorder: MissionImpactRecorderResult;
  prediction_linkage: PredictionLinkage;
  classification: ActualizationClassification;
  actualization_record: ActualizationRecord;
  validation: ActualizationValidation;
  replay_report: ActualizationReplayReport;
  actualization_ledger: readonly ActualizationLedgerRecord[];
  metrics: ActualizationMetrics;
  audit_report: ActualizationAuditReport;
  lifecycle: readonly ActualizationLifecycleState[];
  deterministic: true;
  replayable: true;
  observational_only: true;
  recalibrates_risk: false;
  recalibrates_confidence: false;
  changes_historical_predictions: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type RiskConfidenceActualizationRecorderFoundation = Readonly<{
  actualization_recorder_version: "risk-confidence-actualization-recorder/v1";
  checks: readonly ActualizationCheck[];
  lifecycle: readonly ActualizationLifecycleState[];
  result: RiskConfidenceActualizationRecorderResult;
}>;
