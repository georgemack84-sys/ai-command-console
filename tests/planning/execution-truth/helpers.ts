import { buildNormalizedPlan } from "@/tests/planning/dependencies/helpers";

export function buildSafeExecutionTruthPlan() {
  const normalizedPlan = buildNormalizedPlan();
  normalizedPlan.steps[0] = {
    ...normalizedPlan.steps[0]!,
    id: "step-read",
    sourceId: "step-read",
    index: 0,
    inputs: {
      targetEnvironment: "local",
      rollbackCapability: "full",
      autonomySensitivity: "safe",
    },
    dependencies: [],
  };
  normalizedPlan.steps[1] = {
    ...normalizedPlan.steps[1]!,
    id: "step-validate",
    sourceId: "step-validate",
    index: 1,
    inputs: {
      targetEnvironment: "local",
      rollbackCapability: "full",
      autonomySensitivity: "safe",
    },
    dependencies: ["step-read"],
  };
  return normalizedPlan;
}
