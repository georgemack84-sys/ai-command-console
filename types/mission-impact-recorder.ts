import type { OutcomeValidationState } from "@/types/actual-result-capture-contract";
import type { VisibilityRole } from "@/types/decision-observability-contract";
import type { OutcomeCompletenessValidatorResult } from "@/types/outcome-completeness-validator";

export type MissionImpactLifecycleState = "OBSERVED" | "CLASSIFIED" | "VALIDATED" | "RECORDED" | "REPLAYABLE";

export type MissionImpactType =
  | "OBJECTIVE_COMPLETED"
  | "OBJECTIVE_PARTIALLY_COMPLETED"
  | "OBJECTIVE_NOT_COMPLETED"
  | "MISSION_IMPROVED"
  | "MISSION_DEGRADED"
  | "SIDE_EFFECT_OBSERVED"
  | "UNEXPECTED_OUTCOME"
  | "NO_OBSERVABLE_CHANGE"
  | "INSUFFICIENT_EVIDENCE";

export type MissionImpactCheck =
  | "COMPLETENESS_VALIDATION"
  | "MISSION_IMPACT_ANALYSIS"
  | "IMPACT_CLASSIFICATION"
  | "STRUCTURAL_VALIDATION"
  | "EVIDENCE_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "REPLAY_VALIDATION"
  | "INTEGRITY_VALIDATION"
  | "CONSISTENCY_VALIDATION"
  | "LEDGER_IMMUTABILITY"
  | "TENANT_ISOLATION"
  | "CONSTITUTIONAL_GOVERNANCE";

export type MissionImpactFailure =
  | "COMPLETENESS_VALIDATION_NOT_PASSED"
  | "INFERRED_MISSION_IMPACT_ACCEPTED"
  | "UNSUPPORTED_IMPACT_CLASSIFICATION_ACCEPTED"
  | "EVIDENCE_MISSING"
  | "GOVERNANCE_REFERENCES_MISSING"
  | "REPLAY_REFERENCES_MISSING"
  | "IMPACT_RECORD_MODIFIED_AFTER_RECORDING"
  | "IDENTICAL_EVIDENCE_PRODUCED_DIFFERENT_IMPACT"
  | "NONDETERMINISTIC_CLASSIFICATION_DETECTED"
  | "INTEGRITY_VALIDATION_FAILED"
  | "ORPHAN_MISSION_IMPACT_ACCEPTED"
  | "TENANT_ISOLATION_VIOLATED"
  | "CONSTITUTIONAL_CONSTRAINTS_BYPASSED"
  | "PREDICTIVE_MISSION_BEHAVIOR_ACCEPTED"
  | "CAUSAL_ATTRIBUTION_ACCEPTED"
  | "UNAUTHORIZED_MODIFICATION_REJECTED"
  | "AUTHORIZATION_FAILURE"
  | "FAIL_OPEN_MISSION_IMPACT_BEHAVIOR";

export type MissionImpactAnalysis = Readonly<{
  analyzer_id: string;
  completed_objectives: readonly string[];
  missed_objectives: readonly string[];
  observed_side_effects: readonly string[];
  operational_improvements: readonly string[];
  mission_degradation: readonly string[];
  unexpected_outcomes: readonly string[];
  observed_effects_only: boolean;
  causal_reasoning_absent: boolean;
  predictive_content_absent: boolean;
  integrity_hash: string;
}>;

export type MissionImpactClassification = Readonly<{
  classifier_id: string;
  impact_type: MissionImpactType;
  supported_classification: boolean;
  classification_basis_refs: readonly string[];
  deterministic_classification: boolean;
  validation_result: OutcomeValidationState;
  integrity_hash: string;
}>;

export type MissionImpactRecord = Readonly<{
  impact_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  decision_id: string;
  observation_timestamp: string;
  impact_type: MissionImpactType;
  objective_refs: readonly string[];
  achieved_objectives: readonly string[];
  missed_objectives: readonly string[];
  observed_side_effects: readonly string[];
  operational_improvements: readonly string[];
  mission_degradation: readonly string[];
  unexpected_outcomes: readonly string[];
  supporting_evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  immutable_after_recording: true;
  integrity_hash: string;
}>;

export type MissionImpactValidation = Readonly<{
  validation_id: string;
  validation_status: "VALID" | "BLOCKED" | "INSUFFICIENT_EVIDENCE";
  structural_valid: boolean;
  evidence_valid: boolean;
  governance_valid: boolean;
  replay_valid: boolean;
  integrity_valid: boolean;
  consistency_valid: boolean;
  tenant_isolated: boolean;
  immutable_after_recording: boolean;
  observed_effects_only: boolean;
  constitutional_governance_preserved: boolean;
  failures: readonly MissionImpactFailure[];
  integrity_hash: string;
}>;

export type MissionImpactReplayReport = Readonly<{
  replay_report_id: string;
  impact_record_hash: string;
  analysis_hash: string;
  classification_hash: string;
  reconstruction_hash: string;
  replay_reconstruction_identical: boolean;
  deterministic_serialization: boolean;
  integrity_hash: string;
}>;

export type MissionImpactLedgerRecord = Readonly<{
  ledger_id: string;
  impact_id: string;
  tenant_id: string;
  mission_id: string;
  outcome_id: string;
  impact_type: MissionImpactType;
  lifecycle_state: MissionImpactLifecycleState;
  impact_hash: string;
  evidence_refs: readonly string[];
  governance_refs: readonly string[];
  replay_refs: readonly string[];
  timestamp: string;
  sequence_number: number;
  append_only: true;
  deleted: false;
  integrity_hash: string;
}>;

export type MissionImpactMetrics = Readonly<{
  metrics_id: string;
  mission_impacts_recorded: number;
  impact_classifications_by_type: readonly MissionImpactType[];
  objectives_achieved: number;
  objectives_missed: number;
  side_effects_observed: number;
  mission_degradation_events: number;
  operational_improvements_recorded: number;
  unexpected_outcomes_recorded: number;
  insufficient_evidence_occurrences: number;
  replay_reconstruction_success_rate: number;
  impact_recording_latency_ms: number;
  advisory_only: true;
  integrity_hash: string;
}>;

export type MissionImpactAuditReport = Readonly<{
  report_id: string;
  tenant_id: string;
  checks: readonly MissionImpactCheck[];
  analyzer_operational: boolean;
  recorder_operational: boolean;
  classifier_operational: boolean;
  validator_operational: boolean;
  replay_generator_operational: boolean;
  evidence_lineage_preserved: boolean;
  governance_lineage_preserved: boolean;
  replay_lineage_preserved: boolean;
  analysis_and_attribution_absent: boolean;
  immutable_record_verified: boolean;
  failure_analysis: readonly MissionImpactFailure[];
  certification_decision: OutcomeValidationState;
  integrity_hash: string;
}>;

export type MissionImpactRecorderInput = Readonly<{
  completeness_validator?: OutcomeCompletenessValidatorResult;
  role?: VisibilityRole;
  scenario?:
    | "BASELINE"
    | "OBJECTIVE_COMPLETED"
    | "OBJECTIVE_PARTIALLY_COMPLETED"
    | "OBJECTIVE_NOT_COMPLETED"
    | "MISSION_IMPROVED"
    | "MISSION_DEGRADED"
    | "SIDE_EFFECT_OBSERVED"
    | "UNEXPECTED_OUTCOME"
    | "NO_OBSERVABLE_CHANGE"
    | "INSUFFICIENT_EVIDENCE"
    | "INFERRED_IMPACT"
    | "UNSUPPORTED_CLASSIFICATION"
    | "MISSING_EVIDENCE"
    | "MISSING_GOVERNANCE"
    | "MISSING_REPLAY"
    | "MODIFIED_AFTER_RECORDING"
    | "DIVERGENT_IMPACT"
    | "NONDETERMINISTIC_CLASSIFICATION"
    | "INTEGRITY_FAILURE"
    | "ORPHAN_IMPACT"
    | "TENANT_VIOLATION"
    | "CONSTITUTIONAL_BYPASS"
    | "PREDICTIVE_BEHAVIOR"
    | "CAUSAL_ATTRIBUTION"
    | "UNAUTHORIZED_MODIFICATION"
    | "FAIL_OPEN";
}>;

export type MissionImpactRecorderResult = Readonly<{
  mission_impact_recorder_version: "mission-impact-recorder/v1";
  completeness_validator: OutcomeCompletenessValidatorResult;
  analysis: MissionImpactAnalysis;
  classification: MissionImpactClassification;
  impact_record: MissionImpactRecord;
  validation: MissionImpactValidation;
  replay_report: MissionImpactReplayReport;
  impact_ledger: readonly MissionImpactLedgerRecord[];
  metrics: MissionImpactMetrics;
  audit_report: MissionImpactAuditReport;
  lifecycle: readonly MissionImpactLifecycleState[];
  deterministic: true;
  replayable: true;
  observational_only: true;
  permits_analysis: false;
  permits_attribution: false;
  permits_prediction: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MissionImpactRecorderFoundation = Readonly<{
  mission_impact_recorder_version: "mission-impact-recorder/v1";
  checks: readonly MissionImpactCheck[];
  supported_classifications: readonly MissionImpactType[];
  lifecycle: readonly MissionImpactLifecycleState[];
  result: MissionImpactRecorderResult;
}>;
