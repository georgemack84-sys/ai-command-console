import { describe, expect, it } from "vitest";
import {
  getRuntimeOrchestrationBundle,
  replayRuntimeOrchestration,
  runRuntimeOrchestration,
  validateRuntimeOrchestration,
} from "@/services/caf-runtime-orchestration";
import type { RuntimeOrchestrationScenario } from "@/types/caf-runtime-orchestration";

describe("Program 3 P3.3 Agent Runtime Orchestration", () => {
  it("publishes doctrine that consumes P3.2 and CCI shared runtime services", () => {
    const bundle = getRuntimeOrchestrationBundle();

    expect(bundle.doctrine.version).toBe("caf-runtime-orchestration/v3.3");
    expect(bundle.doctrine.consumes_capability_composition).toBe(true);
    expect(bundle.doctrine.consumes_cci_shared_runtime_services).toBe(true);
    expect(bundle.doctrine.owns_orchestration_not_runtime_infrastructure).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic runtime orchestration records and replay hashes", () => {
    const first = runRuntimeOrchestration();
    const second = runRuntimeOrchestration();

    expect(first.constitutional_ref).toBe("P3.0-CAF-CONSTITUTION-001");
    expect(first.agent_lifecycle_ref).toBe("caf-agent-identity-lifecycle/v3.1");
    expect(first.capability_composition_ref).toBe("caf-capability-composition/v3.2");
    expect(first.cci_shared_runtime_ref).toBe("Program 2 - CCI Shared Runtime Services");
    expect(first.orchestrator.owns_infrastructure).toBe(false);
    expect(first.orchestrator.all_execution_orchestrated).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateRuntimeOrchestration(first).valid).toBe(true);
    expect(replayRuntimeOrchestration(first)).toBe(true);
  });

  it("defines deterministic lifecycle supervision, scheduling, and execution coordination", () => {
    const result = runRuntimeOrchestration();

    expect(result.lifecycle_supervisor.states).toContain("INITIALIZING");
    expect(result.lifecycle_supervisor.states).toContain("RECOVERING");
    expect(result.lifecycle_supervisor.transition_legal).toBe(true);
    expect(result.scheduling.supported_modes).toEqual(["IMMEDIATE", "DELAYED", "SCHEDULED", "RECURRING", "EVENT_TRIGGERED", "DEPENDENCY_TRIGGERED"]);
    expect(result.scheduling.deterministic_ordering).toBe(true);
    expect(result.scheduling.governance_validated).toBe(true);
    expect(result.execution_coordination.dependency_barriers).toContain("barrier:composition-ready");
    expect(result.execution_coordination.synchronization_valid).toBe(true);
  });

  it("enforces governance, tenant isolation, contracts, evidence, replay, and observability", () => {
    const result = runRuntimeOrchestration();

    expect(result.governance_adapter.constitutional_authority_validated).toBe(true);
    expect(result.governance_adapter.unauthorized_execution_fails_closed).toBe(true);
    expect(result.runtime_state.tenant_isolated).toBe(true);
    expect(result.contract_library.complete).toBe(true);
    expect(result.runtime_evidence).toHaveLength(10);
    expect(result.runtime_evidence.every((entry, index) => entry.sequence === index + 1 && entry.immutable && entry.replayable)).toBe(true);
    expect(result.replay_validation.identical_behavior_reconstructed).toBe(true);
    expect(result.observability.complete_visibility).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "P3_2_COMPOSITION_INVALID",
    "CCI_RUNTIME_INFRASTRUCTURE_REDEFINED",
    "UNORCHESTRATED_EXECUTION",
    "SCHEDULING_NON_DETERMINISTIC",
    "SCHEDULING_GOVERNANCE_BYPASS",
    "LIFECYCLE_SUPERVISION_GAP",
    "ILLEGAL_RUNTIME_TRANSITION",
    "DEPENDENCY_SYNC_FAILURE",
    "CONCURRENCY_ORDERING_DRIFT",
    "RUNTIME_CONTRACT_MISSING",
    "RUNTIME_GOVERNANCE_BYPASS",
    "RUNTIME_EVIDENCE_MISSING",
    "REPLAY_DIVERGENCE",
    "OBSERVABILITY_GAP",
    "TENANT_ISOLATION_VIOLATION",
  ] as const)("fails certification for %s", (scenario: RuntimeOrchestrationScenario) => {
    const result = runRuntimeOrchestration({ scenario });
    const validation = validateRuntimeOrchestration(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runRuntimeOrchestration({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
