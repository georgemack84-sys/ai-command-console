import { describe, expect, it } from "vitest";
import {
  INTEGRITY_OUTCOMES,
  INTEGRITY_VERIFICATION_LIFECYCLE_STATES,
  getIntegrityVerificationEngineFoundation,
  verifyDecisionIntegrity,
} from "@/services/decision-integrity-verification-engine";

describe("Mission Control Phase 9.10.7 Integrity Verification Engine", () => {
  it("publishes the integrity verification foundation", () => {
    const foundation = getIntegrityVerificationEngineFoundation();

    expect(foundation.verification_engine_version).toBe("decision-integrity-verification-engine/v1");
    expect(foundation.lifecycle_states).toEqual(INTEGRITY_VERIFICATION_LIFECYCLE_STATES);
    expect(foundation.outcomes).toEqual(INTEGRITY_OUTCOMES);
    expect(foundation.result.verification_record.integrity_outcome).toBe("VERIFIED");
  });

  it("verifies artifact, snapshot, replay, trace, package, ledger, audit, and certification hashes", () => {
    const result = verifyDecisionIntegrity();

    expect(result.verification_record.hash_results.length).toBeGreaterThan(20);
    expect(result.verification_record.hash_results.every((hashResult) => hashResult.match_status === "MATCH")).toBe(true);
    expect(result.report.certification_ready).toBe(true);
    expect(result.certification_ready).toBe(true);
  });

  it("verifies lineage, snapshot, ledger, replay, package, and operator consistency", () => {
    const result = verifyDecisionIntegrity();

    expect(result.verification_record.lineage_results.verified).toBe(true);
    expect(result.verification_record.consistency_results.every((domain) => domain.verified)).toBe(true);
    expect(result.verification_record.tamper_results.verified).toBe(true);
    expect(result.report.lineage_summary).toBe("lineage verified");
  });

  it("stores immutable verification records in an append-only ledger and preserves boundaries", () => {
    const result = verifyDecisionIntegrity();

    expect(Object.isFrozen(result.verification_record)).toBe(true);
    expect(result.ledger[0]?.append_only).toBe(true);
    expect(result.ledger[0]?.deleted).toBe(false);
    expect(result.advisory_only).toBe(true);
    expect(result.mutates_artifacts).toBe(false);
  });

  it.each([
    ["MODIFIED_ARTIFACT", "MODIFIED", "HASH_MISMATCH"],
    ["CORRUPTED_ARTIFACT", "CORRUPTED", "CORRUPTED_ARTIFACT"],
    ["MISSING_ARTIFACT", "MISSING", "MISSING_ARTIFACT"],
    ["BROKEN_LINEAGE", "FAIL_CLOSED", "LINEAGE_BROKEN"],
    ["CROSS_TENANT", "FAIL_CLOSED", "TENANT_BOUNDARY_VIOLATION"],
    ["UNSUPPORTED_ALGORITHM", "FAIL_CLOSED", "UNSUPPORTED_HASH_ALGORITHM"],
    ["VERIFICATION_INTERRUPTED", "FAIL_CLOSED", "VERIFICATION_INTERRUPTED"],
    ["UNKNOWN_OUTCOME", "FAIL_CLOSED", "UNKNOWN_INTEGRITY_OUTCOME"],
    ["LEDGER_MUTATION", "FAIL_CLOSED", "LEDGER_INCONSISTENCY"],
    ["REPLAY_INCONSISTENCY", "FAIL_CLOSED", "REPLAY_INCONSISTENCY"],
    ["PACKAGE_INCONSISTENCY", "FAIL_CLOSED", "PACKAGE_INCONSISTENCY"],
    ["OPERATOR_INCONSISTENCY", "FAIL_CLOSED", "OPERATOR_INCONSISTENCY"],
    ["SNAPSHOT_INCONSISTENCY", "FAIL_CLOSED", "SNAPSHOT_INCONSISTENCY"],
  ] as const)("assigns %s outcome for %s", (scenario, outcome, failure) => {
    const result = verifyDecisionIntegrity({ scenario });

    expect(result.verification_record.integrity_outcome).toBe(outcome);
    expect(result.verification_record.validation_status).toBe("BLOCKED");
    expect(result.failures).toContain(failure);
    expect(result.certification_ready).toBe(false);
  });

  it("detects tampering without repairing artifacts", () => {
    const result = verifyDecisionIntegrity({ scenario: "MODIFIED_ARTIFACT" });

    expect(result.report.tamper_summary).toBe("tamper or trust failure detected");
    expect(result.report.modified_artifacts).toContain("decision_audit_package");
    expect(result.mutates_artifacts).toBe(false);
  });
});
