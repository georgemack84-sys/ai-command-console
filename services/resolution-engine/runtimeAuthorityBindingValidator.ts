import { hashTrustBoundary } from "@/services/execution-enforcement";
import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { ReplayContainmentBinding } from "@/services/execution-enforcement";
import type { ResolutionFailure, RuntimeAuthoritySnapshot } from "./resolutionTypes";

function validateReplayBinding(binding: ReplayContainmentBinding, runtime: RuntimeAuthoritySnapshot): ResolutionFailure[] {
  const failures: ResolutionFailure[] = [];

  if (binding.toolId !== runtime.envelope.toolId || binding.toolVersion !== runtime.envelope.toolVersion) {
    failures.push({
      code: "TOOL_REPLAY_CONTAINMENT_INVALID",
      message: "replay containment identity does not match runtime authority envelope",
    });
  }

  if (binding.registryHash !== runtime.envelope.registryHash || binding.capabilityHash !== runtime.envelope.capabilityHash) {
    failures.push({
      code: "TOOL_RUNTIME_AUTHORITY_INVALID",
      message: "runtime authority hashes do not match replay containment binding",
    });
  }

  if (binding.sandboxProfileHash !== runtime.envelope.sandboxProfileHash) {
    failures.push({
      code: "TOOL_REPLAY_CONTAINMENT_INVALID",
      message: "sandbox profile hash does not match replay containment binding",
    });
  }

  if (binding.trustBoundaryHash !== runtime.envelope.derivedBoundaryHash) {
    failures.push({
      code: "TOOL_REPLAY_CONTAINMENT_INVALID",
      message: "derived boundary hash does not match replay containment binding",
    });
  }

  if (runtime.trustZoneHash !== hashTrustBoundary(runtime.envelope.trustZone)) {
    failures.push({
      code: "TOOL_RUNTIME_AUTHORITY_INVALID",
      message: "trust zone hash is inconsistent with runtime authority envelope",
    });
  }

  return failures;
}

export function validateRuntimeAuthorityBinding(
  entry: CanonicalToolRegistryEntry,
  runtime: RuntimeAuthoritySnapshot,
): readonly ResolutionFailure[] {
  const failures: ResolutionFailure[] = [];

  if (!runtime.envelope.capabilityHash || !runtime.envelope.sandboxProfileHash || !runtime.envelope.derivedBoundaryHash) {
    failures.push({
      code: "TOOL_RUNTIME_AUTHORITY_INVALID",
      message: "required runtime authority hashes are missing",
    });
    return failures;
  }

  if (!runtime.authorityLock.lockHash || !runtime.replayBinding.sandboxProfileHash || !runtime.trustZoneHash) {
    failures.push({
      code: "TOOL_REPLAY_CONTAINMENT_INVALID",
      message: "required replay containment hashes are missing",
    });
  }

  if (runtime.envelope.toolId !== entry.toolId || runtime.envelope.toolVersion !== entry.version) {
    failures.push({
      code: "TOOL_RUNTIME_AUTHORITY_INVALID",
      message: "runtime authority resolves to a different tool identity than the registry entry",
    });
  }

  if (runtime.envelope.registryHash !== entry.registryHash) {
    failures.push({
      code: "TOOL_REGISTRY_HASH_INVALID",
      message: "runtime authority registry hash does not match registry entry",
    });
  }

  if (runtime.envelope.capabilityHash !== entry.capabilityHash) {
    failures.push({
      code: "TOOL_CAPABILITY_AUTHORITY_INVALID",
      message: "runtime authority capability hash does not match registry entry",
    });
  }

  if (runtime.authorityLock.registryHash !== runtime.envelope.registryHash
    || runtime.authorityLock.capabilityHash !== runtime.envelope.capabilityHash) {
    failures.push({
      code: "TOOL_RUNTIME_AUTHORITY_INVALID",
      message: "runtime authority lock is inconsistent with the runtime authority envelope",
    });
  }

  failures.push(...validateReplayBinding(runtime.replayBinding, runtime));
  return failures;
}
