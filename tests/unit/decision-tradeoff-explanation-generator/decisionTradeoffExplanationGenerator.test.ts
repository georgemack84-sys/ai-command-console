import { describe, expect, it } from "vitest";
import {
  REQUIRED_TRADEOFF_SECTIONS,
  buildTradeoffExplanationObservability,
  computeTradeoffExplanationIntegrityHash,
  generateDecisionComparisonReport,
  generateTradeoffExplanation,
  generateTradeoffExplanations,
  getTradeoffExplanationGeneratorFoundation,
  replayTradeoffExplanations,
  validateTradeoffExplanation,
} from "@/services/decision-tradeoff-explanation-generator";
import { arbitrateClassifiedConflicts, arbitrateClassification } from "@/services/decision-arbitration-rules-engine";
import { classifyDetectedConflict, generateConflictClassificationReport } from "@/services/decision-conflict-classification-engine";
import { registerConflict } from "@/services/decision-conflict-detection-contract";

describe("Mission Control Phase 9.6.5 Tradeoff Explanation Generator", () => {
  it("publishes the explanation foundation with all mandatory sections", () => {
    const foundation = getTradeoffExplanationGeneratorFoundation();

    expect(foundation.generator_version).toBe("tradeoff-explanation-generator/v1");
    expect(foundation.required_sections).toEqual(REQUIRED_TRADEOFF_SECTIONS);
    expect(foundation.result.explanation_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic tradeoff explanations without changing arbitration outcomes", () => {
    const arbitration = arbitrateClassifiedConflicts().arbitrations[0];
    const first = generateTradeoffExplanation(arbitration);
    const second = generateTradeoffExplanation(arbitration);

    expect(first).toEqual(second);
    expect(first.arbitration_id).toBe(arbitration.arbitration_id);
    expect(first.explanation_sections.map((section) => section.section_name)).toEqual(REQUIRED_TRADEOFF_SECTIONS);
    expect(first.integrity_hash).toBe(computeTradeoffExplanationIntegrityHash(first));
    expect(arbitration.arbitration_outcome).toBeDefined();
  });

  it("documents selected and rejected decisions plus supporting and rejected evidence", () => {
    const conflict = registerConflict({ candidate_refs: ["candidate_a", "candidate_b"] }).conflict!;
    const classification = {
      ...classifyDetectedConflict(conflict),
      primary_category: "Recommendation" as const,
      secondary_categories: [] as const,
      governance_impact: "NONE" as const,
      operator_visibility: "STANDARD" as const,
      severity: "MEDIUM" as const,
      severity_score: 40,
    };
    const report = generateConflictClassificationReport(conflict, classification);
    const arbitration = arbitrateClassification(classification, report);
    const explanation = generateTradeoffExplanation(arbitration);

    expect(explanation.selected_decision).toBe("candidate_a,candidate_b");
    expect(explanation.rejected_decisions).toEqual([]);
    expect(explanation.supporting_evidence_refs).toContain("evidence_candidate_a");
    expect(explanation.rejected_evidence_refs.length).toBeGreaterThan(0);
    expect(explanation.explanation_sections.find((section) => section.section_name === "Evidence Analysis")?.content).toContain("rejected evidence");
  });

  it("generates complete decision comparison reports", () => {
    const arbitration = arbitrateClassifiedConflicts().arbitrations[0];
    const explanation = generateTradeoffExplanation(arbitration);
    const report = generateDecisionComparisonReport(arbitration, explanation);

    expect(report.arbitration_id).toBe(arbitration.arbitration_id);
    expect(report.compared_decisions).toEqual(arbitration.evaluated_candidates);
    expect(report.evidence_analysis).toContain("Supporting evidence");
    expect(report.governance_analysis).toBe(explanation.governance_reasoning);
    expect(report.constitutional_analysis).toBe(explanation.constitutional_reasoning);
    expect(report.selected_outcome).toBe(arbitration.arbitration_outcome);
  });

  it("preserves governance and constitutional reasoning before mission, forecast, and recovery analysis", () => {
    const explanation = generateTradeoffExplanations().explanations[0];
    const sectionNames = explanation.explanation_sections.map((section) => section.section_name);

    expect(explanation.governance_reasoning).toContain("Governance");
    expect(explanation.constitutional_reasoning).toContain("Constitutional");
    expect(sectionNames.indexOf("Constitutional Analysis")).toBeLessThan(sectionNames.indexOf("Mission Analysis"));
    expect(sectionNames.indexOf("Governance Analysis")).toBeLessThan(sectionNames.indexOf("Mission Analysis"));
  });

  it("fails closed for incomplete evidence, omitted rejected evidence, missing reasoning, missing sections, and advisory-only violations", () => {
    const arbitration = arbitrateClassifiedConflicts().arbitrations[0];
    const explanation = generateTradeoffExplanation(arbitration);
    const report = generateDecisionComparisonReport(arbitration, explanation);

    expect(validateTradeoffExplanation(arbitration, { ...explanation, supporting_evidence_refs: [] }, report).failures).toContain("INCOMPLETE_EVIDENCE");
    expect(validateTradeoffExplanation(arbitration, { ...explanation, rejected_evidence_refs: [] }, report).failures).toContain("OMITTED_REJECTED_EVIDENCE");
    expect(validateTradeoffExplanation(arbitration, { ...explanation, governance_reasoning: "" }, report).failures).toContain("MISSING_GOVERNANCE_REASONING");
    expect(validateTradeoffExplanation(arbitration, { ...explanation, constitutional_reasoning: "" }, report).failures).toContain("MISSING_CONSTITUTIONAL_REASONING");
    expect(validateTradeoffExplanation(arbitration, { ...explanation, explanation_sections: explanation.explanation_sections.slice(1) }, report).failures).toContain("MISSING_MANDATORY_SECTION");
    expect(validateTradeoffExplanation(arbitration, { ...explanation, advisory_only: false as true }, report).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("fails closed for missing arbitration records, unauthorized access, replay mismatch, and integrity drift", () => {
    const result = generateTradeoffExplanations();
    const arbitration = arbitrateClassifiedConflicts().arbitrations[0];
    const explanation = generateTradeoffExplanation(arbitration);
    const unauthorized = generateTradeoffExplanations({ authorized_component: "unknown" });
    const empty = generateTradeoffExplanations({ arbitrations: [] });
    const replayMismatch = generateTradeoffExplanations({ replay_expected_hash: `${result.replay_hash}_wrong` });

    expect(unauthorized.failures).toContain("UNAUTHORIZED_ACCESS");
    expect(empty.failures).toContain("MISSING_ARBITRATION_RECORDS");
    expect(replayMismatch.failures).toContain("REPLAY_CORRUPTION");
    expect(validateTradeoffExplanation(arbitration, { ...explanation, tradeoff_summary: "tampered" }).failures).toContain("INTEGRITY_HASH_MISMATCH");
  });

  it("replays explanations, reports, and tradeoff ledger records deterministically", () => {
    const result = generateTradeoffExplanations();
    const replay = replayTradeoffExplanations(result);
    const tampered = replayTradeoffExplanations({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.explanation_refs).toEqual(result.explanations.map((explanation) => explanation.explanation_id));
    expect(replay.report_refs).toEqual(result.reports.map((report) => report.report_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_CORRUPTION");
  });

  it("publishes explanation observability metrics", () => {
    const result = generateTradeoffExplanations();
    const metrics = buildTradeoffExplanationObservability(result);

    expect(metrics.explanations_generated).toBe(result.explanations.length);
    expect(metrics.reports_generated).toBe(result.reports.length);
    expect(metrics.evidence_comparisons_completed).toBe(result.explanations.length);
    expect(metrics.governance_explanations_generated).toBe(result.explanations.length);
    expect(metrics.constitutional_explanations_generated).toBe(result.explanations.length);
    expect(metrics.replay_success_rate).toBe(1);
    expect(metrics.validation_failures).toBe(0);
    expect(metrics.integrity_failures).toBe(0);
  });
});
