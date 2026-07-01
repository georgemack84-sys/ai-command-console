import type { AutonomyAuthorityDecision, AutonomyAuthorityRequest } from "@/types/autonomy-authority";
import type { AutonomyIdentityRecord } from "@/types/autonomy-identity";

export type ConstitutionalDecisionState = "APPROVED" | "DENIED";
export type ConstitutionalValidationState = "PASS" | "FAIL";
export type ConstitutionalRuleCategory = "MISSION" | "GOVERNANCE" | "POLICY" | "OPERATOR" | "TENANT" | "REPLAY" | "EVIDENCE" | "AUDIT" | "INTEGRITY";
export type ConstitutionalScenario =
  | "BASELINE"
  | "UNAUTHORIZED_EXECUTION"
  | "AUTHORITY_ESCALATION"
  | "POLICY_BYPASS"
  | "GOVERNANCE_BYPASS"
  | "HIDDEN_AUTONOMY"
  | "CROSS_TENANT"
  | "UNDOCUMENTED_EXECUTION"
  | "SELF_MODIFICATION"
  | "CONSTITUTION_MODIFICATION"
  | "MISSING_EVIDENCE"
  | "REPLAY_DIVERGENCE"
  | "AUDIT_GAP"
  | "INTEGRITY_MISMATCH";

export type ConstitutionalFailureReason =
  | "MISSION_SCOPE_VIOLATION"
  | "UNAUTHORIZED_MISSION_ACTION"
  | "MISSION_RULE_CONFLICT"
  | "GOVERNANCE_BYPASS"
  | "GOVERNANCE_SUPPRESSION"
  | "GOVERNANCE_OVERRIDE"
  | "POLICY_BYPASS"
  | "INVALID_POLICY_VERSION"
  | "POLICY_CONFLICT"
  | "OPERATOR_BYPASS"
  | "AUTONOMOUS_APPROVAL_SUBSTITUTION"
  | "UNAUTHORIZED_OPERATOR"
  | "CROSS_TENANT_ACCESS"
  | "SHARED_EXECUTION_STATE"
  | "SHARED_EVIDENCE"
  | "REPLAY_REFERENCE_MISSING"
  | "REPLAY_DIVERGENCE"
  | "EVIDENCE_MISSING"
  | "EVIDENCE_UNVERIFIABLE"
  | "AUDIT_RECORD_MISSING"
  | "AUDIT_HISTORY_INCOMPLETE"
  | "INTEGRITY_HASH_MISMATCH"
  | "FORGED_APPROVAL"
  | "UNAUTHORIZED_EXECUTION"
  | "AUTHORITY_ESCALATION"
  | "HIDDEN_AUTONOMY"
  | "UNDOCUMENTED_EXECUTION"
  | "SELF_MODIFICATION"
  | "CONSTITUTION_MODIFICATION"
  | "FAIL_CLOSED";

export type ConstitutionalRequest = Readonly<{
  constitutional_request_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  requested_action: AutonomyAuthorityRequest["requested_action"];
  authority_request: AutonomyAuthorityRequest;
  authority_decision: AutonomyAuthorityDecision;
  mission_constitution: string;
  governance_constitution: string;
  policy_version: string;
  operator_reference: string;
  replay_reference: string;
  evidence_references: readonly string[];
  audit_reference: string;
  integrity_hash: string;
  hidden_validation: boolean;
  self_modification_attempt: boolean;
  constitution_modification_attempt: boolean;
}>;

export type ConstitutionalRuleEvaluation = Readonly<{
  rule_id: string;
  category: ConstitutionalRuleCategory;
  rule_name: string;
  result: ConstitutionalValidationState;
  failure_reason: ConstitutionalFailureReason | null;
  evidence_reference: string | null;
  evaluation_hash: string;
}>;

export type ConstitutionalDecisionRecord = Readonly<{
  constitutional_decision_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  evaluated_rules: readonly ConstitutionalRuleEvaluation[];
  decision: ConstitutionalDecisionState;
  denial_reason: ConstitutionalFailureReason | null;
  approving_authority: string;
  replay_reference: string;
  evidence_references: readonly string[];
  audit_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type ConstitutionalValidationResult = Readonly<{
  validation_id: string;
  autonomy_id: string;
  validation_state: ConstitutionalValidationState;
  decision: ConstitutionalDecisionState;
  failures: readonly ConstitutionalFailureReason[];
  mission_validated: boolean;
  governance_validated: boolean;
  policy_validated: boolean;
  operator_validated: boolean;
  tenant_isolated: boolean;
  replay_ready: boolean;
  evidence_complete: boolean;
  audit_ready: boolean;
  integrity_verified: boolean;
  fail_closed: boolean;
  validation_hash: string;
}>;

export type ConstitutionalDecisionLedger = Readonly<{
  ledger_id: string;
  autonomy_id: string;
  tenant_id: string;
  mission_id: string;
  decisions: readonly ConstitutionalDecisionRecord[];
  approvals: readonly ConstitutionalDecisionRecord[];
  denials: readonly ConstitutionalDecisionRecord[];
  replay_references: readonly string[];
  evidence_references: readonly string[];
  audit_references: readonly string[];
  ledger_hash: string;
}>;

export type ConstitutionalReplayResult = Readonly<{
  replay_id: string;
  autonomy_id: string;
  evaluation_order: readonly ConstitutionalRuleCategory[];
  reconstructed_decisions: readonly ConstitutionalDecisionState[];
  evidence_references: readonly string[];
  integrity_hashes: readonly string[];
  validation_state: ConstitutionalValidationState;
  failure_reason: ConstitutionalFailureReason | null;
  replay_hash: string;
}>;

export type ConstitutionalVisibilitySurface = Readonly<{
  autonomy_id: string;
  rules_evaluated: readonly ConstitutionalRuleEvaluation[];
  validation_results: readonly ConstitutionalDecisionState[];
  approval_path: readonly string[];
  denial_reasons: readonly ConstitutionalFailureReason[];
  policy_influence: string;
  governance_influence: string;
  operator_approvals: readonly string[];
  replay_references: readonly string[];
  evidence_chain: readonly string[];
  integrity_status: "VALID" | "INVALID";
  audit_history: readonly string[];
  hidden_decisions_visible: false;
}>;

export type ConstitutionalFramework = Readonly<{
  identity: AutonomyIdentityRecord;
  request: ConstitutionalRequest;
  validation: ConstitutionalValidationResult;
  decision: ConstitutionalDecisionRecord;
  ledger: ConstitutionalDecisionLedger;
  replay: ConstitutionalReplayResult;
  visibility: ConstitutionalVisibilitySurface;
}>;
