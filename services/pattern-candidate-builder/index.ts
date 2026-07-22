import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayPatternIntelligenceContract, validatePatternIntelligenceContract } from "@/services/pattern-intelligence-contract";
import type { PatternContractInput, PatternContractResult, PatternType } from "@/types/pattern-intelligence-contract";
import type {
  HistoricalAggregationRecord,
  HistoricalRecordSource,
  PatternCandidate,
  PatternCandidateApiSurface,
  PatternCandidateBuilderFoundation,
  PatternCandidateBuilderResult,
  PatternCandidateFailure,
  PatternCandidateInput,
  PatternCandidateRegistry,
  PatternCandidateValidation,
  PatternCandidateWindowType,
  PatternWindow,
} from "@/types/pattern-candidate-builder";

const PATTERN_CANDIDATE_BUILDER_VERSION = "pattern-candidate-builder/v1" as const;
const WINDOW_START = "2026-04-10T00:00:00.000Z";
const WINDOW_END = "2026-07-09T00:00:00.000Z";

export const SUPPORTED_CANDIDATE_WINDOWS: readonly PatternCandidateWindowType[] = Object.freeze([
  "FIXED_WINDOW",
  "TIME_WINDOW",
  "MISSION_WINDOW",
  "CAMPAIGN_WINDOW",
  "GOVERNANCE_WINDOW",
  "REPLAY_WINDOW",
]);

export const SUPPORTED_HISTORICAL_SOURCES: readonly HistoricalRecordSource[] = Object.freeze([
  "DECISION_HISTORY",
  "RECOMMENDATION_HISTORY",
  "OUTCOME_INTELLIGENCE",
  "GOVERNANCE_OUTCOMES",
  "OPERATOR_ACTIVITY",
  "EVIDENCE_LINEAGE",
  "SIMULATION_RESULTS",
  "REPLAY_HISTORY",
  "ROLLBACK_HISTORY",
  "TRUTH_LEDGER",
  "PATTERN_LEDGER",
]);

type Scenario = NonNullable<PatternCandidateInput["scenario"]>;

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

function sourceScenario(scenario: Scenario): PatternContractInput["scenario"] {
  const map: Partial<Record<Scenario, PatternContractInput["scenario"]>> = {
    CONTRACT_INVALID: "PHASE_10_3_NOT_CERTIFIED",
    MISSING_EVIDENCE: "MISSING_EVIDENCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    REPLAY_DIVERGENCE: "REPLAY_DIVERGENCE",
    CROSS_TENANT: "CROSS_TENANT",
    GOVERNANCE_FAILURE: "GOVERNANCE_FAILURE",
    CONSTITUTIONAL_FAILURE: "CONSTITUTIONAL_FAILURE",
    HASH_MISMATCH: "HASH_MISMATCH",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: PatternCandidateInput, scenario: Scenario): PatternContractResult {
  if (input.contract_result) return input.contract_result;
  return validatePatternIntelligenceContract({ scenario: sourceScenario(scenario) });
}

function buildApiSurface(): PatternCandidateApiSurface {
  const base: Omit<PatternCandidateApiSurface, "integrity_hash"> = {
    api_id: "pattern_candidate_builder_api",
    build_candidates: "POST /pattern-candidate-builder/build",
    aggregate_history: "POST /pattern-candidate-builder/aggregate",
    manage_windows: "POST /pattern-candidate-builder/windows",
    retrieve_registry: "POST /pattern-candidate-builder/registry",
    replay_candidates: "POST /pattern-candidate-builder/replay",
    verify_identity: "POST /pattern-candidate-builder/identity",
    retrieve_contract: "GET /pattern-candidate-builder/contract",
    update_supported: false,
    delete_supported: false,
    adaptive_learning_supported: false,
    pattern_truth_validation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildAggregation(contract: PatternContractResult, scenario: Scenario): HistoricalAggregationRecord {
  const ledger = contract.certification.performance_ledger.performance_record;
  const sources: readonly HistoricalRecordSource[] = scenario === "UNSUPPORTED_SOURCE" ? freezeArray<HistoricalRecordSource>(["DECISION_HISTORY"]) : SUPPORTED_HISTORICAL_SOURCES;
  const count = scenario === "INSUFFICIENT_HISTORY" ? 2 : 6;
  const refs = freezeArray([
    ...ledger.recommendation_refs,
    ...ledger.outcome_refs,
    ...ledger.operator_action_refs,
    ...ledger.governance_refs,
    ...ledger.evidence_refs,
    ...ledger.replay_refs,
  ].slice(0, count));
  const base: Omit<HistoricalAggregationRecord, "integrity_hash"> = {
    aggregation_id: `pattern_aggregation_${hash(`${ledger.performance_record_id}:${sources.join(":")}:${count}`).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${ledger.tenant_id}:foreign` : ledger.tenant_id,
    sources,
    record_refs: refs,
    normalized: true,
    certified_only: scenario !== "UNCERTIFIED_HISTORY",
    ordering_key: hash(refs).slice(0, 16),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function buildWindow(aggregation: HistoricalAggregationRecord): PatternWindow {
  const base: Omit<PatternWindow, "integrity_hash"> = {
    window_id: `candidate_window_${hash(aggregation.aggregation_id).slice(0, 14)}`,
    window_type: "TIME_WINDOW",
    window_start: WINDOW_START,
    window_end: WINDOW_END,
    record_limit: 100,
    deterministic_boundaries: true,
    replayable: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function groupingKey(contract: PatternContractResult, aggregation: HistoricalAggregationRecord, patternType: PatternType): string {
  return hash({
    tenant_id: aggregation.tenant_id,
    pattern_type: patternType,
    mission_id: contract.certification.performance_ledger.performance_record.mission_id,
    ordering_key: aggregation.ordering_key,
  }).slice(0, 24);
}

function buildCandidates(contract: PatternContractResult, aggregation: HistoricalAggregationRecord, window: PatternWindow, patternType: PatternType, scenario: Scenario): readonly PatternCandidate[] {
  if (scenario === "INSUFFICIENT_HISTORY") return freezeArray([]);
  const ledger = contract.certification.performance_ledger.performance_record;
  const recurrence = scenario === "LOW_RECURRENCE" ? 2 : Math.max(3, aggregation.record_refs.length);
  const key = groupingKey(contract, aggregation, patternType);
  const base: Omit<PatternCandidate, "integrity_hash"> = {
    candidate_id: `pattern_candidate_${hash(`${aggregation.aggregation_id}:${key}:${recurrence}`).slice(0, 16)}`,
    tenant_id: aggregation.tenant_id,
    mission_scope: ledger.mission_id,
    candidate_type: patternType,
    candidate_summary: `${patternType.toLowerCase()} candidate grouped from certified historical records`,
    grouping_key: key,
    recurrence_count: recurrence,
    recurrence_window: window,
    supporting_decision_refs: freezeArray([ledger.decision_id]),
    supporting_recommendation_refs: ledger.recommendation_refs,
    supporting_outcome_refs: ledger.outcome_refs,
    supporting_governance_refs: ledger.governance_refs,
    supporting_operator_refs: ledger.operator_action_refs,
    supporting_evidence_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : ledger.evidence_refs,
    supporting_simulation_refs: freezeArray(["simulation_ref_candidate_baseline"]),
    supporting_rollback_refs: freezeArray(["rollback_ref_candidate_baseline"]),
    replay_refs: scenario === "MISSING_REPLAY" ? freezeArray([]) : ledger.replay_refs,
    lineage_refs: ledger.lineage_refs,
    candidate_state: scenario === "INVALID_TRANSITION" ? "DISCOVERED" : "READY_FOR_VALIDATION",
    immutable: true,
    advisory_only: true,
    validates_pattern_truth: false,
    actionable: false,
  };
  const candidate = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "IDENTITY_MUTATION") return freezeArray([Object.freeze({ ...candidate, candidate_id: `${candidate.candidate_id}:mutated`, integrity_hash: candidate.integrity_hash })]);
  if (scenario === "HASH_MISMATCH") return freezeArray([Object.freeze({ ...candidate, integrity_hash: hash({ tampered: candidate.candidate_id }) })]);
  return freezeArray([candidate]);
}

function buildRegistry(aggregation: HistoricalAggregationRecord, candidates: readonly PatternCandidate[], scenario: Scenario): PatternCandidateRegistry {
  const grouping_index = candidates.reduce((index, candidate) => {
    return { ...index, [candidate.grouping_key]: freezeArray([candidate.candidate_id]) };
  }, {} as Record<string, readonly string[]>);
  const base: Omit<PatternCandidateRegistry, "integrity_hash"> = {
    registry_id: `pattern_candidate_registry_${hash(aggregation.aggregation_id).slice(0, 14)}`,
    tenant_id: aggregation.tenant_id,
    candidate_refs: candidates.map((candidate) => candidate.candidate_id),
    grouping_index: Object.freeze(grouping_index),
    replay_refs: freezeArray([...new Set(candidates.flatMap((candidate) => candidate.replay_refs))]),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(contract: PatternContractResult, aggregation: HistoricalAggregationRecord, candidates: readonly PatternCandidate[], registry: PatternCandidateRegistry, scenario: Scenario): readonly PatternCandidateFailure[] {
  const failures: PatternCandidateFailure[] = [];
  if (scenario === "CONTRACT_INVALID" || !contract.validation.valid) failures.push("PATTERN_CONTRACT_INVALID");
  if (scenario === "UNCERTIFIED_HISTORY" || !aggregation.certified_only) failures.push("UNCERTIFIED_HISTORICAL_RECORDS");
  if (scenario === "INSUFFICIENT_HISTORY" || aggregation.record_refs.length < contract.contract.minimum_support_threshold) failures.push("INSUFFICIENT_HISTORY");
  if (scenario === "LOW_RECURRENCE" || candidates.some((candidate) => candidate.recurrence_count < contract.contract.minimum_recurrence_threshold)) failures.push("RECURRENCE_THRESHOLD_NOT_MET");
  if (scenario === "MISSING_EVIDENCE" || candidates.some((candidate) => !candidate.supporting_evidence_refs.length)) failures.push("MANDATORY_EVIDENCE_MISSING");
  if (scenario === "MISSING_REPLAY" || candidates.some((candidate) => !candidate.replay_refs.length)) failures.push("REPLAY_REFERENCES_MISSING");
  if (scenario === "REPLAY_DIVERGENCE" || !replayPatternIntelligenceContract(contract)) failures.push("REPLAY_DIVERGENCE");
  if (scenario === "CROSS_TENANT" || aggregation.tenant_id !== contract.identity.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "GOVERNANCE_FAILURE") failures.push("GOVERNANCE_BOUNDARY_VIOLATED");
  if (scenario === "CONSTITUTIONAL_FAILURE") failures.push("CONSTITUTIONAL_RESTRICTION_VIOLATED");
  if (scenario === "UNSUPPORTED_SOURCE" || aggregation.sources.some((source) => !SUPPORTED_HISTORICAL_SOURCES.includes(source))) failures.push("UNSUPPORTED_HISTORICAL_SOURCE");
  if (scenario === "INVALID_TRANSITION") failures.push("INVALID_LIFECYCLE_TRANSITION");
  if (scenario === "IDENTITY_MUTATION" || candidates.some((candidate) => hashWithoutIntegrity(candidate) !== candidate.integrity_hash)) failures.push("CANDIDATE_IDENTITY_MUTATION_DETECTED");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "HASH_MISMATCH" || candidates.some((candidate) => hashWithoutIntegrity(candidate) !== candidate.integrity_hash)) failures.push("INTEGRITY_MISMATCH_DETECTED");
  if (scenario === "AUTONOMOUS_LEARNING") failures.push("AUTONOMOUS_LEARNING_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateForFailures(failures: readonly PatternCandidateFailure[]): PatternCandidateValidation["state"] {
  if (failures.includes("MANDATORY_EVIDENCE_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "READY_FOR_VALIDATION";
}

function buildValidation(contract: PatternContractResult, aggregation: HistoricalAggregationRecord, candidates: readonly PatternCandidate[], registry: PatternCandidateRegistry, failures: readonly PatternCandidateFailure[]): PatternCandidateValidation {
  const aggregationVerified = hashWithoutIntegrity(aggregation) === aggregation.integrity_hash;
  const candidatesVerified = candidates.every((candidate) => hashWithoutIntegrity(candidate) === candidate.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<PatternCandidateValidation, "integrity_hash"> = {
    validation_id: "pattern_candidate_builder_validation",
    state: stateForFailures(failures),
    valid: failures.length === 0 && aggregationVerified && candidatesVerified && registryVerified,
    failures,
    contract_valid: contract.validation.valid && !failures.includes("PATTERN_CONTRACT_INVALID"),
    aggregation_complete: !failures.includes("INSUFFICIENT_HISTORY") && !failures.includes("UNCERTIFIED_HISTORICAL_RECORDS"),
    grouping_deterministic: candidates.every((candidate) => candidate.grouping_key.length > 0),
    recurrence_threshold_met: !failures.includes("RECURRENCE_THRESHOLD_NOT_MET"),
    evidence_sufficient: !failures.includes("MANDATORY_EVIDENCE_MISSING"),
    replay_validated: !failures.includes("REPLAY_REFERENCES_MISSING") && !failures.includes("REPLAY_DIVERGENCE"),
    governance_preserved: !failures.includes("GOVERNANCE_BOUNDARY_VIOLATED") && !failures.includes("CONSTITUTIONAL_RESTRICTION_VIOLATED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: aggregationVerified && candidatesVerified && registryVerified,
    advisory_only: candidates.every((candidate) => candidate.advisory_only && !candidate.validates_pattern_truth && !candidate.actionable),
    no_autonomous_learning: true,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<PatternCandidateBuilderResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    aggregation: result.aggregation,
    window: result.window,
    candidates: result.candidates,
    registry: result.registry,
    validation: result.validation,
    contract_replay_hash: result.contract_result.replay_hash,
  });
}

function resultIntegrityHash(result: Omit<PatternCandidateBuilderResult, "integrity_hash">): string {
  return hash({
    pattern_candidate_builder_version: result.pattern_candidate_builder_version,
    api_surface_hash: result.api_surface.integrity_hash,
    aggregation_hash: result.aggregation.integrity_hash,
    window_hash: result.window.integrity_hash,
    candidate_hashes: result.candidates.map((candidate) => candidate.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    contract_hash: result.contract_result.integrity_hash,
    replay_hash: result.replay_hash,
    deterministic: result.deterministic,
    replayable: result.replayable,
    advisory_only: result.advisory_only,
    adaptive_learning: result.adaptive_learning,
    validates_pattern_truth: result.validates_pattern_truth,
  });
}

export function buildPatternCandidates(input: PatternCandidateInput = {}): PatternCandidateBuilderResult {
  const scenario = input.scenario ?? "BASELINE";
  const contract_result = sourceForScenario(input, scenario);
  const patternType = input.pattern_type ?? contract_result.schema.pattern_type;
  const api_surface = buildApiSurface();
  const aggregation = buildAggregation(contract_result, scenario);
  const window = buildWindow(aggregation);
  const candidates = buildCandidates(contract_result, aggregation, window, patternType, scenario);
  const registry = buildRegistry(aggregation, candidates, scenario);
  const failures = collectFailures(contract_result, aggregation, candidates, registry, scenario);
  const validation = buildValidation(contract_result, aggregation, candidates, registry, failures);
  const base: Omit<PatternCandidateBuilderResult, "integrity_hash" | "replay_hash"> = {
    pattern_candidate_builder_version: PATTERN_CANDIDATE_BUILDER_VERSION,
    contract_result,
    api_surface,
    aggregation,
    window,
    candidates,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    advisory_only: true,
    governance_aware: true,
    adaptive_learning: false,
    validates_pattern_truth: false,
    modifies_recommendations: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayPatternCandidateBuilder(result: PatternCandidateBuilderResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayPatternIntelligenceContract(result.contract_result);
}

export function computePatternCandidateHash(candidate: Omit<PatternCandidate, "integrity_hash"> | PatternCandidate): string {
  return hashWithoutIntegrity(candidate);
}

export function getPatternCandidateBuilderFoundation(): PatternCandidateBuilderFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    pattern_candidate_builder_version: PATTERN_CANDIDATE_BUILDER_VERSION,
    supported_windows: SUPPORTED_CANDIDATE_WINDOWS,
    supported_sources: SUPPORTED_HISTORICAL_SOURCES,
    api_surface,
    result: buildPatternCandidates(),
  });
}

export const PatternCandidateBuilder = Object.freeze({
  build: buildPatternCandidates,
  replay: replayPatternCandidateBuilder,
});
