import { describe, expect, it } from "vitest";
import { buildDecisionPackage } from "@/services/decision-package-builder";
import {
  ALTERNATIVE_ANALYSIS_STATES,
  OPPORTUNITY_COST_CATEGORIES,
  TRADEOFF_CATEGORIES,
  computeAlternativeDecisionAnalysisHash,
  computeAlternativeOptionHash,
  computeComparativeDecisionReportHash,
  computeRejectedOptionHash,
  computeTradeoffAnalysisHash,
  createAlternativeDecisionAnalysis,
  generateAlternativesTradeoff,
  generateComparativeDecisionReport,
  generateTradeoffAnalysis,
  getAlternativesTradeoffFoundation,
  replayAlternativesTradeoff,
  renderAlternativeOptions,
  analyzeRejectedOptions,
} from "@/services/alternatives-tradeoff-generator";

describe("Mission Control Phase 9.8.4 Alternatives & Tradeoff Generator", () => {
  it("publishes the alternatives tradeoff foundation", () => {
    const foundation = getAlternativesTradeoffFoundation();

    expect(foundation.generator_version).toBe("alternatives-tradeoff-generator/v1");
    expect(foundation.analysis_states).toEqual(ALTERNATIVE_ANALYSIS_STATES);
    expect(foundation.tradeoff_categories).toEqual(TRADEOFF_CATEGORIES);
    expect(foundation.opportunity_cost_categories).toEqual(OPPORTUNITY_COST_CATEGORIES);
    expect(foundation.result.generator_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic alternative and tradeoff analysis", () => {
    const first = generateAlternativesTradeoff();
    const second = generateAlternativesTradeoff();

    expect(first).toEqual(second);
    expect(first.alternative_records.length).toBeGreaterThan(0);
    expect(first.rejected_records.length).toBeGreaterThan(0);
    expect(first.tradeoff_analysis.compared_options).toContain(first.analysis.recommended_option);
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.analysis_ledger).toHaveLength(1);
  });

  it("preserves alternative ordering, rejected option rationale, opportunity costs, and comparative report", () => {
    const result = generateAlternativesTradeoff();

    expect(result.alternative_records.map((item) => item.option_id)).toEqual(result.analysis.alternative_options);
    expect(result.rejected_records.every((item) => item.rejection_reason.length > 0)).toBe(true);
    expect(result.tradeoff_analysis.opportunity_costs.length).toBeGreaterThan(0);
    expect(result.comparative_report.comparison_matrix.length).toBeGreaterThan(0);
    expect(result.comparative_report.operator_summary).toContain("Opportunity costs");
  });

  it("fails closed when alternatives, rejected options, or rejection rationale are missing", () => {
    const packageBuild = buildDecisionPackage();
    const rejected = analyzeRejectedOptions(packageBuild);
    const alternatives = renderAlternativeOptions(packageBuild);
    const badRejected = [{ ...rejected[0]!, rejection_reason: "", integrity_hash: computeRejectedOptionHash({ ...rejected[0]!, rejection_reason: "" }) }];

    expect(generateAlternativesTradeoff({ package_build_result: packageBuild, alternative_records: [] }).failures).toContain("ALTERNATIVES_MISSING");
    expect(generateAlternativesTradeoff({ package_build_result: packageBuild, rejected_records: [] }).failures).toContain("REJECTED_OPTIONS_UNAVAILABLE");
    expect(generateAlternativesTradeoff({ package_build_result: packageBuild, alternative_records: alternatives, rejected_records: badRejected }).failures).toContain("REJECTION_RATIONALE_ABSENT");
  });

  it("fails closed when tradeoffs, opportunity costs, reports, replay, or lineage are incomplete", () => {
    const packageBuild = buildDecisionPackage();
    const alternatives = renderAlternativeOptions(packageBuild);
    const rejected = analyzeRejectedOptions(packageBuild);
    const tradeoff = generateTradeoffAnalysis(packageBuild, alternatives, rejected);
    const report = generateComparativeDecisionReport(packageBuild, alternatives, rejected, tradeoff);
    const analysis = createAlternativeDecisionAnalysis(packageBuild, alternatives, rejected, tradeoff, report);

    expect(generateAlternativesTradeoff({ tradeoff_analysis: { ...tradeoff, tradeoff_summary: "", integrity_hash: computeTradeoffAnalysisHash({ ...tradeoff, tradeoff_summary: "" }) } }).failures).toContain("TRADEOFF_SUMMARY_MISSING");
    expect(generateAlternativesTradeoff({ tradeoff_analysis: { ...tradeoff, opportunity_costs: [], integrity_hash: computeTradeoffAnalysisHash({ ...tradeoff, opportunity_costs: [] }) } }).failures).toContain("OPPORTUNITY_COSTS_UNAVAILABLE");
    expect(generateAlternativesTradeoff({ comparative_report: { ...report, operator_summary: "", integrity_hash: computeComparativeDecisionReportHash({ ...report, operator_summary: "" }) } }).failures).toContain("COMPARATIVE_REPORT_INCOMPLETE");
    expect(generateAlternativesTradeoff({ analysis: { ...analysis, replay_ref: "", integrity_hash: computeAlternativeDecisionAnalysisHash({ ...analysis, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(generateAlternativesTradeoff({ analysis: { ...analysis, lineage_ref: "", integrity_hash: computeAlternativeDecisionAnalysisHash({ ...analysis, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
  });

  it("detects invalid package/rationale, tenant mismatch, advisory violation, tampering, unauthorized access, and replay divergence", () => {
    const valid = generateAlternativesTradeoff();
    const badBuild = { ...valid.package_build_result, builder_status: "FAIL" as const };
    const badRationale = { ...valid.rationale_result, generator_status: "FAIL" as const };
    const wrongTenant = { ...valid.analysis, tenant_id: "tenant_beta", integrity_hash: computeAlternativeDecisionAnalysisHash({ ...valid.analysis, tenant_id: "tenant_beta" }) };
    const executionAnalysis = { ...valid.analysis, advisory_only: false as true, integrity_hash: computeAlternativeDecisionAnalysisHash({ ...valid.analysis, advisory_only: false as true }) };
    const tamperedAlt = [{ ...valid.alternative_records[0]!, option_summary: "tampered" }];

    expect(generateAlternativesTradeoff({ package_build_result: badBuild }).failures).toContain("PACKAGE_BUILD_INVALID");
    expect(generateAlternativesTradeoff({ rationale_result: badRationale }).failures).toContain("RATIONALE_GENERATION_INVALID");
    expect(generateAlternativesTradeoff({ analysis: wrongTenant }).failures).toContain("TENANT_MISMATCH");
    expect(generateAlternativesTradeoff({ analysis: executionAnalysis }).failures).toContain("ADVISORY_ONLY_VIOLATION");
    expect(generateAlternativesTradeoff({ alternative_records: tamperedAlt }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(generateAlternativesTradeoff({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_TRADEOFF_GENERATOR_ACCESS");
    expect(generateAlternativesTradeoff({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays alternative analysis deterministically", () => {
    const result = generateAlternativesTradeoff();
    const replay = replayAlternativesTradeoff(result);
    const tampered = replayAlternativesTradeoff({ ...result, replay_hash: "tampered" });

    expect(computeAlternativeOptionHash(result.alternative_records[0]!)).toBe(result.alternative_records[0]!.integrity_hash);
    expect(replay.replay_valid).toBe(true);
    expect(replay.alternative_refs).toEqual(result.alternative_records.map((item) => item.option_id));
    expect(replay.rejected_refs).toEqual(result.rejected_records.map((item) => item.option_id));
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
