import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), findMany: vi.fn(), audit: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruKnowledgeDevelopment: { create: mocks.create, findMany: mocks.findMany } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: mocks.audit } }));

import { NuruKnowledgeDevelopmentService } from "@/src/server/services/nuru-knowledge-development-service";

const input = { subjectId: "company:nvidia", type: "LEADERSHIP_CHANGE", eventTime: "2026-09-24T10:00:00.000Z", summary: "A new CEO was appointed.", claims: [{ text: "Jane Smith was appointed CEO." }], evidence: [{ referenceId: "claim-1", kind: "CLAIM_CANDIDATE", detail: "Board announcement." }], entities: ["Jane Smith"], sourceAuthority: "HIGH" as const, verificationState: "VERIFIED" as const, provenance: { normalizedDocumentIds: ["doc-1"] } };

describe("Nuru knowledge developments", () => {
  it("records an append-only evidence development and leaves canonical knowledge outside its write path", async () => {
    mocks.create.mockResolvedValue({ id: "NURU-DEV-1" });
    await expect(NuruKnowledgeDevelopmentService.record(input, { workspaceId: "ws-1", actor: "human:u-1", correlationId: "cor-1" })).resolves.toEqual({ id: "NURU-DEV-1" });
    expect(mocks.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ workspaceId: "ws-1", subjectId: "company:nvidia", verificationState: "VERIFIED" }) }));
    expect(mocks.audit).toHaveBeenCalledWith(expect.objectContaining({ operation: "KNOWLEDGE_DEVELOPMENT_RECORDED", decision: "EVIDENCE_RECORDED" }));
  });

  it("orders a subject's historical developments by event time", async () => {
    mocks.findMany.mockResolvedValue([]);
    await NuruKnowledgeDevelopmentService.timeline("ws-1", "company:nvidia");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { workspaceId: "ws-1", subjectId: "company:nvidia" }, orderBy: [{ eventTime: "asc" }, { createdAt: "asc" }] }));
  });
});
