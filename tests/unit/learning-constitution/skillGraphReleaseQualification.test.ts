import { describe, expect, it } from "vitest";
import { buildSkillGraphMigrationReport, evaluateSkillGraphCalibration, evaluateSkillGraphRelease, LINUX_SKILL_GRAPH_NODES, resolveLearningReadMode } from "@/services/learning-constitution";

const recommendation = { status: "RECOMMENDATION" as const, target_skill_id: "linux.systemd.journald", blocked_skill_id: "linux.systemd.troubleshooting", reason: "fixture", graph_path: ["linux.systemd.journald", "linux.systemd.troubleshooting"], evidence_ids: ["e1"], next_action: "PRACTICE" as const };

describe("skill graph release qualification", () => {
  it("accounts for every flat-skill migration outcome and preserves historical IDs", () => {
    const report = buildSkillGraphMigrationReport([{ id: "legacy-journal", slug: "linux.systemd.journald", name: "Journald" }, { id: "legacy-other", slug: "legacy.other", name: "Other" }], LINUX_SKILL_GRAPH_NODES);
    expect(report).toMatchObject({ fully_accounted_for: true, mapped: [{ flatSkillId: "legacy-journal", skillNode: { id: "legacy-journal" } }], unmapped: [{ id: "legacy-other" }], manual_review: [{ id: "legacy-other" }] });
  });

  it("keeps graph rollout feature-gated and only passes a clean qualified release", () => {
    expect(resolveLearningReadMode(false)).toBe("FLAT_LIST");
    expect(resolveLearningReadMode(true)).toBe("SKILL_GRAPH");
    const migration = buildSkillGraphMigrationReport([{ id: "legacy-journal", slug: "linux.systemd.journald", name: "Journald" }], LINUX_SKILL_GRAPH_NODES);
    const calibration = evaluateSkillGraphCalibration([{ case_id: "journald-bottleneck", expected_target_skill_id: "linux.systemd.journald", actual: recommendation }]);
    expect(evaluateSkillGraphRelease(migration, calibration, true)).toMatchObject({ passed: true, rollback: { flag: "skill_graph_v1", mode: "FLAT_LIST" } });
  });

  it("blocks release for manual migration review or calibration misdiagnoses", () => {
    const migration = buildSkillGraphMigrationReport([{ id: "legacy-other", slug: "legacy.other", name: "Other" }], LINUX_SKILL_GRAPH_NODES);
    const calibration = evaluateSkillGraphCalibration([{ case_id: "wrong", expected_target_skill_id: "linux.systemd.journald", actual: { ...recommendation, target_skill_id: "linux.systemd.units" } }]);
    expect(evaluateSkillGraphRelease(migration, calibration, true).passed).toBe(false);
  });
});
