import { evaluateUnifiedExecutionEnforcement, hashTrustBoundary } from "@/services/execution-enforcement";
import {
  buildGovernanceEvidenceBundle,
  buildGovernanceLineageRoot,
  buildGovernanceProvenanceEvent,
  hashGovernanceProvenanceEvents,
  resolveGovernanceAttribution,
  type GovernanceAttributionInput,
} from "@/services/governance-attribution";
import { hashStableContent } from "@/services/planning/versioning/stable-content-hasher";
import { getCanonicalRegistryDocument } from "@/services/registry/toolRegistry";
import { buildEnforcementFixture } from "@/tests/execution-enforcement/helpers";

export function buildGovernanceFixture() {
  const entry = getCanonicalRegistryDocument().tools.find((candidate) => candidate.toolId === "filesystem.write");
  if (!entry) {
    throw new Error("filesystem.write fixture missing");
  }

  const enforcement = evaluateUnifiedExecutionEnforcement(buildEnforcementFixture());
  if (!enforcement.envelope || !enforcement.authorityLock) {
    throw new Error("enforcement fixture did not produce runtime authority");
  }

  const replayContainmentHash = hashStableContent("REPLAY_CONTEXT", {
    toolId: entry.toolId,
    toolVersion: entry.version,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
    sandboxProfileHash: enforcement.envelope.sandboxProfileHash,
    trustBoundaryHash: hashTrustBoundary(enforcement.envelope.trustZone),
    environmentHash: enforcement.envelope.environmentHash,
  });

  const attributionInput: GovernanceAttributionInput = {
    executionId: "exec-1",
    entry,
    authorityEnvelope: enforcement.envelope,
    authorityLock: enforcement.authorityLock,
    replayContainmentHash,
    boundaryHash: enforcement.envelope.derivedBoundaryHash,
    enforcementDecision: enforcement.decision,
  };

  const attribution = resolveGovernanceAttribution(attributionInput);
  if (!attribution.governanceHash || !attribution.lineageNode) {
    throw new Error("governance attribution fixture did not resolve");
  }

  const provenanceEvents = [
    buildGovernanceProvenanceEvent({
      eventType: "governance.created",
      governanceHash: attribution.governanceHash,
      previousEventHash: null,
      payload: {
        toolId: entry.toolId,
        toolVersion: entry.version,
      },
    }),
    buildGovernanceProvenanceEvent({
      eventType: "governance.attributed",
      governanceHash: attribution.governanceHash,
      previousEventHash: null,
      payload: {
        executionId: "exec-1",
        trustZone: enforcement.envelope.trustZone,
      },
    }),
  ];
  const linkedEvents = [
    provenanceEvents[0],
    buildGovernanceProvenanceEvent({
      eventType: "governance.attributed",
      governanceHash: attribution.governanceHash,
      previousEventHash: provenanceEvents[0].eventHash,
      payload: {
        executionId: "exec-1",
        trustZone: enforcement.envelope.trustZone,
      },
    }),
  ];

  const lineageRoot = buildGovernanceLineageRoot({
    governanceHash: attribution.governanceHash,
    toolId: entry.toolId,
    toolVersion: entry.version,
  });

  const provenanceHash = hashGovernanceProvenanceEvents(linkedEvents);
  const evidenceBundle = buildGovernanceEvidenceBundle({
    executionId: "exec-1",
    toolId: entry.toolId,
    toolVersion: entry.version,
    registryHash: entry.registryHash,
    capabilityHash: entry.capabilityHash,
    sandboxProfileHash: enforcement.envelope.sandboxProfileHash,
    trustZoneHash: hashTrustBoundary(enforcement.envelope.trustZone),
    runtimeAuthorityLockHash: enforcement.authorityLock.lockHash,
    replayContainmentHash,
    governanceHash: attribution.governanceHash,
    lineageHash: lineageRoot.lineageHash,
    provenanceHash,
    boundaryHash: enforcement.envelope.derivedBoundaryHash,
  });

  return {
    entry,
    enforcement,
    attributionInput,
    attribution,
    lineageRoot,
    provenanceEvents: linkedEvents,
    evidenceBundle,
  };
}
