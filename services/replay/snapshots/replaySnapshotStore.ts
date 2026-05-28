import type { ReplayFailure, ReplayOrchestrationInput, HistoricalReplaySnapshot } from "../replayTypes";
import {
  hashGovernanceEvidence,
  hashGovernanceLineage,
  hashGovernanceProvenance,
  hashHistoricalReplaySnapshot,
  hashHistoricalRuntimeValidation,
  hashPolicySnapshot,
  hashRegistrySnapshot,
  hashReplayApprovalState,
  hashToolContract,
} from "../hashing/replayHasher";

function buildFailure(code: ReplayFailure["code"], message: string, path?: string, expected?: unknown, actual?: unknown): ReplayFailure {
  return { code, message, path, expected, actual };
}

export function buildHistoricalReplaySnapshot(
  input: ReplayOrchestrationInput & { eventStreamHash: string },
): HistoricalReplaySnapshot {
  const governanceHash = input.governance.attribution.governanceHash;
  if (!governanceHash) {
    throw new Error("historical governance hash missing");
  }

  const snapshotBase = {
    toolId: input.binding.toolId,
    toolVersion: input.binding.toolVersion,
    registryHash: input.binding.registryHash,
    capabilityHash: input.binding.capabilityHash,
    bindingHash: input.binding.bindingHash,
    runtimeValidationHash: input.runtimeValidation.validationHash,
    runtimeTrustState: input.runtimeValidation.trustState,
    governanceHash,
    lineageHash: input.governance.lineageNode.lineageHash,
    provenanceHash: input.governance.provenanceHash,
    evidenceHash: input.governance.evidenceBundle.evidenceHash,
    replayContainmentHash: input.binding.replayContainmentHash,
    sandboxProfileHash: input.binding.sandboxProfileHash,
    runtimeAuthorityLockHash: input.binding.runtimeAuthorityLockHash,
    registrySnapshotHash: hashRegistrySnapshot(input.registryEntrySnapshot),
    toolContractHash: hashToolContract(input.registryEntrySnapshot),
    policyHash: hashPolicySnapshot(input.policySnapshot),
    approvalChainHash: hashReplayApprovalState(input.approvalState),
    eventStreamHash: input.eventStreamHash,
    binding: input.binding,
    runtimeValidation: input.runtimeValidation,
    runtime: input.runtime,
    governance: input.governance,
    registryEntrySnapshot: input.registryEntrySnapshot,
    policySnapshot: input.policySnapshot,
    approvalState: input.approvalState,
  } as const;

  return {
    ...snapshotBase,
    snapshotHash: hashHistoricalReplaySnapshot(snapshotBase),
  };
}

export function validateHistoricalReplaySnapshot(snapshot: HistoricalReplaySnapshot): readonly ReplayFailure[] {
  const failures: ReplayFailure[] = [];

  if (!snapshot.binding) {
    failures.push(buildFailure("REPLAY_BINDING_MISSING", "historical replay snapshot is missing immutable binding", "binding"));
  } else if (snapshot.binding.bindingHash !== snapshot.bindingHash) {
    failures.push(buildFailure(
      "REPLAY_BINDING_INCOMPLETE",
      "historical binding hash does not match replay snapshot binding hash",
      "binding.bindingHash",
      snapshot.bindingHash,
      snapshot.binding.bindingHash,
    ));
  }

  if (!snapshot.runtimeValidation || !snapshot.runtime) {
    failures.push(buildFailure("REPLAY_RUNTIME_STATE_MISSING", "historical runtime validation state is missing", "runtimeValidation"));
  } else if (hashHistoricalRuntimeValidation(snapshot) !== snapshot.runtimeValidationHash) {
    failures.push(buildFailure(
      "REPLAY_HASH_MISMATCH",
      "historical runtime validation hash does not match stored replay snapshot hash",
      "runtimeValidationHash",
      snapshot.runtimeValidationHash,
      hashHistoricalRuntimeValidation(snapshot),
    ));
  }

  if (!snapshot.governance) {
    failures.push(buildFailure("REPLAY_GOVERNANCE_STATE_MISSING", "historical governance state is missing", "governance"));
  } else {
    const lineageHash = hashGovernanceLineage(snapshot.governance.lineageNode);
    if (lineageHash !== snapshot.lineageHash) {
      failures.push(buildFailure("REPLAY_PROVENANCE_INVALID", "historical governance lineage hash mismatch", "lineageHash", snapshot.lineageHash, lineageHash));
    }
    const provenanceHash = hashGovernanceProvenance(snapshot.governance);
    if (provenanceHash !== snapshot.provenanceHash) {
      failures.push(buildFailure("REPLAY_PROVENANCE_INVALID", "historical governance provenance hash mismatch", "provenanceHash", snapshot.provenanceHash, provenanceHash));
    }
    const evidenceHash = hashGovernanceEvidence(snapshot.governance);
    if (evidenceHash !== snapshot.evidenceHash) {
      failures.push(buildFailure("REPLAY_HASH_MISMATCH", "historical governance evidence hash mismatch", "evidenceHash", snapshot.evidenceHash, evidenceHash));
    }
  }

  const registrySnapshotHash = hashRegistrySnapshot(snapshot.registryEntrySnapshot);
  if (registrySnapshotHash !== snapshot.registrySnapshotHash) {
    failures.push(buildFailure("REPLAY_HISTORY_CORRUPTED", "historical registry snapshot hash mismatch", "registrySnapshotHash", snapshot.registrySnapshotHash, registrySnapshotHash));
  }

  const toolContractHash = hashToolContract(snapshot.registryEntrySnapshot);
  if (toolContractHash !== snapshot.toolContractHash) {
    failures.push(buildFailure("REPLAY_HISTORY_CORRUPTED", "historical tool contract hash mismatch", "toolContractHash", snapshot.toolContractHash, toolContractHash));
  }

  const policyHash = hashPolicySnapshot(snapshot.policySnapshot);
  if (policyHash !== snapshot.policyHash) {
    failures.push(buildFailure("REPLAY_HISTORY_CORRUPTED", "historical policy hash mismatch", "policyHash", snapshot.policyHash, policyHash));
  }

  const approvalChainHash = hashReplayApprovalState(snapshot.approvalState);
  if (approvalChainHash !== snapshot.approvalChainHash) {
    failures.push(buildFailure("REPLAY_HISTORY_CORRUPTED", "historical approval chain hash mismatch", "approvalChainHash", snapshot.approvalChainHash, approvalChainHash));
  }

  const { snapshotHash: _snapshotHash, ...snapshotForHash } = snapshot;
  const snapshotHash = hashHistoricalReplaySnapshot(snapshotForHash);
  if (snapshotHash !== snapshot.snapshotHash) {
    failures.push(buildFailure("REPLAY_HASH_MISMATCH", "historical replay snapshot hash mismatch", "snapshotHash", snapshot.snapshotHash, snapshotHash));
  }

  return failures;
}
