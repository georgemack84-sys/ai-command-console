import { describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({ findReceipts: vi.fn(), findDevelopments: vi.fn(), findClaims: vi.fn(), findCorrections: vi.fn(), findDecisions: vi.fn(), findEvent: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruHeadlineFlowCandidate: { findMany: mocks.findReceipts }, nuruKnowledgeDevelopment: { findMany: mocks.findDevelopments }, nuruTemporalClaim: { findMany: mocks.findClaims }, nuruKnowledgeCorrection: { findMany: mocks.findCorrections }, nuruKnowledgeCorrectionDecision: { findMany: mocks.findDecisions } } }));
vi.mock("@/src/server/headline-flow/event-registry/prisma-event-registry-repository", () => ({ headlineFlowEventRegistryRepository: { findByIdForWorkspace: mocks.findEvent } }));
import { NuruHeadlineFlowReviewService } from "@/src/server/services/nuru-headline-flow-review-service";
describe("Headline Flow review enrichment", () => {
  it("adds only read-only bridge provenance to its linked proposal", async () => {
    mocks.findReceipts.mockResolvedValue([{ workspaceId: "ws-1", eventId: "event-1", eventVersion: 2, subjectId: "company:a", developmentId: "dev-1", curationProposalId: "proposal-1" }]);
    mocks.findDevelopments.mockResolvedValue([{ id: "dev-1", summary: "Stabilized acquisition.", eventTime: new Date("2026-09-20"), verificationState: "CORROBORATING", sourceAuthority: "MODERATE", claims: [{ text: "Acquisition completed." }], evidence: [] }]);
    mocks.findClaims.mockResolvedValue([{ id: "claim-1", subjectId: "company:a", predicate: "owner", value: "Old owner", state: "DISPUTED", effectiveFrom: new Date("2025-01-01") }]); mocks.findCorrections.mockResolvedValue([]); mocks.findDecisions.mockResolvedValue([]);
    mocks.findEvent.mockResolvedValue({ id: "event-1", title: "Acquisition", summary: "Company A acquired B.", status: "resolved", importance: "important", confidence: "multi_source", version: 2, sourceCount: 2, lastMeaningfulUpdateAt: "2026-09-20T00:00:00.000Z", evidence: [] });
    const result = await NuruHeadlineFlowReviewService.enrich([{ id: "proposal-1" }, { id: "proposal-other" }]);
    expect(result[0]).toMatchObject({ headlineFlow: { event: { id: "event-1", sourceCount: 2 }, development: { id: "dev-1" }, temporalContext: { claims: [{ id: "claim-1", state: "DISPUTED" }] } } });
    expect(result[1]).not.toHaveProperty("headlineFlow");
  });
});
