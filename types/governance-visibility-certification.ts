export type GovernanceVisibilityCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type GovernanceVisibilityCertificationCategory =
  | "DASHBOARD"
  | "GOVERNANCE_VISIBILITY"
  | "REPLAY"
  | "LINEAGE"
  | "INTEGRITY"
  | "SECURITY"
  | "API"
  | "CONSTITUTIONAL"
  | "OPERATOR_TRANSPARENCY";

export type GovernanceVisibilityCertificationScenario =
  | "BASELINE"
  | "MISSING_DASHBOARD"
  | "HIDDEN_RECOMMENDATION"
  | "MISSING_COMPLIANCE_SCORE"
  | "HIDDEN_GOVERNANCE_RISK"
  | "ESCALATION_OMITTED"
  | "REPLAY_TIMELINE_INCOMPLETE"
  | "REPLAY_MISMATCH_UNDETECTED"
  | "LINEAGE_BREAK_UNDETECTED"
  | "INFLUENCE_GRAPH_INCONSISTENT"
  | "HIDDEN_INTEGRITY_ISSUE"
  | "TAMPER_EVENT_OMITTED"
  | "HASH_MISMATCH_UNDETECTED"
  | "EXECUTION_CAPABILITY_EXPOSED"
  | "AUTONOMOUS_GOVERNANCE_ACTION"
  | "CROSS_TENANT_VISIBILITY"
  | "CONSTITUTIONAL_VISIBILITY_BYPASS"
  | "HIDDEN_GOVERNANCE_STATE"
  | "API_RESPONSE_NONDETERMINISTIC"
  | "MINOR_VISUALIZATION_GAP";

export type GovernanceVisibilityCertificationFailure =
  | "DASHBOARD_UNAVAILABLE"
  | "DASHBOARD_NONDETERMINISTIC"
  | "GOVERNANCE_VISIBILITY_INCOMPLETE"
  | "REPLAY_VISUALIZATION_INCOMPLETE"
  | "REPLAY_NONDETERMINISTIC"
  | "LINEAGE_VISUALIZATION_INCOMPLETE"
  | "LINEAGE_NONDETERMINISTIC"
  | "INTEGRITY_VISUALIZATION_INCOMPLETE"
  | "INTEGRITY_NONDETERMINISTIC"
  | "ADVISORY_ONLY_BROKEN"
  | "READ_ONLY_BROKEN"
  | "TENANT_ISOLATION_BROKEN"
  | "CONSTITUTIONAL_PROTECTION_BROKEN"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "API_NONDETERMINISTIC"
  | "MINOR_VISUALIZATION_GAP";

export type GovernanceVisibilityCertificationTestResult = Readonly<{
  test_id: string;
  category: GovernanceVisibilityCertificationCategory;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: GovernanceVisibilityCertificationFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type GovernanceVisibilityCertificationStage = Readonly<{
  stage_id: string;
  stage_name: "DASHBOARD_CERTIFICATION" | "REPLAY_CERTIFICATION" | "LINEAGE_CERTIFICATION" | "INTEGRITY_CERTIFICATION" | "SECURITY_CERTIFICATION" | "FINAL_VISIBILITY_CERTIFICATION";
  state: GovernanceVisibilityCertificationState;
  tests_passed: number;
  tests_failed: number;
  mandatory_passed: boolean;
  findings: readonly GovernanceVisibilityCertificationFailure[];
  evidence_refs: readonly string[];
  stage_hash: string;
}>;

export type GovernanceVisibilityEvidencePackage = Readonly<{
  evidence_package_id: string;
  dashboard_snapshot_hash: string;
  replay_viewer_hash: string;
  lineage_explorer_hash: string;
  integrity_viewer_hash: string;
  api_verification_hash: string;
  audit_refs: readonly string[];
  evidence_hash: string;
}>;

export type GovernanceVisibilityProductionReadiness = Readonly<{
  operational_readiness: GovernanceVisibilityCertificationState;
  certification_complete: boolean;
  remaining_risks: readonly GovernanceVisibilityCertificationFailure[];
  deployment_eligible: boolean;
  governance_approval_status: "APPROVED_FOR_PRODUCTION" | "LIMITED_CERTIFICATION_MODE" | "BLOCKED";
  readiness_hash: string;
}>;

export type GovernanceVisibilityCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "7K.5";
  schema_version: "governance-visibility-certification/v7K.5";
  certification_timestamp: string;
  tenant_id: string;
  mission_id: string;
  operator_id: string;
  certification_state: GovernanceVisibilityCertificationState;
  read_only: true;
  advisory_only: true;
  mutation_allowed: false;
  dashboard_hash: string;
  replay_viewer_hash: string;
  lineage_explorer_hash: string;
  integrity_viewer_hash: string;
  stages: readonly GovernanceVisibilityCertificationStage[];
  certification_tests: readonly GovernanceVisibilityCertificationTestResult[];
  mandatory_tests_passed: boolean;
  optional_tests_passed: boolean;
  failed_tests: readonly GovernanceVisibilityCertificationTestResult[];
  outstanding_findings: readonly GovernanceVisibilityCertificationFailure[];
  determinism_verified: boolean;
  replay_verified: boolean;
  explainability_complete: boolean;
  security_assessment: "PASS" | "FAIL";
  visibility_coverage: "COMPLETE" | "PARTIAL" | "FAILED";
  evidence_package: GovernanceVisibilityEvidencePackage;
  production_readiness: GovernanceVisibilityProductionReadiness;
  certification_signature: string;
  report_hash: string;
}>;

export type GovernanceVisibilityCertificationInput = Readonly<{
  scenario?: GovernanceVisibilityCertificationScenario;
  tenant_id?: string;
  mission_id?: string;
  operator_id?: string;
}>;

export type GovernanceVisibilityCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  certification_state: GovernanceVisibilityCertificationState;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  stages: readonly GovernanceVisibilityCertificationStage["stage_name"][];
  production_eligible: boolean;
  outstanding_findings: readonly GovernanceVisibilityCertificationFailure[];
  report_hash: string;
}>;
