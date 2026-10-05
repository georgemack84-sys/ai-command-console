import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ createMany: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruProvenanceLink: { createMany: mocks.createMany, findMany: vi.fn() } } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));

import { NuruProvenanceService } from "@/src/server/services/nuru-provenance-service";

describe("Nuru provenance chain", () => {
  it("records an ordered source-to-knowledge lineage", async () => {
    const chain = await NuruProvenanceService.record("K-330", { stage: "SOURCE", referenceId: "S-1", actor: "human.owner", details: {} }, [
      { stage: "DISCOVERY", referenceId: "D-114", actor: "nuru.discovery.v1", details: {} },
      { stage: "CONTEXT", referenceId: "C-207", actor: "nuru.context.v1", details: {} },
      { stage: "CONNECTION", referenceId: "CN-88", actor: "nuru.connection.v1", details: {} },
      { stage: "QUALITY", referenceId: "Q-142", actor: "nuru.quality.v1", details: {} },
      { stage: "CURATION_PROPOSAL", referenceId: "CP-61", actor: "nuru.curator.v1", details: {} },
      { stage: "HUMAN_APPROVAL", referenceId: "HA-19", actor: "human.owner", details: {} },
    ], "lineage-corr");
    expect(chain.map((step) => step.stage)).toEqual(["SOURCE", "DISCOVERY", "CONTEXT", "CONNECTION", "QUALITY", "CURATION_PROPOSAL", "HUMAN_APPROVAL", "KNOWLEDGE_ITEM"]);
    expect(mocks.createMany).toHaveBeenCalledWith(expect.objectContaining({ data: expect.arrayContaining([expect.objectContaining({ knowledgeItemId: "K-330", sequence: 7, stage: "KNOWLEDGE_ITEM" })]) }));
  });
});
