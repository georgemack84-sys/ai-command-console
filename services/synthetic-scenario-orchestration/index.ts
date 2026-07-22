import { generateDecisionIntegrityHash, serializeDecisionCanonically } from "@/services/decision-integrity";
import { runSyntheticIdentityDataGeneration, validateSyntheticIdentityDataGeneration } from "@/services/synthetic-identity-data-generation";
import type {
  SyntheticScenarioCertificationTest,
  SyntheticScenarioDivergenceCategory,
  SyntheticScenarioFailure,
  SyntheticScenarioOrchestrationBundle,
  SyntheticScenarioOrchestrationInput,
  SyntheticScenarioOrchestrationResult,
  SyntheticScenarioOrchestrationScenario,
  SyntheticScenarioOrchestrationValidation,
  SyntheticScenarioOutcome,
  SyntheticScenarioRecord,
  SyntheticScenarioType,
} from "@/types/synthetic-scenario-orchestration";

const VERSION = "synthetic-scenario-orchestration/v14.4" as const;
const IDENTIFIER = "SyntheticScenarioOrchestration" as const;
const DEFAULT_TENANT = "tenant_mission_control_foundation";
const DEFAULT_OWNER = "scenario-governance-authority";
const DEFAULT_SEED = "seed:phase-14.4:canonical";

function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function hash(value: unknown): string { return generateDecisionIntegrityHash(value); }
function hashWithoutIntegrity<T extends object>(value: T): string { const copy = { ...value } as Record<string, unknown>; delete copy.integrity_hash; return hash(JSON.parse(serializeDecisionCanonically(copy)) as unknown); }
function nested<T extends object>(value: T): T & { integrity_hash: string } { return Object.freeze({ ...value, integrity_hash: hashWithoutIntegrity(value) }) as T & { integrity_hash: string }; }
function verify(value: { integrity_hash: string }): boolean { return hashWithoutIntegrity(value) === value.integrity_hash; }
function id(prefix: string, value: unknown): string { return `${prefix}_${hash(value).slice(0, 20)}`; }
function directFailure(scenario: SyntheticScenarioOrchestrationScenario): SyntheticScenarioFailure | undefined { return scenario === "BASELINE" ? undefined : scenario; }
function has(failures: readonly SyntheticScenarioFailure[], failure: SyntheticScenarioFailure): boolean { return failures.includes(failure); }
function outcomeFor(failures: readonly SyntheticScenarioFailure[]): SyntheticScenarioOutcome {
  if (failures.length === 1 && failures[0] === "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING") return "CONDITIONAL_PASS";
  return failures.length ? "FAIL" : "PASS";
}

const lifecycle = freezeArray(["DEFINED", "REGISTERED", "QUALIFIED", "SCHEDULED", "EXECUTING", "COMPLETED", "REPLAYABLE", "ARCHIVED"] as const);
const scenarioTypes = freezeArray(["NOMINAL", "EDGE_CASE", "ADVERSARIAL", "FAILURE", "RECOVERY"] as const satisfies readonly SyntheticScenarioType[]);
const divergenceCategories = freezeArray(["ORDERING_DIVERGENCE", "ENVIRONMENT_DIVERGENCE", "DATASET_DIVERGENCE", "IDENTITY_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"] as const satisfies readonly SyntheticScenarioDivergenceCategory[]);

function resultReplayHash(result: Omit<SyntheticScenarioOrchestrationResult, "replay_hash" | "integrity_hash">): string {
  return hash({
    data: result.data_generation_ref,
    contract: result.contract.integrity_hash,
    registry: result.registry.map((item) => item.integrity_hash),
    composition: result.composition.integrity_hash,
    schedule: result.schedule.integrity_hash,
    execution: result.execution.integrity_hash,
    replay: result.replay.integrity_hash,
    lineage: result.lineage_audit.integrity_hash,
    governance: result.governance.integrity_hash,
    observability: result.observability.integrity_hash,
    tests: result.certification_tests.map((item) => item.integrity_hash),
    outcome: result.outcome,
  });
}

function resultIntegrityHash(result: Omit<SyntheticScenarioOrchestrationResult, "integrity_hash">): string {
  return hash({ version: result.phase_version, identifier: result.phase_identifier, outcome: result.outcome, replay_hash: result.replay_hash });
}

function test(name: string, passed: boolean, failure: SyntheticScenarioFailure): SyntheticScenarioCertificationTest {
  const actual: SyntheticScenarioOutcome = passed ? "PASS" : failure === "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING" ? "CONDITIONAL_PASS" : "FAIL";
  return nested({ test_id: id("synthetic_scenario_test", name), name, expected: "PASS" as const, actual, passed, failure_reason: passed ? null : failure });
}

export function runSyntheticScenarioOrchestration(input: SyntheticScenarioOrchestrationInput = {}): SyntheticScenarioOrchestrationResult {
  const data = runSyntheticIdentityDataGeneration();
  const dataValid = validateSyntheticIdentityDataGeneration(data).valid;
  const direct = directFailure(input.scenario ?? "BASELINE");
  const failures = freezeArray([...new Set([...(dataValid ? [] : ["DATA_GENERATION_NOT_APPROVED" as const]), ...(direct ? [direct] : [])])]);
  const tenant = has(failures, "TENANT_ISOLATION_BREACH") ? `${input.tenant_id ?? DEFAULT_TENANT}:foreign` : input.tenant_id ?? DEFAULT_TENANT;
  const owner = input.owner ?? DEFAULT_OWNER;
  const seed = input.scenario_seed ?? DEFAULT_SEED;

  const contract = nested({
    contract_version: VERSION,
    data_generation_ref: data.integrity_hash,
    lifecycle,
    supported_scenario_types: scenarioTypes,
    deterministic_execution_required: !has(failures, "EXECUTION_ORDER_NON_REPRODUCIBLE"),
    deterministic_scheduling_required: !has(failures, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC"),
    replay_required: !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    lineage_required: !has(failures, "LINEAGE_INCOMPLETE"),
    governance_required: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    advisory_only: !has(failures, "ADVISORY_BOUNDARY_BREACH"),
  });

  const datasetRefs = data.datasets.map((dataset) => dataset.synthetic_dataset_id);
  const identityRefs = data.identities.map((identity) => identity.synthetic_identity_id);
  const registry = freezeArray(scenarioTypes.map((scenario_type, index): SyntheticScenarioRecord => {
    const duplicateIndex = has(failures, "SCENARIO_IDENTITY_DUPLICATE") ? 0 : index;
    const scenario_id = id("synthetic_scenario", { tenant, scenario_type, seed, index: duplicateIndex });
    return nested({
      scenario_id,
      scenario_name: `${scenario_type.toLowerCase().replace("_", "-")} synthetic mission`,
      tenant_id: tenant,
      scenario_type,
      environment_ref: data.environment_ref,
      dataset_refs: datasetRefs,
      identity_refs: identityRefs,
      dependency_refs: index === 0 ? freezeArray([]) : freezeArray([id("synthetic_scenario", { tenant, scenario_type: scenarioTypes[index - 1], seed, index: has(failures, "SCENARIO_IDENTITY_DUPLICATE") ? 0 : index - 1 })]),
      execution_plan: freezeArray([`prepare:${scenario_type}`, `execute:${scenario_type}`, `collect:${scenario_type}`]),
      governance_refs: freezeArray([data.governance.integrity_hash]),
      owner,
      status: has(failures, "SCENARIO_CONTRACT_INVALID") ? "DEFINED" as const : "REPLAYABLE" as const,
      lineage_refs: has(failures, "LINEAGE_INCOMPLETE") ? freezeArray([]) : freezeArray([id("scenario_lineage", scenario_id)]),
      origin_ref: id("scenario_origin", scenario_id),
    });
  }));

  const composition = nested({
    composition_id: id("scenario_composition", registry.map((item) => item.scenario_id)),
    component_refs: freezeArray([...identityRefs, ...datasetRefs, data.environment_ref]),
    dependency_graph: freezeArray(registry.flatMap((scenario) => scenario.dependency_refs.map((dependency) => `${dependency}->${scenario.scenario_id}`))),
    ownership_validated: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    integrity_validated: !has(failures, "EXECUTION_INTEGRITY_FAILED"),
    tenant_isolation_preserved: !has(failures, "TENANT_ISOLATION_BREACH"),
    deterministic_ordering_preserved: !has(failures, "COMPOSITION_NON_DETERMINISTIC"),
    reproducible: !has(failures, "COMPOSITION_NON_DETERMINISTIC"),
  });
  const queue = has(failures, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC") ? freezeArray([...registry.map((item) => item.scenario_id)].reverse()) : freezeArray(registry.map((item) => item.scenario_id));
  const schedule = nested({
    schedule_id: id("scenario_schedule", queue),
    scheduling_graph: composition.dependency_graph,
    execution_queue: queue,
    prerequisites_respected: !has(failures, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC"),
    parallel_eligibility_deterministic: !has(failures, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC"),
    dependency_readiness_validated: !has(failures, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC"),
    replay_ordering_preserved: !has(failures, "EXECUTION_ORDER_NON_REPRODUCIBLE"),
    nondeterministic_inputs_rejected: !has(failures, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC"),
  });
  const failedTypes = new Set<SyntheticScenarioType>([
    ...(has(failures, "NOMINAL_EXECUTION_FAILED") ? ["NOMINAL" as const] : []),
    ...(has(failures, "EDGE_CASE_EXECUTION_FAILED") ? ["EDGE_CASE" as const] : []),
    ...(has(failures, "ADVERSARIAL_EXECUTION_FAILED") ? ["ADVERSARIAL" as const] : []),
    ...(has(failures, "FAILURE_EXECUTION_FAILED") ? ["FAILURE" as const] : []),
    ...(has(failures, "RECOVERY_EXECUTION_FAILED") ? ["RECOVERY" as const] : []),
  ]);
  const scenarioResults = freezeArray(queue.map((scenario_id) => {
    const scenario = registry.find((item) => item.scenario_id === scenario_id) ?? registry[0];
    return nested({ scenario_id, scenario_type: scenario.scenario_type, result: failedTypes.has(scenario.scenario_type) ? "FAILED" as const : "COMPLETED" as const, output_ref: id("scenario_output", scenario_id) });
  }));
  const execution = nested({
    execution_id: id("scenario_execution", queue),
    scenario_results: scenarioResults,
    nominal_executed: !failedTypes.has("NOMINAL"),
    edge_case_executed: !failedTypes.has("EDGE_CASE"),
    adversarial_executed: !failedTypes.has("ADVERSARIAL"),
    failure_executed: !failedTypes.has("FAILURE"),
    recovery_executed: !failedTypes.has("RECOVERY"),
    deterministic: !has(failures, "EXECUTION_ORDER_NON_REPRODUCIBLE"),
    immutable_results: !has(failures, "EXECUTION_INTEGRITY_FAILED"),
  });
  const replay = nested({
    replay_id: id("scenario_replay", queue),
    execution_order_reproduced: !has(failures, "EXECUTION_ORDER_NON_REPRODUCIBLE") && !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    environment_state_reproduced: !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    identities_reproduced: !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    datasets_reproduced: !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    scheduling_decisions_reproduced: !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    execution_outputs_reproduced: !has(failures, "REPLAY_EXECUTION_MISMATCH"),
    divergence_categories: freezeArray(has(failures, "REPLAY_EXECUTION_MISMATCH") ? ["ORDERING_DIVERGENCE"] as const : has(failures, "REPLAY_DIVERGENCE_UNDETECTED") ? ["UNEXPLAINED_DIVERGENCE"] as const : []),
    divergence_detected: !has(failures, "REPLAY_DIVERGENCE_UNDETECTED"),
    replay_evidence_immutable: !has(failures, "CERTIFICATION_EVIDENCE_MUTABLE"),
  });
  const lineage_audit = nested({
    lineage_id: id("scenario_lineage_audit", registry.map((item) => item.scenario_id)),
    creation_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    composition_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    scheduling_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    execution_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    replay_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    recovery_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    supersession_tracked: !has(failures, "LINEAGE_INCOMPLETE"),
    audit_entries: freezeArray(["scenario creation", "composition", "scheduling", "execution", "replay", "recovery", "supersession"]),
    immutable: !has(failures, "AUDIT_MUTABLE"),
  });
  const governance = nested({
    governance_validation_id: id("scenario_governance", tenant),
    constitutional_compliance: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    governance_approval: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    authority_boundaries_validated: !has(failures, "GOVERNANCE_NOT_ENFORCED"),
    advisory_only_constraints: !has(failures, "ADVISORY_BOUNDARY_BREACH"),
    tenant_isolation: !has(failures, "TENANT_ISOLATION_BREACH"),
    execution_integrity: !has(failures, "EXECUTION_INTEGRITY_FAILED"),
  });
  const observability = nested({
    observability_id: id("scenario_observability", VERSION),
    scenario_throughput_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    scheduling_latency_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    dependency_bottlenecks_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    replay_success_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    divergence_detection_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    failure_rates_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    recovery_success_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    governance_violations_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    tenant_isolation_violations_monitored: !has(failures, "OBSERVABILITY_INCOMPLETE"),
    alerts_configured: !has(failures, "OBSERVABILITY_INCOMPLETE"),
  });
  const tests = freezeArray([
    test("Synthetic Scenario Contract valid", contract.deterministic_execution_required && contract.advisory_only, "SCENARIO_CONTRACT_INVALID"),
    test("Scenario Registry deterministic", !has(failures, "SCENARIO_REGISTRY_NON_DETERMINISTIC"), "SCENARIO_REGISTRY_NON_DETERMINISTIC"),
    test("Scenario identities unique", new Set(registry.map((item) => item.scenario_id)).size === registry.length, "SCENARIO_IDENTITY_DUPLICATE"),
    test("Scenario composition deterministic", composition.reproducible, "COMPOSITION_NON_DETERMINISTIC"),
    test("Dependency scheduling deterministic", schedule.nondeterministic_inputs_rejected && schedule.prerequisites_respected, "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC"),
    test("Execution ordering reproducible", schedule.replay_ordering_preserved && execution.deterministic, "EXECUTION_ORDER_NON_REPRODUCIBLE"),
    test("Nominal scenarios execute correctly", execution.nominal_executed, "NOMINAL_EXECUTION_FAILED"),
    test("Edge case scenarios execute correctly", execution.edge_case_executed, "EDGE_CASE_EXECUTION_FAILED"),
    test("Adversarial scenarios execute correctly", execution.adversarial_executed, "ADVERSARIAL_EXECUTION_FAILED"),
    test("Failure scenarios execute correctly", execution.failure_executed, "FAILURE_EXECUTION_FAILED"),
    test("Recovery scenarios execute correctly", execution.recovery_executed, "RECOVERY_EXECUTION_FAILED"),
    test("Multi-scenario orchestration deterministic", !has(failures, "MULTI_SCENARIO_ORCHESTRATION_NON_DETERMINISTIC") && registry.length === scenarioTypes.length, "MULTI_SCENARIO_ORCHESTRATION_NON_DETERMINISTIC"),
    test("Replay reproduces execution", replay.execution_order_reproduced && replay.execution_outputs_reproduced, "REPLAY_EXECUTION_MISMATCH"),
    test("Replay divergence detected", replay.divergence_detected, "REPLAY_DIVERGENCE_UNDETECTED"),
    test("Scenario lineage complete", lineage_audit.creation_tracked && lineage_audit.replay_tracked, "LINEAGE_INCOMPLETE"),
    test("Immutable audit preserved", lineage_audit.immutable, "AUDIT_MUTABLE"),
    test("Governance enforcement validated", governance.governance_approval && governance.authority_boundaries_validated, "GOVERNANCE_NOT_ENFORCED"),
    test("Advisory-only boundary enforced", governance.advisory_only_constraints, "ADVISORY_BOUNDARY_BREACH"),
    test("Tenant isolation preserved", governance.tenant_isolation, "TENANT_ISOLATION_BREACH"),
    test("Execution integrity verified", governance.execution_integrity && execution.immutable_results, "EXECUTION_INTEGRITY_FAILED"),
    test("Operational monitoring complete", observability.alerts_configured, "OBSERVABILITY_INCOMPLETE"),
    test("Certification evidence immutable", replay.replay_evidence_immutable, "CERTIFICATION_EVIDENCE_MUTABLE"),
  ]);
  const effectiveFailures = freezeArray([...new Set([...failures, ...tests.map((item) => item.failure_reason).filter((failure): failure is SyntheticScenarioFailure => Boolean(failure))])]);
  const outcome = outcomeFor(effectiveFailures);
  const base: Omit<SyntheticScenarioOrchestrationResult, "replay_hash" | "integrity_hash"> = { phase_version: VERSION, phase_identifier: IDENTIFIER, data_generation_ref: data.integrity_hash, contract, registry, composition, schedule, execution, replay, lineage_audit, governance, observability, certification_tests: tests, failures: effectiveFailures, outcome };
  const replay_hash = resultReplayHash(base);
  return Object.freeze({ ...base, replay_hash, integrity_hash: resultIntegrityHash({ ...base, replay_hash }) });
}

export function validateSyntheticScenarioOrchestration(result = runSyntheticScenarioOrchestration()): SyntheticScenarioOrchestrationValidation {
  const contract_valid = verify(result.contract) && result.contract.advisory_only && result.contract.lifecycle.join(">") === lifecycle.join(">") && result.contract.supported_scenario_types.length === 5;
  const registry_valid = result.registry.length === 5 && result.registry.every((scenario) => verify(scenario) && scenario.status === "REPLAYABLE" && scenario.dataset_refs.length > 0 && scenario.identity_refs.length > 0 && scenario.lineage_refs.length > 0) && new Set(result.registry.map((scenario) => scenario.scenario_id)).size === result.registry.length;
  const composition_valid = verify(result.composition) && result.composition.ownership_validated && result.composition.integrity_validated && result.composition.tenant_isolation_preserved && result.composition.deterministic_ordering_preserved && result.composition.reproducible;
  const schedule_valid = verify(result.schedule) && result.schedule.prerequisites_respected && result.schedule.parallel_eligibility_deterministic && result.schedule.dependency_readiness_validated && result.schedule.replay_ordering_preserved && result.schedule.nondeterministic_inputs_rejected;
  const execution_valid = verify(result.execution) && result.execution.scenario_results.every((item) => verify(item) && item.result === "COMPLETED") && result.execution.nominal_executed && result.execution.edge_case_executed && result.execution.adversarial_executed && result.execution.failure_executed && result.execution.recovery_executed && result.execution.deterministic && result.execution.immutable_results;
  const replay_valid = verify(result.replay) && result.replay.execution_order_reproduced && result.replay.environment_state_reproduced && result.replay.identities_reproduced && result.replay.datasets_reproduced && result.replay.scheduling_decisions_reproduced && result.replay.execution_outputs_reproduced && result.replay.divergence_detected && result.replay.replay_evidence_immutable;
  const lineage_valid = verify(result.lineage_audit) && result.lineage_audit.creation_tracked && result.lineage_audit.composition_tracked && result.lineage_audit.scheduling_tracked && result.lineage_audit.execution_tracked && result.lineage_audit.replay_tracked && result.lineage_audit.recovery_tracked && result.lineage_audit.supersession_tracked && result.lineage_audit.immutable;
  const governance_valid = verify(result.governance) && Object.entries(result.governance).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const observability_valid = verify(result.observability) && Object.entries(result.observability).filter(([key]) => !key.endsWith("_id") && key !== "integrity_hash").every(([, value]) => value === true);
  const certification_valid = result.certification_tests.length === 22 && result.certification_tests.every((item) => verify(item) && item.passed);
  const integrityValid = resultReplayHash(result) === result.replay_hash && resultIntegrityHash(result) === result.integrity_hash;
  const valid = result.outcome === "PASS" && integrityValid && contract_valid && registry_valid && composition_valid && schedule_valid && execution_valid && replay_valid && lineage_valid && governance_valid && observability_valid && certification_valid;
  return nested({ valid, outcome: result.outcome, contract_valid, registry_valid, composition_valid, schedule_valid, execution_valid, replay_valid, lineage_valid, governance_valid, observability_valid, certification_valid, failures: result.failures });
}

export function replaySyntheticScenarioOrchestration(result = runSyntheticScenarioOrchestration()): boolean {
  const replayed = runSyntheticScenarioOrchestration();
  return result.replay_hash === replayed.replay_hash && result.integrity_hash === replayed.integrity_hash && validateSyntheticScenarioOrchestration(result).valid;
}

export function getSyntheticScenarioOrchestrationBundle(): SyntheticScenarioOrchestrationBundle {
  const result = runSyntheticScenarioOrchestration();
  return Object.freeze({ doctrine: Object.freeze({ version: VERSION, data_generation_phase: "synthetic-identity-data-generation/v14.3" as const, certification_outcomes: freezeArray(["PASS", "CONDITIONAL_PASS", "FAIL"] as const), supported_scenario_types: scenarioTypes, replay_divergence_categories: divergenceCategories }), result, validation: validateSyntheticScenarioOrchestration(result) });
}

export const SyntheticScenarioOrchestrationService = Object.freeze({ run: runSyntheticScenarioOrchestration, validate: validateSyntheticScenarioOrchestration, replay: replaySyntheticScenarioOrchestration });
