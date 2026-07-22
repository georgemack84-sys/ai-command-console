import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { generateImprovementOpportunities, replayImprovementOpportunityGeneration } from "@/services/improvement-opportunity-generator";
import type { ImprovementOpportunityInput, ImprovementOpportunityResult } from "@/types/improvement-opportunity-generator";
import type {
  RecommendationHistoricalRegistry,
  RecommendationLineageEdge,
  RecommendationLineageGraph,
  RecommendationPerformanceLedgerApiSurface,
  RecommendationPerformanceLedgerFailure,
  RecommendationPerformanceLedgerFoundation,
  RecommendationPerformanceLedgerInput,
  RecommendationPerformanceLedgerResult,
  RecommendationPerformanceLedgerValidation,
  RecommendationPerformanceRecord,
  RecommendationReplayRegistry,
} from "@/types/recommendation-performance-ledger";

const PERFORMANCE_LEDGER_VERSION = "recommendation-performance-ledger/v1" as const;
const LEDGER_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<RecommendationPerformanceLedgerInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): ImprovementOpportunityInput["scenario"] {
  const map: Partial<Record<Scenario, ImprovementOpportunityInput["scenario"]>> = {
    MISSING_REPLAY: "MISSING_REPLAY",
    INCOMPLETE_LINEAGE: "INCOMPLETE_LINEAGE",
    INVALID_RECOMMENDATION: "MISSING_RECOMMENDATION",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    CROSS_TENANT: "CROSS_TENANT",
    REPLAY_RECONSTRUCTION_FAILURE: "REPLAY_DIVERGENCE",
    INTEGRITY_FAILURE: "HASH_MISMATCH",
    HASH_MISMATCH: "HASH_MISMATCH",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: RecommendationPerformanceLedgerInput, scenario: Scenario): ImprovementOpportunityResult {
  if (input.improvement_result) return input.improvement_result;
  return generateImprovementOpportunities({ scenario: sourceScenario(scenario) });
}

function buildApiSurface(): RecommendationPerformanceLedgerApiSurface {
  const base: Omit<RecommendationPerformanceLedgerApiSurface, "integrity_hash"> = {
    api_id: "recommendation_performance_ledger_api",
    append_record: "POST /recommendation-performance-ledger/append",
    read_record: "POST /recommendation-performance-ledger/read",
    retrieve_registry: "POST /recommendation-performance-ledger/registry",
    retrieve_lineage: "POST /recommendation-performance-ledger/lineage",
    validate_integrity: "POST /recommendation-performance-ledger/integrity",
    validate_replay: "POST /recommendation-performance-ledger/replay",
    retrieve_contract: "GET /recommendation-performance-ledger/contract",
    update_supported: false,
    delete_supported: false,
    learning_supported: false,
    reporting_database_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildPerformanceRecord(source: ImprovementOpportunityResult, scenario: Scenario): RecommendationPerformanceRecord {
  const evaluation = source.dimension_evaluation.evaluation_record;
  const override = source.dimension_evaluation.override.override_record;
  const rejection = source.dimension_evaluation.override.rejection.rejection_record;
  const quality = source.dimension_evaluation.override.rejection.quality.quality_score;
  const comparison = source.dimension_evaluation.override.rejection.quality.comparator;
  const effectiveness = comparison.effectiveness.effectiveness_record;
  const evidenceRefs = freezeArray([...new Set([...source.ledger_record.evidence_refs, ...evaluation.supporting_evidence_refs])]);
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : freezeArray([...new Set([...source.ledger_record.governance_refs, ...evaluation.governance_refs])]);
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray([...new Set([...source.ledger_record.replay_refs, ...evaluation.replay_refs, source.replay_hash])]);
  const lineageRefs = scenario === "INCOMPLETE_LINEAGE" ? freezeArray([]) : freezeArray([...new Set([...evaluation.lineage_refs, source.registry.registry_id, source.ledger_record.ledger_record_id])]);
  const base: Omit<RecommendationPerformanceRecord, "integrity_hash"> = {
    performance_record_id: `recommendation_performance_${hash(evaluation.dimension_evaluation_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${evaluation.tenant_id}:foreign` : evaluation.tenant_id,
    mission_id: evaluation.mission_id,
    decision_id: evaluation.decision_id,
    recommendation_id: scenario === "INVALID_RECOMMENDATION" ? "" : evaluation.recommendation_id,
    recommendation_version: "v1",
    recommendation_refs: freezeArray([evaluation.recommendation_id].filter(Boolean)),
    outcome_refs: freezeArray([effectiveness.effectiveness_id, comparison.alignment.alignment_id, comparison.ledger_record.ledger_record_id]),
    score_refs: freezeArray([quality.quality_score_id, evaluation.dimension_evaluation_id, ...evaluation.dimension_scores.map((score) => score.dimension_score_id)]),
    operator_action_refs: freezeArray([rejection.rejection_analysis_id, override.override_analysis_id, override.override_id]),
    failure_refs: freezeArray([...source.validation.failures, ...source.dimension_evaluation.validation.failures]),
    improvement_refs: source.opportunities.map((opportunity) => opportunity.improvement_id),
    governance_refs: governanceRefs,
    replay_refs: replayRefs,
    lineage_refs: lineageRefs,
    evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : evidenceRefs,
    integrity_hashes: scenario === "MISSING_HASH" ? freezeArray([]) : freezeArray([
      source.integrity_hash,
      source.registry.integrity_hash,
      source.ledger_record.integrity_hash,
      source.dimension_evaluation.integrity_hash,
    ]),
    ledger_timestamp: LEDGER_TIMESTAMP,
    immutable: true,
    append_only: true,
    deleted: scenario === "DELETE_ATTEMPT",
    mutation_supported: false,
    delete_supported: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH" || scenario === "INTEGRITY_FAILURE") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.performance_record_id }) });
  return record;
}

function indexFor(keys: readonly string[], recordId: string): Readonly<Record<string, readonly string[]>> {
  return Object.freeze(keys.reduce((index, key) => ({ ...index, [key]: freezeArray([recordId]) }), {} as Record<string, readonly string[]>));
}

function buildHistoricalRegistry(record: RecommendationPerformanceRecord, source: ImprovementOpportunityResult): RecommendationHistoricalRegistry {
  const base: Omit<RecommendationHistoricalRegistry, "integrity_hash"> = {
    registry_id: `performance_history_${hash(record.performance_record_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    recommendation_index: indexFor([record.recommendation_id].filter(Boolean), record.performance_record_id),
    mission_index: indexFor([record.mission_id], record.performance_record_id),
    decision_index: indexFor([record.decision_id], record.performance_record_id),
    evaluation_index: indexFor([source.dimension_evaluation.evaluation_record.dimension_evaluation_id], record.performance_record_id),
    governance_index: indexFor(record.governance_refs, record.performance_record_id),
    replay_index: indexFor(record.replay_refs, record.performance_record_id),
    improvement_index: indexFor(record.improvement_refs, record.performance_record_id),
    deterministic_lookup: true,
    read_only: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function edge(from: string, to: string, relationship: RecommendationLineageEdge["relationship"]): RecommendationLineageEdge {
  const base: Omit<RecommendationLineageEdge, "integrity_hash"> = {
    edge_id: `lineage_edge_${hash(`${from}:${to}:${relationship}`).slice(0, 14)}`,
    from_ref: from,
    to_ref: to,
    relationship,
    immutable: true,
    replayable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildLineageGraph(record: RecommendationPerformanceRecord, scenario: Scenario): RecommendationLineageGraph {
  const recommendation = record.recommendation_id || "missing_recommendation";
  const edges = freezeArray([
    ...record.evidence_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_EVIDENCE")),
    ...record.recommendation_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_DECISION")),
    ...record.score_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_EVALUATION")),
    ...record.outcome_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_OUTCOME")),
    ...record.governance_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_GOVERNANCE")),
    ...record.replay_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_REPLAY")),
    ...record.improvement_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_IMPROVEMENT")),
    ...record.operator_action_refs.map((ref) => edge(recommendation, ref, "RECOMMENDATION_OPERATOR_ACTION")),
  ]);
  const base: Omit<RecommendationLineageGraph, "integrity_hash"> = {
    graph_id: `recommendation_lineage_${hash(record.performance_record_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    performance_record_id: record.performance_record_id,
    edges,
    complete: scenario !== "LINEAGE_GRAPH_INCOMPLETE" && record.lineage_refs.length > 0 && edges.length > 0,
    immutable: true,
    replayable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildReplayRegistry(record: RecommendationPerformanceRecord, source: ImprovementOpportunityResult, scenario: Scenario): RecommendationReplayRegistry {
  const base: Omit<RecommendationReplayRegistry, "integrity_hash"> = {
    replay_registry_id: `performance_replay_${hash(record.performance_record_id).slice(0, 14)}`,
    tenant_id: record.tenant_id,
    recommendation_replay_refs: record.replay_refs,
    evaluation_replay_refs: freezeArray([source.dimension_evaluation.replay_hash]),
    operator_replay_refs: freezeArray([source.dimension_evaluation.override.replay_hash]),
    governance_replay_refs: record.governance_refs,
    outcome_replay_refs: record.outcome_refs,
    improvement_replay_refs: freezeArray([source.replay_hash]),
    replay_dependencies_complete: scenario !== "MISSING_REPLAY" && record.replay_refs.length > 0,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(source: ImprovementOpportunityResult, record: RecommendationPerformanceRecord, registry: RecommendationHistoricalRegistry, graph: RecommendationLineageGraph, replay: RecommendationReplayRegistry, scenario: Scenario): readonly RecommendationPerformanceLedgerFailure[] {
  const failures: RecommendationPerformanceLedgerFailure[] = [];
  if (scenario === "MUTATION_ATTEMPT") failures.push("MUTATION_ATTEMPT_DETECTED");
  if (scenario === "DELETE_ATTEMPT" || record.deleted) failures.push("DELETE_ATTEMPT_DETECTED");
  if (scenario === "MISSING_REPLAY" || !record.replay_refs.length || !replay.replay_dependencies_complete) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "MISSING_HASH" || !record.integrity_hashes.length) failures.push("INTEGRITY_HASH_MISSING");
  if (scenario === "INCOMPLETE_LINEAGE" || !record.lineage_refs.length) failures.push("LINEAGE_INCOMPLETE");
  if (scenario === "INVALID_RECOMMENDATION" || !record.recommendation_id) failures.push("RECOMMENDATION_IDENTITY_INVALID");
  if (scenario === "MISSING_GOVERNANCE" || !record.governance_refs.length) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_EVIDENCE" || !record.evidence_refs.length) failures.push("EVIDENCE_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || record.tenant_id !== source.registry.tenant_id || registry.tenant_id !== source.registry.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "REPLAY_RECONSTRUCTION_FAILURE") failures.push("REPLAY_RECONSTRUCTION_FAILED");
  if (scenario === "INTEGRITY_FAILURE" || hashWithoutIntegrity(record) !== record.integrity_hash) failures.push("INTEGRITY_VERIFICATION_FAILED");
  if (scenario === "LINEAGE_GRAPH_INCOMPLETE" || !graph.complete) failures.push("LINEAGE_GRAPH_INCOMPLETE");
  if (scenario === "HASH_MISMATCH") failures.push("HASH_MISMATCH_DETECTED");
  if (scenario === "GOVERNANCE_FAILURE" || !source.validation.governance_ready) failures.push("GOVERNANCE_VALIDATION_FAILED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_VALIDATION_FAILED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly RecommendationPerformanceLedgerFailure[]): RecommendationPerformanceLedgerValidation["state"] {
  if (failures.includes("EVIDENCE_REFERENCES_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(record: RecommendationPerformanceRecord, registry: RecommendationHistoricalRegistry, graph: RecommendationLineageGraph, replay: RecommendationReplayRegistry, failures: readonly RecommendationPerformanceLedgerFailure[]): RecommendationPerformanceLedgerValidation {
  const recordVerified = hashWithoutIntegrity(record) === record.integrity_hash;
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const graphVerified = hashWithoutIntegrity(graph) === graph.integrity_hash && graph.edges.every((item) => hashWithoutIntegrity(item) === item.integrity_hash);
  const replayVerified = hashWithoutIntegrity(replay) === replay.integrity_hash;
  const base: Omit<RecommendationPerformanceLedgerValidation, "integrity_hash"> = {
    validation_id: "recommendation_performance_ledger_validation",
    state: stateForFailures(failures),
    certified: failures.length === 0 && recordVerified && registryVerified && graphVerified && replayVerified,
    failures,
    append_only: record.append_only,
    immutable: record.immutable && graph.immutable,
    record_complete: Boolean(record.recommendation_id && record.score_refs.length && record.improvement_refs.length),
    historical_indexed: Object.keys(registry.recommendation_index).length > 0 && registry.deterministic_lookup,
    lineage_complete: !failures.includes("LINEAGE_INCOMPLETE") && !failures.includes("LINEAGE_GRAPH_INCOMPLETE"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_RECONSTRUCTION_FAILED") && replay.replay_dependencies_complete,
    governance_validated: !failures.includes("GOVERNANCE_VALIDATION_MISSING") && !failures.includes("GOVERNANCE_VALIDATION_FAILED") && !failures.includes("CONSTITUTIONAL_VALIDATION_FAILED"),
    evidence_referenced: !failures.includes("EVIDENCE_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    integrity_verified: recordVerified && registryVerified && graphVerified && replayVerified,
    read_operations_mutate_state: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<RecommendationPerformanceLedgerResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    performance_record: result.performance_record,
    historical_registry: result.historical_registry,
    lineage_graph: result.lineage_graph,
    replay_registry: result.replay_registry,
    validation: result.validation,
    improvement_replay_hash: result.improvement_result.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<RecommendationPerformanceLedgerResult, "integrity_hash">): string {
  return hash({
    recommendation_performance_ledger_version: result.recommendation_performance_ledger_version,
    api_surface_hash: result.api_surface.integrity_hash,
    performance_record_hash: result.performance_record.integrity_hash,
    historical_registry_hash: result.historical_registry.integrity_hash,
    lineage_graph_hash: result.lineage_graph.integrity_hash,
    replay_registry_hash: result.replay_registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    improvement_hash: result.improvement_result.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    append_only: result.append_only,
    immutable: result.immutable,
    learning_database: result.learning_database,
    reporting_database: result.reporting_database,
    modifies_recommendations: result.modifies_recommendations,
  });
}

export function appendRecommendationPerformanceRecord(input: RecommendationPerformanceLedgerInput = {}): RecommendationPerformanceLedgerResult {
  const scenario = input.scenario ?? "BASELINE";
  const improvement_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const performance_record = buildPerformanceRecord(improvement_result, scenario);
  const historical_registry = buildHistoricalRegistry(performance_record, improvement_result);
  const lineage_graph = buildLineageGraph(performance_record, scenario);
  const replay_registry = buildReplayRegistry(performance_record, improvement_result, scenario);
  const failures = collectFailures(improvement_result, performance_record, historical_registry, lineage_graph, replay_registry, scenario);
  const validation = buildValidation(performance_record, historical_registry, lineage_graph, replay_registry, failures);
  const base: Omit<RecommendationPerformanceLedgerResult, "integrity_hash" | "replay_hash"> = {
    recommendation_performance_ledger_version: PERFORMANCE_LEDGER_VERSION,
    improvement_result,
    api_surface,
    performance_record,
    historical_registry,
    lineage_graph,
    replay_registry,
    validation,
    deterministic: true,
    replayable: true,
    append_only: true,
    immutable: true,
    advisory_only: true,
    learning_database: false,
    reporting_database: false,
    modifies_recommendations: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayRecommendationPerformanceLedger(result: RecommendationPerformanceLedgerResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayImprovementOpportunityGeneration(result.improvement_result);
}

export function computeRecommendationPerformanceRecordHash(record: Omit<RecommendationPerformanceRecord, "integrity_hash"> | RecommendationPerformanceRecord): string {
  return hashWithoutIntegrity(record);
}

export function getRecommendationPerformanceLedgerFoundation(): RecommendationPerformanceLedgerFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    recommendation_performance_ledger_version: PERFORMANCE_LEDGER_VERSION,
    api_surface,
    result: appendRecommendationPerformanceRecord(),
  });
}

export const RecommendationPerformanceLedger = Object.freeze({
  append: appendRecommendationPerformanceRecord,
  replay: replayRecommendationPerformanceLedger,
});
