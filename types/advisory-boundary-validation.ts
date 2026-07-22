export type AdvisoryAuthorityAction = "ASSESS" | "RECOMMEND" | "EXPLAIN" | "CERTIFY" | "SIMULATE" | "VALIDATE";
export type ProhibitedExecutionAuthority = "EXECUTE_ACTION" | "INITIATE_DEPLOYMENT" | "MODIFY_EXTERNAL_SYSTEM" | "SELF_APPROVE" | "BYPASS_GOVERNANCE" | "ELEVATE_AUTHORITY";
export type BoundaryType = "API" | "CONNECTOR" | "DEPLOYMENT" | "WORKFLOW" | "AUTOMATION" | "ORCHESTRATION" | "PLUGIN" | "TOOL";
export type BoundaryViolationCategory = "DIRECT_EXECUTION" | "INDIRECT_EXECUTION" | "DELEGATED_EXECUTION" | "CHAINED_EXECUTION" | "RECURSIVE_EXECUTION" | "AUTHORITY_ESCALATION" | "GOVERNANCE_BYPASS" | "OPERATOR_BYPASS" | "INTERFACE_AUTHORITY_LEAKAGE" | "REPLAY_MANIPULATION";
export type BoundaryReplayDivergenceCategory = "AUTHORITY_DIVERGENCE" | "REPLAY_DIVERGENCE" | "INTERFACE_DIVERGENCE" | "ORDERING_DIVERGENCE" | "POLICY_DIVERGENCE" | "EXECUTION_DIVERGENCE";
export type AdvisoryBoundaryOutcome = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type AdvisoryBoundaryFailure = "TENANT_ISOLATION_NOT_APPROVED" | "BOUNDARY_CONTRACT_INVALID" | "ADVISORY_OUTPUT_FAILURE" | "DIRECT_EXECUTION_NOT_BLOCKED" | "INDIRECT_EXECUTION_NOT_BLOCKED" | "DELEGATED_EXECUTION_NOT_BLOCKED" | "RECURSIVE_EXECUTION_NOT_BLOCKED" | "INTERFACE_PROTECTION_FAILURE" | "AUTHORITY_ESCALATION_NOT_DETECTED" | "GOVERNANCE_BYPASS_NOT_REJECTED" | "OPERATOR_BYPASS_NOT_REJECTED" | "VIOLATION_REGISTRY_INCOMPLETE" | "BOUNDARY_LINEAGE_INCOMPLETE" | "REPLAY_NON_DETERMINISTIC" | "REPLAY_DIVERGENCE_UNDETECTED" | "EVIDENCE_MUTABLE" | "TENANT_ISOLATION_BREACH" | "CONSTITUTIONAL_HIERARCHY_BREACH" | "MONITORING_UNAVAILABLE" | "ATTACK_SUITE_FAILURE" | "CERTIFICATION_REPLAY_FAILURE" | "NON_CONSTITUTIONAL_DOCUMENTATION_WARNING";
export type AdvisoryBoundaryScenario = "BASELINE" | AdvisoryBoundaryFailure;

export type AdvisoryBoundaryValidationInput = Readonly<{ scenario?: AdvisoryBoundaryScenario; tenant_id?: string; validation_scope?: string }>;

export type AdvisoryBoundaryContract = Readonly<{
  contract_version: "advisory-boundary-validation/v14.6";
  tenant_isolation_ref: string;
  allowed_authority: readonly AdvisoryAuthorityAction[];
  prohibited_authority: readonly ProhibitedExecutionAuthority[];
  boundary_types: readonly BoundaryType[];
  advisory_only: boolean;
  governance_required: boolean;
  replay_required: boolean;
  evidence_required: boolean;
  integrity_hash: string;
}>;

export type BoundaryGuardReport = Readonly<{
  guard_id: string;
  recommendations_observed: boolean;
  generated_artifacts_observed: boolean;
  interface_requests_observed: boolean;
  orchestration_behavior_observed: boolean;
  workflow_transitions_observed: boolean;
  replay_execution_observed: boolean;
  execution_attempts_detected: boolean;
  advisory_only_preserved: boolean;
  integrity_hash: string;
}>;

export type BoundaryValidationReport = Readonly<{
  validation_id: string;
  direct_execution_blocked: boolean;
  indirect_execution_blocked: boolean;
  delegated_execution_blocked: boolean;
  chained_execution_blocked: boolean;
  recursive_execution_blocked: boolean;
  advisory_outputs_valid: boolean;
  authority_escalation_detected: boolean;
  governance_bypass_rejected: boolean;
  operator_bypass_rejected: boolean;
  execution_authority_impossible: boolean;
  integrity_hash: string;
}>;

export type InterfaceProtectionReport = Readonly<{
  interface_protection_id: string;
  protected_interfaces: readonly BoundaryType[];
  interface_contracts_valid: boolean;
  immutable_advisory_responses: boolean;
  execution_separation: boolean;
  authority_preservation: boolean;
  policy_enforcement: boolean;
  integrity_hash: string;
}>;

export type BoundaryAttackRecord = Readonly<{
  attack_id: string;
  attack_category: "EXECUTION_INJECTION" | "AUTHORITY_SPOOFING" | "GOVERNANCE_BYPASS" | "POLICY_SUBSTITUTION" | "INTERFACE_ABUSE" | "REPLAY_MANIPULATION" | "ORCHESTRATION_ABUSE" | "CHAINED_EXECUTION" | "DELEGATED_EXECUTION" | "RECURSIVE_EXECUTION" | "PLUGIN_ABUSE" | "TOOL_INVOCATION_ABUSE";
  expected_behavior: "BLOCKED";
  observed_behavior: "BLOCKED" | "ALLOWED";
  execution_blocked: boolean;
  evidence_ref: string;
  replay_ref: string;
  constitutional_assessment: "PASS" | "FAIL";
  integrity_hash: string;
}>;

export type BoundaryViolationRecord = Readonly<{
  violation_id: string;
  validation_id: string;
  scenario_id: string;
  tenant_id: string;
  boundary_type: BoundaryType;
  violation_category: BoundaryViolationCategory;
  affected_interfaces: readonly BoundaryType[];
  authority_path: readonly string[];
  attempted_execution: string;
  execution_blocked: boolean;
  constitutional_rule: string;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  validation_result: "BLOCKED" | "FAILED";
  timestamp: string;
  integrity_hash: string;
}>;

export type BoundaryReplayReport = Readonly<{
  replay_id: string;
  validation_sessions_replayed: boolean;
  attack_scenarios_replayed: boolean;
  interface_interactions_replayed: boolean;
  authority_decisions_replayed: boolean;
  violation_detection_replayed: boolean;
  execution_blocking_replayed: boolean;
  certification_evidence_replayed: boolean;
  divergence_categories: readonly BoundaryReplayDivergenceCategory[];
  deterministic: boolean;
  integrity_hash: string;
}>;

export type BoundaryGovernanceRecord = Readonly<{
  governance_id: string;
  constitutional_hierarchy: boolean;
  governance_supremacy: boolean;
  operator_supremacy: boolean;
  advisory_only_doctrine: boolean;
  authority_ceilings: boolean;
  tenant_isolation: boolean;
  replay_governance: boolean;
  no_authority_expansion: boolean;
  integrity_hash: string;
}>;

export type BoundaryObservabilityReport = Readonly<{
  observability_id: string;
  boundary_health_dashboard: boolean;
  interface_status_dashboard: boolean;
  violation_activity_dashboard: boolean;
  replay_status_dashboard: boolean;
  authority_compliance_dashboard: boolean;
  attack_coverage_dashboard: boolean;
  alerts_operational: boolean;
  metrics_accurate: boolean;
  integrity_hash: string;
}>;

export type AdvisoryBoundaryCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: AdvisoryBoundaryOutcome;
  passed: boolean;
  failure_reason: AdvisoryBoundaryFailure | null;
  integrity_hash: string;
}>;

export type AdvisoryBoundaryValidationResult = Readonly<{
  phase_version: "advisory-boundary-validation/v14.6";
  phase_identifier: "AdvisoryBoundaryValidation";
  tenant_isolation_ref: string;
  contract: AdvisoryBoundaryContract;
  guard: BoundaryGuardReport;
  validation: BoundaryValidationReport;
  interfaces: InterfaceProtectionReport;
  attacks: readonly BoundaryAttackRecord[];
  violations: readonly BoundaryViolationRecord[];
  replay: BoundaryReplayReport;
  governance: BoundaryGovernanceRecord;
  observability: BoundaryObservabilityReport;
  certification_tests: readonly AdvisoryBoundaryCertificationTest[];
  failures: readonly AdvisoryBoundaryFailure[];
  outcome: AdvisoryBoundaryOutcome;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdvisoryBoundaryValidationValidation = Readonly<{
  valid: boolean;
  outcome: AdvisoryBoundaryOutcome;
  contract_valid: boolean;
  guard_valid: boolean;
  validation_valid: boolean;
  interfaces_valid: boolean;
  attacks_valid: boolean;
  violations_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  observability_valid: boolean;
  certification_valid: boolean;
  failures: readonly AdvisoryBoundaryFailure[];
  integrity_hash: string;
}>;

export type AdvisoryBoundaryValidationBundle = Readonly<{
  doctrine: Readonly<{
    version: "advisory-boundary-validation/v14.6";
    tenant_isolation_phase: "tenant-isolation-validation/v14.5";
    certification_outcomes: readonly AdvisoryBoundaryOutcome[];
    allowed_authority: readonly AdvisoryAuthorityAction[];
    prohibited_authority: readonly ProhibitedExecutionAuthority[];
    replay_divergence_categories: readonly BoundaryReplayDivergenceCategory[];
  }>;
  result: AdvisoryBoundaryValidationResult;
  validation: AdvisoryBoundaryValidationValidation;
}>;
