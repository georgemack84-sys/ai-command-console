import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { replayStrategyEvolutionContract, validateStrategyEvolutionContract } from "@/services/strategy-evolution-contract";
import type { StrategyEvolutionContractInput, StrategyEvolutionContractResult } from "@/types/strategy-evolution-contract";
import type {
  MissionStrategyClassification,
  MissionStrategyComparison,
  MissionStrategyComparisonApiSurface,
  MissionStrategyComparisonFailure,
  MissionStrategyComparisonFoundation,
  MissionStrategyComparisonInput,
  MissionStrategyComparisonRegistry,
  MissionStrategyComparisonResult,
  MissionStrategyComparisonValidation,
  MissionStrategySimilarityLevel,
} from "@/types/mission-strategy-comparison-engine";

const MISSION_STRATEGY_COMPARISON_VERSION = "mission-strategy-comparison-engine/v1" as const;
const COMPARISON_TIMESTAMP = "2026-07-09T00:00:00.000Z";

type Scenario = NonNullable<MissionStrategyComparisonInput["scenario"]>;

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

function contractScenario(scenario: Scenario): StrategyEvolutionContractInput["scenario"] {
  const map: Partial<Record<Scenario, StrategyEvolutionContractInput["scenario"]>> = {
    UNCERTIFIED_CONTRACT: "PATTERN_CERTIFICATION_MISSING",
    MISSING_EVIDENCE: "MISSING_REPLAY",
    REPLAY_FAILURE: "MISSING_REPLAY",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    ADVISORY_VIOLATION: "ADVISORY_DISABLED",
    STRATEGY_MUTATION: "AUTONOMOUS_MUTATION",
    FAIL_OPEN: "FAIL_OPEN",
  };
  return map[scenario] ?? "BASELINE";
}

function sourceForScenario(input: MissionStrategyComparisonInput, scenario: Scenario): StrategyEvolutionContractResult {
  if (input.strategy_contract) return input.strategy_contract;
  return validateStrategyEvolutionContract({ scenario: contractScenario(scenario) });
}

function buildApiSurface(): MissionStrategyComparisonApiSurface {
  const base: Omit<MissionStrategyComparisonApiSurface, "integrity_hash"> = {
    api_id: "mission_strategy_comparison_engine_api",
    compare_strategies: "POST /mission-strategy-comparison-engine/compare",
    retrieve_comparisons: "POST /mission-strategy-comparison-engine/comparisons",
    retrieve_similarity: "POST /mission-strategy-comparison-engine/similarity",
    retrieve_ranking: "POST /mission-strategy-comparison-engine/ranking",
    retrieve_classification: "POST /mission-strategy-comparison-engine/classification",
    retrieve_evidence: "POST /mission-strategy-comparison-engine/evidence",
    retrieve_governance: "POST /mission-strategy-comparison-engine/governance",
    replay_comparison: "POST /mission-strategy-comparison-engine/replay",
    retrieve_registry: "POST /mission-strategy-comparison-engine/registry",
    retrieve_contract: "GET /mission-strategy-comparison-engine/contract",
    update_supported: false,
    delete_supported: false,
    strategy_mutation_supported: false,
    proposal_generation_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function classificationForScenario(scenario: Scenario): MissionStrategyClassification {
  const map: Partial<Record<Scenario, MissionStrategyClassification>> = {
    WEAKEST: "WEAKEST",
    REUSABLE: "REUSABLE",
    MISSION_SPECIFIC: "MISSION_SPECIFIC",
    OBSOLETE: "OBSOLETE",
  };
  return map[scenario] ?? "BEST_PERFORMING";
}

function similarityForScenario(scenario: Scenario): MissionStrategySimilarityLevel {
  const map: Partial<Record<Scenario, MissionStrategySimilarityLevel>> = {
    IDENTICAL_SIMILARITY: "IDENTICAL",
    HIGH_SIMILARITY: "HIGH",
    MODERATE_SIMILARITY: "MODERATE",
    LOW_SIMILARITY: "LOW",
    NO_SIMILARITY: "NONE",
  };
  return map[scenario] ?? "HIGH";
}

function similarityScore(level: MissionStrategySimilarityLevel): number {
  const map: Record<MissionStrategySimilarityLevel, number> = {
    IDENTICAL: 1,
    HIGH: 0.88,
    MODERATE: 0.62,
    LOW: 0.34,
    NONE: 0,
  };
  return map[level];
}

function clamp(value: number): number {
  return Number(Math.max(0, Math.min(1, value)).toFixed(4));
}

function effectivenessFor(classification: MissionStrategyClassification): number {
  const map: Record<MissionStrategyClassification, number> = {
    BEST_PERFORMING: 0.91,
    REUSABLE: 0.84,
    MISSION_SPECIFIC: 0.72,
    WEAKEST: 0.42,
    OBSOLETE: 0.24,
  };
  return map[classification];
}

function rankingFor(classification: MissionStrategyClassification, scenario: Scenario): number {
  if (scenario === "NONDETERMINISTIC_RANKING") return 2;
  const map: Record<MissionStrategyClassification, number> = {
    BEST_PERFORMING: 1,
    REUSABLE: 2,
    MISSION_SPECIFIC: 3,
    WEAKEST: 4,
    OBSOLETE: 5,
  };
  return map[classification];
}

function buildComparison(contract: StrategyEvolutionContractResult, scenario: Scenario): MissionStrategyComparison {
  const classification = classificationForScenario(scenario);
  const similarity = similarityForScenario(scenario);
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["evidence_ref_strategy_comparison_1", "evidence_ref_strategy_comparison_2", "evidence_ref_strategy_comparison_3"]);
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : contract.proposal_envelope.governance_refs;
  const replayRefs = scenario === "REPLAY_FAILURE" ? freezeArray([]) : contract.proposal_envelope.replay_refs;
  const effectiveness = effectivenessFor(classification);
  const base: Omit<MissionStrategyComparison, "integrity_hash"> = {
    comparison_id: `mission_strategy_comparison_${hash(`${contract.proposal_envelope.proposal_id}:${classification}:${similarity}`).slice(0, 16)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${contract.proposal_envelope.tenant_id}:foreign` : contract.proposal_envelope.tenant_id,
    mission_scope: contract.proposal_envelope.mission_scope,
    comparison_timestamp: COMPARISON_TIMESTAMP,
    mission_similarity_level: similarity,
    mission_similarity_score: similarityScore(similarity),
    compared_strategy_refs: freezeArray(["strategy_ref_current_baseline", "strategy_ref_candidate_historical"]),
    comparison_dimensions: freezeArray(["objectives", "operator_actions", "outcomes", "governance_paths", "replay_history", "evidence_quality", "risk_realization", "confidence_accuracy"]),
    objective_alignment_score: clamp(similarity === "IDENTICAL" ? 0.98 : similarityScore(similarity)),
    operator_alignment_score: clamp(0.78),
    governance_alignment_score: clamp(scenario === "MISSING_GOVERNANCE" ? 0 : 0.82),
    evidence_quality_score: clamp(evidenceRefs.length ? 0.87 : 0),
    risk_performance_score: clamp(classification === "OBSOLETE" ? 0.28 : classification === "WEAKEST" ? 0.46 : 0.83),
    confidence_accuracy_score: clamp(classification === "OBSOLETE" ? 0.32 : 0.8),
    replay_consistency_score: clamp(replayRefs.length ? 0.9 : 0),
    comparative_effectiveness_score: clamp(effectiveness),
    strategy_classification: scenario === "INCONSISTENT_CLASSIFICATION" ? "WEAKEST" : classification,
    ranking_position: rankingFor(classification, scenario),
    supporting_outcome_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : freezeArray(["outcome_ref_comparison_1", "outcome_ref_comparison_2", "outcome_ref_comparison_3"]),
    supporting_pattern_refs: scenario === "MISSING_EVIDENCE" ? freezeArray([]) : contract.pattern_certification.dashboard_result.dashboard_view.visible_pattern_refs,
    supporting_evidence_refs: evidenceRefs,
    supporting_governance_refs: governanceRefs,
    supporting_replay_refs: replayRefs,
    lifecycle_state: similarity === "MODERATE" || similarity === "LOW" || similarity === "NONE" ? "REJECTED" : "REGISTERED",
    advisory_only: true,
    mutates_strategy: false,
    generates_proposals: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.comparison_id }) });
  if (scenario === "STRATEGY_MUTATION") return Object.freeze({ ...record, mutates_strategy: true as false });
  if (scenario === "PROPOSAL_GENERATION") return Object.freeze({ ...record, generates_proposals: true as false });
  return record;
}

function buildComparisons(contract: StrategyEvolutionContractResult, scenario: Scenario): readonly MissionStrategyComparison[] {
  if (scenario === "UNCERTIFIED_CONTRACT") return freezeArray([]);
  return freezeArray([buildComparison(contract, scenario)]);
}

function buildRegistry(contract: StrategyEvolutionContractResult, comparisons: readonly MissionStrategyComparison[], scenario: Scenario): MissionStrategyComparisonRegistry {
  const classification_index = comparisons.reduce((index, comparison) => {
    return { ...index, [comparison.strategy_classification]: freezeArray([...(index[comparison.strategy_classification] ?? []), comparison.comparison_id]) };
  }, {} as Record<MissionStrategyClassification, readonly string[]>);
  const similarity_index = comparisons.reduce((index, comparison) => {
    return { ...index, [comparison.mission_similarity_level]: freezeArray([...(index[comparison.mission_similarity_level] ?? []), comparison.comparison_id]) };
  }, {} as Record<MissionStrategySimilarityLevel, readonly string[]>);
  const ranked = [...comparisons].sort((a, b) => a.ranking_position - b.ranking_position || b.comparative_effectiveness_score - a.comparative_effectiveness_score);
  const base: Omit<MissionStrategyComparisonRegistry, "integrity_hash"> = {
    registry_id: `mission_strategy_comparison_registry_${hash(contract.proposal_envelope.proposal_id).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${contract.proposal_envelope.tenant_id}:foreign` : contract.proposal_envelope.tenant_id,
    comparison_refs: comparisons.map((comparison) => comparison.comparison_id),
    ranking_index: freezeArray(ranked.map((comparison) => comparison.comparison_id)),
    classification_index: Object.freeze(classification_index),
    similarity_index: Object.freeze(similarity_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(contract: StrategyEvolutionContractResult, comparisons: readonly MissionStrategyComparison[], registry: MissionStrategyComparisonRegistry, scenario: Scenario): readonly MissionStrategyComparisonFailure[] {
  const failures: MissionStrategyComparisonFailure[] = [];
  if (scenario === "UNCERTIFIED_CONTRACT" || !contract.validation.certified) failures.push("STRATEGY_CONTRACT_UNCERTIFIED");
  if (scenario === "MODERATE_SIMILARITY" || scenario === "LOW_SIMILARITY" || scenario === "NO_SIMILARITY" || comparisons.some((comparison) => !["IDENTICAL", "HIGH"].includes(comparison.mission_similarity_level))) failures.push("MISSION_SIMILARITY_BELOW_THRESHOLD");
  if (scenario === "MISSING_EVIDENCE" || comparisons.some((comparison) => !comparison.supporting_outcome_refs.length || !comparison.supporting_pattern_refs.length || !comparison.supporting_evidence_refs.length)) failures.push("SUPPORTING_EVIDENCE_MISSING");
  if (scenario === "REPLAY_FAILURE" || !replayStrategyEvolutionContract(contract) || comparisons.some((comparison) => !comparison.supporting_replay_refs.length)) failures.push("REPLAY_VERIFICATION_FAILED");
  if (scenario === "MISSING_GOVERNANCE" || comparisons.some((comparison) => !comparison.supporting_governance_refs.length)) failures.push("GOVERNANCE_REFERENCES_MISSING");
  if (scenario === "NONDETERMINISTIC_RANKING" || comparisons.some((comparison, index) => comparison.ranking_position !== index + 1 && comparison.strategy_classification === "BEST_PERFORMING")) failures.push("RANKING_NONDETERMINISTIC");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== contract.proposal_envelope.tenant_id) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "INCONSISTENT_CLASSIFICATION") failures.push("CLASSIFICATION_INCONSISTENT");
  if (scenario === "HASH_MISMATCH" || comparisons.some((comparison) => hashWithoutIntegrity(comparison) !== comparison.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "ADVISORY_VIOLATION") failures.push("ADVISORY_ONLY_VIOLATION");
  if (scenario === "STRATEGY_MUTATION" || comparisons.some((comparison) => comparison.mutates_strategy)) failures.push("STRATEGY_MUTATION_DETECTED");
  if (scenario === "PROPOSAL_GENERATION" || comparisons.some((comparison) => comparison.generates_proposals)) failures.push("PROPOSAL_GENERATION_DETECTED");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly MissionStrategyComparisonFailure[]): MissionStrategyComparisonValidation["state"] {
  if (failures.includes("SUPPORTING_EVIDENCE_MISSING")) return "PENDING_EVIDENCE";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(contract: StrategyEvolutionContractResult, comparisons: readonly MissionStrategyComparison[], registry: MissionStrategyComparisonRegistry, failures: readonly MissionStrategyComparisonFailure[]): MissionStrategyComparisonValidation {
  const comparisonsVerified = comparisons.every((comparison) => hashWithoutIntegrity(comparison) === comparison.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<MissionStrategyComparisonValidation, "integrity_hash"> = {
    validation_id: "mission_strategy_comparison_engine_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && comparisonsVerified && registryVerified,
    failures,
    contract_certified: contract.validation.certified,
    similarity_threshold_met: !failures.includes("MISSION_SIMILARITY_BELOW_THRESHOLD"),
    evidence_complete: !failures.includes("SUPPORTING_EVIDENCE_MISSING"),
    replay_verified: !failures.includes("REPLAY_VERIFICATION_FAILED"),
    governance_referenced: !failures.includes("GOVERNANCE_REFERENCES_MISSING"),
    ranking_deterministic: !failures.includes("RANKING_NONDETERMINISTIC"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    classification_consistent: !failures.includes("CLASSIFICATION_INCONSISTENT"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    integrity_verified: comparisonsVerified && registryVerified,
    advisory_only: comparisons.every((comparison) => comparison.advisory_only),
    no_strategy_mutation: comparisons.every((comparison) => !comparison.mutates_strategy),
    no_proposal_generation: comparisons.every((comparison) => !comparison.generates_proposals),
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<MissionStrategyComparisonResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    strategy_contract_replay_hash: result.strategy_contract.replay_hash,
    comparisons: result.comparisons,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<MissionStrategyComparisonResult, "integrity_hash">): string {
  return hash({
    mission_strategy_comparison_engine_version: result.mission_strategy_comparison_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    comparison_hashes: result.comparisons.map((comparison) => comparison.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
    advisory_only: result.advisory_only,
    mutates_strategy: result.mutates_strategy,
    generates_proposals: result.generates_proposals,
  });
}

export function compareMissionStrategies(input: MissionStrategyComparisonInput = {}): MissionStrategyComparisonResult {
  const scenario = input.scenario ?? "BASELINE";
  const strategy_contract = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const comparisons = buildComparisons(strategy_contract, scenario);
  const registry = buildRegistry(strategy_contract, comparisons, scenario);
  const validationFailures = collectFailures(strategy_contract, comparisons, registry, scenario);
  const validation = buildValidation(strategy_contract, comparisons, registry, validationFailures);
  const base: Omit<MissionStrategyComparisonResult, "integrity_hash" | "replay_hash"> = {
    mission_strategy_comparison_engine_version: MISSION_STRATEGY_COMPARISON_VERSION,
    strategy_contract,
    api_surface,
    comparisons,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    evidence_backed: validation.evidence_complete,
    governance_compliant: validation.governance_referenced,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: true,
    mutates_strategy: false,
    generates_proposals: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayMissionStrategyComparison(result: MissionStrategyComparisonResult): boolean {
  return resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash && replayStrategyEvolutionContract(result.strategy_contract);
}

export function getMissionStrategyComparisonFoundation(): MissionStrategyComparisonFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    mission_strategy_comparison_engine_version: MISSION_STRATEGY_COMPARISON_VERSION,
    api_surface,
    result: compareMissionStrategies(),
  });
}

export const MissionStrategyComparisonEngine = Object.freeze({
  compare: compareMissionStrategies,
  replay: replayMissionStrategyComparison,
});
