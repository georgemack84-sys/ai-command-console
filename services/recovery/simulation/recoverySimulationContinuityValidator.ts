import { verifyRuntimeState } from "../../runtime/verification/runtimeStateVerification";
import type { RecoverySimulationScenarioType } from "./recoverySimulationTypes";

export function validateRecoverySimulationContinuity({
  scenarioType,
  replayDeterministic,
  continuitySnapshots = [],
  ledgerEvents = [],
  checkpointState = null,
  replayResult,
}: {
  scenarioType: RecoverySimulationScenarioType;
  replayDeterministic: boolean;
  continuitySnapshots?: Record<string, unknown>[];
  ledgerEvents?: Record<string, unknown>[];
  checkpointState?: string | null;
  replayResult: { deterministic: boolean; reconstructedStates: string[]; replaySequence: string[] };
}) {
  const validation = verifyRuntimeState({
    continuitySnapshots,
    replayResult,
    ledgerEvents,
    checkpointState,
  });
  const latestSnapshot = (continuitySnapshots.at(-1) || {}) as Record<string, unknown>;
  const warnings: string[] = [];
  const disputes: string[] = [];

  if (scenarioType === "LEASE_CONFLICT_RECOVERY" && Number(latestSnapshot.staleLocks || 0) > 0) {
    warnings.push("lease:conflict");
    disputes.push("LEASE_CONFLICT");
  }
  if (scenarioType === "PARTIAL_EXECUTION_RECOVERY") {
    warnings.push("execution:partial");
    disputes.push("PARTIAL_EXECUTION");
  }
  if (scenarioType === "STALE_EXECUTION_RECOVERY") {
    warnings.push("execution:stale");
    disputes.push("STALE_RUNTIME_TRUTH");
  }
  if (scenarioType === "DEPENDENCY_FAILURE_RECOVERY") {
    warnings.push("dependency:failed");
  }

  return {
    validated: validation.ok && replayDeterministic && disputes.length === 0,
    survivabilityScore: Number(latestSnapshot.survivabilityScore || (validation.ok ? 80 : 25)),
    warnings: [
      ...warnings,
      ...(validation.ok ? [] : ["continuity:invalid"]),
    ],
    disputes: [
      ...disputes,
      ...(validation.ok ? [] : ((validation.error.details?.disputes as string[] | undefined) || ["CONTINUITY_INVALID"])),
    ],
    details: validation,
  };
}
