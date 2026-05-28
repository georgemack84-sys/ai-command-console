import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type {
  ActiveRuntimeState,
  RuntimeBindingCompatibilityResult,
  RuntimeCertification,
  RuntimeDriftResult,
  RuntimeReplayAttestation,
  RuntimeValidationLedgerEvent,
  RuntimeValidationResult,
} from "./runtimeValidationTypes";

function stripUndefined(value: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(value).filter(([, nested]) => nested !== undefined));
}

export function hashRuntimeCompatibility(input: {
  bindingHash: string;
  registryHash: string;
  capabilityHash: string;
  sandboxProfileHash: string;
  runtimeAuthorityLockHash: string;
  replayContainmentHash: string;
  governanceHash: string;
  lineageHash: string;
  provenanceHash: string;
  evidenceHash: string;
  adapterId: string;
  policyId: string;
}): string {
  return hashStableContent("EVIDENCE_BUNDLE", input);
}

export function hashRuntimeCertification(certification: Omit<RuntimeCertification, "failures">): string {
  return hashStableContent("EVIDENCE_BUNDLE", certification);
}

export function hashRuntimeDrift(input: Omit<RuntimeDriftResult, "failures">): string {
  return hashStableContent("EVIDENCE_BUNDLE", input);
}

export function hashRuntimeReplayAttestation(input: Omit<RuntimeReplayAttestation, "failures">): string {
  return hashStableContent("REPLAY_CONTEXT", input);
}

export function hashRuntimeValidationLedgerEvent(event: Omit<RuntimeValidationLedgerEvent, "eventHash" | "occurredAt">): string {
  return hashStableContent("EVIDENCE_BUNDLE", stripUndefined(event));
}

export function hashRuntimeValidationResult(input: Omit<RuntimeValidationResult, "ledger" | "validationHash" | "failures"> & {
  ledger: readonly RuntimeValidationLedgerEvent[];
}): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    allowed: input.allowed,
    trustState: input.trustState,
    bindingCompatibility: {
      valid: input.bindingCompatibility.valid,
      compatibilityHash: input.bindingCompatibility.compatibilityHash,
    },
    certification: {
      valid: input.certification.valid,
      trustState: input.certification.trustState,
      certificationHash: input.certification.certificationHash,
    },
    drift: {
      driftDetected: input.drift.driftDetected,
      trustState: input.drift.trustState,
      driftHash: input.drift.driftHash,
    },
    attestation: {
      valid: input.attestation.valid,
      trustState: input.attestation.trustState,
      attestationHash: input.attestation.attestationHash,
    },
    ledgerHashes: input.ledger.map((event) => event.eventHash),
  });
}

export function hashActiveRuntimeState(input: ActiveRuntimeState): string {
  return hashStableContent("EVIDENCE_BUNDLE", {
    adapter: input.adapter,
    policy: input.policy,
    runtime: {
      envelope: input.runtime.envelope,
      authorityLock: input.runtime.authorityLock,
      replayBinding: input.runtime.replayBinding,
      trustZoneHash: input.runtime.trustZoneHash,
    },
    governance: {
      governanceHash: input.governance.attribution.governanceHash,
      lineageHash: input.governance.lineageNode.lineageHash,
      provenanceHash: input.governance.provenanceHash,
      evidenceHash: input.governance.evidenceBundle.evidenceHash,
    },
    certification: input.certification,
    manifest: input.manifest,
  });
}
