import { hashStableContent } from "../versioning";
import { buildSimulationLineageContext } from "./simulation-context";
import { createSimulationAdapterRegistry } from "./simulation-adapter-registry";
import { buildGovernanceSimulationBridge } from "./governance-simulation-bridge";
import { validateSimulationLineage } from "./lineage-simulation-validator";
import { buildRollbackProjection } from "./rollback-projection";
import { buildSimulationTrace } from "./simulation-trace-builder";
import type { SimulationBuildInput, SimulationResult, SimulationStatus, SimulationWarning } from "./simulation-types";

function deepFreeze<T>(value: T): Readonly<T> {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    if (Array.isArray(value)) {
      for (const item of value) {
        deepFreeze(item);
      }
    } else {
      for (const nested of Object.values(value)) {
        deepFreeze(nested);
      }
    }
  }
  return value as Readonly<T>;
}

function determineStatus(input: {
  lineageFailures: number;
  rollbackFailures: number;
  governanceFailures: number;
  traceFailures: number;
  blockedCount: number;
}): SimulationStatus {
  if (input.lineageFailures > 0 || input.governanceFailures > 0) {
    return "blocked";
  }
  if (input.rollbackFailures > 0 || input.traceFailures > 0) {
    return input.blockedCount > 0 ? "partial" : "failed";
  }
  return input.blockedCount > 0 ? "partial" : "success";
}

export function orchestrateSimulation(input: SimulationBuildInput): Readonly<{
  result: SimulationResult;
  warnings: readonly SimulationWarning[];
}> {
  const adapterRegistry = input.adapterRegistry ?? createSimulationAdapterRegistry();
  const lineage = buildSimulationLineageContext(input.versionedReplayArtifact);

  const lineageValidation = validateSimulationLineage(input);
  const governanceBridge = buildGovernanceSimulationBridge(
    input.executionTruthPackage,
    input.executionCompatibilityContract,
  );
  const rollbackProjection = buildRollbackProjection(
    input.normalizedPlan,
    input.executionCompatibilityContract,
  );
  const trace = buildSimulationTrace({
    normalizedPlan: input.normalizedPlan,
    mode: input.mode ?? "simulation",
    lineage,
    adapterRegistry,
    rollbackProjection: rollbackProjection.projection,
  });

  const failures = [
    ...lineageValidation.failures,
    ...governanceBridge.failures,
    ...rollbackProjection.failures,
    ...trace.failures,
  ];

  const blockedOperations = [
    ...governanceBridge.blockedOperations,
    ...trace.blockedOperations,
  ];

  const derivedSimulationHash = hashStableContent("REPLAY_CONTEXT", {
    phase: "4.2J",
    mode: input.mode ?? "simulation",
    planId: input.normalizedPlan.planId,
    lineage,
    normalizedPlanProjection: input.normalizedPlan.steps.map((step) => ({
      id: step.id,
      sourceId: step.sourceId,
      index: step.index,
      type: step.type,
      action: step.action,
      inputs: step.inputs,
      outputs: step.outputs,
      dependencies: step.dependencies,
      constraints: step.constraints,
      approvalMode: step.approvalMode,
      retryMode: step.retryMode,
      executionMode: step.executionMode,
      autonomyLevel: step.autonomyLevel,
      containmentLevel: step.containmentLevel,
    })),
    predictedSteps: trace.predictedSteps.map((step) => ({
      stepId: step.stepId,
      toolId: step.toolId,
      operation: step.operation,
      status: step.status,
      approvalRequired: step.approvalRequired,
      rollbackProjected: step.rollbackProjected,
    })),
    predictedRisks: governanceBridge.predictedRisks,
    blockedOperations,
    rollbackProjection: rollbackProjection.projection.map((entry) => ({
      stepId: entry.stepId,
      available: entry.available,
      required: entry.required,
      ...(entry.reason ? { reason: entry.reason } : {}),
    })),
  });

  const result: SimulationResult = {
    simulationId: `sim-${input.normalizedPlan.planId}-${derivedSimulationHash.slice(0, 12)}`,
    status: determineStatus({
      lineageFailures: lineageValidation.failures.length,
      rollbackFailures: rollbackProjection.failures.length,
      governanceFailures: governanceBridge.failures.length,
      traceFailures: trace.failures.length,
      blockedCount: blockedOperations.length,
    }),
    planHash: input.versionedReplayArtifact.replayAuditResult.planHash,
    executionTruthHash: input.executionTruthPackage.executionTruthHash,
    executionCompatibilityHash: input.executionCompatibilityContract.executionCompatibilityHash,
    replaySnapshotHash: lineage.replaySnapshotHash,
    replayIdentityRoot: lineage.replayIdentityRoot,
    derivedSimulationHash,
    predictedSteps: trace.predictedSteps,
    predictedRisks: governanceBridge.predictedRisks,
    blockedOperations,
    failures,
    createdAt: input.normalizedPlan.metadata.createdAt,
  };

  return deepFreeze({
    result,
    warnings: [
      ...governanceBridge.warnings,
      ...trace.warnings,
    ],
  });
}
