import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { EnforcementViolation, RuntimeBoundaryEnvelope, DerivedSandboxProfile, UnifiedEnforcementInput } from "./enforcementTypes";

export function validateRuntimeContainment(input: {
  entry: CanonicalToolRegistryEntry;
  boundaries: RuntimeBoundaryEnvelope;
  sandboxProfile: DerivedSandboxProfile;
  request: UnifiedEnforcementInput;
}): { valid: boolean; violations: EnforcementViolation[] } {
  const violations: EnforcementViolation[] = [];
  const capability = input.request.requestedCapability;

  if (capability === "write" && (!input.sandboxProfile.filesystemIsolation || !input.request.runtimeMetadata?.filesystemIsolationReady)) {
    violations.push({
      rule: "filesystem.isolation.required",
      expected: true,
      actual: input.request.runtimeMetadata?.filesystemIsolationReady ?? false,
      reasonCode: "FILESYSTEM_ISOLATION_VIOLATION",
    });
  }

  if (capability === "network" && (!input.sandboxProfile.networkIsolation || !input.request.runtimeMetadata?.networkIsolationReady)) {
    violations.push({
      rule: "network.isolation.required",
      expected: true,
      actual: input.request.runtimeMetadata?.networkIsolationReady ?? false,
      reasonCode: "NETWORK_ISOLATION_VIOLATION",
    });
  }

  if ((capability === "execute" || capability === "privileged") && (!input.sandboxProfile.processIsolation || !input.request.runtimeMetadata?.processIsolationReady)) {
    violations.push({
      rule: "process.isolation.required",
      expected: true,
      actual: input.request.runtimeMetadata?.processIsolationReady ?? false,
      reasonCode: "PROCESS_ISOLATION_VIOLATION",
    });
  }

  if (capability === "privileged" && !input.request.runtimeMetadata?.privilegedMonitoringReady) {
    violations.push({
      rule: "privileged.monitoring.required",
      expected: true,
      actual: input.request.runtimeMetadata?.privilegedMonitoringReady ?? false,
      reasonCode: "PRIVILEGE_ESCALATION_ATTEMPT",
    });
  }

  if (input.request.runtimeMetadata?.mutationAttempted) {
    violations.push({
      rule: "runtime.mutation-attempted",
      expected: false,
      actual: true,
      reasonCode: "TOOL_CAPABILITY_VIOLATION",
    });
  }

  return { valid: violations.length === 0, violations };
}
