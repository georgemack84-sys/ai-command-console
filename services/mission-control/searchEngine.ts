import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { validateTruthLedgerQueryContract } from "./queryContract";
import type {
  SearchAuditRecord,
  SearchReplayMetadata,
  TruthIntegrityFinalCertificationState,
  TruthLedgerQueryContract,
  TruthLedgerSearchAuditRecord,
  TruthLedgerSearchExecutionContext,
  TruthLedgerSearchIndexRecord,
  TruthLedgerSearchLookupType,
  TruthLedgerSearchRequest,
  TruthLedgerSearchResponse,
  TruthLedgerSearchResult,
  TruthLedgerSearchResultState,
  TruthLedgerSearchVisibilityState,
} from "./types";

const SEARCH_SCHEMA_VERSION = "mission-control-search-schema/v1";
const TOKENIZER_VERSION = "mission-control-tokenizer/v1";

const LOOKUP_PERMISSION: Readonly<Record<TruthLedgerSearchLookupType, string>> = Object.freeze({
  RECOMMENDATION_LOOKUP: "truth.recommendation.read",
  DECISION_LOOKUP: "truth.decision.read",
  EVIDENCE_LOOKUP: "truth.evidence.read",
});

const VIEW_PERMISSION: Readonly<Record<string, string>> = Object.freeze({
  GOVERNANCE_VIEW: "truth.governance.read",
  REPLAY_VIEW: "truth.replay.read",
  INTEGRITY_VIEW: "truth.integrity.read",
  CERTIFICATION_VIEW: "truth.certification.read",
  EVIDENCE_VIEW: "truth.evidence.read",
  RAW_RECORD: "truth.raw.read",
});

const INTEGRITY_RANK: Readonly<Record<TruthIntegrityFinalCertificationState, number>> = Object.freeze({
  CORRUPTED: 0,
  DEGRADED: 1,
  VALID: 2,
});

function hashValue(domain: string, value: unknown): string {
  return hashConfidenceValue(domain, canonicalizeConfidenceToString(value));
}

function unique<T>(values: readonly T[]): readonly T[] {
  return Object.freeze([...new Set(values)]);
}

function emptyResponse(
  contract: TruthLedgerQueryContract | undefined,
  request: TruthLedgerSearchRequest,
  state: TruthLedgerSearchResultState,
  warnings: readonly string[],
): TruthLedgerSearchResponse {
  const queryHash = contract ? hashValue("mission-control-query-contract-hash", contract) : hashValue("mission-control-missing-query-contract-hash", request.query_contract_ref);
  const resultHash = hashValue("mission-control-search-result-hash", { state, results: [], warnings });
  return Object.freeze({
    search_id: request.search_id,
    query_id: contract?.query_id ?? request.query_contract_ref,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    lookup_type: request.lookup_type,
    search_mode: request.search_mode,
    result_state: state,
    result_count: 0,
    results: Object.freeze([]),
    redaction_applied: false,
    redaction_refs: Object.freeze([]),
    governance_decision_ref: contract?.governance_context.governance_policy_refs[0],
    authority_decision_ref: contract?.authority_context.verification_ref,
    integrity_decision_ref: contract?.integrity_requirements.minimum_integrity_state,
    query_hash: queryHash,
    result_hash: resultHash,
    replay_ref: contract?.replay_requirements.replay_ref,
    executed_at: request.created_at,
    warnings: Object.freeze(warnings),
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  });
}

function compatibleQueryType(contract: TruthLedgerQueryContract, lookup: TruthLedgerSearchLookupType): boolean {
  if (lookup === "RECOMMENDATION_LOOKUP") return contract.query_type === "RECOMMENDATION_LOOKUP";
  if (lookup === "EVIDENCE_LOOKUP") return contract.query_type === "EVIDENCE_LOOKUP";
  return contract.query_type === "TRUTH_RECORD_LOOKUP" || contract.query_type === "AUDIT_QUERY" || contract.query_type === "RELATIONSHIP_QUERY";
}

function hasPermission(contract: TruthLedgerQueryContract, request: TruthLedgerSearchRequest): boolean {
  const permissions = new Set(contract.authority_context.permissions);
  const required = LOOKUP_PERMISSION[request.lookup_type];
  const viewPermissions = request.requested_views.flatMap((view) => VIEW_PERMISSION[view] ? [VIEW_PERMISSION[view]] : []);
  return permissions.has(required) && viewPermissions.every((permission) => permissions.has(permission));
}

function deterministicOrderingValid(request: TruthLedgerSearchRequest): boolean {
  return request.ordering_policy.tie_breakers.includes("truth_record_id")
    && request.pagination_policy.limit > 0
    && request.pagination_policy.limit <= request.pagination_policy.max_limit
    && request.pagination_policy.deterministic_cursor_required;
}

function textMatches(record: TruthLedgerSearchIndexRecord, terms: readonly string[] | undefined): boolean {
  if (!terms || terms.length === 0) return true;
  const tokens = new Set(record.searchable_tokens.map((token) => token.toLowerCase()));
  const fields = record.searchable_fields.join(" ").toLowerCase();
  return terms.every((term) => tokens.has(term.toLowerCase()) || fields.includes(term.toLowerCase()));
}

function arrayMatches(values: readonly string[] | undefined, requested: readonly string[] | undefined): boolean {
  if (!requested || requested.length === 0) return true;
  return requested.some((item) => values?.includes(item));
}

function recordMatches(request: TruthLedgerSearchRequest, record: TruthLedgerSearchIndexRecord): boolean {
  const filters = request.filters;
  if (record.lookup_type !== request.lookup_type) return false;
  if (record.tenant_id !== request.tenant_id) return false;
  if (request.mission_id && record.mission_id !== request.mission_id) return false;
  if (!arrayMatches([record.truth_record_id], filters.truth_record_ids)) return false;
  if (!arrayMatches(record.governance_refs, filters.governance_refs)) return false;
  if (!arrayMatches(record.replay_refs, filters.replay_refs)) return false;
  if (!arrayMatches(record.lineage_refs, filters.lineage_refs)) return false;
  if (filters.event_types && !filters.event_types.includes(record.record_type)) return false;
  if (filters.lifecycle_states && !filters.lifecycle_states.includes(record.lifecycle_state)) return false;
  if (filters.integrity_states && !filters.integrity_states.includes(record.integrity_state)) return false;
  if (filters.certification_states && (!record.certification_state || !filters.certification_states.includes(record.certification_state))) return false;
  if (filters.created_after && Date.parse(record.created_at) < Date.parse(filters.created_after)) return false;
  if (filters.created_before && Date.parse(record.created_at) > Date.parse(filters.created_before)) return false;
  if (!textMatches(record, request.search_terms)) return false;

  if (request.lookup_type === "RECOMMENDATION_LOOKUP") {
    if (!arrayMatches(record.recommendation_id ? [record.recommendation_id] : [], filters.recommendation_ids)) return false;
    if (filters.recommendation_states && (!record.recommendation_state || !filters.recommendation_states.includes(record.recommendation_state))) return false;
    if (filters.supports_record_id && !(record.supporting_evidence_refs ?? []).includes(filters.supports_record_id)) return false;
    if (filters.conflicts_with_record_id && !(record.conflicting_evidence_refs ?? []).includes(filters.conflicts_with_record_id)) return false;
  }
  if (request.lookup_type === "DECISION_LOOKUP") {
    if (!arrayMatches(record.decision_id ? [record.decision_id] : [], filters.decision_ids)) return false;
    if (filters.decision_states && (!record.decision_state || !filters.decision_states.includes(record.decision_state))) return false;
    if (filters.supports_record_id && !(record.evidence_refs ?? []).includes(filters.supports_record_id)) return false;
  }
  if (request.lookup_type === "EVIDENCE_LOOKUP") {
    if (!arrayMatches(record.evidence_id ? [record.evidence_id] : [], filters.evidence_ids)) return false;
    if (filters.evidence_states && (!record.evidence_state || !filters.evidence_states.includes(record.evidence_state))) return false;
    if (filters.supports_record_id && !(record.supports_record_refs ?? []).includes(filters.supports_record_id)) return false;
    if (filters.conflicts_with_record_id && !(record.conflicts_with_record_refs ?? []).includes(filters.conflicts_with_record_id)) return false;
    if (filters.depends_on_record_id && !(record.depends_on_record_refs ?? []).includes(filters.depends_on_record_id)) return false;
    if (filters.influenced_record_id && !(record.influenced_record_refs ?? []).includes(filters.influenced_record_id)) return false;
  }
  return true;
}

function orderValue(record: TruthLedgerSearchIndexRecord, key: TruthLedgerSearchRequest["ordering_policy"]["order_by"]): string | number {
  if (key === "recommendation_id") return record.recommendation_id ?? "";
  if (key === "decision_id") return record.decision_id ?? "";
  if (key === "evidence_id") return record.evidence_id ?? "";
  if (key === "event_sequence") return record.event_sequence ?? 0;
  if (key === "lineage_depth") return record.lineage_depth ?? 0;
  if (key === "integrity_state") return record.integrity_state;
  return record[key];
}

function sortRecords(request: TruthLedgerSearchRequest, records: readonly TruthLedgerSearchIndexRecord[]): readonly TruthLedgerSearchIndexRecord[] {
  const direction = request.ordering_policy.direction === "ASC" ? 1 : -1;
  return Object.freeze([...records].sort((a, b) => {
    const primaryA = orderValue(a, request.ordering_policy.order_by);
    const primaryB = orderValue(b, request.ordering_policy.order_by);
    if (primaryA < primaryB) return -1 * direction;
    if (primaryA > primaryB) return 1 * direction;
    return a.truth_record_id.localeCompare(b.truth_record_id);
  }));
}

function visibility(record: TruthLedgerSearchIndexRecord, governanceDecision: string | undefined): TruthLedgerSearchVisibilityState {
  if (governanceDecision === "DENY" || governanceDecision === "ESCALATE") return "DENIED";
  if (record.restricted && governanceDecision === "SUMMARY_ONLY") return "SUMMARY_ONLY";
  if (record.restricted || governanceDecision === "ALLOW_WITH_REDACTION") return "PARTIALLY_VISIBLE";
  return "VISIBLE";
}

function shapeResult(record: TruthLedgerSearchIndexRecord, visibilityState: TruthLedgerSearchVisibilityState): TruthLedgerSearchResult | undefined {
  if (visibilityState === "DENIED") return undefined;
  if (record.lookup_type === "RECOMMENDATION_LOOKUP") {
    return Object.freeze({
      recommendation_id: record.recommendation_id ?? "",
      truth_record_id: record.truth_record_id,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      recommendation_state: record.recommendation_state ?? "PROPOSED",
      recommendation_summary: record.recommendation_summary ?? "",
      recommendation_type: visibilityState === "SUMMARY_ONLY" ? undefined : record.recommendation_type,
      supporting_evidence_refs: Object.freeze([...(record.supporting_evidence_refs ?? [])]),
      conflicting_evidence_refs: Object.freeze([...(record.conflicting_evidence_refs ?? [])]),
      risk_refs: Object.freeze(visibilityState === "SUMMARY_ONLY" ? [] : [...(record.risk_refs ?? [])]),
      confidence_refs: Object.freeze(visibilityState === "SUMMARY_ONLY" ? [] : [...(record.confidence_refs ?? [])]),
      governance_refs: Object.freeze([...(record.governance_refs ?? [])]),
      decision_refs: Object.freeze([...(record.decision_refs ?? [])]),
      replay_refs: Object.freeze([...(record.replay_refs ?? [])]),
      lineage_refs: Object.freeze([...(record.lineage_refs ?? [])]),
      integrity_state: record.integrity_state,
      visibility_state: visibilityState,
    });
  }
  if (record.lookup_type === "DECISION_LOOKUP") {
    return Object.freeze({
      decision_id: record.decision_id ?? "",
      truth_record_id: record.truth_record_id,
      tenant_id: record.tenant_id,
      mission_id: record.mission_id,
      decision_state: record.decision_state ?? "PROPOSED",
      decision_summary: record.decision_summary ?? "",
      decision_rationale_refs: Object.freeze(visibilityState === "SUMMARY_ONLY" ? [] : [...(record.decision_rationale_refs ?? [])]),
      recommendation_refs: Object.freeze([...(record.recommendation_refs ?? [])]),
      evidence_refs: Object.freeze([...(record.evidence_refs ?? [])]),
      operator_refs: Object.freeze(visibilityState === "SUMMARY_ONLY" ? [] : [...(record.operator_refs ?? [])]),
      governance_refs: Object.freeze([...(record.governance_refs ?? [])]),
      risk_refs: Object.freeze(visibilityState === "SUMMARY_ONLY" ? [] : [...(record.risk_refs ?? [])]),
      confidence_refs: Object.freeze(visibilityState === "SUMMARY_ONLY" ? [] : [...(record.confidence_refs ?? [])]),
      replay_refs: Object.freeze([...(record.replay_refs ?? [])]),
      lineage_refs: Object.freeze([...(record.lineage_refs ?? [])]),
      integrity_state: record.integrity_state,
      visibility_state: visibilityState,
    });
  }
  return Object.freeze({
    evidence_id: record.evidence_id ?? "",
    truth_record_id: record.truth_record_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_id,
    evidence_type: record.evidence_type ?? "DOCUMENT",
    evidence_state: record.evidence_state ?? "REGISTERED",
    evidence_summary: record.evidence_summary ?? "",
    evidence_source_ref: visibilityState === "SUMMARY_ONLY" ? undefined : record.evidence_source_ref,
    supports_record_refs: Object.freeze([...(record.supports_record_refs ?? [])]),
    conflicts_with_record_refs: Object.freeze([...(record.conflicts_with_record_refs ?? [])]),
    depends_on_record_refs: Object.freeze([...(record.depends_on_record_refs ?? [])]),
    influenced_record_refs: Object.freeze([...(record.influenced_record_refs ?? [])]),
    governance_refs: Object.freeze([...(record.governance_refs ?? [])]),
    replay_refs: Object.freeze([...(record.replay_refs ?? [])]),
    lineage_refs: Object.freeze([...(record.lineage_refs ?? [])]),
    integrity_state: record.integrity_state,
    certification_state: record.certification_state,
    visibility_state: visibilityState,
  });
}

function responseState(results: readonly TruthLedgerSearchResult[], redactionApplied: boolean, partial: boolean): TruthLedgerSearchResultState {
  if (results.length === 0) return "EMPTY";
  if (redactionApplied) return "REDACTED";
  if (partial) return "PARTIAL";
  return "COMPLETE";
}

export function searchTruthLedger(
  contract: TruthLedgerQueryContract | undefined,
  request: TruthLedgerSearchRequest,
  indexRecords: readonly TruthLedgerSearchIndexRecord[],
  context: TruthLedgerSearchExecutionContext = {},
): TruthLedgerSearchResponse {
  if (!contract) return emptyResponse(contract, request, "INVALID_QUERY", ["Search requires a Query Contract."]);
  const validation = validateTruthLedgerQueryContract(contract, {
    observed_integrity_state: context.observed_integrity_state,
    mutation_attempted: context.mutation_attempted,
  });
  if (!validation.valid) {
    const blockedState: TruthLedgerSearchResultState =
      validation.result_state === "AUTHORITY_BLOCKED" ? "AUTHORITY_BLOCKED" :
        validation.result_state === "GOVERNANCE_BLOCKED" ? "GOVERNANCE_BLOCKED" :
          validation.result_state === "INTEGRITY_BLOCKED" ? "INTEGRITY_BLOCKED" :
            validation.reason_codes.includes("REPLAY_REQUIREMENTS_FAILED") ? "REPLAY_REQUIRED" :
              "INVALID_QUERY";
    return emptyResponse(contract, request, blockedState, validation.errors);
  }
  if (request.query_contract_ref !== contract.query_id || request.tenant_id !== contract.tenant_id || !compatibleQueryType(contract, request.lookup_type)) {
    return emptyResponse(contract, request, "INVALID_QUERY", ["Search request is not bound to the supplied Query Contract."]);
  }
  if (!hasPermission(contract, request)) return emptyResponse(contract, request, "AUTHORITY_BLOCKED", ["Requester lacks lookup or requested-view permission."]);
  if (!deterministicOrderingValid(request)) return emptyResponse(contract, request, "INVALID_QUERY", ["Search ordering and pagination must be deterministic."]);
  if (context.mutation_attempted) return emptyResponse(contract, request, "INVALID_QUERY", ["Search is read-only and cannot mutate records."]);
  if (contract.replay_requirements.replay_required && (!request.replay_requirements_ref || !contract.replay_requirements.replay_ref)) {
    return emptyResponse(contract, request, "REPLAY_REQUIRED", ["Replay-required search is missing replay metadata."]);
  }
  const governanceDecision = context.governance_decision ?? (contract.redaction_policy.redaction_required ? "ALLOW_WITH_REDACTION" : "ALLOW");
  if (governanceDecision === "DENY" || governanceDecision === "ESCALATE") {
    return emptyResponse(contract, request, "GOVERNANCE_BLOCKED", ["Governance decision blocks protected search results."]);
  }

  const corruptedMatches = indexRecords.filter((record) => recordMatches(request, record) && record.integrity_state === "CORRUPTED");
  if (corruptedMatches.length > 0 || context.observed_integrity_state === "CORRUPTED") {
    return emptyResponse(contract, request, "INTEGRITY_BLOCKED", ["Corrupted search result cannot be returned as trusted truth."]);
  }
  const minimum = contract.integrity_requirements.minimum_integrity_state;
  const matches = sortRecords(request, indexRecords.filter((record) => {
    if (!recordMatches(request, record)) return false;
    return INTEGRITY_RANK[record.integrity_state] >= INTEGRITY_RANK[minimum] || record.integrity_state === "DEGRADED";
  })).slice(0, request.pagination_policy.limit);

  const degraded = matches.some((record) => record.integrity_state === "DEGRADED");
  const redactionRequired = governanceDecision === "ALLOW_WITH_REDACTION" || governanceDecision === "SUMMARY_ONLY" || matches.some((record) => record.restricted);
  if (matches.some((record) => record.restricted) && !contract.redaction_policy.redaction_required) {
    return emptyResponse(contract, request, "DENIED", ["Restricted search result requires redaction policy."]);
  }
  if (degraded && !request.requested_views.includes("INTEGRITY_VIEW")) {
    return emptyResponse(contract, request, "INTEGRITY_BLOCKED", ["Degraded search result requires integrity warning visibility."]);
  }

  const redactionRefs = unique(matches.flatMap((record) => record.restricted_fields ?? []));
  const results = Object.freeze(matches.flatMap((record) => {
    const item = shapeResult(record, visibility(record, governanceDecision));
    return item ? [item] : [];
  }));
  const state = responseState(results, redactionRequired, results.length < matches.length);
  const warnings = unique([
    ...(degraded ? ["One or more search results are integrity-degraded and must be treated as warning-labeled truth."] : []),
    ...(redactionRequired ? ["Governance or record restriction applied redaction to search results."] : []),
  ]);
  const queryHash = validation.query_hash;
  const resultHash = hashValue("mission-control-search-result-hash", {
    search_id: request.search_id,
    query_id: contract.query_id,
    lookup_type: request.lookup_type,
    search_mode: request.search_mode,
    result_state: state,
    results,
    index_version: context.index_version ?? matches[0]?.index_version,
    ordering_policy: request.ordering_policy,
    filters: request.filters,
  });

  return Object.freeze({
    search_id: request.search_id,
    query_id: contract.query_id,
    tenant_id: request.tenant_id,
    mission_id: request.mission_id,
    lookup_type: request.lookup_type,
    search_mode: request.search_mode,
    result_state: state,
    result_count: results.length,
    results,
    redaction_applied: redactionRequired,
    redaction_refs: Object.freeze(redactionRefs),
    governance_decision_ref: request.governance_context_ref,
    authority_decision_ref: request.authority_context_ref,
    integrity_decision_ref: request.integrity_requirements_ref,
    query_hash: queryHash,
    result_hash: resultHash,
    replay_ref: contract.replay_requirements.replay_ref,
    executed_at: request.created_at,
    warnings,
    readOnly: true as const,
    sourceMutationAllowed: false as const,
  });
}

export function createTruthLedgerSearchReplayMetadata(
  request: TruthLedgerSearchRequest,
  response: TruthLedgerSearchResponse,
  context: TruthLedgerSearchExecutionContext = {},
): SearchReplayMetadata {
  return Object.freeze({
    search_id: request.search_id,
    query_id: response.query_id,
    query_hash: response.query_hash,
    result_hash: response.result_hash,
    index_version: context.index_version ?? "search-index/v1",
    search_schema_version: context.search_schema_version ?? SEARCH_SCHEMA_VERSION,
    tokenizer_version: context.tokenizer_version ?? TOKENIZER_VERSION,
    ordering_policy_hash: hashValue("mission-control-search-ordering-policy-hash", request.ordering_policy),
    filter_hash: hashValue("mission-control-search-filter-hash", request.filters),
    authority_decision_ref: response.authority_decision_ref,
    governance_decision_ref: response.governance_decision_ref,
    integrity_decision_ref: response.integrity_decision_ref,
    executed_at: response.executed_at,
  });
}

export function createTruthLedgerSearchAuditRecord(
  contract: TruthLedgerQueryContract,
  request: TruthLedgerSearchRequest,
  response: TruthLedgerSearchResponse,
): TruthLedgerSearchAuditRecord {
  return Object.freeze({
    search_id: request.search_id,
    query_id: contract.query_id,
    tenant_id: response.tenant_id,
    mission_id: response.mission_id,
    requester_type: contract.requester_type,
    lookup_type: request.lookup_type,
    result_state: response.result_state,
    result_count: response.result_count,
    redaction_applied: response.redaction_applied,
    authority_decision_ref: response.authority_decision_ref,
    governance_decision_ref: response.governance_decision_ref,
    integrity_decision_ref: response.integrity_decision_ref,
    replay_ref: response.replay_ref,
    query_hash: response.query_hash,
    result_hash: response.result_hash,
    created_at: response.executed_at,
  });
}
