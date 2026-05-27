import type { AutonomyLevel, AutonomyState } from "@/types/autonomy-readiness";

export type AutonomyReadinessDefinition = Readonly<{
  level: AutonomyLevel;
  label: string;
  derivedState: AutonomyState;
  executionAllowed: false;
  orchestrationAllowed: false;
  futureBound: boolean;
}>;

const DEFINITIONS: readonly AutonomyReadinessDefinition[] = Object.freeze([
  Object.freeze({ level: "A0", label: "Observe only", derivedState: "observe_only", executionAllowed: false, orchestrationAllowed: false, futureBound: false }),
  Object.freeze({ level: "A1", label: "Recommend only", derivedState: "recommendation_only", executionAllowed: false, orchestrationAllowed: false, futureBound: false }),
  Object.freeze({ level: "A2", label: "Prepare plans", derivedState: "planning_only", executionAllowed: false, orchestrationAllowed: false, futureBound: false }),
  Object.freeze({ level: "A3", label: "Future-bound low-risk execution concept", derivedState: "simulation_only", executionAllowed: false, orchestrationAllowed: false, futureBound: true }),
  Object.freeze({ level: "A4", label: "Future-bound workflow coordination concept", derivedState: "simulation_only", executionAllowed: false, orchestrationAllowed: false, futureBound: true }),
  Object.freeze({ level: "A5", label: "Future adaptive orchestration concept", derivedState: "simulation_only", executionAllowed: false, orchestrationAllowed: false, futureBound: true }),
  Object.freeze({ level: "A6", label: "Forbidden / unconstitutional / permanently invalid", derivedState: "forbidden", executionAllowed: false, orchestrationAllowed: false, futureBound: true }),
]);

export function getAutonomyReadinessDefinition(level: AutonomyLevel) {
  return DEFINITIONS.find((entry) => entry.level === level);
}

export function listAutonomyReadinessDefinitions() {
  return DEFINITIONS;
}
