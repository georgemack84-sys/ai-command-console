import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { EnforcementViolation } from "./enforcementTypes";
import { deriveSandboxProfile } from "./sandboxProfileDeriver";

export function deriveCapabilitySandbox(entry: CanonicalToolRegistryEntry): {
  sandboxProfile?: ReturnType<typeof deriveSandboxProfile>;
  violations: EnforcementViolation[];
} {
  const profile = deriveSandboxProfile(entry);
  if (!profile.profileId) {
    return {
      violations: [{
        rule: "sandbox.profile.required",
        reasonCode: "EXECUTION_SANDBOX_DERIVATION_FAILED",
      }],
    };
  }

  return {
    sandboxProfile: profile,
    violations: [],
  };
}
