import { assertCapabilityAllowed } from "@/services/registry/runtimeCapabilityGuard";
import type { CapabilityAssertionResult } from "@/services/registry/capabilityTypes";
import type { UnifiedEnforcementInput, EnforcementViolation } from "./enforcementTypes";

function mapCapabilityFailure(code?: string): EnforcementViolation["reasonCode"] {
  switch (code) {
    case "CAPABILITY_TRUST_DENIED":
      return "EXECUTION_TRUST_ZONE_VIOLATION";
    case "CAPABILITY_APPROVAL_REQUIRED":
      return "PRIVILEGE_ESCALATION_ATTEMPT";
    case "CAPABILITY_SCOPE_DENIED":
      return "TOOL_CAPABILITY_VIOLATION";
    case "CAPABILITY_REPLAY_MISMATCH":
      return "EXECUTION_PROVENANCE_INVALID";
    default:
      return "TOOL_CAPABILITY_VIOLATION";
  }
}

export function validateCapabilityAuthorityAdmission(input: UnifiedEnforcementInput): {
  result: CapabilityAssertionResult;
  violations: EnforcementViolation[];
} {
  const result = assertCapabilityAllowed({
    toolId: input.toolId,
    toolVersion: input.toolVersion,
    registryHash: input.registryHash,
    capabilityHash: input.capabilityHash,
    requestedCapability: input.requestedCapability,
    requestedScope: input.requestedScope,
    trustZone: input.trustZoneHint,
  });

  if (result.allowed) {
    return { result, violations: [] };
  }

  return {
    result,
    violations: [{
      rule: "runtimeCapabilityGuard.assert",
      expected: "allowed",
      actual: result.code,
      reasonCode: mapCapabilityFailure(result.code),
    }],
  };
}
