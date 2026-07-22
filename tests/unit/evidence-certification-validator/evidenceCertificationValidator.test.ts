import { describe, expect, it } from "vitest";
import {
  getEvidenceCertificationValidatorFoundation,
  replayEvidenceCertificationValidation,
  validateEvidenceCertification,
} from "@/services/evidence-certification-validator";
import type {
  EvidenceCertificationFailure,
  EvidenceCertificationScenario,
  EvidenceCertificationValidationState,
} from "@/types/evidence-certification-validator";

describe("Mission Control Phase 10.8.7 Evidence & Certification Validator", () => {
  it("publishes the evidence certification validator foundation", () => {
    const foundation = getEvidenceCertificationValidatorFoundation();

    expect(foundation.evidence_certification_validator_version).toBe("evidence-certification-validator/v1");
    expect(foundation.api_surface.validate_evidence_certification).toBe("POST /evidence-certification-validator/validate");
    expect(foundation.api_surface.fail_open_supported).toBe(false);
    expect(foundation.api_surface.auto_implementation_supported).toBe(false);
    expect(foundation.result.validation_state).toBe("READY_FOR_SIMULATION");
  });

  it("validates evidence and certification readiness deterministically", () => {
    const first = validateEvidenceCertification({ scenario: "BASELINE" });
    const second = validateEvidenceCertification({ scenario: "BASELINE" });

    expect(first.validation.validation_id).toBe(second.validation.validation_id);
    expect(first.validation.integrity_hash).toBe(second.validation.integrity_hash);
    expect(first.integrity_hash).toBe(second.integrity_hash);
    expect(first.validation.evidence_quality_score).toBeGreaterThanOrEqual(80);
  });

  it("remains advisory-only, immutable, audit-ready, and trust-verifiable when certified", () => {
    const result = validateEvidenceCertification();

    expect(result.advisory_only).toBe(true);
    expect(result.immutable).toBe(true);
    expect(result.audit_ready).toBe(true);
    expect(result.replayable).toBe(true);
    expect(result.trust_verifiable).toBe(true);
    expect(result.fail_closed).toBe(false);
  });

  it.each([
    ["EVIDENCE_CERTIFIED", "EVIDENCE_CERTIFIED"],
    ["READY_FOR_CERTIFICATION", "READY_FOR_CERTIFICATION"],
    ["READY_FOR_SIMULATION", "READY_FOR_SIMULATION"],
    ["DOCUMENTATION_REQUIRED", "DOCUMENTATION_REQUIRED"],
    ["CERTIFICATION_PENDING", "CERTIFICATION_PENDING"],
    ["REQUIRES_OPERATOR_REVIEW", "REQUIRES_OPERATOR_REVIEW"],
    ["RESTRICTED", "RESTRICTED"],
    ["REJECTED", "REJECTED"],
  ] as readonly [EvidenceCertificationScenario, EvidenceCertificationValidationState][])("routes %s to %s", (scenario, state) => {
    expect(validateEvidenceCertification({ scenario }).validation_state).toBe(state);
  });

  it("builds complete evidence, lineage, dependency, documentation, simulation, rollback, and readiness reports", () => {
    const result = validateEvidenceCertification({ scenario: "READY_FOR_SIMULATION" });

    expect(result.validation.evidence_completeness_status).toBe("COMPLETE");
    expect(result.validation.supporting_evidence.length).toBe(10);
    expect(result.evidence_lineage_graph.complete).toBe(true);
    expect(result.validation.dependency_graph.complete).toBe(true);
    expect(result.validation.documentation_status).toBe("COMPLETE");
    expect(result.validation.simulation_prerequisite_status).toBe("READY");
    expect(result.validation.rollback_feasibility_status).toBe("VALIDATED");
    expect(result.certification_readiness_report).toContain("READY_FOR_SIMULATION");
  });

  it("records immutable evidence certification ledger decisions", () => {
    const result = validateEvidenceCertification({ scenario: "READY_FOR_CERTIFICATION" });

    expect(result.ledger_entry.append_only).toBe(true);
    expect(result.ledger_entry.immutable).toBe(true);
    expect(result.ledger_entry.validation_id).toBe(result.validation.validation_id);
    expect(result.ledger_entry.supporting_evidence.length).toBe(result.validation.supporting_evidence.length);
  });

  it.each([
    ["MISSING_REQUIRED_EVIDENCE", "REQUIRED_EVIDENCE_MISSING"],
    ["EVIDENCE_INTEGRITY_FAILURE", "EVIDENCE_INTEGRITY_VERIFICATION_FAILED"],
    ["INSUFFICIENT_EVIDENCE_QUALITY", "EVIDENCE_QUALITY_INSUFFICIENT"],
    ["BROKEN_EVIDENCE_LINEAGE", "EVIDENCE_LINEAGE_BROKEN"],
    ["UNVERIFIED_PROVENANCE", "EVIDENCE_PROVENANCE_UNVERIFIED"],
    ["INCOMPLETE_CERTIFICATION_DEPENDENCIES", "CERTIFICATION_DEPENDENCIES_INCOMPLETE"],
    ["INVALID_CERTIFICATION_CHAIN", "CERTIFICATION_CHAIN_INVALID"],
    ["MISSING_DOCUMENTATION", "DOCUMENTATION_MISSING"],
    ["INCONSISTENT_DOCUMENTATION", "DOCUMENTATION_INCONSISTENT"],
    ["UNMET_SIMULATION_PREREQUISITES", "SIMULATION_PREREQUISITES_UNSATISFIED"],
    ["ROLLBACK_UNDEMONSTRATED", "ROLLBACK_FEASIBILITY_UNDEMONSTRATED"],
    ["REPLAY_UNVERIFIED", "REPLAY_READINESS_UNVERIFIED"],
    ["AUDIT_INCOMPLETE", "AUDIT_READINESS_INCOMPLETE"],
    ["TRUST_VALIDATION_FAILURE", "TRUST_VALIDATION_FAILED"],
    ["NONDETERMINISTIC_REASONING", "NONDETERMINISTIC_VALIDATION_REASONING"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["RECORDING_FAILURE", "VALIDATION_DECISION_RECORDING_FAILED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_FAILED"],
  ] as readonly [EvidenceCertificationScenario, EvidenceCertificationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validateEvidenceCertification({ scenario });

    expect(result.failures).toContain(failure);
    expect(result.validation_state).toBe("FAIL_CLOSED");
    expect(result.fail_closed).toBe(true);
    expect(result.audit_ready).toBe(false);
    expect(result.trust_verifiable).toBe(false);
  });

  it("reports failing readiness dimensions independently", () => {
    const missingEvidence = validateEvidenceCertification({ scenario: "MISSING_REQUIRED_EVIDENCE" });
    const badQuality = validateEvidenceCertification({ scenario: "INSUFFICIENT_EVIDENCE_QUALITY" });
    const missingDocs = validateEvidenceCertification({ scenario: "MISSING_DOCUMENTATION" });
    const rollback = validateEvidenceCertification({ scenario: "ROLLBACK_UNDEMONSTRATED" });

    expect(missingEvidence.validation.evidence_completeness_status).toBe("FAILED");
    expect(badQuality.validation.evidence_quality_score).toBeLessThan(80);
    expect(missingDocs.validation.documentation_status).toBe("FAILED");
    expect(rollback.validation.rollback_feasibility_status).toBe("FAILED");
  });

  it("replays validation output and detects tampering", () => {
    const result = validateEvidenceCertification({ scenario: "BASELINE" });
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayEvidenceCertificationValidation(result)).toBe(true);
    expect(replayEvidenceCertificationValidation(tampered)).toBe(false);
  });
});
