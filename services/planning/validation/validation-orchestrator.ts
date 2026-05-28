import { getToolRegistry } from "@/services/registry/toolRegistry";

import type { CanonicalPlan } from "../contracts/plan-types";
import type { FrozenValidationContext } from "./validation-context";
import type { ValidationError, ValidationResult, ValidationTopologySummary, ValidationWarning } from "./validation-result";
import { createValidationEvidence } from "./evidence/validation-evidence";
import { createGraphReplaySnapshot } from "./evidence/replay-snapshot";
import { buildPlanGraph } from "./structural/graph-builder";
import { runBranchPass } from "./passes/branch-pass";
import { runContainmentPass } from "./passes/containment-pass";
import { runDependencyPass } from "./passes/dependency-pass";
import { runDeterminismPass } from "./passes/determinism-pass";
import { runGovernancePass } from "./passes/governance-pass";
import { runMergePass } from "./passes/merge-pass";
import { runOrderingPass } from "./passes/ordering-pass";
import { runRetryPass } from "./passes/retry-pass";
import { runSchemaPass } from "./passes/schema-pass";
import { runTopologyPass } from "./passes/topology-pass";

function toolValidation(plan: CanonicalPlan): ValidationError[] {
  const registry = new Set(getToolRegistry().map((entry) => entry.toolId));
  return plan.steps.flatMap((step) => {
    if (registry.has(step.action.tool)) {
      return [];
    }
    return [{
      code: "PLAN_TOOL_UNKNOWN",
      path: `steps.${step.stepId}.action.tool`,
      message: `Tool ${step.action.tool} is not declared in the registry.`,
      stage: "step",
    }];
  });
}

function aggregateStatus(errors: ValidationError[], approvalRequired: boolean): ValidationResult["status"] {
  if (errors.length === 0) {
    return "approved_for_planning_pipeline";
  }
  if (approvalRequired && errors.some((error) => error.code === "PLAN_APPROVAL_MISSING")) {
    return "approval_required";
  }
  if (errors.some((error) => error.code === "PLAN_NON_DETERMINISTIC" || error.code === "GOVERNANCE_FAILURE")) {
    return "unsafe";
  }
  return "rejected";
}

export function orchestratePlanValidation(input: unknown, context: FrozenValidationContext): ValidationResult {
  const warnings: ValidationWarning[] = [];
  const schemaPass = runSchemaPass(input);
  const validationStages = ["schema"];

  if (!schemaPass.ok) {
    const emptyTopology: ValidationTopologySummary = {
      nodeCount: 0,
      edgeCount: 0,
      branchCount: 0,
      maxDepth: 0,
    };
    const placeholderPlan = {
      schemaVersion: context.schemaVersion,
      planId: "invalid-plan",
      createdAt: "1970-01-01T00:00:00.000Z",
      mission: { objective: "", priority: "normal", classification: "informational" },
      context: { sourceIds: [], evidenceRefs: [], constraints: [] },
      approvals: { required: false, policyRefs: [] },
      execution: { mode: "blocked", timeoutMs: 1, retryPolicy: { maxAttempts: 1, backoffMs: 0 } },
      steps: [],
      governance: { truthScoreRequired: 1, validationProfile: "invalid" },
      metadata: { plannerVersion: "4.2B", generatedBy: "validation-engine" },
    } as CanonicalPlan;

    const replaySnapshot = {
      schemaVersion: context.schemaVersion,
      planHash: "",
      graphHash: "",
      authoredStepOrder: [],
      dependencyMap: {},
      topology: emptyTopology,
    };

    const evidence = createValidationEvidence({
      plan: placeholderPlan,
      schemaEvidence: schemaPass.evidence,
      context,
      topology: emptyTopology,
      dependencyMap: {},
      validationStages,
      errors: schemaPass.errors,
      warnings,
      graphHash: "",
      replaySnapshot,
    });

    return {
      ok: false,
      validated: false,
      status: "rejected",
      topology: emptyTopology,
      errors: schemaPass.errors,
      warnings,
      validationHash: evidence.validationHash,
      graphHash: evidence.graphHash,
      evidence,
    };
  }

  const plan = schemaPass.plan;
  const graph = buildPlanGraph(plan);

  const topologyPass = runTopologyPass(graph);
  validationStages.push("topology");
  const dependencyPass = runDependencyPass(graph);
  validationStages.push("dependency");
  const stepErrors = toolValidation(plan);
  validationStages.push("step");
  const orderingPass = runOrderingPass(plan, graph);
  validationStages.push("ordering");
  const branchPass = runBranchPass(plan, graph);
  validationStages.push("branch");
  const mergePass = runMergePass(plan);
  validationStages.push("merge");
  const retryPass = runRetryPass(plan);
  validationStages.push("retry");
  const governancePass = runGovernancePass(plan);
  validationStages.push("governance");
  validationStages.push("approval");
  const determinismPass = runDeterminismPass(plan, graph);
  validationStages.push("determinism");
  const topologyWithBranches = {
    ...topologyPass.topology,
    branchCount: branchPass.branchCount,
  };
  const containmentPass = runContainmentPass({
    nodeCount: topologyWithBranches.nodeCount,
    maxDepth: topologyWithBranches.maxDepth,
  });
  validationStages.push("containment");

  const errors = [
    ...topologyPass.errors,
    ...dependencyPass.errors,
    ...stepErrors,
    ...orderingPass.errors,
    ...branchPass.errors,
    ...mergePass.errors,
    ...retryPass.errors,
    ...governancePass.errors,
    ...determinismPass.errors,
    ...containmentPass.errors,
  ];

  const replaySnapshot = createGraphReplaySnapshot({
    plan,
    graph,
    context,
    planHash: determinismPass.planHash,
    graphHash: determinismPass.graphHash,
    topology: topologyWithBranches,
  });

  const evidence = createValidationEvidence({
    plan,
    schemaEvidence: schemaPass.evidence,
    context,
    topology: topologyWithBranches,
    dependencyMap: Object.fromEntries(plan.steps.map((step) => [step.stepId, [...step.dependencies]])),
    validationStages: [...validationStages, "evidence", "final"],
    errors,
    warnings,
    graphHash: determinismPass.graphHash,
    replaySnapshot,
  });

  return {
    ok: errors.length === 0,
    validated: true,
    status: aggregateStatus(errors, governancePass.approvalRequired),
    topology: topologyWithBranches,
    errors,
    warnings,
    validationHash: evidence.validationHash,
    graphHash: evidence.graphHash,
    evidence,
  };
}

