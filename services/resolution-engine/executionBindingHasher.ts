import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type { ImmutableExecutionBinding, ResolutionContext } from "./resolutionTypes";

export function deriveResolutionHash(input: {
  request: ResolutionContext["request"];
  toolId: string;
  toolVersion: string;
  registryHash: string;
  capabilityHash: string;
}): string {
  return hashStableContent("REPLAY_BINDING", {
    requestedTool: input.request.requestedTool,
    requestedVersion: input.request.requestedVersion,
    requiredCapabilities: [...input.request.requiredCapabilities].sort((left, right) => left.localeCompare(right)),
    executionMode: input.request.executionMode,
    trustZone: input.request.trustZone,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
    registryHash: input.registryHash,
    capabilityHash: input.capabilityHash,
  });
}

export function deriveBindingHash(binding: Omit<ImmutableExecutionBinding, "bindingId" | "bindingHash"> & { resolutionHash: string }): string {
  return hashStableContent("REPLAY_BINDING", {
    toolId: binding.toolId,
    toolVersion: binding.toolVersion,
    registryHash: binding.registryHash,
    capabilityHash: binding.capabilityHash,
    sandboxProfileHash: binding.sandboxProfileHash,
    trustZoneHash: binding.trustZoneHash,
    runtimeAuthorityLockHash: binding.runtimeAuthorityLockHash,
    replayContainmentHash: binding.replayContainmentHash,
    governanceHash: binding.governanceHash,
    lineageHash: binding.lineageHash,
    provenanceHash: binding.provenanceHash,
    evidenceHash: binding.evidenceHash,
    resolutionHash: binding.resolutionHash,
  });
}

export function deriveBindingId(bindingHash: string): string {
  return `sha256:${bindingHash}`;
}
