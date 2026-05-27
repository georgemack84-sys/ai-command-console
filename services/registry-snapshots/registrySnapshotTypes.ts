import type {
  CanonicalToolRegistryEntry,
  ToolMigrationManifestDocument,
  ToolPolicy,
  ToolVersionLineageDocument,
} from "@/schemas/toolRegistrySchema";

export const REGISTRY_SNAPSHOT_ERROR_CODES = {
  REGISTRY_SNAPSHOT_MISSING: "REGISTRY_SNAPSHOT_MISSING",
  REGISTRY_SNAPSHOT_HASH_MISMATCH: "REGISTRY_SNAPSHOT_HASH_MISMATCH",
  REGISTRY_SNAPSHOT_IMMUTABILITY_VIOLATION: "REGISTRY_SNAPSHOT_IMMUTABILITY_VIOLATION",
  REGISTRY_SNAPSHOT_LINEAGE_INVALID: "REGISTRY_SNAPSHOT_LINEAGE_INVALID",
  REGISTRY_SNAPSHOT_SCHEMA_MISSING: "REGISTRY_SNAPSHOT_SCHEMA_MISSING",
  REGISTRY_SNAPSHOT_POLICY_MISSING: "REGISTRY_SNAPSHOT_POLICY_MISSING",
  REGISTRY_SNAPSHOT_GOVERNANCE_MISSING: "REGISTRY_SNAPSHOT_GOVERNANCE_MISSING",
  REGISTRY_SNAPSHOT_COMPATIBILITY_MISSING: "REGISTRY_SNAPSHOT_COMPATIBILITY_MISSING",
  REGISTRY_SNAPSHOT_ROLLBACK_MISSING: "REGISTRY_SNAPSHOT_ROLLBACK_MISSING",
  REGISTRY_SNAPSHOT_ADMISSION_REJECTED: "REGISTRY_SNAPSHOT_ADMISSION_REJECTED",
  REGISTRY_SNAPSHOT_REPLAY_UNSAFE: "REGISTRY_SNAPSHOT_REPLAY_UNSAFE",
  REGISTRY_SNAPSHOT_MUTATION_DETECTED: "REGISTRY_SNAPSHOT_MUTATION_DETECTED",
  REGISTRY_SNAPSHOT_PARENT_MISSING: "REGISTRY_SNAPSHOT_PARENT_MISSING",
  REGISTRY_SNAPSHOT_UNSUPPORTED: "REGISTRY_SNAPSHOT_UNSUPPORTED",
} as const;

export type RegistrySnapshotErrorCode =
  typeof REGISTRY_SNAPSHOT_ERROR_CODES[keyof typeof REGISTRY_SNAPSHOT_ERROR_CODES];

export type RegistrySnapshotTriggerType =
  | "tool-registration"
  | "version-publication"
  | "policy-change"
  | "governance-change"
  | "schema-change"
  | "compatibility-change"
  | "lineage-change"
  | "deprecation-change"
  | "rollback-contract-change"
  | "registry-migration";

export type RegistrySnapshotFailure = Readonly<{
  code: RegistrySnapshotErrorCode;
  message: string;
  path?: string;
  expected?: unknown;
  actual?: unknown;
}>;

export type RegistryCompatibilityRecord = Readonly<{
  canonicalId: string;
  registryHash: string;
  capabilityHash: string;
  supportsReplay: boolean;
  rollbackSupported: boolean;
  migrationTargets: readonly string[];
  migrationTypes: readonly string[];
}>;

export type RegistryRollbackRecord = Readonly<{
  canonicalId: string;
  rollbackSupported: boolean;
  rollbackMetadata: CanonicalToolRegistryEntry["rollbackMetadata"] | null;
  policyRollback: ToolPolicy["rollback"];
}>;

export type RegistryGovernanceRecord = Readonly<{
  canonicalId: string;
  governanceMetadata: CanonicalToolRegistryEntry["governanceMetadata"];
  governanceRestrictions: CanonicalToolRegistryEntry["governanceRestrictions"];
}>;

export type RegistrySchemaRecord = Readonly<{
  ref: string;
  content: Readonly<Record<string, unknown>>;
}>;

export type RegistrySnapshotContent = Readonly<{
  tools: readonly CanonicalToolRegistryEntry[];
  schemas: readonly RegistrySchemaRecord[];
  policies: Readonly<Record<string, ToolPolicy>>;
  governance: Readonly<Record<string, RegistryGovernanceRecord>>;
  compatibility: Readonly<Record<string, RegistryCompatibilityRecord>>;
  rollback: Readonly<Record<string, RegistryRollbackRecord>>;
  lineage: ToolVersionLineageDocument;
  migrations: ToolMigrationManifestDocument;
}>;

export type RegistrySnapshotManifest = Readonly<{
  snapshotId: string;
  snapshotVersion: number;
  createdAt: string;
  triggerType: RegistrySnapshotTriggerType;
  registrySnapshotHash: string;
  parentSnapshotHash?: string;
  toolsHash: string;
  schemasHash: string;
  policiesHash: string;
  governanceHash: string;
  compatibilityHash: string;
  rollbackHash: string;
  lineageHash: string;
  immutable: true;
  replayEligible: boolean;
  admissionStatus: "approved" | "rejected";
  manifestHash: string;
}>;

export type RegistrySnapshot = Readonly<{
  manifest: RegistrySnapshotManifest;
  content: RegistrySnapshotContent;
}>;

export type RegistrySnapshotBuildInput = Readonly<{
  triggerType: RegistrySnapshotTriggerType;
  createdAt: string;
  snapshotVersion: number;
  parentSnapshot?: RegistrySnapshot;
  allowGenesis?: boolean;
}>;

export type RegistrySnapshotValidationResult = Readonly<{
  valid: boolean;
  failures: readonly RegistrySnapshotFailure[];
}>;

export type RegistrySnapshotAdmissionResult = Readonly<{
  approved: boolean;
  replayEligible: boolean;
  failures: readonly RegistrySnapshotFailure[];
}>;

export type RegistrySnapshotReplayResolutionInput = Readonly<{
  snapshotId?: string;
  registrySnapshotHash?: string;
}>;
