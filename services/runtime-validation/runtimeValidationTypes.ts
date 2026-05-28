import type { ToolAdapter, ToolPolicy } from "@/schemas/toolRegistrySchema";
import type { GovernanceSnapshot, ImmutableExecutionBinding, RuntimeAuthoritySnapshot } from "@/services/resolution-engine";
import type { RuntimeValidationErrorCode } from "./runtimeValidationErrors";

export type RuntimeTrustState =
  | "certified"
  | "uncertified"
  | "degraded"
  | "drifted"
  | "quarantined"
  | "revoked";

export type RuntimeValidationFailure = Readonly<{
  code: RuntimeValidationErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type ActiveRuntimeState = Readonly<{
  adapter: Pick<ToolAdapter, "adapterId" | "toolId" | "version" | "importPath" | "runtimeHandler" | "dryRunHandler" | "rollbackHandler">;
  policy: Pick<ToolPolicy, "policyId" | "toolId" | "version" | "replay" | "rollback" | "audit">;
  runtime: RuntimeAuthoritySnapshot;
  governance: GovernanceSnapshot;
  certification: Readonly<{
    certified: boolean;
    certificationHash: string;
    isolationVerified: boolean;
    auditIntegrity: boolean;
    replayIntegrity: boolean;
    provenanceValid: boolean;
  }>;
  manifest: Readonly<{
    manifestHash: string;
    schemaCompatible: boolean;
    runtimeSupported: boolean;
    rollbackSupported: boolean;
    replaySupported: boolean;
    adapterProvenance: string;
    policyProvenance: string;
  }>;
}>;

export type RuntimeBindingCompatibilityResult = Readonly<{
  valid: boolean;
  failures: readonly RuntimeValidationFailure[];
  compatibilityHash: string;
}>;

export type RuntimeCertification = Readonly<{
  valid: boolean;
  trustState: RuntimeTrustState;
  certificationHash: string;
  failures: readonly RuntimeValidationFailure[];
}>;

export type RuntimeDriftResult = Readonly<{
  driftDetected: boolean;
  trustState: RuntimeTrustState;
  failures: readonly RuntimeValidationFailure[];
  driftHash: string;
}>;

export type RuntimeReplayAttestation = Readonly<{
  valid: boolean;
  trustState: RuntimeTrustState;
  failures: readonly RuntimeValidationFailure[];
  attestationHash: string;
}>;

export type RuntimeValidationLedgerEvent = Readonly<{
  eventType:
    | "runtime.binding.validated"
    | "runtime.certification.validated"
    | "runtime.drift.detected"
    | "runtime.attestation.validated"
    | "runtime.execution.rejected"
    | "runtime.binding.invalidated";
  toolId: string;
  toolVersion: string;
  bindingHash: string;
  result: "success" | "failure";
  failureCode?: RuntimeValidationErrorCode;
  validationHash?: string;
  eventHash: string;
  occurredAt?: string;
}>;

export type RuntimeValidationInput = Readonly<{
  binding: ImmutableExecutionBinding;
  activeRuntime: ActiveRuntimeState;
}>;

export type RuntimeValidationResult = Readonly<{
  allowed: boolean;
  trustState: RuntimeTrustState;
  bindingCompatibility: RuntimeBindingCompatibilityResult;
  certification: RuntimeCertification;
  drift: RuntimeDriftResult;
  attestation: RuntimeReplayAttestation;
  ledger: readonly RuntimeValidationLedgerEvent[];
  validationHash: string;
  failures: readonly RuntimeValidationFailure[];
}>;
