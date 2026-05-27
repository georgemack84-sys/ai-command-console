import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { CompatibilityReplayReference } from "./replay-audit-types";

export function buildCompatibilityHashReference(
  contract: ExecutionCompatibilityContract,
  compatibilitySnapshotHash: string,
): CompatibilityReplayReference {
  return {
    executionTruthHash: contract.executionTruthHash,
    executionCompatibilityHash: contract.executionCompatibilityHash,
    compatibilitySnapshotHash,
  };
}
