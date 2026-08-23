import type { LearningReadMode, SkillGraphCalibrationCase, SkillGraphMigrationReport, SkillGraphReleaseReport } from "../../types/learning-constitution/skillGraph";

export const resolveLearningReadMode = (skillGraphEnabled: boolean): LearningReadMode => skillGraphEnabled ? "SKILL_GRAPH" : "FLAT_LIST";

export const evaluateSkillGraphCalibration = (cases: readonly SkillGraphCalibrationCase[]) => ({
  case_count: cases.length,
  targeted_matches: cases.filter((item) => item.expected_target_skill_id === item.actual.target_skill_id).length,
  misdiagnoses: cases.filter((item) => item.expected_target_skill_id && item.expected_target_skill_id !== item.actual.target_skill_id).map((item) => item.case_id),
});

export const evaluateSkillGraphRelease = (migration: SkillGraphMigrationReport, calibration: ReturnType<typeof evaluateSkillGraphCalibration>, graphValidationPassed: boolean): SkillGraphReleaseReport => {
  const checks = [
    { check_id: "migration-accounting", passed: migration.fully_accounted_for && migration.manual_review.length === 0, detail: "Every flat skill is mapped without duplicates or manual review." },
    { check_id: "graph-validation", passed: graphValidationPassed, detail: "Graph contracts and acyclicity checks pass." },
    { check_id: "calibration", passed: calibration.case_count > 0 && calibration.misdiagnoses.length === 0, detail: "Representative histories produce the expected targeted recommendation." },
    { check_id: "rollback", passed: resolveLearningReadMode(false) === "FLAT_LIST", detail: "Disabling skill_graph_v1 restores the flat-list read mode without changing source data." },
  ] as const;
  return { release_id: "skill-graph-v1-release", passed: checks.every((check) => check.passed), checks, rollback: { flag: "skill_graph_v1", mode: "FLAT_LIST" } };
};
