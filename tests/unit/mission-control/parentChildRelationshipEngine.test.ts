import { describe, expect, it } from "vitest";
import {
  buildTruthParentChildRelationshipRequest,
  sealTruthParentChildRelationshipEngine,
} from "@/services/mission-control";
import type { TruthParentChildRelationshipInput } from "@/services/mission-control";

function baseRelationship(overrides: Partial<TruthParentChildRelationshipInput> = {}) {
  return sealTruthParentChildRelationshipEngine({
    request: buildTruthParentChildRelationshipRequest({
      tenant_id: "tenant-alpha",
      now: "2026-06-24T23:45:00.000Z",
    }),
    missionId: "mission-alpha",
    parentObjectId: "policy-alpha",
    parentObjectType: "POLICY",
    childObjectId: "rule-alpha",
    childObjectType: "RULE",
    relationshipType: "OWNS",
    replayReferences: ["relationship-replay-alpha"],
    ancestryPath: [{
      object_id: "policy-root-alpha",
      object_type: "POLICY",
      relationship_id: "relationship-root-alpha",
    }, {
      object_id: "policy-alpha",
      object_type: "POLICY",
      relationship_id: "relationship-alpha",
    }],
    descendantPath: [{
      object_id: "rule-alpha",
      object_type: "RULE",
      relationship_id: "relationship-alpha",
    }],
    hierarchyDepth: 2,
    accessTenantId: "tenant-alpha",
    ...overrides,
  });
}

describe("parentChildRelationshipEngine", () => {
  it("registers a deterministic certified relationship", () => {
    const first = baseRelationship();
    const second = baseRelationship();

    expect(first).toEqual(second);
    expect(first.certification).toBe("PASS");
    expect(first.validation.reasonCodes).toContain("RELATIONSHIP_CONTRACT_VALID");
    expect(first.validation.reasonCodes).toContain("CERTIFICATION_PASS");
  });

  it("passes valid parent registration and fails missing parents", () => {
    const valid = baseRelationship();
    const missing = baseRelationship({
      parentObjectId: "",
      missingParentDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("PARENT_REGISTERED");
    expect(missing.certification).toBe("FAIL");
    expect(missing.validation.parentRegistered).toBe(false);
    expect(missing.validation.reasonCodes).toContain("PARENT_MISSING");
  });

  it("passes valid child registration and fails orphaned children", () => {
    const valid = baseRelationship();
    const orphaned = baseRelationship({
      orphanedChildDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("CHILD_REGISTERED");
    expect(orphaned.certification).toBe("FAIL");
    expect(orphaned.validation.childRegistered).toBe(false);
    expect(orphaned.validation.reasonCodes).toContain("ORPHANED_CHILD_DETECTED");
  });

  it("passes valid relationship classification and fails unknown relationship type", () => {
    const valid = baseRelationship();
    const unknown = baseRelationship({
      unknownRelationshipTypeDetected: true,
    });

    expect(valid.validation.reasonCodes).toContain("RELATIONSHIP_CLASSIFIED");
    expect(unknown.certification).toBe("FAIL");
    expect(unknown.validation.relationshipClassified).toBe(false);
    expect(unknown.validation.reasonCodes).toContain("RELATIONSHIP_TYPE_UNKNOWN");
  });

  it("fails multiple relationship types", () => {
    const result = baseRelationship({
      multipleRelationshipTypesDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.reasonCodes).toContain("RELATIONSHIP_TYPE_MULTIPLE");
  });

  it("builds hierarchy and fails hierarchy corruption", () => {
    const built = baseRelationship();
    const corrupt = baseRelationship({
      hierarchyCorruptionDetected: true,
    });

    expect(built.validation.reasonCodes).toContain("HIERARCHY_BUILT");
    expect(corrupt.certification).toBe("FAIL");
    expect(corrupt.validation.reasonCodes).toContain("HIERARCHY_CORRUPTION");
  });

  it("resolves ancestry and fails ancestry traversal errors", () => {
    const resolved = baseRelationship();
    const failed = baseRelationship({
      ancestryFailureDetected: true,
    });

    expect(resolved.validation.reasonCodes).toContain("ANCESTRY_RESOLVED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.reasonCodes).toContain("ANCESTRY_FAILURE");
  });

  it("resolves descendants and fails descendant traversal errors", () => {
    const resolved = baseRelationship();
    const failed = baseRelationship({
      descendantFailureDetected: true,
    });

    expect(resolved.validation.reasonCodes).toContain("DESCENDANTS_RESOLVED");
    expect(failed.certification).toBe("FAIL");
    expect(failed.validation.reasonCodes).toContain("DESCENDANT_FAILURE");
  });

  it("replays relationships and fails replay mismatches", () => {
    const reproduced = baseRelationship();
    const mismatch = baseRelationship({
      replayMismatchDetected: true,
    });

    expect(reproduced.replay.replayResult).toBe("REPRODUCED");
    expect(reproduced.validation.reasonCodes).toContain("RELATIONSHIP_REPLAY_REPRODUCED");
    expect(mismatch.certification).toBe("FAIL");
    expect(mismatch.replay.replayResult).toBe("MISMATCH");
    expect(mismatch.validation.reasonCodes).toContain("RELATIONSHIP_REPLAY_MISMATCH");
  });

  it("blocks cross-tenant relationship access", () => {
    const result = baseRelationship({
      accessTenantId: "tenant-beta",
      crossTenantRelationshipAccessDetected: true,
      crossTenantAncestryDetected: true,
      crossTenantDescendantDetected: true,
      crossTenantReplayDetected: true,
    });

    expect(result.certification).toBe("FAIL");
    expect(result.validation.tenantIsolationValid).toBe(false);
    expect(result.visibility.tenantScoped).toBe(false);
    expect(result.validation.reasonCodes).toContain("TENANT_RELATIONSHIP_ISOLATION_FAILED");
  });

  it("allows conditional pass for documented observability gaps", () => {
    const result = baseRelationship({
      observabilityGapDetected: true,
      reportingLimitationDetected: true,
      remediationDocumented: true,
    });

    expect(result.certification).toBe("CONDITIONAL_PASS");
    expect(result.validation.valid).toBe(true);
    expect(result.validation.reasonCodes).toContain("CERTIFICATION_CONDITIONAL_PASS");
  });

  it("fails closed when relationships try to become a control surface", () => {
    const result = baseRelationship({
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
