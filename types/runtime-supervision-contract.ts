import type { ExecutionAssuranceRecord } from "@/types/execution-assurance-contract";

export type RuntimeSupervisionLifecycleState = "DRAFT" | "VALIDATING" | "ACTIVE" | "SUSPENDED" | "SUPERSEDED" | "ARCHIVED" | "INVALID";

export type RuntimeSupervisionConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";

export type RuntimeSupervisionScenario =
  | "BASELINE"
  | "MISSING_IDENTITY"
  | "MISSING_EXECUTION"
  | "TENANT_MISMATCH"
  | "SCOPE_AMBIGUOUS"
  | "POLICIES_MISSING"
  | "EXECUTION_CONTROL_GRANTED"
  | "CONFIDENCE_MODEL_MISSING"
  | "EVIDENCE_INCOMPLETE"
  | "REPLAY_MISSING"
  | "LINEAGE_MISSING"
  | "TRUTH_LEDGER_NOT_REQUIRED"
  | "HIDDEN_STATE_ALLOWED"
  | "AUTONOMOUS_INTERVENTION_ALLOWED"
  | "INVALID_TRANSITION"
  | "HASH_MISMATCH";

export type RuntimeSupervisionFailureReason =
  | "SUPERVISION_ID_MISSING"
  | "SUPERVISION_ID_DUPLICATE"
  | "EXECUTION_ID_INVALID"
  | "MISSION_ID_INVALID"
  | "TENANT_ID_INVALID"
  | "TENANT_ALIGNMENT_MISSING"
  | "SUPERVISION_SCOPE_AMBIGUOUS"
  | "PROHIBITED_ACTIONS_MISSING"
  | "INTERVENTION_AUTHORITY_NOT_ADVISORY"
  | "MONITORING_POLICIES_MISSING"
  | "CONFIDENCE_MODEL_MISSING"
  | "EVIDENCE_REQUIREMENTS_INCOMPLETE"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH"
  | "TRUTH_LEDGER_NOT_REQUIRED"
  | "HIDDEN_STATE_ALLOWED"
  | "AUTONOMOUS_INTERVENTION_ALLOWED"
  | "INVALID_LIFECYCLE_TRANSITION";

export type MonitoredExecution = Readonly<{
  execution_id: string;
  plan_id: string;
  orchestration_id: string;
  delegation_plan_id: string;
  mission_id: string;
  tenant_id: string;
  execution_state: string;
  execution_start_time: string;
  approved_authority: string;
  governance_reference: string;
  policy_reference: string;
  constitution_reference: string;
}>;

export type RuntimeSupervisionScope = Readonly<{
  execution_monitoring: boolean;
  drift_monitoring: boolean;
  policy_monitoring: boolean;
  constitutional_monitoring: boolean;
  execution_health_monitoring: boolean;
  runtime_confidence_monitoring: boolean;
  recommendation_validity_monitoring: boolean;
  dependency_monitoring: boolean;
  intervention_recommendation: boolean;
  pause_recommendation: boolean;
  rollback_recommendation: boolean;
  restrictions: readonly string[];
}>;

export type RuntimeMonitoringPolicies = Readonly<{
  execution_policy_refs: readonly string[];
  governance_policy_refs: readonly string[];
  constitutional_policy_refs: readonly string[];
  confidence_policy_refs: readonly string[];
  recommendation_policy_refs: readonly string[];
  monitoring_rules: readonly string[];
}>;

export type RuntimeInterventionAuthority = Readonly<{
  allowed_recommendations: readonly string[];
  prohibited_actions: readonly string[];
  operator_required: boolean;
  advisory_only: boolean;
}>;

export type RuntimeConfidenceModel = Readonly<{
  confidence_score: number;
  confidence_level: RuntimeSupervisionConfidenceLevel;
  confidence_inputs: readonly string[];
  confidence_degradation: number;
  confidence_trend: "STABLE" | "DEGRADING" | "IMPROVING";
  confidence_reason: string;
  confidence_threshold_breached: boolean;
  degradation_thresholds: readonly number[];
  escalation_thresholds: readonly number[];
  timestamp: string;
}>;

export type RuntimeSupervisionEvidenceRequirements = Readonly<{
  required_evidence_types: readonly string[];
  source_event_requirements: readonly string[];
  truth_ledger_required: boolean;
  lineage_required: boolean;
  replay_required: boolean;
  integrity_required: boolean;
}>;

export type RuntimeSupervisionReplayReferences = Readonly<{
  replay_reference: string;
  replay_session_id: string;
  replay_input_hash: string;
  replay_output_hash: string;
  decision_hash: string;
  supervision_event_hash: string;
  evidence_hash: string;
  lineage_reference: string;
  input_hash: string;
  contract_hash: string;
}>;

export type RuntimeSupervisionEvidence = Readonly<{
  evidence_id: string;
  supervision_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  observed_state: string;
  detected_risks: readonly string[];
  detected_policy_violations: readonly string[];
  detected_constitutional_violations: readonly string[];
  confidence_score: number;
  recommendation_validity: "VALID" | "INVALID";
  monitoring_snapshot: readonly string[];
  source_events: readonly string[];
  governance_references: readonly string[];
  policy_references: readonly string[];
  constitution_references: readonly string[];
  timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type RuntimeSupervisionContract = Readonly<{
  supervision_id: string;
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  supervision_version: "runtime-supervision-contract/v8E.A";
  lifecycle_state: RuntimeSupervisionLifecycleState;
  created_at: string;
  created_by: string;
  lineage_reference: string;
  replay_reference: string;
  monitored_execution: MonitoredExecution;
  supervision_scope: RuntimeSupervisionScope;
  monitoring_policies: RuntimeMonitoringPolicies;
  intervention_authority: RuntimeInterventionAuthority;
  confidence_model: RuntimeConfidenceModel;
  evidence_requirements: RuntimeSupervisionEvidenceRequirements;
  supervision_evidence: RuntimeSupervisionEvidence;
  replay_references: RuntimeSupervisionReplayReferences;
  source_execution_assurance: ExecutionAssuranceRecord;
  integrity_hash: string;
}>;

export type RuntimeSupervisionValidationResult = Readonly<{
  validation_id: string;
  supervision_id: string | null;
  validation_state: "PASS" | "FAIL";
  failures: readonly RuntimeSupervisionFailureReason[];
  identity_valid: boolean;
  monitored_execution_valid: boolean;
  tenant_aligned: boolean;
  scope_valid: boolean;
  policies_valid: boolean;
  advisory_only: boolean;
  confidence_model_valid: boolean;
  evidence_complete: boolean;
  replay_ready: boolean;
  lineage_complete: boolean;
  truth_ledger_required: boolean;
  hidden_state_prohibited: boolean;
  autonomous_intervention_prohibited: boolean;
  integrity_verified: boolean;
  ready_for_runtime_supervision: boolean;
  validation_hash: string;
}>;

export type RuntimeSupervisionReplayResult = Readonly<{
  replay_id: string;
  supervision_id: string;
  reconstructed_lifecycle: readonly RuntimeSupervisionLifecycleState[];
  reconstructed_scope: readonly string[];
  reconstructed_confidence_level: RuntimeSupervisionConfidenceLevel;
  reconstructed_evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: RuntimeSupervisionFailureReason | null;
  replay_hash: string;
}>;

export type RuntimeSupervisionObservabilitySurface = Readonly<{
  supervision_id: string;
  execution_id: string;
  lifecycle_state: RuntimeSupervisionLifecycleState;
  confidence_level: RuntimeSupervisionConfidenceLevel;
  validation_state: "PASS" | "FAIL";
  failure_reasons: readonly RuntimeSupervisionFailureReason[];
  operator_required: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type RuntimeSupervisionContractFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    supervision_version: "runtime-supervision-contract/v8E.A";
    lifecycle_states: readonly RuntimeSupervisionLifecycleState[];
    confidence_levels: readonly RuntimeSupervisionConfidenceLevel[];
  }>;
  contract: RuntimeSupervisionContract;
  validation: RuntimeSupervisionValidationResult;
  replay: RuntimeSupervisionReplayResult;
  observability: RuntimeSupervisionObservabilitySurface;
}>;
