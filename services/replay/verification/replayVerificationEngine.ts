import type { HistoricalReplaySnapshot, ReplayFailure, ReplayLedgerEvent, ReplayManifest, ReplayVerificationResult } from "../replayTypes";
import { hashReplayManifest, hashReplayVerificationResult } from "../hashing/replayHasher";
import { validateHistoricalReplaySnapshot } from "../snapshots/replaySnapshotStore";
import { validateReplayLedgerIntegrity } from "../ledger/replayLedger";
import { verifyReplayProvenance } from "../provenance/replayProvenanceVerifier";
import { restoreReplayContainment } from "../containment/replayContainmentRestorer";

function buildFailure(code: ReplayFailure["code"], message: string, path?: string, expected?: unknown, actual?: unknown): ReplayFailure {
  return { code, message, path, expected, actual };
}

export function verifyReplayHistory(
  manifest: ReplayManifest,
  snapshot: HistoricalReplaySnapshot,
  ledger: readonly ReplayLedgerEvent[],
): ReplayVerificationResult {
  const failures: ReplayFailure[] = [];

  const expectedManifestHash = hashReplayManifest({
    toolId: manifest.toolId,
    toolVersion: manifest.toolVersion,
    registryHash: manifest.registryHash,
    capabilityHash: manifest.capabilityHash,
    bindingHash: manifest.bindingHash,
    runtimeValidationHash: manifest.runtimeValidationHash,
    runtimeTrustState: manifest.runtimeTrustState,
    governanceHash: manifest.governanceHash,
    lineageHash: manifest.lineageHash,
    provenanceHash: manifest.provenanceHash,
    evidenceHash: manifest.evidenceHash,
    replayContainmentHash: manifest.replayContainmentHash,
    sandboxProfileHash: manifest.sandboxProfileHash,
    runtimeAuthorityLockHash: manifest.runtimeAuthorityLockHash,
    registrySnapshotHash: manifest.registrySnapshotHash,
    toolContractHash: manifest.toolContractHash,
    policyHash: manifest.policyHash,
    approvalChainHash: manifest.approvalChainHash,
    eventStreamHash: manifest.eventStreamHash,
    snapshotHash: manifest.snapshotHash,
    ledgerHeadHash: manifest.ledgerHeadHash,
  });
  if (expectedManifestHash !== manifest.manifestHash || manifest.manifestId !== manifest.manifestHash) {
    failures.push(buildFailure("REPLAY_MANIFEST_INVALID", "historical replay manifest is invalid", "manifestHash", expectedManifestHash, manifest.manifestHash));
  }

  if (!snapshot.binding) {
    failures.push(buildFailure("REPLAY_BINDING_MISSING", "historical immutable execution binding is missing", "binding"));
  }
  if (!snapshot.runtimeValidation || !snapshot.runtime) {
    failures.push(buildFailure("REPLAY_RUNTIME_STATE_MISSING", "historical runtime state is missing", "runtimeValidation"));
  }
  if (!snapshot.governance) {
    failures.push(buildFailure("REPLAY_GOVERNANCE_STATE_MISSING", "historical governance state is missing", "governance"));
  }

  if (!snapshot.registryEntrySnapshot || !snapshot.policySnapshot || !snapshot.approvalState) {
    failures.push(buildFailure("REPLAY_HISTORICAL_STATE_MISSING", "historical replay snapshot is incomplete", "historicalState"));
  }

  if (!snapshot.registryEntrySnapshot.supportsReplay || !snapshot.policySnapshot.replay.supported) {
    failures.push(buildFailure("REPLAY_UNSUPPORTED", "historical replay snapshot does not support deterministic replay", "supportsReplay"));
  }

  if (snapshot.binding && snapshot.runtimeValidation && snapshot.runtime && snapshot.governance) {
    failures.push(...validateHistoricalReplaySnapshot(snapshot));
    failures.push(...validateReplayLedgerIntegrity(ledger, snapshot));
    failures.push(...verifyReplayProvenance(snapshot));

    const containment = restoreReplayContainment(snapshot);
    failures.push(...containment.failures);
  }

  if (manifest.bindingHash !== snapshot.bindingHash || manifest.snapshotHash !== snapshot.snapshotHash || manifest.eventStreamHash !== snapshot.eventStreamHash) {
    failures.push(buildFailure("REPLAY_HASH_MISMATCH", "historical replay manifest does not match replay snapshot", "manifest"));
  }

  if (failures.length > 0) {
    failures.push(buildFailure("REPLAY_VERIFICATION_FAILED", "historical replay verification failed"));
  }

  const verificationBase = {
    valid: failures.length === 0,
    manifestHash: manifest.manifestHash,
    snapshotHash: snapshot.snapshotHash,
    eventStreamHash: snapshot.eventStreamHash,
  } as const;

  return {
    ...verificationBase,
    verificationHash: hashReplayVerificationResult(verificationBase),
    failures,
  };
}
