import type { GovernanceReplayStatePackage, GovernanceStateValidationResult } from "@/types/governance-state-reconstruction";

export type GovernanceOutputVerificationState = "VERIFIED" | "MISMATCH" | "INCOMPLETE" | "INVALID";

export type GovernanceOutputVerificationScenario =
  | "BASELINE"
  | "STATE_PACKAGE_INVALID"
  | "GOVERNANCE_DECISION_DIFFERS"
  | "POLICY_EVALUATION_MISMATCH"
  | "COMPLIANCE_RESULT_DIFFERS"
  | "RISK_CALCULATION_DIFFERS"
  | "RECOMMENDATION_OUTPUT_DIFFERS"
  | "ESCALATION_ROUTING_DIFFERS"
  | "EXPLAINABILITY_DIFFERS"
  | "CONFIDENCE_VALUE_DIFFERS"
  | "LINEAGE_GRAPH_DIFFERS"
  | "REPLAY_HASH_MISMATCH"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "VERSION_MISMATCH"
  | "TENANT_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "OUTPUT_INCOMPLETE";

export type GovernanceOutputFailureReason =
  | "STATE_PACKAGE_INVALID"
  | "GOVERNANCE_DECISION_MISMATCH"
  | "POLICY_EVALUATION_MISMATCH"
  | "COMPLIANCE_RESULT_MISMATCH"
  | "RISK_CALCULATION_MISMATCH"
  | "RECOMMENDATION_OUTPUT_MISMATCH"
  | "ESCALATION_ROUTING_MISMATCH"
  | "EXPLAINABILITY_MISMATCH"
  | "CONFIDENCE_VALUE_MISMATCH"
  | "LINEAGE_GRAPH_MISMATCH"
  | "REPLAY_HASH_MISMATCH"
  | "INTEGRITY_VERIFICATION_FAILURE"
  | "VERSION_MISMATCH"
  | "TENANT_MISMATCH"
  | "CONSTITUTIONAL_MISMATCH"
  | "AUTHORITY_MISMATCH"
  | "OUTPUT_INCOMPLETE"
  | "VERIFICATION_REPORT_HASH_MISMATCH";

export type GovernanceOutputCategory =
  | "GOVERNANCE_DECISION"
  | "POLICY"
  | "COMPLIANCE"
  | "RISK"
  | "RECOMMENDATION"
  | "ESCALATION"
  | "EXPLAINABILITY"
  | "CONFIDENCE"
  | "LINEAGE"
  | "INTEGRITY";

export type GovernanceOutputComparison = Readonly<{
  comparison_id: string;
  category: GovernanceOutputCategory;
  original_ref: string;
  replayed_ref: string;
  original_hash: string;
  replayed_hash: string;
  match: boolean;
  differences: readonly string[];
  comparison_hash: string;
}>;

export type GovernanceOutputAuditEntry = Readonly<{
  audit_id: string;
  governance_replay_id: string;
  verification_timestamp: string;
  compared_artifacts: readonly string[];
  detected_mismatches: readonly GovernanceOutputFailureReason[];
  verification_duration_ms: number;
  integrity_status: "VERIFIED" | "FAILED";
  operator_identity: string;
  certification_recommendation: "CERTIFY_REPLAY" | "BLOCK_CERTIFICATION";
  audit_hash: string;
}>;

export type GovernanceOutputVerificationReport = Readonly<{
  verification_id: string;
  phase_version: "7H.4";
  schema_version: "governance-output-verification/v7H.4";
  verification_state: GovernanceOutputVerificationState;
  replay_state_package: GovernanceReplayStatePackage;
  replay_state_validation: GovernanceStateValidationResult;
  replay_identity: Readonly<{
    governance_replay_id: string;
    original_execution_reference: string;
    replay_execution_reference: string;
    replay_version: string;
  }>;
  governance_decision_comparison: GovernanceOutputComparison;
  policy_comparison: GovernanceOutputComparison;
  compliance_comparison: GovernanceOutputComparison;
  risk_comparison: GovernanceOutputComparison;
  recommendation_comparison: GovernanceOutputComparison;
  escalation_comparison: GovernanceOutputComparison;
  explainability_comparison: GovernanceOutputComparison;
  confidence_comparison: GovernanceOutputComparison;
  lineage_comparison: GovernanceOutputComparison;
  integrity_comparison: GovernanceOutputComparison;
  comparisons: readonly GovernanceOutputComparison[];
  detected_differences: readonly GovernanceOutputFailureReason[];
  certification_recommendation: "CERTIFY_REPLAY" | "BLOCK_CERTIFICATION";
  audit_log: readonly GovernanceOutputAuditEntry[];
  verification_report_hash: string;
}>;

export type GovernanceOutputVerificationInput = Readonly<{
  scenario?: GovernanceOutputVerificationScenario;
  state_package?: GovernanceReplayStatePackage;
  tenant_id?: string;
  mission_id?: string;
  replay_requestor?: string;
}>;

export type GovernanceOutputValidationError = Readonly<{
  code: `GOV-${string}`;
  reason: GovernanceOutputFailureReason;
  field: string;
  message: string;
}>;

export type GovernanceOutputValidationResult = Readonly<{
  verification_id: string | null;
  validation_state: "VALID" | "INVALID";
  replay_outputs_verified: boolean;
  state_package_valid: boolean;
  exact_match: boolean;
  deterministic_ordering: boolean;
  integrity_valid: boolean;
  confidence_valid: boolean;
  lineage_valid: boolean;
  version_consistent: boolean;
  tenant_isolated: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  errors: readonly GovernanceOutputValidationError[];
  validation_hash: string;
}>;

export type GovernanceOutputObservabilitySurface = Readonly<{
  verification_id: string;
  verification_state: GovernanceOutputVerificationState;
  replay_outputs_verified: boolean;
  comparison_count: number;
  matched_comparisons: number;
  mismatched_comparisons: number;
  certification_recommendation: GovernanceOutputVerificationReport["certification_recommendation"];
  failures: readonly GovernanceOutputFailureReason[];
  advisory_only_notice: string;
}>;
