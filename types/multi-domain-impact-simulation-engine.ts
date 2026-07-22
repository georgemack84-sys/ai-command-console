import type { CounterfactualSimulationResult } from "@/types/counterfactual-adaptation-simulator";

export type MultiDomainImpactOutcome =
  | "PASS"
  | "CONDITIONAL_PASS"
  | "FAIL"
  | "INCONCLUSIVE"
  | "REQUIRES_MORE_EVIDENCE"
  | "REQUIRES_GOVERNANCE_REVIEW"
  | "REQUIRES_OPERATOR_REVIEW";

export type ImpactDomain =
  | "MISSION_IMPACT"
  | "RISK_IMPACT"
  | "CONFIDENCE_IMPACT"
  | "GOVERNANCE_IMPACT"
  | "OPERATOR_WORKFLOW_IMPACT"
  | "ROLLBACK_IMPACT"
  | "ADVERSARIAL_SIMULATION";

export type CrossDomainCorrelation =
  | "MISSION_RISK"
  | "MISSION_CONFIDENCE"
  | "MISSION_GOVERNANCE"
  | "MISSION_OPERATOR"
  | "RISK_CONFIDENCE"
  | "RISK_GOVERNANCE"
  | "CONFIDENCE_GOVERNANCE"
  | "GOVERNANCE_OPERATOR"
  | "ROLLBACK_GOVERNANCE"
  | "ADVERSARIAL_ALL_DOMAINS";

export type MultiDomainImpactFailure =
  | "COUNTERFACTUAL_SIMULATION_UNAVAILABLE"
  | "NONDETERMINISTIC_SIMULATION_BEHAVIOR"
  | "HIDDEN_CROSS_DOMAIN_REGRESSION"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "APPROVAL_WORKFLOW_DEGRADATION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "ROLLBACK_FAILURE"
  | "UNEXPLAINED_BEHAVIOR"
  | "REPLAY_INCONSISTENCY"
  | "CONFIDENCE_INSTABILITY"
  | "RISK_INSTABILITY"
  | "TENANT_ISOLATION_BREACH"
  | "ADVERSARIAL_SCENARIO_COMPROMISE"
  | "EVIDENCE_CORRUPTION"
  | "INTEGRITY_VERIFICATION_FAILURE";

export type MultiDomainImpactScenario =
  | "BASELINE"
  | "CONDITIONAL_MINOR_ISSUES"
  | "INCONCLUSIVE"
  | "MORE_EVIDENCE"
  | "NONDETERMINISTIC"
  | "HIDDEN_REGRESSION"
  | "GOVERNANCE_VIOLATION"
  | "CONSTITUTIONAL_VIOLATION"
  | "APPROVAL_WORKFLOW_DEGRADATION"
  | "OPERATOR_AUTHORITY_REDUCTION"
  | "ROLLBACK_FAILURE"
  | "UNEXPLAINED_BEHAVIOR"
  | "REPLAY_INCONSISTENCY"
  | "CONFIDENCE_INSTABILITY"
  | "RISK_INSTABILITY"
  | "TENANT_ISOLATION_BREACH"
  | "ADVERSARIAL_COMPROMISE"
  | "EVIDENCE_CORRUPTION"
  | "INTEGRITY_FAILURE";

export type DomainImpactAssessment = Readonly<{
  domain: ImpactDomain;
  measures: readonly string[];
  validation_requirements: readonly string[];
  impact_score: number;
  deterministic: boolean;
  explainable: boolean;
  passed: boolean;
  failures: readonly MultiDomainImpactFailure[];
  integrity_hash: string;
}>;

export type CorrelationAssessment = Readonly<{
  correlation: CrossDomainCorrelation;
  evaluated_domains: readonly ImpactDomain[];
  dependency_score: number;
  hidden_regression_detected: boolean;
  explanation: string;
  failures: readonly MultiDomainImpactFailure[];
  integrity_hash: string;
}>;

export type SimulationImpactAnalysis = Readonly<{
  analysis_id: string;
  proposal_id: string;
  tenant_id: string;
  simulation_reference: string;
  mission_impact: DomainImpactAssessment;
  risk_impact: DomainImpactAssessment;
  confidence_impact: DomainImpactAssessment;
  governance_impact: DomainImpactAssessment;
  operator_workflow_impact: DomainImpactAssessment;
  rollback_impact: DomainImpactAssessment;
  adversarial_results: DomainImpactAssessment;
  cross_domain_correlations: readonly CorrelationAssessment[];
  improvement_summary: string;
  degradation_summary: string;
  adverse_impacts: readonly MultiDomainImpactFailure[];
  hidden_behavior_detected: boolean;
  simulation_result: MultiDomainImpactOutcome;
  explanation: string;
  integrity_hash: string;
}>;

export type MultiDomainImpactMetrics = Readonly<{
  domains_evaluated: number;
  correlations_evaluated: number;
  improvement_score: number;
  degradation_score: number;
  operational_benefit_score: number;
  governance_stability_score: number;
  confidence_stability_score: number;
  risk_effectiveness_score: number;
  operator_impact_score: number;
  rollback_readiness_score: number;
  adversarial_resilience_score: number;
  cross_domain_dependency_score: number;
  failures: readonly MultiDomainImpactFailure[];
  integrity_hash: string;
}>;

export type MultiDomainImpactApiSurface = Readonly<{
  api_id: string;
  simulate_impact: "POST /multi-domain-impact-simulation-engine/simulate";
  retrieve_domains: "POST /multi-domain-impact-simulation-engine/domains";
  retrieve_correlations: "POST /multi-domain-impact-simulation-engine/correlations";
  retrieve_metrics: "POST /multi-domain-impact-simulation-engine/metrics";
  replay_analysis: "POST /multi-domain-impact-simulation-engine/replay";
  inspect_engine: "POST /multi-domain-impact-simulation-engine/inspect";
  retrieve_contract: "GET /multi-domain-impact-simulation-engine/contract";
  production_mutation_supported: false;
  governance_bypass_supported: false;
  operator_authority_reduction_supported: false;
  hidden_tradeoff_supported: false;
  advisory_only: true;
  fail_open_supported: false;
  integrity_hash: string;
}>;

export type MultiDomainImpactInput = Readonly<{
  scenario?: MultiDomainImpactScenario;
  proposal_id?: string;
  tenant_id?: string;
  counterfactual_simulation?: CounterfactualSimulationResult;
}>;

export type MultiDomainImpactResult = Readonly<{
  multi_domain_impact_simulation_engine_version: "multi-domain-impact-simulation-engine/v1";
  engine_identifier: "MultiDomainImpactSimulationEngine";
  api_surface: MultiDomainImpactApiSurface;
  counterfactual_simulation: CounterfactualSimulationResult;
  domains: readonly ImpactDomain[];
  correlations: readonly CrossDomainCorrelation[];
  domain_assessments: readonly DomainImpactAssessment[];
  correlation_assessments: readonly CorrelationAssessment[];
  impact_analysis: SimulationImpactAnalysis;
  metrics: MultiDomainImpactMetrics;
  outcome: MultiDomainImpactOutcome;
  failures: readonly MultiDomainImpactFailure[];
  deterministic: boolean;
  replayable: boolean;
  explainable: boolean;
  tenant_isolated: boolean;
  governance_preserved: boolean;
  constitutional_integrity_preserved: boolean;
  operator_authority_preserved: boolean;
  rollback_ready: boolean;
  adversarial_resilience_demonstrated: boolean;
  immutable_evidence_recorded: true;
  advisory_only: true;
  modifies_production_state: false;
  authorizes_implementation: false;
  mission_impact_report_hash: string;
  risk_impact_report_hash: string;
  confidence_impact_report_hash: string;
  governance_impact_report_hash: string;
  operator_workflow_impact_report_hash: string;
  rollback_validation_report_hash: string;
  adversarial_resilience_report_hash: string;
  cross_domain_correlation_report_hash: string;
  simulation_validation_ledger_entry_hash: string;
  replay_hash: string;
  integrity_hash: string;
}>;

export type MultiDomainImpactFoundation = Readonly<{
  multi_domain_impact_simulation_engine_version: "multi-domain-impact-simulation-engine/v1";
  domains: readonly ImpactDomain[];
  correlations: readonly CrossDomainCorrelation[];
  api_surface: MultiDomainImpactApiSurface;
  result: MultiDomainImpactResult;
}>;
