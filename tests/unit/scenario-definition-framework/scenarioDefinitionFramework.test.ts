import { describe, expect, it, vi } from "vitest";
import {
  buildFailureProfile,
  buildScenarioObservabilitySurface,
  buildScenarioTemplate,
  createScenarioRegistry,
  getScenario,
  getScenarioDefinitionContract,
  replayScenario,
  searchScenarios,
  validateScenarioRegistry,
} from "@/services/scenario-definition-framework";
import type { ScenarioFailure, ScenarioScenario } from "@/types/scenario-definition-framework";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.6.1 Scenario Definition Framework", () => {
  it("defines deterministic scenario framework doctrine", () => {
    const contract = getScenarioDefinitionContract();

    expect(contract.doctrine.framework_version).toBe("scenario-definition-framework/v8ALT.6.1");
    expect(contract.doctrine.principles).toContain("deterministic-scenario-definitions");
    expect(contract.doctrine.principles).toContain("governance-supremacy");
    expect(contract.doctrine.principles).toContain("tenant-isolation");
    expect(contract.doctrine.scenario_types).toHaveLength(8);
    expect(contract.validation.valid).toBe(true);
  });

  it("creates a full append-only scenario library for every adverse condition family", () => {
    const registry = createScenarioRegistry();
    const types = registry.scenarios.map((item) => item.scenario_type);

    expect(registry.append_only).toBe(true);
    expect(registry.replay_compatible).toBe(true);
    expect(registry.scenarios).toHaveLength(8);
    expect(registry.templates).toHaveLength(8);
    expect(registry.failure_profiles).toHaveLength(8);
    expect(types).toEqual(["AUTHORITY_CONFLICT", "CASCADING_FAILURES", "HARDWARE_FAILURE", "MALICIOUS_INPUTS", "POLICY_CONFLICT", "REPLAY_CORRUPTION", "SERVICE_UNAVAILABILITY", "TENANT_ISOLATION_FAILURE"]);
  });

  it("builds reusable templates and failure profiles", () => {
    const template = buildScenarioTemplate("MALICIOUS_INPUTS");
    const profile = buildFailureProfile("CASCADING_FAILURES");

    expect(template.reusable).toBe(true);
    expect(template.governance_aware).toBe(true);
    expect(template.supported_conditions).toContain("forged execution request");
    expect(profile.severity).toBe("CRITICAL");
    expect(profile.expected_recovery).toContain("Operator Notification");
    expect(profile.replay_supported).toBe(true);
  });

  it("preserves deterministic seeds, replay, lineage, and integrity", () => {
    const registry = createScenarioRegistry();
    const scenario = getScenario(registry);
    const replay = replayScenario(scenario);

    expect(scenario?.simulation_seed).toBeTruthy();
    expect(scenario?.deterministic_seed).toBeTruthy();
    expect(scenario?.replay_reference).toContain("replay:scenario-definition");
    expect(scenario?.lineage_reference).toContain("lineage:scenario-definition");
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.original_hash);
  });

  it("searches deterministic registry records", () => {
    const registry = createScenarioRegistry();

    expect(searchScenarios({ scenario_type: "POLICY_CONFLICT" }, registry)).toHaveLength(1);
    expect(searchScenarios({ validation_state: "CERTIFIED" }, registry)).toHaveLength(8);
    expect(searchScenarios({ tenant_id: registry.tenant_id }, registry)).toHaveLength(8);
  });

  it("validates governance, authority, constitutional, environmental, and recovery constraints", () => {
    const validation = validateScenarioRegistry(createScenarioRegistry());

    expect(validation.valid).toBe(true);
    expect(validation.governance_valid).toBe(true);
    expect(validation.authority_valid).toBe(true);
    expect(validation.constitutional_valid).toBe(true);
    expect(validation.environment_valid).toBe(true);
    expect(validation.recovery_defined).toBe(true);
  });

  it.each([
    ["MISSING_SEED", "SIMULATION_SEED_MISSING"],
    ["MISSING_FAILURE_PROFILE", "FAILURE_PROFILE_MISSING"],
    ["AUTHORITY_ESCALATION", "AUTHORITY_ELEVATION_ATTEMPTED"],
    ["POLICY_MODIFICATION", "POLICY_MODIFICATION_ATTEMPTED"],
    ["CONSTITUTION_MODIFICATION", "CONSTITUTION_MODIFICATION_ATTEMPTED"],
    ["REPLAY_MUTATION", "REPLAY_HISTORY_MUTATION_ATTEMPTED"],
    ["CROSS_TENANT_SCENARIO", "TENANT_ISOLATION_INVALID"],
    ["FORGED_EVIDENCE", "FORGED_EVIDENCE_DETECTED"],
    ["INCOMPLETE_EXPECTED_RECOVERY", "RECOVERY_EXPECTATIONS_INCOMPLETE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_HASH_INVALID"],
  ] as readonly [ScenarioScenario, ScenarioFailure][])("rejects %s", (scenario, failure) => {
    const registry = createScenarioRegistry({ scenario });
    const validation = validateScenarioRegistry(registry);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes scenario registry observability", () => {
    const registry = createScenarioRegistry();
    const surface = buildScenarioObservabilitySurface(registry);

    expect(surface.registry_id).toBe(registry.registry_id);
    expect(surface.scenario_count).toBe(8);
    expect(surface.template_count).toBe(8);
    expect(surface.failure_profile_count).toBe(8);
    expect(surface.append_only).toBe(true);
  });
});
