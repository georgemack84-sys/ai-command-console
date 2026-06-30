import type { GovernancePolicyPackage } from "@/types/governance-policy-enforcement-engine";

export type BoundaryCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type BoundaryCertificationArea =
  | "CONTRACT"
  | "AUTHORITY"
  | "EXECUTION"
  | "GOVERNANCE"
  | "POLICY"
  | "CONSTITUTIONAL"
  | "TENANT"
  | "REPLAY"
  | "TRUTH_LEDGER"
  | "INTEGRITY"
  | "EXPLAINABILITY"
  | "VISIBILITY"
  | "RUNTIME"
  | "STRESS"
  | "ATTACK"
  | "PERFORMANCE"
  | "CERTIFICATION_SUITE";

export type BoundaryCertificationFailure =
  | "BOUNDARY_CONTRACT_MISSING"
  | "BOUNDARY_SCHEMA_INVALID"
  | "AUTHORITY_ENGINE_NOT_OPERATIONAL"
  | "AUTHORITY_VALIDATION_NONDETERMINISTIC"
  | "UNAUTHORIZED_AUTHORITY_NOT_REJECTED"
  | "AUTHORITY_ESCALATION_PERMITTED"
  | "EXECUTION_ENGINE_NOT_OPERATIONAL"
  | "EXECUTION_SCOPE_NONDETERMINISTIC"
  | "OUTSIDE_SCOPE_EXECUTION_PERMITTED"
  | "RECURSION_LIMIT_NOT_ENFORCED"
  | "TIMEOUT_LIMIT_NOT_ENFORCED"
  | "RETRY_LIMIT_NOT_ENFORCED"
  | "CONCURRENCY_LIMIT_NOT_ENFORCED"
  | "CHECKPOINT_BOUNDARY_NOT_ENFORCED"
  | "ROLLBACK_BOUNDARY_NOT_ENFORCED"
  | "GOVERNANCE_ENGINE_NOT_OPERATIONAL"
  | "GOVERNANCE_DECISION_NONDETERMINISTIC"
  | "GOVERNANCE_BYPASS_PERMITTED"
  | "POLICY_ENGINE_NOT_OPERATIONAL"
  | "POLICY_EVALUATION_NONDETERMINISTIC"
  | "POLICY_BYPASS_PERMITTED"
  | "CONSTITUTIONAL_VALIDATION_NOT_OPERATIONAL"
  | "CONSTITUTIONAL_VIOLATION_PERMITTED"
  | "OPERATOR_SUPREMACY_NOT_PRESERVED"
  | "GOVERNANCE_SUPREMACY_NOT_PRESERVED"
  | "MISSION_AUTHORITY_NOT_ENFORCED"
  | "DELEGATION_AUTHORITY_NOT_VALIDATED"
  | "EXECUTION_AUTHORITY_NOT_MONITORED"
  | "RUNTIME_MONITORING_NOT_OPERATIONAL"
  | "BOUNDARY_VIOLATION_NOT_DETECTED"
  | "RUNTIME_RESTRICTIONS_NOT_ENFORCED"
  | "PAUSE_DECISION_NONDETERMINISTIC"
  | "ESCALATION_DECISION_NONDETERMINISTIC"
  | "TERMINATION_DECISION_NONDETERMINISTIC"
  | "FAIL_SAFE_NONDETERMINISTIC"
  | "FAIL_CLOSED_NOT_VERIFIED"
  | "TENANT_ISOLATION_NOT_ENFORCED"
  | "CROSS_TENANT_EXECUTION_PERMITTED"
  | "CROSS_TENANT_VISIBILITY_PERMITTED"
  | "REPLAY_NONDETERMINISTIC"
  | "REPLAY_DECISION_RECONSTRUCTION_FAILED"
  | "REPLAY_VIOLATION_RECONSTRUCTION_FAILED"
  | "REPLAY_RESTRICTION_RECONSTRUCTION_FAILED"
  | "TRUTH_LEDGER_REFERENCE_INVALID"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "REPLAY_LINEAGE_INCOMPLETE"
  | "AUDIT_TRAIL_MUTABLE"
  | "INTEGRITY_HASH_NOT_REPRODUCIBLE"
  | "EVIDENCE_INCOMPLETE"
  | "EVIDENCE_TAMPERING_NOT_DETECTED"
  | "DIGITAL_SIGNATURE_INVALID"
  | "BOUNDARY_DECISION_NOT_EXPLAINABLE"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "ENFORCEMENT_TIMELINE_NOT_REPRODUCIBLE"
  | "CONFIDENCE_SCORING_NONDETERMINISTIC"
  | "HIDDEN_RUNTIME_STATE_DETECTED"
  | "UNAUTHORIZED_LEARNING_DETECTED"
  | "AUTONOMOUS_BOUNDARY_MODIFICATION_PERMITTED"
  | "GOVERNANCE_RULE_MODIFICATION_PERMITTED"
  | "CONSTITUTIONAL_MODIFICATION_PERMITTED"
  | "STRESS_CERTIFICATION_FAILED"
  | "ATTACK_SIMULATION_NOT_BLOCKED"
  | "PERFORMANCE_NONDETERMINISTIC"
  | "MINOR_VISUALIZATION_GAP";

export type BoundaryCertificationScenario = "BASELINE" | BoundaryCertificationFailure;

export type BoundaryCertificationCheck = Readonly<{
  check_id: string;
  area: BoundaryCertificationArea;
  test_name: string;
  expected: "PASS" | "BLOCKED";
  actual: "PASS" | "BLOCKED" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: BoundaryCertificationFailure | null;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  explanation: string;
  check_hash: string;
}>;

export type BoundaryCertificationResult = Readonly<{
  result_id: string;
  overall_state: BoundaryCertificationState;
  tests_passed: number;
  tests_failed: number;
  critical_failure_count: number;
  warning_count: number;
  blocking_failures: readonly BoundaryCertificationFailure[];
  progression_decision: "CERTIFIED_FOR_PHASE_8G" | "CONDITIONAL_REMEDIATION_REQUIRED" | "BLOCKED_FROM_PHASE_8G";
  result_hash: string;
}>;

export type BoundaryCertificationEvidence = Readonly<{
  certification_id: string;
  boundary_contract_id: string;
  authority_package_id: string;
  execution_package_id: string;
  governance_package_id: string;
  evidence_hashes: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  truth_ledger_references: readonly string[];
  stress_report_hash: string;
  attack_report_hash: string;
  performance_report_hash: string;
  certification_timestamp: string;
  evidence_hash: string;
}>;

export type BoundaryCertificationReplayReport = Readonly<{
  replay_id: string;
  certification_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_check_hashes: readonly string[];
  reconstructed_decision: BoundaryCertificationState;
  validation_state: "PASS" | "FAIL";
  failure_reason: BoundaryCertificationFailure | null;
  replay_hash: string;
}>;

export type BoundaryCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  decision: BoundaryCertificationState;
  evidence_hash: string;
  result_hash: string;
  check_hashes: readonly string[];
  replay_references: readonly string[];
  append_only: true;
  ledger_hash: string;
}>;

export type BoundaryCertificationReport = Readonly<{
  certification_id: string;
  certification_version: "boundary-certification-gate/v8F.5";
  phase: "8F.5";
  generated_at: string;
  boundary_framework_version: "boundary-enforcement/v8F";
  governance_version: string;
  constitution_version: string;
  replay_version: string;
  read_only: true;
  controlled_autonomy_progression_allowed: boolean;
  deterministic: boolean;
  replayable: boolean;
  secure: boolean;
  explainable: boolean;
  constitutionally_compliant: boolean;
  operator_supremacy_preserved: boolean;
  governance_supremacy_preserved: boolean;
  tenant_isolated: boolean;
  fail_closed: boolean;
  source_governance_package: GovernancePolicyPackage;
  certification_checks: readonly BoundaryCertificationCheck[];
  certification_result: BoundaryCertificationResult;
  certification_evidence: BoundaryCertificationEvidence;
  replay_report: BoundaryCertificationReplayReport;
  ledger_entry: BoundaryCertificationLedgerEntry;
  observability: Readonly<{
    test_count: number;
    pass_rate: number;
    critical_failure_rate: number;
    attack_attempts_blocked: number;
    stress_scenarios_passed: number;
  }>;
  digital_signature: string;
  integrity_hash: string;
}>;

export type BoundaryCertificationGateInput = Readonly<{
  scenario?: BoundaryCertificationScenario;
  governancePolicyPackage?: GovernancePolicyPackage;
}>;

export type BoundaryCertificationVisibilitySurface = Readonly<{
  certification_id: string;
  overall_state: BoundaryCertificationState;
  controlled_autonomy_progression_allowed: boolean;
  critical_failure_count: number;
  blocking_failures: readonly BoundaryCertificationFailure[];
  replay_status: "PASS" | "FAIL";
  integrity_status: "VALID" | "INVALID";
  integrity_hash: string;
}>;
