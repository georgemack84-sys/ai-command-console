import { describe, expect, it } from "vitest";
import {
  getGlobalWorkloadDistributionBundle,
  replayGlobalWorkloadDistribution,
  runGlobalWorkloadDistribution,
  validateGlobalWorkloadDistribution,
} from "@/services/global-workload-distribution";
import type { GlobalWorkloadDistributionFailure } from "@/types/global-workload-distribution";

describe("Mission Control Phase 17.5 Global Workload Distribution", () => {
  it("publishes global workload distribution doctrine", () => {
    const bundle = getGlobalWorkloadDistributionBundle();

    expect(bundle.doctrine.version).toBe("global-workload-distribution/v17.5");
    expect(bundle.doctrine.upstream_phase).toBe("resource-scheduling-capacity-management/v17.4");
    expect(bundle.doctrine.lifecycle_states).toContain("FAILOVER_PENDING");
    expect(bundle.doctrine.workload_types).toEqual(["ADVISORY", "REPLAY", "AUDIT", "CERTIFICATION", "OPERATOR_CONTROL"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("routes advisory workloads deterministically", () => {
    const result = runGlobalWorkloadDistribution({ workload_id: "workload_alpha", routing_region: "us-east-1" });

    expect(result.classification.workload_id).toBe("workload_alpha");
    expect(result.router.routing_region).toBe("us-east-1");
    expect(result.router.routing_decision).toBe("ROUTE");
    expect(result.router.identical_inputs_identical_decisions).toBe(true);
    expect(result.distribution_record.destination).toBe("us-east-1/advisory-executor-primary");
  });

  it("preserves queue isolation and deterministic ordering", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.queue_manager.queue_isolation).toBe(true);
    expect(result.queue_manager.deterministic_ordering).toBe(true);
    expect(result.queue_manager.replay_ordering).toBe(true);
    expect(result.queue_manager.queue_order).toHaveLength(1);
  });

  it("balances load without runtime timing influence", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.load_distribution_engine.capacity_aware_placement).toBe(true);
    expect(result.load_distribution_engine.reproducible_balancing).toBe(true);
    expect(result.load_distribution_engine.depends_on_runtime_conditions).toBe(false);
    expect(result.elastic_scaling_coordinator.overrides_resource_constraints).toBe(false);
  });

  it("produces deterministic retries and governed failover", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.retry_policy_engine.retry_record.retry_attempt).toBe(1);
    expect(result.retry_policy_engine.identical_retry_sequences).toBe(true);
    expect(result.failover_routing_engine.deterministic_selection).toBe(true);
    expect(result.failover_routing_engine.uses_runtime_timing).toBe(false);
    expect(result.failover_routing_engine.preserves_workload_identity).toBe(true);
  });

  it("records immutable routing lineage", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.distribution_ledger).toHaveLength(11);
    expect(result.distribution_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_reference.length > 0)).toBe(true);
  });

  it("replays routing, queue, retry, failover, and balancing decisions exactly", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.replay_service.reconstructs_routing).toBe(true);
    expect(result.replay_service.reconstructs_queue_ordering).toBe(true);
    expect(result.replay_service.reconstructs_retries).toBe(true);
    expect(result.replay_service.reconstructs_failover).toBe(true);
    expect(result.replay_service.reconstructs_balancing).toBe(true);
  });

  it("publishes distribution observability and certification evidence", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.audit_service.monitoring_influences_routing).toBe(false);
    expect(result.dashboard.constitutional_compliance_visible).toBe(true);
    expect(result.certification_package.workload_distribution_certified).toBe(true);
    expect(result.certification_package.governance_enforced).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runGlobalWorkloadDistribution();
    const second = runGlobalWorkloadDistribution();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateGlobalWorkloadDistribution(first).valid).toBe(true);
    expect(replayGlobalWorkloadDistribution(first)).toBe(true);
  });

  it("executes the Phase 17.5 global workload distribution certification matrix", () => {
    const result = runGlobalWorkloadDistribution();

    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional distribution warnings", () => {
    const result = runGlobalWorkloadDistribution({ scenario: "NON_CONSTITUTIONAL_DISTRIBUTION_WARNING" });
    const validation = validateGlobalWorkloadDistribution(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.workload_distribution_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("rejects capacity governance bypasses", () => {
    const result = runGlobalWorkloadDistribution({ scenario: "CAPACITY_GOVERNANCE_BYPASSED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.router.routing_decision).toBe("REJECT_GOVERNANCE");
    expect(result.elastic_scaling_coordinator.overrides_resource_constraints).toBe(true);
  });

  it.each([
    "ROUTING_NOT_DETERMINISTIC",
    "BALANCING_NOT_REPRODUCIBLE",
    "RETRY_POLICY_NOT_DETERMINISTIC",
    "WORKLOAD_DISTRIBUTION_NOT_REPLAYABLE",
    "FAILOVER_NOT_DETERMINISTIC",
    "ROUTING_EVIDENCE_MUTABLE",
    "REPLAY_NOT_VALIDATED",
    "TENANT_ISOLATION_VIOLATED",
    "GOVERNANCE_NOT_ENFORCED",
    "WORKLOAD_DISTRIBUTION_NOT_CERTIFIED",
    "CAPACITY_GOVERNANCE_BYPASSED",
    "QUEUE_ORDERING_NOT_DETERMINISTIC",
    "ROUTING_DEPENDS_ON_TIMING",
    "PHASE_17_4_CAPACITY_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: GlobalWorkloadDistributionFailure) => {
    const result = runGlobalWorkloadDistribution({ scenario });
    const validation = validateGlobalWorkloadDistribution(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested distribution record tampering", () => {
    const result = runGlobalWorkloadDistribution();
    const tampered = {
      ...result,
      distribution_record: {
        ...result.distribution_record,
        destination: "shadow-region/advisory-executor",
      },
    };

    expect(validateGlobalWorkloadDistribution(tampered).valid).toBe(false);
  });
});
