import { hashTrustBoundary, evaluateUnifiedExecutionEnforcement } from "@/services/execution-enforcement";
import { hashGovernanceProvenanceEvents, resolveGovernanceAttribution, buildGovernanceEvidenceBundle, buildGovernanceLineageRoot, buildGovernanceProvenanceEvent } from "@/services/governance-attribution";
import type { ResolutionContext } from "@/services/resolution-engine";
import { buildEnforcementFixture } from "@/tests/execution-enforcement/helpers";
import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";

export function buildResolutionFixture(): ResolutionContext {
  const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
  if (!entry) {
    throw new Error("filesystem.write fixture missing");
  }

  const enforcement = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture());
  if (!enforcement.envelope || !enforcement.authorityLock) {
    throw new Error("runtime enforcement fixture missing");
  }

  const runtime = {
    envelope: enforcement.envelope,
    authorityLock: enforcement.authorityLock,
    replayBinding: {
      toolId: enforcement.envelope.toolId,
      toolVersion: enforcement.envelope.toolVersion,
      registryHash: enforcement.envelope.registryHash,
      capabilityHash: enforcement.envelope.capabilityHash,
      sandboxProfileHash: enforcement.envelope.sandboxProfileHash,
      trustBoundaryHash: enforcement.envelope.derivedBoundaryHash,
      environmentHash: enforcement.envelope.environmentHash,
    },
    trustZoneHash: hashTrustBoundary(enforcement.envelope.trustZone),
  } as const;

  const replayContainmentHash = hashStableContent("REPLAY_CONTEXT", runtime.replayBinding);
  const attribution = resolveGovernanceAttribution({
    executionId: "exec-1",
    entry,
    authorityEnvelope: runtime.envelope,
    authorityLock: runtime.authorityLock,
    replayContainmentHash,
    boundaryHash: runtime.envelope.derivedBoundaryHash,
    enforcementDecision: enforcement.decision,
  });
  if (!attribution.governanceHash) {
    throw new Error("governance attribution fixture missing");
  }

  const lineageNode = buildGovernanceLineageRoot({
    governanceHash: attribution.governanceHash,
    toolId: entry.toolId,
    toolVersion: entry.version,
  });
  const firstEvent = buildGovernanceProvenanceEvent({
    eventType: "governance.created",
    governanceHash: attribution.governanceHash,
    previousEventHash: null,
    payload: { toolId: entry.toolId, toolVersion: entry.version },
  });
  const secondEvent = buildGovernanceProvenanceEvent({
    eventType: "governance.attributed",
    governanceHash: attribution.governanceHash,
    previousEventHash: firstEvent.eventHash,
    payload: { executionId: "exec-1" },
  });
  const provenanceEvents = [firstEvent, secondEvent] as const;
  const provenanceHash = hashGovernanceProvenanceEvents(provenanceEvents);
  const evidenceBundle = buildGovernanceEvidenceBundle({
    executionId: "exec-1",
    toolId: entry.toolId,
    toolVersion: entry.version,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
    sandboxProfileHash: runtime.envelope.sandboxProfileHash,
    trustZoneHash: runtime.trustZoneHash,
    runtimeAuthorityLockHash: runtime.authorityLock.lockHash,
    replayContainmentHash,
    governanceHash: attribution.governanceHash,
    lineageHash: lineageNode.lineageHash,
    provenanceHash,
    boundaryHash: runtime.envelope.derivedBoundaryHash,
  });

  return {
    request: {
      requestedTool: entry.toolId,
      requestedVersion: entry.version,
      requiredCapabilities: ["write"],
      executionMode: entry.executionMode,
      trustZone: "sandboxed",
    },
    runtime,
    governance: {
      attribution,
      lineageNode,
      provenanceEvents,
      provenanceHash,
      evidenceBundle,
    },
  };
}
