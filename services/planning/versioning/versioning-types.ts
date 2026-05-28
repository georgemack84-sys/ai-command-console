import type { ExecutionCompatibilityContract } from "../execution-compatibility";
import type { ReplayAuditResult } from "../replay-audit";

export type SchemaVersion = string;

export type CompatibilityLevel =
  | "IDENTICAL"
  | "FORWARD_COMPATIBLE"
  | "REQUIRES_MIGRATION"
  | "INCOMPATIBLE";

export type HashDomain =
  | "PLAN"
  | "NODE"
  | "EDGE"
  | "APPROVAL"
  | "GOVERNANCE"
  | "EXECUTION_SCOPE"
  | "REPLAY_CONTEXT"
  | "EVIDENCE_BUNDLE"
  | "MIGRATION_LINEAGE"
  | "TOOL_REGISTRY"
  | "REPLAY_BINDING"
  | "TOOL_CAPABILITY"
  | "TOOL_CAPABILITY_AUDIT";

export type ApprovalImpactState =
  | "PRESERVED"
  | "REQUIRES_REVIEW"
  | "INVALIDATED"
  | "EXPIRED";

export type VersioningFailureCode =
  | "VERSION_UNSUPPORTED"
  | "SCHEMA_REGISTRY_MISSING"
  | "MIGRATION_CHAIN_INVALID"
  | "MIGRATION_STEP_UNSUPPORTED"
  | "MIGRATION_OUTPUT_INVALID"
  | "HASH_LINEAGE_MISMATCH"
  | "REPLAY_COMPATIBILITY_FAILED"
  | "GOVERNANCE_MIGRATION_BLOCKED"
  | "APPROVAL_INVALIDATED"
  | "HASH_CANONICALIZATION_FAILED"
  | "HASH_SCOPE_INVALID";

export type SchemaRegistryEntry = Readonly<{
  artifactType: "replay-audit-result";
  version: SchemaVersion;
  compatibilityLevel: CompatibilityLevel;
  schemaHash: string;
  deprecated: boolean;
  migrationTargets: readonly SchemaVersion[];
}>;

export interface DeterministicMigrationResult {
  ok: boolean;
  output?: VersionedReplayArtifact;
  errorCode?: VersioningFailureCode;
  message?: string;
}

export interface MigrationStep {
  fromVersion: string;
  toVersion: string;
  migrate(input: VersionedReplayArtifact): DeterministicMigrationResult;
}

export interface ReplayLineageInvariant {
  originalExecutionTruthHash: string;
  originalExecutionCompatibilityHash: string;
  replaySnapshotHash: string;
  migrationLineageHashes: string[];
}

export interface ImmutableReplayIdentityRoot {
  executionTruthHash: string;
  executionCompatibilityHash: string;
  initialReplaySnapshotHash: string;
  canonicalOriginVersion: string;
}

export interface MigrationProof {
  sourceHash: string;
  targetHash: string;
  migrationChain: string[];
  replayCompatibilityResult: string;
  governanceImpact: string;
  proofHash: string;
}

export type MigrationLineageEntry = Readonly<{
  fromVersion: string;
  toVersion: string;
  lineageHash: string;
}>;

export type VersioningAuditEvent = Readonly<{
  eventVersion: string;
  eventType: string;
  planId: string;
  payloadHash: string;
  eventHash: string;
  payload: Readonly<Record<string, unknown>>;
}>;

export type VersionedReplayArtifact = Readonly<{
  artifactType: "replay-audit-result";
  version: string;
  replayAuditResult: ReplayAuditResult;
  executionCompatibilityContract: ExecutionCompatibilityContract;
  immutableReplayIdentityRoot: ImmutableReplayIdentityRoot;
  replayLineageInvariant: ReplayLineageInvariant;
  migrationLineage: readonly MigrationLineageEntry[];
  approvalImpact: ApprovalImpactState;
  governanceImpact: ApprovalImpactState;
  schemaHash: string;
  contentHash: string;
}>;

export type VersioningBuildInput = Readonly<{
  replayAuditResult: ReplayAuditResult;
  executionCompatibilityContract: ExecutionCompatibilityContract;
  targetVersion?: string;
}>;

export type VersioningFailure = Readonly<{
  code: VersioningFailureCode;
  message: string;
  path?: string;
}>;

export type VersionedReplayReadinessResult = Readonly<{
  ok: boolean;
  artifact?: VersionedReplayArtifact;
  migrationProof?: MigrationProof;
  auditEvents?: readonly VersioningAuditEvent[];
  failures: readonly VersioningFailure[];
}>;
