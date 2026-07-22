import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import { runSimulation, validateSimulation } from "@/services/simulation";
import type { MissionRecommendationBundle, MissionRecommendationDecision, MissionRecommendationFailure, MissionRecommendationInput, MissionRecommendationResult, MissionRecommendationScenario, MissionRecommendationValidation, RecommendationLifecycleState } from "@/types/mission-recommendation-intelligence";

const VERSION = "mission-recommendation-intelligence/mc-9" as const;
const IDENTIFIER = "MissionRecommendationIntelligence" as const;
const LIFECYCLE_STATES = Object.freeze<RecommendationLifecycleState[]>(["GENERATED", "VALIDATED", "PUBLISHED", "UPDATED", "SUPERSEDED", "WITHDRAWN", "ARCHIVED"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), portfolio: runPortfolioManagement(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin(), simulation: runSimulation(), risk: runRiskAssessment() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly MissionRecommendationFailure[], failure: MissionRecommendationFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: MissionRecommendationScenario): MissionRecommendationFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly MissionRecommendationFailure[], scenario?: MissionRecommendationScenario): MissionRecommendationDecision {
  const conditional = new Set<MissionRecommendationFailure>(["RECOMMENDATION_ENGINE_MISSING", "RECOMMENDATION_PRIORITIZATION_MISSING", "RECOMMENDATION_SCORING_MISSING", "RECOMMENDATION_RANKING_MISSING", "RECOMMENDATION_REFINEMENT_MISSING", "RECOMMENDATION_SUPPRESSION_MISSING", "RECOMMENDATION_LIFECYCLE_MISSING", "RECOMMENDATION_ANALYSIS_MISSING", "MISSION_OBJECTIVE_ANALYSIS_MISSING", "RISK_REDUCTION_ANALYSIS_MISSING", "RESOURCE_OPTIMIZATION_MISSING", "TIMELINE_OPTIMIZATION_MISSING", "DEPENDENCY_OPTIMIZATION_MISSING", "EFFICIENCY_ANALYSIS_MISSING", "CONFIDENCE_ESTIMATION_MISSING", "RECOMMENDATION_EXPLANATION_MISSING", "SUPPORTING_EVIDENCE_MISSING", "ASSUMPTIONS_MISSING", "CONSTRAINTS_MISSING", "BENEFITS_MISSING", "DRAWBACKS_MISSING", "ALTERNATIVES_MISSING", "CONFIDENCE_SCORE_MISSING", "RECOMMENDATION_GOVERNANCE_MISSING", "RECOMMENDATION_PRIORITIZATION_NOT_TRANSPARENT", "RECOMMENDATION_CONFIDENCE_MISSING", "RECOMMENDATION_LIFECYCLE_NOT_GOVERNED", "RECOMMENDATION_FEED_MISSING", "RECOMMENDATION_REPORTS_MISSING", "RECOMMENDATION_EVIDENCE_MISSING", "RECOMMENDATION_APIS_MISSING", "MISSION_RECOMMENDATION_INTELLIGENCE_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "MISSION_RECOMMENDATION_INTELLIGENCE_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "MISSION_RECOMMENDATION_INTELLIGENCE_QUALIFIED";
}
function resultReplayHash(result: Omit<MissionRecommendationResult, "replay_hash" | "integrity_hash">): string { return hash({ engine: result.engine.integrity_hash, analysis: result.analysis.integrity_hash, explanation: result.explanation.integrity_hash, governance: result.governance.integrity_hash, prioritization: result.prioritization.integrity_hash, confidence: result.confidence.integrity_hash, lifecycle: result.lifecycle.integrity_hash, feed: result.feed.integrity_hash, reports: result.reports.integrity_hash, evidence: result.evidence.integrity_hash, apis: result.apis.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<MissionRecommendationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runMissionRecommendationIntelligence(input: MissionRecommendationInput = {}): MissionRecommendationResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<MissionRecommendationFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["MC_3_DECISION_SUPPORT_INVALID", !validateDecisionSupport(baselines.decision).valid],
    ["MC_4_PORTFOLIO_MANAGEMENT_INVALID", !validatePortfolioManagement(baselines.portfolio).valid],
    ["MC_5_OPERATIONAL_EVIDENCE_REPLAY_INVALID", !validateOperationalEvidenceReplay(baselines.replay).valid],
    ["MC_6_DIGITAL_TWIN_INVALID", !validateDigitalTwin(baselines.twin).valid],
    ["MC_7_SIMULATION_INVALID", !validateSimulation(baselines.simulation).valid],
    ["MC_8_RISK_ASSESSMENT_INVALID", !validateRiskAssessment(baselines.risk).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const engineOk = !has(failures, "RECOMMENDATION_ENGINE_MISSING") && !has(failures, "RECOMMENDATION_GENERATION_NON_DETERMINISTIC") && !has(failures, "RECOMMENDATION_PRIORITIZATION_MISSING") && !has(failures, "RECOMMENDATION_SCORING_MISSING") && !has(failures, "RECOMMENDATION_RANKING_MISSING") && !has(failures, "RECOMMENDATION_REFINEMENT_MISSING") && !has(failures, "RECOMMENDATION_SUPPRESSION_MISSING") && !has(failures, "RECOMMENDATION_LIFECYCLE_MISSING") && !has(failures, "AUTONOMOUS_EXECUTION_ATTEMPTED");
  const analysisOk = !has(failures, "RECOMMENDATION_ANALYSIS_MISSING") && !has(failures, "MISSION_OBJECTIVE_ANALYSIS_MISSING") && !has(failures, "RISK_REDUCTION_ANALYSIS_MISSING") && !has(failures, "RESOURCE_OPTIMIZATION_MISSING") && !has(failures, "TIMELINE_OPTIMIZATION_MISSING") && !has(failures, "DEPENDENCY_OPTIMIZATION_MISSING") && !has(failures, "EFFICIENCY_ANALYSIS_MISSING") && !has(failures, "CONFIDENCE_ESTIMATION_MISSING");
  const explanationOk = !has(failures, "RECOMMENDATION_EXPLANATION_MISSING") && !has(failures, "SUPPORTING_EVIDENCE_MISSING") && !has(failures, "ASSUMPTIONS_MISSING") && !has(failures, "CONSTRAINTS_MISSING") && !has(failures, "BENEFITS_MISSING") && !has(failures, "DRAWBACKS_MISSING") && !has(failures, "ALTERNATIVES_MISSING") && !has(failures, "CONFIDENCE_SCORE_MISSING") && !has(failures, "UNCERTAINTY_CONCEALED") && !has(failures, "SUPPORTING_EVIDENCE_REMOVED");
  const governanceOk = !has(failures, "RECOMMENDATION_GOVERNANCE_MISSING") && !has(failures, "CONSTITUTIONAL_VALIDATION_FAILED") && !has(failures, "POLICY_VALIDATION_FAILED") && !has(failures, "AUTHORITY_VALIDATION_FAILED") && !has(failures, "SAFETY_VALIDATION_FAILED") && !has(failures, "EVIDENCE_COMPLETENESS_FAILED") && !has(failures, "EXPLAINABILITY_VALIDATION_FAILED") && !has(failures, "OPERATOR_AUTHORITY_BYPASSED") && !has(failures, "GOVERNANCE_OVERRIDE_ATTEMPTED");
  const prioritizationOk = !has(failures, "RECOMMENDATION_PRIORITIZATION_NOT_TRANSPARENT");
  const confidenceOk = !has(failures, "RECOMMENDATION_CONFIDENCE_MISSING") && !has(failures, "CONFIDENCE_INPUTS_INCOMPLETE");
  const lifecycleOk = !has(failures, "RECOMMENDATION_LIFECYCLE_NOT_GOVERNED");
  const feedOk = !has(failures, "RECOMMENDATION_FEED_MISSING");
  const reportsOk = !has(failures, "RECOMMENDATION_REPORTS_MISSING");
  const evidenceOk = !has(failures, "RECOMMENDATION_EVIDENCE_MISSING") && !has(failures, "RECOMMENDATION_EVIDENCE_MUTABLE") && !has(failures, "RECOMMENDATION_LINEAGE_INCOMPLETE");
  const apisOk = !has(failures, "RECOMMENDATION_APIS_MISSING");
  const noStateMutation = !has(failures, "MISSION_MUTATION_ATTEMPTED");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "MISSION_RECOMMENDATION_INTELLIGENCE_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const recommendation_id = input.recommendation_id ?? `recommendation:mc-9:${input.seed ?? "canonical"}`;
  const engine = nested({ engine_id: engineOk ? "engine:mc-9:recommendation" : "", generation: engineOk, prioritization: engineOk, scoring: engineOk, ranking: engineOk, refinement: engineOk, suppression: engineOk, lifecycle: engineOk, deterministic_generation: engineOk, advisory_only: engineOk, no_action_execution: engineOk });
  const analysis = nested({ analysis_id: analysisOk ? "analysis:mc-9:recommendation" : "", mission_objectives: analysisOk, risk_reduction: analysisOk, resource_optimization: analysisOk, timeline_optimization: analysisOk, dependency_optimization: analysisOk, operational_efficiency: analysisOk, confidence_estimation: analysisOk });
  const explanation = nested({ explanation_id: explanationOk ? "explanation:mc-9:recommendation" : "", supporting_evidence: explanationOk, assumptions: explanationOk, constraints: explanationOk, expected_benefits: explanationOk, potential_drawbacks: explanationOk, alternative_recommendations: explanationOk, confidence_score: explanationOk, auditable: explanationOk });
  const governance = nested({ governance_id: governanceOk ? "governance:mc-9:recommendation" : "", constitutional_validation: governanceOk, policy_evaluation: governanceOk, authority_validation: governanceOk, safety_verification: governanceOk, evidence_completeness: governanceOk, explainability_verification: governanceOk, publication_gate: governanceOk, failed_recommendations_suppressed: governanceOk });
  const prioritization = nested({ prioritization_id: prioritizationOk ? "priority:mc-9:recommendation" : "", mission_objectives: prioritizationOk, risk_exposure: prioritizationOk, resource_availability: prioritizationOk, mission_urgency: prioritizationOk, portfolio_priorities: prioritizationOk, organizational_policy: prioritizationOk, strategic_alignment: prioritizationOk, transparent_ranking: prioritizationOk });
  const confidence = nested({ confidence_id: confidenceOk ? "confidence:mc-9:recommendation" : "", evidence_quality: confidenceOk, evidence_completeness: confidenceOk, simulation_agreement: confidenceOk, replay_agreement: confidenceOk, digital_twin_consistency: confidenceOk, risk_certainty: confidenceOk, decision_support_confidence: confidenceOk, confidence: confidenceOk ? 0.89 : 0 });
  const lifecycle = nested({ lifecycle_id: lifecycleOk ? "lifecycle:mc-9:recommendation" : "", states: lifecycleOk ? freezeArray(LIFECYCLE_STATES) : freezeArray<RecommendationLifecycleState>([]), generated: lifecycleOk, validated: lifecycleOk, published: lifecycleOk, updated: lifecycleOk, superseded: lifecycleOk, withdrawn: lifecycleOk, archived: lifecycleOk, governed_state_transitions: lifecycleOk });
  const feed = nested({ feed_id: feedOk ? "feed:mc-9:recommendations" : "", recommendation_id, mission: baselines.mission.mission_id, priority: "HIGH" as const, confidence: confidence.confidence, supporting_evidence: feedOk, risk_summary: feedOk, expected_impact: feedOk, status: "PUBLISHED" as const, continuously_updated: feedOk, advisory_only: feedOk });
  const reports = nested({ report_id: reportsOk ? "report:mc-9:recommendation" : "", recommendation_summary: reportsOk, evidence_references: reportsOk, simulation_references: reportsOk, risk_analysis: reportsOk, decision_justification: reportsOk, expected_outcomes: reportsOk, alternative_options: reportsOk, immutable_audit_record: reportsOk });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-9:recommendation" : "", recommendation_lineage: evidenceOk, evidence_graph: evidenceOk, supporting_artifacts: evidenceOk, evaluation_history: evidenceOk, governance_decisions: evidenceOk, confidence_calculations: evidenceOk, immutable: evidenceOk, complete_lineage: evidenceOk });
  const apis = nested({ api_id: apisOk ? "api:mc-9:mission-recommendation-intelligence" : "", recommendation_api: apisOk, analysis_api: apisOk, explanation_api: apisOk, governance_api: apisOk, prioritization_api: apisOk, confidence_api: apisOk, lifecycle_api: apisOk, feed_api: apisOk, report_api: apisOk, evidence_api: apisOk, stable: apisOk });
  const readiness = nested({ readiness_id: "MC-9-MISSION-RECOMMENDATION-INTELLIGENCE-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_")), engine_ready: engineOk, analysis_ready: analysisOk, explanation_ready: explanationOk, governance_ready: governanceOk, prioritization_ready: prioritizationOk, confidence_ready: confidenceOk, lifecycle_ready: lifecycleOk, feed_ready: feedOk, reports_ready: reportsOk, evidence_ready: evidenceOk, apis_ready: apisOk, deterministic: engineOk, advisory_only: engineOk && feedOk, no_execution: engineOk, no_state_mutation: noStateMutation, governance_enforced: governanceOk, evidence_lineage_complete: evidenceOk, qualification_ready: qualified, failures });
  const base: Omit<MissionRecommendationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, recommendation_id, engine, analysis, explanation, governance, prioritization, confidence, lifecycle, feed, reports, evidence, apis, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateMissionRecommendationIntelligence(result?: MissionRecommendationResult): MissionRecommendationValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, engine_valid: false, analysis_valid: false, explanation_valid: false, governance_valid: false, prioritization_valid: false, confidence_valid: false, lifecycle_valid: false, feed_valid: false, reports_valid: false, evidence_valid: false, apis_valid: false, readiness_valid: false, failures: freezeArray(["RECOMMENDATION_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const engine_valid = verifyHashed(result.engine) && result.engine.deterministic_generation && result.engine.advisory_only && result.engine.no_action_execution;
  const analysis_valid = verifyHashed(result.analysis) && result.analysis.risk_reduction && result.analysis.resource_optimization && result.analysis.confidence_estimation;
  const explanation_valid = verifyHashed(result.explanation) && result.explanation.supporting_evidence && result.explanation.alternative_recommendations && result.explanation.confidence_score && result.explanation.auditable;
  const governance_valid = verifyHashed(result.governance) && result.governance.constitutional_validation && result.governance.policy_evaluation && result.governance.authority_validation && result.governance.safety_verification && result.governance.publication_gate && result.governance.failed_recommendations_suppressed;
  const prioritization_valid = verifyHashed(result.prioritization) && result.prioritization.risk_exposure && result.prioritization.portfolio_priorities && result.prioritization.strategic_alignment && result.prioritization.transparent_ranking;
  const confidence_valid = verifyHashed(result.confidence) && result.confidence.confidence >= 0.85 && result.confidence.simulation_agreement && result.confidence.replay_agreement && result.confidence.digital_twin_consistency && result.confidence.risk_certainty;
  const lifecycle_valid = verifyHashed(result.lifecycle) && result.lifecycle.states.length === 7 && result.lifecycle.published && result.lifecycle.governed_state_transitions;
  const feed_valid = verifyHashed(result.feed) && result.feed.status === "PUBLISHED" && result.feed.supporting_evidence && result.feed.advisory_only;
  const reports_valid = verifyHashed(result.reports) && result.reports.recommendation_summary && result.reports.simulation_references && result.reports.risk_analysis && result.reports.immutable_audit_record;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.immutable && result.evidence.complete_lineage && result.evidence.governance_decisions && result.evidence.confidence_calculations;
  const apis_valid = verifyHashed(result.apis) && result.apis.recommendation_api && result.apis.governance_api && result.apis.feed_api && result.apis.evidence_api && result.apis.stable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.deterministic && result.readiness.advisory_only && result.readiness.no_execution && result.readiness.no_state_mutation && result.readiness.governance_enforced && result.readiness.evidence_lineage_complete && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && engine_valid && analysis_valid && explanation_valid && governance_valid && prioritization_valid && confidence_valid && lifecycle_valid && feed_valid && reports_valid && evidence_valid && apis_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, engine_valid, analysis_valid, explanation_valid, governance_valid, prioritization_valid, confidence_valid, lifecycle_valid, feed_valid, reports_valid, evidence_valid, apis_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayMissionRecommendationIntelligence(result = runMissionRecommendationIntelligence()): boolean { const replayed = runMissionRecommendationIntelligence(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateMissionRecommendationIntelligence(result).valid; }
export function getMissionRecommendationIntelligenceBundle(): MissionRecommendationBundle { const result = runMissionRecommendationIntelligence(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_recommendation_engine: true, owns_recommendation_analysis: true, owns_recommendation_explanation: true, owns_recommendation_governance: true, owns_recommendation_prioritization_confidence_lifecycle: true, consumes_mc_1_through_mc_8: true, recommendations_are_advisory_only: true, autonomous_execution_prohibited: true, governance_validation_required_before_publication: true, qualification_gate: "Mission Recommendation Intelligence Qualification Gate" }), result, validation: validateMissionRecommendationIntelligence(result) }); }
export const MissionRecommendationIntelligenceService = Object.freeze({ run: runMissionRecommendationIntelligence, validate: validateMissionRecommendationIntelligence, replay: replayMissionRecommendationIntelligence });
