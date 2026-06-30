import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import { runReplayHistoricalReconstructionQuery } from "@/services/replay-historical-reconstruction-query";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  AutonomyLineageSearchAuditRecord,
  AutonomyLineageSearchErrorState,
  AutonomyLineageSearchInput,
  AutonomyLineageSearchObservabilitySurface,
  AutonomyLineageSearchResponse,
  AutonomyLineageSearchScenario,
  AutonomyLineageSearchState,
  AutonomyLineageSearchType,
  BrokenLineageFinding,
  InfluenceChainNode,
  InfluenceChainView,
  LineageIndexEntry,
  LineageObjectType,
  LineageRecord,
  LineageRelationshipType,
} from "@/types/autonomy-lineage-search";

const NOW = "2026-06-30T22:00:00.000Z";
const SCHEMA_VERSION = "autonomy-lineage-search/v8I.7" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(state: AutonomyLineageSearchErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<AutonomyLineageSearchErrorState, AutonomyQueryErrorState> = {
    BROKEN_LINEAGE: "VALIDATION_FAILURE",
    CIRCULAR_REFERENCE: "VALIDATION_FAILURE",
    INVALID_INTEGRITY_REFERENCE: "VALIDATION_FAILURE",
    INVALID_LINEAGE_REQUEST: "INVALID_QUERY",
    INVALID_RELATIONSHIP: "VALIDATION_FAILURE",
    INVALID_REPLAY_REFERENCE: "REPLAY_REFERENCE_INVALID",
    LINEAGE_NOT_FOUND: "OBJECT_NOT_FOUND",
    MISSION_NOT_FOUND: "MISSION_SCOPE_VIOLATION",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    ORPHANED_REFERENCE: "OBJECT_NOT_FOUND",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryForScenario(input: AutonomyLineageSearchInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "UNAUTHORIZED": return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION": return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_NOT_FOUND": return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "INVALID_REPLAY_REFERENCE": return buildAutonomyQueryContract({ scenario: "REPLAY_REFERENCE_INVALID" });
    default: return buildAutonomyQueryContract({ query_type: "LINEAGE_SEARCH", query_scope: "LINEAGE", target_reference: input.target_reference ?? "lineage:autonomy:8i7:primary" });
  }
}

function searchType(input: AutonomyLineageSearchInput): AutonomyLineageSearchType {
  if (input.search_type) return input.search_type;
  switch (input.scenario) {
    case "INFLUENCE_CHAIN": return "INFLUENCE_CHAIN";
    case "BROKEN_LINEAGE": return "BROKEN_LINEAGE";
    case "REFERENCE_INDEX": return "REFERENCE_INDEX";
    case "RELATIONSHIP_LOOKUP": return "RELATIONSHIP_LOOKUP";
    default: return "LINEAGE_SEARCH";
  }
}

const objectTypes: readonly LineageObjectType[] = ["OBJECTIVE", "PLAN", "DECISION", "DELEGATION", "ORCHESTRATION", "EXECUTION", "SUPERVISION", "INTERVENTION", "RECOVERY", "REPLAY", "INTEGRITY"];
const relationships: readonly LineageRelationshipType[] = ["DERIVED_FROM", "DERIVED_FROM", "DEPENDS_ON", "AUTHORIZED_BY", "DEPENDS_ON", "SUPERVISED_BY", "INTERVENED_BY", "SUPERSEDED_BY", "REPLAYED_BY", "VERIFIED_BY"];

function lineageRecord(contract: AutonomyQueryContract, source_id: string, source_type: LineageObjectType, relationship_type: LineageRelationshipType, target_id: string, target_type: LineageObjectType, sequence: number): LineageRecord {
  const source = {
    lineage_id: id("LIN", "autonomy-lineage-record-id", { source_id, target_id, relationship_type, sequence }),
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    source_object_id: source_id,
    source_object_type: source_type,
    relationship_type,
    target_object_id: target_id,
    target_object_type: target_type,
    replay_reference: contract.replay_reference,
    governance_reference: "governance:lineage:8i7",
    policy_reference: "policy:lineage-search:8i7",
    integrity_hash: hashValue("lineage-integrity", { source_id, target_id, relationship_type }),
    lineage_timestamp: `2026-06-30T21:${(10 + sequence).toString().padStart(2, "0")}:00.000Z`,
    autonomy_event_sequence: 9000 + sequence,
  };
  return Object.freeze({ ...source, lineage_hash: hashValue("autonomy-lineage-record", source) });
}

function buildLineageRecords(contract: AutonomyQueryContract, scenario?: AutonomyLineageSearchScenario): readonly LineageRecord[] {
  if (scenario === "LINEAGE_NOT_FOUND") return freezeArray([]);
  const reconstruction = runReplayHistoricalReconstructionQuery({ query_contract: contract });
  const events = reconstruction.reconstruction_record?.reconstructed_events ?? [];
  const base = events.slice(0, -1).map((event, index) => lineageRecord(
    contract,
    event.source_record_id,
    objectTypes[index] ?? "OBJECTIVE",
    relationships[index] ?? "DERIVED_FROM",
    events[index + 1].source_record_id,
    objectTypes[index + 1] ?? "INTEGRITY",
    index + 1,
  ));
  if (scenario === "ORDERING_FAILURE") return freezeArray([base[1], base[0]]);
  return freezeArray(base);
}

function buildIndex(records: readonly LineageRecord[]): readonly LineageIndexEntry[] {
  return freezeArray(records.map((record) => {
    const source = {
      lineage_reference: record.lineage_id,
      parent_reference: record.source_object_id,
      child_reference: record.target_object_id,
      relationship_type: record.relationship_type,
      object_type: record.target_object_type,
      replay_reference: record.replay_reference,
      integrity_hash: record.integrity_hash,
    };
    return Object.freeze({ ...source, index_hash: hashValue("lineage-index-entry", source) });
  }));
}

function chainNode(record: LineageRecord, useTarget: boolean): InfluenceChainNode {
  const object_id = useTarget ? record.target_object_id : record.source_object_id;
  const object_type = useTarget ? record.target_object_type : record.source_object_type;
  const source = {
    node_id: id("LCN", "lineage-chain-node-id", { object_id, object_type }),
    object_id,
    object_type,
    label: `${object_type}: ${object_id}`,
    evidence_reference: useTarget ? record.lineage_id : `${record.lineage_id}:root`,
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
  };
  return Object.freeze(source);
}

function buildInfluenceChain(records: readonly LineageRecord[]): InfluenceChainView | null {
  if (!records.length) return null;
  const nodes = freezeArray([chainNode(records[0], false), ...records.map((record) => chainNode(record, true))]);
  const source = {
    influence_chain_id: id("ICH", "influence-chain-id", records.map((record) => record.lineage_hash)),
    root_object_id: records[0].source_object_id,
    terminal_object_id: records[records.length - 1].target_object_id,
    nodes,
    relationships: records,
    replay_reference: records[0].replay_reference,
    integrity_hash: hashValue("influence-chain-integrity", records.map((record) => record.integrity_hash)),
  };
  return Object.freeze({ ...source, chain_hash: hashValue("influence-chain-view", source) });
}

function brokenFinding(contract: AutonomyQueryContract, finding_type: BrokenLineageFinding["finding_type"], sequence: number): BrokenLineageFinding {
  const source = {
    finding_id: id("BLF", "broken-lineage-finding-id", { finding_type, sequence }),
    finding_type,
    affected_reference: `${finding_type.toLowerCase()}:8i7:affected`,
    detection_reason: `${finding_type} detected during deterministic lineage traversal; no repair was attempted.`,
    repair_attempted: false as const,
    replay_reference: contract.replay_reference,
    integrity_hash: hashValue("broken-lineage-integrity", { finding_type, sequence }),
  };
  return Object.freeze({ ...source, finding_hash: hashValue("broken-lineage-finding", source) });
}

function buildBrokenFindings(contract: AutonomyQueryContract, scenario?: AutonomyLineageSearchScenario): readonly BrokenLineageFinding[] {
  switch (scenario) {
    case "ORPHANED_REFERENCE": return freezeArray([brokenFinding(contract, "ORPHANED_HISTORY", 1)]);
    case "CIRCULAR_REFERENCE": return freezeArray([brokenFinding(contract, "CIRCULAR_DEPENDENCY", 1)]);
    case "INVALID_RELATIONSHIP": return freezeArray([brokenFinding(contract, "INVALID_REFERENCE", 1)]);
    case "INVALID_REPLAY_REFERENCE": return freezeArray([brokenFinding(contract, "REPLAY_DIVERGENCE", 1)]);
    case "INVALID_INTEGRITY_REFERENCE": return freezeArray([brokenFinding(contract, "INTEGRITY_MISMATCH", 1)]);
    case "BROKEN_LINEAGE": return freezeArray([brokenFinding(contract, "MISSING_LINEAGE", 1), brokenFinding(contract, "ORPHANED_HISTORY", 2)]);
    default: return freezeArray([]);
  }
}

function scenarioFailure(scenario?: AutonomyLineageSearchScenario): AutonomyLineageSearchErrorState | null {
  switch (scenario) {
    case "LINEAGE_NOT_FOUND": return "LINEAGE_NOT_FOUND";
    case "BROKEN_LINEAGE": return "BROKEN_LINEAGE";
    case "ORPHANED_REFERENCE": return "ORPHANED_REFERENCE";
    case "CIRCULAR_REFERENCE": return "CIRCULAR_REFERENCE";
    case "INVALID_RELATIONSHIP": return "INVALID_RELATIONSHIP";
    case "INVALID_REPLAY_REFERENCE": return "INVALID_REPLAY_REFERENCE";
    case "INVALID_INTEGRITY_REFERENCE": return "INVALID_INTEGRITY_REFERENCE";
    case "MISSION_NOT_FOUND": return "MISSION_NOT_FOUND";
    case "UNAUTHORIZED": return "UNAUTHORIZED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "ORDERING_FAILURE": return "ORDERING_FAILURE";
    case "VALIDATION_FAILURE":
    case "MUTATION_ATTEMPT": return "VALIDATION_FAILURE";
    default: return null;
  }
}

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): AutonomyLineageSearchErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_NOT_FOUND";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "INVALID_REPLAY_REFERENCE";
  if (states.includes("ORDERING_FAILURE")) return "ORDERING_FAILURE";
  if (states.length) return "INVALID_LINEAGE_REQUEST";
  return null;
}

function resultHash(records: readonly LineageRecord[], index: readonly LineageIndexEntry[], chain: InfluenceChainView | null, findings: readonly BrokenLineageFinding[]): string | null {
  if (!records.length && !index.length && !chain && !findings.length) return null;
  return hashValue("autonomy-lineage-search-result", {
    records: records.map((record) => record.lineage_hash),
    index: index.map((entry) => entry.index_hash),
    chain: chain?.chain_hash ?? null,
    findings: findings.map((finding) => finding.finding_hash),
  });
}

function buildAudit(response: Omit<AutonomyLineageSearchResponse, "audit_record">, authorization: "APPROVED" | "REJECTED"): AutonomyLineageSearchAuditRecord {
  const source = {
    audit_id: id("LNA", "lineage-audit-id", response.lineage_query_id),
    lineage_query_id: response.lineage_query_id,
    operator_id: response.query_contract.operator_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    lineage_scope: response.search_type,
    returned_relationship_count: response.lineage_records.length,
    authorization_result: authorization,
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    integrity_hash: response.integrity_hash,
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("lineage-lookup-audit", source) });
}

export function runAutonomyLineageSearch(input: AutonomyLineageSearchInput = {}): AutonomyLineageSearchResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const type = searchType(input);
  const search_response = runAutonomySearch({ query_contract: contract, requested_domains: ["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "GOVERNANCE", "REPLAY", "INTEGRITY"], search_terms: ["lineage", "influence", "causal"] });
  const explicitFailure = scenarioFailure(input.scenario);
  const queryFailure = failureFromQuery(query_validation.errors);
  const failureState = explicitFailure ?? queryFailure;
  const terminalFailure = failureState && !["BROKEN_LINEAGE", "ORPHANED_REFERENCE", "CIRCULAR_REFERENCE", "INVALID_RELATIONSHIP", "INVALID_REPLAY_REFERENCE", "INVALID_INTEGRITY_REFERENCE", "ORDERING_FAILURE"].includes(failureState);
  const reconstruction_response = terminalFailure ? null : runReplayHistoricalReconstructionQuery({ query_contract: contract });
  const lineage_records = terminalFailure ? freezeArray<LineageRecord>([]) : buildLineageRecords(contract, input.scenario);
  const lineage_index = terminalFailure ? freezeArray<LineageIndexEntry>([]) : buildIndex(lineage_records);
  const influence_chain = terminalFailure ? null : (type === "INFLUENCE_CHAIN" || type === "LINEAGE_SEARCH") ? buildInfluenceChain(lineage_records) : null;
  const broken_lineage_findings = terminalFailure ? freezeArray<BrokenLineageFinding>([]) : buildBrokenFindings(contract, input.scenario);
  const finalFailure = failureState ?? (lineage_records.length ? null : "LINEAGE_NOT_FOUND");
  const search_state: AutonomyLineageSearchState = finalFailure ?? "LOOKUP_RETURNED";
  const lineage_query_id = id("LQS", "lineage-query-id", { query: contract.autonomy_query_id, type, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(explicitFailure ? [issue(explicitFailure, "autonomy_lineage_search", `${explicitFailure} detected during autonomy lineage search.`)] : []),
  ]);
  const integrity_hash = hashValue("autonomy-lineage-search-integrity", { records: lineage_records.map((record) => record.integrity_hash), findings: broken_lineage_findings.map((finding) => finding.integrity_hash) });
  const result_hash = terminalFailure ? null : resultHash(lineage_records, lineage_index, influence_chain, broken_lineage_findings);
  const base = {
    phase_version: "8I.7" as const,
    schema_version: SCHEMA_VERSION,
    lineage_query_id,
    search_type: type,
    search_state,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    target_reference: contract.target_reference,
    query_contract: contract,
    query_validation,
    search_response,
    reconstruction_response,
    lineage_records,
    lineage_index,
    influence_chain,
    broken_lineage_findings,
    failures,
    replay_reference: contract.replay_reference,
    integrity_hash,
    result_hash,
    read_only: true as const,
    advisory_only_notice: "Autonomy lineage search is deterministic, read-only, replay-compatible, and never repairs or rewrites lineage." as const,
  };
  const audit_record = buildAudit(base, query_validation.authorization_verified && !terminalFailure ? "APPROVED" : "REJECTED");
  return Object.freeze({ ...base, audit_record });
}

export function validateAutonomyLineageSearch(input: AutonomyLineageSearchInput = {}) {
  const response = runAutonomyLineageSearch(input);
  return Object.freeze({
    lineage_query_id: response.lineage_query_id,
    valid: response.search_state === "LOOKUP_RETURNED" || response.search_state === "NO_RESULTS",
    search_state: response.search_state,
    errors: response.failures,
    replay_compatible: Boolean(response.replay_reference) && response.query_validation.replay_compatible,
    read_only: response.read_only,
    result_hash: response.result_hash,
  });
}

export function buildAutonomyLineageSearchObservabilitySurface(input: AutonomyLineageSearchInput = {}): AutonomyLineageSearchObservabilitySurface {
  const response = runAutonomyLineageSearch(input);
  const errors = response.search_state === "LOOKUP_RETURNED" || response.search_state === "NO_RESULTS" ? [] : [response.search_state as AutonomyLineageSearchErrorState];
  return Object.freeze({
    lineage_query_id: response.lineage_query_id,
    search_type: response.search_type,
    search_state: response.search_state,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    relationship_count: response.lineage_records.length,
    index_count: response.lineage_index.length,
    influence_chain_nodes: response.influence_chain?.nodes.length ?? 0,
    broken_findings: response.broken_lineage_findings.length,
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getAutonomyLineageSearchContract() {
  const response = runAutonomyLineageSearch();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "read-only", "replayable", "explainable", "immutable", "auditable", "governance-aware", "constitutionally-compliant", "tenant-isolated", "reproducible"]),
      schema_version: SCHEMA_VERSION,
      search_types: freezeArray(["LINEAGE_SEARCH", "INFLUENCE_CHAIN", "BROKEN_LINEAGE", "REFERENCE_INDEX", "RELATIONSHIP_LOOKUP"] as const),
      relationship_types: freezeArray(["DERIVED_FROM", "DEPENDS_ON", "BLOCKED_BY", "AUTHORIZED_BY", "REJECTED_BY", "SUPERVISED_BY", "INTERVENED_BY", "REPLAYED_BY", "VERIFIED_BY", "SUPERSEDED_BY"] as const),
      deterministic_ordering_keys: freezeArray(["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "lineage_id"]),
      mutation_permitted: false,
      repair_permitted: false,
    }),
    response,
    validation: validateAutonomyLineageSearch(),
    observability: buildAutonomyLineageSearchObservabilitySurface(),
  });
}
