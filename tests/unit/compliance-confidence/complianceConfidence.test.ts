import { describe, expect, it } from "vitest";
import {
  assessEvidenceConfidence,
  assessReplayValidation,
  buildComplianceConfidenceContract,
  buildComplianceConfidenceDoctrine,
  buildComplianceConfidenceObservabilitySurface,
  buildComplianceConfidenceRecord,
  calculateConfidenceScore,
  collectConfidenceInputs,
  mapConfidenceLevel,
  replayComplianceConfidence,
  scoreComplianceConfidence,
  validateComplianceConfidenceRecord,
} from "@/services/compliance-confidence";
import { evaluateCompliance } from "@/services/compliance-evaluation";
import { analyzeComplianceTrend } from "@/services/compliance-trend";

describe("Mission Control Phase 7D.4 Compliance Confidence Engine", () => {
  it("defines confidence engine, calculator, lineage, ledger, and replay validator", () => {
    const doctrine = buildComplianceConfidenceDoctrine();
    const contract = buildComplianceConfidenceContract();
    const record = scoreComplianceConfidence();
    expect(doctrine.contract_version).toBe("COMPLIANCE-CONFIDENCE-V1");
    expect(doctrine.confidence_types).toEqual(["COMPLIANCE_CONFIDENCE", "EVIDENCE_CONFIDENCE", "RECOMMENDATION_CONFIDENCE"]);
    expect(contract.baseline_confidence.confidence_id).toBeTruthy();
    expect(record.confidence_lineage.lineage_hash).toBeTruthy();
    expect(record.confidence_ledger_record.confidence_ledger_id).toBeTruthy();
    expect(record.replay_snapshot.replay_hash).toBeTruthy();
  });

  it("validates schema, rejects missing records, and rejects unknown confidence types", () => {
    expect(validateComplianceConfidenceRecord(scoreComplianceConfidence()).validation_state).toBe("VALID");
    expect(validateComplianceConfidenceRecord(undefined).errors.some((error) => error.reason === "CONFIDENCE_RECORD_MISSING")).toBe(true);
    expect(validateComplianceConfidenceRecord(buildComplianceConfidenceRecord({ confidence_type: "BAD" as never })).errors.some((error) => error.reason === "UNKNOWN_CONFIDENCE_TYPE")).toBe(true);
  });

  it("generates compliance, evidence, and recommendation confidence", () => {
    expect(scoreComplianceConfidence({ confidence_type: "COMPLIANCE_CONFIDENCE" }).confidence_type).toBe("COMPLIANCE_CONFIDENCE");
    expect(scoreComplianceConfidence({ confidence_type: "EVIDENCE_CONFIDENCE" }).confidence_type).toBe("EVIDENCE_CONFIDENCE");
    const recommendation = scoreComplianceConfidence({ confidence_type: "RECOMMENDATION_CONFIDENCE" });
    expect(recommendation.confidence_type).toBe("RECOMMENDATION_CONFIDENCE");
    expect(recommendation.recommendation_basis.length).toBeGreaterThan(0);
    expect(recommendation.required_reviews).toContain("governance_review");
  });

  it("measures evidence completeness and lowers confidence for missing evidence", () => {
    const complete = scoreComplianceConfidence();
    const missing = scoreComplianceConfidence({ scenario: "MISSING_EVIDENCE" });
    expect(complete.evidence_confidence.evidence_state).toBe("COMPLETE_TRUSTED");
    expect(missing.evidence_confidence.evidence_state).toBe("MISSING");
    expect(missing.confidence_score).toBeLessThan(complete.confidence_score);
  });

  it("measures rule coverage and lowers confidence for incomplete coverage", () => {
    const record = scoreComplianceConfidence({ scenario: "INCOMPLETE_RULE_COVERAGE" });
    expect(record.rule_coverage.missing_rules).toContain("required_rule_missing");
    expect(record.confidence_score).toBeLessThan(scoreComplianceConfidence().confidence_score);
  });

  it("measures replay validation and blocks certification confidence on mismatch", () => {
    const evaluation = evaluateCompliance();
    expect(assessReplayValidation(evaluation).replay_validation_state).toBe("REPRODUCED");
    const record = scoreComplianceConfidence({ scenario: "REPLAY_MISMATCH" });
    expect(record.replay_confidence.replay_validation_state).toBe("MISMATCH");
    expect(record.confidence_level).toBe("VERY_LOW");
    expect(validateComplianceConfidenceRecord(record).validation_state).toBe("REPLAY_MISMATCH");
  });

  it("measures lineage integrity, policy consistency, constitutional consistency, authority, and history", () => {
    expect(scoreComplianceConfidence({ scenario: "BROKEN_LINEAGE" }).lineage_confidence.lineage_integrity_state).toBe("BROKEN");
    expect(scoreComplianceConfidence({ scenario: "POLICY_INCONSISTENCY" }).consistency_confidence.consistency_conflicts).toContain("policy conflict");
    expect(scoreComplianceConfidence({ scenario: "CONSTITUTIONAL_INCONSISTENCY" }).confidence_inputs.constitutional_consistency).toBeLessThan(50);
    expect(scoreComplianceConfidence({ scenario: "AUTHORITY_UNCERTAIN" }).authority_confidence.authority_verification_state).toBe("UNCERTAIN");
    expect(scoreComplianceConfidence({ scenario: "VOLATILE_HISTORY" }).historical_stability_confidence.state).toBe("VOLATILE");
  });

  it("calculates score, level, supporting factors, missing factors, penalties, and hash deterministically", () => {
    const evaluation = evaluateCompliance();
    const trend = analyzeComplianceTrend();
    const inputs = collectConfidenceInputs(evaluation, trend);
    const a = calculateConfidenceScore(inputs);
    const b = calculateConfidenceScore(inputs);
    expect(a.score).toBe(b.score);
    expect(a.level).toBe(b.level);
    expect(a.calculation_hash).toBe(b.calculation_hash);
    expect(a.supporting.length).toBeGreaterThan(0);
    expect(mapConfidenceLevel(96)).toBe("VERY_HIGH");
  });

  it("detects confidence score, level, and calculation hash mismatches", () => {
    const record = scoreComplianceConfidence();
    expect(validateComplianceConfidenceRecord(buildComplianceConfidenceRecord({ confidence_score: 1 })).errors.some((error) => error.reason === "CONFIDENCE_SCORE_MISMATCH")).toBe(true);
    expect(validateComplianceConfidenceRecord(buildComplianceConfidenceRecord({ confidence_level: "VERY_LOW" })).errors.some((error) => error.reason === "CONFIDENCE_LEVEL_MISMATCH")).toBe(true);
    expect(validateComplianceConfidenceRecord(buildComplianceConfidenceRecord({ calculation_hash: "tampered" })).errors.some((error) => error.reason === "CALCULATION_HASH_MISMATCH")).toBe(true);
    expect(validateComplianceConfidenceRecord(buildComplianceConfidenceRecord({ evidence_confidence: { ...record.evidence_confidence, score: 1 } })).errors.some((error) => error.reason === "EVIDENCE_CONFIDENCE_MISMATCH")).toBe(true);
  });

  it("writes confidence ledger records and blocks certification on ledger failure", () => {
    const record = scoreComplianceConfidence();
    expect(record.confidence_ledger_record.truth_ledger_reference).toBe(record.truth_ledger_reference);
    const failed = scoreComplianceConfidence({ scenario: "LEDGER_WRITE_FAILURE" });
    expect(validateComplianceConfidenceRecord(failed).validation_state).toBe("CERTIFICATION_BLOCKED");
  });

  it("creates replay snapshots and reconstructs confidence", () => {
    const record = scoreComplianceConfidence();
    expect(replayComplianceConfidence(record).replay_state).toBe("REPRODUCED");
    expect(replayComplianceConfidence(buildComplianceConfidenceRecord({ calculation_hash: "tampered" })).replay_state).toBe("MISMATCH");
  });

  it("preserves tenant isolation and blocks cross-tenant confidence inputs", () => {
    expect(validateComplianceConfidenceRecord(scoreComplianceConfidence()).checks.tenant_isolation_valid).toBe(true);
    const leaked = scoreComplianceConfidence({ scenario: "CROSS_TENANT_INPUT" });
    expect(validateComplianceConfidenceRecord(leaked).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  });

  it("prohibits hidden state and exposes operator visibility", () => {
    const record = scoreComplianceConfidence();
    expect(validateComplianceConfidenceRecord({ ...record, hidden_state: true } as never).validation_state).toBe("CERTIFICATION_BLOCKED");
    const surface = buildComplianceConfidenceObservabilitySurface(record);
    expect(surface.confidence_level).toBe(record.confidence_level);
    expect(surface.evidence_confidence_score).toBe(record.evidence_confidence.score);
    expect(surface.replay_validation_state).toBe("REPRODUCED");
    expect(surface.validation_failures).toEqual([]);
  });

  it("handles recommendation confidence blockers", () => {
    const record = scoreComplianceConfidence({ confidence_type: "RECOMMENDATION_CONFIDENCE", scenario: "RECOMMENDATION_UNLINKED" });
    expect(record.confidence_level).toBe("UNKNOWN");
    expect(record.missing_factors).toContain("evidence_completeness");
  });

  it("detects tampered evidence through the evidence confidence evaluator", () => {
    const evaluation = evaluateCompliance({ scenario: "TAMPERED_EVIDENCE" });
    expect(assessEvidenceConfidence(evaluation).evidence_state).toBe("TAMPERED");
    expect(scoreComplianceConfidence({ scenario: "MISSING_EVIDENCE" }).confidence_level).not.toBe("HIGH");
  });
});
