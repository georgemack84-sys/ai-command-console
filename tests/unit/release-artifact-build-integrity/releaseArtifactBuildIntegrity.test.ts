import { describe, expect, it } from "vitest";
import {
  getReleaseArtifactBuildIntegrityBundle,
  replayReleaseArtifactBuildIntegrity,
  runReleaseArtifactBuildIntegrity,
  validateReleaseArtifactBuildIntegrity,
} from "@/services/release-artifact-build-integrity";
import type { ReleaseArtifactFailure } from "@/types/release-artifact-build-integrity";

describe("Mission Control Phase 15.2 Release Artifact & Build Integrity", () => {
  it("publishes release artifact doctrine", () => {
    const bundle = getReleaseArtifactBuildIntegrityBundle();

    expect(bundle.doctrine.version).toBe("release-artifact-build-integrity/v15.2");
    expect(bundle.doctrine.upstream_phase).toBe("production-readiness-foundation/v15.1");
    expect(bundle.doctrine.lifecycle).toEqual(["REGISTERED", "BUILDING", "BUILT", "SIGNED", "ATTESTED", "CERTIFIED", "PROMOTION_ELIGIBLE", "DEPLOYED", "RETIRED"]);
    expect(bundle.validation.valid).toBe(true);
  });

  it("defines artifact contract, identity, and registry", () => {
    const result = runReleaseArtifactBuildIntegrity();

    expect(result.contract.immutable_identity_required).toBe(true);
    expect(result.contract.deterministic_build_required).toBe(true);
    expect(result.contract.certification_binding_required).toBe(true);
    expect(result.artifact_identity.immutable).toBe(true);
    expect(result.registry.artifacts).toHaveLength(1);
    expect(result.registry.replacement_prohibited).toBe(true);
    expect(result.registry.historical_artifacts_accessible).toBe(true);
  });

  it("creates deterministic build manifest and integrity records", () => {
    const result = runReleaseArtifactBuildIntegrity();

    expect(result.build_manifest.deterministic).toBe(true);
    expect(result.build_manifest.source_commit.length).toBeGreaterThan(0);
    expect(result.build_manifest.dependency_versions.length).toBeGreaterThan(0);
    expect(result.build_manifest.environment_reproducible).toBe(true);
    expect(result.integrity_record.sha256_hash_verified).toBe(true);
    expect(result.integrity_record.binary_identity_verified).toBe(true);
    expect(result.integrity_record.image_digest_verified).toBe(true);
    expect(result.integrity_record.promotion_blocked_on_mismatch).toBe(true);
  });

  it("maintains SBOM, provenance, signing, and attestation evidence", () => {
    const result = runReleaseArtifactBuildIntegrity();

    expect(result.sbom.packages.length).toBeGreaterThan(0);
    expect(result.sbom.dependency_lineage_traceable).toBe(true);
    expect(result.provenance.build_events).toHaveLength(5);
    expect(result.provenance.append_only).toBe(true);
    expect(result.provenance.replayable).toBe(true);
    expect(result.signature.trust_chain_valid).toBe(true);
    expect(result.attestation.attestation_complete).toBe(true);
    expect(result.attestation.verified).toBe(true);
  });

  it("binds certification and validates reproducible builds", () => {
    const result = runReleaseArtifactBuildIntegrity();

    expect(result.certification_binding.phase14_certification_id).toBe(result.phase14_certification_ref);
    expect(result.certification_binding.synthetic_certification_refs).toEqual([result.phase14_certification_ref]);
    expect(result.certification_binding.immutable).toBe(true);
    expect(result.reproducible_build.independent_rebuild_refs).toHaveLength(2);
    expect(result.reproducible_build.binary_equality).toBe(true);
    expect(result.reproducible_build.reproducibility_verified).toBe(true);
    expect(result.reproducible_build.drift_detected).toBe(false);
  });

  it("is deterministic and replayable", () => {
    const first = runReleaseArtifactBuildIntegrity();
    const second = runReleaseArtifactBuildIntegrity();

    expect(first.outcome).toBe("PASS");
    expect(first.replay_hash).toBe(second.replay_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(validateReleaseArtifactBuildIntegrity(first).valid).toBe(true);
    expect(replayReleaseArtifactBuildIntegrity(first)).toBe(true);
  });

  it("executes the complete release artifact certification matrix", () => {
    const result = runReleaseArtifactBuildIntegrity();

    expect(result.certification_tests).toHaveLength(25);
    expect(result.certification_tests.every((test) => test.expected === "PASS" && test.actual === "PASS" && test.passed && test.evidence_refs.length > 0)).toBe(true);
    expect(result.certification_tests.map((test) => test.name)).toEqual([
      "Release Artifact Contract valid",
      "Artifact identity immutable",
      "Registry complete",
      "Build Manifest deterministic",
      "Source revision verified",
      "Dependency versions verified",
      "Configuration identity verified",
      "Binary hash verified",
      "Container digest verified",
      "Artifact Integrity Validator passed",
      "SBOM complete",
      "Supply chain traceable",
      "Provenance Ledger complete",
      "Build replay reproducible",
      "Artifact signed",
      "Attestation verified",
      "Certification binding valid",
      "Phase 14 certification referenced",
      "Certification evidence immutable",
      "Reproducible build verified",
      "Binary equality confirmed",
      "Environment identity verified",
      "Replay deterministic",
      "Audit lineage preserved",
      "Fail-closed policy enforced",
    ]);
  });

  it("supports conditional pass for non-constitutional artifact warnings", () => {
    const result = runReleaseArtifactBuildIntegrity({ scenario: "NON_CONSTITUTIONAL_ARTIFACT_WARNING" });
    const validation = validateReleaseArtifactBuildIntegrity(result);

    expect(result.outcome).toBe("CONDITIONAL_PASS");
    expect(validation.valid).toBe(false);
  });

  it.each([
    "ARTIFACT_CONTRACT_INVALID",
    "ARTIFACT_IDENTITY_MUTABLE",
    "REGISTRY_INCOMPLETE",
    "BUILD_MANIFEST_NON_DETERMINISTIC",
    "SOURCE_REVISION_UNVERIFIED",
    "DEPENDENCY_VERSIONS_UNVERIFIED",
    "CONFIGURATION_IDENTITY_UNVERIFIED",
    "BINARY_HASH_MISMATCH",
    "CONTAINER_DIGEST_MISMATCH",
    "INTEGRITY_VALIDATOR_FAILED",
    "SBOM_INCOMPLETE",
    "SUPPLY_CHAIN_NOT_TRACEABLE",
    "PROVENANCE_LEDGER_INCOMPLETE",
    "BUILD_REPLAY_NOT_REPRODUCIBLE",
    "ARTIFACT_UNSIGNED",
    "ATTESTATION_UNVERIFIED",
    "CERTIFICATION_BINDING_INVALID",
    "PHASE14_CERTIFICATION_NOT_REFERENCED",
    "CERTIFICATION_EVIDENCE_MUTABLE",
    "REPRODUCIBLE_BUILD_NOT_VERIFIED",
    "BINARY_EQUALITY_NOT_CONFIRMED",
    "ENVIRONMENT_IDENTITY_UNVERIFIED",
    "REPLAY_NON_DETERMINISTIC",
    "AUDIT_LINEAGE_LOST",
    "FAIL_CLOSED_NOT_ENFORCED",
  ] as const)("fails certification for %s", (scenario: ReleaseArtifactFailure) => {
    const result = runReleaseArtifactBuildIntegrity({ scenario });
    const validation = validateReleaseArtifactBuildIntegrity(result);

    expect(result.outcome).toBe("FAIL");
    expect(result.failures).toContain(scenario);
    expect(validation.valid).toBe(false);
  });

  it("detects nested artifact identity tampering", () => {
    const result = runReleaseArtifactBuildIntegrity();
    const tampered = {
      ...result,
      artifact_identity: {
        ...result.artifact_identity,
        version: "tampered",
      },
    };

    expect(validateReleaseArtifactBuildIntegrity(tampered).valid).toBe(false);
  });
});
