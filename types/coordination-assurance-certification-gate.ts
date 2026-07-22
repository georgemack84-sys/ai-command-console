export type CertificationDecisionState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationStage = "INITIALIZING" | "LOADING_EVIDENCE" | "VALIDATING" | "SCORING" | "REPLAY_VALIDATION" | "INTEGRITY_VALIDATION" | "CONFLICT_VALIDATION" | "GOVERNANCE_VALIDATION" | "OPERATOR_VISIBILITY_VALIDATION" | "PASS" | "CONDITIONAL_PASS" | "FAIL" | "CERTIFIED";
export type CertificationScenario = "BASELINE" | "MISSING_COORDINATION_CONTRACT" | "UNKNOWN_AGENT" | "PLAN_DIVERGENCE" | "DELEGATION_MISMATCH" | "DUPLICATE_OWNERSHIP" | "AUTHORITY_OVERLAP" | "GOVERNANCE_MISMATCH" | "HIDDEN_COMMUNICATION" | "REPLAY_MISMATCH" | "HASH_CORRUPTION" | "UNDETECTED_DEADLOCK" | "UNDETECTED_RACE_CONDITION" | "CROSS_TENANT_LEAKAGE" | "DASHBOARD_EXECUTION_AUTHORITY" | "INCOMPLETE_OPERATOR_VISIBILITY" | "GOVERNANCE_BYPASS" | "EVIDENCE_INCOMPLETE" | "INTEGRITY_FAILURE" | "DASHBOARD_GAP";
export type CertificationFailure = "MISSING_COORDINATION_CONTRACT" | "UNKNOWN_AGENT_PARTICIPATES" | "PLAN_DIVERGENCE_DETECTED" | "DELEGATION_MISMATCH_DETECTED" | "DUPLICATE_OWNERSHIP_DETECTED" | "AUTHORITY_OVERLAP_DETECTED" | "GOVERNANCE_MISMATCH_DETECTED" | "HIDDEN_COMMUNICATION_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "HASH_CORRUPTION_DETECTED" | "UNDETECTED_DEADLOCK" | "UNDETECTED_RACE_CONDITION" | "CROSS_TENANT_LEAKAGE_DETECTED" | "DASHBOARD_EXECUTION_AUTHORITY_DETECTED" | "INCOMPLETE_OPERATOR_VISIBILITY" | "GOVERNANCE_BYPASS_DETECTED" | "CERTIFICATION_EVIDENCE_INCOMPLETE" | "INTEGRITY_VERIFICATION_FAILED";

export type CoordinationSessionRecord = Readonly<{
  coordination_session_id: string;
  mission_id: string;
  tenant_id: string;
  participating_agents: readonly string[];
  coordination_contract_id: string;
  shared_objective: string;
  governance_context_id: string;
  authority_model_id: string;
  coordination_state: string;
  created_at: string;
  updated_at: string;
}>;

export type AgentCoordinationRecord = Readonly<{
  agent_id: string;
  agent_role: string;
  agent_authority_scope: string;
  assigned_tasks: readonly string[];
  delegation_permissions: readonly string[];
  communication_permissions: readonly string[];
  current_state: string;
  confidence_score: number;
  governance_status: string;
}>;

export type CertificationScores = Readonly<{
  coordination_score: number;
  coordination_confidence: number;
  coordination_health: "HEALTHY" | "CONDITIONAL" | "FAILED";
  certification_readiness: number;
  authority_separation_score: number;
  replay_consistency_score: number;
  communication_visibility_score: number;
  coordination_risk_score: number;
}>;

export type CertificationEvent = Readonly<{
  certification_event_id: string;
  coordination_session_id: string;
  validation_stage: CertificationStage;
  validation_result: "PASS" | "FAIL";
  assurance_scores: CertificationScores;
  decision_state: CertificationDecisionState;
  timestamp: string;
  integrity_hash: string;
}>;

export type CertificationReport = Readonly<{
  certification_id: string;
  decision_state: CertificationDecisionState;
  production_authorization: "AUTHORIZED_BY_CERTIFICATION_FIELD_ONLY" | "BLOCKED";
  deployment_enabled: false;
  session_record: CoordinationSessionRecord | null;
  agent_records: readonly AgentCoordinationRecord[];
  scores: CertificationScores;
  failures: readonly CertificationFailure[];
  evidence_references: readonly string[];
  events: readonly CertificationEvent[];
  final_state: "MULTI_AGENT_COORDINATION_ASSURED" | "MULTI_AGENT_COORDINATION_BLOCKED";
  integrity_hash: string;
}>;

export type CertificationInput = Readonly<{ scenario?: CertificationScenario; report?: CertificationReport }>;

export type CertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  decision_state: CertificationDecisionState;
  coordination_contract_present: boolean;
  agents_identified: boolean;
  planning_reproducible: boolean;
  delegation_deterministic: boolean;
  ownership_clear: boolean;
  authority_separated: boolean;
  governance_aligned: boolean;
  communication_authorized: boolean;
  replay_reproduced: boolean;
  hashes_valid: boolean;
  deadlock_detection_valid: boolean;
  race_detection_valid: boolean;
  tenant_isolated: boolean;
  dashboard_read_only: boolean;
  operator_visibility_complete: boolean;
  governance_bypass_prevented: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  failures: readonly CertificationFailure[];
  validation_hash: string;
}>;

export type CertificationObservabilitySurface = Readonly<{
  certification_id: string;
  decision_state: CertificationDecisionState;
  production_authorization: string;
  failure_count: number;
  readiness: number;
  integrity_hash: string;
}>;

export type CoordinationAssuranceCertificationBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "coordination-assurance-certification-gate/v8ALT.7.12";
    final_state: "MULTI_AGENT_COORDINATION_ASSURED";
    decision_states: readonly CertificationDecisionState[];
    principles: readonly string[];
  }>;
  report: CertificationReport;
  validation: CertificationValidationResult;
  observability: CertificationObservabilitySurface;
}>;
