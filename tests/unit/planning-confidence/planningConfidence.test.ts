import { describe, expect, it } from "vitest";
import { generateAutonomyIdentity } from "@/services/autonomy-identity";
import { decomposeObjective } from "@/services/objective-decomposition";
import { analyzeDependencies } from "@/services/dependency-analysis";
import { optimizePlan } from "@/services/planning-optimization";
import { buildAlternativePlanningPackage } from "@/services/alternative-planning";
import { buildContingencyPlanningPackage } from "@/services/contingency-planning";
import {
  buildPlanningConfidenceAssessment,
  buildPlanningConfidenceIntake,
  buildPlanningConfidenceVisibilitySurface,
  computePlanningConfidenceAssessmentHash,
  evaluateConfidenceFactors,
  getPlanningConfidenceFramework,
  replayPlanningConfidenceAssessment,
  validatePlanningConfidenceAssessment,
} from "@/services/planning-confidence";
import type { ConfidenceFactorName, PlanningConfidenceFailureReason, PlanningConfidenceScenario } from "@/types/planning-confidence";

function buildBaseline() {
  const identity = generateAutonomyIdentity();
  const hierarchy = decomposeObjective(identity);
  const graph = analyzeDependencies(identity, hierarchy);
  const optimizedPlan = optimizePlan(identity, hierarchy, graph);
  const alternativePackage = buildAlternativePlanningPackage(identity, optimizedPlan, graph);
  const contingencyPackage = buildContingencyPlanningPackage(identity, optimizedPlan, alternativePackage, graph);
  return { identity, hierarchy, graph, optimizedPlan, alternativePackage, contingencyPackage };
}

const factors: readonly ConfidenceFactorName[] = [
  "OBJECTIVE_CLARITY",
  "DEPENDENCY_COMPLETENESS",
  "POLICY_CERTAINTY",
  "AUTHORITY_CERTAINTY",
  "HISTORICAL_SUCCESS",
  "REPLAY_CONSISTENCY",
  "RESOURCE_AVAILABILITY",
  "RISK_LEVEL",
];

describe("Mission Control Phase 8B.6 Planning Confidence Engine", () => {
  it("builds a normalized confidence intake from the complete planning package", () => {
    const input = buildBaseline();
    const intake = buildPlanningConfidenceIntake(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage);
    expect(intake.objective_id).toBe(input.optimizedPlan.objective_id);
    expect(intake.contingency_package.contingency_package_id).toBe(input.contingencyPackage.contingency_package_id);
    expect(intake.intake_failures).toEqual([]);
    expect(intake.replay_reference).toBeTruthy();
  });

  it("evaluates all confidence factors deterministically", () => {
    const input = buildBaseline();
    const intake = buildPlanningConfidenceIntake(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage);
    const scores = evaluateConfidenceFactors(intake);
    expect(scores.map((score) => score.factor_name)).toEqual(factors);
    expect(scores.every((score) => score.evidence_refs.length > 0)).toBe(true);
    expect(scores.every((score) => score.score > 0)).toBe(true);
  });

  it("builds a high-confidence advisory assessment for baseline planning", () => {
    const input = buildBaseline();
    const assessment = buildPlanningConfidenceAssessment(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage);
    expect(assessment.classification).toBe("HIGH");
    expect(assessment.readiness_assessment).toBe("READY_FOR_GOVERNANCE_REVIEW");
    expect(assessment.advisory_only).toBe(true);
    expect(assessment.execution_authorized).toBe(false);
    expect(computePlanningConfidenceAssessmentHash(assessment)).toBe(assessment.integrity_hash);
  });

  it("validates a baseline assessment for execution orchestration review", () => {
    const input = buildBaseline();
    const validation = validatePlanningConfidenceAssessment(buildPlanningConfidenceAssessment(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage));
    expect(validation.certification_state).toBe("PASS");
    expect(validation.failures).toEqual([]);
    expect(validation.ready_for_execution_orchestration_review).toBe(true);
  });

  it.each([
    ["INCOMPLETE_PLANNING_PACKAGE", "INCOMPLETE_PLANNING_PACKAGE", "INSUFFICIENT", "FAIL"],
    ["UNCERTIFIED_PLAN", "UNCERTIFIED_PLAN", "INSUFFICIENT", "FAIL"],
    ["MISSING_REPLAY_METADATA", "MISSING_REPLAY_METADATA", "INSUFFICIENT", "FAIL"],
    ["INCONSISTENT_LINEAGE", "BROKEN_LINEAGE", "HIGH", "CONDITIONAL_PASS"],
    ["INVALID_GOVERNANCE_STATE", "INVALID_GOVERNANCE_STATE", "INSUFFICIENT", "FAIL"],
    ["AMBIGUOUS_OBJECTIVE", "AMBIGUOUS_OBJECTIVE", "MEDIUM", "CONDITIONAL_PASS"],
    ["INVALID_DEPENDENCY_GRAPH", "DEPENDENCY_GRAPH_INVALID", "INSUFFICIENT", "FAIL"],
    ["GOVERNANCE_FAILURE", "GOVERNANCE_VALIDATION_FAILED", "INSUFFICIENT", "FAIL"],
    ["AUTHORITY_UNCERTAIN", "AUTHORITY_UNCERTAIN", "INSUFFICIENT", "FAIL"],
    ["LIMITED_HISTORY", "LIMITED_HISTORICAL_EVIDENCE", "HIGH", "CONDITIONAL_PASS"],
    ["REPLAY_MISMATCH", "REPLAY_INCONSISTENCY", "INSUFFICIENT", "FAIL"],
    ["RESOURCE_UNAVAILABLE", "RESOURCE_UNAVAILABLE", "MEDIUM", "CONDITIONAL_PASS"],
    ["HIGH_RISK", "RISK_ABOVE_THRESHOLD", "MEDIUM", "CONDITIONAL_PASS"],
    ["TENANT_VIOLATION", "TENANT_ISOLATION_VIOLATION", "INSUFFICIENT", "FAIL"],
    ["ASSUMPTIONS_UNSUPPORTED", "ASSUMPTIONS_UNSUPPORTED", "HIGH", "CONDITIONAL_PASS"],
    ["HIDDEN_PLAN", "HIDDEN_PLAN", "INSUFFICIENT", "FAIL"],
    ["SELF_AUTHORIZATION", "SELF_AUTHORIZATION", "INSUFFICIENT", "FAIL"],
    ["CONDITIONAL_REPORTING_GAP", "REPORTING_GAP", "HIGH", "CONDITIONAL_PASS"],
  ] as readonly [PlanningConfidenceScenario, PlanningConfidenceFailureReason, string, string][])("certifies scenario %s", (scenario, reason, classification, certification) => {
    const input = buildBaseline();
    const assessment = buildPlanningConfidenceAssessment(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage, scenario);
    const validation = validatePlanningConfidenceAssessment(assessment);
    expect(assessment.confidence_reducers).toContain(reason);
    expect(assessment.classification).toBe(classification);
    expect(validation.certification_state).toBe(certification);
  });

  it("replays confidence assessments deterministically", () => {
    const input = buildBaseline();
    const assessment = buildPlanningConfidenceAssessment(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage);
    const replay = replayPlanningConfidenceAssessment(assessment);
    expect(replay.validation_state).toBe("PASS");
    expect(replay.replay_factor_order).toEqual(factors);
    expect(replay.failure_reason).toBeNull();
  });

  it("exposes confidence visibility", () => {
    const input = buildBaseline();
    const visibility = buildPlanningConfidenceVisibilitySurface(buildPlanningConfidenceAssessment(input.identity, input.hierarchy, input.graph, input.optimizedPlan, input.alternativePackage, input.contingencyPackage));
    expect(visibility.integrity_status).toBe("VALID");
    expect(visibility.classification).toBe("HIGH");
    expect(visibility.factor_scores.map((score) => score.factor_name)).toEqual(factors);
    expect(visibility.execution_authorized).toBe(false);
  });

  it("publishes aggregate planning confidence framework", () => {
    const framework = getPlanningConfidenceFramework();
    expect(framework.assessment.classification).toBe("HIGH");
    expect(framework.validation.ready_for_execution_orchestration_review).toBe(true);
    expect(framework.replay.validation_state).toBe("PASS");
    expect(framework.visibility.factor_scores).toHaveLength(8);
  });
});
