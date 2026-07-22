import { describe, expect, it } from "vitest";
import {
  getAmendmentAddendumManagementBundle,
  replayAmendmentAddendumManagement,
  runAmendmentAddendumManagement,
  validateAmendmentAddendumManagement,
} from "@/services/amendment-addendum-management";
import type { AmendmentAddendumScenario } from "@/types/amendment-addendum-management";

describe("Mission Control Phase 13.10 Amendment & Addendum Management", () => {
  it("publishes amendment/addendum governance doctrine", () => {
    const bundle = getAmendmentAddendumManagementBundle();

    expect(bundle.doctrine.version).toBe("amendment-addendum-management/v13.10");
    expect(bundle.doctrine.change_types).toEqual(["AMENDMENT", "ADDENDUM", "RECONCILIATION_AMENDMENT"]);
    expect(bundle.doctrine.compatibility_outcomes).toEqual(["COMPATIBLE", "CONDITIONALLY_COMPATIBLE", "INCOMPATIBLE"]);
    expect(bundle.doctrine.addenda_extend_semantics).toBe(true);
    expect(bundle.doctrine.amendments_modify_semantics).toBe(true);
    expect(bundle.doctrine.reconciliation_resolves_conflicts).toBe(true);
    expect(bundle.doctrine.replay_preservation_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic specification change contracts", () => {
    const first = runAmendmentAddendumManagement();
    const second = runAmendmentAddendumManagement();

    expect(first.change_contract.change_type).toBe("RECONCILIATION_AMENDMENT");
    expect(first.change_contract.specification_ref).toBe("spec:mission-control:specification-governance-framework");
    expect(first.change_contract.affected_semantics).toContain("amendment modifies semantics");
    expect(first.change_contract.affected_semantics).toContain("addendum extends semantics");
    expect(first.change_contract.governance_approval_ref).toBeTruthy();
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateAmendmentAddendumManagement(first).valid).toBe(true);
    expect(replayAmendmentAddendumManagement(first)).toBe(true);
  });

  it("governs amendment and addendum registries separately", () => {
    const result = runAmendmentAddendumManagement();

    expect(result.amendment_registry).toHaveLength(1);
    expect(result.amendment_registry[0].modified_semantic_elements).toContain("conflict resolution");
    expect(result.amendment_registry[0].immutable_after_approval).toBe(true);
    expect(result.addendum_registry).toHaveLength(1);
    expect(result.addendum_registry[0].introduced_capabilities).toContain("extended taxonomy registry");
    expect(result.addendum_registry[0].existing_behavior_invalidated).toBe(false);
    expect(result.addendum_registry[0].compatibility_guarantees).toContain("no silent redefinition");
  });

  it("processes changes deterministically and resolves conflicts explainably", () => {
    const result = runAmendmentAddendumManagement();

    expect(result.change_controller.processing_stages).toEqual(["Intake", "Validation", "Impact Analysis", "Compatibility Evaluation", "Governance Review", "Approval", "Registration", "Publication"]);
    expect(result.change_controller.completed_stages).toEqual(result.change_controller.processing_stages);
    expect(result.change_controller.workflow_deterministic).toBe(true);
    expect(result.conflict_resolution.conflict_types).toContain("SEMANTIC_CONFLICT");
    expect(result.conflict_resolution.conflicts_resolved).toBe(true);
    expect(result.conflict_resolution.historical_specifications_preserved).toBe(true);
    expect(result.conflict_resolution.lineage_preserved).toBe(true);
  });

  it("validates compatibility, lineage, replay, and ledger preservation", () => {
    const result = runAmendmentAddendumManagement();

    expect(result.compatibility_validation.outcome).toBe("COMPATIBLE");
    expect(result.compatibility_validation.replay_compatibility).toBe("COMPATIBLE");
    expect(result.lineage_graph.ancestry_complete).toBe(true);
    expect(result.lineage_graph.historical_relationships_preserved).toBe(true);
    expect(result.replay_service.historical_specification_available).toBe(true);
    expect(result.replay_service.future_amendments_ignored_for_historical_replay).toBe(true);
    expect(result.evolution_ledger).toHaveLength(8);
    expect(result.evolution_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replayable)).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
  });

  it.each([
    "CHANGE_ID_NOT_UNIQUE",
    "CHANGE_SCOPE_MISSING",
    "GOVERNANCE_APPROVAL_MISSING",
    "AMENDMENT_REGISTRY_MUTABLE",
    "ADDENDUM_INVALIDATES_PRIOR_BEHAVIOR",
    "PROCESSING_STAGE_SKIPPED",
    "CONFLICT_UNRESOLVED",
    "COMPATIBILITY_INCOMPATIBLE",
    "LINEAGE_INCOMPLETE",
    "REPLAY_PRESERVATION_FAILED",
    "EVOLUTION_LEDGER_MUTABLE",
    "HISTORICAL_SPECIFICATION_MUTATED",
    "CERTIFICATION_REPRODUCTION_FAILED",
  ] as const)("fails certification for %s", (scenario: AmendmentAddendumScenario) => {
    const result = runAmendmentAddendumManagement({ scenario });
    const validation = validateAmendmentAddendumManagement(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested evolution ledger tampering", () => {
    const result = runAmendmentAddendumManagement();
    const tampered = {
      ...result,
      evolution_ledger: [
        {
          ...result.evolution_ledger[0],
          event_type: "PUBLICATION" as const,
        },
        ...result.evolution_ledger.slice(1),
      ],
    };

    expect(validateAmendmentAddendumManagement(tampered).valid).toBe(false);
  });
});
