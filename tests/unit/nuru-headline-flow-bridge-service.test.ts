import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findEvent: vi.fn(), recordDevelopment: vi.fn(), findReceipt: vi.fn(), createReceipt: vi.fn(), curate: vi.fn() }));
vi.mock("@/src/server/headline-flow/event-registry/prisma-event-registry-repository", () => ({ headlineFlowEventRegistryRepository: { findByIdForWorkspace: mocks.findEvent } }));
vi.mock("@/src/server/services/nuru-knowledge-development-service", () => ({ NuruKnowledgeDevelopmentService: { record: mocks.recordDevelopment } }));
vi.mock("@/src/server/services/nuru-agent-service", () => ({ createNuruCurationProposal: mocks.curate }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruHeadlineFlowCandidate: { findUnique: mocks.findReceipt, create: mocks.createReceipt } } }));

import { NuruHeadlineFlowBridgeService } from "@/src/server/services/nuru-headline-flow-bridge-service";

const context = { workspaceId: "ws-1", actor: "human:u-1:headline-flow-bridge", correlationId: "cor-1" };

describe("Headline Flow to Nuru bridge", () => {
  beforeEach(() => { Object.values(mocks).forEach((mock) => mock.mockReset()); });

  it("fails closed when the optional Headline Flow subsystem is absent", async () => {
    mocks.findEvent.mockResolvedValue(event); mocks.findReceipt.mockResolvedValue(null); mocks.recordDevelopment.mockResolvedValue({ id: "NURU-DEV-1" }); mocks.curate.mockResolvedValue({ proposal: { id: "proposal-1" } }); mocks.createReceipt.mockResolvedValue({ id: "receipt-1" });
    await expect(NuruHeadlineFlowBridgeService.createCandidate({ eventId: "hfe-1", subjectId: "company:a" }, context)).rejects.toMatchObject({ code: "headline_flow_unavailable" });
    expect(mocks.recordDevelopment).not.toHaveBeenCalled(); expect(mocks.curate).not.toHaveBeenCalled();
  });

  it("still validates bridge input before returning availability", async () => {
    await expect(NuruHeadlineFlowBridgeService.createCandidate({ eventId: "", subjectId: "company:a" }, context)).rejects.toBeTruthy();
  });
});
