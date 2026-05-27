import type { HistoricalReplaySnapshot, ReplayAuditReconstruction, ReplayLedgerEvent, ReplayManifest } from "../replayTypes";
import { hashReplayAuditReconstruction } from "../hashing/replayHasher";

export function reconstructReplayAudit(
  manifest: ReplayManifest,
  snapshot: HistoricalReplaySnapshot,
  ledger: readonly ReplayLedgerEvent[],
): ReplayAuditReconstruction {
  const auditBase = {
    toolId: snapshot.toolId,
    toolVersion: snapshot.toolVersion,
    bindingHash: snapshot.bindingHash,
    snapshotHash: snapshot.snapshotHash,
    manifestHash: manifest.manifestHash,
    eventStreamHash: snapshot.eventStreamHash,
    ledgerEventHashes: ledger.map((event) => event.eventHash),
  } as const;

  return {
    ...auditBase,
    auditHash: hashReplayAuditReconstruction(auditBase),
  };
}
