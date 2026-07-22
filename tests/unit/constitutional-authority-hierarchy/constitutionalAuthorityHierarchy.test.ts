import { describe, expect, it } from "vitest";

import {
  getConstitutionalAuthorityHierarchyContract,
  replayConstitutionalAuthorityHierarchy,
  runConstitutionalAuthorityHierarchy,
  validateConstitutionalAuthorityHierarchy,
} from "../../../services/constitutional-authority-hierarchy";
import type { AuthorityScenario } from "../../../types/constitutional-authority-hierarchy";

describe("constitutional authority hierarchy", () => {
  it("creates deterministic certified authority hierarchy", () => {
    const first = runConstitutionalAuthorityHierarchy();
    const second = runConstitutionalAuthorityHierarchy();

    expect(first.certification.status).toBe("PASS");
    expect(first.certification.certified).toBe(true);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(validateConstitutionalAuthorityHierarchy(first).valid).toBe(true);
    expect(replayConstitutionalAuthorityHierarchy(first)).toBe(true);
  });

  it("publishes authority doctrine", () => {
    const bundle = getConstitutionalAuthorityHierarchyContract();

    expect(bundle.doctrine.constitutional_supremacy).toBe(true);
    expect(bundle.doctrine.governance_subordinate_to_constitution).toBe(true);
    expect(bundle.doctrine.operator_subordinate_to_governance).toBe(true);
    expect(bundle.doctrine.assessment_advisory_only).toBe(true);
    expect(bundle.doctrine.deterministic_inheritance_required).toBe(true);
    expect(bundle.doctrine.immutable_ceilings_required).toBe(true);
    expect(bundle.doctrine.fail_closed_on_ambiguity).toBe(true);
  });

  it("models the immutable four-layer hierarchy", () => {
    const result = runConstitutionalAuthorityHierarchy();

    expect(result.contract.layers).toEqual(["CONSTITUTION", "GOVERNANCE", "OPERATOR", "ASSESSMENT"]);
    expect(result.hierarchy.nodes).toHaveLength(4);
    expect(result.hierarchy.terminates_at_constitution).toBe(true);
    expect(result.hierarchy.exactly_one_parent_per_lower_layer).toBe(true);
    expect(result.resolution.resolution_order).toEqual(result.contract.layers);
  });

  it("enforces ceilings, inheritance, and advisory-only boundaries", () => {
    const result = runConstitutionalAuthorityHierarchy();

    expect(result.ceilings.valid).toBe(true);
    expect(result.ceilings.assessment_ceiling).toBeLessThanOrEqual(result.ceilings.operator_ceiling);
    expect(result.inheritance.downward_only).toBe(true);
    expect(result.inheritance.no_skipped_layers).toBe(true);
    expect(result.advisory_boundary.advisory_only_enforced).toBe(true);
    expect(result.advisory_boundary.execution_authority_possible).toBe(false);
  });

  it("preserves replay, explainability, integrity, and registry", () => {
    const result = runConstitutionalAuthorityHierarchy();

    expect(result.replay.identical_authority_chain).toBe(true);
    expect(result.explainability.complete).toBe(true);
    expect(result.integrity.hashes_valid).toBe(true);
    expect(result.registry.authoritative_layers).toEqual(result.contract.layers);
    expect(result.registry.immutable).toBe(true);
  });

  it("runs the phase 13.1 certification suite", () => {
    const result = runConstitutionalAuthorityHierarchy();

    expect(result.certification.tests).toHaveLength(15);
    expect(result.certification.tests.every((test) => test.passed)).toBe(true);
  });

  it("fails closed for authority hierarchy violations", () => {
    const scenarios: readonly AuthorityScenario[] = [
      "CONSTITUTION_MUTABLE",
      "GOVERNANCE_EXCEEDS_CONSTITUTION",
      "OPERATOR_EXCEEDS_GOVERNANCE",
      "ASSESSMENT_EXCEEDS_OPERATOR",
      "SIBLING_AUTHORITY_PRESENT",
      "MISSING_PARENT",
      "CYCLIC_INHERITANCE",
      "SKIPPED_LAYER",
      "CEILING_MUTATED",
      "EXECUTION_AUTHORITY_PRODUCED",
      "ADVISORY_BOUNDARY_BYPASSED",
      "REPLAY_MISMATCH",
      "EXPLAINABILITY_INCOMPLETE",
      "INTEGRITY_FAILURE",
      "AMBIGUOUS_AUTHORITY",
    ];

    for (const scenario of scenarios) {
      const result = runConstitutionalAuthorityHierarchy({ scenario });

      expect(result.certification.status).toBe("FAIL");
      expect(result.certification.certified).toBe(false);
      expect(result.certification.failures).toContain(scenario);
      expect(validateConstitutionalAuthorityHierarchy(result).valid).toBe(false);
    }
  });
});
