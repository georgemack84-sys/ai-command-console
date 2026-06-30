export type GovernanceCompletionState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type GovernanceCompletionLifecycleState =
  | "REQUESTED"
  | "LOADING_CERTIFICATIONS"
  | "VALIDATING_SUBSYSTEMS"
  | "VALIDATING_ENTERPRISE_GOVERNANCE"
  | "AGGREGATING_COMPLETION"
  | "CERTIFIED"
  | "CONDITIONAL_CERTIFICATION"
  | "BLOCKED";

export type GovernanceCompletionArea =
  | "FOUNDATION"
  | "POLICY"
  | "RISK"
  | "COMPLIANCE"
  | "RECOMMENDATION"
  | "ESCALATION"
  | "LINEAGE"
  | "REPLAY"
  | "INTEGRITY"
  | "VISIBILITY"
  | "ISOLATION"
  | "CERTIFICATION_SUITE"
  | "CROSS_SYSTEM"
  | "ENTERPRISE";

export type GovernanceCompletionFailure =
  | "GOVERNANCE_INTELLIGENCE_NOT_OPERATIONAL"
  | "GOVERNANCE_CONTRACTS_INVALID"
  | "GOVERNANCE_IDENTITY_NONDETERMINISTIC"
  | "GOVERNANCE_LIFECYCLE_NOT_REPRODUCIBLE"
  | "POLICY_INTELLIGENCE_NOT_OPERATIONAL"
  | "POLICY_LINEAGE_NOT_REPRODUCIBLE"
  | "POLICY_DEPENDENCY_NONDETERMINISTIC"
  | "GOVERNANCE_RISK_NOT_OPERATIONAL"
  | "RISK_SCORING_NONDETERMINISTIC"
  | "RISK_CONFIDENCE_NONDETERMINISTIC"
  | "COMPLIANCE_INTELLIGENCE_NOT_OPERATIONAL"
  | "CONSTITUTIONAL_COMPLIANCE_NOT_REPRODUCIBLE"
  | "AUTHORITY_COMPLIANCE_NOT_REPRODUCIBLE"
  | "RECOMMENDATION_INTELLIGENCE_NOT_OPERATIONAL"
  | "RECOMMENDATIONS_NOT_ADVISORY_ONLY"
  | "RECOMMENDATION_EVIDENCE_UNSUPPORTED"
  | "RECOMMENDATION_CONFIDENCE_NONDETERMINISTIC"
  | "ESCALATION_INTELLIGENCE_NOT_OPERATIONAL"
  | "ESCALATION_ROUTING_NONDETERMINISTIC"
  | "ESCALATION_PRIORITIZATION_NONREPRODUCIBLE"
  | "GOVERNANCE_LINEAGE_NOT_OPERATIONAL"
  | "GOVERNANCE_EXPLANATIONS_NONREPRODUCIBLE"
  | "GOVERNANCE_REPLAY_NONDETERMINISTIC"
  | "REPLAY_STATE_RECONSTRUCTION_FAILED"
  | "REPLAY_RECOMMENDATION_RECONSTRUCTION_FAILED"
  | "GOVERNANCE_INTEGRITY_NOT_VERIFIED"
  | "TAMPERING_NOT_DETECTED"
  | "VISIBILITY_FRAMEWORK_NOT_OPERATIONAL"
  | "GOVERNANCE_DASHBOARD_NOT_OPERATIONAL"
  | "LINEAGE_EXPLORER_NOT_OPERATIONAL"
  | "REPLAY_VIEWER_NOT_OPERATIONAL"
  | "INTEGRITY_VIEWER_NOT_OPERATIONAL"
  | "TENANT_ISOLATION_NOT_ENFORCED"
  | "CROSS_TENANT_GOVERNANCE_NOT_BLOCKED"
  | "HIDDEN_GOVERNANCE_STATE_NOT_DETECTED"
  | "UNSUPPORTED_RECOMMENDATION_ACCEPTED"
  | "MISSING_EVIDENCE_ACCEPTED"
  | "REPLAY_MISMATCH_NOT_DETECTED"
  | "INTEGRITY_VERIFICATION_MISMATCH"
  | "GOVERNANCE_BYPASS_NOT_DETECTED"
  | "CONSTITUTIONAL_VIOLATION_ACCEPTED"
  | "AUTHORITY_EXPANSION_NOT_DETECTED"
  | "POLICY_CONFLICT_IGNORED"
  | "COMPLIANCE_VIOLATION_IGNORED"
  | "ESCALATION_ROUTING_INCONSISTENT"
  | "LINEAGE_RECONSTRUCTION_MISMATCH"
  | "GOVERNANCE_VISIBILITY_INCOMPLETE"
  | "CERTIFICATION_SUITE_NOT_PASSING"
  | "MINOR_VISIBILITY_REFINEMENT";

export type GovernanceCompletionScenario =
  | "BASELINE"
  | "MINOR_VISIBILITY_REFINEMENT"
  | GovernanceCompletionFailure;

export type GovernanceCompletionRun = Readonly<{
  completion_gate_id: string;
  tenant_id: string;
  mission_id: string;
  completion_timestamp: string;
  suite_version: "governance-intelligence-completion-suite/v7M";
  overall_state: GovernanceCompletionState;
  phase8_progression_allowed: boolean;
  production_certification_allowed: boolean;
  integrity_hash: string;
  run_hash: string;
}>;

export type GovernanceCompletionCheck = Readonly<{
  completion_check_id: string;
  area: GovernanceCompletionArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: GovernanceCompletionFailure | null;
  evidence_refs: readonly string[];
  check_hash: string;
}>;

export type GovernanceCompletionResult = Readonly<{
  completion_result_id: string;
  overall_state: GovernanceCompletionState;
  pass_count: number;
  fail_count: number;
  critical_failure_count: number;
  warning_count: number;
  blocking_failures: readonly GovernanceCompletionFailure[];
  recommendations: readonly string[];
  phase8_decision: "APPROVED_FOR_CONTROLLED_AUTONOMY" | "LIMITED_INTERNAL_REMEDIATION" | "BLOCKED_IN_PHASE_7";
  result_hash: string;
}>;

export type GovernanceCompletionTimelineEvent = Readonly<{
  event_id: string;
  stage: "LOAD_PHASE7_CERTIFICATIONS" | "VALIDATE_INTEGRATED_AREAS" | "VALIDATE_CROSS_SYSTEM_GOVERNANCE" | "VALIDATE_ENTERPRISE_REQUIREMENTS" | "AGGREGATE_COMPLETION_DECISION" | "STORE_COMPLETION_LEDGER";
  timestamp: string;
  state: GovernanceCompletionLifecycleState;
  summary: string;
  event_hash: string;
}>;

export type GovernanceCompletionLedgerRecord = Readonly<{
  ledger_record_id: string;
  completion_gate_id: string;
  tenant_id: string;
  mission_id: string;
  check_hashes: readonly string[];
  result_hash: string;
  evidence_hash: string;
  integrity_hash: string;
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type GovernanceIntelligenceCompletionGateReport = Readonly<{
  completion_gate_id: string;
  phase_version: "7M";
  schema_version: "governance-intelligence-completion-gate/v7M";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  phase8_controlled_autonomy_gate: true;
  governance_execution_allowed: false;
  production_deployment_allowed: boolean;
  tenant_isolated: boolean;
  authority_protected: boolean;
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  integrity_protected: boolean;
  operator_visible: boolean;
  completion_run: GovernanceCompletionRun;
  completion_checks: readonly GovernanceCompletionCheck[];
  completion_result: GovernanceCompletionResult;
  timeline: readonly GovernanceCompletionTimelineEvent[];
  evidence_package: Readonly<{
    evidence_package_id: string;
    certification_refs: readonly string[];
    replay_refs: readonly string[];
    integrity_refs: readonly string[];
    authority_refs: readonly string[];
    isolation_refs: readonly string[];
    visibility_refs: readonly string[];
    completion_hashes: readonly string[];
    evidence_hash: string;
  }>;
  truth_ledger_record: GovernanceCompletionLedgerRecord;
  observability: Readonly<{
    completion_duration_ms: number;
    integrated_area_success_rate: number;
    certification_suite_success_rate: number;
    critical_failure_rate: number;
    phase8_readiness: number;
    completion_test_count: number;
  }>;
  report_hash: string;
}>;

export type GovernanceCompletionGateInput = Readonly<{
  scenario?: GovernanceCompletionScenario;
  tenant_id?: string;
  mission_id?: string;
  validator_id?: string;
}>;

export type GovernanceCompletionGateObservabilitySurface = Readonly<{
  completion_gate_id: string;
  overall_state: GovernanceCompletionState;
  lifecycle_state: GovernanceCompletionLifecycleState;
  completion_test_count: number;
  critical_failure_count: number;
  phase8_decision: GovernanceCompletionResult["phase8_decision"];
  phase8_progression_allowed: boolean;
  report_hash: string;
}>;
