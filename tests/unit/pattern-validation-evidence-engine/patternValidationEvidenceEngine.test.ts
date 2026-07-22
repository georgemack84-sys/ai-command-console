import { describe, expect, it } from "vitest";
import {
  computePatternValidationRecordHash,
  getPatternValidationEvidenceFoundation,
  replayPatternEvidenceValidation,
  validatePatternEvidence,
} from "@/services/pattern-validation-evidence-engine";
import type { PatternValidationFailure, PatternValidationScenario } from "@/types/pattern-validation-evidence-engine";

describe("Mission Control Phase 10.4.4 Pattern Validation & Evidence Engine", () => {
  it("publishes the pattern validation evidence foundation", () => {
    const foundation = getPatternValidationEvidenceFoundation();

    expect(foundation.pattern_validation_evidence_engine_version).toBe("pattern-validation-evidence-engine/v1");
    expect(foundation.api_surface.validate_pattern).toBe("POST /pattern-validation-evidence-engine/validate");
    expect(foundation.result.validation.state).toBe("VALIDATED");
  });

  it("accepts complete, replayable, evidence-backed detected patterns", () => {
    const result = validatePatternEvidence();
    const record = result.validation_records[0];

    expect(record.validation_result).toBe("ACCEPTED");
    expect(record.validation_state).toBe("VALIDATED");
    expect(record.rejection_reason).toBe("NONE");
    expect(result.validation.valid).toBe(true);
  });

  it("keeps validation advisory-only and non-adaptive", () => {
    const result = validatePatternEvidence();
    const record = result.validation_records[0];

    expect(record.advisory_only).toBe(true);
    expect(record.modifies_recommendations).toBe(false);
    expect(record.modifies_governance).toBe(false);
    expect(record.adaptive_behavior).toBe(false);
    expect(result.strategic_scoring).toBe(false);
  });

  it("labels weak but technically supported patterns as low confidence", () => {
    const result = validatePatternEvidence({ scenario: "WEAK_PATTERN" });
    const record = result.validation_records[0];

    expect(record.validation_result).toBe("LOW_CONFIDENCE_PATTERN");
    expect(record.validation_state).toBe("LOW_CONFIDENCE_PATTERN");
    expect(record.weak_pattern_detected).toBe(true);
    expect(result.registry.low_confidence_pattern_refs).toEqual([record.pattern_id]);
  });

  it("creates stable validation hashes and replay output", () => {
    const result = validatePatternEvidence();
    const record = result.validation_records[0];

    expect(computePatternValidationRecordHash(record)).toBe(record.integrity_hash);
    expect(replayPatternEvidenceValidation(result)).toBe(true);
  });

  it("records immutable append-only validation registry history", () => {
    const result = validatePatternEvidence();
    const record = result.validation_records[0];

    expect(result.registry.append_only).toBe(true);
    expect(result.registry.immutable).toBe(true);
    expect(result.registry.deleted).toBe(false);
    expect(result.registry.validation_refs).toEqual([record.validation_id]);
    expect(result.registry.accepted_pattern_refs).toEqual([record.pattern_id]);
  });

  it("validates evidence, support, recurrence, history, governance, replay, tenant isolation, and lineage", () => {
    const result = validatePatternEvidence();

    expect(result.validation.evidence_complete).toBe(true);
    expect(result.validation.support_sufficient).toBe(true);
    expect(result.validation.recurrence_valid).toBe(true);
    expect(result.validation.historical_consistent).toBe(true);
    expect(result.validation.governance_traceable).toBe(true);
    expect(result.validation.replay_validated).toBe(true);
    expect(result.validation.tenant_isolated).toBe(true);
    expect(result.validation.lineage_complete).toBe(true);
  });

  it.each([
    ["DETECTION_INVALID", "DETECTION_INVALID"],
    ["MISSING_EVIDENCE", "INSUFFICIENT_EVIDENCE"],
    ["CORRUPTED_EVIDENCE", "CORRUPTED_EVIDENCE"],
    ["UNSUPPORTED_EVIDENCE", "UNSUPPORTED_EVIDENCE"],
    ["WEAK_SUPPORT", "SUPPORT_THRESHOLD_UNMET"],
    ["LOW_RECURRENCE", "RECURRENCE_THRESHOLD_UNMET"],
    ["HISTORICAL_INCONSISTENCY", "HISTORICAL_INCONSISTENCY"],
    ["MISSING_GOVERNANCE", "GOVERNANCE_LINEAGE_MISSING"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED"],
    ["CONSTITUTIONAL_FAILURE", "CONSTITUTIONAL_VIOLATION"],
    ["REPLAY_DIVERGENCE", "REPLAY_DIVERGENCE"],
    ["CROSS_TENANT", "TENANT_ISOLATION_VIOLATED"],
    ["HASH_MISMATCH", "INTEGRITY_VERIFICATION_FAILED"],
    ["MISSING_LINEAGE", "MISSING_LINEAGE"],
    ["MISSING_EXPLANATION", "EXPLANATION_MISSING"],
    ["REGISTRY_MUTATION", "REGISTRY_MUTATION_DETECTED"],
    ["AUTONOMOUS_BEHAVIOR", "AUTONOMOUS_BEHAVIOR_DETECTED"],
    ["FAIL_OPEN", "FAIL_OPEN_BEHAVIOR"],
  ] as readonly [PatternValidationScenario, PatternValidationFailure][])("fails closed for %s", (scenario, failure) => {
    const result = validatePatternEvidence({ scenario });

    expect(result.validation.valid).toBe(false);
    expect(result.validation.failures).toContain(failure);
    expect(result.advisory_only).toBe(true);
    expect(result.adaptive_behavior).toBe(false);
  });

  it("rejects unsupported patterns with a rejection reason", () => {
    const result = validatePatternEvidence({ scenario: "UNSUPPORTED_EVIDENCE" });
    const record = result.validation_records[0];

    expect(record.validation_result).toBe("REJECTED");
    expect(record.rejection_reason).toBe("UNSUPPORTED_EVIDENCE");
    expect(result.registry.rejected_pattern_refs).toEqual([record.pattern_id]);
  });

  it("detects validation tampering during replay", () => {
    const result = validatePatternEvidence();
    const tampered = { ...result, replay_hash: "tampered" };

    expect(replayPatternEvidenceValidation(tampered)).toBe(false);
  });
});
