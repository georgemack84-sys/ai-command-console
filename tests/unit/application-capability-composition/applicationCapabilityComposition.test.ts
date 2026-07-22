import { describe, expect, it } from "vitest";
import {
  getApplicationCapabilityCompositionBundle,
  replayApplicationCapabilityComposition,
  runApplicationCapabilityComposition,
  validateApplicationCapabilityComposition,
} from "@/services/application-capability-composition";
import type { ApplicationCapabilityCompositionScenario } from "@/types/application-capability-composition";

describe("Program 4 P4.3 Capability Mapping and Composition", () => {
  it("publishes composition doctrine without creating capabilities, executing capabilities, deploying, owning metadata, or duplicating CAF logic", () => {
    const bundle = getApplicationCapabilityCompositionBundle();

    expect(bundle.doctrine.version).toBe("application-capability-composition/v4.3");
    expect(bundle.doctrine.owns_capability_mapping).toBe(true);
    expect(bundle.doctrine.owns_capability_composition).toBe(true);
    expect(bundle.doctrine.owns_dependency_validation).toBe(true);
    expect(bundle.doctrine.owns_application_capability_architecture).toBe(true);
    expect(bundle.doctrine.creates_new_capabilities).toBe(false);
    expect(bundle.doctrine.modifies_program_1_capabilities).toBe(false);
    expect(bundle.doctrine.executes_capabilities).toBe(false);
    expect(bundle.doctrine.owns_runtime_orchestration).toBe(false);
    expect(bundle.doctrine.performs_deployment).toBe(false);
    expect(bundle.doctrine.owns_application_metadata).toBe(false);
    expect(bundle.doctrine.duplicates_caf_composition_logic).toBe(false);
    expect(bundle.validation.valid).toBe(true);
  });

  it("maps Program 1 capabilities into deterministic application composition", () => {
    const first = runApplicationCapabilityComposition();
    const second = runApplicationCapabilityComposition();

    expect(first.application_registry_ref).toBe("application-registry-catalog/v4.2");
    expect(first.program_1_capability_atlas_ref).toBe("Program 1 - Capability Atlas");
    expect(first.caf_composition_contracts_ref).toBe("caf-capability-composition/v3.2");
    expect(first.capability_map.application_id).toBe("civitas.app.ops.command-console");
    expect(first.capability_map.mapped_capability_refs.length).toBeGreaterThan(0);
    expect(first.capability_map.approved_capabilities_only).toBe(true);
    expect(first.composition_graph.valid).toBe(true);
    expect(first.certification.outcome).toBe("PASS");
    expect(first.certification.phase_ready).toBe(true);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateApplicationCapabilityComposition(first).valid).toBe(true);
    expect(replayApplicationCapabilityComposition(first)).toBe(true);
  });

  it("enforces dependency validation, contracts, architecture, lineage, and governance evidence", () => {
    const result = runApplicationCapabilityComposition();

    expect(result.dependency_map.complete).toBe(true);
    expect(result.dependency_map.missing_dependencies).toHaveLength(0);
    expect(result.dependency_map.circular_dependencies).toHaveLength(0);
    expect(result.contract_registry.complete).toBe(true);
    expect(result.contract_registry.deterministic).toBe(true);
    expect(result.contract_registry.versioned).toBe(true);
    expect(result.architecture.complete).toBe(true);
    expect(result.validation_report.result).toBe("PASS");
    expect(result.lineage.complete).toBe(true);
    expect(result.lineage.immutable).toBe(true);
    expect(result.governance_evidence.governance_enforced).toBe(true);
    expect(result.governance_evidence.ownership_verified).toBe(true);
  });

  it.each([
    "P4_2_REGISTRY_INVALID",
    "PROGRAM_1_CAPABILITY_ATLAS_INVALID",
    "CAF_COMPOSITION_CONTRACTS_INVALID",
    "NEW_CAPABILITY_DEFINED",
    "PROGRAM_1_CAPABILITY_MODIFIED",
    "CAPABILITY_EXECUTION_ATTEMPTED",
    "RUNTIME_ORCHESTRATION_ATTEMPTED",
    "DEPLOYMENT_ATTEMPTED",
    "APPLICATION_METADATA_OWNERSHIP_DUPLICATED",
    "CAF_COMPOSITION_LOGIC_DUPLICATED",
    "CAPABILITY_MAPPING_INCOMPLETE",
    "CAPABILITY_MAPPING_NON_DETERMINISTIC",
    "UNAPPROVED_CAPABILITY_USED",
    "COMPOSITION_INVALID",
    "REUSABLE_COMPOSITION_UNVERIFIED",
    "COMPOSITION_INHERITANCE_INVALID",
    "DEPENDENCY_MAP_INCOMPLETE",
    "UNRESOLVED_DEPENDENCY",
    "CIRCULAR_DEPENDENCY_DETECTED",
    "DEPENDENCY_COMPATIBILITY_FAILED",
    "COMPOSITION_CONTRACT_MISSING",
    "COMPOSITION_CONTRACT_NON_DETERMINISTIC",
    "COMPOSITION_CONTRACT_UNVERSIONED",
    "CAPABILITY_ARCHITECTURE_INCOMPLETE",
    "ARCHITECTURAL_BOUNDARY_INVALID",
    "TOPOLOGY_INVALID",
    "GOVERNANCE_NOT_ENFORCED",
    "OWNERSHIP_NOT_VERIFIED",
    "CONSTITUTIONAL_COMPLIANCE_FAILED",
    "CAPABILITY_LINEAGE_INCOMPLETE",
    "LINEAGE_NOT_IMMUTABLE",
    "CERTIFICATION_EVIDENCE_INCOMPLETE",
  ] as const)("fails capability composition certification for %s", (scenario: ApplicationCapabilityCompositionScenario) => {
    const result = runApplicationCapabilityComposition({ scenario });
    const validation = validateApplicationCapabilityComposition(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.phase_ready).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports pruned certification outcomes", () => {
    const result = runApplicationCapabilityComposition({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });
});
