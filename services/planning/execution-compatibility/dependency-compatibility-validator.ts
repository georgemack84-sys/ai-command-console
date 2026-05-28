import type { DependencyGraph } from "../dependencies";
import { createCompatibilityViolation } from "./execution-compatibility-errors";
import type { RollbackContract, CompatibilityViolation } from "./execution-compatibility-types";

export function validateRollbackDependencyCompatibility(
  graph: DependencyGraph,
  rollbackContracts: RollbackContract[],
): CompatibilityViolation[] {
  const rollbackByStep = new Map(rollbackContracts.map((contract) => [contract.stepId, contract]));
  const sequenceIndex = new Map(graph.nodes.map((node) => [node.stepId, node.sequenceIndex]));
  const violations: CompatibilityViolation[] = [];

  for (const edge of graph.edges) {
    const fromRollback = rollbackByStep.get(edge.from);
    const toRollback = rollbackByStep.get(edge.to);
    if (!fromRollback?.required || !toRollback?.required) {
      continue;
    }

    const fromSequence = sequenceIndex.get(edge.from) ?? 0;
    const toSequence = sequenceIndex.get(edge.to) ?? 0;
    const expectedFrom = (graph.nodes.length - 1) - fromSequence;
    const expectedTo = (graph.nodes.length - 1) - toSequence;

    const actualFrom = fromRollback.rollbackOrder ?? expectedFrom;
    const actualTo = toRollback.rollbackOrder ?? expectedTo;

    if (actualFrom <= actualTo) {
      violations.push(createCompatibilityViolation(
        "PLAN_ROLLBACK_DEPENDENCY_CONFLICT",
        `Rollback order for ${edge.from} must be later than rollback order for ${edge.to}.`,
        `rollbackContracts.${edge.from}`,
      ));
    }
  }

  return violations;
}
