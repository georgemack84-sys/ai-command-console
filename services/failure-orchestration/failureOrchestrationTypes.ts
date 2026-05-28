import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { RegistrySnapshot } from "@/services/registry-snapshots";
import type { RegistryTrustAdmissionResult } from "@/services/registry-trust";
import type { ZoneAdmissionResult } from "@/services/isolation-boundary-engine";
import type { RuntimeValidationResult } from "@/services/runtime-validation";

export type RuntimeSafetyMode =
  | "NORMAL"
  | "RESTRICTED"
  | "OBSERVATION_ONLY"
  | "RECOVERY_ONLY"
  | "FULL_CONTAINMENT";

export type FailureDomain =
  | "registry"
  | "execution"
  | "governance"
  | "replay"
  | "simulation"
  | "audit"
  | "telemetry"
  | "recovery";

export type RegistryFailureType =
  | "SCHEMA_MISSING"
  | "POLICY_MISSING"
  | "HASH_INVALID"
  | "REPLAY_MISMATCH"
  | "GOVERNANCE_MISMATCH"
  | "TRUST_CHAIN_BROKEN"
  | "SIGNATURE_INVALID"
  | "STATE_UNCERTAIN"
  | "CASCADE_RISK_DETECTED"
  | "RECOVERY_TRUST_INVALID"
  | "UNKNOWN_FAILURE";

export const FAILURE_ORCHESTRATION_CODES = {
  FAILURE_STATE_UNSAFE_UNKNOWN: "FAILURE_STATE_UNSAFE_UNKNOWN",
  FAILURE_REPLAY_MISMATCH: "FAILURE_REPLAY_MISMATCH",
  FAILURE_GOVERNANCE_MISMATCH: "FAILURE_GOVERNANCE_MISMATCH",
  FAILURE_SNAPSHOT_UNCERTAIN: "FAILURE_SNAPSHOT_UNCERTAIN",
  FAILURE_FREEZE_ACTIVE: "FAILURE_FREEZE_ACTIVE",
  FAILURE_RECOVERY_STAGE_INVALID: "FAILURE_RECOVERY_STAGE_INVALID",
  FAILURE_RECOVERY_TRUST_INVALID: "FAILURE_RECOVERY_TRUST_INVALID",
  FAILURE_SURVIVABILITY_BREACH: "FAILURE_SURVIVABILITY_BREACH",
  FAILURE_CASCADE_SUPPRESSED: "FAILURE_CASCADE_SUPPRESSED",
  FAILURE_BYPASS_ATTEMPT: "FAILURE_BYPASS_ATTEMPT",
  FAILURE_FORGED_RECOVERY_MANIFEST: "FAILURE_FORGED_RECOVERY_MANIFEST",
} as const;

export type FailureOrchestrationCode =
  typeof FAILURE_ORCHESTRATION_CODES[keyof typeof FAILURE_ORCHESTRATION_CODES];

export type FailureSignal = Readonly<{
  domain: FailureDomain;
  type: RegistryFailureType;
  code: FailureOrchestrationCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type SurvivabilityState = Readonly<{
  telemetryOperational: boolean;
  auditOperational: boolean;
  recoveryOperational: boolean;
  operatorVisibilityOperational: boolean;
  immutableEvidenceOperational: boolean;
  survivabilityHash: string;
}>;

export type ContainmentDirective = Readonly<{
  domain: FailureDomain;
  action:
    | "deny_execution"
    | "deny_replay"
    | "deny_mutation"
    | "freeze_runtime"
    | "freeze_governance"
    | "suppress_cascade"
    | "preserve_survivability"
    | "allow_recovery_readonly";
  reason: string;
}>;

export type FailureGraphNode = Readonly<{
  domain: FailureDomain;
  type: RegistryFailureType;
  severity: "low" | "medium" | "high" | "critical";
  hash: string;
}>;

export type ImmutableFailureSnapshot = Readonly<{
  registryHash: string;
  trustState: "HEALTHY" | "DEGRADED" | "QUARANTINED" | "REVOKED";
  runtimeMode: RuntimeSafetyMode;
  failureGraph: readonly FailureGraphNode[];
  activeContainment: readonly ContainmentDirective[];
  timestamp: string;
  snapshotHash: string;
}>;

export type FailurePropagationResult = Readonly<{
  propagatedSignals: readonly FailureSignal[];
  containment: readonly ContainmentDirective[];
  propagationHash: string;
}>;

export type CascadeSuppressionResult = Readonly<{
  suppressed: boolean;
  activeFreeze: boolean;
  containment: readonly ContainmentDirective[];
  suppressionHash: string;
}>;

export type RecoveryReactivationDecision = Readonly<{
  allowed: boolean;
  fromMode: RuntimeSafetyMode;
  toMode: RuntimeSafetyMode;
  governanceReapprovalRequired: boolean;
  reasonCode?: FailureOrchestrationCode;
  decisionHash: string;
}>;

export type TrustRehydrationResult = Readonly<{
  allowed: boolean;
  targetMode: RuntimeSafetyMode;
  trustState: ImmutableFailureSnapshot["trustState"];
  reasonCode?: FailureOrchestrationCode;
  rehydrationHash: string;
}>;

export type FailureOrchestrationInput = Readonly<{
  snapshot: RegistrySnapshot;
  trustedSnapshotAdmission: RegistryTrustAdmissionResult;
  zoneAdmission: ZoneAdmissionResult;
  runtimeValidation: RuntimeValidationResult;
  timestamp: string;
  additionalSignals?: readonly FailureSignal[];
  replayRequested?: boolean;
  mutationRequested?: boolean;
  escalationRequested?: boolean;
  freezeBypassAttempted?: boolean;
  recoveryEscalationAttempted?: boolean;
  containmentEscapeAttempted?: boolean;
  forgedRecoveryManifest?: boolean;
  replayRecoveryTampered?: boolean;
  requestedRecoveryMode?: RuntimeSafetyMode;
  currentMode?: RuntimeSafetyMode;
  governanceReapproved?: boolean;
  recoveryManifestHash?: string;
  expectedRecoveryManifestHash?: string;
}>;

export type FailureOrchestrationResult = Readonly<{
  allowed: boolean;
  runtimeMode: RuntimeSafetyMode;
  trustState: ImmutableFailureSnapshot["trustState"];
  signals: readonly FailureSignal[];
  propagation: FailurePropagationResult;
  cascadeSuppression: CascadeSuppressionResult;
  survivability: SurvivabilityState;
  snapshot: ImmutableFailureSnapshot;
  recovery: RecoveryReactivationDecision;
  rehydration: TrustRehydrationResult;
  decisionHash: string;
}>;

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

export function hashFailurePayload(domain: string, value: unknown): string {
  return hashStableContent(domain as Parameters<typeof hashStableContent>[0], stripUndefined(value));
}
