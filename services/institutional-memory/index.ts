import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runDecisionSupport, validateDecisionSupport } from "@/services/decision-support";
import { runDigitalTwin, validateDigitalTwin } from "@/services/digital-twin";
import { runMemoryEngine, validateMemoryEngine } from "@/services/memory-engine";
import { runMissionManagement, validateMissionManagement } from "@/services/mission-management";
import { runMissionRecommendationIntelligence, validateMissionRecommendationIntelligence } from "@/services/mission-recommendation-intelligence";
import { runOperationalEvidenceReplay, validateOperationalEvidenceReplay } from "@/services/operational-evidence-replay";
import { runOperatorDashboard, validateOperatorDashboard } from "@/services/operator-dashboard";
import { runPlanningEngine, validatePlanningEngine } from "@/services/planning-engine";
import { runPortfolioManagement, validatePortfolioManagement } from "@/services/portfolio-management";
import { runRiskAssessment, validateRiskAssessment } from "@/services/risk-assessment";
import { runScenarioPlanning, validateScenarioPlanning } from "@/services/scenario-planning";
import { runSimulation, validateSimulation } from "@/services/simulation";
import type { InstitutionalMemoryBundle, InstitutionalMemoryDecision, InstitutionalMemoryFailure, InstitutionalMemoryInput, InstitutionalMemoryResult, InstitutionalMemoryScenario, InstitutionalMemoryValidation, KnowledgeRelationshipKind, LearnedPatternCategory } from "@/types/institutional-memory";

const VERSION = "institutional-memory/mc-11" as const;
const IDENTIFIER = "InstitutionalMemory" as const;
const RELATIONSHIPS = Object.freeze<KnowledgeRelationshipKind[]>(["MISSION", "DECISION", "EVIDENCE", "RISK", "RECOMMENDATION", "OUTCOME", "LESSON", "PATTERN", "KNOWLEDGE_ASSET"]);
const CATEGORIES = Object.freeze<LearnedPatternCategory[]>(["OPERATIONAL", "DECISION", "RISK", "RECOVERY", "ESCALATION", "MISSION", "RESOURCE", "GOVERNANCE", "SIMULATION", "ORGANIZATIONAL"]);
const UPSTREAM_REFS = Object.freeze(["mission-management/mc-1", "scenario-planning/mc-2", "decision-support/mc-3", "portfolio-management/mc-4", "operational-evidence-replay/mc-5", "digital-twin/mc-6", "simulation/mc-7", "risk-assessment/mc-8", "mission-recommendation-intelligence/mc-9", "operator-dashboard/mc-10", "memory-engine/w2.9", "planning-engine/w2.8", "cci-evidence", "cci-replay", "cci-immutable-event-history", "caf-memory-engine", "caf-planning-engine"]);
let baselines: ReturnType<typeof makeBaselines> | undefined;

function makeBaselines() { return { mission: runMissionManagement(), scenario: runScenarioPlanning(), decision: runDecisionSupport(), portfolio: runPortfolioManagement(), replay: runOperationalEvidenceReplay(), twin: runDigitalTwin(), simulation: runSimulation(), risk: runRiskAssessment(), recommendations: runMissionRecommendationIntelligence(), dashboard: runOperatorDashboard(), memory: runMemoryEngine(), planning: runPlanningEngine() }; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verifyHashed(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function has(failures: readonly InstitutionalMemoryFailure[], failure: InstitutionalMemoryFailure): boolean { return failures.includes(failure); }
function scenarioFailure(scenario: InstitutionalMemoryScenario): InstitutionalMemoryFailure | undefined { return scenario === "QUALIFIED_WITH_OBSERVATIONS" || scenario === "CONDITIONAL_FOLLOWUP" ? undefined : scenario; }
function decisionFor(failures: readonly InstitutionalMemoryFailure[], scenario?: InstitutionalMemoryScenario): InstitutionalMemoryDecision {
  const conditional = new Set<InstitutionalMemoryFailure>(["KNOWLEDGE_CAPTURE_MISSING", "LESSON_CAPTURE_MISSING", "KNOWLEDGE_VALIDATION_MISSING", "KNOWLEDGE_APPROVAL_MISSING", "KNOWLEDGE_CLASSIFICATION_MISSING", "KNOWLEDGE_PUBLICATION_MISSING", "KNOWLEDGE_RETIREMENT_MISSING", "MEMORY_REPOSITORY_MISSING", "KNOWLEDGE_GRAPH_MISSING", "PATTERN_CATALOG_MISSING", "KNOWLEDGE_LINEAGE_MISSING", "KNOWLEDGE_VALIDATION_ENGINE_MISSING", "EVIDENCE_VERIFICATION_MISSING", "DUPLICATE_DETECTION_MISSING", "CONFLICT_ANALYSIS_MISSING", "CONFIDENCE_EVALUATION_MISSING", "GOVERNANCE_APPROVAL_MISSING", "AUTHORITY_VERIFICATION_MISSING", "LEARNING_ENGINE_MISSING", "KNOWLEDGE_SEARCH_MISSING", "KNOWLEDGE_GOVERNANCE_MISSING", "LIFECYCLE_APPROVAL_MISSING", "VERSIONING_MISSING", "ACCESS_CONTROL_MISSING", "KNOWLEDGE_REPORTS_MISSING", "KNOWLEDGE_EVIDENCE_MISSING", "INSTITUTIONAL_MEMORY_APIS_MISSING", "INSTITUTIONAL_MEMORY_QUALIFICATION_FAILED"]);
  if (failures.some((failure) => !conditional.has(failure))) return "FAIL_CLOSED";
  if (has(failures, "INSTITUTIONAL_MEMORY_QUALIFICATION_FAILED")) return "NOT_QUALIFIED";
  if (failures.length || scenario === "CONDITIONAL_FOLLOWUP" || scenario === "QUALIFIED_WITH_OBSERVATIONS") return "CONDITIONALLY_QUALIFIED";
  return "INSTITUTIONAL_MEMORY_QUALIFIED";
}
function resultReplayHash(result: Omit<InstitutionalMemoryResult, "replay_hash" | "integrity_hash">): string { return hash({ capture: result.capture.integrity_hash, repository: result.repository.integrity_hash, graph: result.graph.integrity_hash, patterns: result.patterns.integrity_hash, lineage: result.lineage.integrity_hash, validation: result.validation.integrity_hash, learning: result.learning.integrity_hash, search: result.search.integrity_hash, governance: result.governance.integrity_hash, reports: result.reports.integrity_hash, evidence: result.evidence.integrity_hash, apis: result.apis.integrity_hash, readiness: result.readiness.integrity_hash }); }
function resultIntegrityHash(result: Omit<InstitutionalMemoryResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, decision: result.readiness.decision, replay_hash: result.replay_hash }); }

export function runInstitutionalMemory(input: InstitutionalMemoryInput = {}): InstitutionalMemoryResult {
  const direct = input.scenario ? scenarioFailure(input.scenario) : undefined;
  const scenarioFailures = freezeArray<InstitutionalMemoryFailure>(direct ? [direct] : []);
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
    ["MC_9_RECOMMENDATION_INTELLIGENCE_INVALID", !validateMissionRecommendationIntelligence(baselines.recommendations).valid],
    ["MC_10_OPERATOR_DASHBOARD_INVALID", !validateOperatorDashboard(baselines.dashboard).valid],
    ["CAF_MEMORY_ENGINE_INVALID", !validateMemoryEngine(baselines.memory).valid],
    ["CAF_PLANNING_ENGINE_INVALID", !validatePlanningEngine(baselines.planning).valid],
  ] as const;
  const failures = freezeArray([...new Set([...scenarioFailures, ...upstream.filter(([, invalid]) => invalid).map(([failure]) => failure)])]);
  const captureOk = !has(failures, "KNOWLEDGE_CAPTURE_MISSING") && !has(failures, "LESSON_CAPTURE_MISSING") && !has(failures, "KNOWLEDGE_VALIDATION_MISSING") && !has(failures, "KNOWLEDGE_APPROVAL_MISSING") && !has(failures, "KNOWLEDGE_CLASSIFICATION_MISSING") && !has(failures, "KNOWLEDGE_PUBLICATION_MISSING") && !has(failures, "KNOWLEDGE_RETIREMENT_MISSING") && !has(failures, "AUTONOMOUS_LEARNING_ATTEMPTED");
  const repositoryOk = !has(failures, "MEMORY_REPOSITORY_MISSING") && !has(failures, "REPOSITORY_NOT_AUTHORITATIVE");
  const graphOk = !has(failures, "KNOWLEDGE_GRAPH_MISSING") && !has(failures, "GRAPH_NODE_EVIDENCE_MISSING");
  const patternsOk = !has(failures, "PATTERN_CATALOG_MISSING") && !has(failures, "PATTERNS_NOT_EVIDENCE_BACKED");
  const lineageOk = !has(failures, "KNOWLEDGE_LINEAGE_MISSING") && !has(failures, "LINEAGE_NOT_REPRODUCIBLE") && !has(failures, "TRACEABILITY_INCOMPLETE");
  const validationOk = !has(failures, "KNOWLEDGE_VALIDATION_ENGINE_MISSING") && !has(failures, "EVIDENCE_VERIFICATION_MISSING") && !has(failures, "DUPLICATE_DETECTION_MISSING") && !has(failures, "CONFLICT_ANALYSIS_MISSING") && !has(failures, "CONFIDENCE_EVALUATION_MISSING") && !has(failures, "GOVERNANCE_APPROVAL_MISSING") && !has(failures, "AUTHORITY_VERIFICATION_MISSING") && !has(failures, "GOVERNANCE_BYPASSED");
  const learningOk = !has(failures, "LEARNING_ENGINE_MISSING") && !has(failures, "LEARNING_OUTPUTS_NOT_ADVISORY") && !has(failures, "OPERATIONAL_DECISION_CREATED") && !has(failures, "EXECUTION_INITIATED");
  const searchOk = !has(failures, "KNOWLEDGE_SEARCH_MISSING") && !has(failures, "SEARCH_NON_DETERMINISTIC");
  const governanceOk = !has(failures, "KNOWLEDGE_GOVERNANCE_MISSING") && !has(failures, "LIFECYCLE_APPROVAL_MISSING") && !has(failures, "VERSIONING_MISSING") && !has(failures, "ACCESS_CONTROL_MISSING") && !has(failures, "GOVERNANCE_BYPASSED");
  const reportsOk = !has(failures, "KNOWLEDGE_REPORTS_MISSING");
  const evidenceOk = !has(failures, "KNOWLEDGE_EVIDENCE_MISSING") && !has(failures, "KNOWLEDGE_WITHOUT_EVIDENCE_PUBLISHED") && !has(failures, "KNOWLEDGE_EVIDENCE_MUTATED") && !has(failures, "HISTORICAL_EVIDENCE_MUTATED") && !has(failures, "TRACEABILITY_INCOMPLETE");
  const apisOk = !has(failures, "INSTITUTIONAL_MEMORY_APIS_MISSING");
  const decision = decisionFor(failures, input.scenario);
  const qualified = decision === "INSTITUTIONAL_MEMORY_QUALIFIED";
  const tenant_id = input.tenant_id ?? baselines.mission.tenant_id;
  const knowledge_id = input.knowledge_id ?? `knowledge:mc-11:${input.seed ?? "canonical"}`;
  const capture = nested({ capture_id: captureOk ? "capture:mc-11:organizational-knowledge" : "", lesson_capture: captureOk, knowledge_validation: captureOk, knowledge_approval: captureOk, knowledge_classification: captureOk, knowledge_publication: captureOk, knowledge_retirement: captureOk, validated_operational_learning: captureOk });
  const repository = nested({ repository_id: repositoryOk ? "repository:mc-11:institutional-memory" : "", lessons_learned: repositoryOk, operational_practices: repositoryOk, mission_outcomes: repositoryOk, decision_outcomes: repositoryOk, failure_analysis: repositoryOk, recovery_procedures: repositoryOk, governance_decisions: repositoryOk, operational_policies: repositoryOk, organizational_experience: repositoryOk, authoritative_repository: repositoryOk });
  const graph = nested({ graph_id: graphOk ? "graph:mc-11:knowledge" : "", relationships: graphOk ? freezeArray(RELATIONSHIPS) : freezeArray<KnowledgeRelationshipKind>([]), mission_to_knowledge_asset_path: graphOk, evidence_backed_nodes: graphOk, governed_relationships: graphOk, enterprise_relationships: graphOk });
  const patterns = nested({ catalog_id: patternsOk ? "catalog:mc-11:learned-patterns" : "", categories: patternsOk ? freezeArray(CATEGORIES) : freezeArray<LearnedPatternCategory>([]), recurring_behaviors: patternsOk, reusable_patterns: patternsOk, evidence_backed_patterns: patternsOk, pattern_analysis_reports: patternsOk });
  const lineage = nested({ lineage_id: lineageOk ? "lineage:mc-11:knowledge" : "", source_mission: lineageOk, evidence_references: lineageOk, replay_references: lineageOk, decision_package_references: lineageOk, simulation_references: lineageOk, validation_history: lineageOk, approval_history: lineageOk, retirement_history: lineageOk, reproducible_from_cci_event_history: lineageOk });
  const validation = nested({ validation_id: validationOk ? "validation:mc-11:knowledge" : "", evidence_verification: validationOk, duplicate_detection: validationOk, conflict_analysis: validationOk, confidence_evaluation: validationOk, governance_approval: validationOk, constitution_compliance: validationOk, authority_verification: validationOk, prevents_unsupported_entries: validationOk });
  const learning = nested({ learning_id: learningOk ? "learning:mc-11:organizational" : "", best_practices: learningOk, operational_guidelines: learningOk, failure_prevention_guidance: learningOk, recovery_guidance: learningOk, mission_templates: learningOk, operational_checklists: learningOk, risk_mitigation_practices: learningOk, decision_heuristics: learningOk, advisory_only: learningOk });
  const search = nested({ search_id: searchOk ? "search:mc-11:knowledge" : "", semantic_search: searchOk, evidence_search: searchOk, mission_search: searchOk, pattern_search: searchOk, relationship_navigation: searchOk, timeline_search: searchOk, similarity_search: searchOk, governance_search: searchOk, deterministic_retrieval: searchOk });
  const governance = nested({ governance_id: governanceOk ? "governance:mc-11:knowledge" : "", versioning: governanceOk, approval: governanceOk, publication: governanceOk, deprecation: governanceOk, retirement: governanceOk, supersession: governanceOk, audit: governanceOk, access_control: governanceOk, governed_lifecycle: governanceOk });
  const reports = nested({ report_id: reportsOk ? "report:mc-11:knowledge" : "", organizational_learning_reports: reportsOk, best_practice_catalog: reportsOk, validation_reports: reportsOk, pattern_analysis_reports: reportsOk, audit_reports: reportsOk, reproducible_reports: reportsOk });
  const evidence = nested({ evidence_id: evidenceOk ? "evidence:mc-11:knowledge" : "", knowledge_identifier: evidenceOk && Boolean(knowledge_id), source_mission: evidenceOk, evidence_references: evidenceOk, replay_references: evidenceOk, decision_references: evidenceOk, validation_evidence: evidenceOk, approval_evidence: evidenceOk, version_history: evidenceOk, confidence_assessment: evidenceOk, constitutional_compliance_status: evidenceOk, lineage_references: evidenceOk, immutable: evidenceOk });
  const apis = nested({ api_id: apisOk ? "api:mc-11:institutional-memory" : "", capture_api: apisOk, repository_api: apisOk, graph_api: apisOk, pattern_api: apisOk, lineage_api: apisOk, validation_api: apisOk, learning_api: apisOk, search_api: apisOk, governance_api: apisOk, evidence_api: apisOk, stable: apisOk });
  const readiness = nested({ readiness_id: "MC-11-INSTITUTIONAL-MEMORY-READINESS-001", decision, phase_ready: qualified, upstream_ready: failures.every((failure) => !failure.startsWith("MC_") && !failure.startsWith("CAF_")), capture_ready: captureOk, repository_ready: repositoryOk, graph_ready: graphOk, patterns_ready: patternsOk, lineage_ready: lineageOk, validation_ready: validationOk, learning_ready: learningOk, search_ready: searchOk, governance_ready: governanceOk, reports_ready: reportsOk, evidence_ready: evidenceOk, apis_ready: apisOk, advisory_only: learningOk, no_operational_decisions: !has(failures, "OPERATIONAL_DECISION_CREATED"), no_execution: !has(failures, "EXECUTION_INITIATED"), immutable_history_preserved: !has(failures, "HISTORICAL_EVIDENCE_MUTATED"), evidence_first: evidenceOk, governance_enforced: governanceOk && validationOk, deterministic_provenance: lineageOk && searchOk, no_autonomous_learning: !has(failures, "AUTONOMOUS_LEARNING_ATTEMPTED"), qualification_ready: qualified, failures });
  const base: Omit<InstitutionalMemoryResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, upstream_refs: freezeArray(UPSTREAM_REFS), tenant_id, knowledge_id, capture, repository, graph, patterns, lineage, validation, learning, search, governance, reports, evidence, apis, readiness };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateInstitutionalMemory(result?: InstitutionalMemoryResult): InstitutionalMemoryValidation {
  if (!result) return nested({ valid: false, decision: "NOT_QUALIFIED" as const, replay_hash_valid: false, integrity_hash_valid: false, capture_valid: false, repository_valid: false, graph_valid: false, patterns_valid: false, lineage_valid: false, validation_valid: false, learning_valid: false, search_valid: false, governance_valid: false, reports_valid: false, evidence_valid: false, apis_valid: false, readiness_valid: false, failures: freezeArray(["KNOWLEDGE_CAPTURE_MISSING" as const]) });
  const replay_hash_valid = resultReplayHash(result) === result.replay_hash;
  const integrity_hash_valid = resultIntegrityHash(result) === result.integrity_hash;
  const capture_valid = verifyHashed(result.capture) && result.capture.lesson_capture && result.capture.knowledge_approval && result.capture.validated_operational_learning;
  const repository_valid = verifyHashed(result.repository) && result.repository.lessons_learned && result.repository.governance_decisions && result.repository.authoritative_repository;
  const graph_valid = verifyHashed(result.graph) && result.graph.relationships.length === 9 && result.graph.mission_to_knowledge_asset_path && result.graph.evidence_backed_nodes;
  const patterns_valid = verifyHashed(result.patterns) && result.patterns.categories.length === 10 && result.patterns.reusable_patterns && result.patterns.evidence_backed_patterns;
  const lineage_valid = verifyHashed(result.lineage) && result.lineage.evidence_references && result.lineage.replay_references && result.lineage.approval_history && result.lineage.reproducible_from_cci_event_history;
  const validation_valid = verifyHashed(result.validation) && result.validation.evidence_verification && result.validation.conflict_analysis && result.validation.governance_approval && result.validation.prevents_unsupported_entries;
  const learning_valid = verifyHashed(result.learning) && result.learning.best_practices && result.learning.risk_mitigation_practices && result.learning.decision_heuristics && result.learning.advisory_only;
  const search_valid = verifyHashed(result.search) && result.search.semantic_search && result.search.relationship_navigation && result.search.deterministic_retrieval;
  const governance_valid = verifyHashed(result.governance) && result.governance.versioning && result.governance.approval && result.governance.access_control && result.governance.governed_lifecycle;
  const reports_valid = verifyHashed(result.reports) && result.reports.organizational_learning_reports && result.reports.best_practice_catalog && result.reports.reproducible_reports;
  const evidence_valid = verifyHashed(result.evidence) && result.evidence.knowledge_identifier && result.evidence.evidence_references && result.evidence.approval_evidence && result.evidence.immutable;
  const apis_valid = verifyHashed(result.apis) && result.apis.capture_api && result.apis.repository_api && result.apis.search_api && result.apis.evidence_api && result.apis.stable;
  const readiness_valid = verifyHashed(result.readiness) && result.readiness.phase_ready && result.readiness.upstream_ready && result.readiness.advisory_only && result.readiness.no_operational_decisions && result.readiness.no_execution && result.readiness.immutable_history_preserved && result.readiness.evidence_first && result.readiness.governance_enforced && result.readiness.deterministic_provenance && result.readiness.no_autonomous_learning && result.readiness.failures.length === 0;
  const valid = replay_hash_valid && integrity_hash_valid && capture_valid && repository_valid && graph_valid && patterns_valid && lineage_valid && validation_valid && learning_valid && search_valid && governance_valid && reports_valid && evidence_valid && apis_valid && readiness_valid;
  return nested({ valid, decision: result.readiness.decision, replay_hash_valid, integrity_hash_valid, capture_valid, repository_valid, graph_valid, patterns_valid, lineage_valid, validation_valid, learning_valid, search_valid, governance_valid, reports_valid, evidence_valid, apis_valid, readiness_valid, failures: result.readiness.failures });
}
export function replayInstitutionalMemory(result = runInstitutionalMemory()): boolean { const replayed = runInstitutionalMemory(); return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateInstitutionalMemory(result).valid; }
export function getInstitutionalMemoryBundle(): InstitutionalMemoryBundle { const result = runInstitutionalMemory(); return Object.freeze({ doctrine: Object.freeze({ version: VERSION, owns_organizational_knowledge_capture: true, owns_institutional_memory_repository: true, owns_knowledge_graph_and_pattern_catalog: true, owns_knowledge_lineage_validation_search_governance: true, transforms_evidence_into_durable_knowledge: true, advisory_only: true, immutable_history_required: true, no_autonomous_learning: true, qualification_gate: "Institutional Memory Qualification Gate" }), result, validation: validateInstitutionalMemory(result) }); }
export const InstitutionalMemoryService = Object.freeze({ run: runInstitutionalMemory, validate: validateInstitutionalMemory, replay: replayInstitutionalMemory });
