import { z } from "zod";

const executionModeSchema = z.enum(["read_only", "controlled", "approval_required", "disabled"]);
const riskLevelSchema = z.enum(["low", "medium", "high", "critical"]);
const categorySchema = z.enum([
  "filesystem",
  "network",
  "database",
  "memory",
  "planner",
  "formatter",
  "audit",
  "approval",
  "replay",
  "system",
]);
const riskClassSchema = z.enum(["safe", "read_only", "write", "destructive", "external_mutation"]);
const toolStatusSchema = z.enum(["draft", "published", "deprecated", "blocked", "revoked"]);
const runtimeCapabilitySchema = z.enum(["read", "write", "execute", "network", "privileged", "autonomous", "recovery", "governance"]);
const semverSchema = z.string().regex(
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/,
  "INVALID_TOOL_VERSION",
);

const parameterConstraintsSchema = z.object({
  maxDepth: z.number().int().positive().optional(),
  allowWildcards: z.boolean().optional(),
  allowExternalHosts: z.boolean().optional(),
  allowRecursiveActions: z.boolean().optional(),
});

const governanceRestrictionsSchema = z.object({
  blockedInFreeze: z.boolean(),
  blockedInReplayDrift: z.boolean(),
  blockedWithoutApproval: z.boolean(),
});

const trustZoneRestrictionsSchema = z.object({
  allowedZones: z.array(z.string().min(1)).min(1),
}).strict();

const governanceMetadataSchema = z.object({
  riskLevel: z.enum(["minimal", "low", "moderate", "high", "critical"]),
  approvalLevel: z.enum(["none", "operator", "human-required", "multi-party", "executive"]),
  dataSensitivity: z.enum(["public", "internal", "confidential", "restricted", "regulated"]),
  auditLevel: z.enum(["basic", "standard", "elevated", "full", "forensic"]),
  governanceLineageRequired: z.boolean(),
  provenanceLevel: z.enum(["basic", "standard", "full", "forensic"]),
}).strict();

const capabilityMetadataSchema = z.object({
  read: z.object({
    scope: z.array(z.string().min(1)).min(1),
  }).strict().optional(),
  write: z.object({
    scope: z.array(z.string().min(1)).min(1),
    rollbackSupported: z.boolean().optional(),
    destructive: z.boolean().optional(),
  }).strict().optional(),
  network: z.object({
    allowedDomains: z.array(z.string().min(1)).min(1),
    allowPrivateNetworks: z.boolean(),
    allowLocalhost: z.boolean(),
  }).strict().optional(),
  execute: z.object({
    allowedCommands: z.array(z.string().min(1)).min(1),
    shellAccess: z.boolean(),
  }).strict().optional(),
  privileged: z.object({
    constitutionalApprovalRequired: z.literal(true),
  }).strict().optional(),
  autonomous: z.object({
    runtimeBounds: z.object({
      maxConcurrentOperations: z.number().int().positive(),
      maxRuntimeSeconds: z.number().int().positive(),
    }).strict(),
    escalationPath: z.string().min(1),
    killSwitchCompatible: z.literal(true),
    auditPolicy: z.string().min(1),
  }).strict().optional(),
  recovery: z.object({
    recoveryScope: z.array(z.string().min(1)).min(1),
    rollbackDeclared: z.boolean(),
    reconciliationDeclared: z.boolean(),
  }).strict().optional(),
  governance: z.object({
    enforcementScope: z.array(z.string().min(1)).min(1),
    constitutionalApprovalRequired: z.literal(true),
  }).strict().optional(),
}).strict();

export const toolRegistryEntrySchema = z.object({
  toolId: z.string().min(1),
  name: z.string().min(1),
  version: z.string().min(1),
  enabled: z.boolean(),
  owner: z.string().min(1),
  description: z.string().min(1),
  capabilities: z.array(z.string().min(1)).min(1),
  plannerEligible: z.boolean(),
  riskClass: riskClassSchema,
  requiresApprovalDefault: z.boolean(),
  allowedTargets: z.array(z.string()),
  deniedTargets: z.array(z.string()),
  parameterConstraints: parameterConstraintsSchema,
  governanceRestrictions: governanceRestrictionsSchema,
  displayName: z.string().min(1).optional(),
  category: categorySchema.optional(),
  executionMode: executionModeSchema.optional(),
  riskLevel: riskLevelSchema.optional(),
  approvalRequired: z.boolean().optional(),
  supportsDryRun: z.boolean().optional(),
  supportsReplay: z.boolean().optional(),
  rollbackSupported: z.boolean().optional(),
  canonicalId: z.string().min(1).optional(),
  registryHash: z.string().min(1).optional(),
  runtimeCapabilities: z.array(runtimeCapabilitySchema).min(1).optional(),
  capabilityMetadata: capabilityMetadataSchema.optional(),
  capabilityHash: z.string().min(1).optional(),
  trustZoneRestrictions: trustZoneRestrictionsSchema.optional(),
  governanceMetadata: governanceMetadataSchema.optional(),
  status: toolStatusSchema.optional(),
  publishedAt: z.string().datetime().optional(),
  lineageId: z.string().min(1).optional(),
  deterministicReplayMetadata: z.object({
    evidenceFields: z.array(z.string().min(1)).min(1),
    hashStrategy: z.string().min(1),
  }).optional(),
  rollbackMetadata: z.object({
    strategy: z.string().min(1),
    requiresCheckpoint: z.boolean(),
    policyMode: z.string().min(1),
  }).optional(),
  inputSchemaRef: z.string().min(1).optional(),
  outputSchemaRef: z.string().min(1).optional(),
  policyRef: z.string().min(1).optional(),
  adapterRef: z.string().min(1).optional(),
});

export const canonicalToolRegistryEntrySchema = toolRegistryEntrySchema.extend({
  version: semverSchema,
  displayName: z.string().min(1),
  category: categorySchema,
  executionMode: executionModeSchema,
  riskLevel: riskLevelSchema,
  approvalRequired: z.boolean(),
  supportsDryRun: z.boolean(),
  supportsReplay: z.boolean(),
  rollbackSupported: z.boolean(),
  inputSchemaRef: z.string().min(1),
  outputSchemaRef: z.string().min(1),
  policyRef: z.string().min(1),
  adapterRef: z.string().min(1),
  canonicalId: z.string().min(1),
  registryHash: z.string().min(1),
  runtimeCapabilities: z.array(runtimeCapabilitySchema).min(1),
  capabilityMetadata: capabilityMetadataSchema,
  capabilityHash: z.string().min(1),
  trustZoneRestrictions: trustZoneRestrictionsSchema.optional(),
  governanceMetadata: governanceMetadataSchema,
  status: toolStatusSchema,
  publishedAt: z.string().datetime().optional(),
  lineageId: z.string().min(1),
  deterministicReplayMetadata: z.object({
    evidenceFields: z.array(z.string().min(1)).min(1),
    hashStrategy: z.string().min(1),
  }).optional(),
  rollbackMetadata: z.object({
    strategy: z.string().min(1),
    requiresCheckpoint: z.boolean(),
    policyMode: z.string().min(1),
  }).optional(),
}).strict();

export const toolRegistryDocumentSchema = z.object({
  registryVersion: z.string().min(1),
  schemaVersion: z.string().min(1),
  migrationBaseline: z.string().min(1),
  tools: z.array(canonicalToolRegistryEntrySchema).min(1),
}).strict();

export const toolPolicySchema = z.object({
  policyId: z.string().min(1),
  toolId: z.string().min(1),
  version: z.string().min(1),
  allowedScopes: z.array(z.string().min(1)),
  forbiddenScopes: z.array(z.string().min(1)),
  timeoutMs: z.number().int().positive(),
  sideEffects: z.array(z.string().min(1)),
  dryRun: z.object({
    supported: z.boolean(),
    mode: z.string().min(1),
  }),
  replay: z.object({
    supported: z.boolean(),
    deterministicMetadataRequired: z.boolean(),
  }),
  rollback: z.object({
    supported: z.boolean(),
    strategy: z.string().min(1).nullable(),
    policyRequired: z.boolean(),
  }),
  audit: z.object({
    required: z.boolean(),
    eventTypes: z.array(z.string().min(1)).min(1),
  }),
  boundedExecution: z.object({
    maxOperations: z.number().int().positive(),
    maxPayloadBytes: z.number().int().positive(),
  }),
}).strict();

export const toolAdapterSchema = z.object({
  adapterId: z.string().min(1),
  toolId: z.string().min(1),
  version: z.string().min(1),
  adapterType: z.string().min(1),
  importPath: z.string().min(1),
  runtimeHandler: z.string().min(1),
  dryRunHandler: z.string().min(1).nullable(),
  rollbackHandler: z.string().min(1).nullable(),
}).strict();

export const registryMigrationSchema = z.object({
  migrationId: z.string().min(1),
  version: z.string().min(1),
  description: z.string().min(1),
  createdArtifacts: z.array(z.string().min(1)).min(1),
  invariants: z.array(z.string().min(1)).min(1),
  registryVersion: z.string().min(1),
}).strict();

export const toolVersionLineageRecordSchema = z.object({
  version: semverSchema,
  canonicalId: z.string().min(1),
  registryHash: z.string().min(1),
  capabilityHash: z.string().min(1),
  status: toolStatusSchema,
  publishedAt: z.string().datetime().optional(),
}).strict();

export const toolVersionLineageSchema = z.object({
  lineageId: z.string().min(1),
  versions: z.array(semverSchema).min(1),
  latestVersion: semverSchema,
  deprecatedVersions: z.array(semverSchema),
  versionRecords: z.array(toolVersionLineageRecordSchema).min(1),
}).strict();

export const toolVersionLineageDocumentSchema = z.object({
  schemaVersion: z.string().min(1),
  lineages: z.array(toolVersionLineageSchema).min(1),
}).strict();

export const toolMigrationManifestSchema = z.object({
  lineageId: z.string().min(1),
  fromVersion: semverSchema,
  toVersion: semverSchema,
  migrationType: z.enum(["breaking", "compatible", "patch"]),
  requiresApproval: z.boolean(),
  replayCompatible: z.boolean(),
}).strict();

export const toolMigrationManifestDocumentSchema = z.object({
  schemaVersion: z.string().min(1),
  migrations: z.array(toolMigrationManifestSchema),
}).strict();

export const toolReplayBindingSchema = z.object({
  toolId: z.string().min(1),
  toolVersion: semverSchema,
  registryHash: z.string().min(1),
  capabilityHash: z.string().min(1),
  canonicalToolId: z.string().min(1).optional(),
}).strict();

export const registryErrorCodeSchema = z.enum([
  "REGISTRY_TOOL_ID_MISSING",
  "REGISTRY_VERSION_MISSING",
  "REGISTRY_INPUT_SCHEMA_REF_MISSING",
  "REGISTRY_OUTPUT_SCHEMA_REF_MISSING",
  "REGISTRY_POLICY_REF_MISSING",
  "REGISTRY_DUPLICATE_TOOL_VERSION",
  "REGISTRY_RUNTIME_OVERRIDE_FORBIDDEN",
  "REGISTRY_IMPLICIT_PERMISSION_FORBIDDEN",
  "REGISTRY_UNBOUNDED_EXECUTION_FORBIDDEN",
  "REGISTRY_REPLAY_DETERMINISM_REQUIRED",
  "REGISTRY_ROLLBACK_POLICY_REQUIRED",
  "REGISTRY_HIGH_RISK_APPROVAL_REQUIRED",
  "REGISTRY_CRITICAL_RISK_APPROVAL_REQUIRED",
  "REGISTRY_ADAPTER_OVERRIDE_FORBIDDEN",
  "REGISTRY_UNKNOWN_ENUM",
  "REGISTRY_SCHEMA_VALIDATION_FAILED",
  "REGISTRY_POLICY_VALIDATION_FAILED",
  "REGISTRY_ADAPTER_VALIDATION_FAILED",
  "REGISTRY_FILE_MISSING",
  "REGISTRY_DOCUMENT_INVALID",
  "INVALID_CANONICAL_ID",
  "INVALID_TOOL_VERSION",
  "MISSING_TOOL_VERSION",
  "REGISTRY_HASH_MISMATCH",
  "IMMUTABLE_VERSION_MUTATION",
  "UNPUBLISHED_EXECUTION_TARGET",
  "REPLAY_BINDING_FAILURE",
  "LINEAGE_CORRUPTION",
  "CAPABILITY_ESCALATION_BLOCKED",
  "CAPABILITY_HASH_MISMATCH",
  "CAPABILITY_SCOPE_DENIED",
  "CAPABILITY_REPLAY_MISMATCH",
  "CAPABILITY_APPROVAL_REQUIRED",
  "CAPABILITY_TRUST_DENIED",
  "TOOL_CAPABILITY_VIOLATION",
]);

export type ExecutionMode = z.infer<typeof executionModeSchema>;
export type RiskLevel = z.infer<typeof riskLevelSchema>;
export type ToolCategory = z.infer<typeof categorySchema>;
export type RiskClass = z.infer<typeof riskClassSchema>;
export type ToolRegistryDocument = z.infer<typeof toolRegistryDocumentSchema>;
export type CanonicalToolRegistryEntry = z.infer<typeof canonicalToolRegistryEntrySchema>;
export type ToolPolicy = z.infer<typeof toolPolicySchema>;
export type ToolAdapter = z.infer<typeof toolAdapterSchema>;
export type RegistryMigration = z.infer<typeof registryMigrationSchema>;
export type RegistryErrorCode = z.infer<typeof registryErrorCodeSchema>;
export type ToolStatus = z.infer<typeof toolStatusSchema>;
export type ToolVersionLineageRecord = z.infer<typeof toolVersionLineageRecordSchema>;
export type ToolVersionLineage = z.infer<typeof toolVersionLineageSchema>;
export type ToolVersionLineageDocument = z.infer<typeof toolVersionLineageDocumentSchema>;
export type ToolMigrationManifest = z.infer<typeof toolMigrationManifestSchema>;
export type ToolMigrationManifestDocument = z.infer<typeof toolMigrationManifestDocumentSchema>;
export type ToolReplayBinding = z.infer<typeof toolReplayBindingSchema>;
export type RuntimeCapability = z.infer<typeof runtimeCapabilitySchema>;
export type CapabilityMetadata = z.infer<typeof capabilityMetadataSchema>;
export type GovernanceMetadata = z.infer<typeof governanceMetadataSchema>;
