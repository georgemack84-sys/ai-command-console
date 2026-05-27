import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { RuntimeBoundaryEnvelope } from "./enforcementTypes";

function sortStrings(values: readonly string[]) {
  return [...values].sort((left, right) => left.localeCompare(right));
}

export function resolveCapabilityBoundaries(entry: CanonicalToolRegistryEntry, tenantId?: string): RuntimeBoundaryEnvelope {
  return {
    filesystem: {
      isolated: entry.runtimeCapabilities.includes("write"),
      allowedScopes: sortStrings(entry.capabilityMetadata.write?.scope ?? entry.capabilityMetadata.read?.scope ?? []),
      rollbackRequired: entry.runtimeCapabilities.includes("write"),
    },
    network: {
      isolated: entry.runtimeCapabilities.includes("network"),
      allowedDomains: sortStrings(entry.capabilityMetadata.network?.allowedDomains ?? []),
      allowPrivateNetworks: entry.capabilityMetadata.network?.allowPrivateNetworks ?? false,
      allowLocalhost: entry.capabilityMetadata.network?.allowLocalhost ?? false,
    },
    process: {
      isolated: entry.runtimeCapabilities.includes("execute") || entry.runtimeCapabilities.includes("privileged"),
      allowedCommands: sortStrings(entry.capabilityMetadata.execute?.allowedCommands ?? []),
      shellAccess: entry.capabilityMetadata.execute?.shellAccess ?? false,
    },
    tenant: {
      isolated: true,
      tenantId: tenantId ?? null,
    },
    privilege: {
      privilegedMonitoringRequired: entry.runtimeCapabilities.includes("privileged"),
      constitutionalApprovalRequired:
        entry.runtimeCapabilities.includes("privileged") || entry.runtimeCapabilities.includes("governance"),
      internalOnly: entry.runtimeCapabilities.includes("governance"),
    },
  };
}
