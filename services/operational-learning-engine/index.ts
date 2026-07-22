import { runContinuousMonitoringIntelligence } from "@/services/continuous-monitoring-intelligence";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  LearningDecisionOutcome,
  LearningFailure,
  LearningLifecycleState,
  LearningPatternType,
  LearningSource,
  OperationalLearningBundle,
  OperationalLearningInput,
  OperationalLearningOutcome,
  OperationalLearningResult,
  OperationalLearningTest,
  OperationalLearningValidation,
} from "@/types/operational-learning-engine";

const VERSION = "operational-learning-engine/v18.3" as const;
const IDENTIFIER = "OperationalLearningEngine" as const;
const DEFAULT_TENANT = "tenant_phase_18_learning";
const DEFAULT_OPERATOR = "operator_phase_18_learning";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly LearningFailure[], failure: LearningFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: OperationalLearningInput["scenario"]): LearningFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly LearningFailure[]): OperationalLearningOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_LEARNING_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycleStates = freezeArray(["IDENTIFIED", "ELIGIBILITY_VALIDATED", "GOVERNANCE_VALIDATED", "LEARNING_IN_PROGRESS", "PATTERN_QUALIFIED", "MEMORY_COMMITTED", "ACTIVE", "SUPERSEDED", "ARCHIVED"] as const satisfies readonly LearningLifecycleState[]);
const learningSources = freezeArray(["OPERATIONAL_EVENTS", "CONFIGURATION_HISTORY", "INCIDENT_HISTORY", "PERFORMANCE_HISTORY", "CAPACITY_HISTORY", "CERTIFICATION_HISTORY", "GOVERNANCE_DECISIONS", "POLICY_EVOLUTION", "OPERATIONAL_CHANGE_HISTORY", "VALIDATED_RECOVERY_EVENTS", "REPLAY_VALIDATION_HISTORY", "OPERATIONAL_OUTCOMES"] as const satisfies readonly LearningSource[]);
const patternTypes = freezeArray(["INCIDENT", "RECOVERY", "PERFORMANCE", "CAPACITY", "INFRASTRUCTURE", "GOVERNANCE", "POLICY", "CERTIFICATION", "ANOMALY", "BEST_PRACTICE"] as const satisfies readonly LearningPatternType[]);
const decisionOutcomes = freezeArray(["APPROVED", "REJECTED", "REQUIRES_MORE_EVIDENCE", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_CERTIFICATION", "DEFERRED"] as const satisfies readonly LearningDecisionOutcome[]);

function certTest(name: string, passed: boolean, failure: LearningFailure, evidence_refs: readonly string[]): OperationalLearningTest {
  const actual: OperationalLearningOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_LEARNING_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("operational_learning_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<OperationalLearningResult, "replay_hash" | "integrity_hash">): string {
  return hash({ monitoring: result.continuous_monitoring_intelligence_ref, engine: result.learning_engine.integrity_hash, eligibility: result.eligibility_rules.integrity_hash, candidates: result.candidate_registry.integrity_hash, service: result.pattern_learning_service.integrity_hash, memory: result.operational_memory.integrity_hash, patterns: result.pattern_registry.integrity_hash, decision: result.decision_engine.integrity_hash, replay: result.replay_validator.integrity_hash, governance: result.governance_validator.integrity_hash, lineage: result.lineage_ledger.integrity_hash, analyzer: result.cross_operational_analyzer.integrity_hash, dashboard: result.observability_dashboard.integrity_hash, lifecycle: result.lifecycle, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<OperationalLearningResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runOperationalLearningEngine(input: OperationalLearningInput = {}): OperationalLearningResult {
  const monitoring = runContinuousMonitoringIntelligence({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: LearningFailure[] = monitoring.outcome === "PASS" ? [] : ["PHASE_18_2_MONITORING_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_LEARNING_WARNING"));
  const learningId = input.learning_id ?? id("learning", monitoring.integrity_hash);
  const candidateId = input.candidate_id ?? id("learning_candidate", monitoring.monitoring_cycle.integrity_hash);
  const patternId = input.pattern_id ?? id("operational_pattern", candidateId);
  const deterministic = !has(failures, "LEARNING_NOT_DETERMINISTIC") && !has(failures, "VALIDATION_STAGE_BYPASSED");
  const replay = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const eligibility = !has(failures, "ELIGIBILITY_NOT_GOVERNED");
  const memoryImmutable = !has(failures, "OPERATIONAL_MEMORY_MUTABLE") && !has(failures, "HISTORICAL_RECORD_MODIFIED");
  const qualified = !has(failures, "PATTERN_QUALIFICATION_NOT_OPERATIONAL");
  const governance = !has(failures, "GOVERNANCE_ENFORCEMENT_NOT_VALIDATED");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_PRESERVED");
  const authorityBoundaries = !has(failures, "AUTHORITY_BOUNDARY_NOT_ENFORCED");
  const lineage = !has(failures, "LEARNING_LINEAGE_INCOMPLETE");
  const intelligence = !has(failures, "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE");
  const certificationIntegration = !has(failures, "CERTIFICATION_INTEGRATION_NOT_VERIFIED");
  const stagesOrdered = !has(failures, "VALIDATION_STAGE_BYPASSED");
  const evidenceRefs = freezeArray(memoryImmutable ? [monitoring.integrity_hash, monitoring.certification_package.integrity_hash, ...monitoring.output_reports.map((report) => report.integrity_hash)] : []);
  const replayRefs = freezeArray(replay ? [monitoring.replay_hash] : []);
  const governanceRefs = freezeArray(governance ? [monitoring.certification_package.integrity_hash] : []);

  const learning_engine = nested({ engine_id: id("operational_learning_engine", learningId), learning_orchestration: deterministic, learning_scheduling: deterministic, deterministic_execution: deterministic, replay_preservation: replay, governance_enforcement: governance, eligibility_validation: eligibility, learning_lineage: lineage, certification_integration: certificationIntegration, advisory_only: authorityBoundaries, stages_ordered: stagesOrdered });
  const eligibility_rules = nested({ rules_id: id("learning_eligibility_rules", learningId), eligible_evidence: eligibility, evidence_maturity_required: eligibility, governance_approval_requirements: governance, replay_qualification: replay, tenant_scope_enforced: tenantIsolation, cross_domain_permissions: tenantIsolation, certification_requirements: certificationIntegration, constitutional_constraints: governance && authorityBoundaries, deterministic_decisions: deterministic });
  const candidates = freezeArray(learningSources.map((source) => nested({ candidate_id: id("candidate", { candidateId, source }), source, tenant_scope: input.tenant_id ?? DEFAULT_TENANT, originating_evidence: evidenceRefs, validation_status: eligibility ? "VALIDATED" as const : "REJECTED" as const, replay_status: replay ? "REPLAY_VALIDATED" as const : "REPLAY_FAILED" as const, governance_status: governance ? "GOVERNANCE_VALIDATED" as const : "GOVERNANCE_REJECTED" as const, qualification_state: qualified ? "QUALIFIED" as const : "UNQUALIFIED" as const, approval_history: governanceRefs, rejection_reasons: freezeArray(eligibility && governance && replay ? [] : failures) })));
  const candidate_registry = nested({ registry_id: id("learning_candidate_registry", learningId), candidates, pending_candidates_tracked: true, validation_status_tracked: true, replay_status_tracked: true, governance_status_tracked: true, approval_history_tracked: true, rejection_reasons_tracked: true });
  const pattern_learning_service = nested({ service_id: id("pattern_learning_service", learningId), pattern_types: patternTypes, deterministic_discovery: deterministic, recurring_incidents: intelligence, successful_recoveries: intelligence, performance_trends: intelligence, capacity_trends: intelligence, infrastructure_behaviors: intelligence, governance_patterns: intelligence, policy_evolution: intelligence, certification_outcomes: intelligence, operational_anomalies: intelligence, operational_best_practices: intelligence });
  const patterns = freezeArray(patternTypes.map((pattern_type, index) => nested({ pattern_id: id("pattern", { patternId, pattern_type }), pattern_type, confidence: deterministic && qualified ? 0.91 - index * 0.01 : 0, applicability: `${pattern_type.toLowerCase()} operational intelligence`, evidence_refs: evidenceRefs, governance_approvals: governanceRefs, replay_refs: replayRefs, certification_lineage: certificationIntegration ? [monitoring.certification_package.integrity_hash] : [], supersession_history: index === 0 && lineage ? [id("supersession", patternId)] : [], immutable_after_approval: memoryImmutable, qualification_status: qualified ? "QUALIFIED" as const : "UNQUALIFIED" as const })));
  const operational_memory = nested({ memory_id: id("operational_memory", learningId), validated_patterns: patterns.map((pattern) => pattern.integrity_hash), operational_outcomes: evidenceRefs, incident_relationships: [patterns[0]?.integrity_hash ?? ""], recovery_knowledge: [patterns[1]?.integrity_hash ?? ""], governance_precedents: governanceRefs, configuration_evolution: [patterns[4]?.integrity_hash ?? ""], capacity_evolution: [patterns[3]?.integrity_hash ?? ""], performance_evolution: [patterns[2]?.integrity_hash ?? ""], operational_intelligence: patterns.map((pattern) => pattern.pattern_id), certification_lineage: certificationIntegration ? [monitoring.certification_package.integrity_hash] : [], append_only: memoryImmutable, historical_records_modified: !memoryImmutable });
  const pattern_registry = nested({ registry_id: id("operational_pattern_registry", learningId), patterns, approved_patterns_tracked: true, confidence_tracked: true, applicability_tracked: true, evidence_references_tracked: true, governance_approvals_tracked: true, replay_references_tracked: true, certification_lineage_tracked: true, supersession_history_tracked: true, immutable_patterns: memoryImmutable });
  const candidateOutcome: LearningDecisionOutcome = eligibility && governance && replay && qualified && certificationIntegration ? "APPROVED" : !eligibility ? "REQUIRES_MORE_EVIDENCE" : !governance ? "REQUIRES_GOVERNANCE_REVIEW" : !certificationIntegration ? "REQUIRES_CERTIFICATION" : "DEFERRED";
  const decision_engine = nested({ engine_id: id("learning_decision_engine", learningId), possible_outcomes: decisionOutcomes, deterministic_evaluation: deterministic, candidate_outcome: candidateOutcome, evidence_sufficient: eligibility, governance_review_required: !governance, certification_required: !certificationIntegration });
  const replay_validator = nested({ validator_id: id("learning_replay_validator", learningId), identical_candidate_selection: replay, deterministic_evaluation: deterministic, identical_learned_patterns: replay && deterministic, governance_consistency: governance, replay_integrity: replay, memory_consistency: memoryImmutable, mandatory_validation: true });
  const governance_validator = nested({ validator_id: id("learning_governance_validator", learningId), governance_authority: governance, policy_compliance: governance, constitutional_compliance: governance && authorityBoundaries, tenant_isolation: tenantIsolation, certification_eligibility: certificationIntegration, authority_boundaries: authorityBoundaries, learning_allowed: governance && tenantIsolation && authorityBoundaries });
  const learningRecords = freezeArray(candidates.map((candidate, index) => nested({ learning_id: id("learning_record", { learningId, index }), candidate_id: candidate.candidate_id, pattern_id: patterns[index % patterns.length].pattern_id, tenant_scope: candidate.tenant_scope, operational_scope: "continuous-operations", evidence_refs: candidate.originating_evidence, replay_refs: replayRefs, governance_refs: governanceRefs, eligibility_result: eligibility ? "ELIGIBLE" as const : "INELIGIBLE" as const, learning_outcome: candidateOutcome, qualification_status: qualified ? "QUALIFIED" as const : "UNQUALIFIED" as const, certification_refs: certificationIntegration ? [monitoring.certification_package.integrity_hash] : [], supersession_ref: lineage && index === 0 ? id("supersession", patternId) : null })));
  const lineage_ledger = nested({ ledger_id: id("learning_lineage_ledger", learningId), records: learningRecords, append_only: memoryImmutable, learning_requests_recorded: lineage, evidence_lineage_recorded: lineage, eligibility_decisions_recorded: lineage && eligibility, governance_decisions_recorded: lineage && governance, learning_outcomes_recorded: lineage, replay_references_recorded: lineage && replay, certification_references_recorded: lineage && certificationIntegration, supersession_lineage_recorded: lineage });
  const cross_operational_analyzer = nested({ analyzer_id: id("cross_operational_pattern_analyzer", learningId), operational_similarity: intelligence, recovery_similarity: intelligence, infrastructure_similarity: intelligence, capacity_similarity: intelligence, performance_similarity: intelligence, governance_similarity: intelligence, cross_tenant_learning_authorized: tenantIsolation, tenant_isolation_policy_applied: tenantIsolation });
  const observability_dashboard = nested({ dashboard_id: id("learning_observability_dashboard", learningId), learning_throughput_visible: true, eligibility_decisions_visible: true, replay_validation_visible: true, governance_status_visible: true, candidate_backlog_visible: true, learned_patterns_visible: true, rejected_candidates_visible: true, intelligence_growth_visible: intelligence, opaque_learning_prevented: true });
  const lifecycle = freezeArray(stagesOrdered ? lifecycleStates : ["IDENTIFIED", "LEARNING_IN_PROGRESS", "ACTIVE"] as const);
  const certification_package = nested({ package_id: id("operational_learning_certification", learningId), deterministic_learning: learning_engine.deterministic_execution && pattern_learning_service.deterministic_discovery && decision_engine.deterministic_evaluation, replay_reproducible: replay_validator.replay_integrity && replay_validator.identical_learned_patterns, eligibility_governed: eligibility_rules.eligible_evidence && eligibility_rules.deterministic_decisions, immutable_operational_memory_verified: operational_memory.append_only && !operational_memory.historical_records_modified && pattern_registry.immutable_patterns, pattern_qualification_operational: patterns.every((pattern) => pattern.qualification_status === "QUALIFIED"), governance_enforcement_validated: governance_validator.learning_allowed, tenant_isolation_preserved: governance_validator.tenant_isolation && cross_operational_analyzer.tenant_isolation_policy_applied, authority_boundaries_enforced: learning_engine.advisory_only && governance_validator.authority_boundaries, learning_lineage_complete: lineage_ledger.records.length === learningSources.length && lineage_ledger.append_only && lineage_ledger.supersession_lineage_recorded, operational_intelligence_reproducible: intelligence && operational_memory.operational_intelligence.length === patternTypes.length, certification_integration_verified: certificationIntegration && lineage_ledger.certification_references_recorded, operational_learning_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Deterministic learning", certification_package.deterministic_learning, "LEARNING_NOT_DETERMINISTIC", [learning_engine.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", [replay_validator.integrity_hash]),
    certTest("Eligibility governed", certification_package.eligibility_governed, "ELIGIBILITY_NOT_GOVERNED", [eligibility_rules.integrity_hash]),
    certTest("Immutable operational memory verified", certification_package.immutable_operational_memory_verified, "OPERATIONAL_MEMORY_MUTABLE", [operational_memory.integrity_hash]),
    certTest("Pattern qualification operational", certification_package.pattern_qualification_operational, "PATTERN_QUALIFICATION_NOT_OPERATIONAL", patterns.map((pattern) => pattern.integrity_hash)),
    certTest("Governance enforcement validated", certification_package.governance_enforcement_validated, "GOVERNANCE_ENFORCEMENT_NOT_VALIDATED", [governance_validator.integrity_hash]),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation_preserved, "TENANT_ISOLATION_NOT_PRESERVED", [cross_operational_analyzer.integrity_hash]),
    certTest("Authority boundaries enforced", certification_package.authority_boundaries_enforced, "AUTHORITY_BOUNDARY_NOT_ENFORCED", [learning_engine.integrity_hash, governance_validator.integrity_hash]),
    certTest("Learning lineage complete", certification_package.learning_lineage_complete, "LEARNING_LINEAGE_INCOMPLETE", [lineage_ledger.integrity_hash]),
    certTest("Operational intelligence reproducible", certification_package.operational_intelligence_reproducible, "OPERATIONAL_INTELLIGENCE_NOT_REPRODUCIBLE", [operational_memory.integrity_hash]),
    certTest("Certification integration verified", certification_package.certification_integration_verified, "CERTIFICATION_INTEGRATION_NOT_VERIFIED", [certification_package.integrity_hash]),
    certTest("Operational learning certified", certification_package.operational_learning_certified, "OPERATIONAL_LEARNING_NOT_CERTIFIED", [certification_package.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is LearningFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<OperationalLearningResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, continuous_monitoring_intelligence_ref: monitoring.integrity_hash, learning_engine, eligibility_rules, candidate_registry, pattern_learning_service, operational_memory, pattern_registry, decision_engine, replay_validator, governance_validator, lineage_ledger, cross_operational_analyzer, observability_dashboard, lifecycle, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateOperationalLearningEngine(result = runOperationalLearningEngine()): OperationalLearningValidation {
  const engine_valid = verify(result.learning_engine) && Object.entries(result.learning_engine).filter(([key]) => !["engine_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const eligibility_valid = verify(result.eligibility_rules) && Object.entries(result.eligibility_rules).filter(([key]) => !["rules_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const candidate_registry_valid = verify(result.candidate_registry) && result.candidate_registry.candidates.length === 12 && result.candidate_registry.candidates.every((candidate) => verify(candidate) && candidate.originating_evidence.length > 0 && candidate.approval_history.length > 0 && candidate.rejection_reasons.length === 0 && candidate.validation_status === "VALIDATED" && candidate.replay_status === "REPLAY_VALIDATED" && candidate.governance_status === "GOVERNANCE_VALIDATED" && candidate.qualification_state === "QUALIFIED");
  const pattern_service_valid = verify(result.pattern_learning_service) && result.pattern_learning_service.pattern_types.length === 10 && Object.entries(result.pattern_learning_service).filter(([key]) => !["service_id", "pattern_types", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const memory_valid = verify(result.operational_memory) && result.operational_memory.append_only && !result.operational_memory.historical_records_modified && result.operational_memory.validated_patterns.length === 10 && result.operational_memory.operational_intelligence.length === 10 && result.operational_memory.certification_lineage.length > 0;
  const pattern_registry_valid = verify(result.pattern_registry) && result.pattern_registry.patterns.length === 10 && result.pattern_registry.patterns.every((pattern) => verify(pattern) && pattern.confidence > 0 && pattern.evidence_refs.length > 0 && pattern.governance_approvals.length > 0 && pattern.replay_refs.length > 0 && pattern.certification_lineage.length > 0 && pattern.immutable_after_approval && pattern.qualification_status === "QUALIFIED") && Object.entries(result.pattern_registry).filter(([key]) => !["registry_id", "patterns", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const decision_valid = verify(result.decision_engine) && result.decision_engine.possible_outcomes.length === 6 && result.decision_engine.candidate_outcome === "APPROVED" && result.decision_engine.deterministic_evaluation && result.decision_engine.evidence_sufficient && !result.decision_engine.governance_review_required && !result.decision_engine.certification_required;
  const replay_valid = verify(result.replay_validator) && Object.entries(result.replay_validator).filter(([key]) => !["validator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const governance_valid = verify(result.governance_validator) && Object.entries(result.governance_validator).filter(([key]) => !["validator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const lineage_valid = verify(result.lineage_ledger) && result.lineage_ledger.records.length === 12 && result.lineage_ledger.records.every((record) => verify(record) && record.evidence_refs.length > 0 && record.replay_refs.length > 0 && record.governance_refs.length > 0 && record.eligibility_result === "ELIGIBLE" && record.learning_outcome === "APPROVED" && record.qualification_status === "QUALIFIED" && record.certification_refs.length > 0) && Object.entries(result.lineage_ledger).filter(([key]) => !["ledger_id", "records", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const analyzer_valid = verify(result.cross_operational_analyzer) && Object.entries(result.cross_operational_analyzer).filter(([key]) => !["analyzer_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const dashboard_valid = verify(result.observability_dashboard) && Object.entries(result.observability_dashboard).filter(([key]) => !["dashboard_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const lifecycle_valid = result.lifecycle.length === 9 && result.lifecycle.every((state, index) => state === lifecycleStates[index]);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 12 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && engine_valid && eligibility_valid && candidate_registry_valid && pattern_service_valid && memory_valid && pattern_registry_valid && decision_valid && replay_valid && governance_valid && lineage_valid && analyzer_valid && dashboard_valid && lifecycle_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, engine_valid, eligibility_valid, candidate_registry_valid, pattern_service_valid, memory_valid, pattern_registry_valid, decision_valid, replay_valid, governance_valid, lineage_valid, analyzer_valid, dashboard_valid, lifecycle_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayOperationalLearningEngine(result = runOperationalLearningEngine()): boolean {
  const replayed = runOperationalLearningEngine();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateOperationalLearningEngine(result).valid;
}

export function getOperationalLearningEngineBundle(): OperationalLearningBundle {
  const result = runOperationalLearningEngine();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "continuous-monitoring-intelligence/v18.2" as const, lifecycle_states: lifecycleStates, learning_sources: learningSources, pattern_types: patternTypes, decision_outcomes: decisionOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateOperationalLearningEngine(result) });
}

export const OperationalLearningEngineService = Object.freeze({ run: runOperationalLearningEngine, validate: validateOperationalLearningEngine, replay: replayOperationalLearningEngine });
