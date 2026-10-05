import { describe, expect, it, vi } from "vitest";
import { extractNuruDocument } from "@/src/nuru/document-extraction";

const mocks = vi.hoisted(() => ({ findUnique: vi.fn(), upsert: vi.fn(), audit: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruRawArtifact: { findUnique: mocks.findUnique }, nuruNormalizedDocument: { upsert: mocks.upsert } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));
import { NuruDocumentExtractionService } from "@/src/server/services/nuru-document-extraction-service";

describe("Nuru document extraction", () => {
  it("extracts Markdown headings into structured sections", () => {
    const result = extractNuruDocument("text/markdown", Buffer.from("# Artemis\n\nMission brief.\n\n## Launch\n\nTomorrow."), "brief.md");
    expect(result).toMatchObject({ status: "EXTRACTED", title: "Artemis", language: "en" });
    expect(result.sections).toEqual(expect.arrayContaining([expect.objectContaining({ heading: "Launch", content: "Tomorrow." })]));
    expect(result.contentHash).toMatch(/^sha256:/);
  });

  it("marks PDFs pending rather than guessing at their content", () => {
    expect(extractNuruDocument("application/pdf", Buffer.from("not a parser"), "paper.pdf")).toMatchObject({ status: "EXTRACTION_PENDING", content: null });
  });

  it("persists a normalized document without admitting knowledge", async () => {
    mocks.findUnique.mockResolvedValue({ id: "RAW-1", workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "text/plain", body: Buffer.from("Source material"), originalFilename: "source.txt" });
    const document = await NuruDocumentExtractionService.extract({ rawArtifactId: "RAW-1", workspaceId: "workspace-1" }, "human:1", "corr-1");
    expect(document.status).toBe("EXTRACTED");
    expect(mocks.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { rawArtifactId: "RAW-1" } }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "NSI_DOCUMENT_EXTRACTED" }));
  });

  it("returns the persisted document identity when re-extracting an artifact", async () => {
    mocks.findUnique.mockResolvedValue({ id: "RAW-2", workspaceId: "workspace-1", sourceRegistryId: "NSI-1", contentType: "text/plain", body: Buffer.from("Source material"), originalFilename: "source.txt" });
    mocks.upsert.mockResolvedValue({ id: "DOC-EXISTING", rawArtifactId: "RAW-2" });
    await expect(NuruDocumentExtractionService.extract({ rawArtifactId: "RAW-2", workspaceId: "workspace-1" }, "human:1", "corr-2")).resolves.toMatchObject({ id: "DOC-EXISTING", rawArtifactId: "RAW-2" });
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ outputReference: "DOC-EXISTING" }));
  });

  it("does not disclose artifacts across workspaces", async () => {
    mocks.findUnique.mockResolvedValue({ id: "RAW-3", workspaceId: "workspace-2" });
    await expect(NuruDocumentExtractionService.extract({ rawArtifactId: "RAW-3", workspaceId: "workspace-1" }, "human:1", "corr-3")).rejects.toMatchObject({ status: 404, code: "raw_artifact_not_found" });
  });
});
