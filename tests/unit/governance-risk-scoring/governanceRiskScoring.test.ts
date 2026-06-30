import { describe, expect, it } from "vitest";
import { analyzeGovernanceWeakness, buildGovernanceWeaknessRecord } from "@/services/governance-weakness";
import {
  applyCriticalFloors,
  buildGovernanceRiskScoringDoctrine,
  buildGovernanceRiskScoreObservabilitySurface,
  buildGovernanceRiskScoreRecord,
  calculateBaseScore,
  calculateModifiers,
  calculateRiskConfidence,
  computeGovernanceRiskScoreHash,
  generateGovernanceRiskScoreId,
  mapScoreToSeverity,
  normalizeScoringInputs,
  replayGovernanceRiskScore,
  scoreGovernanceRisk,
  transitionGovernanceRiskScoreState,
  validateGovernanceRiskScoreRecord,
} from "@/services/governance-risk-scoring";
import type { GovernanceRiskScoreRecord, NormalizedRiskScoringInputs } from "@/types/governance-risk-scoring";

function valid(overrides: Partial<GovernanceRiskScoreRecord> = {}) {
  return buildGovernanceRiskScoreRecord(overrides);
}

function scoreWith(overrides: Partial<NormalizedRiskScoringInputs>) {
  return scoreGovernanceRisk({ weaknesses: [buildGovernanceWeaknessRecord()], overrides }).scores[0];
}

describe("Mission Control Phase 7C.4 Governance Risk Scoring", () => {
  it("defines advisory-only risk scoring doctrine and versions", () => {
    const doctrine = buildGovernanceRiskScoringDoctrine();
    expect(doctrine.principles).toContain("advisory-only");
    expect(doctrine.principles).toContain("fail-closed");
    expect(doctrine.prohibited_behaviors).toContain("policy enforcement");
    expect(doctrine.allowed_severities).toEqual(["LOW", "MODERATE", "HIGH", "CRITICAL"]);
  });

  it("produces LOW, MODERATE, HIGH, and CRITICAL scores deterministically", () => {
    const low = scoreWith({ pattern_frequency: 1, pattern_trend: "DECREASING", pattern_strength: "WEAK", evidence_completeness: 1, lineage_completeness: 1, replay_impact: "NONE", control_importance: "LOW_IMPORTANCE", policy_criticality: "LOW" });
    const moderate = scoreWith({ pattern_frequency: 3, pattern_trend: "INCREASING", pattern_strength: "MODERATE", evidence_completeness: 0.9, lineage_completeness: 0.9, replay_impact: "NONE", control_importance: "STANDARD_IMPORTANCE", policy_criticality: "STANDARD" });
    const high = scoreWith({ pattern_frequency: 4, pattern_trend: "INCREASING", pattern_strength: "SEVERE", evidence_completeness: 1, lineage_completeness: 1, replay_impact: "NONE", control_importance: "HIGH_IMPORTANCE", policy_criticality: "HIGH" });
    const critical = scoreGovernanceRisk({ weaknesses: [analyzeGovernanceWeakness().weaknesses.find((weakness) => weakness.weakness_category === "TENANT_BOUNDARY_WEAKNESS")!] }).scores[0];
    expect(low.risk_severity).toBe("LOW");
    expect(moderate.risk_severity).toBe("MODERATE");
    expect(high.risk_severity).toBe("HIGH");
    expect(critical.risk_severity).toBe("CRITICAL");
  }, 30000);

  it("normalizes inputs and selects deterministic base scores", () => {
    const weakness = buildGovernanceWeaknessRecord();
    const inputs = normalizeScoringInputs(weakness);
    expect(inputs.weakness_category).toBe(weakness.weakness_category);
    expect(calculateBaseScore("CONTROL_WEAKNESS_RISK")).toBe(20);
    expect(calculateBaseScore("TENANT_ISOLATION_RISK")).toBe(40);
  });

  it("applies modifiers and critical floors deterministically", () => {
    const inputs = normalizeScoringInputs(buildGovernanceWeaknessRecord(), { pattern_frequency: 5, pattern_trend: "INCREASING", pattern_strength: "SEVERE", authority_impact: "SEVERE" });
    const modifiers = calculateModifiers(inputs, ["evidence_1"]);
    expect(modifiers.rules).toContain("recurring_pattern");
    expect(modifiers.rules).toContain("authority_expansion_detected");
    expect(modifiers.modifier_score).toBe(modifiers.drivers.reduce((sum, driver) => sum + driver.score_impact, 0));
    expect(applyCriticalFloors(10, { ...inputs, tenant_isolation_impact: "CONFIRMED" }).final_score).toBe(75);
  });

  it("maps severity thresholds reproducibly", () => {
    expect(mapScoreToSeverity(0)).toBe("LOW");
    expect(mapScoreToSeverity(25)).toBe("MODERATE");
    expect(mapScoreToSeverity(50)).toBe("HIGH");
    expect(mapScoreToSeverity(75)).toBe("CRITICAL");
  });

  it("calculates confidence independently from severity", () => {
    const weakness = buildGovernanceWeaknessRecord();
    const inputs = normalizeScoringInputs(weakness);
    const confidence = calculateRiskConfidence(inputs, weakness);
    const record = valid();
    expect(record.confidence_score).toBe(confidence.confidence_score);
    const changedSeverity = valid({ risk_score: 90, risk_severity: "CRITICAL" });
    expect(changedSeverity.confidence_score).toBe(record.confidence_score);
  }, 30000);

  it("extracts evidence-backed risk drivers and evidence summary", () => {
    const record = valid();
    expect(record.risk_drivers.length).toBeGreaterThan(0);
    expect(record.risk_drivers.every((driver) => driver.evidence_refs.length > 0)).toBe(true);
    expect(record.evidence_summary.supporting_evidence_count).toBe(record.evidence_refs.length);
    expect(record.evidence_summary.related_pattern_count).toBe(record.related_patterns.length);
  });

  it("builds and validates a complete risk score record", () => {
    const record = valid();
    const result = validateGovernanceRiskScoreRecord(record);
    expect(record.contract_version).toBe("GOV-RISK-SCORE-CONTRACT-V1");
    expect(result.validation_state).toBe("VALID");
    expect(result.errors).toEqual([]);
  });

  it("generates deterministic tenant-bound identities and hashes", () => {
    const record = valid();
    expect(generateGovernanceRiskScoreId("tenant_alpha", "mission_query_layer", "GWEAK-1")).toBe(generateGovernanceRiskScoreId("tenant_alpha", "mission_query_layer", "GWEAK-1"));
    expect(computeGovernanceRiskScoreHash(record)).toBe(record.risk_hash);
  }, 30000);

  it("fails closed for missing fields, versions, categories, strengths, trends, and hidden state", () => {
    expect(validateGovernanceRiskScoreRecord(valid({ tenant_id: "" })).errors.some((error) => error.reason === "TENANT_ID_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ risk_category: "BAD" as never })).errors.some((error) => error.reason === "UNKNOWN_RISK_CATEGORY")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ scoring_model_version: "" as never })).errors.some((error) => error.reason === "SCORING_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ confidence_model_version: "" as never })).errors.some((error) => error.reason === "CONFIDENCE_MODEL_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ severity_threshold_version: "" as never })).errors.some((error) => error.reason === "THRESHOLD_VERSION_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ scoring_basis: { ...valid().scoring_basis, scoring_inputs: { ...valid().scoring_basis.scoring_inputs, pattern_strength: "BAD" as never } } })).errors.some((error) => error.reason === "INVALID_PATTERN_STRENGTH")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ scoring_basis: { ...valid().scoring_basis, scoring_inputs: { ...valid().scoring_basis.scoring_inputs, pattern_trend: "SIDEWAYS" as never } } })).errors.some((error) => error.reason === "INVALID_TREND_DIRECTION")).toBe(true);
    expect(validateGovernanceRiskScoreRecord({ ...valid(), hidden_scoring_state: "secret" } as never).errors.some((error) => error.reason === "HIDDEN_SCORING_STATE")).toBe(true);
  }, 30000);

  it("detects base score, modifier, threshold, confidence, explanation, and replay mismatches", () => {
    expect(validateGovernanceRiskScoreRecord(valid({ scoring_basis: { ...valid().scoring_basis, base_score: 99 } })).errors.some((error) => error.reason === "BASE_SCORE_MISMATCH")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ scoring_basis: { ...valid().scoring_basis, modifier_score: 999 } })).errors.some((error) => error.reason === "MODIFIER_SCORE_MISMATCH")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ risk_score: 90, risk_severity: "LOW" })).errors.some((error) => error.reason === "THRESHOLD_MISMATCH")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ confidence_score: 2 })).errors.some((error) => error.reason === "CONFIDENCE_MISMATCH")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ explanation: "unsupported claim" })).errors.some((error) => error.reason === "UNSUPPORTED_EXPLANATION")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ risk_hash: "tampered" })).errors.some((error) => error.reason === "RISK_HASH_MISMATCH")).toBe(true);
  }, 30000);

  it("rejects missing drivers, evidence summary, references, source hashes, and cross-tenant inputs", () => {
    expect(validateGovernanceRiskScoreRecord(valid({ risk_drivers: [] })).errors.some((error) => error.reason === "RISK_DRIVERS_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ risk_drivers: [{ ...valid().risk_drivers[0], evidence_refs: [] }] })).errors.some((error) => error.reason === "RISK_DRIVER_EVIDENCE_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ evidence_summary: undefined as never })).errors.some((error) => error.reason === "EVIDENCE_SUMMARY_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ evidence_refs: [] })).errors.some((error) => error.reason === "EVIDENCE_REFS_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ lineage_refs: [] })).validation_state).toBe("LINEAGE_REFERENCE_MISSING");
    expect(validateGovernanceRiskScoreRecord(valid({ replay_refs: [] })).validation_state).toBe("REPLAY_REFERENCE_MISSING");
    expect(validateGovernanceRiskScoreRecord(valid({ risk_replay_package: { ...valid().risk_replay_package, source_record_hashes: [] } })).errors.some((error) => error.reason === "SOURCE_HASHES_MISSING")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ evidence_refs: ["evidence_tenant_beta_001"] })).validation_state).toBe("TENANT_SCOPE_VIOLATION");
  }, 30000);

  it("validates lifecycle transitions and blocks invalid transitions", () => {
    expect(transitionGovernanceRiskScoreState(valid(), "UNDER_REVIEW").validation_state).toBe("VALID");
    expect(transitionGovernanceRiskScoreState(valid({ risk_state: "ARCHIVED" }), "SCORED").errors.some((error) => error.reason === "INVALID_STATE_TRANSITION")).toBe(true);
    expect(validateGovernanceRiskScoreRecord(valid({ risk_state: "ACTIVE" as never })).validation_state).toBe("INVALID_STATE");
  });

  it("replays risk scores deterministically and detects tampering", () => {
    const record = valid();
    expect(replayGovernanceRiskScore(record).validation_state).toBe("PASS");
    expect(replayGovernanceRiskScore(valid({ risk_hash: "tampered" })).validation_state).toBe("FAIL");
  });

  it("builds complete operator observability", () => {
    const surface = buildGovernanceRiskScoreObservabilitySurface(valid());
    expect(surface.risk_score).toBeGreaterThanOrEqual(0);
    expect(surface.scoring_model_version).toBe("GOV-RISK-SCORE-V1");
    expect(surface.evidence_summary.supporting_evidence_count).toBeGreaterThan(0);
    expect(surface.validation_failures).toEqual([]);
  });
});
