import { describe, expect, it } from "vitest";
import { generateAssessmentBlueprint, LINUX_SKILL_GRAPH_EDGES, LINUX_SKILL_GRAPH_NODES, LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK } from "@/services/learning-constitution";
import { selectAssessmentSessionItems, toLearnerAssessmentItem, toLearnerAssessmentSession } from "@/src/server/learning/assessment-session-service";

describe("assessment session preparation", () => {
  it("has an authored item for every generated Systemd blueprint requirement", () => {
    const blueprint = generateAssessmentBlueprint("linux.systemd.troubleshooting", LINUX_SKILL_GRAPH_NODES, LINUX_SKILL_GRAPH_EDGES);
    for (const plan of blueprint.item_plan) {
      expect(LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK.some((item) => item.evaluation_type === plan.evaluation_type && item.skill_id === plan.skill_id)).toBe(true);
    }
  });

  it("does not expose the evaluation rubric in learner item views", () => {
    const source = { id: "item-1", skillId: "linux.systemd.troubleshooting", evaluationType: "RECALL", prompt: "Prompt", expectedResponseFormat: "short_text", difficulty: 1, version: "v1", competencyDimensions: ["KNOWLEDGE"], content: null, rubric: { accepted_answer: "secret" } };
    const learnerItem = toLearnerAssessmentItem(source);
    expect(learnerItem).toEqual({ id: "item-1", skill_id: "linux.systemd.troubleshooting", evaluation_type: "RECALL", prompt: "Prompt", expected_response_format: "short_text", difficulty: 1, version: "v1", competency_dimensions: ["KNOWLEDGE"], content: null });
    expect(learnerItem).not.toHaveProperty("rubric");
  });

  it("returns a narrow learner session view", () => {
    const session = toLearnerAssessmentSession({ id: "session-1", targetSkillIds: ["linux.systemd.troubleshooting"], state: "IN_PROGRESS", blueprintVersion: "v1", startedAt: new Date("2026-08-21T00:00:00.000Z"), completedAt: null });
    expect(session).toEqual({ id: "session-1", target_skill_ids: ["linux.systemd.troubleshooting"], state: "IN_PROGRESS", blueprint_version: "v1", started_at: "2026-08-21T00:00:00.000Z" });
    expect(session).not.toHaveProperty("blueprintId");
    expect(session).not.toHaveProperty("learnerId");
  });

  it("selects equivalent items deterministically without changing required coverage", () => {
    const plan = [{ evaluation_type: "RECALL", skill_id: "linux.systemd.dependencies" }, { evaluation_type: "APPLICATION", skill_id: "linux.systemd.units" }];
    const candidates = [{ id: "recall-a", evaluationType: "RECALL", skillId: "linux.systemd.dependencies" }, { id: "recall-b", evaluationType: "RECALL", skillId: "linux.systemd.dependencies" }, { id: "application-a", evaluationType: "APPLICATION", skillId: "linux.systemd.units" }];
    const first = selectAssessmentSessionItems("session-1", plan, candidates);
    expect(first).toEqual(selectAssessmentSessionItems("session-1", plan, candidates));
    expect(first).toHaveLength(2);
    expect(first[1]).toEqual({ itemId: "application-a", position: 1 });
  });
});
