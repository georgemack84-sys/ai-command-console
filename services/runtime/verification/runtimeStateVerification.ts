import { verifyCheckpointState } from "./checkpointVerification";
import { verifyRuntimeContinuity } from "./continuityVerification";
import { verifyRuntimeLedger } from "./ledgerVerification";
import { verifyContinuitySnapshots } from "./snapshotVerification";

export function verifyRuntimeState({
  continuitySnapshots = [],
  replayResult,
  ledgerEvents = [],
  checkpointState = null,
}: {
  continuitySnapshots?: Record<string, unknown>[];
  replayResult: { deterministic: boolean; reconstructedStates: string[]; replaySequence: string[] };
  ledgerEvents?: Record<string, unknown>[];
  checkpointState?: string | null;
}) {
  const snapshots = verifyContinuitySnapshots(continuitySnapshots);
  const ledger = verifyRuntimeLedger(ledgerEvents);
  const checkpoint = verifyCheckpointState({ ledgerEvents, checkpointState });
  const continuity = verifyRuntimeContinuity({
    replayDeterministic: replayResult.deterministic,
    continuityConfidence: replayResult.deterministic ? 1 : 0.2,
  });

  const disputes = [
    ...snapshots.disputes,
    ...ledger.disputes,
    ...checkpoint.disputes,
    ...continuity.disputes,
  ];
  const valid = disputes.length === 0;

  if (!valid) {
    return {
      ok: false as const,
      error: {
        code: "RUNTIME_STATE_VERIFICATION_FAILED",
        message: "Runtime state verification failed.",
        details: {
          disputes,
          evidence: [
            ...snapshots.evidence,
            ...ledger.evidence,
            ...checkpoint.evidence,
            ...continuity.evidence,
          ],
        },
      },
    };
  }

  return {
    ok: true as const,
    data: {
      verified: true,
      disputes: [],
      evidence: [
        ...snapshots.evidence,
        ...ledger.evidence,
        ...checkpoint.evidence,
        ...continuity.evidence,
      ],
    },
  };
}
