import type { AutonomyReadinessError, AutonomyReadinessInput, AutonomyLevel } from "@/types/autonomy-readiness";

export function validateAutonomyReadiness(input: {
  source: AutonomyReadinessInput;
  currentLevel: AutonomyLevel;
  governanceDisputed: boolean;
  replayDisputed: boolean;
  snapshotLineageMissing: boolean;
  overCeiling: boolean;
  simulationClassification: "visibility_only" | "future_bound_concept" | "forbidden";
}): readonly AutonomyReadinessError[] {
  const errors: AutonomyReadinessError[] = [];

  if (input.governanceDisputed) {
    errors.push({
      code: "AUTONOMY_GOVERNANCE_UNBOUND",
      message: "Autonomy readiness is not bound to an undisputed governance lineage.",
      path: "governanceBinding",
    });
  }
  if (input.replayDisputed) {
    errors.push({
      code: "AUTONOMY_REPLAY_UNBOUND",
      message: "Autonomy readiness is not bound to a valid replay lineage.",
      path: "replayBinding",
    });
  }
  if (input.snapshotLineageMissing) {
    errors.push({
      code: "AUTONOMY_SNAPSHOT_UNBOUND",
      message: "Autonomy readiness requires immutable snapshot lineage.",
      path: "snapshots",
    });
  }
  if (input.overCeiling) {
    errors.push({
      code: "AUTONOMY_SCOPE_EXCEEDED",
      message: "Autonomy level exceeds the immutable constitutional ceiling.",
      path: "authorityCeiling",
    });
  }
  if (["A3", "A4", "A5"].includes(input.currentLevel) && input.simulationClassification !== "future_bound_concept") {
    errors.push({
      code: "AUTONOMY_ORCHESTRATION_FORBIDDEN",
      message: "Future-bound autonomy levels must remain simulation-only concepts.",
      path: "simulationClassification",
    });
  }
  if (input.currentLevel === "A6") {
    errors.push({
      code: "AUTONOMY_FORBIDDEN",
      message: "A6 is permanently forbidden by constitutional policy.",
      path: "autonomyLevel",
    });
  }
  if (input.source.governanceView.autonomyBoundary.deniedOperations.includes("self-authorize")) {
    errors.push({
      code: "AUTONOMY_SELF_AUTHORIZATION_FORBIDDEN",
      message: "Self-authorization remains constitutionally forbidden.",
      path: "autonomyBoundary",
    });
  }
  if (input.source.governanceView.autonomyBoundary.deniedOperations.includes("execute")) {
    errors.push({
      code: "AUTONOMY_EXECUTION_FORBIDDEN",
      message: "Autonomy readiness cannot introduce execution authority.",
      path: "autonomyBoundary",
    });
  }

  return Object.freeze(errors);
}
