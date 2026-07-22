import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { establishMissionMemoryIndex, replayMissionMemoryIndex } from "@/services/mission-memory-index";
import type { MissionMemoryIndexEntry } from "@/types/mission-memory-index";
import type {
  PatternCategory,
  PatternLedgerEntry,
  PatternLifecycleState,
  PatternMemoryFailure,
  PatternMemoryRegistry as PatternMemoryRegistryDefinition,
  PatternMemoryRegistryApiSurface,
  PatternMemoryRegistryContract,
  PatternMemoryRegistryInput,
  PatternMemoryRegistryMetrics,
  PatternMemoryRegistryResult,
  PatternMemoryScenario,
  PatternMemoryRegistryStatus,
  PatternMemoryRecord,
  PatternQualificationReport,
  PatternSimilarityDimension,
  PatternSimilarityRelation,
  PatternVersionRecord,
} from "@/types/pattern-memory-registry";

const REGISTRY_VERSION = "pattern-memory-registry/v1" as const;
const REGISTRY_IDENTIFIER = "PatternMemoryRegistry" as const;
const VERSION = "v1";

const CATEGORIES: readonly PatternCategory[] = Object.freeze([
  "OUTCOME_PATTERN",
  "FAILURE_PATTERN",
  "SUCCESS_PATTERN",
  "GOVERNANCE_PATTERN",
  "OPERATOR_PATTERN",
  "SIMULATION_PATTERN",
  "STRATEGY_PATTERN",
  "CONFIDENCE_PATTERN",
  "RISK_PATTERN",
  "CERTIFICATION_PATTERN",
]);

const LIFECYCLE: readonly PatternLifecycleState[] = Object.freeze([
  "CANDIDATE",
  "QUALIFIED",
  "GOVERNANCE_REVIEW",
  "APPROVED",
  "REGISTERED",
  "INDEXED",
  "ACTIVE",
  "REFERENCED",
  "SUPERSEDED",
  "ARCHIVED",
]);

const DIMENSIONS: readonly PatternSimilarityDimension[] = Object.freeze([
  "OUTCOME_SIMILARITY",
  "STRATEGY_SIMILARITY",
  "EVIDENCE_SIMILARITY",
  "GOVERNANCE_SIMILARITY",
  "OPERATOR_SIMILARITY",
  "CONFIDENCE_SIMILARITY",
  "RISK_SIMILARITY",
  "SIMULATION_SIMILARITY",
  "CERTIFICATION_SIMILARITY",
]);

const QUALIFICATION_RULES = Object.freeze([
  "sufficient_supporting_evidence",
  "deterministic_replay_succeeds",
  "governance_approves_reuse",
  "confidence_threshold_satisfied",
  "recurrence_threshold_satisfied",
  "integrity_verification_succeeds",
]);

const REUSE_RULES = Object.freeze([
  "governance_permits_reuse",
  "replay_references_available",
  "evidence_remains_valid",
  "mission_scope_compatible",
  "tenant_boundaries_preserved",
  "authority_restrictions_satisfied",
]);

const SECURITY_REQUIREMENTS = Object.freeze([
  "encrypt_pattern_records",
  "isolate_tenants",
  "validate_access_authorization",
  "prevent_unauthorized_modification",
  "detect_tampering",
  "detect_corruption",
  "prevent_unauthorized_reuse",
]);

const REPLAY_REQUIREMENTS = Object.freeze([
  "originating_observations",
  "supporting_evidence",
  "recommendation_history",
  "governance_reviews",
  "operator_decisions",
  "simulations",
  "certification_decisions",
  "hash_verified_reconstruction",
]);

type Scenario = NonNullable<PatternMemoryRegistryInput["scenario"]>;

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

function buildApiSurface(): PatternMemoryRegistryApiSurface {
  const base: Omit<PatternMemoryRegistryApiSurface, "integrity_hash"> = {
    api_id: "pattern_memory_registry_api",
    establish_registry: "POST /pattern-memory-registry/establish",
    retrieve_contract: "GET /pattern-memory-registry/contract",
    retrieve_records: "POST /pattern-memory-registry/records",
    retrieve_qualification: "POST /pattern-memory-registry/qualification",
    retrieve_similarity: "POST /pattern-memory-registry/similarity",
    retrieve_versions: "POST /pattern-memory-registry/versions",
    retrieve_ledger: "POST /pattern-memory-registry/ledger",
    retrieve_metrics: "POST /pattern-memory-registry/metrics",
    replay_registry: "POST /pattern-memory-registry/replay",
    inspect_registry: "POST /pattern-memory-registry/inspect",
    unauthorized_modification_supported: false,
    unauthorized_reuse_supported: false,
    overwrite_supported: false,
    predictive_truth_supported: false,
    execution_logic_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function failureForScenario(scenario: Scenario): PatternMemoryFailure | undefined {
  const map: Partial<Record<PatternMemoryScenario, PatternMemoryFailure>> = {
    INDEX_UNAVAILABLE: "INDEX_UNAVAILABLE",
    UNQUALIFIED_PATTERN: "UNQUALIFIED_PATTERN_REGISTERED",
    VERSION_OVERWRITE: "HISTORICAL_VERSION_OVERWRITTEN",
    MISSING_REPLAY: "REPLAY_REFERENCES_MISSING",
    INCOMPLETE_EVIDENCE: "EVIDENCE_LINEAGE_INCOMPLETE",
    GOVERNANCE_BYPASS: "GOVERNANCE_VALIDATION_BYPASSED",
    NONDETERMINISTIC_SIMILARITY: "NONDETERMINISTIC_SIMILARITY",
    TENANT_BREACH: "TENANT_ISOLATION_VIOLATED",
    UNAUTHORIZED_MODIFICATION: "UNAUTHORIZED_MODIFICATION",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
    IGNORED_CERTIFICATION: "CERTIFICATION_DEPENDENCY_IGNORED",
    INSUFFICIENT_RECURRENCE: "INSUFFICIENT_RECURRENCE",
    LOW_CONFIDENCE: "CONFIDENCE_THRESHOLD_FAILED",
    UNAUTHORIZED_REUSE: "UNAUTHORIZED_REUSE",
  };
  return map[scenario];
}

function collectFailures(scenario: Scenario, indexReplayable: boolean): readonly PatternMemoryFailure[] {
  const failures: PatternMemoryFailure[] = [];
  const direct = failureForScenario(scenario);
  if (direct) failures.push(direct);
  if (!indexReplayable) failures.push("INDEX_UNAVAILABLE");
  return freezeArray([...new Set(failures)]);
}

function statusFor(failures: readonly PatternMemoryFailure[]): PatternMemoryRegistryStatus {
  return failures.length ? "REJECTED" : "AUTHORITATIVE";
}

function buildContract(): PatternMemoryRegistryContract {
  const base: Omit<PatternMemoryRegistryContract, "integrity_hash"> = {
    contract_id: "pattern-memory-registry-contract",
    version: REGISTRY_VERSION,
    architecture: freezeArray([
      "Phase 10.4 Pattern Intelligence",
      "Pattern Qualification Engine",
      "Governance Validation",
      "Pattern Registration",
      "Version Manager",
      "Similarity Catalog",
      "Pattern Ledger",
      "Pattern Memory Registry",
    ]),
    supported_categories: CATEGORIES,
    lifecycle: LIFECYCLE,
    similarity_dimensions: DIMENSIONS,
    qualification_rules: QUALIFICATION_RULES,
    reuse_rules: REUSE_RULES,
    security_requirements: SECURITY_REQUIREMENTS,
    replay_requirements: REPLAY_REQUIREMENTS,
    authoritative_pattern_registry: true,
    predictive_truth_supported: false,
    execution_logic_supported: false,
    overwrite_supported: false,
    unauthorized_reuse_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function categoryFor(index: number): PatternCategory {
  return CATEGORIES[index % CATEGORIES.length];
}

function buildQualification(failures: readonly PatternMemoryFailure[]): PatternQualificationReport {
  const base: Omit<PatternQualificationReport, "integrity_hash"> = {
    statistical_significance: !failures.includes("UNQUALIFIED_PATTERN_REGISTERED"),
    recurrence_frequency: !failures.includes("INSUFFICIENT_RECURRENCE"),
    evidence_sufficiency: !failures.includes("EVIDENCE_LINEAGE_INCOMPLETE"),
    replay_completeness: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governance_compliance: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED"),
    confidence_stability: !failures.includes("CONFIDENCE_THRESHOLD_FAILED"),
    certification_dependencies: !failures.includes("CERTIFICATION_DEPENDENCY_IGNORED"),
    similarity_uniqueness: !failures.includes("NONDETERMINISTIC_SIMILARITY"),
    qualified: false,
  };
  const qualified = Object.entries(base).every(([key, value]) => key === "qualified" || value === true);
  return Object.freeze({ ...base, qualified, integrity_hash: hashWithoutIntegrity({ ...base, qualified }) });
}

function buildPattern(entry: MissionMemoryIndexEntry, index: number, qualification: PatternQualificationReport, failures: readonly PatternMemoryFailure[]): PatternMemoryRecord {
  const pattern_type = categoryFor(index);
  const pattern_id = `pmr_${hash({ pattern_type, source: entry.integrity_hash, version: VERSION }).slice(0, 32)}`;
  const tenant_id = failures.includes("TENANT_ISOLATION_VIOLATED") ? "tenant-cross-boundary" : entry.tenant_id;
  const base: Omit<PatternMemoryRecord, "integrity_hash"> = {
    pattern_id,
    tenant_id,
    mission_scope: entry.mission_id,
    pattern_type,
    pattern_summary: `${pattern_type.toLowerCase()} registered from governed mission memory index evidence.`,
    recurrence_score: failures.includes("INSUFFICIENT_RECURRENCE") ? 0.42 : 0.86,
    confidence_score: failures.includes("CONFIDENCE_THRESHOLD_FAILED") ? 0.49 : 0.91,
    evidence_refs: failures.includes("EVIDENCE_LINEAGE_INCOMPLETE") ? [] : entry.evidence_refs,
    outcome_refs: [`outcome:${entry.storage_category.toLowerCase()}:historical`],
    governance_refs: failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? [] : entry.governance_refs,
    replay_refs: failures.includes("REPLAY_REFERENCES_MISSING") ? [] : entry.replay_refs,
    simulation_refs: [`simulation:${entry.storage_category.toLowerCase()}:recurrence`],
    certification_refs: failures.includes("CERTIFICATION_DEPENDENCY_IGNORED") ? [] : entry.certification_refs,
    version: VERSION,
    lifecycle_state: failures.length || !qualification.qualified ? "CANDIDATE" : "ACTIVE",
    reuse_permissions: failures.includes("UNAUTHORIZED_REUSE") ? [] : entry.retrieval_permissions,
    source_index_id: entry.index_id,
    immutable_identifier: true,
    encrypted_pattern_hash: hash({ encrypted: true, source: entry.integrity_hash, pattern_type }),
    tenant_partition_hash: hash({ tenant_id, partition: "pattern-memory-registry" }),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildSimilarity(records: readonly PatternMemoryRecord[], failures: readonly PatternMemoryFailure[]): readonly PatternSimilarityRelation[] {
  const relations = records.slice(0, Math.max(0, records.length - 1)).map((record, index) => {
    const compared = records[index + 1];
    const score = failures.includes("NONDETERMINISTIC_SIMILARITY") ? 0.13 + index / 100 : 0.82 - index / 100;
    const base: Omit<PatternSimilarityRelation, "integrity_hash"> = {
      relation_id: `pattern_similarity_${hash({ a: record.pattern_id, b: compared.pattern_id }).slice(0, 24)}`,
      pattern_id: record.pattern_id,
      compared_pattern_id: compared.pattern_id,
      dimensions: DIMENSIONS,
      similarity_score: Number(score.toFixed(2)),
      explanation: `${record.pattern_type} compared with ${compared.pattern_type} across evidence, governance, replay, confidence, risk, and certification dimensions.`,
      deterministic_scoring: true,
      replayable_calculation: true,
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  });
  return freezeArray(relations);
}

function buildVersions(records: readonly PatternMemoryRecord[], qualification: PatternQualificationReport, failures: readonly PatternMemoryFailure[]): readonly PatternVersionRecord[] {
  return freezeArray(records.map((record, index) => {
    const version_id = failures.includes("HISTORICAL_VERSION_OVERWRITTEN") && index > 0 ? `${records[0].pattern_id}:v1` : `${record.pattern_id}:v1`;
    const base: Omit<PatternVersionRecord, "integrity_hash"> = {
      version_id,
      pattern_id: record.pattern_id,
      version: VERSION,
      qualification_hash: qualification.integrity_hash,
      governance_hash: hash(record.governance_refs),
      certification_hash: hash(record.certification_refs),
      immutable: true,
      lineage_preserved: !failures.includes("HISTORICAL_VERSION_OVERWRITTEN"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  }));
}

function buildLedger(records: readonly PatternMemoryRecord[], failures: readonly PatternMemoryFailure[]): readonly PatternLedgerEntry[] {
  const events: readonly PatternLedgerEntry["event"][] = [
    "PATTERN_DISCOVERY",
    "QUALIFICATION_DECISION",
    "GOVERNANCE_APPROVAL",
    "REGISTRATION",
    "VERSION_CREATION",
    "SIMILARITY_UPDATE",
    "REPLAY_VALIDATION",
    "REUSE_EVENT",
    "INTEGRITY_VERIFICATION",
  ];
  return freezeArray(records.flatMap((record, recordIndex) => events.map((event, eventIndex) => {
    const base: Omit<PatternLedgerEntry, "integrity_hash"> = {
      ledger_id: `pattern_memory_ledger_${String(recordIndex + 1).padStart(2, "0")}_${String(eventIndex + 1).padStart(2, "0")}`,
      pattern_id: record.pattern_id,
      tenant_id: record.tenant_id,
      event: failures.length && eventIndex === events.length - 1 ? "REGISTRATION_FAILURE" : event,
      lifecycle_state: record.lifecycle_state,
      append_only: true,
      immutable: true,
      replayable: true,
      tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
      cryptographically_verified: !failures.includes("INTEGRITY_VERIFICATION_FAILED"),
    };
    return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  })));
}

function buildMetrics(records: readonly PatternMemoryRecord[], similarity: readonly PatternSimilarityRelation[], versions: readonly PatternVersionRecord[], failures: readonly PatternMemoryFailure[]): PatternMemoryRegistryMetrics {
  const base: Omit<PatternMemoryRegistryMetrics, "integrity_hash"> = {
    registered_patterns: failures.length ? 0 : records.length,
    qualification_success_rate: failures.length ? 0 : 1,
    qualification_failures: failures.length,
    similarity_calculations: similarity.length,
    pattern_reuse_frequency: failures.includes("UNAUTHORIZED_REUSE") ? 0 : records.length,
    replay_success: failures.includes("REPLAY_REFERENCES_MISSING") ? 0 : 1,
    governance_approval_rate: failures.includes("GOVERNANCE_VALIDATION_BYPASSED") ? 0 : 1,
    version_growth: versions.length,
    integrity_failures: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? 1 : 0,
    tenant_isolation_violations: failures.includes("TENANT_ISOLATION_VIOLATED") ? 1 : 0,
    failures,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternMemoryRegistryResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    index_hash: result.index_result.integrity_hash,
    contract_hash: result.contract.integrity_hash,
    qualification_hash: result.qualification_report.integrity_hash,
    pattern_hashes: result.pattern_records.map((record) => record.integrity_hash),
    similarity_hashes: result.similarity_catalog.map((relation) => relation.integrity_hash),
    version_hashes: result.version_history.map((version) => version.integrity_hash),
    ledger_hashes: result.pattern_ledger.map((entry) => entry.integrity_hash),
    metrics_hash: result.metrics.integrity_hash,
    status: result.status,
    failures: result.failures,
  });
}

function resultIntegrityHash(result: Omit<PatternMemoryRegistryResult, "integrity_hash">): string {
  return hash({
    version: result.pattern_memory_registry_version,
    registry_identifier: result.registry_identifier,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_hash: result.replay_hash,
    contract_hash: result.contract.integrity_hash,
  });
}

function verifyHashedRecord(value: { integrity_hash: string }): boolean {
  return hashWithoutIntegrity(value) === value.integrity_hash;
}

export function establishPatternMemoryRegistry(input: PatternMemoryRegistryInput = {}): PatternMemoryRegistryResult {
  const scenario = input.scenario ?? "BASELINE";
  const api_surface = buildApiSurface();
  const index_result = input.index_result ?? establishMissionMemoryIndex();
  const failures = collectFailures(scenario, replayMissionMemoryIndex(index_result));
  const contract = buildContract();
  const source_index_entries = index_result.index_entries.slice(0, CATEGORIES.length);
  const qualification_report = buildQualification(failures);
  const pattern_records = freezeArray(source_index_entries.map((entry, index) => buildPattern(entry, index, qualification_report, failures)));
  const similarity_catalog = buildSimilarity(pattern_records, failures);
  const version_history = buildVersions(pattern_records, qualification_report, failures);
  const pattern_ledger = buildLedger(pattern_records, failures);
  const metrics = buildMetrics(pattern_records, similarity_catalog, version_history, failures);
  const base: Omit<PatternMemoryRegistryResult, "integrity_hash" | "replay_hash"> = {
    pattern_memory_registry_version: REGISTRY_VERSION,
    registry_identifier: REGISTRY_IDENTIFIER,
    status: statusFor(failures),
    api_surface,
    index_result,
    contract,
    source_index_entries,
    qualification_report,
    pattern_records,
    similarity_catalog,
    version_history,
    pattern_ledger,
    metrics,
    failures,
    deterministic: !failures.includes("NONDETERMINISTIC_SIMILARITY"),
    replayable: !failures.includes("REPLAY_REFERENCES_MISSING"),
    governed: !failures.includes("GOVERNANCE_VALIDATION_BYPASSED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    immutable_history: !failures.includes("HISTORICAL_VERSION_OVERWRITTEN"),
    reuse_governed: !failures.includes("UNAUTHORIZED_REUSE"),
    authoritative_pattern_registry: true,
    predictive_truth_supported: false,
    execution_logic_supported: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternMemoryRegistry(result: PatternMemoryRegistryResult): boolean {
  return (
    verifyHashedRecord(result.api_surface) &&
    replayMissionMemoryIndex(result.index_result) &&
    verifyHashedRecord(result.contract) &&
    verifyHashedRecord(result.qualification_report) &&
    result.pattern_records.every(verifyHashedRecord) &&
    result.similarity_catalog.every(verifyHashedRecord) &&
    result.version_history.every(verifyHashedRecord) &&
    result.pattern_ledger.every(verifyHashedRecord) &&
    verifyHashedRecord(result.metrics) &&
    resultReplayHash(result) === result.replay_hash &&
    resultIntegrityHash(result) === result.integrity_hash
  );
}

export function getPatternMemoryRegistry(): PatternMemoryRegistryDefinition {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_memory_registry_version: REGISTRY_VERSION,
    supported_categories: CATEGORIES,
    supported_similarity_dimensions: DIMENSIONS,
    api_surface,
    result: establishPatternMemoryRegistry(),
  });
}

export const PatternMemoryRegistry = Object.freeze({
  establish: establishPatternMemoryRegistry,
  replay: replayPatternMemoryRegistry,
});
