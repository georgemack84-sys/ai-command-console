import { validateContractPayload } from "@/services/contracts/validateContract";
import {
  canonicalToolRegistryEntrySchema,
  toolMigrationManifestDocumentSchema,
  toolAdapterSchema,
  toolPolicySchema,
  toolReplayBindingSchema,
  toolVersionLineageDocumentSchema,
  toolRegistryDocumentSchema,
  toolRegistryEntrySchema,
  type CanonicalToolRegistryEntry,
  type RegistryErrorCode,
  type ToolAdapter,
  type ToolMigrationManifestDocument,
  type ToolPolicy,
  type ToolReplayBinding,
  type ToolVersionLineageDocument,
  type ToolRegistryDocument,
} from "@/schemas/toolRegistrySchema";
import type { ToolRegistryEntry } from "./toolRegistry";
import {
  validateCanonicalIdentity,
  validateReplayBinding,
  validateVersionLineage,
} from "./registryIdentity";
import {
  validateCapabilityEscalation,
  validateCapabilityReplayBinding,
  validateRuntimeCapabilityContract,
} from "./capabilityValidator";
import { validateMigrationManifest, validateRegistryPublicationState } from "./registryPublication";

export const REGISTRY_ERROR_CODES = {
  REGISTRY_TOOL_ID_MISSING: "REGISTRY_TOOL_ID_MISSING",
  REGISTRY_VERSION_MISSING: "REGISTRY_VERSION_MISSING",
  REGISTRY_INPUT_SCHEMA_REF_MISSING: "REGISTRY_INPUT_SCHEMA_REF_MISSING",
  REGISTRY_OUTPUT_SCHEMA_REF_MISSING: "REGISTRY_OUTPUT_SCHEMA_REF_MISSING",
  REGISTRY_POLICY_REF_MISSING: "REGISTRY_POLICY_REF_MISSING",
  REGISTRY_DUPLICATE_TOOL_VERSION: "REGISTRY_DUPLICATE_TOOL_VERSION",
  REGISTRY_RUNTIME_OVERRIDE_FORBIDDEN: "REGISTRY_RUNTIME_OVERRIDE_FORBIDDEN",
  REGISTRY_IMPLICIT_PERMISSION_FORBIDDEN: "REGISTRY_IMPLICIT_PERMISSION_FORBIDDEN",
  REGISTRY_UNBOUNDED_EXECUTION_FORBIDDEN: "REGISTRY_UNBOUNDED_EXECUTION_FORBIDDEN",
  REGISTRY_REPLAY_DETERMINISM_REQUIRED: "REGISTRY_REPLAY_DETERMINISM_REQUIRED",
  REGISTRY_ROLLBACK_POLICY_REQUIRED: "REGISTRY_ROLLBACK_POLICY_REQUIRED",
  REGISTRY_HIGH_RISK_APPROVAL_REQUIRED: "REGISTRY_HIGH_RISK_APPROVAL_REQUIRED",
  REGISTRY_CRITICAL_RISK_APPROVAL_REQUIRED: "REGISTRY_CRITICAL_RISK_APPROVAL_REQUIRED",
  REGISTRY_ADAPTER_OVERRIDE_FORBIDDEN: "REGISTRY_ADAPTER_OVERRIDE_FORBIDDEN",
  REGISTRY_UNKNOWN_ENUM: "REGISTRY_UNKNOWN_ENUM",
  REGISTRY_SCHEMA_VALIDATION_FAILED: "REGISTRY_SCHEMA_VALIDATION_FAILED",
  REGISTRY_POLICY_VALIDATION_FAILED: "REGISTRY_POLICY_VALIDATION_FAILED",
  REGISTRY_ADAPTER_VALIDATION_FAILED: "REGISTRY_ADAPTER_VALIDATION_FAILED",
  REGISTRY_FILE_MISSING: "REGISTRY_FILE_MISSING",
  REGISTRY_DOCUMENT_INVALID: "REGISTRY_DOCUMENT_INVALID",
  INVALID_CANONICAL_ID: "INVALID_CANONICAL_ID",
  INVALID_TOOL_VERSION: "INVALID_TOOL_VERSION",
  MISSING_TOOL_VERSION: "MISSING_TOOL_VERSION",
  REGISTRY_HASH_MISMATCH: "REGISTRY_HASH_MISMATCH",
  IMMUTABLE_VERSION_MUTATION: "IMMUTABLE_VERSION_MUTATION",
  UNPUBLISHED_EXECUTION_TARGET: "UNPUBLISHED_EXECUTION_TARGET",
  REPLAY_BINDING_FAILURE: "REPLAY_BINDING_FAILURE",
  LINEAGE_CORRUPTION: "LINEAGE_CORRUPTION",
  CAPABILITY_ESCALATION_BLOCKED: "CAPABILITY_ESCALATION_BLOCKED",
  CAPABILITY_HASH_MISMATCH: "CAPABILITY_HASH_MISMATCH",
  CAPABILITY_SCOPE_DENIED: "CAPABILITY_SCOPE_DENIED",
  CAPABILITY_REPLAY_MISMATCH: "CAPABILITY_REPLAY_MISMATCH",
  CAPABILITY_APPROVAL_REQUIRED: "CAPABILITY_APPROVAL_REQUIRED",
  CAPABILITY_TRUST_DENIED: "CAPABILITY_TRUST_DENIED",
  TOOL_CAPABILITY_VIOLATION: "TOOL_CAPABILITY_VIOLATION",
} as const satisfies Record<string, RegistryErrorCode>;

type ValidationResult = {
  valid: boolean;
  reasons: RegistryErrorCode[];
};

function dedupeReasons(reasons: RegistryErrorCode[]) {
  return Array.from(new Set(reasons));
}

function detectMissingRequiredFields(entry: Partial<CanonicalToolRegistryEntry>) {
  const reasons: RegistryErrorCode[] = [];

  if (!String(entry.toolId ?? "").trim()) reasons.push(REGISTRY_ERROR_CODES.REGISTRY_TOOL_ID_MISSING);
  if (!String(entry.version ?? "").trim()) reasons.push(REGISTRY_ERROR_CODES.REGISTRY_VERSION_MISSING);
  if (!String(entry.inputSchemaRef ?? "").trim()) reasons.push(REGISTRY_ERROR_CODES.REGISTRY_INPUT_SCHEMA_REF_MISSING);
  if (!String(entry.outputSchemaRef ?? "").trim()) reasons.push(REGISTRY_ERROR_CODES.REGISTRY_OUTPUT_SCHEMA_REF_MISSING);
  if (!String(entry.policyRef ?? "").trim()) reasons.push(REGISTRY_ERROR_CODES.REGISTRY_POLICY_REF_MISSING);

  return reasons;
}

function validatePolicyContract(policy: ToolPolicy, entry: CanonicalToolRegistryEntry) {
  const reasons: RegistryErrorCode[] = [];
  if (!policy.boundedExecution?.maxOperations || policy.boundedExecution.maxOperations <= 0) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_UNBOUNDED_EXECUTION_FORBIDDEN);
  }

  const parsed = validateContractPayload<ToolPolicy>({
    schema: toolPolicySchema,
    payload: policy,
  });

  if (!parsed.ok) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_POLICY_VALIDATION_FAILED);
    return dedupeReasons(reasons);
  }

  if (!policy.boundedExecution?.maxOperations || !policy.timeoutMs) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_UNBOUNDED_EXECUTION_FORBIDDEN);
  }

  if (entry.supportsReplay && (!policy.replay.supported || !policy.replay.deterministicMetadataRequired)) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_REPLAY_DETERMINISM_REQUIRED);
  }

  if (entry.rollbackSupported && (!policy.rollback.supported || !policy.rollback.policyRequired)) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_ROLLBACK_POLICY_REQUIRED);
  }

  return reasons;
}

function validateAdapterContract(adapter: ToolAdapter) {
  const reasons: RegistryErrorCode[] = [];
  const forbiddenOverrides = ["riskLevel", "approvalRequired", "policyRef", "inputSchemaRef", "outputSchemaRef", "executionPermissions"];
  if (forbiddenOverrides.some((field) => Object.prototype.hasOwnProperty.call(adapter as Record<string, unknown>, field))) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_ADAPTER_OVERRIDE_FORBIDDEN);
  }

  const parsed = validateContractPayload<ToolAdapter>({
    schema: toolAdapterSchema,
    payload: adapter,
  });

  if (!parsed.ok) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_ADAPTER_VALIDATION_FAILED);
    return dedupeReasons(reasons);
  }

  return reasons;
}

export function validateRegistryEntry(entry: ToolRegistryEntry) {
  const baseResult = validateContractPayload<ToolRegistryEntry>({
    schema: toolRegistryEntrySchema,
    payload: entry,
  });
  const reasons: RegistryErrorCode[] = [];

  if (!baseResult.ok) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_SCHEMA_VALIDATION_FAILED);
  }

  reasons.push(...detectMissingRequiredFields(entry as Partial<CanonicalToolRegistryEntry>));

  const canonicalResult = validateContractPayload<CanonicalToolRegistryEntry>({
    schema: canonicalToolRegistryEntrySchema,
    payload: entry,
  });

  if (!canonicalResult.ok) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_DOCUMENT_INVALID);
  } else {
    reasons.push(...validateCanonicalIdentity(canonicalResult.data).reasons);
    reasons.push(...validateRuntimeCapabilityContract(canonicalResult.data).reasons);

    if ((entry.riskLevel === "high") && entry.approvalRequired !== true) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_HIGH_RISK_APPROVAL_REQUIRED);
    }

    if ((entry.riskLevel === "critical") && entry.approvalRequired !== true) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_CRITICAL_RISK_APPROVAL_REQUIRED);
    }

    if (entry.supportsReplay && !entry.deterministicReplayMetadata) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_REPLAY_DETERMINISM_REQUIRED);
    }

    if (entry.rollbackSupported && !entry.rollbackMetadata) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_ROLLBACK_POLICY_REQUIRED);
    }
  }

  return {
    valid: reasons.length === 0 && baseResult.ok && canonicalResult.ok,
    reasons: dedupeReasons(reasons),
  };
}

export function validateRegistryDocument(input: {
  document: ToolRegistryDocument | Record<string, unknown>;
  policiesByRef?: Record<string, ToolPolicy>;
  adaptersByRef?: Record<string, ToolAdapter>;
  lineages?: ToolVersionLineageDocument | Record<string, unknown>;
  migrationManifests?: ToolMigrationManifestDocument | Record<string, unknown>;
}): ValidationResult {
  const reasons: RegistryErrorCode[] = [];
  const {
    document,
    policiesByRef = {},
    adaptersByRef = {},
    lineages,
    migrationManifests,
  } = input;

  if (Object.prototype.hasOwnProperty.call(document, "runtimeOverrides")) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_RUNTIME_OVERRIDE_FORBIDDEN);
  }

  const roughTools = Array.isArray((document as { tools?: unknown }).tools)
    ? (document as { tools: Array<Partial<CanonicalToolRegistryEntry>> }).tools
    : [];
  for (const entry of roughTools) {
    reasons.push(...detectMissingRequiredFields(entry));
  }

  const parsed = validateContractPayload<ToolRegistryDocument>({
    schema: toolRegistryDocumentSchema,
    payload: document,
  });

  if (!parsed.ok) {
    reasons.push(REGISTRY_ERROR_CODES.REGISTRY_DOCUMENT_INVALID);
    return { valid: false, reasons: dedupeReasons(reasons) };
  }

  const seen = new Set<string>();
  for (const entry of parsed.data.tools) {
    const entryKey = `${entry.toolId}@${entry.version}`;
    if (seen.has(entryKey)) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_DUPLICATE_TOOL_VERSION);
    }
    seen.add(entryKey);

    const entryValidation = validateRegistryEntry(entry);
    reasons.push(...entryValidation.reasons);

    if ((entry as Record<string, unknown>).implicitPermissions === true) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_IMPLICIT_PERMISSION_FORBIDDEN);
    }

    const policy = policiesByRef[entry.policyRef];
    if (!policy) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_FILE_MISSING);
    } else {
      reasons.push(...validatePolicyContract(policy, entry));
    }

    const adapter = adaptersByRef[entry.adapterRef];
    if (!adapter) {
      reasons.push(REGISTRY_ERROR_CODES.REGISTRY_FILE_MISSING);
    } else {
      reasons.push(...validateAdapterContract(adapter));
    }
  }

  if (lineages) {
    const parsedLineages = validateContractPayload<ToolVersionLineageDocument>({
      schema: toolVersionLineageDocumentSchema,
      payload: lineages,
    });

    if (!parsedLineages.ok) {
      reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
    } else {
      for (const lineage of parsedLineages.data.lineages) {
        reasons.push(...validateVersionLineage(lineage, parsed.data.tools).reasons);
        reasons.push(...validateCapabilityEscalation(lineage, parsed.data.tools).reasons);
      }
      reasons.push(...validateRegistryPublicationState({
        entries: parsed.data.tools,
        lineages: parsedLineages.data.lineages,
      }).reasons);
    }
  }

  if (migrationManifests) {
    const parsedMigrations = validateContractPayload<ToolMigrationManifestDocument>({
      schema: toolMigrationManifestDocumentSchema,
      payload: migrationManifests,
    });

    if (!parsedMigrations.ok) {
      reasons.push(REGISTRY_ERROR_CODES.LINEAGE_CORRUPTION);
    } else if (lineages) {
      const parsedLineages = validateContractPayload<ToolVersionLineageDocument>({
        schema: toolVersionLineageDocumentSchema,
        payload: lineages,
      });
      const knownLineages = parsedLineages.ok ? parsedLineages.data.lineages : [];
      for (const manifest of parsedMigrations.data.migrations) {
        reasons.push(...validateMigrationManifest({
          manifest,
          lineage: knownLineages.find((candidate) => candidate.lineageId === manifest.lineageId),
        }).reasons);
      }
    }
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

export function validateReplayToolBinding(input: {
  binding: ToolReplayBinding | Record<string, unknown>;
  entries: readonly CanonicalToolRegistryEntry[];
}) : ValidationResult {
  const parsed = validateContractPayload<ToolReplayBinding>({
    schema: toolReplayBindingSchema,
    payload: input.binding,
  });

  if (!parsed.ok) {
    return {
      valid: false,
      reasons: [REGISTRY_ERROR_CODES.REPLAY_BINDING_FAILURE],
    };
  }

  const result = validateReplayBinding(parsed.data, input.entries);
  const capabilityResult = validateCapabilityReplayBinding(parsed.data, input.entries);
  return {
    valid: result.valid && capabilityResult.valid,
    reasons: dedupeReasons([...result.reasons, ...capabilityResult.reasons]),
  };
}
