import { describe, expect, it } from "vitest";
import { generateAlternativesTradeoff } from "@/services/alternatives-tradeoff-generator";
import { buildDecisionPackage } from "@/services/decision-package-builder";
import { generateRecommendationRationale } from "@/services/recommendation-rationale-generator";
import {
  EVIDENCE_RISK_CONFIDENCE_SUMMARY_STATES,
  assessEvidenceQuality,
  computeConfidenceSummaryRecordHash,
  computeEvidenceQualityAssessmentHash,
  computeEvidenceRiskConfidenceSummaryHash,
  computeRiskSummaryRecordHash,
  createConfidenceSummaryRecord,
  createEvidenceRiskConfidenceSummary,
  createRiskSummaryRecord,
  getEvidenceRiskConfidenceFoundation,
  replayEvidenceRiskConfidence,
  summarizeEvidenceRiskConfidence,
} from "@/services/evidence-risk-confidence-summarization";

describe("Mission Control Phase 9.8.5 Evidence, Risk & Confidence Summarization", () => {
  it("publishes the evidence risk confidence foundation", () => {
    const foundation = getEvidenceRiskConfidenceFoundation();

    expect(foundation.summarizer_version).toBe("evidence-risk-confidence-summarization/v1");
    expect(foundation.summary_states).toEqual(EVIDENCE_RISK_CONFIDENCE_SUMMARY_STATES);
    expect(foundation.result.summarization_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic evidence, risk, and confidence summaries", () => {
    const first = summarizeEvidenceRiskConfidence();
    const second = summarizeEvidenceRiskConfidence();

    expect(first).toEqual(second);
    expect(first.summary.supporting_evidence_summary).toContain("Evidence refs");
    expect(first.summary.conflicting_evidence_summary.length).toBeGreaterThan(0);
    expect(first.quality_assessment.evidence_quality_score).toBeGreaterThan(0);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.evidence_ledger).toHaveLength(1);
  });

  it("preserves evidence quality, risk, confidence, replay, lineage, and advisory-only status", () => {
    const result = summarizeEvidenceRiskConfidence();

    expect(result.quality_assessment.evidence_sources.length).toBeGreaterThan(0);
    expect(result.quality_assessment.evidence_completeness).toBe("COMPLETE");
    expect(result.risk_record.overall_risk_profile).toBe("MEDIUM");
    expect(result.confidence_record.confidence_assessment).toBe("HIGH");
    expect(result.summary.replay_ref).toBe(result.package_build_result.package.replay_ref);
    expect(result.summary.lineage_ref).toBe(result.package_build_result.package.lineage_ref);
    expect(result.summary.advisory_only).toBe(true);
  });

  it("fails closed when supporting/conflicting evidence, quality, risk, or confidence summaries are missing", () => {
    const packageBuild = buildDecisionPackage();
    const rationale = generateRecommendationRationale({ package_build_result: packageBuild });
    const alternatives = generateAlternativesTradeoff({ package_build_result: packageBuild, rationale_result: rationale });
    const quality = assessEvidenceQuality(packageBuild, alternatives);
    const risk = createRiskSummaryRecord(packageBuild, alternatives);
    const confidence = createConfidenceSummaryRecord(packageBuild, rationale, quality);
    const summary = createEvidenceRiskConfidenceSummary(packageBuild, rationale, alternatives, quality, risk, confidence);

    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, supporting_evidence_summary: "", integrity_hash: computeEvidenceRiskConfidenceSummaryHash({ ...summary, supporting_evidence_summary: "" }) } }).failures).toContain("SUPPORTING_EVIDENCE_MISSING");
    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, conflicting_evidence_summary: "", integrity_hash: computeEvidenceRiskConfidenceSummaryHash({ ...summary, conflicting_evidence_summary: "" }) } }).failures).toContain("CONFLICTING_EVIDENCE_UNAVAILABLE");
    expect(summarizeEvidenceRiskConfidence({ quality_assessment: { ...quality, evidence_completeness: "MISSING" as const, integrity_hash: computeEvidenceQualityAssessmentHash({ ...quality, evidence_completeness: "MISSING" as const }) } }).failures).toContain("EVIDENCE_QUALITY_ASSESSMENT_MISSING");
    expect(summarizeEvidenceRiskConfidence({ risk_record: { ...risk, operational_risk: "", integrity_hash: computeRiskSummaryRecordHash({ ...risk, operational_risk: "" }) } }).failures).toContain("RISK_SUMMARY_MISSING");
    expect(summarizeEvidenceRiskConfidence({ confidence_record: { ...confidence, recommendation_confidence: "", integrity_hash: computeConfidenceSummaryRecordHash({ ...confidence, recommendation_confidence: "" }) } }).failures).toContain("CONFIDENCE_SUMMARY_MISSING");
  });

  it("rejects replay gaps, lineage gaps, integrity tampering, tenant mismatch, and advisory-only violations", () => {
    const valid = summarizeEvidenceRiskConfidence();
    const summary = valid.summary;

    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, replay_ref: "", integrity_hash: computeEvidenceRiskConfidenceSummaryHash({ ...summary, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, lineage_ref: "", integrity_hash: computeEvidenceRiskConfidenceSummaryHash({ ...summary, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, risk_summary: "tampered" } }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, tenant_id: "tenant_beta", integrity_hash: computeEvidenceRiskConfidenceSummaryHash({ ...summary, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(summarizeEvidenceRiskConfidence({ summary: { ...summary, advisory_only: false as true, integrity_hash: computeEvidenceRiskConfidenceSummaryHash({ ...summary, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("detects invalid upstream package/rationale/alternatives, unauthorized access, and replay divergence", () => {
    const valid = summarizeEvidenceRiskConfidence();
    const badPackage = { ...valid.package_build_result, builder_status: "FAIL" as const };
    const badRationale = { ...valid.rationale_result, generator_status: "FAIL" as const };
    const badAlternatives = { ...valid.alternatives_result, generator_status: "FAIL" as const };

    expect(summarizeEvidenceRiskConfidence({ package_build_result: badPackage }).failures).toContain("PACKAGE_BUILD_INVALID");
    expect(summarizeEvidenceRiskConfidence({ rationale_result: badRationale }).failures).toContain("RATIONALE_INVALID");
    expect(summarizeEvidenceRiskConfidence({ alternatives_result: badAlternatives }).failures).toContain("ALTERNATIVES_INVALID");
    expect(summarizeEvidenceRiskConfidence({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_EVIDENCE_SUMMARIZER_ACCESS");
    expect(summarizeEvidenceRiskConfidence({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays evidence risk confidence summaries deterministically", () => {
    const result = summarizeEvidenceRiskConfidence();
    const replay = replayEvidenceRiskConfidence(result);
    const tampered = replayEvidenceRiskConfidence({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.summary_id).toBe(result.summary.summary_id);
    expect(replay.evidence_sources).toEqual(result.quality_assessment.evidence_sources);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
