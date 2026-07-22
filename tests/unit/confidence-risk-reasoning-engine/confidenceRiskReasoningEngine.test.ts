import { describe, expect, it, vi } from "vitest";
import {
  analyzeRisk,
  buildConfidenceRiskObservabilitySurface,
  buildConfidenceRiskReasoning,
  calculateConfidence,
  generateConfidenceNarrative,
  generateRiskNarrative,
  getConfidenceRiskRecord,
  getConfidenceRiskReasoningContract,
  replayConfidenceAnalysis,
  replayRiskAnalysis,
  validateConfidenceRiskReasoning,
} from "@/services/confidence-risk-reasoning-engine";
import type { ConfidenceRiskFailure, ConfidenceRiskScenario } from "@/types/confidence-risk-reasoning-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.5.4 Confidence & Risk Reasoning Engine", () => {
  it("defines deterministic confidence and risk reasoning doctrine", () => {
    const contract = getConfidenceRiskReasoningContract();

    expect(contract.doctrine.engine_version).toBe("confidence-risk-reasoning-engine/v8ALT.5.4");
    expect(contract.doctrine.principles).toContain("deterministic-scoring");
    expect(contract.doctrine.principles).toContain("evidence-backed-confidence");
    expect(contract.doctrine.principles).toContain("evidence-backed-risk");
    expect(contract.doctrine.principles).toContain("advisory-only-operation");
    expect(contract.validation.valid).toBe(true);
  });

  it("builds deterministic append-only reasoning repositories", () => {
    const first = buildConfidenceRiskReasoning();
    const second = buildConfidenceRiskReasoning();
    const record = getConfidenceRiskRecord(first);

    expect(first.append_only).toBe(true);
    expect(first.read_only).toBe(true);
    expect(first.repository_hash).toBe(second.repository_hash);
    expect(record?.confidence_assessments.length).toBe(10);
    expect(record?.risk_assessments.length).toBe(13);
    expect(validateConfidenceRiskReasoning(record).valid).toBe(true);
  });

  it("calculates explainable confidence and risk artifacts", () => {
    const confidence = calculateConfidence();
    const risk = analyzeRisk();

    expect(confidence.map((item) => item.category)).toContain("OVERALL_DECISION");
    expect(confidence.every((item) => item.contributing_factors.length > 0)).toBe(true);
    expect(risk.map((item) => item.risk_type)).toContain("OPERATIONAL");
    expect(risk.every((item) => item.recommended_mitigations.length > 0)).toBe(true);
  });

  it("generates deterministic operator-readable narratives", () => {
    const confidence = generateConfidenceNarrative();
    const risk = generateRiskNarrative();

    expect(confidence).toContain("Confidence:");
    expect(confidence).toContain("certified evidence");
    expect(risk).toContain("Risk:");
    expect(risk).toContain("mitigation reasoning");
  });

  it("replays confidence and risk analysis reproducibly", () => {
    const record = getConfidenceRiskRecord(buildConfidenceRiskReasoning());
    const confidenceReplay = replayConfidenceAnalysis(record);
    const riskReplay = replayRiskAnalysis(record);

    expect(confidenceReplay.replay_type).toBe("CONFIDENCE");
    expect(riskReplay.replay_type).toBe("RISK");
    expect(confidenceReplay.deterministic).toBe(true);
    expect(riskReplay.deterministic).toBe(true);
    expect(confidenceReplay.reconstructed_hash).toBe(confidenceReplay.original_hash);
    expect(riskReplay.reconstructed_hash).toBe(riskReplay.original_hash);
  });

  it("keeps confidence and risk reasoning advisory-only", () => {
    const record = getConfidenceRiskRecord(buildConfidenceRiskReasoning());

    expect(record?.advisory_only).toBe(true);
    expect(record?.plan_modified).toBe(false);
    expect(record?.execution_modified).toBe(false);
    expect(record?.evidence_modified).toBe(false);
    expect(record?.governance_modified).toBe(false);
    expect(record?.authority_escalated).toBe(false);
  });

  it.each([
    ["INCOMPLETE_EVIDENCE", "SUPPORTING_EVIDENCE_INCOMPLETE"],
    ["MISSING_CONFIDENCE_FACTORS", "CONFIDENCE_FACTORS_MISSING"],
    ["UNREPRODUCIBLE_RISK_CLASSIFICATION", "RISK_CLASSIFICATION_UNREPRODUCIBLE"],
    ["MISSING_GOVERNANCE_EVALUATIONS", "GOVERNANCE_EVALUATIONS_ABSENT"],
    ["MISSING_CONSTITUTIONAL_VALIDATION", "CONSTITUTIONAL_VALIDATION_UNAVAILABLE"],
    ["INCOMPLETE_AUTHORITY_VALIDATION", "AUTHORITY_VALIDATION_INCOMPLETE"],
    ["INVALID_REPLAY_REFERENCE", "REPLAY_REFERENCE_INVALID"],
    ["CONFIDENCE_LINEAGE_GAP", "CONFIDENCE_LINEAGE_GAP_DETECTED"],
    ["RISK_LINEAGE_GAP", "RISK_LINEAGE_GAP_DETECTED"],
    ["UNDOCUMENTED_MITIGATION", "MITIGATION_REASONING_UNDOCUMENTED"],
    ["NONDETERMINISTIC_CALCULATION", "DETERMINISTIC_CALCULATION_FAILED"],
    ["CROSS_TENANT_REFERENCE", "CROSS_TENANT_REFERENCE_DETECTED"],
    ["INTEGRITY_FAILURE", "INTEGRITY_VERIFICATION_FAILED"],
    ["ADVISORY_ONLY_VIOLATION", "ADVISORY_ONLY_VIOLATION"],
  ] as readonly [ConfidenceRiskScenario, ConfidenceRiskFailure][])("rejects %s", (scenario, failure) => {
    const record = getConfidenceRiskRecord(buildConfidenceRiskReasoning({ scenario }));
    const validation = validateConfidenceRiskReasoning(record);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("exposes observability without execution authority", () => {
    const repository = buildConfidenceRiskReasoning();
    const surface = buildConfidenceRiskObservabilitySurface(repository);

    expect(surface.repository_id).toBe(repository.repository_id);
    expect(surface.record_count).toBe(1);
    expect(surface.confidence_categories).toContain("OVERALL_DECISION");
    expect(surface.risk_types).toContain("OPERATIONAL");
    expect(surface.advisory_only).toBe(true);
  });
});
