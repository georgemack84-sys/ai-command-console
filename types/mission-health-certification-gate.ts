export type MissionHealthCertificationState = "INITIALIZING" | "DISCOVERING_COMPONENTS" | "VALIDATING_CONTRACTS" | "RUNNING_CERTIFICATION_TESTS" | "VERIFYING_REPLAY" | "VERIFYING_GOVERNANCE" | "VERIFYING_SECURITY" | "GENERATING_REPORT" | "CERTIFIED" | "REJECTED";
export type MissionHealthCertificationDecision = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type CertificationTestStatus = "PASS" | "FAIL" | "WARN";
export type CertificationDomainStatus = "VERIFIED" | "WARNING" | "FAILED";
export type MissionHealthComponentName = "Mission Health Contract" | "Subsystem Health Collection" | "Mission Health Scoring" | "Trend Intelligence" | "Mission Health Timeline" | "Health Explainability" | "Mission Health Recommendation Engine";

export type MissionHealthCertificationScenario =
  | "BASELINE"
  | "COMPONENT_FAILURE"
  | "REPLAY_FAILURE"
  | "GOVERNANCE_BYPASS"
  | "AUTHORITY_ESCALATION"
  | "INTEGRITY_FAILURE"
  | "TENANT_ISOLATION_FAILURE"
  | "ADVISORY_ONLY_VIOLATION"
  | "EXPLAINABILITY_INCOMPLETE"
  | "RECOMMENDATIONS_NON_REPRODUCIBLE"
  | "IMMUTABLE_HISTORY_FAILURE";

export type MissionHealthCertificationFailure =
  | "COMPONENT_VALIDATION_FAILED"
  | "REPLAY_VALIDATION_FAILED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "TENANT_ISOLATION_FAILED"
  | "ADVISORY_ONLY_VIOLATION"
  | "EXPLAINABILITY_INCOMPLETE"
  | "RECOMMENDATIONS_NON_REPRODUCIBLE"
  | "IMMUTABLE_HISTORY_FAILED"
  | "CERTIFICATION_SUITE_FAILED";

export type MissionHealthComponentResult = Readonly<{
  component: MissionHealthComponentName;
  contract_version: string;
  valid: boolean;
  replay_deterministic: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  integrity_valid: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  evidence_reference: string;
  result_hash: string;
}>;

export type MissionHealthCertificationTestResult = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS";
  actual: CertificationTestStatus;
  component: MissionHealthComponentName | "Mission Health Certification";
  evidence_reference: string;
  test_hash: string;
}>;

export type MissionHealthCertificationReport = Readonly<{
  certification_id: string;
  phase: "Phase 8ALT.4 - Mission Health Intelligence";
  overall_state: MissionHealthCertificationDecision;
  overall_score: number;
  overall_confidence: number;
  tests_passed: number;
  tests_failed: number;
  warnings: readonly string[];
  component_results: readonly MissionHealthComponentResult[];
  replay_validation: CertificationDomainStatus;
  governance_validation: CertificationDomainStatus;
  authority_validation: CertificationDomainStatus;
  integrity_validation: CertificationDomainStatus;
  security_validation: CertificationDomainStatus;
  recommendation: string;
  operator_signoff_required: boolean;
  timestamp: string;
  report_hash: string;
}>;

export type MissionHealthCertification = Readonly<{
  certification_id: string;
  mission_id: string;
  tenant_id: string;
  certification_state: MissionHealthCertificationState;
  certification_version: "mission-health-certification-gate/v8ALT.4.8";
  phase: "Phase 8ALT.4 - Mission Health Intelligence";
  component_results: readonly MissionHealthComponentResult[];
  test_results: readonly MissionHealthCertificationTestResult[];
  overall_score: number;
  overall_confidence: number;
  replay_status: CertificationDomainStatus;
  governance_status: CertificationDomainStatus;
  authority_status: CertificationDomainStatus;
  integrity_status: CertificationDomainStatus;
  security_status: CertificationDomainStatus;
  recommendation: string;
  certification_timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  report: MissionHealthCertificationReport;
  advisory_only: true;
  deployment_authorized: boolean;
  mission_actions_executed: boolean;
  subsystem_health_modified: boolean;
  certification_evidence_modified: boolean;
  governance_bypassed: boolean;
  authority_escalated: boolean;
  policy_changed: boolean;
  autonomous_intervention_authorized: boolean;
  failures: readonly MissionHealthCertificationFailure[];
  certification_hash: string;
}>;

export type MissionHealthCertificationInput = Readonly<{
  scenario?: MissionHealthCertificationScenario;
  mission_id?: string;
  tenant_id?: string;
}>;

export type MissionHealthCertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  certification_contract_valid: boolean;
  components_valid: boolean;
  tests_passed: boolean;
  replay_verified: boolean;
  governance_verified: boolean;
  authority_verified: boolean;
  integrity_verified: boolean;
  security_verified: boolean;
  explainability_complete: boolean;
  recommendations_reproducible: boolean;
  immutable_history_verified: boolean;
  advisory_only_enforced: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  failures: readonly MissionHealthCertificationFailure[];
  validation_hash: string;
}>;

export type MissionHealthCertificationReplayResult = Readonly<{
  replay_reference: string;
  certification_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type MissionHealthCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  mission_id: string;
  tenant_id: string;
  overall_state: MissionHealthCertificationDecision;
  overall_score: number;
  tests_passed: number;
  tests_failed: number;
  deployment_authorized: boolean;
  advisory_only: true;
  certification_hash: string;
}>;

export type MissionHealthCertificationGateContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "mission-health-certification-gate/v8ALT.4.8";
    principles: readonly string[];
    certification_states: readonly MissionHealthCertificationState[];
    decisions: readonly MissionHealthCertificationDecision[];
    domain_statuses: readonly CertificationDomainStatus[];
    advisory_only: true;
  }>;
  certification: MissionHealthCertification;
  validation: MissionHealthCertificationValidationResult;
  replay: MissionHealthCertificationReplayResult;
  observability: MissionHealthCertificationObservabilitySurface;
}>;
