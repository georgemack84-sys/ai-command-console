import type { DriftHealthPackage } from "@/types/drift-health-intelligence";
import type { InterventionRecommendationPackage } from "@/types/intervention-recommendation-engine";
import type { RuntimeObservationPackage } from "@/types/runtime-observation-engine";
import type { RuntimeSupervisionContract } from "@/types/runtime-supervision-contract";

export type RuntimeSupervisionCertificationLifecycleState = "INITIALIZING" | "VALIDATING" | "CERTIFYING" | "PASS" | "CONDITIONAL_PASS" | "FAIL" | "ARCHIVED";
export type RuntimeSupervisionCertificationDecision = "PASS" | "CONDITIONAL_PASS" | "FAIL";

export type RuntimeSupervisionCertificationArea =
  | "CONTRACT"
  | "FUNCTIONAL"
  | "MONITORING"
  | "RECOMMENDATION"
  | "REPLAY"
  | "GOVERNANCE"
  | "AUTHORITY"
  | "EVIDENCE"
  | "INTEGRITY"
  | "SECURITY"
  | "CERTIFICATION_SUITE";

export type RuntimeSupervisionCertificationFailure =
  | "SUPERVISION_CONTRACT_MISSING"
  | "SUPERVISION_SCHEMA_INVALID"
  | "MONITORING_NONDETERMINISTIC"
  | "REPLAY_RECONSTRUCTION_FAILED"
  | "EXECUTION_DRIFT_NOT_DETECTED"
  | "POLICY_VIOLATION_MISSED"
  | "CONSTITUTIONAL_VIOLATION_MISSED"
  | "AUTHORITY_BOUNDARY_VALIDATION_FAILED"
  | "RUNTIME_CONFIDENCE_NOT_REPRODUCIBLE"
  | "CONFIDENCE_DEGRADATION_NOT_DETECTED"
  | "RECOMMENDATION_VALIDATION_FAILED"
  | "STALE_RECOMMENDATION_NOT_DETECTED"
  | "INTERVENTION_RECOMMENDATION_EVIDENCE_MISSING"
  | "PAUSE_RECOMMENDATION_NONDETERMINISTIC"
  | "ROLLBACK_RECOMMENDATION_NONDETERMINISTIC"
  | "SUPERVISION_EVIDENCE_INCOMPLETE"
  | "SUPERVISION_LINEAGE_INCOMPLETE"
  | "TRUTH_LEDGER_REFERENCE_INVALID"
  | "GOVERNANCE_LINEAGE_INCOMPLETE"
  | "OPERATOR_VISIBILITY_INCOMPLETE"
  | "AUDIT_HISTORY_MUTABLE"
  | "TENANT_ISOLATION_VIOLATED"
  | "CROSS_TENANT_SUPERVISION_PERMITTED"
  | "FAIL_CLOSED_NOT_ENFORCED"
  | "AUTONOMOUS_INTERVENTION_ATTEMPTED"
  | "UNAUTHORIZED_EXECUTION_CONTROL_ATTEMPTED"
  | "HIDDEN_RUNTIME_STATE_EXISTS"
  | "CRITICAL_CERTIFICATION_TEST_FAILED"
  | "MINOR_REPORTING_GAP";

export type RuntimeSupervisionCertificationScenario = "BASELINE" | RuntimeSupervisionCertificationFailure;

export type RuntimeSupervisionCertificationCheck = Readonly<{
  check_id: string;
  area: RuntimeSupervisionCertificationArea;
  test_name: string;
  expected: "PASS" | "FAIL";
  actual: "PASS" | "FAIL";
  passed: boolean;
  critical: boolean;
  failure_reason: RuntimeSupervisionCertificationFailure | null;
  evidence_refs: readonly string[];
  replay_refs: readonly string[];
  integrity_refs: readonly string[];
  reasoning: string;
  check_hash: string;
}>;

export type RuntimeSupervisionCertificationValidationSection = Readonly<{
  validation_state: "PASS" | "FAIL";
  passed_checks: number;
  failed_checks: number;
  critical_failures: readonly RuntimeSupervisionCertificationFailure[];
  validation_hash: string;
}>;

export type RuntimeSupervisionCertificationResult = Readonly<{
  result_id: string;
  overall_decision: RuntimeSupervisionCertificationDecision;
  tests_passed: number;
  tests_failed: number;
  critical_failure_count: number;
  warning_count: number;
  failed_tests: readonly RuntimeSupervisionCertificationFailure[];
  progression_decision: "CERTIFIED_FOR_NEXT_EXECUTION_PHASE" | "CONDITIONAL_REMEDIATION_REQUIRED" | "BLOCKED_FROM_NEXT_EXECUTION_PHASE";
  remediation_guidance: readonly string[];
  result_hash: string;
}>;

export type RuntimeSupervisionCertificationEvidence = Readonly<{
  certification_id: string;
  supervision_id: string;
  observation_package_id: string;
  drift_health_package_id: string;
  recommendation_package_id: string;
  contract_validation_hash: string;
  observation_validation_hash: string;
  drift_validation_hash: string;
  recommendation_validation_hash: string;
  evidence_hashes: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  truth_ledger_references: readonly string[];
  certification_timestamp: string;
  evidence_hash: string;
}>;

export type RuntimeSupervisionCertificationReplayReport = Readonly<{
  replay_id: string;
  certification_id: string;
  reconstructed_pipeline: readonly string[];
  reconstructed_check_hashes: readonly string[];
  reconstructed_decision: RuntimeSupervisionCertificationDecision;
  evidence_hash: string;
  validation_state: "PASS" | "FAIL";
  failure_reason: RuntimeSupervisionCertificationFailure | null;
  replay_hash: string;
}>;

export type RuntimeSupervisionCertificationLedgerEntry = Readonly<{
  ledger_entry_id: string;
  certification_id: string;
  decision: RuntimeSupervisionCertificationDecision;
  evidence_hash: string;
  result_hash: string;
  check_hashes: readonly string[];
  replay_references: readonly string[];
  append_only: true;
  recorded_at: string;
  ledger_hash: string;
}>;

export type RuntimeSupervisionCertificationReport = Readonly<{
  certification_id: string;
  phase: "8E.E";
  schema_version: "runtime-supervision-certification-gate/v8E.E";
  execution_id: string;
  mission_id: string;
  tenant_id: string;
  certification_state: RuntimeSupervisionCertificationLifecycleState;
  generated_at: string;
  read_only: true;
  advisory_only: true;
  controlled_autonomy_progression_allowed: boolean;
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  constitutionally_compliant: boolean;
  authority_enforced: boolean;
  operator_supremacy_preserved: boolean;
  tenant_isolated: boolean;
  integrity_verified: boolean;
  contract_validation: RuntimeSupervisionCertificationValidationSection;
  functional_validation: RuntimeSupervisionCertificationValidationSection;
  monitoring_validation: RuntimeSupervisionCertificationValidationSection;
  recommendation_validation: RuntimeSupervisionCertificationValidationSection;
  replay_validation: RuntimeSupervisionCertificationValidationSection;
  governance_validation: RuntimeSupervisionCertificationValidationSection;
  authority_validation: RuntimeSupervisionCertificationValidationSection;
  evidence_validation: RuntimeSupervisionCertificationValidationSection;
  integrity_validation: RuntimeSupervisionCertificationValidationSection;
  tests_passed: number;
  tests_failed: number;
  certification_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  source_supervision_contract: RuntimeSupervisionContract;
  source_observation_package: RuntimeObservationPackage;
  source_drift_health_package: DriftHealthPackage;
  source_recommendation_package: InterventionRecommendationPackage;
  certification_checks: readonly RuntimeSupervisionCertificationCheck[];
  certification_result: RuntimeSupervisionCertificationResult;
  certification_evidence: RuntimeSupervisionCertificationEvidence;
  decision_ledger_entry: RuntimeSupervisionCertificationLedgerEntry;
  replay_certification: RuntimeSupervisionCertificationReplayReport;
  observability: Readonly<{
    certification_test_count: number;
    pass_rate: number;
    critical_failure_rate: number;
    replay_reference_count: number;
    integrity_reference_count: number;
  }>;
  integrity_hash: string;
}>;

export type RuntimeSupervisionCertificationGateInput = Readonly<{
  scenario?: RuntimeSupervisionCertificationScenario;
  recommendationPackage?: InterventionRecommendationPackage;
}>;

export type RuntimeSupervisionCertificationVisibilitySurface = Readonly<{
  certification_id: string;
  certification_state: RuntimeSupervisionCertificationLifecycleState;
  controlled_autonomy_progression_allowed: boolean;
  critical_failure_count: number;
  failed_tests: readonly RuntimeSupervisionCertificationFailure[];
  replay_reference: string;
  integrity_status: "VALID" | "INVALID";
  integrity_hash: string;
}>;
