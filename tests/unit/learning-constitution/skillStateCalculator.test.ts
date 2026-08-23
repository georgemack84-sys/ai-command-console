import { describe, expect, it } from "vitest";
import { calculateDerivedSkillState, InMemorySkillGraphRepository, LINUX_SKILL_GRAPH_NODES, SKILL_STATE_CALCULATION_V1, SkillStateRecalculationService } from "@/services/learning-constitution";
import type { SkillEvidence } from "@/types/learning-constitution";

const policy = { ...SKILL_STATE_CALCULATION_V1, asOf: "2026-08-21T00:00:00.000Z" };
const evidence = (id: string, occurred_at: string, kind: SkillEvidence["kind"], score: number): SkillEvidence => ({ id, learner_id: "learner-1", skill_id: "linux.systemd.journald", kind, occurred_at, score, outcome: score >= 0.75 ? "PASS" : score >= 0.4 ? "PARTIAL" : "FAIL", evaluator: kind === "SELF_REPORT" ? "LEARNER" : "SYSTEM", rubric_version: "journald-v1" });

describe("versioned skill state calculation", () => {
  it("is deterministic and produces a traceable ready state from sufficient recent assessed evidence", () => {
    const records = [evidence("p1", "2026-08-20T00:00:00.000Z", "PRACTICAL_TASK", 1), evidence("p2", "2026-08-19T00:00:00.000Z", "ASSESSMENT", 0.9), evidence("p3", "2026-08-18T00:00:00.000Z", "PRACTICAL_TASK", 0.9)];
    const first = calculateDerivedSkillState("learner-1", "linux.systemd.journald", records, policy);
    expect(calculateDerivedSkillState("learner-1", "linux.systemd.journald", [...records].reverse(), policy)).toEqual(first);
    expect(first).toMatchObject({ display_state: "READY", calculation_version: "skill-state-v1", last_evaluated: "2026-08-20T00:00:00.000Z" });
    expect(first.evidence_ids).toEqual(["p1", "p2", "p3"]);
  });

  it("does not establish mastery from self-report alone and identifies stale successful evidence as at risk", () => {
    expect(calculateDerivedSkillState("learner-1", "linux.systemd.journald", [evidence("self", "2026-08-20T00:00:00.000Z", "SELF_REPORT", 1)], policy)).toMatchObject({ mastery: null, display_state: "INSUFFICIENT_EVIDENCE" });
    expect(calculateDerivedSkillState("learner-1", "linux.systemd.journald", [evidence("old", "2026-02-01T00:00:00.000Z", "PRACTICAL_TASK", 1)], policy)).toMatchObject({ display_state: "AT_RISK" });
  });

  it("recalculates from the immutable evidence repository without updating evidence", async () => {
    const repository = new InMemorySkillGraphRepository();
    for (const node of LINUX_SKILL_GRAPH_NODES) await repository.createNode(node);
    await repository.appendEvidence(evidence("p1", "2026-08-20T00:00:00.000Z", "PRACTICAL_TASK", 0.4));
    const service = new SkillStateRecalculationService(repository, policy);
    await expect(service.recalculate("learner-1", "linux.systemd.journald")).resolves.toMatchObject({ display_state: "AT_RISK", evidence_ids: ["p1"] });
    expect(await repository.findEvidenceBySkillId("linux.systemd.journald")).toHaveLength(1);
  });
});
