import { createHash } from "node:crypto";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";

type RawArtifact = { id: string; body: Buffer; contentHash: string; byteLength: number };

/** Produces retained evidence that restored raw bytes still match their immutable hashes. */
export const NuruArtifactIntegrityService = {
  async verifyWorkspace(workspaceId: string) {
    const artifacts = await nuruKnowledgeRepository.nuruRawArtifact.findMany({
      where: { workspaceId },
      orderBy: { id: "asc" },
    }) as RawArtifact[];
    const auditEvents = await nuruKnowledgeRepository.nuruAuditEvent.findMany({
      where: { resourceId: { in: artifacts.map((artifact) => artifact.id) } },
      orderBy: { createdAt: "asc" },
    });
    const invalidArtifactIds = artifacts
      .filter((artifact) => artifact.byteLength !== artifact.body.byteLength || artifact.contentHash !== `sha256:${createHash("sha256").update(artifact.body).digest("hex")}`)
      .map((artifact) => artifact.id);
    const manifestHash = `sha256:${createHash("sha256").update(artifacts.map((artifact) => `${artifact.id}:${artifact.contentHash}:${artifact.byteLength}`).join("\n")).digest("hex")}`;
    if (invalidArtifactIds.length) {
      throw new AppError(409, "raw_artifact_integrity_failed", "One or more raw artifacts failed integrity verification.", { invalidArtifactIds, manifestHash });
    }
    return { workspaceId, verifiedAt: new Date().toISOString(), artifactCount: artifacts.length, auditEventCount: auditEvents.length, manifestHash, invalidArtifactIds };
  },
};
