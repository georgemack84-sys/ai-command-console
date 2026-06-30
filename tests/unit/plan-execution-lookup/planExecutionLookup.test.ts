import { describe, expect, it } from "vitest";
import {
  buildPlanExecutionLookupObservabilitySurface,
  getPlanExecutionLookupContract,
  runPlanExecutionLookup,
  validatePlanExecutionLookup,
} from "@/services/plan-execution-lookup";
import type { PlanExecutionLookupErrorState, PlanExecutionLookupScenario } from "@/types/plan-execution-lookup";

describe("Mission Control Phase 8I.3 Plan & Execution Lookup", () => {
  it("defines the lookup doctrine and execution states", () => {
    const contract = getPlanExecutionLookupContract();

    expect(contract.doctrine.schema_version).toBe("plan-execution-lookup/v8I.3");
    expect(contract.doctrine.principles).toContain("read-only");
    expect(contract.doctrine.principles).toContain("replayable");
    expect(contract.doctrine.lookup_types).toContain("PLAN_AND_EXECUTION");
    expect(contract.doctrine.execution_states).toContain("ROLLED_BACK");
    expect(contract.doctrine.no_execution_permitted).toBe(true);
  });

  it("returns a deterministic combined plan and execution view", () => {
    const response = runPlanExecutionLookup();

    expect(response.phase_version).toBe("8I.3");
    expect(response.lookup_state).toBe("LOOKUP_RETURNED");
    expect(response.read_only).toBe(true);
    expect(response.plan_record?.selected_plan).toBe("sequential-governed-execution");
    expect(response.execution_record?.execution_state).toBe("COMPLETED");
    expect(response.timeline.map((event) => event.execution_state)).toEqual(["PLANNED", "READY", "RUNNING", "RUNNING", "COMPLETED"]);
    expect(response.failure_inspection).toBeNull();
    expect(response.result_hash).toBeTruthy();
    expect(response.audit_record.authorization_result).toBe("APPROVED");
  });

  it("repeats identical lookups with identical hashes and ordering", () => {
    const first = runPlanExecutionLookup();
    const second = runPlanExecutionLookup();

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.timeline.map((event) => event.event_hash)).toEqual(first.timeline.map((event) => event.event_hash));
  });

  it("supports plan-only lookup with planning rationale, alternatives, and governance evidence", () => {
    const response = runPlanExecutionLookup({ lookup_type: "PLAN", scenario: "PLAN_LOOKUP" });

    expect(response.execution_record).toBeNull();
    expect(response.timeline).toEqual([]);
    expect(response.plan_record?.decomposed_objectives.length).toBeGreaterThan(0);
    expect(response.plan_record?.alternative_plans[0].rejection_reason).toContain("ordering");
    expect(response.plan_record?.governance_result.governance_approval).toBe("APPROVED");
  });

  it("supports execution timeline lookup", () => {
    const response = runPlanExecutionLookup({ scenario: "TIMELINE_LOOKUP" });

    expect(response.lookup_type).toBe("TIMELINE");
    expect(response.execution_record?.checkpoint_reference).toBeTruthy();
    expect(response.timeline.length).toBeGreaterThan(0);
    expect(response.timeline.every((event, index) => event.event_sequence === index + 1)).toBe(true);
  });

  it("inspects failures with rollback visibility and recovery guidance", () => {
    const response = runPlanExecutionLookup({ scenario: "FAILURE_INSPECTION" });

    expect(response.lookup_type).toBe("FAILURE");
    expect(response.execution_record?.execution_state).toBe("FAILED");
    expect(response.execution_record?.rollback_status).toBe("COMPLETED");
    expect(response.failure_inspection?.failure_classification).toBe("DEPENDENCY_FAILURE");
    expect(response.failure_inspection?.rollback_readiness).toBe("READY");
    expect(response.timeline.map((event) => event.execution_state)).toContain("ROLLED_BACK");
  });

  it.each([
    ["PLAN_NOT_FOUND", "PLAN_NOT_FOUND"],
    ["EXECUTION_NOT_FOUND", "EXECUTION_NOT_FOUND"],
    ["MISSION_NOT_FOUND", "MISSION_NOT_FOUND"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["INVALID_EXECUTION_STATE", "INVALID_EXECUTION_STATE"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILURE"],
    ["POLICY_REJECTION", "POLICY_REJECTION"],
    ["CONSTITUTIONAL_REJECTION", "CONSTITUTIONAL_REJECTION"],
    ["MUTATION_ATTEMPT", "VALIDATION_FAILURE"],
  ] as readonly [PlanExecutionLookupScenario, PlanExecutionLookupErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runPlanExecutionLookup({ scenario });
      const validation = validatePlanExecutionLookup({ scenario });

      expect(response.lookup_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.authorization_result).toBe("REJECTED");
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator diagnostics for lookup failures", () => {
    const surface = buildPlanExecutionLookupObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.lookup_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.has_plan).toBe(false);
    expect(surface.audit_hash).toBeTruthy();
  });
});
