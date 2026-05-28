import type { AutonomyLevel, AutonomySimulationClassification } from "@/types/autonomy-readiness";

export function classifyAutonomySimulation(level: AutonomyLevel): AutonomySimulationClassification {
  if (level === "A6") {
    return Object.freeze({
      level,
      classification: "forbidden",
      readOnly: true,
      executing: false,
      orchestrationAllowed: false,
    });
  }

  return Object.freeze({
    level,
    classification: ["A3", "A4", "A5"].includes(level) ? "future_bound_concept" : "visibility_only",
    readOnly: true,
    executing: false,
    orchestrationAllowed: false,
  });
}
