import type { ControlledAutonomyCompletionReport } from "@/types/controlled-autonomy-completion-gate";

export type AdaptiveAssuranceConfidenceLevel = "VERY_HIGH" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW" | "INSUFFICIENT";
export type AdaptiveRuntimeHealthLevel = "OPTIMAL" | "HEALTHY" | "STABLE" | "WATCH" | "DEGRADED" | "HIGH_RISK" | "CRITICAL";
export type AdaptiveAssuranceLifecycleState = "CREATED" | "COLLECTING" | "EVALUATING" | "VALIDATING" | "ASSESSING" | "RECORDED" | "CERTIFIED" | "ARCHIVED";
export type AdaptiveAssuranceState = "VALID" | "WATCH" | "DEGRADED" | "REJECTED" | "CERTIFIED";
export type AdaptiveTrend = "IMPROVING" | "STABLE" | "DECLINING" | "UNKNOWN";
export type AdaptiveGovernanceStatus = "COMPLIANT" | "NON_COMPLIANT" | "BLOCKED";
export type AdaptiveConstitutionalStatus = "COMPLIANT" | "VIOLATION" | "UNVERIFIED";
export type AdaptiveAuthorityValidation = "VALID" | "INVALID" | "MISSING";
export type AdaptiveVerificationStatus = "VERIFIED" | "UNVERIFIED" | "FAILED";
export type AdaptiveReplayValidationStatus = "VALID" | "MISMATCH" | "MISSING";
export type AdaptiveMonitoringSubsystem = "EXECUTION" | "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "GOVERNANCE" | "INTEGRITY" | "REPLAY" | "VISIBILITY";
export type AdaptiveEvidenceType = "RUNTIME_TELEMETRY" | "EXECUTION_EVENT" | "PLANNING_ARTIFACT" | "ORCHESTRATION_STATE" | "DELEGATION_RECORD" | "SUPERVISION_OBSERVATION" | "GOVERNANCE_DECISION" | "POLICY_EVALUATION" | "CONSTITUTIONAL_VALIDATION" | "INTEGRITY_VERIFICATION" | "REPLAY_REFERENCE";
export type AdaptiveAssuranceSeverity = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type AdaptiveAssuranceFailure =
  | "IDENTITY_MISSING"
  | "CONFIDENCE_INVALID"
  | "HEALTH_INVALID"
  | "EVIDENCE_MISSING"
  | "GOVERNANCE_INVALID"
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "REPLAY_INVALID"
  | "LINEAGE_INVALID"
  | "INTEGRITY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "LIFECYCLE_TRANSITION_INVALID"
  | "UNAUTHORIZED_EXECUTION_CAPABILITY"
  | "HIDDEN_STATE_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED";

export type AdaptiveRuntimeAssuranceScenario =
  | "BASELINE"
  | "MISSING_IDENTITY"
  | "LOW_CONFIDENCE"
  | "DEGRADED_HEALTH"
  | "MISSING_EVIDENCE"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_INVALID"
  | "REPLAY_MISMATCH"
  | "LINEAGE_BROKEN"
  | "INTEGRITY_MISSING"
  | "TENANT_ISOLATION_FAILURE"
  | "INVALID_TRANSITION"
  | "EXECUTION_AUTHORITY_ATTEMPT"
  | "HIDDEN_STATE";

export type AdaptiveRuntimeMonitoringRecord = Readonly<{
  monitoring_id: string;
  assurance_id: string;
  subsystem: AdaptiveMonitoringSubsystem;
  observation_type: string;
  observation_value: string;
  health_score: number;
  confidence_score: number;
  drift_indicator: boolean;
  risk_indicator: boolean;
  severity: AdaptiveAssuranceSeverity;
  timestamp: string;
  evidence_reference: string;
  monitoring_hash: string;
}>;

export type AdaptiveAssuranceEvidenceRecord = Readonly<{
  evidence_id: string;
  assurance_id: string;
  evidence_type: AdaptiveEvidenceType;
  source: string;
  description: string;
  confidence: AdaptiveAssuranceConfidenceLevel;
  verification_status: AdaptiveVerificationStatus;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
  evidence_hash: string;
}>;

export type AdaptiveReplayMetadata = Readonly<{
  replay_id: string;
  replay_version: "adaptive-runtime-assurance-replay/v8ALT.1A";
  replay_timestamp: string;
  replay_sequence: readonly AdaptiveAssuranceLifecycleState[];
  replay_snapshot: string;
  replay_checksum: string;
  replay_validation_status: AdaptiveReplayValidationStatus;
  replay_hash: string;
}>;

export type AdaptiveLineageMetadata = Readonly<{
  assurance_lineage_id: string;
  parent_evaluation: string | null;
  child_evaluations: readonly string[];
  execution_reference: string;
  mission_reference: string;
  planning_reference: string;
  orchestration_reference: string;
  delegation_reference: string;
  supervision_reference: string;
  governance_reference: string;
  certification_reference: string;
  lineage_hash: string;
}>;

export type AdaptiveIntegrityMetadata = Readonly<{
  integrity_hash: string;
  previous_hash: string;
  verification_status: AdaptiveVerificationStatus;
  hash_algorithm: "SHA-256";
  verification_timestamp: string;
  integrity_evidence: readonly string[];
  immutable_identifiers: readonly string[];
  integrity_reference_hash: string;
}>;

export type AdaptiveRuntimeAssuranceRecord = Readonly<{
  assurance_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  assurance_version: "adaptive-runtime-assurance-contract/v8ALT.1A";
  lifecycle_state: AdaptiveAssuranceLifecycleState;
  assurance_state: AdaptiveAssuranceState;
  runtime_health: AdaptiveRuntimeHealthLevel;
  overall_confidence: AdaptiveAssuranceConfidenceLevel;
  execution_confidence: AdaptiveAssuranceConfidenceLevel;
  planning_confidence: AdaptiveAssuranceConfidenceLevel;
  orchestration_confidence: AdaptiveAssuranceConfidenceLevel;
  delegation_confidence: AdaptiveAssuranceConfidenceLevel;
  supervision_confidence: AdaptiveAssuranceConfidenceLevel;
  governance_confidence: AdaptiveAssuranceConfidenceLevel;
  constitutional_confidence: AdaptiveAssuranceConfidenceLevel;
  confidence_trend: AdaptiveTrend;
  health_trend: AdaptiveTrend;
  detected_drift: readonly string[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  governance_status: AdaptiveGovernanceStatus;
  constitutional_status: AdaptiveConstitutionalStatus;
  authority_validation: AdaptiveAuthorityValidation;
  operator_visibility: "FULL" | "PARTIAL" | "HIDDEN";
  runtime_observations: readonly AdaptiveRuntimeMonitoringRecord[];
  evidence: readonly AdaptiveAssuranceEvidenceRecord[];
  replay_reference: AdaptiveReplayMetadata;
  lineage_reference: AdaptiveLineageMetadata;
  integrity: AdaptiveIntegrityMetadata;
  created_at: string;
  updated_at: string;
  advisory_only: true;
  execution_authorized: boolean;
  execution_modified: boolean;
  governance_modified: boolean;
  assurance_hash: string;
}>;

export type AdaptiveRuntimeAssuranceInput = Readonly<{
  scenario?: AdaptiveRuntimeAssuranceScenario;
  lifecycle_state?: AdaptiveAssuranceLifecycleState;
  tenant_id?: string;
  mission_id?: string;
  execution_id?: string;
}>;

export type AdaptiveLifecycleTransitionResult = Readonly<{
  from: AdaptiveAssuranceLifecycleState;
  to: AdaptiveAssuranceLifecycleState;
  valid: boolean;
  failure: AdaptiveAssuranceFailure | null;
  transition_hash: string;
}>;

export type AdaptiveRuntimeAssuranceValidationResult = Readonly<{
  assurance_id: string | null;
  valid: boolean;
  identity_valid: boolean;
  confidence_valid: boolean;
  health_valid: boolean;
  evidence_complete: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  replay_valid: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  failures: readonly AdaptiveAssuranceFailure[];
  validation_hash: string;
}>;

export type AdaptiveRuntimeAssuranceCertification = Readonly<{
  certification_id: string;
  assurance_id: string;
  certified: boolean;
  lifecycle_state: AdaptiveAssuranceLifecycleState;
  validation: AdaptiveRuntimeAssuranceValidationResult;
  controlled_autonomy_completion: ControlledAutonomyCompletionReport;
  ready_for_runtime_confidence_engine: boolean;
  certification_hash: string;
}>;

export type AdaptiveRuntimeAssuranceObservabilitySurface = Readonly<{
  assurance_id: string;
  lifecycle_state: AdaptiveAssuranceLifecycleState;
  assurance_state: AdaptiveAssuranceState;
  runtime_health: AdaptiveRuntimeHealthLevel;
  overall_confidence: AdaptiveAssuranceConfidenceLevel;
  detected_drift: readonly string[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  governance_status: AdaptiveGovernanceStatus;
  constitutional_status: AdaptiveConstitutionalStatus;
  authority_validation: AdaptiveAuthorityValidation;
  monitoring_records: number;
  evidence_records: number;
  replay_status: AdaptiveReplayValidationStatus;
  integrity_status: AdaptiveVerificationStatus;
  advisory_only: true;
  assurance_hash: string;
}>;

export type AdaptiveRuntimeAssuranceContract = Readonly<{
  doctrine: Readonly<{
    contract_version: "adaptive-runtime-assurance-contract/v8ALT.1A";
    principles: readonly string[];
    confidence_levels: readonly AdaptiveAssuranceConfidenceLevel[];
    health_levels: readonly AdaptiveRuntimeHealthLevel[];
    lifecycle_states: readonly AdaptiveAssuranceLifecycleState[];
    monitoring_subsystems: readonly AdaptiveMonitoringSubsystem[];
    evidence_types: readonly AdaptiveEvidenceType[];
    advisory_only: true;
  }>;
  lifecycle_transitions: readonly AdaptiveLifecycleTransitionResult[];
  assurance: AdaptiveRuntimeAssuranceRecord;
  validation: AdaptiveRuntimeAssuranceValidationResult;
  certification: AdaptiveRuntimeAssuranceCertification;
  observability: AdaptiveRuntimeAssuranceObservabilitySurface;
}>;
