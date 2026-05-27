import type { ValidationError } from "../validation-result";

export const MAX_PLAN_NODES = 64;
export const MAX_PLAN_DEPTH = 10;

export function runContainmentPass(input: {
  nodeCount: number;
  maxDepth: number;
}) {
  const errors: ValidationError[] = [];

  if (input.nodeCount > MAX_PLAN_NODES) {
    errors.push({
      code: "STRUCTURE_NODE_LIMIT_EXCEEDED",
      path: "steps",
      message: "Plan node limit exceeded.",
      stage: "containment",
    });
  }

  if (input.maxDepth > MAX_PLAN_DEPTH) {
    errors.push({
      code: "STRUCTURE_DEPTH_EXCEEDED",
      path: "steps",
      message: "Plan depth limit exceeded.",
      stage: "containment",
    });
  }

  return { errors };
}

