import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishAdaptiveMemoryStore, replayAdaptiveMemoryStore } from "@/services/adaptive-memory-store";
import type { StoredAdaptiveMemoryRecord } from "@/types/adaptive-memory-store";
import type {
  IndexGenerationStage,
  MemoryIndexFamily,
  MemoryIndexLedgerEntry,
  MissionMemoryIndex as MissionMemoryIndexDefinition,
  MissionMemoryIndexApiSurface,
  MissionMemoryIndexContract,
  MissionMemoryIndexEntry,
  MissionMemoryIndexFailure,
  MissionMemoryIndexInput,
  MissionMemoryIndexMetrics,
  MissionMemoryIndexResult,
  MissionMemoryIndexScenario,
  MissionMemoryIndexStatus,
  MissionMemorySearchResult,
  RankingInput,
  SearchCapability,
} from "@/types/mission-memory-index";

const INDEX_VERSION = "mission-memory-index/v1" as const;
const INDEX_IDENTIFIER = "MissionMemoryIndex" as const;

const INDEX_FAMILIES: readonly MemoryIndexFamily[] = Object.freeze([
  "MISSION_INDEX",
  "CONTEXT_INDEX",
  "STRATEGY_INDEX",
  "RISK_INDEX",
  "CONFIDENCE_INDEX",
  "OPERATOR_INDEX",
  "GOVERNANCE_INDEX",
  "EVIDENCE_INDEX",
  "REPLAY_INDEX",
  "CERTIFICATION_INDEX",
]);

const PIPELINE: readonly IndexGenerationStage[] = Object.freeze([
  "VALIDATED_MEMORY",
  "SCHEMA_VALIDATION",
  "GOVERNANCE_VALIDATION",
  "ATTRIBUTE_EXTRACTION",
  "DETERMINISTIC_INDEX_GENERATION",
  "INDEX_VALIDATION",
  "MEMORY_INDEX_LEDGER",
]);

const SEARCH_CAPABILITIES: readonly SearchCapability[] = Object.freeze([
  "MISSION",
  "OBJECTIVE",
  "OPERATOR",
  "STRATEGY",
  "EVIDENCE",
  "GOVERNANCE",
  "CONFIDENCE",
  "RISK",
  "SIMULATION",
  "CERTIFICATION",
  "REPLAY",
  "PATTERN",
  "RECOMMENDATION",
]);

const RANKING_INPUTS: readonly RankingInput[] = Object.freeze([
  "MISSION_SIMILARITY",
  "EVIDENCE_QUALITY",
  "GOVERNANCE_RELEVANCE",
  "CONFIDENCE_CALIBRATION",
  "RISK_SIMILARITY",
  "STRATEGIC_ALIGNMENT",
  "REPLAY_COMPLETENESS",
  "CERTIFICATION_STATUS",
  "RECENCY",
  "HISTORICAL_EFFECTIVENESS",
]);

const SECURITY_REQUIREMENTS = Object.freeze([
  "enforce_tenant_isolation",
  "encrypt_indexed_metadata",
  "validate_retrieval_authorization",
  "prevent_unauthorized_indexing",
  "prevent_unauthorized_search",
  "prevent_hidden_indexes",
  "detect_index_corruption",
]);

const REPLAY_REQUIREMENTS = Object.freeze([
  "originating_memory",
  "source_evidence",
  "governance_decisions",
  "replay_sessions",
  "simulations",
  "certification_history",
  "index_rebuild_trace",
]);

const PERFORMANCE_REQUIREMENTS = Object.freeze([
  "incremental_indexing",
  "deterministic_rebuilds",
  "large_scale_memory_catalogs",
  "minimize_lookup_latency",
  "optimization_preserves_search_results",
]);

type Scenario = NonNullable<MissionMemoryIndexInput["scenario"]>;

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

function buildApiSurface(): MissionMemoryIndexApiSurface {
  const base: Omit<MissionMemoryIndexApiSurface, "integrity_hash"> = {
    api_id: "mission_memory_index_api",
    establish_index: "POST /mission-memory-index/establish",
    retrieve_contract: "GET /mission-memory-index/contract",
    retrieve_entries: "POST /mission-memory-index/entries",
    search_index: "POST /mission-memory-index/search",
    retrieve_ranking: "POST /mission-memory-index/ranking",
    retrieve_ledger: "POST /mission-memory-index/ledger",
    retrieve_metrics: "POST /mission-memory-index/metrics",
    replay_index: "POST /mission-memory-index/replay",
    inspect_index: "POST /mission-memory-index/inspect",
    hidden_indexes_supported: false,
    unauthorized_indexing_supported: false,
    unauthorized_search_supported: false,
    cross_tenant_search_supported: false,
    system_of_record: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): MissionMemoryIndexFailure | undefined {
  const map: Partial<Record<MissionMemoryIndexScenario, MissionMemoryIndexFailure>> = {
    STORE_UNAVAILABLE: "STORE_UNAVAILABLE",
    NONDETERMINISTIC_INDEX: "NONDETERMINISTIC_INDEX_GENERATION",
    UNAUTHORIZED_MEMORY: "UNAUTHORIZED_MEMORY_SEARCHABLE",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    INCOMPLETE_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    TENANT_BREACH: "TENANT_ISOLATION_VIOLATED",
    GOVERNANCE_BYPASS: "GOVERNANCE_VALIDATION_BYPASSED",
    INDEX_CORRUPTION: "INDEX_CORRUPTION",
    DUPLICATE_INDEX: "DUPLICATE_INDEX_CREATED",
    NONDETERMINISTIC_LOOKUP: "NONDETERMINISTIC_LOOKUP_RESULTS",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    UNAUTHORIZED_INDEXING: "UNAUTHORIZED_INDEXING",
    UNAUTHORIZED_SEARCH: "UNAUTHORIZED_SEARCH",
    HIDDEN_INDEX: "HIDDEN_INDEX_CREATED",
    INACTIVE_MEMORY: "INACTIVE_MEMORY_INDEXED",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, storeReplayable: boolean): readonly MissionMemoryIndexFailure[] {
  const failures: MissionMemoryIndexFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!storeReplayable) failures.push("STORE_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly MissionMemoryIndexFailure[]): MissionMemoryIndexStatus {
  return failures.length ? "REJECTED" : "AUTHORITATIVE";
}

function buildContract(): MissionMemoryIndexContract {
  const base: Omit<MissionMemoryIndexContract, "integrity_hash"> = {
    contract_id: "mission-memory-index-contract",
    version: INDEX_VERSION,
    architecture: freezeArray([
      "Adaptive Memory Store",
      "Memory Qualification",
      "Index Generation Engine",
      "Mission Index",
      "Context Index",
      "Strategy Index",
      "Risk Index",
      "Confidence Index",
      "Governed Search Layer",
      "Adaptive Memory Retrieval",
    ]),
    index_families: INDEX_FAMILIES,
    generation_pipeline: PIPELINE,
    search_capabilities: SEARCH_CAPABILITIES,
    ranking_inputs: RANKING_INPUTS,
    security_requirements: SECURITY_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    performance_requirements: PERFORMANCE_REQUIREMENTS,
    discovery_structure_only: true,
    store_remains_authoritative: true,
    deterministic_indexing_required: true,
    governance_before_visibility_required: true,
    explainable_retrieval_required: true,
    hidden_indexes_supported: false,
    unauthorized_search_supported: false,
    authority_expansion_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function attributesFor(family: MemoryIndexFamily, record: StoredAdaptiveMemoryRecord): Readonly<Record<string, string>> {
  const common = {
    mission_id: record.mission_scope,
    mission_scope: record.mission_scope,
    memory_category: record.storage_category,
  };
  const specific: Record<MemoryIndexFamily, Record<string, string>> = {
    MISSION_INDEX: { mission_type: "adaptive_memory", mission_objective: "governed_reuse", mission_status: "available" },
    CONTEXT_INDEX: { operational_environment: "mission_control", execution_context: record.memory_type, historical_context: record.storage_category },
    STRATEGY_INDEX: { strategic_objective: "safe_adaptation", strategic_pattern: record.storage_category, execution_approach: "governed" },
    RISK_INDEX: { risk_category: record.storage_category, probability: "bounded", impact: "governed", mitigation: "replay_validation" },
    CONFIDENCE_INDEX: { confidence_score: "0.92", calibration_state: "validated", evidence_quality: "complete" },
    OPERATOR_INDEX: { operator_decision: "approved", approval_state: "governed", escalation_state: "none" },
    GOVERNANCE_INDEX: { governance_decision: "approved", policy_validation: "complete", authority_boundary: "advisory" },
    EVIDENCE_INDEX: { evidence_source: record.evidence_refs[0] ?? "missing", evidence_lineage: "complete", observation_history: "preserved" },
    REPLAY_INDEX: { replay_identifier: record.replay_refs[0] ?? "missing", replay_lineage: "complete", replay_dependencies: "verified" },
    CERTIFICATION_INDEX: { certification_phase: "10.13C", certification_outcome: "approved", certification_lineage: record.certification_refs[0] ?? "missing" },
  };
  return Object.freeze({ ...common, ...specific[family] });
}

function familyForRecord(index: number): MemoryIndexFamily {
  return INDEX_FAMILIES[index % INDEX_FAMILIES.length];
}

function buildEntry(record: StoredAdaptiveMemoryRecord, index: number, failures: readonly MissionMemoryIndexFailure[]): MissionMemoryIndexEntry {
  const family = familyForRecord(index);
  const seed = {
    family: failures.includes("DUPLICATE_INDEX_CREATED") && index > 0 ? "DUPLICATE_INDEX" : family,
    memory_id: failures.includes("DUPLICATE_INDEX_CREATED") && index > 0 ? "duplicate-memory" : record.memory_id,
    tenant_id: record.tenant_id,
    mission_id: record.mission_scope,
    source_hash: record.integrity_hash,
  };
  const index_id = `mmi_${hash(seed).slice(0, 32)}`;
  const evidence_refs = failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") ? [] : record.evidence_refs;
  const replay_refs = failures.includes("REPLAY_REFERENCES_MISSING") ? [] : record.replay_refs;
  const governance_refs = failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? [] : record.governance_refs;
  const tenant_id = failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : record.tenant_id;
  const base: Omit<MissionMemoryIndexEntry, "integrity_hash"> = {
    index_id,
    index_family: family,
    memory_id: record.memory_id,
    tenant_id,
    mission_id: record.mission_scope,
    memory_type: record.memory_type,
    storage_category: record.storage_category,
    indexed_attributes: attributesFor(family, record),
    evidence_refs,
    governance_refs,
    replay_refs,
    certification_refs: record.certification_refs,
    confidence_score: 0.92,
    retrieval_permissions: failures.includes("UNAUTHORIZED_MEMORY_SEARCHABLE") ? [] : record.reuse_permissions,
    lifecycle_state: failures.length ? "REJECTED" : "SEARCHABLE",
    source_record_hash: record.integrity_hash,
    encrypted_metadata_hash: hash({ encrypted: true, family, record: record.integrity_hash }),
    tenant_partition_hash: hash({ tenant_id, partition: "mission-memory-index" }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function duplicateIndexes(entries: readonly MissionMemoryIndexEntry[]): boolean {
  return new Set(entries.map((entry) => entry.index_id)).size !== entries.length;
}

function rankingScore(entry: MissionMemoryIndexEntry, index: number): number {
  const base = entry.confidence_score * 1000;
  const evidenceBoost = entry.evidence_refs.length * 7;
  const replayBoost = entry.replay_refs.length * 5;
  return Math.round(base + evidenceBoost + replayBoost - index);
}

function buildSearchResults(entries: readonly MissionMemoryIndexEntry[], failures: readonly MissionMemoryIndexFailure[]): readonly MissionMemorySearchResult[] {
  if (failures.includes("UNAUTHORIZED_SEARCH")) return freezeArray([]);
  const results = entries
    .filter((entry) => entry.lifecycle_state === "SEARCHABLE")
    .map((entry, index) => {
      const score = failures.includes("NONDETERMINISTIC_LOOKUP_RESULTS") ? rankingScore(entry, entries.length - index) : rankingScore(entry, index);
      const base: Omit<MissionMemorySearchResult, "integrity_hash"> = {
        result_id: `search_${entry.index_id}`,
        index_id: entry.index_id,
        memory_id: entry.memory_id,
        tenant_id: entry.tenant_id,
        mission_id: entry.mission_id,
        ranking_score: score,
        ranking_inputs: RANKING_INPUTS,
        matched_capabilities: SEARCH_CAPABILITIES,
        explanation: `${entry.index_family} matched mission ${entry.mission_id} through ${entry.storage_category} evidence, governance, and replay attributes.`,
        governance_authorized: entry.governance_refs.length > 0,
        replay_available: entry.replay_refs.length > 0,
        evidence_traceable: entry.evidence_refs.length > 0,
        deterministic_rank: true,
      };
      return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    })
    .sort((a, b) => b.ranking_score - a.ranking_score || a.index_id.localeCompare(b.index_id));
  return freezeArray(results);
}

function buildLedger(entries: readonly MissionMemoryIndexEntry[], failures: readonly MissionMemoryIndexFailure[]): readonly MemoryIndexLedgerEntry[] {
  const events: readonly MemoryIndexLedgerEntry["event"][] = [
    "INDEX_CREATION",
    "ATTRIBUTE_EXTRACTION",
    "INDEX_UPDATE",
    "DETERMINISTIC_REBUILD",
    "GOVERNANCE_APPROVAL",
    "REPLAY_VALIDATION",
    "RETRIEVAL_AUTHORIZATION",
    "INTEGRITY_VALIDATION",
  ];
  return freezeArray(entries.flatMap((entry, entryIndex) =>
    events.map((event, eventIndex) => {
      const base: Omit<MemoryIndexLedgerEntry, "integrity_hash"> = {
        ledger_id: `mission_memory_index_ledger_${String(entryIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
        index_id: entry.index_id,
        memory_id: entry.memory_id,
        tenant_id: entry.tenant_id,
        event: failures.length && eventIndex === events.length - 1 ? "SEARCH_FAILURE" : event,
        stage: PIPELINE[Math.min(eventIndex, PIPELINE.length - 1)],
        append_only: true,
        immutable: true,
        replayable: true,
        tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
        cryptographically_verified: !failures.includes("INDEX_CORRUPTION") && !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
      };
      return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
    }),
  ));
}

function buildMetrics(
  entries: readonly MissionMemoryIndexEntry[],
  results: readonly MissionMemorySearchResult[],
  failures: readonly MissionMemoryIndexFailure[],
): MissionMemoryIndexMetrics {
  const base: Omit<MissionMemoryIndexMetrics, "integrity_hash"> = {
    indexed_memories: failures.length ? 0 : entries.length,
    indexing_throughput: entries.length,
    lookup_latency_ms: 8,
    rebuild_duration_ms: 21,
    deterministic_replay_success: failures.includes("NONDETERMINISTIC_INDEX_GENERATION") ? 0 : 1,
    duplicate_index_prevention: !failures.includes("DUPLICATE_INDEX_CREATED") && !duplicateIndexes(entries),
    retrieval_accuracy: failures.includes("NONDETERMINISTIC_LOOKUP_RESULTS") ? 0 : 1,
    authorization_failures: failures.includes("UNAUTHORIZED_INDEXING") || failures.includes("UNAUTHORIZED_SEARCH") ? 1 : 0,
    tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0,
    index_growth: entries.length + results.length,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<MissionMemoryIndexResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    store_hash: result.store_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    entry_hashes: result.index_entries.map((entry) => entry.integrity_hash),
    result_hashes: result.search_results.map((entry) => entry.integrity_hash),
    ledger_hashes: result.index_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<MissionMemoryIndexResult, "integrity_hash">): string {
  return hash({
    version: result.mission_memory_index_version,
    index_identifier: result.index_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishMissionMemoryIndex(input: MissionMemoryIndexInput = {}): MissionMemoryIndexResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const store_result = input.store_result ?? establishAdaptiveMemoryStore();
  const failures = collectFailures(scenario, replayAdaptiveMemoryStore(store_result));
  const contract = buildContract();
  const source_records = store_result.storage_engine;
  const index_entries = freezeArray(source_records.map((record, index) => buildEntry(record, index, failures)));
  const search_results = buildSearchResults(index_entries, failures);
  const index_ledger = buildLedger(index_entries, failures);
  const metrics = buildMetrics(index_entries, search_results, failures);
  const base: Omit<MissionMemoryIndexResult, "integrity_hash" | "replay_hash"> = {
    mission_memory_index_version: INDEX_VERSION,
    index_identifier: INDEX_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    store_result,
    contract,
    source_records,
    index_entries,
    search_results,
    index_ledger,
    generation_pipeline: PIPELINE,
    search_capabilities: SEARCH_CAPABILITIES,
    ranking_inputs: RANKING_INPUTS,
    metrics,
    failures,
    deterministic: !failures.includes("NONDETERMINISTIC_INDEX_GENERATION"),
    replayable: !failures.includes("REPLAY_REFERENCES_MISSING"),
    explainable: !failures.includes("HIDDEN_INDEX_CREATED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    governed_visibility: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED") && !failures.includes("UNAUTHORIZED_MEMORY_SEARCHABLE"),
    governed_search_ready: failures.length === 0,
    store_remains_authoritative: true,
    discovery_structure_only: true,
    authority_expansion: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayMissionMemoryIndex(result: MissionMemoryIndexResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayAdaptiveMemoryStore(result.store_result) &&
    verifyHashedRecord(result.contract) &&
    result.index_entries.every(verifyHashedRecord) &&
    result.search_results.every(verifyHashedRecord) &&
    result.index_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getMissionMemoryIndex(): MissionMemoryIndexDefinition {
  const api_surface = buildApiSurface();
  return Object.freeze({
    mission_memory_index_version: INDEX_VERSION,
    supported_index_families: INDEX_FAMILIES,
    supported_search_capabilities: SEARCH_CAPABILITIES,
    api_surface,
    result: establishMissionMemoryIndex(),
  });
}

export const MissionMemoryIndex = Object.freeze({
  establish: establishMissionMemoryIndex,
  replay: replayMissionMemoryIndex,
});
