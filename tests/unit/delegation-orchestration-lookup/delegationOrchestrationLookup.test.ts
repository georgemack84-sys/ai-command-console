import { describe, expect, it } from "vitest";
import {
  buildDelegationOrchestrationLookupObservabilitySurface,
  getDelegationOrchestrationLookupContract,
  runDelegationOrchestrationLookup,
  validateDelegationOrchestrationLookup,
} from "@/services/delegation-orchestration-lookup";
import type { DelegationOrchestrationLookupErrorState, DelegationOrchestrationLookupScenario } from "@/types/delegation-orchestration-lookup";

describe("Mission Control Phase 8I.4 Delegation & Orchestration Lookup", () => {
  it("defines the read-only delegation and orchestration doctrine", () => {
    const contract = getDelegationOrchestrationLookupContract();

    expect(contract.doctrine.schema_version).toBe("delegation-orchestration-lookup/v8I.4");
    expect(contract.doctrine.principles).toContain("read-only");
    expect(contract.doctrine.principles).toContain("lineage-preserving");
    expect(contract.doctrine.lookup_types).toContain("DELEGATION_AND_ORCHESTRATION");
    expect(contract.doctrine.delegation_task_types).toContain("EXTERNAL_SYSTEM");
    expect(contract.doctrine.orchestration_states).toContain("ROLLBACK_READY");
    expect(contract.doctrine.deterministic_ordering_keys).toEqual(["tenant_id", "mission_id", "workflow_id", "timestamp", "autonomy_event_sequence", "record_id"]);
    expect(contract.doctrine.mutation_permitted).toBe(false);
  });

  it("returns a deterministic combined delegation and orchestration view", () => {
    const response = runDelegationOrchestrationLookup();

    expect(response.phase_version).toBe("8I.4");
    expect(response.lookup_state).toBe("LOOKUP_RETURNED");
    expect(response.read_only).toBe(true);
    expect(response.delegation_records.map((record) => record.task_type)).toEqual(["OPERATOR", "AGENT", "EXTERNAL_SYSTEM", "DEFERRED", "BLOCKED"]);
    expect(response.orchestration_records.map((record) => record.orchestration_state)).toEqual(["CREATED", "READY", "SCHEDULED", "RUNNING", "CHECKPOINTED", "WAITING", "ROLLBACK_READY"]);
    expect(response.dependency_records.some((record) => record.blocking_status === "BLOCKING_WORKFLOW")).toBe(true);
    expect(response.checkpoint_records.some((record) => record.rollback_eligible)).toBe(true);
    expect(response.routing_view?.selected_route).toBe("certified-agent-route");
    expect(response.result_hash).toBeTruthy();
    expect(response.audit_record.authorization_result).toBe("APPROVED");
  });

  it("repeats identical lookups with identical hashes and ordering", () => {
    const first = runDelegationOrchestrationLookup();
    const second = runDelegationOrchestrationLookup();

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.delegation_records.map((record) => record.delegation_hash)).toEqual(first.delegation_records.map((record) => record.delegation_hash));
    expect(second.orchestration_records.map((record) => record.orchestration_hash)).toEqual(first.orchestration_records.map((record) => record.orchestration_hash));
  });

  it("supports delegation-only lookup across operator, agent, external, deferred, and blocked tasks", () => {
    const response = runDelegationOrchestrationLookup({ scenario: "DELEGATION_LOOKUP" });

    expect(response.lookup_type).toBe("DELEGATION");
    expect(response.orchestration_records).toEqual([]);
    expect(response.delegation_records.find((record) => record.task_type === "OPERATOR")?.authority_validation.operator_authority).toBe("REQUIRED_AND_VERIFIED");
    expect(response.delegation_records.find((record) => record.task_type === "AGENT")?.assigned_to).toBe("agent:certified:runtime-supervisor");
    expect(response.delegation_records.find((record) => record.task_type === "EXTERNAL_SYSTEM")?.assignment_type).toBe("APPROVED_EXTERNAL_SYSTEM");
    expect(response.delegation_records.find((record) => record.task_type === "DEFERRED")?.deferred_reason).toBe("WAITING_FOR_POLICY_CLEARANCE");
    expect(response.delegation_records.find((record) => record.task_type === "BLOCKED")?.blocked_reason).toBe("POLICY_REJECTION");
  });

  it("supports routing decision inspection", () => {
    const response = runDelegationOrchestrationLookup({ scenario: "ROUTING_VIEW" });

    expect(response.lookup_type).toBe("ROUTING");
    expect(response.routing_view?.selected_route).toBe("certified-agent-route");
    expect(response.routing_view?.rejected_routes).toContain("route:unverified-agent");
    expect(response.routing_view?.fallback_route).toBe("operator-approval-route");
    expect(response.routing_view?.governance_constraints).toContain("read-only-lookup");
    expect(response.dependency_records).toEqual([]);
  });

  it("supports dependency search and checkpoint query models", () => {
    const dependency = runDelegationOrchestrationLookup({ scenario: "DEPENDENCY_SEARCH" });
    const checkpoint = runDelegationOrchestrationLookup({ scenario: "CHECKPOINT_QUERY" });

    expect(dependency.lookup_type).toBe("DEPENDENCY");
    expect(dependency.dependency_records.map((record) => record.dependency_status)).toEqual(["SATISFIED", "SATISFIED", "WAITING", "FAILED"]);
    expect(checkpoint.lookup_type).toBe("CHECKPOINT");
    expect(checkpoint.checkpoint_records[0].checkpoint_state).toBe("VERIFIED");
    expect(checkpoint.checkpoint_records[1].rollback_eligible).toBe(true);
    expect(checkpoint.checkpoint_records.every((record) => record.replay_reference === checkpoint.replay_reference)).toBe(true);
  });

  it("reconstructs orchestration timelines with replay and lineage references", () => {
    const response = runDelegationOrchestrationLookup({ scenario: "TIMELINE_RECONSTRUCTION" });

    expect(response.lookup_type).toBe("TIMELINE");
    expect(response.timeline.length).toBe(response.orchestration_records.length);
    expect(response.timeline.every((event, index) => event.task_sequence === index + 1)).toBe(true);
    expect(response.timeline.every((event) => event.replay_reference === response.replay_reference)).toBe(true);
    expect(response.timeline.map((event) => event.state)).toContain("ROLLBACK_READY");
  });

  it.each([
    ["DELEGATION_NOT_FOUND", "DELEGATION_NOT_FOUND"],
    ["ORCHESTRATION_EVENT_NOT_FOUND", "ORCHESTRATION_EVENT_NOT_FOUND"],
    ["TASK_NOT_FOUND", "TASK_NOT_FOUND"],
    ["WORKFLOW_NOT_FOUND", "WORKFLOW_NOT_FOUND"],
    ["CHECKPOINT_NOT_FOUND", "CHECKPOINT_NOT_FOUND"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["WORKFLOW_SCOPE_VIOLATION", "WORKFLOW_SCOPE_VIOLATION"],
    ["INVALID_AUTHORITY_REFERENCE", "INVALID_AUTHORITY_REFERENCE"],
    ["INVALID_DEPENDENCY_REFERENCE", "INVALID_DEPENDENCY_REFERENCE"],
    ["INVALID_CHECKPOINT_REFERENCE", "INVALID_CHECKPOINT_REFERENCE"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILURE"],
    ["POLICY_REJECTION", "POLICY_REJECTION"],
    ["CONSTITUTIONAL_REJECTION", "CONSTITUTIONAL_REJECTION"],
    ["MUTATION_ATTEMPT", "VALIDATION_FAILURE"],
  ] as readonly [DelegationOrchestrationLookupScenario, DelegationOrchestrationLookupErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runDelegationOrchestrationLookup({ scenario });
      const validation = validateDelegationOrchestrationLookup({ scenario });

      expect(response.lookup_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.authorization_result).toBe("REJECTED");
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator diagnostics for lookup failures", () => {
    const surface = buildDelegationOrchestrationLookupObservabilitySurface({ scenario: "WORKFLOW_SCOPE_VIOLATION" });

    expect(surface.lookup_state).toBe("WORKFLOW_SCOPE_VIOLATION");
    expect(surface.errors).toContain("WORKFLOW_SCOPE_VIOLATION");
    expect(surface.delegation_records).toBe(0);
    expect(surface.audit_hash).toBeTruthy();
  });
});
