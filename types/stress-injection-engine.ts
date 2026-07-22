import type { ScenarioDefinition, ScenarioRegistry, ScenarioScenario, ScenarioType, FailureSeverity } from "@/types/scenario-definition-framework";

export type InjectionTarget = "PLANNING_ENGINE" | "EXECUTION_ORCHESTRATOR" | "DELEGATION_INTELLIGENCE" | "RUNTIME_SUPERVISION" | "GOVERNANCE_ENGINE" | "CONSTITUTION_ENGINE" | "REPLAY_ENGINE" | "TRUTH_LEDGER" | "MISSION_HEALTH_INTELLIGENCE" | "INTEGRITY_ENGINE" | "AUTHORITY_VALIDATION" | "EXTERNAL_SERVICES" | "INFRASTRUCTURE_RESOURCES";
export type InjectionMode = "SEQUENTIAL" | "PARALLEL" | "RANDOMIZED_DETERMINISTIC_SEED" | "ESCALATING" | "RECURSIVE" | "COMPOUND" | "PROGRESSIVE" | "MISSION_WIDE" | "CROSS_SUBSYSTEM";
export type SchedulingMode = "IMMEDIATE" | "SCHEDULED_OFFSET" | "CHECKPOINT_TRIGGERED" | "DEPENDENCY_TRIGGERED" | "TIME_WINDOW" | "CONDITIONAL_TRIGGER" | "MISSION_PHASE_TRIGGER";
export type TimingMode = "FIXED_TIME" | "RELATIVE_OFFSET" | "CHECKPOINT_BASED" | "EXECUTION_STEP" | "MISSION_PHASE" | "ADAPTIVE_REPLAY_TIMING";
export type DependencyFailureBehavior = "dependency unavailable" | "dependency delayed" | "dependency corrupted" | "dependency timeout" | "dependency degraded" | "dependency removed" | "dependency reordered" | "dependency deadlock";
export type StressInjectionScenario = "BASELINE" | "MISSING_SCENARIO" | "UNCERTIFIED_SCENARIO" | "NONDETERMINISTIC_ORDERING" | "MISSING_DETERMINISTIC_SEED" | "REPLAY_SYNC_FAILURE" | "GOVERNANCE_BYPASS" | "CONSTITUTION_BYPASS" | "AUTHORITY_ELEVATION" | "POLICY_MODIFICATION" | "REPLAY_MUTATION" | "TRUTH_LEDGER_MUTATION" | "CROSS_TENANT_INJECTION" | "HIDDEN_INJECTED_FAILURE" | "INCOMPLETE_EVIDENCE" | "INTEGRITY_FAILURE";
export type StressInjectionFailure = "SCENARIO_MISSING" | "SCENARIO_NOT_CERTIFIED" | "EVENT_ORDERING_NONDETERMINISTIC" | "DETERMINISTIC_SEED_MISSING" | "REPLAY_SYNCHRONIZATION_FAILED" | "GOVERNANCE_BYPASS_ATTEMPTED" | "CONSTITUTION_BYPASS_ATTEMPTED" | "AUTHORITY_ELEVATION_ATTEMPTED" | "POLICY_MODIFICATION_ATTEMPTED" | "REPLAY_HISTORY_MUTATION_ATTEMPTED" | "TRUTH_LEDGER_MUTATION_ATTEMPTED" | "CROSS_TENANT_INJECTION_DETECTED" | "HIDDEN_INJECTED_FAILURE_DETECTED" | "EVIDENCE_INCOMPLETE" | "INTEGRITY_VERIFICATION_FAILED" | "SIMULATION_ONLY_VIOLATION";

export type InjectionEvent = Readonly<{
  injection_id: string;
  scenario_id: string;
  simulation_id: string;
  mission_id: string;
  tenant_id: string;
  failure_type: ScenarioType;
  target_component: InjectionTarget;
  injection_mode: InjectionMode;
  scheduling_mode: SchedulingMode;
  timing_mode: TimingMode;
  severity: FailureSeverity;
  deterministic_seed: string;
  sequence_position: number;
  execution_timestamp: string;
  governance_validation: "VALIDATED" | "FAILED";
  constitutional_validation: "VALIDATED" | "FAILED";
  authority_validation: "VALIDATED" | "FAILED";
  replay_reference: string;
  lineage_reference: string;
  evidence_reference: string;
  expected_behavior: string;
  observed_behavior: string;
  operator_visible: boolean;
  production_modified: boolean;
  autonomous_action_executed: boolean;
  policy_modified: boolean;
  replay_history_modified: boolean;
  truth_ledger_modified: boolean;
  integrity_hash: string;
}>;

export type InjectionGraph = Readonly<{
  graph_id: string;
  graph_type: "DEPENDENCY_FAILURE" | "CASCADE_TIMELINE" | "AFFECTED_SUBSYSTEM" | "DEPENDENCY_RECOVERY";
  nodes: readonly string[];
  edges: readonly string[];
  graph_hash: string;
}>;

export type StressInjectionLedger = Readonly<{
  ledger_id: string;
  engine_version: "stress-injection-engine/v8ALT.6.2";
  tenant_id: string;
  mission_id: string;
  simulation_id: string;
  scenario: ScenarioDefinition | null;
  source_registry: ScenarioRegistry;
  events: readonly InjectionEvent[];
  failure_timeline: readonly string[];
  simulation_log: readonly string[];
  replay_markers: readonly string[];
  dependency_graphs: readonly InjectionGraph[];
  simulation_only: true;
  append_only: true;
  replay_reference: string;
  lineage_reference: string;
  ledger_hash: string;
}>;

export type StressInjectionInput = Readonly<{
  scenario?: StressInjectionScenario;
  tenant_id?: string;
  mission_id?: string;
  scenario_definition?: ScenarioDefinition;
  scenario_registry?: ScenarioRegistry;
  scenario_framework_scenario?: ScenarioScenario;
  injection_mode?: InjectionMode;
}>;

export type StressInjectionValidationResult = Readonly<{
  ledger_id: string | null;
  valid: boolean;
  scenario_valid: boolean;
  deterministic_ordering: boolean;
  deterministic_seed_present: boolean;
  replay_synchronized: boolean;
  governance_enforced: boolean;
  constitutional_enforced: boolean;
  authority_enforced: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  evidence_complete: boolean;
  operator_visible: boolean;
  simulation_only_enforced: boolean;
  failures: readonly StressInjectionFailure[];
  validation_hash: string;
}>;

export type StressInjectionReplayResult = Readonly<{
  replay_reference: string;
  ledger_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  event_count: number;
  replay_result_hash: string;
}>;

export type StressInjectionObservabilitySurface = Readonly<{
  ledger_id: string;
  tenant_id: string;
  mission_id: string;
  event_count: number;
  injection_modes: readonly InjectionMode[];
  target_components: readonly InjectionTarget[];
  simulation_only: true;
  ledger_hash: string;
}>;

export type StressInjectionContract = Readonly<{
  doctrine: Readonly<{
    engine_version: "stress-injection-engine/v8ALT.6.2";
    principles: readonly string[];
    injection_targets: readonly InjectionTarget[];
    injection_modes: readonly InjectionMode[];
    scheduling_modes: readonly SchedulingMode[];
    timing_modes: readonly TimingMode[];
    simulation_only: true;
  }>;
  ledger: StressInjectionLedger;
  validation: StressInjectionValidationResult;
  replay: StressInjectionReplayResult;
  observability: StressInjectionObservabilitySurface;
}>;
