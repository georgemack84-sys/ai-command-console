import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { EnforcementViolation } from "./enforcementTypes";
import { resolveCapabilityBoundaries } from "./capabilityBoundaryResolver";

export function deriveCapabilityBoundaries(entry: CanonicalToolRegistryEntry, tenantId?: string): {
  boundaries?: ReturnType<typeof resolveCapabilityBoundaries>;
  violations: EnforcementViolation[];
} {
  const boundaries = resolveCapabilityBoundaries(entry, tenantId);
  return {
    boundaries,
    violations: [],
  };
}
