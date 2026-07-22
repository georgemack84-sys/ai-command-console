import { describe, expect, it, vi } from "vitest";
import {
  buildDependencyInjectionGraphs,
  buildStressInjectionObservabilitySurface,
  getStressInjectionContract,
  replayStressInjection,
  runStressInjection,
  scheduleStressEvents,
  sequenceFaults,
  validateStressInjection,
} from "@/services/stress-injection-engine";
import type { StressInjectionFailure, StressInjectionScenario } from "@/types/stress-injection-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.6.2 Stress Injection Engine", () => {
  it("defines deterministic simulation-only stress injection doctrine", () => {
    const contract = getStressInjectionContract();

    expect(contract.doctrine.engine_version).toBe("stress-injection-engine/v8ALT.6.2");
    expect(contract.doctrine.principles).toContain("deterministic-fault-orchestration");
    expect(contract.doctrine.principles).toContain("simulation-only-injection");
    expect(contract.doctrine.injection_targets).toHaveLength(13);
    expect(contract.validation.valid).toBe(true);
  });

  it("creates deterministic immutable injection ledgers", () => {
    const first = runStressInjection();
    const second = runStressInjection();
    const validation = validateStressInjection(first);

    expect(first.append_only).toBe(true);
    expect(first.simulation_only).toBe(true);
    expect(first.ledger_hash).toBe(second.ledger_hash);
    expect(first.events.length).toBe(3);
    expect(validation.valid).toBe(true);
  });

  it("schedules and sequences events deterministically", () => {
    const events = scheduleStressEvents({ injection_mode: "PROGRESSIVE" });
    const timeline = sequenceFaults({ injection_mode: "PROGRESSIVE" });

    expect(events.map((item) => item.sequence_position)).toEqual([1, 2, 3, 4, 5]);
    expect(events.every((item) => item.execution_timestamp && item.deterministic_seed)).toBe(true);
    expect(timeline).toHaveLength(5);
  });

  it("builds dependency and cascade artifacts", () => {
    const graphs = buildDependencyInjectionGraphs({ injection_mode: "COMPOUND" });

    expect(graphs.map((item) => item.graph_type)).toEqual(["DEPENDENCY_FAILURE", "CASCADE_TIMELINE", "AFFECTED_SUBSYSTEM", "DEPENDENCY_RECOVERY"]);
    expect(graphs.every((item) => item.nodes.length > 0 && item.graph_hash)).toBe(true);
  });

  it("replays stress injection ledgers identically", () => {
    const ledger = runStressInjection();
    const replay = replayStressInjection(ledger);

    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(replay.original_hash);
    expect(replay.event_count).toBe(ledger.events.length);
  });

  it("enforces simulation-only safety boundaries", () => {
    const ledger = runStressInjection();

    expect(ledger.events.every((item) => !item.production_modified)).toBe(true);
    expect(ledger.events.every((item) => !item.autonomous_action_executed)).toBe(true);
    expect(ledger.events.every((item) => !item.policy_modified)).toBe(true);
    expect(ledger.events.every((item) => !item.replay_history_modified)).toBe(true);
    expect(ledger.events.every((item) => !item.truth_ledger_modified)).toBe(true);
  });

  it.each([
    ["MISSING_SCENARIO", "SCENARIO_MISSING"],
    ["UNCERTIFIED_SCENARIO", "SCENARIO_NOT_CERTIFIED"],
    ["NONDETERMINISTIC_ORDERING", "EVENT_ORDERING_NONDETERMINISTIC"],
    ["MISSING_DETERMINISTIC_SEED", "DETERMINISTIC_SEED_MISSING"],
    ["REPLAY_SYNC_FAILURE", "REPLAY_SYNCHRONIZATION_FAILED"],
    ["GOVERNANCE_BYPASS", "GOVERNANCE_BYPASS_ATTEMPTED"],
    ["CONSTITUTION_BYPASS", "CONSTITUTION_BYPASS_ATTEMPTED"],
    ["AUTHORITY_ELEVATION", "AUTHORITY_ELEVATION_ATTEMPTED"],
    ["POLICY_MODIFICATION", "POLICY_MODIFICATION_ATTEMPTED"],
    ["REPLAY_MUTATION", "REPLAY_HISTORY_MUTATION_ATTEMPTED"],
    ["TRUTH_LEDGER_MUTATION", "TRUTH_LEDGER_MUTATION_ATTEMPTED"],
    ["CROSS_TENANT_INJECTION", "CROSS_TENANT_INJECTION_DETECTED"],
    ["HIDDEN_INJECTED_FAILURE", "HIDDEN_INJECTED_FAILURE_DETECTED"],
    ["INCOMPLETE_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] as readonly [StressInjectionScenario, StressInjectionFailure][])("rejects %s", (scenario, failure) => {
    const ledger = runStressInjection({ scenario });
    const validation = validateStressInjection(ledger);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes stress injection observability", () => {
    const ledger = runStressInjection({ injection_mode: "COMPOUND" });
    const surface = buildStressInjectionObservabilitySurface(ledger);

    expect(surface.ledger_id).toBe(ledger.ledger_id);
    expect(surface.event_count).toBe(3);
    expect(surface.injection_modes).toEqual(["COMPOUND"]);
    expect(surface.target_components.length).toBeGreaterThan(0);
    expect(surface.simulation_only).toBe(true);
  });
});
