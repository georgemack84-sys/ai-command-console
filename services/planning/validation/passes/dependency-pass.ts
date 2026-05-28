import type { ValidationError } from "../validation-result";
import type { GraphIndex } from "../structural/graph-index";

export const MAX_DEPENDENCY_FANIN = 4;
export const MAX_DEPENDENCY_FANOUT = 8;

export function runDependencyPass(graph: GraphIndex) {
  const errors: ValidationError[] = [];

  for (const node of graph.nodes) {
    for (const dependency of node.dependencies) {
      if (!graph.nodeMap.has(dependency)) {
        errors.push({
          code: "STRUCTURE_INVALID_ORDERING",
          path: `steps.${node.stepId}.dependencies`,
          message: `Missing dependency ${dependency}.`,
          stage: "dependency",
        });
      }
      if (dependency === node.stepId) {
        errors.push({
          code: "STRUCTURE_CYCLE_DETECTED",
          path: `steps.${node.stepId}.dependencies`,
          message: `Step ${node.stepId} cannot depend on itself.`,
          stage: "dependency",
        });
      }
    }

    if (node.dependencies.length > MAX_DEPENDENCY_FANIN) {
      errors.push({
        code: "STRUCTURE_CONTAINMENT_FAILURE",
        path: `steps.${node.stepId}.dependencies`,
        message: `Dependency fan-in exceeded for ${node.stepId}.`,
        stage: "dependency",
      });
    }

    if ((graph.outgoing.get(node.stepId) ?? []).length > MAX_DEPENDENCY_FANOUT) {
      errors.push({
        code: "STRUCTURE_CONTAINMENT_FAILURE",
        path: `steps.${node.stepId}`,
        message: `Dependency fan-out exceeded for ${node.stepId}.`,
        stage: "dependency",
      });
    }
  }

  return { errors };
}

