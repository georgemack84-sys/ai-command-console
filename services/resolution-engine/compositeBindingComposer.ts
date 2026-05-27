import type { CanonicalToolRegistryEntry } from "@/schemas/toolRegistrySchema";
import type { ImmutableExecutionBinding, ResolutionContext } from "./resolutionTypes";
import { deriveBindingHash, deriveBindingId, deriveResolutionHash } from "./executionBindingHasher";

export function composeExecutionBinding(
  entry: CanonicalToolRegistryEntry,
  context: ResolutionContext,
): ImmutableExecutionBinding {
  const resolutionHash = deriveResolutionHash({
    request: context.request,
    toolId: entry.toolId,
    toolVersion: entry.version,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
  });

  const bindingBase = {
    toolId: entry.toolId,
    toolVersion: entry.version,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
    sandboxProfileHash: context.runtime.envelope.sandboxProfileHash,
    trustZoneHash: context.runtime.trustZoneHash,
    runtimeAuthorityLockHash: context.runtime.authorityLock.lockHash,
    replayContainmentHash: context.governance.evidenceBundle.replayContainmentHash,
    governanceHash: context.governance.attribution.governanceHash!,
    lineageHash: context.governance.lineageNode.lineageHash,
    provenanceHash: context.governance.provenanceHash,
    evidenceHash: context.governance.evidenceBundle.evidenceHash,
    resolutionHash,
  } as const;

  const bindingHash = deriveBindingHash(bindingBase);

  return {
    bindingId: deriveBindingId(bindingHash),
    ...bindingBase,
    bindingHash,
  };
}
