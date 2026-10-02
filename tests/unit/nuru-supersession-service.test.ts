import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ create: vi.fn(), findUnique: vi.fn(), update: vi.fn(), activate: vi.fn() }));
vi.mock("@/src/server/repositories/nuru-knowledge-repository", () => ({ nuruKnowledgeRepository: { nuruSupersessionReview: { create: mocks.create, findUnique: mocks.findUnique, update: mocks.update } } }));
vi.mock("@/src/server/services/nuru-archive-service", () => ({ NuruArchiveService: { activateSupersession: mocks.activate } }));
vi.mock("@/src/server/services/nuru-audit-service", () => ({ NuruAuditService: { record: vi.fn() } }));

import { NuruSupersessionService } from "@/src/server/services/nuru-supersession-service";

describe("Nuru supersession workflow", () => {
  it("keeps coexistence and scope narrowing as explicit non-destructive review outcomes", async () => {
    mocks.findUnique.mockResolvedValue({ id: "review-1", currentItemId: "K-102", candidateItemId: "K-318", status: "PENDING" }); mocks.update.mockResolvedValue({ id: "review-1", status: "COEXISTING" });
    const result = await NuruSupersessionService.decide({ reviewId: "review-1", action: "COEXIST", decidedBy: "human.owner", reason: "Both apply to distinct deployment scopes.", correlationId: "supersession-1" });
    expect(result).toMatchObject({ action: "COEXIST", lineage: null }); expect(mocks.activate).not.toHaveBeenCalled();
  });

  it("uses archive lifecycle changes only after an explicit supersede decision", async () => {
    mocks.findUnique.mockResolvedValue({ id: "review-2", currentItemId: "K-102", candidateItemId: "K-318", status: "PENDING" }); mocks.update.mockResolvedValue({ id: "review-2", status: "SUPERSEDED" }); mocks.activate.mockResolvedValue({ currentStatus: "SUPERSEDED", successorStatus: "ARCHIVED" });
    await expect(NuruSupersessionService.decide({ reviewId: "review-2", action: "SUPERSEDE", decidedBy: "human.owner", reason: "The new approved architecture replaces the old boundary.", correlationId: "supersession-2" })).resolves.toMatchObject({ lineage: { currentStatus: "SUPERSEDED" } });
    expect(mocks.activate).toHaveBeenCalledWith("K-102", "K-318", "nuru.governance.v1");
  });
});
