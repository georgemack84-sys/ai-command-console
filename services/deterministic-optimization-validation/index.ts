import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { runOptimizationImpactAnalysis, validateOptimizationImpactAnalysis } from "@/services/optimization-impact-analysis";
import type { ImpactAnalysisRecord, OptimizationImpactAnalysisLedger } from "@/types/optimization-impact-analysis";
import type {
  AuthorityValidationRecord,
  ConstitutionalValidationRecord,
  DeterministicOptimizationValidationBundle,
  DeterministicOptimizationValidationFailure,
  DeterministicOptimizationValidationInput,
  DeterministicOptimizationValidationLedger,
  DeterministicOptimizationValidationObservabilitySurface,
  DeterministicOptimizationValidationResult,
  DeterministicOptimizationValidationScenario,
  DeterministicValidationRecord,
  GovernanceValidationRecord,
  MissionOutcomeEquivalenceRecord,
  ReplayComparisonRecord,
  TenantIsolationValidationRecord,
  ValidationRecord,
} from "@/types/deterministic-optimization-validation";

const VERSION = "deterministic-optimization-validation/v8ALT.8.3" as const;
const NOW = "2026-07-15T12:00:00.000Z";
const workflow = Object.freeze(["PENDING", "DETERMINISTIC_VALIDATION", "REPLAY_VALIDATION", "GOVERNANCE_VALIDATION", "CONSTITUTIONAL_VALIDATION", "AUTHORITY_VALIDATION", "TENANT_VALIDATION", "MISSION_EQUIVALENCE_VALIDATION", "PASSED"] as const);
const outcomes = Object.freeze(["VALID", "CONDITIONAL", "INVALID", "REJECTED"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }

function scenarioFailure(scenario: DeterministicOptimizationValidationScenario): DeterministicOptimizationValidationFailure | null {
  const map: Partial<Record<DeterministicOptimizationValidationScenario, DeterministicOptimizationValidationFailure>> = {
    MISSING_IMPACT_LEDGER: "IMPACT_LEDGER_MISSING",
    IMPACT_LEDGER_NOT_READY: "IMPACT_LEDGER_NOT_READY",
    EXECUTION_SEQUENCE_MISMATCH: "EXECUTION_SEQUENCE_MISMATCH_DETECTED",
    STATE_TRANSITION_MISMATCH: "STATE_TRANSITION_MISMATCH_DETECTED",
    DECISION_ORDER_MISMATCH: "DECISION_ORDER_MISMATCH_DETECTED",
    SCHEDULING_MISMATCH: "SCHEDULING_MISMATCH_DETECTED",
    REPLAY_MISMATCH: "REPLAY_MISMATCH_DETECTED",
    REPLAY_LINEAGE_MISMATCH: "REPLAY_LINEAGE_MISMATCH_DETECTED",
    GOVERNANCE_MISMATCH: "GOVERNANCE_MISMATCH_DETECTED",
    CONSTITUTIONAL_MISMATCH: "CONSTITUTIONAL_MISMATCH_DETECTED",
    AUTHORITY_BOUNDARY_MISMATCH: "AUTHORITY_BOUNDARY_MISMATCH_DETECTED",
    TENANT_ISOLATION_FAILURE: "TENANT_ISOLATION_FAILURE_DETECTED",
    MISSION_OUTCOME_MISMATCH: "MISSION_OUTCOME_MISMATCH_DETECTED",
    OPERATOR_VISIBILITY_FAILURE: "OPERATOR_VISIBILITY_FAILURE_DETECTED",
    EXPLAINABILITY_LOSS: "EXPLAINABILITY_LOSS_DETECTED",
    AUTOMATIC_APPROVAL_ATTEMPT: "AUTOMATIC_APPROVAL_ATTEMPTED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ?? null;
}

function isFail(scenario: DeterministicOptimizationValidationScenario, targets: readonly DeterministicOptimizationValidationScenario[]) {
  return targets.includes(scenario);
}

function validationStatus(failures: readonly DeterministicOptimizationValidationFailure[]) {
  return failures.length ? "INVALID" as const : "VALID" as const;
}

function buildValidationRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario, failures: readonly DeterministicOptimizationValidationFailure[]): ValidationRecord {
  const base = {
    validation_id: id("DOV", "deterministic-optimization-validation", { analysis: analysis.impact_analysis_id, scenario }),
    opportunity_id: analysis.opportunity_id,
    mission_id: analysis.mission_id,
    execution_id: "execution:deterministic-validation:8alt-8-3",
    tenant_id: scenario === "TENANT_ISOLATION_FAILURE" ? "tenant:foreign" : analysis.tenant_id,
    validation_status: validationStatus(failures),
    validation_timestamp: NOW,
    validation_duration: 42,
    advisory_only: true as const,
    execution_authority: false as const,
    approval_authority: false as const,
    automatic_approval: scenario === "AUTOMATIC_APPROVAL_ATTEMPT",
    recommendation_authority: false as const,
  };
  return Object.freeze({ ...base, integrity_hash: hashValue("deterministic-optimization-validation-record", base) });
}

function buildDeterministicRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): DeterministicValidationRecord {
  const sequence = !isFail(scenario, ["EXECUTION_SEQUENCE_MISMATCH"]);
  const state = !isFail(scenario, ["STATE_TRANSITION_MISMATCH"]);
  const decision = !isFail(scenario, ["DECISION_ORDER_MISMATCH"]);
  const scheduling = !isFail(scenario, ["SCHEDULING_MISMATCH"]);
  const score = [sequence, state, decision, scheduling, true].filter(Boolean).length / 5;
  const base = { deterministic_validation_id: id("DOVD", "deterministic-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, execution_sequence_match: sequence, state_transition_match: state, decision_order_match: decision, scheduling_match: scheduling, dependency_match: true, deterministic_score: score, confidence_score: score, replay_reference: `replay:deterministic:${analysis.opportunity_id}`, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("deterministic-record", base) });
}

function buildReplayRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): ReplayComparisonRecord {
  const replay = !isFail(scenario, ["REPLAY_MISMATCH"]);
  const lineage = !isFail(scenario, ["REPLAY_LINEAGE_MISMATCH"]);
  const base = { replay_validation_id: id("DOVR", "replay-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, baseline_replay: `baseline:${analysis.opportunity_id}`, optimized_replay: `optimized:${analysis.opportunity_id}`, replay_match: replay, replay_order_match: replay, replay_lineage_match: lineage, replay_hash_match: replay && lineage, replay_score: replay && lineage ? 1 : 0, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("replay-record", base) });
}

function buildGovernanceRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): GovernanceValidationRecord {
  const pass = !isFail(scenario, ["GOVERNANCE_MISMATCH"]);
  const value = pass ? "PASS" as const : "FAIL" as const;
  const base = { governance_validation_id: id("DOVG", "governance-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, policy_validation: value, governance_rule_validation: value, advisory_validation: value, governance_lineage_validation: value, governance_replay_validation: value, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("governance-record", base) });
}

function buildConstitutionalRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): ConstitutionalValidationRecord {
  const pass = !isFail(scenario, ["CONSTITUTIONAL_MISMATCH"]);
  const value = pass ? "PASS" as const : "FAIL" as const;
  const base = { constitutional_validation_id: id("DOVC", "constitutional-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, constitutional_rule_validation: value, constitutional_evidence_validation: value, constitutional_lineage_validation: value, constitutional_replay_validation: value, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("constitutional-record", base) });
}

function buildAuthorityRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): AuthorityValidationRecord {
  const pass = !isFail(scenario, ["AUTHORITY_BOUNDARY_MISMATCH"]);
  const value = pass ? "PASS" as const : "FAIL" as const;
  const base = { authority_validation_id: id("DOVA", "authority-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, authority_boundary_validation: value, delegation_validation: value, operator_authority_validation: value, execution_authority_validation: value, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("authority-record", base) });
}

function buildTenantRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): TenantIsolationValidationRecord {
  const pass = !isFail(scenario, ["TENANT_ISOLATION_FAILURE"]);
  const value = pass ? "PASS" as const : "FAIL" as const;
  const base = { tenant_validation_id: id("DOVT", "tenant-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, tenant_isolation_validation: value, cross_tenant_validation: value, replay_isolation_validation: value, evidence_isolation_validation: value, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("tenant-record", base) });
}

function buildMissionEquivalenceRecord(analysis: ImpactAnalysisRecord, scenario: DeterministicOptimizationValidationScenario): MissionOutcomeEquivalenceRecord {
  const mission = !isFail(scenario, ["MISSION_OUTCOME_MISMATCH"]);
  const visible = !isFail(scenario, ["OPERATOR_VISIBILITY_FAILURE"]);
  const explain = !isFail(scenario, ["EXPLAINABILITY_LOSS"]);
  const score = [mission, mission, mission, mission, mission, visible, explain].filter(Boolean).length / 7;
  const base = { mission_equivalence_id: id("DOVM", "mission-equivalence-record", { analysis: analysis.impact_analysis_id, scenario }), opportunity_id: analysis.opportunity_id, mission_result_match: mission, recommendation_match: mission, confidence_value_match: mission, governance_outcome_match: mission, completion_state_match: mission, operator_visibility_preserved: visible, explainability_preserved: explain, equivalence_score: score, timestamp: NOW };
  return Object.freeze({ ...base, integrity_hash: hashValue("mission-equivalence-record", base) });
}

function collectFailures(ledger: Omit<DeterministicOptimizationValidationLedger, "integrity_hash"> | DeterministicOptimizationValidationLedger, impactLedger: OptimizationImpactAnalysisLedger | null): readonly DeterministicOptimizationValidationFailure[] {
  return unique([
    ...ledger.failures,
    ...(!impactLedger ? ["IMPACT_LEDGER_MISSING" as const] : []),
    ...(impactLedger && !validateOptimizationImpactAnalysis(impactLedger).ready_for_deterministic_validation ? ["IMPACT_LEDGER_NOT_READY" as const] : []),
    ...(ledger.deterministic_records.some((r) => !r.execution_sequence_match) ? ["EXECUTION_SEQUENCE_MISMATCH_DETECTED" as const] : []),
    ...(ledger.deterministic_records.some((r) => !r.state_transition_match) ? ["STATE_TRANSITION_MISMATCH_DETECTED" as const] : []),
    ...(ledger.deterministic_records.some((r) => !r.decision_order_match) ? ["DECISION_ORDER_MISMATCH_DETECTED" as const] : []),
    ...(ledger.deterministic_records.some((r) => !r.scheduling_match) ? ["SCHEDULING_MISMATCH_DETECTED" as const] : []),
    ...(ledger.replay_records.some((r) => !r.replay_match || !r.replay_order_match || !r.replay_hash_match) ? ["REPLAY_MISMATCH_DETECTED" as const] : []),
    ...(ledger.replay_records.some((r) => !r.replay_lineage_match) ? ["REPLAY_LINEAGE_MISMATCH_DETECTED" as const] : []),
    ...(ledger.governance_records.some((r) => Object.values(r).includes("FAIL")) ? ["GOVERNANCE_MISMATCH_DETECTED" as const] : []),
    ...(ledger.constitutional_records.some((r) => Object.values(r).includes("FAIL")) ? ["CONSTITUTIONAL_MISMATCH_DETECTED" as const] : []),
    ...(ledger.authority_records.some((r) => Object.values(r).includes("FAIL")) ? ["AUTHORITY_BOUNDARY_MISMATCH_DETECTED" as const] : []),
    ...(ledger.tenant_records.some((r) => Object.values(r).includes("FAIL")) ? ["TENANT_ISOLATION_FAILURE_DETECTED" as const] : []),
    ...(ledger.mission_equivalence_records.some((r) => !r.mission_result_match || !r.recommendation_match || !r.confidence_value_match || !r.governance_outcome_match || !r.completion_state_match) ? ["MISSION_OUTCOME_MISMATCH_DETECTED" as const] : []),
    ...(ledger.mission_equivalence_records.some((r) => !r.operator_visibility_preserved) ? ["OPERATOR_VISIBILITY_FAILURE_DETECTED" as const] : []),
    ...(ledger.mission_equivalence_records.some((r) => !r.explainability_preserved) ? ["EXPLAINABILITY_LOSS_DETECTED" as const] : []),
    ...(ledger.validations.some((r) => r.automatic_approval) ? ["AUTOMATIC_APPROVAL_ATTEMPTED" as const] : []),
  ]);
}

export function runDeterministicOptimizationValidation(input: DeterministicOptimizationValidationInput = {}): DeterministicOptimizationValidationLedger {
  if (input.ledger) return input.ledger;
  const scenario = input.scenario ?? "BASELINE";
  const injected = scenarioFailure(scenario);
  const impactLedger = scenario === "MISSING_IMPACT_LEDGER" ? null : input.impact_ledger ?? runOptimizationImpactAnalysis(scenario === "IMPACT_LEDGER_NOT_READY" ? { scenario: "REPLAY_RISK" } : {});
  const analyses = freezeArray((impactLedger?.analyses ?? []).filter((analysis) => analysis.decision_outcome === "ACCEPTABLE"));
  const initialFailures = unique([...(injected ? [injected] : [])]);
  const deterministic_records = freezeArray(analyses.map((analysis) => buildDeterministicRecord(analysis, scenario)));
  const replay_records = freezeArray(analyses.map((analysis) => buildReplayRecord(analysis, scenario)));
  const governance_records = freezeArray(analyses.map((analysis) => buildGovernanceRecord(analysis, scenario)));
  const constitutional_records = freezeArray(analyses.map((analysis) => buildConstitutionalRecord(analysis, scenario)));
  const authority_records = freezeArray(analyses.map((analysis) => buildAuthorityRecord(analysis, scenario)));
  const tenant_records = freezeArray(analyses.map((analysis) => buildTenantRecord(analysis, scenario)));
  const mission_equivalence_records = freezeArray(analyses.map((analysis) => buildMissionEquivalenceRecord(analysis, scenario)));
  const validations = freezeArray(analyses.map((analysis) => buildValidationRecord(analysis, scenario, initialFailures)));
  const source = { ledger_id: id("DOVL", "deterministic-optimization-validation-ledger", { impact: impactLedger?.ledger_id ?? "missing", scenario }), final_state: initialFailures.length ? "DETERMINISTIC_OPTIMIZATION_REJECTED" as const : "DETERMINISTIC_OPTIMIZATION_VALIDATED" as const, source_impact_ledger_id: impactLedger?.ledger_id ?? null, validations, deterministic_records, replay_records, governance_records, constitutional_records, authority_records, tenant_records, mission_equivalence_records, failures: initialFailures, advisory_only: true as const, execution_authority: false as const, approval_authority: false as const, automatic_approval: false as const, recommendation_authority: false as const };
  const failures = collectFailures(source, impactLedger);
  const ledger = { ...source, failures, final_state: failures.length ? "DETERMINISTIC_OPTIMIZATION_REJECTED" as const : source.final_state };
  return Object.freeze({ ...ledger, integrity_hash: scenario === "INTEGRITY_FAILURE" ? "" : hashValue("deterministic-optimization-validation-ledger", ledger) });
}

export function listDeterministicValidationRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).deterministic_records; }
export function listReplayComparisonRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).replay_records; }
export function listGovernanceValidationRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).governance_records; }
export function listConstitutionalValidationRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).constitutional_records; }
export function listAuthorityValidationRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).authority_records; }
export function listTenantValidationRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).tenant_records; }
export function listMissionOutcomeEquivalenceRecords(input: DeterministicOptimizationValidationInput = {}) { return runDeterministicOptimizationValidation(input).mission_equivalence_records; }

export function validateDeterministicOptimizationValidation(ledger = runDeterministicOptimizationValidation(), impactLedger: OptimizationImpactAnalysisLedger | null = runOptimizationImpactAnalysis()): DeterministicOptimizationValidationResult {
  const failures = unique([...collectFailures(ledger, impactLedger), ...(!ledger.integrity_hash ? ["INTEGRITY_VERIFICATION_FAILED" as const] : [])]);
  const has = (failure: DeterministicOptimizationValidationFailure) => failures.includes(failure);
  const expected = impactLedger?.analyses.filter((analysis) => analysis.decision_outcome === "ACCEPTABLE").length ?? 0;
  const every_acceptable_analysis_validated = Boolean(impactLedger) && ledger.validations.length === expected && ledger.deterministic_records.length === expected && ledger.replay_records.length === expected && ledger.mission_equivalence_records.length === expected;
  const valid = failures.length === 0 && every_acceptable_analysis_validated && ledger.final_state === "DETERMINISTIC_OPTIMIZATION_VALIDATED" && ledger.advisory_only && !ledger.execution_authority && !ledger.approval_authority && !ledger.automatic_approval && !ledger.recommendation_authority;
  const impactReady = impactLedger === null ? false : validateOptimizationImpactAnalysis(impactLedger).ready_for_deterministic_validation;
  const source = {
    ledger_id: ledger.ledger_id,
    valid,
    impact_ledger_ready: impactReady,
    every_acceptable_analysis_validated,
    deterministic_execution_preserved: !has("EXECUTION_SEQUENCE_MISMATCH_DETECTED") && !has("STATE_TRANSITION_MISMATCH_DETECTED") && !has("DECISION_ORDER_MISMATCH_DETECTED") && !has("SCHEDULING_MISMATCH_DETECTED"),
    replay_fidelity_preserved: !has("REPLAY_MISMATCH_DETECTED") && !has("REPLAY_LINEAGE_MISMATCH_DETECTED"),
    governance_preserved: !has("GOVERNANCE_MISMATCH_DETECTED"),
    constitutional_preserved: !has("CONSTITUTIONAL_MISMATCH_DETECTED"),
    authority_preserved: !has("AUTHORITY_BOUNDARY_MISMATCH_DETECTED"),
    tenant_isolated: !has("TENANT_ISOLATION_FAILURE_DETECTED"),
    mission_outcomes_equivalent: !has("MISSION_OUTCOME_MISMATCH_DETECTED"),
    operator_visibility_preserved: !has("OPERATOR_VISIBILITY_FAILURE_DETECTED"),
    explainability_preserved: !has("EXPLAINABILITY_LOSS_DETECTED"),
    advisory_only: true as const,
    execution_authority_absent: !ledger.execution_authority && ledger.validations.every((record) => !record.execution_authority),
    approval_authority_absent: !ledger.approval_authority && ledger.validations.every((record) => !record.approval_authority),
    automatic_approval_absent: !ledger.automatic_approval && ledger.validations.every((record) => !record.automatic_approval),
    recommendation_authority_absent: !ledger.recommendation_authority && ledger.validations.every((record) => !record.recommendation_authority),
    ready_for_recommendation_engine: valid,
    fail_closed: valid || failures.length > 0 || ledger.final_state !== "DETERMINISTIC_OPTIMIZATION_VALIDATED",
    failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("deterministic-optimization-validation-result", source) });
}

export function buildDeterministicOptimizationValidationObservabilitySurface(ledger = runDeterministicOptimizationValidation()): DeterministicOptimizationValidationObservabilitySurface {
  return Object.freeze({ ledger_id: ledger.ledger_id, final_state: ledger.final_state, validation_count: ledger.validations.length, valid_count: ledger.validations.filter((v) => v.validation_status === "VALID").length, invalid_count: ledger.validations.filter((v) => v.validation_status !== "VALID").length, failure_count: ledger.failures.length, advisory_only: true, execution_authority: false, approval_authority: false, integrity_hash: ledger.integrity_hash });
}

export function getDeterministicOptimizationValidation(): DeterministicOptimizationValidationBundle {
  const impact = runOptimizationImpactAnalysis();
  const ledger = runDeterministicOptimizationValidation({ impact_ledger: impact });
  return Object.freeze({
    doctrine: Object.freeze({ contract_version: VERSION, final_state: "DETERMINISTIC_OPTIMIZATION_VALIDATED", workflow, outcomes, principles: freezeArray(["deterministic-safeguard", "impact-ledger-derived", "mission-equivalence-required", "replay-fidelity-required", "governance-preservation", "constitutional-preservation", "authority-preservation", "tenant-isolation", "advisory-only-validation", "no-automatic-approval"]) }),
    ledger,
    validation: validateDeterministicOptimizationValidation(ledger, impact),
    observability: buildDeterministicOptimizationValidationObservabilitySurface(ledger),
  });
}
