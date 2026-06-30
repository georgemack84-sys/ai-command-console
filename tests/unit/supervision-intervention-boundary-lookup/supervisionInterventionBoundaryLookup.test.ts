import { describe, expect, it } from "vitest";
import {
  buildSupervisionInterventionBoundaryLookupObservabilitySurface,
  getSupervisionInterventionBoundaryLookupContract,
  runSupervisionInterventionBoundaryLookup,
  validateSupervisionInterventionBoundaryLookup,
} from "@/services/supervision-intervention-boundary-lookup";
import type { SupervisionInterventionBoundaryLookupErrorState, SupervisionInterventionBoundaryLookupScenario } from "@/types/supervision-intervention-boundary-lookup";

describe("Mission Control Phase 8I.5 Supervision, Intervention & Boundary Lookup", () => {
  it("defines the read-only supervision, intervention, and boundary doctrine", () => {
    const contract = getSupervisionInterventionBoundaryLookupContract();

    expect(contract.doctrine.schema_version).toBe("supervision-intervention-boundary-lookup/v8I.5");
    expect(contract.doctrine.principles).toContain("read-only");
    expect(contract.doctrine.principles).toContain("constitutionally-compliant");
    expect(contract.doctrine.lookup_types).toContain("SUPERVISION_INTERVENTION_BOUNDARY");
    expect(contract.doctrine.health_levels).toContain("CRITICAL");
    expect(contract.doctrine.intervention_types).toContain("OPERATOR_REVIEW");
    expect(contract.doctrine.boundary_types).toContain("REJECTED_HIDDEN_EXECUTION");
    expect(contract.doctrine.deterministic_ordering_keys).toEqual(["tenant_id", "mission_id", "timestamp", "autonomy_event_sequence", "record_id"]);
    expect(contract.doctrine.intervention_execution_permitted).toBe(false);
    expect(contract.doctrine.boundary_mutation_permitted).toBe(false);
  });

  it("returns a deterministic combined lookup view", () => {
    const response = runSupervisionInterventionBoundaryLookup();

    expect(response.phase_version).toBe("8I.5");
    expect(response.lookup_state).toBe("LOOKUP_RETURNED");
    expect(response.read_only).toBe(true);
    expect(response.supervision_records.map((record) => record.supervision_type)).toEqual(["DRIFT_MONITORING", "POLICY_VIOLATION", "CONSTITUTIONAL_VALIDATION", "EXECUTION_HEALTH", "RUNTIME_CONFIDENCE", "RECOMMENDATION_VALIDITY"]);
    expect(response.intervention_records.map((record) => record.intervention_type)).toEqual(["PAUSE", "ROLLBACK", "ESCALATION", "CONTAINMENT", "OPERATOR_REVIEW"]);
    expect(response.boundary_records.map((record) => record.boundary_type)).toContain("REJECTED_GOVERNANCE_BYPASS");
    expect(response.violation_records.map((record) => record.violation_type)).toContain("CONSTITUTIONAL");
    expect(response.boundary_rejection_view?.hidden_execution_detections.length).toBe(1);
    expect(response.result_hash).toBeTruthy();
    expect(response.audit_record.authorization_result).toBe("APPROVED");
  });

  it("repeats identical lookups with identical hashes and ordering", () => {
    const first = runSupervisionInterventionBoundaryLookup();
    const second = runSupervisionInterventionBoundaryLookup();

    expect(second.result_hash).toBe(first.result_hash);
    expect(second.audit_record.audit_hash).toBe(first.audit_record.audit_hash);
    expect(second.supervision_records.map((record) => record.supervision_hash)).toEqual(first.supervision_records.map((record) => record.supervision_hash));
    expect(second.boundary_records.map((record) => record.boundary_hash)).toEqual(first.boundary_records.map((record) => record.boundary_hash));
  });

  it("supports supervision-only lookup with drift, health, confidence, policy, and constitutional evidence", () => {
    const response = runSupervisionInterventionBoundaryLookup({ scenario: "SUPERVISION_LOOKUP" });

    expect(response.lookup_type).toBe("SUPERVISION");
    expect(response.intervention_records).toEqual([]);
    expect(response.boundary_records).toEqual([]);
    expect(response.supervision_records.find((record) => record.supervision_type === "DRIFT_MONITORING")?.drift_status.detected).toBe(true);
    expect(response.supervision_records.find((record) => record.supervision_type === "POLICY_VIOLATION")?.policy_validation.status).toBe("VIOLATION");
    expect(response.supervision_records.find((record) => record.supervision_type === "CONSTITUTIONAL_VALIDATION")?.constitutional_validation.status).toBe("VIOLATION");
    expect(response.supervision_records.find((record) => record.supervision_type === "EXECUTION_HEALTH")?.runtime_health).toBe("STABLE");
  });

  it("supports advisory intervention inspection without execution", () => {
    const response = runSupervisionInterventionBoundaryLookup({ scenario: "INTERVENTION_LOOKUP" });

    expect(response.lookup_type).toBe("INTERVENTION");
    expect(response.intervention_records.every((record) => record.advisory_only)).toBe(true);
    expect(response.intervention_records.find((record) => record.intervention_type === "ROLLBACK")?.checkpoint_reference).toBe("checkpoint:8i5:rollback-ready");
    expect(response.intervention_records.find((record) => record.intervention_type === "ESCALATION")?.authority_validation.operator_required).toBe(true);
    expect(response.intervention_records.find((record) => record.intervention_type === "CONTAINMENT")?.supporting_evidence).toContain("evidence:boundary:8i5");
  });

  it("supports boundary inspection and boundary rejection viewing", () => {
    const boundary = runSupervisionInterventionBoundaryLookup({ scenario: "BOUNDARY_LOOKUP" });
    const rejection = runSupervisionInterventionBoundaryLookup({ scenario: "BOUNDARY_REJECTION_VIEW" });

    expect(boundary.lookup_type).toBe("BOUNDARY");
    expect(boundary.boundary_records.find((record) => record.boundary_type === "TENANT_ISOLATION")?.tenant_isolation_status).toBe("IN_SCOPE");
    expect(boundary.boundary_records.filter((record) => record.evaluation_result === "REJECTED").length).toBe(3);
    expect(rejection.lookup_type).toBe("BOUNDARY_REJECTION");
    expect(rejection.boundary_rejection_view?.rejected_authority_requests.length).toBe(1);
    expect(rejection.boundary_rejection_view?.governance_denials.length).toBe(1);
    expect(rejection.boundary_rejection_view?.replay_reference).toBe(rejection.replay_reference);
  });

  it("supports runtime violation search with intervention references", () => {
    const response = runSupervisionInterventionBoundaryLookup({ scenario: "RUNTIME_VIOLATION_SEARCH" });

    expect(response.lookup_type).toBe("RUNTIME_VIOLATION");
    expect(response.violation_records.length).toBeGreaterThan(0);
    expect(response.violation_records.map((record) => record.violation_type)).toEqual(["DRIFT", "POLICY", "CONSTITUTIONAL", "CONFIDENCE_DEGRADATION"]);
    expect(response.violation_records.every((record) => record.associated_intervention.startsWith("intervention:8i5:"))).toBe(true);
    expect(response.violation_records.every((record) => record.replay_reference === response.replay_reference)).toBe(true);
  });

  it("supports historical reconstruction across all evidence classes", () => {
    const response = runSupervisionInterventionBoundaryLookup({ scenario: "HISTORICAL_RECONSTRUCTION" });

    expect(response.lookup_type).toBe("HISTORICAL_RECONSTRUCTION");
    expect(response.supervision_records.length).toBeGreaterThan(0);
    expect(response.intervention_records.length).toBeGreaterThan(0);
    expect(response.boundary_records.length).toBeGreaterThan(0);
    expect(response.violation_records.length).toBeGreaterThan(0);
    expect(response.boundary_rejection_view).toBeTruthy();
  });

  it.each([
    ["SUPERVISION_RECORD_NOT_FOUND", "SUPERVISION_RECORD_NOT_FOUND"],
    ["INTERVENTION_RECORD_NOT_FOUND", "INTERVENTION_RECORD_NOT_FOUND"],
    ["BOUNDARY_EVENT_NOT_FOUND", "BOUNDARY_EVENT_NOT_FOUND"],
    ["MISSION_NOT_FOUND", "MISSION_NOT_FOUND"],
    ["UNAUTHORIZED", "UNAUTHORIZED"],
    ["TENANT_SCOPE_VIOLATION", "TENANT_SCOPE_VIOLATION"],
    ["MISSION_SCOPE_VIOLATION", "MISSION_SCOPE_VIOLATION"],
    ["INVALID_BOUNDARY_REFERENCE", "INVALID_BOUNDARY_REFERENCE"],
    ["INVALID_POLICY_REFERENCE", "INVALID_POLICY_REFERENCE"],
    ["INVALID_CONSTITUTION_REFERENCE", "INVALID_CONSTITUTION_REFERENCE"],
    ["REPLAY_REFERENCE_INVALID", "REPLAY_REFERENCE_INVALID"],
    ["LINEAGE_REFERENCE_INVALID", "LINEAGE_REFERENCE_INVALID"],
    ["ORDERING_FAILURE", "ORDERING_FAILURE"],
    ["VALIDATION_FAILURE", "VALIDATION_FAILURE"],
    ["MUTATION_ATTEMPT", "VALIDATION_FAILURE"],
  ] as readonly [SupervisionInterventionBoundaryLookupScenario, SupervisionInterventionBoundaryLookupErrorState][])(
    "maps %s to %s deterministically",
    (scenario, state) => {
      const response = runSupervisionInterventionBoundaryLookup({ scenario });
      const validation = validateSupervisionInterventionBoundaryLookup({ scenario });

      expect(response.lookup_state).toBe(state);
      expect(validation.valid).toBe(false);
      expect(response.audit_record.authorization_result).toBe("REJECTED");
      expect(response.failures.length).toBeGreaterThan(0);
    },
  );

  it("exposes operator diagnostics for lookup failures", () => {
    const surface = buildSupervisionInterventionBoundaryLookupObservabilitySurface({ scenario: "TENANT_SCOPE_VIOLATION" });

    expect(surface.lookup_state).toBe("TENANT_SCOPE_VIOLATION");
    expect(surface.errors).toContain("TENANT_SCOPE_VIOLATION");
    expect(surface.supervision_records).toBe(0);
    expect(surface.audit_hash).toBeTruthy();
  });
});
