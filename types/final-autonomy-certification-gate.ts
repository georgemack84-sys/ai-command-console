import type { AutonomyCertificationContractReport } from "@/types/autonomy-certification-contract";
import type { DeterministicValidationReport } from "@/types/deterministic-validation-engine";
import type { SecurityGovernanceValidationReport } from "@/types/security-governance-validation-engine";
import type { ReplayIntegrityCertificationReport } from "@/types/replay-integrity-certification-engine";

export type FinalAutonomyCertificationState = "REGISTERED" | "COLLECTING_EVIDENCE" | "VERIFYING_SUBSYSTEMS" | "DETERMINISTIC_VALIDATION" | "SECURITY_VALIDATION" | "REPLAY_VALIDATION" | "INTEGRITY_VALIDATION" | "CONSISTENCY_VERIFICATION" | "RISK_ASSESSMENT" | "SCORING" | "FINAL_REVIEW" | "CERTIFIED";
export type FinalAutonomyDecision = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type FinalAutonomyDomain = "PLANNING" | "ORCHESTRATION" | "DELEGATION" | "SUPERVISION" | "EXECUTION_ASSURANCE" | "REPLAY" | "INTEGRITY" | "GOVERNANCE" | "CONSTITUTIONAL" | "AUTHORITY" | "VISIBILITY" | "TENANT" | "FAIL_CLOSED" | "EVIDENCE";

export type FinalAutonomyScenario =
  | "BASELINE"
  | "MINOR_METADATA_GAP"
  | "PLANNING_NONDETERMINISTIC"
  | "ORCHESTRATION_NONDETERMINISTIC"
  | "DELEGATION_NONDETERMINISTIC"
  | "SUPERVISION_NONDETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_FAILURE"
  | "REPLAY_DIVERGENCE"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "HASH_MISMATCH"
  | "LINEAGE_BREAK"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "PRIVILEGE_ESCALATION"
  | "UNAUTHORIZED_EXECUTION"
  | "POLICY_COMPLIANCE_FAILURE"
  | "HIDDEN_EXECUTION"
  | "HIDDEN_GOVERNANCE_STATE"
  | "HIDDEN_AUTHORITY_STATE"
  | "CONFIDENCE_MISMATCH"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_EXECUTION"
  | "CROSS_TENANT_REPLAY"
  | "CROSS_TENANT_VISIBILITY"
  | "FAIL_OPEN_BEHAVIOR"
  | "INCOMPLETE_EVIDENCE"
  | "MUTABLE_EVIDENCE";

export type FinalAutonomyFailure =
  | "MINOR_METADATA_GAP"
  | "CERTIFICATION_CONTRACT_MISSING"
  | "CERTIFICATION_SCHEMA_INVALID"
  | "PLANNING_NONDETERMINISTIC"
  | "PLANNING_REPLAY_NOT_REPRODUCIBLE"
  | "ORCHESTRATION_NONDETERMINISTIC"
  | "ORCHESTRATION_REPLAY_NOT_REPRODUCIBLE"
  | "DELEGATION_NONDETERMINISTIC"
  | "DELEGATION_REPLAY_NOT_REPRODUCIBLE"
  | "SUPERVISION_NONDETERMINISTIC"
  | "SUPERVISION_REPLAY_NOT_REPRODUCIBLE"
  | "EXECUTION_ASSURANCE_NONDETERMINISTIC"
  | "REPLAY_NOT_DETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_INCOMPLETE"
  | "REPLAY_DIVERGENCE_DETECTED"
  | "INTEGRITY_HASHES_NOT_REPRODUCIBLE"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "HISTORICAL_TRUTH_NOT_PRESERVED"
  | "LINEAGE_INCOMPLETE"
  | "LINEAGE_BREAK_DETECTED"
  | "GOVERNANCE_ENFORCEMENT_FAILED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "CONSTITUTIONAL_COMPLIANCE_FAILED"
  | "CONSTITUTIONAL_VIOLATION_DETECTED"
  | "AUTHORITY_ENFORCEMENT_FAILED"
  | "PRIVILEGE_ESCALATION_DETECTED"
  | "UNAUTHORIZED_EXECUTION_DETECTED"
  | "EXECUTION_BOUNDARY_ENFORCEMENT_FAILED"
  | "OPERATOR_APPROVAL_ENFORCEMENT_FAILED"
  | "POLICY_COMPLIANCE_FAILED"
  | "HIDDEN_EXECUTION_DETECTED"
  | "HIDDEN_GOVERNANCE_STATE_DETECTED"
  | "HIDDEN_AUTHORITY_STATE_DETECTED"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "REPLAY_VISIBILITY_INCOMPLETE"
  | "INTEGRITY_VISIBILITY_INCOMPLETE"
  | "CONFIDENCE_NOT_REPRODUCIBLE"
  | "CONFIDENCE_MISMATCH_DETECTED"
  | "TENANT_ISOLATION_FAILED"
  | "CROSS_TENANT_EXECUTION_DETECTED"
  | "CROSS_TENANT_REPLAY_DETECTED"
  | "CROSS_TENANT_VISIBILITY_DETECTED"
  | "FAIL_CLOSED_BEHAVIOR_FAILED"
  | "FAIL_OPEN_BEHAVIOR_DETECTED"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE"
  | "CERTIFICATION_EVIDENCE_MUTABLE";

export type FinalAutonomyCertificationResult = Readonly<{
  result_id: string;
  domain: FinalAutonomyDomain;
  score: number;
  status: "PASS" | "FAIL";
  detected_failure: FinalAutonomyFailure | null;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type FinalAutonomyCertificationTest = Readonly<{
  test_id: string;
  name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  mandatory: boolean;
  failure_reason: FinalAutonomyFailure | null;
  evidence_refs: readonly string[];
  test_hash: string;
}>;

export type FinalAutonomyEvidence = Readonly<{
  evidence_id: string;
  source: string;
  evidence_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  immutable: boolean;
  evidence_hash: string;
}>;

export type FinalAutonomyCertificationReport = Readonly<{
  certification_id: string;
  certification_version: "final-autonomy-certification-gate/v8K.5";
  phase: "8";
  subphase: "8K.5";
  tenant_id: string;
  mission_id: string;
  autonomy_version: "controlled-autonomy/v8";
  certification_timestamp: string;
  overall_state: FinalAutonomyDecision;
  overall_score: number;
  planning_score: number;
  orchestration_score: number;
  delegation_score: number;
  supervision_score: number;
  replay_score: number;
  integrity_score: number;
  governance_score: number;
  constitutional_score: number;
  authority_score: number;
  visibility_score: number;
  tenant_score: number;
  fail_closed_score: number;
  deterministic_validation: DeterministicValidationReport;
  security_validation: SecurityGovernanceValidationReport;
  replay_validation: ReplayIntegrityCertificationReport;
  integrity_validation: ReplayIntegrityCertificationReport;
  certification_contract: AutonomyCertificationContractReport;
  certification_results: readonly FinalAutonomyCertificationResult[];
  certification_tests: readonly FinalAutonomyCertificationTest[];
  detected_failures: readonly FinalAutonomyFailure[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  operator_required: boolean;
  approver: string | null;
  approval_timestamp: string | null;
  phase_9_authorized: boolean;
  production_deployment_authorized: boolean;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence: readonly FinalAutonomyEvidence[];
  lifecycle: readonly FinalAutonomyCertificationState[];
  metadata: Readonly<Record<string, string>>;
  report_hash: string;
}>;

export type FinalAutonomyCertificationInput = Readonly<{
  scenario?: FinalAutonomyScenario;
}>;

export type FinalAutonomyCertificationValidationResult = Readonly<{
  certification_id: string | null;
  valid: boolean;
  report_hash_valid: boolean;
  evidence_complete: boolean;
  phase_9_authorized: boolean;
  failures: readonly FinalAutonomyFailure[];
  validation_hash: string;
}>;

export type FinalAutonomyCertificationObservabilitySurface = Readonly<{
  certification_id: string;
  overall_state: FinalAutonomyDecision;
  overall_score: number;
  total_tests: number;
  passed_tests: number;
  failed_tests: number;
  failures: readonly FinalAutonomyFailure[];
  risks: readonly string[];
  operator_required: boolean;
  phase_9_authorized: boolean;
  production_deployment_authorized: boolean;
  report_hash: string;
}>;
