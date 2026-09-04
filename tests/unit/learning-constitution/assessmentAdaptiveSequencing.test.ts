import { describe, expect, it } from "vitest";
import { determineAdaptiveAssessmentNext } from "@/services/learning-constitution";

const items = [
  { id: "recall", position: 0, skill_id: "prerequisite-a", evaluation_type: "RECALL" as const, competency_dimensions: ["KNOWLEDGE" as const] },
  { id: "explanation", position: 1, skill_id: "prerequisite-b", evaluation_type: "EXPLANATION" as const, competency_dimensions: ["KNOWLEDGE" as const] },
  { id: "application", position: 2, skill_id: "target", evaluation_type: "APPLICATION" as const, competency_dimensions: ["APPLICATION" as const] },
  { id: "diagnosis", position: 3, skill_id: "target", evaluation_type: "DIAGNOSIS" as const, competency_dimensions: ["TROUBLESHOOTING" as const] },
  { id: "scenario", position: 4, skill_id: "target", evaluation_type: "SCENARIO" as const, competency_dimensions: ["KNOWLEDGE" as const] },
  { id: "adversarial", position: 5, skill_id: "target", evaluation_type: "ADVERSARIAL_SCENARIO" as const, competency_dimensions: ["TROUBLESHOOTING" as const] },
];

describe("adaptive assessment sequencing", () => {
  it("starts with direct application and routes strong and weak learners differently", () => {
    expect(determineAdaptiveAssessmentNext(items, [])).toMatchObject({ state: "CONTINUE", next_item_id: "application" });
    expect(determineAdaptiveAssessmentNext(items, [{ item_id: "application", score: 1 }])).toMatchObject({ next_item_id: "diagnosis" });
    expect(determineAdaptiveAssessmentNext(items, [{ item_id: "application", score: 0.25 }])).toMatchObject({ next_item_id: "recall" });
  });

  it("ends early only after all required dimensions have direct evidence", () => {
    const incomplete = determineAdaptiveAssessmentNext(items, [{ item_id: "application", score: 1 }, { item_id: "diagnosis", score: 1 }]);
    expect(incomplete).toMatchObject({ state: "CONTINUE", next_item_id: "scenario", insufficient_competencies: ["KNOWLEDGE"] });
    const complete = determineAdaptiveAssessmentNext(items, [{ item_id: "application", score: 1 }, { item_id: "diagnosis", score: 1 }, { item_id: "scenario", score: 1 }]);
    expect(complete).toMatchObject({ state: "READY_TO_COMPLETE", insufficient_competencies: [] });
    expect(complete.skipped_item_ids).toContain("adversarial");
  });

  it("adds adversarial coverage when basic application is strong but diagnosis is uncertain", () => {
    const decision = determineAdaptiveAssessmentNext(items, [{ item_id: "application", score: 1 }, { item_id: "diagnosis", score: 0.6 }, { item_id: "scenario", score: 1 }]);
    expect(decision).toMatchObject({ state: "CONTINUE", next_item_id: "adversarial" });
  });
});
