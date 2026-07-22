import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { bindStrategySimulation, replayStrategySimulationBinding } from "@/services/strategy-simulation-binding-engine";
import type {
  StrategyReplayApiSurface,
  StrategyReplayExplainabilityFailure,
  StrategyReplayExplainabilityFoundation,
  StrategyReplayExplainabilityInput,
  StrategyReplayExplainabilityResult,
  StrategyReplayRecord,
  StrategyReplayRegistry,
  StrategyReplayType,
  StrategyReplayValidation,
} from "@/types/strategy-replay-explainability-engine";

const STRATEGY_REPLAY_VERSION = "strategy-replay-explainability-engine/v1" as const;

type Scenario = NonNullable<StrategyReplayExplainabilityInput["scenario"]>;

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

function simulationScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_SIMULATION: "UNCERTIFIED_REVIEW",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_SIMULATION: "MISSING_REPLAY",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    ADVISORY_VIOLATION: "ADVISORY_VIOLATION",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "BASELINE";
}

function sourceForScenario(input: StrategyReplayExplainabilityInput, scenario: Scenario) {
  return input.simulation_result ?? bindStrategySimulation({ scenario: simulationScenario(scenario) });
}

function buildApiSurface(): StrategyReplayApiSurface {
  const base: Omit<StrategyReplayApiSurface, "integrity_hash"> = {
    api_id: "strategy_replay_explainability_engine_api",
    replay_strategy: "POST /strategy-replay-explainability-engine/replay",
    retrieve_records: "POST /strategy-replay-explainability-engine/records",
    retrieve_explanation: "POST /strategy-replay-explainability-engine/explanation",
    retrieve_lineage: "POST /strategy-replay-explainability-engine/lineage",
    retrieve_trace: "POST /strategy-replay-explainability-engine/trace",
    retrieve_evidence: "POST /strategy-replay-explainability-engine/evidence",
    retrieve_governance: "POST /strategy-replay-explainability-engine/governance",
    retrieve_simulation: "POST /strategy-replay-explainability-engine/simulation",
    retrieve_operator: "POST /strategy-replay-explainability-engine/operator",
    retrieve_registry: "POST /strategy-replay-explainability-engine/registry",
    retrieve_contract: "GET /strategy-replay-explainability-engine/contract",
    update_supported: false,
    delete_supported: false,
    strategy_mutation_supported: false,
    adoption_authorization_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function replayTypeForScenario(scenario: Scenario): StrategyReplayType {
  const map: Partial<Record<Scenario, StrategyReplayType>> = {
    OUTCOME_REPLAY: "OUTCOME",
    DECISION_REPLAY: "DECISION",
    RECOMMENDATION_REPLAY: "RECOMMENDATION",
    PATTERN_REPLAY: "PATTERN",
    PROPOSAL_REPLAY: "PROPOSAL",
    GOVERNANCE_REPLAY: "GOVERNANCE",
    SIMULATION_REPLAY: "SIMULATION",
    OPERATOR_REPLAY: "OPERATOR",
  };
  return map[scenario] ?? "FULL_STRATEGY";
}

function buildReplayRecord(source: ReturnType<typeof sourceForScenario>, scenario: Scenario): StrategyReplayRecord {
  const binding = source.bindings[0];
  const review = source.review_result.reviews[0];
  const ledgerRecord = source.review_result.ledger_result.records[0];
  const proposal = source.review_result.ledger_result.proposal_result.proposals[0];
  const outcomeRefs = scenario === "MISSING_OUTCOME" ? freezeArray([]) : proposal?.supporting_outcome_refs ?? freezeArray([]);
  const decisionRefs = scenario === "MISSING_DECISION" ? freezeArray([]) : freezeArray(["decision_ref_strategy_replay_1", "decision_ref_strategy_replay_2"]);
  const recommendationRefs = scenario === "MISSING_RECOMMENDATION" ? freezeArray([]) : proposal?.supporting_opportunity_refs ?? freezeArray([]);
  const patternRefs = scenario === "MISSING_PATTERN" ? freezeArray([]) : proposal?.supporting_pattern_refs ?? freezeArray([]);
  const proposalRefs = scenario === "MISSING_PROPOSAL" ? freezeArray([]) : ledgerRecord?.supporting_proposal_refs ?? freezeArray([]);
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : review?.supporting_governance_refs ?? freezeArray([]);
  const simulationRefs = scenario === "MISSING_SIMULATION" ? freezeArray([]) : binding?.counterfactual_refs ?? freezeArray([]);
  const operatorRefs = scenario === "MISSING_OPERATOR" ? freezeArray([]) : freezeArray(["operator_review_ref_strategy_replay_1"]);
  const evidenceRefs = scenario === "MISSING_EVIDENCE" ? freezeArray([]) : proposal?.supporting_evidence_refs ?? freezeArray([]);
  const lineageRefs = freezeArray([...(ledgerRecord?.lineage_refs ?? []), ...(binding?.replay_refs ?? [])]);
  const summary = scenario === "HIDDEN_REASONING"
    ? ""
    : "Proposal replay reconstructs outcomes, decisions, recommendations, patterns, evidence, governance review, simulation binding, operator review, and lineage without hidden reasoning.";
  const base: Omit<StrategyReplayRecord, "integrity_hash"> = {
    replay_id: `strategy_replay_${hash(`${binding?.simulation_binding_id ?? "missing"}:${scenario}`).slice(0, 16)}`,
    proposal_id: binding?.proposal_id ?? proposal?.proposal_id ?? "",
    tenant_id: scenario === "CROSS_TENANT" ? `${binding?.tenant_id ?? "tenant_mission_control"}:foreign` : binding?.tenant_id ?? "tenant_mission_control",
    mission_scope: binding?.mission_scope ?? proposal?.mission_scope ?? "mission_scope_unknown",
    replay_type: replayTypeForScenario(scenario),
    outcome_refs: outcomeRefs,
    decision_refs: decisionRefs,
    recommendation_refs: recommendationRefs,
    pattern_refs: patternRefs,
    proposal_refs: proposalRefs,
    governance_refs: governanceRefs,
    simulation_refs: simulationRefs,
    operator_review_refs: operatorRefs,
    evidence_refs: evidenceRefs,
    replay_validation_status: scenario === "NONDETERMINISTIC_RECONSTRUCTION" ? "FAILED" : "VALIDATED",
    explainability_summary: summary,
    lineage_refs: lineageRefs,
    decision_trace_refs: freezeArray([...decisionRefs, ...recommendationRefs, ...proposalRefs]),
    hidden_reasoning_detected: scenario === "HIDDEN_REASONING",
    lifecycle_state: scenario === "NONDETERMINISTIC_RECONSTRUCTION" ? "FAILED" : "CERTIFIED",
    advisory_only: true,
    mutates_strategy: false,
  };
  const record = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...record, integrity_hash: hash({ tampered: record.replay_id }) });
  if (scenario === "ADVISORY_VIOLATION") return Object.freeze({ ...record, mutates_strategy: true as false });
  return record;
}

function buildReplayRecords(source: ReturnType<typeof sourceForScenario>, scenario: Scenario): readonly StrategyReplayRecord[] {
  if (scenario === "UNCERTIFIED_SIMULATION") return freezeArray([]);
  return freezeArray([buildReplayRecord(source, scenario)]);
}

function buildRegistry(records: readonly StrategyReplayRecord[], scenario: Scenario): StrategyReplayRegistry {
  const proposal_index = records.reduce((index, record) => {
    return { ...index, [record.proposal_id]: freezeArray([...(index[record.proposal_id] ?? []), record.replay_id]) };
  }, {} as Record<string, readonly string[]>);
  const replay_type_index = records.reduce((index, record) => {
    return { ...index, [record.replay_type]: freezeArray([...(index[record.replay_type] ?? []), record.replay_id]) };
  }, {} as Record<StrategyReplayType, readonly string[]>);
  const base: Omit<StrategyReplayRegistry, "integrity_hash"> = {
    registry_id: `strategy_replay_registry_${hash(records.map((record) => record.replay_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${records[0]?.tenant_id ?? "tenant_mission_control"}:foreign` : records[0]?.tenant_id ?? "tenant_mission_control",
    replay_refs: records.map((record) => record.replay_id),
    proposal_index: Object.freeze(proposal_index),
    replay_type_index: Object.freeze(replay_type_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(source: ReturnType<typeof sourceForScenario>, records: readonly StrategyReplayRecord[], registry: StrategyReplayRegistry, scenario: Scenario): readonly StrategyReplayExplainabilityFailure[] {
  const failures: StrategyReplayExplainabilityFailure[] = [];
  if (scenario === "UNCERTIFIED_SIMULATION" || !source.validation.certified) failures.push("SIMULATION_BINDING_UNCERTIFIED");
  if (scenario === "MISSING_OUTCOME" || records.some((record) => !record.outcome_refs.length)) failures.push("OUTCOME_REPLAY_INCOMPLETE");
  if (scenario === "MISSING_DECISION" || records.some((record) => !record.decision_refs.length)) failures.push("DECISION_REPLAY_INCOMPLETE");
  if (scenario === "MISSING_RECOMMENDATION" || records.some((record) => !record.recommendation_refs.length)) failures.push("RECOMMENDATION_REPLAY_MISSING");
  if (scenario === "MISSING_PATTERN" || records.some((record) => !record.pattern_refs.length)) failures.push("PATTERN_REPLAY_INCOMPLETE");
  if (scenario === "MISSING_PROPOSAL" || records.some((record) => !record.proposal_refs.length)) failures.push("PROPOSAL_REPLAY_INCOMPLETE");
  if (scenario === "MISSING_GOVERNANCE" || records.some((record) => !record.governance_refs.length)) failures.push("GOVERNANCE_REPLAY_INCOMPLETE");
  if (scenario === "MISSING_SIMULATION" || !replayStrategySimulationBinding(source) || records.some((record) => !record.simulation_refs.length)) failures.push("SIMULATION_REPLAY_INCOMPLETE");
  if (scenario === "MISSING_OPERATOR" || records.some((record) => !record.operator_review_refs.length)) failures.push("OPERATOR_REVIEW_HISTORY_MISSING");
  if (scenario === "MISSING_EVIDENCE" || records.some((record) => !record.evidence_refs.length || !record.lineage_refs.length)) failures.push("EVIDENCE_LINEAGE_INCOMPLETE");
  if (scenario === "NONDETERMINISTIC_RECONSTRUCTION" || records.some((record) => record.replay_validation_status !== "VALIDATED")) failures.push("REPLAY_RECONSTRUCTION_NONDETERMINISTIC");
  if (scenario === "HIDDEN_REASONING" || records.some((record) => record.hidden_reasoning_detected || !record.explainability_summary)) failures.push("HIDDEN_REASONING_DETECTED");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (records[0]?.tenant_id ?? registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || records.some((record) => hashWithoutIntegrity(record) !== record.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "ADVISORY_VIOLATION" || records.some((record) => !record.advisory_only || record.mutates_strategy)) failures.push("ADVISORY_ONLY_VIOLATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly StrategyReplayExplainabilityFailure[]): StrategyReplayValidation["state"] {
  if (failures.some((failure) => failure.includes("INCOMPLETE") || failure.includes("MISSING"))) return "PENDING_REPLAY_REFERENCES";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(source: ReturnType<typeof sourceForScenario>, records: readonly StrategyReplayRecord[], registry: StrategyReplayRegistry, failures: readonly StrategyReplayExplainabilityFailure[]): StrategyReplayValidation {
  const recordsVerified = records.every((record) => hashWithoutIntegrity(record) === record.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategyReplayValidation, "integrity_hash"> = {
    validation_id: "strategy_replay_explainability_engine_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && recordsVerified && registryVerified,
    failures,
    simulation_binding_certified: source.validation.certified,
    outcome_replay_complete: !failures.includes("OUTCOME_REPLAY_INCOMPLETE"),
    decision_replay_complete: !failures.includes("DECISION_REPLAY_INCOMPLETE"),
    recommendation_replay_complete: !failures.includes("RECOMMENDATION_REPLAY_MISSING"),
    pattern_replay_complete: !failures.includes("PATTERN_REPLAY_INCOMPLETE"),
    proposal_replay_complete: !failures.includes("PROPOSAL_REPLAY_INCOMPLETE"),
    governance_replay_complete: !failures.includes("GOVERNANCE_REPLAY_INCOMPLETE"),
    simulation_replay_complete: !failures.includes("SIMULATION_REPLAY_INCOMPLETE"),
    operator_review_complete: !failures.includes("OPERATOR_REVIEW_HISTORY_MISSING"),
    evidence_lineage_complete: !failures.includes("EVIDENCE_LINEAGE_INCOMPLETE"),
    reconstruction_deterministic: !failures.includes("REPLAY_RECONSTRUCTION_NONDETERMINISTIC"),
    hidden_reasoning_absent: !failures.includes("HIDDEN_REASONING_DETECTED"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    integrity_verified: recordsVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategyReplayExplainabilityResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    simulation_replay_hash: result.simulation_result.replay_hash,
    replay_records: result.replay_records,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategyReplayExplainabilityResult, "integrity_hash">): string {
  return hash({
    strategy_replay_explainability_engine_version: result.strategy_replay_explainability_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    replay_record_hashes: result.replay_records.map((record) => record.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function replayStrategyEvolutionExplainability(input: StrategyReplayExplainabilityInput = {}): StrategyReplayExplainabilityResult {
  const scenario = input.scenario ?? "BASELINE";
  const simulation_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const replay_records = buildReplayRecords(simulation_result, scenario);
  const registry = buildRegistry(replay_records, scenario);
  const validationFailures = collectFailures(simulation_result, replay_records, registry, scenario);
  const validation = buildValidation(simulation_result, replay_records, registry, validationFailures);
  const base: Omit<StrategyReplayExplainabilityResult, "integrity_hash" | "replay_hash"> = {
    strategy_replay_explainability_engine_version: STRATEGY_REPLAY_VERSION,
    simulation_result,
    api_surface,
    replay_records,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    explainable: validation.certified,
    evidence_lineage_preserved: validation.evidence_lineage_complete,
    tenant_isolated: validation.tenant_isolated,
    advisory_only: validation.advisory_only,
    mutates_strategy: false,
    authorizes_adoption: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategyReplayExplainability(result: StrategyReplayExplainabilityResult): boolean {
  return resultReplayHash(result) === result.replay_hash
    && resultIntegrityHash(result) === result.integrity_hash
    && replayStrategySimulationBinding(result.simulation_result);
}

export function getStrategyReplayExplainabilityFoundation(): StrategyReplayExplainabilityFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategy_replay_explainability_engine_version: STRATEGY_REPLAY_VERSION,
    api_surface,
    result: replayStrategyEvolutionExplainability(),
  });
}

export const StrategyReplayExplainabilityEngine = Object.freeze({
  replay: replayStrategyEvolutionExplainability,
  verify: replayStrategyReplayExplainability,
});
