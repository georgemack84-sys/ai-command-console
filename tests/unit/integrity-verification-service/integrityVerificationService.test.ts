import { describe, expect, it, vi } from "vitest";
import {
  buildIntegrityVerificationObservabilitySurface,
  classifyIntegrityVerificationFailure,
  getIntegrityVerificationContract,
  runIntegrityVerification,
  validateIntegrityVerificationReport,
} from "@/services/integrity-verification-service";
import type { IntegrityVerificationFailure, IntegrityVerificationScenario, IntegrityVerificationState } from "@/types/integrity-verification-service";

vi.setConfig({ testTimeout: 15000 });

describe("Mission Control Phase 8H.4 Integrity Verification Service", () => {
  it("defines the integrity verification doctrine and modes", () => {
    const contract = getIntegrityVerificationContract();

    expect(contract.doctrine.schema_version).toBe("integrity-verification-service/v8H.4");
    expect(contract.doctrine.verification_modes).toEqual(["CONTINUOUS", "SCHEDULED", "ON_DEMAND"]);
    expect(contract.doctrine.principles).toContain("hash-reproducibility-verification");
    expect(contract.doctrine.principles).toContain("tenant-isolation-verification");
    expect(contract.doctrine.principles).toContain("fail-closed-certification-blocking");
  });

  it("verifies a clean autonomous history as trusted and certification ready", () => {
    const report = runIntegrityVerification({ mode: "ON_DEMAND" });

    expect(report.phase_version).toBe("8H.4");
    expect(report.verification_state).toBe("VERIFIED");
    expect(report.integrity_status).toBe("TRUSTED");
    expect(report.integrity_state).toBe("VALID");
    expect(report.certification_ready).toBe(true);
    expect(report.certification_blocked).toBe(false);
    expect(report.failed_checks).toEqual([]);
    expect(report.verification_results.every((item) => item.passed)).toBe(true);
    expect(report.verification_record.certification_evidence.certification_evidence_hash).toBeTruthy();
  });

  it("produces deterministic verification evidence", () => {
    const first = runIntegrityVerification({ scenario: "REPLAY_NOT_REPRODUCIBLE", mode: "SCHEDULED" });
    const second = runIntegrityVerification({ scenario: "REPLAY_NOT_REPRODUCIBLE", mode: "SCHEDULED" });

    expect(first.report_hash).toBe(second.report_hash);
    expect(first.verification_record.integrity_hash).toBe(second.verification_record.integrity_hash);
    expect(first.verification_results.map((item) => item.result_hash)).toEqual(second.verification_results.map((item) => item.result_hash));
  });

  it.each([
    ["INTEGRITY_CONTRACT_INVALID", "INTEGRITY_CONTRACT_INVALID", "INVALID"],
    ["HASH_REPRODUCTION_FAILED", "HASH_REPRODUCTION_FAILED", "FAILED"],
    ["PARENT_HASH_INVALID", "PARENT_HASH_INVALID", "FAILED"],
    ["CHAIN_CONTINUITY_BROKEN", "CHAIN_CONTINUITY_BROKEN", "FAILED"],
    ["REPLAY_NOT_REPRODUCIBLE", "REPLAY_NOT_REPRODUCIBLE", "CERTIFICATION_BLOCKED"],
    ["REPLAY_CHECKPOINT_MISMATCH", "REPLAY_CHECKPOINT_MISMATCH", "CERTIFICATION_BLOCKED"],
    ["LINEAGE_INCOMPLETE", "LINEAGE_INCOMPLETE", "FAILED"],
    ["ORPHANED_ARTIFACT", "ORPHANED_ARTIFACT", "FAILED"],
    ["GOVERNANCE_REFERENCE_MISSING", "GOVERNANCE_REFERENCE_MISSING", "DEGRADED"],
    ["CONSTITUTIONAL_REFERENCE_INVALID", "CONSTITUTIONAL_REFERENCE_INVALID", "INVALID"],
    ["AUTHORITY_REFERENCE_INVALID", "AUTHORITY_REFERENCE_INVALID", "DEGRADED"],
    ["TENANT_ISOLATION_VIOLATION", "TENANT_ISOLATION_VIOLATION", "INVALID"],
    ["IMMUTABLE_IDENTIFIER_MODIFIED", "IMMUTABLE_IDENTIFIER_MODIFIED", "INVALID"],
    ["OPTIONAL_METADATA_WARNING", "OPTIONAL_METADATA_WARNING", "WARNING"],
    ["UNSUPPORTED_VERIFICATION_VERSION", "UNSUPPORTED_VERIFICATION_VERSION", "DEGRADED"],
    ["EXECUTION_DIVERGENCE_DETECTED", "EXECUTION_DIVERGENCE_DETECTED", "INVALID"],
  ] as readonly [IntegrityVerificationScenario, IntegrityVerificationFailure, IntegrityVerificationState][])(
    "maps %s to %s",
    (scenario, failure, expectedState) => {
      const report = runIntegrityVerification({ scenario });

      expect(classifyIntegrityVerificationFailure(failure)).toBe(expectedState);
      expect(report.verification_state).toBe(expectedState);
      expect(report.failed_checks).toContain(failure);
      expect(report.certification_ready).toBe(false);
      expect(report.certification_blocked).toBe(true);
    },
  );

  it("summarizes hash, replay, lineage, governance, and tenant verification", () => {
    const report = runIntegrityVerification();
    const record = report.verification_record;

    expect(record.hash_verification.chain_hash).toBe(true);
    expect(record.replay_verification.replay_result).toBe("REPRODUCIBLE");
    expect(record.lineage_verification.complete_lineage).toBe(true);
    expect(record.governance_verification.constitutional_valid).toBe(true);
    expect(record.tenant_isolation.tenant_scope_valid).toBe(true);
    expect(record.confidence_score).toBe(1);
  });

  it("blocks certification and provides repair recommendations for replay failure", () => {
    const report = runIntegrityVerification({ scenario: "REPLAY_CHECKPOINT_MISMATCH" });

    expect(report.verification_state).toBe("CERTIFICATION_BLOCKED");
    expect(report.integrity_status).toBe("COMPROMISED");
    expect(report.verification_record.replay_verification.replay_result).toBe("NOT_REPRODUCIBLE");
    expect(report.verification_record.recommended_action).toContain("Block certification");
    expect(report.verification_record.repair_recommendations.length).toBeGreaterThan(0);
  });

  it("validates report evidence completeness", () => {
    const report = runIntegrityVerification({ scenario: "HASH_REPRODUCTION_FAILED" });
    const validation = validateIntegrityVerificationReport(report);

    expect(validation.valid).toBe(false);
    expect(validation.certification_blocked).toBe(true);
    expect(validation.evidence_complete).toBe(true);
    expect(validation.failed_checks).toContain("HASH_REPRODUCTION_FAILED");
    expect(validation.report_hash).toBe(report.report_hash);
  });

  it("exposes operator verification readiness diagnostics", () => {
    const surface = buildIntegrityVerificationObservabilitySurface({ scenario: "GOVERNANCE_REFERENCE_MISSING", mode: "CONTINUOUS" });

    expect(surface.verification_mode).toBe("CONTINUOUS");
    expect(surface.verification_state).toBe("DEGRADED");
    expect(surface.integrity_status).toBe("DEGRADED");
    expect(surface.certification_ready).toBe(false);
    expect(surface.failed_checks).toContain("GOVERNANCE_REFERENCE_MISSING");
    expect(surface.evidence_hash).toBeTruthy();
  });
});
