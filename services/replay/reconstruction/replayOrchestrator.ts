import { buildReplayManifest } from "../manifests/replayManifestBuilder";
import { reconstructReplayAudit } from "../audit/replayAuditReconstructor";
import { restoreReplayContainment } from "../containment/replayContainmentRestorer";
import { buildReplayLedger, hashReplayEventStream } from "../ledger/replayLedger";
import { buildHistoricalReplaySnapshot } from "../snapshots/replaySnapshotStore";
import { verifyReplayHistory } from "../verification/replayVerificationEngine";
import type { ReplayFailure, ReplayOrchestrationInput, ReplayOrchestrationResult } from "../replayTypes";

function buildFailure(code: ReplayFailure["code"], message: string, path?: string): ReplayFailure {
  return { code, message, path };
}

export function reconstructHistoricalReplay(input: ReplayOrchestrationInput): ReplayOrchestrationResult {
  if (!input.registryEntrySnapshot.supportsReplay || !input.policySnapshot.replay.supported) {
    const failures = [buildFailure("REPLAY_UNSUPPORTED", "historical replay reconstruction is unsupported for this tool version", "supportsReplay")];
    return {
      ledger: [],
      verification: {
        valid: false,
        verificationHash: "unsupported",
        failures: [...failures, buildFailure("REPLAY_VERIFICATION_FAILED", "historical replay verification failed")],
      },
      failures,
    };
  }

  const provisionalHashes = {
    bindingHash: input.binding.bindingHash,
    runtimeValidationHash: input.runtimeValidation.validationHash,
    governanceHash: input.governance.attribution.governanceHash ?? "",
  } as const;

  const eventTypes = [
    "replay.snapshot.created",
    "replay.manifest.generated",
    "replay.binding.restored",
    "replay.containment.restored",
    "replay.audit.reconstructed",
    "replay.execution.started",
    "replay.execution.completed",
  ] as const;

  const provisionalLedger = buildReplayLedger(eventTypes, provisionalHashes);
  const snapshot = buildHistoricalReplaySnapshot({
    ...input,
    eventStreamHash: hashReplayEventStream(provisionalLedger),
  });
  const ledger = buildReplayLedger(eventTypes, snapshot);
  const finalizedSnapshot = buildHistoricalReplaySnapshot({
    ...input,
    eventStreamHash: hashReplayEventStream(ledger),
  });
  const manifest = buildReplayManifest(finalizedSnapshot, ledger);
  const containment = restoreReplayContainment(finalizedSnapshot);
  const audit = reconstructReplayAudit(manifest, finalizedSnapshot, ledger);
  const verification = verifyReplayHistory(manifest, finalizedSnapshot, ledger);

  return {
    manifest,
    snapshot: finalizedSnapshot,
    ledger,
    containment,
    audit,
    verification,
    failures: verification.failures,
  };
}
