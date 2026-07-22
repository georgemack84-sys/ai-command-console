import { describe, expect, it } from "vitest";
import {
  getSpecificationGovernanceFrameworkBundle,
  replaySpecificationGovernanceFramework,
  runSpecificationGovernanceFramework,
  validateSpecificationGovernanceFramework,
} from "@/services/specification-governance-framework";
import type { SpecificationGovernanceScenario } from "@/types/specification-governance-framework";

describe("Mission Control Phase 13.8 Specification Governance Framework", () => {
  it("publishes the closed lifecycle doctrine", () => {
    const bundle = getSpecificationGovernanceFrameworkBundle();

    expect(bundle.doctrine.version).toBe("specification-governance-framework/v13.8");
    expect(bundle.doctrine.lifecycle_states).toEqual(["DRAFT", "REVIEW", "APPROVED", "ACTIVE", "SUPERSEDED", "RETIRED", "ARCHIVED"]);
    expect(bundle.doctrine.immutable_specifications_required).toBe(true);
    expect(bundle.doctrine.unique_ownership_required).toBe(true);
    expect(bundle.doctrine.governance_approval_required).toBe(true);
    expect(bundle.doctrine.historical_preservation_required).toBe(true);
    expect(bundle.doctrine.immutable_audit_required).toBe(true);
    expect(bundle.validation.valid).toBe(true);
  });

  it("creates deterministic governed specification artifacts", () => {
    const first = runSpecificationGovernanceFramework();
    const second = runSpecificationGovernanceFramework();

    expect(first.artifact.specification_id).toBe("spec:mission-control:assurance-governance");
    expect(first.artifact.owner_id).toBe("owner:mission-control-governance");
    expect(first.artifact.lifecycle_state).toBe("SUPERSEDED");
    expect(first.artifact.approval_refs.length).toBeGreaterThan(0);
    expect(first.artifact.integrity_hash).toBe(second.artifact.integrity_hash);
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateSpecificationGovernanceFramework(first).valid).toBe(true);
    expect(replaySpecificationGovernanceFramework(first)).toBe(true);
  });

  it("maintains authoritative registry, lifecycle, version, and ownership governance", () => {
    const result = runSpecificationGovernanceFramework();

    expect(result.registry.identities_unique).toBe(true);
    expect(result.registry.immutable_registration).toBe(true);
    expect(result.registry.replay_lookup_supported).toBe(true);
    expect(result.lifecycle_contract.legal_transitions).toContain("ACTIVE->SUPERSEDED");
    expect(result.lifecycle_contract.transition_legal).toBe(true);
    expect(result.version_governance.immutable_after_approval).toBe(true);
    expect(result.version_governance.permanent_identifier).toContain("@1.0.0");
    expect(result.ownership.owner_count).toBe(1);
    expect(result.ownership.transfer_governance_approved).toBe(true);
  });

  it("enforces approval workflow and preserves supersession history", () => {
    const result = runSpecificationGovernanceFramework();

    expect(result.approval_workflow.approval_decision).toBe("APPROVED");
    expect(result.approval_workflow.governance_approval_ref).toBeTruthy();
    expect(result.approval_workflow.version_registration_ref).toBe("version:1.0.0");
    expect(result.supersession.previous_version_immutable).toBe(true);
    expect(result.supersession.historical_replay_preserved).toBe(true);
    expect(result.supersession.historical_validity_preserved).toBe(true);
    expect(result.supersession.immutable_relationship).toBe(true);
  });

  it("verifies integrity, replay, ledger, and certification", () => {
    const result = runSpecificationGovernanceFramework();

    expect(result.integrity_validation.integrity_hash_verification).toBe("VERIFIED");
    expect(result.integrity_validation.ownership_validation).toBe("VERIFIED");
    expect(result.integrity_validation.governance_evidence_validation).toBe("VERIFIED");
    expect(result.governance_ledger).toHaveLength(10);
    expect(result.governance_ledger.every((entry, index) => entry.sequence === index + 1 && entry.append_only && entry.immutable && entry.replayable)).toBe(true);
    expect(result.replay_validation.lifecycle_reproduced).toBe(true);
    expect(result.replay_validation.certification_reproduced).toBe(true);
    expect(result.certification.outcome).toBe("PASS");
    expect(result.certification.certified).toBe(true);
  });

  it.each([
    "MUTABLE_APPROVED_VERSION",
    "DUPLICATE_SPECIFICATION_ID",
    "INVALID_LIFECYCLE_TRANSITION",
    "UNAPPROVED_CHANGE",
    "OWNERSHIP_NOT_UNIQUE",
    "OWNERSHIP_TRANSFER_UNAPPROVED",
    "VERSION_LINEAGE_INCOMPLETE",
    "DEPENDENCY_COMPATIBILITY_INVALID",
    "SUPERSESSION_HISTORY_MISSING",
    "INTEGRITY_HASH_MISMATCH",
    "REPLAY_RECONSTRUCTION_FAILED",
    "GOVERNANCE_LEDGER_MUTABLE",
  ] as const)("fails certification for %s", (scenario: SpecificationGovernanceScenario) => {
    const result = runSpecificationGovernanceFramework({ scenario });
    const validation = validateSpecificationGovernanceFramework(result);

    expect(result.certification.outcome).toBe("FAIL");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("supports PRUNED certification outcome", () => {
    const result = runSpecificationGovernanceFramework({ scenario: "CERTIFICATION_PRUNED" });

    expect(result.certification.outcome).toBe("PRUNED");
    expect(result.certification.certified).toBe(false);
    expect(result.certification.failures).toContain("CERTIFICATION_PRUNED");
  });

  it("detects nested governance ledger tampering", () => {
    const result = runSpecificationGovernanceFramework();
    const tampered = {
      ...result,
      governance_ledger: [
        {
          ...result.governance_ledger[0],
          event_ref: "tampered-event",
        },
        ...result.governance_ledger.slice(1),
      ],
    };

    expect(validateSpecificationGovernanceFramework(tampered).valid).toBe(false);
  });
});
