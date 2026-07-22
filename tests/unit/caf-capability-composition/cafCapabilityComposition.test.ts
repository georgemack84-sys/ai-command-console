import { describe, expect, it } from "vitest";
import {
  getCapabilityCompositionBundle,
  replayCapabilityComposition,
  runCapabilityComposition,
  validateCapabilityComposition,
} from "@/services/caf-capability-composition";
import type { CapabilityCompositionScenario } from "@/types/caf-capability-composition";

describe("Program 3 P3.2 Capability Composition and Skill Architecture", () => {
  it("publishes doctrine that consumes Program 1 capabilities and P3.1 lifecycle", () => {
    const bundle = getCapabilityCompositionBundle();

    expect(bundle.doctrine.version).toBe("caf-capability-composition/v3.2");
    expect(bundle.doctrine.consumes_program_1_capability_atlas).toBe(true);
    expect(bundle.doctrine.consumes_agent_identity_lifecycle).toBe(true);
    expect(bundle.doctrine.owns_composition_not_capability_definitions).toBe(true);
    expect(bundle.doctrine.direct_behavior_implementation_prohibited).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic composition records and replay hashes", () => {
    const first = runCapabilityComposition();
    const second = runCapabilityComposition();

    expect(first.constitutional_ref).toBe("P3.0-CAF-CONSTITUTION-001");
    expect(first.agent_lifecycle_ref).toBe("caf-agent-identity-lifecycle/v3.1");
    expect(first.program_1_capability_atlas_ref).toBe("Program 1 - Capability Atlas");
    expect(first.composition.direct_behavior_implementation_allowed).toBe(false);
    expect(first.composition.capability_refs.every((capability) => capability.owner_program === "Program 1" && capability.certified)).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateCapabilityComposition(first).valid).toBe(true);
    expect(replayCapabilityComposition(first)).toBe(true);
  });

  it("builds skill architecture, behavior templates, and contract library", () => {
    const result = runCapabilityComposition();

    expect(result.skill_registry).toHaveLength(6);
    expect(result.skill_registry.map((skill) => skill.category)).toEqual(["ATOMIC", "COMPOSITE", "DOMAIN", "ORCHESTRATION", "UTILITY", "INFRASTRUCTURE"]);
    expect(result.skill_registry.every((skill) => skill.reusable && skill.lifecycle_state === "CERTIFIED")).toBe(true);
    expect(result.behavior_library).toHaveLength(3);
    expect(result.behavior_library.every((behavior) => behavior.canonical_capability_refs.length > 0 && !behavior.duplicate_behavior_detected)).toBe(true);
    expect(result.contract_library.every((contract) => contract.all_assemblies_governed)).toBe(true);
  });

  it("validates dependency graph, registry, evidence, replay, and certification", () => {
    const result = runCapabilityComposition();

    expect(result.dependency_graph.valid).toBe(true);
    expect(result.dependency_graph.circular_references).toHaveLength(0);
    expect(result.dependency_graph.deterministic_order).toEqual(["P1-CAP-001", "P1-CAP-002", "P1-CAP-003", "P1-CAP-004"]);
    expect(result.composition_registry.immutable).toBe(true);
    expect(result.composition_registry.replayable).toBe(true);
    expect(result.composition_evidence).toHaveLength(7);
    expect(result.replay_validation.deterministic).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "P3_1_AGENT_LIFECYCLE_INVALID",
    "UNCERTIFIED_CAPABILITY",
    "DIRECT_BEHAVIOR_IMPLEMENTATION",
    "DEPENDENCY_MISSING",
    "CIRCULAR_DEPENDENCY",
    "INCOMPATIBLE_CAPABILITY_VERSION",
    "DUPLICATE_BEHAVIOR",
    "COMPOSITION_CONTRACT_MISSING",
    "NON_DETERMINISTIC_ORDERING",
    "LINEAGE_INCOMPLETE",
    "REPLAY_DIVERGENCE",
    "REGISTRY_MUTABLE",
    "VALIDATION_EVIDENCE_MISSING",
    "GOVERNANCE_COMPLIANCE_GAP",
  ] as const)("fails certification for %s", (scenario: CapabilityCompositionScenario) => {
    const result = runCapabilityComposition({ scenario });
    const validation = validateCapabilityComposition(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runCapabilityComposition({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
