import type { NormalizedPlan, NormalizedPlanStep } from "../normalization";
import type { DependencyEdge, DependencyGraph, DependencyNode } from "./dependency-types";

export const DEPENDENCY_GRAPH_VERSION = "4.2D";

function readString(record: Record<string, unknown>, key: string): string | undefined {
  const value = record[key];
  return typeof value === "string" && value.trim() ? value : undefined;
}

function readBoolean(record: Record<string, unknown>, key: string): boolean | undefined {
  const value = record[key];
  return typeof value === "boolean" ? value : undefined;
}

function resolveBranchType(step: NormalizedPlanStep): DependencyNode["branchType"] {
  const raw = step.inputs.branchType;
  if (raw === "normal" || raw === "failure" || raw === "rollback" || raw === "terminal") {
    return raw;
  }
  return "normal";
}

function buildNode(step: NormalizedPlanStep): DependencyNode {
  const action = step.action && typeof step.action === "object"
    ? step.action as Record<string, unknown>
    : {};

  return {
    stepId: step.id,
    sourceId: step.sourceId,
    sequenceIndex: step.index,
    stepType: step.type,
    operation: readString(action, "operation"),
    branchType: resolveBranchType(step),
    requiresApproval: step.approvalMode === "REQUIRED",
    requiresPreflight: readBoolean(step.inputs, "requiresPreflight"),
    isDestructive: readBoolean(step.inputs, "isDestructive"),
    hasExternalSideEffect: readBoolean(step.inputs, "hasExternalSideEffect"),
    idempotencyKey: readString(step.inputs, "idempotencyKey"),
    declaredPriority: readString(step.inputs, "priority"),
  };
}

function edgeTypeFor(source: DependencyNode): DependencyEdge["edgeType"] {
  if (source.operation === "approval_gate") {
    return "approval_gate";
  }
  if (source.operation === "preflight_check") {
    return "preflight_gate";
  }
  if (source.operation === "verify") {
    return "verification";
  }
  if (source.branchType === "rollback") {
    return "rollback";
  }
  if (source.branchType === "failure") {
    return "failure_branch";
  }
  return "depends_on";
}

export function buildDependencyGraph(normalizedPlan: NormalizedPlan): DependencyGraph {
  const nodes = normalizedPlan.steps.map(buildNode);
  const nodeMap = new Map(nodes.map((node) => [node.stepId, node]));
  const sourceIdMap = new Map(
    normalizedPlan.steps
      .filter((step) => typeof step.sourceId === "string" && step.sourceId.length > 0)
      .map((step) => [step.sourceId!, step.id]),
  );
  const edges: DependencyEdge[] = [];

  for (const step of normalizedPlan.steps) {
    for (const dependency of step.dependencies) {
      const resolvedDependency = nodeMap.has(dependency)
        ? dependency
        : sourceIdMap.get(dependency) ?? dependency;
      const source = nodeMap.get(resolvedDependency);
      edges.push({
        from: resolvedDependency,
        to: step.id,
        edgeType: source ? edgeTypeFor(source) : "depends_on",
      });
    }
  }

  const inbound = new Set(edges.map((edge) => edge.to));
  const outbound = new Set(edges.map((edge) => edge.from));

  return {
    planId: normalizedPlan.planId,
    nodes,
    edges,
    roots: nodes.filter((node) => !inbound.has(node.stepId)).map((node) => node.stepId),
    terminalStepIds: nodes.filter((node) => !outbound.has(node.stepId)).map((node) => node.stepId),
    graphHash: normalizedPlan.validatedGraphHash,
    graphVersion: DEPENDENCY_GRAPH_VERSION,
  };
}
