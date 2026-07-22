import { describe, expect, it } from "vitest";
import {
  getSyntheticScenarioOrchestrationBundle,
  replaySyntheticScenarioOrchestration,
  runSyntheticScenarioOrchestration,
  validateSyntheticScenarioOrchestration,
} from "@/services/synthetic-scenario-orchestration";
import type { SyntheticScenarioFailure } from "@/types/synthetic-scenario-orchestration";

describe("Mission Control Phase 14.4 Synthetic Scenario Orchestration", () => {
  it("publishes the orchestration doctrine", () => {
    const bundle = getSyntheticScenarioOrchestrationBundle();

    expect(bundle.doctrine.version).toBe("synthetic-scenario-orchestration/v14.4");
    expect(bundle.doctrine.data_generation_phase).toBe("synthetic-identity-data-generation/v14.3");
    expect(bundle.doctrine.certification_outcomes).toEqual(["PASS", "CONDITIONAL_PASS", "FAIL"]);
    expect(bundle.doctrine.supported_scenario_types).toEqual(["NOMINAL", "EDGE_CASE", "ADVERSARIAL", "FAILURE", "RECOVERY"]);
    expect(bundle.doctrine.replay_divergence_categories).toEqual(["ORDERING_DIVERGENCE", "ENVIRONMENT_DIVERGENCE", "DATASET_DIVERGENCE", "IDENTITY_DIVERGENCE", "UNEXPLAINED_DIVERGENCE"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines the synthetic scenario contract and lifecycle", () => {
    const result = runSyntheticScenarioOrchestration();

    expect(result.contract.lifecycle).toEqual(["DEFINED", "REGISTERED", "QUALIFIED", "SCHEDULED", "EXECUTING", "COMPLETED", "REPLAYABLE", "ARCHIVED"]);
    expect(result.contract.deterministic_execution_required).toBe(true);
    expect(result.contract.deterministic_scheduling_required).toBe(true);
    expect(result.contract.replay_required).toBe(true);
    expect(result.contract.lineage_required).toBe(true);
    expect(result.contract.governance_required).toBe(true);
    expect(result.contract.advisory_only).toBe(true);
  });

  it("registers all supported scenario types deterministically", () => {
    const result = runSyntheticScenarioOrchestration({ tenant_id: "tenant_alpha", owner: "owner_alpha" });

    expect(result.registry).toHaveLength(5);
    expect(result.registry.map((scenario) => scenario.scenario_type)).toEqual(["NOMINAL", "EDGE_CASE", "ADVERSARIAL", "FAILURE", "RECOVERY"]);
    expect(new Set(result.registry.map((scenario) => scenario.scenario_id)).size).toBe(5);
    expect(result.registry.every((scenario) => scenario.tenant_id === "tenant_alpha" && scenario.owner === "owner_alpha" && scenario.status === "REPLAYABLE")).toBe(true);
  });

  it("composes validated components and dependencies", () => {
    const result = runSyntheticScenarioOrchestration();

    expect(result.composition.component_refs.length).toBeGreaterThan(0);
    expect(result.composition.dependency_graph).toHaveLength(4);
    expect(result.composition.ownership_validated).toBe(true);
    expect(result.composition.integrity_validated).toBe(true);
    expect(result.composition.tenant_isolation_preserved).toBe(true);
    expect(result.composition.deterministic_ordering_preserved).toBe(true);
  });

  it("schedules execution deterministically", () => {
    const result = runSyntheticScenarioOrchestration();

    expect(result.schedule.execution_queue).toEqual(result.registry.map((scenario) => scenario.scenario_id));
    expect(result.schedule.prerequisites_respected).toBe(true);
    expect(result.schedule.parallel_eligibility_deterministic).toBe(true);
    expect(result.schedule.dependency_readiness_validated).toBe(true);
    expect(result.schedule.replay_ordering_preserved).toBe(true);
    expect(result.schedule.nondeterministic_inputs_rejected).toBe(true);
  });

  it("executes all scenario classes correctly", () => {
    const result = runSyntheticScenarioOrchestration();

    expect(result.execution.scenario_results).toHaveLength(5);
    expect(result.execution.scenario_results.every((scenario) => scenario.result === "COMPLETED")).toBe(true);
    expect(result.execution.nominal_executed).toBe(true);
    expect(result.execution.edge_case_executed).toBe(true);
    expect(result.execution.adversarial_executed).toBe(true);
    expect(result.execution.failure_executed).toBe(true);
    expect(result.execution.recovery_executed).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runSyntheticScenarioOrchestration();
    const second = runSyntheticScenarioOrchestration();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSyntheticScenarioOrchestration(first).valid).toBe(true);
    expect(replaySyntheticScenarioOrchestration(first)).toBe(true);
  });

  it("preserves lineage, audit, governance, and observability", () => {
    const result = runSyntheticScenarioOrchestration();

    expect(result.lineage_audit.creation_tracked).toBe(true);
    expect(result.lineage_audit.replay_tracked).toBe(true);
    expect(result.lineage_audit.immutable).toBe(true);
    expect(result.governance.governance_approval).toBe(true);
    expect(result.governance.advisory_only_constraints).toBe(true);
    expect(result.governance.tenant_isolation).toBe(true);
    expect(result.observability.alerts_configured).toBe(true);
  });

  it("executes the complete certification matrix", () => {
    const result = runSyntheticScenarioOrchestration();

    expect(result.certification_tests).toHaveLength(22);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Synthetic Scenario Contract valid",
      "Scenario Registry deterministic",
      "Scenario identities unique",
      "Scenario composition deterministic",
      "Dependency scheduling deterministic",
      "Execution ordering reproducible",
      "Nominal scenarios execute correctly",
      "Edge case scenarios execute correctly",
      "Adversarial scenarios execute correctly",
      "Failure scenarios execute correctly",
      "Recovery scenarios execute correctly",
      "Multi-scenario orchestration deterministic",
      "Replay reproduces execution",
      "Replay divergence detected",
      "Scenario lineage complete",
      "Immutable audit preserved",
      "Governance enforcement validated",
      "Advisory-only boundary enforced",
      "Tenant isolation preserved",
      "Execution integrity verified",
      "Operational monitoring complete",
      "Certification evidence immutable",
    ]);
  });

  it("supports conditional pass for non-constitutional observability warnings", () => {
    const result = runSyntheticScenarioOrchestration({ scenario: "NON_CONSTITUTIONAL_OBSERVABILITY_WARNING" });
    const validation = validateSyntheticScenarioOrchestration(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "SCENARIO_CONTRACT_INVALID",
    "SCENARIO_REGISTRY_NON_DETERMINISTIC",
    "SCENARIO_IDENTITY_DUPLICATE",
    "COMPOSITION_NON_DETERMINISTIC",
    "DEPENDENCY_SCHEDULING_NON_DETERMINISTIC",
    "EXECUTION_ORDER_NON_REPRODUCIBLE",
    "NOMINAL_EXECUTION_FAILED",
    "EDGE_CASE_EXECUTION_FAILED",
    "ADVERSARIAL_EXECUTION_FAILED",
    "FAILURE_EXECUTION_FAILED",
    "RECOVERY_EXECUTION_FAILED",
    "MULTI_SCENARIO_ORCHESTRATION_NON_DETERMINISTIC",
    "REPLAY_EXECUTION_MISMATCH",
    "REPLAY_DIVERGENCE_UNDETECTED",
    "LINEAGE_INCOMPLETE",
    "AUDIT_MUTABLE",
    "GOVERNANCE_NOT_ENFORCED",
    "ADVISORY_BOUNDARY_BREACH",
    "TENANT_ISOLATION_BREACH",
    "EXECUTION_INTEGRITY_FAILED",
    "OBSERVABILITY_INCOMPLETE",
    "CERTIFICATION_EVIDENCE_MUTABLE",
  ] as const)("fails certification for %s", (scenario: SyntheticScenarioFailure) => {
    const result = runSyntheticScenarioOrchestration({ scenario });
    const validation = validateSyntheticScenarioOrchestration(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested scenario tampering", () => {
    const result = runSyntheticScenarioOrchestration();
    const tampered = {
      ...result,
      registry: [
        {
          ...result.registry[0],
          scenario_name: "tampered scenario",
        },
        ...result.registry.slice(1),
      ],
    };

    expect(validateSyntheticScenarioOrchestration(tampered).valid).toBe(false);
  });
});
