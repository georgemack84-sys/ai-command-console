import type {
  ConstitutionalReadinessError,
  ConstitutionalReadinessInput,
  ReadinessDomainScore,
} from "./readinessStateTypes";
import { hashReadinessValue } from "./readinessTraceHasher";

export function validateReadinessDeterminism(input: {
  readinessInput: ConstitutionalReadinessInput;
  domainScores: readonly ReadinessDomainScore[];
}): readonly ConstitutionalReadinessError[] {
  const validatorHash = hashReadinessValue("constitutional-readiness-determinism-check", {
    readinessId: input.readinessInput.readinessId,
    domainHashes: input.domainScores.map((score) => score.deterministicHash),
    replayHash: input.readinessInput.constitutionalReplayResult.deterministicHash,
    telemetryHash: input.readinessInput.constitutionalTelemetryResult.deterministicHash,
    simulationHash: input.readinessInput.constitutionalRuntimeSimulationResult.deterministicHash,
  });

  if (!validatorHash || validatorHash.length === 0) {
    return Object.freeze([{
      code: "CONSTITUTIONAL_READINESS_VALIDATOR_MISMATCH",
      message: "Deterministic hashing failed for readiness scoring.",
      path: "determinism",
    }]);
  }

  return Object.freeze([]);
}
