import { runContinuousOptimizationFramework } from "@/services/continuous-optimization-framework";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptationSimulationBundle,
  AdaptationSimulationFailure,
  AdaptationSimulationInput,
  AdaptationSimulationOutcome,
  AdaptationSimulationResult,
  AdaptationSimulationTest,
  SimulationCategory,
  SimulationDivergence,
  SimulationDomain,
  SimulationLifecycleState,
  SimulationResultOutcome,
} from "@/types/adaptation-simulation-engine";

const VERSION = "adaptation-simulation-engine/v18.5" as const;
const IDENTIFIER = "AdaptationSimulationEngine" as const;
const DEFAULT_TENANT = "tenant_phase_18_simulation";
const DEFAULT_OPERATOR = "operator_phase_18_simulation";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly AdaptationSimulationFailure[], failure: AdaptationSimulationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: AdaptationSimulationInput["scenario"]): AdaptationSimulationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly AdaptationSimulationFailure[]): AdaptationSimulationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_SIMULATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["PROPOSED", "REGISTERED", "PREPARING", "SIMULATING", "VALIDATING", "ANALYZED", "RECORDED", "QUALIFICATION_READY"] as const satisfies readonly SimulationLifecycleState[]);
const simulationDomains = freezeArray(["OPERATIONAL_IMPACT", "GOVERNANCE_IMPACT", "REPLAY_IMPACT", "TENANT_ISOLATION_IMPACT", "RISK_IMPACT"] as const satisfies readonly SimulationDomain[]);
const simulationCategories = freezeArray(["OPERATIONAL", "GOVERNANCE", "REPLAY", "TENANT_ISOLATION", "RISK"] as const satisfies readonly SimulationCategory[]);
const simulationOutcomes = freezeArray(["PASS", "PASS_WITH_WARNINGS", "FAIL", "REQUIRES_REVIEW", "REQUIRES_MORE_EVIDENCE"] as const satisfies readonly SimulationResultOutcome[]);
const divergenceClasses = freezeArray(["NONE", "EXPECTED", "BENEFICIAL", "HARMFUL", "GOVERNANCE_CRITICAL", "TENANT_ISOLATION", "REPLAY_INCONSISTENT", "NONDETERMINISTIC", "UNEXPLAINED"] as const satisfies readonly SimulationDivergence[]);

function certTest(name: string, passed: boolean, failure: AdaptationSimulationFailure, evidence_refs: readonly string[]): AdaptationSimulationTest {
  const actual: AdaptationSimulationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_SIMULATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("adaptation_simulation_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<AdaptationSimulationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ optimization: result.continuous_optimization_ref, engine: result.simulation_engine.integrity_hash, impact: result.impact_simulator.integrity_hash, counterfactual: result.counterfactual_simulation.integrity_hash, evidence: result.evidence_registry.integrity_hash, governance: result.governance_validation.integrity_hash, replay: result.replay_validation.integrity_hash, risk: result.risk_assessment.integrity_hash, qualification: result.qualification_recommendation.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<AdaptationSimulationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runAdaptationSimulationEngine(input: AdaptationSimulationInput = {}): AdaptationSimulationResult {
  const optimization = runContinuousOptimizationFramework({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: AdaptationSimulationFailure[] = optimization.outcome === "PASS" ? [] : ["PHASE_18_4_OPTIMIZATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_SIMULATION_WARNING"));
  const simulationId = input.simulation_id ?? id("simulation", optimization.integrity_hash);
  const proposalId = input.proposal_id ?? optimization.recommendation_generator.recommendations[0]?.recommendation_id ?? id("proposal", simulationId);
  const deterministic = !has(failures, "SIMULATIONS_NOT_DETERMINISTIC") && !has(failures, "COUNTERFACTUAL_ANALYSIS_NOT_DETERMINISTIC");
  const evidenceReproducible = !has(failures, "EVIDENCE_NOT_REPRODUCIBLE") && !has(failures, "SIMULATION_EVIDENCE_MUTABLE");
  const replay = !has(failures, "REPLAY_NOT_VERIFIED");
  const governance = !has(failures, "GOVERNANCE_IMPACT_NOT_VALIDATED");
  const impactExplainable = !has(failures, "OPERATIONAL_IMPACT_NOT_EXPLAINABLE");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_PRESERVED");
  const riskReproducible = !has(failures, "RISK_ASSESSMENTS_NOT_REPRODUCIBLE");
  const lineage = !has(failures, "SIMULATION_LINEAGE_INCOMPLETE");
  const qualificationGoverned = !has(failures, "QUALIFICATION_RECOMMENDATIONS_NOT_GOVERNED");
  const audit = !has(failures, "SIMULATION_AUDIT_INCOMPLETE");
  const immutableHistory = !has(failures, "OPERATIONAL_HISTORY_MODIFIED");
  const advisory = !has(failures, "AUTHORITY_BOUNDARY_NOT_PRESERVED");
  const failClosed = !has(failures, "FAIL_CLOSED_NOT_ENFORCED");
  const evidenceRefs = freezeArray(evidenceReproducible ? [optimization.integrity_hash, optimization.certification_package.integrity_hash, ...optimization.recommendation_generator.recommendations.map((recommendation) => recommendation.integrity_hash)] : []);
  const replayRefs = freezeArray(replay ? [optimization.replay_hash] : []);
  const governanceRefs = freezeArray(governance ? [optimization.governance.integrity_hash, optimization.certification_package.integrity_hash] : []);
  const harmfulDivergence = !deterministic ? "NONDETERMINISTIC" : !replay ? "REPLAY_INCONSISTENT" : !tenantIsolation ? "TENANT_ISOLATION" : !governance ? "GOVERNANCE_CRITICAL" : "NONE";

  const simulation_engine = nested({ engine_id: id("adaptation_simulation_engine", simulationId), deterministic_execution: deterministic, adaptation_evaluation: deterministic, reproducible_evidence_generation: evidenceReproducible, baseline_comparison: deterministic, governance_preservation_validation: governance, replay_preservation_validation: replay, tenant_isolation_validation: tenantIsolation, risk_evaluation: riskReproducible, divergence_identification: deterministic, qualification_support: qualificationGoverned, advisory_only: advisory, fail_closed: failClosed });
  const impact_simulator = nested({ simulator_id: id("operational_impact_simulator", simulationId), execution_latency_measured: impactExplainable, operational_throughput_measured: impactExplainable, monitoring_effectiveness_measured: impactExplainable, optimization_effectiveness_measured: impactExplainable, governance_overhead_measured: impactExplainable, certification_impact_measured: impactExplainable, resource_utilization_measured: impactExplainable, metrics_evidentiary_only: advisory, explainable: impactExplainable });
  const counterfactual_simulation = nested({ framework_id: id("counterfactual_simulation", simulationId), baseline_behavior_evaluated: deterministic, proposed_behavior_evaluated: deterministic, expected_improvements_evaluated: deterministic, unintended_regressions_evaluated: deterministic, operational_tradeoffs_evaluated: deterministic, governance_implications_evaluated: deterministic && governance, certification_implications_evaluated: deterministic, operational_history_modified: !immutableHistory, deterministic_analysis: deterministic });
  const records = freezeArray(simulationCategories.map((simulation_category, index) => nested({ simulation_id: id("simulation_record", { simulationId, simulation_category }), proposal_id: proposalId, simulation_category, operational_scope: "continuous-operations", baseline_refs: evidenceRefs, simulated_refs: [id("simulated_behavior", { simulationId, simulation_category })], replay_refs: replayRefs, governance_refs: governanceRefs, evidence_refs: evidenceRefs, observed_impacts: freezeArray([simulationDomains[index], "qualification-readiness"]), risk_assessment: riskReproducible ? "risk assessment reproducible" : "risk assessment not reproducible", divergence_result: index === 0 ? "BENEFICIAL" as const : harmfulDivergence as SimulationDivergence, simulation_outcome: blockingFailures.length === 0 ? "PASS" as const : failClosed ? "FAIL" as const : "REQUIRES_REVIEW" as const, certification_lineage: [optimization.certification_package.integrity_hash] })));
  const evidence_registry = nested({ registry_id: id("simulation_evidence_registry", simulationId), records, immutable_records: evidenceReproducible, append_only: evidenceReproducible, lifecycle: lifecycleStates, lineage_complete: lineage, audit_complete: audit });
  const governance_validation = nested({ validation_id: id("simulation_governance_validation", simulationId), governance_before_approval: governance, governance_impact_validated: governance, constitutional_authority_preserved: advisory, policy_compliance: governance, approval_requirements_validated: governance, certification_effects_validated: governance, tenant_isolation_preserved: tenantIsolation, replay_validated_before_qualification: replay });
  const replay_validation = nested({ validation_id: id("simulation_replay_validation", simulationId), deterministic_replay: deterministic && replay, execution_ordering_verified: replay, evidence_reconstruction_verified: replay && evidenceReproducible, replay_lineage_complete: replay && lineage, replay_reproducible: replay });
  const risk_assessment = nested({ assessment_id: id("simulation_risk_assessment", simulationId), operational_risk: riskReproducible, governance_risk: riskReproducible && governance, replay_risk: riskReproducible && replay, optimization_risk: riskReproducible, failure_propagation: riskReproducible, reproducible: riskReproducible, harmful_divergence_blocks_qualification: records.every((record) => !["HARMFUL", "GOVERNANCE_CRITICAL", "TENANT_ISOLATION", "REPLAY_INCONSISTENT", "NONDETERMINISTIC", "UNEXPLAINED"].includes(record.divergence_result)) });
  const blockingDivergences = freezeArray(records.map((record) => record.divergence_result).filter((divergence): divergence is SimulationDivergence => ["HARMFUL", "GOVERNANCE_CRITICAL", "TENANT_ISOLATION", "REPLAY_INCONSISTENT", "NONDETERMINISTIC", "UNEXPLAINED"].includes(divergence)));
  const qualification_recommendation = nested({ recommendation_id: id("simulation_qualification", simulationId), simulation_refs: records.map((record) => record.integrity_hash), governed: qualificationGoverned && governance, advisory_only: advisory, qualification_ready: blockingDivergences.length === 0 && blockingFailures.length === 0, outcome: blockingDivergences.length === 0 && blockingFailures.length === 0 ? "QUALIFICATION_READY" as const : failClosed ? "BLOCKED" as const : "REQUIRES_REVIEW" as const, blocking_divergences: blockingDivergences });
  const certification_package = nested({ package_id: id("adaptation_simulation_certification", simulationId), simulations_deterministic: simulation_engine.deterministic_execution, evidence_reproducible: evidence_registry.immutable_records && evidence_registry.append_only, replay_verified: replay_validation.replay_reproducible && replay_validation.replay_lineage_complete, governance_impact_validated: governance_validation.governance_impact_validated, operational_impact_explainable: impact_simulator.explainable, tenant_isolation_preserved: governance_validation.tenant_isolation_preserved, risk_assessments_reproducible: risk_assessment.reproducible && risk_assessment.harmful_divergence_blocks_qualification, counterfactual_analysis_deterministic: counterfactual_simulation.deterministic_analysis && !counterfactual_simulation.operational_history_modified, simulation_lineage_complete: evidence_registry.lineage_complete, qualification_recommendations_governed: qualification_recommendation.governed && qualification_recommendation.advisory_only, simulation_audit_complete: evidence_registry.audit_complete, adaptation_simulation_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Simulations deterministic", certification_package.simulations_deterministic, "SIMULATIONS_NOT_DETERMINISTIC", [simulation_engine.integrity_hash]),
    certTest("Evidence reproducible", certification_package.evidence_reproducible, "EVIDENCE_NOT_REPRODUCIBLE", [evidence_registry.integrity_hash]),
    certTest("Replay verified", certification_package.replay_verified, "REPLAY_NOT_VERIFIED", [replay_validation.integrity_hash]),
    certTest("Governance impact validated", certification_package.governance_impact_validated, "GOVERNANCE_IMPACT_NOT_VALIDATED", [governance_validation.integrity_hash]),
    certTest("Operational impact explainable", certification_package.operational_impact_explainable, "OPERATIONAL_IMPACT_NOT_EXPLAINABLE", [impact_simulator.integrity_hash]),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation_preserved, "TENANT_ISOLATION_NOT_PRESERVED", [governance_validation.integrity_hash]),
    certTest("Risk assessments reproducible", certification_package.risk_assessments_reproducible, "RISK_ASSESSMENTS_NOT_REPRODUCIBLE", [risk_assessment.integrity_hash]),
    certTest("Counterfactual analysis deterministic", certification_package.counterfactual_analysis_deterministic, "COUNTERFACTUAL_ANALYSIS_NOT_DETERMINISTIC", [counterfactual_simulation.integrity_hash]),
    certTest("Simulation lineage complete", certification_package.simulation_lineage_complete, "SIMULATION_LINEAGE_INCOMPLETE", [evidence_registry.integrity_hash]),
    certTest("Qualification recommendations governed", certification_package.qualification_recommendations_governed, "QUALIFICATION_RECOMMENDATIONS_NOT_GOVERNED", [qualification_recommendation.integrity_hash]),
    certTest("Simulation audit complete", certification_package.simulation_audit_complete, "SIMULATION_AUDIT_INCOMPLETE", [evidence_registry.integrity_hash]),
    certTest("Adaptation simulation certified", certification_package.adaptation_simulation_certified, "ADAPTATION_SIMULATION_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is AdaptationSimulationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<AdaptationSimulationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, continuous_optimization_ref: optimization.integrity_hash, simulation_engine, impact_simulator, counterfactual_simulation, evidence_registry, governance_validation, replay_validation, risk_assessment, qualification_recommendation, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAdaptationSimulationEngine(result = runAdaptationSimulationEngine()) {
  const engine_valid = verify(result.simulation_engine) && Object.entries(result.simulation_engine).filter(([key]) => !["engine_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const impact_valid = verify(result.impact_simulator) && Object.entries(result.impact_simulator).filter(([key]) => !["simulator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const counterfactual_valid = verify(result.counterfactual_simulation) && Object.entries(result.counterfactual_simulation).filter(([key]) => !["framework_id", "operational_history_modified", "integrity_hash"].includes(key)).every(([, value]) => value === true) && !result.counterfactual_simulation.operational_history_modified;
  const evidence_valid = verify(result.evidence_registry) && result.evidence_registry.records.length === 5 && result.evidence_registry.records.every((record) => verify(record) && record.baseline_refs.length > 0 && record.simulated_refs.length > 0 && record.replay_refs.length > 0 && record.governance_refs.length > 0 && record.evidence_refs.length > 0 && record.certification_lineage.length > 0 && record.simulation_outcome === "PASS" && !["HARMFUL", "GOVERNANCE_CRITICAL", "TENANT_ISOLATION", "REPLAY_INCONSISTENT", "NONDETERMINISTIC", "UNEXPLAINED"].includes(record.divergence_result)) && result.evidence_registry.immutable_records && result.evidence_registry.append_only && result.evidence_registry.lifecycle.length === 8 && result.evidence_registry.lineage_complete && result.evidence_registry.audit_complete;
  const governance_valid = verify(result.governance_validation) && Object.entries(result.governance_validation).filter(([key]) => !["validation_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const replay_valid = verify(result.replay_validation) && Object.entries(result.replay_validation).filter(([key]) => !["validation_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const risk_valid = verify(result.risk_assessment) && Object.entries(result.risk_assessment).filter(([key]) => !["assessment_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const qualification_valid = verify(result.qualification_recommendation) && result.qualification_recommendation.simulation_refs.length === 5 && result.qualification_recommendation.governed && result.qualification_recommendation.advisory_only && result.qualification_recommendation.qualification_ready && result.qualification_recommendation.outcome === "QUALIFICATION_READY" && result.qualification_recommendation.blocking_divergences.length === 0;
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 12 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && impact_valid && counterfactual_valid && evidence_valid && governance_valid && replay_valid && risk_valid && qualification_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, impact_valid, counterfactual_valid, evidence_valid, governance_valid, replay_valid, risk_valid, qualification_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayAdaptationSimulationEngine(result = runAdaptationSimulationEngine()): boolean {
  const replayed = runAdaptationSimulationEngine();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAdaptationSimulationEngine(result).valid;
}

export function getAdaptationSimulationEngineBundle(): AdaptationSimulationBundle {
  const result = runAdaptationSimulationEngine();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "continuous-optimization-framework/v18.4" as const, lifecycle_states: lifecycleStates, simulation_domains: simulationDomains, simulation_categories: simulationCategories, simulation_outcomes: simulationOutcomes, divergence_classes: divergenceClasses, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateAdaptationSimulationEngine(result) });
}

export const AdaptationSimulationEngineService = Object.freeze({ run: runAdaptationSimulationEngine, validate: validateAdaptationSimulationEngine, replay: replayAdaptationSimulationEngine });
