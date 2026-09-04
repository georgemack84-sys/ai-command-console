import { describe, expect, it } from "vitest";
import { buildStudyPlan, calculateDerivedSkillState, diagnoseBottleneck, LINUX_EVALUATION_RUBRICS, LINUX_SKILL_GRAPH, SKILL_STATE_CALCULATION_V1 } from "@/services/learning-constitution";
import type { SkillEvidence } from "@/types/learning-constitution";

const policy = { ...SKILL_STATE_CALCULATION_V1, asOf: "2026-08-21T00:00:00.000Z" };
const observation = (id: string, skill_id: string, score: number, outcome: SkillEvidence["outcome"]): SkillEvidence => ({ id, learner_id: "learner", skill_id, kind: "PRACTICAL_TASK", occurred_at: "2026-08-20T00:00:00.000Z", score, outcome, evaluator: "SYSTEM", rubric_version: "v1" });
const state = (skillId: string, records: readonly SkillEvidence[]) => calculateDerivedSkillState("learner", skillId, records, policy);

describe("bottleneck diagnosis", () => {
  it("identifies Journald as the supported cause of a systemd troubleshooting failure and builds a focused plan", () => {
    const failure = observation("trouble-fail", "linux.systemd.troubleshooting", 0.2, "FAIL");
    const journaldFailure = observation("journald-fail", "linux.systemd.journald", 0, "FAIL");
    const recommendation = diagnoseBottleneck({ learnerId: "learner", failedEvidence: failure, rubric: LINUX_EVALUATION_RUBRICS[0], graph: LINUX_SKILL_GRAPH, states: [state("linux.systemd.journald", [journaldFailure]), state("linux.systemd.units", [observation("units-pass", "linux.systemd.units", 1, "PASS")]), state("linux.systemd.dependencies", [observation("dependencies-pass", "linux.systemd.dependencies", 1, "PASS")])] });
    expect(recommendation).toMatchObject({ status: "RECOMMENDATION", target_skill_id: "linux.systemd.journald", graph_path: ["linux.systemd.journald", "linux.systemd.troubleshooting"], next_action: "PRACTICE" });
    expect(buildStudyPlan(recommendation).steps).toMatchObject([{ action: "PRACTICE", skill_id: "linux.systemd.journald" }, { action: "REASSESS", skill_id: "linux.systemd.troubleshooting" }]);
  });

  it("declines to guess when the rubric cannot localize the failure or weak evidence is insufficient", () => {
    const failure = observation("trouble-fail", "linux.systemd.troubleshooting", 0.2, "FAIL");
    expect(diagnoseBottleneck({ learnerId: "learner", failedEvidence: failure, rubric: { ...LINUX_EVALUATION_RUBRICS[0], exercised_skill_ids: [] }, graph: LINUX_SKILL_GRAPH, states: [] })).toMatchObject({ status: "NOT_LOCALIZED", next_action: "DIAGNOSTIC_EVALUATION" });
    expect(diagnoseBottleneck({ learnerId: "learner", failedEvidence: failure, rubric: LINUX_EVALUATION_RUBRICS[0], graph: LINUX_SKILL_GRAPH, states: [state("linux.systemd.journald", [])] })).toMatchObject({ status: "INSUFFICIENT_EVIDENCE", next_action: "DIAGNOSTIC_EVALUATION" });
  });
});
