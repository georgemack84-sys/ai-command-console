import { z } from "zod";
import { extractNuruDocument } from "@/src/nuru/document-extraction";
import { AppError } from "@/src/server/api/errors";
import { nuruKnowledgeRepository } from "@/src/server/repositories/nuru-knowledge-repository";
import { NuruAuditService } from "@/src/server/services/nuru-audit-service";

const extractionInputSchema = z.object({ rawArtifactId: z.string().min(1), workspaceId: z.string().min(1) });
type RawArtifact = { id: string; workspaceId: string; sourceRegistryId: string; contentType: string; body: Buffer; originalFilename: string | null };
function documentId() { return `DOC-${crypto.randomUUID().replaceAll("-", "").slice(0, 16).toUpperCase()}`; }

/** Extraction writes a source-derived working document; it never admits canonical knowledge. */
export const NuruDocumentExtractionService = {
  async extract(rawInput: z.input<typeof extractionInputSchema>, actor: string, correlationId: string) {
    const input = extractionInputSchema.parse(rawInput);
    const artifact = await nuruKnowledgeRepository.nuruRawArtifact.findUnique({ where: { id: input.rawArtifactId } }) as RawArtifact | null;
    if (!artifact || artifact.workspaceId !== input.workspaceId) throw new AppError(404, "raw_artifact_not_found", "The raw source artifact was not found in this workspace.");
    const result = extractNuruDocument(artifact.contentType, Buffer.from(artifact.body), artifact.originalFilename);
    const id = documentId();
    const document = { id, workspaceId: input.workspaceId, rawArtifactId: artifact.id, sourceRegistryId: artifact.sourceRegistryId, status: result.status, title: result.title, content: result.content, sections: result.sections, language: result.language, extractionMethod: result.extractionMethod, contentHash: result.contentHash };
    const stored = await nuruKnowledgeRepository.nuruNormalizedDocument.upsert({ where: { rawArtifactId: artifact.id }, create: document, update: { status: document.status, title: document.title, content: document.content, sections: document.sections, language: document.language, extractionMethod: document.extractionMethod, contentHash: document.contentHash } }) as Record<string, unknown> | null;
    const persistedId = typeof stored?.id === "string" ? stored.id : id;
    await NuruAuditService.record({ operation: result.status === "EXTRACTED" ? "NSI_DOCUMENT_EXTRACTED" : "NSI_EXTRACTION_DEFERRED", actor, resourceId: artifact.id, inputReference: artifact.id, outputReference: persistedId, decision: result.status, reason: result.status === "EXTRACTED" ? "Created a source-derived normalized document without knowledge admission." : "The artifact is preserved; its content type awaits a dedicated parser.", correlationId });
    return stored ? { ...document, ...stored } : document;
  },

  async listForWorkspace(workspaceId: string) {
    const rows = await nuruKnowledgeRepository.nuruNormalizedDocument.findMany({ where: { workspaceId }, orderBy: { updatedAt: "desc" }, take: 50 }) as Array<Record<string, unknown>>;
    return rows.map((document) => ({
      ...document,
      createdAt: document.createdAt instanceof Date ? document.createdAt.toISOString() : document.createdAt,
      updatedAt: document.updatedAt instanceof Date ? document.updatedAt.toISOString() : document.updatedAt,
    }));
  },
};
