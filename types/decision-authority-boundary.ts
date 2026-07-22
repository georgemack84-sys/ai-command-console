import type { DecisionClassificationResult } from "@/types/decision-classification";
import type { DecisionLifecycleRepository } from "@/types/decision-lifecycle";
import type { DecisionType } from "@/types/decision-schema";

export type DecisionAuthorityLevel = "ADVISORY" | "OPERATOR_APPROVAL_REQUIRED" | "GOVERNANCE_APPROVAL_REQUIRED" | "CONSTITUTIONAL_REVIEW_REQUIRED" | "CERTIFICATION_REQUIRED";
export type DecisionAuthorityDomain = "CONSTITUTION" | "GOVERNANCE" | "OPERATOR" | "MISSION_CONFIGURATION" | "DECISION_ORCHESTRATION" | "RECOMMENDATION" | "CERTIFICATION";
export type DecisionAuthorityValidationStatus = "VALID" | "ESCALATION_REQUIRED" | "FAILED_CLOSED";
export type DecisionApprovalStage = "OPERATOR" | "GOVERNANCE" | "CONSTITUTION" | "CERTIFICATION";

export type DecisionAuthorityMatrixEntry = Readonly<{
  domain: DecisionAuthorityDomain;
  precedence: number;
  permitted: readonly string[];
  prohibited: readonly string[];
  runtime_mutable: false;
}>;

export type DecisionEscalationProfile = Readonly<{
  escalation_required: boolean;
  escalation_path: readonly DecisionApprovalStage[];
  escalation_reasons: readonly string[];
}>;

export type AuthorityBoundaryRecord = Readonly<{
  authority_id: string;
  orchestration_id: string;
  tenant_id: string;
  mission_id: string;
  decision_type: DecisionType;
  authority_level: DecisionAuthorityLevel;
  operator_required: boolean;
  governance_required: boolean;
  constitutional_required: boolean;
  certification_required: boolean;
  approval_chain: readonly DecisionApprovalStage[];
  escalation_profile: DecisionEscalationProfile;
  advisory_only: true;
  execution_authorized: false;
  self_approval_authorized: false;
  validation_status: DecisionAuthorityValidationStatus;
  replay_refs: readonly string[];
  lineage_refs: readonly string[];
  integrity_hash: string;
  created_at: string;
}>;

export type DecisionAuthorityFailure =
  | "AUTHORITY_LEVEL_MISSING"
  | "APPROVAL_CHAIN_INVALID"
  | "OPERATOR_APPROVAL_MISSING"
  | "GOVERNANCE_APPROVAL_MISSING"
  | "CONSTITUTIONAL_REVIEW_MISSING"
  | "CERTIFICATION_APPROVAL_MISSING"
  | "ESCALATION_PATH_INVALID"
  | "ADVISORY_ONLY_VIOLATION"
  | "UNAUTHORIZED_EXECUTION"
  | "PRIVILEGE_ESCALATION"
  | "SELF_AUTHORIZATION"
  | "SELF_CERTIFICATION"
  | "GOVERNANCE_BYPASS"
  | "CONSTITUTIONAL_BYPASS"
  | "OPERATOR_IMPERSONATION"
  | "TENANT_AUTHORITY_LEAK"
  | "HIDDEN_EXECUTION_PATH"
  | "REPLAY_REFERENCE_MISSING"
  | "LINEAGE_REFERENCE_MISSING"
  | "INTEGRITY_HASH_MISMATCH";

export type DecisionAuthorityValidationResult = Readonly<{
  validation_status: DecisionAuthorityValidationStatus;
  authority_id: string;
  failures: readonly DecisionAuthorityFailure[];
  checks: Readonly<{
    authority_level_exists: boolean;
    approval_chain_valid: boolean;
    operator_authority_recognized: boolean;
    governance_approval_present: boolean;
    constitutional_review_complete: boolean;
    certification_approval_present: boolean;
    escalation_path_valid: boolean;
    advisory_only_enforced: boolean;
    tenant_isolated: boolean;
    replay_ready: boolean;
    lineage_ready: boolean;
    integrity_valid: boolean;
  }>;
}>;

export type DecisionAuthorityReplayResult = Readonly<{
  authority_id: string;
  replay_valid: boolean;
  reconstructed_authority_level: DecisionAuthorityLevel;
  reconstructed_approval_chain: readonly DecisionApprovalStage[];
  reconstructed_escalation_path: readonly DecisionApprovalStage[];
  reconstructed_hash: string;
  expected_hash: string;
  failures: readonly DecisionAuthorityFailure[];
}>;

export type DecisionAuthorityInput = Readonly<{
  classification?: DecisionClassificationResult;
  lifecycle?: DecisionLifecycleRepository;
  authority_level?: DecisionAuthorityLevel;
  operator_approval_present?: boolean;
  governance_approval_present?: boolean;
  constitutional_review_complete?: boolean;
  certification_approval_present?: boolean;
  requested_operations?: readonly string[];
  actor_id?: string;
  tenant_id?: string;
  replay_refs?: readonly string[];
  lineage_refs?: readonly string[];
  scenario?: "BASELINE" | "EXECUTION_REQUEST" | "PRIVILEGE_ESCALATION" | "SELF_APPROVAL" | "SELF_CERTIFICATION" | "GOVERNANCE_BYPASS" | "CONSTITUTIONAL_BYPASS" | "OPERATOR_IMPERSONATION" | "TENANT_LEAK" | "HIDDEN_EXECUTION" | "MISSING_APPROVAL" | "REPLAY_MISMATCH";
}>;

export type DecisionAuthorityObservability = Readonly<{
  authority_validation_requests: number;
  approval_completion_rate: number;
  escalation_frequency: number;
  advisory_only_violations: number;
  unauthorized_execution_attempts: number;
  governance_overrides: number;
  constitutional_rejections: number;
  replay_mismatches: number;
  authority_validation_latency_ms: number;
  approval_chain_duration_ms: number;
}>;
