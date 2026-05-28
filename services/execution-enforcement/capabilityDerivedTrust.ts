import type { RuntimeCapability } from "@/schemas/toolRegistrySchema";
import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { EnforcementViolation, ExecutionTrustZone } from "./enforcementTypes";

const TRUST_RANK: Record<ExecutionTrustZone, number> = {
  isolated: 0,
  controlled: 1,
  approved: 2,
  privileged: 3,
  internal: 4,
  forbidden: 5,
};

const CAPABILITY_TRUST: Record<RuntimeCapability, ExecutionTrustZone> = {
  read: "isolated",
  write: "controlled",
  network: "controlled",
  execute: "approved",
  privileged: "privileged",
  autonomous: "forbidden",
  governance: "internal",
  recovery: "approved",
};

export function deriveExecutionTrustZone(entry: CanonicalToolRegistryEntry): {
  trustZone?: ExecutionTrustZone;
  violations: EnforcementViolation[];
} {
  if (!entry.runtimeCapabilities.length) {
    return {
      violations: [{
        rule: "runtimeCapabilities.required",
        reasonCode: "EXECUTION_TRUST_RESOLUTION_FAILED",
      }],
    };
  }

  const trustZone = entry.runtimeCapabilities.reduce<ExecutionTrustZone>((current, capability) => {
    const next = CAPABILITY_TRUST[capability];
    return TRUST_RANK[next] > TRUST_RANK[current] ? next : current;
  }, "isolated");

  return {
    trustZone,
    violations: [],
  };
}
