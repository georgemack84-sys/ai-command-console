import { canonicalizeConfidenceToString } from "@/services/confidence-engine/confidenceCanonicalizer";
import { hashConfidenceValue } from "@/services/confidence-engine/confidenceHashEngine";
import type {
  FailureProfile,
  ScenarioDefinition,
  ScenarioDefinitionContract,
  ScenarioDefinitionInput,
  ScenarioFailure,
  ScenarioObservabilitySurface,
  ScenarioRegistry,
  ScenarioReplayResult,
  ScenarioScenario,
  ScenarioSearchCriteria,
  ScenarioTemplate,
  ScenarioType,
  ScenarioValidationResult,
} from "@/types/scenario-definition-framework";

const NOW = "2026-07-13T13:00:00.000Z";
const VERSION = "scenario-definition-framework/v8ALT.6.1" as const;
const SCENARIO_VERSION = "scenario/v8ALT.6.1" as const;
const TEMPLATE_VERSION = "scenario-template/v8ALT.6.1" as const;
const PROFILE_VERSION = "failure-profile/v8ALT.6.1" as const;
const TENANT_ID = "tenant:autonomy:primary";
const scenarioTypes = Object.freeze(["HARDWARE_FAILURE", "POLICY_CONFLICT", "AUTHORITY_CONFLICT", "REPLAY_CORRUPTION", "TENANT_ISOLATION_FAILURE", "SERVICE_UNAVAILABILITY", "MALICIOUS_INPUTS", "CASCADING_FAILURES"] as const);
const simulationModes = Object.freeze(["NORMAL", "ACCELERATED", "SLOW_MOTION", "STEP_EXECUTION", "CHAOS_REPLAY", "FAILURE_CHAIN", "CERTIFICATION"] as const);
const severities = Object.freeze(["LOW", "MODERATE", "HIGH", "SEVERE", "CRITICAL", "CATASTROPHIC"] as const);
const validationStates = Object.freeze(["DRAFT", "VALIDATED", "CERTIFIED", "EXECUTABLE", "ARCHIVED", "REJECTED"] as const);
const conditions: Record<ScenarioType, readonly string[]> = {
  HARDWARE_FAILURE: ["CPU degradation", "memory exhaustion", "storage corruption", "disk failure", "node shutdown", "network isolation", "hardware latency", "storage saturation"],
  POLICY_CONFLICT: ["conflicting governance rules", "overlapping compliance policies", "contradictory regulations", "policy precedence disputes", "governance race conditions"],
  AUTHORITY_CONFLICT: ["competing operators", "simultaneous approvals", "delegation conflict", "authority escalation", "invalid authorization chain", "privilege overlap"],
  REPLAY_CORRUPTION: ["missing replay event", "hash corruption", "event deletion", "timeline discontinuity", "checkpoint corruption", "ordering mismatch"],
  TENANT_ISOLATION_FAILURE: ["cross-tenant request", "tenant identifier corruption", "shared runtime memory", "shared replay", "identity collision"],
  SERVICE_UNAVAILABILITY: ["planner offline", "orchestration unavailable", "replay unavailable", "governance unavailable", "database unavailable", "runtime unavailable"],
  MALICIOUS_INPUTS: ["forged execution request", "authority spoofing", "malformed execution plan", "replay manipulation", "invalid governance evidence", "corrupted payload", "fake policy reference"],
  CASCADING_FAILURES: ["chained service failures", "dependency collapse", "governance cascade", "replay cascade", "execution cascade", "mission-wide degradation"],
};

function hashValue(domain: string, value: unknown): string { return hashConfidenceValue(domain, canonicalizeConfidenceToString(value)); }
function freezeArray<T>(values: readonly T[]): readonly T[] { return Object.freeze([...values]); }
function unique<T extends string>(values: readonly T[]): readonly T[] { return freezeArray([...new Set(values)].sort()); }
function id(prefix: string, domain: string, value: unknown): string { return `${prefix}-${hashValue(domain, value).slice(0, 12).toUpperCase()}`; }

function failuresFor(scenario: ScenarioScenario): readonly ScenarioFailure[] {
  const map: Partial<Record<ScenarioScenario, ScenarioFailure>> = {
    MISSING_SEED: "SIMULATION_SEED_MISSING",
    MISSING_FAILURE_PROFILE: "FAILURE_PROFILE_MISSING",
    AUTHORITY_ESCALATION: "AUTHORITY_ELEVATION_ATTEMPTED",
    POLICY_MODIFICATION: "POLICY_MODIFICATION_ATTEMPTED",
    CONSTITUTION_MODIFICATION: "CONSTITUTION_MODIFICATION_ATTEMPTED",
    REPLAY_MUTATION: "REPLAY_HISTORY_MUTATION_ATTEMPTED",
    CROSS_TENANT_SCENARIO: "TENANT_ISOLATION_INVALID",
    FORGED_EVIDENCE: "FORGED_EVIDENCE_DETECTED",
    INCOMPLETE_EXPECTED_RECOVERY: "RECOVERY_EXPECTATIONS_INCOMPLETE",
    INTEGRITY_FAILURE: "INTEGRITY_HASH_INVALID",
  };
  return map[scenario] ? freezeArray([map[scenario]]) : freezeArray([]);
}

function computeProfileHash(profile: Omit<FailureProfile, "integrity_hash"> | FailureProfile): string {
  const { integrity_hash: _hash, ...source } = profile as FailureProfile;
  return hashValue("scenario-failure-profile", source);
}

export function buildFailureProfile(type: ScenarioType = "HARDWARE_FAILURE", input: ScenarioDefinitionInput = {}): FailureProfile {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const expectedRecovery = failures.includes("RECOVERY_EXPECTATIONS_INCOMPLETE") ? [] : ["Automatic Detection", "Governance Validation", "Authority Validation", "Recovery Recommendation", "Replay Verification", "Integrity Verification", "Operator Notification"];
  const base = {
    failure_profile_id: id("SFP", "scenario-failure-profile", { type }),
    failure_type: type,
    severity: type === "CASCADING_FAILURES" ? "CRITICAL" as const : "HIGH" as const,
    affected_components: freezeArray([type.toLowerCase().replaceAll("_", "-"), "governance", "replay"]),
    trigger_condition: `deterministic trigger for ${type.toLowerCase()}`,
    expected_behavior: "fail closed with operator-visible recommendation only",
    expected_recovery: freezeArray(expectedRecovery),
    maximum_duration: "PT30M",
    rollback_available: true,
    operator_required: true,
    replay_supported: !failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED"),
    profile_version: PROFILE_VERSION,
  };
  return Object.freeze({ ...base, integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : computeProfileHash(base as Omit<FailureProfile, "integrity_hash">) });
}

function computeTemplateHash(template: Omit<ScenarioTemplate, "integrity_hash"> | ScenarioTemplate): string {
  const { integrity_hash: _hash, ...source } = template as ScenarioTemplate;
  return hashValue("scenario-template", source);
}

export function buildScenarioTemplate(type: ScenarioType = "HARDWARE_FAILURE"): ScenarioTemplate {
  const base = { template_id: id("SCT", "scenario-template", type), template_name: `${type.toLowerCase().replaceAll("_", " ")} template`, scenario_type: type, template_version: TEMPLATE_VERSION, supported_conditions: freezeArray(conditions[type]), reusable: true as const, governance_aware: true as const };
  return Object.freeze({ ...base, integrity_hash: computeTemplateHash(base) });
}

function computeScenarioHash(scenario: Omit<ScenarioDefinition, "scenario_hash"> | ScenarioDefinition): string {
  const { scenario_hash: _hash, ...source } = scenario as ScenarioDefinition;
  return hashValue("scenario-definition", source);
}

function scenarioDefinition(type: ScenarioType, input: ScenarioDefinitionInput = {}): ScenarioDefinition {
  const failures = failuresFor(input.scenario ?? "BASELINE");
  const tenant = failures.includes("TENANT_ISOLATION_INVALID") ? "external-tenant" : input.tenant_id ?? TENANT_ID;
  const failureProfile = failures.includes("FAILURE_PROFILE_MISSING") ? null : buildFailureProfile(type, input);
  const scenario_id = id("SCN", "scenario-definition", { type, mission: input.mission_scope ?? "mission:scenario:primary" });
  const seed = failures.includes("SIMULATION_SEED_MISSING") ? "" : hashValue("scenario-seed", { scenario_id, type }).slice(0, 16);
  const expectedRecovery = failures.includes("RECOVERY_EXPECTATIONS_INCOMPLETE") ? [] : ["detect", "validate governance", "validate authority", "notify operator", "verify replay", "verify integrity"];
  const base = {
    scenario_id,
    scenario_name: `${type.toLowerCase().replaceAll("_", " ")} scenario`,
    scenario_version: SCENARIO_VERSION,
    scenario_type: type,
    description: `Deterministic ${type.toLowerCase().replaceAll("_", " ")} stress definition`,
    mission_scope: input.mission_scope ?? "mission:scenario:primary",
    tenant_id: tenant,
    simulation_mode: type === "CASCADING_FAILURES" ? "FAILURE_CHAIN" as const : "CERTIFICATION" as const,
    failure_profile: failureProfile,
    environment_profile: freezeArray(["cpu:bounded", "memory:bounded", "network:deterministic", "replay:enabled", "tenant:isolation-required"]),
    governance_profile: failures.includes("POLICY_MODIFICATION_ATTEMPTED") ? freezeArray<string>([]) : freezeArray(["policy:operator-supremacy", "policy:advisory-only", "policy:simulation-isolation"]),
    authority_requirements: failures.includes("AUTHORITY_ELEVATION_ATTEMPTED") ? freezeArray(["escalated-admin"]) : freezeArray(["operator-review", "governance-visible-approval"]),
    constitutional_requirements: failures.includes("CONSTITUTION_MODIFICATION_ATTEMPTED") ? freezeArray<string>([]) : freezeArray(["constitution:operator-authority", "constitution:tenant-isolation"]),
    simulation_seed: seed,
    deterministic_seed: seed ? hashValue("scenario-deterministic-seed", seed).slice(0, 16) : "",
    configuration: Object.freeze({ simulation_mode: "CERTIFICATION" as const, execution_speed: "deterministic", failure_start: "T+00:05:00", failure_duration: "PT15M", failure_probability: 1, parallel_events: type === "CASCADING_FAILURES" ? 4 : 1, environment_profile: "bounded-certification", governance_mode: "enforced", authority_validation: failures.includes("AUTHORITY_ELEVATION_ATTEMPTED") ? "invalid-escalation" : "operator-required", replay_enabled: !failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED"), logging_level: "audit", deterministic_seed: seed }),
    expected_behavior: "governance-compliant fail-closed simulation definition",
    expected_failures: freezeArray([conditions[type][0]]),
    expected_recovery: freezeArray(expectedRecovery),
    replay_reference: failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED") ? "" : `replay:scenario-definition:${scenario_id}`,
    lineage_reference: `lineage:scenario-definition:${scenario_id}`,
    created_by: "scenario-definition-framework",
    creation_timestamp: NOW,
    validation_state: failures.length ? "REJECTED" as const : "CERTIFIED" as const,
    certification_status: failures.length ? "BLOCKED" as const : "CERTIFICATION_READY" as const,
    immutable: true as const,
    governance_bypass_attempted: false,
    constitution_bypass_attempted: false,
    authority_elevation_attempted: failures.includes("AUTHORITY_ELEVATION_ATTEMPTED"),
    policy_modification_attempted: failures.includes("POLICY_MODIFICATION_ATTEMPTED"),
    constitution_modification_attempted: failures.includes("CONSTITUTION_MODIFICATION_ATTEMPTED"),
    replay_history_mutation_attempted: failures.includes("REPLAY_HISTORY_MUTATION_ATTEMPTED"),
    forged_evidence_detected: failures.includes("FORGED_EVIDENCE_DETECTED"),
    integrity_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : hashValue("scenario-integrity", { scenario_id, seed, failureProfile: failureProfile?.integrity_hash }),
  };
  return Object.freeze({ ...base, scenario_hash: failures.includes("INTEGRITY_HASH_INVALID") ? "" : computeScenarioHash(base as Omit<ScenarioDefinition, "scenario_hash">) });
}

function computeRegistryHash(registry: Omit<ScenarioRegistry, "registry_hash"> | ScenarioRegistry): string {
  const { registry_hash: _hash, ...source } = registry as ScenarioRegistry;
  return hashValue("scenario-registry", source);
}

export function createScenarioRegistry(input: ScenarioDefinitionInput = {}): ScenarioRegistry {
  const types = input.scenario_type ? [input.scenario_type] : scenarioTypes;
  const scenarios = freezeArray(types.map((type) => scenarioDefinition(type, input)).sort((a, b) => a.scenario_type.localeCompare(b.scenario_type)));
  const templates = freezeArray(scenarioTypes.map((type) => buildScenarioTemplate(type)));
  const profiles = freezeArray(scenarioTypes.map((type) => buildFailureProfile(type, input)));
  const base = { registry_id: id("SCR", "scenario-registry", { mission: input.mission_scope ?? "mission:scenario:primary", scenario: input.scenario ?? "BASELINE" }), tenant_id: input.scenario === "CROSS_TENANT_SCENARIO" ? "external-tenant" : input.tenant_id ?? TENANT_ID, mission_scope: input.mission_scope ?? "mission:scenario:primary", scenarios, templates, failure_profiles: profiles, append_only: true as const, replay_compatible: true as const };
  return Object.freeze({ ...base, registry_hash: computeRegistryHash(base as Omit<ScenarioRegistry, "registry_hash">) });
}

export function getScenario(registry = createScenarioRegistry(), scenario_id?: string): ScenarioDefinition | null {
  return registry.scenarios.find((item) => item.scenario_id === (scenario_id ?? registry.scenarios[0]?.scenario_id)) ?? null;
}

export function validateScenario(scenario?: ScenarioDefinition | null, registry = createScenarioRegistry()): ScenarioValidationResult {
  if (!scenario) {
    const failures = freezeArray<ScenarioFailure>(["SCENARIO_CONTRACT_INCOMPLETE"]);
    const source = { scenario_id: null, valid: false, contract_complete: false, identity_unique: false, configuration_deterministic: false, seeds_fixed: false, replay_compatible: false, governance_valid: false, authority_valid: false, constitutional_valid: false, environment_valid: false, failure_profile_registered: false, expected_outcomes_defined: false, recovery_defined: false, tenant_isolated: false, integrity_valid: false, certification_metadata_present: false, failures };
    return Object.freeze({ ...source, validation_hash: hashValue("scenario-validation", source) });
  }
  const contract_complete = Boolean(scenario.scenario_id && scenario.scenario_name && scenario.description && scenario.mission_scope && scenario.tenant_id);
  const identity_unique = registry.scenarios.filter((item) => item.scenario_id === scenario.scenario_id).length === 1;
  const configuration_deterministic = scenario.configuration.execution_speed === "deterministic" && scenario.configuration.failure_probability === 1 && scenario.configuration.deterministic_seed === scenario.simulation_seed;
  const seeds_fixed = Boolean(scenario.simulation_seed && scenario.deterministic_seed);
  const replay_compatible = Boolean(scenario.replay_reference && scenario.configuration.replay_enabled && scenario.failure_profile?.replay_supported);
  const governance_valid = scenario.governance_profile.length > 0 && !scenario.governance_bypass_attempted && !scenario.policy_modification_attempted;
  const authority_valid = scenario.authority_requirements.includes("operator-review") && !scenario.authority_elevation_attempted;
  const constitutional_valid = scenario.constitutional_requirements.length > 0 && !scenario.constitution_bypass_attempted && !scenario.constitution_modification_attempted;
  const environment_valid = scenario.environment_profile.length >= 5;
  const failure_profile_registered = Boolean(scenario.failure_profile && registry.failure_profiles.some((item) => item.failure_profile_id === scenario.failure_profile?.failure_profile_id));
  const expected_outcomes_defined = Boolean(scenario.expected_behavior && scenario.expected_failures.length > 0);
  const recovery_defined = scenario.expected_recovery.length > 0 && Boolean(scenario.failure_profile?.expected_recovery.length);
  const tenant_isolated = scenario.tenant_id.startsWith("tenant:") && registry.tenant_id.startsWith("tenant:") && scenario.tenant_id === registry.tenant_id;
  const integrity_valid = Boolean(scenario.integrity_hash && scenario.scenario_hash) && computeScenarioHash(scenario) === scenario.scenario_hash;
  const certification_metadata_present = scenario.validation_state === "CERTIFIED" && scenario.certification_status === "CERTIFICATION_READY" && Boolean(scenario.created_by && scenario.creation_timestamp);
  const failures = unique([
    ...(!contract_complete ? ["SCENARIO_CONTRACT_INCOMPLETE" as const] : []),
    ...(!identity_unique ? ["SCENARIO_ID_NOT_UNIQUE" as const] : []),
    ...(!configuration_deterministic ? ["CONFIGURATION_NONDETERMINISTIC" as const] : []),
    ...(!seeds_fixed ? ["SIMULATION_SEED_MISSING" as const] : []),
    ...(!replay_compatible ? ["REPLAY_COMPATIBILITY_INVALID" as const, ...(!scenario.replay_reference ? ["REPLAY_REFERENCE_MISSING" as const] : [])] : []),
    ...(!governance_valid ? [scenario.policy_modification_attempted ? "POLICY_MODIFICATION_ATTEMPTED" as const : "GOVERNANCE_CONSTRAINTS_MISSING" as const] : []),
    ...(!authority_valid ? [scenario.authority_elevation_attempted ? "AUTHORITY_ELEVATION_ATTEMPTED" as const : "AUTHORITY_CONSTRAINTS_INVALID" as const] : []),
    ...(!constitutional_valid ? [scenario.constitution_modification_attempted ? "CONSTITUTION_MODIFICATION_ATTEMPTED" as const : "CONSTITUTION_BYPASS_ATTEMPTED" as const] : []),
    ...(!environment_valid ? ["ENVIRONMENT_PROFILE_INVALID" as const] : []),
    ...(!failure_profile_registered ? ["FAILURE_PROFILE_MISSING" as const] : []),
    ...(!expected_outcomes_defined ? ["EXPECTED_OUTCOMES_INCOMPLETE" as const] : []),
    ...(!recovery_defined ? ["RECOVERY_EXPECTATIONS_INCOMPLETE" as const] : []),
    ...(!tenant_isolated ? ["TENANT_ISOLATION_INVALID" as const] : []),
    ...(!integrity_valid ? ["INTEGRITY_HASH_INVALID" as const] : []),
    ...(!certification_metadata_present ? ["CERTIFICATION_METADATA_MISSING" as const] : []),
    ...(scenario.replay_history_mutation_attempted ? ["REPLAY_HISTORY_MUTATION_ATTEMPTED" as const] : []),
    ...(scenario.forged_evidence_detected ? ["FORGED_EVIDENCE_DETECTED" as const] : []),
  ]);
  const valid = failures.length === 0;
  const source = { scenario_id: scenario.scenario_id, valid, contract_complete, identity_unique, configuration_deterministic, seeds_fixed, replay_compatible, governance_valid, authority_valid, constitutional_valid, environment_valid, failure_profile_registered, expected_outcomes_defined, recovery_defined, tenant_isolated, integrity_valid, certification_metadata_present, failures };
  return Object.freeze({ ...source, validation_hash: hashValue("scenario-validation", source) });
}

export function validateScenarioRegistry(registry = createScenarioRegistry()): ScenarioValidationResult {
  const validations = registry.scenarios.map((item) => validateScenario(item, registry));
  if (validations.every((item) => item.valid)) return validations[0];
  const failures = unique(validations.flatMap((item) => item.failures));
  const source = { scenario_id: registry.registry_id, valid: false, contract_complete: validations.every((item) => item.contract_complete), identity_unique: validations.every((item) => item.identity_unique), configuration_deterministic: validations.every((item) => item.configuration_deterministic), seeds_fixed: validations.every((item) => item.seeds_fixed), replay_compatible: validations.every((item) => item.replay_compatible), governance_valid: validations.every((item) => item.governance_valid), authority_valid: validations.every((item) => item.authority_valid), constitutional_valid: validations.every((item) => item.constitutional_valid), environment_valid: validations.every((item) => item.environment_valid), failure_profile_registered: validations.every((item) => item.failure_profile_registered), expected_outcomes_defined: validations.every((item) => item.expected_outcomes_defined), recovery_defined: validations.every((item) => item.recovery_defined), tenant_isolated: validations.every((item) => item.tenant_isolated), integrity_valid: validations.every((item) => item.integrity_valid), certification_metadata_present: validations.every((item) => item.certification_metadata_present), failures };
  return Object.freeze({ ...source, validation_hash: hashValue("scenario-validation", source) });
}

export function replayScenario(scenario = getScenario()): ScenarioReplayResult {
  const reconstructed_hash = scenario ? computeScenarioHash(scenario) : "";
  const source = { replay_reference: scenario?.replay_reference ?? "", scenario_id: scenario?.scenario_id ?? "", deterministic: Boolean(scenario?.replay_reference) && reconstructed_hash === scenario?.scenario_hash, reconstructed_hash, original_hash: scenario?.scenario_hash ?? "" };
  return Object.freeze({ ...source, replay_result_hash: hashValue("scenario-replay", source) });
}

export function searchScenarios(criteria: ScenarioSearchCriteria = {}, registry = createScenarioRegistry()): readonly ScenarioDefinition[] {
  return freezeArray(registry.scenarios.filter((item) =>
    (!criteria.scenario_id || item.scenario_id === criteria.scenario_id) &&
    (!criteria.scenario_type || item.scenario_type === criteria.scenario_type) &&
    (!criteria.tenant_id || item.tenant_id === criteria.tenant_id) &&
    (!criteria.simulation_mode || item.simulation_mode === criteria.simulation_mode) &&
    (!criteria.validation_state || item.validation_state === criteria.validation_state) &&
    (!criteria.replay_reference || item.replay_reference === criteria.replay_reference)
  ).sort((a, b) => a.scenario_type.localeCompare(b.scenario_type)));
}

export function buildScenarioObservabilitySurface(registry = createScenarioRegistry()): ScenarioObservabilitySurface {
  return Object.freeze({ registry_id: registry.registry_id, tenant_id: registry.tenant_id, scenario_count: registry.scenarios.length, template_count: registry.templates.length, failure_profile_count: registry.failure_profiles.length, scenario_types: freezeArray(registry.scenarios.map((item) => item.scenario_type)), append_only: true, registry_hash: registry.registry_hash });
}

export function getScenarioDefinitionContract(): ScenarioDefinitionContract {
  const registry = createScenarioRegistry();
  const scenario = getScenario(registry);
  return Object.freeze({
    doctrine: Object.freeze({
      framework_version: VERSION,
      principles: freezeArray(["deterministic-scenario-definitions", "immutable-contracts", "replay-compatible-configuration", "governance-supremacy", "constitutional-compliance", "operator-authority", "tenant-isolation", "append-only-registry", "audit-ready", "certification-ready"]),
      scenario_types: scenarioTypes,
      simulation_modes: simulationModes,
      severity_levels: severities,
      validation_states: validationStates,
      registry_append_only: true,
    }),
    registry,
    validation: validateScenarioRegistry(registry),
    replay: replayScenario(scenario),
    observability: buildScenarioObservabilitySurface(registry),
  });
}
