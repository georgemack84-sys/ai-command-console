import type { HistoricalReplaySnapshot, ReplayManifest, ReplayLedgerEvent } from "../replayTypes";
import { hashReplayManifest } from "../hashing/replayHasher";

export function buildReplayManifest(
  snapshot: HistoricalReplaySnapshot,
  ledger: readonly ReplayLedgerEvent[],
): ReplayManifest {
  const manifestBase = {
    toolId: snapshot.toolId,
    toolVersion: snapshot.toolVersion,
    registryHash: snapshot.registryHash,
    capabilityHash: snapshot.capabilityHash,
    bindingHash: snapshot.bindingHash,
    runtimeValidationHash: snapshot.runtimeValidationHash,
    runtimeTrustState: snapshot.runtimeTrustState,
    governanceHash: snapshot.governanceHash,
    lineageHash: snapshot.lineageHash,
    provenanceHash: snapshot.provenanceHash,
    evidenceHash: snapshot.evidenceHash,
    replayContainmentHash: snapshot.replayContainmentHash,
    sandboxProfileHash: snapshot.sandboxProfileHash,
    runtimeAuthorityLockHash: snapshot.runtimeAuthorityLockHash,
    registrySnapshotHash: snapshot.registrySnapshotHash,
    toolContractHash: snapshot.toolContractHash,
    policyHash: snapshot.policyHash,
    approvalChainHash: snapshot.approvalChainHash,
    eventStreamHash: snapshot.eventStreamHash,
    snapshotHash: snapshot.snapshotHash,
    ledgerHeadHash: ledger.length > 0 ? ledger[ledger.length - 1].eventHash : null,
  } as const;

  const manifestHash = hashReplayManifest(manifestBase);
  return {
    manifestId: manifestHash,
    manifestHash,
    ...manifestBase,
  };
}
