import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { commitAdaptationProposalLedger, replayAdaptationProposalLedger } from "@/services/adaptation-proposal-ledger";
import type { AdaptationProposalLedgerScenario } from "@/types/adaptation-proposal-ledger";
import type {
  ProposalLifecycleApiSurface,
  ProposalLifecycleFailure,
  ProposalLifecycleFoundation,
  ProposalLifecycleInput,
  ProposalLifecycleMetrics,
  ProposalLifecycleResult,
  ProposalLifecycleScenario,
  ProposalLifecycleState,
  ProposalLifecycleStateMachineState,
  ProposalLifecycleTransition,
} from "@/types/proposal-lifecycle-state-machine";

const ENGINE_VERSION = "proposal-lifecycle-state-machine/v1" as const;
const RULE_VERSION = "proposal-lifecycle-transition-rules/v1" as const;
const STARTED_AT = "2026-07-10T00:00:00.000Z";

const STATES: readonly ProposalLifecycleState[] = Object.freeze([
  "DRAFT",
  "VALIDATED",
  "REQUIRES_SIMULATION",
  "REQUIRES_GOVERNANCE_REVIEW",
  "REQUIRES_OPERATOR_REVIEW",
  "APPROVED_FOR_CERTIFICATION",
  "CERTIFIED",
  "REJECTED",
  "SUPPRESSED",
  "ROLLED_BACK",
  "ARCHIVED",
]);

const ALLOWED_TRANSITIONS: Readonly<Record<ProposalLifecycleState, readonly ProposalLifecycleState[]>> = Object.freeze({
  DRAFT: Object.freeze(["VALIDATED", "REJECTED"] as const),
  VALIDATED: Object.freeze(["REQUIRES_SIMULATION", "REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW", "SUPPRESSED", "REJECTED"] as const),
  REQUIRES_SIMULATION: Object.freeze(["REQUIRES_GOVERNANCE_REVIEW", "REJECTED", "SUPPRESSED"] as const),
  REQUIRES_GOVERNANCE_REVIEW: Object.freeze(["REQUIRES_OPERATOR_REVIEW", "APPROVED_FOR_CERTIFICATION", "REJECTED", "SUPPRESSED"] as const),
  REQUIRES_OPERATOR_REVIEW: Object.freeze(["APPROVED_FOR_CERTIFICATION", "REJECTED", "SUPPRESSED"] as const),
  APPROVED_FOR_CERTIFICATION: Object.freeze(["CERTIFIED", "REJECTED", "SUPPRESSED"] as const),
  CERTIFIED: Object.freeze(["ROLLED_BACK", "ARCHIVED"] as const),
  REJECTED: Object.freeze(["ARCHIVED"] as const),
  SUPPRESSED: Object.freeze(["DRAFT", "ARCHIVED"] as const),
  ROLLED_BACK: Object.freeze(["ARCHIVED"] as const),
  ARCHIVED: Object.freeze([] as const),
});

type Scenario = NonNullable<ProposalLifecycleInput["scenario"]>;

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

function buildApiSurface(): ProposalLifecycleApiSurface {
  const base: Omit<ProposalLifecycleApiSurface, "integrity_hash"> = {
    api_id: "proposal_lifecycle_state_machine_api",
    evaluate_lifecycle: "POST /proposal-lifecycle-state-machine/evaluate",
    retrieve_transitions: "POST /proposal-lifecycle-state-machine/transitions",
    retrieve_states: "POST /proposal-lifecycle-state-machine/states",
    retrieve_metrics: "POST /proposal-lifecycle-state-machine/metrics",
    replay_lifecycle: "POST /proposal-lifecycle-state-machine/replay",
    inspect_lifecycle: "POST /proposal-lifecycle-state-machine/inspect",
    retrieve_contract: "GET /proposal-lifecycle-state-machine/contract",
    proposal_mutation_supported: false,
    governance_bypass_supported: false,
    certification_bypass_supported: false,
    implementation_authorization_supported: false,
    automatic_deployment_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function ledgerScenarioFor(scenario: Scenario): AdaptationProposalLedgerScenario {
  const map: Partial<Record<ProposalLifecycleScenario, AdaptationProposalLedgerScenario>> = {
    REPLAY_FAILURE: "MISSING_REPLAY",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    NONDETERMINISTIC_TRANSITION: "NONDETERMINISTIC_ORDERING",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    LEDGER_UNAVAILABLE: "MISSING_LINEAGE",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_MUTATION_ATTEMPT",
    HISTORY_REWRITE_ATTEMPT: "HISTORY_REWRITE_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): ProposalLifecycleFailure | undefined {
  const map: Partial<Record<ProposalLifecycleScenario, ProposalLifecycleFailure>> = {
    INVALID_CURRENT_STATE: "CURRENT_STATE_INVALID",
    UNAUTHORIZED_DESTINATION: "DESTINATION_STATE_UNAUTHORIZED",
    PREREQUISITES_INCOMPLETE: "TRANSITION_PREREQUISITES_INCOMPLETE",
    GOVERNANCE_FAILURE: "GOVERNANCE_VALIDATION_FAILED",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_VALIDATION_FAILED",
    AUTHORITY_VIOLATION: "AUTHORITY_BOUNDARY_VIOLATED",
    REPLAY_FAILURE: "REPLAY_VERIFICATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    NONDETERMINISTIC_TRANSITION: "DETERMINISTIC_TRANSITION_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    LEDGER_UNAVAILABLE: "LEDGER_HISTORY_UNAVAILABLE",
    ARCHIVED_REACTIVATION: "ARCHIVED_PROPOSAL_REACTIVATION_ATTEMPT",
    REJECTED_REACTIVATION: "REJECTED_PROPOSAL_REACTIVATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPT",
    OPERATOR_REVIEW_BYPASS: "OPERATOR_REVIEW_BYPASS_ATTEMPT",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS_ATTEMPT",
    HISTORY_REWRITE_ATTEMPT: "LIFECYCLE_HISTORY_REWRITE_ATTEMPT",
    STATE_OVERWRITE_ATTEMPT: "HISTORICAL_STATE_OVERWRITE_ATTEMPT",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "PRODUCTION_IMPLEMENTATION_AUTHORIZATION_ATTEMPT",
    AUTOMATIC_DEPLOYMENT_ATTEMPT: "AUTOMATIC_DEPLOYMENT_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromLedger(ledgerReplayable: boolean, ledgerFailures: readonly string[]): readonly ProposalLifecycleFailure[] {
  const failures: ProposalLifecycleFailure[] = [];
  if (!ledgerReplayable || ledgerFailures.includes("REPLAY_REFERENCES_INCOMPLETE")) failures.push("REPLAY_VERIFICATION_FAILED");
  if (ledgerFailures.includes("INTEGRITY_VERIFICATION_FAILED") || ledgerFailures.includes("HASH_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (ledgerFailures.includes("DETERMINISTIC_ORDERING_NOT_GUARANTEED")) failures.push("DETERMINISTIC_TRANSITION_NOT_GUARANTEED");
  if (ledgerFailures.includes("TENANT_ISOLATION_VIOLATED") || ledgerFailures.includes("CROSS_TENANT_RECORD_ATTEMPT")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (ledgerFailures.includes("LINEAGE_REFERENCES_MISSING")) failures.push("LEDGER_HISTORY_UNAVAILABLE");
  if (ledgerFailures.includes("PROPOSAL_CONTENT_MUTATION_ATTEMPT")) failures.push("PROPOSAL_CONTENT_MUTATION_ATTEMPT");
  if (ledgerFailures.includes("HISTORY_REWRITE_ATTEMPT")) failures.push("LIFECYCLE_HISTORY_REWRITE_ATTEMPT");
  if (ledgerFailures.includes("GOVERNANCE_HISTORY_BYPASS_ATTEMPT")) failures.push("GOVERNANCE_BYPASS_ATTEMPT");
  if (ledgerFailures.includes("CERTIFICATION_HISTORY_BYPASS_ATTEMPT")) failures.push("CERTIFICATION_BYPASS_ATTEMPT");
  if (ledgerFailures.includes("IMPLEMENTATION_AUTHORIZATION_ATTEMPT")) failures.push("PRODUCTION_IMPLEMENTATION_AUTHORIZATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, ledgerReplayable: boolean, ledgerFailures: readonly string[]): readonly ProposalLifecycleFailure[] {
  const failures: ProposalLifecycleFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromLedger(ledgerReplayable, ledgerFailures));
  return freezeArray([...new Set(failures)]);
}

function transitionPathFor(scenario: Scenario): readonly [ProposalLifecycleState, ProposalLifecycleState, string][] {
  if (scenario === "REJECTION_PATH") return freezeArray([["DRAFT", "VALIDATED", "proposal_validated"], ["VALIDATED", "REJECTED", "validation_or_review_rejection"], ["REJECTED", "ARCHIVED", "rejected_proposal_archived"]]);
  if (scenario === "SUPPRESSION_PATH") return freezeArray([["DRAFT", "VALIDATED", "proposal_validated"], ["VALIDATED", "SUPPRESSED", "suppression_decision"], ["SUPPRESSED", "ARCHIVED", "suppressed_proposal_archived"]]);
  if (scenario === "ROLLBACK_PATH") return freezeArray([
    ["DRAFT", "VALIDATED", "proposal_validated"],
    ["VALIDATED", "REQUIRES_SIMULATION", "simulation_required"],
    ["REQUIRES_SIMULATION", "REQUIRES_GOVERNANCE_REVIEW", "simulation_prerequisite_satisfied"],
    ["REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW", "governance_review_complete"],
    ["REQUIRES_OPERATOR_REVIEW", "APPROVED_FOR_CERTIFICATION", "operator_review_complete"],
    ["APPROVED_FOR_CERTIFICATION", "CERTIFIED", "certification_complete"],
    ["CERTIFIED", "ROLLED_BACK", "rollback_validated"],
    ["ROLLED_BACK", "ARCHIVED", "rollback_history_archived"],
  ]);
  if (scenario === "UNAUTHORIZED_DESTINATION" || scenario === "GOVERNANCE_BYPASS") return freezeArray([["DRAFT", "CERTIFIED", "illegal_stage_skip"]]);
  if (scenario === "OPERATOR_REVIEW_BYPASS") return freezeArray([["VALIDATED", "APPROVED_FOR_CERTIFICATION", "operator_review_bypass_attempt"]]);
  if (scenario === "CERTIFICATION_BYPASS") return freezeArray([["REQUIRES_OPERATOR_REVIEW", "CERTIFIED", "certification_bypass_attempt"]]);
  if (scenario === "ARCHIVED_REACTIVATION") return freezeArray([["ARCHIVED", "DRAFT", "archived_reactivation_attempt"]]);
  if (scenario === "REJECTED_REACTIVATION") return freezeArray([["REJECTED", "VALIDATED", "rejected_reactivation_attempt"]]);
  return freezeArray([
    ["DRAFT", "VALIDATED", "proposal_validated"],
    ["VALIDATED", "REQUIRES_SIMULATION", "simulation_required"],
    ["REQUIRES_SIMULATION", "REQUIRES_GOVERNANCE_REVIEW", "simulation_prerequisite_satisfied"],
    ["REQUIRES_GOVERNANCE_REVIEW", "REQUIRES_OPERATOR_REVIEW", "governance_review_complete"],
    ["REQUIRES_OPERATOR_REVIEW", "APPROVED_FOR_CERTIFICATION", "operator_review_complete"],
    ["APPROVED_FOR_CERTIFICATION", "CERTIFIED", "certification_complete"],
    ["CERTIFIED", "ARCHIVED", "certified_proposal_archived_without_deployment"],
  ]);
}

function proposalIdFromLedger(ledgerResult: ProposalLifecycleResult["ledger_result"]): string {
  return ledgerResult.query_index.proposal_ids[0] ?? "proposal_unavailable";
}

function transitionFor(
  proposalId: string,
  source: ProposalLifecycleState,
  destination: ProposalLifecycleState,
  reason: string,
  index: number,
  replayReference: string,
  ledgerReference: string,
  failures: readonly ProposalLifecycleFailure[],
): ProposalLifecycleTransition {
  const allowed = ALLOWED_TRANSITIONS[source].includes(destination);
  const accepted = failures.length === 0 && allowed;
  const base: Omit<ProposalLifecycleTransition, "integrity_hash"> = {
    transition_id: `proposal_lifecycle_transition_${hash(`${proposalId}:${source}:${destination}:${index}:${reason}`).slice(0, 14)}`,
    proposal_id: proposalId,
    source_state: source,
    destination_state: destination,
    transition_timestamp: new Date(Date.parse(STARTED_AT) + (index + 1) * 1000).toISOString(),
    transition_reason: reason,
    initiating_component: "proposal-lifecycle-state-machine",
    approval_references: freezeArray([`approval_ref:${destination.toLowerCase()}`]),
    governance_references: freezeArray([`governance_ref:${source.toLowerCase()}_${destination.toLowerCase()}`]),
    replay_reference: replayReference,
    ledger_reference: ledgerReference,
    allowed_transition: allowed,
    prerequisites_satisfied: failures.length === 0,
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("GOVERNANCE_BYPASS_ATTEMPT"),
    constitutional_validated: !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    authority_validated: !failures.includes("AUTHORITY_BOUNDARY_VIOLATED"),
    replay_verified: !failures.includes("REPLAY_VERIFICATION_FAILED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    outcome: accepted ? "ACCEPTED" : "REJECTED_AUDITED",
    audit_event: !accepted,
    advisory_only: true,
    modifies_proposal: false,
    authorizes_implementation: false,
    performs_deployment: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function transitionsFor(scenario: Scenario, ledgerResult: ProposalLifecycleResult["ledger_result"], failures: readonly ProposalLifecycleFailure[]): readonly ProposalLifecycleTransition[] {
  const proposalId = proposalIdFromLedger(ledgerResult);
  const replayReference = ledgerResult.query_index.replay_identifiers[0] ?? ledgerResult.replay_hash;
  const ledgerReference = ledgerResult.ledger_entries[0]?.ledger_entry_id ?? ledgerResult.integrity_hash;
  return freezeArray(transitionPathFor(scenario).map(([source, destination, reason], index) => transitionFor(proposalId, source, destination, reason, index, replayReference, ledgerReference, failures)));
}

function currentStatesFor(transitions: readonly ProposalLifecycleTransition[]): Readonly<Record<string, ProposalLifecycleState>> {
  const accepted = transitions.filter((transition) => transition.outcome === "ACCEPTED");
  const last = accepted.at(-1);
  return Object.freeze({ [transitions[0]?.proposal_id ?? "proposal_unavailable"]: last?.destination_state ?? transitions[0]?.source_state ?? "DRAFT" });
}

function stateCounts(currentStates: Readonly<Record<string, ProposalLifecycleState>>): Readonly<Record<ProposalLifecycleState, number>> {
  const counts = STATES.reduce((acc, state) => ({ ...acc, [state]: 0 }), {} as Record<ProposalLifecycleState, number>);
  Object.values(currentStates).forEach((state) => {
    counts[state] += 1;
  });
  return Object.freeze(counts);
}

function transitionFrequency(transitions: readonly ProposalLifecycleTransition[]): Readonly<Record<string, number>> {
  const counts: Record<string, number> = {};
  transitions.forEach((transition) => {
    const key = `${transition.source_state}->${transition.destination_state}`;
    counts[key] = (counts[key] ?? 0) + 1;
  });
  return Object.freeze(counts);
}

function metricsFor(transitions: readonly ProposalLifecycleTransition[], currentStates: Readonly<Record<string, ProposalLifecycleState>>, failures: readonly ProposalLifecycleFailure[]): ProposalLifecycleMetrics {
  const base: Omit<ProposalLifecycleMetrics, "integrity_hash"> = {
    proposals_by_state: stateCounts(currentStates),
    transition_frequency: transitionFrequency(transitions),
    transition_latency_ms: 0,
    rejected_transitions: transitions.filter((transition) => transition.outcome === "REJECTED_AUDITED").length,
    suppressed_proposals: transitions.filter((transition) => transition.destination_state === "SUPPRESSED" && transition.outcome === "ACCEPTED").length,
    certification_progression: transitions.filter((transition) => transition.destination_state === "CERTIFIED" && transition.outcome === "ACCEPTED").length,
    rollback_frequency: transitions.filter((transition) => transition.destination_state === "ROLLED_BACK" && transition.outcome === "ACCEPTED").length,
    archival_frequency: transitions.filter((transition) => transition.destination_state === "ARCHIVED" && transition.outcome === "ACCEPTED").length,
    illegal_transition_attempts: transitions.filter((transition) => !transition.allowed_transition).length,
    replay_success_rate: failures.length === 0 ? 1 : 0,
    lifecycle_validation_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly ProposalLifecycleFailure[]): ProposalLifecycleStateMachineState {
  return failures.length ? "FAIL_CLOSED" : "EVALUATED";
}

function resultReplayHash(result: Omit<ProposalLifecycleResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    ledger_hash: result.ledger_result.integrity_hash,
    transition_hashes: result.transitions.map((transition) => transition.integrity_hash),
    current_states: result.current_states,
    metrics_hash: result.metrics.integrity_hash,
    state: result.state_machine_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<ProposalLifecycleResult, "integrity_hash">): string {
  return hash({
    version: result.proposal_lifecycle_state_machine_version,
    transition_rule_version: result.transition_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function evaluateProposalLifecycle(input: ProposalLifecycleInput = {}): ProposalLifecycleResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const ledger_result = input.ledger_result ?? commitAdaptationProposalLedger({ scenario: ledgerScenarioFor(scenario) });
  const failures = collectFailures(scenario, replayAdaptationProposalLedger(ledger_result), ledger_result.failures);
  const transitions = transitionsFor(scenario, ledger_result, failures);
  const current_states = currentStatesFor(transitions);
  const metrics = metricsFor(transitions, current_states, failures);
  const base: Omit<ProposalLifecycleResult, "integrity_hash" | "replay_hash"> = {
    proposal_lifecycle_state_machine_version: ENGINE_VERSION,
    transition_rule_version: RULE_VERSION,
    api_surface,
    ledger_result,
    transitions,
    current_states,
    allowed_transitions: ALLOWED_TRANSITIONS,
    metrics,
    state_machine_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayAdaptationProposalLedger(ledger_result),
    lifecycle_history_immutable: failures.length === 0 && ledger_result.immutable_storage_verified,
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && ledger_result.tenant_isolated,
    governance_enforced: !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("GOVERNANCE_BYPASS_ATTEMPT"),
    constitutional_enforced: !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    authority_boundaries_enforced: !failures.includes("AUTHORITY_BOUNDARY_VIOLATED"),
    advisory_only: true,
    modifies_proposals: false,
    rewrites_lifecycle_history: false,
    overwrites_historical_states: false,
    authorizes_implementation: false,
    performs_automatic_deployment: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayProposalLifecycle(result: ProposalLifecycleResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
}

export function getProposalLifecycleFoundation(): ProposalLifecycleFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    proposal_lifecycle_state_machine_version: ENGINE_VERSION,
    canonical_states: STATES,
    allowed_transitions: ALLOWED_TRANSITIONS,
    api_surface,
    result: evaluateProposalLifecycle(),
  });
}

export const ProposalLifecycleStateMachine = Object.freeze({
  evaluate: evaluateProposalLifecycle,
  replay: replayProposalLifecycle,
});
