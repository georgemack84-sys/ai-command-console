import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import {
  buildGovernanceQueryAuditRecord,
  buildGovernanceQueryContract,
  validateGovernanceQueryContract,
} from "@/services/governance-query-contract";
import type {
  GovernanceQueryContract,
  GovernanceQueryContractInput,
  GovernanceQueryErrorState,
  GovernanceQueryTargetObject,
  GovernanceQueryType,
  GovernanceQueryValidationIssue,
  GovernanceQueryValidationResult,
} from "@/types/governance-query-contract";
import type {
  GovernanceSearchAuditRecord,
  GovernanceSearchDomain,
  GovernanceSearchErrorState,
  GovernanceSearchExecutionPlan,
  GovernanceSearchIndexManifest,
  GovernanceSearchIndexState,
  GovernanceSearchInput,
  GovernanceSearchObservabilitySurface,
  GovernanceSearchRecord,
  GovernanceSearchReplaySupport,
  GovernanceSearchResponse,
  GovernanceSearchResult,
  GovernanceSearchResultState,
  GovernanceSearchScenario,
} from "@/types/governance-search-engine";

const NOW = "2026-06-27T13:00:00.000Z";
const SCHEMA_VERSION = "governance-search-engine/v7J.2" as const;
const INDEX_VERSION = "governance-search-index/v7J.2" as const;
const ORDERING = ["TENANT", "MISSION", "GOVERNANCE_TIMESTAMP", "LEDGER_SEQUENCE", "LINEAGE_HIERARCHY", "IMMUTABLE_IDENTIFIER", "OBJECT_VERSION"] as const;
const DOMAINS: readonly GovernanceSearchDomain[] = ["AUDIT", "CERTIFICATION", "COMPLIANCE", "ESCALATION", "EVIDENCE", "LINEAGE", "POLICY", "RECOMMENDATION", "REPLAY", "RISK", "TRUTH_LEDGER", "VIOLATION"];

const DOMAIN_BY_TARGET: Readonly<Record<GovernanceQueryTargetObject, GovernanceSearchDomain>> = Object.freeze({
  AUTHORITY_ASSIGNMENT: "POLICY",
  CERTIFICATION_RESULT: "CERTIFICATION",
  COMPLIANCE_EVALUATION: "COMPLIANCE",
  ESCALATION: "ESCALATION",
  EVIDENCE: "EVIDENCE",
  GOVERNANCE_DECISION: "TRUTH_LEDGER",
  INTEGRITY_RECORD: "TRUTH_LEDGER",
  LINEAGE_CHAIN: "LINEAGE",
  POLICY: "POLICY",
  RECOMMENDATION: "RECOMMENDATION",
  REPLAY_SESSION: "REPLAY",
  REPLAY_SNAPSHOT: "REPLAY",
  RISK_ASSESSMENT: "RISK",
  TRUTH_RECORD: "TRUTH_LEDGER",
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

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function errorIssue(state: GovernanceSearchErrorState, path: string, message: string): GovernanceQueryValidationIssue {
  const queryState: Record<GovernanceSearchErrorState, GovernanceQueryErrorState> = {
    CONSTITUTIONAL_VIOLATION: "CONSTITUTIONAL_VIOLATION",
    INDEX_INCONSISTENT: "VALIDATION_FAILED",
    INVALID_FILTER: "INVALID_QUERY",
    INVALID_QUERY: "INVALID_QUERY",
    INVALID_SCOPE: "INVALID_SCOPE",
    LINEAGE_REFERENCE_INVALID: "INVALID_LINEAGE_REFERENCE",
    REPLAY_REFERENCE_INVALID: "INVALID_REPLAY_REFERENCE",
    SEARCH_TARGET_NOT_FOUND: "VALIDATION_FAILED",
    TENANT_ISOLATION_VIOLATION: "TENANT_ISOLATION_VIOLATION",
    UNAUTHORIZED: "UNAUTHORIZED",
  };
  return Object.freeze({ state: queryState[state], path, message });
}

function queryInputForScenario(scenario: GovernanceSearchScenario): GovernanceQueryContractInput {
  switch (scenario) {
    case "INVALID_QUERY":
      return { scenario: "UNSUPPORTED_QUERY" };
    case "INVALID_SCOPE":
      return { scenario: "GOVERNANCE_SCOPE_UNDEFINED" };
    case "UNAUTHORIZED":
      return { scenario: "AUTHORIZATION_INSUFFICIENT" };
    case "TENANT_ISOLATION_VIOLATION":
      return { scenario: "TENANT_ISOLATION_VIOLATION" };
    case "CONSTITUTIONAL_VIOLATION":
      return { scenario: "CONSTITUTIONAL_VIOLATION" };
    case "REPLAY_REFERENCE_INVALID":
      return { scenario: "INVALID_REPLAY_SCOPE" };
    case "LINEAGE_REFERENCE_INVALID":
      return { scenario: "INVALID_LINEAGE_REFERENCE" };
    case "HISTORICAL_SEARCH":
      return { query_type: "GOVERNANCE_HISTORY", target_object: "TRUTH_RECORD", authorization_level: "GOVERNANCE" };
    case "LINEAGE_SEARCH":
      return { query_type: "LINEAGE_LOOKUP", target_object: "LINEAGE_CHAIN", authorization_level: "GOVERNANCE" };
    case "REPLAY_SEARCH":
      return { query_type: "REPLAY_LOOKUP", target_object: "REPLAY_SESSION", authorization_level: "GOVERNANCE" };
    default:
      return {};
  }
}

function recordSource(
  contract: GovernanceQueryContract,
  domain: GovernanceSearchDomain,
  object_type: GovernanceQueryTargetObject,
  query_type: GovernanceQueryType,
  ordinal: number,
  title: string,
  tags: readonly string[],
): Omit<GovernanceSearchRecord, "payload_hash"> {
  return {
    immutable_identifier: `governance:${domain.toLowerCase()}:7j2:${ordinal.toString().padStart(3, "0")}`,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    domain,
    object_type,
    query_type,
    title,
    summary: `${title} for ${contract.mission_id} with deterministic evidence, lineage, replay, and integrity references.`,
    governance_timestamp: `2026-06-${(10 + ordinal).toString().padStart(2, "0")}T09:00:00.000Z`,
    ledger_sequence: 7000 + ordinal,
    lineage_hierarchy: `root/mission/${ordinal.toString().padStart(2, "0")}`,
    object_version: "v1",
    policy_refs: ["policy:governance-integrity", "policy:tenant-isolation"],
    authority_refs: ["authority:constitutional-governance", "authority:mission-control"],
    evidence_refs: [`evidence:7j2:${ordinal}:primary`, `evidence:7j2:${ordinal}:integrity`],
    replay_refs: [contract.replay_scope.replay_id, `replay:7j2:${ordinal}:search`],
    lineage_refs: [contract.lineage_scope.lineage_reference, `lineage:7j2:${ordinal}:root`],
    truth_ledger_refs: [contract.replay_scope.truth_record_reference, `truth-ledger:7j2:${ordinal}`],
    tags,
    state: "ACTIVE",
    severity: ordinal % 4 === 0 ? "HIGH" : "MEDIUM",
    confidence: 0.82 + (ordinal % 5) / 100,
    integrity_state: "VALID",
    restricted: false,
  };
}

function withHash(record: Omit<GovernanceSearchRecord, "payload_hash">): GovernanceSearchRecord {
  return Object.freeze({ ...record, payload_hash: hashValue("governance-search-record", record) });
}

export function buildGovernanceSearchRecords(contract = buildGovernanceQueryContract()): readonly GovernanceSearchRecord[] {
  return freezeArray([
    withHash(recordSource(contract, "POLICY", "POLICY", "POLICY_LOOKUP", 1, "Governance integrity policy", ["policy", "integrity", "governance"])),
    withHash(recordSource(contract, "RECOMMENDATION", "RECOMMENDATION", "RECOMMENDATION_LOOKUP", 2, "Governance integrity recommendation", ["recommendation", "risk", "governance"])),
    withHash(recordSource(contract, "VIOLATION", "GOVERNANCE_DECISION", "VIOLATION_LOOKUP", 3, "Governance violation decision", ["violation", "constitutional", "decision"])),
    withHash(recordSource(contract, "ESCALATION", "ESCALATION", "ESCALATION_LOOKUP", 4, "Governance escalation record", ["escalation", "severity", "governance"])),
    withHash(recordSource(contract, "RISK", "RISK_ASSESSMENT", "RISK_LOOKUP", 5, "Governance risk assessment", ["risk", "confidence", "recommendation"])),
    withHash(recordSource(contract, "COMPLIANCE", "COMPLIANCE_EVALUATION", "COMPLIANCE_LOOKUP", 6, "Governance compliance evaluation", ["compliance", "evaluation", "policy"])),
    withHash(recordSource(contract, "EVIDENCE", "EVIDENCE", "EVIDENCE_LOOKUP", 7, "Governance evidence packet", ["evidence", "integrity", "verification"])),
    withHash(recordSource(contract, "REPLAY", "REPLAY_SESSION", "REPLAY_LOOKUP", 8, "Governance replay session", ["replay", "reconstruction", "determinism"])),
    withHash(recordSource(contract, "LINEAGE", "LINEAGE_CHAIN", "LINEAGE_LOOKUP", 9, "Governance lineage chain", ["lineage", "parent", "child"])),
    withHash(recordSource(contract, "CERTIFICATION", "CERTIFICATION_RESULT", "GOVERNANCE_HISTORY", 10, "Governance certification result", ["certification", "validation", "audit"])),
    withHash(recordSource(contract, "AUDIT", "TRUTH_RECORD", "GOVERNANCE_TIMELINE", 11, "Governance audit history", ["audit", "timeline", "truth"])),
    withHash(recordSource(contract, "TRUTH_LEDGER", "TRUTH_RECORD", "CROSS_LEDGER_QUERY", 12, "Truth Ledger governance record", ["truth", "ledger", "cross-ledger"])),
  ]);
}

function termsForInput(input: GovernanceSearchInput, contract: GovernanceQueryContract): readonly string[] {
  if (input.scenario === "NO_MATCHES" || input.scenario === "SEARCH_TARGET_NOT_FOUND") return freezeArray(["no-such-governance-record"]);
  if (input.search_terms?.length) return uniqueSorted(input.search_terms.map((term) => term.toLowerCase()));
  if (input.scenario === "EXACT_IDENTIFIER_LOOKUP") return freezeArray([]);
  return freezeArray(["governance"]);
}

function domainsForInput(input: GovernanceSearchInput, contract: GovernanceQueryContract): readonly GovernanceSearchDomain[] {
  if (input.requested_domains?.length) return uniqueSorted(input.requested_domains);
  const targetDomain = DOMAIN_BY_TARGET[contract.target_object];
  return targetDomain ? freezeArray([targetDomain]) : freezeArray(DOMAINS);
}

function buildExecutionPlan(
  contract: GovernanceQueryContract,
  validation: GovernanceQueryValidationResult,
  input: GovernanceSearchInput,
  domains: readonly GovernanceSearchDomain[],
): GovernanceSearchExecutionPlan {
  const strategy: GovernanceSearchExecutionPlan["filter_strategy"] =
    input.scenario === "EXACT_IDENTIFIER_LOOKUP" ? "IMMUTABLE_IDENTIFIER_LOOKUP" :
    input.scenario === "HISTORICAL_SEARCH" ? "HISTORICAL_RECONSTRUCTION" :
    input.scenario === "LINEAGE_SEARCH" ? "LINEAGE_TRAVERSAL" :
    input.scenario === "REPLAY_SEARCH" ? "REPLAY_REFERENCE_LOOKUP" :
    "CANONICAL_FILTER_SCAN";
  const source = {
    plan_id: `GSP-7J2-${hashValue("governance-search-plan-id", { query: contract.query_id, strategy }).slice(0, 10).toUpperCase()}`,
    normalized_query_hash: validation.normalized_query_hash,
    index_version: INDEX_VERSION,
    selected_indexes: domains,
    filter_strategy: strategy,
    deterministic_ordering: ORDERING,
    replay_safe: validation.valid,
  };
  return Object.freeze({ ...source, plan_hash: hashValue("governance-search-execution-plan", source) });
}

function verifyIndex(records: readonly GovernanceSearchRecord[], scenario: GovernanceSearchScenario | undefined): GovernanceSearchIndexManifest {
  const state: GovernanceSearchIndexState = scenario === "INDEX_INCONSISTENT" ? "INCONSISTENT" : "VERIFIED";
  const source = {
    index_id: `GSI-7J2-${hashValue("governance-search-index-id", records.map((record) => record.immutable_identifier)).slice(0, 10).toUpperCase()}`,
    index_version: INDEX_VERSION,
    state,
    domains: uniqueSorted(records.map((record) => record.domain)),
    record_count: records.length,
    verified_at: NOW,
  };
  return Object.freeze({ ...source, index_hash: hashValue("governance-search-index", source) });
}

function recordMatches(record: GovernanceSearchRecord, contract: GovernanceQueryContract, terms: readonly string[], identifier?: string): boolean {
  if (record.tenant_id !== contract.tenant_id || record.mission_id !== contract.mission_id) return false;
  if (identifier) return record.immutable_identifier === identifier;
  if (contract.filters.risk_level?.length && record.domain === "RISK" && !contract.filters.risk_level.includes(record.severity)) return false;
  if (contract.filters.evidence_type?.length && record.domain === "EVIDENCE" && !contract.filters.evidence_type.some((type) => record.tags.includes(type.toLowerCase()))) return false;
  if (!terms.length) return true;
  const haystack = [record.immutable_identifier, record.title, record.summary, ...record.tags, ...record.policy_refs, ...record.authority_refs].join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term.toLowerCase()));
}

function sortRecords(records: readonly GovernanceSearchRecord[]): readonly GovernanceSearchRecord[] {
  return freezeArray([...records].sort((a, b) =>
    a.tenant_id.localeCompare(b.tenant_id) ||
    a.mission_id.localeCompare(b.mission_id) ||
    a.governance_timestamp.localeCompare(b.governance_timestamp) ||
    a.ledger_sequence - b.ledger_sequence ||
    a.lineage_hierarchy.localeCompare(b.lineage_hierarchy) ||
    a.immutable_identifier.localeCompare(b.immutable_identifier) ||
    a.object_version.localeCompare(b.object_version),
  ));
}

function deterministicScore(record: GovernanceSearchRecord, terms: readonly string[], identifier?: string): GovernanceSearchResult["deterministic_score"] {
  const haystack = [record.immutable_identifier, record.title, record.summary, ...record.tags].join(" ").toLowerCase();
  const termHits = terms.filter((term) => haystack.includes(term.toLowerCase())).length;
  const exact = identifier && record.immutable_identifier === identifier ? 1000 : 0;
  return exact + termHits * 100 + record.evidence_refs.length * 10 + record.lineage_refs.length;
}

function resultFromRecord(record: GovernanceSearchRecord, terms: readonly string[], identifier?: string): GovernanceSearchResult {
  const score = deterministicScore(record, terms, identifier);
  const ranking_inputs = Object.freeze({
    exact_identifier_match: Boolean(identifier && record.immutable_identifier === identifier),
    tenant_match: true,
    mission_match: true,
    term_match_count: terms.filter((term) => [record.title, record.summary, ...record.tags].join(" ").toLowerCase().includes(term.toLowerCase())).length,
    evidence_count: record.evidence_refs.length,
    lineage_depth: record.lineage_refs.length,
  });
  const source = {
    result_id: `GSR-7J2-${hashValue("governance-search-result-id", record.immutable_identifier).slice(0, 10).toUpperCase()}`,
    immutable_identifier: record.immutable_identifier,
    domain: record.domain,
    object_type: record.object_type,
    title: record.title,
    summary: record.summary,
    governance_timestamp: record.governance_timestamp,
    ledger_sequence: record.ledger_sequence,
    lineage_hierarchy: record.lineage_hierarchy,
    object_version: record.object_version,
    deterministic_score: score,
    ranking_inputs,
    evidence_refs: record.evidence_refs,
    replay_refs: record.replay_refs,
    lineage_refs: record.lineage_refs,
    truth_ledger_refs: record.truth_ledger_refs,
    explanation: `Matched ${record.domain} through immutable governance index using canonical ordering and verified evidence, lineage, and replay references.`,
  };
  return Object.freeze({ ...source, result_hash: hashValue("governance-search-result", source) });
}

function failureStateFromValidation(validation: GovernanceQueryValidationResult): GovernanceSearchErrorState | null {
  const states = validation.errors.map((error) => error.state);
  if (states.includes("TENANT_ISOLATION_VIOLATION")) return "TENANT_ISOLATION_VIOLATION";
  if (states.includes("CONSTITUTIONAL_VIOLATION")) return "CONSTITUTIONAL_VIOLATION";
  if (states.includes("UNAUTHORIZED")) return "UNAUTHORIZED";
  if (states.includes("INVALID_REPLAY_REFERENCE")) return "REPLAY_REFERENCE_INVALID";
  if (states.includes("INVALID_LINEAGE_REFERENCE")) return "LINEAGE_REFERENCE_INVALID";
  if (states.includes("INVALID_SCOPE")) return "INVALID_SCOPE";
  if (states.length) return "INVALID_QUERY";
  return null;
}

function explicitScenarioFailure(scenario: GovernanceSearchScenario | undefined): GovernanceSearchErrorState | null {
  switch (scenario) {
    case "INVALID_FILTER":
      return "INVALID_FILTER";
    case "SEARCH_TARGET_NOT_FOUND":
      return "SEARCH_TARGET_NOT_FOUND";
    case "INDEX_INCONSISTENT":
      return "INDEX_INCONSISTENT";
    case "NON_DETERMINISTIC_ORDERING":
    case "MUTATION_ATTEMPT":
      return "INDEX_INCONSISTENT";
    default:
      return null;
  }
}

function buildReplaySupport(contract: GovernanceQueryContract, results: readonly GovernanceSearchResult[], rankingStable: boolean): GovernanceSearchReplaySupport {
  const source = {
    replay_id: contract.replay_scope.replay_id,
    reconstruction_hash: hashValue("governance-search-replay-reconstruction", { query_hash: contract.query_hash, results: results.map((result) => result.result_hash) }),
    source_query_hash: contract.query_hash,
    result_hashes: freezeArray(results.map((result) => result.result_hash)),
    ranking_stable: rankingStable,
    replay_safe: rankingStable && results.every((result) => result.replay_refs.length > 0),
  };
  return Object.freeze(source);
}

function buildAudit(
  contract: GovernanceQueryContract,
  resultCount: number,
  searchId: string,
  searchHash: string,
  indexHash: string,
  planHash: string,
  resultState: GovernanceSearchResultState,
): GovernanceSearchAuditRecord {
  const queryAudit = buildGovernanceQueryAuditRecord(contract, resultCount);
  return Object.freeze({ ...queryAudit, search_id: searchId, search_hash: searchHash, index_hash: indexHash, plan_hash: planHash, result_state: resultState });
}

export function runGovernanceSearch(input: GovernanceSearchInput = {}): GovernanceSearchResponse {
  const scenario = input.scenario ?? "BASELINE";
  const contract = input.query_contract ?? buildGovernanceQueryContract(queryInputForScenario(scenario));
  const validation = validateGovernanceQueryContract(contract);
  const terms = termsForInput(input, contract);
  const requestedDomains = domainsForInput(input, contract);
  const identifier = input.immutable_identifier ?? (scenario === "EXACT_IDENTIFIER_LOOKUP" ? "governance:recommendation:7j2:002" : undefined);
  const allRecords = freezeArray(input.records ?? buildGovernanceSearchRecords(contract));
  const indexManifest = verifyIndex(allRecords, scenario);
  const optimizerPlan = buildExecutionPlan(contract, validation, input, requestedDomains);
  const validationFailure = failureStateFromValidation(validation);
  const scenarioFailure = explicitScenarioFailure(scenario);
  const failure = validationFailure ?? scenarioFailure;
  const filteredRecords = failure ? [] : sortRecords(allRecords.filter((record) => requestedDomains.includes(record.domain) && recordMatches(record, contract, terms, identifier)));
  const results = freezeArray(filteredRecords.map((record) => resultFromRecord(record, terms, identifier)));
  const resultState: GovernanceSearchResultState = failure ?? (results.length === 0 ? "NO_RESULTS" : "RESULTS_GENERATED");
  const rankingStable = scenario !== "NON_DETERMINISTIC_ORDERING" && sortRecords(filteredRecords).map((record) => record.immutable_identifier).join("|") === filteredRecords.map((record) => record.immutable_identifier).join("|");
  const replaySupport = buildReplaySupport(contract, results, rankingStable && !failure);
  const failures = freezeArray([
    ...validation.errors,
    ...(scenarioFailure ? [errorIssue(scenarioFailure, "governance_search", `${scenarioFailure} detected during deterministic search execution.`)] : []),
  ]);
  const searchId = `GS-7J2-${hashValue("governance-search-id", { query: contract.query_id, scenario, terms, identifier }).slice(0, 10).toUpperCase()}`;
  const hashSource = {
    search_id: searchId,
    query_hash: validation.valid ? contract.query_hash : null,
    result_state: resultState,
    results: results.map((result) => result.result_hash),
    index_hash: indexManifest.index_hash,
    plan_hash: optimizerPlan.plan_hash,
    failures: failures.map((issue) => issue.state),
  };
  const searchHash = hashValue("governance-search-response", hashSource);
  const auditRecord = buildAudit(contract, results.length, searchId, searchHash, indexManifest.index_hash, optimizerPlan.plan_hash, resultState);
  return Object.freeze({
    phase_version: "7J.2",
    schema_version: SCHEMA_VERSION,
    search_id: searchId,
    query_id: contract.query_id || null,
    query_hash: validation.valid ? contract.query_hash : null,
    tenant_id: contract.tenant_id,
    mission_id: contract.mission_id,
    lookup_type: contract.query_type,
    target_object: contract.target_object,
    result_state: resultState,
    result_count: results.length,
    results,
    validation,
    optimizer_plan: optimizerPlan,
    index_manifest: indexManifest,
    replay_support: replaySupport,
    audit_record: auditRecord,
    failures,
    search_hash: searchHash,
    read_only: true,
    advisory_only_notice: "Governance search is deterministic, read-only, replayable, and audit-backed.",
  });
}

export function validateGovernanceSearch(input: GovernanceSearchInput = {}) {
  const response = runGovernanceSearch(input);
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

export function computeGovernanceSearchHash(response: GovernanceSearchResponse): string {
  return hashValue("governance-search-response", {
    search_id: response.search_id,
    query_hash: response.query_hash,
    result_state: response.result_state,
    results: response.results.map((result) => result.result_hash),
    index_hash: response.index_manifest.index_hash,
    plan_hash: response.optimizer_plan.plan_hash,
    failures: response.failures.map((issue) => issue.state),
  });
}

export function buildGovernanceSearchObservabilitySurface(input: GovernanceSearchInput = {}): GovernanceSearchObservabilitySurface {
  const response = runGovernanceSearch(input);
  const errorStates = response.result_state === "RESULTS_GENERATED" || response.result_state === "NO_RESULTS" ? [] : [response.result_state as GovernanceSearchErrorState];
  return Object.freeze({
    search_id: response.search_id,
    query_id: response.query_id,
    result_state: response.result_state,
    result_count: response.result_count,
    errors: freezeArray(errorStates),
    index_state: response.index_manifest.state,
    ranking_stable: response.replay_support.ranking_stable,
    replay_safe: response.replay_support.replay_safe,
    search_hash: response.search_hash,
  });
}

export function getGovernanceSearchEngineContract() {
  const response = runGovernanceSearch();
  return Object.freeze({
    doctrine: Object.freeze({
      principles: freezeArray(["deterministic", "replayable", "explainable", "immutable", "evidence-backed", "constitutionally-governed", "tenant-isolated", "audit-ready", "version-aware", "certification-ready"]),
      schema_version: SCHEMA_VERSION,
      index_version: INDEX_VERSION,
      supported_domains: freezeArray(DOMAINS),
      deterministic_ordering: ORDERING,
      error_states: freezeArray(["SEARCH_TARGET_NOT_FOUND", "INVALID_QUERY", "INVALID_FILTER", "INVALID_SCOPE", "UNAUTHORIZED", "TENANT_ISOLATION_VIOLATION", "CONSTITUTIONAL_VIOLATION", "REPLAY_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID", "INDEX_INCONSISTENT"] as const),
    }),
    response,
    validation: validateGovernanceSearch(),
    observability: buildGovernanceSearchObservabilitySurface(),
  });
}
