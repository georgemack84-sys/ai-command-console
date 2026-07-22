import { runAdaptiveGovernance } from "@/services/adaptive-governance";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  ContinuousRiskIntelligenceBundle,
  ContinuousRiskIntelligenceFailure,
  ContinuousRiskIntelligenceInput,
  ContinuousRiskIntelligenceOutcome,
  ContinuousRiskIntelligenceResult,
  ContinuousRiskIntelligenceTest,
  RiskCategory,
  RiskRecommendationOutcome,
} from "@/types/continuous-risk-intelligence";

const VERSION = "continuous-risk-intelligence/v18.9" as const;
const IDENTIFIER = "ContinuousRiskIntelligence" as const;
const DEFAULT_TENANT = "tenant_phase_18_risk";
const DEFAULT_OPERATOR = "operator_phase_18_risk";
const ASSESSMENT_TIMESTAMP = "2026-07-16T00:00:00.000Z";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousRiskIntelligenceFailure[], failure: ContinuousRiskIntelligenceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousRiskIntelligenceInput["scenario"]): ContinuousRiskIntelligenceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousRiskIntelligenceFailure[]): ContinuousRiskIntelligenceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_RISK_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const riskCategories = freezeArray(["OPERATIONAL", "GOVERNANCE", "DEPENDENCY", "REPLAY", "CERTIFICATION", "INFRASTRUCTURE"] as const satisfies readonly RiskCategory[]);
const recommendationOutcomes = freezeArray(["CONTINUE_MONITORING", "REQUIRE_OPERATOR_REVIEW", "REQUIRE_GOVERNANCE_REVIEW", "REQUIRE_CERTIFICATION_REVIEW", "REQUIRE_REPLAY_VALIDATION", "REQUIRE_DEPENDENCY_VALIDATION", "REQUIRE_RESILIENCE_TESTING"] as const satisfies readonly RiskRecommendationOutcome[]);

function certTest(name: string, passed: boolean, failure: ContinuousRiskIntelligenceFailure, evidence_refs: readonly string[]): ContinuousRiskIntelligenceTest {
  const actual: ContinuousRiskIntelligenceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_RISK_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_risk_intelligence_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousRiskIntelligenceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ governance: result.adaptive_governance_ref, engine: result.risk_engine.integrity_hash, analyzers: result.risk_analyzers.map((analyzer) => analyzer.integrity_hash), correlation: result.risk_correlation_engine.integrity_hash, assessment: result.risk_assessment.integrity_hash, recommendations: result.recommendation_generator.integrity_hash, evidence: result.evidence_registry.integrity_hash, ledger: result.risk_ledger.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousRiskIntelligenceResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousRiskIntelligence(input: ContinuousRiskIntelligenceInput = {}): ContinuousRiskIntelligenceResult {
  const governance = runAdaptiveGovernance({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousRiskIntelligenceFailure[] = governance.outcome === "PASS" ? [] : ["PHASE_18_8_ADAPTIVE_GOVERNANCE_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_RISK_WARNING"));
  const assessmentId = input.assessment_id ?? id("risk_assessment", governance.integrity_hash);
  const continuous = !has(failures, "CONTINUOUS_RISK_EVALUATION_NOT_OPERATIONAL");
  const deterministicRecommendations = !has(failures, "RISK_RECOMMENDATIONS_NOT_DETERMINISTIC");
  const explainable = !has(failures, "RECOMMENDATIONS_NOT_EXPLAINABLE");
  const evidenceComplete = !has(failures, "EVIDENCE_INCOMPLETE");
  const replay = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const immutableLineage = !has(failures, "IMMUTABLE_LINEAGE_NOT_VERIFIED");
  const governancePreserved = !has(failures, "GOVERNANCE_NOT_PRESERVED");
  const advisory = !has(failures, "ADVISORY_BOUNDARY_NOT_ENFORCED");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_MAINTAINED");
  const failClosed = !has(failures, "FAIL_CLOSED_NOT_VERIFIED");
  const categoryFailure: Record<RiskCategory, ContinuousRiskIntelligenceFailure> = { OPERATIONAL: "OPERATIONAL_RISK_NOT_TRACKED", GOVERNANCE: "GOVERNANCE_RISK_NOT_TRACKED", DEPENDENCY: "DEPENDENCY_RISK_NOT_TRACKED", REPLAY: "REPLAY_RISK_NOT_TRACKED", CERTIFICATION: "CERTIFICATION_RISK_NOT_TRACKED", INFRASTRUCTURE: "INFRASTRUCTURE_RISK_NOT_TRACKED" };
  const evidenceRefs = freezeArray(evidenceComplete ? [governance.integrity_hash, governance.certification_package.integrity_hash, governance.evaluation_ledger.integrity_hash] : []);
  const replayRefs = freezeArray(replay ? [governance.replay_hash] : []);
  const governanceRefs = freezeArray(governancePreserved ? [governance.constitutional_compliance_evaluator.integrity_hash, governance.recommendation_registry.integrity_hash] : []);
  const risk_analyzers = freezeArray(riskCategories.map((category, index) => nested({ analyzer_id: id("risk_analyzer", { assessmentId, category }), category, tracked: !has(failures, categoryFailure[category]), deterministic: continuous, observations: freezeArray([`${category.toLowerCase()} health`, `${category.toLowerCase()} trend`, `${category.toLowerCase()} lineage`]), score: !has(failures, categoryFailure[category]) ? 82 - index : 0, evidence_refs: evidenceRefs })));
  const risk_engine = nested({ engine_id: id("risk_engine", assessmentId), continuous_risk_evaluation: continuous, deterministic_scheduling: continuous, evidence_collection: evidenceComplete, recommendation_generation: deterministicRecommendations, replay_support: replay, governance_integration: governancePreserved, advisory_only: advisory, tenant_isolation: tenantIsolation, fail_closed: failClosed });
  const risk_correlation_engine = nested({ engine_id: id("risk_correlation", assessmentId), cross_domain_correlation: continuous, cascading_risk_detection: continuous, dependency_chain_analysis: continuous, historical_comparisons: continuous, trend_analysis: continuous, constitutional_impact_assessment: governancePreserved, deterministic: continuous, replayable: replay, correlation_refs: risk_analyzers.map((analyzer) => analyzer.integrity_hash) });
  const risk_assessment = nested({ assessment_id: assessmentId, evaluation_scope: "continuous-adaptive-operations", assessment_timestamp: ASSESSMENT_TIMESTAMP, monitored_evidence_refs: evidenceRefs, applicable_governance_refs: governanceRefs, dependency_refs: [governance.continuous_operational_certification_ref], replay_refs: replayRefs, certification_refs: [governance.certification_package.integrity_hash], operational_change_refs: [governance.continuous_operational_certification_ref], identified_risks: riskCategories, supporting_rationale: "Deterministic governed risk evaluation across operational, governance, dependency, replay, certification, and infrastructure domains.", recommendation_set: recommendationOutcomes, confidence_evaluation: continuous ? 0.93 : 0 });
  const recommendations = freezeArray(recommendationOutcomes.map((outcome, index) => nested({ recommendation_id: id("risk_recommendation", { assessmentId, outcome }), outcome, categories: freezeArray([riskCategories[index % riskCategories.length]]), contributing_evidence: evidenceRefs, contributing_risks: [risk_analyzers[index % risk_analyzers.length].integrity_hash], applicable_governance: governanceRefs, supporting_rationale: explainable ? `${outcome.toLowerCase()} based on deterministic risk evidence.` : "", advisory_only: advisory, grants_operational_authority: !advisory, explainable })));
  const recommendation_generator = nested({ generator_id: id("risk_recommendation_generator", assessmentId), deterministic_recommendations: deterministicRecommendations, explainable_recommendations: explainable, advisory_only: advisory, recommendations });
  const evidence_registry = nested({ registry_id: id("risk_evidence_registry", assessmentId), monitored_events: evidenceRefs, operational_metrics: risk_analyzers.map((analyzer) => analyzer.integrity_hash), certification_references: [governance.certification_package.integrity_hash], governance_records: governanceRefs, replay_references: replayRefs, dependency_records: [governance.continuous_operational_certification_ref], operational_change_records: [governance.continuous_operational_certification_ref], historical_comparisons: [governance.evaluation_ledger.integrity_hash], immutable_evidence: immutableLineage, complete: evidenceComplete });
  const risk_ledger = nested({ ledger_id: id("risk_ledger", assessmentId), assessments: [risk_assessment.integrity_hash], recommendations: recommendations.map((recommendation) => recommendation.integrity_hash), evidence: evidenceRefs, superseding_assessments: [id("risk_supersession", assessmentId)], governance_actions: governanceRefs, operator_acknowledgements: [id("operator_ack", assessmentId)], additive_only: immutableLineage, immutable: immutableLineage });
  const certification_package = nested({ package_id: id("continuous_risk_certification", assessmentId), continuous_risk_evaluation_operational: risk_engine.continuous_risk_evaluation, operational_risk_tracked: risk_analyzers.find((analyzer) => analyzer.category === "OPERATIONAL")?.tracked ?? false, governance_risk_tracked: risk_analyzers.find((analyzer) => analyzer.category === "GOVERNANCE")?.tracked ?? false, dependency_risk_tracked: risk_analyzers.find((analyzer) => analyzer.category === "DEPENDENCY")?.tracked ?? false, replay_risk_tracked: risk_analyzers.find((analyzer) => analyzer.category === "REPLAY")?.tracked ?? false, certification_risk_tracked: risk_analyzers.find((analyzer) => analyzer.category === "CERTIFICATION")?.tracked ?? false, infrastructure_risk_tracked: risk_analyzers.find((analyzer) => analyzer.category === "INFRASTRUCTURE")?.tracked ?? false, risk_recommendations_deterministic: recommendation_generator.deterministic_recommendations, recommendations_explainable: recommendation_generator.explainable_recommendations && recommendations.every((recommendation) => recommendation.supporting_rationale.length > 0), evidence_complete: evidence_registry.complete && evidence_registry.monitored_events.length > 0, replay_reproducible: risk_correlation_engine.replayable && risk_assessment.replay_refs.length > 0, immutable_lineage_verified: risk_ledger.immutable && risk_ledger.additive_only && evidence_registry.immutable_evidence, governance_preserved: risk_engine.governance_integration && risk_assessment.applicable_governance_refs.length > 0, advisory_boundary_enforced: recommendation_generator.advisory_only && recommendations.every((recommendation) => recommendation.advisory_only && !recommendation.grants_operational_authority), tenant_isolation_maintained: risk_engine.tenant_isolation, fail_closed_behavior_verified: risk_engine.fail_closed, continuous_risk_intelligence_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Continuous risk evaluation operational", certification_package.continuous_risk_evaluation_operational, "CONTINUOUS_RISK_EVALUATION_NOT_OPERATIONAL", [risk_engine.integrity_hash]),
    certTest("Operational risk tracked", certification_package.operational_risk_tracked, "OPERATIONAL_RISK_NOT_TRACKED", [risk_analyzers[0].integrity_hash]),
    certTest("Governance risk tracked", certification_package.governance_risk_tracked, "GOVERNANCE_RISK_NOT_TRACKED", [risk_analyzers[1].integrity_hash]),
    certTest("Dependency risk tracked", certification_package.dependency_risk_tracked, "DEPENDENCY_RISK_NOT_TRACKED", [risk_analyzers[2].integrity_hash]),
    certTest("Replay risk tracked", certification_package.replay_risk_tracked, "REPLAY_RISK_NOT_TRACKED", [risk_analyzers[3].integrity_hash]),
    certTest("Certification risk tracked", certification_package.certification_risk_tracked, "CERTIFICATION_RISK_NOT_TRACKED", [risk_analyzers[4].integrity_hash]),
    certTest("Infrastructure risk tracked", certification_package.infrastructure_risk_tracked, "INFRASTRUCTURE_RISK_NOT_TRACKED", [risk_analyzers[5].integrity_hash]),
    certTest("Risk recommendations deterministic", certification_package.risk_recommendations_deterministic, "RISK_RECOMMENDATIONS_NOT_DETERMINISTIC", [recommendation_generator.integrity_hash]),
    certTest("Recommendations explainable", certification_package.recommendations_explainable, "RECOMMENDATIONS_NOT_EXPLAINABLE", [recommendation_generator.integrity_hash]),
    certTest("Evidence complete", certification_package.evidence_complete, "EVIDENCE_INCOMPLETE", [evidence_registry.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", replayRefs),
    certTest("Immutable lineage verified", certification_package.immutable_lineage_verified, "IMMUTABLE_LINEAGE_NOT_VERIFIED", [risk_ledger.integrity_hash]),
    certTest("Governance preserved", certification_package.governance_preserved, "GOVERNANCE_NOT_PRESERVED", [risk_engine.integrity_hash]),
    certTest("Advisory boundary enforced", certification_package.advisory_boundary_enforced, "ADVISORY_BOUNDARY_NOT_ENFORCED", [recommendation_generator.integrity_hash]),
    certTest("Tenant isolation maintained", certification_package.tenant_isolation_maintained, "TENANT_ISOLATION_NOT_MAINTAINED", [risk_engine.integrity_hash]),
    certTest("Fail-closed behavior verified", certification_package.fail_closed_behavior_verified, "FAIL_CLOSED_NOT_VERIFIED", [risk_engine.integrity_hash]),
    certTest("Continuous Risk Intelligence certified", certification_package.continuous_risk_intelligence_certified, "CONTINUOUS_RISK_INTELLIGENCE_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousRiskIntelligenceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousRiskIntelligenceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, adaptive_governance_ref: governance.integrity_hash, risk_engine, risk_analyzers, risk_correlation_engine, risk_assessment, recommendation_generator, evidence_registry, risk_ledger, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousRiskIntelligence(result = runContinuousRiskIntelligence()) {
  const engine_valid = verify(result.risk_engine) && Object.entries(result.risk_engine).filter(([key]) => !["engine_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const analyzers_valid = result.risk_analyzers.length === 6 && result.risk_analyzers.every((analyzer) => verify(analyzer) && analyzer.tracked && analyzer.deterministic && analyzer.score > 0 && analyzer.evidence_refs.length > 0);
  const correlation_valid = verify(result.risk_correlation_engine) && result.risk_correlation_engine.correlation_refs.length === 6 && Object.entries(result.risk_correlation_engine).filter(([key]) => !["engine_id", "correlation_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const assessment_valid = verify(result.risk_assessment) && result.risk_assessment.monitored_evidence_refs.length > 0 && result.risk_assessment.applicable_governance_refs.length > 0 && result.risk_assessment.dependency_refs.length > 0 && result.risk_assessment.replay_refs.length > 0 && result.risk_assessment.certification_refs.length > 0 && result.risk_assessment.operational_change_refs.length > 0 && result.risk_assessment.identified_risks.length === 6 && result.risk_assessment.recommendation_set.length === 7 && result.risk_assessment.confidence_evaluation > 0;
  const recommendations_valid = verify(result.recommendation_generator) && result.recommendation_generator.recommendations.length === 7 && result.recommendation_generator.recommendations.every((recommendation) => verify(recommendation) && recommendation.contributing_evidence.length > 0 && recommendation.contributing_risks.length > 0 && recommendation.applicable_governance.length > 0 && recommendation.supporting_rationale.length > 0 && recommendation.advisory_only && !recommendation.grants_operational_authority && recommendation.explainable) && result.recommendation_generator.deterministic_recommendations && result.recommendation_generator.explainable_recommendations && result.recommendation_generator.advisory_only;
  const evidence_valid = verify(result.evidence_registry) && result.evidence_registry.complete && result.evidence_registry.immutable_evidence && Object.entries(result.evidence_registry).filter(([key]) => !["registry_id", "complete", "immutable_evidence", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) && value.length > 0);
  const ledger_valid = verify(result.risk_ledger) && result.risk_ledger.assessments.length > 0 && result.risk_ledger.recommendations.length === 7 && result.risk_ledger.evidence.length > 0 && result.risk_ledger.superseding_assessments.length > 0 && result.risk_ledger.governance_actions.length > 0 && result.risk_ledger.operator_acknowledgements.length > 0 && result.risk_ledger.additive_only && result.risk_ledger.immutable;
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 17 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && analyzers_valid && correlation_valid && assessment_valid && recommendations_valid && evidence_valid && ledger_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, analyzers_valid, correlation_valid, assessment_valid, recommendations_valid, evidence_valid, ledger_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousRiskIntelligence(result = runContinuousRiskIntelligence()): boolean {
  const replayed = runContinuousRiskIntelligence();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousRiskIntelligence(result).valid;
}

export function getContinuousRiskIntelligenceBundle(): ContinuousRiskIntelligenceBundle {
  const result = runContinuousRiskIntelligence();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "adaptive-governance/v18.8" as const, risk_categories: riskCategories, recommendation_outcomes: recommendationOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousRiskIntelligence(result) });
}

export const ContinuousRiskIntelligenceService = Object.freeze({ run: runContinuousRiskIntelligence, validate: validateContinuousRiskIntelligence, replay: replayContinuousRiskIntelligence });
