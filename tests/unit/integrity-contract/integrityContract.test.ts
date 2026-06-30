import { describe, expect, it } from "vitest";
import {
  buildIntegrityContract,
  buildIntegrityObservabilitySurface,
  classifyIntegrityFailure,
  computeIntegrityArtifactHash,
  computeIntegrityLineageHash,
  computeIntegrityMetadataHash,
  computeIntegrityPayloadHash,
  computeIntegrityRecordHash,
  computeIntegrityReplayHash,
  computeIntegrityVerificationHash,
  getIntegrityContract,
  transitionIntegrityLifecycle,
  validateIntegrityContract,
} from "@/services/integrity-contract";
import type { IntegrityFailureReason, IntegrityScenario, IntegrityState } from "@/types/integrity-contract";

describe("Mission Control Phase 8H.1 Integrity Contract", () => {
  it("defines the canonical autonomy integrity doctrine and schema", () => {
    const framework = getIntegrityContract();

    expect(framework.doctrine.schema_version).toBe("integrity-contract/v8H.1");
    expect(framework.doctrine.hash_version).toBe("autonomy-integrity-hash/v8H.1");
    expect(framework.doctrine.principles).toContain("autonomous-artifact-protection");
    expect(framework.doctrine.principles).toContain("fail-closed");
    expect(framework.doctrine.protected_object_types).toEqual(["PLANNING_RECORD", "EXECUTION_RECORD", "DELEGATION_RECORD", "ORCHESTRATION_RECORD", "SUPERVISION_RECORD", "INTERVENTION_RECORD", "REPLAY_RECORD", "GOVERNANCE_DECISION"]);
    expect(framework.doctrine.immutable_fields).toContain("replay_id");
    expect(framework.doctrine.immutable_fields).toContain("artifact_hash");
  });

  it("registers an immutable integrity record for a protected replay artifact", () => {
    const record = buildIntegrityContract();

    expect(record.schema_version).toBe("integrity-contract/v8H.1");
    expect(record.integrity_id).toMatch(/^IC-/);
    expect(record.artifact_type).toBe("REPLAY_RECORD");
    expect(record.tenant_id).toMatch(/^tenant_/);
    expect(record.fail_closed).toBe(true);
    expect(record.protected_fields).toContain("immutable_identifiers");
    expect(record.immutable_identifiers.execution_id).toBeTruthy();
    expect(record.source_replay_certification.certification_result.certification_state).toBe("PASS");
  });

  it("computes deterministic payload, metadata, replay, lineage, artifact, verification, and record hashes", () => {
    const record = buildIntegrityContract();

    expect(record.hash_policy.hash_algorithm).toBe("SHA-256");
    expect(record.hash_policy.payload_hash).toBe(computeIntegrityPayloadHash(record));
    expect(record.hash_policy.metadata_hash).toBe(computeIntegrityMetadataHash(record));
    expect(record.hash_policy.replay_hash).toBe(computeIntegrityReplayHash(record));
    expect(record.hash_policy.lineage_hash).toBe(computeIntegrityLineageHash(record));
    expect(record.hash_policy.artifact_hash).toBe(computeIntegrityArtifactHash(record));
    expect(record.hash_policy.verification_hash).toBe(computeIntegrityVerificationHash(record));
    expect(record.record_hash).toBe(computeIntegrityRecordHash(record));
    expect(buildIntegrityContract().record_hash).toBe(record.record_hash);
  });

  it("validates the baseline contract as valid, replay-safe, lineage-preserving, and tenant-owned", () => {
    const validation = validateIntegrityContract(buildIntegrityContract());

    expect(validation.validation_state).toBe("VALID");
    expect(validation.valid).toBe(true);
    expect(validation.failures).toEqual([]);
    expect(validation.hash_reproducible).toBe(true);
    expect(validation.lineage_continuous).toBe(true);
    expect(validation.replay_reconstructable).toBe(true);
    expect(validation.governance_references_valid).toBe(true);
    expect(validation.constitutional_references_valid).toBe(true);
    expect(validation.tenant_ownership_valid).toBe(true);
  });

  it("transitions lifecycle deterministically from certified to monitored", () => {
    const transition = transitionIntegrityLifecycle(buildIntegrityContract(), "MONITORED");

    expect(transition.from).toBe("CERTIFIED");
    expect(transition.to).toBe("MONITORED");
    expect(transition.allowed).toBe(true);
    expect(transition.resulting_integrity_state).toBe("VALID");
    expect(transition.transition_hash).toBeTruthy();
  });

  it.each([
    ["MISSING_IDENTIFIERS", "MISSING_IDENTIFIERS", "CORRUPTED"],
    ["MUTABLE_PROTECTED_FIELD", "MUTABLE_PROTECTED_FIELD", "CORRUPTED"],
    ["INVALID_HASHES", "INVALID_HASHES", "CORRUPTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH", "CORRUPTED"],
    ["LINEAGE_CORRUPTION", "LINEAGE_CORRUPTION", "CORRUPTED"],
    ["MISSING_GOVERNANCE_REFERENCES", "MISSING_GOVERNANCE_REFERENCES", "DEGRADED"],
    ["CONSTITUTIONAL_VIOLATION", "CONSTITUTIONAL_VIOLATION", "CORRUPTED"],
    ["DUPLICATE_IDENTIFIERS", "DUPLICATE_IDENTIFIERS", "CORRUPTED"],
    ["ORPHANED_ARTIFACT", "ORPHANED_ARTIFACT", "CORRUPTED"],
    ["UNAUTHORIZED_MODIFICATION", "UNAUTHORIZED_MODIFICATION", "CORRUPTED"],
    ["TENANT_BOUNDARY_VIOLATION", "TENANT_BOUNDARY_VIOLATION", "CORRUPTED"],
    ["SCHEMA_INCOMPATIBILITY", "SCHEMA_INCOMPATIBILITY", "DEGRADED"],
    ["HIDDEN_VERIFICATION_STATE", "HIDDEN_VERIFICATION_STATE", "CORRUPTED"],
  ] as readonly [IntegrityScenario, IntegrityFailureReason, IntegrityState][])("maps %s to fail-closed %s integrity state", (scenario, reason, expectedState) => {
    const validation = validateIntegrityContract({ scenario });

    expect(classifyIntegrityFailure(reason)).toBe(expectedState);
    expect(validation.validation_state).toBe(expectedState);
    expect(validation.failures.map((failure) => failure.reason)).toContain(reason);
    expect(validation.valid).toBe(false);
  });

  it("detects duplicate protected artifact identifiers from the registry", () => {
    const record = buildIntegrityContract();
    const validation = validateIntegrityContract({
      record,
      registry: [{ integrity_id: "existing", artifact_id: record.artifact_id, tenant_id: record.tenant_id }],
    });

    expect(validation.validation_state).toBe("CORRUPTED");
    expect(validation.failures.map((failure) => failure.reason)).toContain("DUPLICATE_IDENTIFIERS");
  });

  it("exposes an integrity observability surface", () => {
    const surface = buildIntegrityObservabilitySurface({ scenario: "MISSING_GOVERNANCE_REFERENCES" });

    expect(surface.integrity_state).toBe("DEGRADED");
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.failures).toContain("MISSING_GOVERNANCE_REFERENCES");
    expect(surface.artifact_hash).toBeTruthy();
    expect(surface.chain_hash).toBeTruthy();
    expect(surface.replay_reference).toBeTruthy();
  });
});
