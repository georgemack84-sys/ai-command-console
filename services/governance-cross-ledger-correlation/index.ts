import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildGovernanceQueryContract } from "@/services/governance-query-contract";
import { reconstructHistoricalGovernance } from "@/services/governance-historical-reconstruction";
import type { GovernanceQueryContract, GovernanceQueryErrorState, GovernanceQueryValidationIssue } from "@/types/governance-query-contract";
import type { GovernanceHistoricalLedgerRecord, GovernanceHistoricalReconstructionResponse } from "@/types/governance-historical-reconstruction";
import type { GovernanceSearchDomain } from "@/types/governance-search-engine";
import type {
  GovernanceCorrelation,
  GovernanceCorrelationErrorState,
  GovernanceCorrelationLedger,
  GovernanceCorrelationRelationshipType,
  GovernanceCorrelationScenario,
  GovernanceCorrelationState,
  GovernanceCorrelationValidation,
  GovernanceCrossLedgerCorrelationInput,
  GovernanceCrossLedgerCorrelationObservabilitySurface,
  GovernanceCrossLedgerCorrelationResponse,
  GovernanceRelationshipGraph,
  GovernanceRelationshipGraphEdge,
  GovernanceRelationshipGraphNode,
  GovernanceReplayCorrelation,
} from "@/types/governance-cross-ledger-correlation";

const NOW = "2026-06-27T14:00:00.000Z";
const SCHEMA_VERSION = "governance-cross-ledger-correlation/v7J.4" as const;
const GRAPH_VERSION = "governance-relationship-graph/v7J.4" as const;

const LEDGER_BY_DOMAIN: Readonly<Record<GovernanceSearchDomain, GovernanceCorrelationLedger>> = Object.freeze({
  AUDIT: "TRUTH_LEDGER",
  CERTIFICATION: "INTEGRITY_LEDGER",
  COMPLIANCE: "COMPLIANCE_LEDGER",
  ESCALATION: "ESCALATION_LEDGER",
  EVIDENCE: "EVIDENCE_LEDGER",
  LINEAGE: "LINEAGE_LEDGER",
  POLICY: "POLICY_LEDGER",
  RECOMMENDATION: "RECOMMENDATION_LEDGER",
  REPLAY: "REPLAY_LEDGER",
  RISK: "RISK_LEDGER",
  TRUTH_LEDGER: "TRUTH_LEDGER",
  VIOLATION: "TRUTH_LEDGER",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function issue(state: GovernanceCorrelationErrorState, path: string, message: string): GovernanceQueryValidationIssue {
  const queryState: Record<GovernanceCorrelationErrorState, GovernanceQueryErrorState> = {
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    CORRELATION_NOT_FOUND: "VALIDATION_FAILED",
    EVIDENCE_MISSING: "VALIDATION_FAILED",
    HASH_MISMATCH: "VALIDATION_FAILED",
    LEDGER_REFERENCE_INVALID: "VALIDATION_FAILED",
    LINEAGE_BROKEN: "INVALID_LINEAGE_REFERENCE",
    RELATIONSHIP_INCONSISTENT: "VALIDATION_FAILED",
    REPLAY_CORRELATION_FAILED: "INVALID_REPLAY_REFERENCE",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATION",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryContractForScenario(input: GovernanceCrossLedgerCorrelationInput): GovernanceQueryContract {
  if (input.query_contract) return input.query_contract;
  if (input.scenario === "TENANT_ISOLATION_VIOLATION") return buildGovernanceQueryContract({ scenario: "TENANT_ISOLATION_VIOLATION" });
  if (input.scenario === "CONSTITUTIONAL_VIOLATION") return buildGovernanceQueryContract({ scenario: "CONSTITUTIONAL_VIOLATION" });
  return buildGovernanceQueryContract({ query_type: "CROSS_LEDGER_QUERY", target_object: "TRUTH_RECORD", authorization_level: "GOVERNANCE" });
}

function historicalForInput(input: GovernanceCrossLedgerCorrelationInput, contract: GovernanceQueryContract): GovernanceHistoricalReconstructionResponse {
  if (input.historical_response) return input.historical_response;
  return reconstructHistoricalGovernance({ query_contract: contract, ledger_records: input.ledger_records });
}

function recordFor(records: readonly GovernanceHistoricalLedgerRecord[], domain: GovernanceSearchDomain): GovernanceHistoricalLedgerRecord | undefined {
  return records.find((record) => record.domain === domain);
}

function correlationSource(
  contract: GovernanceQueryContract,
  source: GovernanceHistoricalLedgerRecord,
  target: GovernanceHistoricalLedgerRecord,
  relationship_type: GovernanceCorrelationRelationshipType,
): Omit<GovernanceCorrelation, "correlation_hash"> {
  return {
    correlation_id: `GCL-7J4-${hashValue("governance-correlation-id", { source: source.immutable_identifier, target: target.immutable_identifier, relationship_type }).slice(0, 10).toUpperCase()}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    source_ledger: LEDGER_BY_DOMAIN[source.domain],
    source_object: source.immutable_identifier,
    target_ledger: LEDGER_BY_DOMAIN[target.domain],
    target_object: target.immutable_identifier,
    relationship_type,
    supporting_evidence: freezeArray([...source.evidence_refs, ...target.evidence_refs].sort()),
    lineage_reference: source.lineage_refs[0] ?? target.lineage_refs[0] ?? "",
    replay_reference: source.replay_refs[0] ?? target.replay_refs[0] ?? "",
    correlation_confidence: Math.min(0.99, Number(((source.confidence + target.confidence) / 2).toFixed(4))),
    created_timestamp: NOW,
  };
}

function buildCorrelation(
  contract: GovernanceQueryContract,
  source: GovernanceHistoricalLedgerRecord | undefined,
  target: GovernanceHistoricalLedgerRecord | undefined,
  relationship_type: GovernanceCorrelationRelationshipType,
): GovernanceCorrelation | null {
  if (!source || !target) return null;
  const sourcePayload = correlationSource(contract, source, target, relationship_type);
  return Object.freeze({ ...sourcePayload, correlation_hash: hashValue("governance-cross-ledger-correlation", sourcePayload) });
}

function discoverCorrelations(contract: GovernanceQueryContract, records: readonly GovernanceHistoricalLedgerRecord[], scenario: GovernanceCorrelationScenario | undefined): readonly GovernanceCorrelation[] {
  const candidates = [
    buildCorrelation(contract, recordFor(records, "POLICY"), recordFor(records, "RECOMMENDATION"), "INFLUENCES"),
    buildCorrelation(contract, recordFor(records, "RECOMMENDATION"), recordFor(records, "EVIDENCE"), "SUPPORTS"),
    buildCorrelation(contract, recordFor(records, "EVIDENCE"), recordFor(records, "RISK"), "SUPPORTS"),
    buildCorrelation(contract, recordFor(records, "RISK"), recordFor(records, "ESCALATION"), "ESCALATES"),
    buildCorrelation(contract, recordFor(records, "ESCALATION"), recordFor(records, "COMPLIANCE"), "INFLUENCES"),
    buildCorrelation(contract, recordFor(records, "COMPLIANCE"), recordFor(records, "CERTIFICATION"), "VALIDATES"),
    buildCorrelation(contract, recordFor(records, "REPLAY"), recordFor(records, "TRUTH_LEDGER"), "RECONSTRUCTED_BY"),
    buildCorrelation(contract, recordFor(records, "LINEAGE"), recordFor(records, "POLICY"), "PARENT_OF"),
  ].filter((correlation): correlation is GovernanceCorrelation => Boolean(correlation));
  if (scenario === "CORRELATION_NOT_FOUND") return freezeArray([]);
  if (scenario === "EVIDENCE_MISSING") return freezeArray(candidates.map((correlation, index) => index === 0 ? Object.freeze({ ...correlation, supporting_evidence: [] }) : correlation));
  if (scenario === "LINEAGE_BROKEN") return freezeArray(candidates.map((correlation, index) => index === 1 ? Object.freeze({ ...correlation, lineage_reference: "" }) : correlation));
  if (scenario === "REPLAY_CORRELATION_FAILED") return freezeArray(candidates.map((correlation, index) => index === 2 ? Object.freeze({ ...correlation, replay_reference: "" }) : correlation));
  if (scenario === "RELATIONSHIP_INCONSISTENT") return freezeArray(candidates.map((correlation, index) => index === 3 ? Object.freeze({ ...correlation, source_object: correlation.target_object }) : correlation));
  if (scenario === "HASH_MISMATCH") return freezeArray(candidates.map((correlation, index) => index === 4 ? Object.freeze({ ...correlation, correlation_hash: `${correlation.correlation_hash}:mismatch` }) : correlation));
  return freezeArray(candidates);
}

function nodeFor(record: GovernanceHistoricalLedgerRecord): GovernanceRelationshipGraphNode {
  const source = {
    node_id: `GCGN-7J4-${hashValue("governance-correlation-node-id", record.immutable_identifier).slice(0, 10).toUpperCase()}`,
    ledger: LEDGER_BY_DOMAIN[record.domain],
    object_ref: record.immutable_identifier,
    domain: record.domain,
    label: record.title,
  };
  return Object.freeze({ ...source, node_hash: hashValue("governance-correlation-graph-node", source) });
}

function sortNodes(nodes: readonly GovernanceRelationshipGraphNode[]): readonly GovernanceRelationshipGraphNode[] {
  return freezeArray([...nodes].sort((a, b) => a.ledger.localeCompare(b.ledger) || a.object_ref.localeCompare(b.object_ref)));
}

function buildGraph(contract: GovernanceQueryContract, records: readonly GovernanceHistoricalLedgerRecord[], correlations: readonly GovernanceCorrelation[]): GovernanceRelationshipGraph | null {
  if (correlations.length === 0) return null;
  const nodeMap = new Map<string, GovernanceRelationshipGraphNode>();
  records.forEach((record) => nodeMap.set(record.immutable_identifier, nodeFor(record)));
  const nodes = sortNodes([...nodeMap.values()]);
  const edges = freezeArray(correlations.map((correlation) => {
    const sourceNode = nodeMap.get(correlation.source_object);
    const targetNode = nodeMap.get(correlation.target_object);
    const source = {
      edge_id: `GCGE-7J4-${hashValue("governance-correlation-edge-id", correlation.correlation_id).slice(0, 10).toUpperCase()}`,
      source_node_id: sourceNode?.node_id ?? "",
      target_node_id: targetNode?.node_id ?? "",
      relationship_type: correlation.relationship_type,
      correlation_id: correlation.correlation_id,
    };
    return Object.freeze({ ...source, edge_hash: hashValue("governance-correlation-graph-edge", source) });
  }).sort((a, b) => a.source_node_id.localeCompare(b.source_node_id) || a.target_node_id.localeCompare(b.target_node_id) || a.relationship_type.localeCompare(b.relationship_type)));
  const source = {
    graph_id: `GCG-7J4-${hashValue("governance-correlation-graph-id", { tenant: contract.tenant_id, mission: contract.mission_id }).slice(0, 10).toUpperCase()}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    nodes,
    edges,
    graph_version: GRAPH_VERSION,
  };
  return Object.freeze({ ...source, graph_hash: hashValue("governance-correlation-relationship-graph", source) });
}

function buildReplayCorrelation(historical: GovernanceHistoricalReconstructionResponse, graph: GovernanceRelationshipGraph | null, correlations: readonly GovernanceCorrelation[], scenario: GovernanceCorrelationScenario | undefined): GovernanceReplayCorrelation | null {
  if (!graph) return null;
  const refs = freezeArray([...new Set(correlations.map((correlation) => correlation.replay_reference).filter(Boolean))].sort());
  const source = {
    replay_id: historical.snapshot?.replay_reference ?? historical.search_response.replay_support.replay_id,
    historical_reconstruction_hash: historical.reconstruction_hash,
    correlated_replay_refs: refs,
    replay_dependency_graph_hash: graph.graph_hash,
    replay_consistent: scenario !== "REPLAY_CORRELATION_FAILED" && refs.length > 0 && Boolean(historical.reconstruction_hash),
  };
  return Object.freeze({ ...source, replay_correlation_hash: hashValue("governance-cross-ledger-replay-correlation", source) });
}

function expectedCorrelationHash(correlation: GovernanceCorrelation): string {
  const { correlation_hash: _hash, ...payload } = correlation;
  return hashValue("governance-cross-ledger-correlation", payload);
}

function deriveFailure(input: GovernanceCrossLedgerCorrelationInput, historical: GovernanceHistoricalReconstructionResponse, correlations: readonly GovernanceCorrelation[], graph: GovernanceRelationshipGraph | null, replay: GovernanceReplayCorrelation | null): GovernanceCorrelationErrorState | null {
  if (input.scenario === "TENANT_ISOLATION_VIOLATION") return "TENANT_ISOLATION_VIOLATION";
  if (input.scenario === "CONSTITUTIONAL_VIOLATION") return "CONSTITUTIONAL_VIOLATION";
  if (input.scenario === "LEDGER_REFERENCE_INVALID" || historical.reconstruction_state !== "SNAPSHOT_RECONSTRUCTED") return "LEDGER_REFERENCE_INVALID";
  if (correlations.length === 0) return "CORRELATION_NOT_FOUND";
  if (correlations.some((correlation) => correlation.source_object === correlation.target_object)) return "RELATIONSHIP_INCONSISTENT";
  if (correlations.some((correlation) => correlation.supporting_evidence.length === 0)) return "EVIDENCE_MISSING";
  if (correlations.some((correlation) => !correlation.lineage_reference)) return "LINEAGE_BROKEN";
  if (!replay?.replay_consistent) return "REPLAY_CORRELATION_FAILED";
  if (!graph || graph.edges.some((edge) => !edge.source_node_id || !edge.target_node_id)) return "RELATIONSHIP_INCONSISTENT";
  if (correlations.some((correlation) => correlation.correlation_hash !== expectedCorrelationHash(correlation))) return "HASH_MISMATCH";
  return null;
}

function buildValidation(correlations: readonly GovernanceCorrelation[], graph: GovernanceRelationshipGraph | null, replay: GovernanceReplayCorrelation | null, failures: readonly GovernanceQueryValidationIssue[]): GovernanceCorrelationValidation {
  const source = {
    valid: failures.length === 0,
    relationship_count: correlations.length,
    graph_hash: graph?.graph_hash ?? null,
    replay_verified: replay?.replay_consistent ?? false,
    evidence_complete: correlations.every((correlation) => correlation.supporting_evidence.length > 0),
    lineage_verified: correlations.every((correlation) => Boolean(correlation.lineage_reference)),
    hash_verified: correlations.every((correlation) => correlation.correlation_hash === expectedCorrelationHash(correlation)),
    errors: failures,
  };
  return Object.freeze({ ...source, validation_hash: hashValue("governance-cross-ledger-correlation-validation", source) });
}

export function correlateGovernanceLedgers(input: GovernanceCrossLedgerCorrelationInput = {}): GovernanceCrossLedgerCorrelationResponse {
  const contract = queryContractForScenario(input);
  const historical = historicalForInput(input, contract);
  const records = freezeArray(input.ledger_records ?? historical.ledger_records);
  const correlations = discoverCorrelations(contract, records, input.scenario);
  const graph = buildGraph(contract, records, correlations);
  const replay = buildReplayCorrelation(historical, graph, correlations, input.scenario);
  const failure = deriveFailure(input, historical, correlations, graph, replay);
  const failures = freezeArray([
    ...historical.failures,
    ...(failure ? [issue(failure, "cross_ledger_correlation", `${failure} detected during cross-ledger governance correlation.`)] : []),
  ]);
  const validation = buildValidation(correlations, graph, replay, failures);
  const correlationState: GovernanceCorrelationState = failure ?? "CORRELATIONS_GENERATED";
  const correlationRunId = `GCCR-7J4-${hashValue("governance-cross-ledger-correlation-run-id", { query: contract.query_id, state: correlationState }).slice(0, 10).toUpperCase()}`;
  const correlationHash = validation.valid && graph && replay ? hashValue("governance-cross-ledger-correlation-response", {
    correlation_run_id: correlationRunId,
    graph_hash: graph.graph_hash,
    replay_hash: replay.replay_correlation_hash,
    correlations: correlations.map((correlation) => correlation.correlation_hash),
  }) : null;
  return Object.freeze({
    phase_version: "7J.4",
    schema_version: SCHEMA_VERSION,
    correlation_run_id: correlationRunId,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    correlation_state: correlationState,
    historical_response: historical,
    correlations,
    relationship_graph: graph,
    replay_correlation: replay,
    validation,
    failures,
    correlation_hash: correlationHash,
    read_only: true,
    advisory_only_notice: "Cross-ledger governance correlation is deterministic, immutable, read-only, replay-verifiable, and audit-backed.",
  });
}

export function validateGovernanceCorrelation(input: GovernanceCrossLedgerCorrelationInput = {}) {
  const response = correlateGovernanceLedgers(input);
  return Object.freeze({
    correlation_run_id: response.correlation_run_id,
    valid: response.correlation_state === "CORRELATIONS_GENERATED",
    correlation_state: response.correlation_state,
    relationship_count: response.correlations.length,
    graph_hash: response.relationship_graph?.graph_hash ?? null,
    replay_verified: response.validation.replay_verified,
    evidence_complete: response.validation.evidence_complete,
    lineage_verified: response.validation.lineage_verified,
    hash_verified: response.validation.hash_verified,
    errors: response.failures,
    correlation_hash: response.correlation_hash,
  });
}

export function computeGovernanceCorrelationHash(response: GovernanceCrossLedgerCorrelationResponse): string | null {
  if (!response.validation.valid || !response.relationship_graph || !response.replay_correlation) return null;
  return hashValue("governance-cross-ledger-correlation-response", {
    correlation_run_id: response.correlation_run_id,
    graph_hash: response.relationship_graph.graph_hash,
    replay_hash: response.replay_correlation.replay_correlation_hash,
    correlations: response.correlations.map((correlation) => correlation.correlation_hash),
  });
}

export function buildGovernanceCorrelationObservabilitySurface(input: GovernanceCrossLedgerCorrelationInput = {}): GovernanceCrossLedgerCorrelationObservabilitySurface {
  const response = correlateGovernanceLedgers(input);
  const errors = response.correlation_state === "CORRELATIONS_GENERATED" ? [] : [response.correlation_state as GovernanceCorrelationErrorState];
  return Object.freeze({
    correlation_run_id: response.correlation_run_id,
    correlation_state: response.correlation_state,
    correlation_count: response.correlations.length,
    node_count: response.relationship_graph?.nodes.length ?? 0,
    edge_count: response.relationship_graph?.edges.length ?? 0,
    replay_consistent: response.replay_correlation?.replay_consistent ?? false,
    errors: freezeArray(errors),
    correlation_hash: response.correlation_hash,
  });
}

export function getGovernanceCrossLedgerCorrelationContract() {
  const response = correlateGovernanceLedgers();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "explainable", "replayable", "evidence-backed", "lineage-preserving", "immutable", "constitutionally-governed", "tenant-isolated", "version-aware", "certification-ready"]),
      schema_version: SCHEMA_VERSION,
      graph_version: GRAPH_VERSION,
      correlated_ledgers: freezeArray(["TRUTH_LEDGER", "POLICY_LEDGER", "EVIDENCE_LEDGER", "RECOMMENDATION_LEDGER", "COMPLIANCE_LEDGER", "RISK_LEDGER", "ESCALATION_LEDGER", "REPLAY_LEDGER", "INTEGRITY_LEDGER", "LINEAGE_LEDGER"] as const),
      relationship_types: freezeArray(["INFLUENCES", "SUPPORTS", "MITIGATES", "ESCALATES", "VALIDATES", "DEPENDS_ON", "SUPERSEDES", "PARENT_OF", "CHILD_OF", "RECONSTRUCTED_BY"] as const),
      error_states: freezeArray(["CORRELATION_NOT_FOUND", "LEDGER_REFERENCE_INVALID", "RELATIONSHIP_INCONSISTENT", "EVIDENCE_MISSING", "LINEAGE_BROKEN", "REPLAY_CORRELATION_FAILED", "HASH_MISMATCH", "TENANT_ISOLATION_VIOLATION", "CONSTITUTIONAL_VIOLATION"] as const),
    }),
    response,
    validation: validateGovernanceCorrelation(),
    observability: buildGovernanceCorrelationObservabilitySurface(),
  });
}
