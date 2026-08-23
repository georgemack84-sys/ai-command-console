import { describe, expect, it } from "vitest";
import { calculateCompetencyProfile, evaluateAssessmentResponse } from "@/services/learning-constitution";

describe("deterministic assessment evaluation", () => {
  it("uses the evaluation-type rubric criteria and returns explainable results", () => {
    const result = evaluateAssessmentResponse({ evaluation_type: "APPLICATION", answer: "Run systemctl daemon-reload and then systemctl restart nginx.service.", rubric: { required_commands: ["systemctl daemon-reload", "systemctl restart"] }, rubric_version: "v1" });
    expect(result).toMatchObject({ score: 1, outcome: "PASS", matched_criteria: ["systemctl daemon-reload", "systemctl restart"], rubric_version: "v1" });
    const partial = evaluateAssessmentResponse({ evaluation_type: "DIAGNOSIS", answer: "Inspect ExecStart first.", rubric: { required_concepts: ["ExecStart", "journalctl"] }, rubric_version: "v1" });
    expect(partial).toMatchObject({ score: 0.5, outcome: "PARTIAL", missing_criteria: ["journalctl"] });
  });

  it("calculates dimensions independently and leaves one-time retention insufficient", () => {
    const profile = calculateCompetencyProfile([
      { score: 1, competency_dimensions: ["KNOWLEDGE"], self_rated_confidence: 1 },
      { score: 0.5, competency_dimensions: ["APPLICATION", "TROUBLESHOOTING"], self_rated_confidence: 1 },
    ]);
    expect(profile).toMatchObject({ knowledge: 1, application: 0.5, troubleshooting: 0.5, retention: null, calibration: 0.75, score: expect.closeTo(2 / 3), evidence_count: 2 });
    expect(profile.confidence_interval.lower).toBeLessThan(profile.score!);
  });
});
