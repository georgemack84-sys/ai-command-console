import { describe, expect, it, vi } from "vitest";
import { canonicalizeNuruAuditPayload, countStaleTandemRevisionRequests, NuruTandemKnowledgeIntakeService, sha256NuruAuditPayload } from "@/src/server/services/nuru-tandem-knowledge-intake-service";
import type { TandemKnowledgeCandidate } from "@/src/tandem/nuru-knowledge-contracts";

const candidate: TandemKnowledgeCandidate = { candidateId: "candidate-1", missionId: "mission-1", originatingSystem: "Headline Flow", subject: "NVIDIA", proposedClaims: [{ text: "NVIDIA announced a material export restriction change.", confidence: 0.8 }], entities: ["NVIDIA"], evidence: [{ referenceId: "source-1", detail: "Primary announcement" }], sources: [{ sourceType: "WEB_SOURCE", origin: "NVIDIA newsroom", uri: "https://example.com/nvidia", authority: "HIGH" }], eventTime: new Date("2026-09-20"), observedAt: new Date("2026-09-21"), significance: "HIGH", reasonForPreservation: "The change may materially affect future mission context.", provenance: { missionContextPackageIds: ["pkg-1"], correlationId: "corr-1" } };

describe("Nuru Tandem knowledge intake", () => {
  it("creates a review-required curation proposal and an immutable non-canonical receipt", async () => {
    const createCuration = vi.fn(async () => ({ proposal: { id: "proposal-1" } })); const createReceipt = vi.fn(async (input) => input);
    const service = new NuruTandemKnowledgeIntakeService({ findReceipt: vi.fn(async () => null), createCuration, createReceipt });
    const receipt = await service.intake(candidate, { workspaceId: "ws-1", actor: "tandem:user-1" });
    expect(receipt).toMatchObject({ candidateId: "candidate-1", curationProposalId: "proposal-1", status: "QUEUED_FOR_HUMAN_REVIEW", canonicalKnowledgeEffect: "NONE" });
    expect(createCuration).toHaveBeenCalledWith(expect.objectContaining({ project: "Tandem" }), "tandem:user-1");
  });

  it("returns the original receipt on a retry rather than creating another proposal", async () => {
    const createCuration = vi.fn(); const service = new NuruTandemKnowledgeIntakeService({ findReceipt: vi.fn(async () => ({ id: "receipt-1", workspaceId: "ws-1", candidateId: "candidate-1", missionId: "mission-1", curationProposalId: "proposal-1", receivedAt: new Date("2026-09-24T00:00:00.000Z") })), createCuration, createReceipt: vi.fn() });
    await expect(service.intake(candidate, { workspaceId: "ws-1", actor: "tandem:user-1" })).resolves.toMatchObject({ receiptId: "receipt-1", curationProposalId: "proposal-1" });
    expect(createCuration).not.toHaveBeenCalled();
  });

  it("accepts a distinct revised candidate only after a same-mission revision request", async () => {
    const revised = { ...candidate, candidateId: "candidate-2", revisionOfCandidateId: candidate.candidateId };
    const createCuration = vi.fn(async () => ({ proposal: { id: "proposal-2" } }));
    const service = new NuruTandemKnowledgeIntakeService({ findReceipt: vi.fn(async () => null), findRevisionParent: vi.fn(async () => ({ missionId: "mission-1", status: "REQUEST_CHANGES" })), createCuration, createReceipt: vi.fn(async (input) => input) });
    await expect(service.intake(revised, { workspaceId: "ws-1", actor: "tandem:user-1" })).resolves.toMatchObject({ candidateId: "candidate-2", revisionOfCandidateId: "candidate-1" });
    expect(createCuration).toHaveBeenCalledWith(expect.objectContaining({ content: expect.stringContaining("Revision of Tandem candidate: candidate-1") }), "tandem:user-1");
  });

  it("rejects a revision that is not linked to a recorded revision request", async () => {
    const revised = { ...candidate, candidateId: "candidate-2", revisionOfCandidateId: candidate.candidateId };
    const service = new NuruTandemKnowledgeIntakeService({ findReceipt: vi.fn(async () => null), findRevisionParent: vi.fn(async () => ({ missionId: "mission-1", status: "HOLD" })), createCuration: vi.fn(), createReceipt: vi.fn() });
    await expect(service.intake(revised, { workspaceId: "ws-1", actor: "tandem:user-1" })).rejects.toThrow("recorded revision request");
  });

  it("does not count a revision request as stale once a linked resubmission exists", () => {
    const stale = countStaleTandemRevisionRequests(["proposal-requested", "proposal-unanswered"], [
      { candidateId: "candidate-requested", curationProposalId: "proposal-requested", payload: candidate },
      { candidateId: "candidate-revision", curationProposalId: "proposal-revision", payload: { ...candidate, candidateId: "candidate-revision", revisionOfCandidateId: "candidate-requested" } },
      { candidateId: "candidate-unanswered", curationProposalId: "proposal-unanswered", payload: { ...candidate, candidateId: "candidate-unanswered" } },
    ]);
    expect(stale).toBe(1);
  });

  it("creates a stable SHA-256 digest regardless of JSON object key order", () => {
    const left = { auditEvents: [{ id: "event-1", decision: "APPROVE" }], lifecycle: { candidateId: "candidate-1", status: "APPROVED" } };
    const right = { lifecycle: { status: "APPROVED", candidateId: "candidate-1" }, auditEvents: [{ decision: "APPROVE", id: "event-1" }] };
    expect(canonicalizeNuruAuditPayload(left)).toBe(canonicalizeNuruAuditPayload(right));
    expect(sha256NuruAuditPayload(left)).toBe(sha256NuruAuditPayload(right));
    expect(sha256NuruAuditPayload(left)).toMatch(/^[a-f0-9]{64}$/);
  });

  it("canonicalizes date values as the ISO strings delivered in an audit export", () => {
    const reviewedAt = new Date("2026-09-29T04:59:16.865Z");
    expect(canonicalizeNuruAuditPayload({ proposal: { reviewedAt } })).toBe(canonicalizeNuruAuditPayload({ proposal: { reviewedAt: reviewedAt.toISOString() } }));
    expect(sha256NuruAuditPayload({ proposal: { reviewedAt } })).toBe(sha256NuruAuditPayload({ proposal: { reviewedAt: reviewedAt.toISOString() } }));
  });
});
