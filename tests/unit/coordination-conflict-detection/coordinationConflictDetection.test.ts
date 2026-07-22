import { describe, expect, it } from "vitest";
import {
  assessSeverity,
  buildConflictObservabilitySurface,
  classifyConflict,
  detectConflict,
  escalateConflict,
  generateResolution,
  getCoordinationConflictDetection,
  monitorCoordination,
  validateConflictDetection,
  validateConflictReplay,
} from "@/services/coordination-conflict-detection";
import type { ConflictFailure, ConflictScenario } from "@/types/coordination-conflict-detection";

describe("coordination conflict detection", () => {
  it("publishes the 8ALT.7.8 certified doctrine bundle", () => {
    const bundle = getCoordinationConflictDetection();

    expect(bundle.doctrine.contract_version).toBe("coordination-conflict-detection/v8ALT.7.8");
    expect(bundle.doctrine.final_state).toBe("COORDINATION_CONFLICT_DETECTION_CERTIFIED");
    expect(bundle.validation.valid).toBe(true);
    expect(bundle.analysis.state).toBe("CERTIFIED");
  });

  it("creates a valid conflict detection contract and monitoring surface", () => {
    const analysis = monitorCoordination();
    const validation = validateConflictDetection(analysis);

    expect(validation.contract_valid).toBe(true);
    expect(analysis.monitored_domains).toHaveLength(10);
    expect(analysis.contract.immutable).toBe(true);
    expect(analysis.contract.append_only).toBe(true);
  });

  it.each([
    ["PLANNING_CONFLICT", "PLANNING"],
    ["AUTHORITY_OVERLAP", "AUTHORITY"],
    ["OWNERSHIP_CONFLICT", "OWNERSHIP"],
    ["RESOURCE_CONFLICT", "RESOURCE"],
    ["GOVERNANCE_CONFLICT", "GOVERNANCE"],
    ["DEPENDENCY_CONFLICT", "DEPENDENCY"],
    ["TENANT_BOUNDARY_CONFLICT", "TENANT"],
  ] as const)("detects and classifies %s", (scenario, category) => {
    const conflicts = detectConflict({ scenario });

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].conflict_category).toBe(category);
    expect(validateConflictDetection(monitorCoordination({ scenario })).valid).toBe(true);
  });

  it("generates deterministic severity, resolution, escalation, replay, and evidence", () => {
    const input = { scenario: "TENANT_BOUNDARY_CONFLICT" as const };

    expect(classifyConflict(input)[0].category).toBe("TENANT");
    expect(assessSeverity(input)[0].severity).toBe("CRITICAL");
    expect(generateResolution(input)[0].recommended_resolution).toBe("TERMINATE_COORDINATION");
    expect(escalateConflict(input)[0]).toMatchObject({ escalation_target: "Operator", governance_validated: true });
    expect(validateConflictReplay(input).replay_references_preserved).toBe(true);
  });

  it.each([
    ["UNDETECTED_PLANNING_CONFLICT", "UNDETECTED_PLANNING_CONFLICT"],
    ["UNDETECTED_AUTHORITY_OVERLAP", "UNDETECTED_AUTHORITY_OVERLAP"],
    ["DUPLICATE_OWNERSHIP_UNDETECTED", "DUPLICATE_OWNERSHIP_UNDETECTED"],
    ["UNDETECTED_RESOURCE_CONFLICT", "UNDETECTED_RESOURCE_CONFLICT"],
    ["GOVERNANCE_CONFLICT_MISSED", "GOVERNANCE_CONFLICT_MISSED"],
    ["DEPENDENCY_CONFLICT_MISSED", "DEPENDENCY_CONFLICT_MISSED"],
    ["CROSS_TENANT_CONFLICT_MISSED", "CROSS_TENANT_CONFLICT_MISSED"],
    ["INCONSISTENT_SEVERITY", "INCONSISTENT_SEVERITY_ASSIGNMENT"],
    ["ROUTING_FAILURE", "CONFLICT_ROUTING_FAILED"],
    ["GOVERNANCE_ESCALATION_BYPASS", "GOVERNANCE_ESCALATION_BYPASSED"],
    ["REPLAY_INCONSISTENCY", "REPLAY_INCONSISTENCY_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
  ] satisfies [ConflictScenario, ConflictFailure][])("fails closed for %s", (scenario, failure) => {
    const validation = validateConflictDetection(monitorCoordination({ scenario }));

    expect(validation.valid).toBe(false);
    expect(validation.fail_closed).toBe(true);
    expect(validation.failures).toContain(failure);
  });

  it("publishes conflict observability", () => {
    const surface = buildConflictObservabilitySurface(monitorCoordination({ scenario: "AUTHORITY_OVERLAP" }));

    expect(surface.state).toBe("CONFLICT_DETECTED");
    expect(surface.monitored_domain_count).toBe(10);
    expect(surface.conflict_count).toBe(1);
    expect(surface.critical_count).toBe(1);
    expect(surface.contract_hash).toBeTruthy();
  });
});
