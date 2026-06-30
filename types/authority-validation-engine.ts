import type { TaskClassificationPackage, TaskClassificationFailureReason } from "@/types/task-classification-engine";

export type AuthorityValidationDecision = "AUTHORIZED" | "REJECTED";

export type AuthorityValidationState =
  | "PENDING"
  | "IDENTITY_VALIDATED"
  | "CONSTITUTION_VALIDATED"
  | "POLICY_VALIDATED"
  | "AUTHORITY_VALIDATED"
  | "CERTIFICATION_VALIDATED"
  | "TENANT_VALIDATED"
  | "AUTHORIZED"
  | "BLOCKED"
  | "REJECTED"
  | "POLICY_FAILURE"
  | "AUTHORITY_FAILURE"
  | "CERTIFICATION_FAILURE"
  | "TENANT_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "FAILED";

export type AuthorityValidationFailureReason =
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "PRIVILEGE_ESCALATION"
  | "UNAUTHORIZED_DELEGATION"
  | "MISSING_APPROVAL"
  | "EXPIRED_CERTIFICATION"
  | "INSUFFICIENT_CAPABILITY"
  | "INADEQUATE_TRUST_SCORE"
  | "POLICY_CONFLICT"
  | "TENANT_ISOLATION_FAILURE"
  | "REPLAY_INCONSISTENCY"
  | "INCOMPLETE_VALIDATION_EVIDENCE"
  | "INTEGRITY_FAILURE"
  | "INVALID_CLASSIFICATION"
  | "OPERATOR_BYPASS"
  | "UNAUTHORIZED_OVERRIDE";

export type AuthorityValidationScenario =
  | "BASELINE"
  | "OPERATOR_APPROVAL_REQUIRED"
  | "BLOCKED_CLASSIFICATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_BYPASS"
  | "PRIVILEGE_ESCALATION"
  | "UNAUTHORIZED_DELEGATION"
  | "MISSING_APPROVAL"
  | "EXPIRED_CERTIFICATION"
  | "INSUFFICIENT_CAPABILITY"
  | "INADEQUATE_TRUST_SCORE"
  | "POLICY_CONFLICT"
  | "TENANT_ISOLATION_FAILURE"
  | "REPLAY_INCONSISTENCY"
  | "INCOMPLETE_VALIDATION_EVIDENCE"
  | "INTEGRITY_FAILURE";

export type AuthorityDomainResult = Readonly<{
  domain_id: string;
  domain: "IDENTITY" | "CONSTITUTION" | "POLICY" | "OPERATOR" | "CERTIFICATION" | "TENANT" | "GOVERNANCE" | "INTEGRITY" | "REPLAY";
  passed: boolean;
  state: AuthorityValidationState;
  evidence_ref: string;
  rationale: string;
  failure_reason: AuthorityValidationFailureReason | null;
  result_hash: string;
}>;

export type AuthorityValidationEvidence = Readonly<{
  evidence_id: string;
  authority_references: readonly string[];
  constitutional_references: readonly string[];
  governing_policies: readonly string[];
  operator_approvals: readonly string[];
  certification_evidence: readonly string[];
  trust_score: number;
  validation_timestamp: string;
  decision_rationale: string;
  replay_reference: string;
  lineage_reference: string;
  domain_result_hashes: readonly string[];
  integrity_hash: string;
}>;

export type AuthorityValidationResult = Readonly<{
  validation_id: string;
  classification_id: string;
  delegation_id: string;
  tenant_id: string;
  decision: AuthorityValidationDecision;
  final_state: AuthorityValidationState;
  failures: readonly AuthorityValidationFailureReason[];
  constitutional_authority_valid: boolean;
  governance_authority_valid: boolean;
  policy_compliance_valid: boolean;
  operator_authority_valid: boolean;
  agent_certification_valid: boolean;
  tenant_isolation_valid: boolean;
  integrity_valid: boolean;
  replay_valid: boolean;
  governance_evidence_recorded: boolean;
  domain_results: readonly AuthorityDomainResult[];
  evidence: AuthorityValidationEvidence;
  result_hash: string;
}>;

export type AuthorityValidationReplayResult = Readonly<{
  replay_id: string;
  validation_id: string;
  reconstructed_domain_states: readonly AuthorityValidationState[];
  reconstructed_decision: AuthorityValidationDecision;
  reconstructed_failures: readonly AuthorityValidationFailureReason[];
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: AuthorityValidationFailureReason | null;
  replay_hash: string;
}>;

export type AuthorityValidationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  validation_id: string;
  decision: AuthorityValidationDecision;
  evidence_hash: string;
  result_hash: string;
  replay_hash: string;
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type AuthorityValidationPackage = Readonly<{
  package_id: string;
  engine_version: "authority-validation-engine/v8D.3";
  source_classification: TaskClassificationPackage;
  validation: AuthorityValidationResult;
  replay: AuthorityValidationReplayResult;
  ledger_entry: AuthorityValidationLedgerEntry;
  mapped_classification_failures: readonly TaskClassificationFailureReason[];
  package_hash: string;
}>;

export type AuthorityValidationVisibilitySurface = Readonly<{
  validation_id: string;
  classification_id: string;
  delegation_id: string;
  decision: AuthorityValidationDecision;
  final_state: AuthorityValidationState;
  failure_reasons: readonly AuthorityValidationFailureReason[];
  trust_score: number;
  replay_reference: string;
  lineage_reference: string;
  integrity_status: "VALID" | "INVALID";
}>;

export type AuthorityValidationFramework = Readonly<{
  doctrine: Readonly<{
    principles: readonly string[];
    engine_version: "authority-validation-engine/v8D.3";
    states: readonly AuthorityValidationState[];
    decisions: readonly AuthorityValidationDecision[];
  }>;
  package: AuthorityValidationPackage;
  visibility: AuthorityValidationVisibilitySurface;
}>;
