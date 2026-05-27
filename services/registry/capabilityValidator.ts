import type {
  CanonicalToolRegistryEntry,
  RegistryErrorCode,
  RuntimeCapability,
  ToolReplayBinding,
  ToolVersionLineage,
} from "@/schemas/toolRegistrySchema";
import { REGISTRY_ERROR_CODES } from "./registryValidator";
import { deriveCapabilityHash, normalizeRuntimeCapabilities } from "./capabilityHash";
import type { CapabilityContractValidationResult } from "./capabilityTypes";

function dedupeReasons(reasons: RegistryErrorCode[]) {
  return Array.from(new Set(reasons));
}

const METADATA_KEYS_BY_CAPABILITY: Record<RuntimeCapability, keyof CanonicalToolRegistryEntry["capabilityMetadata"]> = {
  read: "read",
  write: "write",
  execute: "execute",
  network: "network",
  privileged: "privileged",
  autonomous: "autonomous",
  recovery: "recovery",
  governance: "governance",
};

function hasOnlyDeclaredMetadata(entry: CanonicalToolRegistryEntry) {
  const declared = new Set(entry.runtimeCapabilities);
  return Object.entries(entry.capabilityMetadata).every(([key, value]) => {
    if (value === undefined) {
      return true;
    }
    return declared.has(key as RuntimeCapability);
  });
}

export function validateRuntimeCapabilityContract(entry: CanonicalToolRegistryEntry): CapabilityContractValidationResult {
  const reasons: RegistryErrorCode[] = [];

  if (!entry.runtimeCapabilities.length) {
    reasons.push(REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION);
  }

  if (normalizeRuntimeCapabilities(entry.runtimeCapabilities).length !== entry.runtimeCapabilities.length) {
    reasons.push(REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION);
  }

  if (!hasOnlyDeclaredMetadata(entry)) {
    reasons.push(REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION);
  }

  for (const capability of entry.runtimeCapabilities) {
    const key = METADATA_KEYS_BY_CAPABILITY[capability];
    if (!entry.capabilityMetadata[key]) {
      reasons.push(REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION);
    }
  }

  if (entry.runtimeCapabilities.includes("privileged") && entry.approvalRequired !== true) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_APPROVAL_REQUIRED);
  }

  if (entry.runtimeCapabilities.includes("governance") && entry.approvalRequired !== true) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_APPROVAL_REQUIRED);
  }

  if (entry.runtimeCapabilities.includes("autonomous") && entry.approvalRequired !== true) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_APPROVAL_REQUIRED);
  }

  if (entry.capabilityHash !== deriveCapabilityHash(entry)) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_HASH_MISMATCH);
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

export function validateCapabilityReplayBinding(
  binding: ToolReplayBinding,
  entries: readonly CanonicalToolRegistryEntry[],
): CapabilityContractValidationResult {
  const reasons: RegistryErrorCode[] = [];
  const entry = entries.find((candidate) => candidate.toolId === binding.toolId && candidate.version === binding.toolVersion);
  if (!entry) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_REPLAY_MISMATCH);
    return { valid: false, reasons };
  }

  if (entry.status === "draft" || entry.status === "blocked" || entry.status === "revoked") {
    reasons.push(REGISTRY_ERROR_CODES.UNPUBLISHED_EXECUTION_TARGET);
  }

  if (entry.capabilityHash !== binding.capabilityHash) {
    reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_REPLAY_MISMATCH);
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}

const ESCALATION_PAIRS = new Set([
  "read->write",
  "read->execute",
  "read->privileged",
  "read->autonomous",
  "read->governance",
  "write->execute",
  "write->privileged",
  "write->autonomous",
  "write->governance",
  "execute->privileged",
  "execute->autonomous",
  "execute->governance",
  "network->autonomous",
  "network->governance",
  "recovery->governance",
]);

export function validateCapabilityEscalation(
  lineage: ToolVersionLineage,
  entries: readonly CanonicalToolRegistryEntry[],
): CapabilityContractValidationResult {
  const reasons: RegistryErrorCode[] = [];
  const lineageEntries = entries
    .filter((entry) => entry.lineageId === lineage.lineageId)
    .sort((left, right) => left.version.localeCompare(right.version, undefined, { numeric: true }));

  for (let index = 1; index < lineageEntries.length; index += 1) {
    const previous = lineageEntries[index - 1];
    const current = lineageEntries[index];
    const previousCaps = new Set(previous.runtimeCapabilities);
    for (const capability of current.runtimeCapabilities) {
      if (previousCaps.has(capability)) {
        continue;
      }

      if (
        previous.runtimeCapabilities.some((candidate) => ESCALATION_PAIRS.has(`${candidate}->${capability}`))
        || !previous.runtimeCapabilities.includes(capability)
      ) {
        reasons.push(REGISTRY_ERROR_CODES.CAPABILITY_ESCALATION_BLOCKED);
      }
    }
  }

  return {
    valid: reasons.length === 0,
    reasons: dedupeReasons(reasons),
  };
}
