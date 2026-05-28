import type { CoordinationFreezeRecord, FreshnessDecision, FreshnessError, ProposalFreshnessState, StaleClassification } from "@/types/freshness";
import type { FreshnessLineageLedger } from "./freshnessAppendOnlyLedger";
import { classifyStaleIntent } from "@/services/classification/staleIntentClassifier";
import { revalidateReplayIntegrity } from "@/services/revalidation/replayRevalidationEngine";
import { freezeUnsafeCoordination } from "@/services/freeze/coordinationFreezeEngine";
import { blockUnsafeCoordination } from "@/services/freeze/unsafeCoordinationBlocker";

export function coordinateFreshnessRevalidation(input: {
  state: ProposalFreshnessState;
  proposalReplayHash: string;
  lifecycleReplayHash: string;
  lifecycleEntries: number;
  currentLifecycleState: string;
  resultingLifecycleState: string;
  correlationEntries: number;
  lifecycleImmutable: boolean;
  readinessDerivedOnly: boolean;
  escalationDerivedOnly: boolean;
  createdAt: string;
  metadata?: Readonly<Record<string, unknown>>;
}): Readonly<{
  replayRevalidation: import("@/types/freshness").ReplayRevalidationRecord;
  freeze: CoordinationFreezeRecord;
  classification: StaleClassification;
  decision: FreshnessDecision;
  errors: readonly FreshnessError[];
}> {
  const replay = revalidateReplayIntegrity({
    proposalId: input.state.proposalId,
    replayValid: input.state.replayIntegrity === "verified",
    lifecycleReplayHash: input.lifecycleReplayHash,
    proposalReplayHash: input.proposalReplayHash,
    lifecycleEntries: input.lifecycleEntries,
    currentLifecycleState: input.currentLifecycleState,
    resultingLifecycleState: input.resultingLifecycleState,
    correlationEntries: input.correlationEntries,
    lifecycleImmutable: input.lifecycleImmutable,
    readinessDerivedOnly: input.readinessDerivedOnly,
    escalationDerivedOnly: input.escalationDerivedOnly,
    createdAt: input.createdAt,
  });
  const freeze = freezeUnsafeCoordination({
    proposalId: input.state.proposalId,
    drifts: input.state.detectedDrifts,
    replayIntegrity: replay.record.replayIntegrity,
    freshnessStatus: input.state.freshnessStatus,
    createdAt: input.createdAt,
    metadata: input.metadata,
  });
  const stateForClassification = Object.freeze({
    ...input.state,
    replayIntegrity: replay.record.replayIntegrity,
    freshnessStatus: freeze.freeze.frozen ? "frozen" as const : input.state.freshnessStatus,
  });
  const classification = classifyStaleIntent({
    state: stateForClassification,
    createdAt: input.createdAt,
  });
  const decision = blockUnsafeCoordination({
    freeze: freeze.freeze,
    freshnessStatus: stateForClassification.freshnessStatus,
  });

  return Object.freeze({
    replayRevalidation: replay.record,
    freeze: freeze.freeze,
    classification,
    decision,
    errors: Object.freeze([
      ...replay.errors,
      ...freeze.errors,
    ]),
  });
}
