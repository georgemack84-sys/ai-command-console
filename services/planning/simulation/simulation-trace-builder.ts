import type { NormalizedPlan } from "../normalization";
import { createSimulationFailure } from "./simulation-errors";
import { guardSimulationSideEffects } from "./side-effect-guard";
import { resolveSimulationAdapter } from "./simulation-adapter-registry";
import type {
  BlockedSimulationOperation,
  RollbackProjection,
  SimulationAdapterRegistry,
  SimulationFailure,
  SimulationLineageContext,
  SimulationMode,
  SimulationStepResult,
  SimulationWarning,
} from "./simulation-types";

export function buildSimulationTrace(input: {
  normalizedPlan: NormalizedPlan;
  mode: SimulationMode;
  lineage: SimulationLineageContext;
  adapterRegistry: SimulationAdapterRegistry;
  rollbackProjection: readonly RollbackProjection[];
}): {
  predictedSteps: readonly SimulationStepResult[];
  blockedOperations: readonly BlockedSimulationOperation[];
  failures: readonly SimulationFailure[];
  warnings: readonly SimulationWarning[];
} {
  const failures: SimulationFailure[] = [];
  const warnings: SimulationWarning[] = [];
  const blockedOperations: BlockedSimulationOperation[] = [];
  const projectedRollbackByStep = new Map(input.rollbackProjection.map((entry) => [entry.stepId, entry]));

  const predictedSteps = input.normalizedPlan.steps.map((step) => {
    const action = step.action as { tool?: string; operation?: string };
    const toolId = typeof action.tool === "string" ? action.tool : "unknown";
    const operation = typeof action.operation === "string" ? action.operation : "unknown";
    const adapter = resolveSimulationAdapter(input.adapterRegistry, toolId);

    if (!adapter || !adapter.supportsSimulation || (input.mode === "dry-run" && !adapter.supportsDryRun)) {
      failures.push(createSimulationFailure(
        "SIMULATION_UNSUPPORTED_TOOL",
        `Tool ${toolId} does not support ${input.mode}.`,
        `steps.${step.id}.action.tool`,
      ));
      blockedOperations.push({
        stepId: step.id,
        toolId,
        category: "unsupported-tool",
        reason: `Tool ${toolId} is unsupported for ${input.mode}.`,
      });
      return {
        stepId: step.id,
        toolId,
        operation,
        order: step.index,
        status: "blocked" as const,
        approvalRequired: step.approvalMode === "REQUIRED",
        rollbackProjected: Boolean(projectedRollbackByStep.get(step.id)?.available),
        lineageRef: input.lineage,
        reason: `Tool ${toolId} is unsupported for ${input.mode}.`,
      };
    }

    const sideEffectGuard = guardSimulationSideEffects(step, adapter);
    failures.push(...sideEffectGuard.failures);
    blockedOperations.push(...sideEffectGuard.blockedOperations);

    const blocked = sideEffectGuard.failures.length > 0;
    if (blocked) {
      warnings.push({
        code: "SIMULATION_BLOCKED_OPERATION",
        message: `Simulation blocked side effects for ${step.id}.`,
      });
    }

    return {
      stepId: step.id,
      toolId,
      operation,
      order: step.index,
      status: blocked ? "blocked" as const : "predicted" as const,
      approvalRequired: step.approvalMode === "REQUIRED",
      rollbackProjected: Boolean(projectedRollbackByStep.get(step.id)?.available),
      lineageRef: input.lineage,
      reason: blocked ? `Blocked side effects detected for ${step.id}.` : undefined,
    };
  });

  return {
    predictedSteps,
    blockedOperations,
    failures,
    warnings,
  };
}
