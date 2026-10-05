import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import { z } from "zod";
import { assertSourceMayBeAcquired, type SourceRegistryRecord } from "@/src/nuru/source-intelligence";
import { manualIntakeSchema } from "@/src/nuru/manual-intake";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";
import { NuruSourceRegistryService } from "@/src/server/services/nuru-source-registry-service";
import { assertSafeSourceUrl } from "@/src/server/security/server-url-policy";
import { AppError } from "@/src/server/api/errors";

const maxArtifactBytes = 5 * 1024 * 1024;

function artifactId(contentHash: string) {
  return `RAW-${contentHash.slice("sha256:".length).toUpperCase()}`;
}

function rawBytes(input: z.infer<typeof manualIntakeSchema>) {
  const bytes = input.contentText === undefined ? Buffer.from(input.contentBase64!, "base64") : Buffer.from(input.contentText, "utf8");
  if (bytes.byteLength === 0 || bytes.byteLength > maxArtifactBytes) {
    throw new AppError(400, "invalid_artifact_size", `Manual source artifacts must be between 1 byte and ${maxArtifactBytes} bytes.`);
  }
  return bytes;
}

function assertOriginMatchesSource(originUrl: string | undefined, source: SourceRegistryRecord) {
  if (!originUrl) return;
  const parsed = assertSafeSourceUrl(originUrl);
  if (source.domain && parsed.hostname.toLowerCase() !== source.domain.toLowerCase()) {
    throw new AppError(400, "source_origin_mismatch", "The supplied origin URL does not belong to the registered source domain.");
  }
}

/** NSI-03 intake stores exact user-supplied bytes before extraction or normalization. */
export const NuruManualIngestionService = {
  async ingest(rawIntake: z.input<typeof manualIntakeSchema>, actor: string, correlationId: string) {
    const intake = manualIntakeSchema.parse(rawIntake);
    const source = await NuruSourceRegistryService.get(intake.sourceRegistryId);
    if (!source || source.workspaceId !== intake.workspaceId) {
      throw new AppError(404, "source_not_found", "The registered source was not found in this workspace.");
    }
    try {
      assertSourceMayBeAcquired(source, "MANUAL");
    } catch (error) {
      if (error instanceof Error && "code" in error) {
        throw new AppError(409, String(error.code).toLowerCase(), error.message);
      }
      throw error;
    }
    assertOriginMatchesSource(intake.originUrl, source);

    const body = rawBytes(intake);
    const contentHash = `sha256:${createHash("sha256").update(body).digest("hex")}`;
    const existing = await nuruKnowledgeRepository.nuruRawArtifact.findUnique({
      where: { workspaceId_sourceRegistryId_contentHash: { workspaceId: intake.workspaceId, sourceRegistryId: source.id, contentHash } },
    }) as Record<string, unknown> | null;
    if (existing) {
      return { ...existing, body: undefined };
    }

    const id = artifactId(contentHash);
    const artifact = {
      id,
      workspaceId: intake.workspaceId,
      sourceRegistryId: source.id,
      originUrl: intake.originUrl,
      contentType: intake.contentType,
      body,
      contentHash,
      byteLength: body.byteLength,
      originalFilename: intake.originalFilename,
      submittedBy: actor,
      retrievedAt: new Date(),
    };
    await nuruKnowledgeRepository.nuruRawArtifact.create({ data: artifact });
    await NuruAuditService.record({
      operation: "NSI_RAW_ARTIFACT_STORED",
      actor,
      resourceId: id,
      inputReference: intake.originUrl ?? intake.originalFilename ?? source.name,
      outputReference: contentHash,
      decision: "RAW_ARTIFACT_STORED",
      reason: "Stored immutable user-supplied source material before extraction or knowledge admission.",
      correlationId,
    });
    return { ...artifact, body: undefined };
  },

  async listForWorkspace(workspaceId: string) {
    const rows = await nuruKnowledgeRepository.nuruRawArtifact.findMany({
      where: { workspaceId },
      orderBy: { retrievedAt: "desc" },
      take: 50,
    }) as Array<Record<string, unknown>>;
    return rows.map((row) => {
      const { body, ...artifact } = row;
      void body;
      return {
        ...artifact,
        retrievedAt: artifact.retrievedAt instanceof Date ? artifact.retrievedAt.toISOString() : artifact.retrievedAt,
        createdAt: artifact.createdAt instanceof Date ? artifact.createdAt.toISOString() : artifact.createdAt,
      };
    });
  },
};
