import { describe, expect, it } from "vitest";
import { assessmentBlueprintSchema, assessmentItemSchema, assessmentSessionSchema, generateAssessmentBlueprint, LINUX_SKILL_GRAPH_EDGES, LINUX_SKILL_GRAPH_NODES, LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK } from "@/services/learning-constitution";

describe("assessment domain contracts", () => {
  const blueprint = {
    id: "systemd-diagnostic-v1", skill_id: "linux.systemd.troubleshooting", version: "v1",
    objectives: ["Identify common service startup failures"], assessed_skill_ids: ["linux.systemd.troubleshooting"], target_competencies: ["KNOWLEDGE", "APPLICATION", "TROUBLESHOOTING"],
    item_mix: { RECALL: 1, EXPLANATION: 1, APPLICATION: 1, DIAGNOSIS: 1, SCENARIO: 0, PRACTICAL_TASK: 0, ADVERSARIAL_SCENARIO: 0 },
    item_plan: ["RECALL", "EXPLANATION", "APPLICATION", "DIAGNOSIS"].map((evaluation_type, index) => ({ evaluation_type, skill_id: "linux.systemd.troubleshooting", difficulty: index + 1, competency_dimensions: [index < 2 ? "KNOWLEDGE" : index === 2 ? "APPLICATION" : "TROUBLESHOOTING"], required: true })),
    rules: { early_stop: { enabled: true, minimum_items: 4, required_competencies: ["KNOWLEDGE", "APPLICATION", "TROUBLESHOOTING"] }, escalation: { enabled: true, include_prerequisites: true, trigger_evaluation_types: ["DIAGNOSIS"] }, required_evaluation_types: ["RECALL", "EXPLANATION", "APPLICATION", "DIAGNOSIS"] },
  };

  it("accepts a complete versioned blueprint and authored Linux/Systemd bank", () => {
    expect(assessmentBlueprintSchema.parse(blueprint)).toMatchObject({ skill_id: "linux.systemd.troubleshooting" });
    expect(LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK).toHaveLength(7);
    for (const item of LINUX_SYSTEMD_ASSESSMENT_ITEM_BANK) expect(assessmentItemSchema.parse(item)).toMatchObject({ version: "linux-systemd-authored-v1" });
  });

  it("rejects blueprint coverage gaps and sessions completed without a timestamp", () => {
    expect(() => assessmentBlueprintSchema.parse({ ...blueprint, item_mix: { ...blueprint.item_mix, DIAGNOSIS: 0 } })).toThrow("Required evaluation types");
    expect(() => assessmentSessionSchema.parse({ id: "s1", learner_id: "learner", blueprint_id: blueprint.id, target_skill_ids: [blueprint.skill_id], state: "COMPLETED", blueprint_version: blueprint.version, started_at: "2026-08-21T00:00:00.000Z" })).toThrow("completion timestamp");
  });

  it("generates a deterministic blueprint with prerequisite, practical, and adversarial coverage", () => {
    const first = generateAssessmentBlueprint("linux.systemd.troubleshooting", LINUX_SKILL_GRAPH_NODES, LINUX_SKILL_GRAPH_EDGES);
    const second = generateAssessmentBlueprint("linux.systemd.troubleshooting", LINUX_SKILL_GRAPH_NODES, LINUX_SKILL_GRAPH_EDGES);
    expect(first).toEqual(second);
    expect(first.assessed_skill_ids).toEqual(["linux.systemd.troubleshooting", "linux.systemd.dependencies", "linux.systemd.journald", "linux.systemd.units"]);
    expect(first.item_plan.map((item) => item.difficulty)).toEqual([1, 2, 3, 4, 4, 5, 5]);
    expect(first.item_plan.map((item) => item.evaluation_type)).toContain("PRACTICAL_TASK");
    expect(first.item_plan.map((item) => item.evaluation_type)).toContain("ADVERSARIAL_SCENARIO");
  });
});
