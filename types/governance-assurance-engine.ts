import type { RuntimeAssurancePackage } from "@/types/runtime-assurance-engine";

export type GovernanceAssuranceState =
  | "CREATED"
  | "INITIALIZING"
  | "VERIFYING_CONSTITUTION"
  | "VERIFYING_AUTHORITY"
  | "VERIFYING_POLICIES"
  | "VERIFYING_COMPLIANCE"
  | "VERIFYING_APPROVALS"
  | "ASSESSING_GOVERNANCE"
  | "ACTIVE"
  | "COMPLIANT"
  | "WARNING"
  | "POLICY_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "APPROVAL_REQUIRED"
  | "ESCALATION_RECOMMENDED"
  | "COMPLETED"
  | "FAILED";

export type GovernanceHealthLevel = "TRUSTED" | "COMPLIANT" | "STABLE" | "WATCH" | "NON_COMPLIANT" | "HIGH_RISK" | "CRITICAL";

export type GovernanceRecommendedAction =
  | "CONTINUE"
  | "REQUEST_APPROVAL"
  | "INTENSIFY_GOVERNANCE_MONITORING"
  | "RECOMMEND_ESCALATION"
  | "RECOMMEND_TERMINATION"
  | "FAIL_CLOSED";

export type GovernanceAssuranceFailureReason =
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "HIDDEN_EXECUTION"
  | "UNAUTHORIZED_EXECUTION_PATH"
  | "CONSTITUTIONAL_DRIFT"
  | "AUTHORITY_ESCALATION"
  | "EXPIRED_AUTHORITY"
  | "UNAUTHORIZED_DELEGATION"
  | "PRIVILEGE_ABUSE"
  | "INVALID_EXECUTION_AUTHORITY"
  | "POLICY_VIOLATION"
  | "POLICY_CONFLICT"
  | "POLICY_BYPASS"
  | "OUTDATED_POLICY_REFERENCE"
  | "INCONSISTENT_POLICY_APPLICATION"
  | "COMPLIANCE_FAILURE"
  | "INCOMPLETE_EVIDENCE"
  | "MISSING_AUDIT_RECORD"
  | "REPORTING_DEFICIENCY"
  | "GOVERNANCE_INCONSISTENCY"
  | "REVOKED_APPROVAL"
  | "MISSING_APPROVAL"
  | "EXPIRED_APPROVAL"
  | "INVALID_APPROVAL_CHAIN"
  | "UNAUTHORIZED_APPROVAL"
  | "TENANT_ISOLATION_VIOLATION"
  | "RUNTIME_ASSURANCE_NOT_READY"
  | "ASSURANCE_NOT_ADVISORY"
  | "INTEGRITY_HASH_MISMATCH";

export type GovernanceAssuranceScenario =
  | "BASELINE"
  | GovernanceAssuranceFailureReason
  | "HASH_MISMATCH";

export type GovernanceVerificationResult = Readonly<{
  verification_id: string;
  domain: "CONSTITUTION" | "AUTHORITY" | "POLICY" | "COMPLIANCE" | "APPROVAL";
  status: "PASS" | "FAIL";
  score: number;
  findings: readonly GovernanceAssuranceFailureReason[];
  evidence_reference: string;
  verification_hash: string;
}>;

export type GovernanceComplianceScore = Readonly<{
  score_id: string;
  constitution_score: number;
  authority_score: number;
  policy_score: number;
  compliance_score: number;
  approval_score: number;
  evidence_score: number;
  overall_score: number;
  status: GovernanceHealthLevel;
  score_hash: string;
}>;

export type AuthorityValidationResult = Readonly<{
  authority_validation_id: string;
  authority_verified: boolean;
  delegated_authority_scope: string;
  authority_limitations: readonly string[];
  certification_status: "CERTIFIED" | "INVALID" | "EXPIRED" | "ESCALATED";
  approval_chain: readonly string[];
  expiration_analysis: "ACTIVE" | "EXPIRED" | "REVOKED" | "INCOMPLETE";
  findings: readonly GovernanceAssuranceFailureReason[];
  validation_hash: string;
}>;

export type GovernanceAssuranceReport = Readonly<{
  report_id: string;
  constitution_status: "COMPLIANT" | "VIOLATION";
  authority_status: "VALID" | "INVALID";
  policy_status: "COMPLIANT" | "VIOLATION";
  compliance_status: "COMPLIANT" | "NON_COMPLIANT";
  approval_status: "VALID" | "REQUIRED" | "INVALID";
  governance_health: GovernanceHealthLevel;
  governance_recommendation: GovernanceRecommendedAction;
  detected_violations: readonly GovernanceAssuranceFailureReason[];
  report_hash: string;
}>;

export type GovernanceAssuranceEvidence = Readonly<{
  governance_assurance_id: string;
  tenant_id: string;
  mission_id: string;
  execution_id: string;
  constitution_status: "COMPLIANT" | "VIOLATION";
  authority_status: "VALID" | "INVALID";
  policy_status: "COMPLIANT" | "VIOLATION";
  compliance_status: "COMPLIANT" | "NON_COMPLIANT";
  approval_status: "VALID" | "REQUIRED" | "INVALID";
  governance_health: GovernanceHealthLevel;
  compliance_score: number;
  detected_violations: readonly GovernanceAssuranceFailureReason[];
  recommended_action: GovernanceRecommendedAction;
  operator_required: boolean;
  evaluation_timestamp: string;
  lineage_reference: string;
  replay_reference: string;
  evidence_reference: string;
  integrity_hash: string;
}>;

export type GovernanceAssuranceValidationResult = Readonly<{
  validation_id: string;
  governance_package_id: string;
  validation_state: "PASS" | "FAIL";
  failures: readonly GovernanceAssuranceFailureReason[];
  constitution_valid: boolean;
  authority_valid: boolean;
  policies_valid: boolean;
  compliance_valid: boolean;
  approvals_valid: boolean;
  runtime_assurance_ready: boolean;
  tenant_isolated: boolean;
  advisory_only: boolean;
  evidence_complete: boolean;
  integrity_verified: boolean;
  ready_for_recovery_intervention: boolean;
  validation_hash: string;
}>;

export type GovernanceAssuranceReplayResult = Readonly<{
  replay_id: string;
  governance_package_id: string;
  reconstructed_pipeline: readonly GovernanceAssuranceState[];
  reconstructed_health: GovernanceHealthLevel;
  reconstructed_action: GovernanceRecommendedAction;
  reconstructed_failures: readonly GovernanceAssuranceFailureReason[];
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: GovernanceAssuranceFailureReason | null;
  replay_hash: string;
}>;

export type GovernanceAssurancePackage = Readonly<{
  package_id: string;
  engine_version: "governance-assurance-engine/v8E.3";
  source_runtime_package: RuntimeAssurancePackage;
  pipeline_state: GovernanceAssuranceState;
  verification_results: readonly GovernanceVerificationResult[];
  compliance_score: GovernanceComplianceScore;
  authority_validation: AuthorityValidationResult;
  governance_report: GovernanceAssuranceReport;
  assurance_evidence: GovernanceAssuranceEvidence;
  validation: GovernanceAssuranceValidationResult;
  replay: GovernanceAssuranceReplayResult;
  advisory_only: true;
  workflow_executed: false;
  approval_granted: false;
  governance_modified: false;
  constitution_modified: false;
  authority_modified: false;
  package_hash: string;
}>;

export type GovernanceAssuranceDashboardSurface = Readonly<{
  package_id: string;
  execution_id: string;
  governance_state: GovernanceAssuranceState;
  governance_health: GovernanceHealthLevel;
  compliance_score: number;
  recommended_action: GovernanceRecommendedAction;
  validation_state: "PASS" | "FAIL";
  detected_violations: readonly GovernanceAssuranceFailureReason[];
  operator_required: boolean;
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type GovernanceAssuranceFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "governance-assurance-engine/v8E.3";
    states: readonly GovernanceAssuranceState[];
    health_levels: readonly GovernanceHealthLevel[];
  }>;
  package: GovernanceAssurancePackage;
  dashboard: GovernanceAssuranceDashboardSurface;
}>;
