import type { MissionControlVisibilityCertificationReport } from "@/types/mission-control-visibility-certification-gate";

export type AutonomyCertificationState =
  | "REGISTERED"
  | "COLLECTING_EVIDENCE"
  | "VALIDATING"
  | "DETERMINISTIC_CHECK"
  | "REPLAY_CHECK"
  | "INTEGRITY_CHECK"
  | "GOVERNANCE_CHECK"
  | "AUTHORITY_CHECK"
  | "CONSTITUTIONAL_CHECK"
  | "VISIBILITY_CHECK"
  | "TENANT_CHECK"
  | "FAIL_CLOSED_CHECK"
  | "SCORING"
  | "CERTIFIED";

export type AutonomyCertificationDecision = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type AutonomyCertificationComponent = "PLANNING_ENGINE" | "EXECUTION_ORCHESTRATION" | "DELEGATION_INTELLIGENCE" | "EXECUTION_ASSURANCE" | "RUNTIME_SUPERVISION" | "BOUNDARY_ENFORCEMENT" | "REPLAY_FRAMEWORK" | "INTEGRITY_FRAMEWORK" | "QUERY_SEARCH" | "VISIBILITY_FRAMEWORK" | "CONTROLLED_AUTONOMY";
export type AutonomyCertificationDomain = "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "RUNTIME_SUPERVISION" | "REPLAY" | "INTEGRITY" | "GOVERNANCE" | "CONSTITUTIONAL" | "AUTHORITY" | "VISIBILITY" | "TENANT_ISOLATION" | "FAIL_CLOSED";
export type AutonomyCertificationValidationStatus = "PASS" | "WARNING" | "FAIL";

export type AutonomyCertificationScenario =
  | "BASELINE"
  | "MINOR_RECOMMENDATION_GAP"
  | "MISSING_CONTRACT"
  | "INVALID_SCHEMA"
  | "MISSING_IMMUTABLE_ID"
  | "MISSING_REPLAY_REFERENCE"
  | "MISSING_LINEAGE_REFERENCE"
  | "MISSING_INTEGRITY_HASH"
  | "MISSING_GOVERNANCE_REFERENCE"
  | "MISSING_CONSTITUTIONAL_REFERENCE"
  | "NONDETERMINISTIC_DECISION"
  | "REPLAY_NOT_REPRODUCIBLE"
  | "INTEGRITY_NOT_VERIFIED"
  | "GOVERNANCE_BYPASS"
  | "AUTHORITY_ESCALATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "VISIBILITY_NOT_CERTIFIED"
  | "CROSS_TENANT_EVIDENCE"
  | "FAIL_OPEN_CERTIFICATION"
  | "INCOMPLETE_EVIDENCE"
  | "HIDDEN_VALIDATION";

export type AutonomyCertificationFailure =
  | "MINOR_RECOMMENDATION_GAP"
  | "CERTIFICATION_CONTRACT_MISSING"
  | "CERTIFICATION_SCHEMA_INVALID"
  | "IMMUTABLE_IDENTIFIER_MISSING"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISSING"
  | "GOVERNANCE_REFERENCE_MISSING"
  | "CONSTITUTIONAL_REFERENCE_MISSING"
  | "CERTIFICATION_DECISION_NONDETERMINISTIC"
  | "REPLAY_VALIDATION_NOT_REPRODUCIBLE"
  | "INTEGRITY_VALIDATION_FAILED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "AUTHORITY_ESCALATION_DETECTED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "VISIBILITY_VALIDATION_FAILED"
  | "CROSS_TENANT_EVIDENCE_DETECTED"
  | "FAIL_CLOSED_VALIDATION_FAILED"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "HIDDEN_VALIDATION_DETECTED";

export type AutonomyCertificationDomainResult = Readonly<{
  domain: AutonomyCertificationDomain;
  status: AutonomyCertificationValidationStatus;
  score: number;
  explanation: string;
  evidence_refs: readonly string[];
  governance_reference: string;
  constitutional_reference: string;
  result_hash: string;
}>;

export type AutonomyCertificationEvidenceRecord = Readonly<{
  evidence_id: string;
  evidence_type: string;
  component: AutonomyCertificationComponent;
  tenant_id: string;
  mission_id: string;
  source_phase: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  governance_reference: string;
  constitutional_reference: string;
  integrity_hash: string;
  immutable_id: string;
  collected_at: string;
  evidence_hash: string;
}>;

export type AutonomyCertificationLifecycleRecord = Readonly<{
  lifecycle_id: string;
  states: readonly AutonomyCertificationState[];
  current_state: AutonomyCertificationState;
  valid_transitions: readonly string[];
  deterministic_transitioning: boolean;
  lifecycle_hash: string;
}>;

export type AutonomyCertificationRuleSet = Readonly<{
  rule_set_id: string;
  required_rules: readonly string[];
  prohibited_conditions: readonly string[];
  fail_closed_required: true;
  governance_supremacy_required: true;
  constitutional_compliance_required: true;
  tenant_isolation_required: true;
  rule_hash: string;
}>;

export type AutonomyCertificationTestResult = Readonly<{
  test_id: string;
  domain: AutonomyCertificationDomain;
  name: string;
  expected: "PASS";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: AutonomyCertificationFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type AutonomyCertificationContractReport = Readonly<{
  certification_id: string;
  contract_version: "autonomy-certification-contract/v8K.1";
  phase: "8K";
  subphase: "8K.1";
  component: AutonomyCertificationComponent;
  component_version: string;
  tenant_id: string;
  mission_id: string;
  certification_scope: readonly AutonomyCertificationComponent[];
  evaluation_timestamp: string;
  requested_by: string;
  certification_state: AutonomyCertificationState;
  certification_decision: AutonomyCertificationDecision;
  overall_score: number;
  deterministic_validation: AutonomyCertificationDomainResult;
  replay_validation: AutonomyCertificationDomainResult;
  integrity_validation: AutonomyCertificationDomainResult;
  governance_validation: AutonomyCertificationDomainResult;
  authority_validation: AutonomyCertificationDomainResult;
  constitutional_validation: AutonomyCertificationDomainResult;
  visibility_validation: AutonomyCertificationDomainResult;
  tenant_validation: AutonomyCertificationDomainResult;
  fail_closed_validation: AutonomyCertificationDomainResult;
  domain_results: readonly AutonomyCertificationDomainResult[];
  lifecycle: AutonomyCertificationLifecycleRecord;
  rule_set: AutonomyCertificationRuleSet;
  certification_tests: readonly AutonomyCertificationTestResult[];
  test_results: readonly AutonomyCertificationTestResult[];
  detected_failures: readonly AutonomyCertificationFailure[];
  warnings: readonly AutonomyCertificationFailure[];
  recommendations: readonly string[];
  operator_required: boolean;
  approver: string | null;
  approval_timestamp: string | null;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence: readonly AutonomyCertificationEvidenceRecord[];
  visibility_certification: MissionControlVisibilityCertificationReport;
  metadata: Readonly<Record<string, string>>;
  contract_hash: string;
}>;

export type AutonomyCertificationContractInput = Readonly<{
  scenario?: AutonomyCertificationScenario;
  component?: AutonomyCertificationComponent;
}>;

export type AutonomyCertificationContractValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  certification_decision: AutonomyCertificationDecision | null;
  mandatory_tests_passed: boolean;
  evidence_complete: boolean;
  contract_hash_valid: boolean;
  failures: readonly AutonomyCertificationFailure[];
  validation_hash: string;
}>;

export type AutonomyCertificationContractObservabilitySurface = Readonly<{
  certification_id: string;
  certification_decision: AutonomyCertificationDecision;
  certification_state: AutonomyCertificationState;
  overall_score: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  warnings: readonly AutonomyCertificationFailure[];
  failures: readonly AutonomyCertificationFailure[];
  operator_required: boolean;
  evidence_records: number;
  contract_hash: string;
}>;
