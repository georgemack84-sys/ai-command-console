import { describe, expect, it, vi } from "vitest";
import {
  buildPreventativeRecommendationObservabilitySurface,
  computePreventativeRecommendationHash,
  getPreventativeRecommendationEngineContract,
  replayPreventativeRecommendations,
  runPreventativeRecommendations,
  validatePreventativeRecommendations,
} from "@/services/preventative-recommendation-engine";
import type { PreventativeRecommendationFailure, PreventativeRecommendationScenario } from "@/types/preventative-recommendation-engine";

vi.setConfig({ testTimeout: 180000 });

describe("Phase 8ALT.3.4 Preventative Recommendation & Mitigation Engine", () => {
  it("defines the advisory-only preventative recommendation doctrine", () => {
    const contract = getPreventativeRecommendationEngineContract();

    expect(contract.doctrine.engine_version).toBe("preventative-recommendation-engine/v8ALT.3.4");
    expect(contract.doctrine.principles).toContain("advisory-only-operation");
    expect(contract.doctrine.principles).toContain("deterministic-recommendation-generation");
    expect(contract.doctrine.recommendation_types).toContain("PREVENTATIVE_ACTION");
    expect(contract.doctrine.recommendation_types).toContain("RECOVERY_PREPARATION");
    expect(contract.doctrine.priority_levels).toEqual(["LOW", "MEDIUM", "HIGH", "URGENT", "CRITICAL"]);
    expect(contract.validation.valid).toBe(true);
  });

  it("generates complete preventative recommendations from risk forecasts", () => {
    const report = runPreventativeRecommendations();
    const validation = validatePreventativeRecommendations(report);

    expect(report.pipeline_state).toBe("READY_FOR_OPERATOR");
    expect(report.recommendations.length).toBe(9);
    expect(report.recommendations.some((item) => item.recommendation_type === "PREVENTATIVE_ACTION")).toBe(true);
    expect(report.recommendations.every((item) => item.mitigation_plan.plan_hash)).toBe(true);
    expect(report.recommendations.every((item) => item.contingency_options.length > 0)).toBe(true);
    expect(report.recommendations.every((item) => item.governance_alternatives.length > 0)).toBe(true);
    expect(report.recommendations.every((item) => item.recovery_preparation.preparation_hash)).toBe(true);
    expect(validation.valid).toBe(true);
  });

  it("reproduces recommendations, mitigation, contingency, governance alternatives, advisories, and recovery preparation deterministically", () => {
    const first = runPreventativeRecommendations();
    const second = runPreventativeRecommendations();

    expect(first.report_hash).toBe(second.report_hash);
    expect(first.recommendations.map((item) => item.recommendation_hash)).toEqual(second.recommendations.map((item) => item.recommendation_hash));
    expect(first.recommendations.map((item) => item.mitigation_plan.plan_hash)).toEqual(second.recommendations.map((item) => item.mitigation_plan.plan_hash));
    expect(first.recommendations.map((item) => item.recovery_preparation.preparation_hash)).toEqual(second.recommendations.map((item) => item.recovery_preparation.preparation_hash));
  });

  it("includes complete evidence, forecast references, explanations, replay, lineage, and integrity", () => {
    const report = runPreventativeRecommendations();

    expect(report.recommendations.every((item) => item.supporting_evidence.length > 0)).toBe(true);
    expect(report.recommendations.every((item) => item.forecast_references.length >= 2)).toBe(true);
    expect(report.recommendations.every((item) => item.explanation.length >= 7)).toBe(true);
    expect(report.recommendations.every((item) => item.replay_reference && item.lineage_reference && item.integrity_hash)).toBe(true);
    expect(report.repository.integrity_hashes.length).toBe(report.recommendations.length);
  });

  it.each([
    ["MISSING_EVIDENCE", "EVIDENCE_INCOMPLETE"],
    ["MISSING_FORECAST_REFERENCE", "FORECAST_REFERENCE_MISSING"],
    ["MISSING_EXPLANATION", "EXPLANATION_INCOMPLETE"],
    ["REPLAY_MISMATCH", "REPLAY_INVALID"],
    ["LINEAGE_BROKEN", "LINEAGE_INVALID"],
    ["INTEGRITY_FAILURE", "INTEGRITY_INVALID"],
    ["GOVERNANCE_INVALID", "GOVERNANCE_INVALID"],
    ["CONSTITUTIONAL_INVALID", "CONSTITUTIONAL_INVALID"],
    ["AUTHORITY_INVALID", "AUTHORITY_INVALID"],
    ["OPERATOR_APPROVAL_MISSING", "OPERATOR_APPROVAL_MISSING"],
    ["AUTONOMOUS_EXECUTION_ATTEMPT", "AUTONOMOUS_EXECUTION_DETECTED"],
    ["AUTONOMOUS_MITIGATION_ATTEMPT", "AUTONOMOUS_MITIGATION_DETECTED"],
    ["AUTONOMOUS_RECOVERY_ATTEMPT", "AUTONOMOUS_RECOVERY_DETECTED"],
    ["GOVERNANCE_MODIFICATION_ATTEMPT", "GOVERNANCE_MODIFICATION_DETECTED"],
    ["CONSTITUTIONAL_MODIFICATION_ATTEMPT", "CONSTITUTIONAL_MODIFICATION_DETECTED"],
    ["AUTHORITY_ESCALATION_ATTEMPT", "AUTHORITY_ESCALATION_DETECTED"],
    ["TENANT_ISOLATION_FAILURE", "TENANT_ISOLATION_INVALID"],
    ["CROSS_TENANT_RECOMMENDATION", "CROSS_TENANT_RECOMMENDATION_DETECTED"],
  ] as readonly [PreventativeRecommendationScenario, PreventativeRecommendationFailure][])("fails closed for %s", (scenario, failure) => {
    const report = runPreventativeRecommendations({ scenario });
    const validation = validatePreventativeRecommendations(report);

    expect(validation.valid).toBe(false);
    expect(validation.failures).toContain(failure);
  });

  it("enforces operator approval and advisory-only behavior in baseline", () => {
    const report = runPreventativeRecommendations();
    const validation = validatePreventativeRecommendations(report);

    expect(report.advisory_only).toBe(true);
    expect(report.recommendations.every((item) => item.operator_required && item.approval_required)).toBe(true);
    expect(report.recommendations.every((item) => !item.recommendation_executed && !item.mitigation_executed && !item.recovery_initiated)).toBe(true);
    expect(validation.operator_approval_required).toBe(true);
    expect(validation.advisory_only).toBe(true);
  });

  it("replays and hashes preventative recommendations deterministically", () => {
    const first = runPreventativeRecommendations();
    const second = runPreventativeRecommendations();
    const replay = replayPreventativeRecommendations(first);

    expect(second.report_hash).toBe(first.report_hash);
    expect(first.report_hash).toBe(computePreventativeRecommendationHash(first));
    expect(replay.deterministic).toBe(true);
    expect(replay.reconstructed_hash).toBe(first.report_hash);
  });

  it("exposes operator-visible preventative recommendation diagnostics", () => {
    const surface = buildPreventativeRecommendationObservabilitySurface(runPreventativeRecommendations());

    expect(surface.recommendation_count).toBe(9);
    expect(surface.highest_priority).toMatch(/LOW|MEDIUM|HIGH|URGENT|CRITICAL/);
    expect(surface.highest_urgency).toMatch(/LOW_PRIORITY|MEDIUM_PRIORITY|HIGH_PRIORITY|CRITICAL/);
    expect(surface.tenant_id).toBe("tenant:autonomy:primary");
    expect(surface.advisory_only).toBe(true);
  });
});
