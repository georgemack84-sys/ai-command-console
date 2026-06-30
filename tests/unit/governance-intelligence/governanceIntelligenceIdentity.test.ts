import { describe, expect, it } from "vitest";
import {
  appendGovernanceIdentityChild,
  buildGovernanceIdentityObservabilitySurface,
  buildGovernanceIdentityReplayPackage,
  buildGovernanceIntelligenceIdentityDoctrine,
  computeGovernanceIdentityHash,
  generateGovernanceIntelligenceIdentity,
  markGovernanceIdentitySuperseded,
  reconstructGovernanceIdentityLineage,
  replayGovernanceIdentity,
  validateGovernanceIntelligenceIdentity,
} from "@/services/governance-intelligence";
import type { GovernanceIntelligenceIdentity } from "@/types/governance-intelligence";

function validate(identity: Partial<GovernanceIntelligenceIdentity> | undefined, registry?: GovernanceIntelligenceIdentity[], original_identity?: GovernanceIntelligenceIdentity) {
  return validateGovernanceIntelligenceIdentity(identity, { registry, original_identity });
}

describe("Mission Control Phase 7A.3 Governance Intelligence Identity", () => {
  it("defines immutable identity doctrine", () => {
    const doctrine = buildGovernanceIntelligenceIdentityDoctrine();
    expect(doctrine.principles).toContain("immutable");
    expect(doctrine.principles).toContain("truth-ledger-anchored");
    expect(doctrine.protected_fields).toEqual(["governance_intelligence_id", "tenant_id", "created_timestamp", "root_intelligence_id"]);
  });

  it("generates a root identity", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    expect(identity.governance_intelligence_id).toMatch(/^GI-tenant_alpha-mission_query_layer-/);
    expect(identity.parent_intelligence_id).toBeNull();
    expect(identity.root_intelligence_id).toBe(identity.governance_intelligence_id);
    expect(identity.version).toBe(1);
    expect(identity.identity_hash).toBeTruthy();
    expect(identity.reconstruction_hash).toBeTruthy();
    expect(identity.truth_ledger_reference).toBeTruthy();
  });

  it("validates a complete identity", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const result = validate(identity, [identity]);
    expect(result.validation_result).toBe("PASS");
    expect(result.tenant_scoped).toBe(true);
    expect(result.mission_bound).toBe(true);
    expect(result.immutable).toBe(true);
  });

  it("fails closed when required identity fields are missing", () => {
    expect(validate(undefined).failures.some((failure) => failure.reason === "IDENTITY_MISSING")).toBe(true);
    expect(validate({ tenant_id: "tenant_alpha" }).failures.some((failure) => failure.reason === "GOVERNANCE_INTELLIGENCE_ID_MISSING")).toBe(true);
    expect(validate({ governance_intelligence_id: "GI-x" }).failures.some((failure) => failure.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validate({ governance_intelligence_id: "GI-x", tenant_id: "tenant_alpha" }).failures.some((failure) => failure.reason === "MISSION_ID_MISSING")).toBe(true);
  });

  it("detects duplicate governance_intelligence_id", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const result = validate(identity, [identity, identity]);
    expect(result.failures.some((failure) => failure.reason === "GOVERNANCE_INTELLIGENCE_ID_DUPLICATE")).toBe(true);
  });

  it("detects identity collision", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const collided = { ...identity, identity_hash: "different_hash" };
    const result = validate(collided, [identity]);
    expect(result.failures.some((failure) => failure.reason === "IDENTITY_COLLISION")).toBe(true);
  });

  it("detects mission tenant mismatch", () => {
    const identity = { ...generateGovernanceIntelligenceIdentity(), tenant_id: "tenant_beta" };
    const result = validate(identity as GovernanceIntelligenceIdentity, []);
    expect(result.failures.some((failure) => failure.reason === "MISSION_TENANT_MISMATCH")).toBe(true);
  });

  it("generates a child identity with parent and root linkage", () => {
    const parent = generateGovernanceIntelligenceIdentity();
    const child = generateGovernanceIntelligenceIdentity({ parent_identity: parent });
    expect(child.parent_intelligence_id).toBe(parent.governance_intelligence_id);
    expect(child.root_intelligence_id).toBe(parent.root_intelligence_id);
    expect(child.version).toBe(parent.version + 1);
    expect(validate(child, [parent, child]).validation_result).toBe("PASS");
  });

  it("detects missing parent when non-root identity has no parent", () => {
    const root = generateGovernanceIntelligenceIdentity();
    const invalid = { ...root, version: 2 };
    const result = validate(invalid as GovernanceIntelligenceIdentity, [root]);
    expect(result.failures.some((failure) => failure.reason === "PARENT_INTELLIGENCE_MISSING")).toBe(true);
  });

  it("detects cross-tenant parent linkage", () => {
    const parent = generateGovernanceIntelligenceIdentity();
    const child = { ...generateGovernanceIntelligenceIdentity({ parent_identity: parent }), tenant_id: "tenant_beta" };
    const result = validate(child as GovernanceIntelligenceIdentity, [parent, child as GovernanceIntelligenceIdentity]);
    expect(result.failures.some((failure) => failure.reason === "CROSS_TENANT_PARENT_LINKAGE")).toBe(true);
  });

  it("tracks child intelligence and detects child-parent mismatch", () => {
    const parent = generateGovernanceIntelligenceIdentity();
    const child = generateGovernanceIntelligenceIdentity({ parent_identity: parent });
    const parentWithChild = appendGovernanceIdentityChild(parent, child.governance_intelligence_id);
    expect(validate(parentWithChild, [parentWithChild, child]).validation_result).toBe("PASS");
    const mismatchedChild = generateGovernanceIntelligenceIdentity();
    const mismatch = appendGovernanceIdentityChild(parent, mismatchedChild.governance_intelligence_id);
    expect(validate(mismatch, [mismatch, mismatchedChild]).failures.some((failure) => failure.reason === "CHILD_PARENT_MISMATCH")).toBe(true);
  });

  it("tracks superseded identities without mutating history", () => {
    const original = generateGovernanceIntelligenceIdentity();
    const superseding = generateGovernanceIntelligenceIdentity({ superseded_identity: original });
    const superseded = markGovernanceIdentitySuperseded(original, superseding.governance_intelligence_id);
    expect(superseding.superseded_intelligence_ids).toEqual([original.governance_intelligence_id]);
    expect(superseded.superseded_by_intelligence_id).toBe(superseding.governance_intelligence_id);
    expect(validate(superseding, [superseded, superseding]).validation_result).toBe("PASS");
  });

  it("detects cross-tenant supersession", () => {
    const original = generateGovernanceIntelligenceIdentity();
    const superseding = { ...generateGovernanceIntelligenceIdentity({ superseded_identity: original }), tenant_id: "tenant_beta" };
    const result = validate(superseding as GovernanceIntelligenceIdentity, [original, superseding as GovernanceIntelligenceIdentity]);
    expect(result.failures.some((failure) => failure.reason === "CROSS_TENANT_SUPERSESSION")).toBe(true);
  });

  it("detects protected field mutation", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    expect(validate({ ...identity, governance_intelligence_id: "GI-mutated" }, [], identity).failures.some((failure) => failure.reason === "GOVERNANCE_INTELLIGENCE_ID_MUTATION")).toBe(true);
    expect(validate({ ...identity, tenant_id: "tenant_beta" }, [], identity).failures.some((failure) => failure.reason === "TENANT_ID_MUTATION")).toBe(true);
    expect(validate({ ...identity, created_timestamp: "2026-06-26T00:00:00.000Z" }, [], identity).failures.some((failure) => failure.reason === "CREATED_TIMESTAMP_MUTATION")).toBe(true);
    expect(validate({ ...identity, root_intelligence_id: "GI-root-mutated" }, [], identity).failures.some((failure) => failure.reason === "ROOT_INTELLIGENCE_ID_MUTATION")).toBe(true);
  });

  it("detects missing replay and Truth Ledger references", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    expect(validate({ ...identity, replay_id: "" }).failures.some((failure) => failure.reason === "REPLAY_ID_MISSING")).toBe(true);
    expect(validate({ ...identity, reconstruction_hash: "" }).failures.some((failure) => failure.reason === "RECONSTRUCTION_HASH_MISSING")).toBe(true);
    expect(validate({ ...identity, truth_ledger_reference: "" }).failures.some((failure) => failure.reason === "TRUTH_LEDGER_REFERENCE_MISSING")).toBe(true);
  });

  it("produces reproducible identity hashes and detects tampering", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    expect(computeGovernanceIdentityHash(identity)).toBe(identity.identity_hash);
    expect(validate({ ...identity, identity_hash: "tampered_identity_hash" }).failures.some((failure) => failure.reason === "IDENTITY_HASH_MISMATCH")).toBe(true);
    expect(validate({ ...identity, reconstruction_hash: "tampered_reconstruction_hash" }).failures.some((failure) => failure.reason === "RECONSTRUCTION_HASH_MISMATCH")).toBe(true);
  });

  it("reconstructs lineage", () => {
    const root = generateGovernanceIntelligenceIdentity();
    const child = generateGovernanceIntelligenceIdentity({ parent_identity: root });
    const grandchild = generateGovernanceIntelligenceIdentity({ parent_identity: child });
    const lineage = reconstructGovernanceIdentityLineage(grandchild, [root, child, grandchild]);
    expect(lineage.lineage_complete).toBe(true);
    expect(lineage.parent_chain).toEqual([child.governance_intelligence_id, root.governance_intelligence_id]);
    expect(lineage.root_intelligence_id).toBe(root.governance_intelligence_id);
  });

  it("detects lineage breaks", () => {
    const root = generateGovernanceIntelligenceIdentity();
    const child = generateGovernanceIntelligenceIdentity({ parent_identity: root });
    const lineage = reconstructGovernanceIdentityLineage(child, [child]);
    expect(lineage.lineage_complete).toBe(false);
    expect(lineage.lineage_breaks).toContain("PARENT_INTELLIGENCE_NOT_FOUND");
  });

  it("replays identity package", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const replayPackage = buildGovernanceIdentityReplayPackage(identity, [identity]);
    const replay = replayGovernanceIdentity(replayPackage, [identity]);
    expect(replay.validation_result).toBe("PASS");
    expect(replay.reconstructed_identity_hash).toBe(identity.identity_hash);
  });

  it("detects identity replay mismatch", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const replayPackage = { ...buildGovernanceIdentityReplayPackage(identity, [identity]), identity_hash: "tampered_identity_hash" };
    const replay = replayGovernanceIdentity(replayPackage, [identity]);
    expect(replay.validation_result).toBe("FAIL");
    expect(replay.failure_reason).toBe("IDENTITY_REPLAY_FAILED");
  });

  it("builds an identity observability surface", () => {
    const identity = generateGovernanceIntelligenceIdentity();
    const surface = buildGovernanceIdentityObservabilitySurface(identity, [identity]);
    expect(surface.governance_intelligence_id).toBe(identity.governance_intelligence_id);
    expect(surface.root_intelligence_id).toBe(identity.root_intelligence_id);
    expect(surface.validation_result).toBe("PASS");
    expect(surface.identity_hash).toBe(identity.identity_hash);
  });
});
