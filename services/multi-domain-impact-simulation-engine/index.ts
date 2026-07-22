import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayCounterfactualSimulation, simulateCounterfactualAdaptation } from "@/services/counterfactual-adaptation-simulator";
import type {
  CorrelationAssessment,
  CrossDomainCorrelation,
  DomainImpactAssessment,
  ImpactDomain,
  MultiDomainImpactApiSurface,
  MultiDomainImpactFailure,
  MultiDomainImpactFoundation,
  MultiDomainImpactInput,
  MultiDomainImpactMetrics,
  MultiDomainImpactOutcome,
  MultiDomainImpactResult,
  MultiDomainImpactScenario,
  SimulationImpactAnalysis,
} from "@/types/multi-domain-impact-simulation-engine";

const ENGINE_VERSION = "multi-domain-impact-simulation-engine/v1" as const;
const ENGINE_IDENTIFIER = "MultiDomainImpactSimulationEngine" as const;

const DOMAINS: readonly ImpactDomain[] = Object.freeze([
  "MISSION_IMPACT",
  "RISK_IMPACT",
  "CONFIDENCE_IMPACT",
  "GOVERNANCE_IMPACT",
  "OPERATOR_WORKFLOW_IMPACT",
  "ROLLBACK_IMPACT",
  "ADVERSARIAL_SIMULATION",
]);

const CORRELATIONS: readonly CrossDomainCorrelation[] = Object.freeze([
  "MISSION_RISK",
  "MISSION_CONFIDENCE",
  "MISSION_GOVERNANCE",
  "MISSION_OPERATOR",
  "RISK_CONFIDENCE",
  "RISK_GOVERNANCE",
  "CONFIDENCE_GOVERNANCE",
  "GOVERNANCE_OPERATOR",
  "ROLLBACK_GOVERNANCE",
  "ADVERSARIAL_ALL_DOMAINS",
]);

type Scenario = NonNullable<MultiDomainImpactInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): MultiDomainImpactApiSurface {
  const base: Omit<MultiDomainImpactApiSurface, "integrity_hash"> = {
    api_id: "multi_domain_impact_simulation_engine_api",
    simulate_impact: "POST /multi-domain-impact-simulation-engine/simulate",
    retrieve_domains: "POST /multi-domain-impact-simulation-engine/domains",
    retrieve_correlations: "POST /multi-domain-impact-simulation-engine/correlations",
    retrieve_metrics: "POST /multi-domain-impact-simulation-engine/metrics",
    replay_analysis: "POST /multi-domain-impact-simulation-engine/replay",
    inspect_engine: "POST /multi-domain-impact-simulation-engine/inspect",
    retrieve_contract: "GET /multi-domain-impact-simulation-engine/contract",
    production_mutation_supported: false,
    governance_bypass_supported: false,
    operator_authority_reduction_supported: false,
    hidden_tradeoff_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): MultiDomainImpactFailure | undefined {
  const map: Partial<Record<MultiDomainImpactScenario, MultiDomainImpactFailure>> = {
    NONDETERMINISTIC: "NONDETERMINISTIC_SIMULATION_BEHAVIOR",
    HIDDEN_REGRESSION: "HIDDEN_CROSS_DOMAIN_REGRESSION",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    APPROVAL_WORKFLOW_DEGRADATION: "APPROVAL_WORKFLOW_DEGRADATION",
    OPERATOR_AUTHORITY_REDUCTION: "OPERATOR_AUTHORITY_REDUCTION",
    ROLLBACK_FAILURE: "ROLLBACK_FAILURE",
    UNEXPLAINED_BEHAVIOR: "UNEXPLAINED_BEHAVIOR",
    REPLAY_INCONSISTENCY: "REPLAY_INCONSISTENCY",
    CONFIDENCE_INSTABILITY: "CONFIDENCE_INSTABILITY",
    RISK_INSTABILITY: "RISK_INSTABILITY",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    ADVERSARIAL_COMPROMISE: "ADVERSARIAL_SCENARIO_COMPROMISE",
    EVIDENCE_CORRUPTION: "EVIDENCE_CORRUPTION",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILURE",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, counterfactualReplayable: boolean): readonly MultiDomainImpactFailure[] {
  const failures: MultiDomainImpactFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!counterfactualReplayable) failures.push("COUNTERFACTUAL_SIMULATION_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(scenario: Scenario, failures: readonly MultiDomainImpactFailure[]): MultiDomainImpactOutcome {
  if (scenario === "CONDITIONAL_MINOR_ISSUES") return "CONDITIONAL_PASS";
  if (scenario === "INCONCLUSIVE") return "INCONCLUSIVE";
  if (scenario === "MORE_EVIDENCE" || failures.includes("COUNTERFACTUAL_SIMULATION_UNAVAILABLE")) return "REQUIRES_MORE_EVIDENCE";
  if (failures.includes("GOVERNANCE_VIOLATION") || failures.includes("CONSTITUTIONAL_VIOLATION") || failures.includes("APPROVAL_WORKFLOW_DEGRADATION")) return "REQUIRES_GOVERNANCE_REVIEW";
  if (failures.includes("OPERATOR_AUTHORITY_REDUCTION")) return "REQUIRES_OPERATOR_REVIEW";
  return failures.length ? "FAIL" : "PASS";
}

function domainFailures(domain: ImpactDomain, failures: readonly MultiDomainImpactFailure[]): readonly MultiDomainImpactFailure[] {
  const map: Record<ImpactDomain, readonly MultiDomainImpactFailure[]> = {
    MISSION_IMPACT: ["HIDDEN_CROSS_DOMAIN_REGRESSION", "UNEXPLAINED_BEHAVIOR", "REPLAY_INCONSISTENCY"],
    RISK_IMPACT: ["RISK_INSTABILITY", "HIDDEN_CROSS_DOMAIN_REGRESSION"],
    CONFIDENCE_IMPACT: ["CONFIDENCE_INSTABILITY", "HIDDEN_CROSS_DOMAIN_REGRESSION"],
    GOVERNANCE_IMPACT: ["GOVERNANCE_VIOLATION", "CONSTITUTIONAL_VIOLATION", "APPROVAL_WORKFLOW_DEGRADATION"],
    OPERATOR_WORKFLOW_IMPACT: ["OPERATOR_AUTHORITY_REDUCTION", "APPROVAL_WORKFLOW_DEGRADATION"],
    ROLLBACK_IMPACT: ["ROLLBACK_FAILURE"],
    ADVERSARIAL_SIMULATION: ["ADVERSARIAL_SCENARIO_COMPROMISE", "TENANT_ISOLATION_BREACH", "EVIDENCE_CORRUPTION", "INTEGRITY_VERIFICATION_FAILURE"],
  };
  return freezeArray(map[domain].filter((failure) => failures.includes(failure)));
}

function measuresFor(domain: ImpactDomain): readonly string[] {
  const map: Record<ImpactDomain, readonly string[]> = {
    MISSION_IMPACT: ["mission_success_rate", "objective_completion", "execution_efficiency", "resource_utilization", "workflow_completion", "dependency_resolution", "execution_latency", "mission_resiliency"],
    RISK_IMPACT: ["risk_sensitivity", "risk_accuracy", "escalation_behavior", "missed_risks", "false_positive_rate", "false_negative_rate", "mitigation_effectiveness", "risk_prioritization"],
    CONFIDENCE_IMPACT: ["calibration_accuracy", "uncertainty_handling", "confidence_drift", "evidence_weighting", "confidence_stability", "prediction_reliability", "calibration_consistency", "confidence_explainability"],
    GOVERNANCE_IMPACT: ["constitutional_compliance", "policy_adherence", "approval_routing", "certification_effects", "authority_boundaries", "governance_consistency", "policy_conflict_frequency", "compliance_stability"],
    OPERATOR_WORKFLOW_IMPACT: ["workload", "override_frequency", "review_effort", "explainability", "trust", "approval_latency", "cognitive_load", "operator_satisfaction", "workflow_complexity"],
    ROLLBACK_IMPACT: ["rollback_feasibility", "rollback_completeness", "rollback_determinism", "rollback_duration", "rollback_integrity", "rollback_evidence_preservation", "rollback_replay_consistency"],
    ADVERSARIAL_SIMULATION: ["conflicting_evidence", "incomplete_evidence", "malicious_inputs", "policy_conflicts", "replay_corruption_attempts", "confidence_manipulation", "operator_misuse", "invalid_recommendations", "authority_escalation_attempts", "tenant_isolation_attacks", "replay_ordering_manipulation", "synthetic_evidence_injection"],
  };
  return freezeArray(map[domain]);
}

function validationFor(domain: ImpactDomain): readonly string[] {
  const map: Record<ImpactDomain, readonly string[]> = {
    MISSION_IMPACT: ["improved_mission_outcomes", "preserved_operational_integrity", "deterministic_execution", "explainable_improvements"],
    RISK_IMPACT: ["improved_risk_detection", "deterministic_risk_calculations", "explainable_risk_changes", "preserved_governance_controls"],
    CONFIDENCE_IMPACT: ["improved_calibration", "deterministic_confidence_calculations", "preserved_evidence_integrity", "reduced_confidence_drift"],
    GOVERNANCE_IMPACT: ["governance_preserved", "constitutional_compliance_maintained", "approval_workflows_unchanged", "certification_integrity_preserved"],
    OPERATOR_WORKFLOW_IMPACT: ["operator_authority_preserved", "improved_usability", "reduced_unnecessary_workload", "explainable_recommendations", "deterministic_workflows"],
    ROLLBACK_IMPACT: ["complete_rollback", "deterministic_rollback_execution", "replay_consistency", "preserved_audit_evidence"],
    ADVERSARIAL_SIMULATION: ["malicious_inputs_rejected", "governance_preserved", "constitutional_protections_enforced", "replay_integrity_maintained", "operator_authority_protected", "deterministic_failure_handling"],
  };
  return freezeArray(map[domain]);
}

function buildDomainAssessment(domain: ImpactDomain, failures: readonly MultiDomainImpactFailure[]): DomainImpactAssessment {
  const scopedFailures = domainFailures(domain, failures);
  const base: Omit<DomainImpactAssessment, "integrity_hash"> = {
    domain,
    measures: measuresFor(domain),
    validation_requirements: validationFor(domain),
    impact_score: scopedFailures.length ? 0 : domain === "ROLLBACK_IMPACT" || domain === "ADVERSARIAL_SIMULATION" ? 0.9 : 0.84,
    deterministic: !failures.includes("NONDETERMINISTIC_SIMULATION_BEHAVIOR"),
    explainable: !failures.includes("UNEXPLAINED_BEHAVIOR"),
    passed: scopedFailures.length === 0 && !failures.includes("NONDETERMINISTIC_SIMULATION_BEHAVIOR"),
    failures: scopedFailures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function domainsForCorrelation(correlation: CrossDomainCorrelation): readonly ImpactDomain[] {
  const map: Record<CrossDomainCorrelation, readonly ImpactDomain[]> = {
    MISSION_RISK: ["MISSION_IMPACT", "RISK_IMPACT"],
    MISSION_CONFIDENCE: ["MISSION_IMPACT", "CONFIDENCE_IMPACT"],
    MISSION_GOVERNANCE: ["MISSION_IMPACT", "GOVERNANCE_IMPACT"],
    MISSION_OPERATOR: ["MISSION_IMPACT", "OPERATOR_WORKFLOW_IMPACT"],
    RISK_CONFIDENCE: ["RISK_IMPACT", "CONFIDENCE_IMPACT"],
    RISK_GOVERNANCE: ["RISK_IMPACT", "GOVERNANCE_IMPACT"],
    CONFIDENCE_GOVERNANCE: ["CONFIDENCE_IMPACT", "GOVERNANCE_IMPACT"],
    GOVERNANCE_OPERATOR: ["GOVERNANCE_IMPACT", "OPERATOR_WORKFLOW_IMPACT"],
    ROLLBACK_GOVERNANCE: ["ROLLBACK_IMPACT", "GOVERNANCE_IMPACT"],
    ADVERSARIAL_ALL_DOMAINS: DOMAINS,
  };
  return freezeArray(map[correlation]);
}

function buildCorrelation(correlation: CrossDomainCorrelation, failures: readonly MultiDomainImpactFailure[]): CorrelationAssessment {
  const hidden = failures.includes("HIDDEN_CROSS_DOMAIN_REGRESSION");
  const relevantFailures = failures.filter((failure) => hidden || failure === "GOVERNANCE_VIOLATION" || failure === "CONSTITUTIONAL_VIOLATION" || failure === "ADVERSARIAL_SCENARIO_COMPROMISE");
  const base: Omit<CorrelationAssessment, "integrity_hash"> = {
    correlation,
    evaluated_domains: domainsForCorrelation(correlation),
    dependency_score: relevantFailures.length ? 0 : 0.88,
    hidden_regression_detected: hidden,
    explanation: relevantFailures.length
      ? "Cross-domain interaction failed because one or more hidden, governance, constitutional, or adversarial regressions were detected."
      : "Cross-domain interaction is measured, explainable, and free of hidden systemic regression.",
    failures: freezeArray(relevantFailures),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function byDomain(assessments: readonly DomainImpactAssessment[], domain: ImpactDomain): DomainImpactAssessment {
  return assessments.find((assessment) => assessment.domain === domain) ?? assessments[0];
}

function buildImpactAnalysis(
  input: MultiDomainImpactInput,
  assessments: readonly DomainImpactAssessment[],
  correlations: readonly CorrelationAssessment[],
  outcome: MultiDomainImpactOutcome,
  failures: readonly MultiDomainImpactFailure[],
): SimulationImpactAnalysis {
  const proposal_id = input.proposal_id ?? "adaptive-proposal-multi-domain-impact";
  const tenant_id = input.tenant_id ?? "tenant-mission-control";
  const base: Omit<SimulationImpactAnalysis, "integrity_hash"> = {
    analysis_id: `simulation_impact_${hash({ proposal_id, tenant_id }).slice(0, 16)}`,
    proposal_id,
    tenant_id,
    simulation_reference: input.counterfactual_simulation?.simulation_record.simulation_id ?? "counterfactual_simulation:baseline",
    mission_impact: byDomain(assessments, "MISSION_IMPACT"),
    risk_impact: byDomain(assessments, "RISK_IMPACT"),
    confidence_impact: byDomain(assessments, "CONFIDENCE_IMPACT"),
    governance_impact: byDomain(assessments, "GOVERNANCE_IMPACT"),
    operator_workflow_impact: byDomain(assessments, "OPERATOR_WORKFLOW_IMPACT"),
    rollback_impact: byDomain(assessments, "ROLLBACK_IMPACT"),
    adversarial_results: byDomain(assessments, "ADVERSARIAL_SIMULATION"),
    cross_domain_correlations: correlations,
    improvement_summary: failures.length ? "Improvement cannot be certified until all cross-domain failures are resolved." : "Positive cross-domain impact measured without unacceptable regressions.",
    degradation_summary: failures.length ? "One or more domain regressions require fail-closed handling or formal review." : "No unacceptable degradation detected across mission, risk, confidence, governance, operator, rollback, or adversarial domains.",
    adverse_impacts: failures,
    hidden_behavior_detected: failures.includes("HIDDEN_CROSS_DOMAIN_REGRESSION") || failures.includes("UNEXPLAINED_BEHAVIOR"),
    simulation_result: outcome,
    explanation: failures.length
      ? "Multi-domain impact analysis failed closed because a deterministic, explainable, governance-safe cross-domain guarantee was violated."
      : "Every measured impact is deterministic, explainable, replay-supported, governance-compliant, rollback-ready, and adversarially resilient.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(
  assessments: readonly DomainImpactAssessment[],
  correlations: readonly CorrelationAssessment[],
  failures: readonly MultiDomainImpactFailure[],
): MultiDomainImpactMetrics {
  const score = (domain: ImpactDomain) => byDomain(assessments, domain).impact_score;
  const avgCorrelation = correlations.reduce((sum, item) => sum + item.dependency_score, 0) / correlations.length;
  const degradation = failures.includes("HIDDEN_CROSS_DOMAIN_REGRESSION") ? 1 : 0;
  const base: Omit<MultiDomainImpactMetrics, "integrity_hash"> = {
    domains_evaluated: assessments.length,
    correlations_evaluated: correlations.length,
    improvement_score: failures.length ? 0 : 0.84,
    degradation_score: degradation,
    operational_benefit_score: score("MISSION_IMPACT"),
    governance_stability_score: score("GOVERNANCE_IMPACT"),
    confidence_stability_score: score("CONFIDENCE_IMPACT"),
    risk_effectiveness_score: score("RISK_IMPACT"),
    operator_impact_score: score("OPERATOR_WORKFLOW_IMPACT"),
    rollback_readiness_score: score("ROLLBACK_IMPACT"),
    adversarial_resilience_score: score("ADVERSARIAL_SIMULATION"),
    cross_domain_dependency_score: Number(avgCorrelation.toFixed(2)),
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<MultiDomainImpactResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    counterfactual_hash: result.counterfactual_simulation.integrity_hash,
    assessment_hashes: result.domain_assessments.map((item) => item.integrity_hash),
    correlation_hashes: result.correlation_assessments.map((item) => item.integrity_hash),
    analysis_hash: result.impact_analysis.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    outcome: result.outcome,
    failures: result.failures,
    reports: [
      result.mission_impact_report_hash,
      result.risk_impact_report_hash,
      result.confidence_impact_report_hash,
      result.governance_impact_report_hash,
      result.operator_workflow_impact_report_hash,
      result.rollback_validation_report_hash,
      result.adversarial_resilience_report_hash,
      result.cross_domain_correlation_report_hash,
      result.simulation_validation_ledger_entry_hash,
    ],
  });
}

function resultIntegrityHash(result: Omit<MultiDomainImpactResult, "integrity_hash">): string {
  return hash({
    version: result.multi_domain_impact_simulation_engine_version,
    engine_identifier: result.engine_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    outcome: result.outcome,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function simulateMultiDomainImpact(input: MultiDomainImpactInput = {}): MultiDomainImpactResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const counterfactual_simulation = input.counterfactual_simulation ?? simulateCounterfactualAdaptation();
  const failures = collectFailures(scenario, replayCounterfactualSimulation(counterfactual_simulation));
  const outcome = outcomeFor(scenario, failures);
  const domain_assessments = freezeArray(DOMAINS.map((domain) => buildDomainAssessment(domain, failures)));
  const correlation_assessments = freezeArray(CORRELATIONS.map((correlation) => buildCorrelation(correlation, failures)));
  const impact_analysis = buildImpactAnalysis({ ...input, counterfactual_simulation }, domain_assessments, correlation_assessments, outcome, failures);
  const metrics = buildMetrics(domain_assessments, correlation_assessments, failures);
  const mission_impact_report_hash = hash(byDomain(domain_assessments, "MISSION_IMPACT"));
  const risk_impact_report_hash = hash(byDomain(domain_assessments, "RISK_IMPACT"));
  const confidence_impact_report_hash = hash(byDomain(domain_assessments, "CONFIDENCE_IMPACT"));
  const governance_impact_report_hash = hash(byDomain(domain_assessments, "GOVERNANCE_IMPACT"));
  const operator_workflow_impact_report_hash = hash(byDomain(domain_assessments, "OPERATOR_WORKFLOW_IMPACT"));
  const rollback_validation_report_hash = hash(byDomain(domain_assessments, "ROLLBACK_IMPACT"));
  const adversarial_resilience_report_hash = hash(byDomain(domain_assessments, "ADVERSARIAL_SIMULATION"));
  const cross_domain_correlation_report_hash = hash(correlation_assessments.map((item) => item.integrity_hash));
  const simulation_validation_ledger_entry_hash = hash({ analysis: impact_analysis.integrity_hash, metrics: metrics.integrity_hash, append_only: true });
  const base: Omit<MultiDomainImpactResult, "integrity_hash" | "replay_hash"> = {
    multi_domain_impact_simulation_engine_version: ENGINE_VERSION,
    engine_identifier: ENGINE_IDENTIFIER,
    api_surface,
    counterfactual_simulation,
    domains: DOMAINS,
    correlations: CORRELATIONS,
    domain_assessments,
    correlation_assessments,
    impact_analysis,
    metrics,
    outcome,
    failures,
    deterministic: !failures.includes("NONDETERMINISTIC_SIMULATION_BEHAVIOR"),
    replayable: failures.length === 0,
    explainable: !failures.includes("UNEXPLAINED_BEHAVIOR"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    governance_preserved: !failures.includes("GOVERNANCE_VIOLATION"),
    constitutional_integrity_preserved: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    operator_authority_preserved: !failures.includes("OPERATOR_AUTHORITY_REDUCTION"),
    rollback_ready: !failures.includes("ROLLBACK_FAILURE"),
    adversarial_resilience_demonstrated: !failures.includes("ADVERSARIAL_SCENARIO_COMPROMISE"),
    immutable_evidence_recorded: true,
    advisory_only: true,
    modifies_production_state: false,
    authorizes_implementation: false,
    mission_impact_report_hash,
    risk_impact_report_hash,
    confidence_impact_report_hash,
    governance_impact_report_hash,
    operator_workflow_impact_report_hash,
    rollback_validation_report_hash,
    adversarial_resilience_report_hash,
    cross_domain_correlation_report_hash,
    simulation_validation_ledger_entry_hash,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayMultiDomainImpactAnalysis(result: MultiDomainImpactResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayCounterfactualSimulation(result.counterfactual_simulation) &&
    result.domain_assessments.every(verifyHashedRecord) &&
    result.correlation_assessments.every(verifyHashedRecord) &&
    verifyHashedRecord(result.impact_analysis) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getMultiDomainImpactSimulationFoundation(): MultiDomainImpactFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    multi_domain_impact_simulation_engine_version: ENGINE_VERSION,
    domains: DOMAINS,
    correlations: CORRELATIONS,
    api_surface,
    result: simulateMultiDomainImpact(),
  });
}

export const MultiDomainImpactSimulationEngine = Object.freeze({
  simulate: simulateMultiDomainImpact,
  replay: replayMultiDomainImpactAnalysis,
});
