import { describe, expect, it } from "vitest";
import { getProvingSimulationFrameworkBundle, replayProvingSimulationFramework, runProvingSimulationFramework, validateProvingSimulationFramework } from "@/services/proving-simulation-framework";
import type { SimulationFrameworkFailure } from "@/types/proving-simulation-framework";

const FAILURE_MATRIX: readonly SimulationFrameworkFailure[] = [
  "P6_4_SYNTHETIC_GENERATION_INVALID",
  "SIMULATION_ARCHITECTURE_MISSING",
  "DETERMINISTIC_ENGINE_MISSING",
  "EVENT_SIMULATION_MISSING",
  "OPERATIONAL_SIMULATION_MISSING",
  "MISSION_SIMULATION_MISSING",
  "REPLAY_SIMULATION_MISSING",
  "TIME_SERVICE_MISSING",
  "SCHEDULER_SERVICE_MISSING",
  "STATE_REGISTRY_MISSING",
  "FAILURE_INJECTION_MISSING",
  "METRICS_COLLECTION_MISSING",
  "SIMULATION_REPORTING_MISSING",
  "EVIDENCE_GENERATION_MISSING",
  "DETERMINISTIC_EXECUTION_FAILED",
  "REPLAY_FIDELITY_FAILED",
  "SIMULATION_ISOLATION_FAILED",
  "EVIDENCE_INCOMPLETE",
  "TIME_NONDETERMINISTIC",
  "STATE_RECOVERY_FAILED",
  "PRODUCTION_TENANT_MODIFIED",
  "PRODUCTION_IDENTITY_MODIFIED",
  "PRODUCTION_REGISTRY_MODIFIED",
  "PRODUCTION_EVIDENCE_MODIFIED",
  "PRODUCTION_TRUST_DECISION_MODIFIED",
  "LIVE_OPERATIONAL_EXECUTION_ATTEMPTED",
  "EXECUTION_ORDER_NONDETERMINISTIC",
  "EVENT_ORDER_NONDETERMINISTIC",
  "SCHEDULER_DECISION_NONDETERMINISTIC",
  "VIRTUAL_TIME_NONDETERMINISTIC",
  "SERVICE_INTERACTION_NONDETERMINISTIC",
  "STATE_TRANSITION_NONDETERMINISTIC",
  "GENERATED_EVIDENCE_NONDETERMINISTIC",
];

describe("P6.5 Simulation Framework", () => {
  it("publishes simulation doctrine without live operational execution or production modification", () => {
    const bundle = getProvingSimulationFrameworkBundle();

    expect(bundle.doctrine.version).toBe("proving-simulation-framework/v6.5");
    expect(bundle.doctrine.owns_deterministic_simulation).toBe(true);
    expect(bundle.doctrine.owns_event_simulation).toBe(true);
    expect(bundle.doctrine.owns_operational_simulation).toBe(true);
    expect(bundle.doctrine.owns_mission_simulation).toBe(true);
    expect(bundle.doctrine.owns_replay_simulation).toBe(true);
    expect(bundle.doctrine.performs_live_operational_execution).toBe(false);
    expect(bundle.doctrine.modifies_production_systems).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("executes deterministic isolated simulations with identical traces for identical seeds", () => {
    const first = runProvingSimulationFramework({ seed: "seed:test:p6.5" });
    const second = runProvingSimulationFramework({ seed: "seed:test:p6.5" });

    expect(first.phase_identifier).toBe("ProvingSimulationFramework");
    expect(first.synthetic_generation_ref).toBe("proving-synthetic-data-digital-twin-generation/v6.4");
    expect(first.simulation.seed).toBe("seed:test:p6.5");
    expect(first.simulation.status).toBe("COMPLETED");
    expect(first.execution.result).toBe("SUCCESS");
    expect(first.execution.execution_order).toEqual(second.execution.execution_order);
    expect(first.execution.event_order).toEqual(second.execution.event_order);
    expect(first.execution.scheduler_decisions).toEqual(second.execution.scheduler_decisions);
    expect(first.execution.virtual_time_progression).toEqual([0, 10, 20, 30, 40]);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateProvingSimulationFramework(first).valid).toBe(true);
    expect(replayProvingSimulationFramework(first)).toBe(true);
  });

  it("provides event, operational, mission, replay, time, scheduler, state, failure, metrics, reports, and evidence services", () => {
    const result = runProvingSimulationFramework();

    expect(result.engine.deterministic_scheduler).toBe(true);
    expect(result.engine.event_simulation).toBe(true);
    expect(result.engine.operational_simulation).toBe(true);
    expect(result.engine.mission_simulation).toBe(true);
    expect(result.engine.replay_simulation).toBe(true);
    expect(result.runtime_services.time_service).toBe(true);
    expect(result.runtime_services.scheduler_service).toBe(true);
    expect(result.runtime_services.state_registry).toBe(true);
    expect(result.runtime_services.failure_injection).toBe(true);
    expect(result.runtime_services.metrics_collection).toBe(true);
    expect(result.runtime_services.reporting).toBe(true);
    expect(result.runtime_services.evidence_generation).toBe(true);
    expect(result.state_registry.restoration_reproducible).toBe(true);
    expect(result.failure_injection.controlled).toBe(true);
    expect(result.metrics.deterministic).toBe(true);
    expect(result.report.findings).toContain("no-divergence");
    expect(result.evidence.immutable).toBe(true);
  });

  it("passes all P6.5 verification gates and preserves production isolation", () => {
    const result = runProvingSimulationFramework();

    expect(result.gates.deterministic_execution).toBe(true);
    expect(result.gates.replay_fidelity).toBe(true);
    expect(result.gates.simulation_isolation).toBe(true);
    expect(result.gates.evidence_completeness).toBe(true);
    expect(result.gates.time_determinism).toBe(true);
    expect(result.gates.state_recovery).toBe(true);
    expect(result.gates.passed).toBe(true);
    expect(result.boundaries.modifies_production_tenants).toBe(false);
    expect(result.boundaries.modifies_production_identities).toBe(false);
    expect(result.boundaries.modifies_production_registries).toBe(false);
    expect(result.boundaries.modifies_production_evidence).toBe(false);
    expect(result.boundaries.modifies_production_trust_decisions).toBe(false);
    expect(result.boundaries.performs_live_operational_execution).toBe(false);
    expect(result.readiness.phase_ready).toBe(true);
    expect(result.readiness.failures).toEqual([]);
  });

  it.each(FAILURE_MATRIX)("fails simulation readiness for %s", (failure) => {
    const result = runProvingSimulationFramework({ scenario: failure });
    const validation = validateProvingSimulationFramework(result);

    expect(result.readiness.outcome).toBe("FAIL");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain(failure);
    expect(validation.valid).toBe(false);
  });

  it("routes governance-review-required without simulation readiness", () => {
    const result = runProvingSimulationFramework({ scenario: "GOVERNANCE_REVIEW_REQUIRED" });

    expect(result.readiness.outcome).toBe("REQUIRES_GOVERNANCE_REVIEW");
    expect(result.readiness.phase_ready).toBe(false);
    expect(result.readiness.failures).toContain("GOVERNANCE_REVIEW_REQUIRED");
  });
});
