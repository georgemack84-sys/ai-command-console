import type {
  CanonicalToolRegistryEntry,
  RuntimeCapability,
} from "@/schemas/toolRegistrySchema";
import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { CapabilityAuditEvent } from "./capabilityTypes";

function sortStrings(values: readonly string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function normalizeCapabilityMetadata(entry: Pick<CanonicalToolRegistryEntry, "capabilityMetadata" | "runtimeCapabilities">) {
  const normalized: Record<string, unknown> = {};

  if (entry.runtimeCapabilities.includes("read")) {
    normalized.read = {
      scope: sortStrings(entry.capabilityMetadata.read?.scope ?? []),
    };
  }

  if (entry.runtimeCapabilities.includes("write")) {
    normalized.write = {
      scope: sortStrings(entry.capabilityMetadata.write?.scope ?? []),
      rollbackSupported: entry.capabilityMetadata.write?.rollbackSupported ?? false,
      destructive: entry.capabilityMetadata.write?.destructive ?? false,
    };
  }

  if (entry.runtimeCapabilities.includes("network")) {
    normalized.network = {
      allowedDomains: sortStrings(entry.capabilityMetadata.network?.allowedDomains ?? []),
      allowPrivateNetworks: entry.capabilityMetadata.network?.allowPrivateNetworks ?? false,
      allowLocalhost: entry.capabilityMetadata.network?.allowLocalhost ?? false,
    };
  }

  if (entry.runtimeCapabilities.includes("execute")) {
    normalized.execute = {
      allowedCommands: sortStrings(entry.capabilityMetadata.execute?.allowedCommands ?? []),
      shellAccess: entry.capabilityMetadata.execute?.shellAccess ?? false,
    };
  }

  if (entry.runtimeCapabilities.includes("privileged")) {
    normalized.privileged = {
      constitutionalApprovalRequired: entry.capabilityMetadata.privileged?.constitutionalApprovalRequired ?? true,
    };
  }

  if (entry.runtimeCapabilities.includes("autonomous")) {
    normalized.autonomous = {
      runtimeBounds: entry.capabilityMetadata.autonomous?.runtimeBounds ?? null,
      escalationPath: entry.capabilityMetadata.autonomous?.escalationPath ?? "",
      killSwitchCompatible: entry.capabilityMetadata.autonomous?.killSwitchCompatible ?? true,
      auditPolicy: entry.capabilityMetadata.autonomous?.auditPolicy ?? "",
    };
  }

  if (entry.runtimeCapabilities.includes("recovery")) {
    normalized.recovery = {
      recoveryScope: sortStrings(entry.capabilityMetadata.recovery?.recoveryScope ?? []),
      rollbackDeclared: entry.capabilityMetadata.recovery?.rollbackDeclared ?? false,
      reconciliationDeclared: entry.capabilityMetadata.recovery?.reconciliationDeclared ?? false,
    };
  }

  if (entry.runtimeCapabilities.includes("governance")) {
    normalized.governance = {
      enforcementScope: sortStrings(entry.capabilityMetadata.governance?.enforcementScope ?? []),
      constitutionalApprovalRequired:
        entry.capabilityMetadata.governance?.constitutionalApprovalRequired ?? true,
    };
  }

  return normalized;
}

export function normalizeRuntimeCapabilities(capabilities: readonly RuntimeCapability[]) {
  return [...new Set(capabilities)].sort((left, right) => left.localeCompare(right));
}

export function deriveCapabilityHash(
  entry: Pick<
    CanonicalToolRegistryEntry,
    "runtimeCapabilities" | "capabilityMetadata" | "approvalRequired" | "trustZoneRestrictions"
  >,
) {
  return hashStableContent("TOOL_CAPABILITY", {
    runtimeCapabilities: normalizeRuntimeCapabilities(entry.runtimeCapabilities),
    capabilityMetadata: normalizeCapabilityMetadata(entry),
    approvalRequired: entry.approvalRequired,
    trustZoneRestrictions: entry.trustZoneRestrictions
      ? {
          allowedZones: sortStrings(entry.trustZoneRestrictions.allowedZones),
        }
      : null,
  });
}

export function deriveCapabilityAuditEventHash(
  event: Omit<CapabilityAuditEvent, "eventHash">,
) {
  return hashStableContent("TOOL_CAPABILITY_AUDIT", Object.fromEntries(
    Object.entries(event).filter(([, value]) => value !== undefined),
  ));
}
