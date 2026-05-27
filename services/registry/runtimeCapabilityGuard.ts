import type { RuntimeCapability } from "@/schemas/toolRegistrySchema";
import { getCanonicalRegistryDocument } from "./toolRegistry";
import { REGISTRY_ERROR_CODES } from "./registryValidator";
import { deriveCapabilityAuditEventHash } from "./capabilityHash";
import type {
  CapabilityAssertionInput,
  CapabilityAssertionResult,
  CapabilityAuditEvent,
} from "./capabilityTypes";

function hasScope(entryScope: readonly string[], requestedScope: string | null | undefined) {
  if (!requestedScope) {
    return true;
  }
  return entryScope.includes(requestedScope);
}

function matchesTrustZone(allowedZones: readonly string[] | undefined, trustZone: string | null | undefined) {
  if (!allowedZones || allowedZones.length === 0 || !trustZone) {
    return true;
  }
  return allowedZones.includes(trustZone);
}

function findEntry(input: CapabilityAssertionInput) {
  return getCanonicalRegistryDocument().tools.find(
    (candidate) => candidate.toolId === input.toolId && candidate.version === input.toolVersion,
  );
}

export function assertCapabilityAllowed(input: CapabilityAssertionInput): CapabilityAssertionResult {
  const entry = findEntry(input);
  if (!entry) {
    return {
      allowed: false,
      code: REGISTRY_ERROR_CODES.CAPABILITY_REPLAY_MISMATCH,
      reason: "registry entry not found",
    };
  }

  if (entry.registryHash !== input.registryHash || entry.capabilityHash !== input.capabilityHash) {
    return {
      allowed: false,
      code: REGISTRY_ERROR_CODES.CAPABILITY_REPLAY_MISMATCH,
      reason: "registry or capability hash mismatch",
      entry,
    };
  }

  if (entry.status !== "published" && entry.status !== "deprecated") {
    return {
      allowed: false,
      code: REGISTRY_ERROR_CODES.UNPUBLISHED_EXECUTION_TARGET,
      reason: "entry is not executable in current publication state",
      entry,
    };
  }

  if (!entry.runtimeCapabilities.includes(input.requestedCapability)) {
    return {
      allowed: false,
      code: REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION,
      reason: "requested capability is undeclared",
      entry,
    };
  }

  if (!matchesTrustZone(entry.trustZoneRestrictions?.allowedZones, input.trustZone)) {
    return {
      allowed: false,
      code: REGISTRY_ERROR_CODES.CAPABILITY_TRUST_DENIED,
      reason: "trust zone denied",
      entry,
    };
  }

  const requestedScope = input.requestedScope ?? null;
  switch (input.requestedCapability) {
    case "read":
      if (!hasScope(entry.capabilityMetadata.read?.scope ?? [], requestedScope)) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_SCOPE_DENIED, reason: "read scope denied", entry };
      }
      break;
    case "write":
      if (!hasScope(entry.capabilityMetadata.write?.scope ?? [], requestedScope)) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_SCOPE_DENIED, reason: "write scope denied", entry };
      }
      break;
    case "network": {
      const meta = entry.capabilityMetadata.network;
      if (!meta) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION, reason: "missing network metadata", entry };
      }
      if (requestedScope === "localhost" && !meta.allowLocalhost) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_SCOPE_DENIED, reason: "localhost denied", entry };
      }
      if (requestedScope && requestedScope !== "localhost" && !meta.allowedDomains.includes(requestedScope)) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_SCOPE_DENIED, reason: "network domain denied", entry };
      }
      break;
    }
    case "execute":
      if (requestedScope && !entry.capabilityMetadata.execute?.allowedCommands.includes(requestedScope)) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_SCOPE_DENIED, reason: "command denied", entry };
      }
      break;
    case "privileged":
    case "governance":
      if (entry.approvalRequired !== true) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_APPROVAL_REQUIRED, reason: "approval required", entry };
      }
      break;
    case "autonomous":
      if (entry.approvalRequired !== true || !entry.capabilityMetadata.autonomous?.killSwitchCompatible) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.CAPABILITY_APPROVAL_REQUIRED, reason: "autonomous bounds invalid", entry };
      }
      break;
    case "recovery":
      if (!entry.capabilityMetadata.recovery?.rollbackDeclared && !entry.capabilityMetadata.recovery?.reconciliationDeclared) {
        return { allowed: false, code: REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION, reason: "recovery declaration missing", entry };
      }
      break;
    default: {
      const exhaustiveCheck: never = input.requestedCapability;
      return { allowed: false, code: REGISTRY_ERROR_CODES.TOOL_CAPABILITY_VIOLATION, reason: exhaustiveCheck, entry };
    }
  }

  return {
    allowed: true,
    entry,
  };
}

export function buildCapabilityAuditEvent(input: {
  assertion: CapabilityAssertionInput;
  result: CapabilityAssertionResult;
}): CapabilityAuditEvent {
  const entry = input.result.entry;
  const baseEvent = {
    event: input.result.allowed ? "capability.invoked" as const : "capability.violation" as const,
    toolId: input.assertion.toolId,
    toolVersion: input.assertion.toolVersion,
    capability: input.result.allowed ? input.assertion.requestedCapability : undefined,
    attemptedCapability: input.result.allowed ? undefined : input.assertion.requestedCapability,
    declaredCapabilities: (entry?.runtimeCapabilities ?? []) as readonly RuntimeCapability[],
    scope: input.assertion.requestedScope ?? null,
    capabilityHash: input.assertion.capabilityHash,
    registryHash: input.assertion.registryHash,
    result: input.result.allowed ? "allowed" as const : "blocked" as const,
    reason: input.result.code,
  };

  return {
    ...baseEvent,
    eventHash: deriveCapabilityAuditEventHash(baseEvent),
  };
}
