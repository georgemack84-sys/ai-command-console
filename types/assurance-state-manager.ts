import type { AssuranceRecommendationRecord, AssuranceRecommendationScenario } from "@/types/assurance-recommendation-engine";

export type AssuranceRuntimeState = "ASSURED" | "STABLE" | "WATCH" | "DEGRADED" | "CRITICAL";
export type AssuranceStateLifecycleStage = "COLLECT_RUNTIME_STATE" | "VALIDATE_THRESHOLDS" | "VERIFY_GOVERNANCE" | "VERIFY_CONSTITUTION" | "VERIFY_INTEGRITY" | "DETERMINE_TRANSITION" | "VALIDATE_REPLAY" | "RECORD_STATE_HISTORY" | "PUBLISH_ASSURANCE_STATE";
export type AssuranceStateScenario = "BASELINE" | "STABLE_VARIATION" | "WATCH_DEGRADATION" | "DEGRADED_RISK" | "CRITICAL_FAILURE" | "RECOVERY_TO_STABLE" | "RECOVERY_TO_WATCH" | "INVALID_TRANSITION" | "SKIPPED_STATE" | "OSCILLATING_STATE" | "REPEATED_DEGRADATION" | "FAILED_RECOVERY" | "INCONSISTENT_THRESHOLDS" | "GOVERNANCE_FAILURE" | "CONSTITUTIONAL_FAILURE" | "INTEGRITY_FAILURE" | "REPLAY_MISMATCH" | "EXECUTION_AUTHORITY_ATTEMPT";
export type AssuranceStateFailure = "INVALID_TRANSITION" | "OSCILLATING_STATE_CHANGE" | "SKIPPED_LIFECYCLE_STAGE" | "REPEATED_DEGRADATION" | "FAILED_RECOVERY_ATTEMPT" | "INCONSISTENT_THRESHOLDS" | "GOVERNANCE_VALIDATION_FAILURE" | "CONSTITUTIONAL_VALIDATION_FAILURE" | "INTEGRITY_VERIFICATION_FAILURE" | "REPLAY_MISMATCH" | "INCOMPLETE_EVIDENCE" | "UNAUTHORIZED_EXECUTION_CAPABILITY";
export type AssuranceStateValidationStatus = "PASS" | "FAIL";

export type AssuranceTransitionThreshold = Readonly<{
  threshold_id: string;
  state: AssuranceRuntimeState;
  min_confidence: number;
  min_health: number;
  max_drift_score: number;
  allowed_recommendation_severities: readonly string[];
  immutable: true;
  threshold_hash: string;
}>;

export type AssuranceThresholdResult = Readonly<{
  threshold_result_id: string;
  state: AssuranceRuntimeState;
  confidence_satisfied: boolean;
  health_satisfied: boolean;
  drift_satisfied: boolean;
  recommendation_satisfied: boolean;
  passed: boolean;
  threshold_hash: string;
  result_hash: string;
}>;

export type AssuranceTransitionValidation = Readonly<{
  transition_id: string;
  from_state: AssuranceRuntimeState;
  to_state: AssuranceRuntimeState;
  allowed: boolean;
  emergency_transition: boolean;
  failure: AssuranceStateFailure | null;
  validation_hash: string;
}>;

export type AssuranceStateHistoryEntry = Readonly<{
  history_id: string;
  assurance_state_id: string;
  old_state: AssuranceRuntimeState;
  new_state: AssuranceRuntimeState;
  transition_reason: string;
  triggering_events: readonly string[];
  threshold_snapshot: readonly AssuranceThresholdResult[];
  governance_snapshot: AssuranceStateValidationStatus;
  constitutional_snapshot: AssuranceStateValidationStatus;
  integrity_snapshot: AssuranceStateValidationStatus;
  timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  append_only: true;
  history_hash: string;
}>;

export type AssuranceStateRecord = Readonly<{
  assurance_state_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  manager_version: "assurance-state-manager/v8ALT.1F";
  lifecycle: readonly AssuranceStateLifecycleStage[];
  current_state: AssuranceRuntimeState;
  previous_state: AssuranceRuntimeState;
  transition_reason: string;
  transition_timestamp: string;
  confidence_score: number;
  runtime_health_score: number;
  drift_severity: string;
  risk_level: string;
  threshold_results: readonly AssuranceThresholdResult[];
  transition_validation: AssuranceTransitionValidation;
  governance_validation: AssuranceStateValidationStatus;
  constitutional_validation: AssuranceStateValidationStatus;
  integrity_validation: AssuranceStateValidationStatus;
  recommended_action: string;
  escalation_required: boolean;
  recovery_eligible: boolean;
  operator_notification_required: boolean;
  state_history: readonly AssuranceStateHistoryEntry[];
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
  execution_authorized: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  operator_overridden: boolean;
  record_hash: string;
}>;

export type AssuranceStateInput = Readonly<{
  scenario?: AssuranceStateScenario;
  recommendation?: AssuranceRecommendationRecord;
  previous_state?: AssuranceRuntimeState;
}>;

export type AssuranceStateReplayResult = Readonly<{
  replay_id: string;
  assurance_state_id: string;
  deterministic: boolean;
  reconstructed_current_state: AssuranceRuntimeState;
  reconstructed_previous_state: AssuranceRuntimeState;
  reconstructed_transition_hash: string;
  reconstructed_history_hash: string;
  replay_failures: readonly AssuranceStateFailure[];
  replay_hash: string;
}>;

export type AssuranceStateValidationResult = Readonly<{
  assurance_state_id: string | null;
  valid: boolean;
  threshold_valid: boolean;
  transition_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  integrity_valid: boolean;
  replay_valid: boolean;
  history_append_only: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  failures: readonly AssuranceStateFailure[];
  validation_hash: string;
}>;

export type AssuranceStateCertification = Readonly<{
  certification_id: string;
  assurance_state_id: string;
  certified: boolean;
  validation: AssuranceStateValidationResult;
  ready_for_runtime_assurance_ledger: boolean;
  certification_hash: string;
}>;

export type AssuranceStatePublisherSurface = Readonly<{
  assurance_state_id: string;
  current_state: AssuranceRuntimeState;
  previous_state: AssuranceRuntimeState;
  transition_reason: string;
  escalation_required: boolean;
  recovery_eligible: boolean;
  recommended_action: string;
  operator_notification_required: boolean;
  replay_reference: string;
  integrity_hash: string;
  advisory_only: true;
}>;

export type AssuranceStateManagerContract = Readonly<{
  doctrine: Readonly<{
    manager_version: "assurance-state-manager/v8ALT.1F";
    principles: readonly string[];
    lifecycle: readonly AssuranceStateLifecycleStage[];
    states: readonly AssuranceRuntimeState[];
    transition_matrix: Readonly<Record<AssuranceRuntimeState, readonly AssuranceRuntimeState[]>>;
    advisory_only_for_execution: true;
  }>;
  thresholds: readonly AssuranceTransitionThreshold[];
  state: AssuranceStateRecord;
  validation: AssuranceStateValidationResult;
  replay: AssuranceStateReplayResult;
  certification: AssuranceStateCertification;
}>;

export type AssuranceStateScenarioMap = Readonly<Record<AssuranceStateScenario, AssuranceRecommendationScenario>>;
