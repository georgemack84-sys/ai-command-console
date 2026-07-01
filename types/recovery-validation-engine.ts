import type { RecoveryPlanningPackage, RecoveryPlanningScenario } from "@/types/recovery-planning-engine";

export type RecoveryValidationDecisionState = "INITIALIZING" | "VALIDATING" | "GOVERNANCE_REVIEW" | "PASSED" | "REJECTED" | "READY_FOR_RECOMMENDATION";
export type RecoveryValidationResultLevel = "PASS" | "CONDITIONAL_PASS" | "REJECT";
export type RecoveryValidationCheckStatus = "PASS" | "FAIL" | "MISSING";

export type RecoveryValidationScenario =
  | RecoveryPlanningScenario
  | "BASELINE"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "POLICY_VIOLATION"
  | "TENANT_ISOLATION_FAILURE"
  | "NONDETERMINISTIC_PLANNING"
  | "REPLAY_MISMATCH"
  | "MISSING_OPERATOR_APPROVAL"
  | "MISSING_GOVERNANCE_EVIDENCE"
  | "INTEGRITY_FAILURE"
  | "AUTONOMOUS_EXECUTION_ATTEMPT"
  | "AUTOMATIC_RESTART_ATTEMPT"
  | "AUTOMATIC_ROLLBACK_ATTEMPT"
  | "POLICY_MUTATION_ATTEMPT"
  | "CONSTITUTIONAL_MUTATION_ATTEMPT"
  | "GOVERNANCE_BYPASS"
  | "AUTHORITY_ESCALATION_ATTEMPT"
  | "HIDDEN_RECOVERY";

export type RecoveryValidationFailure =
  | "CONSTITUTIONAL_INVALID"
  | "AUTHORITY_INVALID"
  | "POLICY_INVALID"
  | "TENANT_ISOLATION_INVALID"
  | "DETERMINISM_INVALID"
  | "REPLAY_INVALID"
  | "OPERATOR_APPROVAL_INVALID"
  | "GOVERNANCE_EVIDENCE_MISSING"
  | "LINEAGE_INVALID"
  | "INTEGRITY_INVALID"
  | "AUTONOMOUS_EXECUTION_DETECTED"
  | "AUTOMATIC_RESTART_DETECTED"
  | "AUTOMATIC_ROLLBACK_DETECTED"
  | "POLICY_MUTATION_DETECTED"
  | "CONSTITUTIONAL_MUTATION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "HIDDEN_RECOVERY_DETECTED"
  | "CROSS_TENANT_EXPOSURE_DETECTED";

export type RecoveryValidationEvidenceRecord = Readonly<{
  evidence_id: string;
  validation_id: string;
  category: "CONSTITUTION" | "AUTHORITY" | "POLICY" | "TENANT" | "DETERMINISM" | "REPLAY" | "OPERATOR_APPROVAL" | "INTEGRITY";
  status: RecoveryValidationCheckStatus;
  reference: string;
  explanation: string;
  immutable: true;
  evidence_hash: string;
}>;

export type RecoveryValidationObject = Readonly<{
  validation_id: string;
  recovery_plan_id: string;
  recovery_id: string;
  planning_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  decision_state: RecoveryValidationDecisionState;
  constitutional_status: RecoveryValidationCheckStatus;
  authority_status: RecoveryValidationCheckStatus;
  policy_status: RecoveryValidationCheckStatus;
  tenant_status: RecoveryValidationCheckStatus;
  replay_status: RecoveryValidationCheckStatus;
  determinism_status: RecoveryValidationCheckStatus;
  operator_approval_status: RecoveryValidationCheckStatus;
  integrity_status: RecoveryValidationCheckStatus;
  validation_result: RecoveryValidationResultLevel;
  rejection_reasons: readonly RecoveryValidationFailure[];
  governance_evidence: readonly RecoveryValidationEvidenceRecord[];
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  timestamp: string;
  source_planning_package: RecoveryPlanningPackage;
  advisory_only: true;
  recovery_executed: boolean;
  recovery_auto_approved: boolean;
  restart_performed: boolean;
  rollback_performed: boolean;
  policy_modified: boolean;
  constitutional_modified: boolean;
  governance_bypassed: boolean;
  authority_escalated: boolean;
  recovery_hidden: boolean;
  cross_tenant_exposed: boolean;
  validation_hash: string;
}>;

export type RecoveryValidationReplayMetadata = Readonly<{
  replay_reference: string;
  replay_version: "recovery-validation-replay/v8ALT.2.4";
  validation_inputs: string;
  governance_evaluation: string;
  constitutional_validation: string;
  authority_verification: string;
  policy_verification: string;
  replay_verification: string;
  determinism_analysis: string;
  rejection_reasoning: string;
  validation_outcome: string;
  replay_checksum: string;
  replay_hash: string;
}>;

export type RecoveryValidationLedgerEntry = Readonly<{
  ledger_id: string;
  validation_id: string;
  recovery_id: string;
  recovery_plan_id: string;
  tenant_id: string;
  result: RecoveryValidationResultLevel;
  evidence_ids: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  append_only: true;
  ledger_hash: string;
}>;

export type RecoveryValidationPackage = Readonly<{
  package_id: string;
  validation: RecoveryValidationObject;
  replay: RecoveryValidationReplayMetadata;
  ledger_entry: RecoveryValidationLedgerEntry;
  ready_for_recommendation_engine: boolean;
  recommendation_engine_authorized: boolean;
  execution_authorized: false;
  package_hash: string;
}>;

export type RecoveryValidationInput = Readonly<{
  scenario?: RecoveryValidationScenario;
  planning_package?: RecoveryPlanningPackage;
}>;

export type RecoveryValidationAssessment = Readonly<{
  validation_id: string | null;
  valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  policy_valid: boolean;
  tenant_valid: boolean;
  replay_valid: boolean;
  determinism_valid: boolean;
  operator_approval_valid: boolean;
  governance_evidence_complete: boolean;
  lineage_valid: boolean;
  integrity_valid: boolean;
  advisory_only: boolean;
  immutable_hash_valid: boolean;
  failures: readonly RecoveryValidationFailure[];
  assessment_hash: string;
}>;

export type RecoveryValidationReplayResult = Readonly<{
  replay_reference: string;
  validation_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_checksum: string;
  replay_result_hash: string;
}>;

export type RecoveryValidationObservabilitySurface = Readonly<{
  validation_id: string;
  recovery_id: string;
  recovery_plan_id: string;
  validation_result: RecoveryValidationResultLevel;
  decision_state: RecoveryValidationDecisionState;
  rejection_reasons: readonly RecoveryValidationFailure[];
  evidence_count: number;
  replay_valid: boolean;
  tenant_id: string;
  ready_for_recommendation_engine: boolean;
  execution_authorized: false;
  package_hash: string;
}>;

export type RecoveryValidationEngineContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "recovery-validation-engine/v8ALT.2.4";
    principles: readonly string[];
    decision_states: readonly RecoveryValidationDecisionState[];
    result_levels: readonly RecoveryValidationResultLevel[];
    advisory_only: true;
    execution_authorized: false;
  }>;
  validation_package: RecoveryValidationPackage;
  assessment: RecoveryValidationAssessment;
  replay_result: RecoveryValidationReplayResult;
  observability: RecoveryValidationObservabilitySurface;
}>;
