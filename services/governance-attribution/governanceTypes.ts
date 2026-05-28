import type { GovernanceMetadata as RegistryGovernanceMetadata, CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type {
  ExecutionEnforcementDecision,
  RuntimeAuthorityEnvelope,
  RuntimeAuthorityLock,
} from "@/services/execution-enforcement";

export type GovernanceFailureCode =
  | "TOOL_GOVERNANCE_METADATA_MISSING"
  | "TOOL_GOVERNANCE_ATTRIBUTION_INVALID"
  | "TOOL_GOVERNANCE_HASH_MISMATCH"
  | "TOOL_GOVERNANCE_LINEAGE_INVALID"
  | "TOOL_GOVERNANCE_PROVENANCE_INVALID"
  | "TOOL_GOVERNANCE_DRIFT_DETECTED"
  | "GOVERNANCE_CANNOT_EXPAND_RUNTIME_AUTHORITY";

export type GovernanceMetadata = RegistryGovernanceMetadata;

export type GovernanceFailure = Readonly<{
  code: GovernanceFailureCode;
  message: string;
  path?: string;
}>;

export type GovernanceHashInput = Readonly<{
  metadata: GovernanceMetadata;
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
  sandboxProfileHash: string;
  trustZoneHash: string;
  replayContainmentHash: string;
  runtimeAuthorityLockHash: string;
  boundaryHash?: string;
}>;

export type GovernanceLineageNode = Readonly<{
  governanceHash: string;
  lineageHash: string;
  generation: number;
  parentHash: string | null;
  toolId: string;
  toolVersion: string;
}>;

export type GovernanceProvenanceEventType =
  | "governance.created"
  | "governance.attributed"
  | "governance.validated"
  | "governance.approved"
  | "governance.escalated"
  | "governance.replayed"
  | "governance.disputed"
  | "governance.migrated"
  | "governance.invalidated";

export type GovernanceProvenanceEvent = Readonly<{
  eventType: GovernanceProvenanceEventType;
  governanceHash: string;
  previousEventHash: string | null;
  payload: Readonly<Record<string, unknown>>;
  eventHash: string;
}>;

export type GovernanceCausalityEdge = Readonly<{
  from: string;
  to: string;
  rationale: string;
  edgeHash: string;
}>;

export type GovernanceEvidenceBundle = Readonly<{
  executionId: string;
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
  boundaryHash?: string;
}>;

export type GovernanceDriftResult = Readonly<{
  driftDetected: boolean;
  failures: readonly GovernanceFailure[];
}>;

export type GovernanceReplayAttributionResult = Readonly<{
  valid: boolean;
  governanceHash?: string;
  failures: readonly GovernanceFailure[];
}>;

export type GovernanceAttributionInput = Readonly<{
  executionId: string;
  entry: CanonicalToolRegistryEntry;
  authorityEnvelope: RuntimeAuthorityEnvelope;
  authorityLock: RuntimeAuthorityLock;
  replayContainmentHash: string;
  boundaryHash?: string;
  parentLineage?: GovernanceLineageNode | null;
  enforcementDecision?: ExecutionEnforcementDecision;
}>;

export type GovernanceAttributionResult = Readonly<{
  valid: boolean;
  governanceMetadata?: GovernanceMetadata;
  governanceHash?: string;
  trustZoneHash?: string;
  lineageNode?: GovernanceLineageNode;
  causalityEdges?: readonly GovernanceCausalityEdge[];
  failures: readonly GovernanceFailure[];
}>;
