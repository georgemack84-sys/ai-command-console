import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { ExecutionTruthPackage } from "../execution-truth";
import type { NormalizedPlan } from "../normalization";
import type { VersionedReplayArtifact } from "../versioning";

export type SimulationStatus =
  | "success"
  | "blocked"
  | "partial"
  | "failed";

export type SimulationFailureCode =
  | "SIMULATION_LINEAGE_MISSING"
  | "SIMULATION_LINEAGE_DIVERGENCE"
  | "SIMULATION_SIDE_EFFECT_DETECTED"
  | "SIMULATION_UNSUPPORTED_TOOL"
  | "SIMULATION_REPLAY_PROJECTION_INVALID"
  | "SIMULATION_DERIVATION_MISMATCH"
  | "SIMULATION_GOVERNANCE_BLOCK"
  | "SIMULATION_ROLLBACK_INVALID"
  | "SIMULATION_ENVIRONMENT_DRIFT";

export type SimulationMode = "dry-run" | "simulation";

export type SideEffectCategory =
  | "database-write"
  | "file-write"
  | "external-mutation"
  | "queue-dispatch"
  | "notification-send"
  | "lease-acquire"
  | "runtime-state-mutation"
  | "execution-start";

export type SimulationLineageContext = Readonly<{
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  replayIdentityRoot: string;
  migrationLineage: readonly string[];
}>;

export type SimulationRequest = Readonly<{
  planId: string;
  planHash: string;
  lineage: SimulationLineageContext;
  mode: SimulationMode;
}>;

export type SimulationRisk = Readonly<{
  stepId: string;
  level: string;
  reasons: readonly string[];
  source: "execution-truth";
}>;

export type BlockedSimulationOperation = Readonly<{
  stepId: string;
  toolId: string;
  category: SideEffectCategory | "governance-block" | "unsupported-tool";
  reason: string;
}>;

export type SimulationFailure = Readonly<{
  code: SimulationFailureCode;
  message: string;
  path?: string;
}>;

export type SimulationWarning = Readonly<{
  code: "SIMULATION_BLOCKED_OPERATION" | "SIMULATION_GOVERNANCE_WARNING";
  message: string;
}>;

export type SimulationStepResult = Readonly<{
  stepId: string;
  toolId: string;
  operation: string;
  order: number;
  status: "predicted" | "blocked";
  approvalRequired: boolean;
  rollbackProjected: boolean;
  lineageRef: SimulationLineageContext;
  reason?: string;
}>;

export type SimulationResult = Readonly<{
  simulationId: string;
  status: SimulationStatus;
  planHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  replayIdentityRoot: string;
  derivedSimulationHash: string;
  predictedSteps: readonly SimulationStepResult[];
  predictedRisks: readonly SimulationRisk[];
  blockedOperations: readonly BlockedSimulationOperation[];
  failures: readonly SimulationFailure[];
  createdAt: string;
}>;

export type SimulationReadiness = Readonly<{
  ready: boolean;
  failures: readonly SimulationFailure[];
  warnings: readonly SimulationWarning[];
  lineage: SimulationLineageContext;
  derivedSimulationHash: string;
}>;

export type SimulationAdapterContract = Readonly<{
  toolId: string;
  supportsSimulation: boolean;
  supportsDryRun: boolean;
  sideEffectFree: boolean;
}>;

export type SimulationAdapterRegistry = Readonly<{
  adapters: Readonly<Record<string, SimulationAdapterContract>>;
}>;

export type SimulationBuildInput = Readonly<{
  normalizedPlan: NormalizedPlan;
  executionTruthPackage: ExecutionTruthPackage;
  executionCompatibilityContract: ExecutionCompatibilityContract;
  versionedReplayArtifact: VersionedReplayArtifact;
  mode?: SimulationMode;
  adapterRegistry?: SimulationAdapterRegistry;
}>;

export type RollbackProjection = Readonly<{
  stepId: string;
  available: boolean;
  required: boolean;
  reason?: string;
}>;
