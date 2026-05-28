import type { HistoricalReplaySnapshot, ReplayContainmentRestoration, ReplayFailure } from "../replayTypes";
import { hashReplayContainmentRestoration } from "../hashing/replayHasher";

function buildFailure(message: string, path?: string, expected?: unknown, actual?: unknown): ReplayFailure {
  return {
    code: "REPLAY_CONTAINMENT_RESTORATION_FAILED",
    message,
    path,
    expected,
    actual,
  };
}

export function restoreReplayContainment(snapshot: HistoricalReplaySnapshot): ReplayContainmentRestoration {
  const failures: ReplayFailure[] = [];

  if (!snapshot.binding) {
    failures.push(buildFailure("historical immutable execution binding is missing during containment restoration", "binding"));
  } else if (snapshot.binding.sandboxProfileHash !== snapshot.sandboxProfileHash) {
    failures.push(buildFailure(
      "historical sandbox profile hash cannot be restored from immutable execution binding",
      "sandboxProfileHash",
      snapshot.sandboxProfileHash,
      snapshot.binding.sandboxProfileHash,
    ));
  }
  if (!snapshot.binding) {
    // already recorded above
  } else if (snapshot.binding.replayContainmentHash !== snapshot.replayContainmentHash) {
    failures.push(buildFailure(
      "historical replay containment hash cannot be restored from immutable execution binding",
      "replayContainmentHash",
      snapshot.replayContainmentHash,
      snapshot.binding.replayContainmentHash,
    ));
  }
  if (!snapshot.binding) {
    // already recorded above
  } else if (snapshot.binding.runtimeAuthorityLockHash !== snapshot.runtimeAuthorityLockHash) {
    failures.push(buildFailure(
      "historical runtime authority lock hash cannot be restored from immutable execution binding",
      "runtimeAuthorityLockHash",
      snapshot.runtimeAuthorityLockHash,
      snapshot.binding.runtimeAuthorityLockHash,
    ));
  }
  if (!snapshot.runtimeValidation) {
    failures.push(buildFailure("historical runtime validation state is missing during containment restoration", "runtimeValidation"));
  } else if (snapshot.runtimeValidation.trustState !== snapshot.runtimeTrustState) {
    failures.push(buildFailure(
      "historical runtime trust state cannot be restored from runtime validation state",
      "runtimeTrustState",
      snapshot.runtimeTrustState,
      snapshot.runtimeValidation.trustState,
    ));
  }

  const restorationBase = {
    restored: failures.length === 0,
    sandboxProfileHash: failures.length === 0 ? snapshot.sandboxProfileHash : undefined,
    replayContainmentHash: failures.length === 0 ? snapshot.replayContainmentHash : undefined,
    runtimeAuthorityLockHash: failures.length === 0 ? snapshot.runtimeAuthorityLockHash : undefined,
    runtimeTrustState: failures.length === 0 ? snapshot.runtimeTrustState : undefined,
  } as const;

  return {
    ...restorationBase,
    restorationHash: hashReplayContainmentRestoration(restorationBase),
    failures,
  };
}
