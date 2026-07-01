import { describe, expect, it, vi } from "vitest";
import {
  buildGovernanceIntegrityContract,
  buildGovernanceIntegrityObservabilitySurface,
  classifyGovernanceIntegrityFailure,
  computeGovernanceIntegrityCanonicalHash,
  computeGovernanceIntegrityContentHash,
  computeGovernanceIntegrityRecordHash,
  getGovernanceIntegrityContract,
  transitionGovernanceIntegrityLifecycle,
  validateGovernanceIntegrityContract,
} from "@/services/governance-integrity-contract";
import type { GovernanceIntegrityFailureReason, GovernanceIntegrityScenario, GovernanceIntegrityState } from "@/types/governance-integrity-contract";

vi.setConfig({ testTimeout: 180000 });

describe("Mission Control Phase 7I.1 Governance Integrity Contract", () => {
  it("defines the canonical governance integrity doctrine and schema", () => {
    const contract = getGovernanceIntegrityContract();

    expect(contract.doctrine.schema_version).toBe("governance-integrity-contract/v7I.1");
    expect(contract.doctrine.principles).toContain("single-record-per-protected-object");
    expect(contract.doctrine.principles).toContain("tenant-isolated");
    expect(contract.doctrine.principles).toContain("fail-closed");
    expect(contract.doctrine.integrity_states).toEqual(["VALID", "DEGRADED", "CORRUPTED"]);
    expect(contract.doctrine.lifecycle_states).toEqual(["REGISTERED", "HASHED", "VERIFIED", "CERTIFIED", "MONITORED", "DEGRADED", "CORRUPTED", "RECOVERED"]);
    expect(contract.doctrine.protected_object_types).toContain("CERTIFICATION_RECORD");
  });

  it("registers one immutable integrity record for the protected governance certification object", () => {
    const contract = buildGovernanceIntegrityContract();

    expect(contract.phase_version).toBe("7I.1");
    expect(contract.identity.integrity_record_id).toMatch(/^GIC-7I1-/);
    expect(contract.identity.governance_object_type).toBe("CERTIFICATION_RECORD");
    expect(contract.identity.tenant_id).toMatch(/^tenant_/);
    expect(contract.fail_closed).toBe(true);
    expect(contract.immutable_fields).toContain("identity.governance_object_id");
    expect(contract.immutable_fields).toContain("replay_references.replay_hash");
    expect(contract.certification_metadata.certification_reference).toBe(contract.identity.governance_object_id);
  });

  it("computes reproducible content, canonical, and record hashes", () => {
    const contract = buildGovernanceIntegrityContract();

    expect(contract.hash_information.hash_algorithm).toBe("SHA-256");
    expect(contract.hash_information.content_hash).toBe(computeGovernanceIntegrityContentHash(contract));
    expect(contract.hash_information.canonical_hash).toBe(computeGovernanceIntegrityCanonicalHash(contract));
    expect(contract.record_hash).toBe(computeGovernanceIntegrityRecordHash(contract));
    expect(buildGovernanceIntegrityContract().record_hash).toBe(contract.record_hash);
  });

  it("validates the baseline contract as valid and replay reconstructable", () => {
    const validation = validateGovernanceIntegrityContract(buildGovernanceIntegrityContract());

    expect(validation.validation_state).toBe("VALID");
    expect(validation.valid).toBe(true);
    expect(validation.failures).toEqual([]);
    expect(validation.record_hash_valid).toBe(true);
    expect(validation.canonical_hash_valid).toBe(true);
    expect(validation.replay_references_valid).toBe(true);
    expect(validation.lineage_valid).toBe(true);
    expect(validation.fail_closed).toBe(true);
  });

  it("transitions lifecycle deterministically from certified to monitored", () => {
    const transition = transitionGovernanceIntegrityLifecycle(buildGovernanceIntegrityContract(), "MONITORED");

    expect(transition.from).toBe("CERTIFIED");
    expect(transition.to).toBe("MONITORED");
    expect(transition.allowed).toBe(true);
    expect(transition.resulting_integrity_state).toBe("VALID");
    expect(transition.transition_hash).toBeTruthy();
  });

  it.each([
    ["MISSING_IDENTITY", "MISSING_IDENTITY", "CORRUPTED"],
    ["INVALID_TENANT_SCOPE", "INVALID_TENANT_SCOPE", "CORRUPTED"],
    ["HASH_MISMATCH", "HASH_MISMATCH", "CORRUPTED"],
    ["UNSUPPORTED_HASH_ALGORITHM", "UNSUPPORTED_HASH_ALGORITHM", "DEGRADED"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE", "CORRUPTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH", "CORRUPTED"],
    ["MISSING_EVIDENCE_REFERENCE", "MISSING_EVIDENCE_REFERENCE", "DEGRADED"],
    ["VERIFICATION_METADATA_INCOMPLETE", "VERIFICATION_METADATA_INCOMPLETE", "DEGRADED"],
    ["INVALID_CERTIFICATION_METADATA", "INVALID_CERTIFICATION_METADATA", "DEGRADED"],
    ["UNAUTHORIZED_FIELD_MODIFICATION", "UNAUTHORIZED_FIELD_MODIFICATION", "CORRUPTED"],
    ["ORPHAN_RECORD", "ORPHAN_RECORD", "CORRUPTED"],
    ["LINEAGE_CYCLE", "LINEAGE_CYCLE", "CORRUPTED"],
    ["HIDDEN_VERIFICATION_STATE", "HIDDEN_VERIFICATION_STATE", "CORRUPTED"],
  ] as readonly [GovernanceIntegrityScenario, GovernanceIntegrityFailureReason, GovernanceIntegrityState][])(
    "maps %s to fail-closed %s integrity state",
    (scenario, reason, expectedState) => {
      const validation = validateGovernanceIntegrityContract({ scenario });

      expect(classifyGovernanceIntegrityFailure(reason)).toBe(expectedState);
      expect(validation.validation_state).toBe(expectedState);
      expect(validation.failures.map((failure) => failure.reason)).toContain(reason);
      expect(validation.valid).toBe(false);
    },
  );

  it("detects duplicate integrity records for the same protected object", () => {
    const contract = buildGovernanceIntegrityContract();
    const validation = validateGovernanceIntegrityContract({
      contract,
      registry: [{
        integrity_record_id: "existing-integrity-record",
        governance_object_id: contract.identity.governance_object_id,
        tenant_id: contract.identity.tenant_id,
      }],
    });

    expect(validation.validation_state).toBe("CORRUPTED");
    expect(validation.failures.map((failure) => failure.reason)).toContain("DUPLICATE_INTEGRITY_RECORD");
  });

  it("exposes an observability surface without granting execution authority", () => {
    const surface = buildGovernanceIntegrityObservabilitySurface({ scenario: "MISSING_EVIDENCE_REFERENCE" });

    expect(surface.integrity_state).toBe("DEGRADED");
    expect(surface.failure_count).toBeGreaterThan(0);
    expect(surface.failures).toContain("MISSING_EVIDENCE_REFERENCE");
    expect(surface.content_hash).toBeTruthy();
    expect(surface.replay_id).toBeTruthy();
    expect(surface.truth_ledger_reference).toMatch(/^truth-ledger:/);
    expect(surface.advisory_only_notice).toContain("does not grant autonomous execution authority");
  });
});
