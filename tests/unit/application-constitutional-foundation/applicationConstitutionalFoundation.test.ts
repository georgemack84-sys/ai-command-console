import { describe, expect, it } from "vitest";
import {
  getApplicationConstitutionalFoundationBundle,
  replayApplicationConstitutionalFoundation,
  runApplicationConstitutionalFoundation,
  validateApplicationConstitutionalFoundation,
} from "@/services/application-constitutional-foundation";
import type { ApplicationFoundationScenario } from "@/types/application-constitutional-foundation";

describe("Program 4 P4.1 Application Constitutional Foundation and Boundary", () => {
  it("publishes application doctrine without implementing application functionality or overriding Programs 1-3", () => {
    const bundle = getApplicationConstitutionalFoundationBundle();

    expect(bundle.doctrine.version).toBe("application-constitutional-foundation/v4.1");
    expect(bundle.doctrine.owns_application_doctrine).toBe(true);
    expect(bundle.doctrine.owns_application_boundaries).toBe(true);
    expect(bundle.doctrine.owns_application_ownership_model).toBe(true);
    expect(bundle.doctrine.owns_application_taxonomy).toBe(true);
    expect(bundle.doctrine.owns_namespace_governance).toBe(true);
    expect(bundle.doctrine.implements_application_functionality).toBe(false);
    expect(bundle.doctrine.overrides_program_1_2_3_authority).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("establishes deterministic application constitutional foundation from inherited authority", () => {
    const first = runApplicationConstitutionalFoundation();
    const second = runApplicationConstitutionalFoundation();

    expect(first.program_1_constitution_ref).toBe("Program 1 - Constitutional Baseline");
    expect(first.program_2_governance_ref).toBe("Program 2 - Constitutional Governance");
    expect(first.program_3_boundary_ref).toBe("caf-program-qualification/v3.18");
    expect(first.inheritance.hierarchy).toEqual([
      "Program 1 Constitution",
      "Program 2 Platform Constitution",
      "Program 3 Agent Constitution",
      "Program 4 Application Constitution",
    ]);
    expect(first.inheritance.extension_allowed).toBe(true);
    expect(first.inheritance.override_allowed).toBe(false);
    expect(first.inheritance.weakening_allowed).toBe(false);
    expect(first.certification.outcome).toBe("PASS");
    expect(first.certification.phase_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationConstitutionalFoundation(first).valid).toBe(true);
    expect(replayApplicationConstitutionalFoundation(first)).toBe(true);
  });

  it("enforces boundaries, ownership, taxonomy, namespace governance, constraints, and immutable evidence", () => {
    const result = runApplicationConstitutionalFoundation();

    expect(result.boundary_model.complete).toBe(true);
    expect(result.boundary_model.non_overlapping).toBe(true);
    expect(result.ownership_registry.complete).toBe(true);
    expect(result.ownership_registry.shared_ownership_governed).toBe(true);
    expect(result.taxonomy.categories).toHaveLength(8);
    expect(result.taxonomy.extensible_through_governance).toBe(true);
    expect(result.constraints.enforced).toBe(true);
    expect(result.namespace_governance.operational).toBe(true);
    expect(result.evidence.complete).toBe(true);
    expect(result.evidence.immutable).toBe(true);
    expect(result.evidence.lineage_refs.length).toBe(3);
  });

  it.each([
    "PROGRAM_1_CONSTITUTION_INVALID",
    "PROGRAM_2_GOVERNANCE_INVALID",
    "PROGRAM_3_BOUNDARY_INVALID",
    "CONSTITUTIONAL_BEHAVIOR_DEFINED_INDEPENDENTLY",
    "CONSTITUTIONAL_INHERITANCE_WEAKENED",
    "APPLICATION_FUNCTIONALITY_IMPLEMENTED",
    "BOUNDARY_MODEL_INCOMPLETE",
    "BOUNDARY_OVERLAP_DETECTED",
    "CAPABILITY_OUTSIDE_BOUNDARY",
    "OWNERSHIP_INCOMPLETE",
    "SHARED_OWNERSHIP_UNGOVERNED",
    "TAXONOMY_INCOMPLETE",
    "TAXONOMY_UNGOVERNED_EXTENSION",
    "ARCHITECTURAL_CONSTRAINTS_MISSING",
    "CONSTRAINT_VIOLATION_ALLOWED",
    "NAMESPACE_COLLISION",
    "NAMESPACE_LIFECYCLE_MISSING",
    "VALIDATION_REPORT_MISSING",
    "CONSTITUTIONAL_EVIDENCE_MISSING",
    "CONSTITUTIONAL_EVIDENCE_MUTABLE",
    "PHASE_CERTIFICATION_FAILED",
  ] as const)("fails phase certification for %s", (scenario: ApplicationFoundationScenario) => {
    const result = runApplicationConstitutionalFoundation({ scenario });
    const validation = validateApplicationConstitutionalFoundation(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runApplicationConstitutionalFoundation({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
