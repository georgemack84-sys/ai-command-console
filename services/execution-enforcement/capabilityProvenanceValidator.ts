import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { EnforcementViolation } from "./enforcementTypes";

export function validateCapabilityProvenance(input: {
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
}): { entry?: CanonicalToolRegistryEntry; violations: EnforcementViolation[] } {
  const entry = getCanonicalRegistryDocument().tools.find(
    (candidate) => candidate.toolId === input.toolId && candidate.version === input.toolVersion,
  );

  if (!entry) {
    return {
      violations: [{
        rule: "registry.entry.exists",
        reasonCode: "EXECUTION_POLICY_NOT_FOUND",
      }],
    };
  }

  const violations: EnforcementViolation[] = [];
  if (entry.registryHash !== input.registryHash || entry.capabilityHash !== input.capabilityHash) {
    violations.push({
      rule: "registry.authority.hashes.match",
      expected: { registryHash: entry.registryHash, capabilityHash: entry.capabilityHash },
      actual: { registryHash: input.registryHash, capabilityHash: input.capabilityHash },
      reasonCode: "EXECUTION_PROVENANCE_INVALID",
    });
  }

  if (entry.status === "draft" || entry.status === "blocked" || entry.status === "revoked") {
    violations.push({
      rule: "registry.status.executable",
      expected: "published|deprecated",
      actual: entry.status,
      reasonCode: "EXECUTION_PROVENANCE_INVALID",
    });
  }

  return { entry, violations };
}
