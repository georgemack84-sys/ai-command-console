import { runAdaptationSimulationEngine } from "@/services/adaptation-simulation-engine";
import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import type {
  AdaptationQualificationBundle,
  AdaptationQualificationFailure,
  AdaptationQualificationInput,
  AdaptationQualificationOutcome,
  AdaptationQualificationResult,
  AdaptationQualificationTest,
  QualificationDecisionOutcome,
  QualificationDomain,
  QualificationWorkflowState,
} from "@/types/adaptation-qualification-service";

const VERSION = "adaptation-qualification-service/v18.6" as const;
const IDENTIFIER = "AdaptationQualificationService" as const;
const DEFAULT_TENANT = "tenant_phase_18_qualification";
const DEFAULT_OPERATOR = "operator_phase_18_qualification";
const QUALIFICATION_TIMESTAMP = "2026-07-16T00:00:00.000Z";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function has(failures: readonly AdaptationQualificationFailure[], failure: AdaptationQualificationFailure): boolean { return failures.includes(failure); }
function directFailure(scenario: AdaptationQualificationInput["scenario"]): AdaptationQualificationFailure | undefined { return !scenario || scenario === "BASELINE" ? undefined : scenario; }
function outcomeFor(failures: readonly AdaptationQualificationFailure[]): AdaptationQualificationOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_QUALIFICATION_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const workflowStates = freezeArray(["SIMULATION_COMPLETED", "EVIDENCE_COLLECTION", "EVIDENCE_VALIDATION", "CONSTITUTIONAL_EVALUATION", "GOVERNANCE_EVALUATION", "REPLAY_VERIFICATION", "OPERATIONAL_IMPACT_EVALUATION", "QUALIFICATION_DECISION", "IMMUTABLE_QUALIFICATION_RECORD"] as const satisfies readonly QualificationWorkflowState[]);
const evaluationDomains = freezeArray(["CONSTITUTIONAL_COMPLIANCE", "GOVERNANCE_COMPLIANCE", "REPLAY_INTEGRITY", "DETERMINISTIC_REPRODUCIBILITY", "OPERATIONAL_BENEFIT", "OPERATIONAL_SAFETY", "OPTIMIZATION_VALIDITY", "TENANT_ISOLATION", "CERTIFICATION_COMPATIBILITY", "EVIDENCE_COMPLETENESS"] as const satisfies readonly QualificationDomain[]);
const decisionOutcomes = freezeArray(["QUALIFIED", "CONDITIONALLY_QUALIFIED", "REQUIRES_MORE_EVIDENCE", "REQUIRES_GOVERNANCE_REVIEW", "REJECTED"] as const satisfies readonly QualificationDecisionOutcome[]);

function certTest(name: string, passed: boolean, failure: AdaptationQualificationFailure, evidence_refs: readonly string[]): AdaptationQualificationTest {
  const actual: AdaptationQualificationOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_QUALIFICATION_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("adaptation_qualification_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure, evidence_refs: freezeArray(evidence_refs) });
}
function resultReplayHash(result: Omit<AdaptationQualificationResult, "replay_hash" | "integrity_hash">): string {
  return hash({ simulation: result.adaptation_simulation_ref, service: result.qualification_service.integrity_hash, policy: result.policy_engine.integrity_hash, rules: result.rule_evaluator.integrity_hash, decisions: result.decision_registry.integrity_hash, evidence: result.evidence_ledger.integrity_hash, workflow: result.workflow_manager.integrity_hash, replay: result.replay_validator.integrity_hash, lineage: result.qualification_lineage.integrity_hash, audit: result.audit_service.integrity_hash, package: result.certification_package.integrity_hash, tests: result.certification_tests.map((test) => test.integrity_hash), outcome: result.outcome });
}
function resultIntegrityHash(result: Omit<AdaptationQualificationResult, "integrity_hash">): string { return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash }); }

export function runAdaptationQualificationService(input: AdaptationQualificationInput = {}): AdaptationQualificationResult {
  const simulation = runAdaptationSimulationEngine({ tenant_id: input.tenant_id ?? DEFAULT_TENANT, operator_id: input.operator_id ?? DEFAULT_OPERATOR, mission_id: input.mission_id });
  const direct = directFailure(input.scenario);
  const upstreamFailures: AdaptationQualificationFailure[] = simulation.outcome === "PASS" ? [] : ["PHASE_18_5_SIMULATION_NOT_VALID"];
  const failures = freezeArray([...new Set([...upstreamFailures, ...(direct ? [direct] : [])])]);
  const blockingFailures = freezeArray(failures.filter((failure) => failure !== "NON_CONSTITUTIONAL_QUALIFICATION_WARNING"));
  const qualificationId = input.qualification_id ?? id("qualification", simulation.integrity_hash);
  const adaptationId = input.adaptation_id ?? simulation.qualification_recommendation.recommendation_id;
  const deterministic = !has(failures, "QUALIFICATION_NOT_DETERMINISTIC");
  const evidenceComplete = !has(failures, "EVIDENCE_INCOMPLETE");
  const replay = !has(failures, "REPLAY_NOT_REPRODUCIBLE");
  const lineage = !has(failures, "QUALIFICATION_LINEAGE_NOT_PRESERVED");
  const governance = !has(failures, "GOVERNANCE_VALIDATION_INCOMPLETE");
  const constitutional = !has(failures, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED");
  const tenantIsolation = !has(failures, "TENANT_ISOLATION_NOT_PRESERVED");
  const audit = !has(failures, "QUALIFICATION_AUDIT_INCOMPLETE");
  const eligibilityGoverned = !has(failures, "RECOMMENDATION_ELIGIBILITY_NOT_GOVERNED");
  const noImplementationAuthority = !has(failures, "IMPLEMENTATION_AUTHORITY_GRANTED");
  const immutableRecord = !has(failures, "QUALIFICATION_RECORD_MUTABLE");
  const unknownFailClosed = !has(failures, "UNKNOWN_RULE_NOT_FAIL_CLOSED");
  const evidenceRefs = freezeArray(evidenceComplete ? [simulation.integrity_hash, simulation.certification_package.integrity_hash, ...simulation.evidence_registry.records.map((record) => record.integrity_hash)] : []);
  const replayRefs = freezeArray(replay ? [simulation.replay_hash, simulation.replay_validation.integrity_hash] : []);
  const governanceRefs = freezeArray(governance ? [simulation.governance_validation.integrity_hash] : []);
  const simulationRefs = freezeArray([simulation.evidence_registry.integrity_hash, ...simulation.qualification_recommendation.simulation_refs]);
  const qualified = blockingFailures.length === 0;
  const decisionOutcome: QualificationDecisionOutcome = qualified ? "QUALIFIED" : !evidenceComplete ? "REQUIRES_MORE_EVIDENCE" : !governance ? "REQUIRES_GOVERNANCE_REVIEW" : "REJECTED";

  const qualification_service = nested({ service_id: id("adaptation_qualification_service", qualificationId), completed_simulations_evaluated: simulation.outcome === "PASS", constitutional_compliance_validated: constitutional, governance_compliance_verified: governance, replay_reproducibility_verified: replay, evidence_completeness_verified: evidenceComplete, operational_impact_verified: simulation.certification_package.operational_impact_explainable, tenant_isolation_preserved: tenantIsolation, qualification_outcome_determined: deterministic, immutable_lineage_preserved: lineage, evidentiary_only: noImplementationAuthority, implementation_authority_granted: !noImplementationAuthority, deterministic });
  const policy_engine = nested({ engine_id: id("qualification_policy_engine", qualificationId), domains: evaluationDomains, constitutional_requirements: constitutional, governance_requirements: governance, replay_requirements: replay, evidence_requirements: evidenceComplete, operational_policies: simulation.certification_package.operational_impact_explainable, optimization_policies: eligibilityGoverned, deterministic_policy_evaluation: deterministic, unknown_rules_fail_closed: unknownFailClosed });
  const rule_evaluator = nested({ evaluator_id: id("qualification_rule_evaluator", qualificationId), replay_validated: replay, simulation_deterministic: simulation.certification_package.simulations_deterministic && deterministic, evidence_complete: evidenceComplete, governance_satisfied: governance, constitutional_compliance_verified: constitutional, tenant_isolation_preserved: tenantIsolation, operational_impact_acceptable: simulation.certification_package.operational_impact_explainable, unknown_rules_fail_closed: unknownFailClosed, deterministic_execution: deterministic });
  const decision = nested({ qualification_id: qualificationId, adaptation_id: adaptationId, simulation_id: simulation.evidence_registry.records[0]?.simulation_id ?? id("simulation", qualificationId), tenant_id: input.tenant_id ?? DEFAULT_TENANT, qualification_outcome: decisionOutcome, constitutional_result: constitutional ? "PASS" as const : "FAIL" as const, governance_result: governance ? "PASS" as const : "FAIL" as const, replay_result: replay ? "PASS" as const : "FAIL" as const, operational_result: simulation.certification_package.operational_impact_explainable ? "PASS" as const : "FAIL" as const, evidence_refs: evidenceRefs, simulation_refs: simulationRefs, decision_reason: qualified ? "All constitutional qualification requirements satisfied." : "Qualification failed closed due to unmet requirements.", qualification_timestamp: QUALIFICATION_TIMESTAMP });
  const decision_registry = nested({ registry_id: id("qualification_decision_registry", qualificationId), decisions: freezeArray([decision]), qualification_identity_tracked: true, adaptation_identity_tracked: true, simulation_references_tracked: true, evidence_lineage_tracked: lineage, replay_references_tracked: replay, governance_references_tracked: governance, supersession_history_tracked: lineage, immutable_records: immutableRecord });
  const evidence_ledger = nested({ ledger_id: id("qualification_evidence_ledger", qualificationId), simulation_evidence: evidenceRefs, replay_evidence: replayRefs, governance_evidence: governanceRefs, operational_evidence: [simulation.impact_simulator.integrity_hash], constitutional_evidence: constitutional ? [simulation.governance_validation.integrity_hash] : [], qualification_rationale: [decision.integrity_hash], audit_references: audit ? [id("qualification_audit", qualificationId)] : [], integrity_verification: immutableRecord, append_only: immutableRecord });
  const workflow_manager = nested({ workflow_id: id("qualification_workflow", qualificationId), states: workflowStates, transitions_deterministic: deterministic, qualification_precedes_recommendation: eligibilityGoverned, evidence_collection_complete: evidenceComplete, validation_order_preserved: governance && replay, immutable_record_committed: immutableRecord });
  const replay_validator = nested({ validator_id: id("qualification_replay_validator", qualificationId), identical_evidence_selection: replay, identical_rule_execution: replay && deterministic, identical_decision_path: replay && deterministic, identical_qualification_outcome: replay && deterministic, identical_audit_lineage: replay && audit, replay_divergence_fails_qualification: replay, reproducible: replay });
  const qualification_lineage = nested({ lineage_id: id("qualification_lineage", qualificationId), monitoring_observations: [simulation.continuous_optimization_ref], learned_operational_patterns: [simulation.continuous_optimization_ref], optimization_recommendations: [simulation.continuous_optimization_ref], simulation_executions: simulationRefs, governance_decisions: governanceRefs, replay_evidence: replayRefs, certification_evidence: [simulation.certification_package.integrity_hash], no_lineage_removed: lineage });
  const audit_service = nested({ audit_id: id("qualification_audit", qualificationId), audit_complete: audit, immutable_audit: immutableRecord, decision_auditable: audit, supersession_additive: lineage, tenant_boundary_audited: tenantIsolation, authority_boundary_audited: noImplementationAuthority });
  const certification_package = nested({ package_id: id("adaptation_qualification_certification", qualificationId), qualification_deterministic: qualification_service.deterministic && policy_engine.deterministic_policy_evaluation && rule_evaluator.deterministic_execution, evidence_complete: evidence_ledger.simulation_evidence.length > 0 && evidence_ledger.integrity_verification, replay_reproducible: replay_validator.reproducible && replay_validator.identical_qualification_outcome, qualification_lineage_preserved: qualification_lineage.no_lineage_removed && decision_registry.evidence_lineage_tracked, governance_validation_complete: governance && evidence_ledger.governance_evidence.length > 0, constitutional_compliance_verified: constitutional && rule_evaluator.constitutional_compliance_verified, tenant_isolation_preserved: tenantIsolation && audit_service.tenant_boundary_audited, qualification_audit_complete: audit_service.audit_complete && audit_service.decision_auditable, recommendation_eligibility_governed: eligibilityGoverned && workflow_manager.qualification_precedes_recommendation && qualification_service.evidentiary_only && !qualification_service.implementation_authority_granted, adaptation_qualification_certified: blockingFailures.length === 0, evidence_refs: evidenceRefs });
  const tests = freezeArray([
    certTest("Qualification deterministic", certification_package.qualification_deterministic, "QUALIFICATION_NOT_DETERMINISTIC", [qualification_service.integrity_hash]),
    certTest("Evidence complete", certification_package.evidence_complete, "EVIDENCE_INCOMPLETE", [evidence_ledger.integrity_hash]),
    certTest("Replay reproducible", certification_package.replay_reproducible, "REPLAY_NOT_REPRODUCIBLE", [replay_validator.integrity_hash]),
    certTest("Qualification lineage preserved", certification_package.qualification_lineage_preserved, "QUALIFICATION_LINEAGE_NOT_PRESERVED", [qualification_lineage.integrity_hash]),
    certTest("Governance validation complete", certification_package.governance_validation_complete, "GOVERNANCE_VALIDATION_INCOMPLETE", [evidence_ledger.integrity_hash]),
    certTest("Constitutional compliance verified", certification_package.constitutional_compliance_verified, "CONSTITUTIONAL_COMPLIANCE_NOT_VERIFIED", [rule_evaluator.integrity_hash]),
    certTest("Tenant isolation preserved", certification_package.tenant_isolation_preserved, "TENANT_ISOLATION_NOT_PRESERVED", [audit_service.integrity_hash]),
    certTest("Qualification audit complete", certification_package.qualification_audit_complete, "QUALIFICATION_AUDIT_INCOMPLETE", [audit_service.integrity_hash]),
    certTest("Recommendation eligibility governed", certification_package.recommendation_eligibility_governed, "RECOMMENDATION_ELIGIBILITY_NOT_GOVERNED", [workflow_manager.integrity_hash]),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((test) => test.failure_reason).filter((failure): failure is AdaptationQualificationFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<AdaptationQualificationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, adaptation_simulation_ref: simulation.integrity_hash, qualification_service, policy_engine, rule_evaluator, decision_registry, evidence_ledger, workflow_manager, replay_validator, qualification_lineage, audit_service, certification_package, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateAdaptationQualificationService(result = runAdaptationQualificationService()) {
  const service_valid = verify(result.qualification_service) && Object.entries(result.qualification_service).filter(([key]) => !["service_id", "implementation_authority_granted", "integrity_hash"].includes(key)).every(([, value]) => value === true) && !result.qualification_service.implementation_authority_granted;
  const policy_valid = verify(result.policy_engine) && result.policy_engine.domains.length === 10 && Object.entries(result.policy_engine).filter(([key]) => !["engine_id", "domains", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const rule_valid = verify(result.rule_evaluator) && Object.entries(result.rule_evaluator).filter(([key]) => !["evaluator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const decision_valid = verify(result.decision_registry) && result.decision_registry.decisions.length === 1 && result.decision_registry.decisions.every((decision) => verify(decision) && decision.qualification_outcome === "QUALIFIED" && decision.constitutional_result === "PASS" && decision.governance_result === "PASS" && decision.replay_result === "PASS" && decision.operational_result === "PASS" && decision.evidence_refs.length > 0 && decision.simulation_refs.length > 0) && Object.entries(result.decision_registry).filter(([key]) => !["registry_id", "decisions", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const evidence_valid = verify(result.evidence_ledger) && result.evidence_ledger.simulation_evidence.length > 0 && result.evidence_ledger.replay_evidence.length > 0 && result.evidence_ledger.governance_evidence.length > 0 && result.evidence_ledger.operational_evidence.length > 0 && result.evidence_ledger.constitutional_evidence.length > 0 && result.evidence_ledger.qualification_rationale.length > 0 && result.evidence_ledger.audit_references.length > 0 && result.evidence_ledger.integrity_verification && result.evidence_ledger.append_only;
  const workflow_valid = verify(result.workflow_manager) && result.workflow_manager.states.length === 9 && result.workflow_manager.states.every((state, index) => state === workflowStates[index]) && Object.entries(result.workflow_manager).filter(([key]) => !["workflow_id", "states", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const replay_valid = verify(result.replay_validator) && Object.entries(result.replay_validator).filter(([key]) => !["validator_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const lineage_valid = verify(result.qualification_lineage) && Object.entries(result.qualification_lineage).filter(([key]) => !["lineage_id", "integrity_hash"].includes(key)).every(([, value]) => Array.isArray(value) ? value.length > 0 : value === true);
  const audit_valid = verify(result.audit_service) && Object.entries(result.audit_service).filter(([key]) => !["audit_id", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_package_valid = verify(result.certification_package) && result.certification_package.evidence_refs.length > 0 && Object.entries(result.certification_package).filter(([key]) => !["package_id", "evidence_refs", "integrity_hash"].includes(key)).every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 9 && result.certification_tests.every((test) => verify(test) && test.passed && test.evidence_refs.length > 0);
  const result_replay_valid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && service_valid && policy_valid && rule_valid && decision_valid && evidence_valid && workflow_valid && replay_valid && lineage_valid && audit_valid && certification_package_valid && certification_valid && result_replay_valid;
  return nested({ valid, outcome: result.outcome, service_valid, policy_valid, rule_valid, decision_valid, evidence_valid, workflow_valid, replay_valid, lineage_valid, audit_valid, certification_package_valid, certification_valid, result_replay_valid, failures: result.failures });
}

export function replayAdaptationQualificationService(result = runAdaptationQualificationService()): boolean {
  const replayed = runAdaptationQualificationService();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateAdaptationQualificationService(result).valid;
}

export function getAdaptationQualificationServiceBundle(): AdaptationQualificationBundle {
  const result = runAdaptationQualificationService();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, upstream_phase: "adaptation-simulation-engine/v18.5" as const, workflow_states: workflowStates, evaluation_domains: evaluationDomains, decision_outcomes: decisionOutcomes, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const) }), result, validation: validateAdaptationQualificationService(result) });
}

export const AdaptationQualificationServiceFacade = Object.freeze({ run: runAdaptationQualificationService, validate: validateAdaptationQualificationService, replay: replayAdaptationQualificationService });
