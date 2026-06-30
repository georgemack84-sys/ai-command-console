import { describe, expect, it } from "vitest";
import {
  buildReplayContractPackage,
  buildReplayContractVisibilitySurface,
  computeReplayArtifactManifestHash,
  computeReplayGovernanceHash,
  computeReplayIdentityHash,
  computeReplayIntegrityHash,
  computeReplayOrderingHash,
  getReplayContractFramework,
} from "@/services/replay-contract";
import type { ReplayContractScenario, ReplayValidationFailure } from "@/types/replay-contract";

describe("Mission Control Phase 8G.1 Replay Contract", () => {
  it("publishes replay doctrine, types, scopes, lifecycle, and confidence levels", () => {
    const framework = getReplayContractFramework();

    expect(framework.doctrine.contract_version).toBe("replay-contract/v8G.1");
    expect(framework.doctrine.principles).toContain("deterministic");
    expect(framework.doctrine.principles).toContain("cryptographically-verifiable");
    expect(framework.doctrine.replay_types).toEqual(["EXECUTION", "PLANNING", "DECISION", "ORCHESTRATION", "DELEGATION", "SUPERVISION", "INTERVENTION", "GOVERNANCE", "FORENSIC", "CERTIFICATION"]);
    expect(framework.doctrine.replay_scopes).toContain("FORENSIC_INVESTIGATION");
    expect(framework.doctrine.lifecycle_states).toContain("VERIFYING_ORDER");
    expect(framework.doctrine.confidence_levels).toEqual(["EXACT", "VERY_HIGH", "HIGH", "MEDIUM", "LOW", "INSUFFICIENT"]);
  });

  it("builds a complete immutable baseline replay contract", () => {
    const pkg = buildReplayContractPackage();

    expect(Object.isFrozen(pkg)).toBe(true);
    expect(pkg.contract_version).toBe("replay-contract/v8G.1");
    expect(pkg.replay_identity.replay_status).toBe("COMPLETED");
    expect(pkg.artifact_manifest.completeness).toBe("COMPLETE");
    expect(pkg.ordering.ordering_state).toBe("MATCH");
    expect(pkg.integrity_record.verification_state).toBe("PASS");
    expect(pkg.confidence.confidence_level).toBe("EXACT");
    expect(pkg.validation.validation_state).toBe("PASS");
    expect(pkg.speculative_replay_permitted).toBe(false);
    expect(pkg.immutable).toBe(true);
  });

  it("produces deterministic hashes and references", () => {
    const first = buildReplayContractPackage();
    const second = buildReplayContractPackage();

    expect(second.package_hash).toBe(first.package_hash);
    expect(computeReplayIdentityHash(first.replay_identity)).toBe(first.replay_identity.integrity_hash);
    expect(computeReplayArtifactManifestHash(first.artifact_manifest)).toBe(first.artifact_manifest.manifest_hash);
    expect(computeReplayOrderingHash(first.ordering)).toBe(first.ordering.ordering_hash);
    expect(computeReplayIntegrityHash(first.integrity_record)).toBe(first.integrity_record.integrity_hash);
    expect(computeReplayGovernanceHash(first.governance)).toBe(first.governance.governance_hash);
    expect(first.references.truth_reference).toBe(first.replay_identity.truth_reference);
    expect(first.references.lineage_reference).toBe(first.replay_identity.lineage_reference);
  });

  it.each([
    ["ARTIFACT_MISSING", "REQUIRED_ARTIFACT_MISSING"],
    ["HASH_FAILURE", "HASH_VALIDATION_FAILED"],
    ["ORDER_MISMATCH", "ORDERING_MISMATCH"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_REFERENCE_INVALID"],
    ["LINEAGE_FAILURE", "LINEAGE_INCOMPLETE"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION"],
    ["LOW_CONFIDENCE", "CONFIDENCE_BELOW_THRESHOLD"],
    ["DUPLICATE_IDENTITY", "REPLAY_ID_NOT_UNIQUE"],
    ["CONSTITUTION_MISMATCH", "CONSTITUTION_REFERENCE_CHANGED"],
    ["AUTHORITY_MISSING", "AUTHORITY_CHAIN_MISSING"],
    ["HASH_MISMATCH", "INTEGRITY_HASH_MISMATCH"],
  ] as readonly [ReplayContractScenario, ReplayValidationFailure][])("fails closed for %s", (scenario, failure) => {
    const pkg = buildReplayContractPackage({ scenario });

    expect(pkg.validation.validation_state).toBe("FAIL");
    expect(pkg.validation.failures).toContain(failure);
    expect(pkg.validation.certification_ready).toBe(false);
    expect(pkg.speculative_replay_permitted).toBe(false);
  });

  it("supports non-baseline replay type and scope registration", () => {
    const pkg = buildReplayContractPackage({ replay_type: "FORENSIC", replay_scope: "FORENSIC_INVESTIGATION" });

    expect(pkg.replay_identity.replay_type).toBe("FORENSIC");
    expect(pkg.replay_identity.replay_scope).toBe("FORENSIC_INVESTIGATION");
    expect(pkg.validation.validation_state).toBe("PASS");
  });

  it("exposes replay visibility", () => {
    const surface = buildReplayContractVisibilitySurface(buildReplayContractPackage({ scenario: "ORDER_MISMATCH" }));

    expect(surface.replay_status).toBe("ORDER_MISMATCH");
    expect(surface.ordering_state).toBe("MISMATCH");
    expect(surface.validation_state).toBe("FAIL");
    expect(surface.failures).toContain("ORDERING_MISMATCH");
    expect(surface.certification_ready).toBe(false);
  });
});
