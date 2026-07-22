import type { DriftDefenseArchitectureResult, DriftResponse, DriftSeverity } from "@/types/drift-defense-architecture";

export type AdversarialTestStatus = "PASS" | "VULNERABILITY_DETECTED" | "CONTAINED" | "REQUIRES_GOVERNANCE_REVIEW" | "FAIL_CLOSED";

export type AdversarialTestFailure =
  | "DRIFT_DEFENSE_ARCHITECTURE_UNAVAILABLE"
  | "UNAUTHORIZED_SCENARIO_MODIFICATION"
  | "POISONED_EVIDENCE_ATTACK"
  | "MALICIOUS_FEEDBACK_ATTACK"
  | "REPLAY_CORRUPTION_ATTACK"
  | "GOVERNANCE_BYPASS_ATTACK"
  | "AUTHORITY_ESCALATION_ATTACK"
  | "CONFIDENCE_MANIPULATION_ATTACK"
  | "STRATEGIC_DECEPTION_ATTACK"
  | "OPTIMIZATION_ATTACK"
  | "SYNTHETIC_HISTORY_ATTACK"
  | "FALSE_SUCCESS_PATTERN_ATTACK"
  | "CONFLICTING_EVIDENCE_ATTACK"
  | "ADVERSARIAL_OPERATOR_ATTACK"
  | "REPLAY_DIVERGENCE_ATTACK"
  | "TENANT_CONTAMINATION_ATTACK"
  | "EVIDENCE_LINEAGE_CORRUPTION"
  | "CERTIFICATION_BYPASS_ATTACK"
  | "POLICY_MANIPULATION_ATTACK"
  | "RECOMMENDATION_MANIPULATION_ATTACK"
  | "OPTIMIZATION_PRESSURE_ATTACK"
  | "OPERATOR_COLLUSION_ATTACK"
  | "SYNTHETIC_GOVERNANCE_EVENT"
  | "TIMING_ATTACK"
  | "DEPENDENCY_CORRUPTION_ATTACK"
  | "AUDIT_MANIPULATION_ATTACK"
  | "COORDINATED_ATTACK"
  | "MULTI_STAGE_ADAPTIVE_ATTACK"
  | "FAILED_CONTAINMENT"
  | "INCOMPLETE_DETECTION"
  | "GOVERNANCE_DEGRADATION"
  | "REPLAY_FAILURE"
  | "AUTHORITY_VIOLATION"
  | "CERTIFICATION_FAILURE"
  | "DEFENSIVE_GAP"
  | "INCOMPLETE_PROTECTION"
  | "UNCOVERED_ATTACK_VECTOR"
  | "MISSING_CONTAINMENT"
  | "INADEQUATE_MONITORING"
  | "NONDETERMINISTIC_TEST"
  | "NONREPLAYABLE_ATTACK_EVIDENCE"
  | "TENANT_ISOLATION_BREACH"
  | "UNKNOWN_ATTACK_BEHAVIOR";

export type AdversarialTestScenario =
  | "BASELINE"
  | "UNAUTHORIZED_SCENARIO_MODIFICATION"
  | "POISONED_EVIDENCE"
  | "MALICIOUS_FEEDBACK"
  | "REPLAY_CORRUPTION"
  | "GOVERNANCE_BYPASS"
  | "AUTHORITY_ESCALATION"
  | "CONFIDENCE_MANIPULATION"
  | "STRATEGIC_DECEPTION"
  | "OPTIMIZATION_ATTACK"
  | "SYNTHETIC_HISTORY"
  | "FALSE_SUCCESS_PATTERNS"
  | "CONFLICTING_EVIDENCE"
  | "ADVERSARIAL_OPERATORS"
  | "REPLAY_DIVERGENCE"
  | "TENANT_CONTAMINATION"
  | "EVIDENCE_LINEAGE_CORRUPTION"
  | "CERTIFICATION_BYPASS"
  | "POLICY_MANIPULATION"
  | "RECOMMENDATION_MANIPULATION"
  | "OPTIMIZATION_PRESSURE"
  | "OPERATOR_COLLUSION"
  | "SYNTHETIC_GOVERNANCE_EVENTS"
  | "TIMING_ATTACK"
  | "DEPENDENCY_CORRUPTION"
  | "AUDIT_MANIPULATION"
  | "COORDINATED_ATTACK"
  | "MULTI_STAGE_ADAPTIVE_ATTACK"
  | "FAILED_CONTAINMENT"
  | "INCOMPLETE_DETECTION"
  | "GOVERNANCE_DEGRADATION"
  | "REPLAY_FAILURE"
  | "AUTHORITY_VIOLATION"
  | "CERTIFICATION_FAILURE"
  | "DEFENSIVE_GAP"
  | "INCOMPLETE_PROTECTION"
  | "UNCOVERED_ATTACK_VECTOR"
  | "MISSING_CONTAINMENT"
  | "INADEQUATE_MONITORING"
  | "NONDETERMINISTIC"
  | "NONREPLAYABLE_EVIDENCE"
  | "TENANT_BREACH"
  | "UNKNOWN_BEHAVIOR";

export type AdversarialScenarioRecord = Readonly<{
  scenario_id: string;
  scenario_name: string;
  attack_category: string;
  severity: DriftSeverity;
  attack_objective: string;
  expected_defense: string;
  governance_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  replay_requirements: readonly string[];
  certification_requirements: readonly string[];
  approval_reference: string;
  version: string;
  integrity_hash: string;
}>;

export type AttackSimulationReport = Readonly<{
  report_id: string;
  simulation_environment: "isolated_non_production";
  simulated_attack_vectors: readonly string[];
  deterministic: true;
  isolated: true;
  replayable: true;
  evidence_backed: true;
  tenant_safe: boolean;
  production_mutation: false;
  simulation_summary: string;
  integrity_hash: string;
}>;

export type DefensiveValidationReport = Readonly<{
  report_id: string;
  detection_accuracy_score: number;
  containment_execution_score: number;
  governance_preservation_score: number;
  constitutional_enforcement_score: number;
  authority_preservation_score: number;
  replay_integrity_score: number;
  operator_visibility_score: number;
  recovery_execution_score: number;
  defensive_behavior_assessment: string;
  validation_failures: readonly AdversarialTestFailure[];
  integrity_hash: string;
}>;

export type AttackSuccessAnalysis = Readonly<{
  analysis_id: string;
  attack_success_score: number;
  attack_containment_score: number;
  attack_propagation_score: number;
  defensive_latency_score: number;
  governance_impact_score: number;
  constitutional_impact_score: number;
  replay_impact_score: number;
  recovery_success_score: number;
  residual_risk: string;
  successful_attacks: readonly AdversarialTestFailure[];
  integrity_hash: string;
}>;

export type DefensiveCoverageReport = Readonly<{
  report_id: string;
  evidence_validation_score: number;
  feedback_validation_score: number;
  replay_validation_score: number;
  governance_enforcement_score: number;
  authority_enforcement_score: number;
  confidence_validation_score: number;
  optimization_defense_score: number;
  tenant_isolation_score: number;
  certification_validation_score: number;
  recovery_validation_score: number;
  coverage_gap_analysis: string;
  detected_gaps: readonly AdversarialTestFailure[];
  integrity_hash: string;
}>;

export type ResilienceScoreReport = Readonly<{
  score_id: string;
  attack_resistance_score: number;
  containment_score: number;
  governance_resilience_score: number;
  constitutional_resilience_score: number;
  replay_resilience_score: number;
  recovery_score: number;
  defensive_coverage_score: number;
  integrity_hash: string;
}>;

export type AdversarialTestReport = Readonly<{
  report_id: string;
  executed_scenarios: readonly string[];
  detected_attacks: readonly AdversarialTestFailure[];
  successful_attacks: readonly AdversarialTestFailure[];
  blocked_attacks: readonly AdversarialTestFailure[];
  defensive_behavior: string;
  governance_impacts: readonly string[];
  constitutional_impacts: readonly string[];
  replay_impacts: readonly string[];
  recovery_analysis: string;
  supporting_evidence: readonly string[];
  recommendations: readonly string[];
  recommended_response: DriftResponse;
  containment_actions: readonly string[];
  severity: DriftSeverity;
  deterministic: true;
  replayable: true;
  explainable: true;
  evidence_backed: true;
  audit_ready: true;
  integrity_hash: string;
}>;

export type AdversarialReplayRecord = Readonly<{
  replay_id: string;
  attack_execution: readonly string[];
  defensive_decisions: readonly string[];
  containment_actions: readonly string[];
  governance_responses: readonly string[];
  operator_interventions: readonly string[];
  recovery_procedures: readonly string[];
  certification_outcomes: readonly string[];
  forensic_integrity_preserved: true;
  integrity_hash: string;
}>;

export type AdversarialTestRecord = Readonly<{
  test_id: string;
  tenant_id: string;
  scenario_id: string;
  attack_category: string;
  attack_severity: DriftSeverity;
  attack_success_score: number;
  defensive_coverage_score: number;
  governance_resilience_score: number;
  constitutional_resilience_score: number;
  replay_resilience_score: number;
  severity: DriftSeverity;
  detected_vulnerabilities: readonly AdversarialTestFailure[];
  affected_adaptations: readonly string[];
  affected_recommendations: readonly string[];
  containment_actions: readonly string[];
  recovery_actions: readonly string[];
  supporting_evidence: string;
  recommended_response: DriftResponse;
  replay_refs: readonly string[];
  timestamp: string;
  integrity_hash: string;
}>;

export type AdversarialTestingMetrics = Readonly<{
  attack_success_score: number;
  defensive_coverage_score: number;
  governance_resilience_score: number;
  constitutional_resilience_score: number;
  replay_resilience_score: number;
  containment_required: boolean;
  deterministic_assessment: boolean;
  replayable_assessment: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  failures: readonly AdversarialTestFailure[];
  integrity_hash: string;
}>;

export type AdversarialTestingApiSurface = Readonly<{
  api_id: string;
  run_adversarial_tests: "POST /adversarial-adaptation-testing/run";
  retrieve_scenario: "POST /adversarial-adaptation-testing/scenario";
  retrieve_simulation: "POST /adversarial-adaptation-testing/simulation";
  retrieve_validation: "POST /adversarial-adaptation-testing/validation";
  retrieve_attack_success: "POST /adversarial-adaptation-testing/attack-success";
  retrieve_coverage: "POST /adversarial-adaptation-testing/coverage";
  retrieve_resilience_score: "POST /adversarial-adaptation-testing/resilience-score";
  retrieve_report: "POST /adversarial-adaptation-testing/report";
  retrieve_adversarial_replay: "POST /adversarial-adaptation-testing/adversarial-replay";
  retrieve_ledger_record: "POST /adversarial-adaptation-testing/ledger";
  retrieve_metrics: "POST /adversarial-adaptation-testing/metrics";
  replay_testing: "POST /adversarial-adaptation-testing/replay";
  inspect_testing: "POST /adversarial-adaptation-testing/inspect";
  retrieve_contract: "GET /adversarial-adaptation-testing/contract";
  production_mutation_supported: false;
  attack_authorization_supported: false;
  governance_bypass_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type AdversarialTestingInput = Readonly<{
  scenario?: AdversarialTestScenario;
  tenant_id?: string;
  architecture_result?: DriftDefenseArchitectureResult;
}>;

export type AdversarialTestingResult = Readonly<{
  adversarial_adaptation_testing_version: "adversarial-adaptation-testing/v1";
  testing_identifier: "AdversarialAdaptationTesting";
  status: AdversarialTestStatus;
  api_surface: AdversarialTestingApiSurface;
  architecture_result: DriftDefenseArchitectureResult;
  scenario_record: AdversarialScenarioRecord;
  simulation_report: AttackSimulationReport;
  defensive_validation_report: DefensiveValidationReport;
  attack_success_analysis: AttackSuccessAnalysis;
  defensive_coverage_report: DefensiveCoverageReport;
  resilience_score_report: ResilienceScoreReport;
  adversarial_test_report: AdversarialTestReport;
  adversarial_replay: AdversarialReplayRecord;
  adversarial_test_record: AdversarialTestRecord;
  metrics: AdversarialTestingMetrics;
  failures: readonly AdversarialTestFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  evidence_backed: boolean;
  governance_preserved: boolean;
  constitutional_preserved: boolean;
  operator_authority_preserved: boolean;
  tenant_isolated: boolean;
  advisory_only: true;
  mutates_production_behavior: false;
  authorizes_attack: false;
  replay_hash: string;
  integrity_hash: string;
}>;

export type AdversarialTestingFoundation = Readonly<{
  adversarial_adaptation_testing_version: "adversarial-adaptation-testing/v1";
  api_surface: AdversarialTestingApiSurface;
  result: AdversarialTestingResult;
}>;
