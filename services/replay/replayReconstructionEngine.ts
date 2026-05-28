import { buildReplaySequence } from "./replaySequenceBuilder";
import { assessReplayDeterminism } from "./replayDeterminism";
import type { ReplayReconstructionResult } from "../contracts/replay/replayTypes";

function stateFromEvent(event: Record<string, unknown>) {
  const payload = (event.eventPayload || event.payload || {}) as Record<string, unknown>;
  return payload.checkpointState == null ? null : String(payload.checkpointState);
}

function confidenceFromSignals(missingEvidence: string[], warnings: string[]) {
  return Math.max(0, Math.min(1, 1 - (missingEvidence.length * 0.25) - (warnings.length * 0.15)));
}

export function reconstructReplayHistory({
  executionId,
  ledgerEvents = [],
  auditEvents = [],
  continuitySnapshots = [],
}: {
  executionId: string;
  ledgerEvents?: Record<string, unknown>[];
  auditEvents?: Record<string, unknown>[];
  continuitySnapshots?: Record<string, unknown>[];
}): ReplayReconstructionResult {
  const ordered = buildReplaySequence(ledgerEvents);
  const determinism = assessReplayDeterminism({
    ledgerEvents,
    continuitySnapshots,
    auditEvents,
  });
  return {
    executionId,
    reconstructedStates: ordered
      .map(({ event }) => stateFromEvent(event))
      .filter((state): state is string => typeof state === "string"),
    replaySequence: ordered.map(({ eventType }) => eventType),
    missingEvidence: determinism.missingEvidence,
    reconstructionConfidence: confidenceFromSignals(determinism.missingEvidence, determinism.warnings),
    deterministic: determinism.deterministic,
    warnings: determinism.warnings,
  };
}
