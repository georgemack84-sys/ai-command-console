import { describe, expect, it } from "vitest";
import {
  OUTCOME_INTEGRITY_CHECKS,
  computeOutcomeIntegrityValidationHash,
  getOutcomeIntegrityValidatorFoundation,
  replayOutcomeIntegrityValidator,
  runOutcomeIntegrityValidator,
} from "@/services/outcome-integrity-validator";
import type { OutcomeIntegrityFailure, OutcomeIntegrityValidatorInput } from "@/types/outcome-integrity-validator";

describe("Mission Control Phase 10.2.5 Outcome Integrity Validator", () => {
  it("publishes the outcome integrity validator foundation", () => {
    const foundation = getOutcomeIntegrityValidatorFoundation();

    expect(foundation.outcome_integrity_validator_version).toBe("outcome-integrity-validator/v1");
    expect(foundation.checks).toEqual(OUTCOME_INTEGRITY_CHECKS);
    expect(foundation.api_surface.validate_outcome_integrity).toBe("POST /integrity/validate");
    expect(foundation.result.validation.overall_validation_state).toBe("CERTIFIED");
  });

  it("certifies complete, authentic, immutable, replayable outcomes", () => {
    const result = runOutcomeIntegrityValidator();

    expect(result.validation.overall_validation_state).toBe("CERTIFIED");
    expect(result.audit_report.adaptive_intelligence_eligible).toBe(true);
    expect(result.audit_report.certification_decision).toBe("PASS");
  });

  it("is read-only and never repairs or modifies records", () => {
    const result = runOutcomeIntegrityValidator();

    expect(result.read_only).toBe(true);
    expect(result.repairs_records).toBe(false);
    expect(result.modifies_normalized_outcomes).toBe(false);
    expect(result.modifies_lineage).toBe(false);
    expect(result.modifies_truth_ledger).toBe(false);
    expect(result.changes_evidence).toBe(false);
  });

  it("creates stable validation hashes and replay output", () => {
    const result = runOutcomeIntegrityValidator();

    expect(computeOutcomeIntegrityValidationHash(result.validation)).toBe(result.validation.integrity_hash);
    expect(replayOutcomeIntegrityValidator(result)).toBe(true);
  });

  it("produces validation results for every integrity category", () => {
    const result = runOutcomeIntegrityValidator();

    expect(result.validation_results.map((entry) => entry.validation_category)).toEqual(["SCHEMA", "REFERENCE", "IDENTITY", "EVIDENCE", "REPLAY", "LEDGER", "LINEAGE", "TENANT", "HASH", "CONSISTENCY"]);
    expect(result.validation_results.every((entry) => entry.validation_status === "PASS")).toBe(true);
  });

  it("verifies cryptographic hashes for protected records", () => {
    const result = runOutcomeIntegrityValidator();

    expect(result.hash_verifications.length).toBeGreaterThan(0);
    expect(result.hash_verifications.every((entry) => entry.hash_algorithm === "sha256")).toBe(true);
    expect(result.hash_verifications.every((entry) => entry.verification_status === "PASS")).toBe(true);
  });

  it("confirms holistic consistency across identity, lineage, references, evidence, replay, ledger, governance, and certification", () => {
    const report = runOutcomeIntegrityValidator().consistency_report;

    expect(report.identities_consistent).toBe(true);
    expect(report.lineage_consistent).toBe(true);
    expect(report.references_consistent).toBe(true);
    expect(report.evidence_consistent).toBe(true);
    expect(report.replay_consistent).toBe(true);
    expect(report.truth_ledger_consistent).toBe(true);
    expect(report.global_integrity_status).toBe("PASS");
  });

  it("publishes advisory-only validation metrics", () => {
    const result = runOutcomeIntegrityValidator();

    expect(result.metrics.validations_executed).toBe(1);
    expect(result.metrics.validation_success_rate).toBe(1);
    expect(result.metrics.hash_mismatches).toBe(0);
    expect(result.metrics.advisory_only).toBe(true);
  });

  it("exposes read-only integrity APIs", () => {
    const api = runOutcomeIntegrityValidator().api_surface;

    expect(api.verify_hashes).toBe("POST /integrity/hash/verify");
    expect(api.validate_references).toBe("POST /integrity/references");
    expect(api.retrieve_validation_report).toBe("GET /integrity/{normalized_outcome_id}");
    expect(api.retrieve_hash_verification).toBe("GET /integrity/{normalized_outcome_id}/hashes");
    expect(api.read_only).toBe(true);
    expect(api.repair_supported).toBe(false);
  });

  it.each([
    ["SCHEMA_VIOLATION", "SCHEMA_VIOLATION_REJECTED"],
    ["MISSING_REFERENCE", "MISSING_REFERENCE_REJECTED"],
    ["UNKNOWN_IDENTITY", "UNKNOWN_IDENTITY_REJECTED"],
    ["MISSING_EVIDENCE", "MISSING_EVIDENCE_REJECTED"],
    ["BROKEN_LINEAGE", "BROKEN_LINEAGE_REJECTED"],
    ["REPLAY_MISMATCH", "REPLAY_MISMATCH_REJECTED"],
    ["MISSING_TRUTH_LEDGER", "MISSING_TRUTH_LEDGER_REFERENCE_REJECTED"],
    ["CROSS_TENANT", "CROSS_TENANT_REFERENCE_REJECTED"],
    ["HASH_MISMATCH", "HASH_MISMATCH_REJECTED"],
    ["CONSISTENCY_FAILURE", "CONSISTENCY_CHECK_FAILED"],
    ["READ_ONLY_VIOLATION", "READ_ONLY_VALIDATION_VIOLATED"],
    ["EVIDENCE_AUTHENTICITY_FAILURE", "EVIDENCE_AUTHENTICITY_FAILED"],
    ["INTEGRITY_BYPASS", "INTEGRITY_VERIFICATION_BYPASSED"],
    ["INVALID_LINEAGE", "LINEAGE_NOT_VALIDATED"],
    ["FAIL_OPEN", "FAIL_OPEN_INTEGRITY_VALIDATION_BEHAVIOR"],
  ] as readonly [NonNullable<OutcomeIntegrityValidatorInput["scenario"]>, OutcomeIntegrityFailure][])("fails closed for %s", (scenario, failure) => {
    const result = runOutcomeIntegrityValidator({ scenario });

    expect(result.validation.overall_validation_state).toBe("FAILED");
    expect(result.validation.failures).toContain(failure);
    expect(result.audit_report.certification_decision).toBe("FAIL");
    expect(result.audit_report.adaptive_intelligence_eligible).toBe(false);
    expect(result.repairs_records).toBe(false);
  });

  it("fails closed when the role lacks integrity visibility", () => {
    const result = runOutcomeIntegrityValidator({ role: "ADMINISTRATOR" });

    expect(result.validation.overall_validation_state).toBe("FAILED");
    expect(result.validation.failures).toContain("AUTHORIZATION_FAILURE");
  });

  it("detects integrity validator tampering during replay", () => {
    const result = runOutcomeIntegrityValidator();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayOutcomeIntegrityValidator(tampered)).toBe(false);
  });
});
