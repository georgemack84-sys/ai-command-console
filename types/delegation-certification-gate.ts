import type { AuthorityValidationFailureReason } from "@/types/authority-validation-engine";
import type { DelegationRoutingFailureReason, DelegationRoutingPackage } from "@/types/delegation-routing-engine";

export type DelegationCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type DelegationCertificationLifecycleState =
  | "CERTIFICATION_REQUEST"
  | "CONTRACT_VALIDATION"
  | "CLASSIFICATION_VALIDATION"
  | "AUTHORITY_VALIDATION"
  | "ROUTING_VALIDATION"
  | "REPLAY_VALIDATION"
  | "GOVERNANCE_VALIDATION"
  | "SECURITY_VALIDATION"
  | "CERTIFIED"
  | "CONDITIONAL_CERTIFICATION"
  | "BLOCKED";

export type DelegationCertificationArea =
  | "CONTRACT"
  | "CLASSIFICATION"
  | "AUTHORITY"
  | "ROUTING"
  | "REPLAY"
  | "GOVERNANCE"
  | "SECURITY"
  | "EXPLAINABILITY"
  | "LINEAGE"
  | "CERTIFICATION_SUITE";

export type DelegationCertificationFailure =
  | "DELEGATION_CONTRACT_MISSING"
  | "DELEGATION_SCHEMA_INVALID"
  | "TASK_CLASSIFICATION_NONDETERMINISTIC"
  | "NONDETERMINISTIC_CLASSIFICATION_NOT_DETECTED"
  | "OPERATOR_TASK_NOT_IDENTIFIED"
  | "OPERATOR_TASK_MISCLASSIFIED"
  | "AGENT_TASK_NOT_IDENTIFIED"
  | "UNAUTHORIZED_AGENT_ASSIGNMENT"
  | "EXTERNAL_ROUTING_NONDETERMINISTIC"
  | "INCONSISTENT_ROUTING_DECISION"
  | "DEFERRED_TASK_NOT_IDENTIFIED"
  | "DEFERRED_TASK_EXECUTED_PREMATURELY"
  | "BLOCKED_TASK_NOT_PREVENTED"
  | "BLOCKED_TASK_EXECUTED"
  | "AUTHORITY_VALIDATION_NONREPRODUCIBLE"
  | "AUTHORITY_MISMATCH"
  | "CONSTITUTIONAL_COMPLIANCE_NOT_ENFORCED"
  | "CONSTITUTIONAL_VIOLATION_PERMITTED"
  | "GOVERNANCE_POLICY_NOT_ENFORCED"
  | "POLICY_BYPASS_NOT_DETECTED"
  | "OPERATOR_SUPREMACY_NOT_PRESERVED"
  | "OPERATOR_AUTHORITY_BYPASSED"
  | "UNCERTIFIED_AGENT_PERMITTED"
  | "UNCERTIFIED_DELEGATE_ASSIGNED"
  | "DELEGATION_PLANS_NONREPRODUCIBLE"
  | "DELEGATION_REPLAY_MISMATCH"
  | "ROUTING_DECISIONS_NONDETERMINISTIC"
  | "ROUTING_INCONSISTENCY"
  | "CONTINGENCY_ROUTING_NONREPRODUCIBLE"
  | "FALLBACK_ROUTING_MISMATCH"
  | "EXPLANATIONS_INCOMPLETE"
  | "MISSING_DELEGATION_EXPLANATION"
  | "DELEGATION_LINEAGE_NOT_PRESERVED"
  | "LINEAGE_CORRUPTION_NOT_DETECTED"
  | "REPLAY_NOT_DETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "TENANT_ISOLATION_NOT_ENFORCED"
  | "CROSS_TENANT_DELEGATION_PERMITTED"
  | "EXECUTION_AUTHORITY_EXCEEDED"
  | "AUTONOMOUS_AUTHORITY_ESCALATION"
  | "MINOR_REPORTING_GAP";

export type DelegationCertificationScenario =
  | "BASELINE"
  | "MINOR_REPORTING_GAP"
  | DelegationCertificationFailure;

export type DelegationCertificationCheck = Readonly<{
  check_id: string;
  area: DelegationCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: DelegationCertificationFailure | null;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  reasoning: string;
  check_hash: string;
}>;

export type DelegationCertificationEvidence = Readonly<{
  certification_id: string;
  delegation_contract_version: string;
  schema_version: string;
  validation_results: readonly string[];
  authority_verification_report: string;
  routing_verification_report: string;
  replay_verification_report: string;
  governance_compliance_report: string;
  constitutional_compliance_report: string;
  explainability_verification: string;
  lineage_verification: string;
  integrity_hash: string;
  replay_reference: string;
  certification_timestamp: string;
  evidence_hash: string;
}>;

export type DelegationCertificationResult = Readonly<{
  result_id: string;
  overall_state: DelegationCertificationState;
  pass_count: number;
  fail_count: number;
  critical_failure_count: number;
  warning_count: number;
  blocking_failures: readonly DelegationCertificationFailure[];
  production_decision: "CERTIFIED_FOR_PHASE_8E" | "LIMITED_REMEDIATION_REQUIRED" | "BLOCKED_FROM_EXECUTION_ORCHESTRATION";
  remediation_guidance: readonly string[];
  result_hash: string;
}>;

export type DelegationCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  decision: DelegationCertificationState;
  evidence_hash: string;
  result_hash: string;
  check_hashes: readonly string[];
  replay_references: readonly string[];
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type DelegationCertificationReplayResult = Readonly<{
  replay_id: string;
  certification_id: string;
  reconstructed_validation_steps: readonly DelegationCertificationArea[];
  reconstructed_check_hashes: readonly string[];
  reconstructed_decision: DelegationCertificationState;
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: DelegationCertificationFailure | null;
  replay_hash: string;
}>;

export type DelegationCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "8D.5";
  schema_version: "delegation-certification-gate/v8D.5";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  execution_orchestration_allowed: boolean;
  phase8e_progression_allowed: boolean;
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governance_controlled: boolean;
  constitutionally_compliant: boolean;
  operator_supremacy_preserved: boolean;
  tenant_isolated: boolean;
  integrity_protected: boolean;
  source_routing_package: DelegationRoutingPackage;
  certification_checks: readonly DelegationCertificationCheck[];
  certification_result: DelegationCertificationResult;
  certification_evidence: DelegationCertificationEvidence;
  certification_replay: DelegationCertificationReplayResult;
  ledger_entry: DelegationCertificationLedgerEntry;
  mapped_authority_failures: readonly AuthorityValidationFailureReason[];
  mapped_routing_failures: readonly DelegationRoutingFailureReason[];
  observability: Readonly<{
    certification_test_count: number;
    pass_rate: number;
    critical_failure_rate: number;
    replay_reference_count: number;
    integrity_reference_count: number;
  }>;
  report_hash: string;
}>;

export type DelegationCertificationGateInput = Readonly<{
  scenario?: DelegationCertificationScenario;
  routingPackage?: DelegationRoutingPackage;
}>;

export type DelegationCertificationVisibilitySurface = Readonly<{
  certification_id: string;
  overall_state: DelegationCertificationState;
  execution_orchestration_allowed: boolean;
  phase8e_progression_allowed: boolean;
  critical_failure_count: number;
  blocking_failures: readonly DelegationCertificationFailure[];
  replay_reference: string;
  integrity_status: "VALID" | "INVALID";
  report_hash: string;
}>;
