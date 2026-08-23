import { describe, expect, it } from "vitest";
import { ASSESSMENT_GOLD_SET_V1, assessAssessmentReleaseReadiness, buildAssessmentMonitoringSnapshot, calculateAssessmentItemQuality, evaluateAssessmentGoldSet, evaluateProfilePrediction, evaluateRubricConsistency } from "@/services/learning-constitution";

describe("assessment quality and release qualification", () => {
  it("covers every evaluation type with passing deterministic gold cases", () => {
    const gold = evaluateAssessmentGoldSet(ASSESSMENT_GOLD_SET_V1);
    expect(new Set(ASSESSMENT_GOLD_SET_V1.map((item) => item.evaluation_type)).size).toBe(7);
    expect(gold.every((result) => result.passed)).toBe(true);
  });

  it("calculates consistency, prediction, item quality, and fails closed when monitoring is unhealthy", () => {
    const consistency = evaluateRubricConsistency([{ id: "a", deterministic_score: 1, human_score: 1 }, { id: "b", deterministic_score: 0.5, human_score: 0.45 }]);
    const prediction = evaluateProfilePrediction([{ profile_score: 0.2, practical_score: 0.2 }, { profile_score: 0.6, practical_score: 0.65 }, { profile_score: 0.9, practical_score: 0.9 }]);
    const metrics = calculateAssessmentItemQuality([{ item_id: "application-1", item_score: 0.2, learner_profile_score: 0.2, duration_seconds: 30, human_score: 0.2 }, { item_id: "application-1", item_score: 0.9, learner_profile_score: 0.9, duration_seconds: 20, human_score: 0.9 }]);
    expect(consistency.passed).toBe(true); expect(prediction.passed).toBe(true); expect(metrics[0]).toMatchObject({ ambiguity_rate: 0, average_completion_seconds: 25, failure_rate: 0.5 });
    const readiness = assessAssessmentReleaseReadiness({ gold: evaluateAssessmentGoldSet(ASSESSMENT_GOLD_SET_V1), consistency, prediction, monitoring: buildAssessmentMonitoringSnapshot({ failed_sessions: 0, scoring_errors: 1, profile_calculation_regressions: 0 }) });
    expect(readiness).toMatchObject({ passed: false, rollback: { flag: "assessment_engine_v1", mode: "DISABLED" } });
  });
});
