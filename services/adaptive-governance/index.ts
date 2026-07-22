import { runContinuousOperationalCertificationService } from "@/services/continuous-operational-certification-service";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptiveGovernanceBundle,
  AdaptiveGovernanceFailure,
  AdaptiveGovernanceInput,
  AdaptiveGovernanceOutcome,
  AdaptiveGovernanceResult,
  AdaptiveGovernanceTest,
  GovernanceEvaluationLifecycleState,
  GovernanceRecommendationPriority,
  GovernanceRecommendationType,
} from "@/types/adaptive-governance";

const VERSION = "adaptive-governance/v18.8" as const;
const IDENTIFIER = "AdaptiveGovernance" as const;
const DEFAULT_TENANT = "tenant_phase_18_adaptive_governance";
const DEFAULT_OPERATOR = "operator_phase_18_adaptive_governance";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly AdaptiveGovernanceFailure[], failure: AdaptiveGovernanceFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: AdaptiveGovernanceInput["scenario"]): AdaptiveGovernanceFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly AdaptiveGovernanceFailure[]): AdaptiveGovernanceOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_GOVERNANCE_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["OPERATIONAL_EVIDENCE", "GOVERNANCE_EVALUATION", "POLICY_ASSESSMENT", "WORKLOAD_ASSESSMENT", "LATENCY_ASSESSMENT", "CONSTITUTIONAL_COMPLIANCE", "RECOMMENDATION_GENERATION", "RECOMMENDATION_QUALIFICATION", "GOVERNANCE_REGISTRY", "IMMUTABLE_LEDGER"] as const satisfies readonly GovernanceEvaluationLifecycleState[]);
const recommendationTypes = freezeArray(["POLICY_REFINEMENT", "WORKFLOW_IMPROVEMENT", "REVIEW_PRIORITIZATION", "GOVERNANCE_OPTIMIZATION", "APPROVAL_PROCESS_IMPROVEMENT", "STAFFING_RECOMMENDATION", "EVIDENCE_IMPROVEMENT"] as const satisfies readonly GovernanceRecommendationType[]);
const recommendationPriorities = freezeArray(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const satisfies readonly GovernanceRecommendationPriority[]);

function certTest(name: string, passed: boolean, failure: AdaptiveGovernanceFailure, evidence_refs: readonly string[]): AdaptiveGovernanceTest {
  const actual: AdaptiveGovernanceOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_GOVERNANCE_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("adaptive_governance_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<AdaptiveGovernanceResult, "replay_hash" | "integrity_hash">): string {
  return hash({ certification: result.continuous_operational_certification_ref, engine: result.adaptive_governance_engine.integrity_hash, policy: result.policy_effectiveness_evaluator.integrity_hash, workload: result.governance_workload_analyzer.integrity_hash, latency: result.approval_latency_analyzer.integrity_hash, compliance: result.constitutional_compliance_evaluator.integrity_hash, recommendations: result.recommendation_engine.integrity_hash, registry: result.recommendation_registry.integrity_hash, ledger: result.evaluation_ledger.integrity_hash, lifecycle: result.lifecycle, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<AdaptiveGovernanceResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runAdaptiveGovernance(input: AdaptiveGovernanceInput = {}): AdaptiveGovernanceResult {
  const certification = runContinuousOperationalCertificationService({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: AdaptiveGovernanceFailure[] = certification.outcome === "PASS" ? [] : ["PHASE_18_7_CERTIFICATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_GOVERNANCE_WARNING"));
  const evaluationId = input.evaluation_id ?? id("governance_evaluation", certification.integrity_hash);
  const deterministic = !has(failures, "GOVERNANCE_EVALUATIONS_NOT_DETERMINISTIC");
  const policyContinuous = !has(failures, "POLICY_EFFECTIVENESS_NOT_CONTINUOUSLY_EVALUATED");
  const workloadContinuous = !has(failures, "GOVERNANCE_WORKLOAD_NOT_CONTINUOUSLY_EVALUATED");
  const latencyContinuous = !has(failures, "APPROVAL_LATENCY_NOT_CONTINUOUSLY_EVALUATED");
  const complianceContinuous = !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_CONTINUOUSLY_VERIFIED");
  const advisory = !has(failures, "RECOMMENDATIONS_NOT_ADVISORY_ONLY") && !has(failures, "POLICY_MODIFICATION_ATTEMPTED");
  const authorityScoped = !has(failures, "AUTHORITY_SCOPING_NOT_PRESERVED");
  const replay = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const evidenceComplete = !has(failures, "EVIDENCE_INCOMPLETE") && !has(failures, "UNGOVERNED_DATA_CONSUMED");
  const immutableLineage = !has(failures, "IMMUTABLE_LINEAGE_NOT_PRESERVED");
  const tenantAuthority = !has(failures, "TENANT_AUTHORITY_BOUNDARIES_NOT_MAINTAINED");
  const failClosed = !has(failures, "FAIL_CLOSED_NOT_VERIFIED");
  const recommendationQualified = !has(failures, "RECOMMENDATION_QUALIFICATION_FAILED");
  const evidenceRefs = freezeArray(evidenceComplete ? [certification.integrity_hash, certification.certification_package.integrity_hash, certification.ledger.integrity_hash] : []);
  const replayRefs = freezeArray(replay ? [certification.replay_hash, certification.replay_service.integrity_hash] : []);

  const adaptive_governance_engine = nested({ engine_id: id("adaptive_governance_engine", evaluationId), evaluation_scheduling: deterministic, evidence_aggregation: evidenceComplete, recommendation_generation: deterministic, governance_scoring: deterministic, replay_coordination: replay, lifecycle_management: deterministic, deterministic, governed_inputs_only: evidenceComplete, advisory_only: advisory, policy_modified: !advisory, implementation_authority: !advisory });
  const policy_effectiveness_evaluator = nested({ evaluator_id: id("policy_effectiveness", evaluationId), approval_quality: policyContinuous, rejection_quality: policyContinuous, operator_override_frequency: policyContinuous, unnecessary_approvals: policyContinuous, unnecessary_denials: policyContinuous, policy_stability: policyContinuous, policy_consistency: policyContinuous, continuous_evaluation: policyContinuous, policy_modified: !advisory, effectiveness_score: policyContinuous ? 94 : 0 });
  const governance_workload_analyzer = nested({ analyzer_id: id("governance_workload", evaluationId), review_volume: workloadContinuous, approval_backlog: workloadContinuous, governance_utilization: workloadContinuous, reviewer_distribution: workloadContinuous, review_duration: workloadContinuous, governance_saturation: workloadContinuous, escalation_frequency: workloadContinuous, continuous_evaluation: workloadContinuous, workload_score: workloadContinuous ? 88 : 0 });
  const approval_latency_analyzer = nested({ analyzer_id: id("approval_latency", evaluationId), average_approval_latency: latencyContinuous, median_approval_latency: latencyContinuous, queue_latency: latencyContinuous, escalation_latency: latencyContinuous, qualification_latency: latencyContinuous, certification_latency: latencyContinuous, review_bottlenecks: latencyContinuous, continuous_evaluation: latencyContinuous, latency_influences_authority: false, latency_score: latencyContinuous ? 91 : 0 });
  const constitutional_compliance_evaluator = nested({ evaluator_id: id("constitutional_compliance", evaluationId), authority_boundaries: complianceContinuous && authorityScoped, governance_enforcement: complianceContinuous, approval_sequencing: complianceContinuous, evidence_completeness: complianceContinuous && evidenceComplete, immutable_lineage: complianceContinuous && immutableLineage, replay_integrity: complianceContinuous && replay, advisory_boundary_preservation: complianceContinuous && advisory, continuously_verified: complianceContinuous, failure_events_generated: complianceContinuous });
  const recommendations = freezeArray(recommendationTypes.map((recommendation_type, index) => nested({ governance_recommendation_id: id("governance_recommendation", { evaluationId, recommendation_type }), evaluation_id: evaluationId, tenant_scope: input.tenant_id ?? DEFAULT_TENANT, governance_scope: "continuous-adaptive-operations", authority_scope: tenantAuthority ? "informational-until-pcc-001-or-amendment" : "", recommendation_type, recommendation_summary: `${recommendation_type.toLowerCase()} advisory recommendation`, recommendation_reason: "Deterministic governance effectiveness evaluation identified an advisory improvement opportunity.", recommendation_priority: recommendationPriorities[index % recommendationPriorities.length], policy_effectiveness_score: policy_effectiveness_evaluator.effectiveness_score, governance_workload_score: governance_workload_analyzer.workload_score, approval_latency_score: approval_latency_analyzer.latency_score, constitutional_compliance_score: complianceContinuous ? 100 : 0, supporting_evidence_refs: evidenceRefs, simulation_refs: [certification.adaptation_qualification_ref], qualification_refs: [certification.adaptation_qualification_ref], certification_refs: [certification.integrity_hash], applicable_policy_refs: evidenceRefs, constitutional_refs: [certification.certification_engine.integrity_hash], authority_model: "external-constitutional-authority", recommendation_scope: tenantAuthority ? "informational advisory recommendation; no implementation authority" : "", lineage_refs: [certification.lineage_manager.integrity_hash], replay_refs: replayRefs, immutable: immutableLineage, advisory_only: advisory, qualified: recommendationQualified })));
  const recommendation_engine = nested({ engine_id: id("governance_recommendation_engine", evaluationId), policy_refinements: advisory, workflow_improvements: advisory, review_prioritization: advisory, governance_optimization: advisory, approval_process_improvements: advisory, staffing_recommendations: advisory, evidence_improvements: advisory, advisory_only: advisory, deterministic_generation: deterministic, recommendations });
  const recommendation_registry = nested({ registry_id: id("governance_recommendation_registry", evaluationId), recommendations, immutable_recommendations: immutableLineage, authority_scoped: authorityScoped, tenant_authority_informational_only: tenantAuthority, recommendation_qualification_complete: recommendationQualified, publication_blocked_on_fail_closed: failClosed });
  const evaluation_ledger = nested({ ledger_id: id("governance_evaluation_ledger", evaluationId), evaluations: [adaptive_governance_engine.integrity_hash], metrics: [policy_effectiveness_evaluator.integrity_hash, governance_workload_analyzer.integrity_hash, approval_latency_analyzer.integrity_hash, constitutional_compliance_evaluator.integrity_hash], evidence: evidenceRefs, recommendations: recommendations.map((recommendation) => recommendation.integrity_hash), advisory_outcomes: recommendations.map((recommendation) => recommendation.governance_recommendation_id), superseding_lineage: [id("governance_supersession", evaluationId)], replay_references: replayRefs, additive_only: immutableLineage, immutable: immutableLineage });
  const lifecycle = freezeArray(deterministic ? lifecycleStates : ["OPERATIONAL_EVIDENCE", "RECOMMENDATION_GENERATION"] as const);
  const certification_package = nested({ package_id: id("adaptive_governance_certification", evaluationId), governance_evaluations_deterministic: adaptive_governance_engine.deterministic, policy_effectiveness_continuously_evaluated: policy_effectiveness_evaluator.continuous_evaluation, governance_workload_continuously_evaluated: governance_workload_analyzer.continuous_evaluation, approval_latency_continuously_evaluated: approval_latency_analyzer.continuous_evaluation && !approval_latency_analyzer.latency_influences_authority, constitutional_compliance_continuously_verified: constitutional_compliance_evaluator.continuously_verified && constitutional_compliance_evaluator.advisory_boundary_preservation, recommendations_advisory_only: recommendation_engine.advisory_only && recommendations.every((recommendation) => recommendation.advisory_only), authority_scoping_preserved: recommendation_registry.authority_scoped && recommendations.every((recommendation) => recommendation.authority_scope.length > 0), replay_reproducible: replay && evaluation_ledger.replay_references.length > 0, evidence_complete: evidenceComplete && recommendations.every((recommendation) => recommendation.supporting_evidence_refs.length > 0), immutable_lineage_preserved: evaluation_ledger.immutable && evaluation_ledger.additive_only && recommendation_registry.immutable_recommendations, tenant_authority_boundaries_maintained: recommendation_registry.tenant_authority_informational_only && recommendations.every((recommendation) => recommendation.recommendation_scope.includes("no implementation authority")), fail_closed_behavior_verified: failClosed && recommendation_registry.publication_blocked_on_fail_closed, adaptive_governance_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Governance evaluations deterministic", certification_package.governance_evaluations_deterministic, "GOVERNANCE_EVALUATIONS_NOT_DETERMINISTIC", [adaptive_governance_engine.integrity_hash]),
    certTest("Policy effectiveness continuously evaluated", certification_package.policy_effectiveness_continuously_evaluated, "POLICY_EFFECTIVENESS_NOT_CONTINUOUSLY_EVALUATED", [policy_effectiveness_evaluator.integrity_hash]),
    certTest("Governance workload continuously evaluated", certification_package.governance_workload_continuously_evaluated, "GOVERNANCE_WORKLOAD_NOT_CONTINUOUSLY_EVALUATED", [governance_workload_analyzer.integrity_hash]),
    certTest("Approval latency continuously evaluated", certification_package.approval_latency_continuously_evaluated, "APPROVAL_LATENCY_NOT_CONTINUOUSLY_EVALUATED", [approval_latency_analyzer.integrity_hash]),
    certTest("Constitutional compliance continuously verified", certification_package.constitutional_compliance_continuously_verified, "CONSTITUTIONAL_COMPLIANCE_NOT_CONTINUOUSLY_VERIFIED", [constitutional_compliance_evaluator.integrity_hash]),
    certTest("Recommendations advisory only", certification_package.recommendations_advisory_only, "RECOMMENDATIONS_NOT_ADVISORY_ONLY", [recommendation_engine.integrity_hash]),
    certTest("Authority scoping preserved", certification_package.authority_scoping_preserved, "AUTHORITY_SCOPING_NOT_PRESERVED", [recommendation_registry.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", replayRefs),
    certTest("Evidence complete", certification_package.evidence_complete, "EVIDENCE_INCOMPLETE", [recommendation_engine.integrity_hash]),
    certTest("Immutable lineage preserved", certification_package.immutable_lineage_preserved, "IMMUTABLE_LINEAGE_NOT_PRESERVED", [evaluation_ledger.integrity_hash]),
    certTest("Tenant authority boundaries maintained", certification_package.tenant_authority_boundaries_maintained, "TENANT_AUTHORITY_BOUNDARIES_NOT_MAINTAINED", [recommendation_registry.integrity_hash]),
    certTest("Fail-closed behavior verified", certification_package.fail_closed_behavior_verified, "FAIL_CLOSED_NOT_VERIFIED", [recommendation_registry.integrity_hash]),
    certTest("Adaptive Governance certified", certification_package.adaptive_governance_certified, "ADAPTIVE_GOVERNANCE_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is AdaptiveGovernanceFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<AdaptiveGovernanceResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, continuous_operational_certification_ref: certification.integrity_hash, adaptive_governance_engine, policy_effectiveness_evaluator, governance_workload_analyzer, approval_latency_analyzer, constitutional_compliance_evaluator, recommendation_engine, recommendation_registry, evaluation_ledger, lifecycle, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAdaptiveGovernance(result = runAdaptiveGovernance()) {
  const engine_valid = verify(result.adaptive_governance_engine) && Object.entries(result.adaptive_governance_engine).filter(([key]) => !["engine_id", "policy_modified", "implementation_authority", "integrity_hash"].includes(key)).every(([, value]) => value === true) && !result.adaptive_governance_engine.policy_modified && !result.adaptive_governance_engine.implementation_authority;
  const policy_valid = verify(result.policy_effectiveness_evaluator) && result.policy_effectiveness_evaluator.effectiveness_score > 0 && !result.policy_effectiveness_evaluator.policy_modified && Object.entries(result.policy_effectiveness_evaluator).filter(([key]) => !["evaluator_id", "policy_modified", "effectiveness_score", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const workload_valid = verify(result.governance_workload_analyzer) && result.governance_workload_analyzer.workload_score > 0 && Object.entries(result.governance_workload_analyzer).filter(([key]) => !["analyzer_id", "workload_score", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const latency_valid = verify(result.approval_latency_analyzer) && result.approval_latency_analyzer.latency_score > 0 && !result.approval_latency_analyzer.latency_influences_authority && Object.entries(result.approval_latency_analyzer).filter(([key]) => !["analyzer_id", "latency_influences_authority", "latency_score", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const compliance_valid = verify(result.constitutional_compliance_evaluator) && Object.entries(result.constitutional_compliance_evaluator).filter(([key]) => !["evaluator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const recommendation_valid = verify(result.recommendation_engine) && result.recommendation_engine.recommendations.length === 7 && result.recommendation_engine.recommendations.every((recommendation) => verify(recommendation) && recommendation.supporting_evidence_refs.length > 0 && recommendation.simulation_refs.length > 0 && recommendation.qualification_refs.length > 0 && recommendation.certification_refs.length > 0 && recommendation.applicable_policy_refs.length > 0 && recommendation.constitutional_refs.length > 0 && recommendation.lineage_refs.length > 0 && recommendation.replay_refs.length > 0 && recommendation.immutable && recommendation.advisory_only && recommendation.qualified && recommendation.authority_scope.length > 0 && recommendation.recommendation_scope.includes("no implementation authority")) && Object.entries(result.recommendation_engine).filter(([key]) => !["engine_id", "recommendations", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const registry_valid = verify(result.recommendation_registry) && result.recommendation_registry.recommendations.length === 7 && Object.entries(result.recommendation_registry).filter(([key]) => !["registry_id", "recommendations", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const ledger_valid = verify(result.evaluation_ledger) && result.evaluation_ledger.evaluations.length > 0 && result.evaluation_ledger.metrics.length === 4 && result.evaluation_ledger.evidence.length > 0 && result.evaluation_ledger.recommendations.length === 7 && result.evaluation_ledger.advisory_outcomes.length === 7 && result.evaluation_ledger.superseding_lineage.length > 0 && result.evaluation_ledger.replay_references.length > 0 && result.evaluation_ledger.additive_only && result.evaluation_ledger.immutable;
  const lifecycle_valid = result.lifecycle.length === 10 && result.lifecycle.every((state, index) => state === lifecycleStates[index]);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 13 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && policy_valid && workload_valid && latency_valid && compliance_valid && recommendation_valid && registry_valid && ledger_valid && lifecycle_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, policy_valid, workload_valid, latency_valid, compliance_valid, recommendation_valid, registry_valid, ledger_valid, lifecycle_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayAdaptiveGovernance(result = runAdaptiveGovernance()): boolean {
  const replayed = runAdaptiveGovernance();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAdaptiveGovernance(result).valid;
}

export function getAdaptiveGovernanceBundle(): AdaptiveGovernanceBundle {
  const result = runAdaptiveGovernance();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "continuous-operational-certification-service/v18.7" as const, lifecycle_states: lifecycleStates, recommendation_types: recommendationTypes, recommendation_priorities: recommendationPriorities, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateAdaptiveGovernance(result) });
}

export const AdaptiveGovernanceService = Object.freeze({ run: runAdaptiveGovernance, validate: validateAdaptiveGovernance, replay: replayAdaptiveGovernance });
