import type { OptimizationImpactAnalysisLedger } from "@/types/optimization-impact-analysis";

export type DeterministicOptimizationValidationState = "PENDING" | "DETERMINISTIC_VALIDATION" | "REPLAY_VALIDATION" | "GOVERNANCE_VALIDATION" | "CONSTITUTIONAL_VALIDATION" | "AUTHORITY_VALIDATION" | "TENANT_VALIDATION" | "MISSION_EQUIVALENCE_VALIDATION" | "PASSED";
export type DeterministicOptimizationOutcome = "VALID" | "CONDITIONAL" | "INVALID" | "REJECTED";
export type DeterministicOptimizationValidationScenario = "BASELINE" | "MISSING_IMPACT_LEDGER" | "IMPACT_LEDGER_NOT_READY" | "EXECUTION_SEQUENCE_MISMATCH" | "STATE_TRANSITION_MISMATCH" | "DECISION_ORDER_MISMATCH" | "SCHEDULING_MISMATCH" | "REPLAY_MISMATCH" | "REPLAY_LINEAGE_MISMATCH" | "GOVERNANCE_MISMATCH" | "CONSTITUTIONAL_MISMATCH" | "AUTHORITY_BOUNDARY_MISMATCH" | "TENANT_ISOLATION_FAILURE" | "MISSION_OUTCOME_MISMATCH" | "OPERATOR_VISIBILITY_FAILURE" | "EXPLAINABILITY_LOSS" | "AUTOMATIC_APPROVAL_ATTEMPT" | "INTEGRITY_FAILURE";
export type DeterministicOptimizationValidationFailure = "IMPACT_LEDGER_MISSING" | "IMPACT_LEDGER_NOT_READY" | "EXECUTION_SEQUENCE_MISMATCH_DETECTED" | "STATE_TRANSITION_MISMATCH_DETECTED" | "DECISION_ORDER_MISMATCH_DETECTED" | "SCHEDULING_MISMATCH_DETECTED" | "REPLAY_MISMATCH_DETECTED" | "REPLAY_LINEAGE_MISMATCH_DETECTED" | "GOVERNANCE_MISMATCH_DETECTED" | "CONSTITUTIONAL_MISMATCH_DETECTED" | "AUTHORITY_BOUNDARY_MISMATCH_DETECTED" | "TENANT_ISOLATION_FAILURE_DETECTED" | "MISSION_OUTCOME_MISMATCH_DETECTED" | "OPERATOR_VISIBILITY_FAILURE_DETECTED" | "EXPLAINABILITY_LOSS_DETECTED" | "AUTOMATIC_APPROVAL_ATTEMPTED" | "INTEGRITY_VERIFICATION_FAILED";

export type ValidationRecord = Readonly<{
  validation_id: string;
  opportunity_id: string;
  mission_id: string;
  execution_id: string;
  tenant_id: string;
  validation_status: DeterministicOptimizationOutcome;
  validation_timestamp: string;
  validation_duration: number;
  advisory_only: true;
  execution_authority: false;
  approval_authority: false;
  automatic_approval: boolean;
  recommendation_authority: false;
  integrity_hash: string;
}>;

export type DeterministicValidationRecord = Readonly<{
  deterministic_validation_id: string;
  opportunity_id: string;
  execution_sequence_match: boolean;
  state_transition_match: boolean;
  decision_order_match: boolean;
  scheduling_match: boolean;
  dependency_match: boolean;
  deterministic_score: number;
  confidence_score: number;
  replay_reference: string;
  integrity_hash: string;
  timestamp: string;
}>;

export type ReplayComparisonRecord = Readonly<{
  replay_validation_id: string;
  opportunity_id: string;
  baseline_replay: string;
  optimized_replay: string;
  replay_match: boolean;
  replay_order_match: boolean;
  replay_lineage_match: boolean;
  replay_hash_match: boolean;
  replay_score: number;
  integrity_hash: string;
  timestamp: string;
}>;

export type GovernanceValidationRecord = Readonly<{
  governance_validation_id: string;
  opportunity_id: string;
  policy_validation: "PASS" | "FAIL";
  governance_rule_validation: "PASS" | "FAIL";
  advisory_validation: "PASS" | "FAIL";
  governance_lineage_validation: "PASS" | "FAIL";
  governance_replay_validation: "PASS" | "FAIL";
  integrity_hash: string;
  timestamp: string;
}>;

export type ConstitutionalValidationRecord = Readonly<{
  constitutional_validation_id: string;
  opportunity_id: string;
  constitutional_rule_validation: "PASS" | "FAIL";
  constitutional_evidence_validation: "PASS" | "FAIL";
  constitutional_lineage_validation: "PASS" | "FAIL";
  constitutional_replay_validation: "PASS" | "FAIL";
  integrity_hash: string;
  timestamp: string;
}>;

export type AuthorityValidationRecord = Readonly<{
  authority_validation_id: string;
  opportunity_id: string;
  authority_boundary_validation: "PASS" | "FAIL";
  delegation_validation: "PASS" | "FAIL";
  operator_authority_validation: "PASS" | "FAIL";
  execution_authority_validation: "PASS" | "FAIL";
  integrity_hash: string;
  timestamp: string;
}>;

export type TenantIsolationValidationRecord = Readonly<{
  tenant_validation_id: string;
  opportunity_id: string;
  tenant_isolation_validation: "PASS" | "FAIL";
  cross_tenant_validation: "PASS" | "FAIL";
  replay_isolation_validation: "PASS" | "FAIL";
  evidence_isolation_validation: "PASS" | "FAIL";
  integrity_hash: string;
  timestamp: string;
}>;

export type MissionOutcomeEquivalenceRecord = Readonly<{
  mission_equivalence_id: string;
  opportunity_id: string;
  mission_result_match: boolean;
  recommendation_match: boolean;
  confidence_value_match: boolean;
  governance_outcome_match: boolean;
  completion_state_match: boolean;
  operator_visibility_preserved: boolean;
  explainability_preserved: boolean;
  equivalence_score: number;
  integrity_hash: string;
  timestamp: string;
}>;

export type DeterministicOptimizationValidationLedger = Readonly<{
  ledger_id: string;
  final_state: "DETERMINISTIC_OPTIMIZATION_VALIDATED" | "DETERMINISTIC_OPTIMIZATION_REJECTED";
  source_impact_ledger_id: string | null;
  validations: readonly ValidationRecord[];
  deterministic_records: readonly DeterministicValidationRecord[];
  replay_records: readonly ReplayComparisonRecord[];
  governance_records: readonly GovernanceValidationRecord[];
  constitutional_records: readonly ConstitutionalValidationRecord[];
  authority_records: readonly AuthorityValidationRecord[];
  tenant_records: readonly TenantIsolationValidationRecord[];
  mission_equivalence_records: readonly MissionOutcomeEquivalenceRecord[];
  failures: readonly DeterministicOptimizationValidationFailure[];
  advisory_only: true;
  execution_authority: false;
  approval_authority: false;
  automatic_approval: false;
  recommendation_authority: false;
  integrity_hash: string;
}>;

export type DeterministicOptimizationValidationResult = Readonly<{
  ledger_id: string;
  valid: boolean;
  impact_ledger_ready: boolean;
  every_acceptable_analysis_validated: boolean;
  deterministic_execution_preserved: boolean;
  replay_fidelity_preserved: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  authority_preserved: boolean;
  tenant_isolated: boolean;
  mission_outcomes_equivalent: boolean;
  operator_visibility_preserved: boolean;
  explainability_preserved: boolean;
  advisory_only: true;
  execution_authority_absent: boolean;
  approval_authority_absent: boolean;
  automatic_approval_absent: boolean;
  recommendation_authority_absent: boolean;
  ready_for_recommendation_engine: boolean;
  fail_closed: boolean;
  failures: readonly DeterministicOptimizationValidationFailure[];
  validation_hash: string;
}>;

export type DeterministicOptimizationValidationObservabilitySurface = Readonly<{
  ledger_id: string;
  final_state: string;
  validation_count: number;
  valid_count: number;
  invalid_count: number;
  failure_count: number;
  advisory_only: true;
  execution_authority: false;
  approval_authority: false;
  integrity_hash: string;
}>;

export type DeterministicOptimizationValidationInput = Readonly<{ scenario?: DeterministicOptimizationValidationScenario; impact_ledger?: OptimizationImpactAnalysisLedger | null; ledger?: DeterministicOptimizationValidationLedger }>;

export type DeterministicOptimizationValidationBundle = Readonly<{
  doctrine: Readonly<{
    contract_version: "deterministic-optimization-validation/v8ALT.8.3";
    final_state: "DETERMINISTIC_OPTIMIZATION_VALIDATED";
    workflow: readonly DeterministicOptimizationValidationState[];
    outcomes: readonly DeterministicOptimizationOutcome[];
    principles: readonly string[];
  }>;
  ledger: DeterministicOptimizationValidationLedger;
  validation: DeterministicOptimizationValidationResult;
  observability: DeterministicOptimizationValidationObservabilitySurface;
}>;
