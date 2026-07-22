export type TenantIsolationLifecycleState = "REGISTERED" | "INITIALIZED" | "VALIDATING" | "EVIDENCE_COLLECTED" | "REPLAY_VALIDATED" | "CERTIFIED";
export type IsolationDomain = "IDENTITY" | "POLICY" | "MEMORY" | "ARTIFACT" | "REPLAY";
export type IsolationViolationCategory = "IDENTITY_VIOLATION" | "POLICY_VIOLATION" | "MEMORY_VIOLATION" | "ARTIFACT_VIOLATION" | "REPLAY_VIOLATION" | "EXECUTION_BOUNDARY_VIOLATION" | "UNKNOWN_ISOLATION_FAILURE";
export type IsolationSeverity = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TenantIsolationOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type TenantIsolationFailure = "SCENARIO_ORCHESTRATION_NOT_APPROVED" | "CONTRACT_NOT_APPROVED" | "IDENTITY_ISOLATION_FAILURE" | "POLICY_ISOLATION_FAILURE" | "MEMORY_ISOLATION_FAILURE" | "ARTIFACT_ISOLATION_FAILURE" | "REPLAY_ISOLATION_FAILURE" | "CROSS_TENANT_DETECTION_NON_DETERMINISTIC" | "ISOLATION_REPLAY_FAILURE" | "EVIDENCE_MUTABLE" | "LINEAGE_INCOMPLETE" | "EXPLAINABILITY_INCOMPLETE" | "GOVERNANCE_NOT_ENFORCED" | "CONSTITUTIONAL_BOUNDARY_BREACH" | "ADVISORY_BOUNDARY_BREACH" | "UNAUTHORIZED_SHARING" | "INTEGRITY_VERIFICATION_FAILED" | "CERTIFICATION_REPLAY_FAILURE" | "NON_CONSTITUTIONAL_MONITORING_WARNING";
export type TenantIsolationScenario = "BASELINE" | TenantIsolationFailure;

export type TenantIsolationValidationInput = Readonly<{ scenario?: TenantIsolationScenario; tenant_id?: string; validation_scope?: string }>;

export type TenantIsolationValidationContract = Readonly<{
  contract_version: "tenant-isolation-validation/v14.5";
  orchestration_ref: string;
  lifecycle: readonly TenantIsolationLifecycleState[];
  isolation_domains: readonly IsolationDomain[];
  deterministic_validation_required: boolean;
  replay_required: boolean;
  evidence_required: boolean;
  governance_required: boolean;
  advisory_only: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationValidationRecord = Readonly<{
  validation_id: string;
  tenant_id: string;
  synthetic_environment_id: string;
  validation_scope: string;
  validation_status: TenantIsolationLifecycleState;
  isolation_domains_validated: readonly IsolationDomain[];
  validation_timestamp: string;
  replay_reference: string;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type IsolationViolationRecord = Readonly<{
  violation_id: string;
  tenant_id: string;
  violation_category: IsolationViolationCategory;
  affected_component: string;
  severity: IsolationSeverity;
  detected_timestamp: string;
  evidence_reference: string;
  replay_reference: string;
  resolution_status: "BLOCKED" | "RESOLVED" | "NONE";
  integrity_hash: string;
}>;

export type IsolationReplayRecord = Readonly<{
  replay_id: string;
  original_validation_id: string;
  replay_status: "REPRODUCED" | "DIVERGED";
  divergence_detected: boolean;
  divergence_summary: string;
  replay_timestamp: string;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type IsolationEvidenceRecord = Readonly<{
  evidence_id: string;
  validation_id: string;
  tenant_id: string;
  evidence_type: "VALIDATION" | "VIOLATION" | "REPLAY" | "CERTIFICATION";
  lineage_reference: string;
  integrity_hash: string;
  immutable_timestamp: string;
}>;

export type IsolationExplanationRecord = Readonly<{
  explanation_id: string;
  validation_id: string;
  explanation_summary: string;
  supporting_evidence: readonly string[];
  validation_reasoning: string;
  replay_reference: string;
  integrity_hash: string;
}>;

export type TenantIsolationGovernanceRecord = Readonly<{
  governance_id: string;
  constitutional_compliance: boolean;
  governance_supremacy: boolean;
  operator_supremacy: boolean;
  advisory_only_behavior: boolean;
  tenant_ownership_preserved: boolean;
  immutable_audit: boolean;
  deterministic_validation: boolean;
  unauthorized_access_blocked: boolean;
  cross_tenant_execution_blocked: boolean;
  integrity_hash: string;
}>;

export type TenantIsolationCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: TenantIsolationOutcome;
  passed: boolean;
  failure_reason: TenantIsolationFailure | null;
  integrity_hash: string;
}>;

export type TenantIsolationValidationResult = Readonly<{
  phase_version: "tenant-isolation-validation/v14.5";
  phase_identifier: "TenantIsolationValidation";
  orchestration_ref: string;
  contract: TenantIsolationValidationContract;
  validation_record: TenantIsolationValidationRecord;
  violations: readonly IsolationViolationRecord[];
  replay: IsolationReplayRecord;
  evidence_registry: readonly IsolationEvidenceRecord[];
  explanation: IsolationExplanationRecord;
  governance: TenantIsolationGovernanceRecord;
  certification_tests: readonly TenantIsolationCertificationTest[];
  failures: readonly TenantIsolationFailure[];
  outcome: TenantIsolationOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type TenantIsolationValidationValidation = Readonly<{
  valid: boolean;
  outcome: TenantIsolationOutcome;
  contract_valid: boolean;
  validation_record_valid: boolean;
  violations_valid: boolean;
  replay_valid: boolean;
  evidence_valid: boolean;
  explanation_valid: boolean;
  governance_valid: boolean;
  certification_valid: boolean;
  failures: readonly TenantIsolationFailure[];
  integrity_hash: string;
}>;

export type TenantIsolationValidationBundle = Readonly<{
  doctrine: Readonly<{
    version: "tenant-isolation-validation/v14.5";
    orchestration_phase: "synthetic-scenario-orchestration/v14.4";
    certification_outcomes: readonly TenantIsolationOutcome[];
    violation_categories: readonly IsolationViolationCategory[];
    isolation_domains: readonly IsolationDomain[];
  }>;
  result: TenantIsolationValidationResult;
  validation: TenantIsolationValidationValidation;
}>;
