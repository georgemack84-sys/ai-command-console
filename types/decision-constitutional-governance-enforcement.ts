import type { ConflictLedgerEntry, ConflictLedgerResult } from "@/types/decision-conflict-ledger";

export type EnforcementPriority = "Constitution" | "Governance" | "Authority" | "Tenant Isolation" | "Policy Validation" | "Replay Validation" | "Integrity Validation";

export type EnforcementOutcome = "PASS" | "ESCALATE_TO_GOVERNANCE" | "ESCALATE_TO_OPERATOR" | "REJECT" | "BLOCKING";

export type ConstitutionalValidation = Readonly<{
  validation_id: string;
  arbitration_id: string;
  constitutional_checks: readonly string[];
  validation_result: "VALID" | "REJECTED";
  violated_principles: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceValidation = Readonly<{
  validation_id: string;
  arbitration_id: string;
  policy_refs: readonly string[];
  compliance_status: "COMPLIANT" | "ESCALATE" | "REJECTED";
  violations: readonly string[];
  escalation_required: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type AuthorityValidation = Readonly<{
  validation_id: string;
  arbitration_id: string;
  authority_refs: readonly string[];
  validation_result: "VALID" | "ESCALATE" | "REJECTED";
  violations: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type TenantIsolationValidation = Readonly<{
  validation_id: string;
  arbitration_id: string;
  tenant_id: string;
  validation_result: "VALID" | "REJECTED";
  violations: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type EnforcementReport = Readonly<{
  report_id: string;
  arbitration_id: string;
  constitutional_summary: string;
  governance_summary: string;
  authority_summary: string;
  tenant_summary: string;
  enforcement_outcome: EnforcementOutcome;
  violations: readonly string[];
  escalation_required: boolean;
  replay_ref: string;
  integrity_hash: string;
}>;

export type EnforcementLedgerRecord = Readonly<{
  ledger_id: string;
  arbitration_id: string;
  enforcement_outcome: EnforcementOutcome;
  constitutional_validation_ref: string;
  governance_validation_ref: string;
  authority_validation_ref: string;
  tenant_validation_ref: string;
  violations: readonly string[];
  replay_ref: string;
  lineage_ref: string;
  ledger_timestamp: string;
  integrity_hash: string;
}>;

export type EnforcementFailureReason =
  | "CONSTITUTIONAL_VIOLATION"
  | "GOVERNANCE_POLICY_VIOLATION"
  | "AUTHORITY_VIOLATION"
  | "TENANT_ISOLATION_BREACH"
  | "HIDDEN_ARBITRATION_DETECTED"
  | "UNDOCUMENTED_OVERRIDE"
  | "UNAUTHORIZED_CONFLICT_RESOLUTION"
  | "REPLAY_CORRUPTION"
  | "INTEGRITY_HASH_MISMATCH"
  | "UNAUTHORIZED_VALIDATOR_ACCESS"
  | "MISSING_LEDGER_RECORDS"
  | "UNSUPPORTED_ENFORCEMENT_OUTCOME"
  | "ADVISORY_ONLY_VIOLATION"
  | "ENFORCEMENT_LEDGER_FAILED";

export type EnforcementValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly EnforcementFailureReason[];
  checks: Readonly<{
    constitutional_valid: boolean;
    governance_valid: boolean;
    authority_valid: boolean;
    tenant_isolated: boolean;
    hidden_arbitration_absent: boolean;
    overrides_documented: boolean;
    replay_valid: boolean;
    integrity_valid: boolean;
    advisory_only: boolean;
  }>;
}>;

export type EnforcementInput = Readonly<{
  ledger_result?: ConflictLedgerResult;
  entries?: readonly ConflictLedgerEntry[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type EnforcementResult = Readonly<{
  enforcement_status: "PASS" | "FAIL";
  fail_closed: boolean;
  priority_order: readonly EnforcementPriority[];
  constitutional_validations: readonly ConstitutionalValidation[];
  governance_validations: readonly GovernanceValidation[];
  authority_validations: readonly AuthorityValidation[];
  tenant_validations: readonly TenantIsolationValidation[];
  reports: readonly EnforcementReport[];
  ledger_records: readonly EnforcementLedgerRecord[];
  validation: EnforcementValidation;
  replay_hash: string;
  failures: readonly EnforcementFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type EnforcementReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  report_refs: readonly string[];
  ledger_refs: readonly string[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly EnforcementFailureReason[];
  integrity_hash: string;
}>;

export type EnforcementObservability = Readonly<{
  constitutional_validations: number;
  governance_validations: number;
  authority_validations: number;
  tenant_isolation_validations: number;
  policy_violations_detected: number;
  constitutional_violations_detected: number;
  hidden_arbitration_detections: number;
  unauthorized_override_attempts: number;
  governance_escalations: number;
  replay_success_rate: number;
  validation_failures: number;
  integrity_failures: number;
}>;

export type EnforcementFoundation = Readonly<{
  enforcement_version: "constitutional-governance-enforcement/v1";
  priority_order: readonly EnforcementPriority[];
  outcomes: readonly EnforcementOutcome[];
  result: EnforcementResult;
  replay: EnforcementReplay;
  observability: EnforcementObservability;
}>;
