import type { HistoricalReplaySnapshot, ReplayFailure, ReplayLedgerEvent, ReplayLedgerEventType } from "../replayTypes";
import { hashReplayLedger, hashReplayLedgerEvent } from "../hashing/replayHasher";

function buildFailure(code: ReplayFailure["code"], message: string, path?: string, expected?: unknown, actual?: unknown): ReplayFailure {
  return { code, message, path, expected, actual };
}

export function appendReplayLedgerEvent(
  ledger: readonly ReplayLedgerEvent[],
  eventType: ReplayLedgerEventType,
  snapshot: Pick<HistoricalReplaySnapshot, "bindingHash" | "runtimeValidationHash" | "governanceHash">,
  occurredAt?: string,
): ReplayLedgerEvent {
  const previousEventHash = ledger.length > 0 ? ledger[ledger.length - 1].eventHash : null;
  const eventHash = hashReplayLedgerEvent({
    eventType,
    bindingHash: snapshot.bindingHash,
    runtimeValidationHash: snapshot.runtimeValidationHash,
    governanceHash: snapshot.governanceHash,
    previousEventHash,
  });

  return {
    eventType,
    bindingHash: snapshot.bindingHash,
    runtimeValidationHash: snapshot.runtimeValidationHash,
    governanceHash: snapshot.governanceHash,
    previousEventHash,
    eventHash,
    occurredAt,
  };
}

export function buildReplayLedger(
  eventTypes: readonly ReplayLedgerEventType[],
  snapshot: Pick<HistoricalReplaySnapshot, "bindingHash" | "runtimeValidationHash" | "governanceHash">,
): readonly ReplayLedgerEvent[] {
  return eventTypes.reduce<ReplayLedgerEvent[]>((ledger, eventType) => {
    ledger.push(appendReplayLedgerEvent(ledger, eventType, snapshot));
    return ledger;
  }, []);
}

export function hashReplayEventStream(ledger: readonly ReplayLedgerEvent[]) {
  return hashReplayLedger(ledger);
}

export function validateReplayLedgerIntegrity(
  ledger: readonly ReplayLedgerEvent[],
  snapshot: Pick<HistoricalReplaySnapshot, "bindingHash" | "runtimeValidationHash" | "governanceHash" | "eventStreamHash">,
): readonly ReplayFailure[] {
  const failures: ReplayFailure[] = [];

  let previousEventHash: string | null = null;
  ledger.forEach((event, index) => {
    const expectedHash = hashReplayLedgerEvent({
      eventType: event.eventType,
      bindingHash: event.bindingHash,
      runtimeValidationHash: event.runtimeValidationHash,
      governanceHash: event.governanceHash,
      previousEventHash: event.previousEventHash,
    });
    if (event.eventHash !== expectedHash) {
      failures.push(buildFailure("REPLAY_LEDGER_CORRUPTED", "replay ledger event hash mismatch", `ledger[${index}].eventHash`, event.eventHash, expectedHash));
    }
    if (event.previousEventHash !== previousEventHash) {
      failures.push(buildFailure(
        "REPLAY_EVENT_CHAIN_BROKEN",
        "replay ledger event chain is broken",
        `ledger[${index}].previousEventHash`,
        previousEventHash,
        event.previousEventHash,
      ));
    }
    if (event.bindingHash !== snapshot.bindingHash || event.runtimeValidationHash !== snapshot.runtimeValidationHash || event.governanceHash !== snapshot.governanceHash) {
      failures.push(buildFailure("REPLAY_LEDGER_CORRUPTED", "replay ledger event does not match historical replay snapshot", `ledger[${index}]`));
    }
    previousEventHash = event.eventHash;
  });

  const eventStreamHash = hashReplayEventStream(ledger);
  if (eventStreamHash !== snapshot.eventStreamHash) {
    failures.push(buildFailure("REPLAY_HASH_MISMATCH", "replay event stream hash mismatch", "eventStreamHash", snapshot.eventStreamHash, eventStreamHash));
  }

  return failures;
}
