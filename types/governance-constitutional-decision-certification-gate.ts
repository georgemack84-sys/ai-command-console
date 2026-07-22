import type { GovernanceDecisionLedgerResult } from "@/types/governance-decision-ledger";

export type GovernanceDecisionCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type GovernanceDecisionCertificationCategory =
  | "Governance Validation"
  | "Constitutional Validation"
  | "Authority Validation"
  | "Tenant Isolation Validation"
  | "Certification & Replay Validation"
  | "Integrity Validation"
  | "Enforcement Validation"
  | "Ledger Validation"
  | "Production Readiness";

export type GovernanceDecisionCertificationTestName =
  | "Governance contract valid"
  | "Governance policy enforced"
  | "Constitutional compliance verified"
  | "Constitutional violations blocked"
  | "Authority validation deterministic"
  | "Unauthorized authority rejected"
  | "Operator approval enforced"
  | "Governance review enforced"
  | "Certification requirements verified"
  | "Replay availability verified"
  | "Replay mismatch detected"
  | "Immutable lineage verified"
  | "Integrity hashes verified"
  | "Tenant isolation enforced"
  | "Cross-tenant leakage blocked"
  | "Advisory-only behavior enforced"
  | "Fail-closed rules deterministic"
  | "Missing governance evidence fails closed"
  | "Missing constitutional evidence fails closed"
  | "Missing replay fails closed"
  | "Missing certification fails closed"
  | "Unknown validation state fails closed"
  | "Hidden governance bypass rejected"
  | "Hidden constitutional bypass rejected"
  | "Replay deterministic"
  | "Replay reproducible"
  | "Ledger immutable"
  | "Evidence lineage reproducible"
  | "Audit trail complete"
  | "Certification replay successful";

export type GovernanceDecisionCertificationTest = Readonly<{
  test_id: string;
  test_name: GovernanceDecisionCertificationTestName;
  category: GovernanceDecisionCertificationCategory;
  expected: "PASS";
  actual: GovernanceDecisionCertificationState;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  rationale: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionCertificationPackage = Readonly<{
  certification_id: string;
  phase_id: "Mission Control Phase 9.7";
  certification_state: GovernanceDecisionCertificationState;
  certification_tests: readonly string[];
  governance_results: readonly string[];
  constitutional_results: readonly string[];
  authority_results: readonly string[];
  tenant_results: readonly string[];
  certification_results: readonly string[];
  replay_results: readonly string[];
  integrity_results: readonly string[];
  enforcement_results: readonly string[];
  ledger_results: readonly string[];
  production_readiness: "READY" | "NOT_READY";
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_hash: string;
}>;

export type GovernanceCertificationReport = Readonly<{
  report_id: string;
  certification_outcome: GovernanceDecisionCertificationState;
  executed_test_suite: readonly GovernanceDecisionCertificationTestName[];
  passed_tests: readonly GovernanceDecisionCertificationTestName[];
  failed_tests: readonly GovernanceDecisionCertificationTestName[];
  conditional_findings: readonly string[];
  governance_summary: string;
  constitutional_summary: string;
  replay_validation: string;
  integrity_validation: string;
  tenant_isolation_summary: string;
  enforcement_summary: string;
  production_readiness: "READY" | "NOT_READY";
  evidence_refs: readonly string[];
  replay_ref: string;
  integrity_hash: string;
}>;

export type GovernanceDecisionCertificationFailureReason =
  | "GOVERNANCE_POLICY_BYPASS"
  | "CONSTITUTIONAL_RULE_VIOLATION"
  | "UNAUTHORIZED_AUTHORITY_ESCALATION"
  | "OPERATOR_AUTHORITY_BYPASS"
  | "GOVERNANCE_REVIEW_BYPASS"
  | "CROSS_TENANT_DATA_LEAKAGE"
  | "MISSING_GOVERNANCE_EVIDENCE_ACCEPTED"
  | "MISSING_CONSTITUTIONAL_EVIDENCE_ACCEPTED"
  | "REPLAY_UNAVAILABLE_BUT_ALLOWED"
  | "REPLAY_DIVERGENCE_IGNORED"
  | "CERTIFICATION_REQUIREMENT_BYPASSED"
  | "INTEGRITY_HASH_MISMATCH_IGNORED"
  | "IMMUTABLE_LINEAGE_BROKEN"
  | "ADVISORY_ONLY_BEHAVIOR_VIOLATED"
  | "HIDDEN_EXECUTION_PERMITTED"
  | "NONDETERMINISTIC_GOVERNANCE_EVALUATION"
  | "NONDETERMINISTIC_ENFORCEMENT_OUTCOME"
  | "INCOMPLETE_AUDIT_EVIDENCE"
  | "FAIL_OPEN_BEHAVIOR_DETECTED"
  | "LEDGER_CERTIFICATION_INVALID"
  | "CERTIFICATION_REPLAY_FAILED"
  | "UNAUTHORIZED_CERTIFICATION_GATE_ACCESS";

export type GovernanceDecisionCertificationValidation = Readonly<{
  validation_state: "VALID" | "REJECTED";
  fail_closed: boolean;
  failures: readonly GovernanceDecisionCertificationFailureReason[];
  checks: Readonly<{
    governance_certified: boolean;
    constitutional_certified: boolean;
    authority_certified: boolean;
    tenant_certified: boolean;
    certification_replay_certified: boolean;
    integrity_certified: boolean;
    enforcement_certified: boolean;
    ledger_certified: boolean;
    production_ready: boolean;
    advisory_only: boolean;
  }>;
}>;

export type GovernanceDecisionCertificationGateInput = Readonly<{
  ledger_result?: GovernanceDecisionLedgerResult;
  certification_tests?: readonly GovernanceDecisionCertificationTest[];
  authorized_component?: string;
  replay_expected_hash?: string;
}>;

export type GovernanceDecisionCertificationGateResult = Readonly<{
  gate_status: GovernanceDecisionCertificationState;
  fail_closed: boolean;
  ledger_result: GovernanceDecisionLedgerResult;
  certification_tests: readonly GovernanceDecisionCertificationTest[];
  evidence_package: GovernanceDecisionCertificationPackage;
  final_report: GovernanceCertificationReport;
  validation: GovernanceDecisionCertificationValidation;
  replay_hash: string;
  failures: readonly GovernanceDecisionCertificationFailureReason[];
  deterministic: true;
  advisory_only: true;
  integrity_hash: string;
}>;

export type GovernanceDecisionCertificationReplay = Readonly<{
  replay_id: string;
  replay_valid: boolean;
  certification_id: string;
  certification_state: GovernanceDecisionCertificationState;
  ledger_ref: string;
  test_refs: readonly string[];
  passed_tests: readonly GovernanceDecisionCertificationTestName[];
  failed_tests: readonly GovernanceDecisionCertificationTestName[];
  expected_replay_hash: string;
  reconstructed_replay_hash: string;
  failures: readonly GovernanceDecisionCertificationFailureReason[];
  integrity_hash: string;
}>;

export type GovernanceDecisionCertificationObservability = Readonly<{
  certification_start_events: number;
  test_execution_events: number;
  replay_validation_events: number;
  governance_validation_events: number;
  constitutional_validation_events: number;
  integrity_verification_events: number;
  enforcement_verification_events: number;
  certification_outcome_events: number;
  certification_replay_events: number;
  production_readiness_events: number;
}>;

export type GovernanceDecisionCertificationGateFoundation = Readonly<{
  gate_version: "governance-constitutional-decision-certification-gate/v1";
  certification_states: readonly GovernanceDecisionCertificationState[];
  certification_categories: readonly GovernanceDecisionCertificationCategory[];
  result: GovernanceDecisionCertificationGateResult;
  replay: GovernanceDecisionCertificationReplay;
  observability: GovernanceDecisionCertificationObservability;
}>;
