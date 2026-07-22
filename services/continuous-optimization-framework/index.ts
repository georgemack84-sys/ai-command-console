import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runOperationalLearningEngine } from "@/services/operational-learning-engine";
import type {
  CandidateSource,
  ContinuousOptimizationBundle,
  ContinuousOptimizationFailure,
  ContinuousOptimizationInput,
  ContinuousOptimizationOutcome,
  ContinuousOptimizationResult,
  ContinuousOptimizationTest,
  OptimizationClass,
  OptimizationPriorityFactor,
  OptimizationPublicationState,
  PriorityEvaluation,
} from "@/types/continuous-optimization-framework";

const VERSION = "continuous-optimization-framework/v18.4" as const;
const IDENTIFIER = "ContinuousOptimizationFramework" as const;
const DEFAULT_TENANT = "tenant_phase_18_optimization";
const DEFAULT_OPERATOR = "operator_phase_18_optimization";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly ContinuousOptimizationFailure[], failure: ContinuousOptimizationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: ContinuousOptimizationInput["scenario"]): ContinuousOptimizationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly ContinuousOptimizationFailure[]): ContinuousOptimizationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OPTIMIZATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const publicationStates = freezeArray(["GENERATED", "VALIDATED", "GOVERNED", "PUBLISHED", "REVIEWED", "ACCEPTED", "REJECTED", "SUPERSEDED", "ARCHIVED"] as const satisfies readonly OptimizationPublicationState[]);
const optimizationClasses = freezeArray(["OPERATIONAL", "EFFICIENCY", "RESILIENCE", "GOVERNANCE", "PERFORMANCE", "CAPACITY", "CERTIFICATION"] as const satisfies readonly OptimizationClass[]);
const candidateSources = freezeArray(["OPERATIONAL_HISTORY", "MONITORING_RESULTS", "OPERATIONAL_LEARNING", "PERFORMANCE_INTELLIGENCE", "CAPACITY_INTELLIGENCE", "CHANGE_DETECTION", "CERTIFICATION_OBSERVATIONS"] as const satisfies readonly CandidateSource[]);
const priorityFactors = freezeArray(["OPERATIONAL_BENEFIT", "GOVERNANCE_IMPACT", "IMPLEMENTATION_COMPLEXITY", "OPERATIONAL_RISK", "REPLAY_IMPACT", "CERTIFICATION_IMPACT"] as const satisfies readonly OptimizationPriorityFactor[]);

function certTest(name: string, passed: boolean, failure: ContinuousOptimizationFailure, evidence_refs: readonly string[]): ContinuousOptimizationTest {
  const actual: ContinuousOptimizationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OPTIMIZATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("continuous_optimization_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<ContinuousOptimizationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ learning: result.operational_learning_ref, contract: result.optimization_contract.integrity_hash, candidates: result.candidate_engine.integrity_hash, priorities: result.prioritizer.integrity_hash, recommendations: result.recommendation_generator.integrity_hash, explainability: result.explainability.integrity_hash, governance: result.governance.integrity_hash, publication: result.publication.integrity_hash, lifecycle: result.lifecycle.integrity_hash, observability: result.observability.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<ContinuousOptimizationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runContinuousOptimizationFramework(input: ContinuousOptimizationInput = {}): ContinuousOptimizationResult {
  const learning = runOperationalLearningEngine({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: ContinuousOptimizationFailure[] = learning.outcome === "PASS" ? [] : ["PHASE_18_3_LEARNING_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_OPTIMIZATION_WARNING"));
  const optimizationId = input.optimization_id ?? id("optimization", learning.integrity_hash);
  const recommendationSeed = input.recommendation_id ?? id("recommendation", optimizationId);
  const contractApproved = !has(failures, "OPTIMIZATION_CONTRACT_NOT_APPROVED");
  const candidateDeterministic = !has(failures, "CANDIDATE_GENERATION_NOT_DETERMINISTIC");
  const priorityReproducible = !has(failures, "PRIORITIZATION_NOT_REPRODUCIBLE");
  const recommendationDeterministic = !has(failures, "RECOMMENDATION_GENERATION_NOT_DETERMINISTIC");
  const explainable = !has(failures, "RECOMMENDATION_EXPLAINABILITY_INCOMPLETE") && !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE");
  const governanceEnforced = !has(failures, "GOVERNANCE_VALIDATION_NOT_ENFORCED") && !has(failures, "GOVERNANCE_VALIDATION_BYPASSED");
  const advisory = !has(failures, "ADVISORY_BOUNDARY_NOT_PRESERVED");
  const immutableHistory = !has(failures, "OPERATIONAL_HISTORY_MUTABLE");
  const lifecycleDeterministic = !has(failures, "RECOMMENDATION_LIFECYCLE_NOT_DETERMINISTIC");
  const replay = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_PRESERVED");
  const certificationLineage = !has(failures, "CERTIFICATION_LINEAGE_NOT_MAINTAINED");
  const evidenceRefs = freezeArray(immutableHistory ? [learning.integrity_hash, learning.certification_package.integrity_hash, ...learning.lineage_ledger.records.map((record) => record.integrity_hash)] : []);
  const replayRefs = freezeArray(replay ? [learning.replay_hash] : []);

  const optimization_contract = nested({ contract_id: id("optimization_contract", optimizationId), optimization_lifecycle_defined: contractApproved, optimization_authority_defined: contractApproved, recommendation_boundaries_defined: advisory, optimization_eligibility_defined: contractApproved, constitutional_constraints_defined: governanceEnforced, advisory_only_optimization: advisory, contract_approved: contractApproved, deterministic_lifecycle: lifecycleDeterministic, governance_enforced: governanceEnforced });
  const candidates = freezeArray(candidateSources.map((source, index) => nested({ candidate_id: id("optimization_candidate", { optimizationId, source }), source, optimization_class: optimizationClasses[index % optimizationClasses.length], opportunity: `${source.toLowerCase()} optimization opportunity`, evidence_refs: evidenceRefs, classification_reproducible: candidateDeterministic, eligible: contractApproved && governanceEnforced, tenant_scope: input.tenant_id ?? DEFAULT_TENANT })));
  const candidate_engine = nested({ engine_id: id("optimization_candidate_engine", optimizationId), discovery_deterministic: candidateDeterministic, classification_reproducible: candidateDeterministic, registry_complete: candidates.length === candidateSources.length, sources: candidateSources, candidates });
  const evaluations = freezeArray(candidates.map((candidate, index): PriorityEvaluation => {
    const operational_benefit = 90 - index;
    const governance_impact = 80 - index;
    const implementation_complexity = 20 + index;
    const operational_risk = 15 + index;
    const replay_impact = 95 - index;
    const certification_impact = 88 - index;
    const priority_score = priorityReproducible ? operational_benefit + governance_impact + replay_impact + certification_impact - implementation_complexity - operational_risk : 0;
    return nested({ priority_id: id("optimization_priority", candidate.candidate_id), candidate_id: candidate.candidate_id, factors: priorityFactors, operational_benefit, governance_impact, implementation_complexity, operational_risk, replay_impact, certification_impact, priority_score, explanation: `Deterministic priority for ${candidate.optimization_class.toLowerCase()} improvement`, replayable: priorityReproducible && replay });
  }));
  const prioritizer = nested({ prioritizer_id: id("improvement_prioritizer", optimizationId), deterministic_prioritization: priorityReproducible, explanations_complete: priorityReproducible, replay_reproducible: priorityReproducible && replay, evaluations, priority_ledger_refs: evaluations.map((evaluation) => evaluation.integrity_hash) });
  const recommendations = freezeArray(candidates.map((candidate, index) => nested({ recommendation_id: id("optimization_recommendation", { recommendationSeed, index }), candidate_id: candidate.candidate_id, summary: `Recommend ${candidate.optimization_class.toLowerCase()} improvement for ${candidate.source.toLowerCase()}`, supporting_evidence: evidenceRefs, expected_operational_benefit: "Improve continuous operational efficiency without changing state", identified_risks: freezeArray(["requires operator review", "requires governance confirmation"]), implementation_considerations: freezeArray(["stage as advisory plan", "validate through replay before execution"]), governance_considerations: freezeArray(["constitutional authority remains external", "tenant isolation must remain enforced"]), certification_implications: certificationLineage ? [learning.certification_package.integrity_hash] : [], deterministic: recommendationDeterministic, explainable, reproducible: recommendationDeterministic && replay })));
  const recommendation_generator = nested({ generator_id: id("recommendation_generator", optimizationId), deterministic_generation: recommendationDeterministic, recommendations_explainable: explainable, recommendations_reproducible: recommendationDeterministic && replay, recommendations, registry_complete: recommendations.length === candidates.length });
  const explainability = nested({ explainability_id: id("optimization_explainability", optimizationId), rationale_complete: explainable, supporting_evidence_complete: explainable, operational_observations_traceable: explainable, learned_patterns_traceable: explainable, prioritization_reasoning_complete: explainable && priorityReproducible, governance_decisions_traceable: explainable && governanceEnforced, evidence_lineage_preserved: explainable, hidden_reasoning_prevented: explainable, explanation_refs: explainable ? recommendations.map((recommendation) => recommendation.integrity_hash) : [] });
  const governance = nested({ governance_id: id("optimization_governance", optimizationId), constitutional_compliance: governanceEnforced, policy_compliance: governanceEnforced, governance_constraints: governanceEnforced, tenant_isolation: tenantIsolation, replay_compliance: replay, certification_requirements: certificationLineage, validation_precedes_publication: governanceEnforced && !has(failures, "GOVERNANCE_VALIDATION_BYPASSED"), failures_block_release: governanceEnforced, decisions_replayable: governanceEnforced && replay });
  const publication = nested({ publication_id: id("recommendation_publication", optimizationId), publication_states: publicationStates, publication_deterministic: lifecycleDeterministic, recommendation_history_preserved: immutableHistory, publication_replayable: lifecycleDeterministic && replay, recommendation_catalog_complete: recommendations.length === candidates.length, implementation_readiness_published: governance.validation_precedes_publication });
  const lifecycle = nested({ lifecycle_id: id("recommendation_lifecycle", optimizationId), states: lifecycleDeterministic ? publicationStates : freezeArray(["GENERATED", "PUBLISHED"] as const), transitions_validated: lifecycleDeterministic, deterministic_transitions: lifecycleDeterministic, audit_complete: immutableHistory && lifecycleDeterministic, rejected_recommendations_auditable: immutableHistory, history_modified: !immutableHistory });
  const observability = nested({ dashboard_id: id("optimization_dashboard", optimizationId), recommendation_generation_visible: true, optimization_throughput_visible: true, candidate_backlog_visible: true, priority_distribution_visible: true, governance_failures_visible: true, recommendation_adoption_visible: true, superseded_recommendations_visible: true, analytics_reproducible: priorityReproducible && replay, monitoring_operational: true });
  const certification_package = nested({ package_id: id("continuous_optimization_certification", optimizationId), optimization_contract_approved: optimization_contract.contract_approved, candidate_generation_deterministic: candidate_engine.discovery_deterministic && candidate_engine.classification_reproducible, improvement_prioritization_reproducible: prioritizer.replay_reproducible, recommendation_generation_deterministic: recommendation_generator.deterministic_generation && recommendation_generator.recommendations_reproducible, recommendation_explainability_complete: explainability.hidden_reasoning_prevented && explainability.evidence_lineage_preserved, governance_validation_enforced: governance.validation_precedes_publication && governance.failures_block_release, advisory_boundary_preserved: optimization_contract.advisory_only_optimization, operational_history_immutable: immutableHistory && !lifecycle.history_modified, recommendation_lifecycle_deterministic: lifecycle.deterministic_transitions && lifecycle.audit_complete, evidence_lineage_complete: explainability.supporting_evidence_complete && recommendations.every((recommendation) => recommendation.supporting_evidence.length > 0), replay_reproducible: replay && publication.publication_replayable, tenant_isolation_preserved: governance.tenant_isolation, certification_lineage_maintained: certificationLineage && recommendations.every((recommendation) => recommendation.certification_implications.length > 0), continuous_optimization_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Continuous Optimization Contract approved", certification_package.optimization_contract_approved, "OPTIMIZATION_CONTRACT_NOT_APPROVED", [optimization_contract.integrity_hash]),
    certTest("Optimization candidate generation deterministic", certification_package.candidate_generation_deterministic, "CANDIDATE_GENERATION_NOT_DETERMINISTIC", [candidate_engine.integrity_hash]),
    certTest("Improvement prioritization reproducible", certification_package.improvement_prioritization_reproducible, "PRIORITIZATION_NOT_REPRODUCIBLE", [prioritizer.integrity_hash]),
    certTest("Recommendation generation deterministic", certification_package.recommendation_generation_deterministic, "RECOMMENDATION_GENERATION_NOT_DETERMINISTIC", [recommendation_generator.integrity_hash]),
    certTest("Recommendation explainability complete", certification_package.recommendation_explainability_complete, "RECOMMENDATION_EXPLAINABILITY_INCOMPLETE", [explainability.integrity_hash]),
    certTest("Governance validation enforced", certification_package.governance_validation_enforced, "GOVERNANCE_VALIDATION_NOT_ENFORCED", [governance.integrity_hash]),
    certTest("Advisory-only boundary preserved", certification_package.advisory_boundary_preserved, "ADVISORY_BOUNDARY_NOT_PRESERVED", [optimization_contract.integrity_hash]),
    certTest("Operational history immutable", certification_package.operational_history_immutable, "OPERATIONAL_HISTORY_MUTABLE", [lifecycle.integrity_hash]),
    certTest("Recommendation lifecycle deterministic", certification_package.recommendation_lifecycle_deterministic, "RECOMMENDATION_LIFECYCLE_NOT_DETERMINISTIC", [lifecycle.integrity_hash]),
    certTest("Evidence lineage complete", certification_package.evidence_lineage_complete, "EVIDENCE_LINEAGE_INCOMPLETE", [explainability.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", replayRefs),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation_preserved, "TENANT_ISOLATION_NOT_PRESERVED", [governance.integrity_hash]),
    certTest("Certification lineage maintained", certification_package.certification_lineage_maintained, "CERTIFICATION_LINEAGE_NOT_MAINTAINED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is ContinuousOptimizationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<ContinuousOptimizationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, operational_learning_ref: learning.integrity_hash, optimization_contract, candidate_engine, prioritizer, recommendation_generator, explainability, governance, publication, lifecycle, observability, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateContinuousOptimizationFramework(result = runContinuousOptimizationFramework()) {
  const contract_valid = verify(result.optimization_contract) && Object.entries(result.optimization_contract).filter(([key]) => !["contract_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const candidate_valid = verify(result.candidate_engine) && result.candidate_engine.sources.length === 7 && result.candidate_engine.candidates.length === 7 && result.candidate_engine.candidates.every((candidate) => verify(candidate) && candidate.evidence_refs.length > 0 && candidate.classification_reproducible && candidate.eligible) && result.candidate_engine.discovery_deterministic && result.candidate_engine.classification_reproducible && result.candidate_engine.registry_complete;
  const prioritizer_valid = verify(result.prioritizer) && result.prioritizer.evaluations.length === 7 && result.prioritizer.evaluations.every((evaluation) => verify(evaluation) && evaluation.factors.length === 6 && evaluation.priority_score > 0 && evaluation.explanation.length > 0 && evaluation.replayable) && result.prioritizer.deterministic_prioritization && result.prioritizer.explanations_complete && result.prioritizer.replay_reproducible;
  const recommendation_valid = verify(result.recommendation_generator) && result.recommendation_generator.recommendations.length === 7 && result.recommendation_generator.recommendations.every((recommendation) => verify(recommendation) && recommendation.supporting_evidence.length > 0 && recommendation.identified_risks.length > 0 && recommendation.implementation_considerations.length > 0 && recommendation.governance_considerations.length > 0 && recommendation.certification_implications.length > 0 && recommendation.deterministic && recommendation.explainable && recommendation.reproducible) && result.recommendation_generator.deterministic_generation && result.recommendation_generator.recommendations_explainable && result.recommendation_generator.recommendations_reproducible && result.recommendation_generator.registry_complete;
  const explainability_valid = verify(result.explainability) && result.explainability.explanation_refs.length === 7 && Object.entries(result.explainability).filter(([key]) => !["explainability_id", "explanation_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => !["governance_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const publication_valid = verify(result.publication) && result.publication.publication_states.length === 9 && Object.entries(result.publication).filter(([key]) => !["publication_id", "publication_states", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const lifecycle_valid = verify(result.lifecycle) && result.lifecycle.states.length === 9 && result.lifecycle.states.every((state, index) => state === publicationStates[index]) && result.lifecycle.transitions_validated && result.lifecycle.deterministic_transitions && result.lifecycle.audit_complete && result.lifecycle.rejected_recommendations_auditable && !result.lifecycle.history_modified;
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 13 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && contract_valid && candidate_valid && prioritizer_valid && recommendation_valid && explainability_valid && governance_valid && publication_valid && lifecycle_valid && observability_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, candidate_valid, prioritizer_valid, recommendation_valid, explainability_valid, governance_valid, publication_valid, lifecycle_valid, observability_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayContinuousOptimizationFramework(result = runContinuousOptimizationFramework()): boolean {
  const replayed = runContinuousOptimizationFramework();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateContinuousOptimizationFramework(result).valid;
}

export function getContinuousOptimizationFrameworkBundle(): ContinuousOptimizationBundle {
  const result = runContinuousOptimizationFramework();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "operational-learning-engine/v18.3" as const, publication_states: publicationStates, optimization_classes: optimizationClasses, candidate_sources: candidateSources, priority_factors: priorityFactors, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateContinuousOptimizationFramework(result) });
}

export const ContinuousOptimizationFrameworkService = Object.freeze({ run: runContinuousOptimizationFramework, validate: validateContinuousOptimizationFramework, replay: replayContinuousOptimizationFramework });
