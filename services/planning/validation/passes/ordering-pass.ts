import type { CanonicalPlan } from "../../contracts/plan-types";
import type { ValidationError } from "../validation-result";
import type { GraphIndex } from "../structural/graph-index";

export function runOrderingPass(plan: CanonicalPlan, graph: GraphIndex) {
  const errors: ValidationError[] = [];

  for (const step of plan.steps) {
    const node = graph.nodeMap.get(step.stepId);
    if (!node) {
      continue;
    }

    for (const dependency of step.dependencies) {
      const dependencyNode = graph.nodeMap.get(dependency);
      if (dependencyNode && dependencyNode.index >= node.index) {
        errors.push({
          code: "STRUCTURE_INVALID_ORDERING",
          path: `steps.${step.stepId}.dependencies`,
          message: `Dependency ${dependency} appears after ${step.stepId}.`,
          stage: "ordering",
        });
      }
    }

    if (step.action.parameters.parallel === true && typeof step.action.parameters.parallelGroup !== "string") {
      errors.push({
        code: "STRUCTURE_INVALID_ORDERING",
        path: `steps.${step.stepId}.action.parameters.parallelGroup`,
        message: "Parallel execution must declare an explicit parallelGroup.",
        stage: "ordering",
      });
    }
  }

  return { errors };
}

