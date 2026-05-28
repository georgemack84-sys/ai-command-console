import { hashGovernanceEvidenceBundle, hashGovernanceLineageNode, hashGovernanceProvenanceEvents } from "@/services/governance-attribution";
import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import { hashRuntimeValidationResult } from "@/services/runtime-validation";
import type {
  HistoricalApprovalState,
  HistoricalReplaySnapshot,
  ReplayAuditReconstruction,
  ReplayContainmentRestoration,
  ReplayLedgerEvent,
  ReplayManifest,
  ReplayVerificationResult,
} from "../replayTypes";

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .map(([key, nested]) => [key, stripUndefined(nested)]),
    );
  }
  return value;
}

export function hashReplayApprovalState(state: HistoricalApprovalState) {
  return hashStableContent("APPROVAL", stripUndefined(state));
}

export function hashRegistrySnapshot(entry: HistoricalReplaySnapshot["registryEntrySnapshot"]) {
  return hashStableContent("TOOL_REGISTRY", stripUndefined(entry));
}

export function hashToolContract(entry: HistoricalReplaySnapshot["registryEntrySnapshot"]) {
  return hashStableContent("TOOL_REGISTRY", stripUndefined({
    toolId: entry.toolId,
    version: entry.version,
    inputSchemaRef: entry.inputSchemaRef,
    outputSchemaRef: entry.outputSchemaRef,
    policyRef: entry.policyRef,
    adapterRef: entry.adapterRef,
    runtimeCapabilities: [...entry.runtimeCapabilities].sort((left, right) => left.localeCompare(right)),
    capabilityMetadata: entry.capabilityMetadata,
    governanceMetadata: entry.governanceMetadata,
    rollbackMetadata: entry.rollbackMetadata,
    deterministicReplayMetadata: entry.deterministicReplayMetadata,
  }));
}

export function hashPolicySnapshot(policy: HistoricalReplaySnapshot["policySnapshot"]) {
  return hashStableContent("TOOL_REGISTRY", stripUndefined(policy));
}

export function hashReplayLedgerEvent(event: Omit<ReplayLedgerEvent, "eventHash" | "occurredAt">) {
  return hashStableContent("REPLAY_CONTEXT", stripUndefined(event));
}

export function hashReplayLedger(events: readonly ReplayLedgerEvent[]) {
  return hashStableContent("REPLAY_CONTEXT", events.map((event) => event.eventHash));
}

export function hashHistoricalReplaySnapshot(snapshot: Omit<HistoricalReplaySnapshot, "snapshotHash">) {
  return hashStableContent("REPLAY_CONTEXT", stripUndefined({
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
  }));
}

export function hashReplayManifest(manifest: Omit<ReplayManifest, "manifestHash" | "manifestId">) {
  return hashStableContent("REPLAY_CONTEXT", stripUndefined(manifest));
}

export function hashReplayContainmentRestoration(restoration: Omit<ReplayContainmentRestoration, "failures" | "restorationHash">) {
  return hashStableContent("REPLAY_CONTEXT", stripUndefined(restoration));
}

export function hashReplayAuditReconstruction(audit: Omit<ReplayAuditReconstruction, "auditHash">) {
  return hashStableContent("EVIDENCE_BUNDLE", stripUndefined(audit));
}

export function hashReplayVerificationResult(result: Omit<ReplayVerificationResult, "verificationHash" | "failures">) {
  return hashStableContent("REPLAY_CONTEXT", stripUndefined(result));
}

export function hashGovernanceLineage(lineageNode: HistoricalReplaySnapshot["governance"]["lineageNode"]) {
  return hashGovernanceLineageNode({
    governanceHash: lineageNode.governanceHash,
    generation: lineageNode.generation,
    parentHash: lineageNode.parentHash,
    toolId: lineageNode.toolId,
    toolVersion: lineageNode.toolVersion,
  });
}

export function hashGovernanceProvenance(governance: HistoricalReplaySnapshot["governance"]) {
  return hashGovernanceProvenanceEvents(governance.provenanceEvents);
}

export function hashGovernanceEvidence(governance: HistoricalReplaySnapshot["governance"]) {
  return hashGovernanceEvidenceBundle(governance.evidenceBundle);
}

export function hashHistoricalRuntimeValidation(snapshot: HistoricalReplaySnapshot) {
  return hashRuntimeValidationResult({
    allowed: snapshot.runtimeValidation.allowed,
    trustState: snapshot.runtimeValidation.trustState,
    bindingCompatibility: snapshot.runtimeValidation.bindingCompatibility,
    certification: snapshot.runtimeValidation.certification,
    drift: snapshot.runtimeValidation.drift,
    attestation: snapshot.runtimeValidation.attestation,
    ledger: snapshot.runtimeValidation.ledger,
  });
}
