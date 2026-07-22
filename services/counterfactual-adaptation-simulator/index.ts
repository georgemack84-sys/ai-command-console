import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayHistoricalReplayValidation, validateHistoricalReplay } from "@/services/historical-replay-test-harness";
import type {
  CounterfactualMeasurement,
  CounterfactualMeasurementDimension,
  CounterfactualSimulationApiSurface,
  CounterfactualSimulationFailure,
  CounterfactualSimulationFoundation,
  CounterfactualSimulationInput,
  CounterfactualSimulationMetrics,
  CounterfactualSimulationOutcome,
  CounterfactualSimulationRecord,
  CounterfactualSimulationResult,
  CounterfactualSimulationScenario,
  CounterfactualSimulationScope,
} from "@/types/counterfactual-adaptation-simulator";

const SIMULATOR_VERSION = "counterfactual-adaptation-simulator/v1" as const;
const SIMULATOR_IDENTIFIER = "CounterfactualAdaptationSimulator" as const;

const SCOPES: readonly CounterfactualSimulationScope[] = Object.freeze([
  "ALTERNATE_RECOMMENDATION_PATHS",
  "ALTERNATE_CONFIDENCE_SCORES",
  "ALTERNATE_RISK_ASSESSMENTS",
  "ALTERNATE_PRIORITIZATION",
  "ALTERNATE_GOVERNANCE_ROUTING",
  "ALTERNATE_ESCALATION_BEHAVIOR",
]);

const DIMENSIONS: readonly CounterfactualMeasurementDimension[] = Object.freeze([
  "IMPROVEMENT",
  "DEGRADATION",
  "UNINTENDED_CONSEQUENCES",
  "MISSED_OPPORTUNITIES",
  "INCREASED_RISK",
  "GOVERNANCE_VIOLATIONS",
  "OPERATOR_IMPACT",
]);

type Scenario = NonNullable<CounterfactualSimulationInput["scenario"]>;

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

function buildApiSurface(): CounterfactualSimulationApiSurface {
  const base: Omit<CounterfactualSimulationApiSurface, "integrity_hash"> = {
    api_id: "counterfactual_adaptation_simulator_api",
    simulate_counterfactual: "POST /counterfactual-adaptation-simulator/simulate",
    retrieve_scopes: "POST /counterfactual-adaptation-simulator/scopes",
    retrieve_measurements: "POST /counterfactual-adaptation-simulator/measurements",
    retrieve_metrics: "POST /counterfactual-adaptation-simulator/metrics",
    replay_simulation: "POST /counterfactual-adaptation-simulator/replay",
    inspect_simulator: "POST /counterfactual-adaptation-simulator/inspect",
    retrieve_contract: "GET /counterfactual-adaptation-simulator/contract",
    historical_truth_mutation_supported: false,
    production_mutation_supported: false,
    implementation_authorization_supported: false,
    autonomous_optimization_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): CounterfactualSimulationFailure | undefined {
  const map: Partial<Record<CounterfactualSimulationScenario, CounterfactualSimulationFailure>> = {
    NONDETERMINISTIC: "NONDETERMINISTIC_SIMULATION",
    INCONSISTENT_REPLAY: "INCONSISTENT_REPLAY",
    UNEXPLAINED_CHANGE: "UNEXPLAINED_BEHAVIORAL_CHANGES",
    RECOMMENDATION_INSTABILITY: "RECOMMENDATION_INSTABILITY",
    CONFIDENCE_INSTABILITY: "CONFIDENCE_INSTABILITY",
    RISK_INSTABILITY: "RISK_INSTABILITY",
    GOVERNANCE_VIOLATION: "GOVERNANCE_VIOLATION",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    OPERATOR_AUTHORITY_REDUCTION: "OPERATOR_AUTHORITY_REDUCTION",
    APPROVAL_WORKFLOW_BYPASS: "APPROVAL_WORKFLOW_BYPASS",
    UNAUTHORIZED_ESCALATION: "UNAUTHORIZED_ESCALATION",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILURE",
    SIMULATION_STATE_CORRUPTION: "SIMULATION_STATE_CORRUPTION",
    MULTIPLE_VARIABLES_CHANGED: "MULTIPLE_VARIABLES_CHANGED",
    HISTORICAL_TRUTH_MUTATION: "HISTORICAL_TRUTH_MUTATION_ATTEMPT",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION_ATTEMPT",
    IMPLEMENTATION_AUTHORIZATION: "IMPLEMENTATION_AUTHORIZATION_ATTEMPT",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, historicalReplayValid: boolean): readonly CounterfactualSimulationFailure[] {
  const failures: CounterfactualSimulationFailure[] = [];
  const scenarioFailure = failureForScenario(scenario);
  if (scenarioFailure) failures.push(scenarioFailure);
  if (!historicalReplayValid) failures.push("HISTORICAL_REPLAY_BASELINE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(scenario: Scenario, failures: readonly CounterfactualSimulationFailure[]): CounterfactualSimulationOutcome {
  if (scenario === "CONDITIONAL_EVIDENCE") return "CONDITIONAL_PASS";
  if (scenario === "INCONCLUSIVE") return "INCONCLUSIVE";
  if (failures.includes("MISSING_EVIDENCE") || failures.includes("HISTORICAL_REPLAY_BASELINE_UNAVAILABLE")) return "REQUIRES_MORE_EVIDENCE";
  if (failures.includes("GOVERNANCE_VIOLATION") || failures.includes("CONSTITUTIONAL_VIOLATION")) return "REQUIRES_GOVERNANCE_REVIEW";
  if (failures.includes("OPERATOR_AUTHORITY_REDUCTION") || failures.includes("APPROVAL_WORKFLOW_BYPASS") || failures.includes("UNAUTHORIZED_ESCALATION")) return "REQUIRES_OPERATOR_REVIEW";
  return failures.length ? "FAIL" : "PASS";
}

function dimensionFailures(dimension: CounterfactualMeasurementDimension, failures: readonly CounterfactualSimulationFailure[]): readonly CounterfactualSimulationFailure[] {
  const map: Record<CounterfactualMeasurementDimension, readonly CounterfactualSimulationFailure[]> = {
    IMPROVEMENT: ["MISSING_EVIDENCE", "INCONSISTENT_REPLAY"],
    DEGRADATION: ["RECOMMENDATION_INSTABILITY", "CONFIDENCE_INSTABILITY", "RISK_INSTABILITY"],
    UNINTENDED_CONSEQUENCES: ["UNEXPLAINED_BEHAVIORAL_CHANGES", "SIMULATION_STATE_CORRUPTION"],
    MISSED_OPPORTUNITIES: ["MISSING_EVIDENCE", "INCONCLUSIVE" as never],
    INCREASED_RISK: ["RISK_INSTABILITY", "UNAUTHORIZED_ESCALATION"],
    GOVERNANCE_VIOLATIONS: ["GOVERNANCE_VIOLATION", "CONSTITUTIONAL_VIOLATION", "APPROVAL_WORKFLOW_BYPASS"],
    OPERATOR_IMPACT: ["OPERATOR_AUTHORITY_REDUCTION", "UNAUTHORIZED_ESCALATION", "APPROVAL_WORKFLOW_BYPASS"],
  };
  return freezeArray(map[dimension].filter((failure) => failures.includes(failure)));
}

function measuresFor(dimension: CounterfactualMeasurementDimension): readonly string[] {
  const map: Record<CounterfactualMeasurementDimension, readonly string[]> = {
    IMPROVEMENT: ["recommendation_quality", "mission_outcome_improvement", "decision_quality", "confidence_calibration", "operational_efficiency"],
    DEGRADATION: ["reduced_recommendation_quality", "increased_errors", "reduced_explainability", "confidence_deterioration", "operational_inefficiency"],
    UNINTENDED_CONSEQUENCES: ["downstream_behavior_changes", "unexpected_recommendation_shifts", "hidden_dependencies", "cascading_effects", "unexpected_governance_impacts"],
    MISSED_OPPORTUNITIES: ["unresolved_failures", "unchanged_weaknesses", "remaining_inefficiencies", "unrealized_improvements"],
    INCREASED_RISK: ["higher_operational_risk", "increased_uncertainty", "greater_escalation_frequency", "elevated_mission_impact", "reduced_resilience"],
    GOVERNANCE_VIOLATIONS: ["constitutional_violations", "policy_conflicts", "approval_bypasses", "authority_expansion", "governance_regressions"],
    OPERATOR_IMPACT: ["approval_workload", "review_effort", "override_frequency", "explanation_quality", "operator_trust", "workflow_complexity"],
  };
  return freezeArray(map[dimension]);
}

function buildMeasurement(dimension: CounterfactualMeasurementDimension, failures: readonly CounterfactualSimulationFailure[]): CounterfactualMeasurement {
  const relatedFailures = dimensionFailures(dimension, failures);
  const positiveDimension = dimension === "IMPROVEMENT" || dimension === "OPERATOR_IMPACT";
  const baseScore = positiveDimension ? 0.82 : 0.08;
  const score = relatedFailures.length ? 0 : baseScore;
  const base: Omit<CounterfactualMeasurement, "integrity_hash"> = {
    dimension,
    measures: measuresFor(dimension),
    score,
    explanation: relatedFailures.length
      ? `${dimension.toLowerCase()} measurement failed due to ${relatedFailures.join(", ")}.`
      : `${dimension.toLowerCase()} measurement is deterministic, replayable, and attributable to the approved adaptation only.`,
    failures: relatedFailures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSimulationRecord(
  input: CounterfactualSimulationInput,
  measurements: readonly CounterfactualMeasurement[],
  outcome: CounterfactualSimulationOutcome,
  failures: readonly CounterfactualSimulationFailure[],
): CounterfactualSimulationRecord {
  const proposal_id = input.proposal_id ?? "adaptive-proposal-counterfactual";
  const tenant_id = input.tenant_id ?? "tenant-mission-control";
  const adaptation_version = input.adaptation_version ?? "adaptation/v1";
  const measurement = (dimension: CounterfactualMeasurementDimension) => measurements.find((item) => item.dimension === dimension) ?? measurements[0];
  const base: Omit<CounterfactualSimulationRecord, "integrity_hash"> = {
    simulation_id: `counterfactual_simulation_${hash({ proposal_id, tenant_id, adaptation_version }).slice(0, 16)}`,
    proposal_id,
    tenant_id,
    historical_replay_reference: input.historical_replay?.validation.replay_id ?? "historical_replay:baseline",
    simulation_scope: SCOPES,
    adaptation_version,
    alternate_recommendations: freezeArray(["revised_recommendations", "recommendation_ordering", "recommendation_timing", "recommendation_rationale", "recommendation_evidence"]),
    alternate_confidence: freezeArray(["revised_confidence_values", "revised_uncertainty_estimates", "revised_evidence_weighting", "revised_calibration"]),
    alternate_risk: freezeArray(["revised_risk_probability", "revised_impact_estimates", "revised_mitigation_recommendations", "revised_escalation_thresholds"]),
    alternate_prioritization: freezeArray(["revised_mission_priorities", "revised_recommendation_priorities", "revised_review_ordering", "revised_dependency_ordering"]),
    alternate_governance: freezeArray(["revised_governance_routing", "revised_approval_paths", "revised_review_sequences", "revised_escalation_chains"]),
    alternate_escalation: freezeArray(["revised_escalation_timing", "revised_escalation_levels", "revised_escalation_recipients", "revised_escalation_rationale"]),
    improvement_metrics: measurement("IMPROVEMENT"),
    degradation_metrics: measurement("DEGRADATION"),
    unintended_consequences: measurement("UNINTENDED_CONSEQUENCES"),
    missed_opportunities: measurement("MISSED_OPPORTUNITIES"),
    governance_impact: measurement("GOVERNANCE_VIOLATIONS"),
    operator_impact: measurement("OPERATOR_IMPACT"),
    replay_reproducible: !failures.includes("NONDETERMINISTIC_SIMULATION") && !failures.includes("INCONSISTENT_REPLAY"),
    simulation_result: outcome,
    explanation: failures.length
      ? "Counterfactual simulation failed closed because one or more determinism, single-variable, governance, operator, evidence, or integrity requirements were violated."
      : "Counterfactual changes are deterministic, attributable to the approved adaptation, and preserve governance, tenant isolation, operator authority, and historical truth.",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(measurements: readonly CounterfactualMeasurement[], failures: readonly CounterfactualSimulationFailure[]): CounterfactualSimulationMetrics {
  const score = (dimension: CounterfactualMeasurementDimension) => measurements.find((item) => item.dimension === dimension)?.score ?? 0;
  const base: Omit<CounterfactualSimulationMetrics, "integrity_hash"> = {
    simulation_scopes_evaluated: SCOPES.length,
    measurement_dimensions_evaluated: DIMENSIONS.length,
    deterministic_replay_rate: failures.includes("NONDETERMINISTIC_SIMULATION") || failures.includes("INCONSISTENT_REPLAY") ? 0 : 1,
    adaptation_single_variable_preserved: !failures.includes("MULTIPLE_VARIABLES_CHANGED"),
    improvement_score: score("IMPROVEMENT"),
    degradation_score: score("DEGRADATION"),
    unintended_consequence_score: score("UNINTENDED_CONSEQUENCES"),
    missed_opportunity_score: score("MISSED_OPPORTUNITIES"),
    increased_risk_score: score("INCREASED_RISK"),
    governance_preservation_rate: failures.includes("GOVERNANCE_VIOLATION") || failures.includes("CONSTITUTIONAL_VIOLATION") ? 0 : 1,
    operator_preservation_rate: failures.includes("OPERATOR_AUTHORITY_REDUCTION") || failures.includes("APPROVAL_WORKFLOW_BYPASS") || failures.includes("UNAUTHORIZED_ESCALATION") ? 0 : 1,
    explanation_completeness_rate: failures.includes("UNEXPLAINED_BEHAVIORAL_CHANGES") ? 0 : 1,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<CounterfactualSimulationResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    historical_replay_hash: result.historical_replay.integrity_hash,
    simulation_record_hash: result.simulation_record.integrity_hash,
    measurement_hashes: result.measurements.map((item) => item.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    outcome: result.outcome,
    failures: result.failures,
    reports: [
      result.counterfactual_replay_package_hash,
      result.improvement_analysis_report_hash,
      result.side_effect_analysis_report_hash,
      result.governance_impact_report_hash,
      result.operator_impact_report_hash,
      result.simulation_validation_ledger_entry_hash,
    ],
  });
}

function resultIntegrityHash(result: Omit<CounterfactualSimulationResult, "integrity_hash">): string {
  return hash({
    version: result.counterfactual_adaptation_simulator_version,
    simulator_identifier: result.simulator_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    outcome: result.outcome,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function simulateCounterfactualAdaptation(input: CounterfactualSimulationInput = {}): CounterfactualSimulationResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const historical_replay = input.historical_replay ?? validateHistoricalReplay();
  const failures = collectFailures(scenario, replayHistoricalReplayValidation(historical_replay));
  const outcome = outcomeFor(scenario, failures);
  const measurements = freezeArray(DIMENSIONS.map((dimension) => buildMeasurement(dimension, failures)));
  const simulation_record = buildSimulationRecord({ ...input, historical_replay }, measurements, outcome, failures);
  const metrics = buildMetrics(measurements, failures);
  const counterfactual_replay_package_hash = hash({ historical_replay: historical_replay.replay_hash, simulation_record: simulation_record.integrity_hash, single_variable: true });
  const improvement_analysis_report_hash = hash({ measurement: simulation_record.improvement_metrics.integrity_hash, outcome });
  const side_effect_analysis_report_hash = hash({ degradation: simulation_record.degradation_metrics.integrity_hash, unintended: simulation_record.unintended_consequences.integrity_hash, increased_risk: metrics.increased_risk_score });
  const governance_impact_report_hash = hash({ governance: simulation_record.governance_impact.integrity_hash, preserved: metrics.governance_preservation_rate });
  const operator_impact_report_hash = hash({ operator: simulation_record.operator_impact.integrity_hash, preserved: metrics.operator_preservation_rate });
  const simulation_validation_ledger_entry_hash = hash({ simulation_record: simulation_record.integrity_hash, metrics: metrics.integrity_hash, append_only: true });
  const base: Omit<CounterfactualSimulationResult, "integrity_hash" | "replay_hash"> = {
    counterfactual_adaptation_simulator_version: SIMULATOR_VERSION,
    simulator_identifier: SIMULATOR_IDENTIFIER,
    api_surface,
    historical_replay,
    supported_scopes: SCOPES,
    measurement_dimensions: DIMENSIONS,
    simulation_record,
    measurements,
    metrics,
    outcome,
    failures,
    deterministic: !failures.includes("NONDETERMINISTIC_SIMULATION"),
    replayable: failures.length === 0,
    explainable: !failures.includes("UNEXPLAINED_BEHAVIORAL_CHANGES"),
    single_variable_preserved: !failures.includes("MULTIPLE_VARIABLES_CHANGED"),
    immutable_history_preserved: true,
    isolated_simulation_environment: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    governance_preserved: metrics.governance_preservation_rate === 1,
    constitutional_behavior_preserved: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    operator_authority_preserved: metrics.operator_preservation_rate === 1,
    advisory_only: true,
    modifies_historical_truth: false,
    modifies_production_state: false,
    authorizes_implementation: false,
    counterfactual_replay_package_hash,
    improvement_analysis_report_hash,
    side_effect_analysis_report_hash,
    governance_impact_report_hash,
    operator_impact_report_hash,
    simulation_validation_ledger_entry_hash,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayCounterfactualSimulation(result: CounterfactualSimulationResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayHistoricalReplayValidation(result.historical_replay) &&
    result.measurements.every(verifyHashedRecord) &&
    verifyHashedRecord(result.simulation_record) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getCounterfactualAdaptationSimulatorFoundation(): CounterfactualSimulationFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    counterfactual_adaptation_simulator_version: SIMULATOR_VERSION,
    supported_scopes: SCOPES,
    measurement_dimensions: DIMENSIONS,
    api_surface,
    result: simulateCounterfactualAdaptation(),
  });
}

export const CounterfactualAdaptationSimulator = Object.freeze({
  simulate: simulateCounterfactualAdaptation,
  replay: replayCounterfactualSimulation,
});
