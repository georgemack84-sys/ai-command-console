export type ScenarioType = "HARDWARE_FAILURE" | "POLICY_CONFLICT" | "AUTHORITY_CONFLICT" | "REPLAY_CORRUPTION" | "TENANT_ISOLATION_FAILURE" | "SERVICE_UNAVAILABILITY" | "MALICIOUS_INPUTS" | "CASCADING_FAILURES";
export type SimulationMode = "NORMAL" | "ACCELERATED" | "SLOW_MOTION" | "STEP_EXECUTION" | "CHAOS_REPLAY" | "FAILURE_CHAIN" | "CERTIFICATION";
export type FailureSeverity = "LOW" | "MODERATE" | "HIGH" | "SEVERE" | "CRITICAL" | "CATASTROPHIC";
export type ScenarioValidationState = "DRAFT" | "VALIDATED" | "CERTIFIED" | "EXECUTABLE" | "ARCHIVED" | "REJECTED";
export type ScenarioScenario = "BASELINE" | "MISSING_SEED" | "MISSING_FAILURE_PROFILE" | "AUTHORITY_ESCALATION" | "POLICY_MODIFICATION" | "CONSTITUTION_MODIFICATION" | "REPLAY_MUTATION" | "CROSS_TENANT_SCENARIO" | "FORGED_EVIDENCE" | "INCOMPLETE_EXPECTED_RECOVERY" | "INTEGRITY_FAILURE";
export type ScenarioFailure = "SCENARIO_CONTRACT_INCOMPLETE" | "SCENARIO_ID_NOT_UNIQUE" | "CONFIGURATION_NONDETERMINISTIC" | "SIMULATION_SEED_MISSING" | "REPLAY_COMPATIBILITY_INVALID" | "GOVERNANCE_CONSTRAINTS_MISSING" | "AUTHORITY_CONSTRAINTS_INVALID" | "ENVIRONMENT_PROFILE_INVALID" | "FAILURE_PROFILE_MISSING" | "EXPECTED_OUTCOMES_INCOMPLETE" | "RECOVERY_EXPECTATIONS_INCOMPLETE" | "REPLAY_REFERENCE_MISSING" | "INTEGRITY_HASH_INVALID" | "TENANT_ISOLATION_INVALID" | "CERTIFICATION_METADATA_MISSING" | "GOVERNANCE_BYPASS_ATTEMPTED" | "CONSTITUTION_BYPASS_ATTEMPTED" | "AUTHORITY_ELEVATION_ATTEMPTED" | "POLICY_MODIFICATION_ATTEMPTED" | "CONSTITUTION_MODIFICATION_ATTEMPTED" | "REPLAY_HISTORY_MUTATION_ATTEMPTED" | "FORGED_EVIDENCE_DETECTED";

export type FailureProfile = Readonly<{
  failure_profile_id: string;
  failure_type: ScenarioType;
  severity: FailureSeverity;
  affected_components: readonly string[];
  trigger_condition: string;
  expected_behavior: string;
  expected_recovery: readonly string[];
  maximum_duration: string;
  rollback_available: boolean;
  operator_required: boolean;
  replay_supported: boolean;
  profile_version: "failure-profile/v8ALT.6.1";
  integrity_hash: string;
}>;

export type ScenarioTemplate = Readonly<{
  template_id: string;
  template_name: string;
  scenario_type: ScenarioType;
  template_version: "scenario-template/v8ALT.6.1";
  supported_conditions: readonly string[];
  reusable: true;
  governance_aware: true;
  integrity_hash: string;
}>;

export type SimulationConfiguration = Readonly<{
  simulation_mode: SimulationMode;
  execution_speed: string;
  failure_start: string;
  failure_duration: string;
  failure_probability: number;
  parallel_events: number;
  environment_profile: string;
  governance_mode: string;
  authority_validation: string;
  replay_enabled: boolean;
  logging_level: string;
  deterministic_seed: string;
}>;

export type ScenarioDefinition = Readonly<{
  scenario_id: string;
  scenario_name: string;
  scenario_version: "scenario/v8ALT.6.1";
  scenario_type: ScenarioType;
  description: string;
  mission_scope: string;
  tenant_id: string;
  simulation_mode: SimulationMode;
  failure_profile: FailureProfile | null;
  environment_profile: readonly string[];
  governance_profile: readonly string[];
  authority_requirements: readonly string[];
  constitutional_requirements: readonly string[];
  simulation_seed: string;
  deterministic_seed: string;
  configuration: SimulationConfiguration;
  expected_behavior: string;
  expected_failures: readonly string[];
  expected_recovery: readonly string[];
  replay_reference: string;
  lineage_reference: string;
  created_by: string;
  creation_timestamp: string;
  validation_state: ScenarioValidationState;
  certification_status: "CERTIFICATION_READY" | "BLOCKED";
  immutable: true;
  governance_bypass_attempted: boolean;
  constitution_bypass_attempted: boolean;
  authority_elevation_attempted: boolean;
  policy_modification_attempted: boolean;
  constitution_modification_attempted: boolean;
  replay_history_mutation_attempted: boolean;
  forged_evidence_detected: boolean;
  integrity_hash: string;
  scenario_hash: string;
}>;

export type ScenarioRegistry = Readonly<{
  registry_id: string;
  tenant_id: string;
  mission_scope: string;
  scenarios: readonly ScenarioDefinition[];
  templates: readonly ScenarioTemplate[];
  failure_profiles: readonly FailureProfile[];
  append_only: true;
  replay_compatible: true;
  registry_hash: string;
}>;

export type ScenarioDefinitionInput = Readonly<{
  scenario?: ScenarioScenario;
  tenant_id?: string;
  mission_scope?: string;
  scenario_type?: ScenarioType;
}>;

export type ScenarioSearchCriteria = Readonly<{
  scenario_id?: string;
  scenario_type?: ScenarioType;
  tenant_id?: string;
  simulation_mode?: SimulationMode;
  validation_state?: ScenarioValidationState;
  replay_reference?: string;
}>;

export type ScenarioValidationResult = Readonly<{
  scenario_id: string | null;
  valid: boolean;
  contract_complete: boolean;
  identity_unique: boolean;
  configuration_deterministic: boolean;
  seeds_fixed: boolean;
  replay_compatible: boolean;
  governance_valid: boolean;
  authority_valid: boolean;
  constitutional_valid: boolean;
  environment_valid: boolean;
  failure_profile_registered: boolean;
  expected_outcomes_defined: boolean;
  recovery_defined: boolean;
  tenant_isolated: boolean;
  integrity_valid: boolean;
  certification_metadata_present: boolean;
  failures: readonly ScenarioFailure[];
  validation_hash: string;
}>;

export type ScenarioReplayResult = Readonly<{
  replay_reference: string;
  scenario_id: string;
  deterministic: boolean;
  reconstructed_hash: string;
  original_hash: string;
  replay_result_hash: string;
}>;

export type ScenarioObservabilitySurface = Readonly<{
  registry_id: string;
  tenant_id: string;
  scenario_count: number;
  template_count: number;
  failure_profile_count: number;
  scenario_types: readonly ScenarioType[];
  append_only: true;
  registry_hash: string;
}>;

export type ScenarioDefinitionContract = Readonly<{
  doctrine: Readonly<{
    framework_version: "scenario-definition-framework/v8ALT.6.1";
    principles: readonly string[];
    scenario_types: readonly ScenarioType[];
    simulation_modes: readonly SimulationMode[];
    severity_levels: readonly FailureSeverity[];
    validation_states: readonly ScenarioValidationState[];
    registry_append_only: true;
  }>;
  registry: ScenarioRegistry;
  validation: ScenarioValidationResult;
  replay: ScenarioReplayResult;
  observability: ScenarioObservabilitySurface;
}>;
