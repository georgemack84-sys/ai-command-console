import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { buildAutonomyQueryContract, validateAutonomyQueryContract } from "@/services/autonomy-query-contract";
import { runAutonomySearch } from "@/services/autonomy-search-engine";
import { runAutonomyLineageSearch } from "@/services/autonomy-lineage-search";
import type { AutonomyQueryContract, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  AutonomyCrossReferenceErrorState,
  AutonomyCrossReferenceScenario,
  AutonomyCrossReferenceSearchAuditRecord,
  AutonomyCrossReferenceSearchInput,
  AutonomyCrossReferenceSearchObservabilitySurface,
  AutonomyCrossReferenceSearchResponse,
  AutonomyCrossReferenceSearchState,
  AutonomyLedgerName,
  CrossLedgerViewerRow,
  CrossReferenceConflict,
  CrossReferenceIndexEntry,
  CrossReferenceRecord,
  CrossReferenceRecordType,
  CrossReferenceRelationshipType,
  CrossReferenceSearchType,
  CrossReferenceStatus,
  MissingReferenceFinding,
  ReferenceResolverResult,
} from "@/types/autonomy-cross-reference-search";

const NOW = "2026-06-30T23:00:00.000Z";
const SCHEMA_VERSION = "autonomy-cross-reference-search/v8I.8" as const;

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function id(prefix: string, domain: string, value: unknown): string {
  return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`;
}

function issue(state: AutonomyCrossReferenceErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<AutonomyCrossReferenceErrorState, AutonomyQueryErrorState> = {
    CONFLICTING_REFERENCE: "VALIDATION_FAILURE",
    CROSS_TENANT_LINK_REJECTED: "TENANT_SCOPE_VIOLATION",
    INTEGRITY_REFERENCE_INVALID: "VALIDATION_FAILURE",
    INVALID_CROSS_REFERENCE_QUERY: "INVALID_QUERY",
    LINEAGE_REFERENCE_INVALID: "LINEAGE_REFERENCE_INVALID",
    MISSING_REFERENCE: "OBJECT_NOT_FOUND",
    MISSION_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    REPLAY_REFERENCE_INVALID: "REPLAY_REFERENCE_INVALID",
    SOURCE_RECORD_NOT_FOUND: "OBJECT_NOT_FOUND",
    STALE_REFERENCE: "VALIDATION_FAILURE",
    TARGET_RECORD_NOT_FOUND: "OBJECT_NOT_FOUND",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryForScenario(input: AutonomyCrossReferenceSearchInput): AutonomyQueryContract {
  if (input.query_contract) return input.query_contract;
  switch (input.scenario) {
    case "UNAUTHORIZED": return buildAutonomyQueryContract({ scenario: "UNAUTHORIZED_OPERATOR" });
    case "TENANT_SCOPE_VIOLATION":
    case "CROSS_TENANT_LINK_REJECTED": return buildAutonomyQueryContract({ scenario: "TENANT_SCOPE_VIOLATION" });
    case "MISSION_SCOPE_VIOLATION": return buildAutonomyQueryContract({ scenario: "INVALID_MISSION" });
    case "REPLAY_REFERENCE_INVALID": return buildAutonomyQueryContract({ scenario: "REPLAY_REFERENCE_INVALID" });
    case "LINEAGE_REFERENCE_INVALID": return buildAutonomyQueryContract({ scenario: "LINEAGE_REFERENCE_INVALID" });
    default: return buildAutonomyQueryContract({ query_type: "CROSS_REFERENCE_SEARCH", query_scope: "MISSION", target_reference: input.target_reference ?? "cross-reference:autonomy:8i8:primary" });
  }
}

function searchType(input: AutonomyCrossReferenceSearchInput): CrossReferenceSearchType {
  if (input.search_type) return input.search_type;
  switch (input.scenario) {
    case "REFERENCE_RESOLUTION": return "REFERENCE_RESOLUTION";
    case "CONFLICT_DETECTION":
    case "CONFLICTING_REFERENCE": return "CONFLICT_DETECTION";
    case "MISSING_REFERENCE_DETECTION":
    case "MISSING_REFERENCE": return "MISSING_REFERENCE_DETECTION";
    case "CROSS_LEDGER_VIEW": return "CROSS_LEDGER_VIEW";
    default: return "CROSS_REFERENCE_SEARCH";
  }
}

const pairs: readonly Readonly<{
  source: CrossReferenceRecordType;
  target: CrossReferenceRecordType;
  relationship: CrossReferenceRelationshipType;
  ledger_source: AutonomyLedgerName;
  ledger_target: AutonomyLedgerName;
}>[] = [
  { source: "PLAN", target: "EXECUTION", relationship: "DERIVED_FROM", ledger_source: "PLANNING", ledger_target: "EXECUTION" },
  { source: "EXECUTION", target: "DELEGATION", relationship: "CAUSED_BY", ledger_source: "EXECUTION", ledger_target: "DELEGATION" },
  { source: "DELEGATION", target: "ORCHESTRATION", relationship: "LINKED_TO", ledger_source: "DELEGATION", ledger_target: "ORCHESTRATION" },
  { source: "ORCHESTRATION", target: "SUPERVISION", relationship: "SUPERVISED_BY", ledger_source: "ORCHESTRATION", ledger_target: "SUPERVISION" },
  { source: "SUPERVISION", target: "INTERVENTION", relationship: "INTERVENED_BY", ledger_source: "SUPERVISION", ledger_target: "INTERVENTION" },
  { source: "INTERVENTION", target: "REPLAY", relationship: "REPLAYED_BY", ledger_source: "INTERVENTION", ledger_target: "REPLAY" },
  { source: "REPLAY", target: "INTEGRITY", relationship: "VERIFIED_BY", ledger_source: "REPLAY", ledger_target: "INTEGRITY" },
  { source: "POLICY", target: "BOUNDARY", relationship: "AUTHORIZED_BY", ledger_source: "GOVERNANCE", ledger_target: "BOUNDARY" },
  { source: "CONFIDENCE", target: "OUTCOME", relationship: "OUTCOME_INFLUENCED_BY", ledger_source: "CONFIDENCE", ledger_target: "OUTCOME" },
  { source: "FAILURE", target: "ROLLBACK_RECOMMENDATION", relationship: "ROLLBACK_RECOMMENDED_BY", ledger_source: "EXECUTION", ledger_target: "RECOVERY" },
];

function recordId(type: CrossReferenceRecordType, index: number): string {
  return `${type.toLowerCase().replace("_", "-")}:autonomy:8i8:${(index + 1).toString().padStart(2, "0")}`;
}

function statusForScenario(index: number, scenario?: AutonomyCrossReferenceScenario): CrossReferenceStatus {
  if (scenario === "STALE_REFERENCE" && index === 0) return "STALE";
  if ((scenario === "MISSING_REFERENCE" || scenario === "SOURCE_RECORD_NOT_FOUND" || scenario === "TARGET_RECORD_NOT_FOUND") && index === 1) return "MISSING";
  if (scenario === "CONFLICTING_REFERENCE" && index === 2) return "CONFLICTING";
  if (scenario === "CROSS_TENANT_LINK_REJECTED" && index === 3) return "UNAUTHORIZED";
  if (scenario === "INTEGRITY_REFERENCE_INVALID" && index === 6) return "INVALID";
  return "VALID";
}

function buildRecords(contract: AutonomyQueryContract, scenario?: AutonomyCrossReferenceScenario): readonly CrossReferenceRecord[] {
  if (scenario === "SOURCE_RECORD_NOT_FOUND") return freezeArray([]);
  return freezeArray(pairs.map((pair, index) => {
    const status = statusForScenario(index, scenario);
    const source_record_id = recordId(pair.source, index);
    const target_record_id = scenario === "TARGET_RECORD_NOT_FOUND" && index === 1 ? "target:missing:8i8" : recordId(pair.target, index);
    const source = {
      cross_reference_id: id("XREF", "cross-reference-record-id", { source_record_id, target_record_id, relationship: pair.relationship }),
      tenant_id: contract.tenant_id,
      mission_id: contract.mission_id,
      source_record_id,
      source_record_type: pair.source,
      target_record_id,
      target_record_type: pair.target,
      relationship_type: pair.relationship,
      ledger_source: pair.ledger_source,
      ledger_target: pair.ledger_target,
      reference_status: status,
      replay_reference: contract.replay_reference,
      lineage_reference: `${contract.lineage_reference}:xref:${index + 1}`,
      integrity_hash: hashValue("cross-reference-integrity", { pair, status }),
      governance_reference: "governance:cross-reference:8i8",
      conflict_reason: status === "CONFLICTING" ? "execution points to unrelated delegation" : null,
      missing_reference_reason: status === "MISSING" ? "target record could not be resolved from immutable ledger evidence" : null,
      stale_reference_reason: status === "STALE" ? "SUPERSEDED_PLAN" : null,
      created_timestamp: `2026-06-30T22:${(10 + index).toString().padStart(2, "0")}:00.000Z`,
    };
    return Object.freeze({ ...source, cross_reference_hash: hashValue("cross-reference-record", source) });
  }));
}

function buildIndex(records: readonly CrossReferenceRecord[]): readonly CrossReferenceIndexEntry[] {
  return freezeArray(records.map((record) => {
    const source = {
      index_id: id("XRI", "cross-reference-index-id", record.cross_reference_id),
      source_key: `${record.ledger_source}:${record.source_record_type}:${record.source_record_id}`,
      target_key: `${record.ledger_target}:${record.target_record_type}:${record.target_record_id}`,
      relationship_type: record.relationship_type,
      ledger_pair: `${record.ledger_source}->${record.ledger_target}`,
      reference_status: record.reference_status,
      replay_reference: record.replay_reference,
      lineage_reference: record.lineage_reference,
      integrity_hash: record.integrity_hash,
    };
    return Object.freeze({ ...source, index_hash: hashValue("cross-reference-index-entry", source) });
  }));
}

function buildResolvers(records: readonly CrossReferenceRecord[]): readonly ReferenceResolverResult[] {
  return freezeArray(records.map((record) => {
    const source = {
      resolver_id: id("XRR", "cross-reference-resolver-id", record.cross_reference_id),
      source_record_id: record.source_record_id,
      target_record_id: record.target_record_id,
      source_valid: record.reference_status !== "MISSING",
      target_valid: record.reference_status !== "MISSING",
      tenant_match: record.reference_status !== "UNAUTHORIZED",
      mission_match: record.reference_status !== "UNAUTHORIZED",
      immutable_id_format_valid: record.reference_status !== "INVALID",
      lifecycle_state: record.reference_status === "STALE" ? "SUPERSEDED" as const : record.reference_status === "MISSING" ? "MISSING" as const : record.reference_status === "INVALID" ? "INVALID" as const : "ACTIVE" as const,
      reference_status: record.reference_status,
    };
    return Object.freeze({ ...source, resolver_hash: hashValue("reference-resolver-result", source) });
  }));
}

function buildConflicts(records: readonly CrossReferenceRecord[]): readonly CrossReferenceConflict[] {
  return freezeArray(records.filter((record) => record.reference_status === "CONFLICTING" || record.reference_status === "UNAUTHORIZED" || record.reference_status === "INVALID").map((record) => {
    const source = {
      conflict_id: id("XCF", "cross-reference-conflict-id", record.cross_reference_id),
      conflict_type: record.reference_status === "UNAUTHORIZED" ? "TENANT_MISMATCH" as const : record.reference_status === "INVALID" ? "REPLAY_HASH_MISMATCH" as const : "POLICY_BOUNDARY_CONTRADICTION" as const,
      source_record_id: record.source_record_id,
      target_record_id: record.target_record_id,
      conflict_reason: record.conflict_reason ?? "cross-ledger reference failed deterministic safety checks",
      replay_reference: record.replay_reference,
      lineage_reference: record.lineage_reference,
    };
    return Object.freeze({ ...source, conflict_hash: hashValue("cross-reference-conflict", source) });
  }));
}

function buildMissing(records: readonly CrossReferenceRecord[], scenario?: AutonomyCrossReferenceScenario): readonly MissingReferenceFinding[] {
  const missing = records.filter((record) => record.reference_status === "MISSING");
  if (!missing.length && scenario !== "MISSING_REFERENCE_DETECTION") return freezeArray([]);
  const sourceRecords = missing.length ? missing : records.slice(0, 2);
  return freezeArray(sourceRecords.map((record, index) => {
    const source = {
      missing_reference_id: id("XMR", "missing-cross-reference-id", { record: record.cross_reference_id, index }),
      missing_type: index === 0 ? "TARGET_RECORD" as const : "REPLAY_REFERENCE" as const,
      expected_reference: index === 0 ? record.target_record_id : record.replay_reference,
      detection_reason: index === 0 ? "target record could not be resolved" : "replay reference required for complete cross-ledger reconstruction was absent",
      repair_attempted: false as const,
      replay_reference: record.replay_reference,
      lineage_reference: record.lineage_reference,
    };
    return Object.freeze({ ...source, missing_hash: hashValue("missing-reference-finding", source) });
  }));
}

function buildViewerRows(records: readonly CrossReferenceRecord[]): readonly CrossLedgerViewerRow[] {
  return freezeArray(records.map((record) => {
    const source = {
      viewer_row_id: id("XVR", "cross-ledger-viewer-row-id", record.cross_reference_id),
      source_record: `${record.source_record_type}:${record.source_record_id}`,
      target_record: `${record.target_record_type}:${record.target_record_id}`,
      relationship_type: record.relationship_type,
      reference_status: record.reference_status,
      ledger_source: record.ledger_source,
      ledger_target: record.ledger_target,
      governance_reference: record.governance_reference,
      replay_reference: record.replay_reference,
      lineage_reference: record.lineage_reference,
      integrity_hash: record.integrity_hash,
      conflict_reason: record.conflict_reason,
      missing_reference_reason: record.missing_reference_reason,
    };
    return Object.freeze({ ...source, row_hash: hashValue("cross-ledger-viewer-row", source) });
  }));
}

function scenarioFailure(scenario?: AutonomyCrossReferenceScenario): AutonomyCrossReferenceErrorState | null {
  switch (scenario) {
    case "SOURCE_RECORD_NOT_FOUND": return "SOURCE_RECORD_NOT_FOUND";
    case "TARGET_RECORD_NOT_FOUND": return "TARGET_RECORD_NOT_FOUND";
    case "STALE_REFERENCE": return "STALE_REFERENCE";
    case "MISSING_REFERENCE": return "MISSING_REFERENCE";
    case "CONFLICTING_REFERENCE": return "CONFLICTING_REFERENCE";
    case "UNAUTHORIZED": return "UNAUTHORIZED";
    case "TENANT_SCOPE_VIOLATION": return "TENANT_SCOPE_VIOLATION";
    case "MISSION_SCOPE_VIOLATION": return "MISSION_SCOPE_VIOLATION";
    case "CROSS_TENANT_LINK_REJECTED": return "CROSS_TENANT_LINK_REJECTED";
    case "REPLAY_REFERENCE_INVALID": return "REPLAY_REFERENCE_INVALID";
    case "LINEAGE_REFERENCE_INVALID": return "LINEAGE_REFERENCE_INVALID";
    case "INTEGRITY_REFERENCE_INVALID": return "INTEGRITY_REFERENCE_INVALID";
    case "ORDERING_FAILURE": return "ORDERING_FAILURE";
    case "MUTATION_ATTEMPT": return "INVALID_CROSS_REFERENCE_QUERY";
    default: return null;
  }
}

function failureFromQuery(errors: readonly AutonomyQueryValidationIssue[]): AutonomyCrossReferenceErrorState | null {
  const states = errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_SCOPE_VIOLATION";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_REFERENCE_INVALID";
  if (states.includes("LINEAGE_REFERENCE_INVALID")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("ORDERING_FAILURE")) return "ORDERING_FAILURE";
  if (states.length) return "INVALID_CROSS_REFERENCE_QUERY";
  return null;
}

function resultHash(records: readonly CrossReferenceRecord[], index: readonly CrossReferenceIndexEntry[], resolvers: readonly ReferenceResolverResult[], conflicts: readonly CrossReferenceConflict[], missing: readonly MissingReferenceFinding[], rows: readonly CrossLedgerViewerRow[]): string | null {
  if (!records.length && !index.length && !resolvers.length && !conflicts.length && !missing.length && !rows.length) return null;
  return hashValue("autonomy-cross-reference-search-result", {
    records: records.map((record) => record.cross_reference_hash),
    index: index.map((entry) => entry.index_hash),
    resolvers: resolvers.map((resolver) => resolver.resolver_hash),
    conflicts: conflicts.map((conflict) => conflict.conflict_hash),
    missing: missing.map((record) => record.missing_hash),
    rows: rows.map((row) => row.row_hash),
  });
}

function buildAudit(response: Omit<AutonomyCrossReferenceSearchResponse, "audit_record">, authorization: "APPROVED" | "REJECTED"): AutonomyCrossReferenceSearchAuditRecord {
  const source = {
    audit_id: id("XRA", "cross-reference-audit-id", response.query_id),
    query_id: response.query_id,
    operator_id: response.query_contract.operator_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    source_record_id: response.cross_reference_records[0]?.source_record_id ?? response.target_reference,
    source_record_type: response.cross_reference_records[0]?.source_record_type ?? "PLAN" as const,
    returned_reference_count: response.cross_reference_records.length,
    stale_reference_count: response.cross_reference_records.filter((record) => record.reference_status === "STALE").length,
    missing_reference_count: response.cross_reference_records.filter((record) => record.reference_status === "MISSING").length + response.missing_references.length,
    conflicting_reference_count: response.cross_reference_records.filter((record) => record.reference_status === "CONFLICTING").length + response.conflicts.length,
    authorization_result: authorization,
    result_hash: response.result_hash ?? "",
    replay_reference: response.replay_reference,
    lineage_reference: response.lineage_reference,
    audit_timestamp: NOW,
    append_only: true as const,
  };
  return Object.freeze({ ...source, audit_hash: hashValue("cross-reference-search-audit", source) });
}

export function runAutonomyCrossReferenceSearch(input: AutonomyCrossReferenceSearchInput = {}): AutonomyCrossReferenceSearchResponse {
  const contract = queryForScenario(input);
  const query_validation = validateAutonomyQueryContract(contract);
  const type = searchType(input);
  const search_response = runAutonomySearch({ query_contract: contract, requested_domains: ["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "GOVERNANCE", "REPLAY", "INTEGRITY", "BOUNDARY"], search_terms: ["cross-reference", "ledger", "relationship"] });
  const explicitFailure = scenarioFailure(input.scenario);
  const queryFailure = failureFromQuery(query_validation.errors);
  const failureState = explicitFailure ?? queryFailure;
  const terminalFailure = failureState && !["STALE_REFERENCE", "MISSING_REFERENCE", "CONFLICTING_REFERENCE", "CROSS_TENANT_LINK_REJECTED", "REPLAY_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID", "INTEGRITY_REFERENCE_INVALID", "ORDERING_FAILURE", "TARGET_RECORD_NOT_FOUND"].includes(failureState);
  const lineage_response = terminalFailure ? null : runAutonomyLineageSearch({ query_contract: contract });
  const records = terminalFailure ? freezeArray<CrossReferenceRecord>([]) : buildRecords(contract, input.scenario);
  const index = terminalFailure ? freezeArray<CrossReferenceIndexEntry>([]) : buildIndex(records);
  const resolvers = terminalFailure ? freezeArray<ReferenceResolverResult>([]) : buildResolvers(records);
  const conflicts = terminalFailure ? freezeArray<CrossReferenceConflict>([]) : buildConflicts(records);
  const missing = terminalFailure ? freezeArray<MissingReferenceFinding>([]) : buildMissing(records, input.scenario);
  const rows = terminalFailure ? freezeArray<CrossLedgerViewerRow>([]) : (type === "CROSS_LEDGER_VIEW" || type === "CROSS_REFERENCE_SEARCH") ? buildViewerRows(records) : freezeArray<CrossLedgerViewerRow>([]);
  const finalFailure = failureState ?? (records.length ? null : "SOURCE_RECORD_NOT_FOUND");
  const search_state: AutonomyCrossReferenceSearchState = finalFailure ?? "LOOKUP_RETURNED";
  const query_id = id("XQS", "cross-reference-query-id", { query: contract.autonomy_query_id, type, scenario: input.scenario ?? "BASELINE" });
  const failures = freezeArray([
    ...query_validation.errors,
    ...(explicitFailure ? [issue(explicitFailure, "autonomy_cross_reference_search", `${explicitFailure} detected during autonomy cross-reference search.`)] : []),
  ]);
  const result_hash = terminalFailure ? null : resultHash(records, index, resolvers, conflicts, missing, rows);
  const base = {
    phase_version: "8I.8" as const,
    schema_version: SCHEMA_VERSION,
    query_id,
    search_type: type,
    search_state,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    target_reference: contract.target_reference,
    query_contract: contract,
    query_validation,
    search_response,
    lineage_response,
    cross_reference_records: records,
    cross_reference_index: index,
    resolver_results: resolvers,
    conflicts,
    missing_references: missing,
    viewer_rows: rows,
    failures,
    replay_reference: contract.replay_reference,
    lineage_reference: contract.lineage_reference,
    result_hash,
    read_only: true as const,
    advisory_only_notice: "Cross-reference search is deterministic, read-only, replay-compatible, and never repairs references or rewrites ledgers." as const,
  };
  const audit_record = buildAudit(base, query_validation.authorization_verified && !terminalFailure ? "APPROVED" : "REJECTED");
  return Object.freeze({ ...base, audit_record });
}

export function validateAutonomyCrossReferenceSearch(input: AutonomyCrossReferenceSearchInput = {}) {
  const response = runAutonomyCrossReferenceSearch(input);
  return Object.freeze({
    query_id: response.query_id,
    valid: response.search_state === "LOOKUP_RETURNED" || response.search_state === "NO_RESULTS",
    search_state: response.search_state,
    errors: response.failures,
    replay_compatible: Boolean(response.replay_reference) && response.query_validation.replay_compatible,
    lineage_compatible: Boolean(response.lineage_reference) && response.query_validation.lineage_compatible,
    read_only: response.read_only,
    result_hash: response.result_hash,
  });
}

export function buildAutonomyCrossReferenceSearchObservabilitySurface(input: AutonomyCrossReferenceSearchInput = {}): AutonomyCrossReferenceSearchObservabilitySurface {
  const response = runAutonomyCrossReferenceSearch(input);
  const errors = response.search_state === "LOOKUP_RETURNED" || response.search_state === "NO_RESULTS" ? [] : [response.search_state as AutonomyCrossReferenceErrorState];
  return Object.freeze({
    query_id: response.query_id,
    search_type: response.search_type,
    search_state: response.search_state,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    reference_count: response.cross_reference_records.length,
    stale_reference_count: response.cross_reference_records.filter((record) => record.reference_status === "STALE").length,
    missing_reference_count: response.cross_reference_records.filter((record) => record.reference_status === "MISSING").length + response.missing_references.length,
    conflicting_reference_count: response.cross_reference_records.filter((record) => record.reference_status === "CONFLICTING").length + response.conflicts.length,
    viewer_rows: response.viewer_rows.length,
    errors: freezeArray(errors),
    result_hash: response.result_hash,
    audit_hash: response.audit_record.audit_hash,
  });
}

export function getAutonomyCrossReferenceSearchContract() {
  const response = runAutonomyCrossReferenceSearch();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "read-only", "replayable", "immutable", "auditable", "governance-aware", "tenant-isolated", "cross-ledger", "non-repairing"]),
      schema_version: SCHEMA_VERSION,
      search_types: freezeArray(["CROSS_REFERENCE_SEARCH", "REFERENCE_RESOLUTION", "CONFLICT_DETECTION", "MISSING_REFERENCE_DETECTION", "CROSS_LEDGER_VIEW"] as const),
      relationship_types: freezeArray(["LINKED_TO", "DERIVED_FROM", "CAUSED_BY", "VALIDATED_BY", "BLOCKED_BY", "AUTHORIZED_BY", "REJECTED_BY", "SUPERVISED_BY", "INTERVENED_BY", "REPLAYED_BY", "VERIFIED_BY", "ROLLBACK_RECOMMENDED_BY", "OUTCOME_INFLUENCED_BY"] as const),
      reference_statuses: freezeArray(["VALID", "STALE", "MISSING", "CONFLICTING", "UNAUTHORIZED", "INVALID"] as const),
      deterministic_ordering_keys: freezeArray(["tenant_id", "mission_id", "ledger_source", "source_record_type", "source_record_id", "relationship_type", "target_record_type", "target_record_id"]),
      mutation_permitted: false,
      repair_permitted: false,
    }),
    response,
    validation: validateAutonomyCrossReferenceSearch(),
    observability: buildAutonomyCrossReferenceSearchObservabilitySurface(),
  });
}
