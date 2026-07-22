import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import {
  replayGovernanceConstitutionalStrategyReview,
  reviewGovernanceConstitutionalStrategy,
} from "@/services/governance-constitutional-strategy-review";
import type {
  StrategySimulationApiSurface,
  StrategySimulationBinding,
  StrategySimulationBindingFailure,
  StrategySimulationBindingFoundation,
  StrategySimulationBindingInput,
  StrategySimulationBindingResult,
  StrategySimulationReadinessStatus,
  StrategySimulationRegistry,
  StrategySimulationScenarioType,
  StrategySimulationValidation,
} from "@/types/strategy-simulation-binding-engine";

const SIMULATION_BINDING_VERSION = "strategy-simulation-binding-engine/v1" as const;

type Scenario = NonNullable<StrategySimulationBindingInput["scenario"]>;

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

function reviewScenario(scenario: Scenario) {
  const map = {
    UNCERTIFIED_REVIEW: "UNCERTIFIED_LEDGER",
    MISSING_GOVERNANCE: "MISSING_GOVERNANCE",
    MISSING_REPLAY: "MISSING_REPLAY",
    CROSS_TENANT: "CROSS_TENANT",
    HASH_MISMATCH: "HASH_MISMATCH",
    SIMULATION_BYPASS: "SIMULATION_BYPASS",
    FAIL_OPEN: "FAIL_OPEN",
  } as const;
  return map[scenario as keyof typeof map] ?? "APPROVED_FOR_SIMULATION";
}

function sourceForScenario(input: StrategySimulationBindingInput, scenario: Scenario) {
  return input.review_result ?? reviewGovernanceConstitutionalStrategy({ scenario: reviewScenario(scenario) });
}

function buildApiSurface(): StrategySimulationApiSurface {
  const base: Omit<StrategySimulationApiSurface, "integrity_hash"> = {
    api_id: "strategy_simulation_binding_engine_api",
    bind_simulation: "POST /strategy-simulation-binding-engine/bind",
    retrieve_bindings: "POST /strategy-simulation-binding-engine/bindings",
    retrieve_scenarios: "POST /strategy-simulation-binding-engine/scenarios",
    retrieve_historical_replay: "POST /strategy-simulation-binding-engine/historical-replay",
    retrieve_counterfactual: "POST /strategy-simulation-binding-engine/counterfactual",
    retrieve_stress: "POST /strategy-simulation-binding-engine/stress",
    retrieve_comparative: "POST /strategy-simulation-binding-engine/comparative",
    retrieve_risk: "POST /strategy-simulation-binding-engine/risk",
    retrieve_governance: "POST /strategy-simulation-binding-engine/governance",
    replay_binding: "POST /strategy-simulation-binding-engine/replay",
    retrieve_registry: "POST /strategy-simulation-binding-engine/registry",
    retrieve_contract: "GET /strategy-simulation-binding-engine/contract",
    update_supported: false,
    delete_supported: false,
    simulation_bypass_supported: false,
    adoption_authorization_supported: false,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function readinessForScenario(scenario: Scenario): StrategySimulationReadinessStatus {
  if (scenario === "REQUIRES_REVISION") return "REQUIRES_REVISION";
  if (scenario === "FAILED_VALIDATION") return "FAILED_VALIDATION";
  return "READY_FOR_SIMULATION";
}

function buildBinding(input: StrategySimulationBindingInput, scenario: Scenario): StrategySimulationBinding {
  const reviewResult = sourceForScenario(input, scenario);
  const review = reviewResult.reviews[0];
  const ledgerRecord = reviewResult.ledger_result.records[0];
  const proposal = reviewResult.ledger_result.proposal_result.proposals[0];
  const readiness = readinessForScenario(scenario);
  const simulationScenarios: readonly StrategySimulationScenarioType[] = scenario === "MISSING_SCENARIO"
    ? freezeArray([])
    : freezeArray(["HISTORICAL_REPLAY", "COUNTERFACTUAL_REPLAY", "GOVERNANCE_STRESS", "EVIDENCE_DEGRADATION", "ROLLBACK_RECOVERY"]);
  const historicalReplayRefs = scenario === "MISSING_HISTORICAL_REPLAY" ? freezeArray([]) : ledgerRecord?.replay_refs ?? freezeArray([]);
  const counterfactualRefs = scenario === "MISSING_COUNTERFACTUAL" ? freezeArray([]) : freezeArray(["counterfactual_ref_strategy_delta_1"]);
  const stressRefs = scenario === "MISSING_STRESS" ? freezeArray([]) : freezeArray(["stress_ref_governance_overload_1", "stress_ref_evidence_degradation_1"]);
  const comparativeRefs = scenario === "MISSING_COMPARATIVE" ? freezeArray([]) : freezeArray(["comparative_baseline_ref_current_strategy", "comparative_baseline_ref_proposed_strategy"]);
  const governanceRefs = scenario === "MISSING_GOVERNANCE" ? freezeArray([]) : review?.supporting_governance_refs ?? freezeArray([]);
  const benefits = scenario === "MISSING_BENEFITS" ? freezeArray([]) : proposal?.expected_benefits ?? freezeArray([]);
  const risks = scenario === "MISSING_RISKS" ? freezeArray([]) : proposal?.expected_risks ?? freezeArray([]);
  const replayRefs = scenario === "MISSING_REPLAY" ? freezeArray([]) : freezeArray([...(review?.supporting_replay_refs ?? []), ...(ledgerRecord?.replay_refs ?? [])]);
  const rollbackRefs = scenario === "MISSING_ROLLBACK" ? freezeArray([]) : ledgerRecord?.rollback_refs ?? freezeArray([]);
  const base: Omit<StrategySimulationBinding, "integrity_hash"> = {
    simulation_binding_id: `strategy_simulation_binding_${hash(`${review?.review_id ?? "missing"}:${scenario}`).slice(0, 16)}`,
    proposal_id: review?.proposal_id ?? proposal?.proposal_id ?? "",
    tenant_id: scenario === "CROSS_TENANT" ? `${review?.tenant_id ?? "tenant_mission_control"}:foreign` : review?.tenant_id ?? "tenant_mission_control",
    mission_scope: review?.mission_scope ?? proposal?.mission_scope ?? "mission_scope_unknown",
    simulation_scenarios: simulationScenarios,
    historical_replay_refs: historicalReplayRefs,
    counterfactual_refs: counterfactualRefs,
    stress_test_refs: stressRefs,
    governance_validation_refs: governanceRefs,
    comparative_baseline_refs: comparativeRefs,
    expected_benefits: benefits,
    expected_risks: risks,
    unintended_consequence_summary: scenario === "MISSING_CONSEQUENCES" ? "" : "Potential workflow, governance, replay, and rollback consequences analyzed for simulation readiness.",
    simulation_readiness_status: readiness,
    replay_refs: replayRefs,
    rollback_refs: rollbackRefs,
    lifecycle_state: readiness === "READY_FOR_SIMULATION" ? "READY_FOR_SIMULATION" : readiness,
    simulation_execution_authorized: false,
    advisory_only: true,
    mutates_strategy: false,
  };
  const binding = Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
  if (scenario === "HASH_MISMATCH") return Object.freeze({ ...binding, integrity_hash: hash({ tampered: binding.simulation_binding_id }) });
  return binding;
}

function buildBindings(input: StrategySimulationBindingInput, scenario: Scenario): readonly StrategySimulationBinding[] {
  if (scenario === "UNCERTIFIED_REVIEW") return freezeArray([]);
  return freezeArray([buildBinding(input, scenario)]);
}

function buildRegistry(bindings: readonly StrategySimulationBinding[], scenario: Scenario): StrategySimulationRegistry {
  const readiness_index = bindings.reduce((index, binding) => {
    return { ...index, [binding.simulation_readiness_status]: freezeArray([...(index[binding.simulation_readiness_status] ?? []), binding.simulation_binding_id]) };
  }, {} as Record<StrategySimulationReadinessStatus, readonly string[]>);
  const scenario_index = bindings.reduce((index, binding) => {
    return binding.simulation_scenarios.reduce((nested, simulationScenario) => {
      return { ...nested, [simulationScenario]: freezeArray([...(nested[simulationScenario] ?? []), binding.simulation_binding_id]) };
    }, index);
  }, {} as Record<StrategySimulationScenarioType, readonly string[]>);
  const base: Omit<StrategySimulationRegistry, "integrity_hash"> = {
    registry_id: `strategy_simulation_registry_${hash(bindings.map((binding) => binding.simulation_binding_id)).slice(0, 14)}`,
    tenant_id: scenario === "CROSS_TENANT" ? `${bindings[0]?.tenant_id ?? "tenant_mission_control"}:foreign` : bindings[0]?.tenant_id ?? "tenant_mission_control",
    simulation_binding_refs: bindings.map((binding) => binding.simulation_binding_id),
    readiness_index: Object.freeze(readiness_index),
    scenario_index: Object.freeze(scenario_index),
    append_only: true,
    immutable: true,
    deleted: scenario === "REGISTRY_MUTATION",
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function collectFailures(input: StrategySimulationBindingInput, bindings: readonly StrategySimulationBinding[], registry: StrategySimulationRegistry, scenario: Scenario): readonly StrategySimulationBindingFailure[] {
  const reviewResult = sourceForScenario(input, scenario);
  const failures: StrategySimulationBindingFailure[] = [];
  if (scenario === "UNCERTIFIED_REVIEW" || !reviewResult.validation.certified || !reviewResult.simulation_entry_permitted) failures.push("GOVERNANCE_REVIEW_UNCERTIFIED");
  if (scenario === "MISSING_SCENARIO" || bindings.some((binding) => !binding.simulation_scenarios.length)) failures.push("SIMULATION_SCENARIO_NOT_ASSIGNED");
  if (scenario === "MISSING_HISTORICAL_REPLAY" || bindings.some((binding) => !binding.historical_replay_refs.length)) failures.push("HISTORICAL_REPLAY_UNAVAILABLE");
  if (scenario === "MISSING_COUNTERFACTUAL" || bindings.some((binding) => !binding.counterfactual_refs.length)) failures.push("COUNTERFACTUAL_ANALYSIS_OMITTED");
  if (scenario === "MISSING_STRESS" || bindings.some((binding) => !binding.stress_test_refs.length)) failures.push("STRESS_TESTING_OMITTED");
  if (scenario === "MISSING_COMPARATIVE" || bindings.some((binding) => !binding.comparative_baseline_refs.length)) failures.push("COMPARATIVE_ANALYSIS_INCOMPLETE");
  if (scenario === "MISSING_BENEFITS" || bindings.some((binding) => !binding.expected_benefits.length)) failures.push("EXPECTED_BENEFITS_NOT_MEASURED");
  if (scenario === "MISSING_RISKS" || bindings.some((binding) => !binding.expected_risks.length)) failures.push("EXPECTED_RISKS_NOT_EVALUATED");
  if (scenario === "MISSING_CONSEQUENCES" || bindings.some((binding) => !binding.unintended_consequence_summary)) failures.push("UNINTENDED_CONSEQUENCES_NOT_ANALYZED");
  if (scenario === "MISSING_GOVERNANCE" || bindings.some((binding) => !binding.governance_validation_refs.length)) failures.push("GOVERNANCE_VALIDATION_MISSING");
  if (scenario === "MISSING_REPLAY" || !replayGovernanceConstitutionalStrategyReview(reviewResult) || bindings.some((binding) => !binding.replay_refs.length)) failures.push("REPLAY_REFERENCES_INCOMPLETE");
  if (scenario === "MISSING_ROLLBACK" || bindings.some((binding) => !binding.rollback_refs.length)) failures.push("ROLLBACK_REFERENCES_MISSING");
  if (scenario === "CROSS_TENANT" || registry.tenant_id !== (bindings[0]?.tenant_id ?? registry.tenant_id)) failures.push("TENANT_ISOLATION_VIOLATED");
  if (scenario === "HASH_MISMATCH" || bindings.some((binding) => hashWithoutIntegrity(binding) !== binding.integrity_hash) || hashWithoutIntegrity(registry) !== registry.integrity_hash) failures.push("INTEGRITY_HASH_MISMATCH");
  if (scenario === "REGISTRY_MUTATION" || registry.deleted) failures.push("REGISTRY_MUTATION_DETECTED");
  if (scenario === "SIMULATION_BYPASS" || bindings.some((binding) => binding.simulation_execution_authorized)) failures.push("SIMULATION_BYPASS_DETECTED");
  if (scenario === "ADVISORY_VIOLATION" || bindings.some((binding) => !binding.advisory_only || binding.mutates_strategy)) failures.push("ADVISORY_ONLY_VIOLATION");
  if (scenario === "FAIL_OPEN") failures.push("FAIL_OPEN_BEHAVIOR");
  return freezeArray([...new Set(failures)]);
}

function stateFor(failures: readonly StrategySimulationBindingFailure[]): StrategySimulationValidation["state"] {
  if (failures.some((failure) => failure.includes("OMITTED") || failure.includes("MISSING") || failure.includes("UNAVAILABLE") || failure.includes("INCOMPLETE"))) return "PENDING_SIMULATION_INPUTS";
  return failures.length ? "FAILED" : "CERTIFIED";
}

function buildValidation(input: StrategySimulationBindingInput, bindings: readonly StrategySimulationBinding[], registry: StrategySimulationRegistry, failures: readonly StrategySimulationBindingFailure[], scenario: Scenario): StrategySimulationValidation {
  const reviewResult = sourceForScenario(input, scenario);
  const bindingsVerified = bindings.every((binding) => hashWithoutIntegrity(binding) === binding.integrity_hash);
  const registryVerified = hashWithoutIntegrity(registry) === registry.integrity_hash;
  const base: Omit<StrategySimulationValidation, "integrity_hash"> = {
    validation_id: "strategy_simulation_binding_engine_validation",
    state: stateFor(failures),
    certified: failures.length === 0 && bindingsVerified && registryVerified,
    failures,
    governance_review_certified: reviewResult.validation.certified && reviewResult.simulation_entry_permitted,
    scenario_assigned: !failures.includes("SIMULATION_SCENARIO_NOT_ASSIGNED"),
    historical_replay_available: !failures.includes("HISTORICAL_REPLAY_UNAVAILABLE"),
    counterfactual_complete: !failures.includes("COUNTERFACTUAL_ANALYSIS_OMITTED"),
    stress_testing_complete: !failures.includes("STRESS_TESTING_OMITTED"),
    comparative_analysis_complete: !failures.includes("COMPARATIVE_ANALYSIS_INCOMPLETE"),
    benefits_measured: !failures.includes("EXPECTED_BENEFITS_NOT_MEASURED"),
    risks_evaluated: !failures.includes("EXPECTED_RISKS_NOT_EVALUATED"),
    unintended_consequences_analyzed: !failures.includes("UNINTENDED_CONSEQUENCES_NOT_ANALYZED"),
    governance_validation_complete: !failures.includes("GOVERNANCE_VALIDATION_MISSING"),
    replay_complete: !failures.includes("REPLAY_REFERENCES_INCOMPLETE"),
    rollback_complete: !failures.includes("ROLLBACK_REFERENCES_MISSING"),
    tenant_isolated: !failures.includes("TENANT_ISOLATION_VIOLATED"),
    registry_immutable: registry.append_only && registry.immutable && !registry.deleted,
    simulation_bypass_prevented: !failures.includes("SIMULATION_BYPASS_DETECTED"),
    advisory_only: !failures.includes("ADVISORY_ONLY_VIOLATION"),
    integrity_verified: bindingsVerified && registryVerified,
  };
  return Object.freeze({ ...base, integrity_hash: hashWithoutIntegrity(base) });
}

function resultReplayHash(result: Omit<StrategySimulationBindingResult, "integrity_hash" | "replay_hash">): string {
  return hash({
    review_replay_hash: result.review_result.replay_hash,
    bindings: result.bindings,
    registry: result.registry,
    validation: result.validation,
  });
}

function resultIntegrityHash(result: Omit<StrategySimulationBindingResult, "integrity_hash">): string {
  return hash({
    strategy_simulation_binding_engine_version: result.strategy_simulation_binding_engine_version,
    api_surface_hash: result.api_surface.integrity_hash,
    binding_hashes: result.bindings.map((binding) => binding.integrity_hash),
    registry_hash: result.registry.integrity_hash,
    validation_hash: result.validation.integrity_hash,
    replay_hash: result.replay_hash,
  });
}

export function bindStrategySimulation(input: StrategySimulationBindingInput = {}): StrategySimulationBindingResult {
  const scenario = input.scenario ?? "BASELINE";
  const review_result = sourceForScenario(input, scenario);
  const api_surface = buildApiSurface();
  const bindings = buildBindings(input, scenario);
  const registry = buildRegistry(bindings, scenario);
  const validationFailures = collectFailures(input, bindings, registry, scenario);
  const validation = buildValidation(input, bindings, registry, validationFailures, scenario);
  const base: Omit<StrategySimulationBindingResult, "integrity_hash" | "replay_hash"> = {
    strategy_simulation_binding_engine_version: SIMULATION_BINDING_VERSION,
    review_result,
    api_surface,
    bindings,
    registry,
    validation,
    deterministic: true,
    replayable: true,
    simulation_mandatory: true,
    simulation_ready: validation.certified && bindings.every((binding) => binding.simulation_readiness_status === "READY_FOR_SIMULATION"),
    tenant_isolated: validation.tenant_isolated,
    governance_validated: validation.governance_validation_complete,
    advisory_only: validation.advisory_only,
    mutates_strategy: false,
    authorizes_adoption: false,
  };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function replayStrategySimulationBinding(result: StrategySimulationBindingResult): boolean {
  return resultReplayHash(result) === result.replay_hash
    && resultIntegrityHash(result) === result.integrity_hash
    && replayGovernanceConstitutionalStrategyReview(result.review_result);
}

export function getStrategySimulationBindingFoundation(): StrategySimulationBindingFoundation {
  const api_surface = buildApiSurface();
  return Object.freeze({
    strategy_simulation_binding_engine_version: SIMULATION_BINDING_VERSION,
    api_surface,
    result: bindStrategySimulation(),
  });
}

export const StrategySimulationBindingEngine = Object.freeze({
  bind: bindStrategySimulation,
  replay: replayStrategySimulationBinding,
});
