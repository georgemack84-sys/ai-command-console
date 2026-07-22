import type { FailureObservationLedger } from "@/types/failure-observation-monitoring";
import type { RecoveryIntelligenceLedger } from "@/types/recovery-weak-point-intelligence";
import type { ScenarioRegistry } from "@/types/scenario-definition-framework";
import type { StressInjectionLedger } from "@/types/stress-injection-engine";

export type ScenarioStressCertificationState = "PASS" | "CONDITIONAL_PASS" | "FAIL";
export type ScenarioStressCertificationCategory = "scenario" | "injection" | "observation" | "recovery" | "replay" | "governance" | "authority" | "integrity" | "explainability" | "readiness";
export type ScenarioStressCertificationScenario = "BASELINE" | "DOCUMENTATION_WARNING" | "AUTHORITY_ESCALATION" | "REPLAY_MISMATCH_UNNOTICED" | "CROSS_TENANT_ACCESS" | "HIDDEN_EXECUTION" | "HIDDEN_FAILURE_STATE" | "INTEGRITY_FAILURE" | "GOVERNANCE_BYPASS" | "STRESS_SCORE_INCONSISTENCY" | "RECOVERY_RECOMMENDATION_MISMATCH";
export type ScenarioStressCertificationFailure = "AUTHORITY_ESCALATION_DETECTED" | "REPLAY_MISMATCH_UNDETECTED" | "CROSS_TENANT_ACCESS_DETECTED" | "HIDDEN_EXECUTION_DETECTED" | "HIDDEN_FAILURE_STATE_DETECTED" | "INTEGRITY_VERIFICATION_FAILED" | "GOVERNANCE_BYPASS_DETECTED" | "STRESS_SCORE_INCONSISTENT" | "RECOVERY_RECOMMENDATION_UNREPRODUCIBLE" | "SCENARIO_DEFINITION_INVALID" | "STRESS_INJECTION_INVALID" | "OBSERVATION_INVALID" | "RECOVERY_INTELLIGENCE_INVALID" | "ADVISORY_ONLY_VIOLATION" | "NON_CRITICAL_DOCUMENTATION_WARNING";

export type ScenarioStressCertificationTestResult = Readonly<{
  test_id: string;
  name: string;
  category: ScenarioStressCertificationCategory;
  expected: ScenarioStressCertificationState;
  actual: ScenarioStressCertificationState;
  evidence_references: readonly string[];
  replay_reference: string;
  integrity_hash: string;
}>;

export type ScenarioStressCertificationReport = Readonly<{
  certification_id: string;
  phase: "8ALT.6";
  certification_version: "scenario-stress-certification-gate/v8ALT.6.5";
  simulation_suite_id: string;
  mission_id: string;
  tenant_id: string;
  certification_state: ScenarioStressCertificationState;
  overall_stress_score: number;
  overall_resilience_score: number;
  scenario_count: number;
  successful_scenarios: number;
  failed_scenarios: number;
  governance_validation: boolean;
  constitutional_validation: boolean;
  authority_validation: boolean;
  tenant_isolation_validation: boolean;
  replay_validation: boolean;
  integrity_validation: boolean;
  explainability_validation: boolean;
  identified_weak_points: readonly string[];
  recovery_recommendations: readonly string[];
  operator_visibility_status: boolean;
  tests: readonly ScenarioStressCertificationTestResult[];
  failures: readonly ScenarioStressCertificationFailure[];
  warnings: readonly string[];
  certification_timestamp: string;
  replay_reference: string;
  lineage_reference: string;
  integrity_hash: string;
  advisory_only: true;
  report_hash: string;
}>;

export type ScenarioStressCertificationLedger = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  reports: readonly ScenarioStressCertificationReport[];
  source_scenario_registry: ScenarioRegistry;
  source_stress_ledger: StressInjectionLedger;
  source_observation_ledger: FailureObservationLedger;
  source_recovery_ledger: RecoveryIntelligenceLedger;
  validation_evidence: readonly string[];
  replay_references: readonly string[];
  lineage_references: readonly string[];
  integrity_verification: readonly string[];
  append_only: true;
  read_only: true;
  ledger_hash: string;
}>;

export type ScenarioStressCertificationInput = Readonly<{
  scenario?: ScenarioStressCertificationScenario;
  tenant_id?: string;
  mission_id?: string;
  scenario_registry?: ScenarioRegistry;
  stress_ledger?: StressInjectionLedger;
  observation_ledger?: FailureObservationLedger;
  recovery_ledger?: RecoveryIntelligenceLedger;
}>;

export type ScenarioStressCertificationValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  scenario_valid: boolean;
  injection_valid: boolean;
  observation_valid: boolean;
  recovery_valid: boolean;
  replay_valid: boolean;
  governance_valid: boolean;
  constitutional_valid: boolean;
  authority_valid: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  operator_visible: boolean;
  advisory_only_enforced: boolean;
  failures: readonly ScenarioStressCertificationFailure[];
  validation_hash: string;
}>;

export type ScenarioStressCertificationReplayResult = Readonly<{
  replay_reference: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type ScenarioStressCertificationObservabilitySurface = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  certification_state: ScenarioStressCertificationState;
  tests_passed: number;
  tests_failed: number;
  production_ready: boolean;
  advisory_only: true;
  ledger_hash: string;
}>;

export type ScenarioStressCertificationContract = Readonly<{
  doctrine: Readonly<{
    gate_version: "scenario-stress-certification-gate/v8ALT.6.5";
    principles: readonly string[];
    certification_states: readonly ScenarioStressCertificationState[];
    categories: readonly ScenarioStressCertificationCategory[];
    pass_required_for_production: true;
    advisory_only: true;
  }>;
  ledger: ScenarioStressCertificationLedger;
  validation: ScenarioStressCertificationValidationResult;
  replay: ScenarioStressCertificationReplayResult;
  observability: ScenarioStressCertificationObservabilitySurface;
}>;
