import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ findEvent: vi.fn(), recordDevelopment: vi.fn(), findReceipt: vi.fn(), createReceipt: vi.fn(), curate: vi.fn() }));
vi.mock("@/src/server/headline-flow/event-registry/prisma-event-registry-repository", () => ({ headlineFlowEventRegistryRepository: { findByIdForWorkspace: mocks.findEvent } }));
vi.mock("@/src/server/services/nuru-knowledge-development-service", () => ({ NuruKnowledgeDevelopmentService: { record: mocks.recordDevelopment } }));
vi.mock("@/src/server/services/nuru-agent-service", () => ({ createNuruCurationProposal: mocks.curate }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruHeadlineFlowCandidate: { findUnique: mocks.findReceipt, create: mocks.createReceipt } } }));

import { NuruHeadlineFlowBridgeService } from "@/src/server/services/nuru-headline-flow-bridge-service";

const context = { workspaceId: "ws-1", actor: "human:u-1:headline-flow-bridge", correlationId: "cor-1" };
const event = { id: "hfe-1", workspaceId: "ws-1", title: "Acquisition", summary: "Company A acquired Company B.", topic: "business", status: "resolved", importance: "important", confidence: "multi_source", firstDetectedAt: "2026-09-20T10:00:00.000Z", lastUpdatedAt: "2026-09-21T10:00:00.000Z", lastMeaningfulUpdateAt: "2026-09-21T10:00:00.000Z", version: 3, matchKey: "a:b", updateSummary: "Resolved", updateReasons: ["source_corroboration"], sourceCount: 2, articleCount: 2, evidence: [{ id: "e-1", sourceName: "Wire", headline: "Acquisition completed" }, { id: "e-2", sourceName: "Company", headline: "Company statement" }] };

describe("Headline Flow to Nuru bridge", () => {
  beforeEach(() => { Object.values(mocks).forEach((mock) => mock.mockReset()); });

  it("records a stable, corroborated significant event as a curation candidate only", async () => {
    mocks.findEvent.mockResolvedValue(event); mocks.findReceipt.mockResolvedValue(null); mocks.recordDevelopment.mockResolvedValue({ id: "NURU-DEV-1" }); mocks.curate.mockResolvedValue({ proposal: { id: "proposal-1" } }); mocks.createReceipt.mockResolvedValue({ id: "receipt-1" });
    await expect(NuruHeadlineFlowBridgeService.createCandidate({ eventId: "hfe-1", subjectId: "company:a" }, context)).resolves.toMatchObject({ status: "QUEUED_FOR_HUMAN_REVIEW", development: { id: "NURU-DEV-1" }, proposal: { id: "proposal-1" } });
    expect(mocks.recordDevelopment).toHaveBeenCalledWith(expect.objectContaining({ type: "HEADLINE_FLOW_STABILIZED_EVENT", verificationState: "CORROBORATING", provenance: { headlineFlowEventId: "hfe-1" } }), context);
  });

  it("returns the immutable receipt instead of queuing an event version twice", async () => {
    mocks.findEvent.mockResolvedValue(event); mocks.findReceipt.mockResolvedValue({ id: "receipt-1", developmentId: "NURU-DEV-1", curationProposalId: "proposal-1" });
    await expect(NuruHeadlineFlowBridgeService.createCandidate({ eventId: "hfe-1", subjectId: "company:a" }, context)).resolves.toMatchObject({ status: "ALREADY_QUEUED", proposal: { id: "proposal-1" } });
    expect(mocks.recordDevelopment).not.toHaveBeenCalled(); expect(mocks.curate).not.toHaveBeenCalled();
  });

  it("rejects live or low-significance events before they reach Nuru", async () => {
    mocks.findEvent.mockResolvedValue({ ...event, status: "developing" });
    await expect(NuruHeadlineFlowBridgeService.createCandidate({ eventId: "hfe-1", subjectId: "company:a" }, context)).rejects.toMatchObject({ code: "headline_flow_event_unstable" });
    expect(mocks.recordDevelopment).not.toHaveBeenCalled();
  });
});
