import type { AutonomyCertificationComponent } from "@/types/autonomy-certification-contract";
import type { DeterministicValidationReport } from "@/types/deterministic-validation-engine";

export type SecurityGovernanceValidationState = "REGISTERED" | "IDENTITY_VALIDATION" | "GOVERNANCE_VALIDATION" | "CONSTITUTIONAL_VALIDATION" | "AUTHORITY_VALIDATION" | "POLICY_VALIDATION" | "BOUNDARY_VALIDATION" | "TENANT_VALIDATION" | "VISIBILITY_VALIDATION" | "FAIL_CLOSED_VALIDATION" | "ASSESSMENT" | "COMPLETE";
export type SecurityGovernanceDomain = "GOVERNANCE" | "CONSTITUTIONAL" | "AUTHORITY" | "POLICY" | "SECURITY" | "BOUNDARY" | "TENANT" | "VISIBILITY" | "FAIL_CLOSED";
export type SecurityGovernanceStatus = "PASS" | "FAIL";
export type SecurityRiskLevel = "NONE" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type SecurityGovernanceScenario =
  | "BASELINE"
  | "GOVERNANCE_VALIDATION_FAILURE"
  | "CONSTITUTIONAL_VALIDATION_FAILURE"
  | "AUTHORITY_VALIDATION_FAILURE"
  | "POLICY_VALIDATION_FAILURE"
  | "SECURITY_BOUNDARY_VIOLATION"
  | "PRIVILEGE_ESCALATION"
  | "UNAUTHORIZED_EXECUTION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "HIDDEN_EXECUTION_DETECTED"
  | "HIDDEN_GOVERNANCE_STATE_DETECTED"
  | "TENANT_ISOLATION_FAILURE"
  | "CROSS_TENANT_ACCESS_DETECTED"
  | "REPLAY_EVIDENCE_MODIFIED"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "FAIL_OPEN_BEHAVIOR_DETECTED"
  | "INCOMPLETE_CERTIFICATION_EVIDENCE";

export type SecurityGovernanceViolation =
  | "GOVERNANCE_VALIDATION_FAILED"
  | "CONSTITUTIONAL_VALIDATION_FAILED"
  | "AUTHORITY_VALIDATION_FAILED"
  | "POLICY_VALIDATION_FAILED"
  | "SECURITY_BOUNDARY_VIOLATION_DETECTED"
  | "PRIVILEGE_ESCALATION_DETECTED"
  | "UNAUTHORIZED_EXECUTION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "CONSTITUTIONAL_BYPASS_DETECTED"
  | "HIDDEN_EXECUTION_DETECTED"
  | "HIDDEN_GOVERNANCE_STATE_DETECTED"
  | "TENANT_ISOLATION_FAILURE_DETECTED"
  | "CROSS_TENANT_ACCESS_DETECTED"
  | "REPLAY_EVIDENCE_MODIFIED"
  | "INTEGRITY_VERIFICATION_FAILED"
  | "FAIL_OPEN_BEHAVIOR_DETECTED"
  | "CERTIFICATION_EVIDENCE_INCOMPLETE";

export type SecurityGovernanceDomainResult = Readonly<{
  result_id: string;
  domain: SecurityGovernanceDomain;
  status: SecurityGovernanceStatus;
  score: number;
  detected_violation: SecurityGovernanceViolation | null;
  risk_level: SecurityRiskLevel;
  explanation: string;
  evidence_refs: readonly string[];
  result_hash: string;
}>;

export type SecurityGovernanceEvidence = Readonly<{
  evidence_id: string;
  domain: SecurityGovernanceDomain;
  tenant_id: string;
  mission_id: string;
  governance_reference: string;
  constitutional_reference: string;
  authority_reference: string;
  policy_reference: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  immutable_reference: string;
  evidence_hash: string;
}>;

export type SecurityGovernanceValidationReport = Readonly<{
  validation_id: string;
  engine_version: "security-governance-validation-engine/v8K.3";
  tenant_id: string;
  mission_id: string;
  component: AutonomyCertificationComponent;
  validation_scope: readonly SecurityGovernanceDomain[];
  governance_validation: SecurityGovernanceDomainResult;
  constitutional_validation: SecurityGovernanceDomainResult;
  authority_validation: SecurityGovernanceDomainResult;
  policy_validation: SecurityGovernanceDomainResult;
  security_validation: SecurityGovernanceDomainResult;
  boundary_validation: SecurityGovernanceDomainResult;
  tenant_validation: SecurityGovernanceDomainResult;
  visibility_validation: SecurityGovernanceDomainResult;
  fail_closed_validation: SecurityGovernanceDomainResult;
  validation_state: SecurityGovernanceValidationState;
  overall_security_score: number;
  detected_violations: readonly SecurityGovernanceViolation[];
  detected_risks: readonly string[];
  recommendations: readonly string[];
  operator_required: boolean;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  evidence: readonly SecurityGovernanceEvidence[];
  deterministic_validation: DeterministicValidationReport;
  validation_timestamp: string;
  metadata: Readonly<Record<string, string>>;
  report_hash: string;
}>;

export type SecurityGovernanceValidationInput = Readonly<{
  scenario?: SecurityGovernanceScenario;
  component?: AutonomyCertificationComponent;
}>;

export type SecurityGovernanceValidationResult = Readonly<{
  validation_id: string | null;
  valid: boolean;
  report_hash_valid: boolean;
  evidence_complete: boolean;
  violations: readonly SecurityGovernanceViolation[];
  validation_hash: string;
}>;

export type SecurityGovernanceObservabilitySurface = Readonly<{
  validation_id: string;
  validation_state: SecurityGovernanceValidationState;
  overall_security_score: number;
  violations: readonly SecurityGovernanceViolation[];
  risks: readonly string[];
  operator_required: boolean;
  evidence_records: number;
  report_hash: string;
}>;
