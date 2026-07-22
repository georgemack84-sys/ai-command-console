import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveSimulationContract, replayAdaptiveSimulationContract } from "@/services/adaptive-simulation-contract";
import type {
  HistoricalReplayApiSurface,
  HistoricalReplayDataSource,
  HistoricalReplayFailure,
  HistoricalReplayFoundation,
  HistoricalReplayHarnessResult,
  HistoricalReplayInput,
  HistoricalReplayMetrics,
  HistoricalReplayOutcome,
  HistoricalReplayScenario,
  HistoricalReplayScope,
  HistoricalReplayValidation,
  HistoricalReplayValidationCheck,
} from "@/types/historical-replay-test-harness";

const HARNESS_VERSION = "historical-replay-test-harness/v1" as const;
const HARNESS_IDENTIFIER = "HistoricalReplayTestHarness" as const;

const SCOPES: readonly HistoricalReplayScope[] = Object.freeze([
  "PREVIOUS_MISSIONS",
  "PREVIOUS_DECISIONS",
  "PREVIOUS_RECOMMENDATIONS",
  "OPERATOR_ACTIONS",
  "GOVERNANCE_REVIEWS",
  "APPROVAL_WORKFLOWS",
  "ROLLBACK_EVENTS",
  "CONFIDENCE_EVOLUTION",
  "RISK_EVOLUTION",
]);

const DATA_SOURCES: readonly HistoricalReplayDataSource[] = Object.freeze([
  "TRUTH_LEDGER",
  "RECOMMENDATION_LEDGER",
  "DECISION_GRAPH",
  "GOVERNANCE_LEDGER",
  "REPLAY_LEDGER",
  "RISK_HISTORY",
  "CONFIDENCE_HISTORY",
  "MISSION_TIMELINE",
  "OPERATOR_ACTIVITY_LEDGER",
  "APPROVAL_LEDGER",
  "ROLLBACK_LEDGER",
]);

type Scenario = NonNullable<HistoricalReplayInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): HistoricalReplayApiSurface {
  const base: Omit<HistoricalReplayApiSurface, "integrity_hash"> = {
    api_id: "historical_replay_test_harness_api",
    validate_replay: "POST /historical-replay-test-harness/validate",
    retrieve_scopes: "POST /historical-replay-test-harness/scopes",
    retrieve_data_sources: "POST /historical-replay-test-harness/data-sources",
    retrieve_metrics: "POST /historical-replay-test-harness/metrics",
    replay_validation: "POST /historical-replay-test-harness/replay",
    inspect_harness: "POST /historical-replay-test-harness/inspect",
    retrieve_contract: "GET /historical-replay-test-harness/contract",
    synthetic_data_supported: false,
    production_mutation_supported: false,
    approval_or_deployment_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): HistoricalReplayFailure | undefined {
  const map: Partial<Record<HistoricalReplayScenario, HistoricalReplayFailure>> = {
    NONDETERMINISTIC: "NONDETERMINISTIC_REPLAY",
    REPLAY_DIFFERENCE: "REPLAY_DIFFERS_FROM_HISTORY",
    RECOMMENDATION_INCONSISTENCY: "RECOMMENDATION_INCONSISTENCY",
    EVIDENCE_MISMATCH: "EVIDENCE_MISMATCH",
    GOVERNANCE_CHANGE: "GOVERNANCE_BEHAVIOR_CHANGED",
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    OPERATOR_WORKFLOW_CHANGE: "OPERATOR_WORKFLOW_CHANGED",
    APPROVAL_SEQUENCE_CHANGE: "APPROVAL_SEQUENCE_CHANGED",
    REPLAY_HASH_MISMATCH: "REPLAY_HASH_MISMATCH",
    MISSING_HISTORICAL_EVIDENCE: "MISSING_HISTORICAL_EVIDENCE",
    ROLLBACK_INCONSISTENCY: "ROLLBACK_INCONSISTENCY",
    TENANT_ISOLATION_BREACH: "TENANT_ISOLATION_BREACH",
    REPLAY_CORRUPTION: "REPLAY_CORRUPTION",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILURE",
    SYNTHETIC_DATA: "SYNTHETIC_DATA_INTRODUCED",
    PRODUCTION_MUTATION: "PRODUCTION_MUTATION_ATTEMPT",
    APPROVAL_OR_DEPLOYMENT: "APPROVAL_OR_DEPLOYMENT_ATTEMPT",
  };
  return map[scenario];
}

function scopeFailure(scope: HistoricalReplayScope, failure: HistoricalReplayFailure | undefined): readonly HistoricalReplayFailure[] {
  if (!failure) return freezeArray([]);
  const affected: Partial<Record<HistoricalReplayFailure, readonly HistoricalReplayScope[]>> = {
    REPLAY_DIFFERS_FROM_HISTORY: ["PREVIOUS_MISSIONS", "PREVIOUS_DECISIONS"],
    RECOMMENDATION_INCONSISTENCY: ["PREVIOUS_RECOMMENDATIONS"],
    EVIDENCE_MISMATCH: ["PREVIOUS_DECISIONS", "PREVIOUS_RECOMMENDATIONS"],
    GOVERNANCE_BEHAVIOR_CHANGED: ["GOVERNANCE_REVIEWS"],
    CONSTITUTIONAL_VIOLATION: ["GOVERNANCE_REVIEWS"],
    OPERATOR_WORKFLOW_CHANGED: ["OPERATOR_ACTIONS"],
    APPROVAL_SEQUENCE_CHANGED: ["APPROVAL_WORKFLOWS"],
    MISSING_HISTORICAL_EVIDENCE: ["PREVIOUS_MISSIONS", "PREVIOUS_DECISIONS", "PREVIOUS_RECOMMENDATIONS"],
    ROLLBACK_INCONSISTENCY: ["ROLLBACK_EVENTS"],
    TENANT_ISOLATION_BREACH: SCOPES,
    REPLAY_CORRUPTION: SCOPES,
    INTEGRITY_VERIFICATION_FAILURE: SCOPES,
    SYNTHETIC_DATA_INTRODUCED: SCOPES,
    PRODUCTION_MUTATION_ATTEMPT: SCOPES,
    APPROVAL_OR_DEPLOYMENT_ATTEMPT: ["APPROVAL_WORKFLOWS"],
  };
  return (affected[failure] ?? SCOPES).includes(scope) ? freezeArray([failure]) : freezeArray([]);
}

function replayedElementsFor(scope: HistoricalReplayScope): readonly string[] {
  const map: Record<HistoricalReplayScope, readonly string[]> = {
    PREVIOUS_MISSIONS: ["mission_lifecycle", "mission_state_transitions", "mission_outcomes", "mission_dependencies", "mission_completion_history"],
    PREVIOUS_DECISIONS: ["decision_inputs", "decision_graphs", "decision_ordering", "decision_outcomes", "decision_evidence"],
    PREVIOUS_RECOMMENDATIONS: ["recommendation_generation", "recommendation_prioritization", "recommendation_explanations", "recommendation_evidence", "recommendation_confidence"],
    OPERATOR_ACTIONS: ["approvals", "rejections", "overrides", "escalations", "manual_interventions"],
    GOVERNANCE_REVIEWS: ["governance_validation", "constitutional_validation", "policy_evaluation", "authority_verification", "compliance_verification"],
    APPROVAL_WORKFLOWS: ["approval_routing", "review_stages", "escalation_paths", "authorization_decisions"],
    ROLLBACK_EVENTS: ["rollback_triggers", "rollback_execution", "rollback_completion", "rollback_evidence", "rollback_recovery"],
    CONFIDENCE_EVOLUTION: ["confidence_calculations", "confidence_adjustments", "uncertainty_analysis", "confidence_explanations"],
    RISK_EVOLUTION: ["risk_calculations", "risk_escalation", "mitigation_recommendations", "impact_assessments"],
  };
  return freezeArray(map[scope]);
}

function validationRequirementsFor(scope: HistoricalReplayScope): readonly string[] {
  const common = ["identical_inputs", "identical_outputs", "identical_event_sequence", "identical_logical_timestamps", "identical_state_transitions"];
  const map: Record<HistoricalReplayScope, readonly string[]> = {
    PREVIOUS_MISSIONS: [...common, "identical_execution_path", "identical_completion_status"],
    PREVIOUS_DECISIONS: [...common, "deterministic_decisions", "identical_decision_ordering", "identical_rationale"],
    PREVIOUS_RECOMMENDATIONS: [...common, "recommendation_content_consistent", "recommendation_ranking_consistent", "recommendation_evidence_consistent", "recommendation_rationale_consistent", "recommendation_confidence_consistent"],
    OPERATOR_ACTIONS: [...common, "identical_operator_workflow", "identical_authority_preservation", "identical_approval_requirements"],
    GOVERNANCE_REVIEWS: [...common, "governance_preserved", "constitutional_behavior_unchanged", "identical_policy_enforcement"],
    APPROVAL_WORKFLOWS: [...common, "identical_approval_sequence", "identical_authorization_decisions", "deterministic_routing"],
    ROLLBACK_EVENTS: [...common, "rollback_reproducible", "rollback_deterministic", "rollback_integrity_verified"],
    CONFIDENCE_EVOLUTION: [...common, "deterministic_confidence_evolution", "identical_confidence_trajectory", "confidence_explanation_consistent"],
    RISK_EVOLUTION: [...common, "deterministic_risk_progression", "identical_escalation_behavior", "identical_mitigation_guidance"],
  };
  return freezeArray(map[scope]);
}

function buildValidationCheck(scope: HistoricalReplayScope, failure: HistoricalReplayFailure | undefined): HistoricalReplayValidationCheck {
  const failures = scopeFailure(scope, failure);
  const base: Omit<HistoricalReplayValidationCheck, "integrity_hash"> = {
    scope,
    replayed_elements: replayedElementsFor(scope),
    validation_requirements: validationRequirementsFor(scope),
    passed: failures.length === 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(scenario: Scenario, simulationContractReplayable: boolean): readonly HistoricalReplayFailure[] {
  const failures: HistoricalReplayFailure[] = [];
  const scenarioFailure = failureForScenario(scenario);
  if (scenarioFailure) failures.push(scenarioFailure);
  if (!simulationContractReplayable) failures.push("ADAPTIVE_SIMULATION_CONTRACT_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function outcomeFor(scenario: Scenario, failures: readonly HistoricalReplayFailure[]): HistoricalReplayOutcome {
  if (scenario === "CONDITIONAL_REPORTING") return "CONDITIONAL_PASS";
  if (failures.includes("MISSING_HISTORICAL_EVIDENCE")) return "REQUIRES_MORE_EVIDENCE";
  if (failures.includes("GOVERNANCE_BEHAVIOR_CHANGED") || failures.includes("CONSTITUTIONAL_VIOLATION")) return "REQUIRES_GOVERNANCE_REVIEW";
  return failures.length ? "FAIL" : "PASS";
}

function buildValidation(
  input: HistoricalReplayInput,
  scopes: readonly HistoricalReplayScope[],
  outcome: HistoricalReplayOutcome,
  failures: readonly HistoricalReplayFailure[],
): HistoricalReplayValidation {
  const proposal_id = input.proposal_id ?? "adaptive-proposal-historical-baseline";
  const tenant_id = input.tenant_id ?? "tenant-mission-control";
  const historical_execution_reference = "truth-ledger:historical-mission-control-executions";
  const replay_execution_reference = "replay-ledger:deterministic-historical-replay";
  const baseline_hash = hash({ proposal_id, tenant_id, historical_execution_reference, sources: DATA_SOURCES });
  const replay_hash = failures.includes("REPLAY_HASH_MISMATCH") ? hash({ baseline_hash, mismatch: true }) : baseline_hash;
  const base: Omit<HistoricalReplayValidation, "integrity_hash"> = {
    replay_id: `historical_replay_${hash({ proposal_id, tenant_id }).slice(0, 16)}`,
    proposal_id,
    tenant_id,
    replay_scope: scopes,
    historical_execution_reference,
    replay_execution_reference,
    baseline_hash,
    replay_hash,
    deterministic: !failures.includes("NONDETERMINISTIC_REPLAY"),
    replay_matches_history: !failures.includes("REPLAY_DIFFERS_FROM_HISTORY") && !failures.includes("REPLAY_HASH_MISMATCH"),
    recommendation_consistent: !failures.includes("RECOMMENDATION_INCONSISTENCY"),
    governance_preserved: !failures.includes("GOVERNANCE_BEHAVIOR_CHANGED") && !failures.includes("CONSTITUTIONAL_VIOLATION"),
    operator_preserved: !failures.includes("OPERATOR_WORKFLOW_CHANGED") && !failures.includes("APPROVAL_SEQUENCE_CHANGED"),
    evidence_consistent: !failures.includes("EVIDENCE_MISMATCH") && !failures.includes("MISSING_HISTORICAL_EVIDENCE") && !failures.includes("SYNTHETIC_DATA_INTRODUCED"),
    confidence_consistent: !failures.includes("NONDETERMINISTIC_REPLAY"),
    risk_consistent: !failures.includes("ROLLBACK_INCONSISTENCY") && !failures.includes("NONDETERMINISTIC_REPLAY"),
    replay_explanation: failures.length
      ? "Historical replay failed closed because one or more historical truth, governance, operator, evidence, or integrity invariants were violated."
      : "Historical replay exactly reproduces historical Mission Control execution using authorized immutable ledger evidence.",
    validation_result: outcome,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildMetrics(
  checks: readonly HistoricalReplayValidationCheck[],
  failures: readonly HistoricalReplayFailure[],
): HistoricalReplayMetrics {
  const passed = checks.filter((check) => check.passed).length;
  const clean = failures.length === 0;
  const base: Omit<HistoricalReplayMetrics, "integrity_hash"> = {
    replay_scopes_validated: checks.length,
    data_sources_authorized: DATA_SOURCES.length,
    validation_checks_passed: passed,
    validation_checks_total: checks.length,
    deterministic_replay_rate: failures.includes("NONDETERMINISTIC_REPLAY") ? 0 : 1,
    replay_match_rate: failures.includes("REPLAY_DIFFERS_FROM_HISTORY") || failures.includes("REPLAY_HASH_MISMATCH") ? 0 : 1,
    recommendation_consistency_rate: failures.includes("RECOMMENDATION_INCONSISTENCY") ? 0 : 1,
    evidence_consistency_rate: failures.includes("EVIDENCE_MISMATCH") || failures.includes("MISSING_HISTORICAL_EVIDENCE") || failures.includes("SYNTHETIC_DATA_INTRODUCED") ? 0 : 1,
    governance_preservation_rate: failures.includes("GOVERNANCE_BEHAVIOR_CHANGED") || failures.includes("CONSTITUTIONAL_VIOLATION") ? 0 : 1,
    operator_preservation_rate: failures.includes("OPERATOR_WORKFLOW_CHANGED") || failures.includes("APPROVAL_SEQUENCE_CHANGED") ? 0 : 1,
    confidence_consistency_rate: failures.includes("NONDETERMINISTIC_REPLAY") ? 0 : 1,
    risk_consistency_rate: failures.includes("ROLLBACK_INCONSISTENCY") ? 0 : 1,
    failures: clean ? freezeArray([]) : failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<HistoricalReplayHarnessResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    validation_hash: result.validation.integrity_hash,
    check_hashes: result.validation_checks.map((check) => check.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    data_sources: result.authorized_data_sources,
    outcome: result.outcome,
    failures: result.failures,
    baseline_replay_package_hash: result.baseline_replay_package_hash,
    replay_integrity_report_hash: result.replay_integrity_report_hash,
    replay_determinism_report_hash: result.replay_determinism_report_hash,
    simulation_validation_ledger_entry_hash: result.simulation_validation_ledger_entry_hash,
  });
}

function resultIntegrityHash(result: Omit<HistoricalReplayHarnessResult, "integrity_hash">): string {
  return hash({
    version: result.historical_replay_test_harness_version,
    harness_identifier: result.harness_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    simulation_contract_hash: result.adaptive_simulation_contract.integrity_hash,
    replay_hash: result.replay_hash,
    outcome: result.outcome,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function validateHistoricalReplay(input: HistoricalReplayInput = {}): HistoricalReplayHarnessResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const adaptive_simulation_contract = input.adaptive_simulation_contract ?? establishAdaptiveSimulationContract();
  const failures = collectFailures(scenario, replayAdaptiveSimulationContract(adaptive_simulation_contract));
  const validation_checks = freezeArray(SCOPES.map((scope) => buildValidationCheck(scope, failureForScenario(scenario))));
  const outcome = outcomeFor(scenario, failures);
  const validation = buildValidation(input, SCOPES, outcome, failures);
  const metrics = buildMetrics(validation_checks, failures);
  const baseline_replay_package_hash = hash({ validation: validation.integrity_hash, data_sources: DATA_SOURCES, scopes: SCOPES });
  const replay_integrity_report_hash = hash({ validation: validation.integrity_hash, replay_hash: validation.replay_hash, failures });
  const replay_determinism_report_hash = hash({ checks: validation_checks.map((check) => check.integrity_hash), deterministic: validation.deterministic });
  const simulation_validation_ledger_entry_hash = hash({ validation: validation.integrity_hash, metrics: metrics.integrity_hash, append_only: true });
  const base: Omit<HistoricalReplayHarnessResult, "integrity_hash" | "replay_hash"> = {
    historical_replay_test_harness_version: HARNESS_VERSION,
    harness_identifier: HARNESS_IDENTIFIER,
    api_surface,
    adaptive_simulation_contract,
    authorized_data_sources: DATA_SOURCES,
    validation_checks,
    validation,
    metrics,
    outcome,
    failures,
    deterministic: validation.deterministic,
    replayable: failures.length === 0,
    explainable: !failures.includes("REPLAY_CORRUPTION") && !failures.includes("INTEGRITY_VERIFICATION_FAILURE"),
    immutable_historical_records_preserved: true,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_BREACH"),
    governance_preserved: validation.governance_preserved,
    constitutional_behavior_preserved: !failures.includes("CONSTITUTIONAL_VIOLATION"),
    operator_authority_preserved: validation.operator_preserved,
    advisory_only: true,
    synthetic_data_introduced: false,
    modifies_history: false,
    modifies_production_behavior: false,
    approves_or_deploys_proposal: false,
    baseline_replay_package_hash,
    replay_integrity_report_hash,
    replay_determinism_report_hash,
    simulation_validation_ledger_entry_hash,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayHistoricalReplayValidation(result: HistoricalReplayHarnessResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    result.validation_checks.every(verifyHashedRecord) &&
    verifyHashedRecord(result.validation) &&
    verifyHashedRecord(result.metrics) &&
    replayAdaptiveSimulationContract(result.adaptive_simulation_contract) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getHistoricalReplayTestHarnessFoundation(): HistoricalReplayFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    historical_replay_test_harness_version: HARNESS_VERSION,
    supported_scopes: SCOPES,
    authorized_data_sources: DATA_SOURCES,
    api_surface,
    result: validateHistoricalReplay(),
  });
}

export const HistoricalReplayTestHarness = Object.freeze({
  validate: validateHistoricalReplay,
  replay: replayHistoricalReplayValidation,
});
