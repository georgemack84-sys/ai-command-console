import { describe, expect, it } from "vitest";
import {
  buildTruthLineageRequest,
  sealTruthLineageContract,
} from "@/services/mission-control";
import type { TruthLineageInput } from "@/services/mission-control";

function baseLineage(overrides: Partial<TruthLineageInput> = {}) {
  return sealTruthLineageContract({
    request: buildTruthLineageRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T23:30:00.000Z",
    }),
    missionId: "mission-alpha",
    objectId: "policy-alpha",
    objectType: "POLICY",
    lineageVersion: "lineage/v1",
    parent: {
      parent_lineage_id: "lineage-root-alpha",
      parent_object_id: "root-object-alpha",
      relationship_reason: "Policy derives from tenant governance root.",
    },
    children: [{
      child_lineage_id: "lineage-rule-alpha",
      child_object_id: "rule-alpha",
      child_relationship: "Policy owns rule lineage.",
    }],
    dependencies: [{
      dependency_id: "dependency-authority-alpha",
      dependency_type: "AUTHORIZED_BY",
      dependency_lineage_id: "lineage-authority-alpha",
      dependency_object_id: "authority-alpha",
      dependency_reason: "Policy lineage is authorized by governance authority.",
    }],
    governanceInfluences: [{
      influence_id: "influence-policy-alpha",
      influence_type: "policy influence",
      influence_source_id: "governance-source-alpha",
      influence_rationale: "Governance source influenced policy lineage.",
    }],
    ownership: {
      owner_id: "owner-alpha",
      owner_type: "GOVERNANCE_ENGINE",
      ownership_timestamp: "2026-06-24T23:29:00.000Z",
      ownership_scope: "tenant-alpha",
    },
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

describe("lineageContract", () => {
  it("creates deterministic valid lineage identity", () => {
    const first = baseLineage();
    const second = baseLineage();

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.identityValid).toBe(true);
    expect(first.validation.reasonCodes).toContain("LINEAGE_ID_UNIQUE");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("fails duplicate lineage identity", () => {
    const original = baseLineage();
    const duplicate = baseLineage({
      lineageId: original.contract.lineage_id,
      priorLineageIds: [original.contract.lineage_id],
    });

    expect(duplicate.certification).toBe("FAIL");
    expect(duplicate.validation.identityValid).toBe(false);
    expect(duplicate.validation.reasonCodes).toContain("LINEAGE_ID_DUPLICATE");
  });

  it("passes valid parent relationships and fails broken parents", () => {
    const valid = baseLineage();
    const broken = baseLineage({
      invalidParentDetected: true,
    });

    expect(valid.certification).toBe("PASS");
    expect(valid.validation.reasonCodes).toContain("PARENT_RELATIONSHIP_VALID");
    expect(broken.certification).toBe("FAIL");
    expect(broken.validation.reasonCodes).toContain("PARENT_RELATIONSHIP_BROKEN");
  });

  it("passes valid child relationships and fails orphaned children", () => {
    const valid = baseLineage();
    const orphaned = baseLineage({
      orphanedChildDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("CHILD_RELATIONSHIP_VALID");
    expect(orphaned.certification).toBe("FAIL");
    expect(orphaned.validation.reasonCodes).toContain("ORPHANED_CHILD_DETECTED");
  });

  it("passes valid dependencies and fails dependency cycles", () => {
    const valid = baseLineage();
    const cycle = baseLineage({
      dependencyCycleDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("DEPENDENCY_VALID");
    expect(cycle.certification).toBe("FAIL");
    expect(cycle.validation.dependencyValid).toBe(false);
    expect(cycle.validation.reasonCodes).toContain("DEPENDENCY_CYCLE_DETECTED");
  });

  it("fails unknown dependencies", () => {
    const result = baseLineage({
      unknownDependencyDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("DEPENDENCY_UNKNOWN");
  });

  it("passes ownership traceability and fails ownership mismatch", () => {
    const traceable = baseLineage();
    const mismatch = baseLineage({
      ownershipMismatchDetected: true,
    });

    expect(traceable.validation.reasonCodes).toContain("OWNERSHIP_TRACEABLE");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.validation.ownershipValid).toBe(false);
    expect(mismatch.validation.reasonCodes).toContain("OWNERSHIP_MISMATCH");
  });

  it("replays lineage and fails replay mismatch", () => {
    const reproduced = baseLineage();
    const mismatch = baseLineage({
      replayMismatchDetected: true,
    });

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(reproduced.validation.reasonCodes).toContain("LINEAGE_REPLAY_REPRODUCED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.validation.reasonCodes).toContain("LINEAGE_REPLAY_MISMATCH");
  });

  it("blocks cross-tenant lineage access", () => {
    const result = baseLineage({
      accessTenantId: "tenant-beta",
      crossTenantLineageAccessDetected: true,
      crossTenantDependencyDetected: true,
      crossTenantReplayDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
    expect(result.validation.reasonCodes).toContain("TENANT_LINEAGE_ISOLATION_FAILED");
  });

  it("fails missing governance influence and owner", () => {
    const influence = baseLineage({
      governanceInfluences: [],
      missingGovernanceInfluenceDetected: true,
    });
    const owner = baseLineage({
      missingOwnerDetected: true,
      ownership: {
        owner_id: "",
        owner_type: "GOVERNANCE_ENGINE",
        ownership_timestamp: "2026-06-24T23:29:00.000Z",
        ownership_scope: "",
      },
    });

    expect(influence.certification).toBe("FAIL");
    expect(influence.validation.reasonCodes).toContain("GOVERNANCE_INFLUENCE_MISSING");
    expect(owner.certification).toBe("FAIL");
    expect(owner.validation.reasonCodes).toContain("OWNER_MISSING");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = baseLineage({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when lineage tries to become a control surface", () => {
    const result = baseLineage({
      executionRequested: true,
      authorityExpansionDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.executionImpossible).toBe(false);
    expect(result.validation.authorityBounded).toBe(false);
    expect(result.executionAuthorized).toBe(false);
    expect(result.authorityMutationAllowed).toBe(false);
  });
});
