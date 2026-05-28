import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import type {
  GovernanceAttributionResult,
  GovernanceCausalityEdge,
  GovernanceEvidenceBundle,
  GovernanceHashInput,
  GovernanceLineageNode,
  GovernanceMetadata,
  GovernanceProvenanceEvent,
} from "./governanceTypes";

function stripUndefined(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(stripUndefined);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, nested]) => nested !== undefined)
        .map(([key, nested]) => [key, stripUndefined(nested)]),
    );
  }
  return value;
}

export function hashGovernanceMetadata(metadata: GovernanceMetadata) {
  return hashStableContent("GOVERNANCE", stripUndefined(metadata));
}

export function hashGovernanceLineageNode(node: Omit<GovernanceLineageNode, "lineageHash">) {
  return hashStableContent("MIGRATION_LINEAGE", stripUndefined(node));
}

export function hashGovernanceProvenanceEvents(events: readonly GovernanceProvenanceEvent[]) {
  return hashStableContent("GOVERNANCE", events.map((event) => event.eventHash).sort((left, right) => left.localeCompare(right)));
}

export function hashGovernanceCausalityEdges(edges: readonly GovernanceCausalityEdge[]) {
  return hashStableContent("GOVERNANCE", edges.map((edge) => edge.edgeHash).sort((left, right) => left.localeCompare(right)));
}

export function hashGovernanceAttribution(input: GovernanceHashInput) {
  return hashStableContent("GOVERNANCE", stripUndefined({
    metadata: input.metadata,
    toolId: input.toolId,
    toolVersion: input.toolVersion,
    registryHash: input.registryHash,
    capabilityHash: input.capabilityHash,
    sandboxProfileHash: input.sandboxProfileHash,
    trustZoneHash: input.trustZoneHash,
    replayContainmentHash: input.replayContainmentHash,
    runtimeAuthorityLockHash: input.runtimeAuthorityLockHash,
    boundaryHash: input.boundaryHash,
  }));
}

export function hashGovernanceEvidenceBundle(bundle: Omit<GovernanceEvidenceBundle, "evidenceHash"> | GovernanceEvidenceBundle) {
  return hashStableContent("EVIDENCE_BUNDLE", stripUndefined({
    executionId: bundle.executionId,
    toolId: bundle.toolId,
    toolVersion: bundle.toolVersion,
    registryHash: bundle.registryHash,
    capabilityHash: bundle.capabilityHash,
    sandboxProfileHash: bundle.sandboxProfileHash,
    trustZoneHash: bundle.trustZoneHash,
    runtimeAuthorityLockHash: bundle.runtimeAuthorityLockHash,
    replayContainmentHash: bundle.replayContainmentHash,
    governanceHash: bundle.governanceHash,
    lineageHash: bundle.lineageHash,
    provenanceHash: bundle.provenanceHash,
    boundaryHash: bundle.boundaryHash,
  }));
}

export function hashGovernanceAttributionResult(result: Pick<GovernanceAttributionResult, "governanceHash" | "trustZoneHash" | "lineageNode">) {
  return hashStableContent("GOVERNANCE", stripUndefined(result));
}
