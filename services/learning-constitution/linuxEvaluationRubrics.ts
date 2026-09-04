import type { EvaluationRubric } from "../../types/learning-constitution/skillGraph";

export const LINUX_EVALUATION_RUBRICS: readonly EvaluationRubric[] = [{
  evaluation_id: "linux.systemd.troubleshooting.v1", evaluated_skill_id: "linux.systemd.troubleshooting", rubric_version: "v1",
  exercised_skill_ids: ["linux.systemd.units", "linux.systemd.dependencies", "linux.systemd.journald"],
}];
