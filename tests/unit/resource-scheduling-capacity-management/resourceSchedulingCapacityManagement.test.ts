import { describe, expect, it } from "vitest";
import {
  getResourceSchedulingCapacityManagementBundle,
  replayResourceSchedulingCapacityManagement,
  runResourceSchedulingCapacityManagement,
  validateResourceSchedulingCapacityManagement,
} from "@/services/resource-scheduling-capacity-management";
import type { ResourceSchedulingCapacityFailure } from "@/types/resource-scheduling-capacity-management";

describe("Mission Control Phase 17.4 Resource Scheduling & Capacity Management", () => {
  it("publishes resource scheduling capacity doctrine", () => {
    const bundle = getResourceSchedulingCapacityManagementBundle();

    expect(bundle.doctrine.version).toBe("resource-scheduling-capacity-management/v17.4");
    expect(bundle.doctrine.upstream_phase).toBe("global-tenant-registry-regional-assignment/v17.3");
    expect(bundle.doctrine.resource_classes).toEqual(["COMPUTE", "MEMORY", "STORAGE", "NETWORK", "INFERENCE", "REPLAY", "SYSTEM"]);
    expect(bundle.doctrine.resource_lifecycle_states).toContain("ALLOCATED");
    expect(bundle.validation.valid).toBe(true);
  });

  it("allocates resources deterministically for exactly one tenant", () => {
    const result = runResourceSchedulingCapacityManagement({ requested_capacity: 50, quota_limit: 100 });

    expect(result.allocation_record.tenant_id).toBeTruthy();
    expect(result.allocation_record.scheduler_decision).toBe("ALLOCATE");
    expect(result.allocation_record.requested_capacity).toBe(50);
    expect(result.allocation_record.approved_capacity).toBe(50);
    expect(result.scheduler.deterministic_ordering).toBe(true);
  });

  it("enforces capacity, quota, and reservation governance", () => {
    const result = runResourceSchedulingCapacityManagement();

    expect(result.capacity_planner.capacity_states).toEqual(["AVAILABLE", "RESERVED", "ALLOCATED", "DEGRADED", "EXHAUSTED", "RETIRED"]);
    expect(result.capacity_planner.never_overrides_constitutional_rules).toBe(true);
    expect(result.quota_manager.quota_available).toBe(true);
    expect(result.reservation_service.current_state).toBe("CONSUMED");
  });

  it("keeps forecasts advisory", () => {
    const result = runResourceSchedulingCapacityManagement();

    expect(result.forecast_engine.advisory_only).toBe(true);
    expect(result.forecast_engine.modifies_allocation_decisions).toBe(false);
    expect(result.forecast_engine.supports_certification_readiness).toBe(true);
  });

  it("requires regional assignment validation before allocation", () => {
    const result = runResourceSchedulingCapacityManagement({ region: "ap-southeast-1" });

    expect(result.allocation_record.regional_assignment).toBe("ap-southeast-1");
    expect(result.allocation_validation.regional_assignment_valid).toBe(true);
    expect(result.allocation_validation.stale_assignment_rejected).toBe(true);
    expect(result.allocation_validation.silent_reassignment_prevented).toBe(true);
  });

  it("records immutable allocation lineage", () => {
    const result = runResourceSchedulingCapacityManagement();

    expect(result.allocation_ledger).toHaveLength(9);
    expect(result.allocation_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replay_ref.length > 0)).toBe(true);
  });

  it("replays allocation decisions exactly", () => {
    const result = runResourceSchedulingCapacityManagement();

    expect(result.replay_service.reconstructs_scheduling_order).toBe(true);
    expect(result.replay_service.reconstructs_quota_decisions).toBe(true);
    expect(result.replay_service.identical_allocation_decisions).toBe(true);
  });

  it("publishes capacity monitoring visibility and certification", () => {
    const result = runResourceSchedulingCapacityManagement();

    expect(result.dashboard.operational).toBe(true);
    expect(result.dashboard.policy_compliance_visible).toBe(true);
    expect(result.certification_package.resource_scheduling_certified).toBe(true);
    expect(result.certification_package.scheduler_determinism).toBe(true);
  });

  it("is deterministic and replayable", () => {
    const first = runResourceSchedulingCapacityManagement();
    const second = runResourceSchedulingCapacityManagement();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateResourceSchedulingCapacityManagement(first).valid).toBe(true);
    expect(replayResourceSchedulingCapacityManagement(first)).toBe(true);
  });

  it("executes the Phase 17.4 resource scheduling certification matrix", () => {
    const result = runResourceSchedulingCapacityManagement();

    expect(result.certification_tests).toHaveLength(14);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
  }, 300000);

  it("supports conditional pass for non-constitutional scheduling warnings", () => {
    const result = runResourceSchedulingCapacityManagement({ scenario: "NON_CONSTITUTIONAL_SCHEDULING_WARNING" });
    const validation = validateResourceSchedulingCapacityManagement(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(result.certification_package.resource_scheduling_certified).toBe(true);
    expect(validation.valid).toBe(false);
  });

  it("rejects quota bypasses", () => {
    const result = runResourceSchedulingCapacityManagement({ scenario: "QUOTAS_NOT_ENFORCED" });

    expect(result.outcome).toBe("FAIL");
    expect(result.quota_manager.quota_available).toBe(false);
    expect(result.allocation_record.scheduler_decision).toBe("REJECT_QUOTA_EXCEEDED");
  });

  it.each([
    "ALLOCATION_NOT_DETERMINISTIC",
    "CONCURRENT_ASSIGNMENTS_NOT_RESOLVED_DETERMINISTICALLY",
    "STALE_ASSIGNMENT_PROPOSALS_NOT_REJECTED",
    "ACCEPTED_ASSIGNMENTS_SILENTLY_OVERWRITTEN",
    "QUOTAS_NOT_ENFORCED",
    "REPLAY_NOT_PRESERVED",
    "RESOURCE_SCHEDULING_NOT_CERTIFIED",
    "TENANT_ISOLATION_VIOLATED",
    "GOVERNANCE_BYPASSED",
    "ALLOCATION_LEDGER_MUTABLE",
    "FORECASTS_MODIFY_ALLOCATIONS",
    "SCHEDULING_DEPENDS_ON_TIMING",
    "REGIONAL_ASSIGNMENT_NOT_VALIDATED",
    "PHASE_17_3_REGISTRY_NOT_VALID",
  ] as const)("fails certification for %s", (scenario: ResourceSchedulingCapacityFailure) => {
    const result = runResourceSchedulingCapacityManagement({ scenario });
    const validation = validateResourceSchedulingCapacityManagement(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested allocation record tampering", () => {
    const result = runResourceSchedulingCapacityManagement();
    const tampered = {
      ...result,
      allocation_record: {
        ...result.allocation_record,
        approved_capacity: 999,
      },
    };

    expect(validateResourceSchedulingCapacityManagement(tampered).valid).toBe(false);
  });
});
