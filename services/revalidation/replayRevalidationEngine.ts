import type { FreshnessError, ReplayRevalidationRecord } from "@/types/freshness";
import { verifyDeterministicReplay } from "./deterministicReplayVerifier";
import { validateLineageConsistency } from "./lineageConsistencyValidator";
import { evaluateIntegrityCheckpoint } from "./integrityCheckpointEvaluator";
import { hashFreshnessValue } from "@/services/freshness/freshnessHasher";

export function revalidateReplayIntegrity(input: {
  proposalId: string;
  replayValid: boolean;
  lifecycleReplayHash: string;
  proposalReplayHash: string;
  lifecycleEntries: number;
  currentLifecycleState: string;
  resultingLifecycleState: string;
  correlationEntries: number;
  lifecycleImmutable: boolean;
  readinessDerivedOnly: boolean;
  escalationDerivedOnly: boolean;
  createdAt: string;
}): Readonly<{
  record: ReplayRevalidationRecord;
  errors: readonly FreshnessError[];
}> {
  const replay = verifyDeterministicReplay({
    replayValid: input.replayValid,
    lifecycleReplayHash: input.lifecycleReplayHash,
    proposalReplayHash: input.proposalReplayHash,
  });
  const lineageErrors = validateLineageConsistency({
    lifecycleEntries: input.lifecycleEntries,
    currentLifecycleState: input.currentLifecycleState,
    resultingLifecycleState: input.resultingLifecycleState,
    correlationEntries: input.correlationEntries,
  });
  const checkpointErrors = evaluateIntegrityCheckpoint({
    lifecycleImmutable: input.lifecycleImmutable,
    readinessDerivedOnly: input.readinessDerivedOnly,
    escalationDerivedOnly: input.escalationDerivedOnly,
  });

  const errors = Object.freeze([
    ...replay.errors,
    ...lineageErrors,
    ...checkpointErrors,
  ]);
  const replayIntegrity =
    errors.some((error) => error.code === "SYNTHETIC_REPLAY_REJECTED") ? "quarantined"
    : replay.verified ? "verified"
    : "mismatch";

  const record: ReplayRevalidationRecord = Object.freeze({
    proposalId: input.proposalId,
    replayIntegrity,
    lineageConsistent: lineageErrors.length === 0,
    checkpointValid: checkpointErrors.length === 0,
    replaySafe: errors.length === 0,
    reasonCodes: Object.freeze([
      ...replay.reasonCodes,
      ...(lineageErrors.length === 0 ? ["lineage.consistent"] : ["lineage.inconsistent"]),
      ...(checkpointErrors.length === 0 ? ["checkpoint.valid"] : ["checkpoint.invalid"]),
    ]),
    revalidationHash: hashFreshnessValue("replay-revalidation-record", {
      proposalId: input.proposalId,
      replayIntegrity,
      errors,
      createdAt: input.createdAt,
    }),
    createdAt: input.createdAt,
  });

  return Object.freeze({ record, errors });
}
