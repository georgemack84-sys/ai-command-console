import type { ExecutionAssuranceRecord } from "@/types/execution-assurance-contract";
import type { GovernanceAssurancePackage } from "@/types/governance-assurance-engine";
import type { RecoveryInterventionPackage } from "@/types/recovery-intervention-intelligence";
import type { RuntimeAssurancePackage } from "@/types/runtime-assurance-engine";

export type ExecutionAssuranceCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type ExecutionAssuranceCertificationArea =
  | "CONTRACT"
  | "RUNTIME"
  | "GOVERNANCE"
  | "RECOVERY"
  | "DECISION"
  | "HEALTH"
  | "CONFIDENCE"
  | "MONITORING"
  | "EVIDENCE"
  | "REPLAY"
  | "LINEAGE"
  | "INTEGRITY"
  | "SECURITY"
  | "CERTIFICATION_SUITE";

export type ExecutionAssuranceCertificationFailure =
  | "EXECUTION_ASSURANCE_CONTRACT_INVALID"
  | "RUNTIME_ASSURANCE_NOT_OPERATIONAL"
  | "GOVERNANCE_ASSURANCE_NOT_OPERATIONAL"
  | "RECOVERY_INTELLIGENCE_NOT_OPERATIONAL"
  | "EXECUTION_HEALTH_SCORING_NONDETERMINISTIC"
  | "CONFIDENCE_SCORING_NONDETERMINISTIC"
  | "RUNTIME_MONITORING_NOT_OPERATIONAL"
  | "ASSURANCE_DECISION_NONDETERMINISTIC"
  | "CONSTITUTIONAL_VERIFICATION_NOT_ENFORCED"
  | "AUTHORITY_VALIDATION_NOT_ENFORCED"
  | "POLICY_COMPLIANCE_NOT_ENFORCED"
  | "COMPLIANCE_VERIFICATION_NOT_OPERATIONAL"
  | "APPROVAL_VALIDATION_NOT_OPERATIONAL"
  | "EXECUTION_STATE_TRANSITION_INVALID"
  | "RUNTIME_HEALTH_NOT_REPRODUCIBLE"
  | "CONFIDENCE_NOT_REPRODUCIBLE"
  | "RECOVERY_RECOMMENDATION_NOT_REPRODUCIBLE"
  | "ROLLBACK_RECOMMENDATION_NOT_REPRODUCIBLE"
  | "INTERVENTION_PRIORITY_NONDETERMINISTIC"
  | "ASSURANCE_EVIDENCE_INCOMPLETE"
  | "LINEAGE_INCOMPLETE"
  | "REPLAY_RECONSTRUCTION_MISMATCH"
  | "INTEGRITY_HASH_NOT_REPRODUCIBLE"
  | "OPERATOR_SUPREMACY_NOT_PRESERVED"
  | "GOVERNANCE_SUPREMACY_NOT_PRESERVED"
  | "TENANT_ISOLATION_NOT_ENFORCED"
  | "HIDDEN_EXECUTION_DETECTED"
  | "GOVERNANCE_BYPASS_DETECTED"
  | "CONSTITUTIONAL_VIOLATION_PERMITTED"
  | "AUTHORITY_ESCALATION_PERMITTED"
  | "POLICY_BYPASS_PERMITTED"
  | "REPLAY_MISMATCH_DETECTED"
  | "NONDETERMINISTIC_ASSURANCE_DECISION"
  | "INCOMPLETE_EVIDENCE_ACCEPTED"
  | "INTEGRITY_VERIFICATION_FAILURE_IGNORED"
  | "CROSS_TENANT_ACCESS_PERMITTED"
  | "MINOR_REPORTING_GAP";

export type ExecutionAssuranceCertificationScenario =
  | "BASELINE"
  | "MINOR_REPORTING_GAP"
  | ExecutionAssuranceCertificationFailure;

export type ExecutionAssuranceCertificationCheck = Readonly<{
  check_id: string;
  area: ExecutionAssuranceCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: ExecutionAssuranceCertificationFailure | null;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  reasoning: string;
  check_hash: string;
}>;

export type ExecutionAssuranceCertificationResult = Readonly<{
  result_id: string;
  overall_state: ExecutionAssuranceCertificationState;
  pass_count: number;
  fail_count: number;
  critical_failure_count: number;
  warning_count: number;
  blocking_failures: readonly ExecutionAssuranceCertificationFailure[];
  production_decision: "CERTIFIED_FOR_CONTROLLED_AUTONOMY" | "CONDITIONAL_REMEDIATION_REQUIRED" | "BLOCKED_FROM_CONTROLLED_AUTONOMY";
  remediation_guidance: readonly string[];
  result_hash: string;
}>;

export type ExecutionAssuranceCertificationEvidence = Readonly<{
  certification_id: string;
  contract_assurance_id: string;
  runtime_package_id: string;
  governance_package_id: string;
  recovery_package_id: string;
  validation_results: readonly string[];
  health_report_hash: string;
  governance_report_hash: string;
  recovery_recommendation_hash: string;
  confidence_assessment_hash: string;
  lineage_reference: string;
  replay_reference: string;
  integrity_hash: string;
  certification_timestamp: string;
  evidence_hash: string;
}>;

export type ExecutionAssuranceDecisionLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  decision: ExecutionAssuranceCertificationState;
  evidence_hash: string;
  result_hash: string;
  check_hashes: readonly string[];
  replay_references: readonly string[];
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type ExecutionAssuranceReplayValidationReport = Readonly<{
  replay_id: string;
  certification_id: string;
  reconstructed_state_path: readonly string[];
  reconstructed_decision_states: readonly string[];
  reconstructed_check_hashes: readonly string[];
  reconstructed_decision: ExecutionAssuranceCertificationState;
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: ExecutionAssuranceCertificationFailure | null;
  replay_hash: string;
}>;

export type ExecutionAssuranceCertificationReport = Readonly<{
  certification_id: string;
  phase_version: "8E.5";
  schema_version: "execution-assurance-certification-gate/v8E.5";
  generated_at: string;
  read_only: true;
  advisory_only: true;
  controlled_autonomy_progression_allowed: boolean;
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  governance_enforced: boolean;
  constitutionally_compliant: boolean;
  authority_enforced: boolean;
  operator_supremacy_preserved: boolean;
  tenant_isolated: boolean;
  integrity_protected: boolean;
  source_execution_record: ExecutionAssuranceRecord;
  source_runtime_package: RuntimeAssurancePackage;
  source_governance_package: GovernanceAssurancePackage;
  source_recovery_package: RecoveryInterventionPackage;
  certification_checks: readonly ExecutionAssuranceCertificationCheck[];
  certification_result: ExecutionAssuranceCertificationResult;
  certification_evidence: ExecutionAssuranceCertificationEvidence;
  decision_ledger_entry: ExecutionAssuranceDecisionLedgerEntry;
  replay_validation_report: ExecutionAssuranceReplayValidationReport;
  observability: Readonly<{
    certification_test_count: number;
    pass_rate: number;
    critical_failure_rate: number;
    replay_reference_count: number;
    integrity_reference_count: number;
  }>;
  report_hash: string;
}>;

export type ExecutionAssuranceCertificationGateInput = Readonly<{
  scenario?: ExecutionAssuranceCertificationScenario;
  recoveryPackage?: RecoveryInterventionPackage;
}>;

export type ExecutionAssuranceCertificationVisibilitySurface = Readonly<{
  certification_id: string;
  overall_state: ExecutionAssuranceCertificationState;
  controlled_autonomy_progression_allowed: boolean;
  critical_failure_count: number;
  blocking_failures: readonly ExecutionAssuranceCertificationFailure[];
  replay_reference: string;
  integrity_status: "VALID" | "INVALID";
  report_hash: string;
}>;
