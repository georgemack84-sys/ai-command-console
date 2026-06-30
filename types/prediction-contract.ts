export type PredictionType =
  | "EXECUTION_BOTTLENECK"
  | "RESOURCE_SHORTAGE"
  | "GOVERNANCE_VIOLATION"
  | "CONFIDENCE_COLLAPSE"
  | "REPLAY_INSTABILITY"
  | "INTEGRITY_DEGRADATION"
  | "ORCHESTRATION_CONGESTION"
  | "DEPENDENCY_FAILURE"
  | "RECOVERY_RISK";

export type PredictionCategory = "EXECUTION" | "RESOURCE" | "GOVERNANCE" | "CONFIDENCE" | "REPLAY" | "INTEGRITY" | "ORCHESTRATION" | "DEPENDENCY" | "RECOVERY";
export type ForecastLifecycleState = "CREATED" | "VALIDATING" | "EVIDENCE_ATTACHED" | "GOVERNANCE_CHECKED" | "CONFIDENCE_PROJECTED" | "READY" | "PUBLISHED" | "EXPIRED" | "SUPERSEDED" | "REJECTED";
export type PredictionSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type PredictionGovernanceState = "COMPLIANT" | "BLOCKED" | "REVIEW_REQUIRED";
export type PredictionCheckStatus = "PASS" | "FAIL" | "MISSING";

export type PredictionContractScenario =
  | "BASELINE"
  | "MISSING_TENANT"
  | "MISSING_MISSION"
  | "UNSUPPORTED_TYPE"
  | "INVALID_TRANSITION"
  | "MISSING_EVIDENCE"
  | "MISSING_GOVERNANCE"
  | "BROKEN_LINEAGE"
  | "MISSING_REPLAY"
  | "MISSING_INTEGRITY"
  | "CROSS_TENANT_REFERENCE"
  | "NONDETERMINISTIC_CONFIDENCE"
  | "AUTONOMOUS_ACTION_REQUESTED"
  | "OPERATOR_APPROVAL_MISSING";

export type PredictionContractFailure =
  | "PREDICTION_ID_MISSING"
  | "TENANT_ID_MISSING"
  | "MISSION_ID_MISSING"
  | "UNSUPPORTED_PREDICTION_TYPE"
  | "FORECAST_WINDOW_MISSING"
  | "EVIDENCE_MISSING"
  | "PROBABILITY_OUT_OF_BOUNDS"
  | "CONFIDENCE_NONDETERMINISTIC"
  | "GOVERNANCE_METADATA_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_BROKEN"
  | "INTEGRITY_HASH_MISSING"
  | "TENANT_ISOLATION_INVALID"
  | "ADVISORY_ONLY_VIOLATION"
  | "OPERATOR_APPROVAL_MISSING"
  | "LIFECYCLE_TRANSITION_INVALID";

export type PredictionEvidenceSource =
  | "EXECUTION_HISTORY"
  | "RUNTIME_ASSURANCE_STATE"
  | "REPLAY_HISTORY"
  | "INTEGRITY_VERIFICATION"
  | "ORCHESTRATION_TELEMETRY"
  | "GOVERNANCE_EVENTS"
  | "CONFIDENCE_TRENDS"
  | "DEPENDENCY_GRAPH_STATE"
  | "RECOVERY_HISTORY"
  | "RESOURCE_UTILIZATION_HISTORY";

export type PredictionEvidence = Readonly<{
  evidence_id: string;
  source_type: PredictionEvidenceSource;
  source_reference: string;
  observation_time: string;
  signal_type: string;
  signal_value: string;
  confidence_contribution: number;
  risk_contribution: number;
  replay_reference: string;
  integrity_hash: string;
  evidence_hash: string;
}>;

export type PredictionGovernanceMetadata = Readonly<{
  governance_state: PredictionGovernanceState;
  policy_references: readonly string[];
  authority_scope: string;
  approval_required: boolean;
  operator_required: boolean;
  constitutional_check: PredictionCheckStatus;
  policy_check: PredictionCheckStatus;
  boundary_check: PredictionCheckStatus;
  tenant_isolation_check: PredictionCheckStatus;
  advisory_only: true;
  governance_hash: string;
}>;

export type PredictionConstitutionalMetadata = Readonly<{
  constitutional_reference: string;
  constitutional_check: PredictionCheckStatus;
  prohibited_actions: readonly string[];
  operator_supremacy_preserved: boolean;
  constitutional_hash: string;
}>;

export type PredictionLineageReference = Readonly<{
  parent_prediction_id: string | null;
  related_predictions: readonly string[];
  source_events: readonly string[];
  source_assurance_records: readonly string[];
  source_recovery_records: readonly string[];
  source_integrity_records: readonly string[];
  source_replay_records: readonly string[];
  lineage_hash: string;
}>;

export type PredictionReplayReference = Readonly<{
  replay_id: string;
  replay_version: "prediction-replay/v8ALT.3.1";
  input_snapshot_hash: string;
  model_version: "prediction-contract-model/v8ALT.3.1";
  deterministic_seed: string;
  replay_timestamp: string;
  expected_output_hash: string;
  replay_hash: string;
}>;

export type PredictionObject = Readonly<{
  prediction_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  prediction_type: PredictionType;
  prediction_category: PredictionCategory;
  forecast_state: ForecastLifecycleState;
  severity: PredictionSeverity;
  probability: number;
  projected_confidence: number;
  forecast_window: string;
  predicted_risks: readonly string[];
  risk_factors: readonly string[];
  trigger_conditions: readonly string[];
  affected_components: readonly string[];
  preventative_recommendations: readonly string[];
  mitigation_plans: readonly string[];
  operator_required: boolean;
  evidence: readonly PredictionEvidence[];
  governance_metadata: PredictionGovernanceMetadata | null;
  constitutional_metadata: PredictionConstitutionalMetadata | null;
  lineage_reference: PredictionLineageReference | null;
  replay_reference: PredictionReplayReference | null;
  integrity_hash: string;
  created_at: string;
  expires_at: string;
  advisory_only: true;
  autonomous_action_requested: boolean;
  execution_modified: boolean;
  rollback_requested: boolean;
  restart_requested: boolean;
  governance_modified: boolean;
  authority_bypassed: boolean;
  prediction_hash: string;
}>;

export type PredictionContractInput = Readonly<{
  scenario?: PredictionContractScenario;
  prediction_type?: PredictionType;
  forecast_state?: ForecastLifecycleState;
  tenant_id?: string;
  mission_id?: string;
  execution_id?: string;
}>;

export type PredictionLifecycleTransitionResult = Readonly<{
  from: ForecastLifecycleState;
  to: ForecastLifecycleState;
  valid: boolean;
  failure: PredictionContractFailure | null;
  transition_hash: string;
}>;

export type PredictionValidationResult = Readonly<{
  prediction_id: string | null;
  valid: boolean;
  identity_valid: boolean;
  type_supported: boolean;
  lifecycle_valid: boolean;
  forecast_window_valid: boolean;
  evidence_attached: boolean;
  probability_valid: boolean;
  confidence_reproducible: boolean;
  governance_present: boolean;
  replay_present: boolean;
  lineage_present: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  operator_approval_required: boolean;
  immutable_hash_valid: boolean;
  failures: readonly PredictionContractFailure[];
  validation_hash: string;
}>;

export type PredictionContractObservabilitySurface = Readonly<{
  prediction_id: string;
  prediction_type: PredictionType;
  prediction_category: PredictionCategory;
  forecast_state: ForecastLifecycleState;
  severity: PredictionSeverity;
  probability: number;
  projected_confidence: number;
  evidence_count: number;
  governance_state: PredictionGovernanceState | "MISSING";
  replay_present: boolean;
  tenant_id: string;
  advisory_only: true;
  prediction_hash: string;
}>;

export type PredictionContract = Readonly<{
  doctrine: Readonly<{
    contract_version: "prediction-contract/v8ALT.3.1";
    principles: readonly string[];
    prediction_types: readonly PredictionType[];
    lifecycle_states: readonly ForecastLifecycleState[];
    evidence_sources: readonly PredictionEvidenceSource[];
    advisory_only: true;
    operator_approval_required: true;
  }>;
  lifecycle_transitions: readonly PredictionLifecycleTransitionResult[];
  prediction: PredictionObject;
  validation: PredictionValidationResult;
  observability: PredictionContractObservabilitySurface;
}>;
