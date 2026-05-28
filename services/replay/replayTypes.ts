import type { CanonicalToolRegistryEntry, ToolPolicy } from "@/schemas/toolRegistrySchema";
import type { GovernanceSnapshot, ImmutableExecutionBinding, RuntimeAuthoritySnapshot } from "@/services/resolution-engine";
import type { RuntimeTrustState, RuntimeValidationResult } from "@/services/runtime-validation";

export type ReplayFailureCode =
  | "REPLAY_HISTORY_CORRUPTED"
  | "REPLAY_BINDING_INCOMPLETE"
  | "REPLAY_EVENT_CHAIN_BROKEN"
  | "REPLAY_PROVENANCE_INVALID"
  | "REPLAY_HISTORICAL_STATE_MISSING"
  | "REPLAY_CONTAINMENT_RESTORATION_FAILED"
  | "REPLAY_MANIFEST_INVALID"
  | "REPLAY_HASH_MISMATCH"
  | "REPLAY_LEDGER_CORRUPTED"
  | "REPLAY_RUNTIME_STATE_MISSING"
  | "REPLAY_GOVERNANCE_STATE_MISSING"
  | "REPLAY_BINDING_MISSING"
  | "REPLAY_VERIFICATION_FAILED"
  | "REPLAY_UNSUPPORTED";

export type ReplayFailure = Readonly<{
  code: ReplayFailureCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type HistoricalApprovalState = Readonly<{
  approvalChainHash: string;
  approvalLevel: string;
  approvers: readonly string[];
}>;

export type ReplayLedgerEventType =
  | "replay.snapshot.created"
  | "replay.manifest.generated"
  | "replay.binding.restored"
  | "replay.containment.restored"
  | "replay.audit.reconstructed"
  | "replay.execution.started"
  | "replay.execution.completed"
  | "replay.execution.failed"
  | "replay.execution.blocked";

export type ReplayLedgerEvent = Readonly<{
  eventType: ReplayLedgerEventType;
  bindingHash: string;
  runtimeValidationHash: string;
  governanceHash: string;
  previousEventHash: string | null;
  eventHash: string;
  occurredAt?: string;
}>;

export type HistoricalReplaySnapshot = Readonly<{
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  bindingHash: string;
  runtimeValidationHash: string;
  runtimeTrustState: RuntimeTrustState;
  governanceHash: string;
  lineageHash: string;
  provenanceHash: string;
  evidenceHash: string;
  replayContainmentHash: string;
  sandboxProfileHash: string;
  runtimeAuthorityLockHash: string;
  registrySnapshotHash: string;
  toolContractHash: string;
  policyHash: string;
  approvalChainHash: string;
  eventStreamHash: string;
  snapshotHash: string;
  binding: ImmutableExecutionBinding;
  runtimeValidation: RuntimeValidationResult;
  runtime: RuntimeAuthoritySnapshot;
  governance: GovernanceSnapshot;
  registryEntrySnapshot: CanonicalToolRegistryEntry;
  policySnapshot: ToolPolicy;
  approvalState: HistoricalApprovalState;
}>;

export type ReplayManifest = Readonly<{
  manifestId: string;
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  bindingHash: string;
  runtimeValidationHash: string;
  runtimeTrustState: RuntimeTrustState;
  governanceHash: string;
  lineageHash: string;
  provenanceHash: string;
  evidenceHash: string;
  replayContainmentHash: string;
  sandboxProfileHash: string;
  runtimeAuthorityLockHash: string;
  registrySnapshotHash: string;
  toolContractHash: string;
  policyHash: string;
  approvalChainHash: string;
  eventStreamHash: string;
  snapshotHash: string;
  ledgerHeadHash: string | null;
  manifestHash: string;
}>;

export type ReplayContainmentRestoration = Readonly<{
  restored: boolean;
  sandboxProfileHash?: string;
  replayContainmentHash?: string;
  runtimeAuthorityLockHash?: string;
  runtimeTrustState?: RuntimeTrustState;
  restorationHash: string;
  failures: readonly ReplayFailure[];
}>;

export type ReplayAuditReconstruction = Readonly<{
  toolId: string;
  toolVersion: string;
  bindingHash: string;
  snapshotHash: string;
  manifestHash: string;
  eventStreamHash: string;
  ledgerEventHashes: readonly string[];
  auditHash: string;
}>;

export type ReplayVerificationResult = Readonly<{
  valid: boolean;
  manifestHash?: string;
  snapshotHash?: string;
  eventStreamHash?: string;
  verificationHash: string;
  failures: readonly ReplayFailure[];
}>;

export type ReplayOrchestrationInput = Readonly<{
  binding: ImmutableExecutionBinding;
  runtimeValidation: RuntimeValidationResult;
  runtime: RuntimeAuthoritySnapshot;
  governance: GovernanceSnapshot;
  registryEntrySnapshot: CanonicalToolRegistryEntry;
  policySnapshot: ToolPolicy;
  approvalState: HistoricalApprovalState;
}>;

export type ReplayOrchestrationResult = Readonly<{
  manifest?: ReplayManifest;
  snapshot?: HistoricalReplaySnapshot;
  ledger: readonly ReplayLedgerEvent[];
  containment?: ReplayContainmentRestoration;
  audit?: ReplayAuditReconstruction;
  verification: ReplayVerificationResult;
  failures: readonly ReplayFailure[];
}>;
