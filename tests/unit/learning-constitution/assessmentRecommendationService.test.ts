import { describe, expect, it } from "vitest";
import { buildAssessmentRecommendation } from "@/services/learning-constitution";

describe("assessment recommendations", () => {
  it("uses the weakest evaluated skill as a live instructional starting point", () => {
    const recommendation = buildAssessmentRecommendation({ id: "rec-1", session_id: "session-1", learner_id: "learner", target_skill_id: "linux.systemd.troubleshooting", profile: { knowledge: 0.9, application: 0.4, troubleshooting: 0.6, retention: null, calibration: 0.8 }, evaluated_items: [{ skill_id: "linux.systemd.units", score: 0.4 }, { skill_id: "linux.systemd.troubleshooting", score: 0.8 }], now: new Date("2026-08-21T00:00:00.000Z") });
    expect(recommendation).toMatchObject({ instructional_starting_point: "linux.systemd.units", priority_gaps: [{ competency: "APPLICATION" }, { competency: "TROUBLESHOOTING" }], retest_at: "2026-08-28T00:00:00.000Z" });
  });
});
