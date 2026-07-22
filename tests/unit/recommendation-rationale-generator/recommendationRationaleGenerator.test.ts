import { describe, expect, it } from "vitest";
import { buildDecisionPackage } from "@/services/decision-package-builder";
import {
  RECOMMENDATION_EXPLANATION_STATES,
  computeRecommendationExplanationHash,
  createAssumptionSummary,
  createMissionAlignmentRecord,
  generateRecommendationExplanation,
  generateRecommendationRationale,
  getRecommendationRationaleFoundation,
  replayRecommendationRationale,
} from "@/services/recommendation-rationale-generator";

describe("Mission Control Phase 9.8.3 Recommendation & Rationale Generator", () => {
  it("publishes the recommendation rationale foundation", () => {
    const foundation = getRecommendationRationaleFoundation();

    expect(foundation.generator_version).toBe("recommendation-rationale-generator/v1");
    expect(foundation.explanation_states).toEqual(RECOMMENDATION_EXPLANATION_STATES);
    expect(foundation.result.generator_status).toBe("PASS");
    expect(foundation.replay.replay_valid).toBe(true);
  });

  it("generates deterministic operator-readable explanations", () => {
    const first = generateRecommendationRationale();
    const second = generateRecommendationRationale();

    expect(first).toEqual(second);
    expect(first.explanation.recommendation_summary).toContain("Mission Control recommends");
    expect(first.explanation.rationale).toContain("Evidence basis");
    expect(first.validation.validation_status).toBe("VALID");
    expect(first.explanation_ledger).toHaveLength(1);
  });

  it("preserves mission alignment, objectives, expected benefits, assumptions, and projected outcome", () => {
    const result = generateRecommendationRationale();

    expect(result.mission_alignment.mission_objectives.length).toBeGreaterThan(0);
    expect(result.mission_alignment.supported_objectives.length).toBeGreaterThan(0);
    expect(result.explanation.objective_justification).toContain("Supported objectives");
    expect(result.explanation.expected_benefit).toContain("Expected benefit");
    expect(result.assumptions.validation_status).toBe("VALIDATED");
    expect(result.explanation.projected_outcome).toContain("Projected outcome");
  });

  it("fails closed when required explanation components are missing", () => {
    const packageBuild = buildDecisionPackage();
    const alignment = createMissionAlignmentRecord(packageBuild);
    const assumptions = createAssumptionSummary(packageBuild);
    const explanation = generateRecommendationExplanation(packageBuild, alignment, assumptions);

    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, recommendation_summary: "", integrity_hash: computeRecommendationExplanationHash({ ...explanation, recommendation_summary: "" }) } }).failures).toContain("RECOMMENDATION_MISSING");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, rationale: "", integrity_hash: computeRecommendationExplanationHash({ ...explanation, rationale: "" }) } }).failures).toContain("RATIONALE_MISSING");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, expected_benefit: "", integrity_hash: computeRecommendationExplanationHash({ ...explanation, expected_benefit: "" }) } }).failures).toContain("EXPECTED_BENEFIT_ABSENT");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, projected_outcome: "", integrity_hash: computeRecommendationExplanationHash({ ...explanation, projected_outcome: "" }) } }).failures).toContain("PROJECTED_OUTCOME_MISSING");
  });

  it("rejects missing assumptions, replay gaps, lineage gaps, tenant mismatch, and advisory-only violations", () => {
    const packageBuild = buildDecisionPackage();
    const alignment = createMissionAlignmentRecord(packageBuild);
    const assumptions = createAssumptionSummary(packageBuild);
    const explanation = generateRecommendationExplanation(packageBuild, alignment, assumptions);
    const noAssumptions = { ...assumptions, assumptions: [], validation_status: "MISSING" as const };

    expect(generateRecommendationRationale({ package_build_result: packageBuild, assumptions: noAssumptions }).failures).toContain("ASSUMPTIONS_UNAVAILABLE");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, replay_ref: "", integrity_hash: computeRecommendationExplanationHash({ ...explanation, replay_ref: "" }) } }).failures).toContain("REPLAY_REFERENCE_MISSING");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, lineage_ref: "", integrity_hash: computeRecommendationExplanationHash({ ...explanation, lineage_ref: "" }) } }).failures).toContain("LINEAGE_REFERENCE_MISSING");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, tenant_id: "tenant_beta", integrity_hash: computeRecommendationExplanationHash({ ...explanation, tenant_id: "tenant_beta" }) } }).failures).toContain("TENANT_MISMATCH");
    expect(generateRecommendationRationale({ package_build_result: packageBuild, explanation: { ...explanation, advisory_only: false as true, integrity_hash: computeRecommendationExplanationHash({ ...explanation, advisory_only: false as true }) } }).failures).toContain("ADVISORY_ONLY_VIOLATION");
  });

  it("detects package build invalidity, integrity tampering, unauthorized access, and replay divergence", () => {
    const valid = generateRecommendationRationale();
    const badBuild = { ...valid.package_build_result, builder_status: "FAIL" as const };
    const tampered = { ...valid.explanation, rationale: "tampered" };

    expect(generateRecommendationRationale({ package_build_result: badBuild }).failures).toContain("PACKAGE_BUILD_INVALID");
    expect(generateRecommendationRationale({ explanation: tampered }).failures).toContain("INTEGRITY_VERIFICATION_FAILED");
    expect(generateRecommendationRationale({ authorized_component: "unknown" }).failures).toContain("UNAUTHORIZED_RATIONALE_GENERATOR_ACCESS");
    expect(generateRecommendationRationale({ replay_expected_hash: `${valid.replay_hash}_wrong` }).failures).toContain("REPLAY_DIVERGENCE");
  });

  it("replays recommendation explanations deterministically", () => {
    const result = generateRecommendationRationale();
    const replay = replayRecommendationRationale(result);
    const tampered = replayRecommendationRationale({ ...result, replay_hash: "tampered" });

    expect(replay.replay_valid).toBe(true);
    expect(replay.explanation_id).toBe(result.explanation.explanation_id);
    expect(replay.recommendation_summary).toBe(result.explanation.recommendation_summary);
    expect(tampered.replay_valid).toBe(false);
    expect(tampered.failures).toContain("REPLAY_DIVERGENCE");
  });
});
