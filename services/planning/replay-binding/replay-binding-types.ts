import type { AdmissionBuildInput, AdmissionDecision, AdmissionReadiness } from "../admission";
import type { ReplayAuditResult } from "../replay-audit";

export type ReplayBindingFailureCode =
  | "IMMUTABLE_LINEAGE_VIOLATION"
  | "REPLAY_BINDING_DRIFT"
  | "REPLAY_CERTIFICATION_REVOKED"
  | "TRUST_ZONE_REPLAY_MISMATCH"
  | "RUNTIME_BINDING_DIVERGENCE"
  | "FORENSIC_REPLAY_INCOMPLETE"
  | "REPLAY_EVIDENCE_CORRUPTED"
  | "DERIVED_EVIDENCE_MISMATCH"
  | "REPLAY_RECONSTRUCTION_UNSTABLE";

export type ReplayBindingFailure = Readonly<{
  code: ReplayBindingFailureCode;
  message: string;
  path?: string;
}>;

export type ReplayBindingContext = Readonly<{
  planHash: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  derivedSimulationHash?: string;
  governanceHash: string;
  dependencyHash: string;
  runtimeFingerprintHash: string;
  trustZoneId: string;
  admissionDecision: AdmissionDecision;
  requestedAt: string;
}>;

export type ImmutableReplayBinding = Readonly<{
  bindingId: string;
  executionTruthHash: string;
  executionCompatibilityHash: string;
  replaySnapshotHash: string;
  derivedSimulationHash?: string;
  governanceHash: string;
  dependencyHash: string;
  runtimeFingerprintHash: string;
  trustZoneId: string;
  createdAt: string;
}>;

export type ReplayCertification = Readonly<{
  certificationId: string;
  replayDeterministic: boolean;
  replayComplete: boolean;
  replayReconstructable: boolean;
  runtimeBindingValid: boolean;
  trustZoneValidated: boolean;
  certificationStatus: "CERTIFIED" | "REVOKED" | "QUARANTINED" | "FAILED";
  createdAt: string;
}>;

export type ReplayRevocation = Readonly<{
  replayId: string;
  revokedBecause:
    | "ADMISSION_REVOKED"
    | "LINEAGE_DRIFT"
    | "TRUST_ZONE_VIOLATION"
    | "RUNTIME_DIVERGENCE"
    | "REPLAY_CORRUPTION";
  escalationRequired: boolean;
}>;

export type RuntimeDriftObservation = Readonly<{
  valid: boolean;
  failures: readonly ReplayBindingFailure[];
}>;

export type TrustZoneReplayValidation = Readonly<{
  valid: boolean;
  failures: readonly ReplayBindingFailure[];
}>;

export type ReplayBindingReadiness = Readonly<{
  context: ReplayBindingContext;
  contextHash: string;
  binding: ImmutableReplayBinding;
  certification: ReplayCertification;
  revocation?: ReplayRevocation;
  replayBindingHash: string;
  failures: readonly ReplayBindingFailure[];
}>;

export type ReplayBindingBuildInput = Readonly<{
  admissionInput: AdmissionBuildInput;
  admissionReadiness: AdmissionReadiness;
  runtimeFingerprintHash: string;
  trustZoneId?: string;
  expectedRuntimeFingerprintHash?: string;
  expectedDerivedSimulationHash?: string;
  expectedReplayBindingHash?: string;
}>;

export type ReplayBindingEvidence = Readonly<{
  replayAuditResult: ReplayAuditResult;
  evidenceReferenceHash?: string;
  replayProofHash?: string;
  auditArtifactHash?: string;
}>;
