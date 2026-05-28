import { hashStableContent } from "./stable-content-hasher";
import type { MigrationProof, VersionedReplayArtifact, VersioningAuditEvent } from "./versioning-types";

export function buildMigrationAuditEvents(input: {
  artifact: VersionedReplayArtifact;
  migrationProof: MigrationProof;
}): readonly VersioningAuditEvent[] {
  const payloads: readonly Readonly<Record<string, unknown>>[] = [
    {
      version: input.artifact.version,
      contentHash: input.artifact.contentHash,
      schemaHash: input.artifact.schemaHash,
    },
    {
      migrationLineage: input.artifact.migrationLineage,
      replayLineageInvariant: input.artifact.replayLineageInvariant,
    },
    {
      proofHash: input.migrationProof.proofHash,
      governanceImpact: input.migrationProof.governanceImpact,
      replayCompatibilityResult: input.migrationProof.replayCompatibilityResult,
    },
  ];

  return payloads.map((payload, index) => {
    const payloadHash = hashStableContent("EVIDENCE_BUNDLE", payload);
    const event = {
      eventVersion: "4.2I",
      eventType: [
        "plan.versioning.registry.validated",
        "plan.versioning.migration.applied",
        "plan.versioning.proof.generated",
      ][index]!,
      planId: input.artifact.replayAuditResult.planId,
      payloadHash,
      payload,
    };
    return {
      ...event,
      eventHash: hashStableContent("EVIDENCE_BUNDLE", event),
    };
  });
}
