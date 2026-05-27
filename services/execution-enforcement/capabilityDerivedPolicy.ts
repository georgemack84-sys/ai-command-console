import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";

export function deriveCapabilityPolicyHash(entry: CanonicalToolRegistryEntry) {
  return hashStableContent("EXECUTION_SCOPE", {
    toolId: entry.toolId,
    version: entry.version,
    runtimeCapabilities: [...entry.runtimeCapabilities].sort(),
    approvalRequired: entry.approvalRequired,
    governanceRestrictions: entry.governanceRestrictions,
    supportsReplay: entry.supportsReplay,
    rollbackSupported: entry.rollbackSupported,
    trustZoneRestrictions: entry.trustZoneRestrictions ?? null,
  });
}
