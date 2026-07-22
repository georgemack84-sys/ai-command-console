import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import { createScenarioRegistry, getScenario, validateScenario } from "@/services/scenario-definition-framework";
import type { ScenarioDefinition, ScenarioRegistry, ScenarioScenario, ScenarioType } from "@/types/scenario-definition-framework";
import type {
  InjectionEvent,
  InjectionGraph,
  InjectionMode,
  InjectionTarget,
  StressInjectionContract,
  StressInjectionFailure,
  StressInjectionInput,
  StressInjectionLedger,
  StressInjectionObservabilitySurface,
  StressInjectionReplayResult,
  StressInjectionScenario,
  StressInjectionValidationResult,
} from "@/types/stress-injection-engine";

const VERSION = "stress-injection-engine/v8ALT.6.2" as const;
const NOW = "2026-07-13T14:00:00.000Z";
const TENANT_ID = "tenant:autonomy:primary";
const targets = Object.freeze(["PLANNING_ENGINE", "EXECUTION_ORCHESTRATOR", "DELEGATION_INTELLIGENCE", "RUNTIME_SUPERVISION", "GOVERNANCE_ENGINE", "CONSTITUTION_ENGINE", "REPLAY_ENGINE", "TRUTH_LEDGER", "MISSION_HEALTH_INTELLIGENCE", "INTEGRITY_ENGINE", "AUTHORITY_VALIDATION", "EXTERNAL_SERVICES", "INFRASTRUCTURE_RESOURCES"] as const);
const modes = Object.freeze(["SEQUENTIAL", "PARALLEL", "RANDOMIZED_DETERMINISTIC_SEED", "ESCALATING", "RECURSIVE", "COMPOUND", "PROGRESSIVE", "MISSION_WIDE", "CROSS_SUBSYSTEM"] as const);
const schedulingModes = Object.freeze(["IMMEDIATE", "SCHEDULED_OFFSET", "CHECKPOINT_TRIGGERED", "DEPENDENCY_TRIGGERED", "TIME_WINDOW", "CONDITIONAL_TRIGGER", "MISSION_PHASE_TRIGGER"] as const);
const timingModes = Object.freeze(["FIXED_TIME", "RELATIVE_OFFSET", "CHECKPOINT_BASED", "EXECUTION_STEP", "MISSION_PHASE", "ADAPTIVE_REPLAY_TIMING"] as const);

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function failuresFor(scenario: StressInjectionScenario): readonly StressInjectionFailure[] {
  const map: Partial<Record<StressInjectionScenario, StressInjectionFailure>> = {
    MISSING_SCENARIO: "SCENARIO_MISSING",
    UNCERTIFIED_SCENARIO: "SCENARIO_NOT_CERTIFIED",
    NONDETERMINISTIC_ORDERING: "EVENT_ORDERING_NONDETERMINISTIC",
    MISSING_DETERMINISTIC_SEED: "DETERMINISTIC_SEED_MISSING",
    REPLAY_SYNC_FAILURE: "REPLAY_SYNCHRONIZATION_FAILED",
    GOVERNANCE_BYPASS: "GOVERNANCE_BYPASS_ATTEMPTED",
    CONSTITUTION_BYPASS: "CONSTITUTION_BYPASS_ATTEMPTED",
    AUTHORITY_ELEVATION: "AUTHORITY_ELEVATION_ATTEMPTED",
    POLICY_MODIFICATION: "POLICY_MODIFICATION_ATTEMPTED",
    REPLAY_MUTATION: "REPLAY_HISTORY_MUTATION_ATTEMPTED",
    TRUTH_LEDGER_MUTATION: "TRUTH_LEDGER_MUTATION_ATTEMPTED",
    CROSS_TENANT_INJECTION: "CROSS_TENANT_INJECTION_DETECTED",
    HIDDEN_INJECTED_FAILURE: "HIDDEN_INJECTED_FAILURE_DETECTED",
    INCOMPLETE_EVIDENCE: "EVIDENCE_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_VERIFICATION_FAILED",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function frameworkScenarioFor(failures: readonly StressInjectionFailure[]): ScenarioScenario {
  if (failures.includes("SCENARIO_NOT_CERTIFIED")) return "INTEGRITY_FAILURE";
  if (failures.includes("DETERMINISTIC_SEED_MISSING")) return "MISSING_SEED";
  if (failures.includes("AUTHORITY_ELEVATION_ATTEMPTED")) return "AUTHORITY_ESCALATION";
  if (failures.includes("POLICY_MODIFICATION_ATTEMPTED")) return "POLICY_MODIFICATION";
  if (failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED")) return "REPLAY_MUTATION";
  if (failures.includes("CROSS_TENANT_INJECTION_DETECTED")) return "CROSS_TENANT_SCENARIO";
  if (failures.includes("INTEGRITY_VERIFICATION_FAILED")) return "INTEGRITY_FAILURE";
  return "BASELINE";
}

function source(input: StressInjectionInput, failures: readonly StressInjectionFailure[]): { registry: ScenarioRegistry; scenario: ScenarioDefinition | null } {
  const registry = input.scenario_registry ?? createScenarioRegistry({ tenant_id: input.tenant_id, mission_scope: input.mission_id, scenario: input.scenario_framework_scenario ?? frameworkScenarioFor(failures) });
  const scenario = failures.includes("SCENARIO_MISSING") ? null : input.scenario_definition ?? getScenario(registry);
  return { registry, scenario };
}

function eventHash(event: Omit<InjectionEvent, "integrity_hash"> | InjectionEvent): string {
  const { integrity_hash: _hash, ...sourceEvent } = event as InjectionEvent;
  return hashValue("stress-injection-event", sourceEvent);
}

function targetFor(type: ScenarioType, index: number): InjectionTarget {
  const map: Record<ScenarioType, InjectionTarget[]> = {
    HARDWARE_FAILURE: ["INFRASTRUCTURE_RESOURCES", "PLANNING_ENGINE", "MISSION_HEALTH_INTELLIGENCE"],
    POLICY_CONFLICT: ["GOVERNANCE_ENGINE", "EXECUTION_ORCHESTRATOR", "RUNTIME_SUPERVISION"],
    AUTHORITY_CONFLICT: ["AUTHORITY_VALIDATION", "DELEGATION_INTELLIGENCE", "GOVERNANCE_ENGINE"],
    REPLAY_CORRUPTION: ["REPLAY_ENGINE", "INTEGRITY_ENGINE", "TRUTH_LEDGER"],
    TENANT_ISOLATION_FAILURE: ["EXTERNAL_SERVICES", "REPLAY_ENGINE", "GOVERNANCE_ENGINE"],
    SERVICE_UNAVAILABILITY: ["EXTERNAL_SERVICES", "EXECUTION_ORCHESTRATOR", "PLANNING_ENGINE"],
    MALICIOUS_INPUTS: ["AUTHORITY_VALIDATION", "GOVERNANCE_ENGINE", "INTEGRITY_ENGINE"],
    CASCADING_FAILURES: ["INFRASTRUCTURE_RESOURCES", "PLANNING_ENGINE", "GOVERNANCE_ENGINE"],
  };
  return map[type][index % map[type].length];
}

function event(scenario: ScenarioDefinition, simulationId: string, position: number, mode: InjectionMode, failures: readonly StressInjectionFailure[]): InjectionEvent {
  const target = targetFor(scenario.scenario_type, position - 1);
  const timestamp = `2026-07-13T14:${String(position).padStart(2, "0")}:00.000Z`;
  const seed = failures.includes("DETERMINISTIC_SEED_MISSING") ? "" : `${scenario.deterministic_seed}:${position}`;
  const base = {
    injection_id: id("SIE", "stress-injection-event", { scenario: scenario.scenario_id, position, mode }),
    scenario_id: scenario.scenario_id,
    simulation_id: simulationId,
    mission_id: scenario.mission_scope,
    tenant_id: failures.includes("CROSS_TENANT_INJECTION_DETECTED") ? "external-tenant" : scenario.tenant_id,
    failure_type: scenario.scenario_type,
    target_component: target,
    injection_mode: mode,
    scheduling_mode: position === 1 ? "IMMEDIATE" as const : "SCHEDULED_OFFSET" as const,
    timing_mode: position === 1 ? "FIXED_TIME" as const : "RELATIVE_OFFSET" as const,
    severity: position >= 3 ? "CRITICAL" as const : scenario.failure_profile?.severity ?? "HIGH" as const,
    deterministic_seed: seed,
    sequence_position: failures.includes("EVENT_ORDERING_NONDETERMINISTIC") ? 99 - position : position,
    execution_timestamp: timestamp,
    governance_validation: failures.includes("GOVERNANCE_BYPASS_ATTEMPTED") || failures.includes("POLICY_MODIFICATION_ATTEMPTED") ? "FAILED" as const : "VALIDATED" as const,
    constitutional_validation: failures.includes("CONSTITUTION_BYPASS_ATTEMPTED") ? "FAILED" as const : "VALIDATED" as const,
    authority_validation: failures.includes("AUTHORITY_ELEVATION_ATTEMPTED") ? "FAILED" as const : "VALIDATED" as const,
    replay_reference: failures.includes("REPLAY_SYNCHRONIZATION_FAILED") || failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED") ? "" : `replay:stress-injection:${simulationId}:${position}`,
    lineage_reference: `lineage:stress-injection:${simulationId}:${position}`,
    evidence_reference: failures.includes("EVIDENCE_INCOMPLETE") ? "" : `evidence:stress-injection:${simulationId}:${position}`,
    expected_behavior: scenario.expected_behavior,
    observed_behavior: "simulated failure recorded; no production action executed",
    operator_visible: !failures.includes("HIDDEN_INJECTED_FAILURE_DETECTED"),
    production_modified: false,
    autonomous_action_executed: false,
    policy_modified: failures.includes("POLICY_MODIFICATION_ATTEMPTED"),
    replay_history_modified: failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED"),
    truth_ledger_modified: failures.includes("TRUTH_LEDGER_MUTATION_ATTEMPTED"),
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") && position === 1 ? "" : eventHash(base as Omit<InjectionEvent, "integrity_hash">) });
}

function eventCount(mode: InjectionMode, type: ScenarioType): number {
  if (mode === "PARALLEL" || mode === "COMPOUND") return 3;
  if (mode === "PROGRESSIVE" || mode === "MISSION_WIDE" || type === "CASCADING_FAILURES") return 5;
  if (mode === "RECURSIVE") return 4;
  return 3;
}

function buildEvents(scenario: ScenarioDefinition | null, mode: InjectionMode, failures: readonly StressInjectionFailure[], simulationId: string): readonly InjectionEvent[] {
  if (!scenario) return freezeArray([]);
  const count = eventCount(mode, scenario.scenario_type);
  const events = Array.from({ length: count }, (_, index) => event(scenario, simulationId, index + 1, mode, failures));
  if (failures.includes("EVENT_ORDERING_NONDETERMINISTIC")) return freezeArray(events);
  return freezeArray(events.sort((a, b) => a.sequence_position - b.sequence_position || a.injection_id.localeCompare(b.injection_id)));
}

function graphHash(graph: Omit<InjectionGraph, "graph_hash"> | InjectionGraph): string {
  const { graph_hash: _hash, ...sourceGraph } = graph as InjectionGraph;
  return hashValue("stress-injection-graph", sourceGraph);
}

function graph(type: InjectionGraph["graph_type"], events: readonly InjectionEvent[]): InjectionGraph {
  const nodes = events.map((item) => `${item.target_component}:${item.sequence_position}`);
  const edges = events.slice(1).map((item, index) => `${events[index].injection_id}->${item.injection_id}`);
  const base = { graph_id: id("SIG", "stress-injection-graph", { type, nodes }), graph_type: type, nodes: freezeArray(nodes), edges: freezeArray(edges) };
  return Object.freeze({ ...base, graph_hash: graphHash(base) });
}

function ledgerHash(ledger: Omit<StressInjectionLedger, "ledger_hash"> | StressInjectionLedger): string {
  const { ledger_hash: _hash, ...sourceLedger } = ledger as StressInjectionLedger;
  return hashValue("stress-injection-ledger", sourceLedger);
}

export function runStressInjection(input: StressInjectionInput = {}): StressInjectionLedger {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const { registry, scenario } = source(input, failures);
  const simulationId = id("SIM", "stress-injection-simulation", { scenario: scenario?.scenario_id ?? "missing", mode: input.injection_mode ?? "SEQUENTIAL" });
  const mode = input.injection_mode ?? (scenario?.scenario_type === "CASCADING_FAILURES" ? "PROGRESSIVE" : "SEQUENTIAL");
  const events = buildEvents(scenario, mode, failures, simulationId);
  const base = {
    ledger_id: id("SIL", "stress-injection-ledger", { simulationId, scenario: input.scenario ?? "BASELINE" }),
    engine_version: VERSION,
    tenant_id: failures.includes("CROSS_TENANT_INJECTION_DETECTED") ? "external-tenant" : input.tenant_id ?? registry.tenant_id,
    mission_id: input.mission_id ?? registry.mission_scope,
    simulation_id: simulationId,
    scenario,
    source_registry: registry,
    events,
    failure_timeline: freezeArray(events.map((item) => `${item.execution_timestamp}|${item.sequence_position}|${item.target_component}|${item.failure_type}`)),
    simulation_log: freezeArray(events.map((item) => `${item.injection_id}: ${item.observed_behavior}`)),
    replay_markers: freezeArray(events.map((item) => item.replay_reference).filter(Boolean)),
    dependency_graphs: freezeArray([graph("DEPENDENCY_FAILURE", events), graph("CASCADE_TIMELINE", events), graph("AFFECTED_SUBSYSTEM", events), graph("DEPENDENCY_RECOVERY", events)]),
    simulation_only: true as const,
    append_only: true as const,
    replay_reference: failures.includes("REPLAY_SYNCHRONIZATION_FAILED") ? "" : `replay:stress-injection-ledger:${simulationId}`,
    lineage_reference: `lineage:stress-injection-ledger:${simulationId}`,
  };
  return Object.freeze({ ...base, ledger_hash: failures.includes("INTEGRITY_VERIFICATION_FAILED") ? "" : ledgerHash(base as Omit<StressInjectionLedger, "ledger_hash">) });
}

export function scheduleStressEvents(input: StressInjectionInput = {}): readonly InjectionEvent[] { return runStressInjection(input).events; }
export function sequenceFaults(input: StressInjectionInput = {}): readonly string[] { return runStressInjection(input).failure_timeline; }
export function buildDependencyInjectionGraphs(input: StressInjectionInput = {}): readonly InjectionGraph[] { return runStressInjection(input).dependency_graphs; }

export function validateStressInjection(ledger = runStressInjection()): StressInjectionValidationResult {
  const scenarioValidation = ledger.scenario ? validateScenario(ledger.scenario, ledger.source_registry) : null;
  const deterministic_ordering = ledger.events.map((item) => item.sequence_position).join("|") === [...ledger.events.map((item) => item.sequence_position)].sort((a, b) => a - b).join("|");
  const deterministic_seed_present = ledger.events.every((item) => item.deterministic_seed);
  const replay_synchronized = Boolean(ledger.replay_reference) && ledger.events.every((item) => item.replay_reference) && ledger.replay_markers.length === ledger.events.length;
  const governance_enforced = ledger.events.every((item) => item.governance_validation === "VALIDATED" && !item.policy_modified);
  const constitutional_enforced = ledger.events.every((item) => item.constitutional_validation === "VALIDATED");
  const authority_enforced = ledger.events.every((item) => item.authority_validation === "VALIDATED");
  const tenant_isolated = ledger.tenant_id.startsWith("tenant:") && ledger.events.every((item) => item.tenant_id === ledger.tenant_id);
  const integrity_valid = Boolean(ledger.ledger_hash) && ledgerHash(ledger) === ledger.ledger_hash && ledger.events.every((item) => Boolean(item.integrity_hash) && eventHash(item) === item.integrity_hash);
  const evidence_complete = ledger.events.every((item) => item.evidence_reference);
  const operator_visible = ledger.events.every((item) => item.operator_visible);
  const simulation_only_enforced = ledger.simulation_only && ledger.events.every((item) => !item.production_modified && !item.autonomous_action_executed && !item.truth_ledger_modified && !item.replay_history_modified);
  const scenario_valid = Boolean(ledger.scenario && scenarioValidation?.valid);
  const failures = unique([
    ...(!ledger.scenario ? ["SCENARIO_MISSING" as const] : []),
    ...(!scenario_valid ? ["SCENARIO_NOT_CERTIFIED" as const] : []),
    ...(!deterministic_ordering ? ["EVENT_ORDERING_NONDETERMINISTIC" as const] : []),
    ...(!deterministic_seed_present ? ["DETERMINISTIC_SEED_MISSING" as const] : []),
    ...(!replay_synchronized ? ["REPLAY_SYNCHRONIZATION_FAILED" as const] : []),
    ...(!governance_enforced ? [ledger.events.some((item) => item.policy_modified) ? "POLICY_MODIFICATION_ATTEMPTED" as const : "GOVERNANCE_BYPASS_ATTEMPTED" as const] : []),
    ...(!constitutional_enforced ? ["CONSTITUTION_BYPASS_ATTEMPTED" as const] : []),
    ...(!authority_enforced ? ["AUTHORITY_ELEVATION_ATTEMPTED" as const] : []),
    ...(!tenant_isolated ? ["CROSS_TENANT_INJECTION_DETECTED" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_VERIFICATION_FAILED" as const] : []),
    ...(!evidence_complete ? ["EVIDENCE_INCOMPLETE" as const] : []),
    ...(!operator_visible ? ["HIDDEN_INJECTED_FAILURE_DETECTED" as const] : []),
    ...(!simulation_only_enforced ? [ledger.events.some((item) => item.truth_ledger_modified) ? "TRUTH_LEDGER_MUTATION_ATTEMPTED" as const : ledger.events.some((item) => item.replay_history_modified) ? "REPLAY_HISTORY_MUTATION_ATTEMPTED" as const : "SIMULATION_ONLY_VIOLATION" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { ledger_id: ledger.ledger_id, valid, scenario_valid, deterministic_ordering, deterministic_seed_present, replay_synchronized, governance_enforced, constitutional_enforced, authority_enforced, tenant_isolated, integrity_valid, evidence_complete, operator_visible, simulation_only_enforced, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("stress-injection-validation", source) });
}

export function replayStressInjection(ledger = runStressInjection()): StressInjectionReplayResult {
  const reconstructed_hash = ledgerHash(ledger);
  const source = { replay_reference: ledger.replay_reference, ledger_id: ledger.ledger_id, deterministic: Boolean(ledger.replay_reference) && reconstructed_hash === ledger.ledger_hash, reconstructed_hash, original_hash: ledger.ledger_hash, event_count: ledger.events.length };
  return Object.freeze({ ...source, replay_result_hash: hashValue("stress-injection-replay", source) });
}

export function buildStressInjectionObservabilitySurface(ledger = runStressInjection()): StressInjectionObservabilitySurface {
  return Object.freeze({ ledger_id: ledger.ledger_id, tenant_id: ledger.tenant_id, mission_id: ledger.mission_id, event_count: ledger.events.length, injection_modes: freezeArray([...new Set(ledger.events.map((item) => item.injection_mode))]), target_components: freezeArray([...new Set(ledger.events.map((item) => item.target_component))]), simulation_only: true, ledger_hash: ledger.ledger_hash });
}

export function getStressInjectionContract(): StressInjectionContract {
  const ledger = runStressInjection();
  return Object.freeze({
    doctrine: Object.freeze({
      engine_version: VERSION,
      principles: freezeArray(["deterministic-fault-orchestration", "simulation-only-injection", "replay-synchronized-failures", "governance-supremacy", "constitutional-enforcement", "authority-boundaries", "operator-visible-faults", "tenant-isolation", "immutable-injection-ledger", "certification-ready-replay"]),
      injection_targets: targets,
      injection_modes: modes,
      scheduling_modes: schedulingModes,
      timing_modes: timingModes,
      simulation_only: true,
    }),
    ledger,
    validation: validateStressInjection(ledger),
    replay: replayStressInjection(ledger),
    observability: buildStressInjectionObservabilitySurface(ledger),
  });
}
