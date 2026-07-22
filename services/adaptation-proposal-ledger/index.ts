import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { bindProposalLineage, replayProposalLineageBinding } from "@/services/proposal-lineage-replay-binder";
import type { ProposalLineageReplayScenario, ProposalLineageRecord } from "@/types/proposal-lineage-replay-binder";
import type {
  AdaptationProposalLedgerApiSurface,
  AdaptationProposalLedgerEntry,
  AdaptationProposalLedgerEventType,
  AdaptationProposalLedgerFailure,
  AdaptationProposalLedgerFoundation,
  AdaptationProposalLedgerInput,
  AdaptationProposalLedgerMetrics,
  AdaptationProposalLedgerQueryIndex,
  AdaptationProposalLedgerResult,
  AdaptationProposalLedgerScenario,
  AdaptationProposalLedgerState,
} from "@/types/adaptation-proposal-ledger";

const LEDGER_VERSION = "adaptation-proposal-ledger/v1" as const;
const RULE_VERSION = "adaptation-proposal-ledger-rules/v1" as const;
const LEDGER_START = "2026-07-10T00:00:00.000Z";
const GENESIS_HASH = "GENESIS";

const EVENT_TYPES: readonly AdaptationProposalLedgerEventType[] = Object.freeze([
  "PROPOSAL_CREATED",
  "PROPOSAL_VALIDATED",
  "PROPOSAL_SCORED",
  "PROPOSAL_PRIORITIZED",
  "PROPOSAL_SUPPRESSED",
  "PROPOSAL_CONSOLIDATED",
  "SIMULATION_ROUTED",
  "GOVERNANCE_REVIEWED",
  "OPERATOR_REVIEWED",
  "CERTIFICATION_ROUTED",
  "APPROVAL_RECORDED",
  "REJECTION_RECORDED",
  "ROLLBACK_PLANNED",
  "ARCHIVED",
]);

type Scenario = NonNullable<AdaptationProposalLedgerInput["scenario"]>;

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueSorted(values: readonly string[]): readonly string[] {
  return freezeArray([...new Set(values.filter(Boolean))].sort());
}

function hash(value: unknown): string {
  return generateDecisionIntegrityHash(value);
}

function hashWithoutIntegrity<T extends object>(value: T): string {
  const copy = { ...value } as Record<string, unknown>;
  delete copy.integrity_hash;
  return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown);
}

function buildApiSurface(): AdaptationProposalLedgerApiSurface {
  const base: Omit<AdaptationProposalLedgerApiSurface, "integrity_hash"> = {
    api_id: "adaptation_proposal_ledger_api",
    commit_ledger: "POST /adaptation-proposal-ledger/commit",
    retrieve_entries: "POST /adaptation-proposal-ledger/entries",
    query_ledger: "POST /adaptation-proposal-ledger/query",
    retrieve_metrics: "POST /adaptation-proposal-ledger/metrics",
    replay_ledger: "POST /adaptation-proposal-ledger/replay",
    inspect_ledger: "POST /adaptation-proposal-ledger/inspect",
    retrieve_contract: "GET /adaptation-proposal-ledger/contract",
    proposal_mutation_supported: false,
    history_rewrite_supported: false,
    entry_deletion_supported: false,
    implementation_authorization_supported: false,
    advisory_only: true,
    fail_open_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function lineageScenarioFor(scenario: Scenario): ProposalLineageReplayScenario {
  const map: Partial<Record<AdaptationProposalLedgerScenario, ProposalLineageReplayScenario>> = {
    DUPLICATE_CONSOLIDATION: "DUPLICATE_CONSOLIDATION",
    OVERLAPPING_CONSOLIDATION: "OVERLAPPING_CONSOLIDATION",
    CONFLICTING_RELATIONSHIP: "CONFLICTING_RELATIONSHIP",
    PROPOSAL_VALIDATION_FAILURE: "MISSING_REFERENCES",
    INTEGRITY_FAILURE: "INTEGRITY_FAILURE",
    MISSING_REPLAY: "REPLAY_GRAPH_FAILURE",
    MISSING_LINEAGE: "MISSING_REFERENCES",
    NONDETERMINISTIC_ORDERING: "NONDETERMINISTIC_REPLAY",
    TENANT_VIOLATION: "TENANT_VIOLATION",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_MUTATION_ATTEMPT",
    HISTORY_REWRITE_ATTEMPT: "HISTORICAL_MUTATION_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS",
    CERTIFICATION_BYPASS: "CERTIFICATION_BYPASS",
    CROSS_TENANT_RECORD: "CROSS_TENANT_LINEAGE",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_ATTEMPT",
  };
  return map[scenario] ?? "BASELINE";
}

function directFailureFor(scenario: Scenario): AdaptationProposalLedgerFailure | undefined {
  const map: Partial<Record<AdaptationProposalLedgerScenario, AdaptationProposalLedgerFailure>> = {
    PROPOSAL_VALIDATION_FAILURE: "PROPOSAL_VALIDATION_FAILED",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    HASH_FAILURE: "HASH_VERIFICATION_FAILED",
    SEQUENCE_BREAK: "SEQUENCE_CONTINUITY_BROKEN",
    MISSING_REPLAY: "REPLAY_REFERENCES_INCOMPLETE",
    MISSING_LINEAGE: "LINEAGE_REFERENCES_MISSING",
    DUPLICATE_EVENT: "DUPLICATE_EVENT_IDENTIFIER",
    NONDETERMINISTIC_ORDERING: "DETERMINISTIC_ORDERING_NOT_GUARANTEED",
    TENANT_VIOLATION: "TENANT_ISOLATION_VIOLATED",
    EVENT_AUTHENTICITY_FAILURE: "EVENT_AUTHENTICITY_FAILED",
    PROPOSAL_MUTATION_ATTEMPT: "PROPOSAL_CONTENT_MUTATION_ATTEMPT",
    HISTORY_REWRITE_ATTEMPT: "HISTORY_REWRITE_ATTEMPT",
    ENTRY_REMOVAL_ATTEMPT: "HISTORICAL_ENTRY_REMOVAL_ATTEMPT",
    INTEGRITY_BYPASS: "INTEGRITY_BYPASS_ATTEMPT",
    REPLAY_BYPASS: "REPLAY_RECORDING_BYPASS_ATTEMPT",
    GOVERNANCE_BYPASS: "GOVERNANCE_HISTORY_BYPASS_ATTEMPT",
    CERTIFICATION_BYPASS: "CERTIFICATION_HISTORY_BYPASS_ATTEMPT",
    CROSS_TENANT_RECORD: "CROSS_TENANT_RECORD_ATTEMPT",
    IMPLEMENTATION_ATTEMPT: "IMPLEMENTATION_AUTHORIZATION_ATTEMPT",
  };
  return map[scenario];
}

function failuresFromLineage(lineageReplayable: boolean, lineageFailures: readonly string[]): readonly AdaptationProposalLedgerFailure[] {
  const failures: AdaptationProposalLedgerFailure[] = [];
  if (lineageFailures.includes("REQUIRED_REFERENCES_MISSING")) failures.push("LINEAGE_REFERENCES_MISSING");
  if (lineageFailures.includes("REPLAY_GRAPH_GENERATION_FAILED")) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (!lineageReplayable || lineageFailures.includes("INTEGRITY_VERIFICATION_FAILED")) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (lineageFailures.includes("DETERMINISTIC_REPLAY_NOT_GUARANTEED")) failures.push("DETERMINISTIC_ORDERING_NOT_GUARANTEED");
  if (lineageFailures.includes("TENANT_ISOLATION_VIOLATED") || lineageFailures.includes("CROSS_TENANT_LINEAGE_ATTEMPT")) failures.push("TENANT_ISOLATION_VIOLATED");
  if (lineageFailures.includes("PROPOSAL_CONTENT_MUTATION_ATTEMPT")) failures.push("PROPOSAL_CONTENT_MUTATION_ATTEMPT");
  if (lineageFailures.includes("HISTORICAL_RECORD_MUTATION_ATTEMPT")) failures.push("HISTORY_REWRITE_ATTEMPT");
  if (lineageFailures.includes("GOVERNANCE_HISTORY_BYPASS_ATTEMPT")) failures.push("GOVERNANCE_HISTORY_BYPASS_ATTEMPT");
  if (lineageFailures.includes("CERTIFICATION_HISTORY_BYPASS_ATTEMPT")) failures.push("CERTIFICATION_HISTORY_BYPASS_ATTEMPT");
  if (lineageFailures.includes("PROPOSAL_IMPLEMENTATION_ATTEMPT")) failures.push("IMPLEMENTATION_AUTHORIZATION_ATTEMPT");
  return freezeArray([...new Set(failures)]);
}

function collectFailures(scenario: Scenario, lineageReplayable: boolean, lineageFailures: readonly string[], recordCount: number): readonly AdaptationProposalLedgerFailure[] {
  const failures: AdaptationProposalLedgerFailure[] = [];
  const direct = directFailureFor(scenario);
  if (direct) failures.push(direct);
  failures.push(...failuresFromLineage(lineageReplayable, lineageFailures));
  if (recordCount === 0) failures.push("LINEAGE_REFERENCES_MISSING");
  return freezeArray([...new Set(failures)]);
}

function timestampFor(sequence: number): string {
  return new Date(Date.parse(LEDGER_START) + sequence * 1000).toISOString();
}

function componentFor(eventType: AdaptationProposalLedgerEventType): string {
  const map: Record<AdaptationProposalLedgerEventType, string> = {
    PROPOSAL_CREATED: "adaptation-proposal-generator",
    PROPOSAL_VALIDATED: "adaptation-proposal-contract",
    PROPOSAL_SCORED: "adaptation-scoring-engine",
    PROPOSAL_PRIORITIZED: "adaptation-prioritization-engine",
    PROPOSAL_SUPPRESSED: "adaptation-suppression-engine",
    PROPOSAL_CONSOLIDATED: "adaptation-consolidation-engine",
    SIMULATION_ROUTED: "adaptation-simulation-framework",
    GOVERNANCE_REVIEWED: "governance-adaptation-validator",
    OPERATOR_REVIEWED: "operator-feedback-governance-validation",
    CERTIFICATION_ROUTED: "adaptive-intelligence-certification-gate",
    APPROVAL_RECORDED: "operator-approval-framework",
    REJECTION_RECORDED: "operator-feedback-ledger",
    ROLLBACK_PLANNED: "rollback-recovery-planning",
    ARCHIVED: "adaptation-proposal-ledger",
  };
  return map[eventType];
}

function lifecycleStateFor(eventType: AdaptationProposalLedgerEventType): string {
  return eventType.toLowerCase();
}

function entryFor(record: ProposalLineageRecord, eventType: AdaptationProposalLedgerEventType, sequence: number, previousHash: string): AdaptationProposalLedgerEntry {
  const base: Omit<AdaptationProposalLedgerEntry, "entry_hash" | "integrity_hash"> = {
    ledger_entry_id: `adaptation_ledger_entry_${hash(`${record.lineage_id}:${eventType}:${sequence}`).slice(0, 14)}`,
    proposal_id: record.proposal_id,
    tenant_id: "tenant_current",
    event_type: eventType,
    event_timestamp: timestampFor(sequence),
    event_sequence_number: sequence,
    originating_component: componentFor(eventType),
    referenced_proposal_version: record.binder_version,
    replay_reference: record.replay_graph.replay_graph_id,
    lineage_reference: record.lineage_id,
    lifecycle_state: lifecycleStateFor(eventType),
    proposal_integrity_hash: record.integrity_hash,
    lineage_integrity_hash: record.integrity_hash,
    previous_ledger_hash: previousHash,
    ledger_version: LEDGER_VERSION,
    immutable: true,
    append_only: true,
  };
  const entry_hash = hash({ ...base, event_payload_hash: record.integrity_hash });
  return Object.freeze({ ...base, entry_hash, integrity_hash: hash({ ...base, entry_hash }) });
}

function entriesFor(records: readonly ProposalLineageRecord[]): readonly AdaptationProposalLedgerEntry[] {
  const entries: AdaptationProposalLedgerEntry[] = [];
  let previous = GENESIS_HASH;
  records.forEach((record) => {
    EVENT_TYPES.forEach((eventType) => {
      const entry = entryFor(record, eventType, entries.length + 1, previous);
      entries.push(entry);
      previous = entry.entry_hash;
    });
  });
  return freezeArray(entries);
}

function verifyHashChain(entries: readonly AdaptationProposalLedgerEntry[]): boolean {
  return entries.every((entry, index) => entry.previous_ledger_hash === (index === 0 ? GENESIS_HASH : entries[index - 1]?.entry_hash));
}

function queryIndexFor(entries: readonly AdaptationProposalLedgerEntry[]): AdaptationProposalLedgerQueryIndex {
  const base: Omit<AdaptationProposalLedgerQueryIndex, "integrity_hash"> = {
    proposal_ids: uniqueSorted(entries.map((entry) => entry.proposal_id)),
    tenant_ids: uniqueSorted(entries.map((entry) => entry.tenant_id)),
    event_types: freezeArray(EVENT_TYPES.filter((type) => entries.some((entry) => entry.event_type === type))),
    lifecycle_states: uniqueSorted(entries.map((entry) => entry.lifecycle_state)),
    proposal_versions: uniqueSorted(entries.map((entry) => entry.referenced_proposal_version)),
    governance_decisions: freezeArray(["governance_review_recorded"]),
    certification_statuses: freezeArray(["certification_routing_recorded"]),
    simulation_identifiers: uniqueSorted(entries.filter((entry) => entry.event_type === "SIMULATION_ROUTED").map((entry) => entry.replay_reference)),
    replay_identifiers: uniqueSorted(entries.map((entry) => entry.replay_reference)),
    lineage_identifiers: uniqueSorted(entries.map((entry) => entry.lineage_reference)),
    time_range: Object.freeze({ start: entries[0]?.event_timestamp ?? LEDGER_START, end: entries.at(-1)?.event_timestamp ?? LEDGER_START }),
    tenant_isolated: true,
    deterministic: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function eventCounts(entries: readonly AdaptationProposalLedgerEntry[]): Readonly<Record<AdaptationProposalLedgerEventType, number>> {
  const counts = EVENT_TYPES.reduce((acc, type) => ({ ...acc, [type]: 0 }), {} as Record<AdaptationProposalLedgerEventType, number>);
  entries.forEach((entry) => {
    counts[entry.event_type] += 1;
  });
  return Object.freeze(counts);
}

function metricsFor(entries: readonly AdaptationProposalLedgerEntry[], failures: readonly AdaptationProposalLedgerFailure[], hashChainValid: boolean): AdaptationProposalLedgerMetrics {
  const base: Omit<AdaptationProposalLedgerMetrics, "integrity_hash"> = {
    ledger_entries_committed: entries.length,
    proposal_lifecycle_events: eventCounts(entries),
    hash_verification_success: failures.length === 0 && hashChainValid,
    replay_reconstruction_success: failures.length === 0,
    lineage_completeness: failures.length === 0,
    append_latency_ms: 0,
    sequence_validation_failures: failures.includes("SEQUENCE_CONTINUITY_BROKEN") ? 1 : 0,
    integrity_violations: failures.filter((failure) => ["INTEGRITY_VERIFICATION_FAILED", "HASH_VERIFICATION_FAILED", "INTEGRITY_BYPASS_ATTEMPT"].includes(failure)).length,
    archival_events: entries.filter((entry) => entry.event_type === "ARCHIVED").length,
    tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") || failures.includes("CROSS_TENANT_RECORD_ATTEMPT") ? 1 : 0,
    deterministic_replay_success: failures.length === 0,
    validation_failures: failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function stateFor(failures: readonly AdaptationProposalLedgerFailure[]): AdaptationProposalLedgerState {
  return failures.length ? "FAIL_CLOSED" : "COMMITTED";
}

function resultReplayHash(result: Omit<AdaptationProposalLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    lineage_hash: result.lineage_result.integrity_hash,
    entry_hashes: result.ledger_entries.map((entry) => entry.entry_hash),
    query_hash: result.query_index.integrity_hash,
    metrics_hash: result.metrics.integrity_hash,
    state: result.ledger_state,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<AdaptationProposalLedgerResult, "integrity_hash">): string {
  return hash({
    version: result.adaptation_proposal_ledger_version,
    ledger_rule_version: result.ledger_rule_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    metrics_hash: result.metrics.integrity_hash,
  });
}

export function commitAdaptationProposalLedger(input: AdaptationProposalLedgerInput = {}): AdaptationProposalLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const lineage_result = input.lineage_result ?? bindProposalLineage({ scenario: lineageScenarioFor(scenario) });
  const initialFailures = collectFailures(scenario, replayProposalLineageBinding(lineage_result), lineage_result.failures, lineage_result.lineage_records.length);
  const ledger_entries = initialFailures.length === 0 ? entriesFor(lineage_result.lineage_records) : freezeArray<AdaptationProposalLedgerEntry>([]);
  const hashChainValid = initialFailures.length === 0 && verifyHashChain(ledger_entries);
  const failures = freezeArray([...initialFailures, ...(hashChainValid || initialFailures.length ? [] : ["HASH_VERIFICATION_FAILED" as const])]);
  const query_index = queryIndexFor(ledger_entries);
  const metrics = metricsFor(ledger_entries, failures, hashChainValid);
  const base: Omit<AdaptationProposalLedgerResult, "integrity_hash" | "replay_hash"> = {
    adaptation_proposal_ledger_version: LEDGER_VERSION,
    ledger_rule_version: RULE_VERSION,
    api_surface,
    lineage_result,
    ledger_entries,
    query_index,
    metrics,
    ledger_state: stateFor(failures),
    failures,
    deterministic: true,
    replayable: failures.length === 0 && replayProposalLineageBinding(lineage_result),
    hash_chain_valid: hashChainValid,
    append_only: failures.length === 0 && ledger_entries.every((entry) => entry.append_only),
    immutable_storage_verified: failures.length === 0 && ledger_entries.every((entry) => entry.immutable),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED") && !failures.includes("CROSS_TENANT_RECORD_ATTEMPT") && lineage_result.tenant_isolated,
    advisory_only: true,
    modifies_proposals: false,
    rewrites_history: false,
    removes_historical_entries: false,
    authorizes_implementation: false,
    changes_production_behavior: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayAdaptationProposalLedger(result: AdaptationProposalLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && verifyHashChain(result.ledger_entries);
}

export function getAdaptationProposalLedgerFoundation(): AdaptationProposalLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    adaptation_proposal_ledger_version: LEDGER_VERSION,
    supported_event_types: EVENT_TYPES,
    api_surface,
    result: commitAdaptationProposalLedger(),
  });
}

export const AdaptationProposalLedger = Object.freeze({
  commit: commitAdaptationProposalLedger,
  replay: replayAdaptationProposalLedger,
});
