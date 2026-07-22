import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCapabilityRegistry, validateCapabilityRegistry } from "@/services/capability-registry";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runSkillRegistry, validateSkillRegistry } from "@/services/skill-registry";
import type { ScenarioClass, ScenarioLifecycleState, ScenarioPlanningBundle, ScenarioPlanningDecision, ScenarioPlanningFailure, ScenarioPlanningInput, ScenarioPlanningResult, ScenarioPlanningScenario, ScenarioPlanningValidation } from "@/types/scenario-planning";

const VERSION = "scenario-planning/mc-2" as const;
const IDENTIFIER = "ScenarioPlanning" as const;
const LIFECYCLE_STATES = Object.freeze<ScenarioLifecycleState[]>(["DRAFT", "UNDER_ANALYSIS", "EVALUATED", "REVIEW", "REJECTED", "APPROVED", "ADOPTED", "ARCHIVED"]);
const SCENARIO_CLASSES = Object.freeze<ScenarioClass[]>(["OPTIMISTIC", "NOMINAL", "DEGRADED", "CONTINGENCY", "WORST_CASE"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "capability-registry/w2.3", "skill-registry/w2.4", "authority-validator/w2.5", "policy-gate/w2.6", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "evidence-engine/w2.13"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), capability: runCapabilityRegistry(), skill: runSkillRegistry(), authority: runAuthorityValidator(), policy: runPolicyGate(), safety: runSafetyGate(), planning: runPlanningEngine(), memory: runMemoryEngine(), evidence: runEvidenceEngine() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly ScenarioPlanningFailure[], failure: ScenarioPlanningFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: ScenarioPlanningScenario): ScenarioPlanningFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly ScenarioPlanningFailure[], scenario: ScenarioPlanningScenario): ScenarioPlanningDecision {
  const conditional = new Set<ScenarioPlanningFailure>(["SCENARIO_DEFINITION_MISSING", "ALTERNATIVE_GENERATION_MISSING", "ASSUMPTION_MANAGEMENT_MISSING", "WHAT_IF_ANALYSIS_MISSING", "SCENARIO_EVALUATION_MISSING", "RISK_ASSESSMENT_MISSING", "OPPORTUNITY_ASSESSMENT_MISSING", "SCENARIO_COMPARISON_MISSING", "RECOMMENDATION_ENGINE_MISSING", "SCENARIO_GOVERNANCE_MISSING", "SCENARIO_EVIDENCE_MISSING", "SCENARIO_PLANNING_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "SCENARIO_PLANNING_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "MISSION_SCENARIO_PLANNING_QUALIFIED";
}
function resultReplayHash(result: Omit<ScenarioPlanningResult, "replay_hash" | "integrity_hash">): string { return hash({ definition: result.definition.integrity_hash, generation: result.generation.integrity_hash, assumptions: result.assumptions.integrity_hash, what_if: result.what_if.integrity_hash, evaluation: result.evaluation.integrity_hash, risk: result.risk.integrity_hash, opportunity: result.opportunity.integrity_hash, comparison: result.comparison.integrity_hash, recommendation: result.recommendation.integrity_hash, governance: result.governance.integrity_hash, evidence: result.evidence.integrity_hash, lifecycle: result.lifecycle.integrity_hash, outputs: result.outputs.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<ScenarioPlanningResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runScenarioPlanning(input: ScenarioPlanningInput = {}): ScenarioPlanningResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<ScenarioPlanningFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["W2_3_CAPABILITY_REGISTRY_INVALID", !validateCapabilityRegistry(baselines.capability).valid],
    ["W2_4_SKILL_REGISTRY_INVALID", !validateSkillRegistry(baselines.skill).valid],
    ["W2_5_AUTHORITY_VALIDATOR_INVALID", !validateAuthorityValidator(baselines.authority).valid],
    ["W2_6_POLICY_GATE_INVALID", !validatePolicyGate(baselines.policy).valid],
    ["W2_7_SAFETY_GATE_INVALID", !validateSafetyGate(baselines.safety).valid],
    ["W2_8_PLANNING_ENGINE_INVALID", !validatePlanningEngine(baselines.planning).valid],
    ["W2_9_MEMORY_ENGINE_INVALID", !validateMemoryEngine(baselines.memory).valid],
    ["W2_13_EVIDENCE_ENGINE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const definitionOk = !has(failures, "SCENARIO_DEFINITION_MISSING") && !has(failures, "SCENARIO_IDENTITY_MISSING") && !has(failures, "SCENARIO_VERSIONING_MISSING");
  const generationOk = !has(failures, "ALTERNATIVE_GENERATION_MISSING") && !has(failures, "SCENARIO_BRANCHING_NON_DETERMINISTIC") && !has(failures, "AUTHORITATIVE_MISSION_MUTATED") && !has(failures, "SCENARIO_MISSION_REFERENCE_INVALID");
  const assumptionsOk = !has(failures, "ASSUMPTION_MANAGEMENT_MISSING") && !has(failures, "ASSUMPTION_TRACEABILITY_MISSING");
  const whatIfOk = !has(failures, "WHAT_IF_ANALYSIS_MISSING") && !has(failures, "SCENARIO_CLASSIFICATION_INCOMPLETE");
  const evaluationOk = !has(failures, "SCENARIO_EVALUATION_MISSING") && !has(failures, "EVALUATION_NON_REPRODUCIBLE");
  const riskOk = !has(failures, "RISK_ASSESSMENT_MISSING");
  const opportunityOk = !has(failures, "OPPORTUNITY_ASSESSMENT_MISSING");
  const comparisonOk = !has(failures, "SCENARIO_COMPARISON_MISSING") && !has(failures, "COMPARISON_NON_DETERMINISTIC");
  const recommendationOk = !has(failures, "RECOMMENDATION_ENGINE_MISSING") && !has(failures, "RECOMMENDATION_NOT_EXPLAINABLE");
  const governanceOk = !has(failures, "SCENARIO_GOVERNANCE_MISSING") && !has(failures, "CONSTITUTIONAL_VALIDATION_BYPASSED") && !has(failures, "AUTHORITY_VALIDATION_BYPASSED") && !has(failures, "POLICY_VALIDATION_BYPASSED") && !has(failures, "SAFETY_VALIDATION_BYPASSED") && !has(failures, "APPROVAL_WORKFLOW_MISSING");
  const evidenceOk = !has(failures, "SCENARIO_EVIDENCE_MISSING") && !has(failures, "SCENARIO_EVIDENCE_NOT_IMMUTABLE");
  const lifecycleOk = !has(failures, "SCENARIO_LIFECYCLE_INVALID");
  const outputsOk = !has(failures, "PLANNING_REPORTS_NOT_REPRODUCIBLE");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "MISSION_SCENARIO_PLANNING_QUALIFIED";
  const mission_id = input.mission_id ?? baselines.mission.mission_id;
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const definition = nested({ registry_id: definitionOk ? `registry:mc-2:scenarios:${input.seed ?? "canonical"}` : "", scenario_model: definitionOk, metadata: definitionOk, identity: definitionOk, ownership: definitionOk, classification: definitionOk, versioning: definitionOk, scenario_registry: definitionOk, scenario_catalog: definitionOk });
  const generation = nested({ generator_id: generationOk ? "generator:mc-2:alternative-futures" : "", branch_planning: generationOk, mission_forking: generationOk, timeline_branching: generationOk, alternative_objectives: generationOk, alternative_resource_allocation: generationOk, alternative_execution_paths: generationOk, multiple_candidate_futures: generationOk, deterministic_branching: generationOk, reproducible_scenarios: generationOk, authoritative_mission_unchanged: generationOk, exactly_one_authoritative_mission_ref: generationOk });
  const assumptions = nested({ registry_id: assumptionsOk ? "registry:mc-2:assumptions" : "", assumption_registry: assumptionsOk, assumption_validation: assumptionsOk, constraint_documentation: assumptionsOk, external_dependencies: assumptionsOk, confidence_levels: assumptionsOk, assumption_catalog: assumptionsOk, planning_constraints: assumptionsOk, traceable_assumptions: assumptionsOk });
  const what_if = nested({ engine_id: whatIfOk ? "engine:mc-2:what-if" : "", resource_variations: whatIfOk, timeline_variations: whatIfOk, risk_variations: whatIfOk, capability_variations: whatIfOk, policy_variations: whatIfOk, environmental_variations: whatIfOk, classes: whatIfOk ? freezeArray(SCENARIO_CLASSES) : freezeArray<ScenarioClass>([]) });
  const evaluation = nested({ evaluator_id: evaluationOk ? "evaluator:mc-2:scenario" : "", goal_achievement_analysis: evaluationOk, constraint_validation: evaluationOk, dependency_analysis: evaluationOk, mission_success_probability: evaluationOk, resource_utilization: evaluationOk, timeline_evaluation: evaluationOk, constitutional_compliance: evaluationOk, scenario_scores: evaluationOk, evaluation_reports: evaluationOk, repeatable_evaluations: evaluationOk });
  const risk = nested({ risk_id: riskOk ? "risk:mc-2:scenario" : "", operational_risk: riskOk, dependency_risk: riskOk, resource_risk: riskOk, schedule_risk: riskOk, authority_risk: riskOk, policy_risk: riskOk, risk_profiles: riskOk, risk_matrix: riskOk });
  const opportunity = nested({ opportunity_id: opportunityOk ? "opportunity:mc-2:scenario" : "", efficiency_improvements: opportunityOk, mission_optimization: opportunityOk, resource_savings: opportunityOk, capability_expansion: opportunityOk, timeline_improvements: opportunityOk, opportunity_analysis: opportunityOk });
  const comparison = nested({ comparison_id: comparisonOk ? "comparison:mc-2:scenario" : "", side_by_side: comparisonOk, delta_analysis: comparisonOk, cost_comparison: comparisonOk, timeline_comparison: comparisonOk, resource_comparison: comparisonOk, risk_comparison: comparisonOk, objective_comparison: comparisonOk, comparative_reports: comparisonOk, deterministic_comparisons: comparisonOk });
  const recommendation = nested({ engine_id: recommendationOk ? "engine:mc-2:recommendation" : "", preferred_scenario_selection: recommendationOk, tradeoff_analysis: recommendationOk, recommendation_justification: recommendationOk, decision_explanation: recommendationOk, confidence_assessment: recommendationOk, recommendation_report: recommendationOk, explainable_recommendations: recommendationOk });
  const governance = nested({ governance_id: governanceOk ? "governance:mc-2:scenario" : "", constitutional_validation: governanceOk, authority_validation: governanceOk, policy_enforcement: governanceOk, safety_validation: governanceOk, approval_workflow: governanceOk, lifecycle_contract_enforced: governanceOk, authority_restrictions_enforced: governanceOk, policy_requirements_enforced: governanceOk, safety_constraints_enforced: governanceOk });
  const evidence = nested({ ledger_id: evidenceOk ? "ledger:mc-2:planning-evidence" : "", planning_evidence: evidenceOk, evaluation_evidence: evidenceOk, comparison_evidence: evidenceOk, recommendation_evidence: evidenceOk, approval_evidence: evidenceOk, immutable_planning_evidence: evidenceOk, evidence_lineage_complete: evidenceOk });
  const lifecycle = nested({ lifecycle_id: lifecycleOk ? "lifecycle:mc-2:scenario" : "", states: lifecycleOk ? freezeArray(LIFECYCLE_STATES) : freezeArray<ScenarioLifecycleState>([]), deterministic_transitions: lifecycleOk, rejected_branch_terminal: lifecycleOk, adopted_requires_approval: lifecycleOk, archived_retains_evidence: lifecycleOk });
  const outputs = nested({ output_id: outputsOk ? "outputs:mc-2:scenario-planning" : "", scenario_catalog: outputsOk, scenario_reports: outputsOk, scenario_evidence: outputsOk, assumption_registry: outputsOk, evaluation_reports: outputsOk, risk_reports: outputsOk, opportunity_reports: outputsOk, recommendation_reports: outputsOk, comparison_reports: outputsOk, planning_evidence_ledger: outputsOk, planning_analytics: outputsOk });
  const readiness = nested({ readiness_id: "MC-2-SCENARIO-PLANNING-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_") && !failure.startsWith("W2_")), definition_ready: definitionOk, generation_ready: generationOk, assumptions_ready: assumptionsOk, what_if_ready: whatIfOk, evaluation_ready: evaluationOk, risk_ready: riskOk, opportunity_ready: opportunityOk, comparison_ready: comparisonOk, recommendation_ready: recommendationOk, governance_ready: governanceOk, evidence_ready: evidenceOk, lifecycle_ready: lifecycleOk, outputs_ready: outputsOk, mission_integrity_preserved: generationOk, qualification_ready: qualified, failures });
  const base: Omit<ScenarioPlanningResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), mission_id, tenant_id, definition, generation, assumptions, what_if, evaluation, risk, opportunity, comparison, recommendation, governance, evidence, lifecycle, outputs, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateScenarioPlanning(result?: ScenarioPlanningResult): ScenarioPlanningValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, definition_valid: false, generation_valid: false, assumptions_valid: false, what_if_valid: false, evaluation_valid: false, risk_valid: false, opportunity_valid: false, comparison_valid: false, recommendation_valid: false, governance_valid: false, evidence_valid: false, lifecycle_valid: false, outputs_valid: false, readiness_valid: false, failures: freezeArray(["SCENARIO_DEFINITION_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const definition_valid = verifyHashed(result.definition) && result.definition.identity && result.definition.versioning && result.definition.scenario_catalog;
  const generation_valid = verifyHashed(result.generation) && result.generation.deterministic_branching && result.generation.reproducible_scenarios && result.generation.authoritative_mission_unchanged && result.generation.exactly_one_authoritative_mission_ref;
  const assumptions_valid = verifyHashed(result.assumptions) && result.assumptions.assumption_validation && result.assumptions.constraint_documentation && result.assumptions.traceable_assumptions;
  const what_if_valid = verifyHashed(result.what_if) && result.what_if.classes.length === 5 && result.what_if.resource_variations && result.what_if.environmental_variations;
  const evaluation_valid = verifyHashed(result.evaluation) && result.evaluation.constitutional_compliance && result.evaluation.scenario_scores && result.evaluation.repeatable_evaluations;
  const risk_valid = verifyHashed(result.risk) && result.risk.operational_risk && result.risk.authority_risk && result.risk.policy_risk && result.risk.risk_matrix;
  const opportunity_valid = verifyHashed(result.opportunity) && result.opportunity.mission_optimization && result.opportunity.opportunity_analysis;
  const comparison_valid = verifyHashed(result.comparison) && result.comparison.side_by_side && result.comparison.delta_analysis && result.comparison.deterministic_comparisons;
  const recommendation_valid = verifyHashed(result.recommendation) && result.recommendation.preferred_scenario_selection && result.recommendation.recommendation_justification && result.recommendation.decision_explanation && result.recommendation.explainable_recommendations;
  const governance_valid = verifyHashed(result.governance) && result.governance.constitutional_validation && result.governance.authority_validation && result.governance.policy_enforcement && result.governance.safety_validation && result.governance.approval_workflow;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.planning_evidence && result.evidence.immutable_planning_evidence && result.evidence.evidence_lineage_complete;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === 8 && result.lifecycle.deterministic_transitions && result.lifecycle.adopted_requires_approval && result.lifecycle.archived_retains_evidence;
  const outputs_valid = verifyHashed(result.outputs) && result.outputs.scenario_catalog && result.outputs.recommendation_reports && result.outputs.planning_evidence_ledger && result.outputs.planning_analytics;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.mission_integrity_preserved && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && definition_valid && generation_valid && assumptions_valid && what_if_valid && evaluation_valid && risk_valid && opportunity_valid && comparison_valid && recommendation_valid && governance_valid && evidence_valid && lifecycle_valid && outputs_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, definition_valid, generation_valid, assumptions_valid, what_if_valid, evaluation_valid, risk_valid, opportunity_valid, comparison_valid, recommendation_valid, governance_valid, evidence_valid, lifecycle_valid, outputs_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayScenarioPlanning(result = runScenarioPlanning()): boolean { const replayed = runScenarioPlanning(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateScenarioPlanning(result).valid; }
export function getScenarioPlanningBundle(): ScenarioPlanningBundle { const result = runScenarioPlanning(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_scenario_definition: true, owns_alternative_future_generation: true, owns_assumption_management: true, owns_what_if_analysis: true, owns_scenario_evaluation: true, owns_scenario_comparison: true, owns_recommendations: true, authoritative_mission_remains_unchanged: true, qualification_gate: "Mission Scenario Planning Qualification" }), result, validation: validateScenarioPlanning(result) }); }
export const ScenarioPlanningService = Object.freeze({ run: runScenarioPlanning, validate: validateScenarioPlanning, replay: replayScenarioPlanning });
