import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  buildAutonomyQueryAuditRecord,
  buildAutonomyQueryContract,
  validateAutonomyQueryContract,
} from "@/services/autonomy-query-contract";
import type { AutonomyQueryContract, AutonomyQueryContractInput, AutonomyQueryErrorState, AutonomyQueryValidationIssue } from "@/types/autonomy-query-contract";
import type {
  AutonomySearchAuditRecord,
  AutonomySearchDomain,
  AutonomySearchErrorState,
  AutonomySearchExecutionPlan,
  AutonomySearchIndexManifest,
  AutonomySearchIndexState,
  AutonomySearchInput,
  AutonomySearchObservabilitySurface,
  AutonomySearchRecord,
  AutonomySearchRecordType,
  AutonomySearchReplaySupport,
  AutonomySearchResponse,
  AutonomySearchResult,
  AutonomySearchResultState,
  AutonomySearchScenario,
} from "@/types/autonomy-search-engine";

const NOW = "2026-06-30T17:00:00.000Z";
const SCHEMA_VERSION = "autonomy-search-engine/v8I.2" as const;
const INDEX_VERSION = "autonomy-search-index/v8I.2" as const;
const ORDERING = ["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "record_id"] as const;
const FILTER_ORDER = ["Tenant", "Mission", "Authorization", "Record Type", "Time Range", "Execution State", "Policy", "Confidence", "Health", "Remaining Filters"] as const;
const DOMAINS: readonly AutonomySearchDomain[] = ["PLANNING", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "GOVERNANCE", "INTERVENTION", "REPLAY", "INTEGRITY", "BOUNDARY"];

const RECORD_BY_DOMAIN: Readonly<Record<AutonomySearchDomain, AutonomySearchRecordType>> = Object.freeze({
  PLANNING: "PLAN",
  EXECUTION: "EXECUTION",
  DELEGATION: "DELEGATION",
  ORCHESTRATION: "ORCHESTRATION",
  SUPERVISION: "SUPERVISION",
  GOVERNANCE: "POLICY",
  INTERVENTION: "INTERVENTION",
  REPLAY: "REPLAY",
  INTEGRITY: "INTEGRITY",
  BOUNDARY: "BOUNDARY_EVENT",
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function freezeArray<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...values]);
}

function uniqueSorted<T extends string>(values: readonly T[]): readonly T[] {
  return freezeArray([...new Set(values.filter((value) => value.trim().length > 0))].sort());
}

function errorIssue(state: AutonomySearchErrorState, path: string, message: string): AutonomyQueryValidationIssue {
  const queryState: Record<AutonomySearchErrorState, AutonomyQueryErrorState> = {
    CONSTITUTIONAL_REJECTION: "CONSTITUTIONAL_REJECTION",
    INDEX_CORRUPTION: "VALIDATION_FAILURE",
    INVALID_FILTER: "INVALID_QUERY",
    INVALID_QUERY: "INVALID_QUERY",
    INVALID_SCOPE: "INVALID_SCHEMA",
    LINEAGE_REFERENCE_INVALID: "LINEAGE_REFERENCE_INVALID",
    MISSION_SCOPE_VIOLATION: "MISSION_SCOPE_VIOLATION",
    OBJECT_NOT_FOUND: "OBJECT_NOT_FOUND",
    ORDERING_FAILURE: "ORDERING_FAILURE",
    POLICY_REJECTION: "GOVERNANCE_REJECTION",
    REPLAY_REFERENCE_INVALID: "REPLAY_REFERENCE_INVALID",
    TENANT_SCOPE_VIOLATION: "TENANT_SCOPE_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
    VALIDATION_FAILURE: "VALIDATION_FAILURE",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryInputForScenario(scenario: AutonomySearchScenario): AutonomyQueryContractInput {
  switch (scenario) {
    case "INVALID_QUERY": return { scenario: "UNSUPPORTED_QUERY_TYPE" };
    case "INVALID_SCOPE": return { query_scope: "OBJECT", target_reference: "" };
    case "UNAUTHORIZED": return { scenario: "UNAUTHORIZED_OPERATOR" };
    case "TENANT_SCOPE_VIOLATION": return { scenario: "TENANT_SCOPE_VIOLATION" };
    case "MISSION_SCOPE_VIOLATION": return { scenario: "MISSION_SCOPE_VIOLATION" };
    case "OBJECT_NOT_FOUND": return { scenario: "OBJECT_NOT_FOUND" };
    case "REPLAY_REFERENCE_INVALID": return { scenario: "REPLAY_REFERENCE_INVALID" };
    case "LINEAGE_REFERENCE_INVALID": return { scenario: "LINEAGE_REFERENCE_INVALID" };
    case "POLICY_REJECTION": return { scenario: "GOVERNANCE_REJECTION" };
    case "CONSTITUTIONAL_REJECTION": return { scenario: "CONSTITUTIONAL_REJECTION" };
    case "EXECUTION_SEARCH": return { query_type: "EXECUTION_LOOKUP", query_scope: "EXECUTION", target_reference: "execution:autonomy:001" };
    case "GOVERNANCE_SEARCH": return { query_type: "POLICY_LOOKUP", query_scope: "MISSION", authorization_level: "GOVERNANCE" };
    case "REPLAY_SEARCH": return { query_type: "REPLAY_LOOKUP", query_scope: "REPLAY", authorization_level: "AUDITOR" };
    case "LINEAGE_SEARCH": return { query_type: "LINEAGE_SEARCH", query_scope: "LINEAGE", authorization_level: "AUDITOR" };
    default: return {};
  }
}

function recordSource(contract: AutonomyQueryContract, domain: AutonomySearchDomain, ordinal: number, title: string, tags: readonly string[]): Omit<AutonomySearchRecord, "payload_hash"> {
  const record_type = RECORD_BY_DOMAIN[domain];
  return {
    search_record_id: `ASR-8I2-${ordinal.toString().padStart(3, "0")}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    domain,
    record_type,
    record_id: `${record_type.toLowerCase()}:autonomy:8i2:${ordinal.toString().padStart(3, "0")}`,
    object_reference: `${domain.toLowerCase()}:reference:${ordinal.toString().padStart(3, "0")}`,
    object_state: ordinal % 5 === 0 ? "REVIEW" : "ACTIVE",
    timestamp: `2026-06-${(10 + ordinal).toString().padStart(2, "0")}T10:00:00.000Z`,
    autonomy_event_sequence: 8000 + ordinal,
    replay_reference: contract.replay_reference,
    lineage_reference: `${contract.lineage_reference}:${ordinal}`,
    governance_reference: "governance:autonomy-query:8i2",
    policy_reference: ordinal % 2 === 0 ? "policy:tenant-isolation" : "policy:autonomy-integrity",
    confidence_level: 0.8 + (ordinal % 10) / 100,
    health_state: ordinal % 4 === 0 ? "DEGRADED" : "HEALTHY",
    execution_state: ordinal % 3 === 0 ? "COMPLETED" : "RUNNING",
    intervention_type: domain === "INTERVENTION" ? "ROLLBACK_RECOMMENDATION" : null,
    integrity_hash: hashValue("autonomy-search-integrity-hash", { domain, ordinal }),
    tags,
    summary: `${title} for ${contract.mission_id}; includes replay, lineage, governance, policy, confidence, and integrity references.`,
  };
}

function withHash(record: Omit<AutonomySearchRecord, "payload_hash">): AutonomySearchRecord {
  return Object.freeze({ ...record, payload_hash: hashValue("autonomy-search-record", record) });
}

export function buildAutonomySearchRecords(contract = buildAutonomyQueryContract()): readonly AutonomySearchRecord[] {
  return freezeArray([
    withHash(recordSource(contract, "PLANNING", 1, "Primary execution plan", ["plan", "dependency", "confidence"])),
    withHash(recordSource(contract, "EXECUTION", 2, "Execution checkpoint history", ["execution", "checkpoint", "runtime"])),
    withHash(recordSource(contract, "DELEGATION", 3, "Delegated task routing", ["delegation", "authority", "assignment"])),
    withHash(recordSource(contract, "ORCHESTRATION", 4, "Workflow orchestration event", ["orchestration", "workflow", "scheduler"])),
    withHash(recordSource(contract, "SUPERVISION", 5, "Runtime supervision drift event", ["supervision", "drift", "health"])),
    withHash(recordSource(contract, "GOVERNANCE", 6, "Governance policy check", ["governance", "policy", "constitutional"])),
    withHash(recordSource(contract, "INTERVENTION", 7, "Rollback intervention recommendation", ["intervention", "rollback", "recovery"])),
    withHash(recordSource(contract, "REPLAY", 8, "Autonomy replay verification", ["replay", "deterministic", "evidence"])),
    withHash(recordSource(contract, "INTEGRITY", 9, "Integrity verification evidence", ["integrity", "hash", "certification"])),
    withHash(recordSource(contract, "BOUNDARY", 10, "Boundary enforcement event", ["boundary", "tenant", "authority"])),
  ]);
}

function termsForInput(input: AutonomySearchInput): readonly string[] {
  if (input.scenario === "NO_MATCHES") return freezeArray(["no-such-autonomy-record"]);
  if (input.search_terms?.length) return uniqueSorted(input.search_terms.map((term) => term.toLowerCase()));
  if (input.scenario === "IDENTITY_SEARCH") return freezeArray([]);
  return freezeArray(["autonomy"]);
}

function domainsForInput(input: AutonomySearchInput, contract: AutonomyQueryContract): readonly AutonomySearchDomain[] {
  if (input.requested_domains?.length) return uniqueSorted(input.requested_domains);
  const map: Partial<Record<AutonomyQueryContract["query_type"], readonly AutonomySearchDomain[]>> = {
    PLAN_LOOKUP: ["PLANNING"],
    EXECUTION_LOOKUP: ["EXECUTION", "ORCHESTRATION", "BOUNDARY"],
    DELEGATION_LOOKUP: ["DELEGATION"],
    SUPERVISION_LOOKUP: ["SUPERVISION"],
    REPLAY_LOOKUP: ["REPLAY"],
    INTERVENTION_LOOKUP: ["INTERVENTION"],
    POLICY_LOOKUP: ["GOVERNANCE", "BOUNDARY"],
    HISTORICAL_RECONSTRUCTION: DOMAINS,
    LINEAGE_SEARCH: DOMAINS,
    CROSS_REFERENCE_SEARCH: DOMAINS,
  };
  return freezeArray(map[contract.query_type] ?? DOMAINS);
}

function plan(contract: AutonomyQueryContract, validation: ReturnType<typeof validateAutonomyQueryContract>, input: AutonomySearchInput, domains: readonly AutonomySearchDomain[]): AutonomySearchExecutionPlan {
  const strategy: AutonomySearchExecutionPlan["filter_strategy"] =
    input.scenario === "IDENTITY_SEARCH" ? "IMMUTABLE_IDENTIFIER_LOOKUP" :
    contract.query_type === "HISTORICAL_RECONSTRUCTION" ? "HISTORICAL_RECONSTRUCTION" :
    contract.query_type === "LINEAGE_SEARCH" ? "LINEAGE_TRAVERSAL" :
    contract.query_type === "REPLAY_LOOKUP" ? "REPLAY_REFERENCE_LOOKUP" :
    contract.query_type === "CROSS_REFERENCE_SEARCH" ? "CROSS_REFERENCE_SCAN" :
    "CANONICAL_FILTER_SCAN";
  const source = {
    plan_id: `ASP-8I2-${hashValue("autonomy-search-plan-id", { query: contract.autonomy_query_id, strategy }).slice(0, 10).toUpperCase()}`,
    normalized_query_hash: validation.normalized_query_hash,
    index_version: INDEX_VERSION,
    selected_domains: domains,
    filter_strategy: strategy,
    filter_evaluation_order: FILTER_ORDER,
    deterministic_ordering: ORDERING,
    replay_safe: validation.valid,
    read_only: true as const,
  };
  return Object.freeze({ ...source, plan_hash: hashValue("autonomy-search-plan", source) });
}

function manifest(records: readonly AutonomySearchRecord[], scenario?: AutonomySearchScenario): AutonomySearchIndexManifest {
  const state: AutonomySearchIndexState = scenario === "INDEX_CORRUPTION" || scenario === "MUTATION_ATTEMPT" ? "CORRUPTED" : "VERIFIED";
  const source = {
    index_id: `ASI-8I2-${hashValue("autonomy-search-index-id", records.map((record) => record.search_record_id)).slice(0, 10).toUpperCase()}`,
    index_version: INDEX_VERSION,
    state,
    domains: uniqueSorted(records.map((record) => record.domain)),
    record_types: uniqueSorted(records.map((record) => record.record_type)),
    record_count: records.length,
    verified_at: NOW,
  };
  return Object.freeze({ ...source, index_hash: hashValue("autonomy-search-index", source) });
}

function matches(record: AutonomySearchRecord, contract: AutonomyQueryContract, terms: readonly string[], identifier?: string, recordTypes?: readonly AutonomySearchRecordType[]): boolean {
  if (record.tenant_id !== contract.tenant_id || record.mission_id !== contract.mission_id) return false;
  if (recordTypes?.length && !recordTypes.includes(record.record_type)) return false;
  if (identifier) return record.search_record_id === identifier || record.record_id === identifier;
  if (contract.filters.execution_state?.length && !contract.filters.execution_state.includes(record.execution_state)) return false;
  if (contract.filters.policy?.length && !contract.filters.policy.includes(record.policy_reference)) return false;
  if (contract.filters.confidence?.min !== undefined && record.confidence_level < contract.filters.confidence.min) return false;
  if (contract.filters.confidence?.max !== undefined && record.confidence_level > contract.filters.confidence.max) return false;
  if (contract.filters.health_state?.length && !contract.filters.health_state.includes(record.health_state)) return false;
  if (!terms.length) return true;
  const haystack = [record.search_record_id, record.record_id, record.object_reference, record.summary, ...record.tags, record.policy_reference, record.governance_reference].join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term.toLowerCase()));
}

function sortRecords(records: readonly AutonomySearchRecord[]): readonly AutonomySearchRecord[] {
  return freezeArray([...records].sort((a, b) =>
    a.tenant_id.localeCompare(b.tenant_id) ||
    a.mission_id.localeCompare(b.mission_id) ||
    a.timestamp.localeCompare(b.timestamp) ||
    a.autonomy_event_sequence - b.autonomy_event_sequence ||
    a.record_id.localeCompare(b.record_id),
  ));
}

function result(record: AutonomySearchRecord, queryId: string, terms: readonly string[], identifier?: string): AutonomySearchResult {
  const termHits = terms.filter((term) => [record.summary, ...record.tags, record.record_id].join(" ").toLowerCase().includes(term)).length;
  const source = {
    query_id: queryId,
    search_record_id: record.search_record_id,
    record_type: record.record_type,
    record_id: record.record_id,
    summary: record.summary,
    timestamp: record.timestamp,
    confidence: record.confidence_level,
    governance_state: record.object_state,
    policy_reference: record.policy_reference,
    lineage_reference: record.lineage_reference,
    replay_reference: record.replay_reference,
    integrity_hash: record.integrity_hash,
    deterministic_score: (identifier && (record.search_record_id === identifier || record.record_id === identifier) ? 1000 : 0) + termHits * 100 + Math.round(record.confidence_level * 10),
    explanation: `Matched ${record.record_type} through immutable autonomy search index using canonical ordering, replay, lineage, governance, and integrity evidence.`,
  };
  return Object.freeze({ ...source, result_hash: hashValue("autonomy-search-result", source) });
}

function failureFromValidation(validation: ReturnType<typeof validateAutonomyQueryContract>): AutonomySearchErrorState | null {
  const states = validation.errors.map((error) => error.state);
  if (states.includes("TENANT_SCOPE_VIOLATION")) return "TENANT_SCOPE_VIOLATION";
  if (states.includes("MISSION_SCOPE_VIOLATION")) return "MISSION_SCOPE_VIOLATION";
  if (states.includes("CONSTITUTIONAL_REJECTION")) return "CONSTITUTIONAL_REJECTION";
  if (states.includes("GOVERNANCE_REJECTION")) return "POLICY_REJECTION";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("REPLAY_REFERENCE_INVALID")) return "REPLAY_REFERENCE_INVALID";
  if (states.includes("LINEAGE_REFERENCE_INVALID")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("OBJECT_NOT_FOUND")) return "OBJECT_NOT_FOUND";
  if (states.length) return "INVALID_QUERY";
  return null;
}

function scenarioFailure(scenario?: AutonomySearchScenario): AutonomySearchErrorState | null {
  switch (scenario) {
    case "INVALID_FILTER": return "INVALID_FILTER";
    case "INDEX_CORRUPTION":
    case "MUTATION_ATTEMPT": return "INDEX_CORRUPTION";
    case "ORDERING_FAILURE": return "ORDERING_FAILURE";
    default: return null;
  }
}

function replay(contract: AutonomyQueryContract, results: readonly AutonomySearchResult[], rankingStable: boolean): AutonomySearchReplaySupport {
  const source = {
    replay_reference: contract.replay_reference,
    reconstruction_hash: hashValue("autonomy-search-replay-reconstruction", { query_hash: contract.query_hash, results: results.map((item) => item.result_hash) }),
    source_query_hash: contract.query_hash,
    result_hashes: freezeArray(results.map((item) => item.result_hash)),
    ranking_stable: rankingStable,
    replay_safe: rankingStable && results.every((item) => Boolean(item.replay_reference)),
  };
  return Object.freeze(source);
}

function buildAudit(contract: AutonomyQueryContract, resultCount: number, searchId: string, searchHash: string, indexHash: string, planHash: string, resultState: AutonomySearchResultState): AutonomySearchAuditRecord {
  const queryAudit = buildAutonomyQueryAuditRecord(contract, resultCount);
  return Object.freeze({ ...queryAudit, search_id: searchId, search_hash: searchHash, index_hash: indexHash, plan_hash: planHash, result_state: resultState });
}

export function runAutonomySearch(input: AutonomySearchInput = {}): AutonomySearchResponse {
  const scenario = input.scenario ?? "BASELINE";
  const contract = input.query_contract ?? buildAutonomyQueryContract(queryInputForScenario(scenario));
  const validation = validateAutonomyQueryContract(contract);
  const terms = termsForInput(input);
  const domains = domainsForInput(input, contract);
  const recordTypes = input.requested_record_types;
  const identifier = input.immutable_identifier ?? (scenario === "IDENTITY_SEARCH" ? "execution:autonomy:8i2:002" : undefined);
  const allRecords = freezeArray(input.records ?? buildAutonomySearchRecords(contract));
  const index_manifest = manifest(allRecords, scenario);
  const optimizer_plan = plan(contract, validation, input, domains);
  const failure = failureFromValidation(validation) ?? scenarioFailure(scenario);
  const filtered = failure ? [] : sortRecords(allRecords.filter((record) => domains.includes(record.domain) && matches(record, contract, terms, identifier, recordTypes)));
  const results = freezeArray(filtered.map((record) => result(record, contract.autonomy_query_id, terms, identifier)));
  const result_state: AutonomySearchResultState = failure ?? (results.length === 0 ? "NO_RESULTS" : "RESULTS_GENERATED");
  const rankingStable = scenario !== "ORDERING_FAILURE" && sortRecords(filtered).map((record) => record.record_id).join("|") === filtered.map((record) => record.record_id).join("|");
  const replay_support = replay(contract, results, rankingStable && !failure);
  const failures = freezeArray([
    ...validation.errors,
    ...(failure && !failureFromValidation(validation) ? [errorIssue(failure, "autonomy_search", `${failure} detected during deterministic search execution.`)] : []),
  ]);
  const search_id = `AS-8I2-${hashValue("autonomy-search-id", { query: contract.autonomy_query_id, scenario, terms, identifier }).slice(0, 10).toUpperCase()}`;
  const hashSource = { search_id, query_hash: validation.valid ? contract.query_hash : null, result_state, results: results.map((item) => item.result_hash), index_hash: index_manifest.index_hash, plan_hash: optimizer_plan.plan_hash, failures: failures.map((item) => item.state) };
  const search_hash = hashValue("autonomy-search-response", hashSource);
  const audit_record = buildAudit(contract, results.length, search_id, search_hash, index_manifest.index_hash, optimizer_plan.plan_hash, result_state);
  return Object.freeze({
    phase_version: "8I.2" as const,
    schema_version: SCHEMA_VERSION,
    search_id,
    query_id: contract.autonomy_query_id || null,
    query_hash: validation.valid ? contract.query_hash : null,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    query_type: contract.query_type,
    result_state,
    result_count: results.length,
    results,
    validation,
    optimizer_plan,
    index_manifest,
    replay_support,
    audit_record,
    failures,
    search_hash,
    read_only: true as const,
    advisory_only_notice: "Autonomy search is deterministic, read-only, replayable, tenant-isolated, and audit-backed." as const,
  });
}

export function validateAutonomySearch(input: AutonomySearchInput = {}) {
  const response = runAutonomySearch(input);
  return Object.freeze({
    search_id: response.search_id,
    valid: response.result_state === "RESULTS_GENERATED" || response.result_state === "NO_RESULTS",
    result_state: response.result_state,
    errors: response.failures,
    index_state: response.index_manifest.state,
    ranking_stable: response.replay_support.ranking_stable,
    replay_safe: response.replay_support.replay_safe,
    search_hash: response.search_hash,
  });
}

export function computeAutonomySearchHash(response: AutonomySearchResponse): string {
  return hashValue("autonomy-search-response", {
    search_id: response.search_id,
    query_hash: response.query_hash,
    result_state: response.result_state,
    results: response.results.map((item) => item.result_hash),
    index_hash: response.index_manifest.index_hash,
    plan_hash: response.optimizer_plan.plan_hash,
    failures: response.failures.map((item) => item.state),
  });
}

export function buildAutonomySearchObservabilitySurface(input: AutonomySearchInput = {}): AutonomySearchObservabilitySurface {
  const response = runAutonomySearch(input);
  const errors = response.result_state === "RESULTS_GENERATED" || response.result_state === "NO_RESULTS" ? [] : [response.result_state as AutonomySearchErrorState];
  return Object.freeze({
    search_id: response.search_id,
    query_id: response.query_id,
    result_state: response.result_state,
    result_count: response.result_count,
    errors: freezeArray(errors),
    index_state: response.index_manifest.state,
    ranking_stable: response.replay_support.ranking_stable,
    replay_safe: response.replay_support.replay_safe,
    search_hash: response.search_hash,
  });
}

export function getAutonomySearchEngineContract() {
  const response = runAutonomySearch();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "read-only", "replayable", "explainable", "auditable", "constitutionally-governed", "policy-aware", "tenant-isolated", "immutable", "reproducible"]),
      schema_version: SCHEMA_VERSION,
      index_version: INDEX_VERSION,
      supported_domains: freezeArray(DOMAINS),
      indexed_record_types: freezeArray(["PLAN", "EXECUTION", "DELEGATION", "ORCHESTRATION", "SUPERVISION", "INTERVENTION", "POLICY", "BOUNDARY_EVENT", "REPLAY", "INTEGRITY"] as const),
      filter_evaluation_order: FILTER_ORDER,
      deterministic_ordering: ORDERING,
      error_states: freezeArray(["INVALID_QUERY", "INVALID_FILTER", "INVALID_SCOPE", "UNAUTHORIZED", "TENANT_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION", "OBJECT_NOT_FOUND", "REPLAY_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID", "INDEX_CORRUPTION", "ORDERING_FAILURE", "VALIDATION_FAILURE", "POLICY_REJECTION", "CONSTITUTIONAL_REJECTION"] as const),
    }),
    response,
    validation: validateAutonomySearch(),
    observability: buildAutonomySearchObservabilitySurface(),
  });
}
