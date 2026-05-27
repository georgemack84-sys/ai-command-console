import type { ExecutionMode, RuntimeCapability } from "@/schemas/toolRegistrySchema";
import type {
  ReplayContainmentBinding,
  RuntimeAuthorityEnvelope,
  RuntimeAuthorityLock,
} from "@/services/execution-enforcement";
import type {
  GovernanceAttributionResult,
  GovernanceEvidenceBundle,
  GovernanceLineageNode,
  GovernanceProvenanceEvent,
} from "@/services/governance-attribution";

export type ResolutionFailureCode =
  | "TOOL_NOT_FOUND"
  | "TOOL_VERSION_MISMATCH"
  | "TOOL_RESOLUTION_AMBIGUOUS"
  | "TOOL_POLICY_INVALID"
  | "TOOL_CAPABILITY_AUTHORITY_INVALID"
  | "TOOL_GOVERNANCE_COMPATIBILITY_INVALID"
  | "TOOL_GOVERNANCE_LINEAGE_INVALID"
  | "TOOL_GOVERNANCE_PROVENANCE_INVALID"
  | "TOOL_GOVERNANCE_EVIDENCE_INVALID"
  | "TOOL_RUNTIME_AUTHORITY_INVALID"
  | "TOOL_REPLAY_CONTAINMENT_INVALID"
  | "TOOL_REGISTRY_HASH_INVALID"
  | "TOOL_REGISTRY_CORRUPTED"
  | "TOOL_SNAPSHOT_INCONSISTENT"
  | "TOOL_REPLAY_RESOLUTION_MISMATCH"
  | "TOOL_BINDING_MUTATION_DETECTED"
  | "RESOLUTION_REJECTED";

export type ResolutionFailure = Readonly<{
  code: ResolutionFailureCode;
  message: string;
  path?: string;
}>;

export type ExecutionResolutionRequest = Readonly<{
  requestedTool: string;
  requestedVersion: string;
  requiredCapabilities: readonly RuntimeCapability[];
  executionMode: ExecutionMode;
  trustZone: string;
}>;

export type RuntimeAuthoritySnapshot = Readonly<{
  envelope: RuntimeAuthorityEnvelope;
  authorityLock: RuntimeAuthorityLock;
  replayBinding: ReplayContainmentBinding;
  trustZoneHash: string;
}>;

export type GovernanceSnapshot = Readonly<{
  attribution: GovernanceAttributionResult;
  lineageNode: GovernanceLineageNode;
  provenanceEvents: readonly GovernanceProvenanceEvent[];
  provenanceHash: string;
  evidenceBundle: GovernanceEvidenceBundle;
}>;

export type ResolutionContext = Readonly<{
  request: ExecutionResolutionRequest;
  runtime: RuntimeAuthoritySnapshot;
  governance: GovernanceSnapshot;
}>;

export type ImmutableExecutionBinding = Readonly<{
  bindingId: string;
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  sandboxProfileHash: string;
  trustZoneHash: string;
  runtimeAuthorityLockHash: string;
  replayContainmentHash: string;
  governanceHash: string;
  lineageHash: string;
  provenanceHash: string;
  evidenceHash: string;
  resolutionHash: string;
  bindingHash: string;
}>;

export type ResolutionAuditEvent = Readonly<{
  eventType:
    | "resolution.attempted"
    | "resolution.succeeded"
    | "resolution.failed"
    | "binding.created"
    | "binding.replayed"
    | "binding.rejected"
    | "binding.mutation_detected";
  requestedTool: string;
  requestedVersion: string;
  result: "success" | "failure";
  failureCode?: ResolutionFailureCode;
  registryHash?: string;
  resolutionHash?: string;
  bindingHash?: string;
  occurredAt: string;
  eventHash: string;
}>;

export type ResolutionResult = Readonly<{
  ok: boolean;
  binding?: ImmutableExecutionBinding;
  resolutionHash?: string;
  bindingHash?: string;
  auditEvents: readonly ResolutionAuditEvent[];
  failures: readonly ResolutionFailure[];
}>;

export type ReplayBindingVerificationInput = Readonly<{
  binding: ImmutableExecutionBinding;
  runtime: RuntimeAuthoritySnapshot;
  governance: GovernanceSnapshot;
}>;
