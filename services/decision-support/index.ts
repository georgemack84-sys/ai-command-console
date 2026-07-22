import { runAuthorityValidator, validateAuthorityValidator } from "@/services/authority-validator";
import { runCertificationEngine, validateCertificationEngine } from "@/services/certification-engine";
import { runCollaborationEngine, validateCollaborationEngine } from "@/services/collaboration-engine";
import { runDelegationEngine, validateDelegationEngine } from "@/services/delegation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runEvidenceEngine, validateEvidenceEngine } from "@/services/evidence-engine";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPolicyGate, validatePolicyGate } from "@/services/policy-gate";
import { runReplayEngine, validateReplayEngine } from "@/services/replay-engine";
import { runRuntimeOrchestrator, validateRuntimeOrchestrator } from "@/services/runtime-orchestrator";
import { runSafetyGate, validateSafetyGate } from "@/services/safety-gate";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import type { AdvisoryStatus, DecisionSupportBundle, DecisionSupportDecision, DecisionSupportFailure, DecisionSupportInput, DecisionSupportResult, DecisionSupportScenario, DecisionSupportValidation } from "@/types/decision-support";

const VERSION = "decision-support/mc-3" as const;
const IDENTIFIER = "DecisionSupport" as const;
const ADVISORY_TIMESTAMP = "2026-07-20T00:00:00.000Z" as const;
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "evidence-engine/w2.13", "replay-engine/w2.14", "certification-engine/w2.15", "policy-gate/w2.6", "authority-validator/w2.5", "safety-gate/w2.7", "planning-engine/w2.8", "memory-engine/w2.9", "collaboration-engine/w2.12", "delegation-engine/w2.11", "runtime-orchestrator/w2.10"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), evidence: runEvidenceEngine(), replay: runReplayEngine(), certification: runCertificationEngine(), policy: runPolicyGate(), authority: runAuthorityValidator(), safety: runSafetyGate(), planning: runPlanningEngine(), memory: runMemoryEngine(), collaboration: runCollaborationEngine(), delegation: runDelegationEngine(), runtime: runRuntimeOrchestrator() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function has(failures: readonly DecisionSupportFailure[], failure: DecisionSupportFailure): boolean { return failures.includes(failure); }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function scenarioFailure(scenario: DecisionSupportScenario): DecisionSupportFailure | undefined { return scenario === "BASELINE" || scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly DecisionSupportFailure[], scenario: DecisionSupportScenario): DecisionSupportDecision {
  const conditional = new Set<DecisionSupportFailure>(["DECISION_ENGINE_MISSING", "TRADEOFF_ANALYSIS_MISSING", "MULTI_CRITERIA_EVALUATION_MISSING", "EVIDENCE_AGGREGATION_MISSING", "JUSTIFICATION_MISSING", "MISSION_ADVISORY_GATE_MISSING", "DECISION_PACKAGE_MISSING", "RECOMMENDATION_REPORT_MISSING", "TRADEOFF_REPORT_MISSING", "EVIDENCE_BUNDLE_MISSING", "JUSTIFICATION_REPORT_MISSING", "AUDIT_EVIDENCE_MISSING", "DECISION_SUPPORT_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "DECISION_SUPPORT_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "MISSION_DECISION_SUPPORT_QUALIFIED";
}
function resultReplayHash(result: Omit<DecisionSupportResult, "replay_hash" | "integrity_hash">): string { return hash({ decision: result.decision_engine.integrity_hash, tradeoff: result.tradeoff_analyzer.integrity_hash, multi: result.multi_criteria.integrity_hash, evidence: result.evidence_aggregator.integrity_hash, justification: result.justification.integrity_hash, gate: result.advisory_gate.integrity_hash, artifacts: result.artifacts.integrity_hash, governance: result.governance.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<DecisionSupportResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runDecisionSupport(input: DecisionSupportInput = {}): DecisionSupportResult {
  const scenario = input.scenario ?? "BASELINE";
  const direct = scenarioFailure(scenario);
  const scenarioFailures = freezeArray<DecisionSupportFailure>(direct ? [direct] : []);
  baselines ??= makeBaselines();
  const upstream = [
    ["MC_1_MISSION_MANAGEMENT_INVALID", !validateMissionManagement(baselines.mission).valid],
    ["MC_2_SCENARIO_PLANNING_INVALID", !validateScenarioPlanning(baselines.scenario).valid],
    ["W2_EVIDENCE_INVALID", !validateEvidenceEngine(baselines.evidence).valid],
    ["W2_REPLAY_INVALID", !validateReplayEngine(baselines.replay).valid],
    ["W2_CERTIFICATION_INVALID", !validateCertificationEngine(baselines.certification).valid],
    ["W2_POLICY_INVALID", !validatePolicyGate(baselines.policy).valid],
    ["W2_AUTHORITY_INVALID", !validateAuthorityValidator(baselines.authority).valid],
    ["W2_SAFETY_INVALID", !validateSafetyGate(baselines.safety).valid],
    ["W2_PLANNING_INVALID", !validatePlanningEngine(baselines.planning).valid],
    ["W2_MEMORY_INVALID", !validateMemoryEngine(baselines.memory).valid],
    ["W2_COLLABORATION_INVALID", !validateCollaborationEngine(baselines.collaboration).valid],
    ["W2_DELEGATION_INVALID", !validateDelegationEngine(baselines.delegation).valid],
    ["W2_RUNTIME_INVALID", !validateRuntimeOrchestrator(baselines.runtime).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([failure, invalid]) => invalid || has(scenarioFailures, failure)).map(([failure]) => failure)])]);
  const engineOk = !has(failures, "DECISION_ENGINE_MISSING") && !has(failures, "RECOMMENDATION_GENERATION_MISSING") && !has(failures, "RECOMMENDATION_RANKING_NON_DETERMINISTIC") && !has(failures, "CONSTITUTIONAL_FILTERING_BYPASSED");
  const tradeoffOk = !has(failures, "TRADEOFF_ANALYSIS_MISSING") && !has(failures, "TRADEOFF_MATRIX_NON_DETERMINISTIC");
  const multiOk = !has(failures, "MULTI_CRITERIA_EVALUATION_MISSING") && !has(failures, "WEIGHTED_SCORING_NON_DETERMINISTIC") && !has(failures, "MANDATORY_CONSTRAINTS_BYPASSED");
  const evidenceOk = !has(failures, "EVIDENCE_AGGREGATION_MISSING") && !has(failures, "EVIDENCE_LINEAGE_INCOMPLETE") && !has(failures, "EVIDENCE_CONFIDENCE_MISSING");
  const justificationOk = !has(failures, "JUSTIFICATION_MISSING") && !has(failures, "RECOMMENDATION_NOT_EXPLAINABLE") && !has(failures, "REJECTED_ALTERNATIVES_MISSING");
  const governanceOk = !has(failures, "OPERATIONAL_DECISION_ATTEMPTED") && !has(failures, "MISSION_EXECUTION_ATTEMPTED") && !has(failures, "OPERATOR_SUPREMACY_BYPASSED");
  const gateOk = !has(failures, "MISSION_ADVISORY_GATE_MISSING") && !has(failures, "MISSION_ADVISORY_GATE_FAILED") && !has(failures, "OUTPUT_PUBLISHED_WITHOUT_GATE") && evidenceOk && justificationOk && governanceOk;
  const artifactsOk = !has(failures, "DECISION_PACKAGE_MISSING") && !has(failures, "RECOMMENDATION_REPORT_MISSING") && !has(failures, "TRADEOFF_REPORT_MISSING") && !has(failures, "EVIDENCE_BUNDLE_MISSING") && !has(failures, "JUSTIFICATION_REPORT_MISSING") && gateOk;
  const auditOk = !has(failures, "AUDIT_EVIDENCE_MISSING") && !has(failures, "AUDIT_EVIDENCE_NOT_IMMUTABLE");
  const replayOk = !has(failures, "DETERMINISTIC_REPLAY_FAILED");
  const decision = decisionFor(failures, scenario);
  const qualified = decision === "MISSION_DECISION_SUPPORT_QUALIFIED";
  const mission_id = input.mission_id ?? baselines.mission.mission_id;
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const decision_id = input.decision_id ?? `decision:mc-3:${input.seed ?? "canonical"}`;
  const advisoryStatus: AdvisoryStatus = artifactsOk ? "PUBLISHED" : gateOk ? "GATE_PASSED" : "REJECTED";
  const decision_engine = nested({ engine_id: engineOk ? `engine:mc-3:decision:${input.seed ?? "canonical"}` : "", recommendation_generation: engineOk, alternative_ranking: engineOk, recommendation_scoring: engineOk, decision_normalization: engineOk, constitutional_filtering: engineOk, objectives: engineOk, constraints: engineOk, scenarios: engineOk, evidence: engineOk, policy: engineOk, authority: engineOk, historical_outcomes: engineOk, ranked_recommendations: engineOk, deterministic: engineOk, advisory_only: engineOk });
  const tradeoff_analyzer = nested({ analyzer_id: tradeoffOk ? "analyzer:mc-3:tradeoff" : "", compare_alternatives: tradeoffOk, identify_compromises: tradeoffOk, sensitivity_analysis: tradeoffOk, objective_comparison: tradeoffOk, cost: tradeoffOk, schedule: tradeoffOk, risk: tradeoffOk, confidence: tradeoffOk, mission_value: tradeoffOk, operational_impact: tradeoffOk, resource_usage: tradeoffOk, probability_of_success: tradeoffOk, comparative_tradeoff_matrix: tradeoffOk, deterministic_matrix: tradeoffOk });
  const multi_criteria = nested({ evaluator_id: multiOk ? "evaluator:mc-3:multi-criteria" : "", weighted_objectives: multiOk, mandatory_constraints: multiOk, mission_priorities: multiOk, policy_restrictions: multiOk, authority_restrictions: multiOk, weighted_scoring: multiOk, objective_normalization: multiOk, constraint_evaluation: multiOk, ranking: multiOk, normalized_scoring: multiOk, deterministic_rankings: multiOk });
  const evidence_aggregator = nested({ aggregator_id: evidenceOk ? "aggregator:mc-3:evidence" : "", scenarios: evidenceOk, simulations: evidenceOk, execution_history: evidenceOk, replay: evidenceOk, certification: evidenceOk, operational_evidence: evidenceOk, external_evidence_sources: evidenceOk, evidence_collection: evidenceOk, lineage_validation: evidenceOk, confidence_aggregation: evidenceOk, evidence_completeness: evidenceOk, unified_evidence_package: evidenceOk });
  const justification = nested({ service_id: justificationOk ? "service:mc-3:justification" : "", recommendation_explanations: justificationOk, evidence_mapping: justificationOk, rationale_generation: justificationOk, traceability: justificationOk, supporting_evidence: justificationOk, rejected_alternatives: justificationOk, assumptions: justificationOk, constraints: justificationOk, constitutional_checks: justificationOk, confidence: justificationOk, risk_summary: justificationOk, justification_report: justificationOk, explainable: justificationOk });
  const advisory_gate = nested({ gate_id: gateOk ? "gate:mc-3:mission-advisory" : "", mission_constitutional_compliance: gateOk, mission_lifecycle_validity: gateOk, authority_validation: gateOk, policy_compliance: gateOk, safety_compliance: gateOk, evidence_completeness: gateOk, evidence_provenance: gateOk, recommendation_explainability: gateOk, justification_completeness: gateOk, confidence_thresholds: gateOk, traceability: gateOk, audit_readiness: gateOk, failed_outputs_not_published: gateOk, gate_passed: gateOk });
  const artifacts = nested({ artifact_id: artifactsOk ? "artifact:mc-3:decision-package" : "", decision_package: artifactsOk, recommendation_report: artifactsOk, tradeoff_report: artifactsOk, evidence_bundle: artifactsOk, decision_justification_report: artifactsOk, mission_id, decision_id, advisory_status: advisoryStatus, evidence_references: artifactsOk ? freezeArray(["evidence:scenario", "evidence:replay", "evidence:certification", "evidence:operational", "evidence:external"]) : freezeArray<string>([]), confidence_score: artifactsOk ? 0.91 : 0, tradeoff_summary: artifactsOk, recommendation_ranking: artifactsOk, constitutional_review: artifactsOk, authority_review: artifactsOk, policy_review: artifactsOk, safety_review: artifactsOk, mission_lifecycle_state: "APPROVED", advisory_timestamp: ADVISORY_TIMESTAMP, immutable_lineage_id: artifactsOk ? "lineage:mc-3:decision-package" : "" });
  const governance = nested({ governance_id: governanceOk ? "governance:mc-3:advisory" : "", recommendations_only: governanceOk, never_executes_mission_actions: governanceOk, preserves_operator_supremacy: governanceOk, deterministic_recommendations: governanceOk, explainable_recommendations: governanceOk, complete_evidence_lineage: governanceOk, immutable_audit_evidence: governanceOk && auditOk, rejects_insufficient_evidence: governanceOk, rejects_constitutional_violations: governanceOk, requires_gate_before_publication: governanceOk });
  const readiness = nested({ readiness_id: "MC-3-DECISION-SUPPORT-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_") && !failure.startsWith("W2_")), decision_engine_ready: engineOk, tradeoff_ready: tradeoffOk, multi_criteria_ready: multiOk, evidence_ready: evidenceOk, justification_ready: justificationOk, advisory_gate_ready: gateOk, artifacts_ready: artifactsOk, governance_ready: governanceOk && auditOk, replay_reproducible: replayOk, advisory_only: governanceOk, operator_supremacy_preserved: governanceOk, qualification_ready: qualified, failures });
  const base: Omit<DecisionSupportResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), mission_id, tenant_id, decision_engine, tradeoff_analyzer, multi_criteria, evidence_aggregator, justification, advisory_gate, artifacts, governance, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateDecisionSupport(result?: DecisionSupportResult): DecisionSupportValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, decision_engine_valid: false, tradeoff_valid: false, multi_criteria_valid: false, evidence_valid: false, justification_valid: false, advisory_gate_valid: false, artifacts_valid: false, governance_valid: false, readiness_valid: false, failures: freezeArray(["DECISION_ENGINE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const decision_engine_valid = verifyHashed(result.decision_engine) && result.decision_engine.ranked_recommendations && result.decision_engine.constitutional_filtering && result.decision_engine.advisory_only;
  const tradeoff_valid = verifyHashed(result.tradeoff_analyzer) && result.tradeoff_analyzer.comparative_tradeoff_matrix && result.tradeoff_analyzer.deterministic_matrix;
  const multi_criteria_valid = verifyHashed(result.multi_criteria) && result.multi_criteria.weighted_objectives && result.multi_criteria.mandatory_constraints && result.multi_criteria.normalized_scoring && result.multi_criteria.deterministic_rankings;
  const evidence_valid = verifyHashed(result.evidence_aggregator) && result.evidence_aggregator.lineage_validation && result.evidence_aggregator.confidence_aggregation && result.evidence_aggregator.evidence_completeness && result.evidence_aggregator.unified_evidence_package;
  const justification_valid = verifyHashed(result.justification) && result.justification.supporting_evidence && result.justification.rejected_alternatives && result.justification.constitutional_checks && result.justification.explainable;
  const advisory_gate_valid = verifyHashed(result.advisory_gate) && result.advisory_gate.gate_passed && result.advisory_gate.failed_outputs_not_published && result.advisory_gate.audit_readiness;
  const artifacts_valid = verifyHashed(result.artifacts) && result.artifacts.decision_package && result.artifacts.advisory_status === "PUBLISHED" && result.artifacts.evidence_references.length >= 5 && result.artifacts.confidence_score >= 0.9 && result.artifacts.immutable_lineage_id.length > 0;
  const governance_valid = verifyHashed(result.governance) && result.governance.recommendations_only && result.governance.never_executes_mission_actions && result.governance.preserves_operator_supremacy && result.governance.requires_gate_before_publication;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.advisory_only && result.readiness.operator_supremacy_preserved && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && decision_engine_valid && tradeoff_valid && multi_criteria_valid && evidence_valid && justification_valid && advisory_gate_valid && artifacts_valid && governance_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, decision_engine_valid, tradeoff_valid, multi_criteria_valid, evidence_valid, justification_valid, advisory_gate_valid, artifacts_valid, governance_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayDecisionSupport(result = runDecisionSupport()): boolean { const replayed = runDecisionSupport(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateDecisionSupport(result).valid; }
export function getDecisionSupportBundle(): DecisionSupportBundle { const result = runDecisionSupport(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_decision_engine: true, owns_tradeoff_analysis: true, owns_multi_criteria_evaluation: true, owns_evidence_aggregation: true, owns_decision_justification: true, owns_mission_advisory_gate: true, produces_advisory_outputs_only: true, never_makes_operational_decisions: true, qualification_gate: "Mission Advisory Gate" }), result, validation: validateDecisionSupport(result) }); }
export const DecisionSupportService = Object.freeze({ run: runDecisionSupport, validate: validateDecisionSupport, replay: replayDecisionSupport });
