import type { CanonicalPlan } from "../../contracts/plan-types";
import type { FrozenValidationContext } from "../validation-context";
import type { ValidationTopologySummary } from "../validation-result";
import type { GraphIndex } from "./graph-index";

export function createGraphReplaySnapshot(input: {
  plan: CanonicalPlan;
  graph: GraphIndex;
  context: FrozenValidationContext;
  planHash: string;
  graphHash: string;
  topology: ValidationTopologySummary;
}) {
  return {
    schemaVersion: input.context.schemaVersion,
    planHash: input.planHash,
    graphHash: input.graphHash,
    authoredStepOrder: input.plan.steps.map((step) => step.stepId),
    dependencyMap: Object.fromEntries(
      input.plan.steps.map((step) => [step.stepId, [...step.dependencies]]),
    ),
    topology: input.topology,
  };
}

